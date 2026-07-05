import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

interface PhotoAttachmentButtonProps {
	/** Called with a validated image file, from either the camera or the gallery picker. */
	onSelect: (file: File) => void;
	/** Called with a user-facing message when a picked file fails validation. */
	onError?: (message: string) => void;
	/** Classes applied to the trigger <button>; content/look stays up to the caller. */
	className?: string;
	children: ReactNode;
}

/**
 * Attach-a-photo control shared by the feed composer and the chat composer:
 * a trigger button that opens a "Tomar foto / Elegir de galería" picker, plus
 * a live camera-capture modal via getUserMedia (an <input capture> attribute
 * is mobile-only and desktop browsers ignore it entirely).
 *
 * Both modals are portaled to document.body: rendering them as descendants of
 * a surface-glass-styled ancestor (backdrop-filter) would create a new
 * containing block for their position:fixed layer, clipping them to that
 * ancestor's box instead of the viewport.
 */
export const PhotoAttachmentButton = ({ onSelect, onError, className, children }: PhotoAttachmentButtonProps) => {
	const [showPhotoMenu, setShowPhotoMenu] = useState(false);
	const [showCameraModal, setShowCameraModal] = useState(false);
	const [cameraError, setCameraError] = useState<string | null>(null);
	const galleryInputRef = useRef<HTMLInputElement>(null);
	const videoRef = useRef<HTMLVideoElement>(null);
	const streamRef = useRef<MediaStream | null>(null);

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

	const applySelectedFile = (file: File) => {
		if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
			onError?.('Formato de imagen no soportado (usa JPEG, PNG, WebP o GIF).');
			return;
		}
		if (file.size > MAX_IMAGE_BYTES) {
			onError?.('La imagen supera el tamaño máximo permitido (8MB).');
			return;
		}
		onSelect(file);
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

	return (
		<>
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
				className={className}
			>
				{children}
			</button>

			{/* Selector de origen: cámara o galería. */}
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

			{/* Captura en vivo vía getUserMedia. object-contain (no cover) para que
			    la preview muestre exactamente el mismo encuadre que se captura
			    en el canvas. */}
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
		</>
	);
};
