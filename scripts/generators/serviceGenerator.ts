#!/usr/bin/env node

/**
 * Service Generator CLI
 * 
 * Generates service classes with TypeScript interfaces and tests
 * Usage: npm run generate:service <ServiceName> [options]
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ServiceGeneratorOptions {
  name: string;
  type: 'api' | 'utility' | 'data' | 'performance';
  withTests: boolean;
  withInterface: boolean;
  withMocks: boolean;
  directory?: string;
}

class ServiceGenerator {
  private options: ServiceGeneratorOptions;
  private servicePath: string;

  constructor(options: ServiceGeneratorOptions) {
    this.options = options;
    this.servicePath = this.getServicePath();
  }

  private getServicePath(): string {
    const basePath = path.join(process.cwd(), 'src');
    
    if (this.options.directory) {
      return path.join(basePath, this.options.directory);
    }

    switch (this.options.type) {
      case 'api':
        return path.join(basePath, 'services', 'api');
      case 'performance':
        return path.join(basePath, 'services', 'performance');
      case 'data':
        return path.join(basePath, 'services', 'data');
      default:
        return path.join(basePath, 'services');
    }
  }

  async generate(): Promise<void> {
    console.log(`🚀 Generating ${this.options.type} service: ${this.options.name}`);

    try {
      await this.createDirectory();
      
      if (this.options.withInterface) {
        await this.generateInterface();
      }
      
      await this.generateService();
      
      if (this.options.withTests) {
        await this.generateTest();
      }
      
      if (this.options.withMocks) {
        await this.generateMocks();
      }

      console.log(`✅ Successfully generated ${this.options.name}Service`);
      console.log(`📁 Location: ${this.servicePath}`);
    } catch (error) {
      console.error('❌ Generation failed:', error);
      process.exit(1);
    }
  }

  private async createDirectory(): Promise<void> {
    await fs.mkdir(this.servicePath, { recursive: true });
  }

  private async generateInterface(): Promise<void> {
    const template = this.getInterfaceTemplate();
    const filePath = path.join(this.servicePath, `${this.options.name.toLowerCase()}.types.ts`);
    await fs.writeFile(filePath, template);
  }

  private async generateService(): Promise<void> {
    const template = this.getServiceTemplate();
    const filePath = path.join(this.servicePath, `${this.options.name.toLowerCase()}Service.ts`);
    await fs.writeFile(filePath, template);
  }

  private async generateTest(): Promise<void> {
    const template = this.getTestTemplate();
    const filePath = path.join(this.servicePath, `${this.options.name.toLowerCase()}Service.test.ts`);
    await fs.writeFile(filePath, template);
  }

  private async generateMocks(): Promise<void> {
    const template = this.getMockTemplate();
    const filePath = path.join(this.servicePath, `__mocks__`, `${this.options.name.toLowerCase()}Service.ts`);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, template);
  }

  private getInterfaceTemplate(): string {
    const { name } = this.options;
    const serviceName = `${name}Service`;
    
    return `/**
 * ${serviceName} Types
 * 
 * TypeScript interfaces and types for ${serviceName}
 */

export interface ${name}Config {
  /**
   * Service configuration options
   */
  enabled: boolean;
  timeout: number;
  retryAttempts: number;
}

