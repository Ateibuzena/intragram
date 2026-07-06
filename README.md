*This project has been created as part of the 42 curriculum by Ana Zubieta, Mariano Fernández Rodero, CADU, PEDRO.*

# Intragram

## Description

**Intragram** es una red social orientada a la comunidad 42. El proyecto combina autenticación con OAuth 42, perfiles sincronizados desde la intra, un feed social con publicaciones y favoritos, mensajería privada entre usuarios y una arquitectura backend desacoplada mediante microservicios.

### Goal

El objetivo es construir una aplicación web moderna, desplegable con Docker, que demuestre:

- autenticación segura integrada con 42,
- separación clara entre frontend, gateway y servicios de dominio,
- persistencia real en PostgreSQL,
- observabilidad básica con Prometheus y Grafana,
- una base suficientemente modular como para seguir creciendo.

### Key Features 

- Login con 42 vía OAuth.
- Protección de rutas en frontend y validación JWT en backend.
- Feed con filtros: reciente, amigos, favoritos, tendencias y publicaciones propias.
- Creación de publicaciones desde la interfaz.
- Gestión de perfiles locales sincronizados desde 42.
- Lista de amigos aceptados.
- Chat privado 1 a 1 con conversaciones persistidas.
- Reverse proxy HTTPS con Nginx.
- Métricas y dashboards para observabilidad.

## Instructions

### Prerequisites

- `Docker` y `Docker Compose`
- `make`
- Puertos libres al menos para:
  - `8443` para Nginx HTTPS
  - `3001` interno de Grafana
  - `9090` interno de Prometheus
- Credenciales OAuth 42 válidas
- Un fichero de entorno con, como mínimo:
  - `NODE_ENV`
  - `JWT_SECRET`
  - `OAUTH_42_CLIENT_ID`
  - `OAUTH_42_CLIENT_SECRET`
  - `OAUTH_42_REDIRECT_URI`
  - `AUTH_DB_USER`, `AUTH_DB_PASSWORD`, `AUTH_DB_NAME`
  - `USERS_DB_USER`, `USERS_DB_PASSWORD`, `USERS_DB_NAME`
  - `POSTS_DB_USER`, `POSTS_DB_PASSWORD`, `POSTS_DB_NAME`
  - `CHAT_DB_USER`, `CHAT_DB_PASSWORD`, `CHAT_DB_NAME`
  - `GATEWAY_PORT`
  - `NGINX_HTTPS_PORT`
  - `CORS_ORIGIN`
  - `AUTH_SERVICE_URL`, `USERS_SERVICE_URL`, `POSTS_SERVICE_URL`, `CHAT_SERVICE_URL`
  - `GRAFANA_URL`

### Run Step By Step

1. Configurar las variables de entorno necesarias para Docker Compose.
2. Desde la raíz del proyecto, construir y levantar todo:

```bash
make build
make up
```

3. Abrir la aplicación en:

```text
https://localhost:8443/
```

4. Iniciar sesión con una cuenta de 42.

### Useful Commands

```bash
make up
make down
make refresh
make clean
make fclean
```

### Architecture Entry Points

- Frontend servido por Nginx: `https://localhost:8443/`
- API pública del gateway: `https://localhost:8443/api/`
- Prometheus proxificado por Nginx: `https://localhost:8443/prometheus/`
- Grafana proxificado por Nginx: `https://localhost:8443/grafana/`

## Team Information

La siguiente información mezcla evidencia verificable del repositorio con una interpretación razonable del historial Git. Conviene revisarla antes de una entrega final si el equipo quiere que refleje exactamente el reparto interno.

### Ana Zubieta

- Assigned role(s): Team Lead, Full-Stack Developer
- Responsibilities:

### Mariano Fernández Rodero

- Assigned role(s): Product Owner, Backend Developer
- Responsibilities:

### Pedro
- Assigned role(s): Project Management, Frontend Developer
- Responsibilities:

### Cadu
- Assigned role(s): Full Stack Developer
- Responsibilities:

## Project Management

### Work Organization

