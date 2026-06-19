import './Avatar.css';
import { getGradient } from '@/utils/theme';
import type { AvatarProps } from '@/types/props';

export const Avatar = ({ login, imageUrl = null, size = 'md', online }: AvatarProps) => (
	<div className="relative flex-shrink-0">
		<div
			className={`avatar avatar-${size}`}
			style={{ background: `linear-gradient(135deg, ${getGradient(login)})` }}
		>
			{imageUrl ? (
				<img
					src={imageUrl}
					alt={login}
					className="avatar-image"
					referrerPolicy="no-referrer"
				/>
			) : (
				login[0]
			)}
		</div>
		{online !== undefined && <span className={online ? 'avatar-online' : 'avatar-offline'} />}
	</div>
);
