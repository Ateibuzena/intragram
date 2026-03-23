import './Avatar.css';
import { getGradient } from '@/utils/theme';
import type { AvatarProps } from '@/types/props';

export const Avatar = ({ login, size = 'md', online }: AvatarProps) => (
  <div className="relative flex-shrink-0">
    <div
      className={`avatar avatar-${size}`}
      style={{ background: `linear-gradient(135deg, ${getGradient(login)})` }}
    >
      {login[0]}
    </div>
    {online && <span className="avatar-online" />}
  </div>
);
