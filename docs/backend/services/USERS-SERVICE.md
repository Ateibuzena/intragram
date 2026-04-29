# Users Service

## Purpose

`users-service` concentra el dominio social de Intragram: perfiles, publicaciones, amistades y favoritos.

## Main Responsibilities

- Crear o actualizar perfiles a partir de OAuth 42.
- Buscar perfiles por id interno, id de 42 o login.
- Permitir actualizaciones de perfil local.
- Construir distintos feeds.
- Crear publicaciones.
- Devolver amistades aceptadas.
- Guardar y desguardar publicaciones favoritas.

## Exposed Endpoints

- `POST /users/oauth/42/upsert`
- `PATCH /users/:id/refresh`
- `GET /users/search`
- `GET /users/:id`
- `GET /users/42/:fortyTwoId`
- `GET /users/login/:login`
- `PATCH /users/:id/profile`
- `GET /health`
- `GET /feed/recent/:id`
- `GET /feed/user/:id`
- `POST /feed/user/:id`
- `GET /feed/friends/:id`
- `GET /feed/trending/:id`
- `GET /feed/favorites/:id`
- `POST /feed/favorites/:id`
- `GET /friends/:id`
- `POST /friends/:id`

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

La gestion de amistades en `users-service` contempla actualmente estos casos:

- obtener la lista de amistades aceptadas de un usuario,
- agregar amistad por usuario objetivo (resuelto por login en gateway antes de llegar aqui).

### Endpoint `POST /friends/:id`

Permite agregar un amigo al usuario `:id`.

Comportamiento:

- valida que el usuario origen y destino existan,
- evita auto-amistad,
- evita duplicados en ambos sentidos (`A -> B` y `B -> A`),
- si existe una relacion con estado distinto de `accepted`, la actualiza a `accepted`.

Respuesta:

- devuelve el perfil del amigo agregado.

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
- contadores simples de likes y comentarios.

### `user_friendships`

Guarda relaciones entre usuarios con estado:

- `pending`
- `accepted`
- `blocked`

### `user_saved_posts`

Modela favoritos por usuario.

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

- Los likes y comentarios no están modelados como entidades propias todavía.
- No hay endpoints completos de follow request o gestión avanzada de amistad desde frontend.
- El perfil editable existe en backend, pero el frontend aún no lo explota bien.

## Relevant Files

- `backend/services/users/src/users.controller.ts`
- `backend/services/users/src/users.service.ts`
- `backend/services/users/src/entities/user-profile.entity.ts`
- `backend/services/users/src/entities/user-post.entity.ts`
- `backend/services/users/src/entities/user-friendship.entity.ts`
- `backend/services/users/src/entities/user-saved-post.entity.ts`
