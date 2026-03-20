import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';

export default function Home() {
    const router = useNavigate();

    const handleRegister = () => {
        if (localStorage.getItem("clientId")) {
            router("/chat"); // navegación SPA real, sin recarga
            return;
        }

        const storedId = localStorage.getItem("clientId") || uuidv4();
        localStorage.setItem("clientId", storedId);
        router("/chat"); // el registro real se hace por evento websocket
    }

    return (
        <div>
            {/* boton de enviar mensaje */}
            <button
                onClick={() => handleRegister()}
                style={{
                    padding: '10px 20px',
                    fontSize: '16px',
                    marginLeft: '10px'
                }}>
                Register
            </button>
        </div>
    )
}