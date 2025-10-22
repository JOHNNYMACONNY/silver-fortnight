/**
 * Generic service response type for all service functions
 */
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Notification type for the notification system
 */
export interface Notification {
  id?: string;
  recipientId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  read?: boolean;
  createdAt: any; // Timestamp
}

/**
 * Create notification parameters
 */
export interface CreateNotificationParams {
  recipientId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority?: 'low' | 'medium' | 'high';
  deduplicationKey?: string;
  createdAt: any; // Timestamp
}
