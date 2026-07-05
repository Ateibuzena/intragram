import { useMemo } from 'react';
import { RenderedContent } from '@/components/content/RenderedContent';
import { useAuthenticatedImage } from '@/hooks/useAuthenticatedImage';
import type { MessageBubbleProps } from '@/types/ui';

const WAVEFORM_BARS = Array.from({ length: 40 }, (_, i) => {
	const seed = (i * 2654435761) >>> 0;
	return 30 + (seed % 70);
});

export const MessageBubble = ({ message, showTimestamp }: MessageBubbleProps) => {
	const isMe = message.sender === 'me';
	const waveHeights = useMemo(() => WAVEFORM_BARS, []);
	// A plain <img src> can't send an Authorization header, and chat images
	// are private (not public like posts) — fetch with the session token and
	// expose as an object URL, same approach as post images.
	const imageObjectUrl = useAuthenticatedImage(message.type === 'image' ? message.imageUrl : null);

	if (message.type === 'image') {
		return (
			<div>
				{showTimestamp && (
					<p className="text-xs text-ft-muted text-center mb-2">{message.timestamp}</p>
				)}
				<div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
					<div className={`max-w-[75%] overflow-hidden ${isMe ? 'bg-blue-500/15 border border-blue-400/30' : 'surface-glass border border-ft-border'} rounded-2xl p-1.5`}>
						{imageObjectUrl ? (
							<img src={imageObjectUrl} alt="" className="max-h-72 w-full rounded-xl object-cover" />
						) : (
							<div className="flex h-40 w-56 items-center justify-center rounded-xl bg-ft-hover">
								<svg className="w-8 h-8 text-ft-muted animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
								</svg>
							</div>
						)}
						{message.text && (
							<div className={`px-2.5 pt-2 pb-1 text-sm break-words whitespace-pre-wrap ${isMe ? 'text-white' : 'text-ft-text'}`}>
								<RenderedContent content={message.text} />
							</div>
						)}
					</div>
				</div>
			</div>
		);
	}

	if (message.type === 'audio') {
		return (
			<div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
				<div className={`max-w-[75%] overflow-hidden ${isMe ? 'bg-blue-500/15 border border-blue-400/30' : 'surface-glass border border-ft-border'} rounded-2xl px-4 py-2.5`}>
					<div className="flex items-center gap-3">
						<button className="flex-shrink-0">
							<svg className={`w-6 h-6 ${isMe ? 'text-white' : 'text-ft-text'}`} fill="currentColor" viewBox="0 0 20 20">
								<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
							</svg>
						</button>
						<div className="flex-1 h-8 bg-white/20 rounded-full overflow-hidden">
							<div className="h-full flex items-center px-2 gap-0.5">
								{waveHeights.map((h, i) => (
									<div key={i} className={`w-0.5 rounded-full ${isMe ? 'bg-blue-200' : 'bg-ft-cyan'}`}
										style={{ height: `${h}%` }} />
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
				<div className={`max-w-[75%] overflow-hidden ${isMe ? 'bg-blue-500/15 border border-blue-400/30' : 'surface-glass border border-ft-border'} rounded-2xl px-4 py-2.5`}>
					<div className={`text-sm break-words whitespace-pre-wrap ${isMe ? 'text-white' : 'text-ft-text'}`}><RenderedContent content={message.text ?? ''} /></div>
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
