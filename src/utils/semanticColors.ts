// Semantic color utilities for topic-driven styling
// Topics map to brand tokens (Tailwind v4-friendly)

export type Topic = 'trades' | 'collaboration' | 'community' | 'success' | 'warning' | 'danger' | 'difficulty'

type TopicClasses = {
  text: string
  bgSubtle: string
  bgSolid: string
  dot: string
  ring: string
  badge: string
  link: string
  gradient: string
  gradientText: string
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
    gradientText: 'bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent',
  },
  // Purple / accent — Collaboration
  collaboration: {
    text: 'text-purple-600 dark:text-purple-400',
    bgSubtle: 'bg-purple-50 dark:bg-purple-950/20',
    bgSolid: 'bg-purple-500',
    dot: 'bg-purple-500',
    ring: 'ring-purple-500/40',
    badge: 'bg-purple-500/20 text-purple-200',
    link: 'text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300',
    gradient: 'bg-gradient-to-r from-purple-500 to-purple-600',
    gradientText: 'bg-gradient-to-r from-purple-500 to-purple-600 bg-clip-text text-transparent',
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
    gradientText: 'bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent',
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
    gradientText: 'bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent',
  },
  // Yellow / warning — Caution & alerts
  warning: {
    text: 'text-warning-600 dark:text-warning-400',
    bgSubtle: 'bg-warning-50 dark:bg-warning-950/20',
    bgSolid: 'bg-warning-500',
    dot: 'bg-warning-500',
    ring: 'ring-warning-500/40',
    badge: 'bg-warning-500/10 text-warning-600 dark:text-warning-400',
    link: 'text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300',
    gradient: 'bg-gradient-to-r from-yellow-500 to-orange-500',
    gradientText: 'bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent',
  },
  // Red / danger — Errors & destructive actions
  danger: {
    text: 'text-destructive-600 dark:text-destructive-400',
    bgSubtle: 'bg-destructive-50 dark:bg-destructive-950/20',
    bgSolid: 'bg-destructive-500',
    dot: 'bg-destructive-500',
    ring: 'ring-destructive-500/40',
    badge: 'bg-destructive-500/10 text-destructive-600 dark:text-destructive-400',
    link: 'text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300',
    gradient: 'bg-gradient-to-r from-red-500 to-rose-600',
    gradientText: 'bg-gradient-to-r from-red-500 to-rose-600 bg-clip-text text-transparent',
  },
  // Gray / neutral — Difficulty levels (context-specific colors)
  difficulty: {
    text: 'text-gray-600 dark:text-gray-400',
    bgSubtle: 'bg-gray-50 dark:bg-gray-950/20',
    bgSolid: 'bg-gray-500',
    dot: 'bg-gray-500',
    ring: 'ring-gray-500/40',
    badge: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
    link: 'text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
    gradient: 'bg-gradient-to-r from-gray-500 to-gray-600',
    gradientText: 'bg-gradient-to-r from-gray-500 to-gray-600 bg-clip-text text-transparent',
  },
}

export function semanticClasses(topic: Topic): TopicClasses {
  return topicToClasses[topic]
}

// Special brand gradient for premium headings (primary to secondary)
export const brandGradientText = 'bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent'


