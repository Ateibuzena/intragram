# Profile Page

## Purpose

`ProfilePage` renders the 42 profile as a social and academic dashboard for Intragram.

The profile is frontend-only in this phase: it consumes the existing user profile payload and derives useful display metrics in the browser. It does not change OAuth 42, backend persistence, or exposed endpoints.

## Current Experience

The profile is composed from shared components in `frontend/src/components/profile`:

- `ProfileHeader`: avatar, display name, login, selected 42 title, campus, role, current 42 campus login status, pool, Intragram online state, friend/edit controls when allowed, common-core progress ring, and academic stat pills.
- `SkillsRadar`: radar chart generated from the top 7 skills by level, plus exact skill bars.
- `ProjectsCard`: project counters, status filters, status badges, final marks, best mark, and an enriched project list.
- `AchievementsCard`: earned achievements/titles.
- `AcademicTimeline`: chronological view of cursus/level milestones.
- `ProfileDetails`: lower-priority raw profile details such as email, campus, pool, location, phone, role, last login, and creation date.

The same page handles both contexts. Without a route login it renders the authenticated user's own profile inside the home dashboard; with `/profile/:login` it renders that user's profile as a standalone page. Editing controls are enabled only when the rendered profile belongs to the authenticated user, while friend actions are shown only for other users.

## Derived Metrics

The derived profile layer lives in:

```text
frontend/src/utils/profile.ts
```

`buildProfileInsights(profile)` derives:

- total projects;
- validated projects;
- failed projects;
- in-progress projects;
- average project mark from projects with `final_mark`;
- best project mark;
- top skills sorted by level;
- selected title;
- current level rounded to two decimals;
- integer level;
- next level;
- percentage toward next level;
- campus, pool, role, current 42 campus login status, wallet, and correction points.

Project status badges are inferred from `projects_users.status` and `final_mark`:

- `finished`, `validated`, `done`, or passing final marks map to approved/validated;
- `failed` or failing final marks map to failed;
- `in_progress`, `active`, or `searching` map to active;
- missing or unknown values map to unknown.

## 42 Data Used

The current frontend uses these fields from the profile payload:

- identity: `login`, `display_name`, `first_name`, `last_name`, `avatar_url`, `forty_two_id`;
- status/context: `campus`, `pool_month`, `pool_year`, `staff`, `alumni`, `location`, `active`, `last_login_at`;
- progress: `levels`;
- skills: `skills`;
- titles: `titles`;
- projects: `projects_users.status`, `projects_users.final_mark`;
- counters: `wallet`, `correction_point`;
- secondary details: `email`, `location`, `phone`, `created_at`.

`active` is reserved for Intragram presence and drives online/offline UI. `location` is synchronized from 42 and drives the visible campus login label: a non-empty value means the user appears logged into a 42 campus machine/session.

## Backend Contract

This page still relies on the existing endpoints:

- `GET /users/login/:login`
- profile data loaded through `useProfileData`
- `PATCH /users/:id/profile` for own display name and avatar edits
- friend endpoints used only when `ProfilePage` renders another user's profile

No raw 42 profile payload is exposed to the frontend in this phase.

## Future Improvements

Potential backend/API enrichments:

- project start/end dates;
- multiple campuses;
- richer cursus selection;
- official project validation state instead of frontend inference;
- explicit selected title support if title selection becomes editable;
- historical activity for profile milestones.

## Manual Validation

Check these scenarios after profile changes:

- own profile with complete 42 data;
- own profile with empty skills;
- profile with empty projects;
- public `/profile/:login` profile;
- user without avatar;
- long names and titles;
- desktop and mobile-width layouts;
- public profile does not show edit controls.
