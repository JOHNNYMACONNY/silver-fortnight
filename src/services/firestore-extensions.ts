/**
 * Additional Firestore functions that are missing from the main firestore.ts
 * These functions extend the functionality for connections, challenges, and system stats.
 */

import { getSyncFirebaseDb } from '../firebase-config';
import { 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  collection, 
  addDoc, 
  Timestamp,
  query,
  where,
  writeBatch,
  orderBy,
  arrayUnion,
  limit as limitQuery,
  deleteDoc,
  updateDoc,
  startAfter,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  QueryConstraint,
  arrayRemove
} from 'firebase/firestore';
import { ServiceResult } from '../types/ServiceError';
import { COLLECTIONS, Connection, Challenge, Collaboration, Trade } from './firestore';

// Connection Management Functions
export const getConnections = async (userId: string): Promise<ServiceResult<Connection[]>> => {
  try {
    const db = getSyncFirebaseDb();
    // Query connections subcollection under the user document for accepted connections
    const connectionsRef = collection(db, 'users', userId, 'connections');
    const userConnectionsQuery = query(
      connectionsRef, 
      where('status', '==', 'accepted')
      // Removed orderBy temporarily to avoid index requirement
    );
    
    const connectionDocs = await getDocs(userConnectionsQuery);
    const connections = connectionDocs.docs.map(doc => {
      const data = doc.data() as Record<string, unknown>;
      return Object.assign({ id: doc.id }, data) as unknown as Connection;
    });
    
    return { data: connections, error: null };
  } catch (error: any) {
    console.error('Error getting connections:', error);
    return { data: null, error: { code: error.code || 'unknown', message: error.message || 'Failed to get connections' } };
  }
};

export const getConnectionRequests = async (userId: string): Promise<ServiceResult<Connection[]>> => {
  try {
    const db = getSyncFirebaseDb();
    // Query the user's own connections subcollection for pending requests received
    const connectionsRef = collection(db, 'users', userId, 'connections');
    const requestsQuery = query(
      connectionsRef, 
      where('status', '==', 'pending'),
      where('receiverId', '==', userId) // Use receiverId to identify requests received by current user
      // Removed orderBy temporarily to avoid index requirement
    );
    
    const requestDocs = await getDocs(requestsQuery);
    const requests = requestDocs.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as Connection
    }));
    
    return { data: requests, error: null };
  } catch (error: any) {
    console.error('Error getting connection requests:', error);
    return { data: null, error: { code: error.code || 'unknown', message: error.message || 'Failed to get connection requests' } };
  }
};

export const getSentConnectionRequests = async (userId: string): Promise<ServiceResult<Connection[]>> => {
  try {
    console.log('🔍 getSentConnectionRequests: Starting query for user:', userId);
    
    const db = getSyncFirebaseDb();
    const connectionsRef = collection(db, 'users', userId, 'connections');
    
    // For debugging - let's see ALL connections first
    console.log('🔍 getSentConnectionRequests: Fetching ALL connections to debug...');
    const allConnectionsSnap = await getDocs(connectionsRef);
    console.log(`📊 getSentConnectionRequests: Found ${allConnectionsSnap.size} total connections`);
    
    allConnectionsSnap.docs.forEach(doc => {
      const data = doc.data() as any;
      console.log(`📋 getSentConnectionRequests: Connection ${doc.id}:`, {
        status: data.status,
        userId: data.userId,
        connectedUserId: data.connectedUserId,
        senderId: data.senderId,
        receiverId: data.receiverId,
        senderName: data.senderName,
        receiverName: data.receiverName
      });
    });
    
    // Updated logic: Get all pending connections from this user's subcollection
    // Since they're in the user's own subcollection, they should be connections initiated by them
    const pendingRequestsQuery = query(
      connectionsRef, 
      where('status', '==', 'pending')
      // Removed senderId filter since old connections don't have this field
    );
    
    console.log('🔍 getSentConnectionRequests: Running query for all pending connections in user subcollection...');
    const requestDocs = await getDocs(pendingRequestsQuery);
    console.log(`📊 getSentConnectionRequests: Found ${requestDocs.size} pending connections`);
    
    const requests = requestDocs.docs.map(doc => {
      const data = doc.data() as Connection;
      
      // Filter in memory: only include connections where this user is the sender
      // For new connections: senderId === userId
      // For old connections: userId === userId (connection is in sender's subcollection)
      const isSentByUser = data.senderId === userId || 
                          (data.senderId === undefined && data.userId === userId);
      
      console.log(`🔍 getSentConnectionRequests: Connection ${doc.id} - sent by user: ${isSentByUser}`, {
        senderId: data.senderId,
        userId: data.userId,
        currentUserId: userId,
        receiverName: data.receiverName,
        connectedUserId: data.connectedUserId
      });
      
      return Object.assign({ id: doc.id }, data, { isSentByUser }) as any;
    }).filter(req => (req as any).isSentByUser); // Filter to only sent requests
    
    // Clean up the isSentByUser property before returning
    const cleanRequests = requests.map(req => {
      const { isSentByUser, ...cleanReq } = req as any;
      return cleanReq;
    });
    
    console.log(`🎉 getSentConnectionRequests: Returning ${cleanRequests.length} sent requests`);
    return { data: cleanRequests, error: null };
  } catch (error: any) {
    console.error('❌ getSentConnectionRequests: Error:', error);
    return { data: null, error: { code: error.code || 'unknown', message: error.message || 'Failed to get sent connection requests' } };
  }
};

