export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'weekly' | 'monthly';
  status: 'pending' | 'live' | 'completed';
  requirements: {
    type: 'trades' | 'collaborations' | 'endorsements' | 'skills';
    count: number;
    skillCategory?: string;
  }[];
  rewards: {
    xp: number;
    badge?: string;
  };
  startDate: Date | null;
  endDate: Date | null;
  participants: string[];
  completions: string[];
  createdAt: Date;
  updatedAt: Date;
}