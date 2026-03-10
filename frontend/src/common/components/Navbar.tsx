import { Link } from 'react-router-dom';
import '../styles/Navbar.css';

export default function Navbar() {
    return (
        <nav className="navbar">
            <div className="navbar-name"><Link to="/">Ana Zubieta</Link></div>
            <ul className="navbar-list">
                <li className="navbar-element"><Link to="/">Home</Link></li>
                <li className="navbar-element"><Link to="/projects">Projects</Link></li>
                <li className="navbar-element"><Link to="/skills">Skills</Link></li>
                <li className="navbar-element"><Link to="/extras">Extras</Link></li>
            </ul>
        </nav>
    );
}