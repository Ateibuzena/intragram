import { useAuth } from './hooks/useAuth';
import LoginPage from './components/auth/LoginPage';
import HomePage from './components/home/HomePage';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Cargando...</div>;
  }

  // Si NO hay usuario → mostrar login
  if (!user) {
    return <LoginPage />;
  }

  // Si SÍ hay usuario → mostrar home
  return <HomePage />;
}

export default App;
