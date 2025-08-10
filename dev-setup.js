#!/usr/bin/env node

/**
 * TradeYa Development Setup Script
 * 
 * This script provides a comprehensive development environment setup for the TradeYa project.
 * 
 * Features:
 * - Node.js version validation with detailed requirements
 * - Dependency management with intelligent caching
 * - Environment configuration with template validation
 * - Optional TypeScript error fixing
 * - Development server startup with configuration validation
 * - Enhanced error handling and recovery suggestions
 * 
 * Usage:
 *   node dev-setup.js [options]
 * 
 * Options:
 *   --no-install     Skip dependency installation
 *   --no-env         Skip environment setup
 *   --auto-fix       Automatically fix TypeScript errors without prompting
 *   --start-server   Automatically start development server
 *   --help           Show this help message
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration constants
const CONFIG = {
  NODE_MIN_VERSION: 16,
  NODE_RECOMMENDED_VERSION: 18,
  NPM_MIN_VERSION: '8.0.0',
  SETUP_TIMEOUT: 300000, // 5 minutes
  ENV_TEMPLATE_FILE: '.env.example',
  ENV_FILE: '.env',
  TYPESCRIPT_FIXER: 'fix-ts-errors.js'
};

// ANSI color codes for enhanced terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  
  fg: {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
  }
};

/**
 * Enhanced logging utilities with consistent formatting and error handling
 */
class Logger {
  static info(msg, details = null) {
    console.log(`${colors.fg.blue}ℹ ${colors.reset}${msg}`);
    if (details) this._logDetails(details);
  }

  static success(msg, details = null) {
    console.log(`${colors.fg.green}✓ ${colors.reset}${msg}`);
    if (details) this._logDetails(details);
  }

  static warning(msg, details = null) {
    console.log(`${colors.fg.yellow}⚠ ${colors.reset}${msg}`);
    if (details) this._logDetails(details);
  }

  static error(msg, error = null) {
    console.log(`${colors.fg.red}✗ ${colors.reset}${msg}`);
    if (error) {
      console.log(`${colors.dim}${error.message || error}${colors.reset}`);
      if (error.stack && process.env.NODE_ENV === 'development') {
        console.log(`${colors.dim}${error.stack}${colors.reset}`);
      }
    }
  }

  static title(msg) {
    console.log(`\n${colors.bright}${colors.fg.cyan}${msg}${colors.reset}\n`);
  }

  static step(step, total, description) {
    console.log(`${colors.fg.blue}[${step}/${total}]${colors.reset} ${description}`);
  }

  static _logDetails(details) {
    if (typeof details === 'object') {
      console.log(`${colors.dim}${JSON.stringify(details, null, 2)}${colors.reset}`);
    } else {
      console.log(`${colors.dim}${details}${colors.reset}`);
    }
  }
}

/**
 * Command execution utility with enhanced error handling and timeout support
 */
class CommandRunner {
  static async run(command, options = {}) {
    const {
      silent = false,
      ignoreError = false,
      timeout = CONFIG.SETUP_TIMEOUT,
      description = command
    } = options;

    try {
      Logger.info(`Executing: ${description}`);
      
      const result = execSync(command, {
        encoding: 'utf8',
        stdio: silent ? 'pipe' : 'inherit',
        timeout,
        ...options
      });

      return { success: true, output: result };
    } catch (error) {
      if (ignoreError) {
        return { success: false, output: error.stdout || '', error };
      }
      
      Logger.error(`Command failed: ${description}`, error);
      throw new SetupError(`Failed to execute: ${description}`, error);
    }
  }

  static async runAsync(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args, {
        stdio: options.silent ? 'pipe' : 'inherit',
        ...options
      });

      let output = '';
      if (options.silent && process.stdout) {
        process.stdout.on('data', (data) => {
          output += data.toString();
        });
      }

      process.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, output });
        } else {
          const error = new Error(`Process exited with code ${code}`);
          if (options.ignoreError) {
            resolve({ success: false, output, error });
          } else {
            reject(error);
          }
        }
      });

      process.on('error', (error) => {
        if (options.ignoreError) {
          resolve({ success: false, output, error });
        } else {
          reject(error);
        }
      });
    });
  }
}

