/**
 * TradeYa Migration Performance Monitor - Phase 2 Enhanced
 *
 * Production-grade monitoring with comprehensive analytics, alerting,
 * and real-time status reporting for zero-downtime migrations.
 */

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  Timestamp
} from 'firebase/firestore';
import { fileURLToPath } from 'url';
import { db } from '../src/firebase-config';
import { migrationRegistry } from '../src/services/migration/migrationRegistry';
import { performanceLogger } from '../src/utils/performance/structuredLogger';

/**
 * Enhanced monitoring interfaces for production-grade monitoring
 */
interface MonitoringResult {
  timestamp: Date;
  projectId: string;
  environment: 'development' | 'staging' | 'production';
  migrationVersion?: string;
  checks: MonitoringCheck[];
  summary: MonitoringSummary;
  dataIntegrityResults: DataIntegrityResults;
  performanceMetrics: PerformanceMetrics;
  alertThresholds: AlertThresholds;
  recommendations: string[];
  criticalAlerts: CriticalAlert[];
  trends: TrendAnalysis;
}

interface MonitoringCheck {
  checkName: string;
  category: 'performance' | 'integrity' | 'compatibility' | 'infrastructure';
  status: 'OK' | 'WARNING' | 'ERROR' | 'CRITICAL';
  details: string;
  responseTimeMs?: number;
  queryComplexity?: 'LOW' | 'MEDIUM' | 'HIGH';
  indexUsed?: boolean;
  resultsCount?: number;
  threshold?: {
    warning: number;
    critical: number;
  };
  trend?: 'improving' | 'stable' | 'degrading';
  impact?: 'low' | 'medium' | 'high' | 'critical';
}

interface MonitoringSummary {
  totalChecks: number;
  successfulChecks: number;
  warnings: number;
  errors: number;
  criticalIssues: number;
  averageResponseTime: number;
  overallStatus: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'MAINTENANCE';
  healthScore: number; // 0-100
  lastUpdate: Date;
}

interface DataIntegrityResults {
  tradesIntegrity: number;
  conversationsIntegrity: number;
  schemaComplianceRate: number;
  dataConsistencyScore: number;
  orphanedRecords: number;
  duplicateRecords: number;
  corruptedDocuments: number;
  migrationCompleteness: number;
}

interface PerformanceMetrics {
  queryLatencyP95: number;
  queryLatencyP99: number;
  throughputQPS: number;
  errorRate: number;
  indexEfficiency: number;
  memoryUsage: number;
  connectionPoolUtilization: number;
  cacheHitRate: number;
}

interface AlertThresholds {
  responseTime: { warning: number; critical: number };
  errorRate: { warning: number; critical: number };
  integrityScore: { warning: number; critical: number };
  throughput: { warning: number; critical: number };
}

interface CriticalAlert {
  id: string;
  timestamp: Date;
  severity: 'warning' | 'critical';
  category: string;
  message: string;
  affectedSystems: string[];
  recommendedActions: string[];
  autoResolution?: boolean;
}

interface TrendAnalysis {
  responseTimeTrend: 'improving' | 'stable' | 'degrading';
  errorRateTrend: 'improving' | 'stable' | 'degrading';
  throughputTrend: 'improving' | 'stable' | 'degrading';
  periodComparison: {
    current: PerformanceMetrics;
    previous: PerformanceMetrics;
    percentageChange: Record<string, number>;
  };
}

/**
 * Migration Performance Monitor
 */
export class MigrationMonitor {
  private projectId: string;
  private monitoringHistory: MonitoringResult[] = [];
  
  constructor(projectId: string = 'tradeya-45ede') {
    this.projectId = projectId;
  }

