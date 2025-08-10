/**
 * Enhanced Documentation Generator
 * 
 * Automatically generates documentation from TypeScript interfaces and JSDoc comments
 */

import fs from 'fs/promises';
import path from 'path';

interface ComponentDoc {
  name: string;
  description: string;
  props: PropDoc[];
  examples: ExampleDoc[];
  filePath: string;
}

interface PropDoc {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string;
  description: string;
}

interface ExampleDoc {
  title: string;
  code: string;
  description: string;
}

interface ServiceDoc {
  name: string;
  description: string;
  methods: MethodDoc[];
  interfaces: InterfaceDoc[];
  filePath: string;
}

interface MethodDoc {
  name: string;
  description: string;
  parameters: ParameterDoc[];
  returnType: string;
  examples: string[];
}

interface ParameterDoc {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

interface InterfaceDoc {
  name: string;
  description: string;
  properties: PropertyDoc[];
}

interface PropertyDoc {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

export class DocumentationGenerator {
  private sourceDir: string;
  private outputDir: string;

  constructor(sourceDir: string = 'src', outputDir: string = 'docs/api') {
    this.sourceDir = sourceDir;
    this.outputDir = outputDir;
  }

  /**
   * Generate complete documentation
   */
  async generateDocs(): Promise<void> {
    console.log('📚 Generating documentation...');

    try {
      await this.ensureOutputDirectory();
      
      const components = await this.scanComponents();
      const services = await this.scanServices();
      
      await this.generateComponentDocs(components);
      await this.generateServiceDocs(services);
      await this.generateIndexPage(components, services);
      
      console.log('✅ Documentation generated successfully');
      console.log(`📁 Output: ${this.outputDir}`);
    } catch (error) {
      console.error('❌ Documentation generation failed:', error);
      throw error;
    }
  }

  /**
   * Ensure output directory exists
   */
  private async ensureOutputDirectory(): Promise<void> {
    await fs.mkdir(this.outputDir, { recursive: true });
    await fs.mkdir(path.join(this.outputDir, 'components'), { recursive: true });
    await fs.mkdir(path.join(this.outputDir, 'services'), { recursive: true });
  }

  /**
   * Scan for React components
   */
  private async scanComponents(): Promise<ComponentDoc[]> {
    const components: ComponentDoc[] = [];
    const componentDirs = [
      path.join(this.sourceDir, 'components'),
      path.join(this.sourceDir, 'pages')
    ];

    for (const dir of componentDirs) {
      try {
        const found = await this.findComponentsInDirectory(dir);
        components.push(...found);
      } catch (error) {
        // Directory might not exist, continue
      }
    }

    return components;
  }

  /**
   * Scan for services
   */
  private async scanServices(): Promise<ServiceDoc[]> {
    const services: ServiceDoc[] = [];
    const serviceDir = path.join(this.sourceDir, 'services');

    try {
      const found = await this.findServicesInDirectory(serviceDir);
      services.push(...found);
    } catch (error) {
      // Directory might not exist, continue
    }

    return services;
  }

  /**
   * Find components in directory
   */
  private async findComponentsInDirectory(dir: string): Promise<ComponentDoc[]> {
    const components: ComponentDoc[] = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        const subComponents = await this.findComponentsInDirectory(fullPath);
        components.push(...subComponents);
      } else if (entry.name.endsWith('.tsx') && !entry.name.includes('.test.') && !entry.name.includes('.stories.')) {
        const component = await this.parseComponent(fullPath);
        if (component) {
          components.push(component);
        }
      }
    }

    return components;
  }

