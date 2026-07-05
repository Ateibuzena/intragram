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

### Users — Feed

- `GET /users/feed`
- `GET /users/feed/me`
- `GET /users/feed/friends`
- `GET /users/feed/trending`
- `GET /users/feed/favorites`
- `POST /users/feed`
- `POST /users/feed/favorites/:postId`
- `POST /users/feed/like/:postId` — toggle like, devuelve `{ liked, likes_count }`
- `GET /users/feed/post/:postId` — devuelve la publicación si es visible para el usuario autenticado

### Users — Comments

- `GET /users/feed/post/:postId/comments` — lista de comentarios del post, validando visibilidad con el usuario autenticado
- `POST /users/feed/post/:postId/comments` — body: `{ content }` — añade comentario con usuario del JWT y valida visibilidad
- `DELETE /users/feed/post/:postId/comments/:commentId` — elimina comentario (solo el autor)

Estas rutas siguen siendo públicas en el gateway por compatibilidad, pero se reenvían a `posts-service`.

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
- `GET /posts/feed/post/:postId/comments`
- `POST /posts/feed/post/:postId/comments`
- `DELETE /posts/feed/post/:postId/comments/:commentId`
- `DELETE /posts/feed/post/:postId`

Estas rutas nuevas usan directamente el contrato limpio del gateway para la nueva topología. Las rutas `users/feed/*` siguen activas durante la transición.

### Users — Friends

- `GET /users/friends/me`
- `POST /users/friends/me`
- `DELETE /users/friends/me/:friendId`
- `GET /users/friends/pending`
- `PATCH /users/friends/me/:requesterId/accept`

### Chat

- `GET /chat/health`
- `GET /chat/conversations`
- `POST /chat/conversations`
- `GET /chat/conversations/:conversationId/messages`
- `POST /chat/conversations/:conversationId/messages`

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

## Operational Notes

- Puerto esperado: `3000`
- Healthcheck Docker: `http://gateway:3000/health`
- Métricas scrapeadas por Prometheus: `http://gateway:3000/metrics`

## Relevant Files

- `backend/gateway/src/main.ts`
- `backend/gateway/src/app.module.ts`
- `backend/gateway/src/app.controller.ts`
- `backend/gateway/src/common/guards/auth.guard.ts`
- `backend/gateway/src/common/interceptors/metrics.interceptor.ts`
- `backend/gateway/src/services/auth/*`
- `backend/gateway/src/services/users/*`
- `backend/services/posts/*`
- `backend/shared/posts/*`
- `backend/gateway/src/services/chat/*`
