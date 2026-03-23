#!/bin/bash
# ============================================================
# migrate.sh — Migración completa a TypeScript + estructura limpia
# Ejecutar desde la carpeta: frontend/
# ============================================================

set -e
echo "🚀 Iniciando migración a TypeScript..."
echo ""

# ────────────────────────────────────────────────────────────
# 1. CREAR ESTRUCTURA DE CARPETAS
# ────────────────────────────────────────────────────────────
echo "📁 Creando estructura de carpetas..."
mkdir -p src/types
mkdir -p src/constants
mkdir -p src/pages
mkdir -p src/components/layout
mkdir -p src/components/ui
mkdir -p src/components/feed
mkdir -p src/components/chat
mkdir -p src/components/filters

# ────────────────────────────────────────────────────────────
# 2. BORRAR ARCHIVOS ORIGINALES
# ────────────────────────────────────────────────────────────
echo "🗑️  Eliminando archivos originales..."
rm -f src/App.jsx
rm -f src/App.css
rm -f src/main.jsx
rm -f src/components/home/HomePage.jsx
rm -f src/components/auth/LoginPage.jsx
rm -f src/components/home/Feed/Feed.jsx
rm -f src/components/home/Feed/Post.jsx
rm -f src/components/home/Sidebar/Sidebar.jsx
rm -f src/components/chat/ChatView.jsx
rm -f src/components/chat/ChatWindow.jsx
rm -f src/components/chat/ConversationList.jsx
rm -f src/components/chat/MessageBubble.jsx
rm -f src/components/common/FilterDrawer.jsx
rm -f src/components/common/FriendsList.jsx
rm -f src/components/common/PostCard.jsx
rm -f src/components/common/PostSkeleton.jsx
rm -f src/components/common/SettingsModal.jsx
rm -f src/hooks/useAuth.js
rm -f src/hooks/useAuth.jsx
rm -f src/utils/theme.js
rm -f vite.config.js
# Borrar carpetas vacías antiguas
rmdir src/components/home/Feed 2>/dev/null || true
rmdir src/components/home/Sidebar 2>/dev/null || true
rmdir src/components/home 2>/dev/null || true
rmdir src/components/auth 2>/dev/null || true
rmdir src/components/common 2>/dev/null || true
rmdir src/components/chat 2>/dev/null || true

echo "✅ Archivos originales eliminados"
mkdir -p src/types src/constants src/pages src/utils src/hooks src/components/ui src/components/layout src/components/feed src/components/chat src/components/filters
echo ""

# ────────────────────────────────────────────────────────────
# 3. CONFIGS
# ────────────────────────────────────────────────────────────
echo "⚙️  Escribiendo configuración TypeScript..."

cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
EOF

cat > tsconfig.node.json << 'EOF'
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
EOF

cat > vite.config.ts << 'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
  },
});
EOF

cat > package.json << 'EOF'
{
  "name": "intragram-frontend",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.22.3",
    "axios": "^1.7.9"
  },
  "devDependencies": {
    "@types/node": "^20.11.24",
    "@types/react": "^18.3.1",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.4.2",
    "vite": "^5.4.11"
  }
}
EOF

# ────────────────────────────────────────────────────────────
# 4. TYPES
# ────────────────────────────────────────────────────────────
echo "🏷️  Creando tipos TypeScript..."

cat > src/types/models.ts << 'EOF'
export interface User {
  id?: number;
  login: string;
  avatar: string;
  level: number;
  lastSeen?: string;
  online?: boolean;
}

export interface Post {
  id: number;
  user: Pick<User, 'login' | 'level'>;
  content: string;
  time: string;
  likes: number;
  comments: number;
  liked: boolean;
}

export type MessageSender = 'me' | 'other';
export type MessageType = 'text' | 'audio';

export interface Message {
  id: number;
  sender: MessageSender;
  type?: MessageType;
  text?: string;
  duration?: string;
  timestamp: string;
  reactions?: string[];
}

export interface Conversation {
  id: number;
  user: User;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
}

export type FilterKey = 'reciente' | 'amigos' | 'seguidos' | 'trending' | 'perfil';
export type NavKey = 'home' | 'chat' | 'notifications';
export type ChatTab = 'mensajes' | 'solicitudes';
EOF

cat > src/types/props.ts << 'EOF'
import type { Conversation, FilterKey, Message, Post } from './models';

export interface PostCardProps {
  post: Post;
}

export interface MessageBubbleProps {
  message: Message;
  showTimestamp: boolean;
}

export interface ConversationListProps {
  selectedChat: Conversation | null;
  onSelectChat: (chat: Conversation) => void;
}

export interface ChatWindowProps {
  selectedChat: Conversation | null;
}

export interface SidebarProps {
  activeFilter: FilterKey;
  setActiveFilter: (filter: FilterKey) => void;
}

export interface FilterDrawerProps {
  activeFilter: FilterKey;
  setActiveFilter: (filter: FilterKey) => void;
  onClose: () => void;
}

export interface SettingsModalProps {
  onClose: () => void;
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export interface AvatarProps {
  login: string;
  size?: 'sm' | 'md' | 'lg';
  online?: boolean;
}

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'level' | 'notification' | 'status';
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export interface ModalProps {
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}
EOF

# ────────────────────────────────────────────────────────────
# 5. CONSTANTS
# ────────────────────────────────────────────────────────────
echo "📋 Creando constantes..."

cat > src/constants/routes.ts << 'EOF'
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  CHAT: '/chat',
  NOTIFICATIONS: '/notifications',
  PROFILE: '/profile/:login',
} as const;
EOF

cat > src/constants/mockData.ts << 'EOF'
import type { Conversation, Message, Post, User } from '@/types/models';

export const MOCK_CURRENT_USER: User = {
  login: 'petazz',
  avatar: 'P',
  level: 7,
};

export const MOCK_POSTS: Post[] = [
  {
    id: 1,
    user: { login: 'pperez', level: 8 },
    content: '¡Acabo de terminar ft_printf! Después de 3 semanas, por fin funciona al 100% 🎉 Si alguien necesita ayuda, aquí estoy.',
    time: 'hace 5 min',
    likes: 12,
    comments: 3,
    liked: false,
  },
  {
    id: 2,
    user: { login: 'mruiz', level: 5 },
    content: '¿Alguien me puede explicar cómo funciona Norminette? Me tiene completamente loco con las líneas de 80 caracteres...',
    time: 'hace 20 min',
    likes: 7,
    comments: 8,
    liked: false,
  },
  {
    id: 3,
    user: { login: 'agarcia', level: 12 },
    content: 'Push_swap con 3 instrucciones para 100 números ✅ El algoritmo de Turk optimizado funciona de maravilla.',
    time: 'hace 1 hora',
    likes: 34,
    comments: 15,
    liked: true,
  },
];

export const MOCK_FRIENDS: User[] = [
  { login: 'mruiz',   avatar: 'M', level: 5,  online: true },
  { login: 'agarcia', avatar: 'A', level: 12, online: true },
  { login: 'csmith',  avatar: 'C', level: 9,  online: true },
  { login: 'dperez',  avatar: 'D', level: 3,  online: true },
];

