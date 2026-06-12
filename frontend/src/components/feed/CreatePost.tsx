import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { buildApiUrl } from '@/utils/apiBase';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants/routes';

interface CreatePostProps {
	onPostCreated?: () => void;
}

const ATTACHMENT_BUTTONS = [
	{ icon: '📷', label: 'Imagen' },
	{ icon: '💻', label: 'Código' },
];

export const CreatePost = ({ onPostCreated }: CreatePostProps) => {
	const [postText, setPostText] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { token, user, profile, logout } = useAuth();
	const navigate = useNavigate();
	const initial = (profile?.login || user?.username || '?').charAt(0).toUpperCase();
	const avatarUrl = profile?.avatar_url ?? null;

	const handlePublish = async () => {
		const content = postText.trim();
		if (!content || !token || isSubmitting) return;

		try {
			setIsSubmitting(true);
			setError(null);
			const res = await fetch(buildApiUrl('/users/feed'), {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ content }),
			});
			if (!res.ok) {
				const message = await res.text().catch(() => '');
				console.error('Error al publicar en el feed', res.status, message);
				if (res.status === 401) {
					// Token expirado o no válido al publicar: cerramos sesión y redirigimos a login.
					logout();
					navigate(ROUTES.LOGIN + '?reason=expired');
					return;
				}
				setError('No se pudo publicar tu actualización. Inténtalo de nuevo más tarde.');
				return;
			}
			setPostText('');
			onPostCreated?.();
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="bg-ft-card border border-ft-border rounded-2xl p-4 mb-4 hover:border-ft-cyan/20 transition-all duration-200">
			<div className="flex items-start space-x-3">
				<div className="w-8 h-8 rounded-full bg-ft-cyan flex items-center justify-center font-bold text-xs text-black flex-shrink-0 overflow-hidden">
					{avatarUrl
						? <img src={avatarUrl} alt={initial} className="w-full h-full object-cover" />
						: initial}
				</div>
				<textarea
					className="flex-1 bg-transparent text-sm text-white placeholder-ft-muted focus:outline-none resize-none mt-1 leading-relaxed"
					placeholder="¿Qué estás aprendiendo hoy? Comparte con la comunidad 42..."
					rows={2}
					value={postText}
					onChange={(e) => setPostText(e.target.value)}
				/>
			</div>
			<div className="flex items-center justify-between mt-3 pt-3 border-t border-ft-border">
				<div className="flex space-x-1">
					{ATTACHMENT_BUTTONS.map((btn) => (
						<button key={btn.label} className="flex items-center space-x-1.5 text-xs text-ft-muted hover:text-ft-cyan px-2 py-1.5 rounded-lg hover:bg-ft-cyan/5 border border-transparent hover:border-ft-cyan/20 transition-all duration-150 active:scale-95">
							<span>{btn.icon}</span>
							<span className="hidden sm:inline">{btn.label}</span>
						</button>
					))}
				</div>
				<Button
					variant="primary"
					size="sm"
					disabled={!postText.trim() || !token || isSubmitting}
					onClick={handlePublish}
				>
					Publicar
				</Button>
			</div>
			{error && (
				<p className="mt-2 text-xs text-red-400">
					{error}
				</p>
			)}
		</div>
	);
};
