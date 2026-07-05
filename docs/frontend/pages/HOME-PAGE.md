# Home Page

## Purpose

`HomePage` es la vista principal tras iniciar sesión. Orquesta la navegación interna de la app y decide si el usuario ve el feed o el chat.

## What It Does

- Comprueba el estado de autenticación a través de `useAuth`.
- Mantiene la navegación interna con `activeNav`.
- Mantiene el filtro activo del feed con `activeFilter`.
- Muestra:
  - `Navbar`
  - `Sidebar` en escritorio
  - `Feed` cuando la pestaña activa es `home`
  - `ChatPage` cuando la pestaña activa es `chat`
  - `ProfilePage` cuando la pestaña activa es `profile`
  - `FriendsList` en escritorio ancho

## Data Used

- Usuario autenticado desde `useAuth`.
- Perfil completo del usuario cargado previamente por `useAuth`.
- Login actual para filtrar el feed de publicaciones propias.

## Feed Filters Available

- `reciente`
- `amigos`
- `favoritos`
- `trending`
- `perfil`

La lógica del filtro se apoya en el backend y en el componente `Feed`.

## UX Notes

- El layout cambia entre escritorio y móvil.
- Hay transición visual al cambiar de pestaña.
- El chat ocupa la zona central completa cuando está activo.

## Dependencies

- `frontend/src/pages/HomePage.tsx`
- `frontend/src/components/layout/Navbar.tsx`
- `frontend/src/components/layout/Sidebar.tsx`
- `frontend/src/components/layout/FriendsList.tsx`
- `frontend/src/components/feed/Feed.tsx`
- `frontend/src/pages/ChatPage.tsx`

## Current Limitations

- No usa rutas separadas para cada subpantalla; la navegación es interna por estado.
- El perfil mostrado desde `ProfilePage` es todavía un placeholder.
