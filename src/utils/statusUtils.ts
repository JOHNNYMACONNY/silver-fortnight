/**
 * Get CSS classes for a trade status badge
 *
 * @param status Trade status ('open', 'in-progress', 'pending_confirmation', 'completed', 'cancelled', 'disputed')
 * @returns CSS classes for the badge
 */
export const getTradeStatusClasses = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'open':
      return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
    case 'active': // For backward compatibility
      return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
    case 'in-progress':
      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
    case 'pending_evidence':
      return 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary';
    case 'pending_confirmation':
      return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300';
    case 'completed':
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
    case 'cancelled':
      return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
    case 'disputed':
      return 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary';
    default:
      return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
  }
};

/**
 * Format a status string for display
 *
 * @param status Status string
 * @returns Formatted status string
 */
export const formatStatus = (status: string): string => {
  if (!status) return 'Unknown';

  switch (status?.toLowerCase()) {
    case 'open':
      return 'Open';
    case 'active': // For backward compatibility
      return 'Active';
    case 'in-progress':
      return 'In Progress';
    case 'pending_evidence':
      return 'Evidence Pending';
    case 'pending_confirmation':
      return 'Pending Confirmation';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    case 'disputed':
      return 'Disputed';
    default:
      // Capitalize first letter
      return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  }
};
