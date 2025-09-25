// Semantic color utilities for topic-driven styling
// Topics map to brand tokens (Tailwind v4-friendly)

export type Topic = 'trades' | 'collaboration' | 'community' | 'success'

type TopicClasses = {
  text: string
  bgSubtle: string
  bgSolid: string
  dot: string
  ring: string
  badge: string
  link: string
  gradient: string
}

const topicToClasses: Record<Topic, TopicClasses> = {
  // Orange / primary — Trades
  trades: {
    text: 'text-primary-600 dark:text-primary-400',
    bgSubtle: 'bg-primary-50 dark:bg-primary-950/20',
    bgSolid: 'bg-primary-500',
    dot: 'bg-primary-500',
    ring: 'ring-primary-500/40',
    badge: 'bg-primary-500/10 text-primary-600 dark:text-primary-400',
    link: 'text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300',
    gradient: 'bg-gradient-to-r from-primary-500 to-primary-600',
  },
  // Purple / accent — Collaboration
  collaboration: {
    text: 'text-purple-600 dark:text-purple-400',
    bgSubtle: 'bg-purple-50 dark:bg-purple-950/20',
    bgSolid: 'bg-purple-500',
    dot: 'bg-purple-500',
    ring: 'ring-purple-500/40',
    badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    link: 'text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300',
    gradient: 'bg-gradient-to-r from-purple-500 to-purple-600',
  },
  // Blue / secondary — Community & data
  community: {
    text: 'text-secondary-600 dark:text-secondary-400',
    bgSubtle: 'bg-secondary-100/50 dark:bg-secondary-900/20',
    bgSolid: 'bg-secondary-500',
    dot: 'bg-secondary-500',
    ring: 'ring-secondary-500/40',
    badge: 'bg-secondary-500/10 text-secondary-600 dark:text-secondary-400',
    link: 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300',
    gradient: 'bg-gradient-to-r from-blue-500 to-indigo-600',
  },
  // Green / success — Rewards & positive status
  success: {
    text: 'text-success-600 dark:text-success-400',
    bgSubtle: 'bg-success-50 dark:bg-success-950/20',
    bgSolid: 'bg-success-500',
    dot: 'bg-success-500',
    ring: 'ring-success-500/40',
    badge: 'bg-success-500/10 text-success-600 dark:text-success-400',
    link: 'text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300',
    gradient: 'bg-gradient-to-r from-green-500 to-emerald-600',
  },
}

export function semanticClasses(topic: Topic): TopicClasses {
  return topicToClasses[topic]
}