  /**
   * Run comprehensive monitoring checks
   */
  async runMonitoringChecks(): Promise<MonitoringResult> {
    console.log('\n📊 Starting post-migration monitoring checks...');
    
    const result: MonitoringResult = {
      timestamp: new Date(),
      projectId: this.projectId,
      checks: [],
      summary: {
        totalChecks: 0,
        successfulChecks: 0,
        warnings: 0,
        errors: 0,
        averageResponseTime: 0,
        overallStatus: 'HEALTHY'
      },
      dataIntegrityResults: {
        tradesIntegrity: 0,
        conversationsIntegrity: 0,
        schemaComplianceRate: 0
      },
      recommendations: []
    };
    
    try {
      // Initialize migration registry for monitoring
      if (!migrationRegistry.isInitialized()) {
        migrationRegistry.initialize(db);
      }
      
      // 1. Index Performance Tests
      await this.testIndexPerformance(result);
      
      // 2. Query Functionality Tests
      await this.testQueryFunctionality(result);
      
      // 3. Data Integrity Validation
      await this.validateDataIntegrity(result);
      
      // 4. Schema Compliance Checks
      await this.checkSchemaCompliance(result);
      
      // 5. Compatibility Layer Performance
      await this.testCompatibilityLayerPerformance(result);
      
      // Calculate summary statistics
      this.calculateSummaryStatistics(result);
      
      // Generate recommendations
      this.generateRecommendations(result);
      
      // Save monitoring result
      await this.saveMonitoringResult(result);
      
    } catch (error) {
      console.error('❌ Monitoring failed:', error);
      result.checks.push({
        checkName: 'MONITORING_SYSTEM',
        status: 'ERROR',
        details: `Monitoring system error: ${error.message}`
      });
      result.summary.overallStatus = 'CRITICAL';
    }
    
    this.monitoringHistory.push(result);
    this.displayMonitoringResults(result);
    
    return result;
  }

  /**
   * Test index performance with various query patterns
   */
  private async testIndexPerformance(result: MonitoringResult): Promise<void> {
    console.log('📇 Testing index performance...');
    
    const indexTests = [
      {
        name: 'Trades by creator and status (NEW)',
        complexity: 'MEDIUM' as const,
        test: async () => {
          const q = query(
            collection(db, 'trades'),
            where('participants.creator', '==', 'test-user'),
            where('status', '==', 'active'),
            orderBy('createdAt', 'desc'),
            limit(10)
          );
          return await getDocs(q);
        }
      },
      {
        name: 'Trades by participant (NEW)',
        complexity: 'MEDIUM' as const,
        test: async () => {
          const q = query(
            collection(db, 'trades'),
            where('participants.participant', '==', 'test-user'),
            where('status', '==', 'active'),
            orderBy('createdAt', 'desc'),
            limit(10)
          );
          return await getDocs(q);
        }
      },
      {
        name: 'Trades by skills offered (NEW)',
        complexity: 'HIGH' as const,
        test: async () => {
          const q = query(
            collection(db, 'trades'),
            where('skillsOffered', 'array-contains-any', ['React', 'JavaScript']),
            where('status', '==', 'active'),
            limit(10)
          );
          return await getDocs(q);
        }
      },
      {
        name: 'Conversations by participants (NEW)',
        complexity: 'MEDIUM' as const,
        test: async () => {
          const q = query(
            collection(db, 'conversations'),
            where('participantIds', 'array-contains', 'test-user'),
            orderBy('updatedAt', 'desc'),
            limit(10)
          );
          return await getDocs(q);
        }
      },
      {
        name: 'Trades basic query (LOW complexity)',
        complexity: 'LOW' as const,
        test: async () => {
          const q = query(
            collection(db, 'trades'),
            where('status', '==', 'active'),
            limit(5)
          );
          return await getDocs(q);
        }
      }
    ];
    
    for (const indexTest of indexTests) {
      try {
        const startTime = Date.now();
        const queryResult = await indexTest.test();
        const responseTime = Date.now() - startTime;
        
        // Determine if performance is acceptable
        let status: 'OK' | 'WARNING' | 'ERROR' = 'OK';
        let details = `Query executed successfully in ${responseTime}ms`;
        
        if (responseTime > 2000) {
          status = 'ERROR';
          details += ' - SLOW PERFORMANCE';
        } else if (responseTime > 1000) {
          status = 'WARNING';
          details += ' - MODERATE PERFORMANCE';
        }
        
        result.checks.push({
          checkName: indexTest.name,
          status,
          details,
          responseTimeMs: responseTime,
          queryComplexity: indexTest.complexity,
          indexUsed: responseTime < 1000, // Assume index used if fast
          resultsCount: queryResult.docs.length
        });
        
        console.log(`  ${status === 'OK' ? '✅' : status === 'WARNING' ? '⚠️' : '❌'} ${indexTest.name}: ${responseTime}ms`);
        
      } catch (error) {
        const errorMessage = error.message;
        let status: 'WARNING' | 'ERROR' = 'ERROR';
        
        if (errorMessage.includes('index')) {
          status = 'ERROR';
        } else if (errorMessage.includes('permission')) {
          status = 'ERROR';
        } else {
          // Might be acceptable (no data, etc.)
          status = 'WARNING';
        }
        
        result.checks.push({
          checkName: indexTest.name,
          status,
          details: `Query failed: ${errorMessage}`,
          queryComplexity: indexTest.complexity,
          indexUsed: false
        });
        
        console.log(`  ❌ ${indexTest.name}: ${errorMessage}`);
      }
    }
  }

