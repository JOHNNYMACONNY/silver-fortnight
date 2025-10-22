# TradeYa Documentation CLI Usage Guide

**Purpose:** Comprehensive guide for optimal timing and usage of TradeYa Documentation CLI commands  
**Created:** June 9, 2025  
**Last Updated:** June 9, 2025  
**Priority:** 🔥 CRITICAL - Developer Workflow Integration

---

## 📋 Overview

This guide provides detailed timing recommendations and usage patterns for the TradeYa Documentation CLI system. These commands are designed to maintain documentation quality, prevent documentation debt, and ensure critical information (especially Firestore-related) is always accessible.

### **Available Commands Summary**

| Command                  | Purpose                   | Frequency         | Use Case                         |
| ------------------------ | ------------------------- | ----------------- | -------------------------------- |
| `npm run docs:dashboard` | Interactive dashboard     | As needed         | General documentation management |
| `npm run docs:health`    | Health monitoring         | Daily             | System health checks             |
| `npm run docs:search`    | Search documentation      | As needed         | Finding specific information     |
| `npm run docs:create`    | Create from templates     | Per feature       | Consistent document creation     |
| `npm run docs:validate`  | Validate cross-references | Pre-commit        | Ensure documentation integrity   |
| `npm run docs:firestore` | Firestore priority check  | Before migrations | Protect critical documents       |
| `npm run docs:archive`   | Safe archival analysis    | Weekly            | Documentation maintenance        |

---

## 🎯 Command-by-Command Usage Guide

### **1. `npm run docs:dashboard` - Interactive Documentation Hub**

**When to Use:**

- **Daily workflow start** - Quick overview of documentation status
- **New team member onboarding** - Familiarization with documentation structure
- **Project planning sessions** - Understanding current documentation state
- **After major feature implementation** - Comprehensive documentation review

**Optimal Timing:**

- **Morning standup preparation** (5 minutes before meetings)
- **End-of-sprint reviews** (during retrospectives)
- **Quarterly documentation audits** (monthly team reviews)

**Developer Scenarios:**

```bash
# Morning routine for tech leads
npm run docs:dashboard
# → Navigate to "Health Dashboard" for overnight changes
# → Check "Recent Documents" for team activity

# Feature completion workflow
npm run docs:dashboard
# → Create implementation summary via "Create New Document"
# → Validate references via "Validate References"
```

**Expected Outcome:** Interactive menu with 9 options for comprehensive documentation management.

---

### **2. `npm run docs:health` - Critical System Monitoring**

**When to Use:**

- **Daily health checks** (automated in CI/CD)
- **Before major releases** (release readiness verification)
- **After documentation changes** (impact assessment)
- **Weekly team meetings** (status reporting)

**Optimal Timing:**

- **9:00 AM daily** (automated via GitHub Actions)
- **30 minutes before release meetings** (health verification)
- **After each pull request merge** (continuous monitoring)
- **Friday afternoon** (weekly health report)

**Warning Signs That Trigger This Command:**

- Failed pull request checks
- Reports of missing documentation
- Team confusion about system status
- Preparing for client demos

**Developer Scenarios:**

```bash
# Release readiness check
npm run docs:health
# Look for: 🟢 All systems healthy, recent updates, no critical issues

# Post-incident analysis
npm run docs:health
# Verify: Documentation reflects recent system changes
```

**Expected Outcome:** Comprehensive health dashboard with metrics on document freshness, completeness, and system status.

---

### **3. `npm run docs:search` - Fast Information Discovery**

**When to Use:**

- **During code reviews** (finding related documentation)
- **Bug investigation** (locating implementation details)
- **Feature planning** (checking existing documentation)
- **Client support** (finding specific procedures)

**Optimal Timing:**

- **Immediately when you need information** (on-demand)
- **Before implementing similar features** (research phase)
- **During pair programming sessions** (collaborative research)
- **When writing new documentation** (avoiding duplication)

**Developer Scenarios:**

```bash
# Code review preparation
npm run docs:search
# Search: "authentication" to find related security docs

# Bug investigation
npm run docs:search
# Search: "firebase rules" to understand security implementation

# Feature planning
npm run docs:search
# Search: "gamification" to find existing system docs
```

**Expected Outcome:** Fast, full-text search with context snippets and file locations.

---

### **4. `npm run docs:create` - Consistent Document Creation**

**When to Use:**

