import { renderContent } from '@/utils/renderContent';
import type { MessageBubbleProps } from '@/types/props';

export const MessageBubble = ({ message, showTimestamp }: MessageBubbleProps) => {
	const isMe = message.sender === 'me';

	if (message.type === 'audio') {
		return (
			<div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
				<div className={`max-w-xs ${isMe ? 'bg-blue-600' : 'surface-glass border border-ft-border'} rounded-2xl px-4 py-2.5`}>
					<div className="flex items-center gap-3">
						<button className="flex-shrink-0">
							<svg className={`w-6 h-6 ${isMe ? 'text-white' : 'text-ft-text'}`} fill="currentColor" viewBox="0 0 20 20">
								<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
							</svg>
						</button>
						<div className="flex-1 h-8 bg-white/20 rounded-full overflow-hidden">
							<div className="h-full flex items-center px-2 gap-0.5">
								{Array.from({ length: 40 }).map((_, i) => (
									<div key={i} className={`w-0.5 rounded-full ${isMe ? 'bg-white' : 'bg-ft-cyan'}`}
										style={{ height: `${Math.floor(Math.random() * 70 + 30)}%` }} />
								))}
							</div>
						</div>
						<span className={`text-xs ${isMe ? 'text-white/80' : 'text-ft-muted'} flex-shrink-0`}>
							{message.duration}
						</span>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div>
			{showTimestamp && (
				<p className="text-xs text-ft-muted text-center mb-2">{message.timestamp}</p>
			)}
			<div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
				<div className={`max-w-sm ${isMe ? 'bg-blue-600' : 'surface-glass border border-ft-border'} rounded-2xl px-4 py-2.5`}>
					<div className={`text-sm ${isMe ? 'text-white' : 'text-ft-text'}`}>{renderContent(message.text ?? '')}</div>
					{message.reactions && (
						<div className="flex gap-1 mt-2">
							{message.reactions.map((emoji, i) => (
								<span key={i} className="text-base">{emoji}</span>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
