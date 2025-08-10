#!/usr/bin/env node

/**
 * Dependency Update Script
 * 
 * Safely updates dependencies while checking for breaking changes
 * and maintaining compatibility
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

interface DependencyInfo {
  name: string;
  current: string;
  wanted: string;
  latest: string;
  location: string;
  type: 'dependencies' | 'devDependencies';
}

interface UpdatePlan {
  safe: DependencyInfo[];
  risky: DependencyInfo[];
  breaking: DependencyInfo[];
}

class DependencyUpdater {
  private packageJsonPath: string;
  private packageJson: any;

  constructor() {
    this.packageJsonPath = path.join(process.cwd(), 'package.json');
    this.packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf-8'));
  }

  async analyzeUpdates(): Promise<UpdatePlan> {
    console.log('🔍 Analyzing dependency updates...');
    
    try {
      const outdatedOutput = execSync('npm outdated --json', { 
        encoding: 'utf-8',
        stdio: 'pipe'
      });
      
      const outdated = JSON.parse(outdatedOutput);
      return this.categorizeUpdates(outdated);
    } catch (error: any) {
      // npm outdated returns exit code 1 when there are outdated packages
      if (error.stdout) {
        try {
          const outdated = JSON.parse(error.stdout);
          return this.categorizeUpdates(outdated);
        } catch (parseError) {
          console.log('No outdated dependencies found or unable to parse output');
          return { safe: [], risky: [], breaking: [] };
        }
      }
      return { safe: [], risky: [], breaking: [] };
    }
  }

  private categorizeUpdates(outdated: Record<string, any>): UpdatePlan {
    const plan: UpdatePlan = { safe: [], risky: [], breaking: [] };
    
    Object.entries(outdated).forEach(([name, info]: [string, any]) => {
      const depInfo: DependencyInfo = {
        name,
        current: info.current,
        wanted: info.wanted,
        latest: info.latest,
        location: info.location,
        type: this.getDependencyType(name)
      };
      
      if (this.isBreakingChange(info.current, info.latest)) {
        plan.breaking.push(depInfo);
      } else if (this.isRiskyUpdate(name, info.current, info.latest)) {
        plan.risky.push(depInfo);
      } else {
        plan.safe.push(depInfo);
      }
    });
    
    return plan;
  }

  private getDependencyType(name: string): 'dependencies' | 'devDependencies' {
    if (this.packageJson.dependencies && this.packageJson.dependencies[name]) {
      return 'dependencies';
    }
    return 'devDependencies';
  }

  private isBreakingChange(current: string, latest: string): boolean {
    const currentMajor = this.getMajorVersion(current);
    const latestMajor = this.getMajorVersion(latest);
    
    return latestMajor > currentMajor;
  }

  private isRiskyUpdate(name: string, current: string, latest: string): boolean {
    const riskyPackages = [
      'react', 'react-dom', 'typescript', 'vite', 'tailwindcss',
      'firebase', '@types/react', '@types/react-dom'
    ];
    
    const currentMinor = this.getMinorVersion(current);
    const latestMinor = this.getMinorVersion(latest);
    
    return riskyPackages.includes(name) && latestMinor > currentMinor;
  }

  private getMajorVersion(version: string): number {
    const match = version.match(/^(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  private getMinorVersion(version: string): number {
    const match = version.match(/^\d+\.(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  async updateSafeDependencies(safeDeps: DependencyInfo[]): Promise<void> {
    if (safeDeps.length === 0) {
      console.log('✅ No safe updates available');
      return;
    }

    console.log(`📦 Updating ${safeDeps.length} safe dependencies...`);
    
    const depNames = safeDeps.map(dep => dep.name);
    const devDepNames = safeDeps.filter(dep => dep.type === 'devDependencies').map(dep => dep.name);
    const prodDepNames = safeDeps.filter(dep => dep.type === 'dependencies').map(dep => dep.name);
    
    try {
      if (prodDepNames.length > 0) {
        console.log(`  Updating production dependencies: ${prodDepNames.join(', ')}`);
        execSync(`npm update ${prodDepNames.join(' ')}`, { stdio: 'inherit' });
      }
      
      if (devDepNames.length > 0) {
        console.log(`  Updating dev dependencies: ${devDepNames.join(', ')}`);
        execSync(`npm update ${devDepNames.join(' ')}`, { stdio: 'inherit' });
      }
      
      console.log('✅ Safe dependencies updated successfully');
    } catch (error) {
      console.error('❌ Failed to update safe dependencies:', error);
      throw error;
    }
  }

  async auditSecurity(): Promise<void> {
    console.log('🔒 Running security audit...');
    
    try {
      execSync('npm audit --audit-level moderate', { stdio: 'inherit' });
      console.log('✅ Security audit passed');
    } catch (error) {
      console.log('⚠️ Security vulnerabilities found. Running automatic fix...');
      
      try {
        execSync('npm audit fix', { stdio: 'inherit' });
        console.log('✅ Security vulnerabilities fixed');
      } catch (fixError) {
        console.error('❌ Could not automatically fix all vulnerabilities');
        console.log('Please review the audit report and fix manually');
      }
    }
  }

  async checkCompatibility(): Promise<boolean> {
    console.log('🧪 Checking compatibility...');
    
    try {
      // Run TypeScript check
      execSync('npx tsc --noEmit', { stdio: 'pipe' });
      console.log('✅ TypeScript compilation check passed');
      
      // Run linting
      execSync('npm run lint', { stdio: 'pipe' });
      console.log('✅ Linting check passed');
      
      return true;
    } catch (error) {
      console.error('❌ Compatibility check failed');
      return false;
    }
  }

  generateUpdateReport(plan: UpdatePlan): void {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        safe: plan.safe.length,
        risky: plan.risky.length,
        breaking: plan.breaking.length,
        total: plan.safe.length + plan.risky.length + plan.breaking.length
      },
      updates: plan,
      recommendations: this.generateRecommendations(plan)
    };
    
    fs.writeFileSync('dependency-update-report.json', JSON.stringify(report, null, 2));
    console.log('\n📊 Dependency Update Report');
    console.log('===========================');
    console.log(`Safe updates: ${plan.safe.length}`);
    console.log(`Risky updates: ${plan.risky.length}`);
    console.log(`Breaking changes: ${plan.breaking.length}`);
    
    if (plan.breaking.length > 0) {
      console.log('\n⚠️ Breaking Changes Detected:');
      plan.breaking.forEach(dep => {
        console.log(`  ${dep.name}: ${dep.current} → ${dep.latest}`);
      });
    }
    
    if (plan.risky.length > 0) {
      console.log('\n🔶 Risky Updates:');
      plan.risky.forEach(dep => {
        console.log(`  ${dep.name}: ${dep.current} → ${dep.latest}`);
      });
    }
    
    console.log('\nDetailed report saved to: dependency-update-report.json');
  }

  private generateRecommendations(plan: UpdatePlan): string[] {
    const recommendations = [];
    
    if (plan.safe.length > 0) {
      recommendations.push('Apply safe updates immediately');
    }
    
    if (plan.risky.length > 0) {
      recommendations.push('Test risky updates in a separate branch');
      recommendations.push('Review changelogs for risky packages');
    }
    
    if (plan.breaking.length > 0) {
      recommendations.push('Plan migration strategy for breaking changes');
      recommendations.push('Create feature branch for major version updates');
      recommendations.push('Update tests and documentation for breaking changes');
    }
    
    recommendations.push('Run full test suite after updates');
    recommendations.push('Monitor application performance after updates');
    
    return recommendations;
  }

  async run(options: { safeOnly?: boolean; skipAudit?: boolean } = {}): Promise<void> {
    try {
      // Analyze updates
      const plan = await this.analyzeUpdates();
      this.generateUpdateReport(plan);
      
      // Security audit
      if (!options.skipAudit) {
        await this.auditSecurity();
      }
      
      // Apply safe updates
      if (plan.safe.length > 0) {
        if (options.safeOnly || plan.breaking.length === 0) {
          await this.updateSafeDependencies(plan.safe);
          
          // Check compatibility after updates
          const compatible = await this.checkCompatibility();
          if (!compatible) {
            console.log('⚠️ Compatibility issues detected after updates');
            console.log('Please review and fix before proceeding');
          }
        } else {
          console.log('⚠️ Breaking changes detected. Skipping automatic updates.');
          console.log('Please review the report and update manually.');
        }
      }
      
      console.log('\n✅ Dependency update process completed');
      
    } catch (error) {
      console.error('❌ Dependency update failed:', error);
      process.exit(1);
    }
  }
}

// CLI execution
async function main() {
  const args = process.argv.slice(2);
  const options = {
    safeOnly: args.includes('--safe-only'),
    skipAudit: args.includes('--skip-audit')
  };
  
  const updater = new DependencyUpdater();
  await updater.run(options);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { DependencyUpdater };
