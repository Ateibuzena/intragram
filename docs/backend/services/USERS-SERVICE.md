# Users Service

## Purpose

`users-service` concentra el dominio social de Intragram: perfiles, publicaciones, amistades, favoritos, likes y comentarios.

## Main Responsibilities

- Crear o actualizar perfiles a partir de OAuth 42.
- Buscar perfiles por id interno, id de 42 o login.
- Permitir actualizaciones de perfil local.
- Construir distintos feeds.
- Crear publicaciones.
- Gestionar likes con persistencia y contador.
- Gestionar comentarios con persistencia y contador.
- Devolver amistades aceptadas y solicitudes pendientes.
- Guardar y desguardar publicaciones favoritas.

## Exposed Endpoints

### Profiles

- `POST /users/oauth/42/upsert`
- `PATCH /users/:id/refresh`
- `GET /users/search`
- `GET /users/:id`
- `GET /users/42/:fortyTwoId`
- `GET /users/login/:login`
- `PATCH /users/:id/profile`
- `GET /health`

### Feed

- `GET /feed/recent/:id`
- `GET /feed/user/:id`
- `POST /feed/user/:id`
- `GET /feed/friends/:id`
- `GET /feed/trending/:id`
- `GET /feed/favorites/:id`
- `POST /feed/favorites/:id`
- `POST /feed/like/:id` — body: `{ postId }` — toggle like, devuelve `{ liked, likes_count }`

### Comments

- `GET /feed/post/:postId/comments` — lista de comentarios del post, ordenados por fecha
- `POST /feed/post/:postId/comments` — body: `{ authorId, content }` — añade comentario
- `DELETE /feed/post/comments/:commentId/by/:userId` — elimina comentario (solo el autor)

### Friends

- `GET /friends/:id`
- `POST /friends/:id`
- `DELETE /friends/:id/:friendId`
- `GET /friends/pending/:id` — solicitudes entrantes pendientes
- `PATCH /friends/:id/accept/:requesterId` — acepta solicitud pendiente

## Refresh Profile From 42

### Endpoint `PATCH /users/:id/refresh`

Refresca y sincroniza el perfil local de un usuario usando datos en vivo de la API de 42 (`/v2/me`).

#### Query Params

- `access_token` (obligatorio): access token OAuth42 valido del usuario.

#### Reglas

- Si falta `access_token`, responde `400`.
- Si el token es invalido o expiro, propaga el error de 42 (normalmente `401`).
- Si el usuario `:id` no existe en base de datos local, responde `404`.
- Si todo es correcto, actualiza el perfil local y devuelve el perfil sincronizado.

#### Request de ejemplo

```http
PATCH /users/9f8d5caa-5e7a-4d8f-9f58-a42b8b8a0f2d/refresh?access_token=eyJhbGciOi...
```

#### Respuesta esperada (200)

```json
{
	"id": "9f8d5caa-5e7a-4d8f-9f58-a42b8b8a0f2d",
	"forty_two_id": 12345,
	"login": "mfernand",
	"display_name": "Mariano",
	"avatar_url": "https://cdn.intra.42.fr/users/...",
	"wallet": 420,
	"correction_point": 7,
	"skills": [],
	"levels": [],
	"projects_users": [],
	"updated_at": "2026-04-29T10:00:00.000Z"
}
```

#### Flujo interno

1. Valida existencia del usuario local por `:id`.
2. Llama a `https://api.intra.42.fr/v2/me` con `Authorization: Bearer <access_token>`.
3. Mapea campos relevantes (perfil, cursus 21, skills, levels, projects, titles, dashes).
4. Ejecuta upsert local con la misma logica de sincronizacion OAuth42.

#### Nota de integracion con gateway

La API publica recomendada para frontend es el endpoint del gateway:

- `PATCH /users/me/refresh-profile?access_token=...`
- `PATCH /users/:id/refresh-profile?access_token=...`

## Friends Management

La gestion de amistades contempla:

