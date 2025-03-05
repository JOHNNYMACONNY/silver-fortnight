import { Timestamp } from 'firebase/firestore';

export function formatDate(date: Date | Timestamp): string {
  if (date instanceof Timestamp) {
    date = date.toDate();
  }
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function formatDateTime(date: Date | Timestamp): string {
  if (date instanceof Timestamp) {
    date = date.toDate();
  }
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

export function getRelativeTime(date: Date | Timestamp): string {
  if (date instanceof Timestamp) {
    date = date.toDate();
  }
  
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 30) {
    return formatDate(date);
  } else if (days > 0) {
    return `${days}d ago`;
  } else if (hours > 0) {
    return `${hours}h ago`;
  } else if (minutes > 0) {
    return `${minutes}m ago`;
  } else {
    return 'just now';
  }
}

export function isToday(date: Date | Timestamp): boolean {
  if (date instanceof Timestamp) {
    date = date.toDate();
  }
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

export function addDays(date: Date | Timestamp, days: number): Date {
  const result = date instanceof Timestamp ? date.toDate() : new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
