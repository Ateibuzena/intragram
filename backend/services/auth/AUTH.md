# Auth Service - Microservicio de Autenticación

## Descripción
Microservicio de autenticación con PostgreSQL que gestiona el registro, login, y manejo de sesiones con JWT.

## Stack
- **NestJS** (TypeScript)
- **PostgreSQL** (base de datos)
- **TypeORM** (ORM)
- **bcrypt** (hashing de contraseñas)
- **jsonwebtoken** (JWT)

## Endpoints

| Método | Ruta            | Descripción                        |
|--------|-----------------|------------------------------------|
| POST   | /auth/register  | Registro de nuevo usuario          |
| POST   | /auth/login     | Inicio de sesión                   |
| POST   | /auth/refresh   | Renovar access token               |
| POST   | /auth/logout    | Cerrar sesión                      |
| POST   | /auth/validate  | Validar token (uso interno)        |
| GET    | /health         | Health check                       |

## Medidas de seguridad
- Contraseñas hasheadas con bcrypt (12 rounds)
- JWT con access token (15 min) + refresh token (7 días)
- Rotación de refresh tokens
- Bloqueo de cuenta tras 5 intentos fallidos (15 min)
- Protección contra timing attacks
- Mensajes de error genéricos
- Queries parametrizadas (no SQL injection)
- Validación estricta de DTOs

## Ejemplos de peticiones (JSON)

### POST /auth/register — Registro de nuevo usuario

**Request:**
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "Test1234!",
  "display_name": "Test User"
}
```

| Campo          | Tipo   | Obligatorio | Reglas                                                                 |
|---------------|--------|-------------|------------------------------------------------------------------------|
| `username`     | string | Sí          | 3-30 chars, solo letras, números y `_`                                 |
| `email`        | string | Sí          | Formato email válido, máx 255 chars                                    |
| `password`     | string | Sí          | 8-128 chars, requiere mayúscula, minúscula, número y especial          |
| `display_name` | string | No          | Máx 100 chars                                                          |

**Response (201):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "bca5d78552532ae4c7f538f8a3d845a4fd64f623...",
  "token_type": "Bearer",
  "expires_in": 900,
  "user": {
    "id": "c192e278-7192-423e-b1e8-90a544577f04",
    "username": "testuser",
    "email": "test@example.com",
    "display_name": "Test User"
  }
}
```

---

### POST /auth/login — Inicio de sesión

**Request (con username):**
```json
{
  "identifier": "testuser",
  "password": "Test1234!"
}
```

**Request (con email):**
```json
{
  "identifier": "test@example.com",
  "password": "Test1234!"
}
```

| Campo        | Tipo   | Obligatorio | Reglas                              |
|-------------|--------|-------------|-------------------------------------|
| `identifier` | string | Sí          | Username o email, 3-255 chars       |
| `password`   | string | Sí          | 1-128 chars                         |

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "bcbfe4a682747c78d9f051deea3d4d6c9c1d9ef6...",
  "token_type": "Bearer",
  "expires_in": 900,
  "user": {
    "id": "c192e278-7192-423e-b1e8-90a544577f04",
    "username": "testuser",
    "email": "test@example.com",
    "display_name": "Test User"
  }
}
```

**Error — credenciales inválidas (401):**
```json
{
  "statusCode": 401,
  "message": "Credenciales inválidas"
}
```

**Error — cuenta bloqueada tras 5 intentos fallidos (403):**
```json
{
  "statusCode": 403,
  "message": "Cuenta bloqueada temporalmente. Inténtalo más tarde"
}
```

---

### POST /auth/refresh — Renovar access token

**Request:**
```json
{
  "refresh_token": "bcbfe4a682747c78d9f051deea3d4d6c9c1d9ef6..."
}
```

| Campo           | Tipo   | Obligatorio | Reglas               |
|----------------|--------|-------------|----------------------|
| `refresh_token` | string | Sí          | Token no vacío       |

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "d453c50447805f173e9acfc387074f57819fa721...",
  "token_type": "Bearer",
  "expires_in": 900,
  "user": {
    "id": "c192e278-7192-423e-b1e8-90a544577f04",
    "username": "testuser",
    "email": "test@example.com",
    "display_name": "Test User"
  }
}
```

> **Nota:** El refresh token anterior se revoca automáticamente y se genera uno nuevo (rotación de tokens).

**Error — token expirado o inválido (401):**
```json
{
  "statusCode": 401,
  "message": "Refresh token inválido"
}
```

---

### POST /auth/logout — Cerrar sesión

**Request:**
```json
{
  "refresh_token": "bcbfe4a682747c78d9f051deea3d4d6c9c1d9ef6..."
}
```

| Campo           | Tipo   | Obligatorio | Reglas               |
|----------------|--------|-------------|----------------------|
| `refresh_token` | string | Sí          | Token no vacío       |

**Response (200):**
```json
{
  "message": "Sesión cerrada correctamente"
}
```

---

### POST /auth/validate — Validar access token (uso interno del gateway)

**Request:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

| Campo          | Tipo   | Obligatorio | Reglas               |
|---------------|--------|-------------|----------------------|
| `access_token` | string | Sí          | JWT válido           |

**Response (200):**
```json
{
  "valid": true,
  "payload": {
    "sub": "c192e278-7192-423e-b1e8-90a544577f04",
    "username": "testuser",
    "email": "test@example.com",
    "iat": 1772558879,
    "exp": 1772559779
  }
}
```

**Error — token inválido o expirado (401):**
```json
{
  "statusCode": 401,
  "message": "Token expirado"
}
```

---

### GET /health — Health check

**Response (200):**
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-03-03T17:25:57.000Z"
}
```

---

## Variables de entorno
| Variable     | Default              | Descripción              |
|-------------|----------------------|--------------------------|
| PORT        | 3003                 | Puerto del servicio      |
| DB_HOST     | auth-db              | Host de PostgreSQL       |
| DB_PORT     | 5432                 | Puerto de PostgreSQL     |
| DB_USERNAME | auth_user            | Usuario de PostgreSQL    |
| DB_PASSWORD | auth_password        | Contraseña de PostgreSQL |
| DB_DATABASE | auth_db              | Nombre de la BBDD        |
| JWT_SECRET  | (requerido en prod)  | Secreto para firmar JWT  |
| NODE_ENV    | development          | Entorno de ejecución     |
