# Backend

## Overview

El backend de Intragram sigue una arquitectura de microservicios HTTP sobre NestJS. Hay un `gateway` como punto de entrada público y cuatro servicios de dominio: autenticación, usuarios, publicaciones y chat. Cada dominio persiste sus propios datos en PostgreSQL y la plataforma se completa con Nginx, Prometheus y Grafana.

## Services

- `gateway`
  - Expone la API pública.
  - Valida JWT.
  - Reenvía peticiones a los servicios internos.
- `auth-service`
  - Gestiona login, tokens, refresh tokens y OAuth 42.
- `users-service`
  - Gestiona perfiles, amistades y presencia.
- `posts-service`
  - Gestiona publicaciones, likes, comentarios y favoritos.
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
- El gateway habla por HTTP con `auth-service`, `users-service`, `posts-service` y `chat-service`.
- Cada servicio usa su propia base de datos PostgreSQL.

## Shared Package

`backend/shared` contiene contratos y DTOs comunes:

- autenticación
- usuarios
- publicaciones/feed
- chat
- tipos y contratos exportados a varios paquetes

Esto reduce inconsistencias entre gateway, servicios y frontend.

## Security Model

- El acceso público pasa por el gateway.
- El `AuthGuard` del gateway exige header `Authorization: Bearer <token>`.
- El gateway valida el token pidiéndoselo al `auth-service`.
- El `chat-service` no valida JWT directamente; recibe identidad interna vía header `x-user-id` desde el gateway.
- El `users-service` queda protegido por el gateway para las rutas expuestas al frontend.

## Rate Limiting

El gateway aplica rate limit en endpoints publicos mediante un guard dedicado:

- `PublicRateLimitGuard`
- Decorador `@PublicRateLimit(limit, windowMs, key)`

Semantica:

- `limit`: maximo de peticiones permitidas por IP dentro de la ventana.
- `windowMs`: tamano de la ventana en milisegundos.
- `key`: nombre logico del bucket para separar limites entre rutas.

Ejemplo:

- `@PublicRateLimit(120, 60_000, 'chat:health')`
  - Permite 120 peticiones por IP en 60 segundos para `GET /chat/health`.
  - Si se excede, la API responde `429 Too Many Requests` hasta el reset de la ventana.

Tambien expone cabeceras de control de cuota:

- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

## Persistence

Se usan cuatro instancias separadas de PostgreSQL:

- `auth-db`
- `users-db`
- `posts-db`
- `chat-db`

Cada servicio usa TypeORM con `synchronize` activado fuera de producción.

## Observability

- La observabilidad completa está documentada en [METRICS-SERVICE](services/METRICS-SERVICE.md).
- Incluye Prometheus, Grafana, node-exporter, dashboards y validación operativa.

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
- `npm run dev:posts`
- `npm run dev:chat`

## What Is Implemented Today

- OAuth 42 y gestión de sesión.
- Validación de JWT en gateway.
- Sincronización de perfiles de usuario.
- Feed con varias vistas (reciente, amigos, trending, favoritos, perfil) ya reubicado en `posts-service`.
- Creación de publicaciones con soporte de bloques de código en `posts-service`.
- Likes persistidos en base de datos con contador en el post dentro de `posts-service`.
- Comentarios persistidos en base de datos con contador en el post.
- Favoritos.
- Lista de amigos con solicitudes pendientes, aceptar y rechazar.
- Chat persistido en PostgreSQL con soporte de snippets de código.
- Métricas y dashboards.

## Current Gaps

- Falta una suite de tests visible.
- El perfil editable todavía está poco desarrollado en frontend.
- La búsqueda global todavía está poco explotada desde la interfaz.
- No hay sistema de notificaciones (ni polling ni WebSocket).

## Related Documentation

- [AUTH-SERVICE](services/AUTH-SERVICE.md)
- [USERS-SERVICE](services/USERS-SERVICE.md)
- [POSTS-SERVICE](services/POSTS-SERVICE.md)
- [CHAT-SERVICE](services/CHAT-SERVICE.md)
- [GATEWAY-SERVICE](services/GATEWAY-SERVICE.md)
- [NGINX-SERVICE](services/NGINX-SERVICE.md)
- [METRICS-SERVICE](services/METRICS-SERVICE.md)
