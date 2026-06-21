import { UserProfileEntityDto } from './profileTypes';
import { formatDate } from './profileUtils';

interface ProfileDetailsProps {
	profile: UserProfileEntityDto | null;
	campus: string;
}

export const ProfileDetails = ({ profile, campus }: ProfileDetailsProps) => {
	return (
		<div className="surface-glass border border-ft-border rounded-2xl p-4">
			<h3 className="text-sm font-bold text-white mb-3">Profile Details</h3>
			<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
				<div>
					<p className="text-ft-muted uppercase text-[10px] font-semibold">Email</p>
					<p className="text-white truncate">{profile?.email ?? 'N/A'}</p>
				</div>
				<div>
					<p className="text-ft-muted uppercase text-[10px] font-semibold">Campus</p>
					<p className="text-white">{campus}</p>
				</div>
				<div>
					<p className="text-ft-muted uppercase text-[10px] font-semibold">Pool</p>
					<p className="text-white">{profile?.pool_month ?? 'N/A'} {profile?.pool_year ?? ''}</p>
				</div>
				<div>
					<p className="text-ft-muted uppercase text-[10px] font-semibold">Location</p>
					<p className="text-white truncate">{profile?.location ?? 'N/A'}</p>
				</div>
				<div>
					<p className="text-ft-muted uppercase text-[10px] font-semibold">Phone</p>
					<p className="text-white truncate">{profile?.phone ?? 'N/A'}</p>
				</div>
				<div>
					<p className="text-ft-muted uppercase text-[10px] font-semibold">Role</p>
					<p className="text-white">{profile?.staff ? 'Staff' : profile?.alumni ? 'Alumni' : 'Student'}</p>
				</div>
				<div>
					<p className="text-ft-muted uppercase text-[10px] font-semibold">Last Login</p>
					<p className="text-white text-[11px]">{formatDate(profile?.last_login_at ?? null)}</p>
				</div>
				<div>
					<p className="text-ft-muted uppercase text-[10px] font-semibold">Created</p>
					<p className="text-white text-[11px]">{formatDate(profile?.created_at ?? null)}</p>
				</div>
			</div>
		</div>
	);
};
