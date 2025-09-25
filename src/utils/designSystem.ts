/**
 * TradeYa Design System Utilities
 * Provides consistent design tokens, spacing, typography, and styling patterns
 */

// Design Tokens
export const designTokens = {
  // Spacing Scale (based on 4px grid)
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
    '3xl': '4rem',    // 64px
    '4xl': '6rem',    // 96px
    '5xl': '8rem',    // 128px
  },

  // Typography Scale
  typography: {
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem',    // 48px
      '6xl': '3.75rem', // 60px
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },

  // Brand Colors
  colors: {
    brand: {
      orange: '#f97316',
      blue: '#0ea5e9',
      purple: '#8b5cf6',
      green: '#10b981',
      gray: '#6b7280',
    },
    semantic: {
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
    glass: {
      light: 'rgba(255, 255, 255, 0.7)',
      medium: 'rgba(255, 255, 255, 0.6)',
      strong: 'rgba(255, 255, 255, 0.5)',
      darkLight: 'rgba(31, 41, 55, 0.4)',
      darkMedium: 'rgba(31, 41, 55, 0.7)',
      darkStrong: 'rgba(31, 41, 55, 0.8)',
    },
  },

  // Border Radius
  borderRadius: {
    sm: '0.25rem',    // 4px
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
    xl: '1rem',       // 16px
    '2xl': '1.5rem',  // 24px
    full: '9999px',
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
  },

  // Z-Index Scale
  zIndex: {
    base: 0,
    dropdown: 10,
    sticky: 20,
    modal: 30,
    popover: 40,
    tooltip: 50,
  },
} as const;

// Standardized Class Patterns
export const classPatterns = {
  // Container patterns
  pageContainer: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  sectionContainer: 'py-8',
  cardContainer: 'p-6',

  // Grid patterns
  responsiveGrid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
  bentoGrid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6',
  
  // Flex patterns
  centerContent: 'flex items-center justify-center',
  spaceBetween: 'flex items-center justify-between',
  flexColumn: 'flex flex-col',
  
  // Glassmorphic patterns
  glassCard: 'glassmorphic',
  glassForm: 'glassmorphic rounded-2xl',
  glassNavbar: 'glassmorphic',

  // Typography patterns
  heading1: 'text-4xl font-bold text-foreground',
  heading2: 'text-3xl font-semibold text-foreground',
  heading3: 'text-2xl font-semibold text-foreground',
  heading4: 'text-xl font-medium text-foreground',
  bodyLarge: 'text-lg text-foreground',
  bodyMedium: 'text-base text-foreground',
  bodySmall: 'text-sm text-muted-foreground',
  caption: 'text-xs text-muted-foreground',

  // Button patterns
  primaryButton: 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium px-6 py-3 rounded-lg transition-all duration-200',
  secondaryButton: 'glassmorphic text-foreground font-medium px-6 py-3 rounded-lg transition-all duration-200',
  ghostButton: 'hover:bg-white/10 text-foreground font-medium px-6 py-3 rounded-lg transition-all duration-200',

  // Input patterns
  textInput: 'w-full px-4 py-3 glassmorphic focus:ring-2 focus:ring-ring focus:border-input transition-all duration-200',
  
  // Animation patterns
  fadeIn: 'animate-in fade-in duration-300',
  slideUp: 'animate-in slide-in-from-bottom-4 duration-300',
  scaleIn: 'animate-in zoom-in-95 duration-200',

  // HomePage-specific patterns (based on successful HomePage implementation)
  homepageContainer: 'w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8',
  homepageHero: 'relative rounded-2xl overflow-hidden mb-12',
  homepageHeroContent: 'p-12 md:p-16',
  homepageSection: 'mb-8',
  homepageGrid: 'mb-8',
  homepageCard: 'h-[280px] flex flex-col cursor-pointer overflow-hidden',
  homepageCardHeader: 'pb-2',
  homepageCardContent: 'flex-1 pb-3',
  homepageCardFooter: 'pt-3',
  
  // HomePage layout patterns
  homepageAsymmetricGrid: 'layoutPattern="asymmetric" visualRhythm="alternating" contentAwareLayout={true}',
  homepageBentoItem: 'asymmetricSize="small" contentType="feature" layoutRole="simple"',
  homepageBentoItemLarge: 'asymmetricSize="large" contentType="mixed" layoutRole="complex"',
  
  // HomePage card variants
  homepagePremiumCard: 'variant="premium" tilt={true} depth="lg" glow="subtle"',
  homepagePremiumCardOrange: 'variant="premium" tilt={true} depth="lg" glow="subtle" glowColor="orange"',
  homepagePremiumCardPurple: 'variant="premium" tilt={true} depth="lg" glow="subtle" glowColor="purple"',
  homepagePremiumCardBlue: 'variant="premium" tilt={true} depth="lg" glow="subtle" glowColor="blue"',
  
  // HomePage background patterns
  homepageGradientBackground: 'variant="primary" intensity="medium"',
  homepageGradientBackgroundSecondary: 'variant="secondary" intensity="medium"',
} as const;

