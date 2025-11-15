# Trade System Documentation

This directory contains all documentation related to the TradeYa trade lifecycle and proposal system.

## Core Trade System

### Lifecycle Management
- **[TRADE_LIFECYCLE_SYSTEM.md](./TRADE_LIFECYCLE_SYSTEM.md)** - Complete trade lifecycle documentation
- **[TRADE_LIFECYCLE_ENHANCEMENTS_UPDATE.md](./TRADE_LIFECYCLE_ENHANCEMENTS_UPDATE.md)** - Recent enhancements
- **[TRADE_LIFECYCLE_INTEGRATION_PLAN.md](./TRADE_LIFECYCLE_INTEGRATION_PLAN.md)** - Integration plan
- **[TRADE_LIFECYCLE_TESTING_PLAN.md](./TRADE_LIFECYCLE_TESTING_PLAN.md)** - Testing strategy

### Confirmation & Resolution
- **[TRADE_CONFIRMATION_SYSTEM.md](./TRADE_CONFIRMATION_SYSTEM.md)** - Confirmation system overview
- **[TRADE_CONFIRMATION_TECHNICAL.md](./TRADE_CONFIRMATION_TECHNICAL.md)** - Technical implementation
- **[TRADE_AUTO_RESOLUTION_SYSTEM.md](./TRADE_AUTO_RESOLUTION_SYSTEM.md)** - Auto-resolution system

### Proposals
- **[TRADE_PROPOSAL_DOCUMENTATION_INDEX.md](./TRADE_PROPOSAL_DOCUMENTATION_INDEX.md)** - Proposal docs index
- **[TRADE_PROPOSAL_SYSTEM_COMPREHENSIVE_AUDIT_REPORT.md](./TRADE_PROPOSAL_SYSTEM_COMPREHENSIVE_AUDIT_REPORT.md)** - System audit
- **[TRADE_PROPOSAL_SYSTEM_FIXES.md](./TRADE_PROPOSAL_SYSTEM_FIXES.md)** - Applied fixes
- **[TRADE_PROPOSAL_SYSTEM_FIXES_UPDATE.md](./TRADE_PROPOSAL_SYSTEM_FIXES_UPDATE.md)** - Fix updates
- **[TRADE_PROPOSAL_UI_AUDIT_REPORT.md](./TRADE_PROPOSAL_UI_AUDIT_REPORT.md)** - UI audit
- **[TRADE_PROPOSAL_UI_IMPROVEMENTS.md](./TRADE_PROPOSAL_UI_IMPROVEMENTS.md)** - UI improvements

### Evidence & Timeline
- **[TRADE_EVIDENCE_IMPLEMENTATION_PROGRESS.md](./TRADE_EVIDENCE_IMPLEMENTATION_PROGRESS.md)** - Evidence implementation
- **[TRADE_STATUS_TIMELINE_ENHANCEMENTS.md](./TRADE_STATUS_TIMELINE_ENHANCEMENTS.md)** - Timeline enhancements

## Trade States

The trade system supports the following states:
1. **pending** - Initial proposal
2. **accepted** - Trade accepted by all parties
3. **in_progress** - Trade is active
4. **evidence_submitted** - Evidence provided
5. **completed** - Successfully completed
6. **cancelled** - Cancelled by user
7. **disputed** - Under dispute resolution

## Key Features

- Multi-party trade support
- Evidence submission and gallery
- Auto-resolution after timeout
- Dispute resolution workflow
- Status timeline visualization
- Real-time updates via Firestore listeners

## Recent Updates

- **2025-11-10** – Hardened the trades listing experience:
  - Join/leave actions now resolve trades directly by document ID and respect both array- and object-based participant schemas.
  - Skill filters normalize object and string skill entries, preventing mismatched labels and empty filter results.
  - Trade search gracefully handles missing descriptions to avoid runtime errors in mixed data sets.
- **2025-11-11** – Synced trade status filters and legacy skill rendering:
  - Pending evidence and confirmation states now surface under the canonical “In Progress” filter and can be targeted individually across the UI.
  - Trade cards normalize string-based skill entries so legacy trades render consistent badge labels.
- **2025-11-14** – Profile tabs now stay in sync with refreshed trade data:
  - Trade and collaboration profile hooks trigger fresh loads after `refetch()` calls instead of remaining empty.
  - Participant lookups honor the normalized `participants` object/array schema alongside legacy `participantId` fields.
  - Service queries aggregate participant matches across both schemas, keeping historical and migrated trades visible.
  - Profile filtering now runs participant normalization on the client, so trades returned via array-of-object participant schemas remain visible under the “Yours” tab.
  - The normalization helper now extracts IDs from nested participant maps (e.g., reviewer/member objects) while ignoring plain display names, preventing regressions as new participant roles ship.

## Related Documentation

- Features: `../features/`
- Gamification integration: `../gamification/`
- Testing: `../testing/`