/**
 * Custom error class for setup-related errors
 */
class SetupError extends Error {
  constructor(message, originalError = null) {
    super(message);
    this.name = 'SetupError';
    this.originalError = originalError;
  }
}

/**
 * Input handling utility with validation and timeout support
 */
class InputHandler {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async ask(question, options = {}) {
    const { defaultValue = null, validator = null, timeout = 30000 } = options;
    
    const prompt = defaultValue 
      ? `${colors.fg.yellow}? ${colors.reset}${question} (${defaultValue}): `
      : `${colors.fg.yellow}? ${colors.reset}${question}: `;

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.rl.close();
        reject(new SetupError('Input timeout - proceeding with defaults'));
      }, timeout);

      this.rl.question(prompt, (answer) => {
        clearTimeout(timer);
        
        const finalAnswer = answer.trim() || defaultValue;
        
        if (validator && !validator(finalAnswer)) {
          reject(new SetupError('Invalid input provided'));
          return;
        }

        resolve(finalAnswer);
      });
    });
  }

  async askYesNo(question, defaultValue = false) {
    const defaultText = defaultValue ? 'Y/n' : 'y/N';
    const answer = await this.ask(`${question} (${defaultText})`, { 
      defaultValue: defaultValue ? 'y' : 'n' 
    });
    
    return ['y', 'yes', 'true', '1'].includes(answer.toLowerCase());
  }

  close() {
    this.rl.close();
  }
}

/**
 * System requirement validation utilities
 */
class SystemValidator {
  static async validateNodeVersion() {
    Logger.step(1, 6, 'Validating Node.js version');
    
    const nodeVersion = process.version;
    Logger.info(`Current Node.js version: ${nodeVersion}`);
    
    const versionMatch = nodeVersion.match(/^v(\d+)\.(\d+)\.(\d+)/);
    if (!versionMatch) {
      throw new SetupError('Unable to parse Node.js version');
    }

    const [, major, minor, patch] = versionMatch.map(Number);
    const versionNumber = major * 10000 + minor * 100 + patch;
    const minVersionNumber = CONFIG.NODE_MIN_VERSION * 10000;
    const recommendedVersionNumber = CONFIG.NODE_RECOMMENDED_VERSION * 10000;

    if (versionNumber < minVersionNumber) {
      throw new SetupError(
        `Node.js version ${CONFIG.NODE_MIN_VERSION} or higher is required. Current: ${nodeVersion}`,
        new Error(`Please upgrade Node.js from https://nodejs.org/`)
      );
    }

    if (versionNumber < recommendedVersionNumber) {
      Logger.warning(
        `Node.js version ${CONFIG.NODE_RECOMMENDED_VERSION} is recommended for optimal performance. Current: ${nodeVersion}`
      );
    } else {
      Logger.success('Node.js version meets requirements');
    }

    return { major, minor, patch, version: nodeVersion };
  }

  static async validateNpm() {
    Logger.step(2, 6, 'Validating npm installation');
    
    try {
      const result = await CommandRunner.run('npm --version', { 
        silent: true, 
        description: 'Checking npm version' 
      });
      
      const npmVersion = result.output.trim();
      Logger.info(`npm version: ${npmVersion}`);
      
      // Simple version comparison - could be enhanced
      const [npmMajor] = npmVersion.split('.').map(Number);
      const [minMajor] = CONFIG.NPM_MIN_VERSION.split('.').map(Number);
      
      if (npmMajor < minMajor) {
        Logger.warning(`npm version ${CONFIG.NPM_MIN_VERSION} or higher is recommended. Current: ${npmVersion}`);
      } else {
        Logger.success('npm version meets requirements');
      }

      return { version: npmVersion };
    } catch (error) {
      throw new SetupError(
        'npm is not installed or not accessible',
        new Error('Please install npm or ensure it is in your PATH')
      );
    }
  }

  static async checkProjectStructure() {
    Logger.step(3, 6, 'Validating project structure');
    
    const requiredFiles = [
      'package.json',
      'src',
      'public',
      'vite.config.ts'
    ];

    const missingFiles = [];
    
    for (const file of requiredFiles) {
      try {
        await fs.access(file);
      } catch {
        missingFiles.push(file);
      }
    }

    if (missingFiles.length > 0) {
      throw new SetupError(
        `Missing required project files: ${missingFiles.join(', ')}`,
        new Error('Please run this script from the project root directory')
      );
    }

    Logger.success('Project structure validation passed');
    return true;
  }
}

