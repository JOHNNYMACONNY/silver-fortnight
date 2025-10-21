# TradeYa Gamification Component Usage Guide

**Status**: Phase 1 IMPLEMENTED ✅  
**Date**: June 2, 2025  
**Target Audience**: Frontend developers using gamification components

This guide provides comprehensive documentation for using the TradeYa gamification UI components, including props, styling, examples, and best practices.

## Component Overview

The gamification system includes these main UI components:

1. **XPDisplay** - Shows user XP progress and level information
2. **LevelBadge** - Visual level indicator with tier-specific styling
3. **AchievementBadge** - Individual achievement display with rarity styling
4. **GamificationDashboard** - Complete gamification overview with tabs (includes Streaks summary, Weekly XP Goal, opt‑in XP Breakdown)
5. **StreakWidget** - Displays current/longest streak, next milestone, and freeze info
6. **WeeklyXPGoal** - Shows weekly XP progress with tips and a “Goal met” badge
7. **XPBreakdown** - Summarizes XP sources (hidden by default behind “See breakdown”)
8. **Leaderboard** - Global rankings with optional "My Circle" filter and a current-user context row

## Updates (Phase 2B.2+)

- WeeklyXPGoal now supports:
  - Editable target (100–5000 XP). Persisted in localStorage per-user under `weekly-xp-goal-target-<uid>`.
  - Tips toggle persisted in localStorage under `weekly-xp-goal-tips-<uid>`.
  - One-time per-week analytics event `weekly_goal_met` via `useBusinessMetrics()` when crossing to ≥100% for a given week key (YYYY-WW), plus a lightweight toast reward.
- Notification Preferences supports a **Weekly Goal Met** toast toggle; when disabled, WeeklyXPGoal suppresses the toast while still recording analytics.
- XPBreakdown visibility now persists per-user via localStorage under `xp-breakdown-visible-<uid>` so the previously chosen state is restored on load.

## Quick Start

### Basic Import and Usage

```typescript
import { 
  XPDisplay, 
  LevelBadge, 
  AchievementBadge, 
  GamificationDashboard 
} from '../components/gamification';

function UserProfile({ userId }: { userId: string }) {
  return (
    <div className="space-y-6">
      {/* Quick XP overview */}
      <div className="flex items-center gap-4">
        <LevelBadge userId={userId} size="large" />
        <XPDisplay userId={userId} mode="compact" />
      </div>
      
      {/* Full gamification dashboard */}
      <GamificationDashboard userId={userId} />
    </div>
  );
}
```

## Component Reference
### StreakWidget

Props:
```typescript
interface StreakWidgetProps {
  userId: string;
  type?: 'login' | 'challenge' | 'skill_practice';
  className?: string;
}
```
Notes:
- Tooltips explain thresholds and +XP at milestones
- Shows “Freeze used” badge only on the day a freeze was consumed
- Respects env thresholds and max freezes from `streakConfig`

### WeeklyXPGoal

Props:
```typescript
interface WeeklyXPGoalProps {
  userId: string;
  target?: number; // default 500; overridden by persisted user preference if present
  className?: string;
}
```
Notes:
- Persists a per‑week “goal met” badge via localStorage (`xp-week-goal-<uid>-<YYYY-WW>`)
- Target and tips preferences persist via localStorage; component UI remains compact using progressive disclosure

### Leaderboard

Props:
```typescript
interface LeaderboardProps {
  category: LeaderboardCategory;
  period: LeaderboardPeriod;
  limit?: number;
  showCurrentUser?: boolean;
  compact?: boolean;
  refreshInterval?: number;
}
```

Notes:
- Shows a context row for the current user even if they’re not in the top N.
- Includes an optional "My Circle" toggle (shown only if the user follows anyone) to scope rankings to people the user follows.
- The "My Circle" toggle persists per user via localStorage (`leaderboard-circle-<uid>`).

### XPBreakdown

- Hidden by default; reveal via a “See breakdown” button to reduce noise
- Visibility persists per-user using `xp-breakdown-visible-<uid>`

### 1. XPDisplay Component

Displays user XP progress with animated progress bars and level information.

#### Props

```typescript
interface XPDisplayProps {
  userId: string;                    // Required: Firebase Auth UID
  mode?: 'compact' | 'full';         // Display mode (default: 'full')
  showHistory?: boolean;             // Show XP transaction history (default: false)
  className?: string;                // Additional CSS classes
}
```

