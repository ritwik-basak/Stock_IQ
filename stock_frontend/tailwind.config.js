/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#080C14',
          secondary: '#0D1421',
          card: '#111827',
          elevated: '#162032',
          border: '#1E2D42',
        },
        accent: {
          cyan: '#06B6D4',
          blue: '#3B82F6',
          glow: '#0EA5E9',
        },
        bull: '#10B981',
        bear: '#F43F5E',
        text: {
          primary: '#F0F4F8',
          secondary: '#8BA3BE',
          muted: '#4A6080',
          data: '#E2E8F0',
        }
      },
      fontFamily: {
        display: ['"DM Mono"', 'monospace'],
        body: ['"IBM Plex Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"DM Mono"', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.15)',
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.2)',
        'glow-bull': '0 0 15px rgba(16, 185, 129, 0.2)',
        'glow-bear': '0 0 15px rgba(244, 63, 94, 0.2)',
        'card': '0 4px 24px rgba(0,0,0,0.4)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.6)',
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(rgba(6,182,212,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.03) 1px, transparent 1px)",
        'card-gradient': 'linear-gradient(135deg, rgba(22,32,50,0.8) 0%, rgba(13,20,33,0.9) 100%)',
        'accent-gradient': 'linear-gradient(135deg, #06B6D4, #3B82F6)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.4s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'counter': 'counter 0.6s ease-out',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(6,182,212,0.1)' },
          '50%': { boxShadow: '0 0 25px rgba(6,182,212,0.3)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        }
      }
    },
  },
  plugins: [],
}