/**
 * Dependency management utilities
 */
class DependencyManager {
  static async checkAndInstallDependencies(skipInstall = false) {
    Logger.step(4, 6, 'Managing project dependencies');
    
    if (skipInstall) {
      Logger.info('Skipping dependency installation (--no-install flag)');
      return false;
    }

    try {
      await fs.access('node_modules');
      
      // Check if package.json is newer than node_modules
      const [packageStats, nodeModulesStats] = await Promise.all([
        fs.stat('package.json'),
        fs.stat('node_modules')
      ]);
      
      if (packageStats.mtime > nodeModulesStats.mtime) {
        Logger.warning('package.json is newer than node_modules - dependencies may be outdated');
        return await this._installDependencies();
      } else {
        Logger.success('Dependencies already installed and up to date');
        return false;
      }
    } catch {
      Logger.info('node_modules not found - installing dependencies');
      return await this._installDependencies();
    }
  }

  static async _installDependencies() {
    try {
      await CommandRunner.run('npm ci', {
        description: 'Installing dependencies with npm ci'
      });
      Logger.success('Dependencies installed successfully');
      return true;
    } catch {
      // Fallback to npm install if npm ci fails
      Logger.warning('npm ci failed, falling back to npm install');
      await CommandRunner.run('npm install', {
        description: 'Installing dependencies with npm install'
      });
      Logger.success('Dependencies installed successfully (fallback)');
      return true;
    }
  }

  static async validateDependencies() {
    try {
      const result = await CommandRunner.run('npm ls --depth=0', {
        silent: true,
        ignoreError: true,
        description: 'Validating installed dependencies'
      });
      
      if (!result.success) {
        Logger.warning('Some dependencies may have issues - consider running npm install');
        return false;
      }
      
      Logger.success('All dependencies are properly installed');
      return true;
    } catch (error) {
      Logger.warning('Unable to validate dependencies', error);
      return false;
    }
  }
}
  
/**
 * Environment configuration management
 */
class EnvironmentManager {
  static async setupEnvironment(skipEnv = false) {
    Logger.step(5, 6, 'Configuring environment variables');
    
    if (skipEnv) {
      Logger.info('Skipping environment setup (--no-env flag)');
      return false;
    }

    try {
      await fs.access(CONFIG.ENV_FILE);
      Logger.success('Environment file already exists');
      
      // Validate existing environment file
      const isValid = await this._validateEnvironmentFile();
      if (!isValid) {
        Logger.warning('Environment file may be incomplete');
        return await this._promptForEnvUpdate();
      }
      
      return false;
    } catch {
      Logger.info('Creating environment configuration');
      return await this._createEnvironmentFile();
    }
  }

  static async _createEnvironmentFile() {
    try {
      // Check for template file
      await fs.access(CONFIG.ENV_TEMPLATE_FILE);
      await fs.copyFile(CONFIG.ENV_TEMPLATE_FILE, CONFIG.ENV_FILE);
      Logger.success(`Created ${CONFIG.ENV_FILE} from ${CONFIG.ENV_TEMPLATE_FILE}`);
      
      Logger.info('Please review and update the environment variables in .env file');
      Logger.info('Key variables to configure:');
      Logger.info('  - Firebase configuration (API keys, project ID, etc.)');
      Logger.info('  - Development server settings');
      Logger.info('  - Third-party service credentials');
      
      return true;
    } catch {
      // Create basic environment file if template doesn't exist
      const basicEnvContent = [
        '# TradeYa Environment Configuration',
        '# Generated by dev-setup.js',
        '',
        'NODE_ENV=development',
        '',
        '# Firebase Configuration (required)',
        '# VITE_API_KEY=your_firebase_api_key',
        '# VITE_AUTH_DOMAIN=your_project.firebaseapp.com',
        '# VITE_PROJECT_ID=your_project_id',
        '# VITE_STORAGE_BUCKET=your_project.appspot.com',
        '# VITE_MESSAGING_SENDER_ID=your_sender_id',
        '# VITE_APP_ID=your_app_id',
        '# VITE_MEASUREMENT_ID=your_measurement_id',
        '',
        '# Development Settings',
        '# VITE_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5174',
        ''
      ].join('\n');

      await fs.writeFile(CONFIG.ENV_FILE, basicEnvContent);
      Logger.warning(`Created basic ${CONFIG.ENV_FILE} file`);
      Logger.warning('Please add your Firebase configuration and other required environment variables');
      
      return true;
    }
  }

