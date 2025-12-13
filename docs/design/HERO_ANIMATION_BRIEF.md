# Hero Animation Brief – TradeYa Home Hero (Minimal Overlay)

## Objective
Provide an ultra-minimal, ambient gradient overlay that subtly complements the existing GradientMeshBackground without adding visual noise. The animation reinforces TradeYa's premium brand identity through gentle color motion while keeping text and CTAs as the clear focal point.

## Visual Direction
- **Base Palette:** Three-stop gradient that travels from TradeYa sunrise orange (`primary-500`/#f97316) through magenta/pink (`pink-500`/#ec4899) into teal (`secondary-500`/#0ea5e9). This palette must complement the existing GradientMeshBackground (opacity 0.15) without competing with it.
- **Core Concept:** Pure gradient overlay with no borders, no noise texture, no extra styling - just clean, ambient color motion that breathes through the brand palette.
- **Opacity Strategy:** Very low opacity (0.05-0.08) to ensure combined visual effect with GradientMeshBackground stays under ~0.23 total opacity, maintaining text readability.

## Animation & Motion

### Ultra-Minimal Gradient Overlay
- Two radial gradients positioned at varying locations (30% 50%, 50% 30%, 70% 50%) that slowly shift position over 25 seconds
- Color transitions cycle through orange → magenta → teal → orange in a seamless loop
- Very slow, breathing effect using easeInOut timing
- Position and color animate simultaneously for subtle movement without distraction

## Technical Considerations
- **Target Runtime:** 25 second seamless loop (very slow, ambient breathing effect)
- **Integration:** Pure transparent overlay on top of existing GradientMeshBackground in the right 2/3 grid column
- **Delivery Format:** Direct framer-motion implementation (no external assets needed)
- **Performance:** Minimal - single `motion.div`, CSS gradients (GPU-accelerated), no data fetching, no complex calculations, no intervals or timers
- **Expected CPU Usage:** ~1-2% when visible

## Data Integration
- **None required** - Animation is purely visual, no data dependencies
- No hooks needed from `useHomePageData`
- No activity feed integration
- No stats integration

## Accessibility
- Respects `prefers-reduced-motion` → empty div fallback (GradientMeshBackground provides all visual structure)
- No pause toggle needed (animation is too subtle to require user control)
- No required interaction
- Text/CTAs remain fully readable and accessible

## References & Constraints
- Animation works at all breakpoints with the same subtle effect
- Main focal area stays within right 2/3 so text remains readable on the left column
- Combined opacity with GradientMeshBackground must not exceed ~0.23 to maintain readability

## Visual Spec
- **Animation type:** Slow radial gradient position/color shift overlay
- **Duration:** 25 seconds per cycle (very slow, breathing effect)
- **Colors:** Primary (#f97316/orange) → Pink (#ec4899/magenta) → Secondary (#0ea5e9/teal) → loop
- **Opacity:** Very low (0.05-0.08) to remain subtle and complement GradientMeshBackground
- **Container:** No border, no background, no noise texture - pure transparent overlay
- **Motion:** EaseInOut for smooth, breathing effect
- **Layer relationship:** Transparent overlay on top of GradientMeshBackground (which uses 0.15 opacity)

## Implementation Details

### Component Structure
- **File:** `src/components/ui/HeroAnimation.tsx`
- **Size:** ~40 lines total (93% code reduction from previous implementation)
- **Dependencies:** Only `framer-motion` and `MotionProvider` (for `isMotionDisabled` check)
- **Exports:** Single `HeroAnimation` component

### Animation Configuration
```tsx
<motion.div
  className="absolute inset-0 pointer-events-none"
  animate={{
    background: [
      "radial-gradient(circle at 30% 50%, rgba(249,115,22,0.06) 0%, transparent 70%), radial-gradient(circle at 70% 50%, rgba(236,72,153,0.05) 0%, transparent 70%)",
      "radial-gradient(circle at 50% 30%, rgba(236,72,153,0.06) 0%, transparent 70%), radial-gradient(circle at 50% 70%, rgba(14,165,233,0.05) 0%, transparent 70%)",
      "radial-gradient(circle at 70% 50%, rgba(14,165,233,0.06) 0%, transparent 70%), radial-gradient(circle at 30% 50%, rgba(249,115,22,0.05) 0%, transparent 70%)",
    ]
  }}
  transition={{
    duration: 25,
    repeat: Infinity,
    ease: "easeInOut",
  }}
/>
```

### Reduced Motion Fallback
- When `isMotionDisabled` is true, component renders empty div
- GradientMeshBackground provides all visual structure in fallback state
- No visual difference expected (since animation is so subtle)

## Success Criteria
- Hero animation provides ambient visual interest without competing with content
- Text and CTAs remain the clear focal point (left column)
- Premium, calm, professional aesthetic
- Ultra-minimal complexity (~93% code reduction from previous implementation)
- No data dependencies
- Fast loading and performant (~1-2% CPU usage)
- Complements, not duplicates, GradientMeshBackground
- Clean, no visual noise (no borders, textures, or extra styling)
- Animation is so subtle that users barely notice it consciously, but feel the premium quality

## Implementation Notes
- Test opacity levels (0.05, 0.06, 0.08) during development to find optimal balance
- Ensure combined visual effect doesn't distract from hero text
- The animation should be so subtle that users barely notice it consciously, but feel the premium quality
- Static fallback is intentionally empty - GradientMeshBackground provides all the visual structure
