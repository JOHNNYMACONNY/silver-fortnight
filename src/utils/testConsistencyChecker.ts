import { logger } from '@utils/logging/logger';
/**
 * Test script for Component Consistency Checker
 * 
 * This demonstrates how to use the consistency checker with our updated components
 */

import { 
  auditUpdatedComponents, 
  checkNewComponent, 
  generateConsistencyReport 
} from './componentConsistencyChecker';

// Example 1: Audit our updated components
export function testUpdatedComponents() {
  logger.debug('🔍 Auditing Updated Components...', 'UTILITY');
  
  const report = auditUpdatedComponents();
  
  logger.debug(`📊 Overall Score: ${report.overallScore}/100`, 'UTILITY');
  logger.debug(`📋 Total Issues: ${report.summary.totalIssues}`, 'UTILITY');
  logger.debug(`🚨 Critical Issues: ${report.summary.criticalIssues}`, 'UTILITY');
  logger.debug(`⚠️  High Priority Issues: ${report.summary.highPriorityIssues}`, 'UTILITY');
  
  if (report.components.length > 0) {
    logger.debug('\n📝 Component Details:', 'UTILITY');
    report.components.forEach(component => {
      logger.debug(`\n${component.componentName}:`, 'UTILITY');
      logger.debug(`  Score: ${component.score}/100`, 'UTILITY');
      logger.debug(`  Issues: ${component.issues.length}`, 'UTILITY');
      
      if (component.issues.length > 0) {
        component.issues.forEach(issue => {
          logger.debug(`    ${issue.severity.toUpperCase()}: ${issue.description}`, 'UTILITY');
          logger.debug(`    💡 Suggestion: ${issue.suggestion}`, 'UTILITY');
        });
      }
    });
  }
  
  return report;
}

// Example 2: Check a new component for consistency
export function testNewComponent() {
  logger.debug('\n🔍 Testing New Component...', 'UTILITY');
  
  // Simulate a new component that might not follow our standards
  const newComponentIssues = checkNewComponent(
    'NewFeatureCard',
    'h-[300px] flex flex-col', // Wrong height!
    {
      variant: 'default', // Wrong variant!
      glowColor: 'red', // Wrong color!
      tilt: false // Missing tilt!
    }
  );
  
  logger.debug(`📋 Found ${newComponentIssues.length} issues:`, 'UTILITY');
  
  newComponentIssues.forEach(issue => {
    logger.debug(`\n${issue.severity.toUpperCase()} (${issue.type}):`, 'UTILITY');
    logger.debug(`  ${issue.description}`, 'UTILITY');
    logger.debug(`  💡 ${issue.suggestion}`, 'UTILITY');
  });
  
  return newComponentIssues;
}

// Example 3: Check if a component follows our card standards
export function testCardStandards() {
  logger.debug('\n🎴 Testing Card Standards...', 'UTILITY');
  
  const testCases = [
    {
      name: 'GoodCard',
      className: 'h-[380px] flex flex-col cursor-pointer overflow-hidden',
      props: {
        variant: 'premium',
        glowColor: 'purple',
        tilt: true,
        depth: 'lg'
      }
    },
    {
      name: 'BadCard',
      className: 'h-[300px] flex', // Wrong height and missing classes
      props: {
        variant: 'default', // Wrong variant
        glowColor: 'red', // Wrong color
        tilt: false // Missing tilt
      }
    }
  ];
  
  testCases.forEach(testCase => {
    logger.debug(`\n📋 Testing ${testCase.name}:`, 'UTILITY');
    const issues = checkNewComponent(testCase.name, testCase.className, testCase.props);
    
    if (issues.length === 0) {
      logger.debug('  ✅ No issues found - follows standards!', 'UTILITY');
    } else {
      logger.debug(`  ❌ Found ${issues.length} issues:`, 'UTILITY');
      issues.forEach(issue => {
        logger.debug(`    ${issue.severity.toUpperCase()}: ${issue.description}`, 'UTILITY');
      });
    }
  });
}

// Run all tests
export function runAllTests() {
  logger.debug('🚀 Running Component Consistency Tests...\n', 'UTILITY');
  
  testUpdatedComponents();
  testNewComponent();
  testCardStandards();
  
  logger.debug('\n✅ All tests completed!', 'UTILITY');
}

// Export for use in development
if (typeof window !== 'undefined') {
  (window as any).testConsistencyChecker = {
    testUpdatedComponents,
    testNewComponent,
    testCardStandards,
    runAllTests
  };
} 