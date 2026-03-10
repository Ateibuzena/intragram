// boton crear nuevo mensaje en barra de tareas

// boton crear nuevo mensaje en feed principa del chat

// header con foto perfil de destinatario, nombre y boton de volver atras

// barra lateral fija con lista de conversaciones (con foto perfil y nombre del destinatario)

// caja de busqueda para buscar conversaciones por nombre de destinatario
// filtro de mensajes (de gente que sigo)
// filtro de mensajes de gente que no sigo

/*import Taskbar from './components/Taskbar.tsx'

export default function Chat() {
    return (
    
        <div className="chat-page flex h-screen">
            <Taskbar />
            <div className="flex-1 bg-white p-4">*/
                {/* Aquí iría el contenido del chat */}
            /*</div>
        </div>
    );
}*/

/**
 * Chat.tsx — Instagram DM Clone
 * Requiere: React + Vite + TypeScript
 *
 * ⚠️ IMPORTANTE — añade esto en tu src/index.css:
 *   html, body, #root {
 *     background: #000 !important;
 *     height: 100%;
 *     margin: 0;
 *     padding: 0;
 *     color-scheme: dark;
 *   }
 */

import { useState } from "react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Story {
  id: string;
  label: string;
  avatar: string;
  isOwn?: boolean;
  note?: string;
}

interface Conversation {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  isUnread?: boolean;
  isVerified?: boolean;
  isBold?: boolean;
}

// ─── Datos mock ───────────────────────────────────────────────────────────────

const STORIES: Story[] = [
  { id: "own", label: "Tu nota", avatar: "https://i.pravatar.cc/56?img=47", isOwn: true, note: "¿Qué estás pensando?" },
  { id: "2",   label: "Marieta", avatar: "https://i.pravatar.cc/56?img=5",  note: "un hombre puede ser destruido, per..." },
  { id: "3",   label: "♀",       avatar: "https://i.pravatar.cc/56?img=16", note: "III Demonio... Sombraheart" },
  { id: "4",   label: "👑",      avatar: "https://i.pravatar.cc/56?img=12", note: "III Loco Héctor Lavo" },
];

const CONVERSATIONS: Conversation[] = [
  { id: "1", name: "Baboo!",          avatar: "https://i.pravatar.cc/56?img=8",  lastMessage: "Activo(a) hace 1 d",                      timestamp: "" },
  { id: "2", name: "Pedro Sánchez",   avatar: "https://i.pravatar.cc/56?img=33", lastMessage: "Tú: Hola Pedro, me llamo Ana Zubieta y so…", timestamp: "5 d",   isVerified: true },
  { id: "3", name: "Raúl Sánchez",    avatar: "https://i.pravatar.cc/56?img=59", lastMessage: "y lo llevo el viernes",                    timestamp: "6 d" },
  { id: "4", name: "Nicolás Rubio",   avatar: "https://i.pravatar.cc/56?img=3",  lastMessage: "Nicolás ha enviado un archivo adjun…",      timestamp: "1 sem", isUnread: true, isBold: true },
  { id: "5", name: "svdico",          avatar: "https://i.pravatar.cc/56?img=22", lastMessage: "Q tal estas",                              timestamp: "1 sem", isUnread: true },
  { id: "6", name: "Marieta",         avatar: "https://i.pravatar.cc/56?img=5",  lastMessage: "Marieta ha enviado un mensaje de voz.",     timestamp: "1 sem", isUnread: true, isBold: true },
  { id: "7", name: "Santi Perrino",   avatar: "https://i.pravatar.cc/56?img=60", lastMessage: "A verr.. q estoy pensando?",                timestamp: "3 sem" },
  { id: "8", name: "Ley Trescientos", avatar: "https://i.pravatar.cc/56?img=44", lastMessage: "Nenaa estás bien? Si necesitas lo que s…",  timestamp: "3 sem" },
  { id: "9", name: "samanta bontempi",avatar: "https://i.pravatar.cc/56?img=49", lastMessage: "creo que ciega como voy saldré otro día…",  timestamp: "3 sem" },
];

// ─── Estilos base ─────────────────────────────────────────────────────────────

const s = {
  btn: {
    background: "none", border: "none", color: "#fff",
    cursor: "pointer", padding: 4,
    display: "flex", alignItems: "center", justifyContent: "center",
  } as React.CSSProperties,
};

// ─── Iconos ───────────────────────────────────────────────────────────────────

