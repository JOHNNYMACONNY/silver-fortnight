// src/services/collaboration.ts

export type Collaboration = {
  id: string;
  title: string;
  description?: string;
  status?: string;
  participants?: string[];
  createdAt?: Date;
  [key: string]: any;
};

export type ServiceResponse<T> = {
  success: boolean;
  data: T | null;
  error?: string | null;
};

export async function getCollaborations(userId?: string): Promise<ServiceResponse<Collaboration[]>> {
  // Minimal stub implementation; tests will mock this.
  return Promise.resolve({
    success: true,
    data: [],
    error: null,
  });
}

export async function createCollaboration(payload: Partial<Collaboration>): Promise<ServiceResponse<Collaboration>> {
  // Minimal stub implementation; tests will mock this.
  return Promise.resolve({
    success: true,
    data: { id: 'mock-collab-id', ...payload } as Collaboration,
    error: null,
  });
}

export async function updateCollaborationStatus(collabId: string, status: string): Promise<ServiceResponse<Collaboration>> {
  // Minimal stub implementation; tests will mock this.
  return Promise.resolve({
    success: true,
    data: { id: collabId, status } as Collaboration,
    error: null,
  });
}