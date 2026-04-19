import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'bazi-red':   '#c0392b',
        'bazi-gold':  '#d4a853',
        'bazi-ink':   '#1e1e1e',
        'bazi-paper': '#faf7f0',
      },
      fontFamily: {
        kai: ['"Noto Serif SC"', '"STKaiti"', 'KaiTi', 'serif'],
      },
    },
  },
  plugins: [],
};

export default config;
