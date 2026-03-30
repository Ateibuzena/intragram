# Checklist funcionalidad HOME - Frontend

## ✅ Botones y elementos funcionales

- **Navegación entre pestañas (Home / Chat / Notificaciones)**
  - Barra superior (Navbar web, sin header móvil)
  - Cambian `activeNav` y la vista central

- **Filtros del feed**
  - Sidebar (desktop) y FilterDrawer (móvil)
  - Botones:
    - `Reciente` → `/users/feed`
    - `Amigos` → `/users/feed/friends`
    - `Mi perfil` → `/users/feed/me`
    - `Seguidos` y `Trending` → recarga feed (sin lógica extra)
  - Botón Filtros abre/cierra drawer en móvil

- **Crear post**
  - Botón **Publicar**
  - Condiciones: texto + token + no enviando
  - Llama a `POST /users/feed` y refresca feed

- **Chat**
  - Lista de conversaciones
    - Click carga mensajes (`/chat/conversations/:id/messages`)
  - Ventana de chat
    - Enviar mensaje en conversación abierta → `POST /chat/conversations/:id/messages`
    - Crear nueva conversación → `POST /chat/conversations` + GET usuario

---

## ⚠️ Botones/elementos solo UI / pendientes

- **Buscador Navbar (header principal)**
  - Estado `search` interno en HomePage, solo UI (sin backend)

- **Avatar usuario**
  - Solo desktop, sin `onClick` (sin flujo móvil)

- **Adjuntos en CrearPost (Imagen / Código / Logro)**
  - Botones sin handler

- **Acciones PostCard**
  - Like → cambia solo estado interno
  - Comentario → sin handler
  - Guardar → solo animación local
  - Compartir → sin handler
  - Menú “…” → sin lógica

- **FriendsList**
  - Items no clicables (abrir perfil o chat)

- **Iconos header chat**
  - Sin `onClick`, solo estética

- **Botón “+” input chat**
  - Sin handler

- **Pantalla de Notificaciones**
  - Vista estática, sin botones

- **Logout**
  - Función existe (`useAuth.logout`)
  - No hay botón en Navbar ni avatar

# Checklist priorizada - HOME funcional

## 🔴 Nivel 1: Crítico (bloquea flujos esenciales)
Estos deben implementarse antes que nada; sin ellos, el flujo principal no está completo.

- **Logout desde HOME**
  - Añadir botón visible en Navbar o avatar móvil
  - Debe llamar a `useAuth.logout` y redirigir al login

---

## 🟠 Nivel 2: Importante (mejora UX, no rompe pero confunde)
Implementar para que los usuarios sientan que la app “responde”.

- **Acciones PostCard reales**
  - Like → persistir en backend
  - Comentario → abrir caja de comentarios / endpoint
  - Guardar → persistir o eliminar
  - Compartir → funcional o abrir modal de compartir
  - Menú “…” → abrir menú real (editar, eliminar, reportar)

- **FriendsList clicable**
  - Cada amigo → ir a su perfil o abrir chat
  - Flechas / chevrons → navegables

- **Filtros adicionales (Seguidos, Trending)**
  - Conectar a lógica real del backend
  - Evitar que sean solo mock

---

## 🟢 Nivel 3: Estético / nice-to-have
No bloquea nada, pero mejora percepción de calidad.

- Buscador Navbar → conectar a búsqueda real
- Avatar del usuario → menú de perfil / logout
- Adjuntos en CrearPost (Imagen / Código / Logro)
- Iconos header chat → funciones reales o eliminar si no se usan
- Botón “+” input chat → subir archivos / abrir modal
- Notificaciones → botones funcionales según flujo

---

**💡 Estrategia de implementación**
1. Nivel 1: flujo mínimo funcional de feed y chat, y logout.
2. Nivel 2: interacciones de posts y FriendsList, filtros completos.
3. Nivel 3: UI restante y mejoras estéticas.

**⚠️ Nota brutal:**  
Si priorizas lo visual antes de tener logout, posts, chat y filtros funcionando, estás desperdiciando tiempo. El usuario no podrá interactuar de verdad; todo lo que ve será solo “bonito” pero inútil.