/**
 * Component Consistency Checker
 * 
 * This utility helps identify consistency issues across components
 * by analyzing patterns in styling, props, and usage.
 */

export interface ConsistencyIssue {
  type: 'color' | 'typography' | 'spacing' | 'interaction' | 'accessibility' | 'api' | 'layout' | 'styling';
  severity: 'low' | 'medium' | 'high' | 'critical';
  component: string;
  description: string;
  suggestion: string;
  lineNumber?: number;
}

export interface ComponentAudit {
  componentName: string;
  filePath: string;
  issues: ConsistencyIssue[];
  score: number; // 0-100
  recommendations: string[];
}

export interface ConsistencyReport {
  overallScore: number;
  components: ComponentAudit[];
  summary: {
    totalIssues: number;
    criticalIssues: number;
    highPriorityIssues: number;
    mediumPriorityIssues: number;
    lowPriorityIssues: number;
  };
  recommendations: string[];
}

// Color consistency patterns
const BRAND_COLORS = {
  primary: '#f97316', // Orange
  secondary: '#0ea5e9', // Blue
  accent: '#8b5cf6', // Purple
};

const SEMANTIC_COLORS = {
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
};

// Typography patterns
const TYPOGRAPHY_PATTERNS = {
  headings: ['text-2xl', 'text-xl', 'text-lg', 'text-base'],
  body: ['text-base', 'text-sm', 'text-xs'],
  weights: ['font-bold', 'font-semibold', 'font-medium', 'font-normal'],
};

// Spacing patterns
const SPACING_PATTERNS = {
  padding: ['p-2', 'p-4', 'p-6', 'p-8'],
  margin: ['m-2', 'm-4', 'm-6', 'm-8'],
  gap: ['gap-2', 'gap-4', 'gap-6', 'gap-8'],
};

// Theme token patterns
const THEME_TOKENS = {
  backgrounds: ['bg-background', 'bg-card', 'bg-primary', 'bg-secondary', 'bg-muted'],
  text: ['text-foreground', 'text-muted-foreground', 'text-primary', 'text-secondary'],
  borders: ['border-border', 'border-input', 'border-primary', 'border-secondary'],
  shadows: ['shadow-sm', 'shadow-md', 'shadow-lg'],
};

// Card consistency patterns (based on our visual consistency standards)
const CARD_PATTERNS = {
  variants: ['premium', 'glass', 'elevated', 'default'],
  depths: ['lg', 'md', 'sm'],
  glowColors: ['purple', 'orange', 'blue', 'green'],
  heights: ['h-[380px]'], // Standard card height
  layouts: ['flex flex-col', 'cursor-pointer', 'overflow-hidden'],
};

// Component-specific color themes (from our consistency plan)
const COMPONENT_COLORS = {
  collaborations: 'purple',
  trades: 'orange', 
  connections: 'blue',
  challenges: 'green',
  search: 'orange', // Brand consistency
};

// Search bar patterns
const SEARCH_PATTERNS = {
  variants: ['glass'], // Search bars use glass variant
  features: ['tilt', 'depth', 'glow', 'hover', 'interactive'],
  styling: ['overflow-hidden', 'border-0'],
};

// Layout patterns
const LAYOUT_PATTERNS = {
  pageContainers: ['max-w-7xl', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8', 'py-12'],
  grids: ['grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3', 'gap-6'],
  headers: ['flex', 'flex-col', 'md:flex-row', 'md:items-center', 'md:justify-between', 'mb-8'],
};

/**
 * Check for color consistency issues
 */
export function checkColorConsistency(className: string, componentName: string): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];
  
  // Check for direct color usage instead of theme tokens
  const directColorPattern = /(bg|text|border)-(red|green|blue|yellow|purple|pink|indigo|gray|slate|zinc|neutral|stone|orange|amber|lime|emerald|teal|cyan|sky|violet|fuchsia|rose)-[0-9]+/g;
  const matches = className.match(directColorPattern);
  
  if (matches) {
    matches.forEach(match => {
      issues.push({
        type: 'color',
        severity: 'medium',
        component: componentName,
        description: `Direct color usage: ${match}`,
        suggestion: `Replace ${match} with appropriate theme token (e.g., bg-primary, text-foreground)`,
      });
    });
  }
  
  // Check for brand color consistency
  const brandColorPattern = /(bg|text|border)-(primary|secondary|accent)-[0-9]+/g;
  const brandMatches = className.match(brandColorPattern);
  
  if (brandMatches) {
    brandMatches.forEach(match => {
      const [property, color, shade] = match.split('-');
      if (shade && parseInt(shade) > 600) {
        issues.push({
          type: 'color',
          severity: 'low',
          component: componentName,
          description: `Dark brand color usage: ${match}`,
          suggestion: `Consider using lighter shades (50-600) for better contrast`,
        });
      }
    });
  }
  
  return issues;
}

