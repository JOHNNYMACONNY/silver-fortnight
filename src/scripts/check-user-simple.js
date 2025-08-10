// Script to check user data in Firebase
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');

// Firebase configuration - hardcoded for this script only
const firebaseConfig = {
  apiKey: "AIzaSyDQPFgXXXXXXXXXXXXXXXXXXXXXXXXXXXX", // Replace with actual API key
  authDomain: "tradeya-45ede.firebaseapp.com",
  projectId: "tradeya-45ede",
  storageBucket: "tradeya-45ede.appspot.com",
  messagingSenderId: "1234567890", // Replace with actual sender ID
  appId: "1:1234567890:web:abcdef1234567890" // Replace with actual app ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// User ID to check
const userId = 'TozfQg0dAHe4ToLyiSnkDqe3ECj2';

async function checkUser() {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      console.log('User data:', userSnap.data());
    } else {
      console.log('No such user!');
    }
  } catch (error) {
    console.error('Error getting user:', error);
  }
}

checkUser();
