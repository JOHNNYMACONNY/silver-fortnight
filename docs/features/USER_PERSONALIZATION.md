# User Personalization Feature

**Last Updated**: November 24, 2025

This document details the user personalization system that adapts the UI based on user behavior and profile data.

## Overview

The user personalization feature provides a tailored experience by adapting the UI, messaging, and content based on the user's activity level, profile completeness, and engagement history.

## Architecture

### useUserPersonalization Hook

The `useUserPersonalization` hook determines user type and provides personalization data.

**Location**: `src/hooks/useUserPersonalization.ts`

**Interface**:
```tsx
export type UserType = 'new' | 'regular' | 'power';

export interface UserPersonalizationData {
  userType: UserType;
  userProfile: User | null;
  tradeCount: number;
  profileCompleteness: number;
  activityLevel: 'low' | 'medium' | 'high';
}

export function useUserPersonalization(): UserPersonalizationData
```

## User Type Classification

### User Types

1. **New User** (`'new'`)
   - Default for users without a profile
   - Trade count: 0-3
   - Profile completeness: 0-50%
   - Activity level: Low

2. **Regular User** (`'regular'`)
   - Trade count: 4-10
   - Profile completeness: 51-80%
   - Activity level: Medium

3. **Power User** (`'power'`)
   - Trade count: >10
   - Profile completeness: >80%
   - Activity level: High

### Classification Logic

```tsx
let userType: UserType = 'new';
if (tradeCount > 10 || profileCompleteness > 80) {
  userType = 'power';
} else if (tradeCount > 3 || profileCompleteness > 50) {
  userType = 'regular';
}
```

## Implementation Details

### Profile Completeness Calculation

The hook calculates profile completeness based on filled fields:

```tsx
const profileFields = [
  userProfile.displayName,
  userProfile.bio,
  userProfile.profilePicture || userProfile.photoURL,
  (userProfile as any).skills,
  userProfile.location,
];

const completedFields = profileFields.filter(field => {
  if (Array.isArray(field)) return field.length > 0;
  return !!field;
}).length;

const profileCompleteness = Math.round((completedFields / profileFields.length) * 100);
```

### Activity Level Calculation

```tsx
let activityLevel: 'low' | 'medium' | 'high' = 'low';
if (tradeCount > 5) {
  activityLevel = 'high';
} else if (tradeCount > 1) {
  activityLevel = 'medium';
}
```

## Usage Examples

### TradesPage Integration

```tsx
import { useUserPersonalization } from '../hooks/useUserPersonalization';

export const TradesPage: React.FC = () => {
  const { userType, tradeCount, profileCompleteness } = useUserPersonalization();
  
  return (
    <div>
      <AnimatedHeading>
        {userType === 'new' ? 'Welcome to TradeYa!' : 
         userType === 'regular' ? 'Available Trades' : 
         'Trade Dashboard'}
      </AnimatedHeading>
      <p>
        {userType === 'new' ? (
          <>Welcome! Start by exploring available trades or create your first trade to exchange skills with the community.</>
        ) : userType === 'regular' ? (
          <>Discover skill exchanges and connect with talented individuals ready to trade expertise.</>
        ) : (
          <>Advanced trading tools and analytics to optimize your skill exchange experience.</>
        )}
      </p>
    </div>
  );
};
```

### DashboardPage Integration

```tsx
import { useUserPersonalization } from '../hooks/useUserPersonalization';

const DashboardPage: React.FC = () => {
  const { userType, profileCompleteness } = useUserPersonalization();
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    let greeting = '';
    if (hour < 12) greeting = 'Good morning';
    else if (hour < 18) greeting = 'Good afternoon';
    else greeting = 'Good evening';

    if (userType === 'new') {
      return `${greeting}, new Trader!`;
    } else if (userType === 'power') {
      return `${greeting}, power Trader!`;
    }
    return `${greeting}, ${getFirstName()}!`;
  };
  
  return (
    <div>
      <h1>{getGreeting()}</h1>
      <p>
        {userType === 'new' ? (
          <>Welcome! Complete your profile to get started with trading.</>
        ) : userType === 'regular' ? (
          <>Welcome back to your trading dashboard</>
        ) : (
          <>Advanced dashboard with analytics and insights</>
        )}
      </p>
      {userType === 'new' && profileCompleteness < 50 && (
        <p className="text-xs text-primary">
          Profile: {profileCompleteness}% complete - Complete your profile to unlock more features
        </p>
      )}
    </div>
  );
};
```

## Personalization Points

### Current Implementation

1. **TradesPage**
   - Personalized heading based on user type
   - Personalized description text
   - Different messaging for new vs. experienced users

2. **DashboardPage**
   - Personalized greeting (time-based + user type)
   - Personalized description
   - Profile completeness prompt for new users

### Future Personalization Opportunities

1. **Onboarding Flow**
   - Show guided tour for new users
   - Skip tutorial for power users

2. **Feature Discovery**
   - Highlight new features for regular users
   - Show advanced features for power users

3. **Content Recommendations**
   - Suggest relevant trades based on history
   - Show trending content for new users

4. **UI Complexity**
   - Simplified UI for new users
   - Advanced options for power users

## Benefits

1. **Improved Onboarding**: New users get appropriate guidance
2. **Reduced Cognitive Load**: UI adapts to user expertise
3. **Increased Engagement**: Personalized messaging resonates better
4. **Better UX**: Users see relevant content and features
5. **Progressive Disclosure**: Advanced features revealed as users progress

## Data Sources

The personalization system uses:

- **User Profile**: From `AuthContext`
- **Trade Count**: From `userProfile.tradesCreated` or `completedTrades`
- **Profile Fields**: Display name, bio, photo, skills, location
- **Activity Metrics**: Trade count, collaborations, challenges

## Privacy Considerations

- All personalization is client-side
- No personal data is sent to external services
- User type is calculated locally
- Profile data is only used for UI adaptation

## Future Enhancements

Potential future improvements:

1. **Machine Learning**: Use ML to predict user preferences
2. **A/B Testing**: Test different personalization strategies
3. **User Preferences**: Allow users to customize their experience
4. **Analytics**: Track personalization effectiveness
5. **Multi-factor Classification**: Consider more factors (time on platform, engagement rate, etc.)

## Related Documentation

- [AuthContext](../technical/AUTHENTICATION.md)
- [User Profile System](./PROFILE_PICTURES.md)