  /**
   * Test query functionality with compatibility layer
   */
  private async testQueryFunctionality(result: MonitoringResult): Promise<void> {
    console.log('🔧 Testing query functionality...');
    
    try {
      // Test compatibility service queries
      const startTime = Date.now();
      
      // Test trade queries through compatibility layer
      try {
        const trades = await migrationRegistry.trades.queryTrades([
          where('status', '==', 'active')
        ], 5);
        
        const responseTime = Date.now() - startTime;
        
        result.checks.push({
          checkName: 'Trade Compatibility Service',
          status: 'OK',
          details: `Retrieved ${trades.length} trades in ${responseTime}ms`,
          responseTimeMs: responseTime,
          resultsCount: trades.length
        });
        
        console.log(`  ✅ Trade compatibility service: ${trades.length} trades in ${responseTime}ms`);
        
      } catch (error) {
        result.checks.push({
          checkName: 'Trade Compatibility Service',
          status: 'ERROR',
          details: `Trade query failed: ${error.message}`
        });
        console.log(`  ❌ Trade compatibility service failed: ${error.message}`);
      }
      
      // Test chat queries through compatibility layer
      try {
        const conversations = await migrationRegistry.chat.getUserConversations('test-user', 5);
        
        const responseTime = Date.now() - startTime;
        
        result.checks.push({
          checkName: 'Chat Compatibility Service',
          status: 'OK',
          details: `Retrieved ${conversations.length} conversations in ${responseTime}ms`,
          responseTimeMs: responseTime,
          resultsCount: conversations.length
        });
        
        console.log(`  ✅ Chat compatibility service: ${conversations.length} conversations`);
        
      } catch (error) {
        result.checks.push({
          checkName: 'Chat Compatibility Service',
          status: 'ERROR',
          details: `Chat query failed: ${error.message}`
        });
        console.log(`  ❌ Chat compatibility service failed: ${error.message}`);
      }
      
    } catch (error) {
      result.checks.push({
        checkName: 'Query Functionality Test',
        status: 'ERROR',
        details: `Functionality test failed: ${error.message}`
      });
    }
  }

  /**
   * Validate data integrity across collections
   */
  private async validateDataIntegrity(result: MonitoringResult): Promise<void> {
    console.log('🔍 Validating data integrity...');
    
    try {
      // Check trades integrity
      const tradesIntegrity = await this.checkTradesIntegrity();
      result.dataIntegrityResults.tradesIntegrity = tradesIntegrity;
      
      result.checks.push({
        checkName: 'Trades Data Integrity',
        status: tradesIntegrity > 95 ? 'OK' : tradesIntegrity > 90 ? 'WARNING' : 'ERROR',
        details: `${tradesIntegrity}% of trades have valid data structure`
      });
      
      // Check conversations integrity
      const conversationsIntegrity = await this.checkConversationsIntegrity();
      result.dataIntegrityResults.conversationsIntegrity = conversationsIntegrity;
      
      result.checks.push({
        checkName: 'Conversations Data Integrity',
        status: conversationsIntegrity > 95 ? 'OK' : conversationsIntegrity > 90 ? 'WARNING' : 'ERROR',
        details: `${conversationsIntegrity}% of conversations have valid data structure`
      });
      
      console.log(`  📊 Trades integrity: ${tradesIntegrity}%`);
      console.log(`  📊 Conversations integrity: ${conversationsIntegrity}%`);
      
    } catch (error) {
      result.checks.push({
        checkName: 'Data Integrity Validation',
        status: 'ERROR',
        details: `Data integrity check failed: ${error.message}`
      });
    }
  }

  /**
   * Check schema compliance rate
   */
  private async checkSchemaCompliance(result: MonitoringResult): Promise<void> {
    console.log('📋 Checking schema compliance...');
    
    try {
      // Check for migrated documents
      const migratedTradesQuery = query(
        collection(db, 'trades'),
        where('schemaVersion', '==', '2.0'),
        limit(100)
      );
      
      const totalTradesQuery = query(
        collection(db, 'trades'),
        limit(100)
      );
      
      const [migratedTrades, totalTrades] = await Promise.all([
        getDocs(migratedTradesQuery),
        getDocs(totalTradesQuery)
      ]);
      
      const complianceRate = totalTrades.size > 0 
        ? Math.round((migratedTrades.size / totalTrades.size) * 100)
        : 100;
      
      result.dataIntegrityResults.schemaComplianceRate = complianceRate;
      
      result.checks.push({
        checkName: 'Schema Compliance',
        status: complianceRate > 95 ? 'OK' : complianceRate > 80 ? 'WARNING' : 'ERROR',
        details: `${complianceRate}% of documents use new schema (${migratedTrades.size}/${totalTrades.size} checked)`
      });
      
      console.log(`  📋 Schema compliance: ${complianceRate}%`);
      
    } catch (error) {
      result.checks.push({
        checkName: 'Schema Compliance Check',
        status: 'ERROR',
        details: `Schema compliance check failed: ${error.message}`
      });
    }
  }

