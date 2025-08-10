/**
 * Documentation Generator Tests
 */

import { DocumentationGenerator, docGenerator } from '../docGenerator';
import fs from 'fs/promises';
import path from 'path';

// Mock fs module
jest.mock('fs/promises');
const mockFs = fs as jest.Mocked<typeof fs>;

// Mock console methods
const originalConsole = global.console;
const mockConsole = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
};

describe('DocumentationGenerator', () => {
  let generator: DocumentationGenerator;

  beforeEach(() => {
    // Mock console
    global.console = mockConsole as any;
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Create new instance
    generator = new DocumentationGenerator('src', 'docs/api');
  });

  afterEach(() => {
    // Restore console
    global.console = originalConsole;
  });

  describe('initialization', () => {
    it('should create generator with default paths', () => {
      const defaultGenerator = new DocumentationGenerator();
      expect(defaultGenerator).toBeInstanceOf(DocumentationGenerator);
    });

    it('should create generator with custom paths', () => {
      const customGenerator = new DocumentationGenerator('custom-src', 'custom-docs');
      expect(customGenerator).toBeInstanceOf(DocumentationGenerator);
    });
  });

  describe('directory management', () => {
    it('should ensure output directories exist', async () => {
      mockFs.mkdir.mockResolvedValue(undefined);
      
      await generator['ensureOutputDirectory']();
      
      expect(mockFs.mkdir).toHaveBeenCalledWith('docs/api', { recursive: true });
      expect(mockFs.mkdir).toHaveBeenCalledWith('docs/api/components', { recursive: true });
      expect(mockFs.mkdir).toHaveBeenCalledWith('docs/api/services', { recursive: true });
    });
  });

  describe('component scanning', () => {
    it('should scan for components in directories', async () => {
      const mockEntries = [
        { name: 'Button.tsx', isDirectory: () => false },
        { name: 'Modal.tsx', isDirectory: () => false },
        { name: 'Button.test.tsx', isDirectory: () => false }, // Should be ignored
        { name: 'Button.stories.tsx', isDirectory: () => false }, // Should be ignored
        { name: 'utils', isDirectory: () => true }
      ];
      
      mockFs.readdir.mockResolvedValue(mockEntries as any);
      mockFs.readFile.mockResolvedValue(`
        /**
         * Button component
         */
        export const Button: React.FC<ButtonProps> = () => {
          return <button>Click me</button>;
        };
      `);
      
      const components = await generator['findComponentsInDirectory']('src/components');
      
      expect(components).toHaveLength(2); // Button and Modal, excluding test and story files
    });

    it('should handle directory read errors gracefully', async () => {
      mockFs.readdir.mockRejectedValue(new Error('Directory not found'));
      
      const components = await generator['scanComponents']();
      
      expect(components).toEqual([]);
    });
  });

  describe('service scanning', () => {
    it('should scan for services in directories', async () => {
      const mockEntries = [
        { name: 'userService.ts', isDirectory: () => false },
        { name: 'tradeService.ts', isDirectory: () => false },
        { name: 'userService.test.ts', isDirectory: () => false }, // Should be ignored
        { name: 'utils.ts', isDirectory: () => false } // Should be ignored (no 'Service' in name)
      ];
      
      mockFs.readdir.mockResolvedValue(mockEntries as any);
      mockFs.readFile.mockResolvedValue(`
        /**
         * User service
         */
        export class UserService {
          async getUser(id: string): Promise<User> {
            return {} as User;
          }
        }
      `);
      
      const services = await generator['findServicesInDirectory']('src/services');
      
      expect(services).toHaveLength(2); // userService and tradeService, excluding test files
    });
  });

  describe('component parsing', () => {
    it('should parse component file correctly', async () => {
      const componentContent = `
        /**
         * Button component for user interactions
         */
        interface ButtonProps {
          /**
           * Button text
           */
          children: string;
          /**
           * Click handler
           */
          onClick?: () => void;
          disabled?: boolean;
        }
        
        export const Button: React.FC<ButtonProps> = ({ children, onClick, disabled }) => {
          return <button onClick={onClick} disabled={disabled}>{children}</button>;
        };
      `;
      
      mockFs.readFile.mockResolvedValue(componentContent);
      
      const component = await generator['parseComponent']('src/components/Button.tsx');
      
      expect(component).toMatchObject({
        name: 'Button',
        description: 'Button component for user interactions',
        filePath: expect.stringContaining('Button.tsx')
      });
      expect(component?.props).toHaveLength(3);
      expect(component?.examples).toHaveLength(2);
    });

    it('should handle component parsing errors', async () => {
      mockFs.readFile.mockRejectedValue(new Error('File not found'));
      
      const component = await generator['parseComponent']('src/components/NonExistent.tsx');
      
      expect(component).toBeNull();
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('Failed to parse component'),
        expect.any(Error)
      );
    });
  });

  describe('service parsing', () => {
    it('should parse service file correctly', async () => {
      const serviceContent = `
        /**
         * User service for managing users
         */
        export class UserService {
          /**
           * Get user by ID
           */
          async getUser(id: string): Promise<User> {
            return {} as User;
          }
          
          /**
           * Create new user
           */
          async createUser(data: UserData): Promise<User> {
            return {} as User;
          }
        }
        
        export interface UserData {
          name: string;
          email: string;
        }
      `;
      
      mockFs.readFile.mockResolvedValue(serviceContent);
      
      const service = await generator['parseService']('src/services/userService.ts');
      
      expect(service).toMatchObject({
        name: 'UserService',
        description: 'User service for managing users',
        filePath: expect.stringContaining('userService.ts')
      });
      expect(service?.methods).toHaveLength(2);
      expect(service?.interfaces).toHaveLength(1);
    });

    it('should handle service parsing errors', async () => {
      mockFs.readFile.mockRejectedValue(new Error('File not found'));
      
      const service = await generator['parseService']('src/services/nonExistent.ts');
      
      expect(service).toBeNull();
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('Failed to parse service'),
        expect.any(Error)
      );
    });
  });

  describe('props extraction', () => {
    it('should extract props from interface definition', () => {
      const content = `
        interface ButtonProps {
          /**
           * Button text
           */
          children: string;
          /**
           * Click handler
           */
          onClick?: () => void;
          disabled?: boolean;
        }
      `;
      
      const props = generator['extractProps'](content, 'Button');
      
      expect(props).toHaveLength(3);
      expect(props[0]).toMatchObject({
        name: 'children',
        type: 'string',
        required: true,
        description: 'Button text'
      });
      expect(props[1]).toMatchObject({
        name: 'onClick',
        type: '() => void',
        required: false,
        description: 'Click handler'
      });
      expect(props[2]).toMatchObject({
        name: 'disabled',
        type: 'boolean',
        required: false,
        description: 'No description provided'
      });
    });

    it('should handle missing interface gracefully', () => {
      const content = `
        export const Button = () => <button>Click me</button>;
      `;
      
      const props = generator['extractProps'](content, 'Button');
      
      expect(props).toEqual([]);
    });
  });

  describe('markdown generation', () => {
    it('should generate component markdown', () => {
      const component = {
        name: 'Button',
        description: 'A button component',
        props: [
          {
            name: 'children',
            type: 'string',
            required: true,
            description: 'Button text'
          }
        ],
        examples: [
          {
            title: 'Basic Usage',
            code: '<Button>Click me</Button>',
            description: 'Basic button usage'
          }
        ],
        filePath: 'src/components/Button.tsx'
      };
      
      const markdown = generator['generateComponentMarkdown'](component);
      
      expect(markdown).toContain('# Button');
      expect(markdown).toContain('A button component');
      expect(markdown).toContain('## Props');
      expect(markdown).toContain('| children | `string` | Yes | Button text |');
      expect(markdown).toContain('## Examples');
      expect(markdown).toContain('### Basic Usage');
      expect(markdown).toContain('```tsx\n<Button>Click me</Button>\n```');
    });

    it('should generate service markdown', () => {
      const service = {
        name: 'UserService',
        description: 'Service for managing users',
        methods: [
          {
            name: 'getUser',
            description: 'Get user by ID',
            parameters: [],
            returnType: 'Promise<User>',
            examples: []
          }
        ],
        interfaces: [
          {
            name: 'User',
            description: 'User interface',
            properties: []
          }
        ],
        filePath: 'src/services/userService.ts'
      };
      
      const markdown = generator['generateServiceMarkdown'](service);
      
      expect(markdown).toContain('# UserService');
      expect(markdown).toContain('Service for managing users');
      expect(markdown).toContain('## Methods');
      expect(markdown).toContain('### getUser');
      expect(markdown).toContain('**Returns:** `Promise<User>`');
      expect(markdown).toContain('## Interfaces');
      expect(markdown).toContain('### User');
    });
  });

  describe('full documentation generation', () => {
    it('should generate complete documentation', async () => {
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.readdir.mockResolvedValue([]);
      mockFs.writeFile.mockResolvedValue(undefined);
      
      await generator.generateDocs();
      
      expect(mockConsole.log).toHaveBeenCalledWith('📚 Generating documentation...');
      expect(mockConsole.log).toHaveBeenCalledWith('✅ Documentation generated successfully');
      expect(mockConsole.log).toHaveBeenCalledWith('📁 Output: docs/api');
    });

    it('should handle generation errors', async () => {
      mockFs.mkdir.mockRejectedValue(new Error('Permission denied'));
      
      await expect(generator.generateDocs()).rejects.toThrow('Permission denied');
      expect(mockConsole.error).toHaveBeenCalledWith(
        '❌ Documentation generation failed:',
        expect.any(Error)
      );
    });
  });
});

describe('singleton instance', () => {
  it('should export a singleton instance', () => {
    expect(docGenerator).toBeInstanceOf(DocumentationGenerator);
  });
});
