import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{vue,js,ts}',
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.{vue,js,ts}',
    './pages/**/*.{vue,js,ts}',
  ],
  theme: {
    extend: {
      colors: {
        // Navy - Primary dark color for headers/navigation
        navy: {
          DEFAULT: '#2A5269',
          50: '#e8f1f5',
          100: '#c5dce6',
          200: '#9fc5d4',
          300: '#79aec2',
          400: '#5c9cb5',
          500: '#3f8aa7',
          600: '#357a96',
          700: '#2A5269',
          800: '#1a3545',
          900: '#0d1a22',
          950: '#060d11',
        },
        // Orange - Accent/CTA color
        orange: {
          DEFAULT: '#FB720A',
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#FB720A',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        // Cream - Background color
        cream: {
          DEFAULT: '#F5EFE4',
          50: '#fdfcfa',
          100: '#F5EFE4',
          200: '#e8dfd0',
          300: '#d6cab4',
          400: '#c4b598',
          500: '#b2a07c',
          600: '#9a8661',
          700: '#7d6c4e',
          800: '#60533c',
          900: '#433a2a',
          950: '#261f17',
        },
        // Ink - Text color
        ink: {
          DEFAULT: '#1a1a1a',
          50: '#f5f5f5',
          100: '#e5e5e5',
          200: '#cccccc',
          300: '#b3b3b3',
          400: '#999999',
          500: '#808080',
          600: '#666666',
          700: '#4d4d4d',
          800: '#333333',
          900: '#1a1a1a',
          950: '#0d0d0d',
        },
        // Keep primary as orange for compatibility
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#FB720A',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        // Secondary as ink for compatibility
        secondary: {
          50: '#f5f5f5',
          100: '#e5e5e5',
          200: '#cccccc',
          300: '#b3b3b3',
          400: '#999999',
          500: '#808080',
          600: '#666666',
          700: '#4d4d4d',
          800: '#333333',
          900: '#1a1a1a',
          950: '#0d0d0d',
        },
      },
      fontFamily: {
        sans: ['var(--font-main)', 'Microsoft JhengHei', '微軟正黑體', 'system-ui', 'sans-serif'],
        serif: ['var(--font-main)', 'Microsoft JhengHei', '微軟正黑體', 'system-ui', 'sans-serif'],
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '2rem',
          lg: '4rem',
          xl: '5rem',
        },
      },
    },
  },
  plugins: [],
};

export default config;
