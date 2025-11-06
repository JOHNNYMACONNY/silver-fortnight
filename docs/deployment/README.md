# Deployment Documentation

This directory contains all deployment-related documentation for the TradeYa platform.

## Quick Start

**For quick deployment**: See [QUICK_DEPLOY_INSTRUCTIONS.md](./QUICK_DEPLOY_INSTRUCTIONS.md)

## Contents

### Primary Deployment Guides
- **[QUICK_DEPLOY_INSTRUCTIONS.md](./QUICK_DEPLOY_INSTRUCTIONS.md)** - ⚡ Quick deployment guide (start here)
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment documentation

### Firebase Deployment
- **[FIREBASE_CLI_DEPLOYMENT_EMERGENCY_GUIDE.md](./FIREBASE_CLI_DEPLOYMENT_EMERGENCY_GUIDE.md)** - Emergency deployment procedures
- **[FIREBASE_FUNCTIONS_FIX_SUMMARY.md](./FIREBASE_FUNCTIONS_FIX_SUMMARY.md)** - Firebase Functions deployment fixes
- **[MANUAL_INDEX_DEPLOYMENT.md](./MANUAL_INDEX_DEPLOYMENT.md)** - Manual Firestore index deployment

### CI/CD
- **[setup-github-deployment.md](./setup-github-deployment.md)** - GitHub Actions deployment setup

## Deployment Workflow

1. **Development**: Test locally with Firebase emulators
2. **Staging**: Deploy to staging environment first
3. **Production**: Follow emergency guide for production deployments

## Common Commands

```bash
# Quick deploy
npm run deploy

# Deploy only functions
firebase deploy --only functions

# Deploy only hosting
firebase deploy --only hosting

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Firestore indexes
firebase deploy --only firestore:indexes
```

## Troubleshooting

If deployment fails, refer to:
- [FIREBASE_CLI_DEPLOYMENT_EMERGENCY_GUIDE.md](./FIREBASE_CLI_DEPLOYMENT_EMERGENCY_GUIDE.md)
- [FIREBASE_FUNCTIONS_FIX_SUMMARY.md](./FIREBASE_FUNCTIONS_FIX_SUMMARY.md)

## Related Documentation

- Firebase: `../firebase/`
- Testing before deployment: `../testing/`
- Performance optimization: `../performance/`

