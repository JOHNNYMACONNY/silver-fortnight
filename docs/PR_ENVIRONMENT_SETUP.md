# TradeYa PR Environment Setup Guide

This guide explains how to set up and use Firebase in pre-production PR environments for TradeYa.

## Overview

The PR environment setup allows you to:
- Test Firebase functionality in isolated PR environments
- Use staging Firebase project for PR testing
- Automatically deploy PR previews with Firebase Hosting
- Clean up PR environments when PRs are closed

## Quick Start

### 1. Automatic Setup (Recommended)

When you create a pull request, the GitHub Actions workflow will automatically:
- Set up the PR environment
- Build the application with PR-specific configuration
- Deploy to Firebase Hosting with a preview URL
- Comment on the PR with the preview link

### 2. Manual Setup

If you need to set up the PR environment manually:

```bash
# Set environment variables
export PR_NUMBER=123
export BRANCH_NAME=feature/my-feature
export AUTHOR=your-username

# Run the setup script
npm run setup:pr

# Build for PR environment
npm run build:pr
```

## Environment Configuration

### Environment Variables

The PR environment uses these key variables:

```bash
# Environment identification
NODE_ENV=development
VITE_ENVIRONMENT=pr
VITE_APP_VERSION=pr-123-abc123

# PR-specific identifiers
VITE_PR_NUMBER=123
VITE_PR_BRANCH=feature/my-feature
VITE_PR_AUTHOR=your-username

# Firebase Configuration (uses staging project)
VITE_FIREBASE_PROJECT_ID=tradeya-45ede
VITE_FIREBASE_AUTH_DOMAIN=tradeya-45ede.firebaseapp.com
VITE_FIREBASE_STORAGE_BUCKET=tradeya-45ede.appspot.com
```

### Firebase Project Strategy

For PR environments, we use the **staging project** (`tradeya-45ede`) because:

1. **Cost Efficiency**: Avoids creating multiple Firebase projects
2. **Data Safety**: Staging data is already isolated from production
3. **Simplicity**: No need to manage multiple project configurations
4. **Testing**: Provides realistic testing environment

### Data Isolation

While using the same Firebase project, PR environments maintain data isolation through:

1. **Environment Variables**: PR-specific configuration
2. **Build Mode**: Different build configuration for debugging
3. **Logging**: PR-specific logging and debugging
4. **Sourcemaps**: Enabled for easier debugging

## Firebase Services in PR Environment

### Authentication
- Uses staging Firebase Auth
- Test users can be created/used safely
- No impact on production users

### Firestore
- Uses staging Firestore database
- Safe for testing data operations
- Automatic cleanup when PR closes

### Storage
- Uses staging Firebase Storage
- Test file uploads are safe
- Temporary test data only

### Hosting
- Dedicated preview channels per PR
- URLs like: `https://tradeya-45ede--pr-123-abc123.web.app`
- Automatic cleanup when PR closes

## Development Workflow

### 1. Creating a PR

```bash
# Create your feature branch
git checkout -b feature/my-feature

# Make your changes
# ... your code changes ...

# Push the branch
git push origin feature/my-feature

# Create PR through GitHub UI
```

### 2. PR Environment Activation

The GitHub Actions workflow automatically:
- Detects the new PR
- Sets up environment variables
- Builds the application
- Deploys to Firebase Hosting
- Comments with preview URL

### 3. Testing in PR Environment

1. **Access the Preview URL** from the PR comment
2. **Test Firebase Features**:
   - User authentication
   - Data operations (CRUD)
   - File uploads
   - Real-time updates
3. **Check Browser Console** for any Firebase errors
4. **Verify Environment Variables** using the debug page

### 4. PR Environment Debugging

#### Debug Page
Access `/env-check.html` on your PR preview to verify:
- Environment variables are loaded correctly
- Firebase configuration is valid
- Build mode is set to 'pr'

#### Browser Console
Look for these log messages:
```
Firebase: Using PR environment configuration
Firebase: Configuration loaded successfully
```

#### Firebase Console
Check the Firebase console for:
- Authentication users
- Firestore data
- Storage files
- Function logs

### 5. PR Cleanup

When the PR is closed/merged:
- Firebase Hosting channel is deleted
- Build artifacts are removed
- Environment variables are cleared
- Cleanup confirmation is posted

## Troubleshooting

### Common Issues

#### 1. Firebase Not Initializing

**Symptoms**: Blank page, Firebase errors in console

**Solutions**:
- Check environment variables are set correctly
- Verify Firebase API keys are valid
- Ensure staging project is accessible

#### 2. Authentication Issues

**Symptoms**: Login/logout not working

**Solutions**:
- Verify Firebase Auth configuration
- Check allowed domains in Firebase Console
- Ensure PR preview URL is in authorized domains

#### 3. Data Not Loading

**Symptoms**: Empty pages, Firestore errors

**Solutions**:
- Check Firestore security rules
- Verify Firestore indexes are deployed
- Check network connectivity to Firebase

#### 4. Build Failures

**Symptoms**: GitHub Actions failing

**Solutions**:
- Check environment variables in repository secrets
- Verify Firebase service account permissions
- Review build logs for specific errors

### Debug Commands

```bash
# Check environment setup
npm run setup:pr

# Validate Firebase configuration
npm run firebase:diagnose:staging

# Check build configuration
npm run build:pr -- --debug

# Test Firebase connection
npm run firebase:emulators
```

## Best Practices

### 1. Environment Variables
- Never commit sensitive keys to the repository
- Use GitHub repository secrets for CI/CD
- Use staging project for all PR environments

### 2. Data Management
- Use test data only in PR environments
- Don't modify production-like data in staging
- Clean up test data when PR closes

### 3. Testing
- Test all Firebase features in PR environment
- Verify authentication flows
- Test data operations thoroughly
- Check error handling

### 4. Security
- PR environments use staging project (safe)
- No production data exposure
- Automatic cleanup prevents data leaks

## Advanced Configuration

### Custom PR Projects

If you need dedicated Firebase projects for PRs:

1. Create new Firebase project
2. Update `.firebaserc`:
   ```json
   {
     "projects": {
       "pr": "your-pr-project-id"
     }
   }
   ```
3. Update environment variables
4. Deploy security rules and indexes

### Multiple PR Support

The system supports multiple concurrent PRs by:
- Using unique channel IDs (`pr-123`, `pr-124`, etc.)
- Isolating each PR's preview environment
- Automatic cleanup per PR

### Custom Domain

For custom PR preview domains:
1. Configure Firebase Hosting custom domain
2. Update DNS settings
3. Update GitHub Actions workflow

## Support

For issues with PR environments:

1. Check this documentation
2. Review GitHub Actions logs
3. Check Firebase Console for errors
4. Contact the development team

## Related Documentation

- [Firebase Configuration](./FIREBASE_CONFIGURATION.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Environment Variables](./ENVIRONMENT_VARIABLES.md)
- [CI/CD Setup](./CICD_SETUP.md)