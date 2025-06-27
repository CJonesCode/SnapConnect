const { theme } = require('nativewind/dist/theme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#ffffff',
        text: '#111827',
        border: '#d1d5db', // gray-300
        accent: '#3b82f6', // blue-500
        input: '#e5e7eb', // gray-200
        placeholder: '#6b7280', // gray-500
        destructive: '#ef4444', // red-500

        dark: {
          background: '#121212',
          text: '#f9fafb', // gray-50
          border: '#4b5563', // gray-600
          accent: '#60a5fa', // blue-400
          input: '#374151', // gray-700
          placeholder: '#9ca3af', // gray-400
          destructive: '#dc2626', // red-600
        },
      },
      fontFamily: {
        sans: ['System'],
        mono: ['SpaceMono', 'monospace'],
      },
    },
  },
  plugins: [],
}; 