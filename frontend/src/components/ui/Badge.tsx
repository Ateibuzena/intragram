import type { BadgeProps } from '@/types/props';

export const Badge = ({ children, variant = 'level' }: BadgeProps) => {
	const styles = {
		level: 'bg-ft-cyan/10 text-ft-cyan border border-ft-cyan/20',
		notification: 'bg-red-500 text-white',
		status: 'bg-green-500/20 text-green-400 border border-green-500/30',
	};

	return (
		<span className={`text-xs px-1.5 py-0.5 rounded-md font-semibold ${styles[variant]}`}>
			{children}
		</span>
	);
};
