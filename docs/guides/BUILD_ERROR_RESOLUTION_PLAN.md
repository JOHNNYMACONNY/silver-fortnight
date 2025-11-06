# Build Error Resolution Plan

This document outlines the current build errors identified in the project, categorizes them by priority, and provides a plan for their resolution. The goal is to systematically address these errors to achieve a clean build and ensure a stable foundation for implementing new features based on the project documentation.

## Current Build Errors Overview

Based on the recent `npm run build` output, the following types of errors and warnings are present:

- **TypeScript Errors:** Type/interface mismatches, missing/extra properties, incorrect imports, incorrect function signatures, component prop type mismatches.
- **Unused Code:** Unused variables and imports.
- **Test/Mock Errors:** Type mismatches or missing properties in test mocks.
- **Linter Warnings:** Other stylistic issues not strictly blocking the build but indicating potential code quality issues.

## Prioritization Strategy

We will prioritize errors based on their impact on the build process and application functionality:

1.  **High Priority:** Errors that block the build, cause runtime crashes, affect core types/interfaces, or impact shared services/utilities. These must be fixed before or early in feature implementation.
2.  **Medium Priority:** Errors primarily in test files or non-critical components that don't block the main build but should be addressed for code health and reliable testing. These can be deferred until after core features are stable.
3.  **Low Priority:** Minor linter warnings and errors in code that is planned for imminent replacement or significant refactoring. These can be addressed as part of a general cleanup phase.

## Resolution Plan

### 1. High Priority Fixes (Fix Now)

These errors require immediate attention to stabilize the codebase.

-   **Core Type/Interface Mismatches:**
    -   **Symptoms:** Errors related to `CollaborationRole`, `ChangeRequest`, `Conversation`, `ChatConversation` where properties (`filled`, `skills`, `tradeId`, `tradeName`, etc.) are reported as missing or incompatible. Type errors in test mocks related to Firestore `Timestamp`.
    -   **Action:** Align all usages, mock data, and test data with the canonical interface definitions found in `src/types/*` and service files (`src/services/firestore.ts`, `src/services/chat/chatService.ts`). This may involve adding or removing properties from types or updating code to correctly access/provide data.
    -   **Documentation Update:** Update `docs/TYPE_SYSTEM_FIXES.md` and relevant database schema documentation (e.g., `docs/COLLABORATION_ROLES_DATABASE_SCHEMA.md`) to reflect the aligned types.

-   **Required Properties Missing in Function Calls:**
    -   **Symptoms:** TypeScript errors indicating that a required property (e.g., `status` when creating a `ProjectApplication`) is missing when calling a service function.
    -   **Action:** Review the function signatures and ensure all required arguments/properties are provided with the correct type when calling the function.

-   **Incorrect Function Signatures/Arguments:**
    -   **Symptoms:** Errors where a function receives an argument of an incompatible type (e.g., `string | undefined` where `string` is expected), often seen with Firestore functions or utility helpers.
    -   **Action:** Implement null/undefined checks, provide default values, or update function signatures/callers to ensure type compatibility.

-   **Component Prop Type Mismatches:**
    -   **Symptoms:** Errors where props passed to a component do not match the component's defined prop types (e.g., issues with `RefObject` types, or missing required props).
    -   **Action:** Update component usages to pass props that match the expected types. Ensure all required props are provided.

### 2. Medium Priority Fixes (Fix After Main Implementation)

These errors are less critical and can be addressed in a subsequent phase after the core features are stable.

-   **Test/Mock Data Errors (Non-blocking):**
    -   **Symptoms:** Errors in test files related to mock data structures (e.g., properties like `toMillis` in mocks that aren't part of the actual type), but which do not prevent the build or core test execution.
    -   **Action:** Refactor test mocks to accurately represent the types they are mocking. This cleanup can happen after the main refactoring is complete.

### 3. Low Priority Fixes (Defer for Cleanup)

These errors are minor and can be addressed during a general code cleanup or as part of refactoring the affected code.

-   **Linter Warnings:**
    -   **Symptoms:** Warnings about unused variables, imports, or parameters (e.g., `'useCallback' is declared but its value is never read.` or unused imported types).
    -   **Action:** Remove unused code. This is typically a quick cleanup task for later.

-   **Errors in Deprecated/To-Be-Rewritten Code:**
    -   **Symptoms:** Errors in files or features that are explicitly marked for deprecation or are scheduled for a complete rewrite according to the implementation plan.
    -   **Action:** Defer fixing these errors until the planned refactoring takes place.

## Tracking Progress

As errors are resolved:
-   Update the relevant code files.
-   Update this `BUILD_ERROR_RESOLUTION_PLAN.md` document to mark errors as resolved.
-   Ensure related documentation files (like `TYPE_SYSTEM_FIXES.md`) are updated to reflect the final, correct type definitions and usage patterns.

By following this plan, we aim to eliminate all build errors and achieve a clean, type-safe codebase ready for further development. 