const IcInstagram = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ width: 28, height: 28 }}>
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);
const IcHome = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 24, height: 24 }}>
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
  </svg>
);
const IcReels = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 24, height: 24 }}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
  </svg>
);
const IcSearch = ({ size = 24 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: size, height: size }}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const IcCompass = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ width: 24, height: 24 }}>
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" stroke="none" />
  </svg>
);
const IcHeart = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ width: 24, height: 24 }}>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);
const IcPlus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 24, height: 24 }}>
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const IcMenu = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 24, height: 24 }}>
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);
const IcGrid = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} style={{ width: 24, height: 24 }}>
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
  </svg>
);
const IcEdit = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const IcChevronDown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const IcChevronRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
const IcVerified = () => (
  <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, display: "inline", marginLeft: 3, flexShrink: 0 }}>
    <circle cx="12" cy="12" r="10" fill="#0095f6" />
    <path d="M9 12l2 2 4-4" fill="none" stroke="white" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar() {
  return (
    <nav style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "space-between",
      padding: "24px 12px",
      background: "#000000",
      borderRight: "1px solid #262626",
      height: "100vh",
      width: 64,
      position: "fixed",
      left: 0, top: 0, zIndex: 20,
      boxSizing: "border-box",
    }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 26 }}>
        <div style={{ color: "#fff" }}><IcInstagram /></div>
        <button style={s.btn}><IcHome /></button>
        <button style={s.btn}><IcReels /></button>
        <button style={{ ...s.btn, position: "relative" }}>
          <IcHeart />
          <span style={{
            position: "absolute", top: -5, right: -5,
            background: "#e0245e", color: "#fff",
            fontSize: 9, fontWeight: 700,
            borderRadius: "50%", width: 16, height: 16,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "2px solid #000",
          }}>7</span>
        </button>
        <button style={s.btn}><IcSearch /></button>
        <button style={s.btn}><IcCompass /></button>
        <button style={s.btn}><IcPlus /></button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        <button style={s.btn}><IcMenu /></button>
        <button style={s.btn}><IcGrid /></button>
        <button style={{
          borderRadius: "50%", overflow: "hidden",
          width: 32, height: 32, border: "2px solid #fff",
          padding: 0, cursor: "pointer",
        }}>
          <img src="https://i.pravatar.cc/32?img=47" alt="profile"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        </button>
      </div>
    </nav>
  );
}

// ─── StoryBubble ──────────────────────────────────────────────────────────────

function StoryBubble({ story }: { story: Story }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      gap: 4, cursor: "pointer", flexShrink: 0, minWidth: 68,
    }}>
      {story.note && (
        <div style={{
          background: "#1c1c1e", color: "#fff", fontSize: 10,
          borderRadius: 12, padding: "5px 7px", maxWidth: 70,
          textAlign: "center", lineHeight: 1.3, minHeight: 30,
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 2, wordBreak: "break-word",
        }}>
          {story.note}
        </div>
      )}
      <div style={{
        borderRadius: "50%", padding: 2, position: "relative",
        background: story.isOwn
          ? "#363636"
          : "linear-gradient(135deg, #f9ce34 0%, #ee2a7b 50%, #6228d7 100%)",
      }}>
        <div style={{ borderRadius: "50%", padding: 2, background: "#000" }}>
          <img src={story.avatar} alt={story.label}
            style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", display: "block" }} />
        </div>
        {story.isOwn && (
          <div style={{
            position: "absolute", bottom: 1, right: 1,
            background: "#0095f6", borderRadius: "50%",
            width: 16, height: 16,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "2px solid #000", color: "#fff",
            fontSize: 13, fontWeight: 700, lineHeight: 1,
          }}>+</div>
        )}
      </div>
      <span style={{
        color: "#fff", fontSize: 11, textAlign: "center",
        width: "100%", overflow: "hidden", textOverflow: "ellipsis",
        whiteSpace: "nowrap", padding: "0 2px",
      }}>
        {story.label}
      </span>
    </div>
  );
}

// ─── ConversationItem ─────────────────────────────────────────────────────────

