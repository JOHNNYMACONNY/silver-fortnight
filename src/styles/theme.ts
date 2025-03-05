export const theme = {
  colors: {
    earth: {
      900: '#2F3B2F',    // Deep olive base
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
      sage: '#8B9D83',   // Muted green
      moss: '#4A5D43',   // Deep green
      clay: '#C67D63',   // Warm terracotta
      ochre: '#D69F4C',  // Golden yellow
      rust: '#A65D57',   // Reddish brown
    },
    text: {
      primary: '#1A1A1A',   // Almost black
      secondary: '#2D2D2D', // Dark gray
      muted: '#4A4A4A',     // Medium gray
      light: '#F5F2EA',     // Light beige
    },
    neon: {
      blue: '#5BC0EB',
      purple: '#9B5DE5',
      pink: '#F15BB5',
    }
  },
  fonts: {
    display: 'Space Grotesk, system-ui, sans-serif',
    body: 'Inter, system-ui, sans-serif',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.15)',
  },
  transitions: {
    fast: '150ms ease',
    normal: '300ms ease',
    slow: '500ms ease',
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  zIndices: {
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    fixed: 1200,
    modal: 1300,
    popover: 1400,
    toast: 1500,
  }
} as const;

export type Theme = typeof theme;