#### Usage Examples

**Compact Mode** (for headers, cards):
```typescript
<XPDisplay 
  userId="user123" 
  mode="compact" 
  className="bg-white rounded-lg p-4"
/>
```

**Full Mode with History** (for profile pages):
```typescript
<XPDisplay 
  userId="user123" 
  mode="full" 
  showHistory={true}
  className="w-full"
/>
```

#### Visual Output

**Compact Mode**:
```
┌─────────────────────────────────────┐
│ Level 4: Specialist                 │
│ ████████████░░░░ 750/1000 XP        │
│ 250 XP to next level                │
└─────────────────────────────────────┘
```

**Full Mode**:
```
┌─────────────────────────────────────┐
│ Level 4: Specialist                 │
│ ████████████░░░░ 750/1000 XP        │
│ 250 XP to next level                │
│                                     │
│ Recent XP Activity:                 │
│ • +150 XP - Role completion         │
│ • +100 XP - Trade completion        │
│ • +50 XP - Quick response bonus     │
└─────────────────────────────────────┘
```

#### Styling Classes

- `.xp-display` - Main container
- `.xp-progress-bar` - Progress bar container
- `.xp-progress-fill` - Animated progress fill
- `.xp-history` - Transaction history section

### 2. LevelBadge Component

Visual level indicator with tier-specific colors and animations.

#### Props

```typescript
interface LevelBadgeProps {
  userId: string;                    // Required: Firebase Auth UID
  size?: 'small' | 'medium' | 'large'; // Badge size (default: 'medium')
  showTooltip?: boolean;             // Show level details on hover (default: true)
  className?: string;                // Additional CSS classes
}
```

#### Usage Examples

**Small Badge** (for lists, comments):
```typescript
<LevelBadge userId="user123" size="small" />
```

**Large Badge** (for profile headers):
```typescript
<LevelBadge 
  userId="user123" 
  size="large" 
  showTooltip={true}
  className="shadow-lg"
/>
```

#### Visual Output

**Level Badge Appearance**:
```
Small:   [4]     Medium:  [ 4 ]     Large:   [  4  ]
                          Spec              Specialist
```

#### Level Colors

| Level | Title | Color | Hex Code |
|-------|-------|-------|----------|
| 1 | Newcomer | Gray | #6B7280 |
| 2 | Explorer | Green | #10B981 |
| 3 | Contributor | Blue | #3B82F6 |
| 4 | Specialist | Purple | #8B5CF6 |
| 5 | Expert | Orange | #F59E0B |
| 6 | Master | Red | #EF4444 |
| 7 | Legend | Gold | #F59E0B |

#### Styling Classes

- `.level-badge` - Main badge container
- `.level-badge-small` - Small size variant
- `.level-badge-medium` - Medium size variant
- `.level-badge-large` - Large size variant
- `.level-{number}` - Level-specific styling

### 3. AchievementBadge Component

Individual achievement display with rarity-based styling and unlock states.

#### Props

```typescript
interface AchievementBadgeProps {
  achievement: Achievement;          // Required: Achievement data
  isUnlocked: boolean;              // Required: Unlock status
  size?: 'small' | 'medium' | 'large'; // Badge size (default: 'medium')
  showDetails?: boolean;            // Show achievement details (default: false)
  onClick?: () => void;             // Click handler (optional)
  className?: string;               // Additional CSS classes
}
```

#### Usage Examples

**Achievement Gallery**:
```typescript
{achievements.map(achievement => (
  <AchievementBadge
    key={achievement.id}
    achievement={achievement}
    isUnlocked={userAchievements.includes(achievement.id)}
    size="medium"
    showDetails={true}
    onClick={() => showAchievementModal(achievement)}
  />
))}
```

**Compact Achievement List**:
```typescript
<AchievementBadge
  achievement={firstTradeAchievement}
  isUnlocked={true}
  size="small"
  className="inline-block mr-2"
/>
```

#### Visual Output

**Unlocked Achievement**:
```
┌─────────────────┐
│ 🤝 First Trade  │
│ ⭐ Common       │
│ Complete your   │
│ first trade     │
└─────────────────┘
```

**Locked Achievement**:
```
┌─────────────────┐
│ 🔒 ???          │
│ ⭐ Common       │
│ Complete 10     │
│ trades to unlock│
└─────────────────┘
```

