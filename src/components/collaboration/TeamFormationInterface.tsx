import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
// Note: Avatar component import - will use div with initials for now
import { 
  Users, 
  UserPlus, 
  UserMinus,
  Crown,
  Star,
  Clock,
  MapPin,
  MessageCircle,
  Settings,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  Mail,
  Calendar,
  Target,
  Zap,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal
} from 'lucide-react';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  skills: string[];
  status: 'active' | 'pending' | 'invited' | 'declined';
  joinedAt?: Date;
  lastActive?: Date;
  isLeader?: boolean;
  contribution?: number; // 0-100 percentage
  availability?: 'available' | 'busy' | 'away';
}

export interface TeamFormationData {
  projectId: string;
  teamName: string;
  description: string;
  maxMembers: number;
  currentMembers: TeamMember[];
  openRoles: string[];
  requirements: string[];
  applicationProcess: 'instant' | 'review' | 'interview';
  isPublic: boolean;
}

interface TeamFormationInterfaceProps {
  initialData?: Partial<TeamFormationData>;
  onTeamUpdate: (data: TeamFormationData) => void;
  onInviteMember?: (email: string, role: string) => void;
  onRemoveMember?: (memberId: string) => void;
  onUpdateMemberRole?: (memberId: string, newRole: string) => void;
  mode?: 'formation' | 'management';
  className?: string;
}

