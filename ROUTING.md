# ROUTING - Cómo conectar un microservicio con el API Gateway

## Arquitectura general

```
Cliente (Frontend)
      │
      ▼
    NGINX (reverse proxy, SSL)
      │
      ▼
  API GATEWAY (NestJS, puerto 3000)
      │
      ├──► Auth Service      (puerto 3003) ──► PostgreSQL
      ├──► Chat Service      (puerto 3004)
      ├──► Example Service   (puerto 3005)
      └──► Nuevo Servicio    (puerto 300X)
```

**El frontend NUNCA habla directamente con los microservicios.** Todas las peticiones pasan por el API Gateway, que se encarga de enrutar a cada servicio internamente via HTTP.

---

## Paso a paso: Conectar un nuevo microservicio

### 1. Crear el microservicio

Copiar la plantilla base:
```bash
cp -r backend/services/template backend/services/mi-servicio
```

Renombrar los archivos y clases (ver `backend/services/template/TEMPLATE.md` para instrucciones detalladas).

Asignar un **puerto único** al servicio (ej: `3006`). Los puertos actuales son:
| Servicio        | Puerto |
|-----------------|--------|
| Gateway         | 3000   |
| Grafana         | 3001   |
| Auth Service    | 3003   |
| Chat Service    | 3004   |
| Example Service | 3005   |

### 2. Registrar la URL en el Gateway

Editar `backend/gateway/src/config/microservices.config.ts`:

```typescript
export const SERVICE_URLS = {
    // ... servicios existentes ...
    miServicio: normalizeUrl(
        process.env.MI_SERVICIO_URL ||
        `http://${process.env.MI_SERVICIO_HOST || 'mi-servicio'}:${process.env.MI_SERVICIO_PORT || '3006'}`,
    ),
};
```

> **Nota:** El nombre del host (`mi-servicio`) debe coincidir con el nombre del container en `docker-compose.yml`.

### 3. Crear el módulo del servicio en el Gateway

Crear la siguiente estructura en `backend/gateway/src/services/mi-servicio/`:

```
mi-servicio/
├── mi-servicio.module.ts       # Módulo NestJS
├── mi-servicio.controller.ts   # Endpoints que expone el gateway
├── mi-servicio.service.ts      # Proxy HTTP al microservicio
├── dto/
│   └── create-mi-servicio.dto.ts   # Validación de datos de entrada
└── interfaces/
    └── mi-servicio.interface.ts     # Tipos de respuesta
```

#### 3a. Módulo (`mi-servicio.module.ts`)

```typescript
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MiServicioController } from './mi-servicio.controller';
import { MiServicioService } from './mi-servicio.service';

@Module({
    imports: [HttpModule],  // Necesario para hacer peticiones HTTP al microservicio
    controllers: [MiServicioController],
    providers: [MiServicioService],
    exports: [MiServicioService],
})
export class MiServicioModule {}
```

#### 3b. Servicio (`mi-servicio.service.ts`)

```typescript
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { SERVICE_URLS } from '../../config/microservices.config';

@Injectable()
export class MiServicioService {
    private readonly baseUrl = `${SERVICE_URLS.miServicio}/mi-servicio`;

    constructor(private readonly httpService: HttpService) {}

    async crear(data: any) {
        const response = await firstValueFrom(
            this.httpService.post(this.baseUrl, data, { timeout: 5000 }),
        );
        return response.data;
    }

