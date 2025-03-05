import { Timestamp } from 'firebase/firestore';

export interface TradeRequest {
  id: string;
  tradeId: string;
  requesterId: string;
  traderId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  message?: string;
  offeredSkills: string[];
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  responseMessage?: string;
}

export interface CollaborationRequest {
  id: string;
  projectId: string;
  roleId: string;
  applicantId: string;
  status: 'pending' | 'accepted' | 'rejected';
  message: string;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}