- Trabajo dividido por áreas: frontend, autenticación, profiles, posts/feed, chat y observabilidad.
- Desarrollo por ramas temáticas visibles en Git:
  - `feature/auth-service`
  - `feature/users`
  - `feature/chat`
  - `feature/frontend/home`
  - `feature/profile`
- Integración progresiva en `development` mediante merges frecuentes.

### Tools

- Git y GitHub para control de versiones y ramas.
- Docker Compose para integración y puesta en marcha.
- Makefile para comandos comunes de entorno.
- Documentación Markdown dentro del repositorio para seguimiento funcional.

### Communication

- Grupo de WhatsApp
- La coordinación principal observable fue a través de ramas, commits y merges en GitHub.

## Technical Stack

### Frontend

- React 19
- TypeScript
- Vite
- React Router
- Tailwind CSS
- CSS modular por componente

### Backend

- NestJS
- TypeScript
- Axios vía `@nestjs/axios`
- TypeORM
- JWT
- bcrypt

### Database

- PostgreSQL 16

### Infrastructure And Observability

- Docker / Docker Compose
- Nginx como reverse proxy HTTPS
- Prometheus
- Grafana

### Major Technical Choices

- **Microservices**: separan gateway, autenticación, usuarios, publicaciones y chat, reduciendo acoplamiento.
- **Gateway HTTP**: centraliza autenticación, validación y exposición pública de la API.
- **PostgreSQL**: encaja bien con entidades relacionales, filtros de feed y consistencia de datos.
- **Nginx con TLS**: simplifica entrada única para frontend, API y observabilidad.
- **Shared package**: evita duplicar DTOs y contratos entre servicios y frontend/backend.

## Database Schema

El sistema usa cuatro bases de datos PostgreSQL, una por dominio principal.

### Auth Database

- `users`
  - `id: uuid`
  - `username: varchar`
  - `email: varchar`
  - `password: varchar`
  - `display_name: varchar | null`
  - `user_profile_id: uuid | null`
  - `is_active: boolean`
  - `last_login: timestamp | null`
  - `failed_login_attempts: int`
  - `locked_until: timestamp | null`
- `refresh_tokens`
  - `id: uuid`
  - `token_hash: varchar`
  - `user_id: uuid`
  - `expires_at: timestamp`
  - `is_revoked: boolean`
  - `user_agent: varchar | null`
  - `ip_address: varchar | null`

Relación principal:
- `refresh_tokens.user_id -> users.id`

### Users Database

- `user_profiles`
  - `id: uuid`
  - `forty_two_id: int`
  - `login: varchar`
  - `email: varchar | null`
  - `display_name: varchar | null`
  - `avatar_url: varchar | null`
  - `wallet: int`
  - `correction_point: int`
  - `last_login_at: timestamp | null`
  - `raw_profile: jsonb | null`
- `user_friendships`
  - `id: uuid`
  - `user_id: uuid`
  - `friend_id: uuid`
  - `status: pending | accepted | blocked`

Relaciones principales:
- `user_friendships` modela relaciones entre perfiles.

### Posts Database

- `posts`
  - `id: uuid`
  - `author_id: uuid`
  - `author_login: varchar`
  - `author_display_name: varchar | null`
  - `author_avatar_url: varchar | null`
  - `content: text`
  - `visibility: public | friends | private`
  - `image_data: bytea | null`
  - `image_mime_type: varchar | null`
  - `likes_count: int`
  - `comments_count: int`
- `post_comments`
  - `id: uuid`
  - `post_id: uuid`
  - `author_id: uuid`
  - `content: text`
- `post_likes`
  - `id: uuid`
  - `user_id: uuid`
  - `post_id: uuid`
- `post_saves`
  - `id: uuid`
  - `user_id: uuid`
  - `post_id: uuid`

Relaciones principales:
- `post_comments.post_id -> posts.id`
- `post_likes.post_id -> posts.id`
- `post_saves.post_id -> posts.id`

### Chat Database

- `chat_conversations`
  - `id: uuid`
  - `participants: text[]`
  - `created_at: timestamptz`
  - `updated_at: timestamptz`
  - `last_message: text | null`
  - `last_message_at: timestamptz | null`
