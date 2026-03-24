import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MOCK_CURRENT_USER } from '@/constants/mockData';

const ATTACHMENT_BUTTONS = [
	{ icon: '📷', label: 'Imagen' },
	{ icon: '💻', label: 'Código' },
	{ icon: '🏆', label: 'Logro' },
];

export const CreatePost = () => {
	const [postText, setPostText] = useState('');

	return (
		<div className="bg-ft-card border border-ft-border rounded-2xl p-4 mb-4 hover:border-ft-cyan/20 transition-all duration-200">
			<div className="flex items-start space-x-3">
				<div className="w-8 h-8 rounded-full bg-ft-cyan flex items-center justify-center font-bold text-xs text-black flex-shrink-0">
					{MOCK_CURRENT_USER.avatar}
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
				<Button variant="primary" size="sm" disabled={!postText.trim()}>
					Publicar
				</Button>
			</div>
		</div>
	);
};