#### Rarity Colors

| Rarity | Color | Hex Code | Border |
|--------|-------|----------|--------|
| Common | Gray | #6B7280 | Solid |
| Uncommon | Green | #10B981 | Solid |
| Rare | Blue | #3B82F6 | Dashed |
| Epic | Purple | #8B5CF6 | Dotted |
| Legendary | Gold | #F59E0B | Glowing |

#### Styling Classes

- `.achievement-badge` - Main badge container
- `.achievement-unlocked` - Unlocked state styling
- `.achievement-locked` - Locked state styling
- `.rarity-{rarity}` - Rarity-specific styling
- `.achievement-details` - Expandable details section

### 4. GamificationDashboard Component

Complete gamification overview with tabbed interface showing XP progress and achievements.

#### Props

```typescript
interface GamificationDashboardProps {
  userId: string;                    // Required: Firebase Auth UID
  defaultTab?: 'xp' | 'achievements'; // Default active tab (default: 'xp')
  className?: string;                // Additional CSS classes
}
```

#### Usage Examples

**Full Dashboard** (for profile pages):
```typescript
<GamificationDashboard 
  userId="user123" 
  defaultTab="xp"
  className="bg-white rounded-lg shadow-lg p-6"
/>
```

**Achievement-focused Dashboard**:
```typescript
<GamificationDashboard 
  userId="user123" 
  defaultTab="achievements"
/>
```

#### Visual Output

```
┌─────────────────────────────────────────────────────────┐
│ [XP Progress] [Achievements]                            │
├─────────────────────────────────────────────────────────┤
│ Level 4: Specialist                                     │
│ ████████████░░░░ 750/1000 XP                           │
│ 250 XP to next level                                    │
│                                                         │
│ Recent XP Activity:                                     │
│ • +150 XP - Role completion (2 hours ago)              │
│ • +100 XP - Trade completion (1 day ago)               │
│ • +50 XP - Quick response bonus (1 day ago)            │
│                                                         │
│ [Load More History]                                     │
└─────────────────────────────────────────────────────────┘
```

#### Tab Content

**XP Progress Tab**:
- Current level and XP display
- Progress bar to next level
- XP transaction history with pagination
- Level benefits and unlocks

**Achievements Tab**:
- Achievement gallery with unlock status
- Achievement categories (Trading, Collaboration, etc.)
- Progress indicators for locked achievements
- Achievement details and requirements

#### Styling Classes

- `.gamification-dashboard` - Main dashboard container
- `.dashboard-tabs` - Tab navigation
- `.dashboard-content` - Tab content area
- `.xp-tab` - XP progress tab content
- `.achievements-tab` - Achievements tab content

## Responsive Design

All components are designed to be mobile-responsive:

### Breakpoint Behavior

**Mobile (< 768px)**:
- Components stack vertically
- Text sizes reduce appropriately
- Touch-friendly interaction areas
- Simplified layouts for small screens

**Tablet (768px - 1024px)**:
- Balanced layouts with adequate spacing
- Medium-sized components
- Optimized for touch interaction

**Desktop (> 1024px)**:
- Full-featured layouts
- Hover effects and tooltips
- Larger component sizes
- Enhanced visual details

### Responsive Classes

```css
/* Mobile-first responsive design */
.xp-display {
  @apply text-sm p-3;
}

@media (min-width: 768px) {
  .xp-display {
    @apply text-base p-4;
  }
}

@media (min-width: 1024px) {
  .xp-display {
    @apply text-lg p-6;
  }
}
```

## Dark Mode Support

All components support dark mode through Tailwind CSS dark mode classes:

### Dark Mode Implementation

```typescript
// Components automatically adapt to dark mode
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
  <XPDisplay userId="user123" />
</div>
```

### Dark Mode Colors

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Background | `bg-white` | `bg-gray-800` |
| Text | `text-gray-900` | `text-white` |
| Borders | `border-gray-200` | `border-gray-600` |
| Progress Bar | `bg-blue-500` | `bg-blue-400` |
| Achievements | `bg-gray-50` | `bg-gray-700` |

## Animation and Interactions

### Progress Bar Animations

```css
.xp-progress-fill {
  transition: width 0.5s ease-in-out;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}
```

### Achievement Unlock Animation

