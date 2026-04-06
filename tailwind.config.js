/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './App.tsx', './index.tsx', './types.ts', './components/**/*.{js,ts,jsx,tsx}', './hooks/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Lato', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        linarc: {
          header: '#1a1a1a',
          rail: '#f9fafb',
          accent: '#2563eb',
          brand: '#2563eb',
        },
      },
      boxShadow: {
        linarc: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'linarc-md': '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
      },
    },
  },
  plugins: [],
};
