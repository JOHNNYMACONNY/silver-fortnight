import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { X, CheckCircle, AlertTriangle, XCircle, Info, Zap, Handshake, Globe, Users, MessageCircle, Package, DollarSign, UserPlus, Star, Heart, Trophy, Crown, Award } from "lucide-react"

import { cn } from "../../utils/cn"

const alertVariants = cva(
  "relative w-full rounded-xl border backdrop-blur-sm shadow-md [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4",
  {
    variants: {
      variant: {
        default: "bg-white/5 backdrop-blur-xl border-white/20 text-foreground [&>svg]:text-muted-foreground",
        destructive:
          "bg-white/5 backdrop-blur-xl border-destructive/30 text-foreground [&>svg]:text-destructive",
        success:
          "bg-white/5 backdrop-blur-xl border-success-500/30 text-foreground [&>svg]:text-success-600",
        warning:
          "bg-white/5 backdrop-blur-xl border-amber-500/30 text-foreground [&>svg]:text-amber-600",
        // Topic-based semantic variants
        trades:
          "bg-white/5 backdrop-blur-xl border-orange-500/30 text-foreground [&>svg]:text-orange-600",
        collaboration:
          "bg-white/5 backdrop-blur-xl border-purple-500/30 text-foreground [&>svg]:text-purple-600",
        community:
          "bg-white/5 backdrop-blur-xl border-blue-500/30 text-foreground [&>svg]:text-blue-600",
        // Additional semantic variants
        info:
          "bg-white/5 backdrop-blur-xl border-blue-500/30 text-foreground [&>svg]:text-blue-600",
        error:
          "bg-white/5 backdrop-blur-xl border-red-500/30 text-foreground [&>svg]:text-red-600",
        // Gamification variants
        xp:
          "bg-white/5 backdrop-blur-xl border-orange-500/30 text-foreground [&>svg]:text-orange-600",
        achievement:
          "bg-white/5 backdrop-blur-xl border-purple-500/30 text-foreground [&>svg]:text-purple-600",
        "level-up":
          "bg-white/5 backdrop-blur-xl border-yellow-500/30 text-foreground [&>svg]:text-yellow-600",
        // Glassmorphic variants
        "glass-success":
          "bg-white/5 backdrop-blur-xl border-success-500/20 text-foreground [&>svg]:text-success-600",
        "glass-warning":
          "bg-white/5 backdrop-blur-xl border-amber-500/20 text-foreground [&>svg]:text-amber-600",
        "glass-destructive":
          "bg-white/5 backdrop-blur-xl border-destructive/20 text-foreground [&>svg]:text-destructive",
      },
      size: {
        sm: "p-3 text-sm [&>svg]:w-4 [&>svg]:h-4 [&>svg]:left-3 [&>svg]:top-3",
        md: "p-4 text-base [&>svg]:w-5 [&>svg]:h-5 [&>svg]:left-4 [&>svg]:top-4",
        lg: "p-6 text-lg [&>svg]:w-6 [&>svg]:h-6 [&>svg]:left-5 [&>svg]:top-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

// Icon mapping for semantic variants
const getDefaultIcon = (variant: string): React.ReactElement | undefined => {
  switch (variant) {
    case 'success':
    case 'glass-success':
      return <CheckCircle className="w-5 h-5" />
    case 'warning':
    case 'glass-warning':
      return <AlertTriangle className="w-5 h-5" />
    case 'destructive':
    case 'glass-destructive':
      return <XCircle className="w-5 h-5" />
    case 'trades':
      return <Zap className="w-5 h-5" />
    case 'collaboration':
      return <Handshake className="w-5 h-5" />
    case 'community':
      return <Globe className="w-5 h-5" />
    case 'info':
      return <Info className="w-5 h-5" />
    case 'error':
      return <XCircle className="w-5 h-5" />
    case 'xp':
      return <Star className="w-5 h-5" />
    case 'achievement':
      return <Trophy className="w-5 h-5" />
    case 'level-up':
      return <Crown className="w-5 h-5" />
    default:
      return <Info className="w-5 h-5" />
  }
}

// Action button interface
interface AlertAction {
  label: string
  onClick: () => void
  variant?: 'default' | 'outline' | 'ghost'
}

interface AlertProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {
  icon?: React.ReactNode
  dismissible?: boolean
  onDismiss?: () => void
  actions?: AlertAction[]
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "default", size = "md", icon, dismissible, onDismiss, actions, children, ...props }, ref) => {
    const displayIcon = icon ?? getDefaultIcon(variant ?? "default")
    
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant, size }), className)}
        {...props}
      >
        {displayIcon}
        <div className="flex-1">
          {children}
          {actions && actions.length > 0 && (
            <div className="mt-3 flex gap-2">
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
                    action.variant === 'outline' 
                      ? "border border-current hover:bg-current/10" 
                      : action.variant === 'ghost'
                      ? "hover:bg-current/10"
                      : "bg-current/10 hover:bg-current/20"
                  )}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        {dismissible && (
          <button
            onClick={onDismiss}
            className="ml-2 p-1 hover:bg-current/10 rounded-lg transition-colors"
            aria-label="Dismiss alert"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    )
  }
)
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription } 