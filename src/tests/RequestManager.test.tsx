import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import RequestManager from '../components/RequestManager';
import { getUserRequests, updateRequestStatus, markRequestViewed } from '../lib/requests';
import toast from '../utils/toast';
import { Timestamp } from 'firebase/firestore';

// Mock dependencies
vi.mock('../lib/requests');
vi.mock('../utils/toast');

describe('RequestManager', () => {
  const mockRequests = {
    received: [
      {
        id: 'request1',
        senderId: 'user2',
        recipientId: 'user1',
        status: 'pending',
        type: 'invitation',
        createdAt: Timestamp.fromDate(new Date()),
        tradeName: 'Test Trade',
        tradeId: 'trade1',
        message: 'Test message'
      }
    ],
    sent: [
      {
        id: 'request2',
        senderId: 'user1',
        recipientId: 'user2',
        status: 'accepted',
        type: 'application',
        createdAt: Timestamp.fromDate(new Date()),
        projectName: 'Test Project',
        projectId: 'project1',
        positionName: 'Developer',
        positionId: 'pos1',
        message: 'Test application'
      }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getUserRequests).mockResolvedValue(mockRequests);
  });

  it('renders loading state initially', () => {
    render(<RequestManager currentUserId="user1" mode="trade" />);
    expect(screen.getByText('Loading requests...')).toBeInTheDocument();
  });

  it('loads and displays requests', async () => {
    render(<RequestManager currentUserId="user1" mode="trade" />);

    await waitFor(() => {
      expect(screen.getByText('Test Trade')).toBeInTheDocument();
      expect(screen.getByText(/Invitation/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Sent (1)'));

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
      expect(screen.getByText('Accepted')).toBeInTheDocument();
    });
  });

  it('handles request acceptance', async () => {
    vi.mocked(updateRequestStatus).mockResolvedValueOnce();
    
    render(<RequestManager currentUserId="user1" mode="trade" />);

    await waitFor(() => {
      expect(screen.getByText('Accept')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Accept'));

    await waitFor(() => {
      expect(updateRequestStatus).toHaveBeenCalledWith(
        'request1',
        'tradeRequests',
        'accepted',
        'user1'
      );
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({
        type: 'success'
      }));
    });
  });

  it('handles request decline', async () => {
    vi.mocked(updateRequestStatus).mockResolvedValueOnce();
    
    render(<RequestManager currentUserId="user1" mode="trade" />);

    await waitFor(() => {
      expect(screen.getByText('Decline')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Decline'));

    await waitFor(() => {
      expect(updateRequestStatus).toHaveBeenCalledWith(
        'request1',
        'tradeRequests',
        'declined',
        'user1'
      );
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({
        type: 'info'
      }));
    });
  });

  it('marks received requests as viewed', async () => {
    render(<RequestManager currentUserId="user1" mode="trade" />);

    await waitFor(() => {
      expect(markRequestViewed).toHaveBeenCalledWith(
        'request1',
        'tradeRequests'
      );
    });
  });

  it('handles loading error', async () => {
    const errorMessage = 'Failed to load requests';
    vi.mocked(getUserRequests).mockRejectedValueOnce(new Error(errorMessage));

    render(<RequestManager currentUserId="user1" mode="trade" />);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({
        type: 'error',
        message: errorMessage
      }));
    });

    // Test retry functionality
    vi.mocked(getUserRequests).mockResolvedValueOnce(mockRequests);
    fireEvent.click(screen.getByText('Try again'));

    await waitFor(() => {
      expect(screen.getByText('Test Trade')).toBeInTheDocument();
    });
  });

  it('displays empty state when no requests', async () => {
    vi.mocked(getUserRequests).mockResolvedValueOnce({
      received: [],
      sent: []
    });

    render(<RequestManager currentUserId="user1" mode="trade" />);

    await waitFor(() => {
      expect(screen.getByText('No received requests found')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Sent (0)'));

    expect(screen.getByText('No sent requests found')).toBeInTheDocument();
  });

  it('handles status update error', async () => {
    const errorMessage = 'Failed to update status';
    vi.mocked(updateRequestStatus).mockRejectedValueOnce(new Error(errorMessage));

    render(<RequestManager currentUserId="user1" mode="trade" />);

    await waitFor(() => {
      expect(screen.getByText('Accept')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Accept'));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({
        type: 'error',
        message: errorMessage
      }));
    });
  });

  it('disables buttons while updating status', async () => {
    vi.mocked(updateRequestStatus).mockImplementationOnce(() => new Promise(() => {}));

    render(<RequestManager currentUserId="user1" mode="trade" />);

    await waitFor(() => {
      expect(screen.getByText('Accept')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Accept'));

    await waitFor(() => {
      expect(screen.getByText('Accept')).toBeDisabled();
      expect(screen.getByText('Decline')).toBeDisabled();
    });
  });

  it('switches between trade and project modes', async () => {
    const { rerender } = render(<RequestManager currentUserId="user1" mode="trade" />);

    await waitFor(() => {
      expect(getUserRequests).toHaveBeenCalledWith('user1', 'tradeRequests');
    });

    rerender(<RequestManager currentUserId="user1" mode="project" />);

    await waitFor(() => {
      expect(getUserRequests).toHaveBeenCalledWith('user1', 'projectRequests');
    });
  });

  describe('Migrated Requests', () => {
    const mockMigratedRequests = {
      received: [
        {
          id: 'request3',
          senderId: 'user2',
          recipientId: 'user1',
          status: 'pending',
          type: 'invitation',
          createdAt: Timestamp.fromDate(new Date()),
          tradeName: 'Migrated Trade',
          tradeId: 'trade3',
          message: 'Migration: Original trade invitation from Trade Owner',
          notificationSent: true
        },
        {
          id: 'request4',
          senderId: 'user3',
          recipientId: 'user1',
          status: 'pending',
          type: 'application',
          createdAt: Timestamp.fromDate(new Date()),
          projectName: 'Migrated Project',
          projectId: 'project2',
          positionName: 'Designer',
          positionId: 'pos2',
          requiredSkills: ['Figma'],
          message: 'Migration: Original position application',
          notificationSent: true
        }
      ],
      sent: []
    };

    it('displays migrated trade requests correctly', async () => {
      vi.mocked(getUserRequests).mockResolvedValueOnce({
        ...mockRequests,
        received: [...mockRequests.received, mockMigratedRequests.received[0]]
      });

      render(<RequestManager currentUserId="user1" mode="trade" />);

      await waitFor(() => {
        expect(screen.getByText('Migrated Trade')).toBeInTheDocument();
        expect(screen.getByText(/Migration: Original trade invitation/)).toBeInTheDocument();
      });
    });

    it('displays migrated project requests correctly', async () => {
      vi.mocked(getUserRequests).mockResolvedValueOnce({
        ...mockRequests,
        received: [...mockRequests.received, mockMigratedRequests.received[1]]
      });

      render(<RequestManager currentUserId="user1" mode="project" />);

      await waitFor(() => {
        expect(screen.getByText('Migrated Project')).toBeInTheDocument();
        expect(screen.getByText('Designer')).toBeInTheDocument();
        expect(screen.getByText(/Migration: Original position application/)).toBeInTheDocument();
        expect(screen.getByText('Figma')).toBeInTheDocument();
      });
    });

    it('handles migrated request status updates correctly', async () => {
      vi.mocked(getUserRequests).mockResolvedValueOnce({
        ...mockRequests,
        received: [mockMigratedRequests.received[0]]
      });
      vi.mocked(updateRequestStatus).mockResolvedValueOnce();

      render(<RequestManager currentUserId="user1" mode="trade" />);

      await waitFor(() => {
        expect(screen.getByText('Migrated Trade')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Accept'));

      await waitFor(() => {
        expect(updateRequestStatus).toHaveBeenCalledWith(
          'request3',
          'tradeRequests',
          'accepted',
          'user1'
        );
        expect(toast).toHaveBeenCalledWith(expect.objectContaining({
          type: 'success',
          message: 'The request has been successfully accepted'
        }));
      });
    });
  });
});
