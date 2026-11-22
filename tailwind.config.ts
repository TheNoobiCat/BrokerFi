import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    screens: {
      'sm': '640px',
      'md': '768px', 
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
      'ultra': '1860px',
    },
    extend: {
      fontFamily: {
        'broker': ['Space Grotesk', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        'eb-garamond': [
          '"EB Garamond"',
          "Garamond",
          '"Times New Roman"',
          "serif",
        ],
      },
      colors: {
        broker: {
          green: '#00ff85',
          red: '#ff3b3b',
          cyan: '#00e0ff',
          amber: '#ffb100',
          gray: '#1a1b1f',
          dark: '#0f1013',
        },
        glass: {
          dark: 'rgba(26, 27, 31, 0.8)',
          darker: 'rgba(15, 16, 19, 0.9)',
        }
      },
      backgroundImage: {
        'broker-gradient': 'linear-gradient(135deg, #0f1013 0%, #1a1b1f 100%)',
        'broker-green-gradient': 'linear-gradient(135deg, #00ff85, #00cc6a)',
        'broker-red-gradient': 'linear-gradient(135deg, #ff3b3b, #e63535)',
      },
      boxShadow: {
        'broker': '0 4px 20px rgba(0, 0, 0, 0.3)',
        'broker-lg': '0 10px 40px rgba(0, 0, 0, 0.4)',
        'glow-green': '0 0 20px rgba(0, 255, 133, 0.3)',
        'glow-red': '0 0 20px rgba(255, 59, 59, 0.3)',
        'glow-cyan': '0 0 20px rgba(0, 224, 255, 0.3)',
        'glow-amber': '0 0 20px rgba(255, 177, 0, 0.3)',
        'glow-green-strong': '0 0 30px rgba(0, 255, 133, 0.5)',
        'glow-red-strong': '0 0 30px rgba(255, 59, 59, 0.5)',
        'glow-cyan-strong': '0 0 30px rgba(0, 224, 255, 0.4)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      borderRadius: {
        'broker': '8px',
      },
      zIndex: {
        '100': '100',
        '999': '999',
        '9999': '9999',
        '99999': '99999',
      },
      animation: {
        'pulse-green': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-down': 'slide-down 0.5s ease-out',
        'slide-out-up': 'slide-out-up 0.5s ease-out',
      },
      keyframes: {
        glow: {
          from: {
            boxShadow: '0 0 20px rgba(0, 255, 133, 0.3)',
          },
          to: {
            boxShadow: '0 0 30px rgba(0, 255, 133, 0.5), 0 0 40px rgba(0, 255, 133, 0.2)',
          },
        },
        'slide-up': {
          from: {
            transform: 'translateY(100%)',
            opacity: '0',
          },
          to: {
            transform: 'translateY(0)',
            opacity: '1',
          },
        },
        'slide-down': {
          from: {
            transform: 'translateY(-100%)',
            opacity: '0',
          },
          to: {
            transform: 'translateY(0)',
            opacity: '1',
          },
        },
        'slide-out-up': {
          from: {
            transform: 'translateY(0)',
            opacity: '1',
          },
          to: {
            transform: 'translateY(-100%)',
            opacity: '0',
          },
        },
      },
    },
  },
  plugins: [],
}

export default config