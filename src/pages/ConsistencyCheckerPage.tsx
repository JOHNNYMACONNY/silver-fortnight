import React, { useMemo, useState, useCallback } from 'react';
import { comprehensiveAppAudit, ComprehensiveConsistencyReport } from '../utils/comprehensiveConsistencyChecker';
import { intelligentAppAudit, IntelligentConsistencyReport } from '../utils/intelligentConsistencyChecker';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { logger } from '@utils/logging/logger';

const ConsistencyCheckerPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshKey, setRefreshKey] = useState(0);
  const [useIntelligentAudit, setUseIntelligentAudit] = useState(true);
  
  // Use intelligent audit by default, fallback to comprehensive audit
  const report = useMemo(() => {
    try {
      return useIntelligentAudit ? intelligentAppAudit() : comprehensiveAppAudit();
    } catch (error) {
      logger.warn('Intelligent audit failed, falling back to comprehensive audit:', 'PAGE', error);
      return comprehensiveAppAudit();
    }
  }, [refreshKey, useIntelligentAudit]);
  
  // Function to rerun the audit
  const rerunAudit = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'default';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'page': return '📄';
      case 'component': return '🧩';
      case 'modal': return '🪟';
      case 'layout': return '🏗️';
      case 'ui': return '🎨';
      case 'advanced-features': return '🚀';
      default: return '📋';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case '3d-effects': return '🎮';
      case 'glassmorphism': return '💎';
      case 'brand-integration': return '🎨';
      case 'color': return '🌈';
      case 'typography': return '📝';
      case 'spacing': return '📏';
      case 'interaction': return '👆';
      case 'accessibility': return '♿';
      case 'api': return '🔌';
      case 'layout': return '📐';
      case 'styling': return '✨';
      case 'modal': return '🪟';
      case 'page': return '📄';
      case 'component': return '🧩';
      default: return '📋';
    }
  };

  // Helper function to get category data with proper mapping
  const getCategoryData = (categoryKey: string) => {
    const categoryMap: Record<string, keyof typeof report.categories> = {
      'pages': 'pages',
      'components': 'components',
      'modals': 'modals',
      'layout': 'layout',
      'ui': 'ui',
      'advanced-features': 'advancedFeatures'
    };
    
    const actualKey = categoryMap[categoryKey];
    return actualKey ? report.categories[actualKey] : null;
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">🔍 Intelligent TradeYa Consistency Checker</h1>
          <p className="text-lg text-muted-foreground mb-6">
            Real code analysis with intelligent assessment of modern design system implementation
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Analyzes actual component files to provide accurate consistency validation
          </p>
          
          <div className="flex justify-center items-center gap-4 mb-8">
            <Badge variant={report.overallScore >= 90 ? 'default' : report.overallScore >= 70 ? 'secondary' : 'destructive'} className="text-lg px-4 py-2">
              Overall Score: {report.overallScore}/100
            </Badge>
            <div className="text-sm text-muted-foreground">
              Total Issues: {report.summary.totalIssues} | 
              Critical: {report.summary.criticalIssues} | 
              High: {report.summary.highPriorityIssues}
              {(report.summary as any).falsePositives !== undefined && ` | False Positives: ${(report.summary as any).falsePositives}`}
            </div>
          </div>
          
          {/* Audit Type Toggle */}
          <div className="flex justify-center gap-4 mb-6">
            <Button 
              onClick={() => setUseIntelligentAudit(true)}
              variant={useIntelligentAudit ? 'default' : 'outline'}
              className="px-4"
            >
              🧠 Intelligent Audit
            </Button>
            <Button 
              onClick={() => setUseIntelligentAudit(false)}
              variant={!useIntelligentAudit ? 'default' : 'outline'}
              className="px-4"
            >
              📋 Comprehensive Audit
            </Button>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mb-6">
            <Button 
              onClick={rerunAudit}
              variant="outline"
              className="px-6"
            >
              🔄 Rerun Audit
            </Button>
            <Button 
              onClick={() => {
                logger.debug(`${useIntelligentAudit ? 'Intelligent' : 'Comprehensive'} Consistency Report:`, 'PAGE', report);
                alert('Report exported to console! Check browser developer tools.');
              }}
              className="px-6"
            >
              📊 Export to Console
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="pages">Pages ({report.categories.pages.totalItems})</TabsTrigger>
            <TabsTrigger value="components">Components ({report.categories.components.totalItems})</TabsTrigger>
            <TabsTrigger value="modals">Modals ({report.categories.modals.totalItems})</TabsTrigger>
            <TabsTrigger value="layout">Layout ({report.categories.layout.totalItems})</TabsTrigger>
            <TabsTrigger value="ui">UI ({report.categories.ui.totalItems})</TabsTrigger>
            <TabsTrigger value="advanced-features">Advanced ({report.categories.advancedFeatures.totalItems})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">📄</span>
                  <h3 className="text-lg font-semibold">Pages</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Score:</span>
                    <Badge variant={report.categories.pages.score >= 90 ? 'default' : 'secondary'}>
                      {report.categories.pages.score}/100
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Issues:</span>
                    <span className="text-muted-foreground">{report.categories.pages.totalItems}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Audited:</span>
                    <span className="text-muted-foreground">{report.summary.pagesAudited} pages</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">🧩</span>
                  <h3 className="text-lg font-semibold">Components</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Score:</span>
                    <Badge variant={report.categories.components.score >= 90 ? 'default' : 'secondary'}>
                      {report.categories.components.score}/100
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Issues:</span>
                    <span className="text-muted-foreground">{report.categories.components.totalItems}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Audited:</span>
                    <span className="text-muted-foreground">{report.summary.componentsAudited} components</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">🚀</span>
                  <h3 className="text-lg font-semibold">Advanced Features</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Score:</span>
                    <Badge variant={report.categories.advancedFeatures.score >= 90 ? 'default' : 'secondary'}>
                      {report.categories.advancedFeatures.score}/100
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Issues:</span>
                    <span className="text-muted-foreground">{report.categories.advancedFeatures.totalItems}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Audited:</span>
                    <span className="text-muted-foreground">{report.summary.advancedFeaturesAudited} features</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">🪟</span>
                  <h3 className="text-lg font-semibold">Modals</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Score:</span>
                    <Badge variant={report.categories.modals.score >= 90 ? 'default' : 'secondary'}>
                      {report.categories.modals.score}/100
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Issues:</span>
                    <span className="text-muted-foreground">{report.categories.modals.totalItems}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Audited:</span>
                    <span className="text-muted-foreground">{report.summary.modalsAudited} modals</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">🏗️</span>
                  <h3 className="text-lg font-semibold">Layout</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Score:</span>
                    <Badge variant={report.categories.layout.score >= 90 ? 'default' : 'secondary'}>
                      {report.categories.layout.score}/100
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Issues:</span>
                    <span className="text-muted-foreground">{report.categories.layout.totalItems}</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">🎨</span>
                  <h3 className="text-lg font-semibold">UI Components</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Score:</span>
                    <Badge variant={report.categories.ui.score >= 90 ? 'default' : 'secondary'}>
                      {report.categories.ui.score}/100
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Issues:</span>
                    <span className="text-muted-foreground">{report.categories.ui.totalItems}</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Critical Issues Section */}
            {report.issues.filter(issue => issue.severity === 'critical').length > 0 && (
              <Card className="p-6 border-destructive">
                <h3 className="text-lg font-semibold text-destructive mb-4">🚨 Critical Issues</h3>
                <div className="space-y-3">
                  {report.issues.filter(issue => issue.severity === 'critical').slice(0, 5).map((issue, index) => (
                    <div key={index} className="p-3 bg-destructive/10 rounded-lg">
                      <div className="flex items-start gap-3">
                        <span className="text-destructive">{getTypeIcon(issue.type)}</span>
                        <div className="flex-1">
                          <div className="font-medium text-destructive">{issue.component}</div>
                          <div className="text-sm text-muted-foreground">{issue.description}</div>
                          <div className="text-sm text-primary mt-1">💡 {issue.suggestion}</div>
                          {(issue as any).isFalsePositive && (
                            <div className="text-xs text-yellow-600 mt-1">⚠️ This may be a false positive - implementation appears correct</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* False Positives Section */}
            {useIntelligentAudit && report.issues.filter((issue: any) => issue.isFalsePositive).length > 0 && (
              <Card className="p-6 border-yellow-500">
                <h3 className="text-lg font-semibold text-yellow-600 mb-4">⚠️ False Positives Detected</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  The intelligent audit detected that some flagged issues may actually be correctly implemented.
                </p>
                <div className="space-y-3">
                  {report.issues.filter((issue: any) => issue.isFalsePositive).slice(0, 3).map((issue, index) => (
                    <div key={index} className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                      <div className="flex items-start gap-3">
                        <span className="text-yellow-600">{getTypeIcon(issue.type)}</span>
                        <div className="flex-1">
                          <div className="font-medium text-yellow-700 dark:text-yellow-300">{issue.component}</div>
                          <div className="text-sm text-muted-foreground">{issue.description}</div>
                          <div className="text-xs text-yellow-600 mt-1">✅ Implementation appears correct</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </TabsContent>

          {/* Category Tabs */}
          {['pages', 'components', 'modals', 'layout', 'ui', 'advanced-features'].map(category => {
            const categoryData = getCategoryData(category);
            if (!categoryData) return null;
            
            return (
              <TabsContent key={category} value={category} className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{getCategoryIcon(category)}</span>
                  <h2 className="text-2xl font-semibold capitalize">{category.replace('-', ' ')}</h2>
                  <Badge variant={categoryData.score >= 90 ? 'default' : 'secondary'}>
                    {categoryData.score}/100
                  </Badge>
                </div>
                
                <div className="space-y-4">
                  {categoryData.issues.map((issue, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-start gap-3">
                        <span className="text-lg">{getTypeIcon(issue.type)}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">{issue.component}</span>
                            <Badge variant={getSeverityColor(issue.severity)} className="text-xs">
                              {issue.severity}
                            </Badge>
                            {(issue as any).isFalsePositive && (
                              <Badge variant="outline" className="text-xs text-yellow-600">
                                False Positive
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground mb-2">{issue.description}</div>
                          <div className="text-sm text-primary">💡 {issue.suggestion}</div>
                          {issue.filePath && (
                            <div className="text-xs text-muted-foreground mt-2">📁 {issue.filePath}</div>
                          )}
                          {(issue as any).isFalsePositive && (
                            <div className="text-xs text-yellow-600 mt-2">⚠️ This implementation appears to be correct</div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
};

export default ConsistencyCheckerPage; 