  /**
   * Find services in directory
   */
  private async findServicesInDirectory(dir: string): Promise<ServiceDoc[]> {
    const services: ServiceDoc[] = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        const subServices = await this.findServicesInDirectory(fullPath);
        services.push(...subServices);
      } else if (entry.name.endsWith('.ts') && !entry.name.includes('.test.') && entry.name.includes('Service')) {
        const service = await this.parseService(fullPath);
        if (service) {
          services.push(service);
        }
      }
    }

    return services;
  }

  /**
   * Parse React component file
   */
  private async parseComponent(filePath: string): Promise<ComponentDoc | null> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const fileName = path.basename(filePath, '.tsx');
      
      // Extract component name (simple heuristic)
      const componentMatch = content.match(/export\s+(?:const|function)\s+(\w+)/);
      const componentName = componentMatch ? componentMatch[1] : fileName;
      
      // Extract JSDoc description
      const descriptionMatch = content.match(/\/\*\*\s*\n\s*\*\s*(.+?)\s*\n/);
      const description = descriptionMatch ? descriptionMatch[1] : `${componentName} component`;
      
      // Extract props interface
      const props = this.extractProps(content, componentName);
      
      // Generate examples
      const examples = this.generateComponentExamples(componentName, props);
      
      return {
        name: componentName,
        description,
        props,
        examples,
        filePath: path.relative(process.cwd(), filePath)
      };
    } catch (error) {
      console.warn(`Failed to parse component ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Parse service file
   */
  private async parseService(filePath: string): Promise<ServiceDoc | null> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const fileName = path.basename(filePath, '.ts');
      
      // Extract service name
      const serviceMatch = content.match(/export\s+class\s+(\w+)/);
      const serviceName = serviceMatch ? serviceMatch[1] : fileName;
      
      // Extract JSDoc description
      const descriptionMatch = content.match(/\/\*\*\s*\n\s*\*\s*(.+?)\s*\n/);
      const description = descriptionMatch ? descriptionMatch[1] : `${serviceName} service`;
      
      // Extract methods
      const methods = this.extractMethods(content);
      
      // Extract interfaces
      const interfaces = this.extractInterfaces(content);
      
      return {
        name: serviceName,
        description,
        methods,
        interfaces,
        filePath: path.relative(process.cwd(), filePath)
      };
    } catch (error) {
      console.warn(`Failed to parse service ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Extract props from component content
   */
  private extractProps(content: string, componentName: string): PropDoc[] {
    const props: PropDoc[] = [];
    
    // Look for interface definition
    const interfaceRegex = new RegExp(`interface\\s+${componentName}Props\\s*{([^}]+)}`, 's');
    const interfaceMatch = content.match(interfaceRegex);
    
    if (interfaceMatch) {
      const propsContent = interfaceMatch[1];
      const propLines = propsContent.split('\n').filter(line => line.trim());
      
      for (const line of propLines) {
        const propMatch = line.match(/^\s*\/\*\*\s*\n\s*\*\s*(.+?)\s*\n\s*\*\/\s*(\w+)(\?)?:\s*(.+?);/s);
        if (propMatch) {
          props.push({
            name: propMatch[2],
            type: propMatch[4].trim(),
            required: !propMatch[3],
            description: propMatch[1]
          });
        } else {
          // Simple prop without JSDoc
          const simplePropMatch = line.match(/^\s*(\w+)(\?)?:\s*(.+?);/);
          if (simplePropMatch) {
            props.push({
              name: simplePropMatch[1],
              type: simplePropMatch[3].trim(),
              required: !simplePropMatch[2],
              description: 'No description provided'
            });
          }
        }
      }
    }
    
    return props;
  }

  /**
   * Extract methods from service content
   */
  private extractMethods(content: string): MethodDoc[] {
    const methods: MethodDoc[] = [];
    
    // Simple method extraction (can be enhanced)
    const methodRegex = /\/\*\*\s*\n\s*\*\s*(.+?)\s*\n\s*\*\/\s*(?:async\s+)?(\w+)\s*\([^)]*\):\s*(.+?)\s*{/gs;
    let match;
    
    while ((match = methodRegex.exec(content)) !== null) {
      methods.push({
        name: match[2],
        description: match[1],
        parameters: [], // TODO: Extract parameters
        returnType: match[3],
        examples: []
      });
    }
    
    return methods;
  }

  /**
   * Extract interfaces from content
   */
  private extractInterfaces(content: string): InterfaceDoc[] {
    const interfaces: InterfaceDoc[] = [];
    
    // Simple interface extraction (can be enhanced)
    const interfaceRegex = /export\s+interface\s+(\w+)\s*{([^}]+)}/gs;
    let match;
    
    while ((match = interfaceRegex.exec(content)) !== null) {
      interfaces.push({
        name: match[1],
        description: `${match[1]} interface`,
        properties: [] // TODO: Extract properties
      });
    }
    
    return interfaces;
  }

  /**
   * Generate component examples
   */
  private generateComponentExamples(componentName: string, props: PropDoc[]): ExampleDoc[] {
    const examples: ExampleDoc[] = [];
    
    // Basic example
    examples.push({
      title: 'Basic Usage',
      code: `<${componentName} />`,
      description: `Basic usage of ${componentName} component`
    });
    
    // Example with props
    if (props.length > 0) {
      const requiredProps = props.filter(p => p.required);
      if (requiredProps.length > 0) {
        const propsString = requiredProps.map(p => `${p.name}={/* ${p.type} */}`).join(' ');
        examples.push({
          title: 'With Required Props',
          code: `<${componentName} ${propsString} />`,
          description: `${componentName} with required props`
        });
      }
    }
    
    return examples;
  }

  /**
   * Generate component documentation files
   */
  private async generateComponentDocs(components: ComponentDoc[]): Promise<void> {
    for (const component of components) {
      const markdown = this.generateComponentMarkdown(component);
      const filePath = path.join(this.outputDir, 'components', `${component.name}.md`);
      await fs.writeFile(filePath, markdown);
    }
  }

  /**
   * Generate service documentation files
   */
  private async generateServiceDocs(services: ServiceDoc[]): Promise<void> {
    for (const service of services) {
      const markdown = this.generateServiceMarkdown(service);
      const filePath = path.join(this.outputDir, 'services', `${service.name}.md`);
      await fs.writeFile(filePath, markdown);
    }
  }

  /**
   * Generate component markdown
   */
  private generateComponentMarkdown(component: ComponentDoc): string {
    let markdown = `# ${component.name}\n\n`;
    markdown += `${component.description}\n\n`;
    markdown += `**File:** \`${component.filePath}\`\n\n`;
    
    if (component.props.length > 0) {
      markdown += `## Props\n\n`;
      markdown += `| Prop | Type | Required | Description |\n`;
      markdown += `|------|------|----------|-------------|\n`;
      
      for (const prop of component.props) {
        markdown += `| ${prop.name} | \`${prop.type}\` | ${prop.required ? 'Yes' : 'No'} | ${prop.description} |\n`;
      }
      markdown += `\n`;
    }
    
    if (component.examples.length > 0) {
      markdown += `## Examples\n\n`;
      
      for (const example of component.examples) {
        markdown += `### ${example.title}\n\n`;
        markdown += `${example.description}\n\n`;
        markdown += `\`\`\`tsx\n${example.code}\n\`\`\`\n\n`;
      }
    }
    
    return markdown;
  }

  /**
   * Generate service markdown
   */
  private generateServiceMarkdown(service: ServiceDoc): string {
    let markdown = `# ${service.name}\n\n`;
    markdown += `${service.description}\n\n`;
    markdown += `**File:** \`${service.filePath}\`\n\n`;
    
    if (service.methods.length > 0) {
      markdown += `## Methods\n\n`;
      
      for (const method of service.methods) {
        markdown += `### ${method.name}\n\n`;
        markdown += `${method.description}\n\n`;
        markdown += `**Returns:** \`${method.returnType}\`\n\n`;
      }
    }
    
    if (service.interfaces.length > 0) {
      markdown += `## Interfaces\n\n`;
      
      for (const iface of service.interfaces) {
        markdown += `### ${iface.name}\n\n`;
        markdown += `${iface.description}\n\n`;
      }
    }
    
    return markdown;
  }

  /**
   * Generate index page
   */
  private async generateIndexPage(components: ComponentDoc[], services: ServiceDoc[]): Promise<void> {
    let markdown = `# API Documentation\n\n`;
    markdown += `Auto-generated documentation for TradeYa components and services.\n\n`;
    
    if (components.length > 0) {
      markdown += `## Components\n\n`;
      for (const component of components) {
        markdown += `- [${component.name}](./components/${component.name}.md) - ${component.description}\n`;
      }
      markdown += `\n`;
    }
    
    if (services.length > 0) {
      markdown += `## Services\n\n`;
      for (const service of services) {
        markdown += `- [${service.name}](./services/${service.name}.md) - ${service.description}\n`;
      }
      markdown += `\n`;
    }
    
    markdown += `---\n\n`;
    markdown += `*Generated on ${new Date().toISOString()}*\n`;
    
    const filePath = path.join(this.outputDir, 'README.md');
    await fs.writeFile(filePath, markdown);
  }
}

