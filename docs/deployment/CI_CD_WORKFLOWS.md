# CI/CD Workflows Documentation

**Last Updated:** November 6, 2025

This document describes the optimized CI/CD pipeline for TradeYa, including all GitHub Actions workflows and their purposes.

---

## 📋 Overview

The TradeYa CI/CD pipeline consists of **9 workflows** organized into the following categories:

### **Core Workflows** (Run on every PR/push)
1. **TradeYa CI/CD Pipeline** - Main build, test, and deployment
2. **PR Environment Setup** - Preview environments for pull requests
3. **Security Checks** - Comprehensive security scanning

### **Specialized Workflows** (Run on specific triggers)
4. **Deploy Firestore Rules** - Security rules deployment
5. **Firebase Security Rules Tests** - Firestore rules validation
6. **Messaging Tests** - Messaging system integration tests
7. **Security Rules Tests** - Extended security rules validation
8. **Asset Bloat Check** - Bundle size monitoring
9. **Documentation Maintenance** - Auto-updates for docs

---

## 🔄 Core Workflows

### 1. TradeYa CI/CD Pipeline (`ci-cd.yml`)

**Triggers:** Push to `main`, Pull requests to `main`

**Jobs:**

#### **build-and-test** (Runs on ALL events)
- ✅ Checkout code
- ✅ Install dependencies with npm cache
- ✅ Run linting (ESLint)
- ✅ Run tests (CI subset, continues on error)
- ✅ Run migration compatibility tests (main branch only)
- ✅ Build application
- ✅ Upload build artifacts

#### **deploy** (Runs ONLY on `main` push)
- ✅ Download build artifacts
- ✅ Deploy to Firebase Hosting (live channel)
- ✅ Deploy to production environment

#### **deploy-functions** (Runs ONLY on `main` push)
- ✅ Install function dependencies
- ✅ Deploy Firebase Cloud Functions
- ✅ Update serverless backend

**Why this workflow?** 
- Consolidated build/test/deploy pipeline
- Prevents duplicate builds (removed redundant `deploy.yml`)
- Fast feedback on PRs with caching

---

### 2. PR Environment Setup (`pr-environment.yml`)

**Triggers:** Pull request opened/synchronized/reopened, Manual dispatch

**Jobs:**

#### **setup-pr-environment**
- ✅ Build application with PR-specific env vars
- ✅ Upload PR build artifacts
- ✅ 7-day artifact retention

#### **deploy-pr-preview**
- ✅ Deploy to Firebase Hosting preview channel (`pr-{number}`)
- ✅ Comment on PR with preview URL
- ✅ Auto-update on new commits

#### **cleanup-pr-environment** (On PR close)
- ✅ Delete Firebase Hosting preview channel
- ✅ Remove artifacts
- ✅ Comment on PR with cleanup confirmation

**Preview URL Format:** 
`https://tradeya-45ede--pr-{number}-{number}.web.app`

**Note:** Vercel is configured (`vercel.json`) but runs silently (`"github": { "silent": true }`), so Firebase handles preview comments.

---

### 3. Security Checks (`security.yml`)

**Triggers:** 
- Push to `main` or `develop`
- Pull requests to `main` or `develop`
- Daily at midnight UTC (scheduled)

**Jobs:**

#### **security** (Main security job)
- ✅ Checkout with full git history (`fetch-depth: 0`) for comprehensive secret scanning
- ✅ Run custom security script (`./scripts/security-checks.sh`)
- ✅ **CodeQL Analysis** - GitHub's semantic code analysis
- ✅ **Snyk Scanning** - Dependency vulnerability detection
- ✅ **Gitleaks** - Secret detection scanning entire git history (continues on error for PRs)
- ✅ **OWASP ZAP** - Dynamic application security testing (main branch only)
- ✅ Upload security report artifact

#### **dependency-review** (PRs only)
- ✅ GitHub Dependency Review action
- ✅ Fails on high-severity dependency changes

#### **compliance**
- ✅ License checker (fails on AGPL, warns on GPLv3)
- ✅ Upload license report

#### **notify** (On failure)
- ✅ Create GitHub issue with security alert
- ✅ Label: `security`, `high-priority`

**Recent Optimizations (Nov 6, 2025):**
- ❌ Removed duplicate Gitleaks check (was running twice)
- ❌ Removed placeholder "banned dependencies" check
- ✅ Improved GPL license check (now targets AGPL specifically)
- ✅ Fixed Gitleaks to scan full git history (`fetch-depth: 0` + `GITLEAKS_LOG_OPTS: "--all"`)

---

## 🎯 Specialized Workflows

### 4. Deploy Firestore Rules (`deploy-firestore-rules.yml`)
- **Trigger:** Manual dispatch or push to `firestore.rules`
- **Purpose:** Deploy Firestore security rules independently
- **Use Case:** Quick security rule updates without full deployment

### 5. Firebase Security Rules Tests (`firebase-rules.yml`)
- **Trigger:** Push, Pull requests, Schedule (weekly)
- **Purpose:** Test Firestore rules with emulator
- **Use Case:** Validate rule changes before deployment

### 6. Messaging Tests (`messaging-tests.yml`)
- **Trigger:** Pull requests, Manual dispatch
- **Purpose:** Integration tests for messaging system
- **Use Case:** Ensure chat/messaging functionality works

### 7. Security Rules Tests (`security-rules-tests.yml`)
- **Trigger:** Pull requests affecting rules, Weekly schedule
- **Purpose:** Extended security rules validation
- **Use Case:** Deep testing of Firestore/Storage security

### 8. Asset Bloat Check (`asset-bloat-check.yml`)
- **Trigger:** Pull requests
- **Purpose:** Monitor bundle size changes
- **Use Case:** Prevent performance regressions from large assets

