/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Muli',
          '"San Francisco"',
          '"SF Pro Text"',
          '-apple-system',
          'system-ui',
          'BlinkMacSystemFont',
          'Roboto',
          '"Helvetica Neue"',
          '"Segoe UI"',
          'Arial',
          'sans-serif',
        ],
        serif: ['Georgia', 'serif'],
        mono: [
          '"Source Code Pro"',
          '"Fira Code"',
          '"Fira Mono"',
          '"Roboto Mono"',
          '"Lucida Console"',
          'Monaco',
          'monospace',
        ],
      },
      colors: {
        // Base colors
        black: '#000',
        white: '#fff',

        // Gray scale
        gray: {
          100: '#f8f9fa',
          200: '#e9ecef',
          300: '#dee2e6',
          400: '#ced4da',
          500: '#adb5bd',
          600: '#6c757d',
          700: '#495057',
          800: '#343a40',
          900: '#212529',
        },

        // Theme colors
        lighter: 'var(--color-lighter)',
        light: {
          100: 'var(--color-light-100)',
          200: 'var(--color-light-200)',
          300: 'var(--color-light-300)',
          400: 'var(--color-light-400)',
          500: 'var(--color-light-500)',
          600: 'var(--color-light-600)',
          700: 'var(--color-light-700)',
          800: 'var(--color-light-800)',
          900: 'var(--color-light-900)',
          950: 'var(--color-light-950)',
        },
        darker: 'var(--color-darker)',
        dark: 'var(--color-darker)',
        accent: {
          DEFAULT: 'var(--color-accent)',
          light: 'var(--color-light-300)',
        },

        // Surface colors
        surface: {
          primary: 'var(--color-bg)',
          secondary: 'var(--color-light-800)',
          tertiary: 'var(--color-light-700)',
        },

        // Text colors
        text: {
          primary: 'var(--color-light-100)',
          secondary: 'var(--color-light-300)',
        },

        // Border colors
        border: 'var(--color-card-border)',

        // Semantic colors
        bg: 'var(--color-bg)',
        danger: '#FF5252',

        // Card colors
        'card-border': 'var(--color-card-border)',
        'card-border-hover': 'var(--color-card-border-hover)',
        'card-gradient-light': 'var(--color-card-gradient-light)',
        'card-gradient-dark': 'var(--color-card-gradient-dark)',

        // Navbar
        'navbar-bg': 'var(--color-navbar-bg)',
        shadow: 'var(--color-shadow)',
        'shadow-dark': 'var(--color-shadow-dark)',
      },
      maxWidth: {
        'container-base': '784px',
        'container-lg': '1200px',
      },
      spacing: {
        'container-padding': '1rem',
      },
      boxShadow: {
        glow: 'var(--shadow-glow)',
        soft: '0 2px 6px 0 rgba(0, 0, 0, 0.1)',
        card: '5px 5px 15px rgba(0, 0, 0, 0.12)',
      },
      animation: {
        'star-move': 'star-move 500ms infinite alternate-reverse',
      },
      keyframes: {
        'star-move': {
          to: {
            transform: 'scale(1.2)',
          },
        },
      },
      transitionProperty: {
        all: 'all',
      },
      transitionDuration: {
        base: '200ms',
      },
      transitionTimingFunction: {
        base: 'ease-in-out',
      },
      listStyleType: {
        circle: 'circle',
        square: 'square',
        'lower-alpha': 'lower-alpha',
        'lower-roman': 'lower-roman',
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: 'var(--color-text-primary)',
            a: {
              color: 'var(--color-accent)',
              '&:hover': {
                opacity: 0.8,
              },
            },
            h1: {
              color: 'var(--color-text-primary)',
            },
            h2: {
              color: 'var(--color-text-primary)',
            },
            h3: {
              color: 'var(--color-text-primary)',
            },
            h4: {
              color: 'var(--color-text-primary)',
            },
            strong: {
              color: 'var(--color-text-primary)',
            },
            blockquote: {
              borderLeftColor: 'var(--color-accent)',
              color: 'var(--color-text-primary)',
            },
            ul: {
              li: {
                '&::marker': {
                  color: 'var(--color-accent)',
                },
              },
            },
            ol: {
              li: {
                '&::marker': {
                  color: 'var(--color-accent)',
                },
              },
            },
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography')({
      className: 'prose',
    }),
  ],
};
