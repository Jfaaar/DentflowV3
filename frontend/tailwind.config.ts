import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        accent: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        surface: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        vital: '#10b981',
        alert: '#f59e0b',
        critical: '#ef4444',
        info: '#0ea5e9',
        status: {
          confirmed: '#10b981',
          pending: '#f59e0b',
          canceled: '#ef4444',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['"Inter Tight"', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        soft: '0 4px 6px -1px rgba(15, 23, 42, 0.04), 0 2px 4px -1px rgba(15, 23, 42, 0.03)',
        elevated:
          '0 20px 40px -12px rgba(79, 70, 229, 0.18), 0 8px 16px -8px rgba(15, 23, 42, 0.08)',
        glow: '0 0 24px rgba(99, 102, 241, 0.25)',
        'glow-accent': '0 0 24px rgba(16, 185, 129, 0.25)',
      },
      backgroundImage: {
        'mesh-medical':
          'radial-gradient(at 12% 18%, rgba(99,102,241,0.18) 0, transparent 45%), radial-gradient(at 88% 22%, rgba(16,185,129,0.14) 0, transparent 50%), radial-gradient(at 30% 88%, rgba(129,140,248,0.16) 0, transparent 55%)',
        'gradient-primary': 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
        'gradient-accent': 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'blur-in': 'blurIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        blob: 'blob 18s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        blurIn: {
          '0%': { opacity: '0', filter: 'blur(8px)', transform: 'translateY(8px)' },
          '100%': { opacity: '1', filter: 'blur(0)', transform: 'translateY(0)' },
        },
        blob: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(30px, -40px) scale(1.07)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.95)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
