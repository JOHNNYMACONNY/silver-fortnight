/**
 * GlassmorphicBadge Component
 *
 * A glassmorphic badge component that extends the base Badge with glassmorphic effects
 * and brand color integration for the TradeYa design system.
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const glassmorphicBadgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "glassmorphic border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/20 hover:scale-105 active:scale-95",
        secondary: "glassmorphic border-secondary/20 bg-secondary/10 text-secondary-foreground hover:bg-secondary/20 hover:border-secondary/30 hover:shadow-lg hover:shadow-secondary/20 hover:scale-105 active:scale-95",
        destructive: "glassmorphic border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/20 hover:border-destructive/30 hover:shadow-lg hover:shadow-destructive/20 hover:scale-105 active:scale-95",
        outline: "glassmorphic border-border bg-background/50 text-foreground hover:bg-background/80 hover:border-border/60 hover:shadow-lg hover:shadow-border/20 hover:scale-105 active:scale-95",
        success: "glassmorphic border-success/20 bg-success/10 text-success-foreground hover:bg-success/20 hover:border-success/30 hover:shadow-lg hover:shadow-success/20 hover:scale-105 active:scale-95",
        warning: "glassmorphic border-warning/20 bg-warning/10 text-warning-foreground hover:bg-warning/20 hover:border-warning/30 hover:shadow-lg hover:shadow-warning/20 hover:scale-105 active:scale-95",
        info: "glassmorphic border-info/20 bg-info/10 text-info-foreground hover:bg-info/20 hover:border-info/30 hover:shadow-lg hover:shadow-info/20 hover:scale-105 active:scale-95",
      },
      brandAccent: {
        orange: "border-orange-500/20 bg-orange-500/10 text-orange-700 dark:text-orange-300 hover:bg-orange-500/20 hover:border-orange-500/30 hover:shadow-lg hover:shadow-orange-500/20 hover:scale-105 active:scale-95",
        blue: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300 hover:bg-blue-500/20 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/20 hover:scale-105 active:scale-95",
        purple: "border-purple-500/20 bg-purple-500/10 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/20 hover:scale-105 active:scale-95",
        gradient: "border-gradient-to-r from-orange-500/20 via-blue-500/20 to-purple-500/20 bg-gradient-to-r from-orange-500/5 via-blue-500/5 to-purple-500/5 text-gradient-to-r from-orange-700 via-blue-700 to-purple-700 dark:from-orange-300 dark:via-blue-300 dark:to-purple-300 hover:from-orange-500/10 hover:via-blue-500/10 hover:to-purple-500/10 hover:shadow-lg hover:shadow-gradient-to-r hover:shadow-orange-500/10 hover:shadow-blue-500/10 hover:shadow-purple-500/10 hover:scale-105 active:scale-95",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
      blur: {
        none: "",
        sm: "backdrop-blur-sm",
        md: "backdrop-blur-md",
        lg: "backdrop-blur-lg",
      },
      animation: {
        none: "",
        pulse: "animate-pulse",
        bounce: "animate-bounce",
        ping: "animate-ping",
        spin: "animate-spin",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      blur: "md",
      animation: "none",
    },
  }
);

export interface GlassmorphicBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof glassmorphicBadgeVariants> {
  /**
   * Icon to display before the badge text
   */
  icon?: React.ReactNode;
  /**
   * Whether to show a subtle glow effect
   */
  glow?: boolean;
  /**
   * Whether the badge is interactive (clickable)
   */
  interactive?: boolean;
  /**
   * Whether to show a pulsing animation (useful for notifications)
   */
  pulsing?: boolean;
  /**
   * Whether to show a subtle bounce animation on mount
   */
  bounceOnMount?: boolean;
}

export const GlassmorphicBadge: React.FC<GlassmorphicBadgeProps> = ({
  className,
  variant,
  brandAccent,
  size,
  blur,
  animation,
  icon,
  glow = false,
  interactive = false,
  pulsing = false,
  bounceOnMount = false,
  children,
  ...props
}) => {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    if (bounceOnMount) {
      setIsMounted(true);
    }
  }, [bounceOnMount]);

  return (
    <span
      className={cn(
        glassmorphicBadgeVariants({ variant, brandAccent, size, blur, animation }),
        glow && "shadow-lg shadow-current/20",
        interactive && "cursor-pointer",
        pulsing && "animate-pulse",
        bounceOnMount && isMounted && "animate-bounce",
        bounceOnMount && !isMounted && "opacity-0 scale-95",
        "transform-gpu", // GPU acceleration for smooth animations
        className
      )}
      style={{
        transition: bounceOnMount 
          ? 'all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)' 
          : undefined
      }}
      {...props}
    >
      {icon && <span className="mr-1 transition-transform duration-200 group-hover:scale-110">{icon}</span>}
      {children}
    </span>
  );
};

export { glassmorphicBadgeVariants };
