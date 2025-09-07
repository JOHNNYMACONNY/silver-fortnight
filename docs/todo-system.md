# TODO System (Phase 1++)

Status: Phase 1++ extensions complete (advanced CLI commands, tagging, snapshot/export, integrity scaffold, reopen window 24h, test coverage extensions).
Scope: Core lifecycle, integrity repair (basic), metrics snapshot (on demand), reopen window (24h default), duplicate prevention, ordering, archiving of completed items, advanced filtering, snapshot generation, export formats.

## 1. Overview

A minimal yet robust domain-driven TODO subsystem providing:
- Deterministic ordering (numeric `order` field normalized by integrity repair)
- Strict state transitions (Pending → In Progress → Completed → (Reopen) → Pending; Archive via batch)
- Reopen window enforcement (default 72h; configurable via service config or CLI flag)
- Duplicate active content prevention (case-insensitive)
- Persistence abstraction (memory + atomic file adapter with lock + recovery)
- Structured logging (one JSON object per line)
- Basic metrics snapshot
- CLI interface
- Integrity repair on load (normalizes order, archives duplicate active content)

## 2. Data Model

Entity: Todo
Fields (selected):
- id (uuid)
- content (string, trimmed)
- status: pending | in_progress | completed | archived
- order (number, dense sequence starting at 0)
- createdAt / updatedAt (ISO)
- completedAt (ISO | undefined)
- archivedAt (ISO | undefined)
- tags (string[]; always present; normalized: trim + lower-case + remove empties + de-duplicate; Phase 1++ extension for future search/group/export features)

Domain Errors:
- DuplicateContentError
- InvalidTransitionError
- ReopenWindowExpiredError
- ReorderValidationError

## 3. State Machine

Allowed:
- pending -> in_progress (start)
- in_progress -> completed (done)
- completed -> pending (reopen; within configured time window)
- completed -> archived (batch archive)
- (Any) content update (excluding status mutation directly)

Disallowed examples:
- pending -> completed (must pass through in_progress)
- completed -> in_progress (must reopen first, then start again)
- archived -> any active state (immutable terminal state for Phase 1)

Direct status mutation via generic update is blocked to force explicit methods.

## 4. Ordering & Reordering

- `order` assigned sequentially at insertion (append semantics).
- `reorderTodos(ids: string[])` requires:
  * All non-archived todos covered exactly once.
  * No duplicates.
- Integrity repair normalizes order after load (0..n-1) and logs summary event.

## 5. Integrity Repair (Phase 1++)

Currently implemented actions:
- normalize_order: Ensures 0..n-1 dense sequence for active todos
- archive_duplicate: Archives duplicate active content (case-insensitive), emits summary event

Integrity check scaffold (CLI `integrity` command):
- Non-mutating validation returning metrics + empty anomaly list
- Placeholder for future rich anomaly detection (e.g., timestamp validation, order gaps)
- Emits integrity_repair event with summary object on load-time repairs

### Integrity Anomaly Classification

The system classifies integrity anomalies into the following categories:

#### Data Integrity Anomalies
- **DUPLICATE_ACTIVE_CONTENT**: Multiple active todos with identical content (case-insensitive)
- **ORDER_GAP**: Missing order values in the 0..n-1 sequence for active todos
- **INVALID_STATE_TRANSITION**: Todo in an invalid state based on business rules
- **MISSING_REQUIRED_FIELD**: Required fields (id, content, status) are missing or invalid

#### Timestamp Anomalies
- **TIMESTAMP_DRIFT**: Created/updated timestamps outside reasonable bounds
- **FUTURE_TIMESTAMP**: Timestamps set to future dates
- **NEGATIVE_DURATION**: Completed timestamp before created timestamp

#### Structural Anomalies
- **MALFORMED_DATA**: JSON structure corruption or invalid field types
- **ORPHANED_REFERENCE**: References to non-existent related entities
- **INCONSISTENT_METADATA**: Metadata fields don't match expected schema

### Automatic Repair Procedures

#### Immediate Load-Time Repairs
- **Order Normalization**: Automatically reorders active todos to 0..n-1 sequence
- **Duplicate Archival**: Archives duplicate active content, preserving the most recently updated
- **Timestamp Correction**: Adjusts out-of-bounds timestamps to current time

