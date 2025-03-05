/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        earth: {
          // Deep olive base
          900: '#2F3B2F',    // Deep olive
          800: '#F5F2EA',    // Warm beige (card background)
          700: '#E5E1D8',    // Beige border
          600: '#D8D4CC',    // Light beige
          500: '#C8C4BC',    // Muted beige
          400: '#B8B4AC',    // Soft beige
          300: '#A8A49C',    // Light warm gray
          200: '#4A4A4A',    // Dark gray for secondary text
          100: '#2D2D2D',    // Darker gray for primary text
          50: '#F5F8F5',     // Off white
        },
        accent: {
          sage: '#8B9D83',     // Muted green
          moss: '#4A5D43',     // Deep green
          clay: '#C67D63',     // Warm terracotta
          ochre: '#D69F4C',    // Golden yellow
          rust: '#A65D57',     // Reddish brown
        },
        text: {
          primary: '#1A1A1A',   // Almost black for primary text
          secondary: '#2D2D2D', // Dark gray for secondary text
          muted: '#4A4A4A',    // Medium gray for muted text
          light: '#F5F2EA',    // Light beige for text on dark backgrounds
        }
      },
      fontFamily: {
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif']
      },
      backgroundImage: {
        'gradient-fade': 'linear-gradient(180deg, rgba(47, 59, 47, 0) 0%, #2F3B2F 100%)',
        'gradient-radial': 'radial-gradient(circle at center, var(--tw-gradient-stops))',
        'texture': 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'gradient': 'gradient 15s ease infinite',
        'pulse-warm': 'pulse-warm 2s ease-in-out infinite',
        'text-shimmer': 'text-shimmer 2.5s ease-in-out infinite',
      },
      backgroundColor: {
        'badge': {
          'sage': 'rgb(139 157 131 / 0.2)',
          'clay': 'rgb(198 125 99 / 0.2)',
          'ochre': 'rgb(214 159 76 / 0.2)'
        }
      },
      borderColor: {
        'badge': {
          'sage': 'rgb(139 157 131 / 0.3)',
          'clay': 'rgb(198 125 99 / 0.3)',
          'ochre': 'rgb(214 159 76 / 0.3)'
        }
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' }
        },
        'pulse-warm': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.7 }
        },
        'text-shimmer': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' }
        }
      }
    }
  },
  plugins: [],
};
