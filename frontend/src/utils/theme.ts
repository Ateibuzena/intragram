const GRADIENT_COLORS = [
  '#00BABC, #0891B2',
  '#F472B6, #EC4899',
  '#FB923C, #F97316',
  '#A78BFA, #8B5CF6',
  '#34D399, #10B981',
  '#FBBF24, #F59E0B',
];

export const getGradient = (login: string): string => {
  const hash = login.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return GRADIENT_COLORS[hash % GRADIENT_COLORS.length];
};
