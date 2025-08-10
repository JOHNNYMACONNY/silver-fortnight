import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { MultiStepForm, FormStep, StepComponentProps } from '../forms/MultiStepForm';
import { SmartCollaborationWorkflow, CollaborationWorkflowData } from './SmartCollaborationWorkflow';
import { ProgressiveDisclosureWrapper, DisclosureSection } from './ProgressiveDisclosureWrapper';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import {
  Rocket,
  Wand2,
  Settings,
  CheckCircle,
  AlertCircle,
  Info,
  Lightbulb,
  Users,
  Calendar,
  Target,
  Zap,
  Eye,
  EyeOff,
  Lock,
  Globe,
  Clock,
  Star,
  ArrowRight,
  Save,
  Play
} from 'lucide-react';

export interface ProjectCreationData extends CollaborationWorkflowData {
  // Advanced settings
  visibility: 'public' | 'unlisted' | 'private';
  applicationProcess: 'instant' | 'review' | 'interview';
  mentorshipLevel: 'none' | 'peer' | 'expert';
  progressTracking: 'basic' | 'detailed' | 'milestone-based';
  communicationTools: string[];
  
  // Launch settings
  publishImmediately: boolean;
  scheduledLaunch?: Date;
  previewMode: boolean;
  inviteList: string[];
}

interface ImprovedProjectCreationWizardProps {
  onComplete: (data: ProjectCreationData) => void;
  onSaveDraft?: (data: Partial<ProjectCreationData>) => void;
  onCancel?: () => void;
  initialData?: Partial<ProjectCreationData>;
  mode?: 'simple' | 'guided' | 'advanced';
  className?: string;
}

