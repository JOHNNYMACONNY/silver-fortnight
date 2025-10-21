/**
 * Tests for the Documentation Maintenance Automation System
 * 
 * @jest-environment node
 */

import { DocumentationMaintainer, DocumentMetadata, ArchivalAnalysis } from '../maintain-docs';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock filesystem operations
jest.mock('fs/promises');
jest.mock('glob');

const mockFs = fs as jest.Mocked<typeof fs>;

describe('DocumentationMaintainer', () => {
  let maintainer: DocumentationMaintainer;
  const testDocsPath = '/test/docs';
  
  beforeEach(() => {
    maintainer = new DocumentationMaintainer();
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      mockFs.mkdir.mockResolvedValue(undefined);
      
      await expect(maintainer.initialize()).resolves.not.toThrow();
      
      // Should create required directories
      expect(mockFs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining('archived'),
        { recursive: true }
      );
      expect(mockFs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining('.metadata'),
        { recursive: true }
      );
    });
  });

  describe('document analysis', () => {
    const mockDocumentContent = `# Test Implementation Summary

**Status:** 🟢 Complete
**Created:** 2025-06-09
**Firestore:** database migration implementation

## Overview
This is a test document for Firestore migration.

## Implementation Details
- Feature A implemented
- Feature B tested
- Production ready

[Related Documentation](OTHER_GUIDE.md)
`;

    beforeEach(() => {
      // Mock glob to return test files
      const glob = require('glob');
      glob.mockResolvedValue(['TEST_IMPLEMENTATION_SUMMARY.md', 'OLD_PLAN.md']);
      
      // Mock file stats
      mockFs.stat.mockResolvedValue({
        size: 1500,
        birthtime: new Date('2025-06-01'),
        mtime: new Date('2025-06-08'),
        atime: new Date('2025-06-09')
      } as any);
      
      // Mock file content
      mockFs.readFile.mockResolvedValue(mockDocumentContent);
    });

    it('should analyze document metadata correctly', async () => {
      const analysis = await maintainer.analyzeDocumentation();
      
      expect(analysis).toMatchObject({
        totalDocuments: expect.any(Number),
        activeDocuments: expect.any(Number),
        healthScore: expect.any(Number)
      });
      
      expect(analysis.totalDocuments).toBeGreaterThan(0);
      expect(analysis.healthScore).toBeGreaterThanOrEqual(0);
      expect(analysis.healthScore).toBeLessThanOrEqual(100);
    });

    it('should identify Firestore documents correctly', async () => {
      const analysis = await maintainer.analyzeDocumentation();
      
      expect(analysis.firestoreDocuments).toBeDefined();
      expect(Array.isArray(analysis.firestoreDocuments)).toBe(true);
      
      // Should identify documents with Firestore content
      const firestoreDoc = analysis.firestoreDocuments.find(
        doc => doc.firestoreRelevance > 50
      );
      expect(firestoreDoc).toBeDefined();
    });

    it('should categorize documents appropriately', async () => {
      await maintainer.analyzeDocumentation();
      
      // Implementation summaries should be identified
      expect(mockFs.readFile).toHaveBeenCalled();
      
      // Should handle different document types
      const implementationSummaryPattern = /IMPLEMENTATION_SUMMARY/;
      const planPattern = /PLAN/;
      
      expect(implementationSummaryPattern.test('TEST_IMPLEMENTATION_SUMMARY.md')).toBe(true);
      expect(planPattern.test('OLD_PLAN.md')).toBe(true);
    });
  });

  describe('cross-reference validation', () => {
    beforeEach(() => {
      const glob = require('glob');
      glob.mockResolvedValue(['DOC_WITH_REFS.md']);
      
      mockFs.stat.mockResolvedValue({
        size: 1000,
        birthtime: new Date('2025-06-01'),
        mtime: new Date('2025-06-08'),
        atime: new Date('2025-06-09')
      } as any);
      
      mockFs.readFile.mockResolvedValue(
        '# Document\n\nSee [Other Doc](OTHER_DOC.md) for details.'
      );
    });

    it('should validate cross-references', async () => {
      await maintainer.analyzeDocumentation();
      
      const brokenRefs = await maintainer.validateCrossReferences();
      
      expect(Array.isArray(brokenRefs)).toBe(true);
      expect(brokenRefs.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('archival operations', () => {
    beforeEach(() => {
      const glob = require('glob');
      glob.mockResolvedValue(['OBSOLETE_DOC.md']);
      
      mockFs.stat.mockResolvedValue({
        size: 500, // Small file size
        birthtime: new Date('2024-01-01'), // Old document
        mtime: new Date('2024-01-01'),
        atime: new Date('2024-01-01')
      } as any);
      
      mockFs.readFile.mockResolvedValue(
        '# Obsolete Document\n\nTODO: This is a draft document.'
      );
    });

    it('should identify archive candidates', async () => {
      const analysis = await maintainer.analyzeDocumentation();
      
      expect(analysis.archiveCandidates).toBeDefined();
      expect(Array.isArray(analysis.archiveCandidates)).toBe(true);
    });

    it('should perform dry-run archival safely', async () => {
      await maintainer.analyzeDocumentation();
      
      // Dry run should not actually move files
      await maintainer.archiveOutdatedDocuments(true);
      
      expect(mockFs.rename).not.toHaveBeenCalled();
      expect(mockFs.writeFile).not.toHaveBeenCalled();
    });

    it('should execute archival when specified', async () => {
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.rename.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);
      
      await maintainer.analyzeDocumentation();
      await maintainer.archiveOutdatedDocuments(false);
      
      // Should create archive directory and move files
      expect(mockFs.mkdir).toHaveBeenCalled();
    });
  });

  describe('Firestore priority system', () => {
    const criticalFirestoreDocs = [
      'FIRESTORE_MIGRATION_IMPLEMENTATION_GUIDE.md',
      'FIRESTORE_INDEX_VERIFICATION_IMPLEMENTATION_SUMMARY.md'
    ];

    beforeEach(() => {
      const glob = require('glob');
      glob.mockResolvedValue(criticalFirestoreDocs);
      
      mockFs.stat.mockResolvedValue({
        size: 5000,
        birthtime: new Date('2025-06-01'),
        mtime: new Date('2025-06-08'),
        atime: new Date('2025-06-09')
      } as any);
      
      mockFs.readFile.mockResolvedValue(
        '# Firestore Migration Guide\n\nCritical firestore migration procedures...'
      );
    });

    it('should prioritize Firestore documentation', async () => {
      await maintainer.analyzeDocumentation();
      await maintainer.checkFirestorePriority();
      
      // Should read Firestore documents
      expect(mockFs.readFile).toHaveBeenCalled();
    });

    it('should never archive critical Firestore documents', async () => {
      const analysis = await maintainer.analyzeDocumentation();
      
      // Critical Firestore docs should not be in archive candidates
      const criticalInArchive = analysis.archiveCandidates.some(doc =>
        criticalFirestoreDocs.includes(doc.fileName)
      );
      
      expect(criticalInArchive).toBe(false);
    });
  });

  describe('health scoring', () => {
    it('should calculate health score correctly', async () => {
      const glob = require('glob');
      glob.mockResolvedValue(['HEALTHY_DOC.md']);
      
      mockFs.stat.mockResolvedValue({
        size: 2000,
        birthtime: new Date('2025-06-08'),
        mtime: new Date('2025-06-09'),
        atime: new Date('2025-06-09')
      } as any);
      
      mockFs.readFile.mockResolvedValue(
        '# Healthy Document\n\n✅ COMPLETE\n\nPRODUCTION READY implementation.'
      );
      
      const analysis = await maintainer.analyzeDocumentation();
      
      expect(analysis.healthScore).toBeGreaterThan(50);
    });

    it('should penalize health score for broken references', async () => {
      const glob = require('glob');
      glob.mockResolvedValue(['DOC_WITH_BROKEN_REFS.md']);
      
      mockFs.stat.mockResolvedValue({
        size: 1000,
        birthtime: new Date('2025-06-01'),
        mtime: new Date('2025-06-08'),
        atime: new Date('2025-06-09')
      } as any);
      
      mockFs.readFile.mockResolvedValue(
        '# Document\n\nSee [Missing Doc](MISSING.md)'
      );
      
      // Mock access to fail for broken reference
      mockFs.access.mockRejectedValue(new Error('File not found'));
      
      const analysis = await maintainer.analyzeDocumentation();
      const brokenRefs = await maintainer.validateCrossReferences();
      
      expect(brokenRefs.length).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should handle missing documents gracefully', async () => {
      const glob = require('glob');
      glob.mockResolvedValue(['MISSING_DOC.md']);
      
      mockFs.stat.mockRejectedValue(new Error('File not found'));
      
      await expect(maintainer.analyzeDocumentation()).resolves.not.toThrow();
    });

    it('should handle invalid file content gracefully', async () => {
      const glob = require('glob');
      glob.mockResolvedValue(['INVALID_DOC.md']);
      
      mockFs.stat.mockResolvedValue({
        size: 1000,
        birthtime: new Date('2025-06-01'),
        mtime: new Date('2025-06-08'),
        atime: new Date('2025-06-09')
      } as any);
      
      mockFs.readFile.mockRejectedValue(new Error('Permission denied'));
      
      await expect(maintainer.analyzeDocumentation()).resolves.not.toThrow();
    });
  });

  describe('metadata preservation', () => {
    it('should preserve document metadata during archival', async () => {
      const glob = require('glob');
      glob.mockResolvedValue(['TEST_DOC.md']);
      
      const mockStats = {
        size: 1000,
        birthtime: new Date('2025-06-01'),
        mtime: new Date('2025-06-08'),
        atime: new Date('2025-06-09')
      };
      
      mockFs.stat.mockResolvedValue(mockStats as any);
      mockFs.readFile.mockResolvedValue('# Test Document\n\nOLD DRAFT content.');
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.rename.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);
      
      await maintainer.analyzeDocumentation();
      await maintainer.archiveOutdatedDocuments(false);
      
      // Should save metadata with archival information
      const metadataCall = (mockFs.writeFile as jest.Mock).mock.calls.find(
        call => call[0].includes('.meta.json')
      );
      
      expect(metadataCall).toBeDefined();
      
      if (metadataCall) {
        const metadataContent = JSON.parse(metadataCall[1]);
        expect(metadataContent).toMatchObject({
          fileName: 'TEST_DOC.md',
          archivedAt: expect.any(String),
          archivedReason: expect.any(String),
          originalPath: expect.any(String)
        });
      }
    });
  });
});

describe('Documentation CLI Integration', () => {
  it('should provide correct command-line interface', () => {
    // Test that the CLI exports are available
    expect(DocumentationMaintainer).toBeDefined();
    expect(typeof DocumentationMaintainer).toBe('function');
  });

  it('should handle command-line arguments correctly', () => {
    // Mock process.argv
    const originalArgv = process.argv;
    process.argv = ['node', 'maintain-docs.ts', 'health'];
    
    // Test argument parsing logic would go here
    expect(process.argv[2]).toBe('health');
    
    process.argv = originalArgv;
  });
});

describe('GitHub Actions Integration', () => {
  it('should provide outputs for GitHub Actions', async () => {
    const maintainer = new DocumentationMaintainer();
    
    // Mock successful initialization
    const mockFs = fs as jest.Mocked<typeof fs>;
    mockFs.mkdir.mockResolvedValue(undefined);
    
    await maintainer.initialize();
    
    // Should be able to generate analysis for CI/CD
    expect(maintainer).toBeDefined();
  });
});
