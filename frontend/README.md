# Intragram — Frontend

Red social inspirada en Instagram, construida con **React + TypeScript + Vite + Tailwind CSS**.

---

## Stack

| Tecnología | Uso |
|---|---|
| React 18 | UI y lógica de componentes |
| TypeScript | Tipado estático |
| Vite | Bundler y servidor de desarrollo |
| Tailwind CSS | Estilos utilitarios |
| React Router DOM | Enrutado SPA |
| PostCSS | Procesado de CSS |

---

## Estructura del proyecto

\`\`\`
frontend/src/
├── main.tsx                   # Punto de entrada
├── App.tsx                    # Router + AuthContext
├── index.css                  # Estilos globales y animaciones
├── vite-env.d.ts              # Tipos de variables de entorno
├── types/
│   ├── models.ts              # Interfaces de datos (User, Post, Message...)
│   └── props.ts               # Tipos de props de cada componente
├── constants/
│   ├── routes.ts              # Rutas de la app
│   └── mockData.ts            # Datos de prueba (posts, chats, amigos...)
├── pages/
│   ├── HomePage.tsx
│   ├── LoginPage.tsx
│   ├── ChatPage.tsx
│   └── NotificationsPage.tsx
├── components/
│   ├── layout/                # Navbar, Sidebar, BottomBar, FriendsList
│   ├── ui/                    # Button, Avatar, Badge, Input, Card, Modal
│   ├── feed/                  # Feed, PostCard, PostSkeleton, CreatePost
│   ├── chat/                  # ChatWindow, ConversationList, MessageBubble
│   └── filters/               # FilterDrawer, SettingsModal
├── hooks/
│   ├── useAuth.ts
│   ├── usePost.ts
│   └── useChat.ts
└── utils/
    ├── theme.ts
    └── formatters.ts
\`\`\`

---

## Primeros pasos

### 1. Instalar dependencias
\`\`\`bash
cd frontend
npm install
\`\`\`

### 2. Variables de entorno
\`\`\`bash
cp .env.example .env
\`\`\`
\`\`\`env
VITE_API_URL=http://localhost:8080
\`\`\`

### 3. Arrancar en desarrollo
\`\`\`bash
npm run dev
\`\`\`

### 4. Verificar tipos
\`\`\`bash
npm run type-check
\`\`\`

---

## Convenciones

### Componentes
- Si es una **ruta** → va en \`src/pages/\`
- Si se **reutiliza** → va en \`src/components/\`
- Cada componente tiene su propio \`.css\`

### Estilos
- **Clases en \`.css\`**: layout base y estados conceptuales (\`--active\`, \`--default\`)
- **Tailwind en \`className\`**: estilos puntuales o dinámicos
- No usar \`@apply group\` ni \`@apply animate-*\` custom en archivos \`.css\` externos, añadirlos inline en JSX

### TypeScript
- Interfaces de datos → \`src/types/models.ts\`
- Tipos de props → \`src/types/props.ts\`
- Variables de entorno → \`src/vite-env.d.ts\`
- No usar \`any\`

---

## Flujos principales

### Cambio de pestaña
\`\`\`
Navbar / BottomBar → setActiveNav('chat') → HomePage renderiza ChatPage
\`\`\`

### Like en un post
\`\`\`
PostCard → handleLike() [usePost.ts] → setLiked + setLikes → re-render
\`\`\`

### Chat
\`\`\`
ConversationList → onSelectChat(conv) → ChatPage → ChatWindow muestra mensajes
\`\`\`

### Login con 42
\`\`\`
LoginPage → VITE_API_URL/auth/42 → backend devuelve ?token=... → useAuth guarda en localStorage
\`\`\`

---

## TODO: conectar backend

1. Cambiar en \`App.tsx\` la línea marcada con \`TODO\` para proteger rutas con el token real
2. \`Feed.tsx\` → sustituir \`MOCK_POSTS\` por \`GET /api/posts\`
3. \`ChatWindow\` / \`ConversationList\` → sustituir mocks por WebSocket o \`GET /api/messages\`
4. \`FriendsList\` → sustituir mock por \`GET /api/users/friends\`

---

## Scripts

| Comando | Descripción |
|---|---|
| \`npm run dev\` | Servidor de desarrollo en localhost:3000 |
| \`npm run build\` | Build de producción |
| \`npm run preview\` | Preview del build |
| \`npm run type-check\` | Verifica tipos sin compilar |
| \`npm run lint\` | Linter ESLint |
