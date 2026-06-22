import type { ProfileInsights, UserProfileEntityDto } from '@/types/profile';
import { formatDate } from '@/utils/profile';

interface ProfileDetailsProps {
	profile: UserProfileEntityDto | null;
	insights: ProfileInsights;
}

export const ProfileDetails = ({ profile, insights }: ProfileDetailsProps) => {
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
					<p className="text-white">{insights.campus}</p>
				</div>
				<div>
					<p className="text-ft-muted uppercase text-[10px] font-semibold">Campus City</p>
					<p className="text-white truncate">{profile?.campus_city ?? 'N/A'}</p>
				</div>
				<div>
					<p className="text-ft-muted uppercase text-[10px] font-semibold">Campus Country</p>
					<p className="text-white truncate">{profile?.campus_country ?? 'N/A'}</p>
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
					<p className="text-ft-muted uppercase text-[10px] font-semibold">42 Active</p>
					<p className="text-white">{profile?.forty_two_active === null || profile?.forty_two_active === undefined ? 'N/A' : profile.forty_two_active ? 'Yes' : 'No'}</p>
				</div>
				<div>
					<p className="text-ft-muted uppercase text-[10px] font-semibold">Cursus Grade</p>
					<p className="text-white truncate">{insights.cursusGrade}</p>
				</div>
				<div>
					<p className="text-ft-muted uppercase text-[10px] font-semibold">Cursus Start</p>
					<p className="text-white text-[11px]">{formatDate(insights.cursusBeginAt)}</p>
				</div>
				<div>
					<p className="text-ft-muted uppercase text-[10px] font-semibold">Cursus End</p>
					<p className="text-white text-[11px]">{formatDate(insights.cursusEndAt)}</p>
				</div>
				<div>
					<p className="text-ft-muted uppercase text-[10px] font-semibold">Black Hole</p>
					<p className="text-white text-[11px]">{formatDate(insights.cursusBlackholedAt)}</p>
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