export const MOCK_CONVERSATIONS: Conversation[] = [
  { id: 1, user: { login: 'dperez',    avatar: 'D', level: 3,  lastSeen: '2 min'  }, lastMessage: 'Oye el push_swap me está matando 😭',          timestamp: '2 min',  unread: true  },
  { id: 2, user: { login: 'jgarcia',   avatar: 'J', level: 7,  lastSeen: '15 min' }, lastMessage: 'Ya terminaste libft? Necesito ayuda con ft_split', timestamp: '15 min', unread: true  },
  { id: 3, user: { login: 'mlopez',    avatar: 'M', level: 5,  lastSeen: '1 h'    }, lastMessage: 'Vamos a la cantina en 10?',                   timestamp: '1 h',    unread: false },
  { id: 4, user: { login: 'atorre',    avatar: 'A', level: 9,  lastSeen: '3 h'    }, lastMessage: 'El exam de C03 fue brutal tío',               timestamp: '3 h',    unread: false },
  { id: 5, user: { login: 'rblanco',   avatar: 'R', level: 4,  lastSeen: '5 h'    }, lastMessage: 'rblanco ha enviado un archivo adjunto.',       timestamp: '5 h',    unread: true  },
  { id: 6, user: { login: 'cnavarro',  avatar: 'C', level: 11, lastSeen: '1 d'    }, lastMessage: 'Thx por la corrección!',                      timestamp: '1 d',    unread: false },
  { id: 7, user: { login: 'lmartinez', avatar: 'L', level: 6,  lastSeen: '2 d'    }, lastMessage: 'lmartinez ha enviado un mensaje de voz.',     timestamp: '2 d',    unread: true  },
  { id: 8, user: { login: 'sruiz',     avatar: 'S', level: 8,  lastSeen: '3 d'    }, lastMessage: 'Minitalk funciona perfecto, gracias!',         timestamp: '3 d',    unread: false },
];

export const MOCK_MESSAGES: Message[] = [
  { id: 1, sender: 'other', text: 'Tío, me estoy volviendo loco con malloc y free',              timestamp: '14 mar. 2026, 18:23' },
  { id: 2, sender: 'other', text: 'Cada vez que corro valgrind me salen leaks por todos lados 😭', timestamp: '14 mar. 2026, 18:23', reactions: ['😂', '💀'] },
  { id: 3, sender: 'me',    text: 'jajaja tranqui',                                               timestamp: '14 mar. 2026, 18:25' },
  { id: 4, sender: 'me',    text: 'revisa que hagas free de todo lo que malloceas',               timestamp: '14 mar. 2026, 18:25' },
  { id: 5, sender: 'me',    text: 'y también del return de strdup/split',                         timestamp: '14 mar. 2026, 18:26' },
  { id: 6, sender: 'other', type: 'audio', duration: '0:15',                                      timestamp: '14 mar. 2026, 19:02' },
  { id: 7, sender: 'me',    type: 'audio', duration: '0:08',                                      timestamp: '14 mar. 2026, 19:10' },
  { id: 8, sender: 'other', text: 'Vale, ya lo pillé! Era que no liberaba el array en ft_split',  timestamp: '14 mar. 2026, 19:45' },
  { id: 9, sender: 'other', text: 'Gracias crack 🙏',                                             timestamp: '14 mar. 2026, 19:45', reactions: ['🔥', '💪'] },
];

export const FILTERS = [
  { key: 'reciente' as const, label: 'Reciente',   icon: '🕐', desc: 'Publicaciones más nuevas primero' },
  { key: 'amigos'   as const, label: 'Amigos',     icon: '👥', desc: 'Solo de personas que sigues' },
  { key: 'seguidos' as const, label: 'Seguidos',   icon: '⭐', desc: 'Tus favoritos' },
  { key: 'trending' as const, label: 'Tendencias', icon: '🔥', desc: 'Lo más popular ahora mismo' },
  { key: 'perfil'   as const, label: 'Mi perfil',  icon: '👤', desc: 'Tus propias publicaciones' },
];
EOF

# ────────────────────────────────────────────────────────────
# 6. UTILS
# ────────────────────────────────────────────────────────────
echo "🔧 Creando utilidades..."

cat > src/utils/theme.ts << 'EOF'
const GRADIENT_COLORS = [
  '#00BABC, #0891B2',
  '#F472B6, #EC4899',
  '#FB923C, #F97316',
  '#A78BFA, #8B5CF6',
  '#34D399, #10B981',
  '#FBBF24, #F59E0B',
];

export const getGradient = (login: string): string => {
  const hash = login.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return GRADIENT_COLORS[hash % GRADIENT_COLORS.length];
};
EOF

cat > src/utils/formatters.ts << 'EOF'
export const formatTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diff < 60)   return 'ahora mismo';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  return `hace ${Math.floor(diff / 86400)} d`;
};

export const truncate = (str: string, maxLength: number): string =>
  str.length > maxLength ? `${str.slice(0, maxLength)}...` : str;
EOF

# ────────────────────────────────────────────────────────────
# 7. HOOKS
# ────────────────────────────────────────────────────────────
echo "🪝 Creando hooks..."

cat > src/hooks/useAuth.ts << 'EOF'
import { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const useAuthState = () => {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');

    if (urlToken) {
      localStorage.setItem('auth_token', urlToken);
      setToken(urlToken);
      params.delete('token');
      const newUrl = window.location.origin + window.location.pathname +
        (params.toString() ? `?${params.toString()}` : '');
      window.history.replaceState({}, '', newUrl);
    } else {
      const saved = localStorage.getItem('auth_token');
      if (saved) setToken(saved);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
  };

  return { token, isAuthenticated: !!token, logout };
};
EOF

cat > src/hooks/usePost.ts << 'EOF'
import { useState } from 'react';

export const usePost = (initialLiked: boolean, initialLikes: number) => {
  const [liked, setLiked]               = useState(initialLiked);
  const [likes, setLikes]               = useState(initialLikes);
  const [saved, setSaved]               = useState(false);
  const [animatingLike, setAnimatingLike] = useState(false);
  const [animatingSave, setAnimatingSave] = useState(false);

  const handleLike = () => {
    setAnimatingLike(true);
    setLiked(prev => !prev);
    setLikes(prev => liked ? prev - 1 : prev + 1);
    setTimeout(() => setAnimatingLike(false), 400);
  };

  const handleSave = () => {
    setAnimatingSave(true);
    setSaved(prev => !prev);
    setTimeout(() => setAnimatingSave(false), 400);
  };

  return { liked, likes, saved, animatingLike, animatingSave, handleLike, handleSave };
};
EOF

# ────────────────────────────────────────────────────────────
# 8. COMPONENTES UI
# ────────────────────────────────────────────────────────────
echo "🎨 Creando componentes UI reutilizables..."

cat > src/components/ui/Button.css << 'EOF'
.btn {
  @apply inline-flex items-center justify-center font-semibold rounded-lg
         transition-all duration-200 active:scale-95 disabled:opacity-30
         disabled:cursor-not-allowed;
}
.btn-sm  { @apply px-3 py-1.5 text-xs; }
.btn-md  { @apply px-4 py-2 text-sm; }
.btn-lg  { @apply px-6 py-2.5 text-base; }

.btn-primary {
  @apply btn bg-ft-cyan text-black
         hover:bg-ft-cyan-light hover:shadow-ft-glow-sm
         hover:-translate-y-0.5 btn-ripple;
}
.btn-secondary {
  @apply btn bg-ft-hover text-ft-text border border-ft-border
         hover:border-ft-cyan/40 hover:text-white;
}
.btn-outline {
  @apply btn border border-ft-cyan text-ft-cyan
         hover:bg-ft-cyan/10;
}
.btn-ghost {
  @apply btn text-ft-muted hover:text-white hover:bg-ft-hover;
}
EOF

cat > src/components/ui/Button.tsx << 'EOF'
import './Button.css';
import type { ButtonProps } from '@/types/props';

export const Button = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}: ButtonProps) => (
  <button
    className={`btn btn-${variant} btn-${size} ${className}`}
    {...props}
  >
    {children}
  </button>
);
EOF

