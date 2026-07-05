# Chat Service

## Purpose

`chat-service` gestiona la mensajería privada entre usuarios: conversaciones, historial de mensajes y actualización del resumen de cada chat.

## Main Responsibilities

- Devolver health del servicio.
- Listar conversaciones accesibles por usuario.
- Crear conversaciones 1 a 1.
- Listar mensajes de una conversación.
- Enviar mensajes y actualizar el resumen de la conversación.

## Exposed Endpoints

- `GET /chat/health`
- `GET /chat/conversations`
- `POST /chat/conversations`
- `GET /chat/conversations/:conversationId/messages`
- `POST /chat/conversations/:conversationId/messages`

## Identity Model

Este servicio no valida JWT por sí mismo. Espera que el gateway ya haya autenticado al usuario y le pase su identidad mediante:

```text
x-user-id
```

## Persistence Model

### `chat_conversations`

- `participants: text[]`
- `last_message`
- `last_message_at`
- `created_at`
- `updated_at`

### `chat_messages`

- `conversationId`
- `senderId`
- `message`
- `attachments`
- `created_at`

## Conversation Rules

- Solo se crean conversaciones entre dos participantes.
- Si ya existe una conversación con exactamente esos dos usuarios, se reutiliza.
- Solo puede leer o escribir quien pertenezca a la conversación.

## Frontend Integration

El frontend usa polling para refrescar:

- conversaciones cada pocos segundos,
- mensajes de la conversación seleccionada.

Además, cuando hace falta mostrar el otro participante, consulta `users-service` a través del gateway para obtener login y avatar.

## Operational Notes

- Puerto esperado: `3009`
- Base de datos: `chat-db`
- Healthcheck Docker: `http://chat-service:3009/chat/health`

## Current Limitations

- No hay WebSocket funcional expuesto al frontend en la implementación actual.
- Los adjuntos están definidos como `text[]`, pero la UI todavía no los usa.
- El estado de usuarios conectados es básico y no representa presencia real completa.

## Relevant Files

- `backend/services/chat/src/chat.controller.ts`
- `backend/services/chat/src/chat.service.ts`
- `backend/services/chat/src/entities/chat-conversation.entity.ts`
- `backend/services/chat/src/entities/chat-message.entity.ts`
