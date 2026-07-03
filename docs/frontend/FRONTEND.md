# Frontend

## Overview

El frontend de Intragram está construido con React, TypeScript y Vite. Su responsabilidad es ofrecer la interfaz de usuario, mantener el estado de sesión en el navegador, consumir la API expuesta por el gateway y presentar los flujos principales de la aplicación: login, feed, chat y perfil.

## Responsibilities

- Gestionar rutas públicas y protegidas.
- Persistir la sesión en `localStorage`.
- Resolver la URL base de la API según el entorno.
- Renderizar navegación, feed, chat, perfil y componentes reutilizables.
- Consumir endpoints protegidos del backend mediante `fetch`.

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
- Rutas no reconocidas
  - Redirigen a `/login` o `/` según haya sesión.

Aunque existen constantes para `/chat`, `/notifications` y `/profile/:login`, en la implementación actual la navegación real se maneja internamente dentro de `HomePage` mediante pestañas.

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
- Chat
  - `GET /chat/conversations`
  - `POST /chat/conversations`
  - `GET /chat/conversations/:id/messages`
  - `POST /chat/conversations/:id/messages`

## Main Screens

- `LoginPage`
  - Punto de entrada y arranque del flujo OAuth 42.
- `HomePage`
  - Orquestador principal de la app una vez autenticado.
- `ChatPage`
  - Gestión de conversaciones, mensajes y creación de chat nuevo.
- `ProfilePage`
  - Placeholder actual para perfil.
- `NotificationsPage`
  - Placeholder actual para notificaciones.

## Reusable Components

- `components/feed`
  - `Feed`, `CreatePost`, `PostCard`, `PostSkeleton`
- `components/chat`
  - `ConversationList`, `ChatWindow`, `MessageBubble`
- `components/layout`
  - `Navbar`, `Sidebar`, `FriendsList`, `BottomBar`
- `components/ui`
  - `Avatar`, `Button`, `Input`, `Badge`, `Modal`, `Card`

## Visual And UX Notes

- Tailwind se usa como base de utilidades.
- También hay CSS dedicados por componente para piezas concretas.
- La app usa una estética oscura orientada a producto social.
- Hay animaciones simples para transiciones, likes y feedback visual.

## Current Limitations

- `ProfilePage` no está conectada a datos reales.
- `NotificationsPage` es estática.
- El buscador del navbar todavía no dispara una búsqueda real.
- Los likes y comentarios del feed ya se persisten en backend, aunque todavía faltan mejoras de integridad y UX.
- Los adjuntos de posts y chat todavía no están implementados.

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
