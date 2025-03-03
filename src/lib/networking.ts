import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { getDb } from './firebase';
import { Connection, UserProfile } from '../types';
import { showError, showSuccess } from './alerts';

// Send a connection request
export async function sendConnectionRequest(fromUserId: string, toUserId: string): Promise<void> {
  try {
    // Validate users
    if (!fromUserId || !toUserId) {
      throw new Error('Both user IDs are required');
    }

    if (fromUserId === toUserId) {
      throw new Error('Cannot connect with yourself');
    }

    const db = await getDb();

    // Check if users exist
    const [fromUser, toUser] = await Promise.all([
      getDoc(doc(db, 'users', fromUserId)),
      getDoc(doc(db, 'users', toUserId))
    ]);

    if (!fromUser.exists() || !toUser.exists()) {
      throw new Error('One or both users not found');
    }

    // Check for existing connections in both collections
    const [receivedRequest, sentRequest] = await Promise.all([
      getDocs(query(
        collection(db, `users/${toUserId}/connections`),
        where('userId', '==', fromUserId)
      )),
      getDocs(query(
        collection(db, `users/${fromUserId}/sent_requests`),
        where('userId', '==', toUserId)
      ))
    ]);

    if (!receivedRequest.empty || !sentRequest.empty) {
      throw new Error('Connection request already exists');
    }

    // Create connection requests in batch
    const batch = writeBatch(db);
    const timestamp = serverTimestamp();

    // Add to recipient's connections
    batch.set(doc(db, `users/${toUserId}/connections`, `${fromUserId}_${toUserId}`), {
      userId: fromUserId,
      status: 'pending',
      timestamp
    });

    // Add to sender's sent_requests
    batch.set(doc(db, `users/${fromUserId}/sent_requests`, `${fromUserId}_${toUserId}`), {
      userId: toUserId,
      status: 'pending',
      timestamp
    });

    await batch.commit();
    await showSuccess('Request Sent', 'Your connection request has been sent successfully');
  } catch (error) {
    console.error('Error sending connection request:', error);
    await showError(
      'Failed to Send Request',
      error instanceof Error ? error.message : 'An unexpected error occurred'
    );
    throw error;
  }
}

// Get connection status between two users
export async function getConnectionStatus(userId: string, otherUserId: string): Promise<'none' | 'pending' | 'accepted'> {
  try {
    if (!userId || !otherUserId) {
      throw new Error('Both user IDs are required');
    }

    const db = await getDb();
    
    // Check both received and sent requests
    const [receivedRequest, sentRequest] = await Promise.all([
      getDocs(query(
        collection(db, `users/${userId}/connections`),
        where('userId', '==', otherUserId)
      )),
      getDocs(query(
        collection(db, `users/${userId}/sent_requests`),
        where('userId', '==', otherUserId)
      ))
    ]);

    // Check received requests first
    if (!receivedRequest.empty) {
      return receivedRequest.docs[0].data().status as 'pending' | 'accepted';
    }

    // Then check sent requests
    if (!sentRequest.empty) {
      return sentRequest.docs[0].data().status as 'pending' | 'accepted';
    }

    return 'none';
  } catch (error) {
    console.error('Error checking connection status:', error);
    throw error;
  }
}
