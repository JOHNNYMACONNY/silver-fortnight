import { cva } from "class-variance-authority"

export const badgeVariants = cva(
  "inline-flex items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-primary/15 text-primary-foreground backdrop-blur-sm shadow-sm hover:bg-primary/25 hover:shadow-md transition-all",
        secondary:
          "bg-secondary/15 text-secondary-foreground backdrop-blur-sm shadow-sm hover:bg-secondary/25 hover:shadow-md transition-all",
        destructive:
          "bg-destructive/15 text-destructive-foreground backdrop-blur-sm shadow-sm hover:bg-destructive/25 hover:shadow-md transition-all",
        outline: "bg-white/5 text-foreground backdrop-blur-sm shadow-sm hover:bg-white/10 hover:shadow-md transition-all",
        success:
          "bg-success-500/15 text-green-600 backdrop-blur-sm shadow-sm hover:bg-success-500/25 hover:shadow-md transition-all",
        warning:
          "bg-amber-500/15 text-amber-600 backdrop-blur-sm shadow-sm hover:bg-amber-500/25 hover:shadow-md transition-all",
        info:
          "bg-blue-500/15 text-blue-600 backdrop-blur-sm shadow-sm hover:bg-blue-500/25 hover:shadow-md transition-all",
        xp:
          "bg-orange-500/15 text-orange-600 backdrop-blur-sm shadow-sm hover:bg-orange-500/25 hover:shadow-md transition-all",
        level:
          "bg-purple-500/20 text-purple-200 backdrop-blur-sm shadow-sm hover:bg-purple-500/30 hover:shadow-md transition-all",
        achievement:
          "bg-yellow-500/15 text-yellow-600 backdrop-blur-sm shadow-sm hover:bg-yellow-500/25 hover:shadow-md transition-all",
        status:
          "bg-white/10 text-white backdrop-blur-sm shadow-sm hover:bg-white/15 hover:shadow-md transition-all",
        "status-glow":
          "bg-white/15 text-white backdrop-blur-sm shadow-lg hover:bg-white/20 hover:shadow-xl animate-pulse transition-all",
      },
      size: {
        sm: "px-2 py-0.5 text-xs font-medium",
        md: "px-2.5 py-0.5 text-xs font-semibold",
        lg: "px-3 py-1 text-sm font-semibold",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)
