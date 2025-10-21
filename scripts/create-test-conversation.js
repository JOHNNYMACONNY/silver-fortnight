/**
 * Create Test Conversation Script
 * 
 * This script creates a test conversation for the current user to verify
 * that the messaging system works correctly.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyBvQvQvQvQvQvQvQvQvQvQvQvQvQvQvQvQ",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "tradeya-45ede.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "tradeya-45ede",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "tradeya-45ede.appspot.com",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
};

async function createTestConversation() {
  try {
    console.log('Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    const userId = 'TozfQg0dAHe4ToLyiSnkDqe3ECj2'; // The user ID from the error message

    console.log(`Creating test conversation for user: ${userId}`);

    // Create a test conversation
    const testConversation = {
      participants: [
        { 
          id: userId, 
          name: 'Test User', 
          avatar: null 
        },
        { 
          id: 'test-user-2', 
          name: 'Test User 2', 
          avatar: null 
        }
      ],
      participantIds: [userId, 'test-user-2'],
      type: 'direct',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      schemaVersion: '2.0.0',
      lastMessage: {
        content: 'Welcome to your first conversation!',
        senderId: 'test-user-2',
        createdAt: Timestamp.now(),
        type: 'text'
      }
    };

    // Add the conversation to Firestore
    const conversationsRef = collection(db, 'conversations');
    const docRef = await addDoc(conversationsRef, testConversation);
    
    console.log(`✅ Test conversation created successfully with ID: ${docRef.id}`);

    // Create a test message
    const testMessage = {
      conversationId: docRef.id,
      senderId: 'test-user-2',
      senderName: 'Test User 2',
      senderAvatar: null,
      content: 'This is a test message to verify the messaging system is working!',
      type: 'text',
      createdAt: Timestamp.now(),
      readBy: [],
      schemaVersion: '2.0.0'
    };

    const messagesRef = collection(db, 'conversations', docRef.id, 'messages');
    const messageRef = await addDoc(messagesRef, testMessage);
    
    console.log(`✅ Test message created successfully with ID: ${messageRef.id}`);
    console.log('🎉 Test conversation and message setup complete!');
    console.log('You can now refresh the messages page to see the conversation.');

  } catch (error) {
    console.error('❌ Error creating test conversation:', error);
    process.exit(1);
  }
}

// Run the script
createTestConversation();