  static async _validateEnvironmentFile() {
    try {
      const envContent = await fs.readFile(CONFIG.ENV_FILE, 'utf8');
      const requiredVars = [
        'VITE_API_KEY',
        'VITE_AUTH_DOMAIN',
        'VITE_PROJECT_ID'
      ];

      const hasRequiredVars = requiredVars.some(varName => 
        envContent.includes(varName) && !envContent.includes(`# ${varName}`)
      );

      return hasRequiredVars;
    } catch {
      return false;
    }
  }

  static async _promptForEnvUpdate() {
    // In a non-interactive environment, skip the prompt
    if (!process.stdin.isTTY) {
      Logger.info('Non-interactive environment detected - skipping environment update prompt');
      return false;
    }

    const inputHandler = new InputHandler();
    try {
      const shouldUpdate = await inputHandler.askYesNo(
        'Would you like to update the environment configuration?', 
        false
      );
      
      if (shouldUpdate) {
        return await this._createEnvironmentFile();
      }
      
      return false;
    } finally {
      inputHandler.close();
    }
  }
}

/**
 * TypeScript error fixing utility
 */
class TypeScriptFixer {
  static async offerTypeScriptFix(autoFix = false) {
    Logger.step(6, 6, 'TypeScript error checking');
    
    // Check if TypeScript fixer exists
    try {
      await fs.access(CONFIG.TYPESCRIPT_FIXER);
    } catch {
      Logger.info('TypeScript error fixer not found - skipping');
      return false;
    }

    let shouldFix = autoFix;
    
    if (!autoFix && process.stdin.isTTY) {
      const inputHandler = new InputHandler();
      try {
        shouldFix = await inputHandler.askYesNo(
          'Would you like to run TypeScript error fixing?', 
          false
        );
      } finally {
        inputHandler.close();
      }
    }

    if (shouldFix) {
      try {
        await CommandRunner.run(`node ${CONFIG.TYPESCRIPT_FIXER}`, {
          description: 'Running TypeScript error fixer'
        });
        Logger.success('TypeScript error fixing completed');
        return true;
      } catch (error) {
        Logger.error('TypeScript error fixing failed', error);
        Logger.info('You may need to fix TypeScript errors manually');
        return false;
      }
    }

    return false;
  }
}

/**
 * Development server management
 */
class DevServerManager {
  static async offerServerStart(autoStart = false) {
    Logger.info('Setup completed successfully!');
    
    let shouldStart = autoStart;
    
    if (!autoStart && process.stdin.isTTY) {
      const inputHandler = new InputHandler();
      try {
        shouldStart = await inputHandler.askYesNo(
          'Would you like to start the development server?', 
          true
        );
      } finally {
        inputHandler.close();
      }
    }

    if (shouldStart) {
      Logger.info('Starting development server...');
      Logger.info('Server will be available at http://localhost:5174');
      Logger.info('Press Ctrl+C to stop the server');
      
      try {
        // Use spawn for long-running process
        await CommandRunner.runAsync('npm', ['run', 'dev'], {
          description: 'Starting development server'
        });
      } catch (error) {
        Logger.error('Failed to start development server', error);
        Logger.info('You can start it manually with: npm run dev');
      }
    } else {
      Logger.info('To start the development server later, run: npm run dev');
    }
  }
}

/**
 * Main setup orchestrator
 */
class SetupOrchestrator {
  constructor(options = {}) {
    this.options = {
      skipInstall: false,
      skipEnv: false,
      autoFix: false,
      autoStart: false,
      ...options
    };
  }

