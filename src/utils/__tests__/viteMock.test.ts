import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import {
  mockEnv,
  loadEnv,
  defineConfig,
  createServer,
  transformWithEsbuild,
  createFilter,
  normalizePath,
  mergeConfig,
  build,
  preview,
  meta
} from '../__mocks__/viteMock';

describe('Vite Mock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should provide test environment variables', () => {
    expect(mockEnv.MODE).toBe('test');
    expect(mockEnv.VITE_FIREBASE_API_KEY).toBe('mock-api-key');
    expect(mockEnv.VITE_FIREBASE_PROJECT_ID).toBe('mock-project-id');
    expect(mockEnv.DEV).toBe(true);
    expect(mockEnv.PROD).toBe(false);
  });

  it('should load environment variables', () => {
    const env = loadEnv();
    expect(env.VITE_FIREBASE_API_KEY).toBe('mock-api-key');
    expect(env.VITE_CLOUDINARY_CLOUD_NAME).toBe('mock-cloud-name');
    expect(env.VITE_CLOUDINARY_UPLOAD_PRESET).toBe('mock-upload-preset');
  });

  it('should handle configuration', () => {
    const config = { test: true };
    const result = defineConfig(config);
    expect(result).toEqual(config);

    const merged = mergeConfig({ a: 1 }, { b: 2 });
    expect(merged).toEqual({ a: 1, b: 2 });
  });

  it('should provide server functions', () => {
    const server = createServer();
    expect(typeof server.listen).toBe('function');
    expect(typeof server.close).toBe('function');

    server.listen();
    expect(server.listen).toHaveBeenCalled();
  });

  it('should provide build functions', () => {
    expect(typeof build).toBe('function');
    expect(typeof preview).toBe('function');
    expect(typeof transformWithEsbuild).toBe('function');
    expect(typeof createFilter).toBe('function');
    expect(typeof normalizePath).toBe('function');
  });

  it('should handle path normalization', () => {
    const path = 'test/path';
    expect(normalizePath(path)).toBe(path);
  });

  it('should merge configurations correctly', () => {
    const base = { a: 1, b: 2 };
    const override = { b: 3, c: 4 };
    const result = mergeConfig(base, override);
    expect(result).toEqual({ a: 1, b: 3, c: 4 });
  });
});

describe('Global Environment Setup', () => {
  it('should make environment variables available globally', () => {
    expect(global.__vite_env__).toBeDefined();
    expect(global.__vite_env__.VITE_FIREBASE_API_KEY).toBe('mock-api-key');
    expect(global.__vite_env__.VITE_FIREBASE_PROJECT_ID).toBe('mock-project-id');
  });

  it('should provide importMeta.env access', () => {
    expect(global.importMeta).toBeDefined();
    expect(global.importMeta.env).toEqual(mockEnv);
    expect(global.importMeta.env.VITE_FIREBASE_API_KEY).toBe('mock-api-key');
  });

  it('should provide consistent environment values', () => {
    const envFromLoad = loadEnv();
    const envFromGlobal = global.__vite_env__;
    const envFromMeta = global.importMeta.env;

    const expectedValues = {
      MODE: 'test',
      DEV: true,
      PROD: false,
      SSR: false,
      VITE_FIREBASE_API_KEY: 'mock-api-key',
      VITE_FIREBASE_PROJECT_ID: 'mock-project-id',
      VITE_CLOUDINARY_CLOUD_NAME: 'mock-cloud-name',
      VITE_CLOUDINARY_UPLOAD_PRESET: 'mock-upload-preset'
    };

    Object.entries(expectedValues).forEach(([key, value]) => {
      expect(envFromLoad[key]).toBe(value);
      expect(envFromGlobal[key]).toBe(value);
      expect(envFromMeta[key]).toBe(value);
    });
  });

  it('should expose meta object correctly', () => {
    expect(meta.env).toBeDefined();
    expect(meta.env).toEqual(mockEnv);
    expect(meta.env.VITE_FIREBASE_API_KEY).toBe('mock-api-key');
  });
});