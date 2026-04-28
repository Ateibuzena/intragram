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
