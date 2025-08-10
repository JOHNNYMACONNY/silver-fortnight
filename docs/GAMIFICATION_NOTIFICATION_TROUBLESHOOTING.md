# Gamification Notification System - Troubleshooting Guide

**Version:** 2.0 (Phase 2A)  
**Last Updated:** December 19, 2024  
**Support Level:** Production System  

## Overview

This guide provides comprehensive troubleshooting steps for the TradeYa gamification notification system. Use this guide to diagnose and resolve common issues with real-time notifications, user preferences, and system integration.

## Quick Diagnostic Checklist

### ✅ System Health Check

Run these checks first to identify the scope of the issue:

1. **Provider Chain Verification**
   ```typescript
   // Check if GamificationNotificationProvider is properly set up
   console.log('Notification Context:', useGamificationNotifications());
   ```

2. **Callback System Status**
   ```typescript
   // Verify notification callback is registered
   import { setGamificationNotificationCallback } from '../services/gamification';
   setGamificationNotificationCallback((notification) => {
     console.log('Notification received:', notification);
   });
   ```

3. **User Preferences Check**
   ```typescript
   // Check user notification preferences
   const { preferences } = useGamificationNotifications();
   console.log('User preferences:', preferences);
   ```

4. **Component Rendering Verification**
   ```typescript
   // Verify NotificationContainer is rendered
   document.querySelector('[data-testid="notification-container"]');
   ```

## Common Issues and Solutions

### Issue 1: Notifications Not Appearing

**Symptoms:**
- XP gains don't show toast notifications
- Level-ups don't trigger celebration modals
- Achievement unlocks are silent

**Diagnostic Steps:**

1. **Check Provider Setup**
   ```typescript
   // Verify App.tsx has correct provider chain
   <GamificationNotificationProvider>
     <NotificationContainer />
     <GamificationIntegration />
   </GamificationNotificationProvider>
   ```

2. **Verify Callback Registration**
   ```typescript
   // Check if useGamificationIntegration hook is working
   const { addNotification } = useGamificationNotifications();
   console.log('Add notification function:', addNotification);
   ```

3. **Test Manual Notification**
   ```typescript
   // Manually trigger a notification to test the system
   addNotification({
     type: 'xp_gain',
     amount: 100,
     source: 'test',
     description: 'Test notification',
     timestamp: new Date(),
     userId: 'current-user-id'
   });
   ```

**Solutions:**

- **Missing Provider:** Add GamificationNotificationProvider to App.tsx
- **Callback Not Set:** Ensure GamificationIntegration component is rendered
- **User ID Mismatch:** Verify notification userId matches current user
- **Preferences Disabled:** Check if user has disabled notification types

### Issue 2: Animations Not Working

**Symptoms:**
- Notifications appear without animations
- Modals don't have smooth transitions
- Progress bars don't animate

**Diagnostic Steps:**

1. **Check Framer Motion Installation**
   ```bash
   npm list framer-motion
   ```

2. **Verify Reduced Motion Settings**
   ```typescript
   // Check system and user preferences
   const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
   console.log('System reduced motion:', mediaQuery.matches);
   
   const { isReducedMotion } = useGamificationNotifications();
   console.log('Effective reduced motion:', isReducedMotion);
   ```

3. **Test Animation Components**
   ```typescript
   // Test individual animation components
   <XPGainToast 
     notification={testNotification} 
     onClose={() => {}} 
     isReducedMotion={false} 
   />
   ```

**Solutions:**

- **Missing Framer Motion:** Install with `npm install framer-motion`
- **Reduced Motion Enabled:** Check user preferences or system settings
- **CSS Conflicts:** Verify no CSS is overriding animation properties
- **Performance Issues:** Check browser dev tools for performance bottlenecks

### Issue 3: Preferences Not Persisting

**Symptoms:**
- Notification settings reset on page reload
- User preferences don't save
- Settings revert to defaults

**Diagnostic Steps:**

