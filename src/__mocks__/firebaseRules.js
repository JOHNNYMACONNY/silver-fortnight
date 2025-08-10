// Mock Firebase security rules for testing
exports.mockFirestoreRules = `
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
      return isAuthenticated() && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.roles.hasAny([role]);
    }
    
    function isAdmin() {
      return hasRole('admin');
    }
    
    function isValidTimestamp(timestamp) {
      return timestamp is timestamp && 
        timestamp.date() <= request.time.date();
    }

    // User profiles
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isOwner(userId);
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
        request.resource.data.creatorId == request.auth.uid;
      allow update: if isAuthenticated() &&
        (resource.data.participantIds.hasAny([request.auth.uid]) || isAdmin());
      allow delete: if isAdmin();
    }

    // Messages
    match /messages/{messageId} {
      allow read: if isAuthenticated() &&
        (resource.data.participantIds.hasAny([request.auth.uid]) || isAdmin());
      allow create: if isAuthenticated() &&
        request.resource.data.senderId == request.auth.uid;
      allow update: if false;
      allow delete: if isAdmin();
    }

    // System settings
    match /settings/{document=**} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
  }
}`;

exports.mockStorageRules = `
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

    function isValidFileSize(size) {
      return size < 5 * 1024 * 1024; // 5MB limit
    }

    // Profile images
    match /users/{userId}/profile/{fileName} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId) &&
        isValidFileSize(request.resource.size) &&
        isValidContentType(request.resource.contentType);
    }

    // Trade evidence
    match /trades/{tradeId}/evidence/{fileName} {
      allow read: if isAuthenticated() &&
        firestore.get(/databases/(default)/documents/trades/$(tradeId)).data.participantIds.hasAny([request.auth.uid]);
      allow write: if isAuthenticated() &&
        firestore.get(/databases/(default)/documents/trades/$(tradeId)).data.participantIds.hasAny([request.auth.uid]) &&
        isValidFileSize(request.resource.size) &&
        isValidContentType(request.resource.contentType);
    }
  }
}`;

// Utility function to get rules for testing
exports.getRules = (type) => {
  switch (type) {
    case 'firestore':
      return exports.mockFirestoreRules;
    case 'storage':
      return exports.mockStorageRules;
    default:
      throw new Error('Invalid rules type requested');
  }
};
