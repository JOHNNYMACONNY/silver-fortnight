import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { UserProfileCard } from '../UserProfileCard';
import { sendConnectionRequest } from '../../lib/networking';

// Mock the networking module
vi.mock('../../lib/networking', () => ({
  sendConnectionRequest: vi.fn()
}));

// Mock profile data
const mockProfile = {
  id: 'user123',
  displayName: 'Test User',
  email: 'test@example.com',
  bio: 'Test bio',
  skills: ['React', 'TypeScript', 'Node.js'],
  portfolio: 'https://example.com',
  experience: 0,
  level: 1,
  badges: [],
  endorsements: {},
  skillLevels: {},
  activeQuests: [],
  completedQuests: [],
  challengeProgress: {},
  createdAt: new Date(),
  updatedAt: new Date()
};

describe('UserProfileCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders profile information correctly', () => {
    render(
      <UserProfileCard
        profile={mockProfile}
        currentUserId="currentUser123"
        connectionStatus="none"
      />
    );

    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('Test bio')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Connect')).toBeInTheDocument();
  });

  it('updates button state to "Pending" when connection request is sent', async () => {
    const onConnect = vi.fn();
    
    // Mock successful connection request
    (sendConnectionRequest as jest.Mock).mockResolvedValueOnce(undefined);

    render(
      <UserProfileCard
        profile={mockProfile}
        currentUserId="currentUser123"
        connectionStatus="none"
        onConnect={onConnect}
      />
    );

    // Initial state
    const connectButton = screen.getByText('Connect');
    expect(connectButton).toBeInTheDocument();

    // Click connect button
    fireEvent.click(connectButton);

    // Verify loading state
    expect(screen.getByText('Connecting...')).toBeInTheDocument();

    // Wait for request to complete
    await waitFor(() => {
      expect(screen.getByText('Request Pending')).toBeInTheDocument();
    });

    // Verify API was called
    expect(sendConnectionRequest).toHaveBeenCalledWith('currentUser123', 'user123');
    
    // Verify callback was called with success
    expect(onConnect).toHaveBeenCalledWith(true);
  });

  it('reverts button state on connection request failure', async () => {
    const onConnect = vi.fn();
    
    // Mock failed connection request
    (sendConnectionRequest as jest.Mock).mockRejectedValueOnce(new Error('Connection failed'));

    render(
      <UserProfileCard
        profile={mockProfile}
        currentUserId="currentUser123"
        connectionStatus="none"
        onConnect={onConnect}
      />
    );

    // Click connect button
    fireEvent.click(screen.getByText('Connect'));

    // Verify loading state
    expect(screen.getByText('Connecting...')).toBeInTheDocument();

    // Wait for request to fail
    await waitFor(() => {
      expect(screen.getByText('Connect')).toBeInTheDocument();
    });

    // Verify API was called
    expect(sendConnectionRequest).toHaveBeenCalledWith('currentUser123', 'user123');
    
    // Verify callback was called with failure
    expect(onConnect).toHaveBeenCalledWith(false);
  });

  it('prevents multiple connection requests while one is in progress', async () => {
    // Mock slow connection request
    (sendConnectionRequest as jest.Mock).mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(resolve, 1000))
    );

    render(
      <UserProfileCard
        profile={mockProfile}
        currentUserId="currentUser123"
        connectionStatus="none"
      />
    );

    // Click connect button multiple times
    const connectButton = screen.getByText('Connect');
    fireEvent.click(connectButton);
    fireEvent.click(connectButton);
    fireEvent.click(connectButton);

    // Verify API was only called once
    expect(sendConnectionRequest).toHaveBeenCalledTimes(1);
  });

  it('shows message button for accepted connections', () => {
    const onMessage = vi.fn();

    render(
      <UserProfileCard
        profile={mockProfile}
        currentUserId="currentUser123"
        connectionStatus="accepted"
        onMessage={onMessage}
      />
    );

    const messageButton = screen.getByText('Message');
    expect(messageButton).toBeInTheDocument();

    fireEvent.click(messageButton);
    expect(onMessage).toHaveBeenCalledWith(mockProfile);
  });

  it('disables connect button when no current user', () => {
    render(
      <UserProfileCard
        profile={mockProfile}
        connectionStatus="none"
      />
    );

    const connectButton = screen.getByText('Connect');
    expect(connectButton).toBeDisabled();
  });
});