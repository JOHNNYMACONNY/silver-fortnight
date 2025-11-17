/**
 * Simple script to run the comprehensive consistency checker
 * 
 * Usage:
 * 1. Import this file
 * 2. Call runComprehensiveCheck()
 * 3. Get detailed results in console
 */

import { comprehensiveAppAudit, quickComponentCheck } from './comprehensiveConsistencyChecker';
import { logger } from '@utils/logging/logger';

/**
 * Run comprehensive consistency check and log results
 */
export function runComprehensiveCheck() {
  logger.debug('🔍 Starting Comprehensive App Consistency Check...\n', 'UTILITY');
  
  const startTime = performance.now();
  const report = comprehensiveAppAudit();
  const endTime = performance.now();
  
  logger.debug('📊 COMPREHENSIVE CONSISTENCY REPORT', 'UTILITY');
  logger.debug('=====================================\n', 'UTILITY');
  
  // Overall Score
  logger.debug(`🎯 Overall Score: ${report.overallScore}/100`, 'UTILITY');
  logger.debug(`⏱️  Check completed in ${(endTime - startTime).toFixed(2)}ms\n`, 'UTILITY');
  
  // Summary
  logger.debug('📋 SUMMARY:', 'UTILITY');
  logger.debug(`   Total Issues: ${report.summary.totalIssues}`, 'UTILITY');
  logger.debug(`   Critical: ${report.summary.criticalIssues}`, 'UTILITY');
  logger.debug(`   High Priority: ${report.summary.highPriorityIssues}`, 'UTILITY');
  logger.debug(`   Medium Priority: ${report.summary.mediumPriorityIssues}`, 'UTILITY');
  logger.debug(`   Low Priority: ${report.summary.lowPriorityIssues}\n`, 'UTILITY');
  
  // Category Scores
  logger.debug('📊 CATEGORY SCORES:', 'UTILITY');
  logger.debug(`   Pages: ${report.categories.pages.score}/100 (${report.categories.pages.totalItems} issues)`, 'UTILITY');
  logger.debug(`   Components: ${report.categories.components.score}/100 (${report.categories.components.totalItems} issues)`, 'UTILITY');
  logger.debug(`   Modals: ${report.categories.modals.score}/100 (${report.categories.modals.totalItems} issues)`, 'UTILITY');
  logger.debug(`   Layout: ${report.categories.layout.score}/100 (${report.categories.layout.totalItems} issues)`, 'UTILITY');
  logger.debug(`   UI: ${report.categories.ui.score}/100 (${report.categories.ui.totalItems} issues)\n`, 'UTILITY');
  
  // Critical Issues
  const criticalIssues = report.issues.filter(issue => issue.severity === 'critical');
  if (criticalIssues.length > 0) {
    logger.debug('🚨 CRITICAL ISSUES:', 'UTILITY');
    criticalIssues.forEach((issue, index) => {
      logger.debug(`   ${index + 1}. ${issue.component} (${issue.category})`, 'UTILITY');
      logger.debug(`      ${issue.description}`, 'UTILITY');
      logger.debug(`      💡 ${issue.suggestion}`, 'UTILITY');
      if (issue.filePath) {
        logger.debug(`      📁 ${issue.filePath}`, 'UTILITY');
      }
      logger.debug('', 'UTILITY');
    });
  } else {
    logger.debug('✅ No critical issues found!\n', 'UTILITY');
  }
  
  // High Priority Issues
  const highIssues = report.issues.filter(issue => issue.severity === 'high');
  if (highIssues.length > 0) {
    logger.debug('⚠️  HIGH PRIORITY ISSUES:', 'UTILITY');
    highIssues.slice(0, 5).forEach((issue, index) => {
      logger.debug(`   ${index + 1}. ${issue.component} (${issue.category})`, 'UTILITY');
      logger.debug(`      ${issue.description}`, 'UTILITY');
      logger.debug(`      💡 ${issue.suggestion}`, 'UTILITY');
      logger.debug('', 'UTILITY');
    });
    
    if (highIssues.length > 5) {
      logger.debug(`   ... and ${highIssues.length - 5} more high priority issues\n`, 'UTILITY');
    }
  }
  
  // Recommendations
  logger.debug('💡 RECOMMENDATIONS:', 'UTILITY');
  if (report.overallScore >= 90) {
    logger.debug('   🎉 Excellent consistency! Keep up the great work!', 'UTILITY');
  } else if (report.overallScore >= 70) {
    logger.debug('   👍 Good consistency! Focus on fixing critical and high priority issues.', 'UTILITY');
  } else {
    logger.debug('   🔧 Needs attention! Prioritize fixing critical issues first.', 'UTILITY');
  }
  
  logger.debug('\n📊 Full report available at: /consistency-checker', 'UTILITY');
  logger.debug('🔄 Run this function again to re-check after making changes', 'UTILITY');
  
  return report;
}

/**
 * Quick check for a specific component
 */
export function runQuickCheck(componentName: string, className?: string, props?: any) {
  logger.debug(`🔍 Quick Check: ${componentName}`, 'UTILITY');
  logger.debug('=====================================\n', 'UTILITY');
  
  const issues = quickComponentCheck(componentName, className, props);
  
  if (issues.length === 0) {
    logger.debug('✅ No issues found for this component!', 'UTILITY');
  } else {
    logger.debug(`⚠️  Found ${issues.length} issue(s):`, 'UTILITY');
    issues.forEach((issue, index) => {
      logger.debug(`   ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.description}`, 'UTILITY');
      logger.debug(`      💡 ${issue.suggestion}`, 'UTILITY');
      logger.debug('', 'UTILITY');
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
  
  logger.debug('🔧 Consistency Checker loaded!', 'UTILITY');
  logger.debug('   Run: runComprehensiveCheck() for full audit', 'UTILITY');
  logger.debug('   Run: runQuickCheck("ComponentName") for specific component', 'UTILITY');
} 