cat > src/components/ui/Avatar.css << 'EOF'
.avatar        { @apply rounded-full flex items-center justify-center font-bold text-black uppercase flex-shrink-0; }
.avatar-sm     { @apply w-7 h-7 text-xs; }
.avatar-md     { @apply w-9 h-9 text-xs; }
.avatar-lg     { @apply w-12 h-12 text-sm; }
.avatar-online { @apply absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-ft-card rounded-full; }
EOF

cat > src/components/ui/Avatar.tsx << 'EOF'
import './Avatar.css';
import { getGradient } from '@/utils/theme';
import type { AvatarProps } from '@/types/props';

export const Avatar = ({ login, size = 'md', online }: AvatarProps) => (
  <div className="relative flex-shrink-0">
    <div
      className={`avatar avatar-${size}`}
      style={{ background: `linear-gradient(135deg, ${getGradient(login)})` }}
    >
      {login[0]}
    </div>
    {online && <span className="avatar-online" />}
  </div>
);
EOF

cat > src/components/ui/Badge.tsx << 'EOF'
import type { BadgeProps } from '@/types/props';

export const Badge = ({ children, variant = 'level' }: BadgeProps) => {
  const styles = {
    level:        'bg-ft-cyan/10 text-ft-cyan border border-ft-cyan/20',
    notification: 'bg-red-500 text-white',
    status:       'bg-green-500/20 text-green-400 border border-green-500/30',
  };

  return (
    <span className={`text-xs px-1.5 py-0.5 rounded-md font-semibold ${styles[variant]}`}>
      {children}
    </span>
  );
};
EOF

cat > src/components/ui/Input.css << 'EOF'
.input-base {
  @apply w-full bg-ft-hover border border-ft-border text-white text-sm
         rounded-xl px-3.5 py-2.5 placeholder-ft-muted
         focus:outline-none focus:border-ft-cyan/50
         transition-all duration-200;
}
.input-with-icon { @apply pl-10; }
.input-wrapper   { @apply relative; }
.input-icon      { @apply absolute left-3 top-1/2 -translate-y-1/2 text-ft-muted pointer-events-none; }
EOF

cat > src/components/ui/Input.tsx << 'EOF'
import './Input.css';
import type { InputProps } from '@/types/props';

export const Input = ({ icon, className = '', ...props }: InputProps) => (
  <div className="input-wrapper">
    {icon && <span className="input-icon">{icon}</span>}
    <input
      className={`input-base ${icon ? 'input-with-icon' : ''} ${className}`}
      {...props}
    />
  </div>
);
EOF

cat > src/components/ui/Card.tsx << 'EOF'
import type { CardProps } from '@/types/props';

export const Card = ({ children, className = '', hover = false }: CardProps) => (
  <div className={`
    bg-ft-card border border-ft-border rounded-2xl
    ${hover ? 'hover:border-ft-cyan/20 transition-all duration-200' : ''}
    ${className}
  `}>
    {children}
  </div>
);
EOF

cat > src/components/ui/Modal.css << 'EOF'
.modal-overlay {
  @apply fixed inset-0 bg-black/80 backdrop-blur-sm
         flex items-center justify-center z-50 px-4 animate-fade-in-up;
}
.modal-content {
  @apply bg-ft-card border border-ft-border rounded-2xl p-6 w-full max-w-md shadow-2xl;
}
EOF

cat > src/components/ui/Modal.tsx << 'EOF'
import './Modal.css';
import type { ModalProps } from '@/types/props';
import { Button } from './Button';

export const Modal = ({ onClose, children, title }: ModalProps) => (
  <div className="modal-overlay">
    <div className="modal-content">
      {title && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-bold text-white">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="w-8 h-8 p-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>
      )}
      {children}
    </div>
  </div>
);
EOF

# ────────────────────────────────────────────────────────────
# 9. COMPONENTES LAYOUT
# ────────────────────────────────────────────────────────────
echo "📐 Creando componentes de layout..."

cat > src/components/layout/Sidebar.css << 'EOF'
.sidebar {
  @apply group w-14 hover:w-48 h-screen sticky top-0
         bg-ft-card border-r border-ft-border
         flex flex-col py-3
         transition-all duration-300 ease-spring
         overflow-hidden flex-shrink-0;
}
.sidebar-item {
  @apply relative flex items-center gap-3 w-full px-2 py-2.5 rounded-xl
         transition-all duration-200;
}
.sidebar-item--active  { @apply bg-ft-cyan/15 text-ft-cyan; }
.sidebar-item--default { @apply text-ft-muted hover:bg-ft-hover hover:text-ft-text; }
.sidebar-item-label {
  @apply text-sm font-semibold whitespace-nowrap
         opacity-0 group-hover:opacity-100
         max-w-0 group-hover:max-w-xs
         overflow-hidden transition-all duration-300;
}
EOF

cat > src/components/layout/Sidebar.tsx << 'EOF'
import './Sidebar.css';
import { FILTERS } from '@/constants/mockData';
import type { SidebarProps } from '@/types/props';

export const Sidebar = ({ activeFilter, setActiveFilter }: SidebarProps) => (
  <aside className="sidebar">
    <div className="flex items-center justify-center w-14 h-10 mb-3 text-ft-muted">
      <svg className="w-4 h-4 transition-transform duration-300 group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </div>
    <div className="w-8 border-t border-ft-border mx-auto mb-2" />
    <nav className="flex flex-col gap-1 px-2">
      {FILTERS.map((f, i) => (
        <div key={f.key}>
          {i === 1 && <div className="w-full border-t border-ft-border my-1.5" />}
          <button
            onClick={() => setActiveFilter(f.key)}
            className={`sidebar-item ${activeFilter === f.key ? 'sidebar-item--active' : 'sidebar-item--default'}`}
          >
            {activeFilter === f.key && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-ft-cyan rounded-r-full" />
            )}
            <span className="text-base flex-shrink-0 w-5 text-center">{f.icon}</span>
            <span className="sidebar-item-label">{f.label}</span>
          </button>
        </div>
      ))}
    </nav>
  </aside>
);
EOF