export interface ${name}Data {
  /**
   * Data structure for ${name}
   */
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ${name}Result {
  /**
   * Result structure for ${name} operations
   */
  success: boolean;
  data?: ${name}Data;
  error?: string;
}

export interface ${name}Options {
  /**
   * Options for ${name} operations
   */
  force?: boolean;
  timeout?: number;
}

export interface I${serviceName} {
  /**
   * Service interface for ${serviceName}
   */
  initialize(config: ${name}Config): Promise<void>;
  process(data: Partial<${name}Data>, options?: ${name}Options): Promise<${name}Result>;
  cleanup(): Promise<void>;
  getStatus(): ${name}Status;
}

export interface ${name}Status {
  /**
   * Service status information
   */
  isInitialized: boolean;
  isProcessing: boolean;
  lastOperation: Date | null;
  operationCount: number;
}

export type ${name}Event = 
  | { type: 'initialized'; config: ${name}Config }
  | { type: 'processing'; data: ${name}Data }
  | { type: 'completed'; result: ${name}Result }
  | { type: 'error'; error: string };
`;
  }

  private getServiceTemplate(): string {
    const { name } = this.options;
    const serviceName = `${name}Service`;
    const interfaceImport = this.options.withInterface 
      ? `import { I${serviceName}, ${name}Config, ${name}Data, ${name}Result, ${name}Options, ${name}Status, ${name}Event } from './${name.toLowerCase()}.types';`
      : '';
    
    return `${interfaceImport}

/**
 * ${serviceName}
 * 
 * Service for handling ${name.toLowerCase()} operations
 */
export class ${serviceName}${this.options.withInterface ? ` implements I${serviceName}` : ''} {
  private config: ${this.options.withInterface ? `${name}Config` : 'any'} | null = null;
  private isInitialized = false;
  private isProcessing = false;
  private lastOperation: Date | null = null;
  private operationCount = 0;
  private eventListeners: Array<(event: ${this.options.withInterface ? `${name}Event` : 'any'}) => void> = [];

