#!/usr/bin/env node

/**
 * Message System Diagnostic Script
 * 
 * This script helps diagnose why messages aren't displaying on the messages page.
 * Run with: node scripts/diagnose-messages.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, orderBy, getDocs, doc, getDoc } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

// Firebase configuration - you'll need to replace these with your actual values
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "your-api-key",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
};

async function diagnoseMessages() {
  console.log('🔍 Starting message system diagnosis...\n');
  
  try {
    // Initialize Firebase
    console.log('1. Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);
    
    console.log('✅ Firebase initialized successfully\n');
    
    // Check if user is authenticated
    console.log('2. Checking authentication...');
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log('❌ No authenticated user found');
      console.log('💡 Try logging in to the application first\n');
      return;
    }
    
    console.log(`✅ User authenticated: ${currentUser.uid} (${currentUser.email})\n`);
    
    // Check conversations
    console.log('3. Checking conversations...');
    const conversationsRef = collection(db, 'conversations');
    const conversationsQuery = query(
      conversationsRef,
      where('participantIds', 'array-contains', currentUser.uid),
      orderBy('updatedAt', 'desc')
    );
    
    const conversationsSnapshot = await getDocs(conversationsQuery);
    console.log(`📋 Found ${conversationsSnapshot.size} conversations`);
    
    if (conversationsSnapshot.empty) {
      console.log('❌ No conversations found for this user');
      console.log('💡 This user may not have any conversations yet\n');
      return;
    }
    
    // Check messages in each conversation
    console.log('\n4. Checking messages in conversations...');
    let totalMessages = 0;
    
    for (const conversationDoc of conversationsSnapshot.docs) {
      const conversationData = conversationDoc.data();
      console.log(`\n📝 Conversation: ${conversationDoc.id}`);
      console.log(`   Type: ${conversationData.type || 'unknown'}`);
      console.log(`   Participants: ${conversationData.participantIds?.length || 0}`);
      console.log(`   Last Update: ${conversationData.updatedAt?.toDate?.() || 'unknown'}`);
      
      // Check messages in this conversation
      const messagesRef = collection(db, 'conversations', conversationDoc.id, 'messages');
      const messagesQuery = query(messagesRef, orderBy('createdAt', 'asc'));
      
      try {
        const messagesSnapshot = await getDocs(messagesQuery);
        const messageCount = messagesSnapshot.size;
        totalMessages += messageCount;
        
        console.log(`   Messages: ${messageCount}`);
        
        if (messageCount > 0) {
          console.log('   Recent messages:');
          const recentMessages = messagesSnapshot.docs.slice(-3);
          recentMessages.forEach((msgDoc, index) => {
            const msgData = msgDoc.data();
            const sender = msgData.senderName || msgData.senderId || 'Unknown';
            const content = msgData.content || 'No content';
            const time = msgData.createdAt?.toDate?.() || 'Unknown time';
            console.log(`     ${index + 1}. ${sender}: "${content.substring(0, 50)}..." (${time})`);
          });
        }
      } catch (error) {
        console.log(`   ❌ Error loading messages: ${error.message}`);
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   Total conversations: ${conversationsSnapshot.size}`);
    console.log(`   Total messages: ${totalMessages}`);
    
    if (totalMessages === 0) {
      console.log('\n❌ No messages found in any conversation');
      console.log('💡 Possible causes:');
      console.log('   - Messages were never created');
      console.log('   - Messages are in a different database structure');
      console.log('   - Permission issues preventing message access');
    } else {
      console.log('\n✅ Messages found! If they\'re not displaying in the UI:');
      console.log('   - Check browser console for JavaScript errors');
      console.log('   - Verify the MessageList component is receiving the data');
      console.log('   - Check if there are authentication/permission issues');
    }
    
  } catch (error) {
    console.error('❌ Diagnosis failed:', error.message);
    console.log('\n💡 Common fixes:');
    console.log('   - Check your Firebase configuration');
    console.log('   - Ensure you\'re logged in to the application');
    console.log('   - Verify Firestore rules allow reading conversations/messages');
    console.log('   - Check network connectivity');
  }
}

// Run the diagnosis
diagnoseMessages().catch(console.error);