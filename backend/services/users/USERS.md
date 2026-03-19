# Users Service - Microservicio de Usuarios

## Resumen de lo que hemos hecho
- Implementado persistencia de perfil OAuth 42 en PostgreSQL (`user_profiles`).
- `upsert` por `forty_two_id`, `login` o `email` para evitar duplicados.
- Normalizacion de datos:
  - `login` y `email` en lowercase.
  - `display_name` usando `displayname`, `usual_full_name` o `login`.
  - `avatar_url` usando prioridad `image.link`, `versions.large`, `versions.medium`, `versions.small`.
- Guardado de `raw_profile` en `jsonb` para conservar payload completo de 42.
- Endpoints de consulta por `id`, `42 id` y `login`.
- Endpoint de actualizacion parcial de perfil (`display_name`, `avatar_url`).

## Rol dentro del sistema
Este servicio es la fuente de verdad del perfil. Auth lo usa durante OAuth para sincronizar usuario y luego generar tokens.

## Endpoints

### Expuestos en gateway (recomendado)
Base URL local: `https://localhost:8443/api`

| Metodo | Ruta | Descripcion |
|---|---|---|
| POST | /users/oauth/42/upsert | Crear/actualizar perfil desde payload 42 |
| GET | /users/:id | Buscar por id interno (uuid) |
| GET | /users/42/:fortyTwoId | Buscar por id de 42 |
| GET | /users/login/:login | Buscar por login |
| PATCH | /users/:id/profile | Actualizar perfil editable |

### Expuestos en users-service (interno)
Base URL interna: `http://localhost:3006`

| Metodo | Ruta | Descripcion |
|---|---|---|
| POST | /users/oauth/42/upsert | Crear/actualizar perfil desde payload 42 |
| GET | /users/:id | Buscar por id interno (uuid) |
| GET | /users/42/:fortyTwoId | Buscar por id de 42 |
| GET | /users/login/:login | Buscar por login |
| PATCH | /users/:id/profile | Actualizar perfil editable |
| GET | /health | Health check |

## Esquema de datos guardados
Tabla: `user_profiles`

- `id` (uuid interno)
- `forty_two_id` (id numerico de 42)
- `login`, `email`
- `first_name`, `last_name`, `display_name`
- `avatar_url`
- `campus`
- `pool_month`, `pool_year`
- `wallet`, `correction_point`
- `location`, `phone`
- `staff`, `alumni`, `active`
- `last_login_at`
- `raw_profile` (jsonb)
- `created_at`, `updated_at`

## Ejemplos de peticiones (curl)

### 1) Upsert OAuth 42
```bash
curl -k -X POST "https://localhost:8443/api/users/oauth/42/upsert" \
  -H "Content-Type: application/json" \
  -d '{
    "id": 12345,
    "login": "marianof",
    "email": "marianof@student.42malaga.com",
    "first_name": "Mariano",
    "last_name": "Fernandez Rodero",
    "displayname": "Mariano Fernandez",
    "usual_full_name": "Mariano Fernandez Rodero",
    "wallet": 398,
    "correction_point": 3,
    "staff": false,
    "alumni": false,
    "active": true,
    "image": {
      "link": "https://cdn.intra.42.fr/users/marianof.jpg"
    },
    "campus": [{ "name": "Malaga" }]
  }'
```

### 2) Buscar por id interno
```bash
curl -k "https://localhost:8443/api/users/<USER_ID_UUID>"
```

### 3) Buscar por id de 42
```bash
curl -k "https://localhost:8443/api/users/42/12345"
```

### 4) Buscar por login
```bash
curl -k "https://localhost:8443/api/users/login/marianof"
```

### 5) Actualizar perfil editable
```bash
curl -k -X PATCH "https://localhost:8443/api/users/<USER_ID_UUID>/profile" \
  -H "Content-Type: application/json" \
  -d '{
    "display_name": "Mariano F.",
    "avatar_url": "https://cdn.intra.42.fr/users/new-avatar.jpg"
  }'
```

## Validacion de entrada
`UpsertOAuth42UserDto` valida:
- Obligatorios: `id` (int), `login` (string)
- Opcionales: `email`, `first_name`, `last_name`, `displayname`, `usual_full_name`, `pool_month`, `pool_year`, `wallet`, `correction_point`, `location`, `phone`, `staff`, `alumni`, `active`, `image`, `campus`

Nota: la app usa `ValidationPipe` con:
- `whitelist: true`
- `forbidNonWhitelisted: true`
- `transform: true`

## Errores comunes
- `404 Usuario ... no encontrado` en busquedas por id/login/42 id.
- `500 Error al guardar usuario de OAuth 42` ante payload invalido o fallo DB.

## Variables de entorno relevantes
| Variable | Default | Descripcion |
|---|---|---|
| PORT | 3006 | Puerto users-service |
| DB_HOST | users-db | Host PostgreSQL users |
| DB_PORT | 5432 | Puerto PostgreSQL |
| DB_USERNAME | users_user | Usuario DB |
| DB_PASSWORD | users_password | Password DB |
| DB_DATABASE | users_db | Nombre DB |

## Consultas SQL utiles para verificacion
```sql
SELECT id, login, email, display_name, avatar_url, campus, wallet, correction_point
FROM user_profiles
WHERE login = 'marianof';
```

```sql
SELECT id, forty_two_id, login, updated_at
FROM user_profiles
ORDER BY updated_at DESC
LIMIT 20;
```
