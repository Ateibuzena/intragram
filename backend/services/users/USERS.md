# Users Service - Microservicio de Usuarios

## Objetivo
Gestionar y persistir el perfil de usuarios que inician sesion con OAuth de 42.

## Fuente de datos
Los datos vienen del endpoint oficial de 42:
- `GET https://api.intra.42.fr/v2/me`

## Datos relevantes que podemos obtener de 42
Campos habituales del payload de `/v2/me`:
- `id` (identificador unico en 42)
- `login`
- `email`
- `first_name`
- `last_name`
- `usual_full_name` / `displayname`
- `image.link` y `image.versions.*`
- `campus[]`
- `pool_month`, `pool_year`
- `wallet`, `correction_point`
- `location`, `phone`
- `staff`, `alumni`, `active`
- muchos otros metadatos (proyectos, cursus, etc.)

## Que se guarda en BBDD
Tabla `user_profiles`:
- `forty_two_id`
- `login`
- `email`
- `first_name`, `last_name`, `display_name`
- `avatar_url`
- `campus`
- `pool_month`, `pool_year`
- `wallet`, `correction_point`
- `location`, `phone`
- `staff`, `alumni`, `active`
- `last_login_at`
- `raw_profile` (jsonb con payload de 42 para futuras necesidades)

## Endpoints
| Metodo | Ruta                    | Descripcion |
|-------|-------------------------|-------------|
| POST  | /users/oauth/42/upsert  | Crea o actualiza usuario usando payload de 42 |
| GET   | /users/:id              | Obtener usuario por id interno |
| GET   | /users/42/:fortyTwoId   | Obtener usuario por id de 42 |
| GET   | /users/login/:login     | Obtener usuario por login |
| PATCH | /users/:id/profile      | Actualizar perfil editable |
| GET   | /health                 | Health check |

## Ejemplo JSON para upsert desde OAuth42
### Request
```json
{
  "id": 12345,
  "login": "marianof",
  "email": "mariano@example.com",
  "first_name": "Mariano",
  "last_name": "Fernandez Rodero",
  "displayname": "Mariano Fernandez",
  "usual_full_name": "Mariano Fernandez Rodero",
  "pool_month": "july",
  "pool_year": "2023",
  "wallet": 42,
  "correction_point": 3,
  "location": "e2r5p1",
  "phone": null,
  "staff": false,
  "alumni": false,
  "active": true,
  "image": {
    "link": "https://cdn.intra.42.fr/users/marianof.jpg",
    "versions": {
      "large": "https://.../large.jpg",
      "small": "https://.../small.jpg"
    }
  },
  "campus": [
    { "name": "Malaga" }
  ]
}
```

### Response
```json
{
  "id": "d4a2f2d6-5e97-4fdd-a9d0-3f1fc4c2d1aa",
  "forty_two_id": 12345,
  "login": "marianof",
  "email": "mariano@example.com",
  "display_name": "Mariano Fernandez",
  "avatar_url": "https://cdn.intra.42.fr/users/marianof.jpg",
  "campus": "Malaga",
  "wallet": 42,
  "correction_point": 3,
  "active": true,
  "last_login_at": "2026-03-17T19:10:00.000Z"
}
```
