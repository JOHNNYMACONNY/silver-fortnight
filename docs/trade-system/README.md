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

## Related Documentation

- Features: `../features/`
- Gamification integration: `../gamification/`
- Testing: `../testing/`

