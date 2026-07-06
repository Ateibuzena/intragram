# Gateway Service

## Purpose

El `gateway` es la puerta de entrada pública del backend. Expone una API HTTP única al frontend, centraliza validación, CORS, métricas y reenvío hacia los servicios internos.

## Main Responsibilities

- Exponer `/health` y `/metrics`.
- Validar `Bearer tokens`.
- Reenviar autenticación a `auth-service`.
- Reenviar perfiles a `users-service`.
- Reenviar feed/publicaciones a `posts-service`.
- Reenviar chat a `chat-service`.
- Mantener una conexión WebSocket (Socket.IO) con cada cliente autenticado y empujar eventos en tiempo real (ver [Real-Time](#real-time-websocket) más abajo).
- Mantener al frontend desacoplado de la topología interna.

## Public Endpoints By Domain

### Global

- `GET /health`
- `GET /metrics`

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/42`
- `GET /auth/42/callback`

### Users — Profiles

- `POST /users/oauth/42/upsert`
- `GET /users/login/:login`
- `GET /users/search`
- `PATCH /users/:id/profile`
- `PATCH /users/:id/refresh-profile`
- `GET /users/:id`

### Posts — Feed

- `GET /posts/feed`
- `GET /posts/feed/me`
- `GET /posts/feed/friends`
- `GET /posts/feed/trending`
- `GET /posts/feed/favorites`
- `POST /posts/feed`
- `POST /posts/feed/favorites/:postId`
- `POST /posts/feed/like/:postId`
- `GET /posts/feed/post/:postId`
- `GET /posts/feed/post/:postId/image`
- `GET /posts/feed/post/:postId/comments`
- `POST /posts/feed/post/:postId/comments`
- `DELETE /posts/feed/post/:postId/comments/:commentId`
- `DELETE /posts/feed/post/:postId`

Estas rutas son el contrato vigente del gateway para feed y comentarios.

### Users — Friends

- `GET /users/friends/me`
- `POST /users/friends/me`
- `DELETE /users/friends/me/:friendId`
- `GET /users/friends/pending`
- `PATCH /users/friends/me/:requesterId/accept`
- `GET /users/friends/status/:targetId`
- `GET /users/friends/suggestions`

### Users — Notifications

- `GET /users/notifications`
- `POST /users/notifications/read`

### Chat

- `GET /chat/health`
- `GET /chat/conversations`
- `POST /chat/conversations`
- `GET /chat/conversations/:conversationId/messages`
- `POST /chat/conversations/:conversationId/messages`

## Real-Time (WebSocket)

El gateway expone un único `PresenceGateway` (Socket.IO) en el mismo puerto/path que la API HTTP (`/api/socket.io` a través de nginx). El cliente se autentica pasando el JWT en el handshake (`socket.handshake.auth.token`), validado contra `auth-service`.

Cada socket se une a una sala `user:{userId}`; `RealtimeService.emitToUser`/`emitToAll` son la única puerta de entrada que usan los controladores HTTP para empujar eventos — así el mecanismo de transporte (in-process hoy, Redis entre réplicas) queda desacoplado de quien dispara el evento.

Eventos servidor → cliente (contratos tipados en `backend/shared/realtime`):

- `online:users`, `user:status` — snapshot y cambios de presencia.
- `chat:typing`, `chat:new-message` — indicador de escritura y mensajes de chat en vivo (con reconciliación por poll de baja frecuencia como red de seguridad).
- `feed:new-post` — nueva publicación disponible en el feed.
- `post:like`, `post:comment-added`, `post:comment-removed`, `post:deleted` — contadores y cambios de un post en vivo para cualquiera que lo esté viendo.
- `notification:new` — nueva notificación (like, comentario, post de un amigo, solicitud de amistad).
- `friend:request`, `friend:accepted`, `friend:removed`, `friend:rejected` — cambios de relación de amistad.

### Escalabilidad horizontal

- El adapter de Redis (`@socket.io/redis-adapter`) hace que `emitToUser`/`emitToAll` lleguen a un cliente sin importar a qué réplica del gateway esté conectado su socket.
- La presencia (quién está online) se mantiene en Redis con conteo de conexiones por usuario, no en memoria del proceso, para que sea correcta con más de una réplica.
- Nginx usa `ip_hash` en el upstream del gateway para que el handshake de Socket.IO (que empieza por HTTP polling) quede pegado a la misma réplica durante toda la sesión.

## Authentication

El guard principal es `AuthGuard`:

- exige header `Authorization`,
- comprueba formato `Bearer`,
- llama a `auth-service` para validar el token,
- adjunta el payload al `request`.

Para el chat, el gateway traduce la identidad autenticada a un `x-user-id` interno antes de hablar con `chat-service`.

## Public Rate Limiting

Los endpoints publicos del gateway tienen control de tasa con:

- `@UseGuards(PublicRateLimitGuard)`
- `@PublicRateLimit(limit, windowMs, key)`

Reglas activas (resumen):

- Auth publico (`/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/42`, `/auth/42/login`, `/auth/42/callback`).
- Upsert OAuth de users (`POST /users/oauth/42/upsert`).
- Endpoints publicos de salud/metricas (`/health`, `/metrics`, `/chat/health`).

Ejemplo real:

- `@PublicRateLimit(120, 60_000, 'chat:health')`
	- Ventana: 60 segundos.
	- Limite: 120 peticiones por IP dentro de esa ventana.

Al exceder el limite, el gateway responde `429 Too Many Requests`.

Cabeceras de cuota devueltas por respuesta:

- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

## Observability

- `MetricsInterceptor` registra duración y conteo de peticiones.
- `MetricsService` expone histogramas, gauges y counters.
- `nestjs-pino` se usa para logging estructurado.
- `GET /health/services` agrega auth, users, posts y chat.

## Operational Notes

- Puerto esperado: `3000`
- Healthcheck Docker: `http://gateway:3000/health`
- Métricas scrapeadas por Prometheus: `http://gateway:3000/metrics`
- Depende de `redis` (adapter de Socket.IO y presencia compartida) vía `REDIS_URL`.

## Relevant Files

- `backend/gateway/src/main.ts`
- `backend/gateway/src/app.module.ts`
- `backend/gateway/src/app.controller.ts`
- `backend/gateway/src/common/guards/auth.guard.ts`
- `backend/gateway/src/common/interceptors/metrics.interceptor.ts`
- `backend/gateway/src/services/auth/*`
- `backend/gateway/src/services/users/*`
- `backend/gateway/src/services/posts/*`
- `backend/shared/posts/*`
- `backend/shared/realtime/*`
- `backend/gateway/src/services/chat/*`
- `backend/gateway/src/services/presence/*`
- `backend/gateway/src/services/realtime/realtime.service.ts`
- `backend/gateway/src/redis/*`
