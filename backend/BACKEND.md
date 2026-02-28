# 🚀 Backend - Intragram

Backend de la red social Intragram para 42 Málaga, construido con arquitectura de microservicios usando NestJS.

## 📋 Tabla de Contenidos

- [Arquitectura](#-arquitectura)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Tecnologías](#-tecnologías)
- [Instalación](#-instalación)
- [Desarrollo](#-desarrollo)
- [Microservicios](#-microservicios)
- [API Gateway](#-api-gateway)

## 🏗️ Arquitectura

El backend utiliza una arquitectura de microservicios con las siguientes capas:

```
┌─────────────┐
│   Cliente   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    Nginx    │ ← Reverse Proxy & Load Balancer
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  API Gateway│ ← Punto de entrada único
└──────┬──────┘
       │
       ├──────────┬──────────┬──────────┐
       ▼          ▼          ▼          ▼
   ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐
   │ Auth │  │ Chat │  │Posts │  │ ... │
   └───┬──┘  └───┬──┘  └───┬──┘  └──────┘
```

## 📁 Estructura del Proyecto

```
backend/
├── gateway/                    # API Gateway
│   ├── src/
│   │   ├── main.ts            # Punto de entrada del gateway
│   │   ├── app.module.ts      # Módulo raíz
│   │   ├── app.controller.ts  # Controlador principal
│   │   ├── app.service.ts     # Servicio principal
│   │   ├── common/            # Utilidades compartidas
│   │   │   └── interceptors/
│   │   │       └── metrics.interceptor.ts
│   │   ├── observability/     # Logging y métricas
│   │   │   ├── logger/
│   │   │   │   ├── logger.module.ts
│   │   │   │   └── logger.service.ts
│   │   │   └── metrics/
│   │   │       ├── metrics.module.ts
│   │   │       └── metrics.service.ts
│   │   └── services/          # Clientes de microservicios
│   │       ├── auth/
│   │       │   ├── auth.controller.ts
│   │       │   ├── auth.module.ts
│   │       │   ├── auth.service.ts
│   │       │   ├── dto/
│   │       │   │   ├── login.dto.ts
│   │       │   │   ├── register.dto.ts
│   │       │   │   └── auth-response.dto.ts
│   │       │   └── interfaces/
│   │       │       └── auth-service.interface.ts
│   │       ├── chat/
│   │       │   ├── chat.controller.ts
│   │       │   ├── chat.module.ts
│   │       │   ├── chat.service.ts
│   │       │   ├── dto/
│   │       │   │   └── send-message.dto.ts
│   │       │   └── interfaces/
│   │       │       └── chat-service.interface.ts
│   │       └── example/       # Plantilla para nuevos servicios
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   ├── package.json
│   └── tsconfig.json
│
├── services/                   # Microservicios
│   ├── auth/                  # Servicio de autenticación
│   │   ├── src/
│   │   │   ├── main.ts        # Punto de entrada
│   │   │   └── db/
│   │   │       └── auth-db.sh # Script de inicialización BD
│   │   ├── Dockerfile
│   │   ├── Dockerfile.dev
│   │   ├── package.json
│   │   └── AUTH.md
│   │
│   ├── chat/                  # Servicio de mensajería
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   └── db/
│   │   │       └── chat-db.sh
│   │   ├── Dockerfile
│   │   ├── Dockerfile.dev
│   │   ├── package.json
│   │   └── CHAT.md
│   │
│   └── example/               # Plantilla para nuevos microservicios
│       ├── src/
│       │   ├── main.ts
│       │   └── db/
│       │       └── example-db.sh
│       ├── Dockerfile
│       ├── Dockerfile.dev
│       ├── package.json
│       └── EXAMPLE.md
│
└── nginx/                     # Reverse proxy
    ├── Dockerfile
    └── config/
        └── nginx.conf
```

## 🛠️ Tecnologías

- **Framework**: [NestJS](https://nestjs.com/) - Framework progresivo de Node.js
- **Lenguaje**: [TypeScript](https://www.typescriptlang.org/)
- **Base de Datos**: PostgreSQL / MySQL
- **Comunicación**: gRPC / TCP (entre microservicios)
- **API REST**: HTTP/JSON (cliente ↔ gateway)
- **Contenedores**: Docker & Docker Compose
- **Reverse Proxy**: Nginx
- **Observabilidad**: 
  - Logging personalizado
  - Métricas (compatible con Prometheus)
- **Validación**: class-validator, class-transformer

## 📦 Instalación

### Prerrequisitos

```bash
node >= 18.x
npm >= 9.x
docker >= 20.x
docker-compose >= 2.x
```

### Instalación de dependencias

```bash
# Instalar dependencias del Gateway
cd gateway
npm install

# Instalar dependencias del servicio Auth
cd ../services/auth
npm install

# Instalar dependencias del servicio Chat
cd ../chat
npm install
```

## 🚀 Desarrollo

### Usando Docker Compose (Recomendado)

```bash
# Desde la raíz del proyecto
docker-compose up -d

# Ver logs
docker-compose logs -f

# Reconstruir servicios
docker-compose up -d --build
```

### Desarrollo local

```bash
# Terminal 1 - API Gateway
cd gateway
npm run start:dev

# Terminal 2 - Servicio Auth
cd services/auth
npm run start:dev

# Terminal 3 - Servicio Chat
cd services/chat
npm run start:dev
```

### Scripts disponibles

```bash
npm run start          # Producción
npm run start:dev      # Desarrollo con hot-reload
npm run start:debug    # Desarrollo con debugger
npm run build          # Compilar TypeScript
npm run test           # Tests unitarios
npm run test:e2e       # Tests end-to-end
npm run lint           # Linter
```

## 🔧 Microservicios

### 🔐 Auth Service

**Responsabilidades:**
- Registro de nuevos usuarios
- Autenticación y generación de JWT
- Validación de tokens
- Gestión de sesiones
- Refresh tokens

**Endpoints (a través del Gateway):**
```
POST   /auth/register    - Crear nuevo usuario
POST   /auth/login       - Iniciar sesión
POST   /auth/logout      - Cerrar sesión
POST   /auth/refresh     - Renovar token
GET    /auth/me          - Obtener usuario actual
```

**Base de Datos:**
- `users` - Información de usuarios
- `sessions` - Sesiones activas
- `refresh_tokens` - Tokens de refresco

📄 Documentación completa: [AUTH.md](./services/auth/AUTH.md)

### 💬 Chat Service

**Responsabilidades:**
- Envío y recepción de mensajes
- Gestión de conversaciones
- Notificaciones en tiempo real
- Historial de mensajes
- Estado de lectura

**Endpoints (a través del Gateway):**
```
POST   /chat/send                    - Enviar mensaje
GET    /chat/conversations           - Listar conversaciones
GET    /chat/messages/:conversationId - Obtener mensajes
PUT    /chat/messages/:id/read       - Marcar como leído
```

**Base de Datos:**
- `conversations` - Conversaciones entre usuarios
- `messages` - Mensajes enviados
- `participants` - Participantes de conversaciones

📄 Documentación completa: [CHAT.md](./services/chat/CHAT.md)

### 📋 Example Service (Plantilla)

Servicio de ejemplo que sirve como plantilla para crear nuevos microservicios. Incluye:
- Estructura básica de NestJS
- Configuración de conexión con el Gateway
- Patrón de comunicación gRPC/TCP
- Script de inicialización de base de datos
- Dockerfile para desarrollo y producción

📄 Documentación completa: [EXAMPLE.md](./services/example/EXAMPLE.md)

## 🌐 API Gateway

El API Gateway es el punto de entrada único para todas las peticiones del cliente.

### Funcionalidades

- **Enrutamiento**: Dirige las peticiones al microservicio correspondiente
- **Autenticación**: Valida tokens JWT en cada request
- **Rate Limiting**: Protección contra abuso
- **Logging**: Registro centralizado de peticiones
- **Métricas**: Recolección de métricas de rendimiento
- **CORS**: Configuración de políticas CORS
- **Transformación**: Serialización y validación de datos

### Configuración

Puerto por defecto: `3000`

Variables de entorno:
```env
PORT=3000
AUTH_SERVICE_HOST=localhost
AUTH_SERVICE_PORT=3001
CHAT_SERVICE_HOST=localhost
CHAT_SERVICE_PORT=3002
JWT_SECRET=your-secret-key
```

📄 Documentación completa: [GATEWAY.md](./gateway/GATEWAY.md)

## 💾 Base de Datos

Cada microservicio tiene su propia base de datos (Database per Service pattern).

### Inicialización

Los scripts de inicialización se encuentran en `services/{service}/src/db/`:

```bash
# Ejecutar script de inicialización de Auth
bash services/auth/src/db/auth-db.sh

# Ejecutar script de inicialización de Chat
bash services/chat/src/db/chat-db.sh
```

### Migraciones

```bash
# Generar migración
npm run migration:generate -- -n NombreMigracion

# Ejecutar migraciones
npm run migration:run

# Revertir última migración
npm run migration:revert
```

## 🔍 Observabilidad

### Logging

Sistema de logging centralizado disponible en todos los servicios:

```typescript
constructor(private logger: LoggerService) {}

this.logger.log('Mensaje informativo');
this.logger.error('Error detectado', trace);
this.logger.warn('Advertencia');
this.logger.debug('Información de debug');
```

### Métricas

Métricas disponibles en `/metrics` (formato Prometheus):
- Tiempo de respuesta por endpoint
- Número de peticiones
- Errores y códigos de estado
- Uso de recursos

## 🧪 Testing

```bash
# Tests unitarios
npm run test

# Tests con cobertura
npm run test:cov

# Tests E2E
npm run test:e2e

# Tests en modo watch
npm run test:watch
```

## 📝 Guía para Crear Nuevos Microservicios

1. Copiar la plantilla `services/example`
2. Renombrar el directorio con el nombre del servicio
3. Actualizar `package.json` con el nuevo nombre
4. Implementar la lógica en `src/main.ts`
5. Crear el script de BD en `src/db/`
6. Añadir el servicio al `docker-compose.yml`
7. Crear el módulo, controlador y servicio en el Gateway
8. Documentar en el archivo `.md` del servicio

## 🤝 Contribución

1. Crear una rama para la feature: `git checkout -b feature/nueva-funcionalidad`
2. Hacer commits descriptivos: `git commit -m 'Add: nueva funcionalidad'`
3. Push a la rama: `git push origin feature/nueva-funcionalidad`
4. Crear Pull Request

## 📄 Licencia

Este proyecto es parte del curriculum de 42 Málaga.

---

**Desarrollado con ❤️ para 42 Málaga**
