import { Timestamp } from 'firebase/firestore';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  points: number;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export interface UserChallenge {
  userId: string;
  challengeId: string;
  status: 'in_progress' | 'completed';
  startedAt: Date | Timestamp;
  completedAt?: Date | Timestamp;
}
