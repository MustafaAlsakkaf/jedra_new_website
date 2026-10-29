/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{html,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#0E1E3D', deep: '#081429', soft: '#1B2D52' },
        gold: { DEFAULT: '#FCB62B', deep: '#D9930B' },
        sand: { DEFAULT: '#EADFCB', deep: '#D9C8A9' },
        muted: '#4A5672',
      },
      fontFamily: {
        sans: ['"Readex Pro"', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        page: '76rem',
      },
    },
  },
  plugins: [],
};
