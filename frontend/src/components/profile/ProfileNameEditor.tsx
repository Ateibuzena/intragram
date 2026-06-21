import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';

const PencilIcon = ({ className }: { className?: string }) => (
	<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
	</svg>
);

interface ProfileNameEditorModalProps {
	displayName: string;
	onSave: (name: string) => Promise<void>;
	onClose: () => void;
}

export const ProfileNameEditorModal = ({ displayName, onSave, onClose }: ProfileNameEditorModalProps) => {
	const [input, setInput] = useState(displayName);
	const [saving, setSaving] = useState(false);
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
		const handleKeyDown = (event: globalThis.KeyboardEvent) => {
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
		if (!trimmed) { close(); return; }
		setSaving(true);
		try {
			await onSave(trimmed);
			onClose();
		} finally {
			setSaving(false);
		}
	};

	const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') void save();
		if (e.key === 'Escape') close();
	};

	return createPortal(
		<div
			className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
			role="dialog"
			aria-modal="true"
			aria-labelledby="profile-name-editor-title"
			onMouseDown={(event) => {
				if (event.target === event.currentTarget) {
					close();
				}
			}}
		>
			<div className="flex w-full max-w-md flex-col items-center justify-center gap-4 rounded-2xl border border-ft-border surface-glass p-6 shadow-2xl shadow-black/50">
				<h3 id="profile-name-editor-title" className="text-sm font-bold text-white">Cambiar nombre</h3>
				<div className="w-full space-y-3">
					<input
						ref={inputRef}
						type="text"
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={onKeyDown}
						maxLength={80}
						className="w-full bg-ft-hover border border-ft-border rounded-xl px-3 py-2 text-sm font-bold text-white text-center focus:outline-none focus:border-ft-cyan/50 transition-colors"
					/>
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

interface ProfileNameEditorProps {
	displayName: string;
	canEdit: boolean;
	onStartEdit: () => void;
}

export const ProfileNameEditor = ({ displayName, canEdit, onStartEdit }: ProfileNameEditorProps) => (
	<div className="flex min-w-0 items-center justify-center gap-1.5 group/name md:justify-start">
		<h2
			className={`min-w-0 truncate text-3xl font-black text-white md:text-4xl ${canEdit ? 'cursor-pointer' : ''}`}
			onClick={canEdit ? onStartEdit : undefined}
		>
			{displayName}
		</h2>
		{canEdit && (
			<button
				type="button"
				onClick={onStartEdit}
				className="flex-shrink-0 opacity-0 group-hover/name:opacity-100 transition-opacity text-ft-muted hover:text-white"
			>
				<PencilIcon className="w-3.5 h-3.5" />
			</button>
		)}
	</div>
);
