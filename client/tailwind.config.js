/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        night: '#0d0a1f',
        midnight: '#1a1033',
        violet: '#3a2670',
        pearl: '#f0e8d8',
        ember: '#ff5e3a',
        gold: '#ffd84d',
        ice: '#7cd1ff',
        toxic: '#7cff7a',
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
        retro: ['VT323', 'monospace'],
      },
    },
  },
  plugins: [],
};