export const ImprovedProjectCreationWizard: React.FC<ImprovedProjectCreationWizardProps> = ({
  onComplete,
  onSaveDraft,
  onCancel,
  initialData = {},
  mode = 'guided',
  className = ''
}) => {
  const [creationMode, setCreationMode] = useState<'simple' | 'guided' | 'advanced'>(mode);
  const [projectData, setProjectData] = useState<ProjectCreationData>({
    projectIdea: '',
    projectType: 'building',
    description: '',
    teamSize: 3,
    timeCommitment: '3-5 hours/week',
    duration: '4-6 weeks',
    isRemote: true,
    skillsNeeded: [],
    selectedRoles: [],
    difficulty: 'intermediate',
    privacy: 'public',
    autoAccept: false,
    mentorshipAvailable: false,
    tags: [],
    
    // Advanced settings
    visibility: 'public',
    applicationProcess: 'review',
    mentorshipLevel: 'peer',
    progressTracking: 'detailed',
    communicationTools: ['Discord', 'GitHub'],
    publishImmediately: true,
    previewMode: false,
    inviteList: [],
    
    ...initialData
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Advanced Settings Step
  const AdvancedSettingsStep: React.FC<StepComponentProps> = ({ data, onChange }) => {
    const advancedSections: DisclosureSection[] = [
      {
        id: 'visibility',
        title: 'Project Visibility',
        description: 'Control who can see and join your project',
        level: 'simple',
        icon: <Globe className="w-5 h-5" />,
        content: (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              {[
                { 
                  value: 'public', 
                  title: 'Public', 
                  description: 'Anyone can discover and apply',
                  icon: <Globe className="w-4 h-4" />
                },
                { 
                  value: 'unlisted', 
                  title: 'Unlisted', 
                  description: 'Only people with the link can join',
                  icon: <Eye className="w-4 h-4" />
                },
                { 
                  value: 'private', 
                  title: 'Private', 
                  description: 'Invitation only',
                  icon: <Lock className="w-4 h-4" />
                }
              ].map((option) => (
                <Card
                  key={option.value}
                  className={cn(
                    "cursor-pointer transition-all duration-300",
                    data.visibility === option.value
                      ? "bg-blue-500/20 border-blue-500/50 ring-2 ring-blue-500/30"
                      : "bg-white/10 border-white/20 hover:bg-white/15"
                  )}
                  onClick={() => onChange('visibility', option.value)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                        {option.icon}
                      </div>
                      <div>
                        <div className="text-white font-medium">{option.title}</div>
                        <div className="text-gray-300 text-sm">{option.description}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )
      },
      {
        id: 'application-process',
        title: 'Application Process',
        description: 'How should people join your project?',
        level: 'intermediate',
        icon: <Users className="w-5 h-5" />,
        content: (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              {[
                { 
                  value: 'instant', 
                  title: 'Instant Join', 
                  description: 'People can join immediately',
                  recommended: data.projectType === 'learning'
                },
                { 
                  value: 'review', 
                  title: 'Application Review', 
                  description: 'Review applications before accepting',
                  recommended: data.projectType === 'building'
                },
                { 
                  value: 'interview', 
                  title: 'Interview Process', 
                  description: 'Conduct interviews before accepting',
                  recommended: data.difficulty === 'advanced'
                }
              ].map((option) => (
                <Card
                  key={option.value}
                  className={cn(
                    "cursor-pointer transition-all duration-300",
                    data.applicationProcess === option.value
                      ? "bg-blue-500/20 border-blue-500/50 ring-2 ring-blue-500/30"
                      : "bg-white/10 border-white/20 hover:bg-white/15"
                  )}
                  onClick={() => onChange('applicationProcess', option.value)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium flex items-center space-x-2">
                          <span>{option.title}</span>
                          {option.recommended && (
                            <Badge className="bg-green-500/20 text-green-300 text-xs">
                              Recommended
                            </Badge>
                          )}
                        </div>
                        <div className="text-gray-300 text-sm">{option.description}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )
      },
      {
        id: 'mentorship',
        title: 'Mentorship & Support',
        description: 'What level of guidance will be available?',
        level: 'intermediate',
        icon: <Lightbulb className="w-5 h-5" />,
        content: (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              {[
                { value: 'none', title: 'Self-Directed', description: 'Team works independently' },
                { value: 'peer', title: 'Peer Support', description: 'Team members help each other' },
                { value: 'expert', title: 'Expert Mentorship', description: 'Experienced mentor guides the team' }
              ].map((option) => (
                <Card
                  key={option.value}
                  className={cn(
                    "cursor-pointer transition-all duration-300",
                    data.mentorshipLevel === option.value
                      ? "bg-blue-500/20 border-blue-500/50 ring-2 ring-blue-500/30"
                      : "bg-white/10 border-white/20 hover:bg-white/15"
                  )}
                  onClick={() => onChange('mentorshipLevel', option.value)}
                >
                  <CardContent className="p-4">
                    <div className="text-white font-medium">{option.title}</div>
                    <div className="text-gray-300 text-sm">{option.description}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )
      },
      {
        id: 'communication',
        title: 'Communication Tools',
        description: 'Select tools for team communication',
        level: 'advanced',
        icon: <Settings className="w-5 h-5" />,
        content: (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {['Discord', 'Slack', 'GitHub', 'Figma', 'Notion', 'Zoom'].map((tool) => (
                <Button
                  key={tool}
                  variant={data.communicationTools?.includes(tool) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    const current = data.communicationTools || [];
                    const updated = current.includes(tool)
                      ? current.filter(t => t !== tool)
                      : [...current, tool];
                    onChange('communicationTools', updated);
                  }}
                >
                  {tool}
                </Button>
              ))}
            </div>
          </div>
        )
      }
    ];

    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <Settings className="w-12 h-12 text-blue-400 mx-auto" />
          <h3 className="text-xl font-bold text-white">Advanced Settings</h3>
          <p className="text-gray-300">Customize your project's behavior and features</p>
        </div>

        <ProgressiveDisclosureWrapper
          sections={advancedSections}
          initialLevel="simple"
          allowLevelOverride={true}
        />
      </div>
    );
  };

  // Launch Settings Step
  const LaunchSettingsStep: React.FC<StepComponentProps> = ({ data, onChange }) => {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <Rocket className="w-12 h-12 text-blue-400 mx-auto" />
          <h3 className="text-xl font-bold text-white">Launch Your Project</h3>
          <p className="text-gray-300">Choose how and when to make your project available</p>
        </div>

        {/* Launch Options */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Launch Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div>
                <div className="text-white font-medium">Publish Immediately</div>
                <div className="text-gray-300 text-sm">Make project available right away</div>
              </div>
              <Button
                variant={data.publishImmediately ? 'default' : 'outline'}
                size="sm"
                onClick={() => onChange('publishImmediately', !data.publishImmediately)}
              >
                {data.publishImmediately ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div>
                <div className="text-white font-medium">Preview Mode</div>
                <div className="text-gray-300 text-sm">Test your project setup before going live</div>
              </div>
              <Button
                variant={data.previewMode ? 'default' : 'outline'}
                size="sm"
                onClick={() => onChange('previewMode', !data.previewMode)}
              >
                {data.previewMode ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Project Summary */}
        <Card className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-md border-blue-500/30">
          <CardHeader>
            <CardTitle className="text-white">Project Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-300">Project Type</div>
                <div className="text-white font-medium capitalize">{data.projectType}</div>
              </div>
              <div>
                <div className="text-gray-300">Team Size</div>
                <div className="text-white font-medium">{data.teamSize} people</div>
              </div>
              <div>
                <div className="text-gray-300">Duration</div>
                <div className="text-white font-medium">{data.duration}</div>
              </div>
              <div>
                <div className="text-gray-300">Commitment</div>
                <div className="text-white font-medium">{data.timeCommitment}</div>
              </div>
            </div>
            
            <div>
              <div className="text-gray-300 text-sm mb-1">Roles Selected</div>
              <div className="flex flex-wrap gap-1">
                {data.selectedRoles?.map((role, index) => (
                  <Badge key={index} className="bg-blue-500/20 text-blue-300">
                    {role.title}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const handleWorkflowComplete = (workflowData: CollaborationWorkflowData) => {
    setProjectData(prev => ({ ...prev, ...workflowData }));
  };

  const handleFinalSubmit = (data: ProjectCreationData) => {
    // Validate final data
    const errors: Record<string, string> = {};
    
    if (!data.projectIdea.trim()) {
      errors.projectIdea = 'Project idea is required';
    }
    
    if (data.selectedRoles.length === 0) {
      errors.roles = 'At least one role must be selected';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    onComplete(data);
  };

  const renderModeSelector = () => (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 mb-6">
      <CardHeader>
        <CardTitle className="text-white text-center">Choose Your Creation Experience</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              mode: 'simple' as const,
              title: 'Quick Start',
              description: 'Basic project setup in 3 steps',
              icon: <Zap className="w-6 h-6" />,
              time: '2-3 minutes'
            },
            {
              mode: 'guided' as const,
              title: 'Guided Setup',
              description: 'Step-by-step with smart suggestions',
              icon: <Wand2 className="w-6 h-6" />,
              time: '5-7 minutes'
            },
            {
              mode: 'advanced' as const,
              title: 'Full Control',
              description: 'All options and customizations',
              icon: <Settings className="w-6 h-6" />,
              time: '10-15 minutes'
            }
          ].map((option) => (
            <Card
              key={option.mode}
              className={cn(
                "cursor-pointer transition-all duration-300",
                creationMode === option.mode
                  ? "bg-blue-500/20 border-blue-500/50 ring-2 ring-blue-500/30"
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              )}
              onClick={() => setCreationMode(option.mode)}
            >
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  {option.icon}
                </div>
                <h3 className="text-white font-medium mb-2">{option.title}</h3>
                <p className="text-gray-300 text-sm mb-3">{option.description}</p>
                <Badge variant="outline" className="text-xs">
                  {option.time}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  if (creationMode === 'simple') {
    return (
      <div className={cn("max-w-4xl mx-auto", className)}>
        {renderModeSelector()}
        <SmartCollaborationWorkflow
          onComplete={handleFinalSubmit}
          onCancel={onCancel}
          initialData={projectData}
        />
      </div>
    );
  }

  // Enhanced form steps for guided and advanced modes
  const enhancedSteps: FormStep[] = [
    {
      id: 'basic-workflow',
      title: 'Project Basics',
      description: 'Define your project idea and team structure',
      component: ({ data, onChange }) => (
        <SmartCollaborationWorkflow
          onComplete={(workflowData) => {
            Object.entries(workflowData).forEach(([key, value]) => {
              onChange(key, value);
            });
          }}
          initialData={data}
        />
      ),
      validation: (data) => data.projectIdea && data.selectedRoles?.length > 0
    }
  ];

  if (creationMode === 'advanced') {
    enhancedSteps.push(
      {
        id: 'advanced-settings',
        title: 'Advanced Settings',
        description: 'Customize project behavior and features',
        component: AdvancedSettingsStep,
        validation: () => true
      }
    );
  }

  enhancedSteps.push({
    id: 'launch-settings',
    title: 'Launch Project',
    description: 'Review and launch your project',
    component: LaunchSettingsStep,
    validation: () => true
  });

  return (
    <div className={cn("max-w-4xl mx-auto", className)}>
      {renderModeSelector()}
      
      <MultiStepForm
        steps={enhancedSteps}
        initialData={projectData}
        onSubmit={handleFinalSubmit}
        variant="stepped"
        brandAccent="gradient"
        showProgressBar={true}
        showStepNumbers={true}
        allowStepNavigation={false}
        validateOnStepChange={true}
        persistData={true}
        storageKey="enhanced-project-creation"
      />

      {/* Save Draft Button */}
      {onSaveDraft && (
        <div className="mt-6 text-center">
          <Button
            onClick={() => onSaveDraft(projectData)}
            variant="outline"
            className="mr-4"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
        </div>
      )}

      {onCancel && (
        <div className="mt-4 text-center">
          <Button
            onClick={onCancel}
            variant="ghost"
            className="text-gray-400 hover:text-white"
          >
            Cancel and return to dashboard
          </Button>
        </div>
      )}
    </div>
  );
};
