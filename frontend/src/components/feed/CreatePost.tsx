import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { useAuth } from '@/hooks/useAuth';
import { usePresenceStatus } from '@/hooks/usePresenceContext';
import { LANGUAGES } from '@/constants/languages';

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

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
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
	const imageInputRef = useRef<HTMLInputElement>(null);
	const { token, user, profile } = useAuth();
	const { connected } = usePresenceStatus();
	const initial = (profile?.login || user?.username || '?').charAt(0).toUpperCase();
	const avatarUrl = profile?.avatar_url ?? null;

	// Revoke the preview object URL whenever it's replaced or the component unmounts.
	useEffect(() => {
		return () => {
			if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
		};
	}, [imagePreviewUrl]);

	const handleToggleCodePanel = () => {
		setShowCodePanel((v) => !v);
		if (showCodePanel) setCodeSnippet('');
	};

	const handleSelectImage = (e: ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		e.target.value = '';
		if (!file) return;

		if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
			setError('Formato de imagen no soportado (usa JPEG, PNG, WebP o GIF).');
			return;
		}
		if (file.size > MAX_IMAGE_BYTES) {
			setError('La imagen supera el tamaño máximo permitido (8MB).');
			return;
		}

		setError(null);
		if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
		setImageFile(file);
		setImagePreviewUrl(URL.createObjectURL(file));
	};

	const handleRemoveImage = () => {
		if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
		setImageFile(null);
		setImagePreviewUrl(null);
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
			// Always multipart: the endpoint is wrapped in a FileInterceptor on the
			// gateway, which only parses multipart/form-data bodies.
			const formData = new FormData();
			formData.append('content', content);
			if (imageFile) formData.append('image', imageFile);

			const res = await fetchWithAuth('/posts/feed', token, {
				method: 'POST',
				body: formData,
			});
			if (!res.ok) {
				const message = await res.text().catch(() => '');
				console.error('Error al publicar en el feed', res.status, message);
				// A 401 here means fetchWithAuth already tried (and failed) to refresh —
				// the global auth:logout-required listener in useAuth handles the redirect.
				setError('No se pudo publicar tu actualización. Inténtalo de nuevo más tarde.');
				return;
			}
			setPostText('');
			setCodeSnippet('');
			setShowCodePanel(false);
			handleRemoveImage();
			onPostCreated?.();
		} finally {
			setIsSubmitting(false);
		}
	};

	const hasContent = postText.trim().length > 0 || codeSnippet.trim().length > 0;

	return (
		<div className="surface-glass border border-ft-border rounded-2xl p-4 mb-4 hover:border-ft-cyan/20 transition-all duration-200">
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
					onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setPostText(e.target.value)}
				/>
			</div>

			{/* Panel de código */}
			{showCodePanel && (
				<div className="mt-3 border border-ft-cyan/30 rounded-xl overflow-hidden">
					<div className="flex items-center justify-between px-3 py-2 bg-ft-card border-b border-ft-border">
						<select
							value={codeLang}
							onChange={(e: ChangeEvent<HTMLSelectElement>) => setCodeLang(e.target.value)}
							className="bg-transparent text-xs text-ft-cyan font-mono focus:outline-none cursor-pointer"
						>
							{LANGUAGES.map((l) => (
								<option key={l.value} value={l.value} className="bg-ft-bg text-white">
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
						className="w-full bg-ft-card text-xs text-ft-cyan font-mono p-3 focus:outline-none resize-none placeholder-ft-muted/50"
						placeholder={`// Escribe tu código ${codeLang} aquí...`}
						rows={6}
						value={codeSnippet}
						onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setCodeSnippet(e.target.value)}
						spellCheck={false}
					/>
				</div>
			)}

			{/* Preview de imagen */}
			{imagePreviewUrl && (
				<div className="mt-3 relative inline-block">
					<img src={imagePreviewUrl} alt="" className="max-h-48 rounded-xl border border-ft-border object-cover" />
					<button
						type="button"
						onClick={handleRemoveImage}
						title="Quitar imagen"
						className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-ft-bg border border-ft-border text-ft-muted hover:text-red-400 hover:border-red-400/40 transition-colors"
					>
						✕
					</button>
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
					<input
						ref={imageInputRef}
						type="file"
						accept="image/jpeg,image/png,image/webp,image/gif"
						onChange={handleSelectImage}
						className="hidden"
					/>
					<button
						type="button"
						onClick={() => imageInputRef.current?.click()}
						className={`flex items-center space-x-1.5 text-xs px-2 py-1.5 rounded-lg border transition-all duration-150 active:scale-95 ${
							imageFile
								? 'text-ft-cyan border-ft-cyan/40 bg-ft-cyan/10'
								: 'text-ft-muted hover:text-ft-cyan border-transparent hover:border-ft-cyan/20 hover:bg-ft-cyan/5'
						}`}
					>
						<span>🖼️</span>
						<span className="hidden sm:inline">Foto</span>
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
