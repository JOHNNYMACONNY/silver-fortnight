import { roleMonitoringTestRunner, TestResult } from './roleMonitoringTestRunner';

/**
 * Structured test logger for role management tests
 */
interface TestLogger {
  info: (message: string, details?: any) => void;
  success: (message: string, details?: any) => void;
  error: (message: string, details?: any) => void;
}

const testLogger: TestLogger = {
  info: (message: string, details?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[RoleTest] ${message}`, details || '');
    }
  },
  
  success: (message: string, details?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[RoleTest] ✓ ${message}`, details || '');
    }
  },
  
  error: (message: string, details?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[RoleTest] ✗ ${message}`, details || '');
    }
  }
};

async function runRoleManagementTests() {
  testLogger.info('Starting Role Management Flow Tests...');

  const testCollabId = `test-collab-${Date.now()}`;
  const results: TestResult[] = [];

  try {
    // Test 1: Create collaboration with multiple roles
    testLogger.info('Test 1: Creating collaboration with multiple roles...');
    const createResult = await roleMonitoringTestRunner.runTestScenario({
      name: 'create-multi-roles',
      roles: [
        { title: 'Developer', skills: ['React', 'TypeScript'] },
        { title: 'Designer', skills: ['UI/UX', 'Figma'] }
      ]
    }, testCollabId);
    results.push(createResult);
    
    if (createResult.success) {
      testLogger.success('Creation test passed');
    } else {
      testLogger.error('Creation test failed', { issues: createResult.health.issues });
    }

    // Test 2: Update existing roles
    testLogger.info('Test 2: Updating existing roles...');
    const updateResult = await roleMonitoringTestRunner.runTestScenario({
      name: 'update-roles',
      operations: ['edit', 'delete', 'add'] as const
    }, testCollabId);
    results.push(updateResult);
    
    if (updateResult.success) {
      testLogger.success('Update test passed');
    } else {
      testLogger.error('Update test failed', { issues: updateResult.health.issues });
    }

    // Test 3: Edge cases
    testLogger.info('Test 3: Testing edge cases...');
    const edgeCaseResult = await roleMonitoringTestRunner.runTestScenario({
      name: 'edge-cases',
      scenarios: ['concurrent-edits', 'network-error', 'validation-error'] as const
    }, testCollabId);
    results.push(edgeCaseResult);
    
    if (edgeCaseResult.success) {
      testLogger.success('Edge case test passed');
    } else {
      testLogger.error('Edge case test failed', { issues: edgeCaseResult.health.issues });
    }

    // Generate summary report
    const passedTests = results.filter(r => r.success).length;
    const failedTests = results.filter(r => !r.success).length;
    
    testLogger.info('Test Summary', {
      totalTests: results.length,
      passed: passedTests,
      failed: failedTests
    });

    // Detailed results
    results.forEach((result, index) => {
      const testDetails: Record<string, any> = {
        testNumber: index + 1,
        scenarioName: result.scenarioName,
        status: result.success ? 'PASSED' : 'FAILED',
        operationsCount: result.operations.length,
        duration: result.duration
      };

      if (result.health.issues.length > 0) {
        testDetails.issues = result.health.issues;
      }

      const failedOps = result.operations.filter((op: any) => op.status === 'failed');
      if (failedOps.length > 0) {
        testDetails.failedOperations = failedOps.map((op: any) => ({
          type: op.type,
          error: op.error
        }));
      }

      if (result.success) {
        testLogger.success(`Test ${index + 1}: ${result.scenarioName}`, testDetails);
      } else {
        testLogger.error(`Test ${index + 1}: ${result.scenarioName}`, testDetails);
      }
    });

  } catch (error) {
    testLogger.error('Test execution failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    throw error;
  }

  return {
    success: results.every(r => r.success),
    results,
    summary: {
      total: results.length,
      passed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    }
  };
}

// Execute tests when run directly
if (require.main === module) {
  runRoleManagementTests()
    .then(results => {
      if (!results.success) {
        process.exit(1);
      }
    })
    .catch(error => {
      testLogger.error('Test execution failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      process.exit(1);
    });
}

export { runRoleManagementTests };