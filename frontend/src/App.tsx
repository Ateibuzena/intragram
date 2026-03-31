import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthContext, useAuth, useAuthState } from '@/hooks/useAuth';
import { ROUTES } from '@/constants/routes';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
	const auth = useAuthState();
	return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
	const { isAuthenticated } = useAuth();

	if (!isAuthenticated) {
		return <Navigate to={ROUTES.LOGIN} replace />;
	}

	return children;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
	const { isAuthenticated } = useAuth();

	if (isAuthenticated) {
		return <Navigate to={ROUTES.HOME} replace />;
	}

	return children;
};

const NotFoundRedirect = () => {
	const { isAuthenticated } = useAuth();

	return (
		<Navigate
			to={isAuthenticated ? ROUTES.HOME : ROUTES.LOGIN}
			replace
		/>
	);
};

const App = () => {
	return (
		<BrowserRouter>
			<AuthProvider>
				<Routes>
					<Route
						path={ROUTES.LOGIN}
						element={
							<PublicRoute>
								<LoginPage />
							</PublicRoute>
						}
					/>

					<Route
						path={ROUTES.HOME}
						element={
							<ProtectedRoute>
								<HomePage />
							</ProtectedRoute>
						}
					/>

					<Route path="*" element={<NotFoundRedirect />} />
				</Routes>
			</AuthProvider>
		</BrowserRouter>
	);
};

export default App;
