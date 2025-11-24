/**
 * Icon Utilities
 *
 * This file centralizes icon imports from lucide-react to optimize tree shaking.
 * Instead of importing icons directly from lucide-react in components,
 * import them from this file to ensure only used icons are included in the bundle.
 */

// Import only the icons we need from lucide-react
import {
  // Layout icons
  Home,
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,

  // User related icons
  User,
  Users,
  UserPlus,
  UserCheck,
  UserX,

  // Communication icons
  MessageSquare,
  Bell,
  Mail,

  // Action icons
  Plus,
  PlusCircle,
  Minus,
  MinusCircle,
  Edit,
  Trash,
  Search,
  Filter,
  Settings,
  LogOut,

  // Status icons
  Check,
  CheckCircle,
  AlertCircle,
  Info,
  AlertTriangle,

  // Content icons
  Image,
  File,
  FileText,
  Upload,
  Download,
  Video,
  PenTool,
  Layers,
  Sparkles,
  Book,
  Car,

  // Commerce icons
  ShoppingBag,
  CreditCard,
  DollarSign,

  // Challenge and gamification icons
  Target,
  Zap,
  Flame,
  BookOpen,
  Code,
  Palette,
  Camera,
  Music,
  Dumbbell,
  Gamepad2,
  Brain,
  Lightbulb,
  Rocket,
  Flag,
  Timer,
  Medal,
  Crown,
  Gem,
  CircleDot,
  Play,
  Pause,
  BarChart3,
  TrendingDown,
  Activity,

  // Misc icons
  Briefcase,
  Award,
  Trophy,
  Shield,
  Star,
  Heart,
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  Link,
  Loader2,
  TrendingUp,
} from 'lucide-react';

// Export all icons
export {
  // Layout icons
  Home,
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,

  // User related icons
  User,
  Users,
  UserPlus,
  UserCheck,
  UserX,

  // Communication icons
  MessageSquare,
  Bell,
  Mail,

  // Action icons
  Plus,
  PlusCircle,
  Minus,
  MinusCircle,
  Edit,
  Trash,
  Search,
  Filter,
  Settings,
  LogOut,

  // Status icons
  Check,
  CheckCircle,
  AlertCircle,
  Info,
  AlertTriangle,

  // Content icons
  Image,
  File,
  FileText,
  Upload,
  Download,
  Video,
  PenTool,
  Layers,
  Sparkles,
  Book,
  Car,

  // Commerce icons
  ShoppingBag,
  CreditCard,
  DollarSign,

  // Challenge and gamification icons
  Target,
  Zap,
  Flame,
  BookOpen,
  Code,
  Palette,
  Camera,
  Music,
  Dumbbell,
  Gamepad2,
  Brain,
  Lightbulb,
  Rocket,
  Flag,
  Timer,
  Medal,
  Crown,
  Gem,
  CircleDot,
  Play,
  Pause,
  BarChart3,
  TrendingDown,
  Activity,

  // Misc icons
  Briefcase,
  Award,
  Trophy,
  Shield,
  Star,
  Heart,
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  Link,
  Loader2,
  TrendingUp,
};

// Challenge icon mappings
export const getChallengeIcon = (category: string) => {
  const iconMap: { [key: string]: any } = {
    SKILL_BUILDING: BookOpen,
    TRADING: ShoppingBag,
    NETWORKING: Users,
    CREATIVITY: Palette,
    TECHNOLOGY: Code,
    FITNESS: Dumbbell,
    LIFESTYLE: Heart,
    LEARNING: Brain,
    PRODUCTIVITY: Rocket,
    GAMING: Gamepad2,
    PHOTOGRAPHY: Camera,
    MUSIC: Music,
    DEFAULT: Target
  };
  return iconMap[category] || iconMap.DEFAULT;
};

export const getDifficultyIcon = (difficulty: string) => {
  const iconMap: { [key: string]: any } = {
    BEGINNER: CircleDot,
    INTERMEDIATE: Zap,
    ADVANCED: Flame,
    EXPERT: Crown,
    DEFAULT: Target
  };
  return iconMap[difficulty] || iconMap.DEFAULT;
};

export const getChallengeTypeIcon = (type: string) => {
  const iconMap: { [key: string]: any } = {
    DAILY: Clock,
    WEEKLY: Calendar,
    MONTHLY: Flag,
    SPECIAL: Star,
    COMMUNITY: Users,
    DEFAULT: Target
  };
  return iconMap[type] || iconMap.DEFAULT;
};

export const getChallengeStatusIcon = (status: string) => {
  const iconMap: { [key: string]: any } = {
    DRAFT: Edit,
    ACTIVE: Play,
    PAUSED: Pause,
    COMPLETED: Check,
    CANCELLED: X,
    DEFAULT: CircleDot
  };
  return iconMap[status] || iconMap.DEFAULT;
};

export const getProgressIcon = (percentage: number) => {
  if (percentage === 0) return Play;
  if (percentage < 25) return Activity;
  if (percentage < 50) return BarChart3;
  if (percentage < 75) return TrendingUp;
  if (percentage < 100) return Flame;
  return Trophy;
};

export const getRewardIcon = (rewardType: string) => {
  const iconMap: { [key: string]: any } = {
    XP: Zap,
    BADGE: Medal,
    TROPHY: Trophy,
    ITEM: Gem,
    CURRENCY: DollarSign,
    DEFAULT: Award
  };
  return iconMap[rewardType] || iconMap.DEFAULT;
};
