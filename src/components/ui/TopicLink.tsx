import * as React from 'react'
import { Link } from 'react-router-dom'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../utils/cn'
import { semanticClasses, type Topic } from '../../utils/semanticColors'

const topicLinkVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Premium button-style with glassmorphic background
        premium: "glassmorphic border-glass shadow-lg hover:shadow-xl hover:scale-105 transform backdrop-blur-sm",
        // Interactive card-style with subtle effects
        interactive: "glassmorphic border-glass shadow-md hover:shadow-lg hover:scale-102 transform backdrop-blur-sm",
        // Clean glassmorphic with minimal effects
        glassmorphic: "glassmorphic border-glass shadow-sm hover:shadow-md backdrop-blur-sm",
        // Subtle background with border
        subtle: "bg-white/5 border border-white/20 hover:bg-white/10 backdrop-blur-sm",
        // Text-only with hover effects
        text: "hover:bg-white/5 rounded-lg transition-colors duration-200",
      },
      size: {
        sm: "px-3 py-2 text-sm rounded-lg",
        md: "px-4 py-3 text-base rounded-xl",
        lg: "px-6 py-4 text-lg rounded-2xl",
      },
      fullWidth: {
        true: "w-full",
        false: "w-auto",
      }
    },
    defaultVariants: {
      variant: "interactive",
      size: "md",
      fullWidth: false,
    },
  }
)

export interface TopicLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement>, VariantProps<typeof topicLinkVariants> {
  to?: string
  href?: string
  topic: Topic
  icon?: React.ReactNode
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  className?: string
}

export const TopicLink: React.FC<TopicLinkProps> = ({ 
  to, 
  href, 
  topic, 
  variant,
  size,
  fullWidth,
  icon,
  leftIcon,
  rightIcon,
  className, 
  children, 
  ...rest 
}) => {
  const topicClasses = semanticClasses(topic)
  
  // Combine topic-specific styling with variant styling
  const getTopicStyles = () => {
    switch (variant) {
      case 'premium':
        return `${topicClasses.text} ${topicClasses.ring} hover:ring-2`
      case 'interactive':
        return `${topicClasses.text} ${topicClasses.ring} hover:ring-1`
      case 'glassmorphic':
        return `${topicClasses.text}`
      case 'subtle':
        // For subtle variant, use only text colors, let variant handle background
        return `${topicClasses.text}`
      case 'text':
        return `${topicClasses.link}`
      default:
        return `${topicClasses.text}`
    }
  }

  const topicStyles = getTopicStyles()
  
  // Determine which icon to show
  const displayLeftIcon = leftIcon || icon
  const displayRightIcon = rightIcon

  const linkClasses = cn(
    topicLinkVariants({ variant, size, fullWidth }),
    topicStyles,
    className
  )

  if (to) {
    return (
      <Link to={to} className={linkClasses} {...(rest as any)}>
        {displayLeftIcon && <span className="mr-2">{displayLeftIcon}</span>}
        {children}
        {displayRightIcon && <span className="ml-2">{displayRightIcon}</span>}
      </Link>
    )
  }
  return (
    <a href={href} className={linkClasses} {...rest}>
      {displayLeftIcon && <span className="mr-2">{displayLeftIcon}</span>}
      {children}
      {displayRightIcon && <span className="ml-2">{displayRightIcon}</span>}
    </a>
  )
}

export default TopicLink