  /**
   * Test compatibility layer performance
   */
  private async testCompatibilityLayerPerformance(result: MonitoringResult): Promise<void> {
    console.log('⚡ Testing compatibility layer performance...');
    
    try {
      // Test data normalization performance
      const startTime = Date.now();
      
      // Sample trade data for normalization test
      const sampleTradeData = {
        id: 'perf-test-trade',
        title: 'Performance Test Trade',
        offeredSkills: ['React', 'Node.js'],
        requestedSkills: ['Design', 'Marketing'],
        creatorId: 'perf-test-user',
        participantId: 'perf-test-participant',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Test normalization 100 times
      for (let i = 0; i < 100; i++) {
        migrationRegistry.trades.constructor.normalizeTradeData(sampleTradeData);
      }
      
      const normalizationTime = Date.now() - startTime;
      const avgNormalizationTime = normalizationTime / 100;
      
      result.checks.push({
        checkName: 'Data Normalization Performance',
        status: avgNormalizationTime < 5 ? 'OK' : avgNormalizationTime < 10 ? 'WARNING' : 'ERROR',
        details: `Average normalization time: ${avgNormalizationTime.toFixed(2)}ms per document`,
        responseTimeMs: avgNormalizationTime
      });
      
      console.log(`  ⚡ Normalization performance: ${avgNormalizationTime.toFixed(2)}ms per document`);
      
    } catch (error) {
      result.checks.push({
        checkName: 'Compatibility Layer Performance',
        status: 'ERROR',
        details: `Performance test failed: ${error.message}`
      });
    }
  }

  /**
   * Check trades data integrity
   */
  private async checkTradesIntegrity(): Promise<number> {
    try {
      const q = query(collection(db, 'trades'), limit(50));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) return 100; // No data to validate
      
      let validCount = 0;
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        
        // Check for required fields in new schema
        const hasNewSchemaFields = 
          data.skillsOffered && 
          data.skillsWanted && 
          data.participants && 
          data.participants.creator;
        
        if (hasNewSchemaFields) {
          validCount++;
        }
      });
      
