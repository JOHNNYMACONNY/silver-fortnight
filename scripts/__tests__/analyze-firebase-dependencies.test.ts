import fs from 'fs';
import path from 'path';
import { 
  analyzeDependencies, 
  analyzeFile, 
  scanFiles, 
  DependencyAnalysis, 
  AnalysisConfig,
  generateReport,
  getRiskScore,
  collectCollectionPatterns,
  analyzeImportPatterns,
  generateSummaryStats
} from '../analyze-firebase-dependencies';

// Mock fs module
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

// Mock path module
jest.mock('path');
const mockPath = path as jest.Mocked<typeof path>;

describe('Firebase Dependency Analysis', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default path behavior
    mockPath.join.mockImplementation((...segments) => segments.join('/'));
    mockPath.relative.mockImplementation((from, to) => to);
  });

  describe('analyzeFile', () => {
    it('should detect basic Firestore imports', () => {
      const content = `
        import { db } from '../firebase-config';
        import { collection, doc, getDoc } from 'firebase/firestore';
        
        export function getUser() {
          return getDoc(doc(db, 'users', 'id'));
        }
      `;

      const result = analyzeFile('src/services/users.ts', content);

      expect(result.file).toBe('src/services/users.ts');
      expect(result.firestoreImports).toContain('firebase/firestore');
      expect(result.affectedCollections).toContain('users');
      expect(result.riskLevel).toBe('HIGH');
    });

    it('should detect collection references in different patterns', () => {
      const content = `
        import { db } from '../firebase-config';
        import { collection, query, where } from 'firebase/firestore';
        
        // Pattern 1: Direct collection reference
        const tradesRef = collection(db, 'trades');
        
        // Pattern 2: Template literal
        const userDoc = doc(db, \`users/\${userId}\`);
        
        // Pattern 3: Variable collection name
        const collectionName = 'notifications';
        const notificationsRef = collection(db, collectionName);
        
        // Pattern 4: Nested collections
        const messagesRef = collection(db, 'conversations', conversationId, 'messages');
      `;

      const result = analyzeFile('src/services/mixed.ts', content);

      expect(result.affectedCollections).toContain('trades');
      expect(result.affectedCollections).toContain('users');
      expect(result.affectedCollections).toContain('conversations');
      expect(result.affectedCollections).toContain('messages');
      expect(result.riskLevel).toBe('CRITICAL');
    });

    it('should assess risk levels correctly', () => {
      const criticalContent = `
        import { collection } from 'firebase/firestore';
        const tradesRef = collection(db, 'trades');
      `;
      
      const highContent = `
        import { collection } from 'firebase/firestore';
        const usersRef = collection(db, 'users');
      `;
      
      const mediumContent = `
        import { db } from '../firebase-config';
        // No direct collection usage
      `;
      
      const lowContent = `
        // No Firebase usage at all
        export const utils = {};
      `;

      expect(analyzeFile('critical.ts', criticalContent).riskLevel).toBe('CRITICAL');
      expect(analyzeFile('high.ts', highContent).riskLevel).toBe('HIGH');
      expect(analyzeFile('medium.ts', mediumContent).riskLevel).toBe('MEDIUM');
      expect(analyzeFile('low.ts', lowContent).riskLevel).toBe('LOW');
    });

    it('should detect Firebase service imports', () => {
      const content = `
        import { someFunction } from '../services/firestore';
        import { createUser } from '../services/collaborations';
        
        export function component() {
          return someFunction();
        }
      `;

      const result = analyzeFile('src/components/Test.tsx', content);

      expect(result.serviceImports).toContain('../services/firestore');
      expect(result.serviceImports).toContain('../services/collaborations');
      expect(result.riskLevel).toBe('MEDIUM');
    });

    it('should identify Firestore operation patterns', () => {
      const content = `
        import { doc, getDoc, setDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
        
        // Read operations
        await getDoc(doc(db, 'users', id));
        
        // Write operations
        await setDoc(doc(db, 'trades', id), data);
        await updateDoc(userRef, updates);
        await deleteDoc(tradeRef);
        
        // Batch operations
        const batch = writeBatch(db);
        batch.set(ref1, data1);
        batch.commit();
      `;

      const result = analyzeFile('src/services/operations.ts', content);

      expect(result.operationPatterns).toContain('read');
      expect(result.operationPatterns).toContain('write');
      expect(result.operationPatterns).toContain('batch');
    });

    it('should handle files with no Firebase dependencies', () => {
      const content = `
        import React from 'react';
        import { useState } from 'react';
        
        export function PureComponent() {
          const [state, setState] = useState('');
          return <div>{state}</div>;
        }
      `;

      const result = analyzeFile('src/components/Pure.tsx', content);

      expect(result.riskLevel).toBe('LOW');
      expect(result.firestoreImports).toHaveLength(0);
      expect(result.affectedCollections).toHaveLength(0);
      expect(result.serviceImports).toHaveLength(0);
    });
  });

  describe('scanFiles', () => {
    beforeEach(() => {
      // Mock directory structure
      mockFs.readdirSync.mockImplementation((dirPath: any) => {
        const pathStr = dirPath.toString();
        
        if (pathStr === './src') {
          return [
            { name: 'components', isDirectory: () => true },
            { name: 'services', isDirectory: () => true },
            { name: 'App.tsx', isDirectory: () => false },
            { name: 'main.tsx', isDirectory: () => false },
            { name: '.env', isDirectory: () => false },
            { name: 'node_modules', isDirectory: () => true }
          ] as any;
        }
        
        if (pathStr === './src/components') {
          return [
            { name: 'Header.tsx', isDirectory: () => false },
            { name: 'UserCard.tsx', isDirectory: () => false },
            { name: 'styles.css', isDirectory: () => false }
          ] as any;
        }
        
        if (pathStr === './src/services') {
          return [
            { name: 'firestore.ts', isDirectory: () => false },
            { name: 'auth.ts', isDirectory: () => false },
            { name: 'utils.js', isDirectory: () => false }
          ] as any;
        }
        
        return [] as any;
      });

      mockFs.statSync.mockImplementation((filePath: any) => ({
        isDirectory: () => {
          const pathStr = filePath.toString();
          return pathStr.includes('components') || pathStr.includes('services') || pathStr.includes('node_modules');
        },
        isFile: () => {
          const pathStr = filePath.toString();
          return !pathStr.includes('components') && !pathStr.includes('services') && !pathStr.includes('node_modules');
        }
      } as any));
    });

    it('should scan TypeScript and TSX files recursively', async () => {
      const files = await scanFiles('./src', /\.(ts|tsx)$/);

      expect(files).toContain('./src/App.tsx');
      expect(files).toContain('./src/main.tsx');
      expect(files).toContain('./src/components/Header.tsx');
      expect(files).toContain('./src/components/UserCard.tsx');
      expect(files).toContain('./src/services/firestore.ts');
      expect(files).toContain('./src/services/auth.ts');
      
      // Should exclude non-TS files and node_modules
      expect(files).not.toContain('./src/services/utils.js');
      expect(files).not.toContain('./src/components/styles.css');
      expect(files).not.toContain('./src/.env');
    });

    it('should respect file pattern filters', async () => {
      const jsFiles = await scanFiles('./src', /\.js$/);
      expect(jsFiles).toContain('./src/services/utils.js');
      expect(jsFiles).not.toContain('./src/App.tsx');
    });

    it('should exclude hidden directories and node_modules', async () => {
      const files = await scanFiles('./src', /\.(ts|tsx)$/);
      
      // Should not include any files from node_modules
      expect(files.every(f => !f.includes('node_modules'))).toBe(true);
    });
  });

  describe('analyzeDependencies', () => {
    beforeEach(() => {
      // Mock file system for full analysis
      mockFs.readdirSync.mockImplementation((dirPath: any) => {
        if (dirPath.toString() === './src') {
          return [
            { name: 'services', isDirectory: () => true },
            { name: 'components', isDirectory: () => true }
          ] as any;
        }
        if (dirPath.toString() === './src/services') {
          return [
            { name: 'firestore.ts', isDirectory: () => false }
          ] as any;
        }
        if (dirPath.toString() === './src/components') {
          return [
            { name: 'TradeCard.tsx', isDirectory: () => false }
          ] as any;
        }
        return [] as any;
      });

      mockFs.statSync.mockReturnValue({
        isDirectory: () => false,
        isFile: () => true
      } as any);

      mockFs.readFileSync.mockImplementation((filePath: any) => {
        const pathStr = filePath.toString();
        
        if (pathStr.includes('firestore.ts')) {
          return `
            import { db } from '../firebase-config';
            import { collection, doc, getDoc, setDoc } from 'firebase/firestore';
            
            export const COLLECTIONS = {
              USERS: 'users',
              TRADES: 'trades'
            };
            
            export async function createTrade(data: any) {
              return setDoc(doc(db, 'trades', data.id), data);
            }
          `;
        }
        
        if (pathStr.includes('TradeCard.tsx')) {
          return `
            import React from 'react';
            import { createTrade } from '../services/firestore';
            
            export function TradeCard() {
              return <div onClick={() => createTrade({})} />;
            }
          `;
        }
        
        return '';
      });
    });

    it('should analyze all files and return sorted results', async () => {
      const results = await analyzeDependencies();

      expect(results).toHaveLength(2);
      
      // Should be sorted by risk level (CRITICAL first)
      expect(results[0].riskLevel).toBe('CRITICAL');
      expect(results[0].file).toContain('firestore.ts');
      
      expect(results[1].riskLevel).toBe('MEDIUM');
      expect(results[1].file).toContain('TradeCard.tsx');
    });

    it('should handle custom configuration', async () => {
      const config: AnalysisConfig = {
        targetDirectory: './custom',
        includePatterns: [/\.tsx?$/],
        excludePatterns: [/\.test\./],
        riskAssessment: {
          criticalCollections: ['custom-critical'],
          highRiskCollections: ['custom-high'],
          serviceFilePatterns: [/services\//]
        }
      };

      // Mock for custom directory
      mockFs.readdirSync.mockImplementation((dirPath: any) => {
        if (dirPath.toString() === './custom') {
          return [{ name: 'test.ts', isDirectory: () => false }] as any;
        }
        return [] as any;
      });

      mockFs.readFileSync.mockReturnValue(`
        import { collection } from 'firebase/firestore';
        const ref = collection(db, 'custom-critical');
      `);

      const results = await analyzeDependencies(config);
      expect(results[0].riskLevel).toBe('CRITICAL');
    });
  });

  describe('generateReport', () => {
    const mockResults: DependencyAnalysis[] = [
      {
        file: 'src/services/firestore.ts',
        firestoreImports: ['firebase/firestore'],
        serviceImports: [],
        affectedCollections: ['trades', 'users'],
        operationPatterns: ['read', 'write'],
        riskLevel: 'CRITICAL',
        details: 'Core Firestore service'
      },
      {
        file: 'src/components/TradeCard.tsx',
        firestoreImports: [],
        serviceImports: ['../services/firestore'],
        affectedCollections: [],
        operationPatterns: [],
        riskLevel: 'MEDIUM',
        details: 'Imports Firestore service'
      }
    ];

    it('should generate console report format', () => {
      const report = generateReport(mockResults, 'console');
      
      expect(report).toContain('🔍 Firebase Dependency Analysis');
      expect(report).toContain('🔴 CRITICAL');
      expect(report).toContain('🟡 MEDIUM');
      expect(report).toContain('src/services/firestore.ts');
      expect(report).toContain('Collections: trades, users');
    });

    it('should generate JSON report format', () => {
      const report = generateReport(mockResults, 'json');
      const parsed = JSON.parse(report);
      
      expect(parsed).toHaveProperty('summary');
      expect(parsed).toHaveProperty('results');
      expect(parsed.results).toHaveLength(2);
      expect(parsed.summary.totalFiles).toBe(2);
      expect(parsed.summary.riskDistribution.CRITICAL).toBe(1);
      expect(parsed.summary.riskDistribution.MEDIUM).toBe(1);
    });

    it('should generate markdown report format', () => {
      const report = generateReport(mockResults, 'markdown');
      
      expect(report).toContain('# Firebase Dependency Analysis Report');
      expect(report).toContain('## Summary');
      expect(report).toContain('## Files by Risk Level');
      expect(report).toContain('### 🔴 CRITICAL Risk');
      expect(report).toContain('- **File:** src/services/firestore.ts');
    });
  });

  describe('utility functions', () => {
    describe('getRiskScore', () => {
      it('should return correct scores for risk levels', () => {
        expect(getRiskScore('LOW')).toBe(1);
        expect(getRiskScore('MEDIUM')).toBe(2);
        expect(getRiskScore('HIGH')).toBe(3);
        expect(getRiskScore('CRITICAL')).toBe(4);
      });

      it('should handle invalid risk levels', () => {
        expect(getRiskScore('INVALID' as any)).toBe(0);
      });
    });

    describe('collectCollectionPatterns', () => {
      it('should extract collection names from various patterns', () => {
        const content = `
          collection(db, 'users')
          collection(db, "trades")
          doc(db, 'notifications', id)
          doc(db, \`conversations/\${id}\`)
        `;

        const collections = collectCollectionPatterns(content);
        
        expect(collections).toContain('users');
        expect(collections).toContain('trades');
        expect(collections).toContain('notifications');
        expect(collections).toContain('conversations');
      });
    });

    describe('analyzeImportPatterns', () => {
      it('should identify different types of imports', () => {
        const content = `
          import { collection } from 'firebase/firestore';
          import { createUser } from '../services/firestore';
          import { someUtil } from './utils';
        `;

        const patterns = analyzeImportPatterns(content);
        
        expect(patterns.firestoreImports).toContain('firebase/firestore');
        expect(patterns.serviceImports).toContain('../services/firestore');
        expect(patterns.serviceImports).not.toContain('./utils');
      });
    });

    describe('generateSummaryStats', () => {
      it('should calculate correct summary statistics', () => {
        const results: DependencyAnalysis[] = [
          { riskLevel: 'CRITICAL', affectedCollections: ['trades'], file: '1', firestoreImports: [], serviceImports: [], operationPatterns: [], details: '' },
          { riskLevel: 'HIGH', affectedCollections: ['users'], file: '2', firestoreImports: [], serviceImports: [], operationPatterns: [], details: '' },
          { riskLevel: 'MEDIUM', affectedCollections: [], file: '3', firestoreImports: [], serviceImports: [], operationPatterns: [], details: '' },
          { riskLevel: 'LOW', affectedCollections: [], file: '4', firestoreImports: [], serviceImports: [], operationPatterns: [], details: '' }
        ];

        const stats = generateSummaryStats(results);

        expect(stats.totalFiles).toBe(4);
        expect(stats.riskDistribution.CRITICAL).toBe(1);
        expect(stats.riskDistribution.HIGH).toBe(1);
        expect(stats.riskDistribution.MEDIUM).toBe(1);
        expect(stats.riskDistribution.LOW).toBe(1);
        expect(stats.collectionsFound).toEqual(['trades', 'users']);
        expect(stats.collectionsFound).toHaveLength(2);
      });
    });
  });

  describe('error handling', () => {
    it('should handle file read errors gracefully', async () => {
      mockFs.readdirSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      await expect(analyzeDependencies()).rejects.toThrow('Permission denied');
    });

    it('should handle malformed file content', () => {
      const invalidContent = `
        import { something from 'invalid-syntax
        collection(db, 
      `;

      // Should not throw, but return safe defaults
      const result = analyzeFile('invalid.ts', invalidContent);
      expect(result.riskLevel).toBe('LOW');
      expect(result.affectedCollections).toEqual([]);
    });

    it('should validate configuration parameters', async () => {
      const invalidConfig = {
        targetDirectory: '', // Invalid empty directory
        includePatterns: [], // No patterns
        riskAssessment: {}
      } as any;

      await expect(analyzeDependencies(invalidConfig)).rejects.toThrow();
    });
  });
});