### 9. Documentation Maintenance (`documentation-maintenance.yml`)
- **Trigger:** Schedule, Manual dispatch
- **Purpose:** Auto-update documentation links and structure
- **Use Case:** Keep docs synchronized with codebase

---

## 🚀 Deployment Strategy

### **Dual Deployment: Firebase + Vercel**

TradeYa uses both Firebase Hosting and Vercel:

| Platform | Purpose | Configuration |
|----------|---------|---------------|
| **Firebase Hosting** | Production & PR previews | `.firebaserc`, `firebase.json` |
| **Vercel** | Additional hosting (silent mode) | `vercel.json` (no PR comments) |

**Why both?**
- Firebase: Direct integration with Firestore/Functions
- Vercel: Edge network, fast global delivery
- Both provide CDN benefits and redundancy

### **Environment Flow**

```
Development (localhost:5173)
    ↓
PR Preview (Firebase Channel)
    ↓
Staging (Optional)
    ↓
Production (Firebase Live + Vercel)
```

---

## ⚡ Performance Optimizations

### **Caching Strategy**
1. **npm dependencies** - Cached via `actions/setup-node@v4`
2. **Build outputs** - Artifact caching between jobs
3. **node_modules** - Manual cache keys for faster installs

### **Job Execution Times** (Approximate)
- `build-and-test`: 3-5 minutes
- `deploy`: 2-3 minutes
- `security` (full): 8-12 minutes (ZAP scan adds time)
- `PR preview`: 3-4 minutes

### **CI Minute Optimization**
- Security jobs skip ZAP scan on PRs (saves ~5 min)
- Tests run in "CI subset" mode (faster feedback)
- Consolidated workflows prevent duplicate builds

---

## 🛡️ Security Features

### **Secret Management**
Required GitHub Secrets:
- `FIREBASE_SERVICE_ACCOUNT` - Firebase deployment auth
- `FIREBASE_TOKEN` - Alternative auth method
- `SNYK_TOKEN` - Snyk vulnerability scanning
- `GITHUB_TOKEN` - Auto-provided by GitHub
- `FIREBASE_API_KEY`, `FIREBASE_MESSAGING_SENDER_ID`, etc. - Firebase config
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` - Image upload

### **Security Scanning Coverage**
| Tool | What it Checks | Frequency |
|------|---------------|-----------|
| **CodeQL** | Code vulnerabilities, injection flaws | Every push/PR |
| **Snyk** | npm dependency vulnerabilities | Every push/PR |
| **Gitleaks** | Secrets in code/commits | Every push/PR |
| **OWASP ZAP** | Runtime web vulnerabilities | Main branch only |
| **npm audit** | Known CVEs in dependencies | Every security run |
| **License checker** | AGPL/GPL licensing issues | Every push/PR |

---

## 📊 Workflow Status Checks

### **Required Checks for PR Merge**
1. ✅ `build-and-test` - Must pass
2. ✅ `Security Checks / security` - Must pass
3. ✅ `Security Checks / dependency-review` - Must pass (PRs only)
4. ✅ `Security Checks / compliance` - Must pass

### **Optional Checks**
- `deploy-pr-preview` - Informational (provides preview URL)
- Asset bloat check - Warning only
- Documentation maintenance - Background job

---

## 🐛 Troubleshooting

### **Common Issues**

#### **"Build artifacts not found"**
- **Cause:** `build-and-test` job failed before upload
- **Solution:** Check linting/test errors in job logs

#### **"Firebase deploy failed: authentication error"**
- **Cause:** `FIREBASE_SERVICE_ACCOUNT` secret invalid/expired
- **Solution:** Regenerate service account key and update secret

#### **"Security check failure: Snyk token"**
- **Cause:** `SNYK_TOKEN` not configured or expired
- **Solution:** Get token from snyk.io and add to GitHub secrets

#### **"PR preview not created"**
- **Cause:** `setup-pr-environment` job failed during build
- **Solution:** Check for missing environment variables in PR job logs

#### **"ZAP scan timeout"**
- **Cause:** `npm run preview` server didn't start in time
- **Solution:** Increase sleep time in `security.yml` line 78 (currently 10s)

### **Manual Workflow Triggers**

Most workflows support manual triggering via GitHub UI:

1. Go to **Actions** tab
2. Select workflow from left sidebar
3. Click **Run workflow** button (if available)
4. Select branch and inputs (if any)
5. Click **Run workflow**

---

## 📝 Maintenance

### **Adding New Workflows**
1. Create `.github/workflows/your-workflow.yml`
2. Test with `act` locally (if possible)
3. Update this documentation
4. Add required secrets (if any)
5. Test on a PR branch first

### **Modifying Existing Workflows**
1. Make changes on a feature branch
2. Test via PR (workflows will run)
3. Verify in Actions tab
4. Merge to main after validation

### **Removing Workflows**
1. Delete workflow file from `.github/workflows/`
2. Update this documentation
3. Remove associated secrets (if unused)
4. Clean up any referenced scripts

---

## 🔗 Related Documentation

- **[Deployment Guide](./DEPLOYMENT.md)** - Manual deployment procedures
- **[Quick Deploy](./QUICK_DEPLOY_INSTRUCTIONS.md)** - Fast deployment commands
- **[Firebase Setup](../firebase/)** - Firebase configuration
- **[Security Policy](../security/SECURITY.md)** - Security guidelines
- **[Testing Guide](../testing/TESTING.md)** - Test strategy

---

## 📞 Support

For workflow issues:
1. Check this documentation first
2. Review GitHub Actions logs
3. Check the troubleshooting section
4. Open an issue with `ci-cd` label

---

**Maintained by:** TradeYa Development Team  
**Next Review:** December 2025

