# TradeYa Portfolio System

This document outlines the plan for implementing a portfolio system that automatically stores and displays completed trades and collaborations on user profiles. This feature will be implemented in the future and is designed to integrate seamlessly with existing and planned features.

## Table of Contents

1. [System Overview](#system-overview)
2. [Data Structure](#data-structure)
3. [Core Functionality](#core-functionality)
4. [User Interface Design](#user-interface-design)
5. [Integration Points](#integration-points)
6. [Implementation Strategy](#implementation-strategy)
7. [Technical Considerations](#technical-considerations)
8. [Compatibility Guidelines](#compatibility-guidelines)

## System Overview

### Purpose

The portfolio system will:
- Automatically store completed trades and collaborations in user portfolios
- Allow users to showcase their work and skills
- Provide visibility controls while preserving completed work integrity
- Create a professional display of user accomplishments
- Enhance user profiles with verified completed work

### Key Features

- **Automatic Generation**: Portfolio items created when trades/collaborations complete
- **Visibility Controls**: Users can show/hide items without altering original data
- **Organization Options**: Categorization, pinning, and featuring capabilities
- **Evidence Display**: Showcase embedded evidence from completed work
- **Collaborator Recognition**: Display and link to other participants
- **Read-Only Content**: Preserve the integrity of completed work information

## Data Structure

### Portfolio Item Interface

```typescript
export interface PortfolioItem {
  id: string;
  userId: string;
  sourceId: string;  // ID of original trade or collaboration
  sourceType: 'trade' | 'collaboration';
  title: string;
  description: string;
  skills: string[];  // Skills demonstrated
  role?: string;  // For collaborations
  completedAt: any;  // Timestamp
  visible: boolean;  // Visibility toggle
  featured: boolean;  // Featured in profile
  pinned: boolean;  // Pinned to top
  category?: string;  // User-defined category
  customOrder?: number;  // For manual reordering
  evidence?: EmbeddedEvidence[];  // Evidence from the original source
  collaborators?: {  // Other users involved
    id: string;
    name: string;
    photoURL?: string;
    role?: string;
  }[];
}
```

### User Profile Extensions

```typescript
// Add to existing User interface
export interface User {
  // Existing fields remain unchanged
  
  // New portfolio settings
  portfolioSettings?: {
    defaultVisibility: boolean;
    defaultCategory?: string;
    categoriesOrder?: string[];
    displayMode?: 'grid' | 'list';
  };
}
```

### Firestore Structure

- Portfolio items stored in subcollection: `/users/{userId}/portfolio/{portfolioItemId}`
- Portfolio settings stored in user document
- No modifications to existing trade or collaboration documents required

## Core Functionality

### Firestore Integration Status (Updated)

- Firestore-backed portfolio item retrieval service is implemented (`getUserPortfolioItems`) with filtering by visibility, type, featured, and category.
- Portfolio management services implemented: `updatePortfolioItemVisibility`, `updatePortfolioItemFeatured`, `updatePortfolioItemPinned`, `deletePortfolioItem`.
- Collaboration role completion now triggers generation via `generateCollaborationPortfolioItem` with aligned types (`assignedUserId`, `completionEvidence`).
- Trade completion generation is available via `generateTradePortfolioItem` and should be called from the trade completion workflow.
- UI integration and full automation wiring are the next steps.

### Automatic Portfolio Generation

When a trade or collaboration is completed:
1. System creates portfolio items for all participants
2. Items inherit details from the original source
3. Evidence is referenced (not duplicated)
4. Default visibility is applied based on user settings

```typescript
/**
 * Generate portfolio item from completed trade
 * To be called when a trade is confirmed as completed
 */
export const generateTradePortfolioItem = async (
  tradeId: string,
  userId: string
): Promise<{ success: boolean; error: string | null }> => {
  try {
    // Implementation details...
    
    // Create portfolio item
    const portfolioItem: PortfolioItem = {
      id: uuidv4(),
      userId,
      sourceId: tradeId,
      sourceType: 'trade',
      title: trade.title,
      description: trade.description,
      skills: isCreator ? trade.offeredSkills : trade.requestedSkills,
      completedAt: trade.completionConfirmedAt || trade.updatedAt,
      visible: defaultVisibility,
      featured: false,
      pinned: false,
      evidence: trade.completionEvidence || [],
      collaborators: [/* other participant */]
    };
    
    // Add to portfolio collection
    const portfolioRef = collection(db, COLLECTIONS.USERS, userId, 'portfolio');
    await addDoc(portfolioRef, portfolioItem);
    
    return { success: true, error: null };
  } catch (err) {
    // Error handling...
  }
};
```

### Portfolio Management

Users can manage their portfolio through:
- Visibility toggles for individual items
- Pinning important items to the top
- Featuring best work
- Organizing items into categories
- Setting default visibility for new items

```typescript
/**
 * Update portfolio item visibility
 */
export const updatePortfolioItemVisibility = async (
  userId: string,
  portfolioItemId: string,
  visible: boolean
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const itemRef = doc(db, COLLECTIONS.USERS, userId, 'portfolio', portfolioItemId);
    await updateDoc(itemRef, { visible });
    return { success: true, error: null };
  } catch (err) {
    // Error handling...
  }
};

// Similar functions for other portfolio management operations
```

### Portfolio Retrieval

```typescript
/**
 * Get user's portfolio items (Firestore-backed)
 * For viewing own portfolio or another user's portfolio
 * Supports filtering by visibility, type, featured, and category.
 */
export async function getUserPortfolioItems(
  userId: string,
  options?: {
    onlyVisible?: boolean;
    type?: 'trade' | 'collaboration';
    featured?: boolean;
    category?: string;
  }
): Promise<PortfolioItem[]> {
  try {
    const portfolioRef = collection(db, 'users', userId, 'portfolio');
    let q: any = query(portfolioRef);

    if (options?.onlyVisible) {
      q = query(q, where('visible', '==', true));
    }
    if (options?.type) {
      q = query(q, where('sourceType', '==', options.type));
    }
    if (options?.featured) {
      q = query(q, where('featured', '==', true));
    }
    if (options?.category) {
      q = query(q, where('category', '==', options.category));
    }

    q = query(q, orderBy('pinned', 'desc'), orderBy('completedAt', 'desc'));

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return { id: doc.id, ...(data && typeof data === 'object' ? data : {}) } as PortfolioItem;
    });
  } catch (err) {
    // Optionally log error
    return [];
  }
}
```

## User Interface Design

### Portfolio Tab on Profile

The portfolio will be displayed as a tab on the user profile page:

```jsx
// In ProfilePage.tsx
const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState('about');
  // ...
  
  return (
    <div>
      {/* Profile header */}
      
      {/* Tabs */}
      <div className="profile-tabs">
        <button 
          className={activeTab === 'about' ? 'active' : ''} 
          onClick={() => setActiveTab('about')}
        >
          About
        </button>
        <button 
          className={activeTab === 'portfolio' ? 'active' : ''} 
          onClick={() => setActiveTab('portfolio')}
        >
          Portfolio
        </button>
        {/* Other tabs */}
      </div>
      
      {/* Tab content */}
      <div className="tab-content">
        {activeTab === 'about' && <AboutTab user={user} />}
        {activeTab === 'portfolio' && <PortfolioTab userId={userId} isOwnProfile={isOwnProfile} />}
        {/* Other tab contents */}
      </div>
    </div>
  );
};
```

### Portfolio Tab Component

```tsx
// src/components/features/portfolio/PortfolioTab.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { getUserPortfolioItems } from '../../../services/portfolio';
import { PortfolioItem } from '../../../types/portfolio';
import PortfolioItemComponent from './PortfolioItem';

interface PortfolioTabProps {
  userId: string;
  isOwnProfile: boolean;
}

export const PortfolioTab: React.FC<PortfolioTabProps> = ({ userId, isOwnProfile }) => {
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<'all' | 'trades' | 'collaborations' | 'featured'>('all');
  const [loading, setLoading] = useState(false);
  const [isManaging, setIsManaging] = useState(false);

  const fetchPortfolio = async () => {
    setLoading(true);
    const options = !isOwnProfile ? { onlyVisible: true } : {};
    const items = await getUserPortfolioItems(userId, options);
    setPortfolioItems(items);
    setLoading(false);
  };

  useEffect(() => {
    fetchPortfolio();
  }, [userId, isOwnProfile]);

  const filteredItems = useMemo(() => {
    switch (filter) {
      case 'trades':
        return portfolioItems.filter(item => item.sourceType === 'trade');
      case 'collaborations':
        return portfolioItems.filter(item => item.sourceType === 'collaboration');
      case 'featured':
        return portfolioItems.filter(item => item.featured);
      default:
        return portfolioItems;
    }
  }, [portfolioItems, filter]);

  return (
    <div className="portfolio-container">
      <div className="portfolio-header flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Portfolio ({portfolioItems.length})</h2>
        <div className="flex items-center space-x-2">
          <button
            className={`px-2 py-1 rounded ${viewMode === 'grid' ? 'bg-orange-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setViewMode('grid')}
          >
            Grid
          </button>
          <button
            className={`px-2 py-1 rounded ${viewMode === 'list' ? 'bg-orange-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setViewMode('list')}
          >
            List
          </button>
          <select
            value={filter}
            onChange={e => setFilter(e.target.value as any)}
            className="ml-2 border rounded px-2 py-1"
          >
            <option value="all">All</option>
            <option value="trades">Trades</option>
            <option value="collaborations">Collaborations</option>
            <option value="featured">Featured</option>
          </select>
          {isOwnProfile && (
            <button
              className={`ml-2 px-2 py-1 rounded ${isManaging ? 'bg-orange-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setIsManaging(v => !v)}
            >
              {isManaging ? 'Done' : 'Manage'}
            </button>
          )}
        </div>
      </div>
      {loading ? (
        <div className="py-8 text-center text-gray-500">Loading portfolio...</div>
      ) : filteredItems.length === 0 ? (
        <div className="py-8 text-center text-gray-500">No portfolio items to display.</div>
      ) : (
        <div className={`portfolio-items ${viewMode} grid gap-4`}>
          {filteredItems.map(item => (
            <PortfolioItemComponent
              key={item.id}
              item={item}
              isOwnProfile={isOwnProfile}
              isManaging={isManaging}
              onChange={fetchPortfolio}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PortfolioTab;
```

### Portfolio Item Component

```tsx
// src/components/features/portfolio/PortfolioItem.tsx
import React, { useState } from 'react';
import {
  updatePortfolioItemVisibility,
  updatePortfolioItemFeatured,
  updatePortfolioItemPinned,
  deletePortfolioItem
} from '../../../services/portfolio';
import { PortfolioItem } from '../../../types/portfolio';

interface PortfolioItemProps {
  item: PortfolioItem;
  isOwnProfile: boolean;
  isManaging: boolean;
  onChange?: () => void;
}

export const PortfolioItemComponent: React.FC<PortfolioItemProps> = ({
  item,
  isOwnProfile,
  isManaging,
  onChange
}) => {
  const [loading, setLoading] = useState(false);

  const handleToggleVisibility = async () => {
    if (!isOwnProfile) return;
    setLoading(true);
    await updatePortfolioItemVisibility(item.userId, item.id, !item.visible);
    setLoading(false);
    onChange && onChange();
  };

  const handleToggleFeatured = async () => {
    if (!isOwnProfile) return;
    setLoading(true);
    await updatePortfolioItemFeatured(item.userId, item.id, !item.featured);
    setLoading(false);
    onChange && onChange();
  };

  const handleTogglePinned = async () => {
    if (!isOwnProfile) return;
    setLoading(true);
    await updatePortfolioItemPinned(item.userId, item.id, !item.pinned);
    setLoading(false);
    onChange && onChange();
  };

  const handleDelete = async () => {
    if (!isOwnProfile) return;
    if (!window.confirm('Delete this portfolio item?')) return;
    setLoading(true);
    await deletePortfolioItem(item.userId, item.id);
    setLoading(false);
    onChange && onChange();
  };

  return (
    <div className={`portfolio-item bg-white rounded shadow p-4 relative ${item.featured ? 'border-2 border-orange-500' : ''}`}>
      <div className="font-semibold">{item.title}</div>
      <div className="text-xs text-gray-500">{item.sourceType} • {new Date(item.completedAt).toLocaleDateString()}</div>
      <div className="mt-2 text-sm">{item.description}</div>
      <div className="mt-2 flex flex-wrap gap-1">
        {item.skills.map(skill => (
          <span key={skill} className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs">{skill}</span>
        ))}
      </div>
      {item.evidence && item.evidence.length > 0 && (
        <div className="mt-2">
          <span className="text-xs text-gray-400">Evidence attached</span>
        </div>
      )}
      {isOwnProfile && isManaging && (
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          <button
            className={`text-xs px-2 py-1 rounded ${item.visible ? 'bg-green-200' : 'bg-gray-200'}`}
            onClick={handleToggleVisibility}
            disabled={loading}
            title={item.visible ? 'Hide from profile' : 'Show on profile'}
          >
            {item.visible ? 'Visible' : 'Hidden'}
          </button>
          <button
            className={`text-xs px-2 py-1 rounded ${item.featured ? 'bg-yellow-200' : 'bg-gray-200'}`}
            onClick={handleToggleFeatured}
            disabled={loading}
            title={item.featured ? 'Unfeature' : 'Feature on profile'}
          >
            {item.featured ? 'Featured' : 'Feature'}
          </button>
          <button
            className={`text-xs px-2 py-1 rounded ${item.pinned ? 'bg-blue-200' : 'bg-gray-200'}`}
            onClick={handleTogglePinned}
            disabled={loading}
            title={item.pinned ? 'Unpin' : 'Pin to top'}
          >
            {item.pinned ? 'Pinned' : 'Pin'}
          </button>
          <button
            className="text-xs px-2 py-1 rounded bg-red-200"
            onClick={handleDelete}
            disabled={loading}
            title="Delete portfolio item"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default PortfolioItemComponent;
```

## Integration Points

### Trade Confirmation System

When a trade is confirmed as completed, automatically generate portfolio items:

```typescript
// In trade confirmation handler
const handleConfirmCompletion = async () => {
  try {
    // First update trade status (existing functionality)
    await confirmTradeCompletion(tradeId);
    
    // Then generate portfolio items for both users
    await generateTradePortfolioItem(tradeId, trade.creatorId);
    await generateTradePortfolioItem(tradeId, trade.participantId);
    
    // Show success message
    addToast('success', 'Trade completed and added to your portfolio!');
    
  } catch (err) {
    // Handle error
  }
};
```

### Collaboration Completion

When a collaboration is marked as completed:

```typescript
// In collaboration completion handler
const handleMarkCollaborationComplete = async () => {
  try {
    // First update collaboration status (existing functionality)
    await markCollaborationCompleted(collaborationId);
    
    // Then generate portfolio items for all participants with completed roles
    const completedRoles = collaboration.roles.filter(
      role => role.filled && role.status === 'completed'
    );
    
    // Create portfolio items for each participant
    for (const role of completedRoles) {
      await generateCollaborationPortfolioItem(collaborationId, role.assignedUserId);
    }
    
    // Create portfolio item for creator
    await generateCollaborationPortfolioItem(collaborationId, collaboration.creatorId);
    
    // Show success message
    addToast('success', 'Collaboration completed and added to portfolios!');
    
  } catch (err) {
    // Handle error
  }
};
```

### Evidence System Integration

The portfolio will display evidence using the same embed system planned for trades and collaborations:

```jsx
// In PortfolioItemDetail.tsx
const PortfolioItemDetail = ({ item, onClose }) => {
  return (
    <div className="portfolio-item-detail">
      {/* Other details */}
      
      {/* Evidence section */}
      <div className="evidence-section">
        <h3>Evidence</h3>
        {item.evidence && item.evidence.length > 0 ? (
          <EvidenceGallery evidenceItems={item.evidence} />
        ) : (
          <p>No evidence provided for this work.</p>
        )}
      </div>
    </div>
  );
};
```

### User Profile Integration

Add portfolio tab to the profile page:

```jsx
// In ProfileTabs.tsx
const ProfileTabs = ({ userId, isOwnProfile }) => {
  const [activeTab, setActiveTab] = useState('about');
  
  return (
    <div className="profile-tabs-container">
      <div className="tabs">
        <button 
          className={activeTab === 'about' ? 'active' : ''} 
          onClick={() => setActiveTab('about')}
        >
          About
        </button>
        <button 
          className={activeTab === 'portfolio' ? 'active' : ''} 
          onClick={() => setActiveTab('portfolio')}
        >
          Portfolio
        </button>
        {/* Other tabs */}
      </div>
      
      <div className="tab-content">
        {activeTab === 'about' && <AboutTab userId={userId} />}
        {activeTab === 'portfolio' && <PortfolioTab userId={userId} isOwnProfile={isOwnProfile} />}
        {/* Other tab contents */}
      </div>
    </div>
  );
};
```

### Gamification Integration

Connect portfolio achievements with the gamification system:

```typescript
// In portfolio generation function
export const generateTradePortfolioItem = async (tradeId, userId) => {
  // Create portfolio item
  // ...
  
  // Check for achievements
  const portfolioCount = await getUserPortfolioCount(userId);
  
  // First portfolio item achievement
  if (portfolioCount === 1) {
    await awardAchievement(userId, 'portfolio_pioneer');
    await addUserXP(userId, 50, 'first_portfolio_item');
  }
  
  // Check for other achievements
  // ...
};
```

## Implementation Strategy

### Phase 1: Database and Core Functions

1. **Database Setup**
   - Create portfolio subcollection structure
   - Add portfolio settings to user profile
   - Set up necessary indexes

2. **Core Service Functions**
   - Portfolio item generation
   - Portfolio retrieval
   - Basic management functions

### Phase 2: UI Components

1. **Portfolio Tab**
   - Add tab to profile page
   - Implement basic grid/list views
   - Create portfolio item cards

2. **Portfolio Item Detail**
   - Create detailed view component
   - Implement evidence display
   - Add collaborator links

### Phase 3: Management Interface

1. **Portfolio Management**
   - Visibility controls
   - Featuring and pinning
   - Category management

2. **User Settings**
   - Default visibility settings
   - Display preferences

### Phase 4: Integration

1. **Trade/Collaboration Integration**
   - Connect to completion workflows
   - Implement automatic generation

2. **Gamification Integration**
   - Add portfolio-related achievements
   - Implement XP rewards

## Technical Considerations

### Performance Optimization

1. **Lazy Loading**
   - Load portfolio items in batches (pagination)
   - Lazy load evidence embeds
   - Use thumbnails for grid view

2. **Caching**
   - Cache portfolio data for quick access
   - Update cache when items are modified

3. **Indexing**
   - Create Firestore indexes for common queries:
     - userId + visible
     - userId + sourceType
     - userId + featured
     - userId + pinned + completedAt

### Security Rules

```
// Firestore security rules for portfolio
match /users/{userId}/portfolio/{itemId} {
  // Anyone can read visible portfolio items
  allow read: if resource.data.visible == true;
  
  // User can read all their own portfolio items
  allow read: if request.auth.uid == userId;
  
  // Only the user can write to their portfolio
  allow write: if request.auth.uid == userId;
  
  // Validate that sourceId isn't changed
  allow update: if request.resource.data.sourceId == resource.data.sourceId
                && request.resource.data.sourceType == resource.data.sourceType;
}
```

## Compatibility Guidelines

To ensure this feature integrates well with the existing app and doesn't break anything, follow these guidelines:

### 1. Non-Invasive Integration

- **Add, Don't Modify**: Create new components and functions rather than modifying existing ones
- **Use Subcollections**: Store portfolio data in subcollections to avoid affecting existing data
- **Separate Concerns**: Keep portfolio logic separate from trade/collaboration logic

### 2. Backward Compatibility

- **Handle Missing Data**: Gracefully handle cases where portfolio data doesn't exist
- **Progressive Enhancement**: Add portfolio features incrementally
- **Fallback Displays**: Provide fallbacks for users without portfolio items

### 3. Error Handling

- **Fail Gracefully**: If portfolio generation fails, it shouldn't affect trade/collaboration completion
- **Retry Mechanisms**: Implement retry logic for portfolio generation
- **Error Logging**: Log errors for debugging without disrupting user experience

### 4. Testing Strategy

- **Isolated Testing**: Test portfolio components in isolation
- **Integration Testing**: Test integration with trade/collaboration systems
- **Regression Testing**: Ensure existing functionality isn't affected

### 5. Implementation Checklist

Before implementing:
- [ ] Ensure trade confirmation system is fully implemented
- [ ] Verify evidence embed system is working
- [ ] Check that user profiles support tab navigation
- [ ] Confirm Firestore security rules are properly configured

During implementation:
- [ ] Add new components without modifying existing ones
- [ ] Create new service functions that don't affect existing ones
- [ ] Test each component in isolation before integration
- [ ] Implement proper error handling

After implementation:
- [ ] Verify existing features still work correctly
- [ ] Check performance on profiles with many portfolio items
- [ ] Test on different devices and screen sizes
- [ ] Ensure dark/light mode compatibility
