import * as React from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../utils/cn'
import { semanticClasses, type Topic } from '../../utils/semanticColors'

export interface TopicLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to?: string
  href?: string
  topic: Topic
  className?: string
}

export const TopicLink: React.FC<TopicLinkProps> = ({ to, href, topic, className, children, ...rest }) => {
  const topicClass = semanticClasses(topic).link
  if (to) {
    return (
      <Link to={to} className={cn(topicClass, className)} {...(rest as any)}>
        {children}
      </Link>
    )
  }
  return (
    <a href={href} className={cn(topicClass, className)} {...rest}>
      {children}
    </a>
  )
}

export default TopicLink


