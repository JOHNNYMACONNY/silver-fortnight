/**
 * Data Streaming Service for Large Datasets
 * 
 * Provides efficient streaming of large datasets with:
 * - Chunked data delivery
 * - Real-time filtering and sorting
 * - Memory management
 * - Connection management
 * - Error handling and retry logic
 */

import { EventEmitter } from 'events';
import { getSyncFirebaseDb } from '../../firebase-config';
import { collection, query, orderBy, limit, startAfter, where, getDocs, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

export interface StreamingConfig {
  /** Maximum number of items per chunk */
  chunkSize: number;
  /** Maximum number of chunks to keep in memory */
  maxChunks: number;
  /** Timeout for streaming operations (ms) */
  timeout: number;
  /** Whether to enable compression */
  enableCompression: boolean;
  /** Whether to enable caching */
  enableCaching: boolean;
  /** Cache TTL in milliseconds */
  cacheTTL: number;
}

export interface StreamFilter {
  field: string;
  operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'in' | 'not-in' | 'array-contains' | 'array-contains-any';
  value: any;
}

export interface StreamSort {
  field: string;
  direction: 'asc' | 'desc';
}

export interface StreamQuery {
  collection: string;
  filters?: StreamFilter[];
  sort?: StreamSort[];
  limit?: number;
}

export interface StreamChunk<T> {
  id: string;
  data: T[];
  hasMore: boolean;
  totalCount?: number;
  timestamp: number;
  chunkIndex: number;
}

export interface StreamMetrics {
  totalItems: number;
  loadedItems: number;
  memoryUsage: number;
  networkRequests: number;
  errorCount: number;
  lastUpdate: number;
}

export interface StreamError {
  code: string;
  message: string;
  timestamp: number;
  retryable: boolean;
}

export class DataStreamingService<T> extends EventEmitter {
  private config: StreamingConfig;
  private chunks: Map<string, StreamChunk<T>> = new Map();
  private lastDoc: QueryDocumentSnapshot<DocumentData> | null = null;
  private isStreaming: boolean = false;
  private metrics: StreamMetrics = {
    totalItems: 0,
    loadedItems: 0,
    memoryUsage: 0,
    networkRequests: 0,
    errorCount: 0,
    lastUpdate: Date.now(),
  };
  private retryCount: number = 0;
  private maxRetries: number = 3;
  private retryDelay: number = 1000;

  constructor(config: Partial<StreamingConfig> = {}) {
    super();
    this.config = {
      chunkSize: 50,
      maxChunks: 10,
      timeout: 30000,
      enableCompression: true,
      enableCaching: true,
      cacheTTL: 300000, // 5 minutes
      ...config,
    };
  }

  /**
   * Start streaming data from a Firestore collection
   */
  async startStream(queryConfig: StreamQuery): Promise<void> {
    if (this.isStreaming) {
      throw new Error('Stream is already active');
    }

    this.isStreaming = true;
    this.lastDoc = null;
    this.chunks.clear();
    this.metrics = {
      totalItems: 0,
      loadedItems: 0,
      memoryUsage: 0,
      networkRequests: 0,
      errorCount: 0,
      lastUpdate: Date.now(),
    };

    try {
      await this.loadNextChunk(queryConfig);
      this.emit('started', { query: queryConfig, metrics: this.metrics });
    } catch (error) {
      this.handleError(error as Error);
      throw error;
    }
  }

  /**
   * Load the next chunk of data
   */
  async loadNextChunk(queryConfig: StreamQuery): Promise<StreamChunk<T>> {
    if (!this.isStreaming) {
      throw new Error('Stream is not active');
    }

    const startTime = performance.now();
    this.metrics.networkRequests++;

    try {
    // Build Firestore query
    const db = getSyncFirebaseDb();
    const q = this.buildQuery(queryConfig, db);
      
      // Execute query
      const snapshot = await getDocs(q);
      const docs = snapshot.docs;
      
      // Process documents
      const data = docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any),
      })) as T[];

      // Create chunk
      const chunk: StreamChunk<T> = {
        id: `chunk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        data,
        hasMore: docs.length === this.config.chunkSize,
        totalCount: this.metrics.totalItems,
        timestamp: Date.now(),
        chunkIndex: this.chunks.size,
      };

      // Update last document for pagination
      if (docs.length > 0) {
        this.lastDoc = docs[docs.length - 1] as QueryDocumentSnapshot<DocumentData>;
      }

      // Store chunk
      this.chunks.set(chunk.id, chunk);

      // Update metrics
      this.metrics.loadedItems += data.length;
      this.metrics.totalItems = this.metrics.loadedItems;
      this.metrics.lastUpdate = Date.now();
      this.updateMemoryUsage();

      // Cleanup old chunks if needed
      this.cleanupOldChunks();

      // Emit chunk loaded event
      this.emit('chunkLoaded', { chunk, metrics: this.metrics });

      // Load next chunk if there are more items
      if (chunk.hasMore && this.chunks.size < this.config.maxChunks) {
        setTimeout(() => this.loadNextChunk(queryConfig), 100);
      }

      const endTime = performance.now();
      this.emit('performance', {
        operation: 'loadChunk',
        duration: endTime - startTime,
        chunkSize: data.length,
        memoryUsage: this.metrics.memoryUsage,
      });

      return chunk;
    } catch (error) {
      this.handleError(error as Error);
      throw error;
    }
  }

  /**
   * Get all loaded data
   */
  getAllData(): T[] {
    const allData: T[] = [];
    for (const chunk of this.chunks.values()) {
      allData.push(...chunk.data);
    }
    return allData;
  }

  /**
   * Get data for a specific range
   */
  getDataRange(start: number, end: number): T[] {
    const allData = this.getAllData();
    return allData.slice(start, end);
  }

  /**
   * Filter data in real-time
   */
  filterData(filterFn: (item: T) => boolean): T[] {
    return this.getAllData().filter(filterFn);
  }

  /**
   * Sort data in real-time
   */
  sortData(sortFn: (a: T, b: T) => number): T[] {
    return this.getAllData().sort(sortFn);
  }

  /**
   * Search data in real-time
   */
  searchData(searchFn: (item: T) => boolean): T[] {
    return this.getAllData().filter(searchFn);
  }

  /**
   * Get current metrics
   */
  getMetrics(): StreamMetrics {
    return { ...this.metrics };
  }

  /**
   * Stop streaming
   */
  stopStream(): void {
    this.isStreaming = false;
    this.chunks.clear();
    this.lastDoc = null;
    this.emit('stopped', { metrics: this.metrics });
  }

  /**
   * Pause streaming
   */
  pauseStream(): void {
    this.isStreaming = false;
    this.emit('paused', { metrics: this.metrics });
  }

  /**
   * Resume streaming
   */
  resumeStream(queryConfig: StreamQuery): void {
    if (this.chunks.size === 0) {
      throw new Error('No data to resume from');
    }
    
    this.isStreaming = true;
    this.emit('resumed', { metrics: this.metrics });
    
    // Continue loading if there are more items
    if (this.chunks.size < this.config.maxChunks) {
      setTimeout(() => this.loadNextChunk(queryConfig), 100);
    }
  }

  /**
   * Clear all data
   */
  clearData(): void {
    this.chunks.clear();
    this.lastDoc = null;
    this.metrics.loadedItems = 0;
    this.metrics.totalItems = 0;
    this.updateMemoryUsage();
    this.emit('cleared', { metrics: this.metrics });
  }

  /**
   * Build Firestore query
   */
  private buildQuery(queryConfig: StreamQuery, db: any) {
    let q = query(collection(db, queryConfig.collection));

    // Apply filters
    if (queryConfig.filters) {
      for (const filter of queryConfig.filters) {
        q = query(q, where(filter.field, filter.operator, filter.value));
      }
    }

    // Apply sorting
    if (queryConfig.sort) {
      for (const sort of queryConfig.sort) {
        q = query(q, orderBy(sort.field, sort.direction));
      }
    }

    // Apply pagination
    if (this.lastDoc) {
      q = query(q, startAfter(this.lastDoc));
    }

    // Apply limit
    const limitCount = queryConfig.limit || this.config.chunkSize;
    q = query(q, limit(limitCount));

    return q;
  }

  /**
   * Handle errors
   */
  private handleError(error: Error): void {
    this.metrics.errorCount++;
    this.retryCount++;

    const streamError: StreamError = {
      code: 'STREAM_ERROR',
      message: error.message,
      timestamp: Date.now(),
      retryable: this.retryCount < this.maxRetries,
    };

    this.emit('error', streamError);

    // Retry if possible
    if (streamError.retryable) {
      setTimeout(() => {
        this.retryCount = 0;
        this.emit('retry', { attempt: this.retryCount, error: streamError });
      }, this.retryDelay * this.retryCount);
    } else {
      this.stopStream();
    }
  }

  /**
   * Update memory usage metrics
   */
  private updateMemoryUsage(): void {
    let totalSize = 0;
    for (const chunk of this.chunks.values()) {
      totalSize += JSON.stringify(chunk.data).length;
    }
    this.metrics.memoryUsage = totalSize;
  }

  /**
   * Cleanup old chunks to manage memory
   */
  private cleanupOldChunks(): void {
    if (this.chunks.size <= this.config.maxChunks) return;

    // Remove oldest chunks
    const chunksArray = Array.from(this.chunks.entries());
    const chunksToRemove = chunksArray
      .sort((a, b) => a[1].timestamp - b[1].timestamp)
      .slice(0, this.chunks.size - this.config.maxChunks);

    for (const [id] of chunksToRemove) {
      this.chunks.delete(id);
    }

    this.updateMemoryUsage();
  }

  /**
   * Compress data if enabled
   */
  private compressData(data: T[]): string {
    if (!this.config.enableCompression) {
      return JSON.stringify(data);
    }

    // Simple compression - in production, use a proper compression library
    const jsonString = JSON.stringify(data);
    return btoa(jsonString);
  }

  /**
   * Decompress data if enabled
   */
  private decompressData(compressedData: string): T[] {
    if (!this.config.enableCompression) {
      return JSON.parse(compressedData);
    }

    try {
      const jsonString = atob(compressedData);
      return JSON.parse(jsonString);
    } catch (error) {
      throw new Error('Failed to decompress data');
    }
  }
}

/**
 * Create a new data streaming service instance
 */
export function createDataStreamingService<T>(config?: Partial<StreamingConfig>): DataStreamingService<T> {
  return new DataStreamingService<T>(config);
}

/**
 * Hook for using data streaming service in React components
 */
export function useDataStreaming<T>(
  queryConfig: StreamQuery,
  config?: Partial<StreamingConfig>
) {
  // Note: This hook requires React imports which are not available in this service file
  // Move this to a separate hooks file if needed
  throw new Error('useDataStreaming hook should be moved to a React hooks file');
}

export default DataStreamingService;
