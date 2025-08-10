/**
 * TradeYa Animation Components
 * 
 * Centralized exports for all animation components and utilities
 */

// Core Animation Hook
export { 
  useTradeYaAnimation,
  TRADEYA_ANIMATION_CONFIG,
  TRADEYA_BRAND_COLORS,
  type MicroInteractionProps,
  type AnimationState,
  type UseTradeYaAnimationReturn,
  type AnimationType,
  type AnimationIntensity,
  type BrandColorScheme,
  type TradingContext,
} from "../../hooks/useTradeYaAnimation";

// Animated Button Components
export {
  AnimatedButton,
  ProposalSubmitButton,
  NegotiationResponseButton,
  ConfirmationButton,
  CompletionButton,
  type AnimatedButtonProps,
} from "./AnimatedButton";

// Trade Status Indicator
export {
  TradeStatusIndicator,
  type TradeStatusIndicatorProps,
  type TradeStatus,
} from "./TradeStatusIndicator";

// Trade Progress Ring
export {
  TradeProgressRing,
  TradeProposalProgress,
  TradeNegotiationProgress,
  TradeConfirmationProgress,
  TradeCompletionProgress,
  type TradeProgressRingProps,
} from "./TradeProgressRing";

// Mobile Animation Hooks
export {
  useMobileAnimation,
  getMobileTradingConfig,
  type TouchAnimationProps
} from "../../hooks/useMobileAnimation";

// Swipe Gesture Hooks
export {
  useSwipeGestures,
  TRADE_CARD_SWIPE_CONFIG,
  NAVIGATION_SWIPE_CONFIG,
  MODAL_SWIPE_CONFIG,
  type SwipeDirection,
  type SwipeConfig,
  type SwipeEvent
} from "../../hooks/useSwipeGestures";

// Mobile Animated Button Components
export {
  MobileAnimatedButton,
  MobileProposalSubmitButton,
  MobileNegotiationResponseButton,
  MobileConfirmationButton,
  type MobileAnimatedButtonProps,
} from "./MobileAnimatedButton";

// Swipeable Trade Card
export {
  SwipeableTradeCard,
  type SwipeableTradeCardProps,
  type SwipeAction,
} from "./SwipeableTradeCard";

// Week 3: Additional Specialized Trading Components

// Animated Skill Badge
export {
  AnimatedSkillBadge,
  ProposalSkillBadge,
  SelectionSkillBadge,
  NegotiationSkillBadge,
  type AnimatedSkillBadgeProps,
  type SkillLevel,
} from "./AnimatedSkillBadge";

// Error State Animations
export {
  ErrorStateAnimation,
  TradeErrorAnimation,
  NetworkErrorAnimation,
  type ErrorType,
  type ErrorSeverity,
  type ErrorState,
  type ErrorAnimationProps,
} from "./ErrorStateAnimations";

// Advanced Swipeable Trade Card
export {
  AdvancedSwipeableTradeCard,
  type AdvancedSwipeableTradeCardProps,
  type MultiStepSwipeAction,
} from "./AdvancedSwipeableTradeCard";

// Trading Progress Animations
export {
  TradingProgressAnimation,
  CompactTradingProgress,
  type TradingStep,
  type StepStatus,
  type TradingStepData,
  type TradingProgressAnimationProps,
} from "./TradingProgressAnimations";
