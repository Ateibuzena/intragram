# Posts Service

## Purpose

`posts-service` concentra el dominio de publicaciones de Intragram: feed, publicaciones, imagenes, likes, comentarios y favoritos.

## Main Responsibilities

- Crear publicaciones para un perfil autenticado.
- Guardar contenido, visibilidad e imagenes de publicaciones.
- Construir vistas de feed: reciente, propio, amigos, tendencias y favoritos.
- Validar visibilidad de publicaciones publicas, privadas y de amigos.
- Gestionar likes, comentarios y publicaciones guardadas.
- Mantener snapshots minimos del autor para que el feed no dependa de joins entre bases de datos.

## Exposed Endpoints

Estas rutas son internas al microservicio. La API publica recomendada para frontend pasa por el gateway bajo `/posts/feed/*`.

### Health And Metrics

- `GET /health`
- `GET /metrics`

### Feed

- `GET /posts/feed/recent/:id`
- `GET /posts/feed/user/:id`
- `POST /posts/feed/user/:id`
- `GET /posts/feed/friends/:id`
- `GET /posts/feed/trending/:id`
- `GET /posts/feed/favorites/:id`

### Interactions

- `POST /posts/feed/favorites/:id`
- `POST /posts/feed/like/:id`
- `GET /posts/feed/post/:postId`
- `GET /posts/feed/post/:postId/image`
- `GET /posts/feed/post/:postId/comments`
- `POST /posts/feed/post/:postId/comments`
- `DELETE /posts/feed/post/comments/:commentId/by/:userId`
- `DELETE /posts/feed/post/:postId/by/:userId`

## Public Gateway Contract

El gateway expone las rutas públicas bajo `/posts`:

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

## Domain Model

### `posts`

Guarda publicaciones y snapshot del autor:

- `author_id`
- `author_login`
- `author_display_name`
- `author_avatar_url`
- `content`
- `visibility`
- `image_data`
- `image_mime_type`
- `likes_count`
- `comments_count`

### `post_comments`

Guarda comentarios asociados a una publicacion y snapshot del autor del comentario.

### `post_likes`

Guarda likes por usuario y publicacion con indice unico para evitar duplicados.

### `post_saves`

Guarda publicaciones favoritas por usuario y publicacion con indice unico.

## Relationship With Other Services

- El `gateway` resuelve el perfil autenticado, recibe la peticion publica y reenvia la operacion a `posts-service`.
- `posts-service` consulta `users-service` cuando necesita perfiles o relaciones de amistad para snapshots y visibilidad.
- El frontend no llama directamente a `posts-service`; consume el contrato publico del gateway.

## Observability

`posts-service` expone `/metrics` con el mismo contrato Prometheus que el resto de servicios NestJS:

- `http_request_duration_seconds`
- `request_count_total`
- metricas por defecto del proceso Node

Prometheus scrapea `posts-service:3007` y Grafana provisiona `posts-service-dashboard.json`.

## Operational Notes

- Puerto esperado: `3007`
- Base de datos: `posts-db`
- Healthcheck Docker: `http://posts-service:3007/health`
- Metricas Docker: `http://posts-service:3007/metrics`

## Current Limitations

- No hay notificaciones al recibir comentarios o likes.
- No hay bus de eventos entre servicios; la comunicacion actual es HTTP sincrona.
- Los snapshots de autor se actualizan al construir feed, pero no hay proceso asincrono de rehidratacion historica.

## Relevant Files

- `backend/services/posts/src/posts.controller.ts`
- `backend/services/posts/src/posts.service.ts`
- `backend/services/posts/src/entities/post.entity.ts`
- `backend/services/posts/src/entities/post-comment.entity.ts`
- `backend/services/posts/src/entities/post-like.entity.ts`
- `backend/services/posts/src/entities/post-save.entity.ts`
- `backend/services/posts/src/observability/metrics/*`
- `backend/gateway/src/services/posts/*`
- `backend/shared/posts/*`