- **After feature implementation** (implementation summaries)
- **Before major refactoring** (technical guides)
- **Firestore schema changes** (migration documentation)
- **New team member joins** (onboarding documents)

**Optimal Timing:**

- **Within 24 hours of feature completion** (immediate documentation)
- **During feature planning** (technical specification creation)
- **Before database migrations** (critical procedure documentation)
- **At sprint start** (planning documentation)

**Template Selection Guide:**

- **Implementation Summary** → Use after completing any feature
- **Technical Guide** → Use for complex procedures or APIs
- **Firestore Guide** → Use for any database-related changes

**Developer Scenarios:**

```bash
# Post-feature implementation
npm run docs:create
# Select: "Implementation Summary"
# File name: "GAMIFICATION_NOTIFICATIONS_IMPLEMENTATION_SUMMARY"

# Pre-migration planning
npm run docs:create
# Select: "Firestore Migration Guide"
# File name: "USER_SCHEMA_MIGRATION_PHASE_2"
```

**Expected Outcome:** Professionally structured document with consistent formatting and placeholder content.

---

### **5. `npm run docs:validate` - Documentation Integrity Protection**

**When to Use:**

- **Pre-commit routine** (automated via git hooks)
- **Before pull request creation** (quality assurance)
- **After documentation restructuring** (link verification)
- **Weekly maintenance** (proactive issue detection)

**Optimal Timing:**

- **Automatically on git commit** (via pre-commit hooks)
- **Before creating pull requests** (manual verification)
- **After moving or renaming files** (immediate validation)
- **Every Tuesday morning** (weekly maintenance routine)

**Critical Scenarios:**

- Large documentation refactoring
- Moving files between directories
- Updating implementation summaries
- Before major releases

**Developer Scenarios:**

```bash
# Pre-commit validation (automated)
git commit -m "Update auth docs"
# Automatically runs: npm run docs:validate

# Manual verification after file restructuring
npm run docs:validate
# Check: All cross-references valid, no broken links

# Pre-release verification
npm run docs:validate
# Ensure: Documentation references are accurate for release
```

**Expected Outcome:** Report of broken links, invalid references, and suggested fixes.

---

### **6. `npm run docs:firestore` - Critical Document Protection**

**When to Use:**

- **Before ANY Firestore migration** (mandatory safety check)
- **Before database schema changes** (critical procedure verification)
- **During emergency procedures** (rapid access to critical docs)
- **New database team member onboarding** (critical document familiarization)

**Optimal Timing:**

- **5 minutes before migration execution** (final safety check)
- **During migration planning meetings** (procedure verification)
- **When database errors occur** (emergency reference access)
- **Before any schema modification** (impact assessment)

**🔥 CRITICAL USE CASES:**

- Database migration procedures
- Schema modification planning
- Emergency rollback procedures
- Performance optimization changes

**Developer Scenarios:**

```bash
# Pre-migration safety check (MANDATORY)
npm run docs:firestore
# Verify: All critical Firestore docs are present and protected

# Emergency database issue
npm run docs:firestore
# Quick access: Migration procedures, rollback plans, emergency contacts

# New DBA onboarding
npm run docs:firestore
# Review: All critical database documentation
```

**Expected Outcome:** Status report of all Firestore-critical documents with protection verification.

---

### **7. `npm run docs:archive` - Proactive Maintenance**

**When to Use:**

- **Weekly documentation cleanup** (every Friday afternoon)
- **Before major releases** (reducing documentation noise)
- **Quarterly reviews** (comprehensive maintenance)
- **When documentation exceeds 100+ files** (performance optimization)

**Optimal Timing:**

- **Every Friday at 4:00 PM** (end-of-week cleanup)
- **Last week of each sprint** (sprint boundary maintenance)
- **Before quarterly reviews** (preparing clean documentation set)
- **When onboarding new team members** (reducing overwhelming documentation)

**Safety Protocols:**

- **ALWAYS run dry-run first** (`npm run docs:archive`)
- **Review candidates carefully** before execution
- **Never run during active development** (avoid disrupting workflows)
- **Coordinate with team** before major archival operations

**Developer Scenarios:**

```bash
# Weekly maintenance (safe dry-run)
npm run docs:archive
# Review: Archive candidates, ensure no critical docs included

# Quarterly cleanup (after team review)
npm run docs:archive:execute
# Execute: Only after team approval and dry-run review

# Pre-release cleanup
npm run docs:archive
# Clean: Remove outdated documentation before release
```

