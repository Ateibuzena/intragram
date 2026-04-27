import { UserProfileEntityDto } from './profileTypes';

interface ProfileStatsProps {
	profile: UserProfileEntityDto | null;
	campus: string;
	pool: string;
	role: string;
	profileStatus: string;
}

export const ProfileStats = ({ profile, campus, pool, role, profileStatus }: ProfileStatsProps) => {
	const wallet = profile?.wallet ?? 0;
	const correctionPoint = profile?.correction_point ?? 0;

	return (
		<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
			<div className="bg-ft-card border border-ft-border rounded-lg p-2">
				<p className="text-[10px] text-ft-muted uppercase">Wallet</p>
				<p className="text-lg font-black text-white">{wallet} ₳</p>
			</div>
			<div className="bg-ft-card border border-ft-border rounded-lg p-2">
				<p className="text-[10px] text-ft-muted uppercase">Correction Points</p>
				<p className="text-lg font-black text-white">{correctionPoint}</p>
			</div>
			<div className="bg-ft-card border border-ft-border rounded-lg p-2">
				<p className="text-[10px] text-ft-muted uppercase">Campus</p>
				<p className="text-sm font-black text-white truncate">{campus}</p>
			</div>
			<div className="bg-ft-card border border-ft-border rounded-lg p-2">
				<p className="text-[10px] text-ft-muted uppercase">Pool</p>
				<p className="text-sm font-black text-white truncate">{pool}</p>
			</div>
			<div className="bg-ft-card border border-ft-border rounded-lg p-2">
				<p className="text-[10px] text-ft-muted uppercase">Role</p>
				<p className="text-sm font-black text-white">{role}</p>
			</div>
			<div className="bg-ft-card border border-ft-border rounded-lg p-2">
				<p className="text-[10px] text-ft-muted uppercase">Status</p>
				<p className="text-sm font-black text-white">{profileStatus}</p>
			</div>
		</div>
	);
};
