# Scripts Documentation

This directory contains over 80 utility scripts for various maintenance, migration, and testing tasks. Use this guide to find the right tool for your job.

## 🚀 Migration & Database
Critical scripts for schema evolution and data management.

| Script | Purpose | Safety Level |
|--------|---------|--------------|
| `migrate-schema.ts` | **Main Engine.** executing schema migrations (e.g., v1 -> v2). | ⚠️ High Risk |
| `rollback-migration.ts` | Emergency rollback tool if migration fails. | ⚠️ High Risk |
| `monitor-migration.ts` | Real-time dashboard for active migrations. | ✅ Safe |
| `migrateCollaborations.ts` | Specific migration for collaborations features. | ⚠️ High Risk |
| `backfill-message-participants.ts` | Optimizes old messages for new security rules. | ⚠️ High Risk |

## 🛠️ Maintenance & Fixes
One-off scripts to fix specific data issues or bugs.

| Script | Purpose |
|--------|---------|
| `fix-firestore-db-usage.ts` | Corrects DB instance usage in codebase. |
| `fix-react-context-hierarchy.ts` | Refactors context provider nesting issues. |
| `fixTechnicalDebt.ts` | Automated code cleanup utility. |
| `consolidate-user-profiles.ts` | Merges duplicate user records. |
| `cleanup-assets.cjs` | Removes unused images/media. |

## 🧪 Verification & Testing
Tools to validate system health and code quality.

| Script | Purpose |
|--------|---------|
| `verify-environment.sh` | Checks .env vars and local setup. |
| `verify-indexes.ts` | Confirms Firestore indexes are built. |
| `check-security-rules.sh` | Compiles and validates firestore.rules. |
| `run-e2e.sh` | Wrapper for Playwright E2E tests. |
| `validate-security.sh` | Comprehensive security audit suite. |

## ⚡ Optimization & Build
Scripts to improve performance and bundle size.

| Script | Purpose |
|--------|---------|
| `optimize-assets.js` | Compresses images and static files. |
| `build-optimizer.js` | Analyzes and optimizes Vite build chunks. |
| `html-head-optimizer.ts` | Optimizes critical path CSS/JS injection. |
| `analyze-asset-bloat.cjs` | Reports largest files in the project. |

## 📚 Documentation & Analysis
Tools for maintaining the codebase understanding.

| Script | Purpose |
|--------|---------|
| `docs-cli.ts` | CLI for generating/updating project docs. |
| `maintain-docs.ts` | Automated documentation maintenance. |
| `technicalDebtAnalyzer.ts` | Generates debt report. |
| `analyze-firebase-dependencies.ts` | audits Firebase usage. |

---

> [!TIP]
> Always check `package.json` scripts first. simpler aliases like `npm run db:migrate` often wrap these raw scripts.
