/**
 * Utility functions for challenge-related operations
 * Extracted from ChallengeDetailPage for better code organization
 */

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

export const getTimeRemaining = (endDate: Date): string => {
  const now = new Date();
  const timeLeft = endDate.getTime() - now.getTime();
  
  if (timeLeft <= 0) return 'Challenge ended';
  
  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  return `${days}d ${hours}h left`;
};

export const getDifficultyVariant = (difficulty: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (difficulty.toLowerCase()) {
    case 'easy': return 'default';
    case 'medium': return 'secondary';
    case 'hard': return 'destructive';
    case 'expert': return 'outline';
    default: return 'default';
  }
};

export const normalizeDifficulty = (difficulty: string): string => {
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
};

export const normalizeStatus = (status: string): string => {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};

export const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status.toLowerCase()) {
    case 'active': return 'default';
    case 'upcoming': return 'secondary';
    case 'completed': return 'outline';
    case 'cancelled': return 'destructive';
    default: return 'default';
  }
};
