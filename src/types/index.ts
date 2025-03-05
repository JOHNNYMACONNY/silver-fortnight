import { Timestamp } from 'firebase/firestore';

export type TradeStatus = 'open' | 'reserved' | 'in_progress' | 'completed' | 'cancelled';

export interface Trade {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  offeredSkills: string[];
  requestedSkills: string[];
  status: TradeStatus;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  preferredUserId?: string; // Optional field for invited user
  publiclyAvailable: boolean; // Controls if others can request when reserved
  reservedUntil?: Date | Timestamp; // Optional expiration for reservation
}

export * from './requests';
export * from './messaging';
export * from './challenge';
