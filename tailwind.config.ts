import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#111827',
        secondary: '#3B82F6',
        accent: '#F59E0B',
        background: '#FFFFFF',
        surface: '#F9FAFB',
      },
    },
  },
  plugins: [],
};

export default config;