- obtener la lista de amistades aceptadas,
- enviar solicitud de amistad (estado `pending`),
- aceptar solicitud entrante,
- rechazar o eliminar amistad,
- listar solicitudes pendientes entrantes.

### Endpoint `POST /friends/:id`

Permite agregar un amigo al usuario `:id`.

Comportamiento:

- valida que el usuario origen y destino existan,
- evita auto-amistad,
- si ya existe relacion `accepted`, devuelve `{ status: 'accepted' }`,
- si el destinatario ya nos envió solicitud, la acepta automáticamente y devuelve `{ status: 'accepted' }`,
- si ya enviamos solicitud pendiente, no duplica y devuelve `{ status: 'pending' }`,
- en caso contrario, crea relacion `pending` y devuelve `{ status: 'pending' }`.

Respuesta: `{ status: 'pending' | 'accepted', friend: IUserProfile }`

## Comments

Los comentarios están modelados como entidad propia (`user_post_comments`). Cada operación actualiza `comments_count` en el post correspondiente.

### `GET /feed/post/:postId/comments`

Devuelve todos los comentarios del post ordenados por `created_at ASC`. Cada comentario incluye el perfil resumido del autor.

### `POST /feed/post/:postId/comments`

Crea un comentario. Requiere `authorId` y `content` en el body. Incrementa `comments_count` en el post.

### `DELETE /feed/post/comments/:commentId/by/:userId`

Elimina un comentario. Responde `403` si `userId` no es el autor. Decrementa `comments_count` en el post.

## Domain Model

### `user_profiles`

Guarda la identidad social y académica sincronizada desde 42:

- `forty_two_id`
- `login`
- `display_name`
- `avatar_url`
- `wallet`
- `correction_point`
- `campus`
- `raw_profile`

### `user_posts`

Guarda publicaciones del feed:

- autor,
- contenido,
- visibilidad,
- `likes_count` — actualizado por `user_post_likes`,
- `comments_count` — actualizado por `user_post_comments`.

### `user_friendships`

Guarda relaciones entre usuarios con estado:

- `pending`
- `accepted`
- `blocked`

### `user_saved_posts`

Modela favoritos por usuario.

### `user_post_likes`

Rastrea qué usuario ha dado like a qué post. Restricción única `(user_id, post_id)`. Las operaciones de toggle sobre esta tabla actualizan `likes_count` en `user_posts`.

### `user_post_comments`

Guarda comentarios de publicaciones:

- `post_id`
- `author_id`
- `content`
- `created_at`

Las operaciones de inserción y borrado actualizan `comments_count` en `user_posts`.

## Feed Logic

### Recent Feed

- publicaciones propias,
- publicaciones de amigos aceptados.

### My Feed

- solo publicaciones del usuario.

### Friends Feed

- solo publicaciones de amigos aceptados.

### Trending Feed

- publicaciones públicas,
- excluye las del propio usuario,
- ordena por `likes_count` y fecha.

### Favorites Feed

- publicaciones guardadas por el usuario.

## Relationship With Other Services

- `auth-service` lo usa para sincronizar perfiles derivados de 42.
- El `gateway` lo usa para exponer API pública protegida.
- El frontend obtiene de aquí perfiles, feeds y amigos.

## Operational Notes

- Puerto esperado: `3006`
- Base de datos: `users-db`
- Healthcheck Docker: `http://users-service:3006/health`

## Current Limitations

- No hay paginación en feeds ni en comentarios (se devuelven todos los registros).
- No hay notificaciones al recibir un comentario, like o solicitud de amistad.
- El perfil editable existe en backend pero el frontend lo explota de forma básica.

## Relevant Files

- `backend/services/users/src/users.controller.ts`
- `backend/services/users/src/users.service.ts`
- `backend/services/users/src/entities/user-profile.entity.ts`
- `backend/services/users/src/entities/user-post.entity.ts`
- `backend/services/users/src/entities/user-friendship.entity.ts`
- `backend/services/users/src/entities/user-saved-post.entity.ts`
- `backend/services/users/src/entities/user-post-like.entity.ts`
- `backend/services/users/src/entities/user-post-comment.entity.ts`
