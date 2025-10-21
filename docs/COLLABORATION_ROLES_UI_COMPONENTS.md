# Collaboration Roles System: UI Components

This document outlines the UI components needed for the Collaboration Roles System in TradeYa, including their design, functionality, and implementation details.

## Table of Contents

1. [Overview](#overview)
2. [Component Architecture](#component-architecture)
3. [Component Designs](#component-designs)
4. [State Management](#state-management)
5. [Integration with Existing Pages](#integration-with-existing-pages)
6. [Responsive Design Considerations](#responsive-design-considerations)

## Overview

The Collaboration Roles System requires several new UI components to support:

- Creating and editing role definitions
- Applying for roles
- Managing role applications
- Tracking role and collaboration progress
- Requesting and confirming role completion

These components should follow TradeYa's existing design language while incorporating modern UI enhancements like micro-interactions, glassmorphism, and smooth animations.

## Component Architecture

### Component Hierarchy

```
CollaborationDetailPage
├── CollaborationHeader
├── CollaborationDescription
├── CollaborationRolesSection
│   ├── RoleCard (multiple)
│   │   ├── RoleStatusBadge
│   │   ├── SkillBadge (multiple)
│   │   └── RoleActionButton
├── RoleApplicationModal
│   ├── RoleApplicationForm
│   │   └── EvidenceSubmitter
├── RoleManagementDashboard (for creator)
│   ├── RoleManagementCard (multiple)
│   │   ├── ApplicationsList
│   │   │   └── ApplicationCard (multiple)
│   │   └── RoleCompletionSection
└── CollaborationStatusTracker
    └── RoleStatusTimeline (multiple)
```

### Component Reuse

The system will reuse several existing components:

- **SkillBadge**: For displaying required and preferred skills
- **EvidenceSubmitter**: For submitting evidence with applications
- **EvidenceGallery**: For displaying evidence in applications
- **ProfileImageWithUser**: For displaying applicant information
- **Modal**: For application and management modals

## Component Designs

### 1. RoleCard Component

A card component displaying role information and actions.

```tsx
interface RoleCardProps {
  role: CollaborationRole;
  collaboration: Collaboration;
  isCreator: boolean;
  onApply?: () => void;
  onManage?: () => void;
  onEdit?: () => void;
}

export const RoleCard: React.FC<RoleCardProps> = ({
  role,
  collaboration,
  isCreator,
  onApply,
  onManage,
  onEdit
}) => {
  return (
    <div className="backdrop-blur-md bg-white/70 dark:bg-gray-800/60 border border-white/20 dark:border-gray-700/30 rounded-lg shadow-lg p-6 transition-all duration-300 hover:shadow-xl">
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-semibold">{role.title}</h3>
        <RoleStatusBadge status={role.status} />
      </div>
      
      <p className="mt-2 text-gray-600 dark:text-gray-300">{role.description}</p>
      
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200">Required Skills</h4>
        <div className="mt-1 flex flex-wrap gap-2">
          {role.requiredSkills.map(skill => (
            <SkillBadge 
              key={skill.name} 
              skill={skill.name} 
              level={skill.level} 
            />
          ))}
        </div>
      </div>
      
      {role.preferredSkills && role.preferredSkills.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200">Preferred Skills</h4>
          <div className="mt-1 flex flex-wrap gap-2">
            {role.preferredSkills.map(skill => (
              <SkillBadge 
                key={skill.name} 
                skill={skill.name} 
                level={skill.level} 
              />
            ))}
          </div>
        </div>
      )}
      
      {role.participantId && (
        <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200">Assigned To</h4>
          <div className="mt-1">
            <ProfileImageWithUser 
              userId={role.participantId} 
              userName={role.participantName || ''} 
              photoURL={role.participantPhotoURL} 
            />
          </div>
        </div>
      )}
      
      <div className="mt-6 flex justify-end">
        {isCreator ? (
          <>
            <button 
              onClick={onEdit} 
              className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white mr-4"
            >
              Edit
            </button>
            <button 
              onClick={onManage} 
              className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors"
            >
              Manage
            </button>
          </>
        ) : (
          role.status === 'open' && (
            <button 
              onClick={onApply} 
              className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors"
            >
              Apply
            </button>
          )
        )}
      </div>
    </div>
  );
};
```

### 2. RoleDefinitionForm Component

A form component for creating and editing roles.

```tsx
interface RoleDefinitionFormProps {
  initialRole?: Partial<CollaborationRole>;
  onSubmit: (roleData: Partial<CollaborationRole>) => void;
  onCancel: () => void;
}

export const RoleDefinitionForm: React.FC<RoleDefinitionFormProps> = ({
  initialRole,
  onSubmit,
  onCancel
}) => {
  const [title, setTitle] = useState(initialRole?.title || '');
  const [description, setDescription] = useState(initialRole?.description || '');
  const [requiredSkills, setRequiredSkills] = useState<Skill[]>(initialRole?.requiredSkills || []);
  const [preferredSkills, setPreferredSkills] = useState<Skill[]>(initialRole?.preferredSkills || []);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      description,
      requiredSkills,
      preferredSkills
    });
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          Role Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          Role Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          Required Skills
        </label>
        <SkillSelector
          selectedSkills={requiredSkills}
          onChange={setRequiredSkills}
          withLevels
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          Preferred Skills (Optional)
        </label>
        <SkillSelector
          selectedSkills={preferredSkills}
          onChange={setPreferredSkills}
          withLevels
        />
      </div>
      
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
        >
          {initialRole ? 'Update Role' : 'Add Role'}
        </button>
      </div>
    </form>
  );
};
```

### 3. RoleApplicationForm Component

A form for users to apply for specific roles.

```tsx
interface RoleApplicationFormProps {
  collaboration: Collaboration;
  role: CollaborationRole;
  onSubmit: (applicationData: {
    message: string;
    evidence?: EmbeddedEvidence[];
  }) => Promise<void>;
  onCancel: () => void;
}

export const RoleApplicationForm: React.FC<RoleApplicationFormProps> = ({
  collaboration,
  role,
  onSubmit,
  onCancel
}) => {
  const [message, setMessage] = useState('');
  const [evidence, setEvidence] = useState<EmbeddedEvidence[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSubmit({
        message,
        evidence
      });
    } catch (error) {
      console.error('Error submitting application:', error);
      // Show error toast
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Apply for: {role.title}</h3>
        <p className="mt-1 text-sm text-gray-500">
          Part of collaboration: {collaboration.title}
        </p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          Why are you a good fit for this role?
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
          placeholder="Describe your relevant experience and why you're interested in this role..."
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          Portfolio Evidence (Optional)
        </label>
        <p className="text-sm text-gray-500 mb-2">
          Add links to your work that demonstrates the required skills.
        </p>
        <EvidenceSubmitter
          evidence={evidence}
          onChange={setEvidence}
          maxItems={5}
        />
      </div>
      
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-70"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Application'}
        </button>
      </div>
    </form>
  );
};
```

### 4. RoleManagementDashboard Component

A dashboard for collaboration creators to manage roles and applications.

```tsx
interface RoleManagementDashboardProps {
  collaboration: Collaboration;
  roles: CollaborationRole[];
  onRoleUpdate: (roleId: string, updates: Partial<CollaborationRole>) => Promise<void>;
}

export const RoleManagementDashboard: React.FC<RoleManagementDashboardProps> = ({
  collaboration,
  roles,
  onRoleUpdate
}) => {
  const [activeTab, setActiveTab] = useState<'open' | 'filled' | 'completed'>('open');
  
  const filteredRoles = roles.filter(role => {
    if (activeTab === 'open') return role.status === 'open';
    if (activeTab === 'filled') return role.status === 'filled';
    return role.status === 'completed';
  });
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-6">Role Management</h2>
      
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('open')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'open'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Open Roles ({roles.filter(r => r.status === 'open').length})
          </button>
          <button
            onClick={() => setActiveTab('filled')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'filled'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Filled Roles ({roles.filter(r => r.status === 'filled').length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'completed'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Completed Roles ({roles.filter(r => r.status === 'completed').length})
          </button>
        </nav>
      </div>
      
      <div className="space-y-6">
        {filteredRoles.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No {activeTab} roles found.
          </p>
        ) : (
          filteredRoles.map(role => (
            <RoleManagementCard
              key={role.id}
              role={role}
              collaboration={collaboration}
              onUpdate={(updates) => onRoleUpdate(role.id, updates)}
            />
          ))
        )}
      </div>
    </div>
  );
};
```

### 5. CollaborationStatusTracker Component

A visual component showing the overall status of a collaboration.

```tsx
interface CollaborationStatusTrackerProps {
  collaboration: Collaboration;
  roles: CollaborationRole[];
}

export const CollaborationStatusTracker: React.FC<CollaborationStatusTrackerProps> = ({
  collaboration,
  roles
}) => {
  // Calculate progress percentages
  const totalRoles = roles.length;
  const filledRoles = roles.filter(r => r.status === 'filled' || r.status === 'completed').length;
  const completedRoles = roles.filter(r => r.status === 'completed').length;
  
  const filledPercentage = totalRoles > 0 ? (filledRoles / totalRoles) * 100 : 0;
  const completedPercentage = totalRoles > 0 ? (completedRoles / totalRoles) * 100 : 0;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Collaboration Progress</h2>
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Overall Progress
          </span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {completedRoles} of {totalRoles} roles completed
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div 
            className="bg-orange-500 h-2.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${completedPercentage}%` }}
          />
        </div>
      </div>
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Team Formation
          </span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {filledRoles} of {totalRoles} roles filled
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div 
            className="bg-blue-500 h-2.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${filledPercentage}%` }}
          />
        </div>
      </div>
      
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
        <h3 className="text-lg font-medium mb-4">Role Status</h3>
        <div className="space-y-4">
          {roles.map(role => (
            <RoleStatusTimeline key={role.id} role={role} />
          ))}
        </div>
      </div>
    </div>
  );
};
```

## State Management

The Collaboration Roles System will use a combination of React Context and local component state:

### CollaborationContext

```tsx
interface CollaborationContextType {
  collaboration: Collaboration | null;
  roles: CollaborationRole[];
  applications: Record<string, RoleApplication[]>;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  updateRole: (roleId: string, updates: Partial<CollaborationRole>) => Promise<void>;
  createRole: (roleData: Omit<CollaborationRole, 'id' | 'collaborationId'>) => Promise<void>;
  deleteRole: (roleId: string) => Promise<void>;
  submitApplication: (roleId: string, applicationData: Partial<RoleApplication>) => Promise<void>;
  updateApplicationStatus: (roleId: string, applicationId: string, status: 'accepted' | 'rejected') => Promise<void>;
  requestRoleCompletion: (roleId: string, data: { notes: string, evidence?: EmbeddedEvidence[] }) => Promise<void>;
  confirmRoleCompletion: (roleId: string) => Promise<void>;
}

export const CollaborationContext = createContext<CollaborationContextType | undefined>(undefined);

export const CollaborationProvider: React.FC<{
  collaborationId: string;
  children: React.ReactNode;
}> = ({ collaborationId, children }) => {
  // Implementation
};
```

## Integration with Existing Pages

### CollaborationDetailPage Updates

The CollaborationDetailPage will be updated to:

1. Include the CollaborationRolesSection component
2. Add the RoleApplicationModal for applying to roles
3. Add the RoleManagementDashboard for collaboration creators
4. Add the CollaborationStatusTracker component

### CollaborationCreationPage Updates

The CollaborationCreationPage will be updated to:

1. Include the ability to define roles during creation
2. Add the RoleDefinitionForm component
3. Support editing and removing roles before publishing

### UserProfilePage Updates

The UserProfilePage will be updated to:

1. Show collaborations where the user has a role
2. Display the user's role and status in each collaboration
3. Show pending role applications

## Responsive Design Considerations

All new components will be designed with mobile-first principles:

1. **RoleCard**: Stack content vertically on small screens
2. **RoleManagementDashboard**: Simplified view with collapsible sections on mobile
3. **RoleApplicationForm**: Full-width inputs and simplified layout on mobile
4. **CollaborationStatusTracker**: Compact view with essential information on mobile

Touch targets will be at least 44x44 pixels for mobile users, and all interactive elements will have appropriate hover/focus/active states for both mouse and touch interactions.