1. **Check localStorage Access**
   ```typescript
   // Verify localStorage is available and writable
   try {
     localStorage.setItem('test', 'value');
     localStorage.removeItem('test');
     console.log('localStorage available');
   } catch (error) {
     console.error('localStorage not available:', error);
   }
   ```

2. **Verify Preference Keys**
   ```typescript
   // Check if preferences are being saved
   const userId = 'current-user-id';
   const key = `gamification-preferences-${userId}`;
   console.log('Stored preferences:', localStorage.getItem(key));
   ```

3. **Test Preference Updates**
   ```typescript
   // Manually test preference updates
   const { updatePreferences } = useGamificationNotifications();
   updatePreferences({ xpGainToasts: false });
   ```

**Solutions:**

- **localStorage Disabled:** Check browser settings or incognito mode
- **User ID Missing:** Ensure user is properly authenticated
- **Storage Quota Exceeded:** Clear localStorage or increase quota
- **Context Not Available:** Verify component is within provider scope

### Issue 4: Performance Issues

**Symptoms:**
- Slow animation performance
- High memory usage
- Browser lag during notifications

**Diagnostic Steps:**

1. **Check Animation Performance**
   ```typescript
   // Monitor frame rate during animations
   let frameCount = 0;
   const startTime = performance.now();
   
   function countFrames() {
     frameCount++;
     requestAnimationFrame(countFrames);
   }
   countFrames();
   
   setTimeout(() => {
     const fps = frameCount / ((performance.now() - startTime) / 1000);
     console.log('Average FPS:', fps);
   }, 5000);
   ```

2. **Monitor Memory Usage**
   ```typescript
   // Check for memory leaks
   console.log('Memory usage:', performance.memory);
   ```

3. **Profile Component Rendering**
   ```typescript
   // Use React DevTools Profiler to identify re-render issues
   // Look for unnecessary re-renders in notification components
   ```

**Solutions:**

- **Too Many Notifications:** Implement notification queue limits
- **Memory Leaks:** Ensure proper cleanup in useEffect hooks
- **Heavy Animations:** Reduce animation complexity or use CSS animations
- **Excessive Re-renders:** Optimize component dependencies and memoization

### Issue 5: Integration Failures

**Symptoms:**
- XP awards don't trigger notifications
- Gamification service errors
- Notifications for wrong users

**Diagnostic Steps:**

1. **Check Service Integration**
   ```typescript
   // Verify gamification service is calling notification triggers
   import { awardXP } from '../services/gamification';
   
   // Test XP award with logging
   await awardXP('user-id', 100, 'test', 'test-id', 'Test award');
   ```

2. **Verify Callback Function**
   ```typescript
   // Check if notification callback is properly set
   import { setGamificationNotificationCallback } from '../services/gamification';
   
   setGamificationNotificationCallback((notification) => {
     console.log('Service triggered notification:', notification);
   });
   ```

3. **Test User Context**
   ```typescript
   // Verify current user context
   const { currentUser } = useAuth();
   console.log('Current user:', currentUser?.uid);
   ```

**Solutions:**

- **Service Not Integrated:** Ensure gamification service calls notification triggers
- **Callback Not Set:** Verify GamificationIntegration component is rendered
- **User Context Missing:** Check authentication state
- **Error Handling:** Review error logs for service failures

## Advanced Debugging

### Debug Mode Activation

Enable debug mode for detailed logging:

```typescript
// Add to localStorage to enable debug logging
localStorage.setItem('gamification-debug', 'true');

// Or set environment variable
process.env.REACT_APP_GAMIFICATION_DEBUG = 'true';
```

### Console Commands for Testing

Use these console commands for manual testing:

```typescript
// Test notification system
window.testGamificationNotifications = {
  // Test XP gain notification
  testXPGain: () => {
    const { addNotification } = useGamificationNotifications();
    addNotification({
      type: 'xp_gain',
      amount: 100,
      source: 'test',
      description: 'Test XP gain',
      timestamp: new Date(),
      userId: 'current-user-id'
    });
  },
  
  // Test level up notification
  testLevelUp: () => {
    const { addNotification } = useGamificationNotifications();
    addNotification({
      type: 'level_up',
      newLevel: 3,
      previousLevel: 2,
      levelTitle: 'Test Level',
      timestamp: new Date(),
      userId: 'current-user-id'
    });
  },
  
  // Test achievement notification
  testAchievement: () => {
    const { addNotification } = useGamificationNotifications();
    addNotification({
      type: 'achievement_unlock',
      achievementId: 'test',
      achievementTitle: 'Test Achievement',
      achievementDescription: 'Test description',
      achievementIcon: '🏆',
      xpReward: 50,
      rarity: 'common',
      timestamp: new Date(),
      userId: 'current-user-id'
    });
  },
  
  // Clear all notifications
  clearAll: () => {
    const { clearAllNotifications } = useGamificationNotifications();
    clearAllNotifications();
  },
  
  // Check preferences
  checkPreferences: () => {
    const { preferences } = useGamificationNotifications();
    console.log('Current preferences:', preferences);
  }
};
```

### Performance Monitoring

Monitor system performance with these tools:

```typescript
// Performance monitoring utility
const performanceMonitor = {
  startTime: performance.now(),
  
  logPerformance: (label) => {
    const currentTime = performance.now();
    console.log(`${label}: ${currentTime - performanceMonitor.startTime}ms`);
    performanceMonitor.startTime = currentTime;
  },
  
  monitorNotificationPerformance: () => {
    const { notifications } = useGamificationNotifications();
    console.log('Active notifications:', notifications.length);
    console.log('Memory usage:', performance.memory);
  }
};
```

## Error Codes and Messages

### Common Error Codes

- **GN001:** Notification context not available
- **GN002:** Invalid notification type
- **GN003:** User ID mismatch
- **GN004:** Preferences save failed
- **GN005:** Animation system error
- **GN006:** Service integration failure

### Error Message Lookup

```typescript
const errorMessages = {
  GN001: 'Notification context not available. Ensure GamificationNotificationProvider is set up.',
  GN002: 'Invalid notification type. Check notification type definition.',
  GN003: 'User ID mismatch. Notification userId does not match current user.',
  GN004: 'Preferences save failed. Check localStorage availability.',
  GN005: 'Animation system error. Check Framer Motion installation.',
  GN006: 'Service integration failure. Check gamification service integration.'
};
```

## Emergency Procedures

### Disable Notification System

If notifications are causing critical issues:

```typescript
// Emergency disable via localStorage
localStorage.setItem('gamification-notifications-disabled', 'true');

// Or via environment variable
process.env.REACT_APP_NOTIFICATIONS_DISABLED = 'true';
```

### Rollback to Previous Version

```bash
# Revert notification system files
git checkout HEAD~1 -- src/components/gamification/notifications/
git checkout HEAD~1 -- src/contexts/GamificationNotificationContext.tsx
git checkout HEAD~1 -- src/types/gamificationNotifications.ts

# Remove notification integration
git checkout HEAD~1 -- src/services/gamification.ts
git checkout HEAD~1 -- src/App.tsx
```

### Reset User Preferences

```typescript
// Clear all user preferences
const userId = 'current-user-id';
localStorage.removeItem(`gamification-preferences-${userId}`);

// Or reset to defaults
const { updatePreferences } = useGamificationNotifications();
updatePreferences({
  xpGainToasts: true,
  levelUpModals: true,
  achievementUnlockModals: true,
  soundEffects: false,
  reducedMotion: false,
  batchNotifications: true,
  notificationDuration: 3000
});
```

## Support Contacts

### Development Team
- **Frontend Lead:** Notification system architecture
- **Backend Lead:** Service integration issues
- **QA Lead:** Testing and validation support

### Emergency Contacts
- **DevOps Team:** Production deployment issues
- **Support Team:** User-reported problems
- **Product Team:** Feature behavior questions

---

**Remember:** Always test fixes in development environment before applying to production. Document any new issues discovered and update this troubleshooting guide accordingly.