/**
 * Check for typography consistency issues
 */
export function checkTypographyConsistency(className: string, componentName: string): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];
  
  // Check for inconsistent heading usage
  const headingPattern = /text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)/g;
  const headingMatches = className.match(headingPattern);
  
  if (headingMatches) {
    const sizes = headingMatches.map(match => match.split('-')[1]);
    const hasLargeHeadings = sizes.some(size => ['3xl', '4xl', '5xl', '6xl', '7xl', '8xl', '9xl'].includes(size));
    const hasSmallHeadings = sizes.some(size => ['xs', 'sm'].includes(size));
    
    if (hasLargeHeadings && hasSmallHeadings) {
      issues.push({
        type: 'typography',
        severity: 'medium',
        component: componentName,
        description: 'Inconsistent heading sizes detected',
        suggestion: 'Use consistent heading hierarchy (e.g., text-2xl for main headings, text-lg for subheadings)',
      });
    }
  }
  
  // Check for font weight consistency
  const weightPattern = /font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)/g;
  const weightMatches = className.match(weightPattern);
  
  if (weightMatches && weightMatches.length > 2) {
    issues.push({
      type: 'typography',
      severity: 'low',
      component: componentName,
      description: 'Multiple font weights detected',
      suggestion: 'Limit font weights to 2-3 consistent options (e.g., font-normal, font-semibold, font-bold)',
    });
  }
  
  return issues;
}

/**
 * Check for spacing consistency issues
 */
export function checkSpacingConsistency(className: string, componentName: string): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];
  
  // Check for inconsistent spacing values
  const spacingPattern = /(p|m|gap)-[0-9]+/g;
  const spacingMatches = className.match(spacingPattern);
  
  if (spacingMatches) {
    const values = spacingMatches.map(match => parseInt(match.split('-')[1]));
    const uniqueValues = [...new Set(values)];
    
    if (uniqueValues.length > 4) {
      issues.push({
        type: 'spacing',
        severity: 'low',
        component: componentName,
        description: 'Too many different spacing values',
        suggestion: 'Standardize spacing to 2-4 consistent values (e.g., 2, 4, 6, 8)',
      });
    }
    
    // Check for odd spacing values
    const oddValues = values.filter(v => v % 2 !== 0);
    if (oddValues.length > 0) {
      issues.push({
        type: 'spacing',
        severity: 'medium',
        component: componentName,
        description: `Odd spacing values detected: ${oddValues.join(', ')}`,
        suggestion: 'Use even spacing values for consistency with design system',
      });
    }
  }
  
  return issues;
}

/**
 * Check for interaction pattern consistency
 */
export function checkInteractionConsistency(className: string, componentName: string): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];
  
  // Check for hover state consistency
  const hoverPattern = /hover:(bg|text|border|scale|transform|shadow)-/g;
  const hoverMatches = className.match(hoverPattern);
  
  if (hoverMatches) {
    const hoverTypes = hoverMatches.map(match => match.split(':')[1].split('-')[0]);
    const uniqueHoverTypes = [...new Set(hoverTypes)];
    
    if (uniqueHoverTypes.length > 2) {
      issues.push({
        type: 'interaction',
        severity: 'medium',
        component: componentName,
        description: 'Inconsistent hover effects detected',
        suggestion: 'Standardize hover effects to 1-2 consistent patterns',
      });
    }
  }
  
  // Check for focus state consistency
  const focusPattern = /focus:(outline|ring|border)-/g;
  const focusMatches = className.match(focusPattern);
  
  if (!focusMatches && className.includes('hover:')) {
    issues.push({
      type: 'interaction',
      severity: 'high',
      component: componentName,
      description: 'Missing focus states',
      suggestion: 'Add focus states for accessibility (e.g., focus:ring-2 focus:ring-primary)',
    });
  }
  
  return issues;
}