// Component Variants
export const componentVariants = {
  card: {
    default: 'bg-card text-card-foreground border border-border rounded-lg',
    glass: 'glassmorphic',
    elevated: 'bg-card text-card-foreground border border-border shadow-lg rounded-lg',
    premium: 'glassmorphic shadow-xl',
  },
  
  button: {
    primary: classPatterns.primaryButton,
    secondary: classPatterns.secondaryButton,
    ghost: classPatterns.ghostButton,
    destructive: 'bg-red-500 hover:bg-red-600 text-white font-medium px-6 py-3 rounded-lg transition-all duration-200',
  },

  badge: {
    default: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800',
    success: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800',
    warning: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800',
    error: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800',
    brand: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary',
  },
} as const;

// Utility Functions
export const spacing = (size: keyof typeof designTokens.spacing) => designTokens.spacing[size];

export const fontSize = (size: keyof typeof designTokens.typography.fontSize) => designTokens.typography.fontSize[size];

export const brandColor = (color: keyof typeof designTokens.colors.brand) => designTokens.colors.brand[color];

export const semanticColor = (color: keyof typeof designTokens.colors.semantic) => designTokens.colors.semantic[color];

// Responsive Breakpoints
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Animation Presets
export const animations = {
  // Entrance animations
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.3 },
  },
  
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 },
  },
  
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.2 },
  },

  // Hover animations
  cardHover: {
    whileHover: { 
      scale: 1.02,
      transition: { duration: 0.2 }
    },
  },

  buttonHover: {
    whileHover: { 
      scale: 1.05,
      transition: { duration: 0.1 }
    },
    whileTap: { 
      scale: 0.98,
      transition: { duration: 0.1 }
    },
  },

  // HomePage-specific animations (based on successful HomePage implementation)
  kineticHeading: {
    // AnimatedHeading with kinetic animation
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    transition: { 
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94]
    },
  },

  slideHeading: {
    // AnimatedHeading with slide animation
    initial: { opacity: 0, x: -30 },
    animate: { opacity: 1, x: 0 },
    transition: { 
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94]
    },
  },

  homepageCardEntrance: {
    // HomePage card entrance animation
    initial: { opacity: 0, y: 30, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { 
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94]
    },
  },

  homepageGridStagger: {
    // Staggered grid item animation
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { 
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94]
    },
  },

  homepagePremiumCardHover: {
    // Enhanced hover for premium cards
    whileHover: { 
      scale: 1.03,
      y: -5,
      transition: { 
        duration: 0.2,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    },
  },
} as const;

// Layout Utilities
export const layouts = {
  // Page layouts
  fullPage: 'min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900',
  centeredPage: 'min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900',
  
  // Section layouts
  heroSection: 'py-20 px-4 text-center',
  contentSection: 'py-16 px-4',
  
  // Grid layouts
  cardGrid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
  featureGrid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8',
  
  // Flex layouts
  navbar: 'flex items-center justify-between px-6 py-4',
  sidebar: 'flex flex-col h-full w-64 glassmorphic',

  // HomePage-specific layouts (based on successful HomePage implementation)
  homepageLayout: 'w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8',
  homepageHeroSection: 'relative rounded-2xl overflow-hidden mb-12',
  homepageContentSection: 'mb-8',
  homepageAsymmetricGrid: {
    layoutPattern: 'asymmetric',
    visualRhythm: 'alternating',
    contentAwareLayout: true,
    gap: 'lg'
  },
  homepageBentoItemSmall: {
    asymmetricSize: 'small',
    contentType: 'feature',
    layoutRole: 'simple'
  },
  homepageBentoItemLarge: {
    asymmetricSize: 'large',
    contentType: 'mixed',
    layoutRole: 'complex'
  },
  homepagePremiumCardLayout: {
    variant: 'premium',
    tilt: true,
    depth: 'lg',
    glow: 'subtle',
    interactive: true,
    className: 'h-[280px] flex flex-col cursor-pointer overflow-hidden'
  },
} as const;

// Validation Functions
export const validateDesignToken = (category: string, value: string): boolean => {
  switch (category) {
    case 'spacing':
      return Object.keys(designTokens.spacing).includes(value);
    case 'color':
      return Object.keys(designTokens.colors.brand).includes(value) || 
             Object.keys(designTokens.colors.semantic).includes(value);
    case 'typography':
      return Object.keys(designTokens.typography.fontSize).includes(value);
    default:
      return false;
  }
};

// Theme-aware utilities
export const getThemeAwareClass = (lightClass: string, darkClass: string) => {
  return `${lightClass} dark:${darkClass}`;
};

// Glassmorphic effect generator
export const createGlassmorphicStyle = (
  intensity: 'light' | 'medium' | 'strong' = 'medium',
  borderOpacity: number = 0.2
) => {
  const backgrounds = {
    light: 'bg-white/70 dark:bg-neutral-800/60',
    medium: 'bg-white/75 dark:bg-neutral-800/65',
    strong: 'bg-white/80 dark:bg-neutral-800/70',
  };

  return `glassmorphic`;
};

// Export all utilities
export default {
  designTokens,
  classPatterns,
  componentVariants,
  spacing,
  fontSize,
  brandColor,
  semanticColor,
  breakpoints,
  animations,
  layouts,
  validateDesignToken,
  getThemeAwareClass,
  createGlassmorphicStyle,
};
