/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:     '#0f1117',
        bg2:    '#1a1d27',
        bg3:    '#242837',
        border: '#2e3347',
        text:   '#e2e8f0',
        muted:  '#8892a4',
        accent: '#6366f1',
        cyan:   '#22d3ee',
      },
    },
  },
  plugins: [],
};