- `chat_messages`
  - `id: uuid`
  - `conversationId: uuid`
  - `senderId: uuid`
  - `message: text`
  - `attachments: text[]`
  - `created_at: timestamptz`

Relación principal:
- `chat_messages.conversationId -> chat_conversations.id`

## Features List

### Implemented Features

- **OAuth 42 login**
  - Flujo de redirección, callback, creación/sincronización de usuario y emisión de JWT.
  - Team members: Ateibuzena, Mariano Fernández Rodero
- **Session management**
  - Persistencia de token y usuario en `localStorage`, guardas de rutas y logout local.
  - Team members: Ateibuzena, Mariano Fernández Rodero
- **User profile sync**
  - Creación o actualización de perfiles locales desde el payload de 42.
  - Team members: Mariano Fernández Rodero, Ateibuzena
- **Feed**
  - Consulta de publicaciones recientes, de amigos, favoritas, trending y propias.
  - Team members: Ateibuzena, Mariano Fernández Rodero
- **Create post**
  - Publicación persistida desde frontend hacia posts-service.
  - Team members: Ateibuzena
- **Favorites**
  - Guardado y desguardado de publicaciones.
  - Team members: Ateibuzena
- **Post reactions and comments**
  - Likes y comentarios persistidos con contadores sincronizados y acceso validado por visibilidad.
  - Team members: Ateibuzena
- **Friends list**
  - Consulta de amigos aceptados desde el backend.
  - Team members: Ateibuzena
- **Private chat**
  - Listado de conversaciones, creación de conversación y envío/lectura de mensajes en tiempo real (WebSocket), con typing indicator y contador de no-leídos.
  - Team members: Ateibuzena, Mariano Fernández Rodero
- **Real-time updates (WebSocket)**
  - Chat, likes/comentarios, nuevas publicaciones, notificaciones y presencia online se empujan en vivo a todos los clientes conectados; adapter de Redis para que funcione con más de una réplica del gateway.
  - Team members: Mariano Fernández Rodero
- **Gateway API**
  - Punto único de acceso con validación de tokens y proxy a microservicios.
  - Team members: Mariano Fernández Rodero, santiago_UT
- **Observability**
  - Métricas Prometheus y dashboards de Grafana.
  - Team members: Ateibuzena
- **HTTPS reverse proxy**
  - Nginx sirve frontend, API y herramientas de observabilidad bajo un mismo host.
  - Team members: Ateibuzena

### Partially Implemented Or UI-Only

- El feed ya vive en `posts-service`; queda la validación runtime completa en Docker y la posible evolución de contrato/UX.
- Búsqueda global del navbar todavía no dispara consultas reales.
- Adjuntos de imagen funcionan en chat y posts; otros tipos de adjunto siguen sin implementar.
- No hay recibos de lectura por mensaje individual (solo no-leído por conversación).

## Modules

El repositorio no contiene una matriz oficial de módulos `Major/Minor` cerrada por el equipo. Para no inventar una verdad que no esté documentada, aquí se deja una **propuesta razonada** basada en lo que sí existe en código.

### Implemented Requirement Blocks

- **OAuth 42 authentication**
  - Proposed weight: Major = 2 pts
  - Justification: es un bloque central de acceso y base de toda la app.
  - Implementation: `auth-service` + `gateway` + `useAuth` en frontend.
  - Team members: Ateibuzena, Mariano Fernández Rodero
- **User management and social feed**
  - Proposed weight: Major = 2 pts
  - Justification: concentra perfiles, posts, favoritos y relaciones.
  - Implementation: `users-service` para perfiles/amistades y `posts-service` para el feed.
  - Team members: Ateibuzena, Mariano Fernández Rodero
- **Private messaging**
  - Proposed weight: Major = 2 pts
  - Justification: añade comunicación en tiempo real por WebSocket entre usuarios (mensajes, typing, no-leídos).
  - Implementation: `chat-service`, endpoints del gateway, `PresenceGateway` y `ChatPage`.
  - Team members: Ateibuzena, Mariano Fernández Rodero
- **Observability**
  - Proposed weight: Minor = 1 pt
  - Justification: no es la funcionalidad principal de usuario, pero aporta valor técnico claro.
  - Implementation: Prometheus, Grafana y métricas del gateway.
  - Team members: santiago_UT, Ateibuzena
