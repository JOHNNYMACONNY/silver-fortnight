# Firebase Security Implementation

## Overview

This document outlines the security measures implemented in our Firebase configuration for both Firestore and Cloud Storage.

## Access Control Model

### User Roles

- **User**: Basic authenticated user
- **Moderator**: Can moderate content and manage user interactions
- **Admin**: Full system access and configuration rights

### Role Inheritance

```text
Admin
  └─ Moderator
      └─ User
```

## Firestore Security Rules

### Helper Functions

- `isAuthenticated()`: Verifies user authentication
- `isOwner(userId)`: Checks if current user owns the resource
- `hasRole(role)`: Validates user role membership
- `isAdmin()`: Checks admin privileges
- `isModerator()`: Checks moderator privileges
- `isValidTimestamp(timestamp)`: Validates timestamp integrity

### Collection Security

#### Users Collection

```javascript
match /users/{userId} {
  allow read: if isAuthenticated();
  allow create: if isOwner(userId) && validateUserData(request.resource.data);
  allow update: if (isOwner(userId) || isAdmin()) && validateUserData(request.resource.data);
  allow delete: if isAdmin();
}
```

#### Trades Collection

```javascript
match /trades/{tradeId} {
  allow read: if isAuthenticated() &&
    (resource.data.participantIds.hasAny([request.auth.uid]) || isModerator());
  allow create: if isAuthenticated() && validateTradeData(request.resource.data);
  allow update: if isAuthenticated() &&
    (resource.data.participantIds.hasAny([request.auth.uid]) || isModerator()) &&
    validateTradeUpdate(resource.data, request.resource.data);
  allow delete: if isAdmin();
}
```

### Data Validation

- Size limits enforced on all documents
- Content type validation for uploads
- Status transition validation for trades
- Timestamp validation for all date fields

## Storage Security Rules

### Access Control

- Profile images: Owner access only
- Trade evidence: Participant and moderator access
- Public assets: Read public, write admin only
- System backups: Admin only
- Temporary uploads: Time-limited owner access

### File Validation

```javascript
function isValidContentType(contentType) {
  let validTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'text/plain',
    'application/json'
  ];
  return contentType in validTypes;
}
```

### Size Limits

- Profile images: 5MB
- Trade evidence: 20MB
- Public assets: 10MB
- Temporary uploads: 50MB

## Security Best Practices

### Data Access

1. **Principle of Least Privilege**
   - Users can only access their own data
   - Role-based access for administrative functions
   - Granular permissions for different operations

2. **Data Validation**
   - Input sanitization at rule level
   - Size restrictions on all uploads
   - Content type validation
   - Status transition validation

3. **Rate Limiting**
   - Implemented at application level
   - Server-side enforcement
   - Per-user tracking

### File Storage

1. **Access Control**
   - Path-based permissions
   - Role-based access
   - Time-limited access for temporary files

2. **File Validation**
   - Content type restrictions
   - Size limits per file type
   - Automated cleanup for temporary files

3. **Security Headers**
   - Content-Security-Policy enforced
   - X-Frame-Options configuration
   - CORS policies implemented

## Testing

### Rule Testing

```typescript
describe('Firestore Rules', () => {
  it('allows users to read their own profile', async () => {
    const db = authenticatedContext('user1').firestore();
    await assertSucceeds(getDoc(doc(db, 'users/user1')));
  });
});
```

### Monitoring

1. **Audit Logs**
   - All security-relevant events logged
   - Admin-only access to logs
   - Immutable log entries

2. **Alerts**
   - Suspicious activity detection
   - Rate limit violations
   - Admin notifications

## Maintenance

### Regular Reviews

- Monthly security rule audits
- Access pattern analysis
- Performance impact assessment

### Updates

1. **Rule Deployment**

   ```bash
   firebase deploy --only firestore:rules
   firebase deploy --only storage:rules
   ```

2. **Testing Process**

   ```bash
   npm run test:security
   npm run test:rules
   ```

### Emergency Procedures

1. **Lock Down**

   ```javascript
   // Emergency lockdown rules
   match /{document=**} {
     allow read: if isAdmin();
     allow write: if false;
   }
   ```

2. **Recovery**
   - Backup restoration process
   - Gradual permission restoration
   - Incident documentation

## Related Documents

- [Security Policy](./SECURITY.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Incident Response](./INCIDENT_RESPONSE.md)
