import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "../../utils/cn"
import { semanticClasses, type Topic } from "../../utils/semanticColors"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-success-500 text-white hover:bg-success-600",
        warning: "bg-warning-500 text-white hover:bg-warning-600",
        // Aliases for broader API compatibility
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        brand: "bg-primary text-primary-foreground hover:bg-primary/90",
        accent: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        tertiary: "hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
        // Aliases
        xs: "h-8 rounded-md px-3",
        md: "h-10 px-4 py-2",
        xl: "h-12 rounded-md px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
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
  ({ className, variant, size, asChild = false, isLoading = false, fullWidth = false, rounded = false, leftIcon, rightIcon, children, topic, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"

    // Topic-aware class additions depending on variant
    const topicClasses = topic
      ? (
          !variant || variant === 'default' || variant === 'primary' || variant === 'brand'
            ? `${semanticClasses(topic).bgSolid} text-white`
            : variant === 'link'
              ? `${semanticClasses(topic).link}`
              : ''
        )
      : ''

    // When using `asChild`, Radix Slot requires exactly one React element child.
    // To satisfy this constraint, we intentionally render ONLY `children` here.
    // If you need icons with `asChild`, include them inside the single child element.
    if (asChild) {
      return (
        <Comp
          className={cn(
            buttonVariants({ variant, size, className }),
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
          buttonVariants({ variant, size, className }),
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

export { Button, buttonVariants }