/**
 * Check for accessibility issues
 */
export function checkAccessibilityConsistency(className: string, componentName: string): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];
  
  // Check for reduced motion support
  if (className.includes('animate-') && !className.includes('motion-reduce:')) {
    issues.push({
      type: 'accessibility',
      severity: 'medium',
      component: componentName,
      description: 'Missing reduced motion support',
      suggestion: 'Add motion-reduce:animate-none for accessibility',
    });
  }
  
  // Check for high contrast support
  if (className.includes('text-') && !className.includes('contrast-more:')) {
    const textColor = className.match(/text-(foreground|muted-foreground|primary|secondary)/);
    if (!textColor) {
      issues.push({
        type: 'accessibility',
        severity: 'low',
        component: componentName,
        description: 'Consider high contrast mode support',
        suggestion: 'Add contrast-more: variants for better accessibility',
      });
    }
  }
  
  return issues;
}

/**
 * Check for API consistency issues
 */
export function checkAPIConsistency(props: Record<string, any>, componentName: string): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];
  
  // Check for consistent variant naming
  const commonVariants = ['default', 'primary', 'secondary', 'outline', 'ghost', 'destructive'];
  const componentVariants = props.variant || [];
  
  if (Array.isArray(componentVariants)) {
    const nonStandardVariants = componentVariants.filter(v => !commonVariants.includes(v));
    if (nonStandardVariants.length > 0) {
      issues.push({
        type: 'api',
        severity: 'medium',
        component: componentName,
        description: `Non-standard variants: ${nonStandardVariants.join(', ')}`,
        suggestion: 'Use standard variant names for consistency',
      });
    }
  }
  
  // Check for consistent size naming
  const commonSizes = ['sm', 'md', 'lg', 'xl'];
  const componentSizes = props.size || [];
  
  if (Array.isArray(componentSizes)) {
    const nonStandardSizes = componentSizes.filter(s => !commonSizes.includes(s));
    if (nonStandardSizes.length > 0) {
      issues.push({
        type: 'api',
        severity: 'medium',
        component: componentName,
        description: `Non-standard sizes: ${nonStandardSizes.join(', ')}`,
        suggestion: 'Use standard size names (sm, md, lg, xl) for consistency',
      });
    }
  }
  
  return issues;
}

/**
 * Check for card consistency issues (based on our visual standards)
 */
export function checkCardConsistency(className: string, props: Record<string, any>, componentName: string): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];
  
  // Check card variant consistency
  const variant = props.variant || 'default';
  if (!CARD_PATTERNS.variants.includes(variant)) {
    issues.push({
      type: 'api',
      severity: 'high',
      component: componentName,
      description: `Invalid card variant: ${variant}`,
      suggestion: `Use one of: ${CARD_PATTERNS.variants.join(', ')}`,
    });
  }
  
  // Check for standard card height
  if (!className.includes('h-[380px]')) {
    issues.push({
      type: 'spacing',
      severity: 'high',
      component: componentName,
      description: 'Missing standard card height',
      suggestion: 'Add h-[380px] for consistent card sizing',
    });
  }
  
  // Check for standard card layout
  const requiredLayoutClasses = ['flex', 'flex-col', 'cursor-pointer', 'overflow-hidden'];
  requiredLayoutClasses.forEach(requiredClass => {
    if (!className.includes(requiredClass)) {
      issues.push({
        type: 'layout',
        severity: 'medium',
        component: componentName,
        description: `Missing required layout class: ${requiredClass}`,
        suggestion: `Add ${requiredClass} for consistent card layout`,
      });
    }
  });
  
  // Check glow color consistency based on component type
  const glowColor = props.glowColor;
  if (glowColor) {
    const expectedColor = getExpectedGlowColor(componentName);
    if (expectedColor && glowColor !== expectedColor) {
      issues.push({
        type: 'color',
        severity: 'medium',
        component: componentName,
        description: `Inconsistent glow color: ${glowColor}`,
        suggestion: `Use glowColor="${expectedColor}" for ${componentName}`,
      });
    }
  }
  
  return issues;
}

