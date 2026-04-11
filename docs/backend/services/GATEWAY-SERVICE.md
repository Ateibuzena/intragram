# Gateway Service

## Purpose

El `gateway` es la puerta de entrada pública del backend. Expone una API HTTP única al frontend, centraliza validación, CORS, métricas y reenvío hacia los servicios internos.

## Main Responsibilities

- Exponer `/health` y `/metrics`.
- Validar `Bearer tokens`.
- Reenviar autenticación a `auth-service`.
- Reenviar usuarios/feed a `users-service`.
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

### Users

- `POST /users/oauth/42/upsert`
- `GET /users/login/:login`
- `GET /users/search`
- `PATCH /users/:id/profile`
- `GET /users/feed`
- `GET /users/feed/me`
- `GET /users/feed/friends`
- `GET /users/feed/trending`
- `GET /users/feed/favorites`
- `POST /users/feed`
- `POST /users/feed/favorites/:postId`
- `GET /users/friends/me`
- `GET /users/:id`

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
- `backend/gateway/src/services/chat/*`
