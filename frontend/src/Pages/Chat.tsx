import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";

type Message = { from: string; message: string };
type ChatHistoryItem = { sender: string; receiver: string; message: string };

export default function Chat() {
	const router = useNavigate();
	const [users, setUsers] = useState<string[]>([]);
	const [clientId, setClientId] = useState<string>("");
	const [selectedUser, setSelectedUser] = useState<string | null>(null);
	const [mensaje, setMensaje] = useState<string>("");
	const [socket, setSocket] = useState<Socket | null>(null);
	const [isAuth, setIsAuth] = useState<boolean | null>(null);

	// conversaciones: clave = `${userA}_${userB}` (orden alfabético)
	const [conversations, setConversations] = useState<{ [pair: string]: Message[] }>({});

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
		
		const checkAuth = async () => {
			try {
				const res = await fetch('https://localhost:8443/api/chat/validate', {
					method: 'POST',
					credentials: 'include',
					body: JSON.stringify({ token: '' }), // el token real se obtiene de las cookies o almacenamiento local según tu implementación de auth
					headers: {
						'Content-Type': 'application/json'
					},
				});
				const data = await res.json();
				console.log("Chat validation result:", data);
				if (!data.valid) {
					router("/", { replace: true }); // no autenticado, volver a home
					return;
				}
				else {
					setIsAuth(data.valid);
					const currentUserId = data.user.id;
					setClientId(currentUserId);
					setUsers(data.users.filter((u: any) => u !== currentUserId)); // agregar self al listado de usuarios conectados
				}
			} catch (error) {
				console.error("Error validating auth:", error);
				router("/", { replace: true }); // en caso de error, asumir no autenticado
			}
		};
		checkAuth();

	}, [isAuth, clientId]);

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

	return (<div>
		<h2>Chat Service</h2>
		<p>Client ID: {clientId}</p>
		<p>Connected Users:</p>
		<ul>
			{users.map(user => (
				<li key={user} onClick={() => setSelectedUser(user)} style={{ cursor: "pointer", fontWeight: selectedUser === user ? "bold" : "normal" }}>
					{user}
				</li>
			))}
		</ul>
	</div>);
	// return (
	// 	<div>
	// 		{/* Lista de usuarios */}
	// 		<div style={{ marginTop: "20px" }}>
	// 			<h3>Connected Users:</h3>
	// 			{users.map(userId => (
	// 				<button
	// 					key={userId}
	// 					onClick={() => setSelectedUser(userId)}
	// 					style={{
	// 						display: "block",
	// 						margin: "5px",
	// 						padding: "10px",
	// 						backgroundColor: selectedUser === userId ? "lightblue" : "white"
	// 					}}
	// 				>
	// 					{userId}
	// 				</button>
	// 			))}
	// 		</div>

	// 		{/* Chat */}
	// 		{selectedUser && (
	// 			<div style={{ marginTop: "20px" }}>
	// 				<h3>Chat with {selectedUser}:</h3>
	// 				<div
	// 					style={{
	// 						border: "1px solid #ccc",
	// 						padding: "10px",
	// 						height: "200px",
	// 						overflowY: "scroll"
	// 					}}
	// 				>
	// 					{currentMessages.map((msg, index) => (
	// 						<div
	// 							key={index}
	// 							style={{ textAlign: msg.from === clientId ? "right" : "left" }}
	// 						>
	// 							<strong>{msg.from === clientId ? "You" : msg.from}:</strong> {msg.message}
	// 						</div>
	// 					))}
	// 				</div>
	// 			</div>
	// 		)}

	// 		{/* Input */}
	// 		<input
	// 			type="text"
	// 			placeholder={selectedUser ? `Message to ${selectedUser}` : "Type your message..."}
	// 			disabled={!selectedUser}
	// 			style={{ width: "80%", padding: "10px", fontSize: "16px" }}
	// 			value={mensaje}
	// 			onChange={e => setMensaje(e.target.value)}
	// 		/>
	// 		<button
	// 			onClick={handleSend}
	// 			disabled={!mensaje.trim() || !selectedUser}
	// 			style={{ padding: "10px 20px", fontSize: "16px", marginLeft: "10px" }}
	// 		>
	// 			Send
	// 		</button>
	// 	</div>
	// );
}