/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        tier1: {
          light: '#3b82f6', // Warm Up blue
          dark: '#1e3a8a',
          bg: '#0f172a',
          accent: '#60a5fa',
        },
        tier2: {
          light: '#f59e0b', // Vulnerability amber
          dark: '#78350f',
          bg: '#1c1917',
          accent: '#fbbf24',
        },
        tier3: {
          light: '#ec4899', // Core Truths rose/magenta
          dark: '#831843',
          bg: '#18181b',
          accent: '#f472b6',
        },
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top, 0px)',
        'safe-bottom': 'env(safe-area-inset-bottom, 0px)',
        'safe-left': 'env(safe-area-inset-left, 0px)',
        'safe-right': 'env(safe-area-inset-right, 0px)',
      },
    },
  },
  plugins: [],
};