/**
 * Check for search bar consistency issues
 */
export function checkSearchBarConsistency(className: string, props: Record<string, any>, componentName: string): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];
  
  // Check search bar variant
  const variant = props.variant || 'default';
  if (variant !== 'glass') {
    issues.push({
      type: 'api',
      severity: 'high',
      component: componentName,
      description: `Search bar should use glass variant, got: ${variant}`,
      suggestion: 'Use variant="glass" for search bars',
    });
  }
  
  // Check for required search bar styling
  if (!className.includes('overflow-hidden') || !className.includes('border-0')) {
    issues.push({
      type: 'styling',
      severity: 'medium',
      component: componentName,
      description: 'Missing required search bar styling',
      suggestion: 'Add overflow-hidden border-0 for glassmorphic search bars',
    });
  }
  
  return issues;
}

/**
 * Check for layout consistency issues
 */
export function checkLayoutConsistency(className: string, componentName: string): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];
  
  // Check page container patterns
  if (componentName.toLowerCase().includes('page')) {
    const requiredContainerClasses = ['max-w-7xl', 'mx-auto', 'px-4'];
    requiredContainerClasses.forEach(requiredClass => {
      if (!className.includes(requiredClass)) {
        issues.push({
          type: 'layout',
          severity: 'medium',
          component: componentName,
          description: `Missing page container class: ${requiredClass}`,
          suggestion: `Add ${requiredClass} for consistent page layout`,
        });
      }
    });
  }
  
  // Check grid patterns
  if (className.includes('grid')) {
    const requiredGridClasses = ['grid-cols-1', 'gap-6'];
    requiredGridClasses.forEach(requiredClass => {
      if (!className.includes(requiredClass)) {
        issues.push({
          type: 'layout',
          severity: 'medium',
          component: componentName,
          description: `Missing grid class: ${requiredClass}`,
          suggestion: `Add ${requiredClass} for consistent grid layout`,
        });
      }
    });
  }
  
  return issues;
}

/**
 * Get expected glow color based on component name
 */
function getExpectedGlowColor(componentName: string): string | null {
  const name = componentName.toLowerCase();
  
  if (name.includes('collaboration')) return 'purple';
  if (name.includes('trade')) return 'orange';
  if (name.includes('connection')) return 'blue';
  if (name.includes('challenge')) return 'green';
  if (name.includes('search')) return 'orange';
  
  return null;
}

/**
 * Generate a comprehensive consistency report
 */
