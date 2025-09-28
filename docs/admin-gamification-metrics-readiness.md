# Admin Gamification Metrics: Production Readiness

This document lists the Firestore indexes and security rules recommended for the Admin Gamification Metrics service and dashboard.

## Required Firestore Indexes

Depending on project data volume and query shapes, create these indexes (names/fields are illustrative — follow Firestore console prompts if different):

1) notifications: Query by createdAt >= and type == 'streak_milestone'
- Collection: notifications
- Fields: type Asc, createdAt Asc

2) trades: participants array-contains and status == 'completed'
- Collection: trades
- Fields: participants Array-contains, status Asc

3) roles (collection group): assignedUserId == and status == 'completed'
- Collection Group: roles
- Fields: assignedUserId Asc, status Asc

4) roles (collection group): participantId == and status == 'completed'
- Collection Group: roles
- Fields: participantId Asc, status Asc

5) xpTransactions: userId == and source == QUICK_RESPONSE
- Collection: xpTransactions
- Fields: userId Asc, source Asc

6) xpTransactions: userId == and source == EVIDENCE_SUBMISSION
- Collection: xpTransactions
- Fields: userId Asc, source Asc

Notes:
- Single-field index on createdAt is default; leave enabled.
- If you switch to collection group queries for xpTransactions (e.g., per-user subcollections), add equivalent collection group indexes.
- Run the metrics locally; Firestore will provide direct links to create missing composite indexes as needed.

## Security Rules (Admin-only Read Access)

Ensure only admins can read the collections used by the admin metrics. Example rule sketch (adjust to your schema and claims):

```
match /databases/{database}/documents {
  function isAdmin() {
    return request.auth != null && request.auth.token.role == 'admin';
  }

  match /xpTransactions/{doc} {
    allow read: if isAdmin();
    allow write: if false; // read-only from admin dashboard
  }

  match /userAchievements/{doc} {
    allow read: if isAdmin();
    allow write: if false;
  }

  match /notifications/{doc} {
    allow read: if isAdmin();
    allow write: if false;
  }
}
```

Also add security rule unit tests to validate:
- Admin can read xpTransactions, userAchievements, notifications
- Non-admin cannot read these collections

## Performance Considerations

- Start with on-demand aggregation for 7-day window. For higher volumes:
  - Use Firestore aggregate count() for totals to reduce read cost
  - Maintain daily pre-aggregated docs (e.g., gamificationMetrics/daily/yyyy-mm-dd) and sum last 7 for the dashboard
  - Track daily unique XP recipients (set or approximate) to avoid scanning the full window when very large

## Operational Notes

- We standardized date bucketing to UTC days and zero-filled the last 7 days for consistent UI.
- The Unique XP Recipients card shows a 7-day unique total (no per-day breakdown).
- Add warn-level logs in metrics service for partial failures to improve observability.



## Updates

- Notification security rules aligned with actual document shape: allow owner or admin via `recipientId` (and legacy `userId`) fields.
- Added composite indexes used by the admin metrics queries:
  - notifications(type Asc, createdAt Desc)
  - xpTransactions(userId Asc, source Asc)
- Deployment considerations:
  - Deploy rules and indexes together to avoid transient dashboard failures:
    - firebase deploy --only firestore:rules
    - firebase deploy --only firestore:indexes
  - Security rules tests added in `src/services/__tests__/security.rules.adminGamification.test.ts`.
    - Requires dev dependency: @firebase/rules-unit-testing@3.0.4
    - Run against Firestore Emulator (CI or local): start emulator, then `npm run test:fast -- --testPathPattern=security.rules.adminGamification`.