- **HTTPS unified entry point**
  - Proposed weight: Minor = 1 pt
  - Justification: simplifica despliegue local y acceso seguro.
  - Implementation: Nginx con proxy a frontend, gateway, Prometheus y Grafana.
  - Team members: santiago_UT

### Proposed Total

- 3 bloques Major: `6 pts`
- 2 bloques Minor: `2 pts`
- Total propuesto documentado aquí: `8 pts`

## Individual Contributions

### Ateibuzena

- Diseño e implementación de gran parte del frontend.
- Integración del feed, favoritos, friends list y navegación principal.
- Participación en chat y documentación funcional.
- Ajustes de UI, identidad visual y experiencia de usuario.

### Mariano Fernández Rodero

- Integración entre frontend y backend.
- Trabajo en gateway, auth-service y users-service.
- Ajustes en `useAuth`, `apiBase`, `ChatPage` y contratos compartidos.

### santiago_UT

- Contribuciones observables en backend temprano, servicios y documentación.
- Participación en la base de observabilidad e infraestructura.

### Challenges And How They Were Solved

- **Sincronizar identidad entre 42, auth y users**
  - Se resolvió separando usuario de autenticación y perfil social, enlazados por `user_profile_id`.
- **Unificar acceso frontend/backend en desarrollo**
  - Se resolvió con Nginx como punto único de entrada y `buildApiUrl()` en frontend.
- **Compartir contratos entre servicios**
  - Se resolvió con el paquete `backend/shared`.
- **Integrar chat con datos reales**
  - Se resolvió persistiendo conversaciones/mensajes en PostgreSQL y consultando perfiles desde users.

## Documentation Map

- Frontend general: [docs/frontend/FRONTEND.md](docs/frontend/FRONTEND.md)
- Backend general: [docs/backend/BACKEND.md](docs/backend/BACKEND.md)
- Servicios backend:
  - [AUTH-SERVICE](docs/backend/services/AUTH-SERVICE.md)
  - [USERS-SERVICE](docs/backend/services/USERS-SERVICE.md)
  - [POSTS-SERVICE](docs/backend/services/POSTS-SERVICE.md)
  - [CHAT-SERVICE](docs/backend/services/CHAT-SERVICE.md)
  - [GATEWAY-SERVICE](docs/backend/services/GATEWAY-SERVICE.md)
  - [NGINX-SERVICE](docs/backend/services/NGINX-SERVICE.md)
  - [METRICS-SERVICE](docs/backend/services/METRICS-SERVICE.md)
- Vistas frontend:
  - [HOME-PAGE](docs/frontend/pages/HOME-PAGE.md)
  - [CHAT-PAGE](docs/frontend/pages/CHAT-PAGE.md)
  - [PROFILE-PAGE](docs/frontend/pages/PROFILE-PAGE.md)

## Resources

### Classic References

- React documentation: https://react.dev/
- Vite documentation: https://vite.dev/
- NestJS documentation: https://docs.nestjs.com/
- TypeORM documentation: https://typeorm.io/
- PostgreSQL documentation: https://www.postgresql.org/docs/
- Nginx documentation: https://nginx.org/en/docs/
- Prometheus documentation: https://prometheus.io/docs/
- Grafana documentation: https://grafana.com/docs/
- OAuth 2.0 RFC 6749: https://datatracker.ietf.org/doc/html/rfc6749
- JWT introduction: https://jwt.io/introduction

### How AI Was Used

- Se usó IA como apoyo para:
  - redactar y reorganizar documentación técnica,
  - revisar la estructura del repositorio,
  - resumir relaciones entre servicios y pantallas,
  - proponer texto base para explicar arquitectura y flujos.
- La IA **no sustituye** la validación manual del equipo sobre:
  - reparto exacto de roles,
  - contribuciones individuales,
  - matriz final de módulos/puntos para evaluación.

## Known Limitations

- No hay tests automatizados visibles en el repositorio actual.
- Algunos flujos siguen en estado placeholder o UI-only.
- La documentación de contribuciones está reconstruida desde Git y puede requerir ajuste final del equipo.