cat > src/components/layout/FriendsList.css << 'EOF'
.friends-list {
  @apply w-64 h-screen sticky top-0
         bg-ft-card border-l border-ft-border
         p-4 overflow-y-auto flex-shrink-0
         flex flex-col;
}
.friend-item {
  @apply flex items-center space-x-2.5 p-2 rounded-xl
         hover:bg-ft-hover hover:shadow-ft-glow-sm hover:border-ft-cyan/20
         border border-transparent
         transition-all duration-200 cursor-pointer group;
}
EOF

cat > src/components/layout/FriendsList.tsx << 'EOF'
import './FriendsList.css';
import { MOCK_FRIENDS } from '@/constants/mockData';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';

export const FriendsList = () => (
  <aside className="friends-list">
    <div>
      <h3 className="text-xs font-bold text-ft-muted uppercase tracking-wider mb-3">
        En línea <span className="text-ft-cyan ml-1">{MOCK_FRIENDS.length}</span>
      </h3>
      <ul className="space-y-2">
        {MOCK_FRIENDS.map((friend) => (
          <li key={friend.login} className="friend-item">
            <Avatar login={friend.login} size="md" online={friend.online} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate group-hover:text-ft-cyan transition-colors">
                {friend.login}
              </p>
              <Badge variant="level">Lvl {friend.level}</Badge>
            </div>
            <svg className="w-4 h-4 text-ft-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </li>
        ))}
      </ul>
    </div>
    <div className="mt-auto pt-6 border-t border-ft-border">
      <p className="text-[10px] text-ft-muted text-center">© 2026 Intragram · 42 Network</p>
    </div>
  </aside>
);
EOF

cat > src/components/layout/Navbar.css << 'EOF'
.navbar {
  @apply bg-ft-card/60 backdrop-blur-xl border-b border-ft-border
         px-5 py-2.5 items-center justify-between sticky top-0 z-20;
}
.navbar-logo   { @apply text-ft-cyan font-black text-xl tracking-tight flex-shrink-0; }
.navbar-search {
  @apply flex-1 flex items-center bg-ft-hover border border-ft-border
         focus-within:border-ft-cyan/50 rounded-xl px-3 py-1.5
         transition-all duration-200;
}
.nav-btn {
  @apply relative flex items-center space-x-1.5 px-4 py-2 rounded-lg
         text-xs font-semibold transition-all duration-200;
}
.nav-btn--active  { @apply bg-ft-cyan text-black shadow-ft-glow-sm scale-[1.02]; }
.nav-btn--default { @apply text-ft-muted hover:text-white hover:bg-ft-faint; }
EOF

cat > src/components/layout/Navbar.tsx << 'EOF'
import './Navbar.css';
import type { NavKey } from '@/types/models';
import { Badge } from '@/components/ui/Badge';
import { MOCK_CURRENT_USER } from '@/constants/mockData';
import { NavIcon } from './NavIcon';

const NAV_ITEMS: { key: NavKey; label: string }[] = [
  { key: 'home',          label: 'Home' },
  { key: 'chat',          label: 'Chat' },
  { key: 'notifications', label: 'Notifs' },
];

interface NavbarProps {
  activeNav: NavKey;
  setActiveNav: (nav: NavKey) => void;
  search: string;
  setSearch: (s: string) => void;
  onSettingsOpen: () => void;
}

export const Navbar = ({ activeNav, setActiveNav, search, setSearch, onSettingsOpen }: NavbarProps) => (
  <header className="navbar hidden md:flex">
    {/* Logo + buscador */}
    <div className="flex items-center space-x-4 w-64 lg:w-72">
      <span className="navbar-logo">Intra<span className="text-white">gram</span></span>
      <div className="navbar-search">
        <svg className="w-3.5 h-3.5 text-ft-muted mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Buscar perfil..."
          className="bg-transparent text-xs text-white placeholder-ft-muted focus:outline-none w-full"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
    </div>

    {/* Nav central */}
    <nav className="flex items-center bg-ft-hover border border-ft-border rounded-xl p-1 gap-1">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.key}
          onClick={() => setActiveNav(item.key)}
          className={`nav-btn ${activeNav === item.key ? 'nav-btn--active' : 'nav-btn--default'}`}
        >
          <NavIcon navKey={item.key} />
          <span className="hidden lg:inline">{item.label}</span>
          {item.key === 'notifications' && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-badge">3</span>
          )}
        </button>
      ))}
    </nav>

    {/* Avatar + Ajustes */}
    <div className="flex items-center space-x-2 w-64 lg:w-72 justify-end">
      <div className="flex items-center space-x-2.5 bg-ft-hover border border-ft-border rounded-xl px-3 py-1.5">
        <div className="w-6 h-6 rounded-full bg-ft-cyan flex items-center justify-center text-xs font-bold text-black">
          {MOCK_CURRENT_USER.avatar}
        </div>
        <span className="text-xs font-medium text-ft-text hidden lg:inline">{MOCK_CURRENT_USER.login}</span>
        <Badge variant="level">Lvl {MOCK_CURRENT_USER.level}</Badge>
      </div>
      <button
        onClick={onSettingsOpen}
        className="w-9 h-9 rounded-xl bg-ft-hover border border-ft-border flex items-center justify-center text-ft-muted hover:text-ft-cyan hover:border-ft-cyan/40 transition-all duration-200 hover:rotate-45 active:scale-95"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </div>
  </header>
);
EOF

cat > src/components/layout/NavIcon.tsx << 'EOF'
import type { NavKey } from '@/types/models';

interface NavIconProps { navKey: NavKey; }

export const NavIcon = ({ navKey }: NavIconProps) => {
  if (navKey === 'home') return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
  if (navKey === 'chat') return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
};
EOF

cat > src/components/layout/BottomBar.css << 'EOF'
.bottom-bar {
  @apply md:hidden fixed bottom-0 left-0 right-0 z-30
         bg-ft-card/95 backdrop-blur-xl border-t border-ft-border
         flex items-center justify-around
         px-2 pt-2;
  padding-bottom: max(8px, env(safe-area-inset-bottom));
}
.bottom-bar-btn {
  @apply relative flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl
         transition-all duration-200;
}
.bottom-bar-btn--active  { @apply text-ft-cyan; }
.bottom-bar-btn--default { @apply text-ft-muted hover:text-ft-text; }
EOF

cat > src/components/layout/BottomBar.tsx << 'EOF'
import './BottomBar.css';
import type { NavKey } from '@/types/models';
import { NavIcon } from './NavIcon';

const NAV_ITEMS: { key: NavKey; label: string }[] = [
  { key: 'home',          label: 'Home' },
  { key: 'chat',          label: 'Chat' },
  { key: 'notifications', label: 'Notifs' },
];

interface BottomBarProps {
  activeNav: NavKey;
  setActiveNav: (nav: NavKey) => void;
  onFiltersOpen: () => void;
  onSettingsOpen: () => void;
}

