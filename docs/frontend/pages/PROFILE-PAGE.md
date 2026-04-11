# Profile Page

## Purpose

`ProfilePage` representa el área reservada para el perfil del usuario dentro de la navegación principal.

## Current State

En la implementación actual es un placeholder visual. Muestra:

- icono de perfil,
- título de la sección,
- texto descriptivo.

## Intended Future Scope

Según la estructura del proyecto y los endpoints ya existentes en backend, esta página debería evolucionar para incluir:

- datos completos del perfil,
- avatar y nombre editable,
- estadísticas básicas del usuario,
- publicaciones propias,
- quizá configuración adicional.

## Backend Capabilities Already Available

El backend ya dispone de base para conectar esta vista con datos reales:

- `GET /users/login/:login`
- `GET /users/:id`
- `PATCH /users/:id/profile`
- `GET /users/feed/me`

## Limitation

Todavía no hay integración real con esos endpoints desde esta vista.

## Dependencies

- `frontend/src/pages/ProfilePage.tsx`
- `frontend/src/hooks/useAuth.ts`
