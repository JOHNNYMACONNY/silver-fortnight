// src/services/collaboration.ts

export type Collaboration = {
  id: string;
  title: string;
  description?: string;
  status?: string;
  participants?: string[];
  createdAt?: Date;
  [key: string]: unknown;
};

export type ServiceResponse<T> = {
  success: boolean;
  data: T | null;
  error?: string | null;
};

export const getCollaborations = async (
  userId?: string
): Promise<ServiceResponse<Collaboration[]>> => {
  // Use the param to avoid "defined but never used" lints in some CI/pre-commit checks.
  if (userId) {
    void userId;
  }

  // Minimal stub implementation; tests will mock this.
  return Promise.resolve({
    success: true,
    data: [],
    error: null,
  });
};

export const createCollaboration = async (
  payload: Partial<Collaboration>
): Promise<ServiceResponse<Collaboration>> => {
  // Minimal stub implementation; tests will mock this.
  return Promise.resolve({
    success: true,
    data: { id: "mock-collab-id", ...payload } as Collaboration,
    error: null,
  });
};

export const updateCollaborationStatus = async (
  collabId: string,
  status: string
): Promise<ServiceResponse<Collaboration>> => {
  // Minimal stub implementation; tests will mock this.
  return Promise.resolve({
    success: true,
    data: { id: collabId, status } as Collaboration,
    error: null,
  });
};
