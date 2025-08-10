# Service Architecture Migration Guide

## Overview

This document outlines the migration from the monolithic `firestore.ts` file (1741 lines) to a modern, scalable service layer architecture. The new architecture provides better separation of concerns, improved error handling, and enhanced maintainability.

## Architecture Changes

### Before (Monolithic)
```
src/services/
├── firestore.ts (1741 lines)
├── firestore-extensions.ts
└── firestore-exports.ts
```

### After (Service Layer)
```
src/services/
├── core/
│   ├── BaseService.ts          # Base class for all services
│   └── ServiceRegistry.ts      # Dependency injection & service management
├── entities/
│   ├── UserService.ts          # User-specific operations
│   ├── TradeService.ts         # Trade-specific operations
│   └── CollaborationService.ts # Collaboration-specific operations
├── firestore.ts               # Legacy (deprecated)
├── firestore-extensions.ts    # Legacy (deprecated)
└── firestore-exports.ts       # Updated with new exports
```

## Key Benefits

### 1. Separation of Concerns
- Each service handles a specific domain (Users, Trades, Collaborations)
- Clear boundaries between different business logic areas
- Easier to test and maintain individual components

### 2. Consistent Error Handling
- All services extend `BaseService` with standardized error handling
- Integration with the error recovery system
- Consistent error reporting and logging

### 3. Type Safety
- Strong TypeScript typing for all service methods
- Generic base service provides type-safe CRUD operations
- Clear interfaces for all data models

### 4. Dependency Injection
- Service registry for centralized service management
- Easy mocking and testing
- Configurable service lifecycle management

## Migration Steps

### Step 1: Update Imports

**Before:**
```typescript
import { createUser, getUser, updateUser } from '../services/firestore';
```

**After:**
```typescript
import { userService } from '../services/entities/UserService';
// or
import { getUserService } from '../services/core/ServiceRegistry';
```

### Step 2: Update Function Calls

**Before:**
```typescript
const result = await createUser(userData);
if (result.error) {
  // Handle error
}
const user = result.data;
```

**After:**
```typescript
const result = await userService.createUser(userData);
if (result.error) {
  // Handle error (same pattern)
}
const user = result.data;
```

### Step 3: Initialize Service Registry

Add to your app initialization:

```typescript
import { initializeServices } from '../services/core/ServiceRegistry';

// In your app startup
await initializeServices();
```

## Service Usage Examples

### User Service
```typescript
import { userService } from '../services/entities/UserService';

// Create user
const createResult = await userService.createUser({
  uid: 'user123',
  email: 'user@example.com',
  displayName: 'John Doe'
});

// Get user
const userResult = await userService.getUser('user123');

// Update user
const updateResult = await userService.updateUser('user123', {
  bio: 'Updated bio'
});

// Search users by skills
const searchResult = await userService.searchUsersBySkills(['React', 'TypeScript']);
```

### Trade Service
```typescript
import { tradeService } from '../services/entities/TradeService';

// Create trade
const tradeResult = await tradeService.createTrade({
  title: 'Web Development for Design',
  description: 'Looking to trade web development skills for design work',
  skillsOffered: [{ name: 'React', level: 'advanced' }],
  skillsWanted: [{ name: 'UI Design', level: 'intermediate' }],
  creatorId: 'user123'
});

// Search trades by skills
const searchResult = await tradeService.searchTradesBySkills(['React']);

// Accept trade
const acceptResult = await tradeService.acceptTrade('trade123', 'user456');
```

### Collaboration Service
```typescript
import { collaborationService } from '../services/entities/CollaborationService';

// Create collaboration
const collabResult = await collaborationService.createCollaboration({
  title: 'Open Source Project',
  description: 'Building a new React component library',
  roles: [
    { name: 'Frontend Developer', description: 'React expert needed' }
  ],
  creatorId: 'user123',
  skillsRequired: ['React', 'TypeScript'],
  maxParticipants: 5
});

// Search collaborations
const searchResult = await collaborationService.searchCollaborations({
  skills: ['React'],
  status: ['open', 'recruiting']
});

// Join collaboration
const joinResult = await collaborationService.joinCollaboration('collab123', 'user456');
```

## Service Registry Usage

### Basic Usage
```typescript
import { getUserService, getTradeService } from '../services/core/ServiceRegistry';

const userService = getUserService();
const tradeService = getTradeService();
```

### Advanced Usage with Dependency Injection
```typescript
import { serviceRegistry } from '../services/core/ServiceRegistry';

// Register custom service
serviceRegistry.register('customService', new CustomService());

// Get service
const customService = serviceRegistry.get<CustomService>('customService');

// Check service health
const healthStatus = serviceRegistry.getHealthStatus();
```

## Error Handling

All services use consistent error handling patterns:

```typescript
const result = await userService.getUser('user123');

if (result.error) {
  // Error object contains:
  // - code: string (error code)
  // - message: string (user-friendly message)
  console.error('Error:', result.error.code, result.error.message);
  return;
}

// Success - data is available
const user = result.data;
```

## Testing

### Service Testing
```typescript
import { UserService } from '../services/entities/UserService';

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
  });

  it('should create user successfully', async () => {
    const result = await userService.createUser({
      uid: 'test123',
      email: 'test@example.com'
    });

    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();
    expect(result.data?.id).toBe('test123');
  });
});
```

### Mocking Services
```typescript
import { serviceRegistry } from '../services/core/ServiceRegistry';

// Mock service for testing
const mockUserService = {
  getUser: jest.fn().mockResolvedValue({
    data: { id: 'user123', email: 'test@example.com' },
    error: null
  })
};

serviceRegistry.register('userService', mockUserService);
```

## Performance Considerations

### 1. Service Initialization
- Services are initialized once at app startup
- Lazy loading available for non-critical services
- Connection pooling handled at the service level

### 2. Caching
- Each service can implement its own caching strategy
- Integration with the performance optimization system
- Automatic cache invalidation on data updates

### 3. Batch Operations
- All services support batch operations for better performance
- Firestore batch writes for multiple operations
- Optimized query patterns

## Migration Checklist

- [ ] Update all imports to use new service classes
- [ ] Replace direct firestore function calls with service methods
- [ ] Add service registry initialization to app startup
- [ ] Update tests to use new service interfaces
- [ ] Verify error handling patterns are consistent
- [ ] Test all CRUD operations with new services
- [ ] Update documentation and type definitions
- [ ] Remove deprecated firestore.ts imports
- [ ] Validate performance with new architecture

## Backward Compatibility

The migration maintains backward compatibility:

1. **Legacy exports**: Old firestore functions still available during transition
2. **Gradual migration**: Can migrate components one at a time
3. **Same data models**: No changes to Firestore document structure
4. **Same error patterns**: Error handling patterns remain consistent

## Future Enhancements

The new architecture enables:

1. **Advanced caching**: Service-level caching strategies
2. **Monitoring**: Built-in service health monitoring
3. **Scaling**: Easy addition of new services
4. **Testing**: Better unit and integration testing
5. **Performance**: Optimized query patterns and batch operations

## Support

For questions or issues during migration:

1. Check the service method documentation
2. Review the error handling patterns
3. Test with the new service interfaces
4. Validate data consistency after migration

The new service architecture provides a solid foundation for future development while maintaining the reliability and performance of the existing system.
