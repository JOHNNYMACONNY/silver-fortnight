// src/types/portfolio.ts

export interface EmbeddedEvidence {
  id: string;
  url: string;
  type: string;
  thumbnailUrl?: string;
  title?: string;
  description?: string;
}

export interface PortfolioItem {
  id: string;
  userId: string;
  sourceId: string;
  sourceType: 'trade' | 'collaboration' | 'challenge';
  title: string;
  description: string;
  skills: string[];
  role?: string;
  completedAt: any;
  visible: boolean;
  featured: boolean;
  pinned: boolean;
  category?: string;
  customOrder?: number;
  evidence?: EmbeddedEvidence[];
  collaborators?: {
    id: string;
    name: string;
    photoURL?: string;
    role?: string;
  }[];
}
