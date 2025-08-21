import type { Config } from 'tailwindcss';

export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx,html}'
  ],
  theme: {
    extend: {
      colors: {
        // 状态颜色系统
        status: {
          completed: '#10B981',
          running: '#3B82F6',
          pending: '#F59E0B',
          error: '#EF4444'
        },
        sync: {
          success: '#10B981',
          pending: '#6B7280'
        }
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem'
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.15)',
        'card-dark': '0 1px 3px rgba(0, 0, 0, 0.3)',
        'card-hover-dark': '0 4px 12px rgba(0, 0, 0, 0.4)'
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out'
      },
      keyframes: {
        fadeIn: {
          'from': { opacity: '0' },
          'to': { opacity: '1' }
        },
        slideUp: {
          'from': {
            opacity: '0',
            transform: 'translateY(10px)'
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)'
          }
        }
      }
    },
  },
  plugins: [],
} satisfies Config;