  async run() {
    Logger.title('🚀 TradeYa Development Environment Setup');
    
    try {
      // System validation
      await SystemValidator.validateNodeVersion();
      await SystemValidator.validateNpm();
      await SystemValidator.checkProjectStructure();
      
      // Dependency management
      const depsInstalled = await DependencyManager.checkAndInstallDependencies(this.options.skipInstall);
      if (depsInstalled) {
        await DependencyManager.validateDependencies();
      }
      
      // Environment setup
      await EnvironmentManager.setupEnvironment(this.options.skipEnv);
      
      // TypeScript fixes
      await TypeScriptFixer.offerTypeScriptFix(this.options.autoFix);
      
      // Development server
      await DevServerManager.offerServerStart(this.options.autoStart);
      
    } catch (error) {
      this._handleError(error);
    }
  }

  _handleError(error) {
    if (error instanceof SetupError) {
      Logger.error('Setup Error:', error);
      
      if (error.originalError) {
        Logger.info('Suggested solution:', error.originalError.message);
      }
    } else {
      Logger.error('Unexpected error during setup:', error);
    }
    
    Logger.info('\nTroubleshooting steps:');
    Logger.info('1. Ensure you are in the correct project directory');
    Logger.info('2. Check Node.js and npm versions meet requirements');
    Logger.info('3. Verify network connectivity for package downloads');
    Logger.info('4. Try running individual commands manually');
    Logger.info('5. Check the project documentation for additional setup steps');
    
    process.exit(1);
  }
}

/**
 * Command line argument parsing
 */
function parseArguments(argv) {
  const options = {
    skipInstall: false,
    skipEnv: false,
    autoFix: false,
    autoStart: false,
    showHelp: false
  };

  for (const arg of argv.slice(2)) {
    switch (arg) {
      case '--no-install':
        options.skipInstall = true;
        break;
      case '--no-env':
        options.skipEnv = true;
        break;
      case '--auto-fix':
        options.autoFix = true;
        break;
      case '--start-server':
        options.autoStart = true;
        break;
      case '--help':
      case '-h':
        options.showHelp = true;
        break;
      default:
        if (arg.startsWith('--')) {
          Logger.warning(`Unknown option: ${arg}`);
        }
    }
  }

  return options;
}

/**
 * Display help information
 */
function showHelp() {
  console.log(`
${colors.bright}TradeYa Development Setup Script${colors.reset}

${colors.fg.cyan}USAGE:${colors.reset}
  node dev-setup.js [options]

${colors.fg.cyan}OPTIONS:${colors.reset}
  --no-install     Skip dependency installation
  --no-env         Skip environment setup
  --auto-fix       Automatically fix TypeScript errors without prompting
  --start-server   Automatically start development server
  --help, -h       Show this help message

${colors.fg.cyan}EXAMPLES:${colors.reset}
  node dev-setup.js                    # Interactive setup
  node dev-setup.js --auto-fix         # Auto-fix TypeScript errors
  node dev-setup.js --no-install       # Skip dependency installation
  node dev-setup.js --start-server     # Auto-start development server

${colors.fg.cyan}REQUIREMENTS:${colors.reset}
  - Node.js ${CONFIG.NODE_MIN_VERSION}+ (recommended: ${CONFIG.NODE_RECOMMENDED_VERSION}+)
  - npm ${CONFIG.NPM_MIN_VERSION}+
  - Git (for dependency installation)

${colors.fg.cyan}DOCUMENTATION:${colors.reset}
  For more information, see the project README.md
`);
}

/**
 * Main entry point
 */
async function main() {
  const options = parseArguments(process.argv);
  
  if (options.showHelp) {
    showHelp();
    return;
  }

  const orchestrator = new SetupOrchestrator(options);
  await orchestrator.run();
}

// Handle process signals gracefully
process.on('SIGINT', () => {
  Logger.info('\nSetup interrupted by user');
  process.exit(0);
});

process.on('SIGTERM', () => {
  Logger.info('\nSetup terminated');
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  Logger.error('Unhandled Promise Rejection:', reason);
  process.exit(1);
});

// Run main function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    Logger.error('Fatal error during setup:', error);
    process.exit(1);
  });
}

export {
  SetupOrchestrator,
  SystemValidator,
  DependencyManager,
  EnvironmentManager,
  TypeScriptFixer,
  DevServerManager,
  Logger,
  CommandRunner,
  SetupError
};
