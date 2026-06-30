/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#002664',
          'blue-light': '#003d99',
          'blue-dark': '#001a4d',
          yellow: '#FECB00',
          'yellow-light': '#FFE566',
          red: '#C60C30',
          'red-light': '#E8354F',
        },
        canvas: {
          DEFAULT: '#F8F9FC',
          dark: '#0A0E1A',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          dark: '#141B2D',
          card: '#FFFFFF',
          'card-dark': '#1A2235',
        },
        border: {
          DEFAULT: '#E2E8F0',
          dark: '#2A3548',
        },
        ink: {
          DEFAULT: '#0F172A',
          secondary: '#475569',
          muted: '#94A3B8',
          dark: '#F1F5F9',
          'secondary-dark': '#CBD5E1',
          'muted-dark': '#64748B',
        },
        success: '#16A34A',
        warning: '#FECB00',
        error: '#C60C30',
        info: '#002664',
      },
      borderRadius: {
        card: '16px',
        button: '12px',
        input: '12px',
        chip: '9999px',
      },
      fontFamily: {
        sans: ['PlusJakartaSans_400Regular'],
        medium: ['PlusJakartaSans_500Medium'],
        semibold: ['PlusJakartaSans_600SemiBold'],
        bold: ['PlusJakartaSans_700Bold'],
      },
      spacing: {
        safe: '16px',
      },
    },
  },
  plugins: [],
};