// Export singleton instance
export const docGenerator = new DocumentationGenerator();

// CLI interface for documentation generation
export async function generateDocsCLI(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
📚 TradeYa Documentation Generator

Usage: npm run generate:docs [options]

Options:
  --source <dir>      Source directory (default: src)
  --output <dir>      Output directory (default: docs/api)
  --components-only   Generate only component documentation
  --services-only     Generate only service documentation
  --help, -h          Show this help message

Examples:
  npm run generate:docs
  npm run generate:docs --source src --output docs/api
  npm run generate:docs --components-only
    `);
    return;
  }

  let sourceDir = 'src';
  let outputDir = 'docs/api';
  let componentsOnly = false;
  let servicesOnly = false;

  // Parse options
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--source' && args[i + 1]) {
      sourceDir = args[i + 1];
      i++; // Skip next argument
    } else if (arg === '--output' && args[i + 1]) {
      outputDir = args[i + 1];
      i++; // Skip next argument
    } else if (arg === '--components-only') {
      componentsOnly = true;
    } else if (arg === '--services-only') {
      servicesOnly = true;
    }
  }

  const generator = new DocumentationGenerator(sourceDir, outputDir);

  if (componentsOnly) {
    console.log('📚 Generating component documentation only...');
    const components = await generator['scanComponents']();
    await generator['generateComponentDocs'](components);
    console.log('✅ Component documentation generated');
  } else if (servicesOnly) {
    console.log('📚 Generating service documentation only...');
    const services = await generator['scanServices']();
    await generator['generateServiceDocs'](services);
    console.log('✅ Service documentation generated');
  } else {
    await generator.generateDocs();
  }
}
