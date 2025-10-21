// themeUtils.ts
// Centralized theme utility classes for TradeYa
// Reference: src/components/ui/DESIGN_SYSTEM_DOCUMENTATION.md

export const themeClasses = {
  // Backgrounds & Surfaces
  card: 'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700',
  cardAlt: 'bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600',
  page: 'bg-neutral-50 dark:bg-neutral-900',
  input: 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600',

  // Text
  text: 'text-neutral-900 dark:text-neutral-100',
  textMuted: 'text-neutral-500 dark:text-neutral-400',
  textInverse: 'text-white dark:text-neutral-900',
  textAccent: 'text-primary-500 dark:text-primary-400',

  // Enhanced Typography System - Premium Glassmorphic Design
  // Hero & Display Typography
  heroHeading: 'font-black tracking-tighter leading-none text-6xl text-foreground hover:text-primary transition-colors cursor-pointer',
  displayLarge: 'font-extrabold tracking-tight leading-tight text-5xl text-foreground hover:text-secondary transition-colors cursor-pointer',
  displayMain: 'font-bold tracking-tight leading-tight text-4xl text-foreground hover:text-primary transition-colors cursor-pointer',
  
  // Section Typography
  sectionHeading: 'font-bold tracking-tight leading-snug text-3xl text-foreground hover:text-primary transition-colors cursor-pointer',
  subsectionHeading: 'font-semibold tracking-normal leading-snug text-2xl text-foreground hover:text-secondary transition-colors cursor-pointer',
  componentTitle: 'font-semibold tracking-normal leading-normal text-xl text-foreground hover:text-primary transition-colors cursor-pointer',
  
  // Body Typography
  bodyLarge: 'font-medium tracking-normal leading-normal text-lg text-foreground hover:text-secondary transition-colors cursor-pointer',
  body: 'font-normal leading-relaxed text-base text-foreground hover:text-primary transition-colors cursor-pointer',
  bodySmall: 'font-normal leading-relaxed text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer',
  caption: 'font-medium leading-relaxed text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer',
  labelSmall: 'font-medium leading-relaxed text-2xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer',
  
  // Premium Font Weights with Context
  fontThinHeading: 'font-thin tracking-wide text-2xl text-foreground',
  fontLightHeading: 'font-light tracking-wide text-xl text-foreground',
  fontNormalBody: 'font-normal leading-relaxed text-base text-foreground',
  fontMediumEmphasis: 'font-medium tracking-tight text-lg text-foreground',
  fontSemiboldSection: 'font-semibold tracking-tight text-lg text-foreground',
  fontBoldMain: 'font-bold tracking-tight text-xl text-foreground',
  fontExtraboldHero: 'font-extrabold tracking-tighter text-2xl text-foreground',
  fontBlackDisplay: 'font-black tracking-tighter text-3xl text-foreground',
  
  // Legacy Typography (for backward compatibility)
  heading1: 'font-heading font-bold text-4xl md:text-5xl text-neutral-900 dark:text-white',
  heading2: 'font-heading font-semibold text-3xl md:text-4xl text-neutral-900 dark:text-white',
  heading3: 'font-heading font-semibold text-2xl md:text-3xl text-neutral-900 dark:text-white',
  heading4: 'font-heading font-medium text-xl md:text-2xl text-neutral-900 dark:text-white',
  heading5: 'font-heading font-medium text-lg md:text-xl text-neutral-900 dark:text-white',
  heading6: 'font-heading font-medium text-base md:text-lg text-neutral-900 dark:text-white',
  overline: 'font-sans text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-500 font-medium',
  link: 'text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 underline-offset-2 hover:underline',

  // Buttons
  // Matches legacy button style for consistency across the app
  primaryButton: 'bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground',
  secondaryButton: 'bg-secondary-500 hover:bg-secondary-600 text-white',
  tertiaryButton: 'bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200',

  // Borders
  border: 'border-neutral-200 dark:border-neutral-700',

  // Shadows
  shadowSm: 'shadow-sm dark:shadow-neutral-900/30',
  shadow: 'shadow dark:shadow-neutral-900/30',
  shadowMd: 'shadow-md dark:shadow-neutral-900/30',
  shadowLg: 'shadow-lg dark:shadow-neutral-900/30',

  // Focus
  focus: 'focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:ring-offset-2 dark:focus:ring-offset-neutral-800',

  // Transitions
  transition: 'transition-all duration-200',
  transitionFast: 'transition-all duration-150',
  transitionSlow: 'transition-all duration-300',

  // Hover effects
  hoverCard: 'hover:shadow-md hover:-translate-y-1 dark:hover:bg-neutral-700/70 dark:hover:shadow-[0_0_12px_rgba(251,146,60,0.15)]',
  hoverGlassCard: 'hover:shadow-md hover:-translate-y-1 hover:bg-white/80 dark:hover:bg-neutral-800/70',
  // Reduced movement hover for large cards (trade details, etc.)
  hoverCardReduced: 'hover:shadow-lg dark:hover:bg-neutral-700/50 dark:hover:shadow-[0_0_8px_rgba(251,146,60,0.1)]',
}; 