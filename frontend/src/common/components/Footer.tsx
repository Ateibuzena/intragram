import '../styles/Footer.css';

export default function Footer() {
    return (
        <footer className="footer">
            <p className="footer-name">© 2025 Ana Zubieta. All rights reserved.</p>
            <ul className="footer-list">
                <li><a className="footer-element" href="mailto:ena.ateibuz@gmail.com">Email</a></li>
                <li><a className="footer-element" href="https://github.com/Ateibuzena" target="_blank" rel="noopener noreferrer">GitHub</a></li>
                <li><a className="footer-element" href="https://www.linkedin.com/in/ana-zubieta" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
            </ul>
        </footer>
    );
}