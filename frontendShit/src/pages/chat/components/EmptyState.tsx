import React from "react";
import "../styles/EmptyState.css";

// ─── EmptyState ───────────────────────────────────────────────────────────────

export default function EmptyState() {
  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "#000000", gap: 20,
    }}>
      <div style={{
        width: 96, height: 96, borderRadius: "50%",
        border: "2px solid #fff",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {/* Ícono vortex tipo Instagram DM */}
        <svg viewBox="0 0 48 48" fill="none" stroke="white" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" style={{ width: 58, height: 58, opacity: 0.9 }}>
          <path d="M24 8C13.5 8 7 15.5 7 24c0 8.3 6.2 15.2 14.3 16.6 2.1.4 3.7-.1 4.7-1.1" />
          <path d="M24 13.5C17.4 13.5 13 18 13 24s4.4 10.5 11 10.5S35 30 35 24" />
          <path d="M24 19.5c-2.5 0-4.5 2-4.5 4.5s2 4.5 4.5 4.5" />
        </svg>
      </div>
      <div style={{ textAlign: "center" }}>
        <p style={{ color: "#fff", fontSize: 20, fontWeight: 600, margin: "0 0 6px" }}>Tus mensajes</p>
        <p style={{ color: "#8e8e8e", fontSize: 14, margin: 0 }}>
          Envía fotos y mensajes privados a un amigo o grupo.
        </p>
      </div>
      <button style={{
        background: "#0095f6", color: "#fff", border: "none",
        cursor: "pointer", padding: "9px 22px",
        borderRadius: 8, fontSize: 14, fontWeight: 600,
      }}>
        Enviar mensaje
      </button>
    </div>
  );
}