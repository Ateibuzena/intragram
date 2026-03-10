// barra lateral fija con lista de conversaciones (con foto perfil y nombre del destinatario)

// caja de busqueda para buscar conversaciones por nombre de destinatario
// filtro de mensajes (de gente que sigo)
// filtro de mensajes de gente que no sigo

import '../styles/Taskbar.css';

import { SearchBox } from './SearchBox';
import { FollowingButton } from './Buttons';
import { NotFollowingButton } from './Buttons';

export default function Taskbar() {
    return (
        <nav className="taskbar">
            <SearchBox />
            <FollowingButton />
            <NotFollowingButton />
            <ul className="conversation-list">
                {/* Aquí se mapearán las conversaciones */}
                <li className="conversation-item">
                    <img src="/path/to/profile-pic.jpg" alt="Profile" className="profile-pic" />
                    <span className="recipient-name">Recipient Name</span>
                </li>
                {/* Repetir para cada conversación */}
            </ul>
        </nav>
    );
}