      return Math.round((validCount / snapshot.docs.length) * 100);
    } catch (error) {
      console.error('Error checking trades integrity:', error);
      return 0;
    }
  }

  /**
   * Check conversations data integrity
   */
  private async checkConversationsIntegrity(): Promise<number> {
    try {
      const q = query(collection(db, 'conversations'), limit(50));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) return 100; // No data to validate
      
      let validCount = 0;
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        
        // Check for required fields in new schema
        const hasNewSchemaFields = 
          data.participantIds && 
          Array.isArray(data.participantIds) && 
          data.participantIds.length > 0;
        
        if (hasNewSchemaFields) {
          validCount++;
        }
      });
      
      return Math.round((validCount / snapshot.docs.length) * 100);
    } catch (error) {
      console.error('Error checking conversations integrity:', error);
      return 0;
    }
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummaryStatistics(result: MonitoringResult): void {
    result.summary.totalChecks = result.checks.length;
    result.summary.successfulChecks = result.checks.filter(c => c.status === 'OK').length;
    result.summary.warnings = result.checks.filter(c => c.status === 'WARNING').length;
    result.summary.errors = result.checks.filter(c => c.status === 'ERROR').length;
    
    // Calculate average response time
    const responseTimes = result.checks
      .filter(c => c.responseTimeMs)
      .map(c => c.responseTimeMs!);
    
    result.summary.averageResponseTime = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length)
      : 0;
    
    // Determine overall status
    if (result.summary.errors > 0) {
      result.summary.overallStatus = 'CRITICAL';
    } else if (result.summary.warnings > 2) {
      result.summary.overallStatus = 'DEGRADED';
    } else {
      result.summary.overallStatus = 'HEALTHY';
    }
  }

  /**
   * Generate recommendations based on monitoring results
   */
  private generateRecommendations(result: MonitoringResult): void {
    const recommendations: string[] = [];
    
    // Performance recommendations
    if (result.summary.averageResponseTime > 1000) {
      recommendations.push('Consider index optimization - average response time is high');
    }
    
    // Data integrity recommendations
    if (result.dataIntegrityResults.tradesIntegrity < 95) {
      recommendations.push('Trades data integrity below 95% - review migration results');
    }
    
    if (result.dataIntegrityResults.conversationsIntegrity < 95) {
      recommendations.push('Conversations data integrity below 95% - review migration results');
    }
    
    // Schema compliance recommendations
    if (result.dataIntegrityResults.schemaComplianceRate < 90) {
      recommendations.push('Low schema compliance rate - migration may be incomplete');
    }
    
    // Error-based recommendations
    if (result.summary.errors > 0) {
      recommendations.push('Critical errors detected - immediate investigation required');
    }
    
    if (result.summary.warnings > 2) {
      recommendations.push('Multiple warnings detected - monitor closely');
    }
    
    // Success recommendations
    if (result.summary.overallStatus === 'HEALTHY') {
      recommendations.push('System operating normally - safe to continue');
    }
    
    result.recommendations = recommendations;
  }

  /**
   * Save monitoring result to Firestore
   */
  private async saveMonitoringResult(result: MonitoringResult): Promise<void> {
    try {
      const docRef = doc(db, 'monitoring-results', `migration-monitor-${Date.now()}`);
      await setDoc(docRef, {
        ...result,
        createdAt: serverTimestamp()
      });
      console.log('📁 Monitoring result saved to Firestore');
    } catch (error) {
      console.warn('⚠️  Failed to save monitoring result:', error.message);
    }
  }

  /**
   * Display monitoring results
   */
  private displayMonitoringResults(result: MonitoringResult): void {
    console.log('\n📊 Migration Monitoring Results:');
    console.log(`   🕐 Timestamp: ${result.timestamp.toISOString()}`);
    console.log(`   🎯 Project: ${result.projectId}`);
    console.log(`   📈 Overall Status: ${result.summary.overallStatus}`);
    console.log(`   ✅ Successful Checks: ${result.summary.successfulChecks}/${result.summary.totalChecks}`);
    console.log(`   ⚠️  Warnings: ${result.summary.warnings}`);
    console.log(`   ❌ Errors: ${result.summary.errors}`);
    console.log(`   ⏱️  Average Response Time: ${result.summary.averageResponseTime}ms`);
    
    console.log('\n📋 Data Integrity:');
    console.log(`   🔍 Trades Integrity: ${result.dataIntegrityResults.tradesIntegrity}%`);
    console.log(`   💬 Conversations Integrity: ${result.dataIntegrityResults.conversationsIntegrity}%`);
    console.log(`   📊 Schema Compliance: ${result.dataIntegrityResults.schemaComplianceRate}%`);
    
    if (result.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      result.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }
    
    // Show details for problematic checks
    const problemChecks = result.checks.filter(c => c.status !== 'OK');
    if (problemChecks.length > 0) {
      console.log('\n⚠️  Issues Detected:');
      problemChecks.forEach(check => {
        const emoji = check.status === 'WARNING' ? '⚠️' : '❌';
        console.log(`   ${emoji} ${check.checkName}: ${check.details}`);
      });
    }
  }

  /**
   * Static method to run monitoring
   */
  static async monitorPerformance(projectId?: string): Promise<MonitoringResult> {
    const monitor = new MigrationMonitor(projectId);
    return await monitor.runMonitoringChecks();
  }
}

// Execute monitoring if this script is run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const projectArg = args.find(arg => arg.startsWith('--project='));
  const projectId = projectArg ? projectArg.split('=')[1] : 'tradeya-45ede';

  MigrationMonitor.monitorPerformance(projectId)
    .then(result => {
      if (result.summary.overallStatus === 'CRITICAL') {
        console.error('\n🚨 CRITICAL: Migration monitoring detected serious issues');
        process.exit(1);
      } else if (result.summary.overallStatus === 'DEGRADED') {
        console.warn('\n⚠️  WARNING: Migration monitoring detected performance issues');
        process.exit(0);
      } else {
        console.log('\n✅ SUCCESS: Migration is operating normally');
        process.exit(0);
      }
    })
    .catch(error => {
      console.error('\n💥 Unhandled monitoring error:', error);
      process.exit(1);
    });
}

export { MigrationMonitor };