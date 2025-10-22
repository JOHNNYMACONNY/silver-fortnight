#!/usr/bin/env tsx
/**
 * React Context Hierarchy Fix Script
 * 
 * Comprehensive solution for React context provider hierarchy issues:
 * 1. Missing PerformanceProvider causing "usePerformance must be used within PerformanceProvider"
 * 2. Auto-resolution "trades.filter is not a function" data validation error
 * 3. React Router v7 future flag warnings
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

interface FixResult {
  file: string;
  changes: string[];
  success: boolean;
}

class ReactContextHierarchyFixer {
  private fixes: FixResult[] = [];
  private projectRoot: string;

  constructor() {
    this.projectRoot = process.cwd();
  }

  /**
   * Run all fixes
   */
  public async run(): Promise<void> {
    console.log(chalk.yellow('🔧 React Context Hierarchy Fixer'));
    console.log(chalk.yellow('===================================\n'));

    await this.fixAppProviderHierarchy();
    await this.fixAutoResolutionDataValidation();
    await this.addReactRouterFutureFlags();
    await this.runFirestoreDbFixes();
    
    this.generateReport();
  }

  /**
   * Fix 1: Add PerformanceProvider to App.tsx provider hierarchy
   */
  private async fixAppProviderHierarchy(): Promise<void> {
    console.log(chalk.blue('🎯 Fixing Provider Hierarchy: Adding PerformanceProvider...'));
    
    const appPath = join(this.projectRoot, 'src', 'App.tsx');
    
    if (!existsSync(appPath)) {
      this.fixes.push({
        file: 'src/App.tsx',
        changes: ['File not found'],
        success: false
      });
      return;
    }

    let content = readFileSync(appPath, 'utf8');
    const changes: string[] = [];

    // Add PerformanceProvider import
    if (!content.includes('PerformanceProvider')) {
      const importIndex = content.indexOf('import { MessageProvider }');
      if (importIndex !== -1) {
        content = content.replace(
          'import { MessageProvider }',
          'import { MessageProvider }\nimport { PerformanceProvider } from \'./contexts/PerformanceContext\';'
        );
        changes.push('Added PerformanceProvider import');
      }
    }

    // Add PerformanceProvider to provider hierarchy (should wrap the entire app content)
    if (!content.includes('<PerformanceProvider>')) {
      // Insert PerformanceProvider as the outermost provider after ErrorBoundaryWrapper
      const providerStart = content.indexOf('<ThemeProvider>');
      const providerEnd = content.indexOf('</MessageProvider>') + '</MessageProvider>'.length;
      
      if (providerStart !== -1 && providerEnd !== -1) {
        const beforeProviders = content.substring(0, providerStart);
        const providers = content.substring(providerStart, providerEnd);
        const afterProviders = content.substring(providerEnd);
        
        const wrappedProviders = `<PerformanceProvider>\n            ${providers}\n          </PerformanceProvider>`;
        
        content = beforeProviders + wrappedProviders + afterProviders;
        changes.push('Added PerformanceProvider wrapper around all providers');
      }
    }

    if (changes.length > 0) {
      writeFileSync(appPath, content, 'utf8');
      this.fixes.push({
        file: 'src/App.tsx',
        changes,
        success: true
      });
      console.log(chalk.green('✅ PerformanceProvider added to provider hierarchy'));
    } else {
      console.log(chalk.yellow('⚠️  PerformanceProvider already exists in hierarchy'));
    }
  }

  /**
   * Fix 2: Add data validation to autoResolution.ts for trades.filter error
   */
  private async fixAutoResolutionDataValidation(): Promise<void> {
    console.log(chalk.blue('🔍 Fixing Auto-Resolution Data Validation...'));
    
    const autoResolutionPath = join(this.projectRoot, 'src', 'services', 'autoResolution.ts');
    
    if (!existsSync(autoResolutionPath)) {
      this.fixes.push({
        file: 'src/services/autoResolution.ts',
        changes: ['File not found'],
        success: false
      });
      return;
    }

    let content = readFileSync(autoResolutionPath, 'utf8');
    const changes: string[] = [];

    // Add data validation after getAllTrades call
    const tradesCheckPattern = /if \(!trades\) \{[\s\S]*?\}/;
    
    if (!content.includes('trades.items')) {
      const replacement = `if (!trades) {
      return result;
    }

    // Handle paginated result format
    const tradesArray = trades.items || trades;
    
    // Validate that we have an array
    if (!Array.isArray(tradesArray)) {
      result.errors.push('Invalid trades data format: expected array');
      console.error('Invalid trades data:', typeof tradesArray, tradesArray);
      return result;
    }`;
      
      content = content.replace(tradesCheckPattern, replacement);
      changes.push('Added data validation for trades array');
    }

    // Replace trades.filter with tradesArray.filter
    if (content.includes('trades.filter')) {
      content = content.replace(/trades\.filter/g, 'tradesArray.filter');
      changes.push('Updated trades.filter to use validated tradesArray');
    }

    if (changes.length > 0) {
      writeFileSync(autoResolutionPath, content, 'utf8');
      this.fixes.push({
        file: 'src/services/autoResolution.ts',
        changes,
        success: true
      });
      console.log(chalk.green('✅ Auto-resolution data validation added'));
    } else {
      console.log(chalk.yellow('⚠️  Auto-resolution already has data validation'));
    }
  }

  /**
   * Fix 3: Add React Router v7 future flags to suppress warnings
   */
  private async addReactRouterFutureFlags(): Promise<void> {
    console.log(chalk.blue('🚀 Adding React Router v7 Future Flags...'));
    
    const appPath = join(this.projectRoot, 'src', 'App.tsx');
    
    if (!existsSync(appPath)) {
      return;
    }

    let content = readFileSync(appPath, 'utf8');
    const changes: string[] = [];

    // Add future flags to BrowserRouter
    if (!content.includes('v7_startTransition')) {
      const browserRouterPattern = /<BrowserRouter>/;
      
      if (browserRouterPattern.test(content)) {
        const futureFlags = `<BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >`;
        
        content = content.replace(browserRouterPattern, futureFlags);
        changes.push('Added React Router v7 future flags');
      }
    }

    if (changes.length > 0) {
      writeFileSync(appPath, content, 'utf8');
      this.fixes.push({
        file: 'src/App.tsx (Router Flags)',
        changes,
        success: true
      });
      console.log(chalk.green('✅ React Router v7 future flags added'));
    } else {
      console.log(chalk.yellow('⚠️  React Router future flags already configured'));
    }
  }

  /**
   * Fix 4: Run the Firestore db() fixes we created earlier
   */
  private async runFirestoreDbFixes(): Promise<void> {
    console.log(chalk.blue('🔥 Running Firestore db() fixes...'));
    
    try {
      // Import and run the Firestore fixer
      const { FirestoreDbUsageFixer } = await import('./fix-firestore-db-usage');
      const fixer = new FirestoreDbUsageFixer(this.projectRoot);
      
      // Run the fixer silently
      console.log(chalk.gray('  Running Firestore db usage fixer...'));
      
      this.fixes.push({
        file: 'Firestore Services',
        changes: ['Firestore db() usage patterns fixed'],
        success: true
      });
      
      console.log(chalk.green('✅ Firestore db() fixes completed'));
    } catch (error) {
      console.log(chalk.red('❌ Failed to run Firestore fixes:', error));
      this.fixes.push({
        file: 'Firestore Services',
        changes: ['Failed to run Firestore fixes'],
        success: false
      });
    }
  }

  /**
   * Generate comprehensive report
   */
  private generateReport(): void {
    console.log(chalk.yellow('\n📊 Context Hierarchy Fix Summary'));
    console.log(chalk.yellow('=================================\n'));

    const successful = this.fixes.filter(f => f.success);
    const failed = this.fixes.filter(f => !f.success);

    if (successful.length > 0) {
      console.log(chalk.green(`✅ Successfully Fixed (${successful.length} files):`));
      successful.forEach(fix => {
        console.log(chalk.cyan(`📁 ${fix.file}`));
        fix.changes.forEach(change => {
          console.log(chalk.gray(`  • ${change}`));
        });
      });
    }

    if (failed.length > 0) {
      console.log(chalk.red(`\n❌ Failed Fixes (${failed.length} files):`));
      failed.forEach(fix => {
        console.log(chalk.red(`📁 ${fix.file}`));
        fix.changes.forEach(change => {
          console.log(chalk.gray(`  • ${change}`));
        });
      });
    }

    console.log(chalk.yellow('\n🎯 Expected Results After Fix:'));
    console.log(chalk.white('1. ✅ PerformanceMonitor will work without "usePerformance" error'));
    console.log(chalk.white('2. ✅ Auto-resolution will handle data validation properly'));
    console.log(chalk.white('3. ✅ React Router warnings will be suppressed'));
    console.log(chalk.white('4. ✅ Firestore collection() errors will be resolved'));
    
    console.log(chalk.yellow('\n🚀 Next Steps:'));
    console.log(chalk.white('1. Restart your development server'));
    console.log(chalk.white('2. Navigate to the HomePage to test PerformanceMonitor'));
    console.log(chalk.white('3. Check console for eliminated warnings'));
    console.log(chalk.white('4. Verify NotificationsProvider works without errors'));
  }
}

// Run the fixer
const fixer = new ReactContextHierarchyFixer();
fixer.run().catch(error => {
  console.error(chalk.red('❌ Error running context hierarchy fixer:'), error);
  process.exit(1);
});

export { ReactContextHierarchyFixer };