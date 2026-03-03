# Plantilla de Microservicio

## Descripción
Esta carpeta contiene la estructura base para crear cualquier nuevo microservicio en el proyecto.

## Cómo crear un nuevo microservicio

### 1. Copiar la plantilla
```bash
cp -r backend/services/template backend/services/mi-servicio
```

### 2. Renombrar archivos
Renombrar todos los archivos que contengan "template" por el nombre del servicio:
- `template.module.ts` → `mi-servicio.module.ts`
- `template.controller.ts` → `mi-servicio.controller.ts`
- `template.service.ts` → `mi-servicio.service.ts`
- `dto/create-template.dto.ts` → `dto/create-mi-servicio.dto.ts`
- `interfaces/template-service.interface.ts` → `interfaces/mi-servicio.interface.ts`

### 3. Buscar y reemplazar
En todos los archivos, reemplazar:
- `Template` → `MiServicio` (PascalCase)
- `template` → `mi-servicio` (kebab-case)
- `300X` → el puerto asignado (ej: `3006`)

### 4. Configurar el gateway
Ver el archivo **ROUTING.md** en la raíz del proyecto para instrucciones detalladas.

### 5. Configurar docker-compose
Añadir el servicio al `docker-compose.yml` (ver ROUTING.md)

## Estructura de archivos
```
mi-servicio/
├── Dockerfile          # Build de producción
├── Dockerfile.dev      # Build de desarrollo (hot reload)
├── package.json        # Dependencias del servicio
├── tsconfig.json       # Configuración TypeScript
└── src/
    ├── main.ts                          # Punto de entrada
    ├── mi-servicio.module.ts            # Módulo NestJS principal
    ├── mi-servicio.controller.ts        # Endpoints HTTP
    ├── mi-servicio.service.ts           # Lógica de negocio
    ├── dto/
    │   └── create-mi-servicio.dto.ts    # Validación de entrada
    └── interfaces/
        └── mi-servicio.interface.ts     # Tipos/contratos
```

## Convenciones
- Cada servicio escucha en un puerto único (3003, 3004, 3005...)
- Todos los servicios deben exponer `GET /health`
- Todos los servicios deben incluir Prometheus metrics (`GET /metrics`)
- La comunicación con el Gateway es HTTP
- Los DTOs usan class-validator para validación
