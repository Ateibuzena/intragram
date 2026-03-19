import './index.css';
import LoginPage from './components/auth/LoginPage';
import HomePage from './components/home/HomePage';
import { useAuth } from './hooks/useAuth';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-ft-bg text-white flex items-center justify-center">Cargando...</div>;
  }

  return user ? <HomePage /> : <LoginPage />;
}

export default App;
