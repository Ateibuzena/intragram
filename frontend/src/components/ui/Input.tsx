import './Input.css';
import type { InputProps } from '@/types/props';

export const Input = ({ icon, className = '', ...props }: InputProps) => (
	<div className="input-wrapper">
		{icon && <span className="input-icon">{icon}</span>}
		<input
			className={`input-base ${icon ? 'input-with-icon' : ''} ${className}`}
			{...props}
		/>
	</div>
);
