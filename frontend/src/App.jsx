// useEffect = ejecuta código cuando el componente se monta (carga)
// useState = variable reactiva: cuando cambia, React redibuja el componente
import { useEffect, useState } from 'react';
import './index.css';
import LoginPage from './components/auth/LoginPage';
import HomePage from './components/home/HomePage';

function App() {
  // token: null = no logueado, string = token JWT del usuario
  const [token, setToken] = useState(null);

  // useEffect con [] como dependencia = se ejecuta UNA SOLA VEZ al cargar
  useEffect(() => {
    // Leemos los parámetros de la URL: ej. /?token=abc123
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token'); // buscamos el parámetro "token"

    if (t) {
      // Si el backend nos devolvió un token en la URL...
      localStorage.setItem('auth_token', t); // lo guardamos en el navegador
      setToken(t);                            // actualizamos el estado

      // Limpiamos el token de la URL para que no se vea feo
      // (pasamos de /?token=abc123 a solo /)
      params.delete('token');
      const newUrl =
        window.location.origin +
        window.location.pathname +
        (params.toString() ? `?${params.toString()}` : '');
      window.history.replaceState({}, '', newUrl);
    } else {
      // Si no hay token en la URL, miramos si ya teníamos uno guardado
      // (el usuario ya se había logueado antes)
      const saved = localStorage.getItem('auth_token');
      if (saved) setToken(saved);
    }
  }, []);

  // devMode = true: muestra la HomePage directamente sin necesitar token.
  // Útil para desarrollar sin tener el backend listo.
  // Cuando el backend esté listo, pon devMode = false
  const devMode = true;

  // Renderizado condicional:
  // Si no hay token Y no estamos en modo dev → mostramos el login
  // Si hay token O estamos en modo dev → mostramos la home
  return token || devMode ? <HomePage /> : <LoginPage />;
}

export default App;
