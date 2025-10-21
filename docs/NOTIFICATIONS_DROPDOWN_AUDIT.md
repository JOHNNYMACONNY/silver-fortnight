## Notifications Dropdown Audit and Fixes

Status: Complete

Date: 2025-08-11

### Issues Identified
- Missing glassmorphic backdrop blur and glass surface styling compared to other navbar menus.
- Inconsistent content organization and lack of a scroll container for longer lists.
- Bug: single-item click was calling the bulk "mark all" API with a notification ID.

### Changes Implemented
- Applied glassmorphic styles to dropdown surfaces to match `UserMenu`:
  - `bg-navbar-glass dark:bg-navbar-glass-dark backdrop-blur-md navbar-gradient-border shadow-glass-lg`
- Structured content for readability:
  - Added header with optional "Mark all" action when there are unread items.
  - Wrapped list in `max-h-96 overflow-y-auto`.
  - Kept footer action to view all notifications.
- Fixed mark-as-read behavior:
  - Use `markNotificationAsRead(notificationId)` for individual items.
  - Keep `markAllNotificationsAsRead(currentUser.uid)` for the header action.

### Files Updated
- `src/components/features/notifications/NotificationBell.tsx`
- `src/components/features/notifications/NotificationDropdown.tsx`

### References
- See `src/components/ui/UserMenu.tsx` for canonical glassmorphic menu surface classes.
- Glassmorphic design guides: `docs/GLASSMORPHIC_IMPLEMENTATION_SUMMARY.md`, `docs/GLASSMORPHIC_DESIGN_ENHANCEMENTS.md`.