export const BottomBar = ({ activeNav, setActiveNav, onFiltersOpen, onSettingsOpen }: BottomBarProps) => (
  <nav className="bottom-bar">
    {NAV_ITEMS.map((item) => (
      <button
        key={item.key}
        onClick={() => setActiveNav(item.key)}
        className={`bottom-bar-btn ${activeNav === item.key ? 'bottom-bar-btn--active' : 'bottom-bar-btn--default'}`}
      >
        {activeNav === item.key && (
          <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-ft-cyan" />
        )}
        <NavIcon navKey={item.key} />
        <span className="text-[10px] font-semibold">{item.label}</span>
        {item.key === 'notifications' && (
          <span className="absolute top-0 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-badge">3</span>
        )}
      </button>
    ))}

    <button onClick={onFiltersOpen} className="bottom-bar-btn bottom-bar-btn--default">
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
      </svg>
      <span className="text-[10px] font-semibold">Filtros</span>
    </button>

    <button onClick={onSettingsOpen} className="bottom-bar-btn bottom-bar-btn--default">
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <span className="text-[10px] font-semibold">Ajustes</span>
    </button>
  </nav>
);
EOF

# ────────────────────────────────────────────────────────────
# 10. COMPONENTES FEED
# ────────────────────────────────────────────────────────────
echo "📰 Creando componentes del feed..."

cat > src/components/feed/PostCard.css << 'EOF'
.post-card { @apply bg-ft-card border border-ft-border rounded-2xl p-5 mb-3 hover:border-ft-cyan/20 transition-all duration-200; }
.post-action-btn {
  @apply flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
         transition-all duration-150 active:scale-95 border;
}
.post-action-btn--like-active   { @apply bg-red-500/10 text-red-400 border-red-500/30; }
.post-action-btn--like-default  { @apply text-ft-muted hover:text-red-400 hover:bg-red-500/5 border-transparent; }
.post-action-btn--save-active   { @apply bg-ft-cyan/10 text-ft-cyan border-ft-cyan/30; }
.post-action-btn--save-default  { @apply text-ft-muted hover:text-ft-cyan hover:bg-ft-cyan/5 border-transparent; }
.post-action-btn--comment       { @apply text-ft-muted hover:text-ft-cyan hover:bg-ft-cyan/5 hover:border-ft-cyan/20 border-transparent; }
.post-action-btn--share         { @apply text-ft-muted hover:text-white hover:bg-ft-hover hover:border-ft-border border-transparent; }
EOF

cat > src/components/feed/PostCard.tsx << 'EOF'
import './PostCard.css';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { usePost } from '@/hooks/usePost';
import type { PostCardProps } from '@/types/props';