#### Configurable Repair Actions
- **Severity-Based Processing**: Repairs categorized by impact level (low/medium/high)
- **Dry-Run Mode**: Preview repairs without applying changes
- **Selective Repair**: Apply only specific repair types
- **Rollback Support**: Revert repairs if issues detected post-application

#### Repair Logging and Auditing
- **Detailed Event Emission**: Structured JSON events for each repair action
- **Before/After Snapshots**: Capture state changes for audit trails
- **Repair Metrics**: Track repair success rates and anomaly recurrence

Future (Phase >1) expansions (TODO):
- Rich classification of anomaly types (timestamp drift, malformed data)
- Auto-detection of out-of-range timestamps
- Snapshot diff emission for repair tracking
- Scheduled periodic repairs with configurable severity levels

## 6. Reopen Window

- Default: 24 hours (configurable via `TodoServiceConfig.reopenWindowMs` or CLI `--reopenWindowHours`).
- If exceeded: ReopenWindowExpiredError.
- When reopened: status -> pending, completedAt retained for history (new completion overwrites on re-complete).

## 7. Metrics

`computeMetrics` returns:
- total
- active (pending + in_progress)
- completed
- archived
- completionRatio (completed / total; 0 if total = 0)

Called on demand via service / CLI `metrics` command.
TODO (Phase >1): periodic emission, historical trend storage, moving averages.

## 8. Logging

Structured JSON events (namespace: todo_system, phase=phase1) including:
- todo_added
- todo_updated
- todo_started
- todo_completed
- todo_reopened
- todo_reordered
- archive_completed_batch
- integrity_repair (summary object)

Output: console.log single line JSON (suitable for piping).

TODO (Phase >1):
- Correlation IDs
- Log level controls
- External sink adapters

## 8.1 Event Stream (Phase 1++)

Current event union covers all lifecycle transitions and operations:
- todo_added: New todo creation
- todo_updated: Content/tags modification (no status change)
- todo_started: pending -> in_progress
- todo_completed: in_progress -> completed
- todo_reopened: completed -> pending (within window)
- todo_reordered: Order sequence update
- archive_completed_batch: Bulk archive of completed todos
- integrity_repair: Load-time normalization summary

Events are emitted synchronously on successful operations, suitable for audit trails or external integrations. No metrics_snapshot event currently emitted (placeholder for future periodic metrics logging).

## 9. Storage Layer

Adapters:
- MemoryStorageAdapter (ephemeral)
- FileStorageAdapter
  * Atomic write via temp file + rename
  * Lock file (.cache/todos.lock) with retry/backoff
  * Recovery if crash leaves temp file
  * Compact JSON
  * Versioned persistence wrapper (v1): persists {"version":1,"todos":[...]} for forward compatibility. Loader remains backward compatible with legacy plain array files.

TODO (Phase >1):
- Snapshot / journal separation
- Pluggable compression
- Multi-process advisory locking improvements
- Add validation / quarantine strategy for malformed versioned payloads

## 10. CLI (Phase 1++)

Executable: `scripts/todo` (shim tries ts-node then dist build).

Commands (current):
| Command | Description |
|---------|-------------|
| add <content...> [--tags=tag1,tag2] | Add a new todo (tags normalized) |
| update <id> [--content=..] [--tags=..] | Update content and/or tags (no direct status change) |
| list / search | List todos with optional filters |
| start <id> | pending -> in_progress |
| done <id> | in_progress -> completed |
| reopen <id> | completed -> pending (within window) |
| reorder <id1,id2,...> | Reorder non-archived (active + completed) |
| metrics | Show metrics snapshot |
| archive / archive-completed | Archive all completed todos |
| export --format=md|json [--includeArchived] | Export snapshot to stdout |
| snapshot [--includeArchived] | Write markdown to memory-bank/todo.md |
| integrity | Non-mutating integrity check scaffold |
| repair | Perform automatic integrity repairs |
| schedule-repair | Schedule periodic integrity repairs |
| cancel-repair | Cancel scheduled integrity repair |
| repair-history | View integrity repair history |
| help | Display help |

