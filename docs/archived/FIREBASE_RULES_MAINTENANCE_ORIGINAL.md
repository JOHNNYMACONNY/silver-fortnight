# Firebase Security Rules Maintenance Guide

## Overview

This document outlines the procedures and best practices for maintaining and testing Firebase security rules in our application.

## Security Rules Structure

### File Organization

- `firestore.rules` - Firestore security rules
- `storage.rules` - Cloud Storage security rules
- `src/__tests__/firebase-security.test.ts` - Security rules tests
- `src/__mocks__/firebaseRules.js` - Mock rules for testing

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

### 2. Rule Changes

Before making changes:

1. Create a new branch
2. Run existing tests to ensure current rules work
3. Make rule changes
4. Run validation

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
```

## Testing Framework

### Test Structure

```typescript
describe('Firestore Rules', () => {
  describe('User Profiles', () => {
    it('allows users to read their own profile', async () => {
      const context = testEnv.authenticatedContext('alice');
      const profileRef = doc(context.firestore(), 'users/alice');
      await assertSucceeds(getDoc(profileRef));
    });
  });
});
```

### Test Categories

1. Authentication Tests
   - Unauthenticated access
   - Authenticated access
   - Role-based access

2. Data Access Tests
   - Read operations
   - Write operations
   - Delete operations

3. Validation Tests
   - Data structure
   - Field types
   - Required fields

## Security Patterns

### 1. Authentication Checks

```javascript
function isAuthenticated() {
  return request.auth != null;
}
```

### 2. Role-Based Access

```javascript
function hasRole(role) {
  return isAuthenticated() && 
    exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.roles.hasAny([role]);
}
```

### 3. Data Validation

```javascript
function isValidUserData(data) {
  return data.size() <= 1000000 && // 1MB limit
         data.name is string &&
         data.email is string;
}
```

## Monitoring and Maintenance

### Regular Checks

1. Run security tests weekly
2. Review access patterns monthly
3. Audit rules quarterly

### Automated Checks

- Pre-commit hooks validate rules
- CI/CD pipeline runs security tests
- Automated deployment only after tests pass

## Emergency Procedures

### Rule Rollback

```bash
# Access backup rules
cd backups/security-rules

# Deploy previous version
firebase deploy --only firestore:rules --rules firestore_YYYYMMDD_HHMMSS.rules
```

### Emergency Lockdown

```javascript
// Strict lockdown rules
match /{document=**} {
  allow read: if isAdmin();
  allow write: if false;
}
```

## Best Practices

### 1. Rule Writing

- Keep rules simple and focused
- Comment complex logic
- Use helper functions for reusable logic
- Validate all inputs

### 2. Testing

- Test both positive and negative cases
- Include edge cases
- Test with different user roles
- Verify error messages

### 3. Performance

- Minimize reads in rules
- Cache frequently used values
- Use exists() before get() where possible
- Limit collection document access

## Common Issues and Solutions

### 1. Performance Issues

Problem: Rules taking too long to evaluate
Solution:

```javascript
// Instead of
allow read: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.roles.hasAny(['admin']);

// Use
allow read: if exists(/databases/$(database)/documents/users/$(request.auth.uid));
```

### 2. Security Gaps

Problem: Unintended access patterns
Solution: Always test negative cases

```typescript
it('prevents users from reading other profiles', async () => {
  const bob = testEnv.authenticatedContext('bob');
  const aliceRef = doc(bob.firestore(), 'users/alice');
  await assertFails(getDoc(aliceRef));
});
```

### 3. Data Validation_

Problem: Invalid data structures
Solution: Comprehensive validation functions

```javascript
function isValidTrade(data) {
  return data.creatorId == request.auth.uid &&
         data.status in ['pending', 'active', 'completed'] &&
         data.amount is number &&
         data.amount > 0;
}
```

## Tools and Resources

### Local Development

- Firebase Emulator Suite
- Jest Testing Framework
- Security Rules Playground

### Monitoring

- Firebase Console
- Security Rules Analysis Reports
- Access Pattern Analytics

### Documentation

- [Firebase Security Rules Reference](https://firebase.google.com/docs/rules)
- [Rules Language Reference](https://firebase.google.com/docs/reference/security/database)
- [Testing Reference](https://firebase.google.com/docs/rules/unit-tests)

## Related Scripts

- `scripts/check-security-rules.sh`: Validates and analyzes rules
- `scripts/deploy-security-rules.sh`: Deploys rules with safety checks
- `scripts/set-permissions.sh`: Sets up security environment

## Version Control

Always include in commits:

1. Rule changes
2. Corresponding tests
3. Documentation updates
4. Migration plan if breaking

## Continuous Integration

Our CI pipeline:

1. Validates rule syntax
2. Runs security tests
3. Performs static analysis
4. Generates security reports
5. Deploys to staging
6. Runs integration tests
7. Deploys to production

## Troubleshooting

### Common Errors

1. "Permission denied" errors

    ```javascript
    // Check if rule is too restrictive
    match /users/{userId} {
      allow read: if request.auth.uid == userId; // Only allows exact match
      // Consider: allow read: if request.auth != null; // Allows authenticated users
    }
    ```

2. "Error evaluating rules" errors

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
