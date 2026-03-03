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
