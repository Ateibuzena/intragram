// boton crear nuevo mensaje en barra de tareas

// boton crear nuevo mensaje en feed principa del chat

// header con foto perfil de destinatario, nombre y boton de volver atras

// barra lateral fija con lista de conversaciones (con foto perfil y nombre del destinatario)

// caja de busqueda para buscar conversaciones por nombre de destinatario
// filtro de mensajes (de gente que sigo)
// filtro de mensajes de gente que no sigo

import Taskbar from './components/Taskbar.tsx'

export default function Chat() {
    return (
        <div className="chat-page flex h-screen">
            <Taskbar />
            <div className="flex-1 bg-white p-4">
                {/* Aquí iría el contenido del chat */}
            </div>
        </div>
    );
}