# Backend

## Overview

El backend de Intragram sigue una arquitectura de microservicios HTTP sobre NestJS. Hay un `gateway` como punto de entrada público y tres servicios de dominio: autenticación, usuarios y chat. Cada dominio persiste sus propios datos en PostgreSQL y la plataforma se completa con Nginx, Prometheus y Grafana.

## Services

- `gateway`
  - Expone la API pública.
  - Valida JWT.
  - Reenvía peticiones a los servicios internos.
- `auth-service`
  - Gestiona login, tokens, refresh tokens y OAuth 42.
- `users-service`
  - Gestiona perfiles, posts, amistades y favoritos.
- `chat-service`
  - Gestiona conversaciones y mensajes.
- `nginx`
  - Reverse proxy HTTPS y punto único de entrada.
- `prometheus` y `grafana`
  - Observabilidad.

## Internal Topology

- Nginx recibe el tráfico HTTPS.
- `/` se reenvía al frontend.
- `/api/` se reenvía al gateway.
- El gateway habla por HTTP con `auth-service`, `users-service` y `chat-service`.
- Cada servicio usa su propia base de datos PostgreSQL.

## Shared Package

`backend/shared` contiene contratos y DTOs comunes:

- autenticación
- usuarios
- chat
- tipos y contratos exportados a varios paquetes

Esto reduce inconsistencias entre gateway, servicios y frontend.

## Security Model

- El acceso público pasa por el gateway.
- El `AuthGuard` del gateway exige header `Authorization: Bearer <token>`.
- El gateway valida el token pidiéndoselo al `auth-service`.
- El `chat-service` no valida JWT directamente; recibe identidad interna vía header `x-user-id` desde el gateway.
- El `users-service` queda protegido por el gateway para las rutas expuestas al frontend.

## Persistence

Se usan tres instancias separadas de PostgreSQL:

- `auth-db`
- `users-db`
- `chat-db`

Cada servicio usa TypeORM con `synchronize` activado fuera de producción.

## Observability

- El gateway expone `/metrics` y `/health`.
- Los servicios Nest registran Prometheus mediante `@willsoto/nestjs-prometheus`.
- Prometheus scrapea:
  - `gateway:3000`
  - `auth-service:3003`
  - `users-service:3006`
  - `chat-service:3009`
- Grafana carga dashboards desde archivos provisionados.

## Configuration

Variables importantes:

- puertos y URLs internas de servicios,
- credenciales de las bases de datos,
- `JWT_SECRET`,
- credenciales OAuth 42,
- `CORS_ORIGIN`,
- configuración de Grafana y Nginx.

## Run Model

El backend está pensado para ejecutarse junto al resto del stack con `docker-compose.yml` de la raíz. También existe un workspace `backend/` con scripts por servicio para desarrollo.

Scripts destacados en `backend/package.json`:

- `npm run dev:gateway`
- `npm run dev:auth`
- `npm run dev:users`
- `npm run dev:chat`

## What Is Implemented Today

- OAuth 42 y gestión de sesión.
- Validación de JWT en gateway.
- Sincronización de perfiles de usuario.
- Feed con varias vistas.
- Creación de publicaciones.
- Favoritos.
- Lista de amigos.
- Chat persistido en PostgreSQL.
- Métricas y dashboards.

## Current Gaps

- Falta una suite de tests visible.
- No hay likes/comentarios persistidos en backend.
- El perfil editable todavía está poco desarrollado en frontend.
- La búsqueda global todavía está poco explotada desde la interfaz.

## Related Documentation

- [AUTH-SERVICE](services/AUTH-SERVICE.md)
- [USERS-SERVICE](services/USERS-SERVICE.md)
- [CHAT-SERVICE](services/CHAT-SERVICE.md)
- [GATEWAY-SERVICE](services/GATEWAY-SERVICE.md)
- [NGINX-SERVICE](services/NGINX-SERVICE.md)
- [METRICS-SERVICE](services/METRICS-SERVICE.md)
