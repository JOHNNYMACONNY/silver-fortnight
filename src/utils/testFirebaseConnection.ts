/**
 * Firebase Connection Test Script
 * 
 * Comprehensive test to diagnose Firebase connection issues
 * and provide specific recommendations
 */

import { getSyncFirebaseDb } from '../firebase-config';
import { collection, query, orderBy, getDocs, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { FirebaseConnectionManager } from './firebaseConnectionManager';

export interface ConnectionTestResult {
  testName: string;
  success: boolean;
  error?: string;
  duration: number;
  recommendations?: string[];
}

export class FirebaseConnectionTester {
  private results: ConnectionTestResult[] = [];

  /**
   * Run all connection tests
   */
  async runAllTests(): Promise<ConnectionTestResult[]> {
    console.log('🔍 Starting Firebase connection tests...');
    this.results = [];

    await this.testBasicInitialization();
    await this.testDatabaseAccess();
    await this.testCollectionQueries();
    await this.testRealtimeListeners();
    await this.testSpecificConversation();
    await this.testConnectionManager();

    console.log('✅ Firebase connection tests completed');
    return this.results;
  }

  /**
   * Test basic Firebase initialization
   */
  private async testBasicInitialization(): Promise<void> {
    const startTime = Date.now();
    try {
      const db = getSyncFirebaseDb();
      if (!db) {
        throw new Error('Firebase database not initialized');
      }
      
      this.addResult({
        testName: 'Basic Initialization',
        success: true,
        duration: Date.now() - startTime
      });
    } catch (error: any) {
      this.addResult({
        testName: 'Basic Initialization',
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
        recommendations: [
          'Check Firebase configuration',
          'Verify environment variables',
          'Ensure Firebase is properly initialized'
        ]
      });
    }
  }

  /**
   * Test database access
   */
  private async testDatabaseAccess(): Promise<void> {
    const startTime = Date.now();
    try {
      const db = getSyncFirebaseDb();
      const testDoc = doc(db, 'conversations', 'test');
      await getDoc(testDoc);
      
      this.addResult({
        testName: 'Database Access',
        success: true,
        duration: Date.now() - startTime
      });
    } catch (error: any) {
      this.addResult({
        testName: 'Database Access',
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
        recommendations: [
          'Check Firestore security rules',
          'Verify user authentication',
          'Ensure database exists and is accessible'
        ]
      });
    }
  }

  /**
   * Test collection queries
   */
  private async testCollectionQueries(): Promise<void> {
    const startTime = Date.now();
    try {
      const db = getSyncFirebaseDb();
      const conversationsRef = collection(db, 'conversations');
      const q = query(conversationsRef, orderBy('updatedAt', 'desc'));
      const snapshot = await getDocs(q);
      
      this.addResult({
        testName: 'Collection Queries',
        success: true,
        duration: Date.now() - startTime,
        recommendations: snapshot.empty ? ['No conversations found - this may be normal'] : []
      });
    } catch (error: any) {
      this.addResult({
        testName: 'Collection Queries',
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
        recommendations: [
          'Check Firestore indexes',
          'Verify query permissions',
          'Ensure proper ordering fields exist'
        ]
      });
    }
  }

  /**
   * Test real-time listeners
   */
  private async testRealtimeListeners(): Promise<void> {
    const startTime = Date.now();
    try {
      const db = getSyncFirebaseDb();
      const conversationsRef = collection(db, 'conversations');
      const q = query(conversationsRef, orderBy('updatedAt', 'desc'));
      
      await new Promise((resolve, reject) => {
        let resolved = false;
        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            unsubscribe();
            reject(new Error('Listener test timeout'));
          }
        }, 10000);

        const unsubscribe = onSnapshot(q, 
          (snapshot) => {
            if (!resolved) {
              resolved = true;
              clearTimeout(timeout);
              unsubscribe();
              resolve(snapshot);
            }
          },
          (error) => {
            if (!resolved) {
              resolved = true;
              clearTimeout(timeout);
              unsubscribe();
              reject(error);
            }
          }
        );
      });
      
      this.addResult({
        testName: 'Realtime Listeners',
        success: true,
        duration: Date.now() - startTime
      });
    } catch (error: any) {
      this.addResult({
        testName: 'Realtime Listeners',
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
        recommendations: [
          'Enable long polling in Firebase settings',
          'Check network connectivity',
          'Verify Firestore security rules allow real-time access',
          'Try disabling browser extensions',
          'Clear browser cache and cookies'
        ]
      });
    }
  }

  /**
   * Test specific conversation access
   */
  private async testSpecificConversation(): Promise<void> {
    const startTime = Date.now();
    try {
      const db = getSyncFirebaseDb();
      const conversationId = 'bcB1UuJ2VHwTXsTFG71g';
      
      // Test conversation document
      const conversationDoc = doc(db, 'conversations', conversationId);
      const conversationSnapshot = await getDoc(conversationDoc);
      
      if (!conversationSnapshot.exists()) {
        throw new Error('Conversation document not found');
      }
      
      // Test messages subcollection
      const messagesRef = collection(db, 'conversations', conversationId, 'messages');
      const messagesQuery = query(messagesRef, orderBy('createdAt', 'asc'));
      const messagesSnapshot = await getDocs(messagesQuery);
      
      this.addResult({
        testName: 'Specific Conversation',
        success: true,
        duration: Date.now() - startTime,
        recommendations: messagesSnapshot.empty ? ['No messages found in conversation'] : []
      });
    } catch (error: any) {
      this.addResult({
        testName: 'Specific Conversation',
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
        recommendations: [
          'Check if conversation exists',
          'Verify user has access to this conversation',
          'Ensure messages subcollection exists'
        ]
      });
    }
  }

  /**
   * Test connection manager
   */
  private async testConnectionManager(): Promise<void> {
    const startTime = Date.now();
    try {
      const connectionManager = FirebaseConnectionManager.getInstance();
      const isConnected = await connectionManager.testConnection();
      
      this.addResult({
        testName: 'Connection Manager',
        success: isConnected,
        duration: Date.now() - startTime,
        recommendations: isConnected ? [] : [
          'Connection manager detected issues',
          'Check connection status for details',
          'Consider implementing fallback mechanisms'
        ]
      });
    } catch (error: any) {
      this.addResult({
        testName: 'Connection Manager',
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
        recommendations: [
          'Connection manager failed to initialize',
          'Check Firebase configuration',
          'Verify network connectivity'
        ]
      });
    }
  }

  /**
   * Add test result
   */
  private addResult(result: ConnectionTestResult): void {
    this.results.push(result);
    console.log(`${result.success ? '✅' : '❌'} ${result.testName}: ${result.success ? 'PASSED' : 'FAILED'} (${result.duration}ms)`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    if (result.recommendations && result.recommendations.length > 0) {
      console.log(`   Recommendations: ${result.recommendations.join(', ')}`);
    }
  }

  /**
   * Get summary of test results
   */
  getSummary(): { total: number; passed: number; failed: number; recommendations: string[] } {
    const total = this.results.length;
    const passed = this.results.filter(r => r.success).length;
    const failed = total - passed;
    
    const allRecommendations = this.results
      .filter(r => r.recommendations && r.recommendations.length > 0)
      .flatMap(r => r.recommendations!)
      .filter((rec, index, arr) => arr.indexOf(rec) === index); // Remove duplicates

    return {
      total,
      passed,
      failed,
      recommendations: allRecommendations
    };
  }
}

/**
 * Utility function to run connection tests
 */
export const runConnectionTests = async (): Promise<ConnectionTestResult[]> => {
  const tester = new FirebaseConnectionTester();
  return await tester.runAllTests();
};

/**
 * Utility function to get test summary
 */
export const getConnectionTestSummary = async (): Promise<{
  total: number;
  passed: number;
  failed: number;
  recommendations: string[];
}> => {
  const tester = new FirebaseConnectionTester();
  await tester.runAllTests();
  return tester.getSummary();
};