**Expected Outcome:** List of archival candidates with safety analysis and metadata preservation.

---

## 🔄 Developer Workflow Integration

### **Daily Developer Routine**

#### **Morning Startup (5 minutes)**

```bash
# 1. Quick health check
npm run docs:health

# 2. If new to project or returning from vacation
npm run docs:dashboard
# → Navigate to "Recent Documents"
# → Review team activity
```

#### **During Development**

```bash
# When researching existing functionality
npm run docs:search
# Search for relevant implementation details

# When implementing new features
npm run docs:create
# Create implementation summary immediately after completion
```

#### **Pre-Commit Routine (Automated)**

```bash
# Automatically triggered on git commit
git commit -m "Your commit message"
# Runs: npm run docs:validate (via pre-commit hooks)
```

---

### **Weekly Team Routine**

#### **Monday - Planning**

```bash
# Tech lead reviews documentation health
npm run docs:health
# Check for any weekend automation alerts

# Team searches for relevant documentation
npm run docs:search
# Research for sprint planning
```

#### **Friday - Maintenance**

```bash
# Documentation cleanup
npm run docs:archive  # Dry-run review
# Team reviews archive candidates

# Health verification
npm run docs:health
# Ensure weekly changes are properly documented
```

---

### **Pre-Release Workflow**

#### **1 Week Before Release**

```bash
# Comprehensive validation
npm run docs:validate
# Fix any broken references

# Create release documentation
npm run docs:create
# Document release procedures and changes
```

#### **24 Hours Before Release**

```bash
# Final health check
npm run docs:health
# Ensure all systems documented and healthy

# Firestore safety check (if applicable)
npm run docs:firestore
# Verify all critical procedures documented
```

---

### **Emergency Procedures**

#### **Database Emergency**

```bash
# Immediate access to critical procedures
npm run docs:firestore
# Quick access to rollback and emergency procedures

# Search for specific emergency procedures
npm run docs:search
# Search: "rollback", "emergency", "restore"
```

#### **Documentation Emergency (Broken Links/Missing Docs)**

```bash
# Comprehensive validation
npm run docs:validate
# Identify all broken references

# Health assessment
npm run docs:health
# Understand scope of documentation issues
```

---

## 👥 Role-Based Usage Patterns

### **For Software Engineers**

#### **Daily Usage**

- `npm run docs:search` - When researching implementation details
- `npm run docs:create` - After implementing features
- `npm run docs:validate` - Before commits (automated)

#### **Weekly Usage**

- `npm run docs:health` - Monday morning status check
- `npm run docs:dashboard` - Sprint planning research

#### **As-Needed Usage**

- `npm run docs:firestore` - Before any database work

### **For Tech Leads**

#### **Daily Usage***

- `npm run docs:health` - Morning team status check
- `npm run docs:dashboard` - Team activity monitoring

#### **Weekly Usage***

- `npm run docs:archive` - Friday maintenance (dry-run)
- `npm run docs:validate` - Pre-release validation

#### **Monthly Usage**

- `npm run docs:dashboard` - Comprehensive team review
- Full documentation audit workflow

### **For DevOps/Database Engineers**

#### **Before Every Database Operation**

- `npm run docs:firestore` - Critical procedure verification
- `npm run docs:search` - Procedure research

#### **Weekly Usage****

- `npm run docs:create` - Document new procedures
- `npm run docs:validate` - Ensure procedure documentation integrity

### **For Documentation Maintainers**

#### **Daily Usage****

- `npm run docs:health` - System monitoring
- `npm run docs:dashboard` - Content management

#### **Weekly Usage*****

- `npm run docs:archive` - Content cleanup
- `npm run docs:validate` - Quality assurance

#### **Monthly Usage***

- Comprehensive documentation audit
- Template updates and improvements

---

## ⚡ Quick Reference Commands

### **Immediate Actions**

```bash
# Emergency database access
npm run docs:firestore

# Find specific information
npm run docs:search

# Quick health check
npm run docs:health
```

### **Weekly Maintenance**

```bash
# Monday morning routine
npm run docs:health && npm run docs:dashboard

# Friday afternoon cleanup
npm run docs:archive  # Review only
```

### **Feature Development**

```bash
# Research phase
npm run docs:search

# Implementation phase
# (develop feature)

# Documentation phase
npm run docs:create

# Validation phase
npm run docs:validate
```

---

