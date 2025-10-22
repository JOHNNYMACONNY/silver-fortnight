/**
 * Simple script to run the comprehensive consistency checker
 * 
 * Usage:
 * 1. Import this file
 * 2. Call runComprehensiveCheck()
 * 3. Get detailed results in console
 */

import { comprehensiveAppAudit, quickComponentCheck } from './comprehensiveConsistencyChecker';

/**
 * Run comprehensive consistency check and log results
 */
export function runComprehensiveCheck() {
  console.log('🔍 Starting Comprehensive App Consistency Check...\n');
  
  const startTime = performance.now();
  const report = comprehensiveAppAudit();
  const endTime = performance.now();
  
  console.log('📊 COMPREHENSIVE CONSISTENCY REPORT');
  console.log('=====================================\n');
  
  // Overall Score
  console.log(`🎯 Overall Score: ${report.overallScore}/100`);
  console.log(`⏱️  Check completed in ${(endTime - startTime).toFixed(2)}ms\n`);
  
  // Summary
  console.log('📋 SUMMARY:');
  console.log(`   Total Issues: ${report.summary.totalIssues}`);
  console.log(`   Critical: ${report.summary.criticalIssues}`);
  console.log(`   High Priority: ${report.summary.highPriorityIssues}`);
  console.log(`   Medium Priority: ${report.summary.mediumPriorityIssues}`);
  console.log(`   Low Priority: ${report.summary.lowPriorityIssues}\n`);
  
  // Category Scores
  console.log('📊 CATEGORY SCORES:');
  console.log(`   Pages: ${report.categories.pages.score}/100 (${report.categories.pages.totalItems} issues)`);
  console.log(`   Components: ${report.categories.components.score}/100 (${report.categories.components.totalItems} issues)`);
  console.log(`   Modals: ${report.categories.modals.score}/100 (${report.categories.modals.totalItems} issues)`);
  console.log(`   Layout: ${report.categories.layout.score}/100 (${report.categories.layout.totalItems} issues)`);
  console.log(`   UI: ${report.categories.ui.score}/100 (${report.categories.ui.totalItems} issues)\n`);
  
  // Critical Issues
  const criticalIssues = report.issues.filter(issue => issue.severity === 'critical');
  if (criticalIssues.length > 0) {
    console.log('🚨 CRITICAL ISSUES:');
    criticalIssues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue.component} (${issue.category})`);
      console.log(`      ${issue.description}`);
      console.log(`      💡 ${issue.suggestion}`);
      if (issue.filePath) {
        console.log(`      📁 ${issue.filePath}`);
      }
      console.log('');
    });
  } else {
    console.log('✅ No critical issues found!\n');
  }
  
  // High Priority Issues
  const highIssues = report.issues.filter(issue => issue.severity === 'high');
  if (highIssues.length > 0) {
    console.log('⚠️  HIGH PRIORITY ISSUES:');
    highIssues.slice(0, 5).forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue.component} (${issue.category})`);
      console.log(`      ${issue.description}`);
      console.log(`      💡 ${issue.suggestion}`);
      console.log('');
    });
    
    if (highIssues.length > 5) {
      console.log(`   ... and ${highIssues.length - 5} more high priority issues\n`);
    }
  }
  
  // Recommendations
  console.log('💡 RECOMMENDATIONS:');
  if (report.overallScore >= 90) {
    console.log('   🎉 Excellent consistency! Keep up the great work!');
  } else if (report.overallScore >= 70) {
    console.log('   👍 Good consistency! Focus on fixing critical and high priority issues.');
  } else {
    console.log('   🔧 Needs attention! Prioritize fixing critical issues first.');
  }
  
  console.log('\n📊 Full report available at: /consistency-checker');
  console.log('🔄 Run this function again to re-check after making changes');
  
  return report;
}

/**
 * Quick check for a specific component
 */
export function runQuickCheck(componentName: string, className?: string, props?: any) {
  console.log(`🔍 Quick Check: ${componentName}`);
  console.log('=====================================\n');
  
  const issues = quickComponentCheck(componentName, className, props);
  
  if (issues.length === 0) {
    console.log('✅ No issues found for this component!');
  } else {
    console.log(`⚠️  Found ${issues.length} issue(s):`);
    issues.forEach((issue, index) => {
      console.log(`   ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.description}`);
      console.log(`      💡 ${issue.suggestion}`);
      console.log('');
    });
  }
  
  return issues;
}

/**
 * Export to global scope for browser console access
 */
if (typeof window !== 'undefined') {
  (window as any).runComprehensiveCheck = runComprehensiveCheck;
  (window as any).runQuickCheck = runQuickCheck;
  
  console.log('🔧 Consistency Checker loaded!');
  console.log('   Run: runComprehensiveCheck() for full audit');
  console.log('   Run: runQuickCheck("ComponentName") for specific component');
} 