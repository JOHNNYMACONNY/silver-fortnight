import {
  DocumentData,
  QueryDocumentSnapshot,
  SnapshotOptions,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';

import {
  User,
  Trade,
  Collaboration,
  Notification,
  Review,
  TradeProposal,
  CollaborationApplication,
  Challenge,
  Connection,
} from './firestore';

// Define a type alias for your message types
export type MessageType = 'system' | 'text' | 'image' | 'file';

export const userConverter = {
  toFirestore: (user: User): DocumentData => {
    const { id, ...data } = user as any;
    return { ...data, createdAt: (user as any).createdAt || serverTimestamp() };
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot, options: SnapshotOptions): User => {
    const data = snapshot.data(options) as DocumentData;
    return { id: snapshot.id, ...data, createdAt: (data as any).createdAt } as User;
  },
};

export const tradeConverter = {
  toFirestore: (trade: Trade): DocumentData => {
    const { id, ...data } = trade as any;
    return { ...data, createdAt: (trade as any).createdAt || serverTimestamp(), updatedAt: serverTimestamp() };
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot, options: SnapshotOptions): Trade => {
    const data = snapshot.data(options) as DocumentData;
    return { id: snapshot.id, ...data } as Trade;
  },
};

export const collaborationConverter = {
  toFirestore: (collaboration: Collaboration): DocumentData => {
    const { id, ...data } = collaboration as any;
    return { ...data, createdAt: (collaboration as any).createdAt || serverTimestamp(), updatedAt: serverTimestamp() };
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot, options: SnapshotOptions): Collaboration => {
    const data = snapshot.data(options) as DocumentData;
    return { id: snapshot.id, ...data } as Collaboration;
  },
};

export const notificationConverter = {
  toFirestore: (notification: Notification): DocumentData => {
    const { id, ...data } = notification;
    return {
      ...data,
      createdAt: serverTimestamp(),
    };
  },
  fromFirestore: (
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): Notification => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      ...data,
    } as Notification;
  },
};

export const reviewConverter = {
  toFirestore: (review: Review): DocumentData => {
    const { id, ...data } = review;
    return {
      ...data,
      createdAt: serverTimestamp(),
    };
  },
  fromFirestore: (
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): Review => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      ...data,
    } as Review;
  },
};

export const tradeProposalConverter = {
  toFirestore: (proposal: TradeProposal): DocumentData => {
    const { id, ...data } = proposal;
    return {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
  },
  fromFirestore: (
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): TradeProposal => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      ...data,
    } as TradeProposal;
  },
};

export const collaborationApplicationConverter = {
  toFirestore: (application: CollaborationApplication): DocumentData => {
    const { id, ...data } = application;
    return {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
  },
  fromFirestore: (
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): CollaborationApplication => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      ...data,
    } as CollaborationApplication;
  },
};

export const challengeConverter = {
  toFirestore: (challenge: Challenge): DocumentData => {
    const { id, ...data } = challenge;
    return {
      ...data,
      createdAt: challenge.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
  },
  fromFirestore: (
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): Challenge => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      ...data,
    } as Challenge;
  },
};

export const connectionConverter = {
  toFirestore: (connection: Connection): DocumentData => {
    const { id, ...data } = connection;
    return {
      ...data,
      createdAt: connection.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
  },
  fromFirestore: (
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): Connection => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      ...data,
    } as Connection;
  },
}; 