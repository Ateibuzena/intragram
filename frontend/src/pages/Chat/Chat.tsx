import "./Chat.css";
import Sidebar from "./components/Sidebar";

export default function Chat() {
    return (
        <div className="chat-container">
            <Sidebar />
            <h1>Chat</h1>
        
            <div className="chat-left">
                <p>Left Sidebar</p>
            </div>
            <div className="chat-right">
                <p>Right Sidebar</p>
            </div>
        </div>
    );
}