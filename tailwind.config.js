/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3A5AFE',
        sidebar: '#F1F3F9',
        background: '#F8F9FC',
        border: '#E5E7EB',
        accent: '#EEF2FF',
        textMain: '#1F2937',
        textMuted: '#6B7280',
        success: '#10B981',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};

export default config;