## 🚨 Warning Signs & Trigger Conditions

### **When to Run `npm run docs:health`**

- ❌ Failed CI/CD checks
- 🟡 Team reports confusion about system status
- 📅 Daily automated routine (9 AM)
- 🚀 Before demos or client presentations
- 📊 Weekly team meetings

### **When to Run `npm run docs:firestore`**

- 🔥 **MANDATORY before ANY database migration**
- ⚠️ Database performance issues
- 🆘 Emergency database procedures needed
- 👤 New database engineer onboarding
- 📋 Migration planning meetings

### **When to Run `npm run docs:validate`**

- 📝 After documentation restructuring
- 🔄 Before creating pull requests
- 📁 After moving/renaming files
- 🚀 Pre-release validation
- 📅 Weekly quality assurance

### **When to Run `npm run docs:archive`**

- 📈 Documentation exceeds 100+ files
- 🗓️ Weekly maintenance routine
- 👥 Before team onboarding (reduce overwhelm)
- 🚀 Pre-release cleanup
- 📊 Quarterly documentation review

---

## 🔄 Integration with Development Practices

### **Git Workflow Integration**

#### **Pre-Commit Hooks** (Automatic)

```bash
# Configured in .husky/pre-commit
git commit -m "Update feature docs"
# Automatically runs: npm run docs:validate
```

#### **Pull Request Workflow**

```bash
# Before creating PR
npm run docs:validate  # Ensure no broken links
npm run docs:health    # Verify documentation quality

# In PR description, include:
# - Which documents were updated
# - Any new documentation created
# - Validation results
```

### **CI/CD Pipeline Integration**

#### **Daily Automated Checks** (GitHub Actions)

- `npm run docs:health` - Daily at 9:00 AM
- `npm run docs:validate` - On every PR
- `npm run docs:firestore` - Before any deployment to production

#### **Weekly Automated Maintenance**

- `npm run docs:archive` (dry-run only) - Friday afternoons
- Comprehensive health report generation
- Team notification of documentation status

### **Sprint Integration**

#### **Sprint Planning**

- Use `npm run docs:search` to research existing functionality
- Use `npm run docs:dashboard` to review current documentation state
- Plan documentation tasks alongside development tasks

#### **Sprint Execution**

- Use `npm run docs:create` immediately after feature completion
- Use `npm run docs:validate` before each commit

#### **Sprint Review**

- Use `npm run docs:health` to assess sprint documentation impact
- Use `npm run docs:archive` to clean up outdated sprint artifacts

---

## 📊 Performance & Best Practices

### **Command Execution Times**

- `npm run docs:search` - ~1 second (instant feedback)
- `npm run docs:health` - ~5 seconds (comprehensive analysis)
- `npm run docs:validate` - ~3 seconds (reference checking)
- `npm run docs:create` - ~30 seconds (interactive creation)
- `npm run docs:firestore` - ~2 seconds (priority check)
- `npm run docs:archive` - ~10 seconds (safety analysis)
- `npm run docs:dashboard` - Interactive (user-driven timing)

### **Resource Usage Guidelines**

- Run during low-activity periods for `docs:archive`
- Use `docs:search` frequently without performance concern
- Schedule `docs:health` during daily standups
- Batch `docs:validate` with other quality checks

### **Team Coordination**

- Announce before running `docs:archive:execute`
- Coordinate `docs:firestore` checks with database team
- Share `docs:health` results in daily standups
- Document any manual interventions needed

---

## 🔮 Advanced Usage Patterns

### **Automated Monitoring Setup**

```bash
# Create a daily routine script
#!/bin/bash
echo "📊 Daily Documentation Health Check"
npm run docs:health

if [ $? -ne 0 ]; then
  echo "⚠️  Documentation issues detected"
  npm run docs:validate
  npm run docs:firestore
fi
```

### **Team Integration Script**

```bash
# Weekly team maintenance
#!/bin/bash
echo "🗓️  Weekly Documentation Maintenance"
npm run docs:health          # Monday health check
npm run docs:validate        # Wednesday validation
npm run docs:archive         # Friday cleanup (dry-run)
```

### **Release Preparation Checklist**

```bash
# Pre-release documentation verification
#!/bin/bash
echo "🚀 Release Documentation Checklist"
npm run docs:health    && echo "✅ Health check passed" || echo "❌ Health issues"
npm run docs:validate  && echo "✅ Validation passed" || echo "❌ Validation failed"
npm run docs:firestore && echo "✅ Firestore docs verified" || echo "❌ Firestore issues"
```