export function generateConsistencyReport(
  components: Array<{ name: string; className: string; props?: Record<string, any> }>
): ConsistencyReport {
  const componentAudits: ComponentAudit[] = [];
  let totalIssues = 0;
  let criticalIssues = 0;
  let highPriorityIssues = 0;
  let mediumPriorityIssues = 0;
  let lowPriorityIssues = 0;
  
  components.forEach(component => {
    const issues: ConsistencyIssue[] = [
      ...checkColorConsistency(component.className, component.name),
      ...checkTypographyConsistency(component.className, component.name),
      ...checkSpacingConsistency(component.className, component.name),
      ...checkInteractionConsistency(component.className, component.name),
      ...checkAccessibilityConsistency(component.className, component.name),
    ];
    
    if (component.props) {
      issues.push(...checkAPIConsistency(component.props, component.name));
      issues.push(...checkCardConsistency(component.className, component.props, component.name));
      issues.push(...checkSearchBarConsistency(component.className, component.props, component.name));
      issues.push(...checkLayoutConsistency(component.className, component.name));
    }
    
    // Count issues by severity
    issues.forEach(issue => {
      totalIssues++;
      switch (issue.severity) {
        case 'critical':
          criticalIssues++;
          break;
        case 'high':
          highPriorityIssues++;
          break;
        case 'medium':
          mediumPriorityIssues++;
          break;
        case 'low':
          lowPriorityIssues++;
          break;
      }
    });
    
    // Calculate component score (0-100)
    const score = Math.max(0, 100 - (issues.length * 10));
    
    const audit: ComponentAudit = {
      componentName: component.name,
      filePath: '', // Would be populated with actual file path
      issues,
      score,
      recommendations: issues.map(issue => issue.suggestion),
    };
    
    componentAudits.push(audit);
  });
  
  // Calculate overall score
  const overallScore = componentAudits.length > 0 
    ? Math.round(componentAudits.reduce((sum, audit) => sum + audit.score, 0) / componentAudits.length)
    : 100;
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  if (criticalIssues > 0) {
    recommendations.push(`Address ${criticalIssues} critical issues first`);
  }
  
  if (highPriorityIssues > 0) {
    recommendations.push(`Fix ${highPriorityIssues} high-priority issues`);
  }
  
  if (mediumPriorityIssues > 0) {
    recommendations.push(`Review ${mediumPriorityIssues} medium-priority issues`);
  }
  
  if (overallScore < 80) {
    recommendations.push('Focus on improving overall consistency score');
  }
  
  return {
    overallScore,
    components: componentAudits,
    summary: {
      totalIssues,
      criticalIssues,
      highPriorityIssues,
      mediumPriorityIssues,
      lowPriorityIssues,
    },
    recommendations,
  };
}

/**
 * Example: Audit the components we just updated for visual consistency
 */
export function auditUpdatedComponents(): ConsistencyReport {
  const components = [
    {
      name: 'CollaborationCard',
      className: 'h-[380px] flex flex-col cursor-pointer overflow-hidden',
      props: {
        variant: 'premium',
        tilt: true,
        depth: 'lg',
        glow: 'subtle',
        glowColor: 'purple',
        hover: true,
        interactive: true
      }
    },
    {
      name: 'TradeCard',
      className: 'h-[380px] flex flex-col cursor-pointer overflow-hidden',
      props: {
        variant: 'premium',
        tilt: true,
        depth: 'lg',
        glow: 'subtle',
        glowColor: 'orange',
        hover: true,
        interactive: true
      }
    },
    {
      name: 'ConnectionCard',
      className: 'h-[380px] flex flex-col cursor-pointer overflow-hidden',
      props: {
        variant: 'premium',
        tilt: true,
        depth: 'lg',
        glow: 'subtle',
        glowColor: 'blue',
        hover: true,
        interactive: true
      }
    },
    {
      name: 'EnhancedSearchBar',
      className: 'overflow-hidden border-0',
      props: {
        variant: 'glass',
        tilt: true,
        depth: 'lg',
        glow: 'subtle',
        glowColor: 'orange',
        hover: true,
        interactive: true
      }
    }
  ];

  return generateConsistencyReport(components);
}

/**
 * Example: Check if a new component follows our visual consistency standards
 */
export function checkNewComponent(
  componentName: string,
  className: string,
  props: Record<string, any>
): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];
  
  // Run all consistency checks
  issues.push(...checkColorConsistency(className, componentName));
  issues.push(...checkTypographyConsistency(className, componentName));
  issues.push(...checkSpacingConsistency(className, componentName));
  issues.push(...checkInteractionConsistency(className, componentName));
  issues.push(...checkAccessibilityConsistency(className, componentName));
  issues.push(...checkAPIConsistency(props, componentName));
  issues.push(...checkCardConsistency(className, props, componentName));
  issues.push(...checkSearchBarConsistency(className, props, componentName));
  issues.push(...checkLayoutConsistency(className, componentName));
  
  return issues;
}

/**
 * Export utility functions for use in other modules
 */
export const ConsistencyChecker = {
  checkColorConsistency,
  checkTypographyConsistency,
  checkSpacingConsistency,
  checkInteractionConsistency,
  checkAccessibilityConsistency,
  checkAPIConsistency,
  generateConsistencyReport,
}; 