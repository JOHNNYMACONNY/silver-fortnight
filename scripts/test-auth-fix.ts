#!/usr/bin/env node

/**
 * Test Firebase Auth Fix
 * 
 * This script helps verify that the Firebase Auth domain fix
 * is working correctly for PR previews.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

class AuthFixTester {
  private projectRoot: string;

  constructor() {
    this.projectRoot = process.cwd();
  }

  async testAuthFix(): Promise<void> {
    console.log('🧪 Testing Firebase Auth Fix');
    console.log('============================');

    // 1. Check current configuration
    await this.checkCurrentConfiguration();

    // 2. Test Firebase Auth initialization
    await this.testFirebaseAuthInit();

    // 3. Generate test scenarios
    await this.generateTestScenarios();

    // 4. Create verification checklist
    await this.createVerificationChecklist();

    console.log('✅ Auth fix testing completed');
  }

  private async checkCurrentConfiguration(): Promise<void> {
    console.log('\n🔍 Checking Current Configuration...');

    // Check environment variables
    const envVars = {
      VITE_FIREBASE_PROJECT_ID: process.env.VITE_FIREBASE_PROJECT_ID,
      VITE_FIREBASE_AUTH_DOMAIN: process.env.VITE_FIREBASE_AUTH_DOMAIN,
      VITE_FIREBASE_API_KEY: process.env.VITE_FIREBASE_API_KEY,
      VITE_ENVIRONMENT: process.env.VITE_ENVIRONMENT
    };

    console.log('📊 Environment Variables:');
    Object.entries(envVars).forEach(([key, value]) => {
      const status = value ? '✅' : '❌';
      const displayValue = value ? (key.includes('API_KEY') ? '***' + value.slice(-4) : value) : 'Not set';
      console.log(`  ${status} ${key}: ${displayValue}`);
    });

    // Check Firebase configuration
    try {
      const { getFirebaseConfig } = await import('../src/firebase-config.ts');
      const config = getFirebaseConfig();
      
      console.log('\n🔥 Firebase Configuration:');
      console.log(`  ✅ Project ID: ${config.projectId}`);
      console.log(`  ✅ Auth Domain: ${config.authDomain}`);
      console.log(`  ✅ Storage Bucket: ${config.storageBucket}`);
      
    } catch (error) {
      console.log('\n❌ Firebase Configuration Error:');
      console.log(`  Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async testFirebaseAuthInit(): Promise<void> {
    console.log('\n🧪 Testing Firebase Auth Initialization...');

    try {
      // Test Firebase Auth initialization
      const { initializeFirebase, getSyncFirebaseAuth } = await import('../src/firebase-config.ts');
      
      console.log('  🔄 Initializing Firebase...');
      await initializeFirebase();
      
      console.log('  🔐 Getting Auth instance...');
      const auth = getSyncFirebaseAuth();
      
      console.log('  ✅ Firebase Auth initialized successfully');
      console.log(`  📊 Auth instance: ${auth ? 'Available' : 'Not available'}`);
      
      // Test auth state
      if (auth && auth.currentUser) {
        console.log(`  👤 Current user: ${auth.currentUser.email || 'Anonymous'}`);
      } else {
        console.log('  👤 Current user: Not signed in');
      }
      
    } catch (error) {
      console.log('  ❌ Firebase Auth initialization failed:');
      console.log(`     Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      if (error instanceof Error && error.message.includes('unauthorized-domain')) {
        console.log('  🚨 This is the domain authorization error!');
        console.log('  📝 Solution: Add your PR preview domain to Firebase Console');
      }
    }
  }

  private async generateTestScenarios(): Promise<void> {
    console.log('\n🧪 Generating Test Scenarios...');

    const testScenarios = [
      {
        name: 'Local Development',
        url: 'http://localhost:5173',
        domain: 'localhost:5173',
        expected: 'Should work (already authorized)'
      },
      {
        name: 'Vercel Preview',
        url: 'https://tradeya-pr-123.vercel.app',
        domain: 'tradeya-pr-123.vercel.app',
        expected: 'Should work after adding domain'
      },
      {
        name: 'Netlify Preview',
        url: 'https://tradeya-pr-123.netlify.app',
        domain: 'tradeya-pr-123.netlify.app',
        expected: 'Should work after adding domain'
      },
      {
        name: 'GitHub Pages',
        url: 'https://username.github.io/tradeya',
        domain: 'username.github.io',
        expected: 'Should work after adding domain'
      },
      {
        name: 'Firebase Hosting',
        url: 'https://tradeya-45ede.web.app',
        domain: 'tradeya-45ede.web.app',
        expected: 'Should work (already authorized)'
      }
    ];

    console.log('📋 Test Scenarios:');
    testScenarios.forEach((scenario, index) => {
      console.log(`\n  ${index + 1}. ${scenario.name}`);
      console.log(`     URL: ${scenario.url}`);
      console.log(`     Domain: ${scenario.domain}`);
      console.log(`     Expected: ${scenario.expected}`);
    });
  }

  private async createVerificationChecklist(): Promise<void> {
    console.log('\n📋 Creating Verification Checklist...');

    const checklist = `# Firebase Auth Fix Verification Checklist

## ✅ Pre-Test Checklist

### 1. Environment Setup
- [ ] Environment variables are loaded correctly
- [ ] Firebase configuration is valid
- [ ] Project ID is set to 'tradeya-45ede'

### 2. Firebase Console Setup
- [ ] Go to Firebase Console > Authentication > Settings > Authorized domains
- [ ] Add your PR preview domain (e.g., 'your-pr-preview.vercel.app')
- [ ] Add wildcard domains (*.vercel.app, *.netlify.app, etc.)
- [ ] Save the configuration
- [ ] Wait 1-2 minutes for changes to propagate

## 🧪 Test Steps

### 1. Local Development Test
- [ ] Run: \`npm run dev\`
- [ ] Open: http://localhost:5173
- [ ] Try to sign in
- [ ] Expected: Authentication should work

### 2. PR Preview Test
- [ ] Deploy your PR preview
- [ ] Open the preview URL
- [ ] Try to sign in
- [ ] Expected: No more 'auth/unauthorized-domain' error

### 3. Authentication Flow Test
- [ ] Sign in with email/password
- [ ] Sign in with Google
- [ ] Sign out
- [ ] Expected: All flows should work

## 🚨 Troubleshooting

### If you still get 'auth/unauthorized-domain':
1. [ ] Check the exact domain in the error message
2. [ ] Verify the domain is added to Firebase Console
3. [ ] Ensure no typos in the domain name
4. [ ] Wait 2-3 minutes for changes to propagate
5. [ ] Clear browser cache and cookies

### If authentication fails:
1. [ ] Check browser console for errors
2. [ ] Verify Firebase API keys are correct
3. [ ] Check network connectivity
4. [ ] Test with a different browser

## 📊 Success Criteria

- [ ] No 'auth/unauthorized-domain' errors
- [ ] Users can sign in successfully
- [ ] Authentication state persists across page refreshes
- [ ] Sign out works correctly
- [ ] All authentication methods work (email, Google, etc.)

## 🔗 Useful Links

- [Firebase Console - Authentication](https://console.firebase.google.com/project/tradeya-45ede/authentication/settings)
- [Firebase Auth Documentation](https://firebase.google.com/docs/auth/web/start)
- [Authorized Domains Guide](https://firebase.google.com/docs/auth/web/domain-restrictions)
`;

    const checklistPath = join(this.projectRoot, 'FIREBASE_AUTH_VERIFICATION_CHECKLIST.md');
    writeFileSync(checklistPath, checklist);
    console.log(`✅ Generated verification checklist: ${checklistPath}`);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new AuthFixTester();
  tester.testAuthFix()
    .then(() => {
      console.log('\n🎉 Auth fix testing completed');
      console.log('\n📋 Next Steps:');
      console.log('1. Add your PR preview domain to Firebase Console');
      console.log('2. Test authentication on your PR preview');
      console.log('3. Verify all authentication flows work');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Auth fix testing failed:', error);
      process.exit(1);
    });
}

export { AuthFixTester };