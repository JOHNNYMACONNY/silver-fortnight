// src/utils/dateFormatters.ts

/**
 * Format date with full timestamp tooltip
 */
export function formatDateWithTooltip(date: any): { display: string; tooltip: string } {
  if (!date) {
    return { display: 'Unknown date', tooltip: '' };
  }
  
  try {
    const d = date.toDate ? date.toDate() : new Date(date);
    
    if (isNaN(d.getTime())) {
      return { display: 'Invalid date', tooltip: '' };
    }
    
    // Display format: relative for recent, full for old
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - d.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let display: string;
    if (diffDays < 7) {
      if (diffDays === 0) display = 'Today';
      else if (diffDays === 1) display = 'Yesterday';
      else display = `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      display = `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      display = `${months} ${months === 1 ? 'month' : 'months'} ago`;
    } else {
      display = d.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
    
    // Tooltip: full date and time
    const tooltip = d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
    
    return { display, tooltip };
  } catch (error) {
    return { display: 'Unknown date', tooltip: '' };
  }
}

