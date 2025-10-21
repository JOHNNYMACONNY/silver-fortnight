#!/usr/bin/env node

/**
 * Identify PR Preview Domain
 * 
 * This script helps identify the exact domain that needs to be
 * added to Firebase Auth authorized domains.
 */

import { execSync } from 'child_process';

class PreviewDomainIdentifier {
  async identifyPreviewDomain(): Promise<void> {
    console.log('🔍 Identifying PR Preview Domain');
    console.log('================================');

    // Get current branch and PR info
    const branch = await this.getCurrentBranch();
    const prNumber = await this.getPRNumber();
    const deploymentPlatform = await this.getDeploymentPlatform();

    console.log(`📊 Current Branch: ${branch}`);
    console.log(`🔢 PR Number: ${prNumber || 'Not detected'}`);
    console.log(`🌐 Deployment Platform: ${deploymentPlatform}`);

    // Generate possible preview URLs
    const possibleUrls = this.generatePossibleUrls(branch, prNumber, deploymentPlatform);

    console.log('\n🌐 Possible Preview URLs:');
    console.log('==========================');
    possibleUrls.forEach((url, index) => {
      console.log(`${index + 1}. ${url}`);
    });

    console.log('\n🔧 Firebase Console Steps:');
    console.log('==========================');
    console.log('1. Go to: https://console.firebase.google.com/project/tradeya-45ede/authentication/settings');
    console.log('2. Scroll down to "Authorized domains"');
    console.log('3. Click "Add domain"');
    console.log('4. Add these domains:');

    // Generate domain list for Firebase Console
    const domains = this.extractDomains(possibleUrls);
    domains.forEach((domain, index) => {
      console.log(`   ${index + 1}. ${domain}`);
    });

    console.log('\n📝 Additional Wildcard Domains:');
    console.log('================================');
    console.log('Add these wildcard domains for future PRs:');
    console.log('• *.vercel.app');
    console.log('• *.netlify.app');
    console.log('• *.github.io');
    console.log('• *.web.app');
    console.log('• *.firebaseapp.com');

    console.log('\n🧪 Test Steps:');
    console.log('==============');
    console.log('1. Add the domains to Firebase Console');
    console.log('2. Wait 1-2 minutes for changes to propagate');
    console.log('3. Visit your PR preview URL');
    console.log('4. Try to sign in');
    console.log('5. Authentication should now work!');
  }

  private async getCurrentBranch(): Promise<string> {
    try {
      return execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    } catch {
      return 'unknown';
    }
  }

  private async getPRNumber(): Promise<string | null> {
    try {
      // Try to get PR number from environment variables
      const prNumber = process.env.PR_NUMBER || process.env.GITHUB_PR_NUMBER || process.env.VERCEL_GIT_PULL_REQUEST_NUMBER;
      if (prNumber) return prNumber;

      // Try to get from git
      const branch = await this.getCurrentBranch();
      const prMatch = branch.match(/pr-(\d+)/i) || branch.match(/(\d+)/);
      return prMatch ? prMatch[1] : null;
    } catch {
      return null;
    }
  }

  private async getDeploymentPlatform(): Promise<string> {
    // Check for deployment platform indicators
    if (process.env.VERCEL) return 'Vercel';
    if (process.env.NETLIFY) return 'Netlify';
    if (process.env.GITHUB_ACTIONS) return 'GitHub Pages';
    if (process.env.FIREBASE_HOSTING) return 'Firebase Hosting';
    
    return 'Unknown (check your deployment platform)';
  }

  private generatePossibleUrls(branch: string, prNumber: string | null, platform: string): string[] {
    const urls: string[] = [];

    // Vercel patterns
    if (platform === 'Vercel' || platform === 'Unknown') {
      urls.push('https://tradeya-git-main.vercel.app');
      urls.push('https://tradeya-git-develop.vercel.app');
      if (prNumber) {
        urls.push(`https://tradeya-pr-${prNumber}.vercel.app`);
        urls.push(`https://tradeya-git-${branch}.vercel.app`);
      }
      urls.push(`https://tradeya-git-${branch}.vercel.app`);
    }

    // Netlify patterns
    if (platform === 'Netlify' || platform === 'Unknown') {
      urls.push('https://tradeya.netlify.app');
      urls.push('https://tradeya-pr.netlify.app');
      if (prNumber) {
        urls.push(`https://tradeya-pr-${prNumber}.netlify.app`);
      }
      urls.push(`https://tradeya-${branch}.netlify.app`);
    }

    // GitHub Pages patterns
    if (platform === 'GitHub Pages' || platform === 'Unknown') {
      urls.push('https://yourusername.github.io/tradeya');
      urls.push('https://yourusername.github.io/tradeya-pr');
    }

    // Firebase Hosting patterns
    if (platform === 'Firebase Hosting' || platform === 'Unknown') {
      urls.push('https://tradeya-45ede.web.app');
      urls.push('https://tradeya-45ede.firebaseapp.com');
      if (prNumber) {
        urls.push(`https://tradeya-45ede-pr-${prNumber}.web.app`);
      }
    }

    return urls;
  }

  private extractDomains(urls: string[]): string[] {
    const domains = new Set<string>();
    
    urls.forEach(url => {
      try {
        const urlObj = new URL(url);
        domains.add(urlObj.hostname);
      } catch {
        // Skip invalid URLs
      }
    });

    return Array.from(domains);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const identifier = new PreviewDomainIdentifier();
  identifier.identifyPreviewDomain()
    .then(() => {
      console.log('\n🎉 Preview domain identification completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Preview domain identification failed:', error);
      process.exit(1);
    });
}

export { PreviewDomainIdentifier };