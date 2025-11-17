/**
 * Firebase Connection Health Check Utility
 * 
 * Provides methods to diagnose and fix Firebase connection issues
 * that can cause the Listen channel 400 error
 */

import { getSyncFirebaseDb } from '../firebase-config';
import { doc, getDoc, collection, query, limit, getDocs } from 'firebase/firestore';
import { logger } from '@utils/logging/logger';

export interface HealthCheckResult {
  isHealthy: boolean;
  issues: string[];
  recommendations: string[];
  timestamp: Date;
}

export class FirebaseHealthChecker {
  private static instance: FirebaseHealthChecker;
  private lastCheck: Date | null = null;
  private checkInterval: number = 30000; // 30 seconds

  static getInstance(): FirebaseHealthChecker {
    if (!FirebaseHealthChecker.instance) {
      FirebaseHealthChecker.instance = new FirebaseHealthChecker();
    }
    return FirebaseHealthChecker.instance;
  }

  /**
   * Perform a comprehensive health check
   */
  async performHealthCheck(): Promise<HealthCheckResult> {
    const result: HealthCheckResult = {
      isHealthy: true,
      issues: [],
      recommendations: [],
      timestamp: new Date()
    };

    try {
      // Check if Firebase is initialized
      const db = getSyncFirebaseDb();
      if (!db) {
        result.issues.push('Firebase not initialized');
        result.recommendations.push('Initialize Firebase before performing operations');
        result.isHealthy = false;
        return result;
      }

      // Test basic read operation
      await this.testBasicRead(db);
      
      // Test collection access
      await this.testCollectionAccess(db);
      
      // Check for network connectivity
      await this.testNetworkConnectivity();

      this.lastCheck = new Date();
      
    } catch (error: any) {
      result.isHealthy = false;
      result.issues.push(`Health check failed: ${error.message}`);
      
      // Provide specific recommendations based on error type
      if (error.message?.includes('400')) {
        result.recommendations.push('Enable long polling in Firebase configuration');
        result.recommendations.push('Check network connectivity and firewall settings');
      } else if (error.message?.includes('permission')) {
        result.recommendations.push('Check Firestore security rules');
        result.recommendations.push('Verify user authentication status');
      } else if (error.message?.includes('network')) {
        result.recommendations.push('Check internet connection');
        result.recommendations.push('Try disabling browser extensions');
      }
    }

    return result;
  }

  /**
   * Test basic read operation
   */
  private async testBasicRead(db: any): Promise<void> {
    try {
      // Try to read a simple document
      const testDoc = doc(db, 'conversations', 'test');
      await getDoc(testDoc);
    } catch (error: any) {
      if (!error.message?.includes('not found')) {
        throw new Error(`Basic read test failed: ${error.message}`);
      }
    }
  }

  /**
   * Test collection access
   */
  private async testCollectionAccess(db: any): Promise<void> {
    try {
      const conversationsRef = collection(db, 'conversations');
      const q = query(conversationsRef, limit(1));
      await getDocs(q);
    } catch (error: any) {
      throw new Error(`Collection access test failed: ${error.message}`);
    }
  }

  /**
   * Test network connectivity
   */
  private async testNetworkConnectivity(): Promise<void> {
    try {
      // Test if we can reach Firebase servers
      const response = await fetch('https://firestore.googleapis.com', {
        method: 'HEAD',
        mode: 'no-cors'
      });
    } catch (error: any) {
      throw new Error(`Network connectivity test failed: ${error.message}`);
    }
  }

  /**
   * Get the last health check result
   */
  getLastCheck(): Date | null {
    return this.lastCheck;
  }

  /**
   * Check if a health check is needed
   */
  isHealthCheckNeeded(): boolean {
    if (!this.lastCheck) return true;
    return Date.now() - this.lastCheck.getTime() > this.checkInterval;
  }

  /**
   * Force a health check if needed
   */
  async checkIfNeeded(): Promise<HealthCheckResult | null> {
    if (this.isHealthCheckNeeded()) {
      return await this.performHealthCheck();
    }
    return null;
  }
}

/**
 * Utility function to perform a quick health check
 */
export const performQuickHealthCheck = async (): Promise<boolean> => {
  try {
    const checker = FirebaseHealthChecker.getInstance();
    const result = await checker.performHealthCheck();
    return result.isHealthy;
  } catch (error) {
    logger.error('Quick health check failed:', 'UTILITY', {}, error as Error);
    return false;
  }
};

/**
 * Utility function to get health status with recommendations
 */
export const getHealthStatus = async (): Promise<HealthCheckResult> => {
  const checker = FirebaseHealthChecker.getInstance();
  return await checker.performHealthCheck();
};
