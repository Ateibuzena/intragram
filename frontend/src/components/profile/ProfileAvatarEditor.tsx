import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { UserProfileEntityDto } from '@/types/profile';
import { resolveMediaUrl } from '@/utils/media';
import { PhotoAttachmentButton } from '@/components/media/PhotoAttachmentButton';

const PencilIcon = ({ className }: { className?: string }) => (
	<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
	</svg>
);

const CameraIcon = ({ className }: { className?: string }) => (
	<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
	</svg>
);

interface ProfileAvatarEditorModalProps {
	avatarUrl: string | null;
	profileInitial: string;
	onSave: (file: File) => Promise<void>;
	onClose: () => void;
}

export const ProfileAvatarEditorModal = ({ avatarUrl, profileInitial, onSave, onClose }: ProfileAvatarEditorModalProps) => {
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';

		return () => {
			document.body.style.overflow = previousOverflow;
		};
	}, []);

	useEffect(() => () => {
		if (previewUrl) URL.revokeObjectURL(previewUrl);
	}, [previewUrl]);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape' && !saving) {
				onClose();
			}
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [onClose, saving]);

	const close = () => {
		if (!saving) {
			onClose();
		}
	};

	const handleFileChange = (file: File | null) => {
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		setError(null);
		setSelectedFile(file);
		setPreviewUrl(file ? URL.createObjectURL(file) : null);
	};

	const save = async () => {
		if (!selectedFile) {
			setError('Selecciona una imagen antes de guardar.');
			return;
		}

		setSaving(true);
		try {
			await onSave(selectedFile);
			onClose();
		} catch {
			setError('No se pudo actualizar la foto de perfil.');
		} finally {
			setSaving(false);
		}
	};

	const currentPreview = previewUrl ?? resolveMediaUrl(avatarUrl);

	return createPortal(
		<div
			className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
			role="dialog"
			aria-modal="true"
			aria-labelledby="profile-avatar-editor-title"
			onMouseDown={(event) => {
				if (event.target === event.currentTarget) {
					close();
				}
			}}
		>
			<div className="flex w-full max-w-md flex-col items-center justify-center gap-5 rounded-2xl border border-ft-border surface-glass p-6 shadow-2xl shadow-black/50">
				<h3 id="profile-avatar-editor-title" className="text-sm font-bold text-white">Cambiar foto de perfil</h3>
				<div className="w-28 h-28 rounded-2xl overflow-hidden bg-ft-hover flex-shrink-0">
					{currentPreview ? (
						<img src={currentPreview} alt="preview" className="w-full h-full object-cover" />
					) : (
						<span className="w-full h-full flex items-center justify-center text-2xl font-black text-black bg-ft-cyan">{profileInitial}</span>
					)}
				</div>
				<div className="w-full space-y-3">
					<PhotoAttachmentButton
						onSelect={handleFileChange}
						onError={setError}
						className="w-full flex items-center justify-center gap-2 bg-ft-hover border border-ft-border rounded-xl px-3 py-2.5 text-xs font-semibold text-ft-cyan hover:bg-ft-hover/70 focus:outline-none focus:border-ft-cyan/50 transition-colors"
					>
						<CameraIcon className="w-4 h-4" />
						{selectedFile ? 'Cambiar foto' : 'Tomar foto o elegir de galería'}
					</PhotoAttachmentButton>
					{error && <p className="text-[10px] text-red-400 text-center">{error}</p>}
					<div className="flex gap-2">
						<button
							type="button"
							onClick={close}
							disabled={saving}
							className="flex-1 py-2 text-xs font-medium text-ft-muted border border-ft-border rounded-xl hover:bg-ft-hover disabled:opacity-40 transition-all"
						>
							Cancelar
						</button>
						<button
							type="button"
							onClick={() => void save()}
							disabled={saving}
							className="flex-1 py-2 text-xs font-semibold bg-ft-cyan/10 text-ft-cyan border border-ft-cyan/30 rounded-xl hover:bg-ft-cyan/20 disabled:opacity-40 transition-all"
						>
							{saving ? 'Guardando...' : 'Guardar'}
						</button>
					</div>
					<div className="text-center">
						<button
							type="button"
							onClick={() => handleFileChange(null)}
							disabled={saving}
							className="text-[10px] font-medium text-ft-muted hover:text-white disabled:opacity-40"
						>
							Quitar selección
						</button>
					</div>
				</div>
			</div>
		</div>,
		document.body,
	);
};

interface ProfileAvatarDisplayProps {
	profile: UserProfileEntityDto | null;
	displayName: string;
	profileInitial: string;
	online?: boolean;
	canEdit: boolean;
	onStartEdit: () => void;
	progressPercentage?: number;
}

export const ProfileAvatarDisplay = ({
	profile,
	displayName,
	profileInitial,
	online,
	canEdit,
	onStartEdit,
	progressPercentage,
}: ProfileAvatarDisplayProps) => (
	<div className="relative group/avatar shrink-0">
		{/* Mobile-only progress ring — sized off the avatar box itself, so it can never
		    drift out of proportion with it the way the wide desktop arc did. */}
		{progressPercentage !== undefined && (
			<div className="absolute -inset-3 md:hidden pointer-events-none" aria-hidden="true">
				<svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
					<circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="5" className="text-ft-border/70" />
					<circle
						cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="5"
						strokeLinecap="round" pathLength={100}
						strokeDasharray={`${progressPercentage} 100`}
						className="text-ft-cyan drop-shadow-[0_0_10px_rgba(0,212,255,0.55)]"
					/>
				</svg>
				<div className="absolute -top-6 left-1/2 -translate-x-1/2 rounded-full border border-ft-cyan/30 bg-ft-card px-2 py-0.5 text-[10px] font-black text-ft-cyan shadow-ft-glow-sm backdrop-blur-sm">
					{progressPercentage}%
				</div>
			</div>
		)}

		<div className="w-28 h-28 xs:w-36 xs:h-36 md:w-44 md:h-44 rounded-full md:rounded-2xl bg-ft-cyan text-black font-black text-5xl xs:text-6xl flex items-center justify-center overflow-hidden shadow-ft-glow-sm">
			{resolveMediaUrl(profile?.avatar_url) ? (
				<img src={resolveMediaUrl(profile?.avatar_url) ?? undefined} alt={displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
			) : (
				<span>{profileInitial}</span>
			)}
		</div>

		{canEdit && (
			<button
				type="button"
				onClick={onStartEdit}
				className="absolute inset-0 rounded-full md:rounded-2xl bg-black/25 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity"
			>
				<PencilIcon className="w-8 h-8 text-white drop-shadow" />
			</button>
		)}

		{online !== undefined && (
			<span
				className={`absolute bottom-2 right-2 w-4 h-4 border-2 border-ft-card rounded-full ${online ? 'bg-green-400' : 'bg-ft-muted'}`}
				title={online ? 'Online' : 'Offline'}
			/>
		)}
	</div>
);
