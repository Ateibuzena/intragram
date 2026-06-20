import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { buildApiUrl } from '@/utils/apiBase';
import { useAuth } from '@/hooks/useAuth';
import { usePresenceStatus } from '@/hooks/usePresenceContext';
import { ROUTES } from '@/constants/routes';
import { LANGUAGES } from '@/constants/languages';

interface CreatePostProps {
	onPostCreated?: () => void;
}

export const CreatePost = ({ onPostCreated }: CreatePostProps) => {
	const [postText, setPostText] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [showCodePanel, setShowCodePanel] = useState(false);
	const [codeSnippet, setCodeSnippet] = useState('');
	const [codeLang, setCodeLang] = useState('c');
	const { token, user, profile, logout } = useAuth();
	const { connected } = usePresenceStatus();
	const navigate = useNavigate();
	const initial = (profile?.login || user?.username || '?').charAt(0).toUpperCase();
	const avatarUrl = profile?.avatar_url ?? null;

	const handleToggleCodePanel = () => {
		setShowCodePanel((v) => !v);
		if (showCodePanel) setCodeSnippet('');
	};

	const handlePublish = async () => {
		const textPart = postText.trim();
		const codePart = codeSnippet.trim();
		if (!textPart && !codePart) return;
		if (!token || isSubmitting) return;

		const content = codePart
			? `${textPart ? textPart + '\n' : ''}\`\`\`${codeLang}\n${codePart}\n\`\`\``
			: textPart;

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
					logout();
					navigate(ROUTES.LOGIN + '?reason=expired');
					return;
				}
				setError('No se pudo publicar tu actualización. Inténtalo de nuevo más tarde.');
				return;
			}
			setPostText('');
			setCodeSnippet('');
			setShowCodePanel(false);
			onPostCreated?.();
		} finally {
			setIsSubmitting(false);
		}
	};

	const hasContent = postText.trim().length > 0 || codeSnippet.trim().length > 0;

	return (
		<div className="bg-ft-card border border-ft-border rounded-2xl p-4 mb-4 hover:border-ft-cyan/20 transition-all duration-200">
			<div className="flex items-start space-x-3">
				<div className="relative flex-shrink-0">
					<div className="w-8 h-8 rounded-full bg-ft-cyan flex items-center justify-center font-bold text-xs text-black overflow-hidden">
						{avatarUrl
							? <img src={avatarUrl} alt={initial} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
							: initial}
					</div>
					<span className={connected ? 'avatar-online' : 'avatar-offline'} />
				</div>
				<textarea
					className="flex-1 bg-transparent text-sm text-white placeholder-ft-muted focus:outline-none resize-none mt-1 leading-relaxed"
					placeholder="¿Qué estás aprendiendo hoy? Comparte con la comunidad 42..."
					rows={2}
					value={postText}
					onChange={(e: Event) => setPostText((e.target as HTMLTextAreaElement).value)}
				/>
			</div>

			{/* Panel de código */}
			{showCodePanel && (
				<div className="mt-3 border border-ft-cyan/30 rounded-xl overflow-hidden">
					<div className="flex items-center justify-between px-3 py-2 bg-ft-hover border-b border-ft-border">
						<select
							value={codeLang}
							onChange={(e: Event) => setCodeLang((e.target as HTMLSelectElement).value)}
							className="bg-transparent text-xs text-ft-cyan font-mono focus:outline-none cursor-pointer"
						>
							{LANGUAGES.map((l) => (
								<option key={l.value} value={l.value} className="bg-ft-card text-white">
									{l.label}
								</option>
							))}
						</select>
						<button
							type="button"
							onClick={handleToggleCodePanel}
							className="text-ft-muted hover:text-white text-xs transition-colors"
						>
							✕ Cancelar
						</button>
					</div>
					<textarea
						className="w-full bg-black/40 text-xs text-ft-cyan font-mono p-3 focus:outline-none resize-none placeholder-ft-muted/50"
						placeholder={`// Escribe tu código ${codeLang} aquí...`}
						rows={6}
						value={codeSnippet}
						onChange={(e: Event) => setCodeSnippet((e.target as HTMLTextAreaElement).value)}
						spellCheck={false}
					/>
				</div>
			)}

			<div className="flex items-center justify-between mt-3 pt-3 border-t border-ft-border">
				<div className="flex space-x-1">
					<button
						type="button"
						onClick={handleToggleCodePanel}
						className={`flex items-center space-x-1.5 text-xs px-2 py-1.5 rounded-lg border transition-all duration-150 active:scale-95 ${
							showCodePanel
								? 'text-ft-cyan border-ft-cyan/40 bg-ft-cyan/10'
								: 'text-ft-muted hover:text-ft-cyan border-transparent hover:border-ft-cyan/20 hover:bg-ft-cyan/5'
						}`}
					>
						<span>💻</span>
						<span className="hidden sm:inline">Código</span>
					</button>
				</div>
				<Button
					variant="primary"
					size="sm"
					disabled={!hasContent || !token || isSubmitting}
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