export const updateConnectionStatus = async (
  userId: string,
  connectionId: string, 
  status: 'accepted' | 'rejected'
): Promise<ServiceResult<void>> => {
  try {
    const db = getSyncFirebaseDb();
    
    // First, get the connection details to find the other user
    const connectionRef = doc(db, 'users', userId, 'connections', connectionId);
    const connectionSnap = await getDoc(connectionRef);
    
    if (!connectionSnap.exists()) {
      return { data: null, error: { code: 'not-found', message: 'Connection not found' } };
    }
    
    const connectionData = connectionSnap.data() as Connection;
    const otherUserId = connectionData.userId === userId ? connectionData.connectedUserId : connectionData.userId;
    
    // Update connection in current user's subcollection
    await updateDoc(connectionRef, {
      status,
      updatedAt: Timestamp.now()
    });
    
    // Find and update the corresponding connection in the other user's subcollection
    const otherUserConnectionsRef = collection(db, 'users', otherUserId, 'connections');
    const otherUserQuery = query(
      otherUserConnectionsRef,
      where('userId', '==', connectionData.userId),
      where('connectedUserId', '==', connectionData.connectedUserId)
    );
    
    const otherUserDocs = await getDocs(otherUserQuery);
    if (!otherUserDocs.empty) {
      // Update the corresponding connection in other user's collection
      const otherUserConnectionRef = otherUserDocs.docs[0].ref;
      await updateDoc(otherUserConnectionRef, {
        status,
        updatedAt: Timestamp.now()
      });
      console.log('✅ updateConnectionStatus: Updated connection in other user\'s subcollection');
    } else {
      console.warn('⚠️ updateConnectionStatus: No matching connection found in other user\'s subcollection');
      console.log('Query details:', {
        otherUserId,
        userId: connectionData.userId,
        connectedUserId: connectionData.connectedUserId
      });
    }
    
    return { data: undefined, error: null };
  } catch (error: any) {
    console.error('Error updating connection status:', error);
    return { data: null, error: { code: error.code || 'unknown', message: error.message || 'Failed to update connection status' } };
  }
};

export const removeConnection = async (userId: string, connectionId: string): Promise<ServiceResult<void>> => {
  try {
    const db = getSyncFirebaseDb();
    
    // First, get the connection details to find the other user
    const connectionRef = doc(db, 'users', userId, 'connections', connectionId);
    const connectionSnap = await getDoc(connectionRef);
    
    if (!connectionSnap.exists()) {
      return { data: null, error: { code: 'not-found', message: 'Connection not found' } };
    }
    
    const connectionData = connectionSnap.data() as Connection;
    const otherUserId = connectionData.userId === userId ? connectionData.connectedUserId : connectionData.userId;
    
    // Remove connection from current user's subcollection
    await deleteDoc(connectionRef);
    
    // Find and remove the corresponding connection in the other user's subcollection
    const otherUserConnectionsRef = collection(db, 'users', otherUserId, 'connections');
    const otherUserQuery = query(
      otherUserConnectionsRef,
      where('userId', '==', connectionData.userId),
      where('connectedUserId', '==', connectionData.connectedUserId)
    );
    
    const otherUserDocs = await getDocs(otherUserQuery);
    if (!otherUserDocs.empty) {
      // Remove the corresponding connection from other user's collection
      await deleteDoc(otherUserDocs.docs[0].ref);
    }
    
    return { data: undefined, error: null };
  } catch (error: any) {
    console.error('Error removing connection:', error);
    return { data: null, error: { code: error.code || 'unknown', message: error.message || 'Failed to remove connection' } };
  }
};

