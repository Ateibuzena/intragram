# Auth Service - Microservicio de Autenticacion

## Resumen de lo que hemos hecho
- Implementado auth completo con NestJS + TypeORM + PostgreSQL.
- Registro y login por `username` o `email`.
- JWT de acceso (15 min) + refresh token (7 dias).
- Rotacion de refresh token en cada `/auth/refresh`.
- Bloqueo temporal de cuenta tras 5 intentos fallidos (15 min).
- Integracion OAuth 42:
  - `GET /auth/42` y `GET /auth/42/login` para iniciar el flujo.
  - `GET /auth/42/callback` para procesar `code`, consultar 42, sincronizar perfil via users-service y generar tokens propios.
- Captura de IP y User-Agent en sesiones (refresh token metadata).

## Stack
- NestJS (TypeScript)
- PostgreSQL
- TypeORM
- bcrypt
- jsonwebtoken
- axios (OAuth 42 + llamada interna a users-service)

## Rutas disponibles

### Expuestas en el gateway (recomendado)
Base URL local: `https://localhost:8443/api`

| Metodo | Ruta | Descripcion |
|---|---|---|
| POST | /auth/register | Registro local |
| POST | /auth/login | Login local |
| POST | /auth/refresh | Rotacion de refresh token |
| POST | /auth/logout | Revoca refresh token |
| GET | /auth/42 | Inicio OAuth 42 (redirige) |
| GET | /auth/42/login | Inicio OAuth 42 (redirige) |
| GET | /auth/42/callback | Callback OAuth 42 |

### Expuestas en el microservicio auth (interno)
Base URL interna: `http://localhost:3003`

| Metodo | Ruta | Descripcion |
|---|---|---|
| POST | /auth/register | Registro local |
| POST | /auth/login | Login local |
| POST | /auth/refresh | Rotacion de refresh token |
| POST | /auth/logout | Revoca refresh token |
| POST | /auth/validate | Validacion de JWT (uso interno) |
| GET | /auth/42 | Devuelve URL OAuth de 42 |
| GET | /auth/42/callback | Callback OAuth 42 |
| GET | /health | Health check |

## Flujo funcional
1. Registro/Login local emite `access_token` y `refresh_token`.
2. `access_token` se usa para autorizacion de requests de corta vida.
3. `refresh_token` se usa en `/auth/refresh` para emitir nuevo par de tokens.
4. OAuth 42:
   - Auth consulta `https://api.intra.42.fr/oauth/token` y `https://api.intra.42.fr/v2/me`.
   - Auth sincroniza perfil en users-service (`POST /users/oauth/42/upsert`).
   - Auth construye respuesta de autenticacion propia.

## Ejemplos de peticiones (curl)

### 1) Registrar usuario local
```bash
curl -k -X POST "https://localhost:8443/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username":"testuser",
    "email":"test@example.com",
    "password":"Test1234!",
    "display_name":"Test User"
  }'
```

### 2) Login local
```bash
curl -k -X POST "https://localhost:8443/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "identifier":"testuser",
    "password":"Test1234!"
  }'
```

### 3) Refresh token
```bash
curl -k -X POST "https://localhost:8443/api/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token":"<REFRESH_TOKEN>"
  }'
```

### 4) Logout
```bash
curl -k -X POST "https://localhost:8443/api/auth/logout" \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token":"<REFRESH_TOKEN>"
  }'
```

### 5) Iniciar OAuth 42
Abre esta URL en navegador:
```text
https://localhost:8443/api/auth/42/login
```

### 6) Validar JWT (solo auth-service, uso interno)
```bash
curl -X POST "http://localhost:3003/auth/validate" \
  -H "Content-Type: application/json" \
  -d '{
    "access_token":"<ACCESS_TOKEN>"
  }'
```

## Respuesta de auth (estructura)
```json
{
  "access_token": "...",
  "refresh_token": "...",
  "token_type": "Bearer",
  "expires_in": 900,
  "user": {
    "id": "uuid",
    "username": "testuser",
    "email": "test@example.com",
    "display_name": "Test User"
  }
}
```

## Errores comunes
- `401 Credenciales invalidas`: usuario/email/password incorrectos.
- `403 Cuenta bloqueada temporalmente`: supero limite de intentos fallidos.
- `401 Refresh token invalido/expirado`: token revocado o vencido.

## Variables de entorno relevantes
| Variable | Default | Descripcion |
|---|---|---|
| PORT | 3003 | Puerto del auth-service |
| DB_HOST | auth-db | Host PostgreSQL auth |
| DB_PORT | 5432 | Puerto PostgreSQL |
| DB_USERNAME | auth_user | Usuario DB |
| DB_PASSWORD | auth_password | Password DB |
| DB_DATABASE | auth_db | Nombre DB |
| JWT_SECRET | dev-secret-change-in-production | Secreto JWT |
| OAUTH_42_CLIENT_ID | - | Client ID OAuth 42 |
| OAUTH_42_CLIENT_SECRET | - | Client Secret OAuth 42 |
| OAUTH_42_REDIRECT_URI | https://localhost:8443/api/auth/42/callback | Callback OAuth |
| USERS_SERVICE_URL | http://users-service:3006 | URL interna users-service |

## Checklist rapido de pruebas
1. `GET http://localhost:3003/health`
2. `GET http://localhost:3006/health`
3. `POST /api/auth/register`
4. `POST /api/auth/login`
5. `POST /api/auth/refresh`
6. `POST /api/auth/logout`
7. `GET /api/auth/42/login`
