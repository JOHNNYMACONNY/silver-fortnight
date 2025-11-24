# Portfolio Page Backend Integration Plan

## Overview
This plan outlines the backend integration required to make the Portfolio page quick actions (Edit, Share, Delete) fully functional. The plan builds on existing backend services and adds missing functionality.

## Current State Analysis

### ✅ Already Implemented
- `deletePortfolioItem` - Delete portfolio items
- `updatePortfolioItemVisibility` - Toggle visibility
- `updatePortfolioItemFeatured` - Toggle featured status
- `updatePortfolioItemPinned` - Toggle pinned status
- `updatePortfolioItemCategory` - Update category
- `getUserPortfolioItems` - Fetch portfolio items

### ❌ Missing Functionality
- General `updatePortfolioItem` function for editing title, description, skills
- Share functionality (copy link, generate shareable URL)
- Toast/notification system for user feedback
- Confirmation dialogs for destructive actions

## Implementation Plan

### Phase 1: Add General Update Function

**File:** `src/services/portfolio.ts`

**New Function:**
```typescript
/**
 * Update portfolio item general fields (title, description, skills)
 * Note: Cannot update sourceId, sourceType, or userId (immutable fields)
 */
export async function updatePortfolioItem(
  userId: string,
  portfolioItemId: string,
  updates: {
    title?: string;
    description?: string;
    skills?: string[];
    role?: string;
    customOrder?: number;
  }
): Promise<{ success: boolean; error: string | null }> {
  // Implementation
}
```

**Requirements:**
- Validate that userId matches current user
- Prevent updating immutable fields (sourceId, sourceType, userId)
- Validate title and description are not empty
- Validate skills array format
- Return success/error response

**Firestore Rules:**
- Already covered by existing rules (users can update their own portfolio items)
- Ensure sourceId and sourceType cannot be changed

---

### Phase 2: Add Share Functionality

**File:** `src/services/portfolio.ts`

**New Function:**
```typescript
/**
 * Generate a shareable link for a portfolio item
 * Returns a URL that can be shared publicly (if item is visible)
 */
export function getPortfolioItemShareLink(
  userId: string,
  portfolioItemId: string,
  baseUrl?: string
): string {
  // Implementation
}

/**
 * Copy portfolio item share link to clipboard
 */
export async function copyPortfolioItemLink(
  userId: string,
  portfolioItemId: string
): Promise<{ success: boolean; error: string | null }> {
  // Implementation
}
```

**Requirements:**
- Generate URL format: `/users/${userId}/portfolio/${portfolioItemId}`
- Use current window location for base URL if not provided
- Check if item is visible before sharing (optional validation)
- Use Clipboard API with fallback
- Return success/error response

**Considerations:**
- May need a public portfolio view page (future enhancement)
- For now, share link can point to user profile with portfolio tab
- Could also generate a direct link if portfolio items have public routes

---

### Phase 3: Integrate Quick Actions in PortfolioPage

**File:** `src/pages/PortfolioPage.tsx`

**Changes Required:**

1. **Import new functions:**
```typescript
import {
  deletePortfolioItem,
  updatePortfolioItem,
  copyPortfolioItemLink,
  getPortfolioItemShareLink
} from '../services/portfolio';
```

2. **Update handleQuickAction function:**
```typescript
const handleQuickAction = async (
  action: 'edit' | 'share' | 'delete',
  itemId: string
) => {
  setShowQuickActions(null);
  
  switch (action) {
    case 'edit':
      // Navigate to edit page or open edit modal
      navigate(`/portfolio/${itemId}/edit`);
      break;
      
    case 'share':
      try {
        const result = await copyPortfolioItemLink(currentUser.uid, itemId);
        if (result.success) {
          // Show toast notification
          showToast('Link copied to clipboard!', 'success');
        } else {
          showToast('Failed to copy link', 'error');
        }
      } catch (error) {
        showToast('Failed to copy link', 'error');
      }
      break;
      
    case 'delete':
      // Show confirmation dialog
      const confirmed = window.confirm(
        'Are you sure you want to delete this portfolio item? This action cannot be undone.'
      );
      if (!confirmed) return;
      
      try {
        const result = await deletePortfolioItem(currentUser.uid, itemId);
        if (result.success) {
          // Refresh portfolio items
          const items = await getUserPortfolioItems(currentUser.uid);
          setPortfolioItems(items);
          showToast('Portfolio item deleted', 'success');
        } else {
          showToast(result.error || 'Failed to delete item', 'error');
        }
      } catch (error) {
        showToast('Failed to delete item', 'error');
      }
      break;
  }
};
```

3. **Add toast notification system:**
   - Check if Toast component exists
   - If not, use simple alert or implement basic toast
   - Or use existing notification system

---

### Phase 4: Create Edit Modal/Page (Optional Enhancement)

**Option A: Inline Edit Modal**
- Create `PortfolioItemEditModal.tsx` component
- Opens when "Edit" is clicked
- Allows editing title, description, skills
- Saves changes using `updatePortfolioItem`

**Option B: Dedicated Edit Page**
- Create `/portfolio/:id/edit` route
- Full-page edit form
- More space for editing

**Recommendation:** Start with Option A (modal) for better UX

---

