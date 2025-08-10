import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Progress } from '../ui/Progress';
import { 
  Calendar,
  CheckCircle,
  Clock,
  Target,
  TrendingUp,
  AlertTriangle,
  Users,
  BarChart3,
  Activity,
  Flag,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  Award,
  Zap,
  Eye,
  MessageCircle,
  FileText,
  Upload,
  Download
} from 'lucide-react';

export interface Milestone {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  status: 'not-started' | 'in-progress' | 'completed' | 'overdue' | 'blocked';
  progress: number; // 0-100
  assignedTo: string[];
  dependencies: string[];
  deliverables: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedHours: number;
  actualHours?: number;
  completedAt?: Date;
  blockers?: string[];
}

export interface ProjectProgress {
  projectId: string;
  projectName: string;
  overallProgress: number;
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled';
  startDate: Date;
  endDate: Date;
  milestones: Milestone[];
  teamMembers: string[];
  totalEstimatedHours: number;
  totalActualHours: number;
  budget?: {
    allocated: number;
    spent: number;
    currency: string;
  };
  metrics: {
    velocity: number; // milestones per week
    burndownRate: number;
    qualityScore: number;
    teamSatisfaction: number;
  };
}

interface ProjectProgressTrackerProps {
  projectData: ProjectProgress;
  onUpdateProgress: (updates: Partial<ProjectProgress>) => void;
  onAddMilestone?: (milestone: Omit<Milestone, 'id'>) => void;
  onUpdateMilestone?: (milestoneId: string, updates: Partial<Milestone>) => void;
  onDeleteMilestone?: (milestoneId: string) => void;
  mode?: 'view' | 'edit';
  className?: string;
}