Core Flags:
- `--json` structured machine output
- `--file=path` choose storage file (default todo-data.json)
- `--memory` use in-memory adapter
- `--reopenWindowHours=N` override window (hours)
- `--tags=tag1,tag2` supply tags for add/update
- `--status=pending|in_progress|completed|archived` filter (list/search)
- `--tag=tag` single tag filter
- `--text=substr` substring (case-insensitive) filter
- `--includeArchived` include archived in list/export/snapshot
- `--format=md|json` export format

Exit Codes:
- 0 success
- 2 domain error (expected business rule violation)
- 1 unexpected / infrastructure

### Export & Snapshot (Phase 1++)
- `export --format=md|json [--includeArchived]`: Writes structured output to stdout
  - Markdown: Grouped by status with metrics header and optional Tag Index
  - JSON: Full todo objects array
- `snapshot [--includeArchived]`: Generates markdown snapshot to `memory-bank/todo.md`
  - Includes metrics, status groupings, tag index (alphabetical, case-insensitive)
  - Archived todos appended separately when `--includeArchived` used
  - Creates memory-bank directory if absent

Snapshot generation details:
- Metrics: total, active, completed, archived, completion ratio
- Status sections: Pending, In Progress, Completed (alphabetical by content)
- Tag Index: Sorted tags with associated todo IDs
- Internal ordering: Respects current order field for active todos

### Integrity Command (Phase 1++)
- `integrity`: Non-mutating check returning current metrics + anomaly list (currently empty scaffold)
- Future: Rich anomaly detection (timestamp validation, order consistency, data integrity)
- Emits integrity_repair event on load-time corrections

### Filtering Semantics
- Filters are AND-combined (status + tag + text).
- Text filter performs case-insensitive substring on normalized content.

TODO (Phase >1):
- watch (live subscription printing)
- diff / history views
- enhanced integrity anomaly detection

## 11. Public API (Barrel)

`src/todo/index.ts` exports:
- Models, errors, creation helpers
- Repository (for advanced usages/tests)
- Service + factory
- Storage adapters

TODO (Phase >1):
- Snapshot utilities
- Extended integrity diagnostics
- Event subscription helpers

## 12. Testing Plan (Pending Implementation)

Planned test files:
- testUtils.ts (service factory + helper assertions)
- add.test.ts (creation + duplicate prevention)
- transitions.test.ts (valid/invalid state changes, reopen window)
- metrics.test.ts (ratios & counts)
- reorder.test.ts (valid reorder + validation errors)

TODO (Phase >1):
- Concurrency scenarios (simulated)
- File adapter persistence durability
- Integrity repair anomaly matrix

## 13. Future Enhancements (Backlog / TODO Markers)

1. Snapshot generation & restoration (versioned)
2. Periodic metrics emission with retention
3. Bulk operations (batch add, batch update)
4. Extended integrity classification + auto remediation severity
5. External subscriber / event bus integration
6. Correlation & trace IDs
7. Rich audit trail & diff history
8. Pluggable serialization strategies
9. Performance benchmarks & load tests
10. Multi-repository sharding (large scale scenario)

## 14. Usage Quickstart

Add a task:
```
scripts/todo add "Write documentation"
```

Start:
```
scripts/todo start <id>
```

Complete:
```
scripts/todo done <id>
```

Metrics:
```
scripts/todo metrics
```

Reorder:
```
scripts/todo reorder id1,id2,id3
```

## 15. Design Principles

- Deterministic side effects (ordering, transitions)
- Fail fast on domain violations
- Isolation between domain logic and persistence
- Structured, machine-parseable logs
- Extensibility via adapters and future snapshot pipeline
- Incremental integrity repair to keep load path safe

## 16. Known Limitations (Phase 1)

- No pagination (not needed for early scale)
- No concurrency conflict resolution beyond simple lock file
- No partial success batch semantics
- Reopen window immutable per service instance (no dynamic reload)
- No soft-deletion separate from archived state
- No user / ownership dimension

## 17. Compliance & Safety TODOs

- Schema versioning implemented (FileStorageAdapter writes {"version":1,"todos":[...]}; legacy plain arrays still accepted)
- TODO: Add validation guard / corruption quarantine for future backward incompatible changes

---

Phase 1 complete components documented above.  
All TODO markers are intentionally placed to guide Phase 2+ roadmap evolution.