export const createConnectionRequest = async (
  userId: string, 
  connectedUserId: string,
  message?: string
): Promise<ServiceResult<string>> => {
  try {
    console.log('🔍 createConnectionRequest: Starting request creation');
    console.log('🔍 createConnectionRequest: Sender ID:', userId);
    console.log('🔍 createConnectionRequest: Receiver ID:', connectedUserId);
    console.log('🔍 createConnectionRequest: Message:', message);

    const db = getSyncFirebaseDb();
    
    // Check if connection already exists in user's subcollection
    console.log('🔍 createConnectionRequest: Checking for existing connections...');
    const connectionsRef = collection(db, 'users', userId, 'connections');
    const existingQuery = query(
      connectionsRef,
      where('connectedUserId', '==', connectedUserId)
    );
    
    const existingDocs = await getDocs(existingQuery);
    if (!existingDocs.empty) {
      console.log('❌ createConnectionRequest: Connection already exists');
      return { data: null, error: { code: 'already-exists', message: 'Connection request already exists' } };
    }

    // Fetch sender (current user) profile data
    console.log('🔍 createConnectionRequest: Fetching sender profile...');
    const senderRef = doc(db, 'users', userId);
    const senderSnap = await getDoc(senderRef);
    
    if (!senderSnap.exists()) {
      console.error('❌ createConnectionRequest: Sender profile not found');
      return { data: null, error: { code: 'not-found', message: 'Sender profile not found' } };
    }
    
    const senderData = senderSnap.data() as any;
    const senderName = senderData.displayName || senderData.name || senderData.email || `User ${userId.substring(0, 5)}`;
    const senderPhotoURL = senderData.photoURL || senderData.profilePicture;
    console.log('✅ createConnectionRequest: Sender data fetched:', { senderName, senderPhotoURL });

    // Fetch receiver profile data
    console.log('🔍 createConnectionRequest: Fetching receiver profile...');
    const receiverRef = doc(db, 'users', connectedUserId);
    const receiverSnap = await getDoc(receiverRef);
    
    if (!receiverSnap.exists()) {
      console.error('❌ createConnectionRequest: Receiver profile not found');
      return { data: null, error: { code: 'not-found', message: 'Receiver profile not found' } };
    }
    
    const receiverData = receiverSnap.data() as any;
    const receiverName = receiverData.displayName || receiverData.name || receiverData.email || `User ${connectedUserId.substring(0, 5)}`;
    const receiverPhotoURL = receiverData.photoURL || receiverData.profilePicture;
    console.log('✅ createConnectionRequest: Receiver data fetched:', { receiverName, receiverPhotoURL });
    
    const connectionData: Omit<Connection, 'id'> = {
      userId,
      connectedUserId,
      status: 'pending',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      message: message || '',
      // Add fields needed by ConnectionCard
      senderId: userId,
      receiverId: connectedUserId,
      senderName,
      receiverName,
      senderPhotoURL,
      receiverPhotoURL
    };
    
    console.log('🔍 createConnectionRequest: Creating connection documents...');
    console.log('🔍 createConnectionRequest: Connection data:', connectionData);
    
    // Create connection in sender's subcollection
    const docRef = await addDoc(connectionsRef, connectionData);
    console.log('✅ createConnectionRequest: Created sender connection:', docRef.id);
    
    // Also create the same connection in recipient's subcollection for easier querying
    const recipientConnectionsRef = collection(db, 'users', connectedUserId, 'connections');
    await addDoc(recipientConnectionsRef, {
      ...connectionData  // Keep all the same data including names and photos
    });
    console.log('✅ createConnectionRequest: Created recipient connection');
    
    console.log('🎉 createConnectionRequest: Connection request created successfully!');
    return { data: docRef.id, error: null };
  } catch (error: any) {
    console.error('❌ createConnectionRequest: Error creating connection request:', error);
    return { data: null, error: { code: error.code || 'unknown', message: error.message || 'Failed to create connection request' } };
  }
};

// Challenge Functions
export const getChallenge = async (challengeId: string): Promise<ServiceResult<Challenge | undefined>> => {
  try {
    const db = getSyncFirebaseDb();
    const challengeDoc = await getDoc(doc(db, COLLECTIONS.CHALLENGES, challengeId));
    if (challengeDoc.exists()) {
      const data = challengeDoc.data() as Record<string, unknown>;
      return { data: Object.assign({ id: challengeDoc.id }, data) as unknown as Challenge, error: null };
    } else {
      return { data: undefined, error: null };
    }
  } catch (error: any) {
    console.error('Error getting challenge:', error);
    return { data: null, error: { code: error.code || 'unknown', message: error.message || 'Failed to get challenge' } };
  }
};

// System Stats
export interface SystemStats {
  totalUsers: number;
  totalTrades: number;
  totalCollaborations: number;
  totalChallenges: number;
  activeUsers: number; // Placeholder for more complex logic
  completedTrades: number;
  lastUpdated: Timestamp;
}

export const getSystemStats = async (): Promise<ServiceResult<SystemStats>> => {
  try {
    const db = getSyncFirebaseDb();
    const users = await getDocs(collection(db, COLLECTIONS.USERS));
    const trades = await getDocs(collection(db, COLLECTIONS.TRADES));
    const collaborations = await getDocs(collection(db, COLLECTIONS.COLLABORATIONS));
    const challenges = await getDocs(collection(db, COLLECTIONS.CHALLENGES));

    const completedTradesQuery = query(collection(db, COLLECTIONS.TRADES), where('status', '==', 'completed'));
    const completedTrades = await getDocs(completedTradesQuery);

    const stats: SystemStats = {
      totalUsers: users.size,
      totalTrades: trades.size,
      totalCollaborations: collaborations.size,
      totalChallenges: challenges.size,
      activeUsers: users.size, // Simplified - in reality would check last activity
      completedTrades: completedTrades.size,
      lastUpdated: Timestamp.now()
    };

    return { data: stats, error: null };
  } catch (error: any) {
    console.error('Error getting system stats:', error);
    return { data: null, error: { code: error.code || 'unknown', message: error.message || 'Failed to get system stats' } };
  }
};