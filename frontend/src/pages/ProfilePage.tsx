import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import {
	useProfileData,
	ProfileHeader,
	CommonCoreProgress,
	TitlesCard,
	SkillsRadar,
	ProjectsCard,
	ProfileDetails,
	ProfileStats,
	decodeTokenPayload,
} from '@/components/profile';
import { buildApiUrl } from '@/utils/apiBase';

type ProfileEditFormState = {
	display_name: string;
	avatar_url: string;
};

const extractErrorMessage = async (response: Response) => {
	const contentType = response.headers.get('content-type') ?? '';
	const text = await response.text();

	if (contentType.includes('application/json')) {
		try {
			const payload = JSON.parse(text);
			if (typeof payload === 'string') return payload;
			if (payload && typeof payload === 'object') {
				if (typeof payload.message === 'string') return payload.message;
				if (Array.isArray(payload.message)) return payload.message.join(', ');
				if (typeof payload.error === 'string') return payload.error;
			}
		} catch {
			// Fallback to plain text below.
		}
	}

	return text || 'No se pudo actualizar el perfil.';
};

const ProfilePage = () => {
	const { token } = useAuth();
	const { profile, setProfile, loading, error, fallbackLogin, refreshProfile } = useProfileData();
	const [editOpen, setEditOpen] = useState(false);
	const [saving, setSaving] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);
	const [editForm, setEditForm] = useState<ProfileEditFormState>({
		display_name: '',
		avatar_url: '',
	});

	const tokenPayload = decodeTokenPayload(token);

	const profileLogin = profile?.login ?? fallbackLogin;
	const displayName = profile?.display_name || `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || profileLogin;
	const profileInitial = displayName.charAt(0).toUpperCase();
	// chat_user_id is the authenticated user's profile ID stored in the JWT.
	// If not present, ownership cannot be verified and editing is not allowed.
	const canonicalProfileId = tokenPayload?.chat_user_id ?? null;
	const canEditProfile = Boolean(
		profile && token && canonicalProfileId && profile.id === canonicalProfileId,
	);

	useEffect(() => {
		if (!editOpen || !profile) return;

		setEditForm({
			display_name: profile.display_name ?? '',
			avatar_url: profile.avatar_url ?? '',
		});
	}, [editOpen, profile]);

	useEffect(() => {
		if (editOpen && !canEditProfile) {
			setEditOpen(false);
			setSaveError(null);
		}
	}, [canEditProfile, editOpen]);

	const openEditModal = () => {
		if (!profile || !canEditProfile) return;

		setEditForm({
			display_name: profile.display_name ?? '',
			avatar_url: profile.avatar_url ?? '',
		});
		setSaveError(null);
		setEditOpen(true);
	};

	const closeEditModal = () => {
		if (saving) return;
		setEditOpen(false);
		setSaveError(null);
	};

	const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (!token || !profile || !canEditProfile) return;

		const nextDisplayName = editForm.display_name.trim();
		const nextAvatarUrl = editForm.avatar_url.trim();

		if (!nextDisplayName) {
			setSaveError('El nombre visible no puede estar vacío.');
			return;
		}

		if (nextAvatarUrl) {
			try {
				const parsed = new URL(nextAvatarUrl);
				if (!['http:', 'https:'].includes(parsed.protocol)) {
					throw new Error('Invalid protocol');
				}
			} catch {
				setSaveError('Introduce una URL válida para el avatar.');
				return;
			}
		}

		setSaving(true);
		setSaveError(null);

		try {
			const response = await fetch(buildApiUrl(`/users/${canonicalProfileId}/profile`), {
				method: 'PATCH',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					display_name: nextDisplayName,
					...(nextAvatarUrl ? { avatar_url: nextAvatarUrl } : {}),
				}),
			});

			if (!response.ok) {
				throw new Error(await extractErrorMessage(response));
			}

			const updatedProfile = (await response.json()) as typeof profile;
			setProfile(updatedProfile);
			await refreshProfile({ silent: true });
			setEditOpen(false);
		} catch (error) {
			setSaveError(error instanceof Error ? error.message : 'No se pudo actualizar el perfil.');
		} finally {
			setSaving(false);
		}
	};

	const campus = profile?.campus ?? 'N/A';
	const role = profile?.staff ? 'Staff' : profile?.alumni ? 'Alumni' : 'Student';
	const profileStatus = profile?.active ? 'Activo' : 'Inactivo';
	const pool = [profile?.pool_month, profile?.pool_year].filter(Boolean).join(' ') || 'N/A';
	const cursusLevel = profile?.levels?.[0]?.level ?? 0;
	const cursusGrade = profile?.levels?.[0]?.grade ?? 'N/A';
	const level = Math.max(0, Math.round(cursusLevel * 100) / 100);
	const levelInteger = Math.floor(cursusLevel);
	const levelProgress = cursusLevel - levelInteger;
	const progressPercentage = levelProgress * 100;

	return (
		<div className="w-full px-3 md:px-6 lg:px-8">
			<section className="mb-4 space-y-3">
				<div className="grid grid-cols-1 xl:grid-cols-3 gap-3 xl:items-start">
					{/* Left column: Profile Picture + Common Core Progress + Titles */}
					<div className="flex flex-col gap-3 xl:h-[34rem]">
						{/* Profile Header — grows to match the height of Skills and Projects */}
						<div className="flex-1 min-h-0">
							<ProfileHeader
								profile={profile}
								displayName={displayName}
								profileLogin={profileLogin}
								profileInitial={profileInitial}
								loading={loading}
								error={error}
								canEditProfile={canEditProfile}
								onEditProfile={openEditModal}
							/>
						</div>

						{/* Common Core Progress and Titles Row */}
						<div className="grid grid-cols-2 gap-3 flex-shrink-0">
							<CommonCoreProgress
								cursusLevel={cursusLevel}
								cursusGrade={cursusGrade}
								levelInteger={levelInteger}
								level={level}
								progressPercentage={progressPercentage}
							/>
							<TitlesCard profile={profile} />
						</div>
					</div>

					{/* Skills Radar Chart */}
					<SkillsRadar skills={profile?.skills} />

					{/* Projects */}
					<ProjectsCard profile={profile} />
				</div>

				{/* Profile Details */}
				<ProfileDetails profile={profile} campus={campus} />

				{/* Stats Cards */}
				<ProfileStats
					profile={profile}
					campus={campus}
					pool={pool}
					role={role}
					profileStatus={profileStatus}
				/>

			</section>

			{editOpen && profile && (
				<Modal onClose={closeEditModal} title="Editar perfil">
					<form className="space-y-4" onSubmit={handleEditSubmit}>
						<p className="text-xs text-ft-muted -mt-2">
							Actualiza tu nombre visible y la URL de tu avatar. No se admite subida de archivos en este paso.
						</p>
						<div>
							<label className="block text-xs font-semibold text-ft-muted mb-1.5 uppercase tracking-wide" htmlFor="profile-display-name">
								Nombre visible
							</label>
							<Input
								id="profile-display-name"
								name="display_name"
								type="text"
								value={editForm.display_name}
								onChange={(event) => setEditForm((current) => ({ ...current, display_name: event.target.value }))}
								placeholder="Tu nombre visible"
								autoComplete="name"
								maxLength={80}
								required
							/>
						</div>
						<div>
							<label className="block text-xs font-semibold text-ft-muted mb-1.5 uppercase tracking-wide" htmlFor="profile-avatar-url">
								Avatar URL
							</label>
							<Input
								id="profile-avatar-url"
								name="avatar_url"
								type="url"
								value={editForm.avatar_url}
								onChange={(event) => setEditForm((current) => ({ ...current, avatar_url: event.target.value }))}
								placeholder="https://example.com/avatar.jpg"
								autoComplete="url"
								maxLength={2048}
							/>
							<p className="mt-1 text-[11px] text-ft-muted">Opcional. Usa una URL pública con http o https.</p>
						</div>

						{saveError && <p className="text-xs text-red-400">{saveError}</p>}

						<div className="flex gap-2.5 pt-2">
							<Button variant="secondary" size="md" className="flex-1" type="button" onClick={closeEditModal} disabled={saving}>
								Cancelar
							</Button>
							<Button variant="primary" size="md" className="flex-1" type="submit" disabled={saving}>
								{saving ? 'Guardando...' : 'Guardar cambios'}
							</Button>
						</div>
					</form>
				</Modal>
			)}
		</div>
	);
};
export default ProfilePage;
