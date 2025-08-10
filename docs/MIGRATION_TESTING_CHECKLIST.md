# Migration Testing Checklist

# Safe to develop during migration

## Pre-Migration Testing

- [x] Backup verification tests *(Explicitly tested in productionReadiness.test.ts)*
- [x] Index deployment validation  
- [x] Environment connectivity tests
- [x] Permission validation tests *(Explicitly tested in productionReadiness.test.ts)*

## During Migration Testing  

- [x] Compatibility layer tests
- [x] Data transformation tests
- [x] Rollback procedure tests
- [x] Performance regression tests

## Post-Migration Testing

- [x] Data integrity validation
- [x] Query performance benchmarks
- [x] User workflow testing
- [x] Error handling validation

## Test Categories

### Unit Tests (Safe to add)

```bash
# Test compatibility services without affecting migration
src/__tests__/migration/
  ├── dataValidation.test.ts
  ├── integrationTests.test.ts
  ├── performanceRegression.test.ts
  ├── productionMigrationEngine.test.ts
  ├── productionReadiness.test.ts  # Includes backup/permission tests
  ├── rollbackProcedures.test.ts
  ├── tradesPageMigration.test.ts
  └── tradesPageMigration.test.tsx
```

### Integration Tests (Colocated in migration/service tests)

```bash
# Test service integration without database calls
# (Colocated in migration/integrationTests.test.ts and services/__tests__/*Integration.test.ts)
```

### Performance Tests (Colocated in migration/service tests)

```bash
# Benchmark current performance for comparison
src/__tests__/migration/performanceRegression.test.ts
src/services/performance/__tests__/rumService.test.ts
src/services/performance/__tests__/week2-integration.test.ts
```

## Testing Commands (Safe during migration)

```bash
# Run tests that don't affect production
npm run test:unit
npm run test:performance
npm run test:migration-preparation

# Avoid these during migration
# npm run test:integration (touches Firebase)
# npm run test:e2e (affects live data)
```

---

## Next Steps

- All checklist items are now fully covered by explicit tests.
- Continue to review and maintain test coverage as migration evolves.

**Summary:**
- All migration testing requirements are now explicitly validated in the test suite.
- See `productionReadiness.test.ts` for backup and permission validation scenarios.
