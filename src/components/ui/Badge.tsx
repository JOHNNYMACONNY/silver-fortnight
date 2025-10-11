/**
 * Badge Component - Temporary Implementation
 * 
 * Simple badge component for performance monitoring UI.
 * This is a minimal implementation to resolve import errors.
 */

import * as React from "react"
import { type VariantProps } from "class-variance-authority"

import { cn } from "../../utils/cn"
import { semanticClasses, type Topic } from "../../utils/semanticColors"
import { badgeVariants } from "./badge-variants"

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  topic?: Topic
}

function Badge({ className, variant, size, topic, ...props }: BadgeProps) {
  // For default variant with topic, use topic badge styling (transparent backgrounds)
  const getBadgeClasses = () => {
    if (variant === "default" && topic) {
      const topicClasses = semanticClasses(topic);
      return cn(
        "inline-flex items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        badgeVariants({ size }), // Use size from badgeVariants (includes font weight)
        topicClasses.badge, // Use transparent badge styling from semantic system
        className
      );
    }
    
    // For other variants, use normal logic
    return cn(
      badgeVariants({ variant, size }),
      topic && variant !== "default" && semanticClasses(topic).badge,
      className
    );
  };

  return (
    <span className={getBadgeClasses()} {...props} />
  )
}

export { Badge }