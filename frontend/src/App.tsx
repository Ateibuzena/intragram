import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthContext, useAuth, useAuthState } from '@/hooks/useAuth';
import { usePresence } from '@/hooks/usePresence';
import { PresenceContext } from '@/hooks/usePresenceContext';
import { FriendProvider } from '@/hooks/useFriendContext';
import { ROUTES } from '@/constants/routes';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import PrivacyPage from '@/pages/PrivacyPage';
import TermsPage from '@/pages/TermsPage';
import UserProfilePage from '@/pages/UserProfilePage';

const PresenceManager = ({ children }: { children: React.ReactNode }) => {
	const { connected, presenceMap, socketRef, emit, unreadChats, setUnreadChats, syncUnreadChats, currentChatRef } = usePresence();
	return (
		<PresenceContext.Provider value={{ connected, presenceMap, socketRef, emit, unreadChats, setUnreadChats, syncUnreadChats, currentChatRef }}>
			<FriendProvider>
				{children}
			</FriendProvider>
		</PresenceContext.Provider>
	);
};

const VALID_THEMES = ['none', 'dots', 'topographic', 'circuit', 'noise'];

const BackgroundApplier = () => {
	const { profile } = useAuth();
	useEffect(() => {
		const theme = VALID_THEMES.includes(profile?.background_theme ?? '') ? profile!.background_theme! : 'none';
		document.body.dataset.bgTheme = theme;
	}, [profile?.background_theme]);
	return null;
};

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
	const auth = useAuthState();
	return (
		<AuthContext.Provider value={auth}>
			<PresenceManager>
				<BackgroundApplier />
				{children}
			</PresenceManager>
		</AuthContext.Provider>
	);
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

					<Route
						path={ROUTES.PROFILE}
						element={
							<ProtectedRoute>
								<UserProfilePage />
							</ProtectedRoute>
						}
					/>

					<Route path={ROUTES.PRIVACY} element={<PrivacyPage />} />
					<Route path={ROUTES.TERMS} element={<TermsPage />} />

					<Route path="*" element={<NotFoundRedirect />} />
				</Routes>
			</AuthProvider>
		</BrowserRouter>
	);
};

export default App;
