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
        slate: {
          850: '#151d2e',
          900: '#0f172a',
          950: '#080d1a',
        },
        navy: {
          900: '#0a0f1d',
          800: '#11182c',
          700: '#1a233d',
          600: '#263456',
        },
        accent: {
          DEFAULT: '#6366f1',
          hover: '#4f46e5',
          light: '#818cf8',
          glow: 'rgba(99, 102, 241, 0.25)',
        },
        cyanGlow: {
          DEFAULT: '#06b6d4',
          glow: 'rgba(6, 182, 212, 0.25)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ring-breathe': 'ringBreathe 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.2s ease-out forwards',
        'slide-up': 'slideUp 0.25s ease-out forwards',
      },
      keyframes: {
        ringBreathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.8', boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)' },
          '50%': { transform: 'scale(1.05)', opacity: '1', boxShadow: '0 0 25px rgba(6, 182, 212, 0.6)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