  /**
   * Initialize the service
   */
  async initialize(config: ${this.options.withInterface ? `${name}Config` : 'any'}): Promise<void> {
    try {
      this.config = config;
      
      // Perform initialization logic here
      await this.setupService();
      
      this.isInitialized = true;
      this.emitEvent({ type: 'initialized', config });
      
      console.log('${serviceName} initialized successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.emitEvent({ type: 'error', error: errorMessage });
      throw new Error(\`Failed to initialize ${serviceName}: \${errorMessage}\`);
    }
  }

  /**
   * Process data
   */
  async process(
    data: ${this.options.withInterface ? `Partial<${name}Data>` : 'any'}, 
    options: ${this.options.withInterface ? `${name}Options` : 'any'} = {}
  ): Promise<${this.options.withInterface ? `${name}Result` : 'any'}> {
    if (!this.isInitialized) {
      throw new Error('${serviceName} not initialized');
    }

    this.isProcessing = true;
    this.lastOperation = new Date();
    this.operationCount++;

    try {
      this.emitEvent({ type: 'processing', data: data as ${this.options.withInterface ? `${name}Data` : 'any'} });
      
      // Perform processing logic here
      const result = await this.performProcessing(data, options);
      
      this.emitEvent({ type: 'completed', result });
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.emitEvent({ type: 'error', error: errorMessage });
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Get service status
   */
  getStatus(): ${this.options.withInterface ? `${name}Status` : 'any'} {
    return {
      isInitialized: this.isInitialized,
      isProcessing: this.isProcessing,
      lastOperation: this.lastOperation,
      operationCount: this.operationCount
    };
  }

  /**
   * Cleanup service resources
   */
  async cleanup(): Promise<void> {
    try {
      // Perform cleanup logic here
      await this.teardownService();
      
      this.isInitialized = false;
      this.config = null;
      this.eventListeners = [];
      
      console.log('${serviceName} cleaned up successfully');
    } catch (error) {
      console.error('Error during ${serviceName} cleanup:', error);
    }
  }

  /**
   * Add event listener
   */
  addEventListener(listener: (event: ${this.options.withInterface ? `${name}Event` : 'any'}) => void): void {
    this.eventListeners.push(listener);
  }

  /**
   * Remove event listener
   */
  removeEventListener(listener: (event: ${this.options.withInterface ? `${name}Event` : 'any'}) => void): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  /**
   * Setup service (override in subclasses)
   */
  protected async setupService(): Promise<void> {
    // Override this method in subclasses
  }

  /**
   * Perform processing (override in subclasses)
   */
  protected async performProcessing(
    data: ${this.options.withInterface ? `Partial<${name}Data>` : 'any'}, 
    options: ${this.options.withInterface ? `${name}Options` : 'any'}
  ): Promise<${this.options.withInterface ? `${name}Result` : 'any'}> {
    // Override this method in subclasses
    return {
      success: true,
      data: {
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data
      }
    };
  }

  /**
   * Teardown service (override in subclasses)
   */
  protected async teardownService(): Promise<void> {
    // Override this method in subclasses
  }

  /**
   * Emit event to listeners
   */
  private emitEvent(event: ${this.options.withInterface ? `${name}Event` : 'any'}): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    });
  }
}

// Export singleton instance
export const ${name.toLowerCase()}Service = new ${serviceName}();
`;
  }

  private getTestTemplate(): string {
    const { name } = this.options;
    const serviceName = `${name}Service`;
    
    return `import { ${serviceName}, ${name.toLowerCase()}Service } from './${name.toLowerCase()}Service';
${this.options.withInterface ? `import { ${name}Config, ${name}Data, ${name}Options } from './${name.toLowerCase()}.types';` : ''}

describe('${serviceName}', () => {
  let service: ${serviceName};

  beforeEach(() => {
    service = new ${serviceName}();
  });

  afterEach(async () => {
    await service.cleanup();
  });

  describe('initialization', () => {
    it('should initialize successfully with valid config', async () => {
      const config${this.options.withInterface ? `: ${name}Config` : ''} = {
        enabled: true,
        timeout: 5000,
        retryAttempts: 3
      };

      await expect(service.initialize(config)).resolves.not.toThrow();
      
      const status = service.getStatus();
      expect(status.isInitialized).toBe(true);
    });

    it('should throw error with invalid config', async () => {
      const invalidConfig = null;

      await expect(service.initialize(invalidConfig as any)).rejects.toThrow();
    });
  });

  describe('processing', () => {
    beforeEach(async () => {
      const config${this.options.withInterface ? `: ${name}Config` : ''} = {
        enabled: true,
        timeout: 5000,
        retryAttempts: 3
      };
      await service.initialize(config);
    });

    it('should process data successfully', async () => {
      const data${this.options.withInterface ? `: Partial<${name}Data>` : ''} = {
        id: 'test-id'
      };

      const result = await service.process(data);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should handle processing errors gracefully', async () => {
      // Mock an error condition
      const invalidData = null;

      const result = await service.process(invalidData as any);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should throw error when not initialized', async () => {
      const uninitializedService = new ${serviceName}();
      const data = { id: 'test-id' };

      await expect(uninitializedService.process(data)).rejects.toThrow('not initialized');
    });
  });

  describe('status tracking', () => {
    it('should track operation count', async () => {
      const config${this.options.withInterface ? `: ${name}Config` : ''} = {
        enabled: true,
        timeout: 5000,
        retryAttempts: 3
      };
      await service.initialize(config);

      const initialStatus = service.getStatus();
      expect(initialStatus.operationCount).toBe(0);

      await service.process({ id: 'test-1' });
      await service.process({ id: 'test-2' });

      const finalStatus = service.getStatus();
      expect(finalStatus.operationCount).toBe(2);
    });

    it('should track last operation time', async () => {
      const config${this.options.withInterface ? `: ${name}Config` : ''} = {
        enabled: true,
        timeout: 5000,
        retryAttempts: 3
      };
      await service.initialize(config);

      const beforeOperation = new Date();
      await service.process({ id: 'test' });
      const afterOperation = new Date();

      const status = service.getStatus();
      expect(status.lastOperation).toBeDefined();
      expect(status.lastOperation!.getTime()).toBeGreaterThanOrEqual(beforeOperation.getTime());
      expect(status.lastOperation!.getTime()).toBeLessThanOrEqual(afterOperation.getTime());
    });
  });

  describe('event handling', () => {
    it('should emit events during operations', async () => {
      const events: any[] = [];
      service.addEventListener((event) => events.push(event));

      const config${this.options.withInterface ? `: ${name}Config` : ''} = {
        enabled: true,
        timeout: 5000,
        retryAttempts: 3
      };
      await service.initialize(config);
      await service.process({ id: 'test' });

      expect(events).toHaveLength(3); // initialized, processing, completed
      expect(events[0].type).toBe('initialized');
      expect(events[1].type).toBe('processing');
      expect(events[2].type).toBe('completed');
    });
  });

  describe('cleanup', () => {
    it('should cleanup resources properly', async () => {
      const config${this.options.withInterface ? `: ${name}Config` : ''} = {
        enabled: true,
        timeout: 5000,
        retryAttempts: 3
      };
      await service.initialize(config);

      await service.cleanup();

      const status = service.getStatus();
      expect(status.isInitialized).toBe(false);
    });
  });
});

describe('${name.toLowerCase()}Service singleton', () => {
  it('should be an instance of ${serviceName}', () => {
    expect(${name.toLowerCase()}Service).toBeInstanceOf(${serviceName});
  });
});
`;
  }

  private getMockTemplate(): string {
    const { name } = this.options;
    const serviceName = `${name}Service`;
    
    return `/**
 * Mock ${serviceName}
 * 
 * Mock implementation for testing
 */

export class Mock${serviceName} {
  private isInitialized = false;
  private operationCount = 0;

  async initialize(config: any): Promise<void> {
    this.isInitialized = true;
    return Promise.resolve();
  }

  async process(data: any, options: any = {}): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('Mock${serviceName} not initialized');
    }

    this.operationCount++;
    
    return {
      success: true,
      data: {
        id: 'mock-id',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data
      }
    };
  }

  getStatus(): any {
    return {
      isInitialized: this.isInitialized,
      isProcessing: false,
      lastOperation: new Date(),
      operationCount: this.operationCount
    };
  }

  async cleanup(): Promise<void> {
    this.isInitialized = false;
    this.operationCount = 0;
    return Promise.resolve();
  }

  addEventListener(): void {
    // Mock implementation
  }

  removeEventListener(): void {
    // Mock implementation
  }
}

export const mock${name}Service = new Mock${serviceName}();
`;
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
🚀 TradeYa Service Generator

Usage: npm run generate:service <ServiceName> [options]

Options:
  --type <type>        Service type: api, utility, data, performance (default: utility)
  --no-tests          Skip test file generation
  --no-interface      Skip TypeScript interface generation
  --no-mocks          Skip mock file generation
  --directory <dir>   Custom directory path
  --help, -h          Show this help message

Examples:
  npm run generate:service Analytics
  npm run generate:service UserApi --type api
  npm run generate:service CacheManager --type performance --directory cache
    `);
    process.exit(0);
  }

  const name = args[0];
  if (!name) {
    console.error('❌ Service name is required');
    process.exit(1);
  }

  // Validate service name
  if (!/^[A-Z][a-zA-Z0-9]*$/.test(name)) {
    console.error('❌ Service name must be PascalCase (e.g., MyService)');
    process.exit(1);
  }

  const options: ServiceGeneratorOptions = {
    name,
    type: 'utility',
    withTests: true,
    withInterface: true,
    withMocks: true
  };

  // Parse options
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--type' && args[i + 1]) {
      const type = args[i + 1] as 'api' | 'utility' | 'data' | 'performance';
      if (['api', 'utility', 'data', 'performance'].includes(type)) {
        options.type = type;
        i++; // Skip next argument
      }
    } else if (arg === '--no-tests') {
      options.withTests = false;
    } else if (arg === '--no-interface') {
      options.withInterface = false;
    } else if (arg === '--no-mocks') {
      options.withMocks = false;
    } else if (arg === '--directory' && args[i + 1]) {
      options.directory = args[i + 1];
      i++; // Skip next argument
    }
  }

  const generator = new ServiceGenerator(options);
  await generator.generate();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { ServiceGenerator };
