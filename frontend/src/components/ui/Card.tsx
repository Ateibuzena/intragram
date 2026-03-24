import type { CardProps } from '@/types/props';

export const Card = ({ children, className = '', hover = false }: CardProps) => (
	<div className={`
    bg-ft-card border border-ft-border rounded-2xl
    ${hover ? 'hover:border-ft-cyan/20 transition-all duration-200' : ''}
    ${className}
  `}>
		{children}
	</div>
);
