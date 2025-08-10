// Simplified Collaboration UI Components
// These components hide backend complexity behind user-friendly interfaces

import React, { useState } from 'react';
import { CollaborationRole, CollaborationProject } from '../types/collaboration';

// Simplified role types that map to complex backend roles
type SimpleRole = 'Leader' | 'Contributor' | 'Helper';

interface SimpleCollaborationCard {
  id: string;
  title: string;
  description: string;
  myRole: SimpleRole;
  teammates: Array<{
    name: string;
    role: SimpleRole;
    skills: string[];
  }>;
  nextAction: string;
  progress: number;
  difficultyLevel: 1 | 2 | 3;
  timeCommitment: string;
}

// Main simplified collaboration component
export const SimpleCollaborationDashboard: React.FC = () => {
  const [projects, setProjects] = useState<SimpleCollaborationCard[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="collaboration-dashboard">
      <header className="dashboard-header">
        <h1>My Collaborations</h1>
        <div className="header-actions">
          <button 
            className="btn-secondary"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? 'Simple View' : 'Advanced View'}
          </button>
          <button className="btn-primary">
            Start New Project
          </button>
        </div>
      </header>

      {!showAdvanced ? (
        <SimpleProjectGrid projects={projects} />
      ) : (
        <AdvancedProjectView projects={projects} />
      )}
    </div>
  );
};

