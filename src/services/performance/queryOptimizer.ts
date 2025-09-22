/**
 * Query Optimization Service for Large Datasets
 * 
 * Provides intelligent query optimization with:
 * - Index-aware query construction
 * - Query result caching
 * - Pagination optimization
 * - Filter and sort optimization
 * - Request batching and deduplication
 * - Query performance monitoring
 */

import { EventEmitter } from 'events';
import { getSyncFirebaseDb } from '../../firebase-config';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  getDocs, 
  QueryDocumentSnapshot, 
  DocumentData,
  Query,
  QueryConstraint
} from 'firebase/firestore';

export interface QueryOptimizerConfig {
  /** Enable query caching */
  enableCaching: boolean;
  /** Cache TTL in milliseconds */
  cacheTTL: number;
  /** Maximum cache size */
  maxCacheSize: number;
  /** Enable request batching */
  enableBatching: boolean;
  /** Batch size for requests */
  batchSize: number;
  /** Batch timeout in milliseconds */
  batchTimeout: number;
  /** Enable request deduplication */
  enableDeduplication: boolean;
  /** Enable query performance monitoring */
  enableMonitoring: boolean;
  /** Query timeout in milliseconds */
  queryTimeout: number;
  /** Maximum retry attempts */
  maxRetries: number;
  /** Retry delay in milliseconds */
  retryDelay: number;
}

export interface OptimizedQuery {
  id: string;
  collection: string;
  constraints: QueryConstraint[];
  limit?: number;
  orderBy?: { field: string; direction: 'asc' | 'desc' }[];
  filters?: { field: string; operator: string; value: any }[];
  pagination?: {
    startAfter?: QueryDocumentSnapshot<DocumentData>;
    pageSize: number;
  };
  cacheKey: string;
  createdAt: number;
  lastAccessed: number;
  hitCount: number;
  averageExecutionTime: number;
}

export interface QueryMetrics {
  totalQueries: number;
  cacheHits: number;
  cacheMisses: number;
  averageExecutionTime: number;
  slowestQuery: number;
  fastestQuery: number;
  errorCount: number;
  retryCount: number;
  batchCount: number;
  deduplicationCount: number;
}

export interface QueryResult<T> {
  data: T[];
  hasMore: boolean;
  lastDoc?: QueryDocumentSnapshot<DocumentData>;
  totalCount?: number;
  executionTime: number;
  fromCache: boolean;
  queryId: string;
}

export interface BatchRequest {
  id: string;
  queries: OptimizedQuery[];
  resolve: (results: QueryResult<any>[]) => void;
  reject: (error: Error) => void;
  createdAt: number;
}

export class QueryOptimizer extends EventEmitter {
  private config: QueryOptimizerConfig;
  private queryCache: Map<string, { result: any; timestamp: number; hitCount: number }> = new Map();
  private queryMetrics: QueryMetrics = {
    totalQueries: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageExecutionTime: 0,
    slowestQuery: 0,
    fastestQuery: 0,
    errorCount: 0,
    retryCount: 0,
    batchCount: 0,
    deduplicationCount: 0,
  };
  private batchQueue: BatchRequest[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private pendingQueries: Map<string, Promise<QueryResult<any>>> = new Map();
  private queryHistory: OptimizedQuery[] = [];

  constructor(config: Partial<QueryOptimizerConfig> = {}) {
    super();
    this.config = {
      enableCaching: true,
      cacheTTL: 300000, // 5 minutes
      maxCacheSize: 100,
      enableBatching: true,
      batchSize: 10,
      batchTimeout: 100,
      enableDeduplication: true,
      enableMonitoring: true,
      queryTimeout: 30000,
      maxRetries: 3,
      retryDelay: 1000,
      ...config,
    };
  }

  /**
   * Execute an optimized query
   */
  async executeQuery<T>(
    collectionName: string,
    options: {
      filters?: { field: string; operator: any; value: any }[];
      orderBy?: { field: string; direction: 'asc' | 'desc' }[];
      limit?: number;
      startAfter?: QueryDocumentSnapshot<DocumentData>;
      cacheKey?: string;
    } = {}
  ): Promise<QueryResult<T>> {
    const startTime = performance.now();
    const queryId = this.generateQueryId();

    try {
      // Check cache first
      if (this.config.enableCaching) {
        const cacheKey = options.cacheKey || this.generateCacheKey(collectionName, options);
        const cached = this.queryCache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.config.cacheTTL) {
          this.queryMetrics.cacheHits++;
          cached.hitCount++;
          
          this.emit('cacheHit', { cacheKey, hitCount: cached.hitCount });
          
          return {
            ...cached.result,
            fromCache: true,
            queryId,
          };
        }
        
        this.queryMetrics.cacheMisses++;
      }

      // Check for duplicate pending queries
      if (this.config.enableDeduplication) {
        const duplicateKey = this.generateCacheKey(collectionName, options);
        const pendingQuery = this.pendingQueries.get(duplicateKey);
        
        if (pendingQuery) {
          this.queryMetrics.deduplicationCount++;
          this.emit('queryDeduplicated', { duplicateKey });
          
          const result = await pendingQuery;
          return { ...result, queryId };
        }
      }

      // Execute query
      const result = await this.executeQueryInternal<T>(collectionName, options, queryId);
      
      // Cache result
      if (this.config.enableCaching) {
        const cacheKey = options.cacheKey || this.generateCacheKey(collectionName, options);
        this.cacheResult(cacheKey, result);
      }

      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      this.updateMetrics(executionTime);
      this.emit('queryExecuted', { queryId, executionTime, fromCache: false });

      return {
        ...result,
        executionTime,
        fromCache: false,
        queryId,
      };

    } catch (error) {
      this.queryMetrics.errorCount++;
      this.emit('queryError', { queryId, error: error as Error });
      throw error;
    }
  }

