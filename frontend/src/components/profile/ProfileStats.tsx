import type { ProfileInsights } from '@/types/profile';

interface ProfileStatsProps {
	insights: ProfileInsights;
}

export const ProfileStats = ({ insights }: ProfileStatsProps) => {
	return (
		<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
			<div className="surface-glass border border-ft-border rounded-lg p-2">
				<p className="text-[10px] text-ft-muted uppercase">Proyectos</p>
				<p className="text-lg font-black text-white">{insights.totalProjects}</p>
			</div>
			<div className="surface-glass border border-ft-border rounded-lg p-2">
				<p className="text-[10px] text-ft-muted uppercase">Validados</p>
				<p className="text-lg font-black text-green-300">{insights.validatedProjects}</p>
			</div>
			<div className="surface-glass border border-ft-border rounded-lg p-2">
				<p className="text-[10px] text-ft-muted uppercase">Nota media</p>
				<p className="text-lg font-black text-white">{insights.averageProjectMark ?? '-'}</p>
			</div>
			<div className="surface-glass border border-ft-border rounded-lg p-2">
				<p className="text-[10px] text-ft-muted uppercase">Wallet</p>
				<p className="text-lg font-black text-white">{insights.wallet} ₳</p>
			</div>
			<div className="surface-glass border border-ft-border rounded-lg p-2">
				<p className="text-[10px] text-ft-muted uppercase">Corrections</p>
				<p className="text-lg font-black text-white">{insights.correctionPoint}</p>
			</div>
			<div className="surface-glass border border-ft-border rounded-lg p-2">
				<p className="text-[10px] text-ft-muted uppercase">Campus</p>
				<p className="text-sm font-black text-white truncate">{insights.campus}</p>
			</div>
		</div>
	);
};