```css
.achievement-unlock {
  animation: achievementUnlock 0.6s ease-out;
}

@keyframes achievementUnlock {
  0% { transform: scale(0.8); opacity: 0; }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}
```

### Hover Effects

```css
.level-badge:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
}

.achievement-badge:hover {
  transform: scale(1.05);
  transition: transform 0.2s ease;
}
```

## Accessibility

### ARIA Labels and Roles

```typescript
// Example accessibility implementation
<div 
  role="progressbar" 
  aria-valuenow={currentXP} 
  aria-valuemin={0} 
  aria-valuemax={nextLevelXP}
  aria-label={`Level ${level}: ${currentXP} of ${nextLevelXP} XP`}
>
  <div className="xp-progress-fill" style={{ width: `${progress}%` }} />
</div>
```

### Keyboard Navigation

```typescript
// Achievement badge with keyboard support
<div
  tabIndex={0}
  role="button"
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      onClick?.();
    }
  }}
  aria-label={`${achievement.title} achievement, ${isUnlocked ? 'unlocked' : 'locked'}`}
>
  <AchievementBadge achievement={achievement} isUnlocked={isUnlocked} />
</div>
```

### Screen Reader Support

- All components include proper ARIA labels
- Progress bars announce current progress
- Achievement states are clearly communicated
- Level changes are announced to screen readers

## Performance Optimization

### Lazy Loading

```typescript
// Lazy load gamification dashboard
const GamificationDashboard = lazy(() => import('./GamificationDashboard'));

function ProfilePage({ userId }: { userId: string }) {
  const [showGamification, setShowGamification] = useState(false);
  
  return (
    <div>
      <button onClick={() => setShowGamification(true)}>
        Show Progress
      </button>
      
      {showGamification && (
        <Suspense fallback={<div>Loading...</div>}>
          <GamificationDashboard userId={userId} />
        </Suspense>
      )}
    </div>
  );
}
```

### Memoization

```typescript
// Memoize expensive calculations
const MemoizedXPDisplay = memo(XPDisplay, (prevProps, nextProps) => {
  return prevProps.userId === nextProps.userId && 
         prevProps.mode === nextProps.mode;
});
```

### Virtual Scrolling

For large achievement lists:

```typescript
import { FixedSizeList as List } from 'react-window';

function AchievementList({ achievements }: { achievements: Achievement[] }) {
  const Row = ({ index, style }: { index: number; style: CSSProperties }) => (
    <div style={style}>
      <AchievementBadge 
        achievement={achievements[index]} 
        isUnlocked={userAchievements.includes(achievements[index].id)}
      />
    </div>
  );

  return (
    <List
      height={400}
      itemCount={achievements.length}
      itemSize={80}
    >
      {Row}
    </List>
  );
}
```

## Error Handling

### Loading States

```typescript
function XPDisplay({ userId }: { userId: string }) {
  const [userXP, setUserXP] = useState<UserXP | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getUserXP(userId)
      .then(setUserXP)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <XPDisplaySkeleton />;
  if (error) return <ErrorMessage message={error} />;
  if (!userXP) return <div>No XP data available</div>;

  return <XPDisplayContent userXP={userXP} />;
}
```

### Error Boundaries

```typescript
class GamificationErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Gamification component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">Unable to load gamification data</p>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## Testing Components

### Unit Tests

```typescript
import { render, screen } from '@testing-library/react';
import { XPDisplay } from '../XPDisplay';

describe('XPDisplay', () => {
  test('renders user XP correctly', async () => {
    render(<XPDisplay userId="test-user" mode="compact" />);
    
    await waitFor(() => {
      expect(screen.getByText(/Level \d+/)).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  test('handles loading state', () => {
    render(<XPDisplay userId="test-user" />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
```

### Integration Tests

```typescript
describe('GamificationDashboard Integration', () => {
  test('displays user progress and achievements', async () => {
    const user = await createTestUser();
    await awardXP(user.id, 150, XPSource.TRADE_COMPLETION);
    
    render(<GamificationDashboard userId={user.id} />);
    
    await waitFor(() => {
      expect(screen.getByText('150 XP')).toBeInTheDocument();
      expect(screen.getByText('Level 2')).toBeInTheDocument();
    });
  });
});
```

This component usage guide provides everything needed to effectively use the TradeYa gamification components in your application.
