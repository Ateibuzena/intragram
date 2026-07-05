import './Button.css';
import type { ButtonProps } from '@/types/ui';

export const Button = ({
	variant = 'primary',
	size = 'md',
	children,
	className = '',
	...props
}: ButtonProps) => (
	<button
		className={`btn btn-${variant} btn-${size} ${className}`}
		{...props}
	>
		{children}
	</button>
);
