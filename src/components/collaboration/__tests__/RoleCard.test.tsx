import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RoleCard } from '../RoleCard';
import { RoleState } from '../../../types/collaboration';

// Mock the problematic utilities

jest.mock('../../ui/ProfileAvatarButton', () => ({
  __esModule: true,
  default: ({ userId, size }: any) => `MockProfileAvatarButton-${userId}-${size}`,
}));

jest.mock('../../ui/SkillBadge', () => ({
  SkillBadge: ({ skill, level }: any) => `MockSkillBadge-${skill}-${level}`,
}));

const baseRole = {
  id: 'role-1',
  collaborationId: 'collab-1',
  title: 'Frontend Developer',
  description: 'Build UI',
  requiredSkills: [
    { name: 'React', level: 'advanced' as const },
    { name: 'TypeScript', level: 'intermediate' as const },
    { name: 'CSS', level: 'beginner' as const },
    { name: 'Testing', level: 'intermediate' as const }
  ],
  preferredSkills: [
    { name: 'Storybook', level: 'beginner' as const }
  ],
  status: RoleState.OPEN,
  applicationCount: 2,
  participantId: undefined,
  participantPhotoURL: undefined,
  completionStatus: undefined,
  maxParticipants: 1,
  childRoleIds: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

describe('RoleCard', () => {
  it('renders with minimal props and shows Untitled Role if no title', () => {
    const role = { ...baseRole, title: '' };
    render(<RoleCard role={role} collaborationId="collab-1" isCreator={false} />);
    expect(screen.getByText('Untitled Role')).toBeInTheDocument();
  });

  it('renders with custom variant prop', () => {
    render(<RoleCard role={baseRole} collaborationId="collab-1" isCreator={false} variant="glass" />);
    // The variant prop should be passed to the Card component
    expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
  });

  it('renders with enhanced effects disabled', () => {
    render(<RoleCard role={baseRole} collaborationId="collab-1" isCreator={false} enhanced={false} />);
    expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
  });

  it('shows up to 3 skill badges and a +N more badge if more', () => {
    render(<RoleCard role={baseRole} collaborationId="collab-1" isCreator={false} />);
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('CSS')).toBeInTheDocument();
    expect(screen.getByText('+1 more')).toBeInTheDocument();
  });

  it('shows No skills specified if requiredSkills is empty', () => {
    const role = { ...baseRole, requiredSkills: [] };
    render(<RoleCard role={role} collaborationId="collab-1" isCreator={false} />);
    expect(screen.getByText('No skills specified')).toBeInTheDocument();
  });

  it('shows correct status badge for each RoleState', () => {
    const states = [RoleState.OPEN, RoleState.FILLED, RoleState.COMPLETED, RoleState.ABANDONED];
    const expected = ['Open', 'Filled', 'Completed', 'Abandoned'];
    states.forEach((status, i) => {
      const role = { ...baseRole, status };
      render(<RoleCard role={role} collaborationId="collab-1" isCreator={false} />);
      expect(screen.getByText(expected[i])).toBeInTheDocument();
    });
  });

  it('renders Edit and Manage buttons for creator', () => {
    render(<RoleCard role={baseRole} collaborationId="collab-1" isCreator={true} onEdit={jest.fn()} onManage={jest.fn()} />);
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Manage Applications')).toBeInTheDocument();
  });

  it('renders Apply button for open role for non-creator', () => {
    render(<RoleCard role={baseRole} collaborationId="collab-1" isCreator={false} onApply={jest.fn()} />);
    expect(screen.getByText('Apply')).toBeInTheDocument();
  });

  it('renders Abandon Role button for creator when status is FILLED', () => {
    const role = { ...baseRole, status: RoleState.FILLED };
    render(<RoleCard role={role} collaborationId="collab-1" isCreator={true} onAbandon={jest.fn()} />);
    expect(screen.getByText('Abandon Role')).toBeInTheDocument();
  });

  it('renders Request Role Completion for participant when status is FILLED', () => {
    const role = { ...baseRole, status: RoleState.FILLED, participantId: 'user-1', completionStatus: undefined };
    render(<RoleCard role={role} collaborationId="collab-1" isCreator={false} onRequestCompletion={jest.fn()} />);
    expect(screen.getByText('Request Role Completion')).toBeInTheDocument();
  });

  it('is focusable and responds to Enter/Space for keyboard navigation', () => {
    const onManage = jest.fn();
    render(<RoleCard role={baseRole} collaborationId="collab-1" isCreator={true} onManage={onManage} />);
    const card = screen.getByRole('group');
    card.focus();
    fireEvent.keyDown(card, { key: 'Enter' });
    expect(onManage).toHaveBeenCalled();
    fireEvent.keyDown(card, { key: ' ' });
    expect(onManage).toHaveBeenCalledTimes(2);
  });

  it('has correct ARIA label and visible focus ring', () => {
    render(<RoleCard role={baseRole} collaborationId="collab-1" isCreator={false} />);
    const card = screen.getByRole('group');
    expect(card).toHaveAttribute('aria-label', expect.stringContaining('Role:'));
    card.focus();
    expect(card).toHaveClass('focus:outline-none');
  });

  it('has proper ARIA labels for action buttons', () => {
    render(<RoleCard role={baseRole} collaborationId="collab-1" isCreator={true} onEdit={jest.fn()} onManage={jest.fn()} />);
    
    const editButton = screen.getByText('Edit');
    expect(editButton).toHaveAttribute('aria-label', expect.stringContaining('Edit role'));
    
    const manageButton = screen.getByText('Manage Applications');
    expect(manageButton).toHaveAttribute('aria-label', expect.stringContaining('Manage applications'));
  });

  it('has proper ARIA labels for non-creator buttons', () => {
    render(<RoleCard role={baseRole} collaborationId="collab-1" isCreator={false} onApply={jest.fn()} />);
    
    const applyButton = screen.getByText('Apply');
    expect(applyButton).toHaveAttribute('aria-label', expect.stringContaining('Apply for'));
  });
}); 