---

## 📚 Troubleshooting & Common Issues

### **Command Not Working**

```bash
# Verify CLI installation
which npx tsx
npm list tsx

# Check script permissions
ls -la scripts/docs-cli.ts
ls -la scripts/maintain-docs.ts
```

### **Performance Issues**

```bash
# Clear any caches
npm run docs:health --clear-cache

# Reduce scope for large repositories
npm run docs:archive --limit 50
```

### **Integration Issues**

```bash
# Verify pre-commit hooks
ls -la .husky/pre-commit

# Test automated validation
npm run docs:validate --verbose
```

---

## 🎯 Success Metrics & KPIs

### **Documentation Health Indicators**

- ✅ **Green Health Status** - All systems operational
- 📅 **Recent Activity** - Documents updated within 7 days
- 🔗 **Valid References** - No broken internal links
- 🔥 **Firestore Protection** - Critical documents verified

### **Team Productivity Metrics**

- ⏱️ **Research Time** - Reduced time finding information
- 📝 **Documentation Completeness** - All features documented
- 🔄 **Validation Success Rate** - Clean commits without broken references
- 🚀 **Release Confidence** - Documentation ready for releases

### **Quality Assurance Metrics**

- 🎯 **Accuracy** - Cross-references valid and current
- 📊 **Completeness** - Implementation summaries for all features
- 🔒 **Safety** - Firestore procedures documented and protected
- 🧹 **Maintenance** - Regular cleanup of outdated content

---

## 📞 Support & Resources

### **Getting Help**

- Use `npm run docs:dashboard` → "Contribution Guide" for detailed standards
- Check `docs/AUTOMATED_DOCUMENTATION_MAINTENANCE_IMPLEMENTATION_SUMMARY.md` for system details
- Review `scripts/docs-cli.ts` for implementation details

### **Emergency Contacts**

- **Documentation System Issues:** TradeYa Development Team
- **Firestore Documentation:** Database Migration Team
- **CI/CD Integration:** DevOps Team
- **CLI Tool Problems:** Create GitHub issue with `documentation` label

### **Related Documentation**

- [`AUTOMATED_DOCUMENTATION_MAINTENANCE_IMPLEMENTATION_SUMMARY.md`](AUTOMATED_DOCUMENTATION_MAINTENANCE_IMPLEMENTATION_SUMMARY.md) - System architecture
- [`FIRESTORE_MIGRATION_IMPLEMENTATION_GUIDE.md`](FIRESTORE_MIGRATION_IMPLEMENTATION_GUIDE.md) - Critical procedures
- [`COMPREHENSIVE_OPTIMIZATION_MASTER_PLAN.md`](COMPREHENSIVE_OPTIMIZATION_MASTER_PLAN.md) - Overall project structure

---

## 🚀 Quick Start Checklist

### **For New Team Members**

- [ ] Run `npm run docs:dashboard` to familiarize with system
- [ ] Execute `npm run docs:health` to understand current status
- [ ] Practice `npm run docs:search` with team-relevant terms
- [ ] Create test document using `npm run docs:create`
- [ ] Review Firestore documentation with `npm run docs:firestore`

### **For Project Setup**

- [ ] Verify all npm scripts are available in `package.json`
- [ ] Test CLI functionality with `npm run docs:dashboard`
- [ ] Configure pre-commit hooks for automated validation
- [ ] Set up daily health monitoring in CI/CD
- [ ] Train team on command usage patterns

### **For Daily Workflow**

- [ ] Morning: `npm run docs:health` (quick status)
- [ ] Research: `npm run docs:search` (as needed)
- [ ] Development: `npm run docs:create` (after features)
- [ ] Commits: `npm run docs:validate` (automatic)
- [ ] Maintenance: `npm run docs:archive` (weekly dry-run)

---

**🤖 DOCUMENTATION CLI USAGE GUIDE - PRODUCTION READY**  
**Last Updated:** June 9, 2025  
**Maintained By:** TradeYa Documentation Team  
**Status:** 🟢 Active for 7 CLI Commands

---

> **Note**: This guide represents the optimal workflow for maintaining high-quality documentation while protecting critical Firestore migration procedures. The timing recommendations are based on real-world usage patterns and team productivity optimization. Regular use of these commands will prevent documentation debt and ensure system reliability.
