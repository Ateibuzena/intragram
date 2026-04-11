# Chat Page

## Purpose

`ChatPage` implementa la experiencia de mensajería privada de Intragram.

## Main Responsibilities

- Cargar conversaciones del usuario autenticado.
- Resolver el otro participante de cada conversación.
- Cargar mensajes de la conversación seleccionada.
- Enviar mensajes.
- Crear conversaciones nuevas a partir de una búsqueda de usuarios.

## Backend Integration

### Conversations

- `GET /chat/conversations`
- `POST /chat/conversations`

### Messages

- `GET /chat/conversations/:conversationId/messages`
- `POST /chat/conversations/:conversationId/messages`

### User Search And Profile Resolution

- `GET /users/search?q=...`
- `GET /users/:id`

## How It Works

1. Decodifica el token para obtener el id del usuario actual.
2. Recupera la lista de conversaciones.
3. Para cada participante que no sea el usuario actual, busca su perfil en `users-service`.
4. Mantiene la conversación seleccionada en estado local.
5. Lanza polling periódico para conversaciones y mensajes.
6. Permite crear un chat nuevo desde un modal de búsqueda.

## UI Composition

- `ConversationList`
  - listado lateral y búsqueda local.
- `ChatWindow`
  - cabecera, historial y caja de envío.
- `Modal`
  - selector de usuario para iniciar conversación.

## Current Limitations

- Usa polling, no WebSocket real en frontend.
- Los adjuntos están previstos pero no implementados.
- No hay presencia online real ni recibos de lectura.

## Dependencies

- `frontend/src/pages/ChatPage.tsx`
- `frontend/src/components/chat/ConversationList.tsx`
- `frontend/src/components/chat/ChatWindow.tsx`
- `frontend/src/components/chat/MessageBubble.tsx`
