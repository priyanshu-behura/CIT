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
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        cit: {
          bg: "#F3ECE2",
          surface: "#FBF8F3",
          card: "#FBF8F3",
          primary: "#1E1915",
          secondary: "#5B5048",
          terracotta: "#A9502B",
          terracottaHover: "#8F3F1E",
          terracottaLight: "#C8693F",
          blue: "#243C50",
          blueHover: "#1B2E3D",
          dark: "#191513",
          light: "#F3ECE2",
          border: "rgba(30, 25, 21, 0.12)",
          borderDark: "rgba(243, 236, 226, 0.14)",
        },
        brand: {
          bg: "#F3ECE2",
          card: "#FBF8F3",
          navy: "#243C50",
          blue: "#A9502B",
          electric: "#C8693F",
          cyan: "#243C50",
          text: "#1E1915",
          muted: "#5B5048",
          border: "rgba(30, 25, 21, 0.12)",
          success: "#15803D",
          warning: "#B45309",
          error: "#B91C1C",
        },
        navy: {
          950: '#191513',
          900: '#243C50', // CIT Academic Blue
          850: '#1E293B',
          800: '#2A445A',
          700: '#345570',
          600: '#5B5048',
          500: '#7A6E65',
          100: '#F3ECE2',
          50: '#FBF8F3',
        },
        electric: {
          50: '#FBF8F3',
          100: '#F3ECE2',
          200: '#EBDDCF',
          300: '#DCBCA8',
          400: '#C8693F',
          500: '#A9502B', // CIT Terracotta
          600: '#8F3F1E',
          700: '#753216',
          800: '#5C260F',
          900: '#421A0A',
        },
        cyan: {
          50: '#F5F8FA',
          100: '#E7EEF3',
          200: '#C7D7E3',
          300: '#8DAAC1',
          400: '#487192',
          500: '#243C50', // CIT Academic Blue
          600: '#1B2E3D',
          700: '#14222E',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['ui-serif', 'New York', 'Iowan Old Style', 'Palatino Linotype', 'Palatino', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(30, 25, 21, 0.05), 0 1px 2px -1px rgba(30, 25, 21, 0.05)',
        'card-hover': '0 10px 25px -5px rgba(169, 80, 43, 0.08), 0 8px 10px -6px rgba(169, 80, 43, 0.04)',
        'elevated': '0 20px 25px -5px rgba(30, 25, 21, 0.08), 0 8px 10px -6px rgba(30, 25, 21, 0.04)',
      },
    },
  },
  plugins: [tailwindcssAnimate],
}
