# Firebase Security Rules

## Overview

This document outlines our Firebase security rules implementation for protecting data access and maintaining strict authorization controls.

## Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
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

## Storage Rules

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

## Authentication Rules

```typescript
// Custom claims configuration
const customClaims = {
  roles: ['user', 'admin', 'moderator'],
  permissions: [
    'read:trades',
    'write:trades',
    'read:users',
    'write:users',
    'manage:system'
  ]
};

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

## Security Best Practices

### 1. Data Validation

- Always validate data structure and content
- Enforce size limits on all fields
- Check data types and formats
- Validate state transitions

### 2. Authentication

- Require authentication for all sensitive operations
- Implement role-based access control
- Use custom claims for special permissions
- Validate user session state

### 3. Authorization

- Check ownership before allowing modifications
- Implement hierarchical access controls
- Use role inheritance where appropriate
- Separate admin and user permissions

### 4. Rate Limiting

- Implement request frequency limits
- Track API usage per user
- Prevent abuse and DoS attacks
- Log excessive requests

### 5. Data Privacy

- Separate public and private data
- Encrypt sensitive information
- Implement proper data isolation
- Control cross-user access

## Security Testing

### 1. Rule Testing

```javascript
// Example rule test
describe('Firestore Rules', () => {
  it('allows users to read their own data', async () => {
    const db = await setup(mockAuth({ uid: 'user1' }));
    const ref = db.collection('users').doc('user1');
    await expect(ref.get()).toBeAllowed();
  });
});
```

### 2. Penetration Testing

- Regular security assessments
- Edge case testing
- Authorization bypass attempts
- Rate limit verification

## Monitoring and Alerts

### 1. Security Monitoring

- Track failed access attempts
- Monitor rule violations
- Alert on suspicious activity
- Log security events

### 2. Performance Impact

- Monitor rule execution time
- Track resource usage
- Optimize complex rules
- Cache frequently accessed data

## Maintenance

### 1. Regular Updates

- Review and update rules monthly
- Test rule changes thoroughly
- Document rule modifications
- Monitor security patches

### 2. Version Control

- Track rule changes in git
- Review rule changes
- Test before deployment
- Maintain rule history
