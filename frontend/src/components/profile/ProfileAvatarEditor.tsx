import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { UserProfileEntityDto } from '@/types/profile';

const PencilIcon = ({ className }: { className?: string }) => (
	<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
	</svg>
);

interface ProfileAvatarEditorModalProps {
	avatarUrl: string | null;
	profileInitial: string;
	onSave: (url: string) => Promise<void>;
	onClose: () => void;
}

export const ProfileAvatarEditorModal = ({ avatarUrl, profileInitial, onSave, onClose }: ProfileAvatarEditorModalProps) => {
	const [input, setInput] = useState(avatarUrl ?? '');
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		inputRef.current?.focus();

		return () => {
			document.body.style.overflow = previousOverflow;
		};
	}, []);

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

	const save = async () => {
		const trimmed = input.trim();
		if (trimmed) {
			try {
				const parsed = new URL(trimmed);
				if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
			} catch {
				setError('Introduce una URL válida (http/https).');
				return;
			}
		}
		setSaving(true);
		try {
			await onSave(trimmed);
			onClose();
		} finally {
			setSaving(false);
		}
	};

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
					{input ? (
						<img src={input} alt="preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
					) : avatarUrl ? (
						<img src={avatarUrl} alt="actual" className="w-full h-full object-cover" />
					) : (
						<span className="w-full h-full flex items-center justify-center text-2xl font-black text-black bg-ft-cyan">{profileInitial}</span>
					)}
				</div>
				<div className="w-full space-y-3">
					<input
						ref={inputRef}
						type="url"
						value={input}
						onChange={(e) => { setInput(e.target.value); setError(null); }}
						placeholder="https://example.com/foto.jpg"
						className="w-full bg-ft-hover border border-ft-border rounded-xl px-3 py-2 text-xs text-ft-text placeholder-ft-muted focus:outline-none focus:border-ft-cyan/50 transition-colors"
					/>
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
}

export const ProfileAvatarDisplay = ({
	profile,
	displayName,
	profileInitial,
	online,
	canEdit,
	onStartEdit,
}: ProfileAvatarDisplayProps) => (
	<div className="relative group/avatar shrink-0">
		<div className="w-36 h-36 md:w-44 md:h-44 rounded-2xl bg-ft-cyan text-black font-black text-6xl flex items-center justify-center overflow-hidden shadow-ft-glow-sm">
			{profile?.avatar_url ? (
				<img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
			) : (
				<span>{profileInitial}</span>
			)}
		</div>

		{canEdit && (
			<button
				type="button"
				onClick={onStartEdit}
				className="absolute inset-0 rounded-2xl bg-black/25 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity"
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
