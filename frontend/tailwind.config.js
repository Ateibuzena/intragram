/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'ft-bg': '#050816',
        'ft-card': 'rgba(17, 24, 39, 0.64)',
        'ft-border': 'rgba(55, 65, 81, 0.42)',
        'ft-hover': 'rgba(27, 35, 53, 0.58)',
        'ft-faint': 'rgba(17, 24, 39, 0.44)',
        'ft-text': '#e5e7eb',
        'ft-muted': '#6b7280',
        'ft-cyan': '#00babc',
        'ft-cyan-light': '#22d3ee',
      },
      boxShadow: {
        'ft-glow': '0 0 30px rgba(0, 186, 188, 0.35)',
        'ft-glow-sm': '0 0 15px rgba(0, 186, 188, 0.25)',
      },
    },
  },
  plugins: [],
};
