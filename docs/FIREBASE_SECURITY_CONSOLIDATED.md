# Firebase Security System - Comprehensive Guide

**Last Updated**: December 15, 2024  
**Status**: ✅ Fully Implemented and Deployed

## Overview

This document provides comprehensive coverage of Firebase security implementation for the TradeYa application, including Firestore and Cloud Storage security rules, testing frameworks, maintenance procedures, and operational best practices.

## Table of Contents

1. [Access Control Model](#access-control-model)
2. [Firestore Security Rules](#firestore-security-rules)
3. [Storage Security Rules](#storage-security-rules)
4. [Authentication & Authorization](#authentication--authorization)
5. [Testing Framework](#testing-framework)
6. [Development Workflow](#development-workflow)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Emergency Procedures](#emergency-procedures)
9. [Security Best Practices](#security-best-practices)
10. [Troubleshooting](#troubleshooting)

## Access Control Model

### User Roles Hierarchy

```text
Admin
  └─ Moderator
      └─ User
```

- **User**: Basic authenticated user with read/write access to owned resources
- **Moderator**: Can moderate content and manage user interactions  
- **Admin**: Full system access and configuration rights

### Permission Matrix

| Resource | User | Moderator | Admin |
|----------|------|-----------|-------|
| Own Profile | Read/Write | Read/Write | Read/Write |
| Other Profiles | **Read (for messaging)** | Read/Write | Read/Write |
| Own Conversations | Read/Write | Read/Write | Read/Write |
| Other Conversations | **Read (if participant)** | Read/Write | Read/Write |
| Message Read Status | **Update (own readBy only)** | Update | Update |
| Own Trades | Read/Write | Read/Write | Read/Write |
| Other Trades | Read (if participant) | Read/Write | Read/Write |
| System Settings | Read | Read | Read/Write |
| Audit Logs | None | None | Read |

**Recent Changes (2025-01-28):**

- ✅ **User Profiles**: Now allow authenticated users to read basic profile info for messaging functionality
- ✅ **Conversations**: Allow authenticated users to list/read conversations they participate in
- ✅ **Message Read Receipts**: Allow participants to update readBy arrays using arrayUnion operations

## Firestore Security Rules

### Core Helper Functions

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Authentication helpers
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function hasRole(role) {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.roles.hasAny([role]);
    }
    
    function isAdmin() {
      return hasRole('admin');
    }
    
    function isModerator() {
      return hasRole('moderator');
    }
    
    // Validation helpers
    function isValidTimestamp(timestamp) {
      return timestamp is timestamp && 
        timestamp.date() <= request.time.date();
    }
    
    function isValidUpdate(oldData, newData) {
      return oldData.keys().hasAll(newData.keys());
    }

    // User profiles
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isOwner(userId) && 
        incomingData().size() <= 1000000;
      allow update: if isOwner(userId) || isAdmin();
      allow delete: if isAdmin();

      // User private data
      match /private/{document=**} {
        allow read, write: if isOwner(userId);
      }
    }

    // Trades
    match /trades/{tradeId} {
      allow read: if isAuthenticated() &&
        (resource.data.participantIds.hasAny([request.auth.uid]) || isAdmin());
      allow create: if isAuthenticated() && 
        request.resource.data.creatorId == request.auth.uid &&
        validateTradeData();
      allow update: if isAuthenticated() &&
        (resource.data.participantIds.hasAny([request.auth.uid]) || isAdmin()) &&
        validateTradeUpdate();
      allow delete: if isAdmin();

      function validateTradeData() {
        let data = request.resource.data;
        return data.createdAt is timestamp &&
          data.status in ['pending', 'active', 'completed', 'cancelled'] &&
          data.participantIds is list &&
          data.participantIds.size() >= 2;
      }

      function validateTradeUpdate() {
        let data = request.resource.data;
        let oldData = resource.data;
        return data.creatorId == oldData.creatorId &&
          data.participantIds == oldData.participantIds &&
          isValidStatusTransition(oldData.status, data.status);
      }

      function isValidStatusTransition(oldStatus, newStatus) {
        let validTransitions = {
          'pending': ['active', 'cancelled'],
          'active': ['completed', 'cancelled'],
          'completed': [],
          'cancelled': []
        };
        return oldStatus in validTransitions &&
          newStatus in validTransitions[oldStatus];
      }
    }

    // Chat messages
    match /messages/{messageId} {
      allow read: if isAuthenticated() &&
        (resource.data.participantIds.hasAny([request.auth.uid]) || isAdmin());
      allow create: if isAuthenticated() &&
        request.resource.data.senderId == request.auth.uid &&
        validateMessageData();
      allow update: if false; // Messages are immutable
      allow delete: if isAdmin();

      function validateMessageData() {
        let data = request.resource.data;
        return data.content is string &&
          data.content.size() <= 5000 &&
          data.timestamp is timestamp &&
          data.participantIds is list;
      }
    }

    // System settings
    match /settings/{document=**} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    // Audit logs
    match /audit/{logId} {
      allow read: if isAdmin();
      allow create: if isAuthenticated();
      allow update, delete: if false; // Audit logs are immutable
    }

    // Rate limiting
    match /ratelimits/{userId} {
      allow read: if isOwner(userId);
      allow write: if false; // Only managed by server
    }
  }
}
```

## Storage Security Rules

### Cloud Storage Access Control

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
        firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.roles.hasAny(['admin']);
    }

    function isValidContentType(contentType) {
      let validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
      return contentType in validTypes;
    }

    // Profile images
    match /users/{userId}/profile/{fileName} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId) &&
        request.resource.size < 5 * 1024 * 1024 && // 5MB
        isValidContentType(request.resource.contentType);
    }

    // Trade evidence
    match /trades/{tradeId}/evidence/{fileName} {
      allow read: if isAuthenticated() &&
        (exists(path) ?
          firestore.get(/databases/(default)/documents/trades/$(tradeId)).data.participantIds.hasAny([request.auth.uid])
          : true);
      allow write: if isAuthenticated() &&
        firestore.get(/databases/(default)/documents/trades/$(tradeId)).data.participantIds.hasAny([request.auth.uid]) &&
        request.resource.size < 20 * 1024 * 1024 && // 20MB
        isValidContentType(request.resource.contentType);
    }

    // Public assets
    match /public/{fileName} {
      allow read: if true;
      allow write: if isAdmin();
    }
  }
}
```

## Authentication & Authorization

### Custom Claims Configuration

```typescript
// Role-based permissions mapping
const rolePermissions = {
  user: [
    'read:trades',
    'write:trades',
    'read:users'
  ],
  moderator: [
    'read:trades',
    'write:trades',
    'read:users',
    'write:users'
  ],
  admin: [
    'read:trades',
    'write:trades',
    'read:users',
    'write:users',
    'manage:system'
  ]
};
```

### Session Management

- JWT-based authentication with refresh tokens
- Automatic session timeout after inactivity
- Token validation and rotation
- Secure logout procedures

## Testing Framework

### Test Structure

```typescript
describe('Firebase Security Rules', () => {
  beforeAll(async () => {
    const options = {
      projectId: 'demo-test-project',
      firestore: {
        rules: getRules('firestore'),
      },
      storage: {
        rules: getRules('storage'),
      }
    };
    testEnv = await initializeTestEnvironment(options);
  });

  describe('User Profiles', () => {
    it('allows users to read their own profile', async () => {
      const context = testEnv.authenticatedContext('alice');
      const profileRef = doc(context.firestore(), 'users/alice');
      await assertSucceeds(getDoc(profileRef));
    });

    it('prevents users from reading other profiles without permission', async () => {
      const context = testEnv.authenticatedContext('bob');
      const aliceProfileRef = doc(context.firestore(), 'users/alice');
      await assertFails(getDoc(aliceProfileRef));
    });
  });
});
```

### Test Categories

1. **Authentication Tests**
   - Unauthenticated access
   - Authenticated access
   - Role-based access

2. **Data Access Tests**
   - Read operations
   - Write operations
   - Delete operations

3. **Validation Tests**
   - Data structure validation
   - Field type validation
   - Required field validation

### Running Tests

```bash
# Run all security tests
npm run test:security

# Run rules-specific tests
npm run test:rules

# Run with coverage
npm run test:security -- --coverage
```

## Development Workflow

### 1. Local Development

```bash
# Initialize security environment
npm run security:init

# Check current rules
npm run security:check

# Run security tests
npm run test:security
```

### 2. Rule Changes Process

Before making changes:

1. Create a new branch for rule changes
2. Run existing tests to ensure current rules work
3. Make rule changes incrementally
4. Run validation after each change

```bash
# Validate rule syntax
npm run validate:rules

# Run security tests
npm run test:rules
```

### 3. Deployment Process

```bash
# Deploy rules (includes validation and testing)
npm run security:deploy

# Emergency deployment
npm run security:deploy:force
```

### Pre-commit Validation

All security rule changes are automatically validated:

```bash
# Pre-commit hook runs:
firebase firestore:rules:lint firestore.rules
firebase storage:rules:lint storage.rules
npm run test:security
```

## Monitoring & Maintenance

### Regular Maintenance Schedule

- **Weekly**: Security test execution
- **Monthly**: Access pattern analysis and rule review
- **Quarterly**: Comprehensive security audit
- **Annually**: Penetration testing

### Automated Monitoring

1. **Security Metrics**
   - Failed login attempts
   - Rate limit violations
   - Suspicious activity patterns
   - Token refresh patterns

2. **Performance Metrics**
   - Rule execution time
   - Resource usage patterns
   - Complex rule optimization opportunities

3. **Access Patterns**
   - User permission utilization
   - Data access frequency
   - Cross-collection access patterns

### Alert Configuration

```typescript
const securityAlerts = {
  thresholds: {
    failedLogins: 10,
    rateViolations: 5,
    suspiciousEvents: 3
  },
  notifications: {
    email: true,
    slack: true,
    dashboard: true
  }
};
```

## Emergency Procedures

### Rule Rollback

```bash
# Access backup rules
cd backups/security-rules

# Deploy previous version
firebase deploy --only firestore:rules --rules firestore_YYYYMMDD_HHMMSS.rules
firebase deploy --only storage:rules --rules storage_YYYYMMDD_HHMMSS.rules
```

### Emergency Lockdown

```javascript
// Strict lockdown rules (emergency use only)
match /{document=**} {
  allow read: if isAdmin();
  allow write: if false;
}
```

### Recovery Procedures

1. **Identify Issue**: Analyze logs and error patterns
2. **Containment**: Apply temporary restrictions if needed
3. **Fix Implementation**: Deploy corrected rules
4. **Verification**: Test access patterns
5. **Documentation**: Record incident and resolution

## Security Best Practices

### 1. Rule Writing

- Keep rules simple and focused
- Comment complex logic thoroughly
- Use helper functions for reusable logic
- Validate all inputs at rule level

### 2. Data Validation

- Always validate data structure and content
- Enforce size limits on all fields
- Check data types and formats
- Validate state transitions

### 3. Performance Optimization

- Minimize reads in rules (use `exists()` before `get()`)
- Cache frequently used values
- Limit collection document access
- Optimize complex validation functions

### 4. Testing Strategy

- Test both positive and negative cases
- Include edge cases in test coverage
- Test with different user roles
- Verify error messages are appropriate

## Troubleshooting

### Common Errors

1. **"Permission denied" errors**

   ```javascript
   // Check if rule is too restrictive
   match /users/{userId} {
     allow read: if request.auth.uid == userId; // Only allows exact match
     // Consider: allow read: if request.auth != null; // Allows authenticated users
   }
   ```

2. **"Error evaluating rules" errors**

   ```javascript
   // Check for syntax errors
   function hasRole(role) {
     return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.roles[role] == true;
     // Should be:
     return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.roles.hasAny([role]);
   }
   ```

### Debugging Tips

1. Use the Firebase Console Rules Playground
2. Enable debug logging in tests
3. Break down complex rules into smaller functions
4. Use the emulator suite for local testing

### Performance Issues

**Problem**: Rules taking too long to evaluate
**Solution**:

```javascript
// Instead of
allow read: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.roles.hasAny(['admin']);

// Use
allow read: if exists(/databases/$(database)/documents/users/$(request.auth.uid));
```

## Continuous Integration

### CI Pipeline

Our automated CI pipeline includes:

1. Rules syntax validation
2. Security test execution  
3. Static analysis
4. Security report generation
5. Staging deployment
6. Integration testing
7. Production deployment (on approval)

### Security Analysis

The CI system performs:

- Automated security scanning
- Dependency vulnerability checks
- Rule complexity analysis
- Access pattern validation

## Related Documentation

- [Authentication System Consolidated](./AUTHENTICATION_CONSOLIDATED.md)
- [Security Policy](../SECURITY.md)
- [Deployment Guide](./DEPLOYMENT.md)

## Maintenance Scripts

- `scripts/check-security-rules.sh`: Validates and analyzes rules
- `scripts/deploy-security-rules.sh`: Deploys rules with safety checks
- `scripts/validate-security.sh`: Comprehensive security validation

## Version Control

Always include in security rule commits:

1. Rule changes with clear descriptions
2. Corresponding test updates
3. Documentation updates
4. Migration plan for breaking changes

---

*This document consolidates information from FIREBASE_SECURITY_IMPLEMENTATION.md, FIREBASE_SECURITY_RULES.md, and FIREBASE_RULES_MAINTENANCE.md to provide a single comprehensive resource for Firebase security management.*
