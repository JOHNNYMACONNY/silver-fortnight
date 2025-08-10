import { ImportMetaEnv } from '../__mocks__/viteMock';

declare global {
  var __vite_env__: ImportMetaEnv;
  var importMeta: {
    env: ImportMetaEnv;
  };

  namespace NodeJS {
    interface Global {
      __vite_env__: ImportMetaEnv;
      importMeta: {
        env: ImportMetaEnv;
      };
    }
  }

  interface Window {
    __vite_env__?: ImportMetaEnv;
  }
}

// Add support for Jest's mocked utility
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeAllowed(): Promise<R>;
      toBeDenied(): Promise<R>;
    }
  }
}

// Jest mocked utility type
declare module '@jest/globals' {
  function mocked<T>(item: T, deep?: boolean): jest.MockedObject<T>;
}

// Add jest.mocked to global jest
declare namespace jest {
  function mocked<T>(item: T, deep?: boolean): jest.MockedObject<T>;
}

// Export an empty object to make this a module
export {};