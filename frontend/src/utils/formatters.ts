export const formatTime = (date: Date | string): string => {
	const d = typeof date === 'string' ? new Date(date) : date;
	const now = new Date();
	const diff = Math.floor((now.getTime() - d.getTime()) / 1000);

	if (diff < 60) return 'ahora mismo';
	if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
	if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
	return `hace ${Math.floor(diff / 86400)} d`;
};
