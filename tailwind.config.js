const { hairlineWidth } = require('nativewind/theme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        brand: {
          ink: '#141413',
          canvas: '#F3F0EE',
          lifted: '#FCFBFA',
          signal: '#CF4500',
          orbit: '#F37338',
          clay: '#9A3A0A',
          dust: '#D1CDC7',
          link: '#3860BE',
          blue: '#0B3D91',
          gold: '#F5C400',
          crimson: '#E11D48',
          white: '#FFFFFF',
        },
      },
      borderRadius: {
        sm: '6px',
        md: '20px',
        lg: '20px',
        xl: '40px',
        button: '20px',
        consent: '24px',
        stadium: '40px',
        pill: '999px',
      },
      borderWidth: {
        hairline: hairlineWidth(),
      },
      fontFamily: {
        display: ['SofiaSans_500Medium'],
        body: ['SofiaSans_400Regular'],
        'body-medium': ['SofiaSans_500Medium'],
        'body-bold': ['SofiaSans_700Bold'],
        mono: ['SofiaSans_400Regular'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
