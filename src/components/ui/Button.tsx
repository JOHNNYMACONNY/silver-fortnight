import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "../../utils/cn"
import { semanticClasses, type Topic } from "../../utils/semanticColors"

// Button variants configuration - defined as stable const for Fast Refresh compatibility
const buttonVariantsConfig = {
  variants: {
    variant: {
      // Shadcn standard variants adapted for TradeYa (using CSS variables)
      default: "bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl backdrop-blur-sm border border-primary/20 shadow-md",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl backdrop-blur-sm border border-destructive/20 shadow-md",
      outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-xl backdrop-blur-sm shadow-sm",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-xl backdrop-blur-sm border border-secondary/20 shadow-md",
      ghost: "hover:bg-accent hover:text-accent-foreground rounded-xl backdrop-blur-sm",
      link: "text-primary underline-offset-4 hover:underline",
      // TradeYa custom variants (preserved)
      success: "bg-success-500 text-white hover:bg-success-600 rounded-xl backdrop-blur-sm border border-success-500/20 shadow-md",
      warning: "bg-warning-500 text-white hover:bg-warning-600 rounded-xl backdrop-blur-sm border border-warning-500/20 shadow-md",
      glassmorphic: "glassmorphic text-white font-medium hover:bg-white/20 dark:hover:bg-white/10 transition-all duration-200",
      "glass-toggle": "glassmorphic text-white/80 font-medium transition-colors duration-200 border border-white/10 hover:text-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/30 data-[active=true]:text-white data-[active=true]:bg-white/20 data-[active=true]:border-white/20 data-[active=true]:shadow-lg",
      premium: "bg-gradient-to-r from-primary to-primary/80 text-gray-900 font-semibold shadow-lg hover:shadow-xl hover:from-primary/90 hover:to-primary/70 transition-all duration-300 transform hover:scale-105 border border-primary/20 backdrop-blur-sm rounded-xl",
      "premium-outline": "border border-primary/30 text-white font-semibold bg-transparent hover:bg-primary/10 hover:text-white transition-all duration-300 transform hover:scale-105 backdrop-blur-sm rounded-xl shadow-sm",
      interactive: "bg-gradient-to-r from-primary/90 to-primary/70 text-gray-900 font-medium shadow-md hover:shadow-lg hover:from-primary hover:to-primary/80 transition-all duration-200 transform hover:scale-102 border border-primary/20 backdrop-blur-sm rounded-xl",
      "interactive-outline": "border border-primary/30 text-white font-medium bg-transparent hover:bg-primary/10 hover:text-white transition-all duration-200 transform hover:scale-102 backdrop-blur-sm rounded-xl shadow-sm",
      "premium-light": "bg-white/90 text-gray-900 font-semibold border border-primary/20 hover:bg-white hover:shadow-lg transition-all duration-300 transform hover:scale-105 backdrop-blur-sm rounded-xl",
      "interactive-light": "bg-white/80 text-gray-900 font-medium border border-primary/20 hover:bg-white hover:shadow-md transition-all duration-200 transform hover:scale-102 backdrop-blur-sm rounded-xl",
      // Aliases for broader API compatibility
      primary: "bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl backdrop-blur-sm border border-primary/20 shadow-md",
      brand: "bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl backdrop-blur-sm border border-primary/20 shadow-md",
      accent: "bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-xl backdrop-blur-sm border border-secondary/20 shadow-md",
      danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl backdrop-blur-sm border border-destructive/20 shadow-md",
      tertiary: "hover:bg-accent hover:text-accent-foreground rounded-xl backdrop-blur-sm",
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
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  buttonVariantsConfig
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  isLoading?: boolean
  fullWidth?: boolean
  rounded?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  topic?: Topic
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    isLoading = false, 
    fullWidth = false, 
    rounded = false,
    leftIcon,
    rightIcon,
    children,
    topic,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    // Mobile optimization: Ensure minimum 44px height on mobile for touch targets
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const needsMobileOverride = isMobile && (!size || size === 'default' || size === 'sm' || size === 'xs');
    const mobileHeightClass = needsMobileOverride ? 'min-h-[44px]' : '';

    // Topic-aware class additions depending on variant (matching current Button.tsx)
    const topicClasses = topic
      ? (
          !variant || variant === 'default' || variant === 'primary' || variant === 'brand'
            ? `${semanticClasses(topic).bgSolid} text-white`
            : variant === 'link'
              ? `${semanticClasses(topic).link}`
              : ''
        )
      : ''

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
        type={(props as any)?.type ?? 'button'}
        disabled={isLoading || props.disabled}
        aria-busy={isLoading}
        aria-disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-live="polite" /> : null}
        {leftIcon ? <span className="mr-2 inline-flex items-center">{leftIcon}</span> : null}
        {children}
        {rightIcon ? <span className="ml-2 inline-flex items-center">{rightIcon}</span> : null}
      </Comp>
    )
  }
)
Button.displayName = "Button"

// Only export the Button component - buttonVariants is internal only
// This should fix Fast Refresh compatibility issues
export { Button }
