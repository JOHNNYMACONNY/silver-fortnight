import { 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  collection, 
  addDoc, 
  Timestamp,
  query,
  where,
  writeBatch,
  orderBy,
  arrayUnion,
  limit as limitQuery,
  deleteDoc,
  updateDoc,
  startAfter,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  QueryConstraint,
  arrayRemove,
  DocumentData,
  Query,
  CollectionReference,
   Firestore,
   FirestoreDataConverter
} from 'firebase/firestore';
import { getSyncFirebaseDb } from '../../firebase-config';
import { ServiceResult } from '../../types/ServiceError';
import { errorService } from '../errorService';
import { AppError, ErrorCode, ErrorSeverity } from '../../types/errors';

/**
 * Base service class providing common Firestore operations
 * All service classes should extend this to get consistent error handling and logging
 */
export abstract class BaseService<T> {
  protected db: Firestore;
  protected collectionName: string;
  protected converter?: FirestoreDataConverter<T, DocumentData, DocumentData>;

  constructor(collectionName: string, converter?: FirestoreDataConverter<T, DocumentData, DocumentData>) {
    this.db = getSyncFirebaseDb();
    this.collectionName = collectionName;
    this.converter = converter;
  }

  /**
   * Remove undefined values from an object recursively. Keeps nulls intact so callers
   * can explicitly clear fields by setting them to null. Arrays are preserved as-is.
   */
  protected sanitizeData<D extends Record<string, any>>(data: D): D {
    const sanitize = (value: any): any => {
      if (value === undefined) return undefined;
      if (value === null) return null;
      if (Array.isArray(value)) return value;
      if (typeof value === 'object') {
        const result: Record<string, any> = {};
        for (const [key, val] of Object.entries(value)) {
          const sanitized = sanitize(val);
          if (sanitized !== undefined) {
            result[key] = sanitized;
          }
        }
        return result as any;
      }
      return value;
    };

    const sanitizedRoot = sanitize(data);
    return (sanitizedRoot ?? {}) as D;
  }

  /**
   * Get collection reference with optional converter
   */
  protected getCollection(): CollectionReference<T> {
    const collectionRef = collection(this.db, this.collectionName);
    return this.converter ? (collectionRef.withConverter(this.converter) as unknown as CollectionReference<T>) : (collectionRef as CollectionReference<T>);
  }

  /**
   * Get document reference with optional converter
   */
  protected getDocRef(id: string) {
    const docRef = doc(this.db, this.collectionName, id);
    return this.converter ? docRef.withConverter(this.converter) : docRef;
  }

  /**
   * Generic create operation
   */
  protected async create(data: Partial<T>, id?: string): Promise<ServiceResult<T>> {
    try {
      const cleanData = this.sanitizeData(data as Record<string, any>);
      const collectionRef = this.getCollection();
      
      if (id) {
        const docRef = this.getDocRef(id);
        await setDoc(docRef as any, cleanData as any);
        return { data: { ...cleanData, id } as T, error: null };
      } else {
        const docRef = await addDoc(collectionRef as any, cleanData as any);
        return { data: { ...cleanData, id: docRef.id } as T, error: null };
      }
    } catch (error) {
      const appError = new AppError(
        `Failed to create ${this.collectionName} document`,
        ErrorCode.DATABASE_ERROR,
        ErrorSeverity.HIGH,
        { collection: this.collectionName, data }
      );
      
      await errorService.handleError(appError);
      return { data: null, error: { code: 'create-failed', message: appError.message } };
    }
  }

  /**
   * Generic read operation
   */
  protected async read(id: string): Promise<ServiceResult<T>> {
    try {
      const docRef = this.getDocRef(id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return { 
          data: null, 
          error: { code: 'not-found', message: `${this.collectionName} document not found` } 
        };
      }
      
      return { data: docSnap.data() as T, error: null };
    } catch (error) {
      const appError = new AppError(
        `Failed to read ${this.collectionName} document`,
        ErrorCode.DATABASE_ERROR,
        ErrorSeverity.MEDIUM,
        { collection: this.collectionName, id }
      );
      
      await errorService.handleError(appError);
      return { data: null, error: { code: 'read-failed', message: appError.message } };
    }
  }

  /**
   * Generic update operation
   */
  protected async update(id: string, data: Partial<T>): Promise<ServiceResult<T>> {
    try {
      const cleanData = this.sanitizeData(data as Record<string, any>);
      const docRef = this.getDocRef(id);
      await updateDoc(docRef, cleanData as any);
      
      // Return updated document
      const updatedDoc = await this.read(id);
      return updatedDoc;
    } catch (error) {
      const appError = new AppError(
        `Failed to update ${this.collectionName} document`,
        ErrorCode.DATABASE_ERROR,
        ErrorSeverity.HIGH,
        { collection: this.collectionName, id, data }
      );
      
      await errorService.handleError(appError);
      return { data: null, error: { code: 'update-failed', message: appError.message } };
    }
  }

