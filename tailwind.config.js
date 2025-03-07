/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1e40af',
        secondary: '#0ea5e9',
        danger: '#dc2626',
        success: '#16a34a',
        background: '#f8fafc',
      },
    },
  },
  plugins: [],
} 