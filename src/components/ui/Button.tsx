import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { cn } from "../../utils/cn"
import { semanticClasses, type Topic } from "../../utils/semanticColors"
import { useMotion } from "./MotionProvider"

// Button variants configuration - defined as stable const for Fast Refresh compatibility
const buttonVariantsConfig = {
  variants: {
    variant: {
      // All variants use transparent/semi-transparent backgrounds - NO SOLID COLORS
      // Shadcn standard variants adapted for TradeYa (using transparent backgrounds)
      default: "bg-primary/10 text-primary border-2 border-primary/30 hover:bg-primary/20 hover:border-primary/50 rounded-xl backdrop-blur-sm shadow-xs transition-all duration-200",
      destructive: "bg-destructive/10 text-error-500 dark:text-error-400 border-2 border-destructive/30 hover:bg-destructive/20 hover:border-destructive/50 rounded-xl backdrop-blur-sm shadow-xs transition-all duration-200",
      outline: "border-2 border-input bg-background/50 hover:bg-accent/20 hover:text-accent-foreground rounded-xl backdrop-blur-sm shadow-xs transition-all duration-200",
      secondary: "bg-secondary/10 text-secondary border-2 border-secondary/30 hover:bg-secondary/20 hover:border-secondary/50 rounded-xl backdrop-blur-sm shadow-xs transition-all duration-200",
      ghost: "hover:bg-accent/20 hover:text-accent-foreground rounded-xl backdrop-blur-sm transition-all duration-200",
      link: "text-primary underline-offset-4 hover:underline bg-transparent",
      // TradeYa custom variants (all non-solid)
      success: "bg-success-500/10 text-success-500 border-2 border-success-500/30 hover:bg-success-500/20 hover:border-success-500/50 rounded-xl backdrop-blur-sm shadow-xs transition-all duration-200",
      warning: "bg-warning-500/10 text-warning-500 border-2 border-warning-500/30 hover:bg-warning-500/20 hover:border-warning-500/50 rounded-xl backdrop-blur-sm shadow-xs transition-all duration-200",
      glassmorphic: "glassmorphic text-white font-medium hover:bg-white/20 dark:hover:bg-white/10 transition-all duration-200 border border-white/10",
      "glass-toggle": "glassmorphic text-white/80 font-medium transition-colors duration-200 border border-white/10 hover:text-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/30 data-[active=true]:text-white data-[active=true]:bg-white/20 data-[active=true]:border-white/20 data-[active=true]:shadow-lg",
      premium: "bg-gradient-to-r from-primary/20 to-primary/10 text-primary font-semibold shadow-lg hover:shadow-xl hover:from-primary/30 hover:to-primary/20 transition-all duration-300 transform hover:scale-105 border-2 border-primary/30 backdrop-blur-sm rounded-xl",
      "premium-outline": "border-2 border-primary/30 text-primary font-semibold bg-transparent hover:bg-primary/10 hover:text-primary transition-all duration-300 transform hover:scale-105 backdrop-blur-sm rounded-xl shadow-xs",
      interactive: "bg-gradient-to-r from-primary/20 to-primary/10 text-primary font-medium shadow-md hover:shadow-lg hover:from-primary/30 hover:to-primary/20 transition-all duration-200 transform hover:scale-102 border-2 border-primary/30 backdrop-blur-sm rounded-xl",
      "interactive-outline": "border-2 border-primary/30 text-primary font-medium bg-transparent hover:bg-primary/10 hover:text-primary transition-all duration-200 transform hover:scale-102 backdrop-blur-sm rounded-xl shadow-xs",
      "premium-light": "bg-white/20 text-gray-900 font-semibold border-2 border-primary/20 hover:bg-white/30 hover:shadow-lg transition-all duration-300 transform hover:scale-105 backdrop-blur-sm rounded-xl",
      "interactive-light": "bg-white/15 text-gray-900 font-medium border-2 border-primary/20 hover:bg-white/25 hover:shadow-md transition-all duration-200 transform hover:scale-102 backdrop-blur-sm rounded-xl",
      // Aliases for broader API compatibility (all non-solid)
      primary: "bg-primary/10 text-primary border-2 border-primary/30 hover:bg-primary/20 hover:border-primary/50 rounded-xl backdrop-blur-sm shadow-xs transition-all duration-200",
      brand: "bg-primary/10 text-primary border-2 border-primary/30 hover:bg-primary/20 hover:border-primary/50 rounded-xl backdrop-blur-sm shadow-xs transition-all duration-200",
      accent: "bg-secondary/10 text-secondary border-2 border-secondary/30 hover:bg-secondary/20 hover:border-secondary/50 rounded-xl backdrop-blur-sm shadow-xs transition-all duration-200",
      danger: "bg-destructive/10 text-error-500 dark:text-error-400 border-2 border-destructive/30 hover:bg-destructive/20 hover:border-destructive/50 rounded-xl backdrop-blur-sm shadow-xs transition-all duration-200",
      tertiary: "hover:bg-accent/20 hover:text-accent-foreground rounded-xl backdrop-blur-sm transition-all duration-200",
    },
    size: {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-xl px-3",
      lg: "h-11 rounded-xl px-8",
      icon: "h-10 w-10",
      xs: "h-8 rounded-xl px-3",
      md: "h-10 px-4 py-2",
      xl: "h-12 rounded-xl px-8",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
} as const

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  buttonVariantsConfig
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  isLoading?: boolean
  showSuccess?: boolean
  showError?: boolean
  fullWidth?: boolean
  rounded?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  topic?: Topic
  // Animation props
  enableAnimations?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    isLoading = false,
    showSuccess = false,
    showError = false,
    fullWidth = false, 
    rounded = false,
    leftIcon,
    rightIcon,
    children,
    topic,
    enableAnimations = true,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button"
    let isMotionDisabled = false
    try {
      const motionContext = useMotion()
      isMotionDisabled = motionContext.isMotionDisabled
    } catch {
      // MotionProvider not available, disable animations
      isMotionDisabled = true
    }
    const shouldAnimate = enableAnimations && !isMotionDisabled
    
    // Mobile optimization: Ensure minimum 44px height on mobile for touch targets
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const needsMobileOverride = isMobile && (!size || size === 'default' || size === 'sm' || size === 'xs');
    const mobileHeightClass = needsMobileOverride ? 'min-h-[44px]' : '';

    // Topic-aware class additions depending on variant (NO SOLID BACKGROUNDS - use transparent)
    const topicClasses = topic
      ? (() => {
          const classes = semanticClasses(topic);
          // Convert solid background to transparent with border
          // e.g., "bg-primary-500" -> "bg-primary-500/10 border-2 border-primary-500/30"
          const bgSolid = classes.bgSolid; // e.g., "bg-primary-500"
          const transparentBg = bgSolid.replace(/(bg-\w+-\d+)$/, '$1/10'); // "bg-primary-500/10"
          const borderColor = bgSolid.replace('bg-', 'border-').replace(/(\d+)$/, '$1/30'); // "border-primary-500/30"
          
          if (!variant || variant === 'default' || variant === 'primary' || variant === 'brand') {
            return `${transparentBg} ${classes.text} border-2 ${borderColor} hover:${bgSolid.replace(/(\d+)$/, '$1/20')} hover:${borderColor.replace('/30', '/50')}`;
          } else if (variant === 'link') {
            return classes.link;
          }
          return '';
        })()
      : ''

    // Animation variants for framer-motion
    const motionVariants = {
      hover: shouldAnimate ? {
        scale: 1.05,
        y: -2,
        transition: {
          type: "spring",
          stiffness: 400,
          damping: 17
        }
      } : {},
      tap: shouldAnimate ? {
        scale: 0.98,
        transition: {
          type: "spring",
          stiffness: 400,
          damping: 17
        }
      } : {}
    }

    const buttonContent = (
      <>
        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.span
              key="loading"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="mr-2 inline-flex items-center"
            >
              <Loader2 className="h-4 w-4 animate-spin" aria-live="polite" />
            </motion.span>
          )}
          {showSuccess && !isLoading && (
            <motion.span
              key="success"
              initial={{ opacity: 0, scale: 0, rotate: -180 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="mr-2 inline-flex items-center"
            >
              <CheckCircle2 className="h-4 w-4" />
            </motion.span>
          )}
          {showError && !isLoading && (
            <motion.span
              key="error"
              initial={{ opacity: 0, scale: 0, rotate: 180 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="mr-2 inline-flex items-center"
            >
              <XCircle className="h-4 w-4" />
            </motion.span>
          )}
        </AnimatePresence>
        {leftIcon && !isLoading && !showSuccess && !showError && (
          <span className="mr-2 inline-flex items-center">{leftIcon}</span>
        )}
        <AnimatePresence mode="wait">
          <motion.span
            key={isLoading ? 'loading' : showSuccess ? 'success' : showError ? 'error' : 'default'}
            initial={shouldAnimate ? { opacity: 0, x: -4 } : false}
            animate={shouldAnimate ? { opacity: 1, x: 0 } : false}
            exit={shouldAnimate ? { opacity: 0, x: 4 } : false}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.span>
        </AnimatePresence>
        {rightIcon && !isLoading && !showSuccess && !showError && (
          <span className="ml-2 inline-flex items-center">{rightIcon}</span>
        )}
      </>
    )

    if (asChild) {
      return (
        <Comp
          className={cn(
            buttonVariants({ variant, size }),
            mobileHeightClass,
            className,
            fullWidth && "w-full",
            rounded && "rounded-full",
            topicClasses
          )}
          ref={ref}
          {...props}
        >
          {children}
        </Comp>
      )
    }
    
    const buttonClasses = cn(
      buttonVariants({ variant, size }),
      mobileHeightClass,
      className,
      fullWidth && "w-full",
      rounded && "rounded-full",
      topicClasses
    )

    if (shouldAnimate) {
      return (
        <motion.button
          ref={ref}
          className={buttonClasses}
          type={(props as any)?.type ?? 'button'}
          disabled={isLoading || props.disabled}
          aria-busy={isLoading}
          aria-disabled={isLoading || props.disabled}
          whileHover={motionVariants.hover}
          whileTap={motionVariants.tap}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          {...props}
        >
          {buttonContent}
        </motion.button>
      )
    }
    
    return (
      <Comp
        className={buttonClasses}
        ref={ref}
        type={(props as any)?.type ?? 'button'}
        disabled={isLoading || props.disabled}
        aria-busy={isLoading}
        aria-disabled={isLoading || props.disabled}
        {...props}
      >
        {buttonContent}
      </Comp>
    )
  }
)
Button.displayName = "Button"

// Only export the Button component - buttonVariants is internal only
// This should fix Fast Refresh compatibility issues
export { Button }
