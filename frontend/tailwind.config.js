/** @type {import('tailwindcss').Config} */
module.exports = {
  // Le decimos a Tailwind qué archivos escanear para generar solo
  // el CSS que realmente se usa. Sin esto generaría miles de clases inútiles.
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],

  theme: {
    extend: {
      // Añadimos colores propios con el prefijo "ft-" (de ft_transcendence / 42).
      // Así podemos usar bg-ft-bg, text-ft-cyan, border-ft-border, etc.
      colors: {
        ft: {
          cyan:        '#00BABC', // el verde/turquesa de la intra de 42
          'cyan-dark': '#008f91', // versión más oscura para hover
          'cyan-light':'#33c8ca', // versión más clara
          bg:          '#141824', // fondo principal: azul marino muy oscuro
          card:        '#1c2130', // tarjetas: un poco más claro
          border:      '#2a3045', // bordes: azul grisáceo
          hover:       '#232a3b', // hover: entre card y border
          text:        '#e2e8f0', // texto: blanco azulado suave
          muted:       '#64748b', // texto secundario: slate-500
          faint:       '#2a3045', // skeleton/separadores
        },
      },
      boxShadow: {
        // Sombras con glow del color de 42 para efectos tipo "neón suave"
        'ft-glow':    '0 0 20px rgba(0,186,188,0.25)',
        'ft-glow-sm': '0 0 10px rgba(0,186,188,0.15)',
        'card':       '0 1px 3px rgba(0,0,0,0.5)',
      },
      transitionTimingFunction: {
        // Curva bezier que simula un "spring" (rebote suave) en las transiciones
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
};
