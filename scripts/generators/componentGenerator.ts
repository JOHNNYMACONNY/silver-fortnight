#!/usr/bin/env node

/**
 * Component Generator CLI
 * 
 * Generates React components with TypeScript, tests, and documentation
 * Usage: npm run generate:component <ComponentName> [options]
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface GeneratorOptions {
  name: string;
  type: 'component' | 'page' | 'feature';
  withTests: boolean;
  withStorybook: boolean;
  withDocs: boolean;
  directory?: string;
}

class ComponentGenerator {
  private options: GeneratorOptions;
  private componentPath: string;

  constructor(options: GeneratorOptions) {
    this.options = options;
    this.componentPath = this.getComponentPath();
  }

  private getComponentPath(): string {
    const basePath = path.join(process.cwd(), 'src');
    
    if (this.options.directory) {
      return path.join(basePath, this.options.directory);
    }

    switch (this.options.type) {
      case 'page':
        return path.join(basePath, 'pages');
      case 'feature':
        return path.join(basePath, 'components', 'features');
      default:
        return path.join(basePath, 'components');
    }
  }

  async generate(): Promise<void> {
    console.log(`🚀 Generating ${this.options.type}: ${this.options.name}`);

    try {
      await this.createDirectory();
      await this.generateComponent();
      
      if (this.options.withTests) {
        await this.generateTest();
      }
      
      if (this.options.withStorybook) {
        await this.generateStorybook();
      }
      
      if (this.options.withDocs) {
        await this.generateDocumentation();
      }

      console.log(`✅ Successfully generated ${this.options.name}`);
      console.log(`📁 Location: ${this.componentPath}`);
    } catch (error) {
      console.error('❌ Generation failed:', error);
      process.exit(1);
    }
  }

  private async createDirectory(): Promise<void> {
    const fullPath = path.join(this.componentPath, this.options.name);
    await fs.mkdir(fullPath, { recursive: true });
  }

  private async generateComponent(): Promise<void> {
    const template = this.getComponentTemplate();
    const filePath = path.join(this.componentPath, this.options.name, `${this.options.name}.tsx`);
    await fs.writeFile(filePath, template);
  }

  private async generateTest(): Promise<void> {
    const template = this.getTestTemplate();
    const filePath = path.join(this.componentPath, this.options.name, `${this.options.name}.test.tsx`);
    await fs.writeFile(filePath, template);
  }

  private async generateStorybook(): Promise<void> {
    const template = this.getStorybookTemplate();
    const filePath = path.join(this.componentPath, this.options.name, `${this.options.name}.stories.tsx`);
    await fs.writeFile(filePath, template);
  }

  private async generateDocumentation(): Promise<void> {
    const template = this.getDocumentationTemplate();
    const filePath = path.join(this.componentPath, this.options.name, 'README.md');
    await fs.writeFile(filePath, template);
  }

  private getComponentTemplate(): string {
    const { name } = this.options;
    
    return `import React from 'react';
import { motion } from 'framer-motion';

interface ${name}Props {
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Children elements
   */
  children?: React.ReactNode;
}

/**
 * ${name} component
 * 
 * @param props - Component props
 * @returns JSX element
 */
export const ${name}: React.FC<${name}Props> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={\`${name.toLowerCase()} \${className}\`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default ${name};
`;
  }

  private getTestTemplate(): string {
    const { name } = this.options;
    
    return `import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ${name} } from './${name}';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  }
}));

describe('${name}', () => {
  it('renders without crashing', () => {
    render(<${name} />);
    expect(screen.getByRole('generic')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const customClass = 'custom-class';
    render(<${name} className={customClass} />);
    expect(screen.getByRole('generic')).toHaveClass(customClass);
  });

  it('renders children correctly', () => {
    const testContent = 'Test content';
    render(<${name}>{testContent}</${name}>);
    expect(screen.getByText(testContent)).toBeInTheDocument();
  });

  it('passes through additional props', () => {
    const testId = 'test-${name.toLowerCase()}';
    render(<${name} data-testid={testId} />);
    expect(screen.getByTestId(testId)).toBeInTheDocument();
  });
});
`;
  }

  private getStorybookTemplate(): string {
    const { name } = this.options;
    
    return `import type { Meta, StoryObj } from '@storybook/react';
import { ${name} } from './${name}';

const meta: Meta<typeof ${name}> = {
  title: 'Components/${name}',
  component: ${name},
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '${name} component for TradeYa application'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS classes'
    },
    children: {
      control: 'text',
      description: 'Children elements'
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Default ${name}'
  }
};

export const WithCustomClass: Story = {
  args: {
    className: 'custom-styling',
    children: '${name} with custom class'
  }
};

export const Empty: Story = {
  args: {}
};
`;
  }

  private getDocumentationTemplate(): string {
    const { name } = this.options;
    
    return `# ${name}

## Overview

The ${name} component is a reusable React component built for the TradeYa application.

## Usage

\`\`\`tsx
import { ${name} } from './components/${name}/${name}';

function App() {
  return (
    <${name} className="custom-class">
      Content goes here
    </${name}>
  );
}
\`\`\`

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| className | string | '' | Additional CSS classes |
| children | ReactNode | undefined | Children elements |

## Examples

### Basic Usage

\`\`\`tsx
<${name}>
  Basic content
</${name}>
\`\`\`

### With Custom Styling

\`\`\`tsx
<${name} className="my-custom-class">
  Styled content
</${name}>
\`\`\`

## Accessibility

- Component follows ARIA guidelines
- Supports keyboard navigation
- Screen reader compatible

## Testing

Run tests with:

\`\`\`bash
npm test -- ${name}.test.tsx
\`\`\`

## Storybook

View component stories:

\`\`\`bash
npm run storybook
\`\`\`

Navigate to Components/${name} in the Storybook interface.
`;
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
🚀 TradeYa Component Generator

Usage: npm run generate:component <ComponentName> [options]

Options:
  --type <type>        Component type: component, page, feature (default: component)
  --no-tests          Skip test file generation
  --no-storybook      Skip Storybook story generation
  --no-docs           Skip documentation generation
  --directory <dir>   Custom directory path
  --help, -h          Show this help message

Examples:
  npm run generate:component Button
  npm run generate:component UserProfile --type feature
  npm run generate:component LoginPage --type page --directory auth
    `);
    process.exit(0);
  }

  const name = args[0];
  if (!name) {
    console.error('❌ Component name is required');
    process.exit(1);
  }

  // Validate component name
  if (!/^[A-Z][a-zA-Z0-9]*$/.test(name)) {
    console.error('❌ Component name must be PascalCase (e.g., MyComponent)');
    process.exit(1);
  }

  const options: GeneratorOptions = {
    name,
    type: 'component',
    withTests: true,
    withStorybook: true,
    withDocs: true
  };

  // Parse options
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--type' && args[i + 1]) {
      const type = args[i + 1] as 'component' | 'page' | 'feature';
      if (['component', 'page', 'feature'].includes(type)) {
        options.type = type;
        i++; // Skip next argument
      }
    } else if (arg === '--no-tests') {
      options.withTests = false;
    } else if (arg === '--no-storybook') {
      options.withStorybook = false;
    } else if (arg === '--no-docs') {
      options.withDocs = false;
    } else if (arg === '--directory' && args[i + 1]) {
      options.directory = args[i + 1];
      i++; // Skip next argument
    }
  }

  const generator = new ComponentGenerator(options);
  await generator.generate();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { ComponentGenerator };