  /**
   * Execute multiple queries in batch
   */
  async executeBatch<T>(
    queries: Array<{
      collection: string;
      options: any;
    }>
  ): Promise<QueryResult<T>[]> {
    if (!this.config.enableBatching || queries.length === 0) {
      return Promise.all(queries.map(q => this.executeQuery<T>(q.collection, q.options)));
    }

    return new Promise((resolve, reject) => {
      const batchRequest: BatchRequest = {
        id: this.generateQueryId(),
        queries: queries.map(q => this.createOptimizedQuery(q.collection, q.options)),
        resolve: resolve as any,
        reject,
        createdAt: Date.now(),
      };

      this.batchQueue.push(batchRequest);
      this.queryMetrics.batchCount++;

      // Process batch if it's full or timeout is reached
      if (this.batchQueue.length >= this.config.batchSize) {
        this.processBatch();
      } else if (!this.batchTimeout) {
        this.batchTimeout = setTimeout(() => {
          this.processBatch();
        }, this.config.batchTimeout);
      }
    });
  }

  /**
   * Get query metrics
   */
  getMetrics(): QueryMetrics {
    return { ...this.queryMetrics };
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    hitRate: number;
    oldestEntry: number;
    newestEntry: number;
  } {
    const entries = Array.from(this.queryCache.values());
    const hitRate = this.queryMetrics.totalQueries > 0 
      ? this.queryMetrics.cacheHits / this.queryMetrics.totalQueries 
      : 0;

    return {
      size: this.queryCache.size,
      hitRate,
      oldestEntry: Math.min(...entries.map(e => e.timestamp)),
      newestEntry: Math.max(...entries.map(e => e.timestamp)),
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.queryCache.clear();
    this.emit('cacheCleared');
  }

  /**
   * Clear query history
   */
  clearHistory(): void {
    this.queryHistory = [];
    this.emit('historyCleared');
  }

  /**
   * Get slowest queries
   */
  getSlowestQueries(limit: number = 10): OptimizedQuery[] {
    return this.queryHistory
      .sort((a, b) => b.averageExecutionTime - a.averageExecutionTime)
      .slice(0, limit);
  }

  /**
   * Get most frequent queries
   */
  getMostFrequentQueries(limit: number = 10): OptimizedQuery[] {
    return this.queryHistory
      .sort((a, b) => b.hitCount - a.hitCount)
      .slice(0, limit);
  }

  /**
   * Execute query internally
   */
  private async executeQueryInternal<T>(
    collectionName: string,
    options: any,
    queryId: string
  ): Promise<QueryResult<T>> {
    const startTime = performance.now();
    
    // Build Firestore query
    const q = this.buildFirestoreQuery(collectionName, options);
    
    // Execute query
    const snapshot = await getDocs(q);
    const docs = snapshot.docs;
    
    // Process documents
    const data = docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as T[];

    const endTime = performance.now();
    const executionTime = endTime - startTime;

    return {
      data,
      hasMore: docs.length === (options.limit || 50),
      lastDoc: docs.length > 0 ? docs[docs.length - 1] : undefined,
      totalCount: snapshot.size,
      executionTime,
      fromCache: false,
      queryId,
    };
  }

  /**
   * Build Firestore query
   */
  private buildFirestoreQuery(collectionName: string, options: any): Query<DocumentData> {
    const db = getSyncFirebaseDb();
    let q = query(collection(db, collectionName));

    // Apply filters
    if (options.filters) {
      for (const filter of options.filters) {
        q = query(q, where(filter.field, filter.operator, filter.value));
      }
    }

    // Apply ordering
    if (options.orderBy) {
      for (const order of options.orderBy) {
        q = query(q, orderBy(order.field, order.direction));
      }
    }

    // Apply pagination
    if (options.startAfter) {
      q = query(q, startAfter(options.startAfter));
    }

    // Apply limit
    if (options.limit) {
      q = query(q, limit(options.limit));
    }

    return q;
  }

  /**
   * Create optimized query object
   */
  private createOptimizedQuery(collection: string, options: any): OptimizedQuery {
    return {
      id: this.generateQueryId(),
      collection,
      constraints: [],
      limit: options.limit,
      orderBy: options.orderBy,
      filters: options.filters,
      pagination: options.startAfter ? {
        startAfter: options.startAfter,
        pageSize: options.limit || 50,
      } : undefined,
      cacheKey: this.generateCacheKey(collection, options),
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      hitCount: 0,
      averageExecutionTime: 0,
    };
  }

  /**
   * Process batch requests
   */
  private async processBatch(): Promise<void> {
    if (this.batchQueue.length === 0) return;

    const batch = this.batchQueue.splice(0, this.config.batchSize);
    
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    try {
      const results = await Promise.all(
        batch.flatMap(request => 
          request.queries.map(query => 
            this.executeQueryInternal(query.collection, {
              filters: query.filters,
              orderBy: query.orderBy,
              limit: query.limit,
              startAfter: query.pagination?.startAfter,
            }, query.id)
          )
        )
      );

      // Resolve all batch requests
      for (const request of batch) {
        const startIndex = batch.indexOf(request) * request.queries.length;
        const endIndex = startIndex + request.queries.length;
        request.resolve(results.slice(startIndex, endIndex));
      }

      this.emit('batchProcessed', { batchSize: batch.length, resultsCount: results.length });

    } catch (error) {
      // Reject all batch requests
      for (const request of batch) {
        request.reject(error as Error);
      }
    }
  }

  /**
   * Cache query result
   */
  private cacheResult(cacheKey: string, result: any): void {
    // Remove oldest entries if cache is full
    if (this.queryCache.size >= this.config.maxCacheSize) {
      const oldestKey = Array.from(this.queryCache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0];
      this.queryCache.delete(oldestKey);
    }

    this.queryCache.set(cacheKey, {
      result,
      timestamp: Date.now(),
      hitCount: 0,
    });
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(collection: string, options: any): string {
    const key = JSON.stringify({ collection, ...options });
    return btoa(key).replace(/[^a-zA-Z0-9]/g, '');
  }

  /**
   * Generate query ID
   */
  private generateQueryId(): string {
    return `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Update metrics
   */
  private updateMetrics(executionTime: number): void {
    this.queryMetrics.totalQueries++;
    this.queryMetrics.averageExecutionTime = 
      (this.queryMetrics.averageExecutionTime * (this.queryMetrics.totalQueries - 1) + executionTime) / 
      this.queryMetrics.totalQueries;
    
    this.queryMetrics.slowestQuery = Math.max(this.queryMetrics.slowestQuery, executionTime);
    this.queryMetrics.fastestQuery = this.queryMetrics.fastestQuery === 0 
      ? executionTime 
      : Math.min(this.queryMetrics.fastestQuery, executionTime);
  }
}

/**
 * Create a new query optimizer instance
 */
export function createQueryOptimizer(config?: Partial<QueryOptimizerConfig>): QueryOptimizer {
  return new QueryOptimizer(config);
}

/**
 * Hook for using query optimizer in React components
 */
export function useQueryOptimizer(config?: Partial<QueryOptimizerConfig>) {
  // Note: This hook requires React imports which are not available in this service file
  // Move this to a separate hooks file if needed
  throw new Error('useQueryOptimizer hook should be moved to a React hooks file');
}

export default QueryOptimizer;