function ConversationItem({
  conv, isActive, onClick,
}: {
  conv: Conversation; isActive: boolean; onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 12,
        padding: "10px 14px", borderRadius: 12, cursor: "pointer", textAlign: "left",
        background: isActive ? "#1a1a1a" : hovered ? "#0d0d0d" : "transparent",
        border: "none", transition: "background 0.12s", boxSizing: "border-box",
      }}
    >
      {/* Avatar */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <img src={conv.avatar} alt={conv.name}
          style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", display: "block" }} />
        {conv.isUnread && (
          <span style={{
            position: "absolute", bottom: 2, right: 2,
            width: 13, height: 13, background: "#0095f6",
            borderRadius: "50%", border: "2.5px solid #000",
          }} />
        )}
      </div>

      {/* Texto */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <span style={{
            fontSize: 14, color: "#fff",
            fontWeight: conv.isUnread || conv.isBold ? 600 : 400,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {conv.name}
          </span>
          {conv.isVerified && <IcVerified />}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
          <span style={{
            fontSize: 12,
            color: conv.isBold ? "#e0e0e0" : "#8e8e8e",
            fontWeight: conv.isBold ? 500 : 400,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1,
          }}>
            {conv.lastMessage}
          </span>
          {conv.timestamp && (
            <>
              <span style={{ color: "#555", fontSize: 12, flexShrink: 0 }}>·</span>
              <span style={{ color: "#8e8e8e", fontSize: 12, flexShrink: 0 }}>{conv.timestamp}</span>
            </>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── LeftPanel ────────────────────────────────────────────────────────────────

function LeftPanel({ activeId, onSelect }: { activeId: string | null; onSelect: (id: string) => void }) {
  const [tab, setTab] = useState<"messages" | "requests">("messages");

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100vh", background: "#000000",
      borderRight: "1px solid #262626",
      width: 360, flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 16px 12px" }}>
        <button style={{ ...s.btn, gap: 6, fontSize: 20, fontWeight: 700 }}>
          ateibuzena <IcChevronDown />
        </button>
        <button style={s.btn}><IcEdit /></button>
      </div>

      {/* Buscador */}
      <div style={{ padding: "0 16px 14px" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "#1c1c1e", borderRadius: 999, padding: "10px 16px",
        }}>
          <span style={{ color: "#8e8e8e", display: "flex" }}><IcSearch size={16} /></span>
          <span style={{ color: "#8e8e8e", fontSize: 14 }}>Buscar</span>
        </div>
      </div>

      {/* Stories */}
      <div style={{
        display: "flex", gap: 14, padding: "0 14px 14px",
        overflowX: "auto", scrollbarWidth: "none",
        msOverflowStyle: "none",
      } as React.CSSProperties}>
        {STORIES.map(story => <StoryBubble key={story.id} story={story} />)}
        <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 22, flexShrink: 0 }}>
          <button style={{
            background: "#1c1c1e", borderRadius: "50%",
            width: 32, height: 32, display: "flex",
            alignItems: "center", justifyContent: "center",
            border: "none", cursor: "pointer", color: "#fff",
          }}>
            <IcChevronRight />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex", alignItems: "center",
        padding: "0 16px", borderBottom: "1px solid #1a1a1a",
        gap: 8,
      }}>
        <button onClick={() => setTab("messages")} style={{
          ...s.btn,
          fontSize: 14, fontWeight: 600,
          color: tab === "messages" ? "#fff" : "#8e8e8e",
          paddingBottom: 10, paddingTop: 4,
          borderBottom: tab === "messages" ? "2px solid #fff" : "2px solid transparent",
          flex: 1, justifyContent: "flex-start",
        }}>Mensajes</button>
        <button onClick={() => setTab("requests")} style={{
          ...s.btn,
          fontSize: 14, fontWeight: 600,
          color: tab === "requests" ? "#fff" : "#8e8e8e",
          paddingBottom: 10, paddingTop: 4,
          borderBottom: tab === "requests" ? "2px solid #fff" : "2px solid transparent",
          justifyContent: "flex-end",
        }}>Solicitudes</button>
      </div>

      {/* Lista conversaciones */}
      <div style={{ flex: 1, overflowY: "auto", padding: "4px 8px", scrollbarWidth: "none" } as React.CSSProperties}>
        {CONVERSATIONS.map(c => (
          <ConversationItem key={c.id} conv={c} isActive={activeId === c.id} onClick={() => onSelect(c.id)} />
        ))}
      </div>
    </div>
  );
}

// ─── ChatWindow ───────────────────────────────────────────────────────────────

function ChatWindow({ conv }: { conv: Conversation }) {
  const [msg, setMsg] = useState("");

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#000000" }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "14px 24px", borderBottom: "1px solid #262626",
      }}>
        <img src={conv.avatar} alt={conv.name}
          style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", display: "block" }} />
        <div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>{conv.name}</span>
            {conv.isVerified && <IcVerified />}
          </div>
          <span style={{ color: "#8e8e8e", fontSize: 12 }}>{conv.lastMessage}</span>
        </div>
      </div>

      {/* Mensajes */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#555", fontSize: 14 }}>Aún no hay mensajes.</p>
      </div>

      {/* Input */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "14px 24px", borderTop: "1px solid #262626",
      }}>
        <div style={{
          flex: 1, background: "#1c1c1e", borderRadius: 999,
          display: "flex", alignItems: "center", padding: "10px 16px",
        }}>
          <input
            value={msg}
            onChange={e => setMsg(e.target.value)}
            placeholder="Mensaje..."
            style={{
              flex: 1, background: "none", border: "none",
              outline: "none", color: "#fff", fontSize: 14,
            }}
          />
        </div>
        {msg
          ? <button style={{ ...s.btn, color: "#0095f6", fontSize: 14, fontWeight: 600 }}>Enviar</button>
          : <span style={{ fontSize: 22, cursor: "pointer", userSelect: "none" }}>❤️</span>
        }
      </div>
    </div>
  );
}

// ─── Export principal ─────────────────────────────────────────────────────────

export default function Chat() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeConv = CONVERSATIONS.find(c => c.id === activeId) ?? null;

  return (
    <div style={{
      display: "flex", height: "100vh",
      background: "#000000", overflow: "hidden",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <Sidebar />
      <div style={{ display: "flex", flex: 1, marginLeft: 64 }}>
        <LeftPanel activeId={activeId} onSelect={setActiveId} />
        {activeConv ? <ChatWindow conv={activeConv} /> : <EmptyState />}
      </div>
    </div>
  );
}