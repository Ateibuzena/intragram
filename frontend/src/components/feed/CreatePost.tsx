import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { createPortal } from 'react-dom';
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
	const [showPhotoMenu, setShowPhotoMenu] = useState(false);
	const [showCameraModal, setShowCameraModal] = useState(false);
	const [cameraError, setCameraError] = useState<string | null>(null);
	const galleryInputRef = useRef<HTMLInputElement>(null);
	const videoRef = useRef<HTMLVideoElement>(null);
	const streamRef = useRef<MediaStream | null>(null);
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

	// Stop the camera stream on unmount so the browser releases the device
	// even if the user navigates away with the camera modal still open.
	useEffect(() => {
		return () => { streamRef.current?.getTracks().forEach((track) => track.stop()); };
	}, []);

	// Lock background scroll while either modal is open, matching the other
	// portal-based modals in this codebase (ProfileAvatarEditor, etc.).
	useEffect(() => {
		if (!showPhotoMenu && !showCameraModal) return;
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => { document.body.style.overflow = previousOverflow; };
	}, [showPhotoMenu, showCameraModal]);

	const handleToggleCodePanel = () => {
		setShowCodePanel((v) => !v);
		if (showCodePanel) setCodeSnippet('');
	};

	const applySelectedFile = (file: File) => {
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

	const handleSelectImage = (e: ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		e.target.value = '';
		if (!file) return;
		applySelectedFile(file);
	};

	const stopCameraStream = () => {
		streamRef.current?.getTracks().forEach((track) => track.stop());
		streamRef.current = null;
	};

	// Opens a live camera preview via getUserMedia instead of relying on
	// <input capture>, which only works on some mobile browsers and is
	// ignored entirely on desktop — this way "Tomar foto" opens the actual
	// webcam/camera on any device with HTTPS + camera permission.
	const handleOpenCamera = async () => {
		setShowPhotoMenu(false);
		setCameraError(null);
		setShowCameraModal(true);
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: 'environment' },
				audio: false,
			});
			streamRef.current = stream;
			if (videoRef.current) videoRef.current.srcObject = stream;
		} catch {
			setCameraError('No se pudo acceder a la cámara. Comprueba los permisos del navegador.');
		}
	};

	const handleCloseCameraModal = () => {
		stopCameraStream();
		setShowCameraModal(false);
		setCameraError(null);
	};

	const handleCapturePhoto = () => {
		const video = videoRef.current;
		if (!video || !video.videoWidth) return;

		const canvas = document.createElement('canvas');
		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

		canvas.toBlob((blob) => {
			if (!blob) return;
			applySelectedFile(new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' }));
			handleCloseCameraModal();
		}, 'image/jpeg', 0.92);
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
						<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
						</svg>
						<span className="hidden sm:inline">Código</span>
					</button>
					<input
						ref={galleryInputRef}
						type="file"
						accept="image/jpeg,image/png,image/webp,image/gif"
						onChange={handleSelectImage}
						className="hidden"
					/>
					<button
						type="button"
						onClick={() => setShowPhotoMenu(true)}
						aria-haspopup="dialog"
						aria-expanded={showPhotoMenu}
						className={`flex items-center space-x-1.5 text-xs px-2 py-1.5 rounded-lg border transition-all duration-150 active:scale-95 ${
							imageFile
								? 'text-ft-cyan border-ft-cyan/40 bg-ft-cyan/10'
								: 'text-ft-muted hover:text-ft-cyan border-transparent hover:border-ft-cyan/20 hover:bg-ft-cyan/5'
						}`}
					>
						<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
							<circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" />
						</svg>
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

			{/* Selector de origen: cámara o galería. Portado a document.body: si se
			    renderizara dentro de este propio div (surface-glass usa
			    backdrop-filter), el "fixed" quedaría contenido a este recuadro en
			    vez del viewport — por eso se usa createPortal, igual que el resto
			    de modales del proyecto (ProfileAvatarEditor, ProfileNameEditor). */}
			{showPhotoMenu && createPortal(
				<div
					className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
					role="dialog"
					aria-modal="true"
					onMouseDown={(event) => { if (event.target === event.currentTarget) setShowPhotoMenu(false); }}
				>
					<div className="w-full max-w-xs overflow-hidden rounded-2xl border border-ft-border bg-ft-card shadow-2xl shadow-black/50">
						<button
							type="button"
							onClick={handleOpenCamera}
							className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm text-ft-text hover:bg-ft-hover transition-colors"
						>
							<svg className="w-5 h-5 text-ft-cyan flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
							</svg>
							Tomar foto
						</button>
						<button
							type="button"
							onClick={() => { setShowPhotoMenu(false); galleryInputRef.current?.click(); }}
							className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm text-ft-text hover:bg-ft-hover transition-colors border-t border-ft-border"
						>
							<svg className="w-5 h-5 text-ft-cyan flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
								<circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" />
							</svg>
							Elegir de galería
						</button>
						<button
							type="button"
							onClick={() => setShowPhotoMenu(false)}
							className="w-full px-4 py-3 text-center text-sm text-ft-muted hover:text-white transition-colors border-t border-ft-border"
						>
							Cancelar
						</button>
					</div>
				</div>,
				document.body,
			)}

			{/* Captura en vivo vía getUserMedia, también portada a document.body por
			    la misma razón. object-contain (no cover) para que la preview
			    muestre exactamente el mismo encuadre que se captura en el canvas. */}
			{showCameraModal && createPortal(
				<div
					className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 p-4"
					role="dialog"
					aria-modal="true"
				>
					<div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-ft-border bg-ft-card shadow-2xl shadow-black/50">
						<div className="flex items-center justify-between px-4 py-3 border-b border-ft-border">
							<span className="text-sm font-semibold text-white">Tomar foto</span>
							<button
								type="button"
								onClick={handleCloseCameraModal}
								className="text-ft-muted hover:text-white text-xs transition-colors"
							>
								✕
							</button>
						</div>

						{cameraError ? (
							<p className="p-6 text-center text-xs text-red-400">{cameraError}</p>
						) : (
							<div className="flex items-center justify-center bg-black">
								<video
									ref={videoRef}
									autoPlay
									playsInline
									muted
									className="max-h-[70vh] w-full object-contain"
								/>
							</div>
						)}

						<div className="flex items-center justify-center gap-3 p-4">
							<Button variant="secondary" size="sm" onClick={handleCloseCameraModal}>
								Cancelar
							</Button>
							<Button variant="primary" size="sm" onClick={handleCapturePhoto} disabled={!!cameraError}>
								Capturar
							</Button>
						</div>
					</div>
				</div>,
				document.body,
			)}
		</div>
	);
};