// Simplified project cards for beginners
const SimpleProjectGrid: React.FC<{ projects: SimpleCollaborationCard[] }> = ({ projects }) => {
  return (
    <div className="project-grid">
      {projects.map(project => (
        <SimpleProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
};

const SimpleProjectCard: React.FC<{ project: SimpleCollaborationCard }> = ({ project }) => {
  const getRoleColor = (role: SimpleRole) => {
    switch (role) {
      case 'Leader': return 'bg-blue-100 text-blue-800';
      case 'Contributor': return 'bg-green-100 text-green-800';
      case 'Helper': return 'bg-purple-100 text-purple-800';
    }
  };

  const getDifficultyBadge = (level: number) => {
    const badges = {
      1: '🌱 Beginner',
      2: '🚀 Intermediate', 
      3: '🏆 Advanced'
    };
    return badges[level as keyof typeof badges];
  };

  return (
    <div className="project-card">
      <div className="card-header">
        <h3>{project.title}</h3>
        <span className="difficulty-badge">
          {getDifficultyBadge(project.difficultyLevel)}
        </span>
      </div>
      
      <p className="project-description">{project.description}</p>
      
      <div className="project-meta">
        <div className="my-role">
          <span className={`role-badge ${getRoleColor(project.myRole)}`}>
            {project.myRole}
          </span>
        </div>
        <div className="time-commitment">
          ⏱️ {project.timeCommitment}
        </div>
      </div>

      <div className="progress-section">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${project.progress}%` }}
          />
        </div>
        <span className="progress-text">{project.progress}% complete</span>
      </div>

      <div className="teammates">
        <h4>Team ({project.teammates.length + 1})</h4>
        <div className="teammate-list">
          {project.teammates.map((teammate, index) => (
            <div key={index} className="teammate">
              <span className="teammate-name">{teammate.name}</span>
              <span className={`role-badge small ${getRoleColor(teammate.role)}`}>
                {teammate.role}
              </span>
            </div>
          ))}
        </div>
      </div>

      <button className="next-action-btn">
        {project.nextAction}
      </button>
    </div>
  );
};

// Quick project creation wizard
export const SimpleProjectCreator: React.FC = () => {
  const [step, setStep] = useState(1);
  const [projectData, setProjectData] = useState({
    idea: '',
    skillsNeeded: [] as string[],
    teamSize: 3,
    timeCommitment: '2-3 hours/week',
    difficulty: 1
  });

  const handleCreateProject = async () => {
    // Smart project creation with AI assistance
    const project = await createSimpleCollaboration(
      projectData.idea,
      projectData.skillsNeeded,
      projectData.teamSize
    );
    
    // Auto-assign user as appropriate role
    const userRole = determineOptimalRole(projectData);
    await joinProject(project.id, userRole);
  };

  return (
    <div className="project-creator-wizard">
      {step === 1 && (
        <Step1_ProjectIdea 
          value={projectData.idea}
          onChange={(idea) => setProjectData({...projectData, idea})}
          onNext={() => setStep(2)}
        />
      )}
      
      {step === 2 && (
        <Step2_SkillsAndTeam 
          data={projectData}
          onChange={setProjectData}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}
      
      {step === 3 && (
        <Step3_Confirmation 
          data={projectData}
          onCreate={handleCreateProject}
          onBack={() => setStep(2)}
        />
      )}
    </div>
  );
};

// Challenge Integration Components
export const ChallengeCollaborationCard: React.FC<{ 
  challenge: CollaborationChallenge 
}> = ({ challenge }) => {
  const [joinModalOpen, setJoinModalOpen] = useState(false);

  return (
    <div className="challenge-collab-card">
      <div className="challenge-header">
        <h3>{challenge.title}</h3>
        <span className="challenge-type">Collaboration Challenge</span>
      </div>
      
      <div className="challenge-details">
        <p>{challenge.description}</p>
        
        <div className="team-info">
          <div className="team-size">
            👥 {challenge.config.teamStructure.minMembers}-{challenge.config.teamStructure.maxMembers} people
          </div>
          <div className="duration">
            ⏰ {challenge.config.projectScope.duration}
          </div>
          <div className="complexity">
            📊 {challenge.config.projectScope.complexity}
          </div>
        </div>

        <div className="required-roles">
          <h4>Looking for:</h4>
          {challenge.config.teamStructure.requiredRoles.map(role => (
            <span key={role} className={`role-badge ${getRoleColor(role)}`}>
              {role}
            </span>
          ))}
        </div>

        <div className="skills-needed">
          <h4>Skills involved:</h4>
          <div className="skill-tags">
            {challenge.config.teamStructure.skillDiversity.map(skill => (
              <span key={skill} className="skill-tag">{skill}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="challenge-actions">
        <button 
          className="btn-primary"
          onClick={() => setJoinModalOpen(true)}
        >
          Join Challenge
        </button>
        <button className="btn-secondary">
          Learn More
        </button>
      </div>

      {joinModalOpen && (
        <JoinChallengeModal 
          challenge={challenge}
          onClose={() => setJoinModalOpen(false)}
          onJoin={(role) => handleJoinChallenge(challenge.id, role)}
        />
      )}
    </div>
  );
};

// Smart role selection modal
const JoinChallengeModal: React.FC<{
  challenge: CollaborationChallenge;
  onClose: () => void;
  onJoin: (role: SimpleRole) => void;
}> = ({ challenge, onClose, onJoin }) => {
  const [selectedRole, setSelectedRole] = useState<SimpleRole | null>(null);
  const [recommendedRole] = useState<SimpleRole>(() => {
    // AI determines best role for user
    return determineOptimalRoleForChallenge(challenge);
  });

  return (
    <div className="modal-overlay">
      <div className="join-challenge-modal">
        <h3>Join {challenge.title}</h3>
        
        <div className="recommended-role">
          <h4>Recommended for you:</h4>
          <div className={`role-card recommended ${getRoleColor(recommendedRole)}`}>
            <h5>{recommendedRole}</h5>
            <p>{getRoleDescription(recommendedRole, challenge)}</p>
            <button 
              className="btn-primary"
              onClick={() => onJoin(recommendedRole)}
            >
              Join as {recommendedRole}
            </button>
          </div>
        </div>

        <div className="other-roles">
          <h4>Or choose a different role:</h4>
          {challenge.config.teamStructure.requiredRoles
            .filter(role => role !== recommendedRole)
            .map(role => (
              <div key={role} className={`role-card ${getRoleColor(role)}`}>
                <h5>{role}</h5>
                <p>{getRoleDescription(role, challenge)}</p>
                <button 
                  className="btn-secondary"
                  onClick={() => onJoin(role)}
                >
                  Join as {role}
                </button>
              </div>
            ))}
        </div>

        <button className="close-modal" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
};

// Helper functions
function getRoleColor(role: SimpleRole): string {
  // Implementation from earlier
  switch (role) {
    case 'Leader': return 'bg-blue-100 text-blue-800';
    case 'Contributor': return 'bg-green-100 text-green-800';
    case 'Helper': return 'bg-purple-100 text-purple-800';
  }
}

function getRoleDescription(role: SimpleRole, challenge: CollaborationChallenge): string {
  const descriptions = {
    Leader: "Guide the team, make key decisions, coordinate tasks",
    Contributor: "Build core features, contribute major work, review others' work", 
    Helper: "Support the team, handle smaller tasks, learn from others"
  };
  return descriptions[role];
}

async function createSimpleCollaboration(
  idea: string, 
  skillsNeeded: string[], 
  maxPeople: number
): Promise<CollaborationProject> {
  // This would integrate with the complex backend system
  // but present a simple interface to users
  return {} as CollaborationProject; // Placeholder
}

function determineOptimalRole(projectData: any): SimpleRole {
  // AI logic to determine best role for user
  return 'Contributor'; // Placeholder
}

function determineOptimalRoleForChallenge(challenge: CollaborationChallenge): SimpleRole {
  // AI logic to recommend role based on user profile and challenge needs
  return 'Contributor'; // Placeholder
}

async function handleJoinChallenge(challengeId: string, role: SimpleRole): Promise<void> {
  // Implementation to join challenge with simplified role
  // Maps to complex backend roles internally
}

async function joinProject(projectId: string, role: SimpleRole): Promise<void> {
  // Implementation to join project
}
