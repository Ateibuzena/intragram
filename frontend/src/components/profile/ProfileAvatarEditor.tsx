import { useState } from 'react';
import type { UserProfileEntityDto } from '@/types/profile';

const PencilIcon = ({ className }: { className?: string }) => (
	<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
	</svg>
);

interface ProfileAvatarEditorOverlayProps {
	profile: UserProfileEntityDto | null;
	profileInitial: string;
	onSave: (url: string) => Promise<void>;
	onClose: () => void;
}

export const ProfileAvatarEditorOverlay = ({ profile, profileInitial, onSave, onClose }: ProfileAvatarEditorOverlayProps) => {
	const [input, setInput] = useState(profile?.avatar_url ?? '');
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

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

	return (
		<div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-5 surface-glass p-6 rounded-[inherit]">
			<h3 className="text-sm font-bold text-white">Cambiar foto de perfil</h3>
			<div className="w-28 h-28 rounded-2xl overflow-hidden bg-ft-hover flex-shrink-0">
				{input ? (
					<img src={input} alt="preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
				) : profile?.avatar_url ? (
					<img src={profile.avatar_url} alt="actual" className="w-full h-full object-cover" />
				) : (
					<span className="w-full h-full flex items-center justify-center text-2xl font-black text-black bg-ft-cyan">{profileInitial}</span>
				)}
			</div>
			<div className="w-full max-w-sm space-y-3">
				<input
					type="url"
					value={input}
					onChange={(e) => { setInput(e.target.value); setError(null); }}
					placeholder="https://example.com/foto.jpg"
					autoFocus
					className="w-full bg-ft-hover border border-ft-border rounded-xl px-3 py-2 text-xs text-ft-text placeholder-ft-muted focus:outline-none focus:border-ft-cyan/50 transition-colors"
				/>
				{error && <p className="text-[10px] text-red-400 text-center">{error}</p>}
				<div className="flex gap-2">
					<button
						type="button"
						onClick={onClose}
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