    async obtenerTodos() {
        const response = await firstValueFrom(
            this.httpService.get(this.baseUrl, { timeout: 5000 }),
        );
        return response.data;
    }
}
```

#### 3c. Controlador (`mi-servicio.controller.ts`)

```typescript
import { Controller, Get, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { MiServicioService } from './mi-servicio.service';

@Controller('mi-servicio')  // Ruta: /mi-servicio
export class MiServicioController {
    constructor(private readonly miServicioService: MiServicioService) {}

    @Post()
    async crear(@Body() data: any) {
        try {
            return await this.miServicioService.crear(data);
        } catch (error: any) {
            throw new HttpException(
                error.message || 'Error interno',
                error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Get()
    async obtenerTodos() {
        try {
            return await this.miServicioService.obtenerTodos();
        } catch (error: any) {
            throw new HttpException(
                error.message || 'Error interno',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
```

### 4. Registrar el módulo en el Gateway

Editar `backend/gateway/src/app.module.ts`:

```typescript
import { MiServicioModule } from './services/mi-servicio/mi-servicio.module';

@Module({
    imports: [
        MetricsModule,
        ExampleModule,
        AuthModule,
        MiServicioModule,  // ← Añadir aquí
    ],
    controllers: [AppController],
})
export class AppModule {}
```

### 5. Añadir al docker-compose.yml

```yaml
services:
  mi-servicio:
    container_name: mi-servicio
    build:
      context: ./backend/services/mi-servicio
      dockerfile: Dockerfile.dev
    environment:
      SERVICE_URL: ${MI_SERVICIO_URL:-http://mi-servicio:3006}
    volumes:
      - ./backend/services/mi-servicio/src:/app/src
      - /app/node_modules
    networks:
      - service-net
    healthcheck:
      test: ["CMD", "curl", "-f", "http://mi-servicio:3006/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    restart: unless-stopped
```

Añadir también la variable de entorno en el servicio `gateway`:
```yaml
  gateway:
    environment:
      MI_SERVICIO_URL: ${MI_SERVICIO_URL:-http://mi-servicio:3006}
    depends_on:
      - mi-servicio  # ← Añadir dependencia
```

---

## Cómo debe responder un microservicio

### Formato de respuestas

Todos los microservicios deben seguir estas convenciones:

#### Respuesta exitosa
```json
{
    "id": "uuid-del-recurso",
    "campo1": "valor1",
    "campo2": "valor2",
    "created_at": "2026-03-03T12:00:00.000Z"
}
```

#### Respuesta de error
```json
{
    "statusCode": 400,
    "message": "Descripción del error"
}
```

### Endpoints obligatorios

Todo microservicio **DEBE** implementar:

| Endpoint     | Descripción                              |
|-------------|------------------------------------------|
| `GET /health` | Health check (devuelve `{ "status": "ok" }`) |
| `GET /metrics` | Métricas Prometheus (automático con `@willsoto/nestjs-prometheus`) |

### Comunicación

```
Frontend → NGINX (443) → Gateway (3000) → Microservicio (300X)
```

1. El **frontend** envía peticiones a `https://localhost:8443/api/mi-servicio`
2. **NGINX** hace proxy a `http://gateway:3000/mi-servicio`
3. El **Gateway** valida la petición (DTOs, auth si aplica) y reenvía a `http://mi-servicio:300X/mi-servicio`
4. El **microservicio** procesa y devuelve la respuesta JSON
5. La respuesta sube de vuelta por la misma cadena

### Redes Docker

- **`backend-net`**: Conecta NGINX ↔ Gateway ↔ Grafana
- **`service-net`**: Conecta Gateway ↔ Microservicios ↔ Bases de datos ↔ Prometheus

Los microservicios solo deben estar en `service-net`. NO deben exponerse a `backend-net` ni tener puertos públicos.

---

## Ejemplo completo: Auth Service

El servicio de autenticación es un ejemplo real de cómo se conecta todo:

1. **Microservicio**: `backend/services/auth/` (puerto 3003, PostgreSQL)
2. **Gateway proxy**: `backend/gateway/src/services/auth/`
3. **Config**: `AUTH_SERVICE_URL` en `microservices.config.ts`
4. **Docker**: `auth-service` + `auth-db` (PostgreSQL) en `docker-compose.yml`

### Flujo de una petición de login:
```
POST https://localhost:8443/api/auth/login
  → NGINX proxy → http://gateway:3000/auth/login
    → Gateway AuthController → AuthService.login()
      → HTTP POST http://auth-service:3003/auth/login
        → Auth Microservice AuthController → AuthService.login()
          → PostgreSQL query (validar credenciales)
        ← { access_token, refresh_token, user }
      ← response.data
    ← JSON response
  ← JSON response
← JSON a frontend
```