### Phase 5: Add Loading States and Error Handling

**Updates to PortfolioPage.tsx:**

1. **Add loading state for quick actions:**
```typescript
const [actionLoading, setActionLoading] = useState<string | null>(null);
```

2. **Update handleQuickAction with loading:**
```typescript
const handleQuickAction = async (action, itemId) => {
  setActionLoading(itemId);
  try {
    // ... action logic
  } finally {
    setActionLoading(null);
  }
};
```

3. **Disable buttons during loading:**
```typescript
disabled={actionLoading === item.id}
```

4. **Add error boundaries:**
   - Wrap portfolio operations in try-catch
   - Display user-friendly error messages
   - Log errors for debugging

---

### Phase 6: Refresh Portfolio After Actions

**Update PortfolioPage.tsx:**

After successful delete/update operations:
```typescript
// Refresh portfolio items
const refreshPortfolio = async () => {
  if (!currentUser?.uid) return;
  try {
    const items = await getUserPortfolioItems(currentUser.uid);
    setPortfolioItems(items);
  } catch (error) {
    setError('Failed to refresh portfolio');
  }
};

// Call refreshPortfolio after successful operations
```

---

## Implementation Checklist

### Backend Services (`src/services/portfolio.ts`)
- [ ] Add `updatePortfolioItem` function
- [ ] Add `getPortfolioItemShareLink` function
- [ ] Add `copyPortfolioItemLink` function
- [ ] Add input validation
- [ ] Add error handling
- [ ] Add JSDoc comments

### Frontend Integration (`src/pages/PortfolioPage.tsx`)
- [ ] Import new backend functions
- [ ] Update `handleQuickAction` to use real functions
- [ ] Add loading states for actions
- [ ] Add error handling and user feedback
- [ ] Add refresh logic after operations
- [ ] Test all three actions (edit, share, delete)

### UI/UX Enhancements
- [ ] Add toast notifications (or use existing system)
- [ ] Add confirmation dialog for delete (or use existing Modal)
- [ ] Add loading indicators on action buttons
- [ ] Add success/error feedback
- [ ] Test accessibility (keyboard navigation, screen readers)

### Optional: Edit Modal/Page
- [ ] Create edit modal component (if using modal approach)
- [ ] Create edit page route (if using page approach)
- [ ] Add form validation
- [ ] Add save/cancel functionality
- [ ] Test edit workflow

---

## Testing Plan

### Unit Tests
- [ ] Test `updatePortfolioItem` with valid data
- [ ] Test `updatePortfolioItem` with invalid data
- [ ] Test `updatePortfolioItem` prevents immutable field updates
- [ ] Test `getPortfolioItemShareLink` generates correct URL
- [ ] Test `copyPortfolioItemLink` handles clipboard API
- [ ] Test `deletePortfolioItem` (already exists, verify it works)

### Integration Tests
- [ ] Test edit action opens edit modal/page
- [ ] Test share action copies link to clipboard
- [ ] Test delete action shows confirmation and deletes item
- [ ] Test portfolio refreshes after delete
- [ ] Test error handling for network failures
- [ ] Test loading states during operations

### Manual Testing
- [ ] Test on empty portfolio
- [ ] Test on portfolio with multiple items
- [ ] Test quick actions menu opens/closes correctly
- [ ] Test click outside closes menu
- [ ] Test keyboard navigation
- [ ] Test on mobile/tablet viewports
- [ ] Test in dark mode

---

## Security Considerations

1. **Authorization:**
   - Ensure users can only edit/delete their own portfolio items
   - Firestore rules already enforce this, but verify in code

2. **Input Validation:**
   - Validate title/description length
   - Sanitize user input
   - Validate skills array format

3. **Share Links:**
   - Only share visible portfolio items
   - Consider adding share token for private items (future enhancement)

---

## Future Enhancements

1. **Bulk Operations:**
   - Select multiple items
   - Bulk delete/update visibility

2. **Advanced Sharing:**
   - Social media sharing buttons
   - Generate shareable images
   - QR codes for portfolio items

3. **Edit Enhancements:**
   - Rich text editor for descriptions
   - Image upload for evidence
   - Drag-and-drop skill tags

4. **Analytics:**
   - Track share clicks
   - Track edit frequency
   - Track most viewed items

---

## Dependencies

- Existing: `firebase/firestore` functions
- Existing: `getSyncFirebaseDb` from `firebase-config`
- May need: Toast component (check if exists)
- May need: Modal component (check if exists)
- May need: Confirmation dialog component

---

## Estimated Time

- Phase 1 (Update Function): 1-2 hours
- Phase 2 (Share Functionality): 1 hour
- Phase 3 (Quick Actions Integration): 2-3 hours
- Phase 4 (Edit Modal - Optional): 3-4 hours
- Phase 5 (Loading/Error States): 1-2 hours
- Phase 6 (Refresh Logic): 30 minutes

**Total:** 8-12 hours (without edit modal), 11-16 hours (with edit modal)

---

## Notes

- All existing backend functions follow the pattern: `{ success: boolean; error: string | null }`
- Firestore rules already handle authorization
- Consider using React Query or SWR for better data management (future enhancement)
- Share functionality can be simple (copy link) or advanced (social sharing) - start simple

