import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { 
  ChevronDown,
  ChevronRight,
  Settings,
  Eye,
  EyeOff,
  Layers,
  Zap,
  Info,
  Lock,
  Unlock,
  HelpCircle,
  Lightbulb,
  ArrowRight
} from 'lucide-react';

export type DisclosureLevel = 'simple' | 'intermediate' | 'advanced' | 'expert';

export interface DisclosureSection {
  id: string;
  title: string;
  description: string;
  level: DisclosureLevel;
  icon?: React.ReactNode;
  content: React.ReactNode;
  isOptional?: boolean;
  dependencies?: string[]; // IDs of sections that must be visible first
  helpText?: string;
}

interface ProgressiveDisclosureWrapperProps {
  sections: DisclosureSection[];
  initialLevel?: DisclosureLevel;
  onLevelChange?: (level: DisclosureLevel) => void;
  allowLevelOverride?: boolean;
  className?: string;
}

export const ProgressiveDisclosureWrapper: React.FC<ProgressiveDisclosureWrapperProps> = ({
  sections,
  initialLevel = 'simple',
  onLevelChange,
  allowLevelOverride = true,
  className = ''
}) => {
  const [currentLevel, setCurrentLevel] = useState<DisclosureLevel>(initialLevel);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [overriddenSections, setOverriddenSections] = useState<Set<string>>(new Set());
  const [showHelp, setShowHelp] = useState(false);

  const levelHierarchy: DisclosureLevel[] = ['simple', 'intermediate', 'advanced', 'expert'];
  
  const getLevelIndex = (level: DisclosureLevel): number => {
    return levelHierarchy.indexOf(level);
  };

  const getLevelColor = (level: DisclosureLevel): string => {
    switch (level) {
      case 'simple': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'intermediate': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'advanced': return 'text-purple-400 bg-purple-500/20 border-purple-500/30';
      case 'expert': return 'text-red-400 bg-red-500/20 border-red-500/30';
    }
  };

  const getLevelIcon = (level: DisclosureLevel): React.ReactNode => {
    switch (level) {
      case 'simple': return <Lightbulb className="w-4 h-4" />;
      case 'intermediate': return <Layers className="w-4 h-4" />;
      case 'advanced': return <Settings className="w-4 h-4" />;
      case 'expert': return <Zap className="w-4 h-4" />;
    }
  };

  // Filter sections based on current level and dependencies
  const getVisibleSections = (): DisclosureSection[] => {
    const currentLevelIndex = getLevelIndex(currentLevel);
    
    return sections.filter(section => {
      // Check if section level is within current level
      const sectionLevelIndex = getLevelIndex(section.level);
      const isWithinLevel = sectionLevelIndex <= currentLevelIndex;
      
      // Check if section is manually overridden
      const isOverridden = overriddenSections.has(section.id);
      
      // Check dependencies
      const dependenciesMet = !section.dependencies || 
        section.dependencies.every(depId => 
          getVisibleSections().some(s => s.id === depId) || 
          overriddenSections.has(depId)
        );
      
      return (isWithinLevel || isOverridden) && dependenciesMet;
    });
  };

  const getHiddenSections = (): DisclosureSection[] => {
    const visibleIds = new Set(getVisibleSections().map(s => s.id));
    return sections.filter(section => !visibleIds.has(section.id));
  };

  const handleLevelChange = (newLevel: DisclosureLevel) => {
    setCurrentLevel(newLevel);
    onLevelChange?.(newLevel);
    
    // Auto-expand sections that are now visible
    const newVisibleSections = sections.filter(section => 
      getLevelIndex(section.level) <= getLevelIndex(newLevel)
    );
    
    setExpandedSections(prev => {
      const newExpanded = new Set(prev);
      newVisibleSections.forEach(section => {
        if (!section.isOptional) {
          newExpanded.add(section.id);
        }
      });
      return newExpanded;
    });
  };

  const toggleSectionExpansion = (sectionId: string) => {
    setExpandedSections(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(sectionId)) {
        newExpanded.delete(sectionId);
      } else {
        newExpanded.add(sectionId);
      }
      return newExpanded;
    });
  };

  const toggleSectionOverride = (sectionId: string) => {
    setOverriddenSections(prev => {
      const newOverridden = new Set(prev);
      if (newOverridden.has(sectionId)) {
        newOverridden.delete(sectionId);
      } else {
        newOverridden.add(sectionId);
      }
      return newOverridden;
    });
  };

  useEffect(() => {
    // Auto-expand non-optional sections when they become visible
    const visibleSections = getVisibleSections();
    setExpandedSections(prev => {
      const newExpanded = new Set(prev);
      visibleSections.forEach(section => {
        if (!section.isOptional) {
          newExpanded.add(section.id);
        }
      });
      return newExpanded;
    });
  }, [currentLevel, overriddenSections]);

  const renderLevelSelector = () => (
    <Card className="bg-white/10 backdrop-blur-md border-white/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center space-x-2">
            <Layers className="w-5 h-5" />
            <span>Complexity Level</span>
          </CardTitle>
          <Button
            onClick={() => setShowHelp(!showHelp)}
            variant="ghost"
            size="sm"
          >
            <HelpCircle className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {levelHierarchy.map((level) => (
            <Button
              key={level}
              onClick={() => handleLevelChange(level)}
              variant={currentLevel === level ? 'default' : 'outline'}
              size="sm"
              className={cn(
                "flex flex-col items-center space-y-1 h-auto py-3",
                currentLevel === level && "ring-2 ring-blue-500/50"
              )}
            >
              {getLevelIcon(level)}
              <span className="text-xs capitalize">{level}</span>
            </Button>
          ))}
        </div>

        <AnimatePresence>
          {showHelp && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3"
            >
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2 text-blue-300">
                  <Info className="w-4 h-4" />
                  <span className="font-medium">Complexity Levels</span>
                </div>
                <div className="space-y-1 text-gray-300">
                  <div><strong>Simple:</strong> Basic options only</div>
                  <div><strong>Intermediate:</strong> Common customizations</div>
                  <div><strong>Advanced:</strong> Detailed configuration</div>
                  <div><strong>Expert:</strong> All available options</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );

  const renderSection = (section: DisclosureSection) => {
    const isExpanded = expandedSections.has(section.id);
    const isOverridden = overriddenSections.has(section.id);
    const isNormallyVisible = getLevelIndex(section.level) <= getLevelIndex(currentLevel);

    return (
      <Card 
        key={section.id}
        className={cn(
          "transition-all duration-300",
          isOverridden && !isNormallyVisible 
            ? "bg-yellow-500/10 backdrop-blur-md border-yellow-500/30" 
            : "bg-white/10 backdrop-blur-md border-white/20"
        )}
      >
        <CardHeader 
          className="cursor-pointer"
          onClick={() => toggleSectionExpansion(section.id)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {section.icon && (
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                  {section.icon}
                </div>
              )}
              <div>
                <CardTitle className="text-white flex items-center space-x-2">
                  <span>{section.title}</span>
                  {section.isOptional && (
                    <Badge variant="outline" className="text-xs">
                      Optional
                    </Badge>
                  )}
                </CardTitle>
                <p className="text-gray-300 text-sm">{section.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getLevelColor(section.level)}>
                {section.level}
              </Badge>
              {allowLevelOverride && !isNormallyVisible && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSectionOverride(section.id);
                  }}
                  variant="ghost"
                  size="sm"
                  title={isOverridden ? "Hide section" : "Show section"}
                >
                  {isOverridden ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                </Button>
              )}
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </div>
          </div>
        </CardHeader>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CardContent>
                {section.helpText && (
                  <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-blue-300">{section.helpText}</p>
                    </div>
                  </div>
                )}
                {section.content}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    );
  };

  const renderHiddenSections = () => {
    const hiddenSections = getHiddenSections();
    
    if (hiddenSections.length === 0 || !allowLevelOverride) return null;

    return (
      <Card className="bg-gray-500/10 backdrop-blur-md border-gray-500/30">
        <CardHeader>
          <CardTitle className="text-gray-400 flex items-center space-x-2">
            <EyeOff className="w-5 h-5" />
            <span>Hidden Sections ({hiddenSections.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {hiddenSections.map((section) => (
              <div 
                key={section.id}
                className="flex items-center justify-between p-2 bg-gray-600/20 rounded"
              >
                <div className="flex items-center space-x-2">
                  {section.icon}
                  <span className="text-gray-300 text-sm">{section.title}</span>
                  <Badge className={getLevelColor(section.level)} variant="outline">
                    {section.level}
                  </Badge>
                </div>
                <Button
                  onClick={() => toggleSectionOverride(section.id)}
                  variant="ghost"
                  size="sm"
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={cn("space-y-6", className)}>
      {renderLevelSelector()}
      
      <div className="space-y-4">
        {getVisibleSections().map(renderSection)}
      </div>

      {renderHiddenSections()}

      {/* Summary */}
      <div className="text-center">
        <div className="inline-flex items-center space-x-2 text-sm text-gray-400 bg-blue-500/10 px-3 py-2 rounded-lg">
          <Layers className="w-4 h-4" />
          <span>
            Showing {getVisibleSections().length} of {sections.length} sections at {currentLevel} level
          </span>
        </div>
      </div>
    </div>
  );
};
