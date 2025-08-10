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
  console.log('🔍 Auditing Updated Components...');
  
  const report = auditUpdatedComponents();
  
  console.log(`📊 Overall Score: ${report.overallScore}/100`);
  console.log(`📋 Total Issues: ${report.summary.totalIssues}`);
  console.log(`🚨 Critical Issues: ${report.summary.criticalIssues}`);
  console.log(`⚠️  High Priority Issues: ${report.summary.highPriorityIssues}`);
  
  if (report.components.length > 0) {
    console.log('\n📝 Component Details:');
    report.components.forEach(component => {
      console.log(`\n${component.componentName}:`);
      console.log(`  Score: ${component.score}/100`);
      console.log(`  Issues: ${component.issues.length}`);
      
      if (component.issues.length > 0) {
        component.issues.forEach(issue => {
          console.log(`    ${issue.severity.toUpperCase()}: ${issue.description}`);
          console.log(`    💡 Suggestion: ${issue.suggestion}`);
        });
      }
    });
  }
  
  return report;
}

// Example 2: Check a new component for consistency
export function testNewComponent() {
  console.log('\n🔍 Testing New Component...');
  
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
  
  console.log(`📋 Found ${newComponentIssues.length} issues:`);
  
  newComponentIssues.forEach(issue => {
    console.log(`\n${issue.severity.toUpperCase()} (${issue.type}):`);
    console.log(`  ${issue.description}`);
    console.log(`  💡 ${issue.suggestion}`);
  });
  
  return newComponentIssues;
}

// Example 3: Check if a component follows our card standards
export function testCardStandards() {
  console.log('\n🎴 Testing Card Standards...');
  
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
    console.log(`\n📋 Testing ${testCase.name}:`);
    const issues = checkNewComponent(testCase.name, testCase.className, testCase.props);
    
    if (issues.length === 0) {
      console.log('  ✅ No issues found - follows standards!');
    } else {
      console.log(`  ❌ Found ${issues.length} issues:`);
      issues.forEach(issue => {
        console.log(`    ${issue.severity.toUpperCase()}: ${issue.description}`);
      });
    }
  });
}

// Run all tests
export function runAllTests() {
  console.log('🚀 Running Component Consistency Tests...\n');
  
  testUpdatedComponents();
  testNewComponent();
  testCardStandards();
  
  console.log('\n✅ All tests completed!');
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