export const ProjectProgressTracker: React.FC<ProjectProgressTrackerProps> = ({
  projectData,
  onUpdateProgress,
  onAddMilestone,
  onUpdateMilestone,
  onDeleteMilestone,
  mode = 'view',
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'milestones' | 'timeline' | 'analytics'>('overview');
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<string | null>(null);

  // Calculate derived metrics
  const completedMilestones = projectData.milestones.filter(m => m.status === 'completed').length;
  const totalMilestones = projectData.milestones.length;
  const milestonesProgress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;
  
  const overdueMilestones = projectData.milestones.filter(m => 
    m.status !== 'completed' && new Date(m.dueDate) < new Date()
  ).length;
  
  const upcomingMilestones = projectData.milestones.filter(m => {
    const dueDate = new Date(m.dueDate);
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return m.status !== 'completed' && dueDate >= now && dueDate <= weekFromNow;
  }).length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in-progress': return 'bg-blue-500';
      case 'overdue': return 'bg-red-500';
      case 'blocked': return 'bg-orange-500';
      case 'not-started': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4 text-center">
            <Target className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{projectData.overallProgress}%</div>
            <div className="text-gray-300 text-sm">Overall Progress</div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4 text-center">
            <Flag className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{completedMilestones}/{totalMilestones}</div>
            <div className="text-gray-300 text-sm">Milestones</div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{overdueMilestones}</div>
            <div className="text-gray-300 text-sm">Overdue</div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4 text-center">
            <Clock className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{upcomingMilestones}</div>
            <div className="text-gray-300 text-sm">Due This Week</div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Visualization */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Project Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-300">Overall Progress</span>
              <span className="text-white">{projectData.overallProgress}%</span>
            </div>
            <div
              className="w-full bg-gray-700 rounded-full h-3"
              role="progressbar"
              aria-valuenow={projectData.overallProgress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Overall project progress: ${projectData.overallProgress}% complete`}
            >
              <motion.div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${projectData.overallProgress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                aria-hidden="true"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-300">Milestones Completed</span>
              <span className="text-white">{milestonesProgress.toFixed(0)}%</span>
            </div>
            <div
              className="w-full bg-gray-700 rounded-full h-3"
              role="progressbar"
              aria-valuenow={milestonesProgress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Milestones progress: ${milestonesProgress.toFixed(0)}% complete (${completedMilestones} of ${totalMilestones} milestones)`}
            >
              <motion.div
                className="bg-gradient-to-r from-green-500 to-teal-500 h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${milestonesProgress}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                aria-hidden="true"
              />
            </div>
          </div>

          {projectData.budget && (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-300">Budget Used</span>
                <span className="text-white">
                  {((projectData.budget.spent / projectData.budget.allocated) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <motion.div 
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 h-3 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(projectData.budget.spent / projectData.budget.allocated) * 100}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {projectData.milestones
              .filter(m => m.status === 'completed' && m.completedAt)
              .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
              .slice(0, 5)
              .map((milestone) => (
                <div key={milestone.id} className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-white font-medium">{milestone.title}</div>
                    <div className="text-gray-300 text-sm">
                      Completed {milestone.completedAt?.toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            
            {projectData.milestones.filter(m => m.status === 'completed').length === 0 && (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                <p className="text-gray-400">No completed milestones yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Team Performance */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Team Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-sm text-gray-300 mb-2">Velocity</div>
              <div className="text-2xl font-bold text-white mb-1">
                {projectData.metrics.velocity} milestones/week
              </div>
              <div className="text-green-400 text-sm">↗ +12% from last week</div>
            </div>
            
            <div>
              <div className="text-sm text-gray-300 mb-2">Quality Score</div>
              <div className="text-2xl font-bold text-white mb-1">
                {projectData.metrics.qualityScore}/10
              </div>
              <div className="text-blue-400 text-sm">Based on deliverable reviews</div>
            </div>
            
            <div>
              <div className="text-sm text-gray-300 mb-2">Team Satisfaction</div>
              <div className="text-2xl font-bold text-white mb-1">
                {projectData.metrics.teamSatisfaction}/10
              </div>
              <div className="text-yellow-400 text-sm">From weekly surveys</div>
            </div>
            
            <div>
              <div className="text-sm text-gray-300 mb-2">Burndown Rate</div>
              <div className="text-2xl font-bold text-white mb-1">
                {projectData.metrics.burndownRate}%
              </div>
              <div className="text-purple-400 text-sm">On track for deadline</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderMilestonesTab = () => (
    <div className="space-y-6">
      {/* Add Milestone Button */}
      {mode === 'edit' && (
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">Project Milestones</h3>
          <Button 
            onClick={() => setShowAddMilestone(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Milestone
          </Button>
        </div>
      )}

      {/* Milestones List */}
      <div className="space-y-4">
        {projectData.milestones.map((milestone) => (
          <Card key={milestone.id} className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="text-white font-medium">{milestone.title}</h4>
                    <Badge className={cn("text-xs", getStatusColor(milestone.status))}>
                      {milestone.status.replace('-', ' ')}
                    </Badge>
                    <Badge className={cn("text-xs", getPriorityColor(milestone.priority))}>
                      {milestone.priority}
                    </Badge>
                  </div>
                  <p className="text-gray-300 text-sm mb-3">{milestone.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-gray-400">Due Date</div>
                      <div className="text-white">{milestone.dueDate.toLocaleDateString()}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Estimated Hours</div>
                      <div className="text-white">{milestone.estimatedHours}h</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Assigned To</div>
                      <div className="text-white">{milestone.assignedTo.length} members</div>
                    </div>
                  </div>
                </div>
                
                {mode === 'edit' && (
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-400 border-red-400">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300">Progress</span>
                  <span className="text-white">{milestone.progress}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className={cn(
                      "h-2 rounded-full transition-all duration-300",
                      milestone.status === 'completed' ? 'bg-green-500' :
                      milestone.status === 'in-progress' ? 'bg-blue-500' :
                      milestone.status === 'overdue' ? 'bg-red-500' : 'bg-gray-500'
                    )}
                    style={{ width: `${milestone.progress}%` }}
                  />
                </div>
              </div>

              {/* Deliverables */}
              {milestone.deliverables.length > 0 && (
                <div>
                  <div className="text-gray-300 text-sm mb-2">Deliverables</div>
                  <div className="flex flex-wrap gap-1">
                    {milestone.deliverables.map((deliverable, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {deliverable}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Blockers */}
              {milestone.blockers && milestone.blockers.length > 0 && (
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span className="text-red-400 text-sm font-medium">Blockers</span>
                  </div>
                  <ul className="text-red-300 text-sm space-y-1">
                    {milestone.blockers.map((blocker, index) => (
                      <li key={index}>• {blocker}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {projectData.milestones.length === 0 && (
        <Card className="bg-white/5 backdrop-blur-md border-white/10">
          <CardContent className="p-12 text-center">
            <Flag className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-gray-400 font-medium mb-2">No Milestones Yet</h3>
            <p className="text-gray-500 text-sm mb-4">
              Add milestones to track your project progress
            </p>
            {mode === 'edit' && (
              <Button 
                onClick={() => setShowAddMilestone(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Milestone
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className={cn("max-w-6xl mx-auto", className)}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">{projectData.projectName}</h2>
            <p className="text-gray-300">Track progress and manage milestones</p>
          </div>
          <Badge className={cn(
            "text-sm px-3 py-1",
            projectData.status === 'active' ? 'bg-green-500' :
            projectData.status === 'planning' ? 'bg-blue-500' :
            projectData.status === 'on-hold' ? 'bg-yellow-500' :
            projectData.status === 'completed' ? 'bg-purple-500' : 'bg-gray-500'
          )}>
            {projectData.status.replace('-', ' ')}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-white/10 backdrop-blur-md rounded-lg p-1">
        {[
          { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
          { id: 'milestones', label: 'Milestones', icon: <Flag className="w-4 h-4" /> },
          { id: 'timeline', label: 'Timeline', icon: <Calendar className="w-4 h-4" /> },
          { id: 'analytics', label: 'Analytics', icon: <TrendingUp className="w-4 h-4" /> }
        ].map((tab) => (
          <Button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            variant={activeTab === tab.id ? 'default' : 'ghost'}
            className="flex-1"
          >
            {tab.icon}
            <span className="ml-2">{tab.label}</span>
          </Button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'milestones' && renderMilestonesTab()}
          {activeTab === 'timeline' && (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-gray-400 font-medium mb-2">Timeline View</h3>
              <p className="text-gray-500">Timeline visualization coming soon</p>
            </div>
          )}
          {activeTab === 'analytics' && (
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-gray-400 font-medium mb-2">Analytics Dashboard</h3>
              <p className="text-gray-500">Advanced analytics coming soon</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
