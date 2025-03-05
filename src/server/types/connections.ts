import { ObjectId } from 'mongodb';

export interface Connection {
  _id: ObjectId;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
  updatedAt: Date;
}

export interface PendingConnection {
  userId: string;
  connectionId: ObjectId;
  createdAt: Date;
}