# TradeYa Firestore Migration Execution Guide

⚠️ **CRITICAL: Production Database Migration**

This guide provides step-by-step instructions for executing the TradeYa Firestore schema migration safely and efficiently.

## Pre-Migration Checklist

### 1. Infrastructure Readiness
- [ ] All Firestore indexes deployed and verified
- [ ] Migration compatibility services tested
- [ ] Backup strategy confirmed
- [ ] Rollback procedures validated
- [ ] Monitoring systems active

### 2. Team Preparation
- [ ] Database administrator on standby
- [ ] Development team notified
- [ ] Customer support prepared for potential issues
- [ ] Emergency contacts available

### 3. Environment Verification
```bash
# Verify indexes are ready
npm run firebase:indexes:verify:production

# Run migration compatibility tests
npm run test:migration

# Check security rules
npm run security:validate
```

## Migration Execution Steps

### Phase 1: Pre-Migration Validation

1. **Run Full Pre-Check**
   ```bash
   npm run migration:pre-check
   ```
   - Verifies indexes are ready
   - Runs compatibility tests
   - Validates data integrity

2. **Create Database Backup**
   ```bash
   # Export current database state
   firebase firestore:export gs://tradeya-backups/pre-migration-$(date +%Y%m%d-%H%M%S) --project tradeya-prod
   ```
   **📝 Record the backup ID for rollback procedures**

### Phase 2: Dry Run Execution

3. **Execute Dry Run**
   ```bash
   npm run migration:dry-run
   ```
   
   **Expected Output:**
   - Migration validation passed
   - Index readiness confirmed
   - Estimated migration time
   - Document counts and transformation previews
   - No actual data modifications

4. **Review Dry Run Results**
   - Check console output for any warnings
   - Verify estimated completion time is acceptable
   - Confirm document counts match expectations
   - Validate transformation logic is correct

### Phase 3: Live Migration Execution

5. **Enable Maintenance Mode** (Optional)
   ```bash
   # If you have a maintenance mode, enable it now
   # This prevents new data writes during migration
   ```

6. **Execute Live Migration**
   ```bash
   npm run migration:execute
   ```
   
   **⏱️ Monitor Progress:**
   - Watch console output for progress updates
   - Monitor for any error messages
   - Expected duration: 5-30 minutes depending on data size
   - Process handles retries automatically

7. **Monitor Migration Status**
   ```bash
   # In a separate terminal, monitor real-time status
   npm run migration:monitor
   ```

### Phase 4: Post-Migration Validation

8. **Validate Migration Results**
   ```bash
   npm run migration:status
   ```
   
   **Check for:**
   - ✅ Success rate > 95%
   - ✅ Data integrity maintained
   - ✅ Index performance acceptable
   - ✅ No critical errors

9. **Test Application Functionality**
   - Verify trades are loading correctly
   - Test search functionality
   - Check conversation features
   - Validate user profiles
   - Test skill-based matching

10. **Disable Maintenance Mode**
    ```bash
    # Re-enable normal application access
    ```

## Migration Commands Reference

### Pre-Migration
```bash
# Full pre-check including tests and index verification
npm run migration:pre-check

# Individual checks
npm run firebase:indexes:verify:production
npm run test:migration
npm run security:validate
```

### Migration Execution
```bash
# Dry run (safe, no changes)
npm run migration:dry-run

# Live migration (modifies database)
npm run migration:execute

# Staging environment testing
npm run migration:dry-run:staging
npm run migration:execute:staging
```

### Monitoring
```bash
# Check migration status and performance
npm run migration:monitor

# Real-time status updates
npm run migration:status
```

### Emergency Rollback
```bash
# Dry run rollback (safe, no changes)
npm run migration:rollback:dry-run

# Execute rollback (modifies database)
npm run migration:rollback:execute

# Rollback with backup restore
npm run migration:rollback:backup -- --backup-id=BACKUP_ID
```

## Success Criteria

### Migration Success Indicators
- [ ] **Success Rate ≥ 95%**: At least 95% of documents migrated successfully
- [ ] **Data Integrity**: All validation checks pass
- [ ] **Performance**: Query response times within acceptable limits
- [ ] **Functionality**: All application features working correctly
- [ ] **Zero Critical Errors**: No data corruption or loss