  /**
   * Generic delete operation
   */
  protected async delete(id: string): Promise<ServiceResult<boolean>> {
    try {
      const docRef = this.getDocRef(id);
      await deleteDoc(docRef);
      return { data: true, error: null };
    } catch (error) {
      const appError = new AppError(
        `Failed to delete ${this.collectionName} document`,
        ErrorCode.DATABASE_ERROR,
        ErrorSeverity.HIGH,
        { collection: this.collectionName, id }
      );
      
      await errorService.handleError(appError);
      return { data: null, error: { code: 'delete-failed', message: appError.message } };
    }
  }

  /**
   * Generic list operation with pagination
   */
  protected async list(
    constraints: QueryConstraint[] = [],
    pagination?: { limit?: number; startAfter?: QueryDocumentSnapshot<T, DocumentData> | DocumentSnapshot<DocumentData, DocumentData, DocumentData> }
  ): Promise<ServiceResult<{ items: T[]; hasMore: boolean; lastDoc?: QueryDocumentSnapshot<T, DocumentData> }>> {
    try {
      const collectionRef = this.getCollection();
      let queryRef: Query<T> = collectionRef;

      // Apply constraints
      if (constraints.length > 0) {
        queryRef = query(queryRef, ...constraints);
      }

      // Apply pagination
      if (pagination?.startAfter) {
        queryRef = query(queryRef, startAfter(pagination.startAfter as any));
      }

      if (pagination?.limit) {
        queryRef = query(queryRef, limitQuery(pagination.limit));
      }

      const querySnapshot = await getDocs(queryRef);
      const items = querySnapshot.docs.map(doc => doc.data());
      const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      const hasMore = querySnapshot.docs.length === (pagination?.limit || 20);

      return { 
        data: { items, hasMore, lastDoc }, 
        error: null 
      };
    } catch (error) {
      const appError = new AppError(
        `Failed to list ${this.collectionName} documents`,
        ErrorCode.DATABASE_ERROR,
        ErrorSeverity.MEDIUM,
        { collection: this.collectionName, constraints: constraints.length }
      );
      
      await errorService.handleError(appError);
      return { data: null, error: { code: 'list-failed', message: appError.message } };
    }
  }

  /**
   * Generic batch operation
   */
  protected async batchOperation(operations: Array<{
    type: 'create' | 'update' | 'delete';
    id?: string;
    data?: Partial<T>;
  }>): Promise<ServiceResult<boolean>> {
    try {
      const batch = writeBatch(this.db);

      for (const operation of operations) {
        switch (operation.type) {
          case 'create':
            if (operation.id && operation.data) {
              const docRef = this.getDocRef(operation.id);
              batch.set(docRef as any, this.sanitizeData(operation.data as Record<string, any>) as any);
            }
            break;
          case 'update':
            if (operation.id && operation.data) {
              const docRef = this.getDocRef(operation.id);
              batch.update(docRef as any, this.sanitizeData(operation.data as Record<string, any>) as any);
            }
            break;
          case 'delete':
            if (operation.id) {
              const docRef = this.getDocRef(operation.id);
              batch.delete(docRef as any);
            }
            break;
        }
      }

      await batch.commit();
      return { data: true, error: null };
    } catch (error) {
      const appError = new AppError(
        `Failed to execute batch operation on ${this.collectionName}`,
        ErrorCode.DATABASE_ERROR,
        ErrorSeverity.HIGH,
        { collection: this.collectionName, operationCount: operations.length }
      );
      
      await errorService.handleError(appError);
      return { data: null, error: { code: 'batch-failed', message: appError.message } };
    }
  }

  /**
   * Execute a query with error handling
   */
  protected async executeQuery<R>(
    queryFn: () => Promise<R>,
    context: string
  ): Promise<ServiceResult<R>> {
    try {
      const result = await queryFn();
      return { data: result, error: null };
    } catch (error) {
      const appError = new AppError(
        `Failed to execute query: ${context}`,
        ErrorCode.DATABASE_ERROR,
        ErrorSeverity.MEDIUM,
        { collection: this.collectionName, context }
      );
      
      await errorService.handleError(appError);
      return { data: null, error: { code: 'query-failed', message: appError.message } };
    }
  }

  /**
   * Validate data before operations
   */
  protected validateData(data: Partial<T>, requiredFields: string[] = []): boolean {
    for (const field of requiredFields) {
      if (!(field in data) || data[field as keyof T] === undefined || data[field as keyof T] === null) {
        throw new AppError(
          `Required field '${field}' is missing`,
          ErrorCode.VALIDATION_ERROR,
          ErrorSeverity.MEDIUM,
          { collection: this.collectionName, field, data }
        );
      }
    }
    return true;
  }

  /**
   * Add timestamp fields to data
   */
  protected addTimestamps(data: Partial<T>, isUpdate: boolean = false): Partial<T> {
    const now = Timestamp.now();
    const timestampData = { ...data } as any;
    
    if (!isUpdate) {
      timestampData.createdAt = now;
    }
    timestampData.updatedAt = now;
    
    return timestampData;
  }
}
