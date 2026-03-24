import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MOCK_CURRENT_USER } from '@/constants/mockData';
import type { SettingsModalProps } from '@/types/props';

const FORM_FIELDS = [
	{ label: 'Nombre de usuario', type: 'text', placeholder: 'tu_login_42', defaultValue: MOCK_CURRENT_USER.login },
	{ label: 'Email', type: 'email', placeholder: 'tu@student.42.fr', defaultValue: `${MOCK_CURRENT_USER.login}@student.42.fr` },
	{ label: 'Nueva contraseña', type: 'password', placeholder: '••••••••', defaultValue: '' },
];

export const SettingsModal = ({ onClose }: SettingsModalProps) => (
	<Modal onClose={onClose} title="Configuración">
		<p className="text-xs text-ft-muted -mt-4 mb-6">Gestiona tu perfil y preferencias</p>

		<div className="flex items-center gap-4 p-4 bg-ft-hover rounded-xl border border-ft-border mb-5">
			<div className="w-12 h-12 rounded-2xl bg-ft-cyan flex items-center justify-center text-lg font-black text-black shadow-ft-glow-sm">
				{MOCK_CURRENT_USER.avatar}
			</div>
			<div>
				<p className="text-sm font-semibold text-white">{MOCK_CURRENT_USER.login}</p>
				<button className="text-xs text-ft-cyan hover:text-ft-cyan-light transition-colors mt-0.5">
					Cambiar avatar
				</button>
			</div>
		</div>

		<div className="space-y-3.5">
			{FORM_FIELDS.map((field) => (
				<div key={field.label}>
					<label className="block text-xs font-semibold text-ft-muted mb-1.5 uppercase tracking-wide">
						{field.label}
					</label>
					<Input type={field.type} placeholder={field.placeholder} defaultValue={field.defaultValue} />
				</div>
			))}
		</div>

		<div className="flex gap-2.5 mt-6">
			<Button variant="secondary" size="md" className="flex-1" onClick={onClose}>Cancelar</Button>
			<Button variant="primary" size="md" className="flex-1">Guardar cambios</Button>
		</div>
	</Modal>
);
