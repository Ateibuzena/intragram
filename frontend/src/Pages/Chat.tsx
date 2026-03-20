import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";

type Message = { from: string; message: string };
type ChatHistoryItem = { sender: string; receiver: string; message: string };

export default function Chat() {
  const router = useNavigate();
  const [users, setUsers] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string>("");
  const [socket, setSocket] = useState<Socket | null>(null);

  // conversaciones: clave = `${userA}_${userB}` (orden alfabético)
  const [conversations, setConversations] = useState<{ [pair: string]: Message[] }>({});

  const clientId = localStorage.getItem("clientId") || "";

  // --- Helpers ---
  const getPairKey = (user1: string, user2: string) => {
    return [user1, user2].sort().join("_");
  };

  const addMessageToConversation = (from: string, to: string, message: string) => {
    const key = getPairKey(from, to);
    setConversations(prev => ({
      ...prev,
      [key]: [...(prev[key] || []), { from, message }]
    }));
  };

  // --- Effects ---
  useEffect(() => {
    if (!clientId) {
      router("/");
      return;
    }

    const socketBaseUrl = import.meta.env.VITE_WS_URL || window.location.origin;
    const socketPath = import.meta.env.VITE_WS_PATH || "/api/chat/socket.io";
    const s = io(socketBaseUrl, {
      path: socketPath,
      transports: ["websocket", "polling"],
    });
    setSocket(s);

    s.emit("register", { clientId });

    s.on("users_update", (data: { users: string[] }) => {
      setUsers(data.users.filter(u => u !== clientId)); // no mostrarte a ti
    });

    s.on("receive_message", (data: { sender: string; message: string }) => {
      addMessageToConversation(data.sender, clientId, data.message);
    });

    s.on("chat_history", (data: { peerId: string; messages: ChatHistoryItem[] }) => {
      const key = getPairKey(clientId, data.peerId);
      setConversations(prev => ({
        ...prev,
        [key]: data.messages.map(msg => ({
          from: msg.sender,
          message: msg.message
        }))
      }));
    });

    return () => {
      s.disconnect();
    };
  }, [clientId, router]);

  useEffect(() => {
    if (!socket || !selectedUser) return;
    socket.emit("join_private_chat", {
      clientId,
      peerId: selectedUser
    });
  }, [socket, selectedUser, clientId]);

  // --- Handlers ---
  const handleSend = () => {
    if (!selectedUser || !mensaje.trim() || !socket) return;
    socket.emit("send_message", {
      sender: clientId,
      receiver: selectedUser,
      message: mensaje
    });
    addMessageToConversation(clientId, selectedUser, mensaje);
    setMensaje("");
  };

  // --- Render ---
  const currentMessages =
    selectedUser && conversations[getPairKey(clientId, selectedUser)]
      ? conversations[getPairKey(clientId, selectedUser)]
      : [];

  return (
    <div>
      {/* Lista de usuarios */}
      <div style={{ marginTop: "20px" }}>
        <h3>Connected Users:</h3>
        {users.map(userId => (
          <button
            key={userId}
            onClick={() => setSelectedUser(userId)}
            style={{
              display: "block",
              margin: "5px",
              padding: "10px",
              backgroundColor: selectedUser === userId ? "lightblue" : "white"
            }}
          >
            {userId}
          </button>
        ))}
      </div>

      {/* Chat */}
      {selectedUser && (
        <div style={{ marginTop: "20px" }}>
          <h3>Chat with {selectedUser}:</h3>
          <div
            style={{
              border: "1px solid #ccc",
              padding: "10px",
              height: "200px",
              overflowY: "scroll"
            }}
          >
            {currentMessages.map((msg, index) => (
              <div
                key={index}
                style={{ textAlign: msg.from === clientId ? "right" : "left" }}
              >
                <strong>{msg.from === clientId ? "You" : msg.from}:</strong> {msg.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <input
        type="text"
        placeholder={selectedUser ? `Message to ${selectedUser}` : "Type your message..."}
        disabled={!selectedUser}
        style={{ width: "80%", padding: "10px", fontSize: "16px" }}
        value={mensaje}
        onChange={e => setMensaje(e.target.value)}
      />
      <button
        onClick={handleSend}
        disabled={!mensaje.trim() || !selectedUser}
        style={{ padding: "10px 20px", fontSize: "16px", marginLeft: "10px" }}
      >
        Send
      </button>
    </div>
  );
}