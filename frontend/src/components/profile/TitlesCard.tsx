import { UserProfileEntityDto } from './profileTypes';

interface TitlesCardProps {
	profile: UserProfileEntityDto | null;
}

export const TitlesCard = ({ profile }: TitlesCardProps) => {
	return (
		<div className="bg-ft-card border border-ft-border rounded-2xl p-4">
			<p className="text-[10px] text-ft-cyan uppercase mb-2 font-semibold">Titles</p>
			<div className="space-y-1">
				{profile?.titles && profile.titles.length > 0 ? (
					profile.titles.map((title, idx) => (
						<p key={idx} className="text-xs text-ft-muted truncate">
							{title.name || 'Untitled'}
						</p>
					))
				) : (
					<p className="text-xs text-ft-muted">No titles data</p>
				)}
			</div>
		</div>
	);
};
