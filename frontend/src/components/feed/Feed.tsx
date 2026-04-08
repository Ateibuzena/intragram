import { MOCK_POSTS } from '@/constants/mockData';
import { useAuth } from '@/hooks/useAuth';
import type { FilterKey } from '@/types/models';
import { CreatePost } from './CreatePost';
import { PostCard } from './PostCard';
import { PostSkeleton } from './PostSkeleton';

interface FeedProps {
	activeFilter: FilterKey;
	loading?: boolean;
}

const FRIENDS_LOGINS = ['mruiz', 'agarcia', 'csmith', 'dperez'];

const filterPosts = (filter: FilterKey, profileLogin: string) => {
	switch (filter) {
		case 'perfil': return MOCK_POSTS.filter((p) => p.user.login === profileLogin);
		case 'amigos': return MOCK_POSTS.filter((p) => FRIENDS_LOGINS.includes(p.user.login));
		case 'seguidos': return MOCK_POSTS.filter((p) => p.user.level >= 10);
		default: return MOCK_POSTS;
	}
};

export const Feed = ({ activeFilter, loading = false }: FeedProps) => {
	const { user } = useAuth();
	const profileLogin = user?.login || user?.username || 'user';
	const displayName = user?.displayName || profileLogin;
	const profileInitial = displayName.charAt(0).toUpperCase();

	const posts = filterPosts(activeFilter, profileLogin);
	const totalLikes = posts.reduce((sum, post) => sum + post.likes, 0);
	const totalComments = posts.reduce((sum, post) => sum + post.comments, 0);
	const wallet = user?.wallet ?? 0;
	const correctionPoint = user?.correctionPoint ?? 0;
	const campus = user?.campus ?? 'N/A';
	const level = Math.max(1, Math.floor(correctionPoint / 5));
	const progressPercent = Math.max(0, Math.min(100, Math.round((level / 21) * 100)));

	return (
		<div>
			{activeFilter === 'perfil' && (
				<section className="mb-4 space-y-3">
					<div className="bg-ft-card border border-ft-border rounded-2xl p-4">
						<div className="flex items-center gap-3">
							<div className="w-12 h-12 rounded-2xl bg-ft-cyan text-black font-black text-lg flex items-center justify-center overflow-hidden">
								{user?.avatarUrl ? (
									<img src={user.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
								) : (
									<span>{profileInitial}</span>
								)}
							</div>
							<div>
								<h2 className="text-base font-bold text-white">{displayName}</h2>
								<p className="text-xs text-ft-muted">@{profileLogin}</p>
							</div>
						</div>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
						<div className="bg-ft-card border border-ft-border rounded-2xl p-4">
							<h3 className="text-sm font-bold text-white mb-3">Common Core Progress</h3>
							<div className="flex items-center gap-3">
								<div className="w-16 h-16 rounded-full border-[6px] border-ft-border border-t-ft-cyan border-r-ft-cyan" />
								<div>
									<p className="text-xs text-ft-muted">Current level</p>
									<p className="text-xl font-black text-white">{level}</p>
									<p className="text-xs text-ft-muted">{progressPercent}%</p>
								</div>
							</div>
							<div className="mt-3 flex flex-wrap gap-1">
								{['M1', 'M2', 'M3', 'M4', 'M5'].map((m) => (
									<span key={m} className="text-[10px] px-2 py-0.5 rounded-full bg-ft-cyan text-black font-semibold">{m}</span>
								))}
							</div>
						</div>

						<div className="bg-ft-card border border-ft-border rounded-2xl p-4">
							<h3 className="text-sm font-bold text-white mb-3">Skills Radar</h3>
							<svg width="100%" height="170" viewBox="0 0 240 200" aria-label="skills radar">
								<polygon points="120,30 190,65 190,135 120,170 50,135 50,65" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
								<polygon points="120,50 173,78 173,122 120,150 67,122 67,78" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
								<polygon points="120,70 157,91 157,109 120,130 83,109 83,91" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
								<polygon points="120,48 178,74 182,118 120,155 65,115 62,72" fill="rgba(0,238,238,0.18)" stroke="#0ee" strokeWidth="1.5" />
								<text x="120" y="22" textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="10">C</text>
								<text x="204" y="67" fill="rgba(255,255,255,0.55)" fontSize="10">C++</text>
								<text x="204" y="138" fill="rgba(255,255,255,0.55)" fontSize="10">Algo</text>
								<text x="120" y="186" textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="10">Unix</text>
								<text x="36" y="138" textAnchor="end" fill="rgba(255,255,255,0.55)" fontSize="10">Net</text>
								<text x="36" y="67" textAnchor="end" fill="rgba(255,255,255,0.55)" fontSize="10">Graphics</text>
							</svg>
						</div>
					</div>

					<div className="grid grid-cols-2 md:grid-cols-3 gap-2">
						<div className="bg-ft-card border border-ft-border rounded-lg p-2">
							<p className="text-[10px] text-ft-muted uppercase">Posts</p>
							<p className="text-lg font-black text-white">{posts.length}</p>
						</div>
						<div className="bg-ft-card border border-ft-border rounded-lg p-2">
							<p className="text-[10px] text-ft-muted uppercase">Likes</p>
							<p className="text-lg font-black text-white">{totalLikes}</p>
						</div>
						<div className="bg-ft-card border border-ft-border rounded-lg p-2">
							<p className="text-[10px] text-ft-muted uppercase">Comments</p>
							<p className="text-lg font-black text-white">{totalComments}</p>
						</div>
						<div className="bg-ft-card border border-ft-border rounded-lg p-2">
							<p className="text-[10px] text-ft-muted uppercase">Wallet</p>
							<p className="text-lg font-black text-white">{wallet}</p>
						</div>
						<div className="bg-ft-card border border-ft-border rounded-lg p-2">
							<p className="text-[10px] text-ft-muted uppercase">CP</p>
							<p className="text-lg font-black text-white">{correctionPoint}</p>
						</div>
						<div className="bg-ft-card border border-ft-border rounded-lg p-2">
							<p className="text-[10px] text-ft-muted uppercase">Campus</p>
							<p className="text-sm font-black text-white truncate">{campus}</p>
						</div>
					</div>

					<div className="bg-ft-card border border-ft-border rounded-2xl p-4">
						<h3 className="text-sm font-bold text-white mb-3">Progress Line Graph</h3>
						<svg width="100%" height="120" viewBox="0 0 280 120" aria-label="progress line">
							<line x1="24" y1="10" x2="280" y2="10" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
							<line x1="24" y1="30" x2="280" y2="30" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
							<line x1="24" y1="50" x2="280" y2="50" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
							<line x1="24" y1="70" x2="280" y2="70" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
							<path d="M28,108 L55,95 L85,80 L110,65 L135,55 L160,38 L190,25 L220,18 L260,10" fill="none" stroke="#0ee" strokeWidth="1.5" />
						</svg>
					</div>

					<h3 className="text-sm font-bold text-ft-cyan uppercase tracking-wide">Mis publicaciones</h3>
				</section>
			)}

			{activeFilter !== 'perfil' && <CreatePost />}
			{loading
				? Array.from({ length: 3 }).map((_, i) => <PostSkeleton key={i} />)
				: posts.map((post, i) => (
					<div key={post.id} className={`animate-fade-in-up-delay-${Math.min(i + 1, 3)}`}>
						<PostCard post={post} />
					</div>
				))
			}
		</div>
	);
};
