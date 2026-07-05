# Auth Service

## Purpose

`auth-service` es el servicio responsable de autenticación y sesión. Gestiona credenciales locales, integración con OAuth 42, emisión de access tokens y refresh tokens, validación interna de JWT y revocación de sesiones.

## Main Responsibilities

- Registrar usuarios locales.
- Autenticar por username o email.
- Iniciar flujo OAuth con 42.
- Procesar el callback OAuth.
- Crear o actualizar el usuario local derivado de 42.
- Emitir JWT y refresh tokens.
- Rotar refresh tokens.
- Validar access tokens para uso interno del gateway.

## Exposed Endpoints

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/validate`
- `GET /auth/42`
- `GET /auth/42/callback`
- `GET /health`

## Security Measures Implemented

- Contraseñas hasheadas con `bcrypt`.
- Refresh tokens guardados como hash SHA-256.
- Access token de corta duración.
- Refresh token con rotación.
- Contador de intentos fallidos de login.
- Bloqueo temporal de cuenta tras múltiples intentos fallidos.
- Mensajes de error genéricos para no filtrar demasiada información.
- Auditoría básica con IP y `User-Agent`.

## Persistence Model

### `users`

- identidad de autenticación,
- password hash,
- estado de la cuenta,
- referencia opcional al perfil social (`user_profile_id`).

### `refresh_tokens`

- sesiones activas y revocables,
- expiración,
- auditoría básica del cliente.

## OAuth 42 Flow

1. El gateway redirige al usuario a `/auth/42`.
2. `auth-service` construye la URL de autorización de 42.
3. Tras el callback con `code`, el servicio intercambia el código por un token con 42.
4. Recupera el perfil del usuario en 42.
5. Llama a `users-service` para sincronizar o localizar el perfil social.
6. Crea o actualiza el usuario de autenticación local.
7. Devuelve `access_token`, `refresh_token` y datos básicos del usuario al gateway.

## Relationship With Other Services

- Habla con `users-service` para localizar o sincronizar el perfil social.
- Responde al gateway cuando este necesita validar tokens.

## Operational Notes

- Puerto esperado: `3003`
- Base de datos: `auth-db`
- Métricas: disponibles vía integración Prometheus del servicio
- Healthcheck Docker: `http://auth-service:3003/health`

## Relevant Files

- `backend/services/auth/src/auth.controller.ts`
- `backend/services/auth/src/auth.service.ts`
- `backend/services/auth/src/entities/user.entity.ts`
- `backend/services/auth/src/entities/refresh-token.entity.ts`