export const PostCard = ({ post }: PostCardProps) => {
  const { liked, likes, saved, animatingLike, animatingSave, handleLike, handleSave } = usePost(post.liked, post.likes);

  return (
    <article className="post-card">
      <div className="flex items-center space-x-3 mb-4">
        <Avatar login={post.user.login} size="md" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">
            {post.user.login}
            <span className="ml-2"><Badge variant="level">Lvl {post.user.level}</Badge></span>
          </p>
          <p className="text-xs text-ft-muted">{post.time}</p>
        </div>
        <button className="text-ft-muted hover:text-white transition-colors p-1 flex-shrink-0">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
      </div>

      <p className="text-sm text-ft-text leading-relaxed mb-4">{post.content}</p>

      <div className="flex items-center gap-3 pt-3 border-t border-ft-border">
        <button
          onClick={handleLike}
          className={`post-action-btn ${liked ? 'post-action-btn--like-active' : 'post-action-btn--like-default'}`}
        >
          <svg className={`w-3.5 h-3.5 ${liked ? 'fill-red-400' : ''} ${animatingLike ? 'animate-heartbeat' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span>{likes}</span>
        </button>

        <button className="post-action-btn post-action-btn--comment">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>{post.comments}</span>
        </button>

        <button
          onClick={handleSave}
          className={`post-action-btn ml-auto ${saved ? 'post-action-btn--save-active' : 'post-action-btn--save-default'}`}
        >
          <svg className={`w-3.5 h-3.5 ${saved ? 'fill-ft-cyan' : ''} ${animatingSave ? 'animate-heartbeat' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <span className="hidden sm:inline">{saved ? 'Guardado' : 'Guardar'}</span>
        </button>

        <button className="post-action-btn post-action-btn--share">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          <span className="hidden sm:inline">Compartir</span>
        </button>
      </div>
    </article>
  );
};
EOF

cat > src/components/feed/PostSkeleton.tsx << 'EOF'
export const PostSkeleton = () => (
  <div className="bg-ft-card border border-ft-border rounded-2xl p-5 mb-3 animate-pulse">
    <div className="flex items-center space-x-3 mb-4">
      <div className="w-9 h-9 rounded-full bg-ft-faint" />
      <div className="flex-1">
        <div className="h-3 w-24 bg-ft-faint rounded-full mb-2" />
        <div className="h-2 w-16 bg-ft-faint rounded-full" />
      </div>
    </div>
    <div className="space-y-2 mb-4">
      <div className="h-2.5 bg-ft-faint rounded-full w-full" />
      <div className="h-2.5 bg-ft-faint rounded-full w-4/5" />
      <div className="h-2.5 bg-ft-faint rounded-full w-3/5" />
    </div>
    <div className="flex gap-3 pt-3 border-t border-ft-border">
      <div className="h-6 w-14 bg-ft-faint rounded-lg" />
      <div className="h-6 w-14 bg-ft-faint rounded-lg" />
      <div className="h-6 w-20 bg-ft-faint rounded-lg ml-auto" />
    </div>
  </div>
);
EOF

cat > src/components/feed/CreatePost.tsx << 'EOF'
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MOCK_CURRENT_USER } from '@/constants/mockData';

const ATTACHMENT_BUTTONS = [
  { icon: '📷', label: 'Imagen' },
  { icon: '💻', label: 'Código' },
  { icon: '🏆', label: 'Logro' },
];

export const CreatePost = () => {
  const [postText, setPostText] = useState('');

  return (
    <div className="bg-ft-card border border-ft-border rounded-2xl p-4 mb-4 hover:border-ft-cyan/20 transition-all duration-200">
      <div className="flex items-start space-x-3">
        <div className="w-8 h-8 rounded-full bg-ft-cyan flex items-center justify-center font-bold text-xs text-black flex-shrink-0">
          {MOCK_CURRENT_USER.avatar}
        </div>
        <textarea
          className="flex-1 bg-transparent text-sm text-white placeholder-ft-muted focus:outline-none resize-none mt-1 leading-relaxed"
          placeholder="¿Qué estás aprendiendo hoy? Comparte con la comunidad 42..."
          rows={2}
          value={postText}
          onChange={(e) => setPostText(e.target.value)}
        />
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-ft-border">
        <div className="flex space-x-1">
          {ATTACHMENT_BUTTONS.map((btn) => (
            <button key={btn.label} className="flex items-center space-x-1.5 text-xs text-ft-muted hover:text-ft-cyan px-2 py-1.5 rounded-lg hover:bg-ft-cyan/5 border border-transparent hover:border-ft-cyan/20 transition-all duration-150 active:scale-95">
              <span>{btn.icon}</span>
              <span className="hidden sm:inline">{btn.label}</span>
            </button>
          ))}
        </div>
        <Button variant="primary" size="sm" disabled={!postText.trim()}>
          Publicar
        </Button>
      </div>
    </div>
  );
};
EOF

cat > src/components/feed/Feed.tsx << 'EOF'
import { MOCK_POSTS } from '@/constants/mockData';
import type { FilterKey } from '@/types/models';
import { CreatePost } from './CreatePost';
import { PostCard } from './PostCard';
import { PostSkeleton } from './PostSkeleton';

interface FeedProps {
  activeFilter: FilterKey;
  loading?: boolean;
}

const FRIENDS_LOGINS = ['mruiz', 'agarcia', 'csmith', 'dperez'];

const filterPosts = (filter: FilterKey) => {
  switch (filter) {
    case 'perfil':   return MOCK_POSTS.filter(p => p.user.login === 'petazz');
    case 'amigos':   return MOCK_POSTS.filter(p => FRIENDS_LOGINS.includes(p.user.login));
    case 'seguidos': return MOCK_POSTS.filter(p => p.user.level >= 10);
    default:         return MOCK_POSTS;
  }
};

export const Feed = ({ activeFilter, loading = false }: FeedProps) => {
  const posts = filterPosts(activeFilter);

  return (
    <div>
      <CreatePost />
      {loading
        ? Array.from({ length: 3 }).map((_, i) => <PostSkeleton key={i} />)
        : posts.map((post, i) => (
            <div key={post.id} className={`animate-fade-in-up-delay-${Math.min(i + 1, 3)}`}>
              <PostCard post={post} />
            </div>
          ))
      }
    </div>
  );
};
EOF

# ────────────────────────────────────────────────────────────
# 11. COMPONENTES CHAT
# ────────────────────────────────────────────────────────────
echo "💬 Creando componentes de chat..."

cat > src/components/chat/MessageBubble.tsx << 'EOF'
import type { MessageBubbleProps } from '@/types/props';

export const MessageBubble = ({ message, showTimestamp }: MessageBubbleProps) => {
  const isMe = message.sender === 'me';

  if (message.type === 'audio') {
    return (
      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-xs ${isMe ? 'bg-blue-600' : 'bg-ft-card border border-ft-border'} rounded-2xl px-4 py-2.5`}>
          <div className="flex items-center gap-3">
            <button className="flex-shrink-0">
              <svg className={`w-6 h-6 ${isMe ? 'text-white' : 'text-ft-text'}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            </button>
            <div className="flex-1 h-8 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full flex items-center px-2 gap-0.5">
                {Array.from({ length: 40 }).map((_, i) => (
                  <div key={i} className={`w-0.5 rounded-full ${isMe ? 'bg-white' : 'bg-ft-cyan'}`}
                    style={{ height: `${Math.floor(Math.random() * 70 + 30)}%` }} />
                ))}
              </div>
            </div>
            <span className={`text-xs ${isMe ? 'text-white/80' : 'text-ft-muted'} flex-shrink-0`}>
              {message.duration}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {showTimestamp && (
        <p className="text-xs text-ft-muted text-center mb-2">{message.timestamp}</p>
      )}
      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-sm ${isMe ? 'bg-blue-600' : 'bg-ft-card border border-ft-border'} rounded-2xl px-4 py-2.5`}>
          <p className={`text-sm ${isMe ? 'text-white' : 'text-ft-text'}`}>{message.text}</p>
          {message.reactions && (
            <div className="flex gap-1 mt-2">
              {message.reactions.map((emoji, i) => (
                <span key={i} className="text-base">{emoji}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
EOF

cat > src/components/chat/ConversationList.css << 'EOF'
.conversation-list { @apply w-96 h-full bg-ft-card border-r border-ft-border flex flex-col flex-shrink-0; }
.conv-tab {
  @apply flex-1 text-sm font-semibold py-2 rounded-lg transition-all;
}
.conv-tab--active  { @apply bg-ft-cyan/10 text-ft-cyan border border-ft-cyan/30; }
.conv-tab--default { @apply text-ft-muted hover:bg-ft-hover; }
.conv-item { @apply w-full flex items-start gap-3 p-4 hover:bg-ft-hover border-b border-ft-border/50 transition-all; }
.conv-item--selected { @apply bg-ft-hover; }
EOF

cat > src/components/chat/ConversationList.tsx << 'EOF'
import { useState } from 'react';
import './ConversationList.css';
import { MOCK_CONVERSATIONS } from '@/constants/mockData';
import { Avatar } from '@/components/ui/Avatar';
import { Input } from '@/components/ui/Input';
import type { ChatTab } from '@/types/models';
import type { ConversationListProps } from '@/types/props';

const SearchIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

export const ConversationList = ({ selectedChat, onSelectChat }: ConversationListProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab]     = useState<ChatTab>('mensajes');

  const filtered = MOCK_CONVERSATIONS.filter(c =>
    c.user.login.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className="conversation-list">
      <div className="p-4 border-b border-ft-border">
        <h2 className="text-lg font-bold text-white mb-4">Mensajes</h2>
        <Input icon={<SearchIcon />} placeholder="Buscar" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        <div className="flex gap-2 mt-4">
          {(['mensajes', 'solicitudes'] as ChatTab[]).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`conv-tab ${activeTab === tab ? 'conv-tab--active' : 'conv-tab--default'}`}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.map((conv) => (
          <button key={conv.id} onClick={() => onSelectChat(conv)}
            className={`conv-item ${selectedChat?.id === conv.id ? 'conv-item--selected' : ''}`}>
            <div className="relative flex-shrink-0">
              <Avatar login={conv.user.login} size="lg" />
              {conv.unread && <span className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 border-2 border-ft-card rounded-full" />}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center justify-between mb-1">
                <p className={`text-sm font-semibold truncate ${conv.unread ? 'text-white' : 'text-ft-text'}`}>{conv.user.login}</p>
                <span className="text-xs text-ft-muted flex-shrink-0 ml-2">{conv.timestamp}</span>
              </div>
              <p className={`text-xs truncate ${conv.unread ? 'text-white font-medium' : 'text-ft-muted'}`}>{conv.lastMessage}</p>
            </div>
            {conv.unread && <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2" />}
          </button>
        ))}
      </div>
    </aside>
  );
};
EOF

cat > src/components/chat/ChatWindow.css << 'EOF'
.chat-window        { @apply flex-1 flex flex-col bg-ft-bg; }
.chat-header        { @apply bg-ft-card/60 backdrop-blur-xl border-b border-ft-border px-5 py-3 flex items-center justify-between; }
.chat-messages      { @apply flex-1 overflow-y-auto p-5 space-y-3; }
.chat-input-area    { @apply bg-ft-card border-t border-ft-border px-5 py-3; }
.chat-input-wrapper { @apply flex-1 flex items-center bg-ft-hover border border-ft-border rounded-full px-4 py-2.5 focus-within:border-ft-cyan/50 transition-colors; }
.chat-empty         { @apply flex-1 flex flex-col items-center justify-center bg-ft-bg; }
EOF

cat > src/components/chat/ChatWindow.tsx << 'EOF'
import { useState } from 'react';
import './ChatWindow.css';
import { MOCK_MESSAGES } from '@/constants/mockData';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import type { ChatWindowProps } from '@/types/props';
import { MessageBubble } from './MessageBubble';

export const ChatWindow = ({ selectedChat }: ChatWindowProps) => {
  const [messageText, setMessageText] = useState('');

  if (!selectedChat) {
    return (
      <div className="chat-empty">
        <div className="w-24 h-24 rounded-full bg-ft-card border-2 border-ft-border flex items-center justify-center mb-4">
          <svg className="w-12 h-12 text-ft-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Tus mensajes</h3>
        <p className="text-ft-muted text-sm text-center max-w-sm">Envía fotos y mensajes privados a un amigo o grupo</p>
        <Button variant="primary" size="md" className="mt-6">Enviar mensaje</Button>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="flex items-center gap-3">
          <Avatar login={selectedChat.user.login} size="md" />
          <div>
            <p className="text-sm font-semibold text-white">{selectedChat.user.login}</p>
            <p className="text-xs text-ft-muted">activo {selectedChat.user.lastSeen}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {[
            "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
            "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z",
          ].map((d, i) => (
            <button key={i} className="p-2 hover:bg-ft-hover rounded-lg transition-colors">
              <svg className="w-5 h-5 text-ft-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
              </svg>
            </button>
          ))}
        </div>
      </div>

      <div className="chat-messages">
        {MOCK_MESSAGES.map((msg, idx) => (
          <MessageBubble key={msg.id} message={msg}
            showTimestamp={idx === 0 || MOCK_MESSAGES[idx - 1].timestamp !== msg.timestamp} />
        ))}
      </div>

      <div className="chat-input-area">
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-ft-hover rounded-lg transition-colors flex-shrink-0">
            <svg className="w-5 h-5 text-ft-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <div className="chat-input-wrapper">
            <input type="text" placeholder="Envía un mensaje..." value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="flex-1 bg-transparent text-sm text-white placeholder-ft-muted focus:outline-none" />
          </div>
          <button className="p-2.5 bg-ft-cyan hover:bg-ft-cyan-light rounded-full transition-all hover:shadow-ft-glow-sm active:scale-95 flex-shrink-0">
            <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
EOF

# ────────────────────────────────────────────────────────────
# 12. COMPONENTES FILTERS
# ────────────────────────────────────────────────────────────
echo "🔽 Creando FilterDrawer y SettingsModal..."

cat > src/components/filters/FilterDrawer.css << 'EOF'
.filter-drawer-overlay { @apply fixed inset-0 z-40 md:hidden; }
.filter-drawer-bg      { @apply absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in-up; }
.filter-drawer-panel {
  @apply absolute bottom-0 left-0 right-0
         bg-ft-card border-t border-ft-border rounded-t-2xl p-5 animate-fade-in-up;
  padding-bottom: max(20px, env(safe-area-inset-bottom));
}
.filter-item {
  @apply flex items-center gap-4 px-4 py-3 rounded-xl text-left
         transition-all duration-200 active:scale-[0.98] border;
}
.filter-item--active  { @apply bg-ft-cyan/15 border-ft-cyan/30 text-ft-cyan; }
.filter-item--default { @apply bg-ft-hover border-transparent text-ft-text hover:border-ft-border; }
EOF

cat > src/components/filters/FilterDrawer.tsx << 'EOF'
import './FilterDrawer.css';
import { FILTERS } from '@/constants/mockData';
import type { FilterDrawerProps } from '@/types/props';

export const FilterDrawer = ({ activeFilter, setActiveFilter, onClose }: FilterDrawerProps) => (
  <div className="filter-drawer-overlay" onClick={onClose}>
    <div className="filter-drawer-bg" />
    <div className="filter-drawer-panel" onClick={(e) => e.stopPropagation()}>
      <div className="w-10 h-1 bg-ft-faint rounded-full mx-auto mb-5" />
      <h3 className="text-white font-bold text-base mb-1">Filtrar publicaciones</h3>
      <p className="text-ft-muted text-xs mb-4">Elige cómo ordenar tu feed</p>
      <div className="flex flex-col gap-2">
        {FILTERS.map((f) => (
          <button key={f.key} onClick={() => { setActiveFilter(f.key); onClose(); }}
            className={`filter-item ${activeFilter === f.key ? 'filter-item--active' : 'filter-item--default'}`}>
            <span className="text-2xl flex-shrink-0">{f.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{f.label}</p>
              <p className="text-xs text-ft-muted mt-0.5">{f.desc}</p>
            </div>
            {activeFilter === f.key && (
              <svg className="w-5 h-5 text-ft-cyan flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>
  </div>
);
EOF

cat > src/components/filters/SettingsModal.tsx << 'EOF'
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MOCK_CURRENT_USER } from '@/constants/mockData';
import type { SettingsModalProps } from '@/types/props';

const FORM_FIELDS = [
  { label: 'Nombre de usuario', type: 'text',     placeholder: 'tu_login_42',       defaultValue: MOCK_CURRENT_USER.login },
  { label: 'Email',             type: 'email',    placeholder: 'tu@student.42.fr',  defaultValue: `${MOCK_CURRENT_USER.login}@student.42.fr` },
  { label: 'Nueva contraseña',  type: 'password', placeholder: '••••••••',          defaultValue: '' },
];

export const SettingsModal = ({ onClose }: SettingsModalProps) => (
  <Modal onClose={onClose} title="Configuración">
    <p className="text-xs text-ft-muted -mt-4 mb-6">Gestiona tu perfil y preferencias</p>

    <div className="flex items-center gap-4 p-4 bg-ft-hover rounded-xl border border-ft-border mb-5">
      <div className="w-12 h-12 rounded-2xl bg-ft-cyan flex items-center justify-center text-lg font-black text-black shadow-ft-glow-sm">
        {MOCK_CURRENT_USER.avatar}
      </div>
      <div>
        <p className="text-sm font-semibold text-white">{MOCK_CURRENT_USER.login}</p>
        <button className="text-xs text-ft-cyan hover:text-ft-cyan-light transition-colors mt-0.5">
          Cambiar avatar
        </button>
      </div>
    </div>

    <div className="space-y-3.5">
      {FORM_FIELDS.map((field) => (
        <div key={field.label}>
          <label className="block text-xs font-semibold text-ft-muted mb-1.5 uppercase tracking-wide">
            {field.label}
          </label>
          <Input type={field.type} placeholder={field.placeholder} defaultValue={field.defaultValue} />
        </div>
      ))}
    </div>

    <div className="flex gap-2.5 mt-6">
      <Button variant="secondary" size="md" className="flex-1" onClick={onClose}>Cancelar</Button>
      <Button variant="primary"   size="md" className="flex-1">Guardar cambios</Button>
    </div>
  </Modal>
);
EOF

# ────────────────────────────────────────────────────────────
# 13. PAGES
# ────────────────────────────────────────────────────────────
echo "📄 Creando páginas..."

cat > src/pages/ChatPage.tsx << 'EOF'
import { useState } from 'react';
import { ConversationList } from '@/components/chat/ConversationList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import type { Conversation } from '@/types/models';

const ChatPage = () => {
  const [selectedChat, setSelectedChat] = useState<Conversation | null>(null);

  return (
    <div className="flex h-full">
      <ConversationList selectedChat={selectedChat} onSelectChat={setSelectedChat} />
      <ChatWindow selectedChat={selectedChat} />
    </div>
  );
};

export default ChatPage;
EOF

cat > src/pages/NotificationsPage.tsx << 'EOF'
const NotificationsPage = () => (
  <div className="flex flex-col items-center justify-center h-64">
    <div className="w-16 h-16 rounded-2xl bg-ft-card border border-ft-border flex items-center justify-center mb-4">
      <span className="text-2xl">🔔</span>
    </div>
    <p className="text-white font-semibold">Notificaciones</p>
    <p className="text-ft-muted text-sm mt-1">Estás al día</p>
  </div>
);

export default NotificationsPage;
EOF

cat > src/pages/HomePage.tsx << 'EOF'
import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomBar } from '@/components/layout/BottomBar';
import { FriendsList } from '@/components/layout/FriendsList';
import { Feed } from '@/components/feed/Feed';
import { FilterDrawer } from '@/components/filters/FilterDrawer';
import { SettingsModal } from '@/components/filters/SettingsModal';
import type { FilterKey, NavKey } from '@/types/models';
import ChatPage from './ChatPage';
import NotificationsPage from './NotificationsPage';

const HomePage = () => {
  const [activeNav,    setActiveNav]    = useState<NavKey>('home');
  const [activeFilter, setActiveFilter] = useState<FilterKey>('reciente');
  const [showSettings, setShowSettings] = useState(false);
  const [showFilters,  setShowFilters]  = useState(false);
  const [search,       setSearch]       = useState('');

  return (
    <div className="min-h-screen bg-ft-bg text-ft-text flex flex-col">
      {/* Navbar desktop */}
      <Navbar
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        search={search}
        setSearch={setSearch}
        onSettingsOpen={() => setShowSettings(true)}
      />

      {/* Navbar móvil superior */}
      <header className="flex md:hidden bg-ft-card/60 backdrop-blur-xl border-b border-ft-border px-4 py-3 items-center justify-between sticky top-0 z-20">
        <span className="text-ft-cyan font-black text-lg">Intra<span className="text-white">gram</span></span>
        <div className="flex-1 mx-3 flex items-center bg-ft-hover border border-ft-border focus-within:border-ft-cyan/50 rounded-xl px-3 py-2 transition-all duration-200">
          <svg className="w-3.5 h-3.5 text-ft-muted mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Buscar..." className="bg-transparent text-xs text-white placeholder-ft-muted focus:outline-none w-full"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button onClick={() => setShowSettings(true)} className="w-8 h-8 rounded-full bg-ft-cyan flex items-center justify-center text-xs font-bold text-black flex-shrink-0">
          P
        </button>
      </header>

      {/* Cuerpo */}
      <div className="flex flex-1 min-h-0 pb-20 md:pb-0">
        {activeNav !== 'chat' && (
          <div className="hidden md:block flex-shrink-0">
            <Sidebar activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
          </div>
        )}

        <main className="flex-1 overflow-y-auto min-w-0">
          {activeNav === 'chat' && <div className="h-full"><ChatPage /></div>}
          {activeNav !== 'chat' && (
            <div className="py-4 md:py-6 px-3 md:px-4">
              <div className="max-w-xl mx-auto">
                <div key={activeNav} className="animate-page-switch">
                  {activeNav === 'home'          && <Feed activeFilter={activeFilter} />}
                  {activeNav === 'notifications' && <NotificationsPage />}
                </div>
              </div>
            </div>
          )}
        </main>

        {activeNav !== 'chat' && (
          <div className="hidden lg:block flex-shrink-0">
            <FriendsList />
          </div>
        )}
      </div>

      {/* Bottom bar móvil */}
      <BottomBar
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        onFiltersOpen={() => setShowFilters(true)}
        onSettingsOpen={() => setShowSettings(true)}
      />

      {showFilters  && <FilterDrawer activeFilter={activeFilter} setActiveFilter={setActiveFilter} onClose={() => setShowFilters(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
};

export default HomePage;
EOF

cat > src/pages/LoginPage.tsx << 'EOF'
const LoginPage = () => (
  <div className="min-h-screen bg-ft-bg flex items-center justify-center px-4">
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black text-ft-cyan mb-2">
          Intra<span className="text-white">gram</span>
        </h1>
        <p className="text-ft-muted text-sm">La red social de la comunidad 42</p>
      </div>
      <div className="bg-ft-card border border-ft-border rounded-2xl p-6">
        <a
          href={`${import.meta.env.VITE_API_URL ?? ''}/auth/42`}
          className="flex items-center justify-center gap-3 w-full bg-ft-cyan hover:bg-ft-cyan-light text-black font-bold py-3 rounded-xl transition-all duration-200 hover:shadow-ft-glow active:scale-[0.98]"
        >
          <span className="text-lg">🎓</span>
          Entrar con 42
        </a>
        <p className="text-xs text-ft-muted text-center mt-4">
          Solo para estudiantes de la red 42
        </p>
      </div>
    </div>
  </div>
);

export default LoginPage;
EOF

# ────────────────────────────────────────────────────────────
# 14. APP + MAIN
# ────────────────────────────────────────────────────────────
echo "🔌 Creando App.tsx y main.tsx..."

cat > src/App.tsx << 'EOF'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthContext, useAuthState } from '@/hooks/useAuth';
import { ROUTES } from '@/constants/routes';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';

const App = () => {
  const auth = useAuthState();

  return (
    <AuthContext.Provider value={auth}>
      <BrowserRouter>
        <Routes>
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          <Route
            path={ROUTES.HOME}
            element={auth.isAuthenticated ? <HomePage /> : <HomePage />}
            // TODO: cuando el backend esté listo, cambiar a:
            // element={auth.isAuthenticated ? <HomePage /> : <Navigate to={ROUTES.LOGIN} />}
          />
          <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
};

export default App;
EOF

cat > src/main.tsx << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
EOF

# ────────────────────────────────────────────────────────────
# 15. INDEX.CSS — añadir clases globales de botones
# ────────────────────────────────────────────────────────────
echo "🎨 Actualizando index.css con clases globales..."

cat >> src/index.css << 'EOF'

/* ===== GLOBAL BUTTON UTILITIES ===== */
@layer components {
  .btn-ripple {
    position: relative;
    overflow: hidden;
  }
  .btn-ripple::after {
    content: '';
    position: absolute;
    inset: 0;
    margin: auto;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: rgba(255,255,255,0.3);
    transform: scale(0);
    opacity: 0;
  }
  .btn-ripple:active::after {
    animation: ripple 0.5s ease-out;
  }
}
EOF

echo ""
echo "✅ ¡Migración completada!"
echo ""
echo "📦 Ahora ejecuta:"
echo "   npm install"
echo "   npm run dev"
echo ""
echo "🔍 Para verificar tipos:"
echo "   npm run type-check"
