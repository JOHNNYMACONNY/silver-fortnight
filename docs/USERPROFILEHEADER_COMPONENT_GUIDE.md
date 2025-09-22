# UserProfileHeader Component Guide

**Location**: `src/components/features/UserProfileHeader.tsx`  
**Status**: ✅ Production Ready  
**Last Updated**: January 2025

## Overview

The `UserProfileHeader` component is a comprehensive, reusable profile header that displays user information with support for various features including profile images, handles, verification status, bio expansion, and action buttons.

## Features

### ✅ **Core Features**
- **Profile Image Display**: With fallback to user icon
- **User Information**: Name, handle, verification status
- **Reputation Badge**: With tooltip explaining scoring
- **Bio Support**: Expandable with "Show more/less" for long content
- **Action Buttons**: Edit profile (own) or Share profile (others)
- **Mutual Followers**: Display for other profiles
- **Email Display**: Only for own profile
- **Tagline Support**: One-line user description

### ✅ **Advanced Features**
- **Responsive Design**: Works on mobile and desktop
- **Accessibility**: Full ARIA support and keyboard navigation
- **Performance Optimized**: Memoized callbacks and computed values
- **Error Handling**: Graceful fallbacks for missing data
- **Analytics Integration**: Optional event tracking
- **Web Share API**: Native sharing when available
- **Compact Mode**: Smaller layout for constrained spaces

## Props Interface

```typescript
interface UserProfileHeaderProps {
  user: UserType;                    // Required: User data
  isOwnProfile?: boolean;           // Default: false
  reputationScore?: number;         // Default: 0
  mutualFollows?: {                 // Default: { count: 0, names: [] }
    count: number;
    names: string[];
  };
  onEditProfile?: () => void;       // Callback for edit action
  onShareProfile?: () => void;      // Callback for share action
  className?: string;               // Additional CSS classes
  showActions?: boolean;            // Default: true
  compact?: boolean;                // Default: false
  enableAnalytics?: boolean;        // Default: true
}
```

## Usage Examples

### Basic Usage

```tsx
import { UserProfileHeader } from '../components/features/UserProfileHeader';

// Simple profile display
<UserProfileHeader user={user} />
```

### Own Profile with Edit

```tsx
<UserProfileHeader 
  user={currentUser}
  isOwnProfile={true}
  onEditProfile={() => setEditModalOpen(true)}
  reputationScore={userStats.reputation}
/>
```

### Other Profile with Share

```tsx
<UserProfileHeader 
  user={otherUser}
  isOwnProfile={false}
  mutualFollows={mutualData}
  onShareProfile={() => showToast('Profile shared!')}
  reputationScore={otherUser.reputationScore}
/>
```

### Compact Mode

```tsx
<UserProfileHeader 
  user={user}
  compact={true}
  showActions={false}
  className="mb-4"
/>
```

## User Type Requirements

The component expects a `User` object with the following structure:

```typescript
interface User {
  uid: string;
  id: string;
  email?: string;
  displayName?: string;
  profilePicture?: string;
  photoURL?: string;
  bio?: string;
  location?: string;
  website?: string;
  skills?: any;
  reputationScore?: number;
  interests?: string;
  role?: UserRole;
  createdAt?: any;
  updatedAt?: any;
  // Profile customization fields
  handle?: string;           // Public handle (e.g., @username)
  verified?: boolean;        // Account verification status
  handlePrivate?: boolean;   // Privacy setting for handle visibility
  tagline?: string;          // One-line user description
  banner?: BannerData | string | null;
  bannerFx?: {
    enable: boolean;
    preset: 'ribbons' | 'aurora' | 'metaballs' | 'audio';
    opacity: number;
    blendMode: 'screen' | 'soft-light' | 'overlay' | 'plus-lighter';
  };
}
```

## Styling and Theming

### CSS Classes

The component uses Tailwind CSS classes and supports custom styling:

```tsx
<UserProfileHeader 
  user={user}
  className="custom-profile-header border-2 border-blue-500"
/>
```

### Responsive Breakpoints

- **Mobile**: Compact layout with smaller images and text
- **Tablet**: Standard layout with medium sizing
- **Desktop**: Full layout with large images and text

### Dark Mode Support

The component automatically adapts to dark mode using CSS variables:

```css
/* Light mode */
.text-card-foreground { color: hsl(var(--foreground)); }
.bg-card { background-color: hsl(var(--card)); }

/* Dark mode */
.dark .text-card-foreground { color: hsl(var(--foreground)); }
.dark .bg-card { background-color: hsl(var(--card)); }
```

## Accessibility Features

### ARIA Labels and Roles

- **Profile Image**: Proper alt text and role
- **Action Buttons**: Descriptive labels
- **Bio Toggle**: `aria-expanded` and `aria-controls`
- **Verification Badge**: `aria-label` and `title` attributes
- **Tooltips**: Accessible tooltip content

### Keyboard Navigation

- **Tab Order**: Logical tab sequence
- **Focus Management**: Visible focus indicators
- **Keyboard Actions**: Enter/Space for interactive elements

### Screen Reader Support

- **Semantic HTML**: Proper heading hierarchy
- **Descriptive Text**: Clear context for all elements
- **Status Updates**: Announcements for dynamic content

