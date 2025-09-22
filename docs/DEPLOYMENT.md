# TradeYa Deployment Documentation

This document outlines the deployment configuration and process for the TradeYa application.

## Deployment Platforms

TradeYa can be deployed to the following platforms:

### 1. Vercel (Primary)

The application is currently deployed to Vercel at:
- **Production URL**: https://silver-fortnight-3xswhkfqv-johnny-maconnys-projects.vercel.app

#### Vercel Configuration

The deployment uses the following configuration:
- **Framework**: Vite
- **Node.js Version**: 22.x
- **Build Command**: `npm run build` (optimized for speed - skips asset processing in CI)
- **Output Directory**: `dist`
- **Build Time**: ~24 seconds (down from 18+ minutes)

#### Vercel-specific Files
- `vercel.json` - Contains routing configuration and build settings
- `.env.vercel` - Contains environment variables for Vercel deployment

### 2. Firebase Hosting (Alternative)

The application can also be deployed to Firebase Hosting:
- **Production URL**: https://tradeya-45ede.web.app

#### Firebase Configuration

The deployment uses the following configuration:
- **Public Directory**: `dist`
- **Rewrites**: All routes are rewritten to `index.html` for SPA support

#### Firebase-specific Files
- `firebase.json` - Contains hosting configuration
- `.firebaserc` - Contains project configuration

## Environment Variables

The application requires the following environment variables for deployment:

```
# Firebase Configuration
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID

# Hugging Face Configuration
VITE_HUGGINGFACE_API_KEY

# Cloudinary Configuration
VITE_CLOUDINARY_CLOUD_NAME
VITE_CLOUDINARY_API_KEY
VITE_CLOUDINARY_API_SECRET
VITE_CLOUDINARY_ID

# Cloudinary Upload Presets
VITE_CLOUDINARY_PROFILE_PRESET
VITE_CLOUDINARY_BANNER_PRESET
VITE_CLOUDINARY_PORTFOLIO_PRESET
VITE_CLOUDINARY_PROJECT_PRESET
```

These variables must be set in the deployment platform's environment variable settings.

## Deployment Process

### Deploying to Vercel

1. **Prepare for Deployment**:
   ```bash
   # Build the application (optimized - 24 seconds)
   npm run build
   
   # For local development with asset optimization
   npm run build:with-assets
   ```

2. **Deploy to Vercel**:
   ```bash
   # Deploy to production (automatically uses optimized build)
   npm run deploy
   
   # Deploy to preview (for testing)
   npm run deploy:preview
   ```

### Deploying to Firebase

1. **Prepare for Deployment**:
   ```bash
   # Build the application (optimized - 24 seconds)
   npm run build
   
   # For local development with asset optimization
   npm run build:with-assets
   ```

2. **Deploy to Firebase**:
   ```bash
   # Deploy to production (automatically uses optimized build)
   npm run deploy:firebase
   
   # Deploy to preview channel (for testing)
   npm run deploy:firebase:preview
   ```

## Content Security Policy (CSP)

The application uses a Content Security Policy to enhance security. The CSP is defined in:
- `index.html` (via meta tag)
- `vercel.json` (for Vercel deployments)
- `netlify.toml` (for Netlify deployments, if used)

The current CSP allows:
- Script execution including 'unsafe-eval' (required for Firebase and other libraries)
- Connection to various domains including Firebase, Cloudinary, and other APIs
- Loading images from various sources including data: and blob: URIs
- Inline styles for styling components

## Troubleshooting Deployment Issues

### Blank Page After Deployment

If the application shows a blank page after deployment, check the following:

1. **Environment Variables**:
   - Ensure all required environment variables are set in the deployment platform
   - Check for any typos or missing variables

2. **Content Security Policy**:
   - Ensure the CSP allows 'unsafe-eval' for script execution (required by Firebase)
   - Check that all necessary domains are allowed in the CSP

3. **Build Configuration**:
   - Verify the build command is correctly set to use production mode
   - Check that the output directory is correctly set to `dist`

4. **Browser Console**:
   - Check the browser console for any JavaScript errors
   - Look for any network request failures

## Testing Deployed Application

After deployment, test the application on:
- Different browsers (Chrome, Firefox, Safari, Edge)
- Different devices (desktop, tablet, mobile)
- Different network conditions (fast, slow, offline)

Verify that all features work as expected, including:
- Authentication (login, registration)
- Data loading and saving
- Image uploads
- Animations and transitions
- Dark/light mode switching

## Deployment History

- **May 2024**: Successfully deployed to Vercel with proper CSP configuration
- **April 2024**: Initial deployment to Firebase Hosting

## Performance Optimizations (December 2024)

### Build Speed Improvements
- **Build Time**: Reduced from 18+ minutes to 24 seconds (97% improvement)
- **File Duplication**: Eliminated 580+ nested directories (94% size reduction)
- **Output Size**: Reduced from 146MB to 6.7MB (95% reduction)
- **Asset Processing**: Moved to optional `build:with-assets` script

### New Build Scripts
```bash
npm run build              # Fast build for CI/CD (24 seconds)
npm run build:with-assets  # Full build with asset optimization
npm run assets:cleanup     # Clean up file duplication
```

## Future Deployment Considerations

- Consider setting up a custom domain for the application
- Implement CI/CD pipeline for automated testing and deployment
- Add monitoring and error tracking tools (e.g., Sentry)
- Implement performance monitoring with tools like Lighthouse CI