### Post-Migration Monitoring (24-48 hours)
- [ ] Application performance stable
- [ ] User experience unaffected
- [ ] Error rates within normal ranges
- [ ] Database performance optimized

## Troubleshooting

### Common Issues and Solutions

#### 1. Index Not Ready Error
```
Error: The query requires an index
```
**Solution:**
```bash
# Verify index status
npm run firebase:indexes:verify:production
# Wait for indexes to build (can take 10-30 minutes)
```

#### 2. Migration Timeout
```
Error: Operation timed out
```
**Solution:**
- Migration automatically retries failed batches
- Monitor progress with `npm run migration:status`
- Contact database administrator if persistent

#### 3. Data Validation Failure
```
Warning: Data integrity below 95%
```
**Solution:**
- Review migration logs for specific errors
- Run targeted fixes for failed documents
- Consider rollback if issues are widespread

#### 4. Performance Degradation
```
Warning: Query response time > 2000ms
```
**Solution:**
- Check index utilization
- Monitor for index building completion
- Consider optimizing queries if persistent

## Emergency Procedures

### When to Rollback
- Migration success rate < 90%
- Critical data integrity issues detected
- Application functionality severely impacted
- Unacceptable performance degradation

### Rollback Process
1. **Stop Migration** (if still running)
2. **Execute Rollback**
   ```bash
   npm run migration:rollback:execute
   ```
3. **Restore from Backup** (if needed)
   ```bash
   firebase firestore:import gs://tradeya-backups/BACKUP_ID --project tradeya-prod
   ```
4. **Validate Rollback Success**
5. **Notify Stakeholders**

## Migration Timeline

### Estimated Duration
- **Small Database** (< 10K documents): 5-15 minutes
- **Medium Database** (10K-100K documents): 15-45 minutes
- **Large Database** (> 100K documents): 45+ minutes

### Maintenance Window Planning
- **Preparation**: 30 minutes
- **Migration Execution**: Variable (see above)
- **Validation**: 15-30 minutes
- **Buffer Time**: 50% of estimated time

## Post-Migration Tasks

### Immediate (0-24 hours)
- [ ] Monitor application performance
- [ ] Check error logs
- [ ] Validate user reports
- [ ] Run performance benchmarks

### Short-term (1-7 days)
- [ ] Analyze migration report
- [ ] Clean up legacy fields (if migration stable)
- [ ] Update documentation
- [ ] Conduct team retrospective

### Long-term (1-4 weeks)
- [ ] Performance optimization
- [ ] Remove compatibility layer
- [ ] Archive migration artifacts
- [ ] Update monitoring dashboards

## Communication Plan

### Stakeholder Notifications

**Before Migration:**
- Database team: 48 hours notice
- Development team: 24 hours notice
- Customer support: 2 hours notice

**During Migration:**
- Progress updates every 15 minutes
- Immediate notification of any issues
- Success/failure notification upon completion

**After Migration:**
- Success confirmation
- Performance report
- Next steps communication

## Contact Information

### Emergency Contacts
- **Database Administrator**: [Contact Info]
- **Development Lead**: [Contact Info]
- **DevOps Team**: [Contact Info]
- **On-Call Engineer**: [Contact Info]

### Escalation Path
1. Database Administrator
2. Technical Lead
3. Engineering Manager
4. CTO

## Final Checklist

Before executing the migration:

- [ ] All team members notified and available
- [ ] Backup created and verified
- [ ] Rollback procedures tested
- [ ] Monitoring systems active
- [ ] Emergency contacts confirmed
- [ ] Maintenance window scheduled
- [ ] Success criteria defined
- [ ] Communication plan activated

---

**⚠️ REMEMBER: This is a production database migration. Proceed with caution and have rollback procedures ready.**

**🎯 SUCCESS METRICS:**
- Migration success rate ≥ 95%
- Zero data loss
- Application functionality maintained
- Performance within acceptable limits

For questions or issues during migration, refer to the troubleshooting section or contact the database administrator immediately.