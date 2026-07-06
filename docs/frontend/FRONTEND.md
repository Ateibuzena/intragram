# Frontend

## Overview

El frontend de Intragram está construido con React, TypeScript y Vite. Su responsabilidad es ofrecer la interfaz de usuario, mantener el estado de sesión en el navegador, consumir la API expuesta por el gateway y presentar los flujos principales de la aplicación: login, feed, chat y perfil.

## Responsibilities

- Gestionar rutas públicas y protegidas.
- Persistir la sesión en `localStorage`.
- Resolver la URL base de la API según el entorno.
- Renderizar navegación, feed, chat, perfil y componentes reutilizables.
- Consumir endpoints protegidos del backend mediante `fetch`.
- Mantener una conexión WebSocket única (Socket.IO) para recibir en vivo mensajes de chat, likes/comentarios, nuevas publicaciones, notificaciones y presencia online — con reconexión automática y un poll de baja frecuencia como red de reconciliación.

## Structure

- `src/App.tsx`
  - Configura `BrowserRouter`, `AuthProvider`, rutas públicas/protegidas y redirecciones.
- `src/hooks/useAuth.ts`
  - Guarda token y usuario.
  - Interpreta los parámetros `token` y `user` devueltos por el callback OAuth.
  - Recupera el perfil completo desde `/users/login/:login`.
- `src/pages/`
  - Contiene las vistas principales.
- `src/components/`
  - UI reusable y componentes de dominio para feed, chat, layout y filtros.
- `src/utils/apiBase.ts`
  - Centraliza la resolución de `/api` o de `VITE_API_URL`.

## Routing

- `/login`
  - Pantalla pública de acceso.
- `/`
  - Pantalla principal protegida.
- `/profile/:login`
  - Perfil de un usuario como página independiente.
- `/privacy`, `/terms`
  - Política de privacidad y términos de servicio.
- Rutas no reconocidas
  - Redirigen a `/login` o `/` según haya sesión.

Chat y notificaciones no tienen ruta propia: el chat vive como pestaña interna de `HomePage`, y las notificaciones se muestran desde la campana de `FriendsSidebar` (lista + toasts globales), no como una pantalla separada.

## Authentication Flow

1. El usuario entra en `/login`.
2. Pulsa `Entrar con 42`.
3. El navegador se redirige a `/api/auth/42`.
4. Tras el callback OAuth, el backend vuelve con `?token=...&user=...`.
5. `useAuthState()` guarda ambos valores y redirige a `/`.
6. Si hay token, el frontend pide el perfil completo a `/users/login/:login`.

## Data Flow With Backend

- Feed
  - `GET /posts/feed`
  - `GET /posts/feed/me`
  - `GET /posts/feed/friends`
  - `GET /posts/feed/favorites`
  - `GET /posts/feed/trending`
  - `GET /posts/feed/post/:postId`
  - `GET /posts/feed/post/:postId/comments`
  - `POST /posts/feed`
  - `POST /posts/feed/post/:postId/comments`
  - `POST /posts/feed/favorites/:postId`
  - `POST /posts/feed/like/:postId`
- Usuarios
  - `GET /users/login/:login`
  - `GET /users/:id`
  - `GET /users/search?q=...`
  - `GET /users/friends/me`
- Notificaciones
  - `GET /users/notifications`
  - `POST /users/notifications/read`
- Chat
  - `GET /chat/conversations`
  - `POST /chat/conversations`
  - `GET /chat/conversations/:id/messages`
  - `POST /chat/conversations/:id/messages`
- WebSocket (Socket.IO, vía `/api/socket.io`)
  - `chat:new-message`, `chat:typing`, `feed:new-post`, `post:like`, `post:comment-added`, `post:comment-removed`, `post:deleted`, `notification:new`, `friend:*`, `online:users`, `user:status`

## Main Screens

- `LoginPage`
  - Punto de entrada y arranque del flujo OAuth 42.
- `HomePage`
  - Orquestador principal de la app una vez autenticado.
- `ChatPage`
  - Gestión de conversaciones, mensajes y creación de chat nuevo.
- `ProfilePage`
  - Perfil real (propio o ajeno) con datos en vivo de OAuth 42: header, progreso de common core, skills, proyectos, logros, línea de tiempo académica.

Las notificaciones no tienen pantalla propia: viven en la campana de `FriendsSidebar` (lista con no-leídos) y como toasts globales (`ActivityToast`) montados una vez en la raíz de la app.

## Reusable Components

- `components/feed`
  - `Feed`, `CreatePost`, `PostCard`, `PostDetailModal`, `PostSkeleton`
- `components/chat`
  - `ConversationList`, `ChatWindow`, `MessageBubble`
- `components/profile`
  - `ProfileHeader`, `SkillsRadar`, `ProjectsCard`, `AchievementsCard`, `AcademicTimeline`, `ProfileDetails`
- `components/layout`
  - `Navbar`, `Sidebar`, `FriendsSidebar`, `ActivityToast`, `ConnectionBanner`
- `components/ui`
  - `Avatar`, `Button`, `Input`, `Badge`, `Modal`, `Card`

## Visual And UX Notes

- Tailwind se usa como base de utilidades.
- También hay CSS dedicados por componente para piezas concretas.
- La app usa una estética oscura orientada a producto social.
- Hay animaciones simples para transiciones, likes y feedback visual.

## Current Limitations

- El buscador del navbar todavía no dispara una búsqueda real.
- Los adjuntos de chat/posts soportan imagen; otros tipos de adjunto siguen sin implementar.
- No hay recibos de lectura por mensaje individual (solo no-leído por conversación).

## How To Run Frontend In Context

El frontend está pensado para ejecutarse dentro del stack completo con Docker Compose, detrás de Nginx. El punto de acceso esperado es:

```text
https://localhost:8443/
```

## Related Documentation

- [HOME-PAGE](pages/HOME-PAGE.md)
- [CHAT-PAGE](pages/CHAT-PAGE.md)
- [PROFILE-PAGE](pages/PROFILE-PAGE.md)
- [BACKEND](../backend/BACKEND.md)