## Performance Optimizations

### Memoization

```typescript
// Memoized profile link data
const profileLinkData = useMemo(() => {
  const hasHandle = Boolean(user.handle && (!user.handlePrivate || isOwnProfile));
  const path = hasHandle ? `/u/${user.handle}` : `/profile/${user.uid}`;
  const url = `${window.location.origin}${path}`;
  return { path, url, hasHandle };
}, [user.handle, user.handlePrivate, user.uid, isOwnProfile]);

// Memoized callbacks
const handleCopyProfileLink = useCallback(async () => {
  // Implementation
}, [profileLinkData, isSharing, showToast, enableAnalytics, user.uid, onShareProfile]);
```

### Lazy Loading

- **Profile Images**: Lazy loaded with proper fallbacks
- **Conditional Rendering**: Only render when needed
- **Code Splitting**: Component is tree-shakeable

## Error Handling

### Graceful Degradation

```typescript
// Clipboard API fallback
try {
  await navigator.clipboard.writeText(profileLinkData.url);
  showToast('Profile link copied to clipboard', 'success');
} catch (error) {
  console.error('Failed to copy profile link:', error);
  showToast('Failed to copy profile link', 'error');
}

// Web Share API fallback
if (!navigator.share) {
  return handleCopyProfileLink();
}
```

### Data Validation

- **Required Fields**: Graceful handling of missing data
- **Type Safety**: Full TypeScript support
- **Fallback Values**: Sensible defaults for all optional fields

## Analytics Integration

### Event Tracking

```typescript
// Profile share events
await logEvent('profile_share', {
  userId: user.uid,
  hasHandle: profileLinkData.hasHandle,
  method: 'clipboard',
  context: 'header'
});

// Profile edit events
logEvent('profile_edit_clicked', {
  userId: user.uid,
  context: 'header'
});
```

### Privacy Considerations

- **Opt-in Analytics**: `enableAnalytics` prop controls tracking
- **No PII**: Only user IDs and interaction data
- **GDPR Compliant**: Respects user privacy preferences

## Testing

### Unit Tests

Comprehensive test suite covering:

- **Rendering**: All props and states
- **Interactions**: Button clicks and form submissions
- **Accessibility**: ARIA attributes and keyboard navigation
- **Error Handling**: Edge cases and failures
- **Performance**: Memoization and re-renders

### Test Coverage

```bash
# Run tests
npm test UserProfileHeader

# Coverage report
npm run test:coverage
```

## Integration Examples

### With ProfilePage

```tsx
// In ProfilePage.tsx
<UserProfileHeader 
  user={userProfile}
  isOwnProfile={isOwnProfile}
  reputationScore={repScore}
  mutualFollows={mutualFollows}
  onEditProfile={() => setIsEditOpen(true)}
  onShareProfile={() => showToast('Profile shared!')}
/>
```

### With UserCard

```tsx
// In UserCard.tsx
<UserProfileHeader 
  user={user}
  compact={true}
  showActions={false}
  className="mb-2"
/>
```

### With Modal

```tsx
// In ProfileModal.tsx
<UserProfileHeader 
  user={selectedUser}
  isOwnProfile={false}
  onShareProfile={() => closeModal()}
  className="border-b pb-4"
/>
```

## Migration Guide

### From ProfilePage Header

1. **Extract Header Logic**: Move profile header JSX to UserProfileHeader
2. **Update Props**: Pass required props from ProfilePage
3. **Handle Callbacks**: Implement onEditProfile and onShareProfile
4. **Test Integration**: Verify all functionality works

### From ProfileCard

1. **Replace Header**: Use UserProfileHeader with compact mode
2. **Update Styling**: Adjust CSS classes as needed
3. **Maintain Functionality**: Ensure all features still work

## Troubleshooting

### Common Issues

1. **Missing User Fields**: Ensure User type includes all required fields
2. **Styling Conflicts**: Check for CSS class conflicts
3. **Analytics Errors**: Verify analytics service is properly configured
4. **Accessibility Issues**: Test with screen readers and keyboard navigation

### Debug Mode

```tsx
<UserProfileHeader 
  user={user}
  enableAnalytics={false} // Disable analytics for debugging
  className="debug-profile-header" // Add debug styling
/>
```

## Future Enhancements

### Planned Features

- **Profile Banner Integration**: Support for banner display
- **Social Stats**: Follower/following counts
- **Activity Indicators**: Online status and last seen
- **Custom Themes**: User-selectable color schemes
- **Animation Options**: Configurable transitions and effects

### API Improvements

- **Lazy Loading**: Load user data on demand
- **Caching**: Implement user data caching
- **Real-time Updates**: Live updates for user changes
- **Offline Support**: Graceful offline behavior

## Support

For issues, questions, or contributions:

1. **Check Documentation**: Review this guide and component comments
2. **Run Tests**: Ensure all tests pass
3. **Check Issues**: Look for similar problems in the issue tracker
4. **Create Issue**: Provide detailed reproduction steps

## Changelog

### v1.0.0 (January 2025)
- ✅ Initial implementation
- ✅ Full TypeScript support
- ✅ Accessibility compliance
- ✅ Performance optimizations
- ✅ Comprehensive testing
- ✅ Documentation complete
