// Debug test to see what's actually being imported
describe('Debug Imports', () => {
  it('should debug firebase/auth import', () => {
    console.log('Testing firebase/auth import...');
    try {
      const firebaseAuth = require('firebase/auth');
      console.log('firebase/auth module:', firebaseAuth);
      console.log('getAuth type:', typeof firebaseAuth.getAuth);
    } catch (error) {
      console.error('Error importing firebase/auth:', error);
    }
  });

  it('should debug firebase-config import', () => {
    console.log('Testing firebase-config import...');
    try {
      const firebaseConfig = require('../firebase-config');
      console.log('firebase-config module:', firebaseConfig);
      console.log('getSyncFirebaseDb type:', typeof firebaseConfig.getSyncFirebaseDb);
    } catch (error) {
      console.error('Error importing firebase-config:', error);
    }
  });

  it('should debug mock file import', () => {
    console.log('Testing mock file import...');
    try {
      const mockFile = require('../__mocks__/firebase-config');
      console.log('mock file module:', mockFile);
      console.log('getSyncFirebaseDb type:', typeof mockFile.getSyncFirebaseDb);
    } catch (error) {
      console.error('Error importing mock file:', error);
    }
  });
});
