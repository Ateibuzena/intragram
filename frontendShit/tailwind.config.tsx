// 1️⃣ Paleta de colores base
// Nombre	    Color aproximado	        Uso recomendado
// primary	    #FF2D95	Rosa neón,          para títulos y botones principales
// secondary	#B200FF	Morado brillante,   para descripciones o detalles
// accent	    #FFEB00	Amarillo neón,      para hover, highlights o iconos
// dark	        #1C0D2E	                    Fondo oscuro o overlay parcial
// light	    #FFFFFF	                    Texto sobre fondo oscuro, links, navbar

/** @type {import('tailwindcss').Config} */

export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",      // todos los componentes y páginas
    "./src/styles/**/*.css",           // todos los CSS dentro de styles
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF2D95',
          light: '#FF69B4',
          dark: '#C21881',
        },
        secondary: {
          DEFAULT: '#B200FF',
          light: '#D466FF',
          dark: '#8000B2',
        },
        accent: {
          DEFAULT: '#FFEB00',
          light: '#FFFF33',
          dark: '#CCBB00',
        },
        dark: {
          DEFAULT: '#1C0D2E',
          light: '#3D1E5F',
          dark: '#0D0615',
        },
        light: {
          DEFAULT: '#FFFFFF',
          light: '#FFFFFF',
          dark: '#F2F2F2',
        },
      },
    },
  },
  plugins: [],
}
