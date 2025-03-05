import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import RequestModal from '../components/RequestModal';
import { createTradeRequest, createProjectRequest } from '../lib/requests';
import toast from '../utils/toast';

// Mock dependencies
vi.mock('../lib/requests');
vi.mock('../utils/toast');

describe('RequestModal', () => {
  const mockClose = vi.fn();
  const defaultTradeProps = {
    isOpen: true,
    onClose: mockClose,
    currentUserId: 'user1',
    recipientId: 'user2',
    mode: 'trade' as const,
    type: 'invitation' as const,
    tradeId: 'trade1',
    tradeName: 'Test Trade'
  };

  const defaultProjectProps = {
    isOpen: true,
    onClose: mockClose,
    currentUserId: 'user1',
    recipientId: 'user2',
    mode: 'project' as const,
    type: 'application' as const,
    projectId: 'project1',
    projectName: 'Test Project',
    positionId: 'position1',
    positionName: 'Developer',
    requiredSkills: ['React', 'TypeScript']
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders trade request modal correctly', () => {
    render(<RequestModal {...defaultTradeProps} />);
    
    expect(screen.getByText('Send Invitation')).toBeInTheDocument();
    expect(screen.getByText('Test Trade')).toBeInTheDocument();
  });

  it('renders project request modal correctly', () => {
    render(<RequestModal {...defaultProjectProps} />);
    
    expect(screen.getByText('Submit Request')).toBeInTheDocument();
    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('Position: Developer')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
  });

  it('validates required skills for project requests', async () => {
    render(<RequestModal {...defaultProjectProps} />);
    
    const submitButton = screen.getByText('Send Request');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please select at least one relevant skill')).toBeInTheDocument();
    });
  });

  it('validates expiry date', async () => {
    render(<RequestModal {...defaultTradeProps} />);
    
    const dateInput = screen.getByLabelText(/expires on/i);
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    fireEvent.change(dateInput, { target: { value: pastDate.toISOString().split('T')[0] } });

    const submitButton = screen.getByText('Send Request');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Expiry date must be in the future')).toBeInTheDocument();
    });
  });

  it('submits trade request successfully', async () => {
    vi.mocked(createTradeRequest).mockResolvedValueOnce('request1');
    
    render(<RequestModal {...defaultTradeProps} />);
    
    const messageInput = screen.getByPlaceholderText('Add a personal message...');
    fireEvent.change(messageInput, { target: { value: 'Test message' } });

    const submitButton = screen.getByText('Send Request');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(createTradeRequest).toHaveBeenCalledWith(
        'user1',
        'user2',
        'trade1',
        'Test Trade',
        'invitation',
        'Test message',
        undefined
      );
      expect(mockClose).toHaveBeenCalled();
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({
        type: 'success'
      }));
    });
  });

  it('submits project request successfully', async () => {
    vi.mocked(createProjectRequest).mockResolvedValueOnce('request1');
    
    render(<RequestModal {...defaultProjectProps} />);
    
    const skillSelect = screen.getByLabelText(/your relevant skills/i);
    fireEvent.change(skillSelect, {
      target: { value: ['React'] }
    });

    const messageInput = screen.getByPlaceholderText('Add a personal message...');
    fireEvent.change(messageInput, { target: { value: 'Test message' } });

    const submitButton = screen.getByText('Send Request');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(createProjectRequest).toHaveBeenCalledWith(
        'user1',
        'user2',
        'project1',
        'Test Project',
        'position1',
        'Developer',
        'application',
        ['React', 'TypeScript'],
        ['React'],
        'Test message',
        undefined
      );
      expect(mockClose).toHaveBeenCalled();
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({
        type: 'success'
      }));
    });
  });

  it('handles request creation error', async () => {
    const errorMessage = 'Test error';
    vi.mocked(createTradeRequest).mockRejectedValueOnce(new Error(errorMessage));
    
    render(<RequestModal {...defaultTradeProps} />);
    
    const submitButton = screen.getByText('Send Request');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({
        type: 'error',
        message: errorMessage
      }));
      expect(mockClose).not.toHaveBeenCalled();
    });
  });

  it('disables form while submitting', async () => {
    vi.mocked(createTradeRequest).mockImplementationOnce(() => new Promise(() => {}));
    
    render(<RequestModal {...defaultTradeProps} />);
    
    const submitButton = screen.getByText('Send Request');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Sending...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
      expect(screen.getByPlaceholderText('Add a personal message...')).toBeDisabled();
    });
  });
});
