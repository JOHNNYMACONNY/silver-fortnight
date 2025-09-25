#!/usr/bin/env node

/**
 * Fix Firebase Unauthorized Domain Error
 * 
 * This script helps fix the auth/unauthorized-domain error
 * that occurs when deploying to PR preview URLs.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

interface AuthDomainConfig {
  authorizedDomains: string[];
  previewDomains: string[];
  productionDomains: string[];
}

class UnauthorizedDomainFixer {
  private projectRoot: string;

  constructor() {
    this.projectRoot = process.cwd();
  }

  async fixUnauthorizedDomain(): Promise<void> {
    console.log('🔧 Fixing Firebase Unauthorized Domain Error');
    console.log('============================================');

    // 1. Identify the issue
    await this.identifyIssue();

    // 2. Generate domain configuration
    await this.generateDomainConfig();

    // 3. Create Firebase Auth configuration
    await this.createAuthConfig();

    // 4. Generate deployment instructions
    await this.generateDeploymentInstructions();

    console.log('✅ Unauthorized domain fix completed');
  }

  private async identifyIssue(): Promise<void> {
    console.log('\n🔍 Identifying the Issue...');
    
    console.log('❌ Error: auth/unauthorized-domain');
    console.log('📝 Cause: Firebase Auth only allows requests from authorized domains');
    console.log('🌐 Issue: PR preview URLs are not in the authorized domains list');
    console.log('📍 Location: Firebase Console > Authentication > Settings > Authorized domains');
  }

  private async generateDomainConfig(): Promise<void> {
    console.log('\n🔧 Generating Domain Configuration...');

    const config: AuthDomainConfig = {
      authorizedDomains: [
        // Production domains
        'tradeya.com',
        'www.tradeya.com',
        'tradeya-45ede.web.app',
        'tradeya-45ede.firebaseapp.com',
        
        // Development domains
        'localhost:5173',
        'localhost:5175',
        '127.0.0.1:5173',
        '127.0.0.1:5175',
        
        // Common preview domains (add your specific ones)
        'vercel.app',
        'netlify.app',
        'github.io',
        'firebaseapp.com',
        
        // PR preview patterns
        '*.vercel.app',
        '*.netlify.app',
        '*.github.io',
        '*.firebaseapp.com'
      ],
      previewDomains: [
        // Vercel preview domains
        '*.vercel.app',
        'tradeya-git-*.vercel.app',
        'tradeya-pr-*.vercel.app',
        
        // Netlify preview domains
        '*.netlify.app',
        'tradeya-pr-*.netlify.app',
        
        // GitHub Pages
        '*.github.io',
        
        // Firebase Hosting previews
        '*.web.app',
        '*.firebaseapp.com'
      ],
      productionDomains: [
        'tradeya.com',
        'www.tradeya.com',
        'tradeya-45ede.web.app',
        'tradeya-45ede.firebaseapp.com'
      ]
    };

    const configPath = join(this.projectRoot, 'config', 'auth-domains.json');
    
    // Ensure config directory exists
    const configDir = join(this.projectRoot, 'config');
    if (!existsSync(configDir)) {
      require('fs').mkdirSync(configDir, { recursive: true });
    }
    
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`✅ Generated domain configuration: ${configPath}`);
  }

  private async createAuthConfig(): Promise<void> {
    console.log('\n🔧 Creating Firebase Auth Configuration...');

    const authConfig = {
      projectId: 'tradeya-45ede',
      authDomains: [
        'tradeya-45ede.firebaseapp.com',
        'tradeya-45ede.web.app',
        'tradeya.com',
        'www.tradeya.com'
      ],
      previewDomains: [
        '*.vercel.app',
        '*.netlify.app',
        '*.github.io',
        '*.web.app',
        '*.firebaseapp.com'
      ],
      instructions: {
        step1: 'Go to Firebase Console > Authentication > Settings > Authorized domains',
        step2: 'Add your PR preview domain to the authorized domains list',
        step3: 'Add wildcard domains for preview URLs (*.vercel.app, *.netlify.app)',
        step4: 'Save the configuration',
        step5: 'Test authentication on your PR preview'
      }
    };

    const authConfigPath = join(this.projectRoot, 'config', 'firebase-auth-config.json');
    writeFileSync(authConfigPath, JSON.stringify(authConfig, null, 2));
    console.log(`✅ Generated auth configuration: ${authConfigPath}`);
  }

  private async generateDeploymentInstructions(): Promise<void> {
    console.log('\n📝 Generating Deployment Instructions...');

    const instructions = `# Firebase Auth Unauthorized Domain Fix

## 🚨 Issue
You're getting "auth/unauthorized-domain" error because your PR preview URL is not authorized in Firebase.

## 🔧 Solution

### Step 1: Add Preview Domains to Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **tradeya-45ede**
3. Go to **Authentication** > **Settings** > **Authorized domains**
4. Click **Add domain**
5. Add these domains:

#### For Vercel deployments:
- \`*.vercel.app\`
- \`tradeya-git-*.vercel.app\`
- \`tradeya-pr-*.vercel.app\`

#### For Netlify deployments:
- \`*.netlify.app\`
- \`tradeya-pr-*.netlify.app\`

#### For GitHub Pages:
- \`*.github.io\`

#### For Firebase Hosting previews:
- \`*.web.app\`
- \`*.firebaseapp.com\`

### Step 2: Add Your Specific Preview URL

1. Copy your PR preview URL (e.g., \`https://tradeya-pr-123-abc123.vercel.app\`)
2. Extract the domain (e.g., \`tradeya-pr-123-abc123.vercel.app\`)
3. Add this exact domain to the authorized domains list

### Step 3: Test Authentication

1. Visit your PR preview URL
2. Try to sign in
3. Authentication should now work

## 🔍 Alternative Solutions

### Option 1: Use Firebase Auth Emulator for Development
If you want to test locally without domain restrictions:

\`\`\`bash
# Start Firebase emulators
firebase emulators:start --only auth

# Update your .env file
VITE_USE_FIREBASE_EMULATORS=true
VITE_FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
\`\`\`

### Option 2: Configure Dynamic Domain Authorization
For a more flexible solution, you can configure your app to handle multiple domains:

\`\`\`typescript
// In your firebase-config.ts
const isLocalhost = window.location.hostname === 'localhost';
const isPreview = window.location.hostname.includes('vercel.app') || 
                  window.location.hostname.includes('netlify.app');

if (isLocalhost || isPreview) {
  // Use emulator or handle preview domains
  connectAuthEmulator(auth, 'http://localhost:9099');
}
\`\`\`

## 🚨 Important Notes

1. **Wildcard domains** (like \`*.vercel.app\`) work for subdomains
2. **Exact domains** are required for specific URLs
3. **Changes take effect immediately** - no need to redeploy
4. **Test thoroughly** after adding domains

## 📞 Troubleshooting

If you still get the error:
1. Check that the domain is exactly as shown in the error message
2. Ensure there are no typos in the domain name
3. Try clearing browser cache and cookies
4. Check that the domain was saved in Firebase Console

## 🔗 Quick Links

- [Firebase Console - Authentication](https://console.firebase.google.com/project/tradeya-45ede/authentication/settings)
- [Firebase Auth Documentation](https://firebase.google.com/docs/auth/web/start)
- [Authorized Domains Guide](https://firebase.google.com/docs/auth/web/domain-restrictions)
`;

    const instructionsPath = join(this.projectRoot, 'FIREBASE_AUTH_DOMAIN_FIX.md');
    writeFileSync(instructionsPath, instructions);
    console.log(`✅ Generated deployment instructions: ${instructionsPath}`);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const fixer = new UnauthorizedDomainFixer();
  fixer.fixUnauthorizedDomain()
    .then(() => {
      console.log('\n🎉 Unauthorized domain fix completed');
      console.log('\n📋 Next Steps:');
      console.log('1. Go to Firebase Console > Authentication > Settings > Authorized domains');
      console.log('2. Add your PR preview domain to the authorized domains list');
      console.log('3. Add wildcard domains for preview URLs (*.vercel.app, *.netlify.app)');
      console.log('4. Test authentication on your PR preview');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Unauthorized domain fix failed:', error);
      process.exit(1);
    });
}

export { UnauthorizedDomainFixer };