export const TeamFormationInterface: React.FC<TeamFormationInterfaceProps> = ({
  initialData = {},
  onTeamUpdate,
  onInviteMember,
  onRemoveMember,
  onUpdateMemberRole,
  mode = 'formation',
  className = ''
}) => {
  const [teamData, setTeamData] = useState<TeamFormationData>({
    projectId: '',
    teamName: '',
    description: '',
    maxMembers: 5,
    currentMembers: [],
    openRoles: [],
    requirements: [],
    applicationProcess: 'review',
    isPublic: true,
    ...initialData
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'roles' | 'applications'>('overview');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock applications data
  const [applications] = useState([
    {
      id: '1',
      applicantName: 'Sarah Chen',
      applicantEmail: 'sarah@example.com',
      appliedRole: 'Frontend Developer',
      appliedAt: new Date('2024-01-15'),
      status: 'pending',
      skills: ['React', 'TypeScript', 'CSS'],
      experience: '3 years',
      motivation: 'I\'m excited to contribute to this project and learn new technologies.'
    },
    {
      id: '2',
      applicantName: 'Mike Johnson',
      applicantEmail: 'mike@example.com',
      appliedRole: 'UI/UX Designer',
      appliedAt: new Date('2024-01-14'),
      status: 'pending',
      skills: ['Figma', 'Adobe XD', 'User Research'],
      experience: '5 years',
      motivation: 'This project aligns perfectly with my design philosophy.'
    }
  ]);

  const handleInviteMember = () => {
    if (inviteEmail && inviteRole && onInviteMember) {
      onInviteMember(inviteEmail, inviteRole);
      setInviteEmail('');
      setInviteRole('');
      setShowInviteModal(false);
    }
  };

  const getStatusColor = (status: string) => {
    // Map to semantic token-likes; keep fallbacks minimal
    switch (status) {
      case 'active': return 'bg-success-500';
      case 'pending': return 'bg-warning-500';
      case 'invited': return 'bg-secondary-500';
      case 'declined': return 'bg-error-500';
      default: return 'bg-muted';
    }
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'bg-success-500';
      case 'busy': return 'bg-warning-500';
      case 'away': return 'bg-error-500';
      default: return 'bg-muted';
    }
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glassmorphic">
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{teamData.currentMembers.length}</div>
            <div className="text-gray-300 text-sm">Active Members</div>
          </CardContent>
        </Card>
        
        <Card className="glassmorphic">
          <CardContent className="p-4 text-center">
            <Target className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{teamData.openRoles.length}</div>
            <div className="text-gray-300 text-sm">Open Roles</div>
          </CardContent>
        </Card>
        
        <Card className="glassmorphic">
          <CardContent className="p-4 text-center">
            <Mail className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{applications.length}</div>
            <div className="text-gray-300 text-sm">Applications</div>
          </CardContent>
        </Card>
        
        <Card className="glassmorphic">
          <CardContent className="p-4 text-center">
            <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {Math.round(teamData.currentMembers.reduce((acc, m) => acc + (m.contribution || 0), 0) / teamData.currentMembers.length) || 0}%
            </div>
            <div className="text-gray-300 text-sm">Avg Contribution</div>
          </CardContent>
        </Card>
      </div>

      {/* Team Progress */}
      <Card className="glassmorphic">
        <CardHeader>
          <CardTitle className="text-white">Team Formation Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Team Size</span>
              <span className="text-foreground">{teamData.currentMembers.length} / {teamData.maxMembers}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(teamData.currentMembers.length / teamData.maxMembers) * 100}%` }}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Roles Filled</span>
              <span className="text-foreground">
                {teamData.currentMembers.length} / {teamData.currentMembers.length + teamData.openRoles.length}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-success h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${(teamData.currentMembers.length / (teamData.currentMembers.length + teamData.openRoles.length)) * 100}%` 
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="glassmorphic">
        <CardHeader>
          <CardTitle className="text-white">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
            role="group"
            aria-label="Team management quick actions"
          >
            <Button
              onClick={() => setShowInviteModal(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-500"
              aria-label="Open invite member dialog"
            >
              <UserPlus className="w-4 h-4 mr-2" aria-hidden="true" />
              Invite Member
            </Button>

            <Button
              onClick={() => setActiveTab('applications')}
              variant="outline"
              aria-label="Switch to applications tab to review member applications"
            >
              <Mail className="w-4 h-4 mr-2" aria-hidden="true" />
              Review Applications
            </Button>

            <Button
              onClick={() => setActiveTab('roles')}
              variant="outline"
              aria-label="Switch to roles tab to manage team roles"
            >
              <Settings className="w-4 h-4 mr-2" aria-hidden="true" />
              Manage Roles
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderMembersTab = () => (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex space-x-4" role="search" aria-label="Member search and filtering">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" aria-hidden="true" />
          <Input
            id="member-search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search members..."
            className="pl-10 bg-gray-800 border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            aria-label="Search team members by name, role, or skills"
          />
        </div>
        <Button
          variant="outline"
          aria-label="Open member filter options"
        >
          <Filter className="w-4 h-4 mr-2" aria-hidden="true" />
          Filter
        </Button>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teamData.currentMembers.map((member) => (
          <Card key={member.id} className="glassmorphic">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className={cn(
                    "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white",
                    getAvailabilityColor(member.availability || 'available')
                  )} />
                  {member.isLeader && (
                    <Crown className="absolute -top-1 -right-1 w-4 h-4 text-yellow-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-medium">{member.name}</h3>
                  <p className="text-gray-300 text-sm">{member.role}</p>
                  <Badge className={cn("text-xs", getStatusColor(member.status))}>
                    {member.status}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-gray-300 text-xs mb-1">Skills</div>
                  <div className="flex flex-wrap gap-1">
                    {member.skills.slice(0, 3).map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {member.skills.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{member.skills.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>

                {member.contribution !== undefined && (
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-300">Contribution</span>
                      <span className="text-white">{member.contribution}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-1">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-teal-500 h-1 rounded-full"
                        style={{ width: `${member.contribution}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <MessageCircle className="w-3 h-3 mr-1" />
                    Message
                  </Button>
                  <Button size="sm" variant="outline">
                    <MoreHorizontal className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Member Card */}
      <Card 
        className="glassmorphic border-dashed cursor-pointer hover:bg-white/10 transition-colors"
        onClick={() => setShowInviteModal(true)}
      >
        <CardContent className="p-6 text-center">
          <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-gray-300 font-medium mb-2">Invite New Member</h3>
          <p className="text-gray-500 text-sm">Add someone to your team</p>
        </CardContent>
      </Card>
    </div>
  );

  const renderApplicationsTab = () => (
    <div className="space-y-6">
      {applications.map((application) => (
        <Card key={application.id} className="glassmorphic">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center text-white font-medium">
                  {application.applicantName.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="text-white font-medium">{application.applicantName}</h3>
                  <p className="text-gray-300 text-sm">{application.appliedRole}</p>
                  <p className="text-gray-400 text-xs">
                    Applied {application.appliedAt.toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Badge className="bg-yellow-500/20 text-yellow-300">
                {application.status}
              </Badge>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <div className="text-gray-300 text-sm mb-1">Skills</div>
                <div className="flex flex-wrap gap-1">
                  {application.skills.map((skill, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-gray-300 text-sm mb-1">Experience</div>
                <p className="text-white text-sm">{application.experience}</p>
              </div>

              <div>
                <div className="text-gray-300 text-sm mb-1">Motivation</div>
                <p className="text-gray-300 text-sm">{application.motivation}</p>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button variant="success">
                <CheckCircle className="w-4 h-4 mr-2" />
                Accept
              </Button>
              <Button variant="destructive">
                <XCircle className="w-4 h-4 mr-2" />
                Decline
              </Button>
              <Button variant="outline">
                <MessageCircle className="w-4 h-4 mr-2" />
                Interview
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {applications.length === 0 && (
        <Card className="glassmorphic">
          <CardContent className="p-12 text-center">
            <Mail className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-gray-400 font-medium mb-2">No Applications Yet</h3>
            <p className="text-gray-500 text-sm">
              Applications will appear here when people apply to join your team
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className={cn("max-w-6xl mx-auto", className)}>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">
          {mode === 'formation' ? 'Team Formation' : 'Team Management'}
        </h2>
        <p className="text-gray-300">
          {mode === 'formation' 
            ? 'Build your perfect team for this collaboration project'
            : 'Manage your team members and their roles'
          }
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 glassmorphic p-1">
        {[
          { id: 'overview', label: 'Overview', icon: <Eye className="w-4 h-4" /> },
          { id: 'members', label: 'Members', icon: <Users className="w-4 h-4" /> },
          { id: 'applications', label: 'Applications', icon: <Mail className="w-4 h-4" /> }
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
          {activeTab === 'members' && renderMembersTab()}
          {activeTab === 'applications' && renderApplicationsTab()}
        </motion.div>
      </AnimatePresence>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-overlay">
          <Card className="bg-gray-900 border-gray-700 w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-white">Invite Team Member</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <Input
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Role
                </label>
                <Input
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  placeholder="Enter role (e.g., Frontend Developer)"
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <Button 
                  onClick={handleInviteMember}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500"
                >
                  Send Invitation
                </Button>
                <Button 
                  onClick={() => setShowInviteModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
