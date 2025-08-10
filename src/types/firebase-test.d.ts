declare module '@firebase/rules-unit-testing' {
  import type { Firestore } from '@firebase/firestore';
  import type { FirebaseStorage } from '@firebase/storage';

  export interface RulesTestContext {
    firestore(): Firestore;
    storage(): FirebaseStorage;
  }

  export interface RulesTestEnvironment {
    authenticatedContext(uid: string, customClaims?: Record<string, any>): RulesTestContext;
    unauthenticatedContext(): RulesTestContext;
    withSecurityRulesDisabled(): RulesTestContext;
    clearFirestore(): Promise<void>;
    clearStorage(): Promise<void>;
    cleanup(): Promise<void>;
  }

  export interface InitializeTestEnvironmentOptions {
    projectId: string;
    firestore?: {
      rules?: string;
      host?: string;
      port?: number;
    };
    storage?: {
      rules?: string;
      host?: string;
      port?: number;
    };
  }

  export function initializeTestEnvironment(
    options: InitializeTestEnvironmentOptions
  ): Promise<RulesTestEnvironment>;

  export function assertSucceeds<T>(promise: Promise<T>): Promise<T>;
  export function assertFails<T>(promise: Promise<T>): Promise<void>;
}

declare module '@firebase/firestore' {
  import type { FirebaseApp } from '@firebase/app';

  export interface DocumentData {
    [field: string]: any;
  }

  export interface DocumentReference<T = DocumentData> {
    id: string;
    path: string;
    parent: CollectionReference<T>;
    firestore: Firestore;
    type: 'document';
    converter: null | FirestoreDataConverter<T>;
    get(): Promise<DocumentSnapshot<T>>;
    set(data: T): Promise<void>;
    update(data: Partial<T>): Promise<void>;
    delete(): Promise<void>;
  }

  export interface CollectionReference<T = DocumentData> {
    id: string;
    path: string;
    parent: DocumentReference | null;
    type: 'collection';
    firestore: Firestore;
    doc(documentPath?: string): DocumentReference<T>;
    add(data: T): Promise<DocumentReference<T>>;
  }

  export interface Firestore {
    type: 'firestore';
    app: FirebaseApp;
    collection(collectionPath: string): CollectionReference;
    doc(documentPath: string): DocumentReference;
  }

  export interface DocumentSnapshot<T = DocumentData> {
    id: string;
    ref: DocumentReference<T>;
    exists: boolean;
    data(): T | undefined;
  }

  export interface FirestoreDataConverter<T> {
    toFirestore(modelObject: T): DocumentData;
    fromFirestore(snapshot: DocumentSnapshot<DocumentData>): T;
  }
}

declare module '@firebase/storage' {
  import type { FirebaseApp } from '@firebase/app';

  export interface StorageReference {
    root: StorageReference;
    bucket: string;
    fullPath: string;
    name: string;
    parent: StorageReference | null;
    storage: FirebaseStorage;
    toString(): string;
  }

  export interface FirebaseStorage {
    app: FirebaseApp;
    maxOperationRetryTime: number;
    maxUploadRetryTime: number;
    ref(path?: string): StorageReference;
    refFromURL(url: string): StorageReference;
    setMaxOperationRetryTime(time: number): void;
    setMaxUploadRetryTime(time: number): void;
  }

  export interface UploadMetadata {
    contentType?: string;
    customMetadata?: { [key: string]: string };
  }
}

declare module '@firebase/app' {
  export interface FirebaseApp {
    name: string;
    options: {
      projectId: string;
      [key: string]: any;
    };
  }
}

// Extend Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeAllowed(): Promise<R>;
      toBeDenied(): Promise<R>;
    }
  }
}

export {};
