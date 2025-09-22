// Test importing the mock file directly
import * as MockFirebase from '../__mocks__/firebase-config-simple.js';

describe('Direct Mock Import', () => {
  it('should import mock functions directly', () => {
    console.log('Direct import of mock file:');
    console.log('MockFirebase:', MockFirebase);
    console.log('getAuth type:', typeof MockFirebase.getAuth);
    console.log('getSyncFirebaseDb type:', typeof MockFirebase.getSyncFirebaseDb);
    console.log('initializeApp type:', typeof MockFirebase.initializeApp);
    
    expect(MockFirebase.getAuth).toBeDefined();
    expect(MockFirebase.getSyncFirebaseDb).toBeDefined();
  });
});
