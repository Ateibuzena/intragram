import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthContext, useAuthState } from '@/hooks/useAuth';
import { ROUTES } from '@/constants/routes';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';

const App = () => {
  const auth = useAuthState();

  return (
    <AuthContext.Provider value={auth}>
      <BrowserRouter>
        <Routes>
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          <Route
            path={ROUTES.HOME}
            element={auth.isAuthenticated ? <HomePage /> : <HomePage />}
            // TODO: cuando el backend esté listo, cambiar a:
            // element={auth.isAuthenticated ? <HomePage /> : <Navigate to={ROUTES.LOGIN} />}
          />
          <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
};

export default App;
