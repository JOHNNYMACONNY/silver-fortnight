/**
 * Enhanced Style Guide Component
 * Comprehensive demonstration of design system consistency and standardized patterns
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Button } from './Button';
import { Badge } from './Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './Tabs';
import { designTokens, classPatterns, componentVariants } from '../../utils/designSystem';
import { StyleAuditTool } from '../../utils/styleAuditTool';
import { CheckCircle, AlertTriangle, Info, Palette, Type, Layout, Zap } from 'lucide-react';
import { logger } from '@utils/logging/logger';

export const EnhancedStyleGuide: React.FC = () => {
  const [auditResult, setAuditResult] = useState<any>(null);
  const [isRunningAudit, setIsRunningAudit] = useState(false);

  const runStyleAudit = async () => {
    setIsRunningAudit(true);
    try {
      const auditTool = new StyleAuditTool();
      const result = await auditTool.runAudit();
      setAuditResult(result);
    } catch (error) {
      logger.error('Audit failed:', 'COMPONENT', {}, error as Error);
    } finally {
      setIsRunningAudit(false);
    }
  };

  return (
    <div className={classPatterns.pageContainer + ' ' + classPatterns.sectionContainer}>
      {/* Header */}
      <motion.div 
        className="mb-12 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className={classPatterns.heading1 + ' mb-4'}>
          TradeYa Design System
        </h1>
        <p className={classPatterns.bodyLarge + ' text-muted-foreground mb-6'}>
          Comprehensive style guide showcasing consistent design patterns and glassmorphic aesthetics
        </p>
        
        {/* Audit Controls */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <Button 
            onClick={runStyleAudit} 
            disabled={isRunningAudit}
            className="flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            {isRunningAudit ? 'Running Audit...' : 'Run Style Audit'}
          </Button>
          
          {auditResult && (
            <div className="flex items-center gap-2">
              <Badge className={auditResult.summary.totalIssues === 0 ? componentVariants.badge.success : componentVariants.badge.warning}>
                {auditResult.summary.totalIssues} issues found
              </Badge>
              <Badge className={componentVariants.badge.brand}>
                {auditResult.summary.autoFixableCount} auto-fixable
              </Badge>
            </div>
          )}
        </div>

        {/* Audit Results Summary */}
        {auditResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={classPatterns.glassCard + ' p-6 mb-8'}
          >
            <h3 className={classPatterns.heading3 + ' mb-4 flex items-center gap-2'}>
              <CheckCircle className="w-5 h-5 text-green-500" />
              Audit Results
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className={classPatterns.heading2 + ' text-primary'}>
                  {auditResult.summary.totalIssues}
                </div>
                <div className={classPatterns.bodySmall}>Total Issues</div>
              </div>
              <div>
                <div className={classPatterns.heading2 + ' text-red-500'}>
                  {auditResult.summary.issuesBySeverity.critical || 0}
                </div>
                <div className={classPatterns.bodySmall}>Critical</div>
              </div>
              <div>
                <div className={classPatterns.heading2 + ' text-yellow-500'}>
                  {auditResult.summary.issuesBySeverity.high || 0}
                </div>
                <div className={classPatterns.bodySmall}>High Priority</div>
              </div>
              <div>
                <div className={classPatterns.heading2 + ' text-green-500'}>
                  {auditResult.summary.autoFixableCount}
                </div>
                <div className={classPatterns.bodySmall}>Auto-fixable</div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      <Tabs value="colors" onValueChange={() => {}} className="space-y-8">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="colors" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Colors
          </TabsTrigger>
          <TabsTrigger value="typography" className="flex items-center gap-2">
            <Type className="w-4 h-4" />
            Typography
          </TabsTrigger>
          <TabsTrigger value="spacing">Spacing</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="layout" className="flex items-center gap-2">
            <Layout className="w-4 h-4" />
            Layout
          </TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
        </TabsList>

        {/* Colors Tab */}
        <TabsContent value="colors" className="space-y-8">
          <Card variant="glass" className={classPatterns.glassCard}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Brand Colors
              </CardTitle>
              <p className={classPatterns.bodySmall}>
                Standardized brand colors with consistent usage patterns
              </p>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Brand Colors */}
              <div>
                <h3 className={classPatterns.heading3 + ' mb-4'}>Brand Colors</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                  {Object.entries(designTokens.colors.brand).map(([name, color]) => (
                    <motion.div 
                      key={name} 
                      className="text-center"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                    >
                       <div 
                        className="w-20 h-20 rounded-xl mb-3 mx-auto shadow-lg border-2 border-border"
                        style={{ backgroundColor: color }}
                        title={`${name}: ${color}`}
                      />
                      <span className={classPatterns.bodyMedium + ' capitalize font-medium'}>{name}</span>
                      <div className={classPatterns.caption + ' font-mono'}>{color}</div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Semantic Colors */}
              <div>
                <h3 className={classPatterns.heading3 + ' mb-4'}>Semantic Colors</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {Object.entries(designTokens.colors.semantic).map(([name, color]) => (
                    <motion.div 
                      key={name} 
                      className="text-center"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div 
                        className="w-16 h-16 rounded-lg mb-2 mx-auto shadow-lg"
                        style={{ backgroundColor: color }}
                        title={`${name}: ${color}`}
                      />
                      <span className={classPatterns.bodySmall + ' capitalize'}>{name}</span>
                      <div className={classPatterns.caption + ' font-mono'}>{color}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Typography Tab */}
        <TabsContent value="typography" className="space-y-8">
          <Card variant="glass" className={classPatterns.glassCard}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="w-5 h-5" />
                Typography Scale
              </CardTitle>
              <p className={classPatterns.bodySmall}>
                Consistent typography patterns for headings, body text, and captions
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Headings */}
              <div>
                <h3 className={classPatterns.heading3 + ' mb-4'}>Headings</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-white/5 rounded-lg">
                    <h1 className={classPatterns.heading1}>Heading 1 - Main Page Title</h1>
                    <code className={classPatterns.caption + ' text-muted-foreground'}>
                      classPatterns.heading1
                    </code>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg">
                    <h2 className={classPatterns.heading2}>Heading 2 - Section Title</h2>
                    <code className={classPatterns.caption + ' text-muted-foreground'}>
                      classPatterns.heading2
                    </code>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg">
                    <h3 className={classPatterns.heading3}>Heading 3 - Subsection</h3>
                    <code className={classPatterns.caption + ' text-muted-foreground'}>
                      classPatterns.heading3
                    </code>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg">
                    <h4 className={classPatterns.heading4}>Heading 4 - Component Title</h4>
                    <code className={classPatterns.caption + ' text-muted-foreground'}>
                      classPatterns.heading4
                    </code>
                  </div>
                </div>
              </div>

              {/* Body Text */}
              <div>
                <h3 className={classPatterns.heading3 + ' mb-4'}>Body Text</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-white/5 rounded-lg">
                    <p className={classPatterns.bodyLarge}>
                      Large body text for important content and introductions.
                    </p>
                    <code className={classPatterns.caption + ' text-muted-foreground'}>
                      classPatterns.bodyLarge
                    </code>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg">
                    <p className={classPatterns.bodyMedium}>
                      Medium body text for regular content and descriptions.
                    </p>
                    <code className={classPatterns.caption + ' text-muted-foreground'}>
                      classPatterns.bodyMedium
                    </code>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg">
                    <p className={classPatterns.bodySmall}>
                      Small body text for secondary information and metadata.
                    </p>
                    <code className={classPatterns.caption + ' text-muted-foreground'}>
                      classPatterns.bodySmall
                    </code>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg">
                    <p className={classPatterns.caption}>
                      Caption text for labels, timestamps, and fine print.
                    </p>
                    <code className={classPatterns.caption + ' text-muted-foreground'}>
                      classPatterns.caption
                    </code>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Spacing Tab */}
        <TabsContent value="spacing" className="space-y-8">
          <Card variant="glass" className={classPatterns.glassCard}>
            <CardHeader>
              <CardTitle>Spacing Scale</CardTitle>
              <p className={classPatterns.bodySmall}>
                Consistent spacing based on 4px grid system
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(designTokens.spacing).map(([name, value]) => (
                  <div key={name} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
                    <div className="w-16 text-right">
                      <code className={classPatterns.caption + ' font-mono'}>{name}</code>
                    </div>
                    <div 
                      className="bg-primary rounded"
                      style={{ width: value, height: '16px' }}
                    />
                    <div className={classPatterns.bodySmall + ' text-muted-foreground'}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Components Tab */}
        <TabsContent value="components" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Buttons */}
            <Card variant="glass" className={classPatterns.glassCard}>
              <CardHeader>
                <CardTitle>Buttons</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className={componentVariants.button.primary}>Primary Button</Button>
                <Button className={componentVariants.button.secondary}>Secondary Button</Button>
                <Button className={componentVariants.button.ghost}>Ghost Button</Button>
                <Button className={componentVariants.button.glassmorphic}>Glassmorphic Button</Button>
                <Button className={componentVariants.button.destructive}>Destructive Button</Button>
              </CardContent>
            </Card>

            {/* Badges */}
            <Card variant="glass" className={classPatterns.glassCard}>
              <CardHeader>
                <CardTitle>Badges</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge className={componentVariants.badge.default}>Default</Badge>
                  <Badge className={componentVariants.badge.success}>Success</Badge>
                  <Badge className={componentVariants.badge.warning}>Warning</Badge>
                  <Badge className={componentVariants.badge.error}>Error</Badge>
                  <Badge className={componentVariants.badge.brand}>Brand</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Layout Tab */}
        <TabsContent value="layout" className="space-y-8">
          <Card variant="glass" className={classPatterns.glassCard}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="w-5 h-5" />
                Layout Patterns
              </CardTitle>
              <p className={classPatterns.bodySmall}>
                Standardized layout patterns for consistent structure
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Container Patterns */}
              <div>
                <h3 className={classPatterns.heading3 + ' mb-4'}>Container Patterns</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-white/5 rounded-lg">
                    <code className={classPatterns.bodySmall + ' font-mono'}>
                      classPatterns.pageContainer
                    </code>
                    <div className={classPatterns.caption + ' text-muted-foreground mt-1'}>
                      {classPatterns.pageContainer}
                    </div>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg">
                    <code className={classPatterns.bodySmall + ' font-mono'}>
                      classPatterns.responsiveGrid
                    </code>
                    <div className={classPatterns.caption + ' text-muted-foreground mt-1'}>
                      {classPatterns.responsiveGrid}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Patterns Tab */}
        <TabsContent value="patterns" className="space-y-8">
          <Card variant="glass" className={classPatterns.glassCard}>
            <CardHeader>
              <CardTitle>Glassmorphic Patterns</CardTitle>
              <p className={classPatterns.bodySmall}>
                Standardized glassmorphic effects and patterns
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={classPatterns.glassCard + ' p-6 text-center'}>
                  <h4 className={classPatterns.heading4 + ' mb-2'}>Glass Card</h4>
                  <p className={classPatterns.bodySmall}>Standard glassmorphic card</p>
                </div>
                <div className={classPatterns.glassForm + ' p-6 text-center'}>
                  <h4 className={classPatterns.heading4 + ' mb-2'}>Glass Form</h4>
                  <p className={classPatterns.bodySmall}>Form container with enhanced blur</p>
                </div>
                <div className={classPatterns.glassNavbar + ' p-6 text-center'}>
                  <h4 className={classPatterns.heading4 + ' mb-2'}>Glass Navbar</h4>
                  <p className={classPatterns.bodySmall}>Navigation with subtle glass effect</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
