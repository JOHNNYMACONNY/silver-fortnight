/**
 * Badge Component - Temporary Implementation
 * 
 * Simple badge component for performance monitoring UI.
 * This is a minimal implementation to resolve import errors.
 */

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../utils/cn"
import { semanticClasses, type Topic } from "../../utils/semanticColors"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success:
          "border-transparent bg-success-500 text-white hover:bg-success-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  topic?: Topic
}

function Badge({ className, variant, topic, ...props }: BadgeProps) {
  return (
    <span className={cn(
      badgeVariants({ variant }),
      topic && semanticClasses(topic).badge,
      className
    )} {...props} />
  )
}

export { Badge, badgeVariants }