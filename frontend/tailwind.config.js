import tailwindcssAnimate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        border: "#E2E8F0",
        input: "#CBD5E1",
        ring: "#2563EB",
        background: "#F5F8FF",
        foreground: "#172033",
        brand: {
          bg: "#F5F8FF",
          card: "#FFFFFF",
          navy: "#172554",
          blue: "#2563EB",
          electric: "#3B82F6",
          cyan: "#06B6D4",
          text: "#172033",
          muted: "#64748B",
          border: "#E2E8F0",
          success: "#059669",
          warning: "#D97706",
          error: "#DC2626",
        },
        navy: {
          950: '#0F172A',
          900: '#172554', // primary navy
          850: '#1E293B',
          800: '#334155',
          700: '#475569',
          600: '#64748B',
          500: '#94A3B8',
          100: '#F1F5F9',
          50: '#F8FAFC',
        },
        electric: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6', // electric blue
          600: '#2563EB', // primary blue
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        cyan: {
          50: '#ECFEFF',
          100: '#CFFAFE',
          200: '#A5F3FC',
          300: '#67E8F9',
          400: '#22D3EE',
          500: '#06B6D4', // cyan accent
          600: '#0891B2',
          700: '#0E7490',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 10px 25px -5px rgba(37, 99, 235, 0.08), 0 8px 10px -6px rgba(37, 99, 235, 0.04)',
        'elevated': '0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
      },
    },
  },
  plugins: [tailwindcssAnimate],
}
