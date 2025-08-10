// Firebase emulator cleanup script
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const DEFAULT_TIMEOUT = 30000; // 30 seconds
let emulatorsRunning = false;

// Helper function to handle emulator commands
async function runEmulatorCommand(command, timeout = DEFAULT_TIMEOUT) {
  try {
    const { stdout, stderr } = await execAsync(command, { timeout });
    if (stderr) {
      console.warn(`Warning during ${command}:`, stderr);
    }
    if (stdout) {
      console.log(`Output from ${command}:`, stdout);
    }
    return true;
  } catch (error) {
    if (error.code === 'ETIMEDOUT') {
      console.error(`Command ${command} timed out after ${timeout}ms`);
    } else {
      console.error(`Error during ${command}:`, error.message);
    }
    return false;
  }
}

// Start emulators before all tests
beforeAll(async () => {
  console.log('Starting Firebase emulators...');
  
  // Check if emulators are already running
  try {
    await execAsync('lsof -i:8080,9199');
    console.log('Emulators already running');
    emulatorsRunning = true;
    return;
  } catch {
    // No emulators running, proceed with startup
  }

  // Start emulators
  const success = await runEmulatorCommand(
    'firebase emulators:start --only firestore,storage --quiet'
  );

  if (success) {
    emulatorsRunning = true;
    console.log('Firebase emulators started successfully');
    
    // Give emulators time to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));
  } else {
    console.warn('Failed to start emulators, tests may fail');
  }
}, DEFAULT_TIMEOUT);

// Stop emulators after all tests
afterAll(async () => {
  if (!emulatorsRunning) {
    return;
  }

  console.log('Stopping Firebase emulators...');
  
  // Try graceful shutdown first
  const success = await runEmulatorCommand(
    'firebase emulators:stop',
    10000 // 10 second timeout for shutdown
  );

  if (!success) {
    console.warn('Graceful shutdown failed, forcing emulator shutdown...');
    
    // Force kill any remaining emulator processes
    try {
      await execAsync('pkill -f "firebase emulators"');
      console.log('Forced emulator shutdown successful');
    } catch (error) {
      console.warn('Error during forced shutdown:', error.message);
    }
  }

  emulatorsRunning = false;
});

// Clean up test data after each test
afterEach(async () => {
  if (!global.testEnv) {
    console.warn('No test environment found for cleanup');
    return;
  }

  try {
    // Clear Firestore data
    await global.testEnv.clearFirestore();
    console.log('Firestore data cleared');

    // Clear Storage data
    await global.testEnv.clearStorage();
    console.log('Storage data cleared');

  } catch (error) {
    console.error('Error during test cleanup:', error);
    // Don't throw here to allow other tests to continue
  }
});

// Handle process termination
process.on('SIGINT', async () => {
  if (emulatorsRunning) {
    console.log('\nReceived SIGINT. Cleaning up emulators...');
    await runEmulatorCommand('firebase emulators:stop');
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  if (emulatorsRunning) {
    console.log('\nReceived SIGTERM. Cleaning up emulators...');
    await runEmulatorCommand('firebase emulators:stop');
  }
  process.exit(0);
});

// Export test environment setup for direct usage
module.exports = {
  setupTestEnvironment: async (projectId) => {
    if (!emulatorsRunning) {
      throw new Error('Firebase emulators not running. Tests cannot proceed.');
    }

    const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
    const { readFileSync } = require('fs');
    const { resolve } = require('path');

    return initializeTestEnvironment({
      projectId,
      firestore: {
        rules: readFileSync(resolve(__dirname, '../../../firestore.rules'), 'utf8'),
        host: 'localhost',
        port: 8080
      },
      storage: {
        rules: readFileSync(resolve(__dirname, '../../../storage.rules'), 'utf8'),
        host: 'localhost',
        port: 9199
      }
    });
  }
};
