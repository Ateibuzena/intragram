import type { FilterKey } from '@/types/models';

interface FilterIconProps { filterKey: FilterKey; }

export const FilterIcon = ({ filterKey }: FilterIconProps) => {
	if (filterKey === 'reciente') return (
		<svg className="w-[22px] h-[22px] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
		</svg>
	);
	if (filterKey === 'amigos') return (
		<svg className="w-[22px] h-[22px] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
		</svg>
	);
	if (filterKey === 'favoritos') return (
		<svg className="w-[22px] h-[22px] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
		</svg>
	);
	if (filterKey === 'trending') return (
		<svg className="w-[22px] h-[22px] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
		</svg>
	);
	if (filterKey === 'perfil') return (
		<svg className="w-[22px] h-[22px] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
		</svg>
	);
	return null;
};
