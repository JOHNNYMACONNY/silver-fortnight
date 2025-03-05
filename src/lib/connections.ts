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
  Timestamp 
} from 'firebase/firestore';
import { getDb } from './firebase';
import { Connection, UserProfile } from '../types';
import { showError, showSuccess } from './alerts';

// Send a connection request
export async function sendConnectionRequest(fromUserId: string, toUserId: string): Promise<void> {
  try {
    // Check if connection already exists
    const db = await getDb();
    const connectionsRef = collection(db, `users/${toUserId}/connections`);
    const q = query(connectionsRef, where('userId', '==', fromUserId));
    const existingConnections = await getDocs(q);

    if (!existingConnections.empty) {
      throw new Error('Connection request already exists');
    }

    // Create connection request
    const connectionId = `${fromUserId}_${toUserId}`;
    await setDoc(doc(await getDb(), `users/${toUserId}/connections`, connectionId), {
      userId: fromUserId,
      status: 'pending',
      timestamp: serverTimestamp()
    });

    await showSuccess('Connection Request Sent', 'Your request has been sent successfully');
  } catch (error) {
    console.error('Error sending connection request:', error);
    await showError(
      'Failed to Send Request',
      error instanceof Error ? error.message : 'An unexpected error occurred'
    );
    throw error;
  }
}

// Accept a connection request
export async function acceptConnectionRequest(userId: string, connectionId: string): Promise<void> {
  try {
    const db = await getDb();
    const connectionRef = doc(db, `users/${userId}/connections`, connectionId);
    const connectionDoc = await getDoc(connectionRef);

    if (!connectionDoc.exists()) {
      throw new Error('Connection request not found');
    }

    const connection = connectionDoc.data() as Connection;
    if (connection.status !== 'pending') {
      throw new Error('Connection request is no longer pending');
    }

    // Update status to accepted
    await updateDoc(connectionRef, {
      status: 'accepted',
      timestamp: serverTimestamp()
    });

    // Create reciprocal connection
    const reciprocalId = `${userId}_${connection.userId}`;
    await setDoc(doc(await getDb(), `users/${connection.userId}/connections`, reciprocalId), {
      userId: userId,
      status: 'accepted',
      timestamp: serverTimestamp()
    });

    await showSuccess('Connection Accepted', 'You are now connected!');
  } catch (error) {
    console.error('Error accepting connection request:', error);
    await showError(
      'Failed to Accept Request',
      error instanceof Error ? error.message : 'An unexpected error occurred'
    );
    throw error;
  }
}

// Decline a connection request
export async function declineConnectionRequest(userId: string, connectionId: string): Promise<void> {
  try {
    const db = await getDb();
    const connectionRef = doc(db, `users/${userId}/connections`, connectionId);
    await deleteDoc(connectionRef);
    await showSuccess('Connection Declined', 'The connection request has been declined');
  } catch (error) {
    console.error('Error declining connection request:', error);
    await showError(
      'Failed to Decline Request',
      error instanceof Error ? error.message : 'An unexpected error occurred'
    );
    throw error;
  }
}

// Remove a connection
export async function removeConnection(userId: string, connectionId: string): Promise<void> {
  try {
    // Get connection details first
    const db = await getDb();
    const connectionRef = doc(db, `users/${userId}/connections`, connectionId);
    const connectionDoc = await getDoc(connectionRef);

    if (!connectionDoc.exists()) {
      throw new Error('Connection not found');
    }

    const connection = connectionDoc.data() as Connection;

    // Remove connection from both users
    await deleteDoc(connectionRef);
    const reciprocalId = `${userId}_${connection.userId}`;
    await deleteDoc(doc(await getDb(), `users/${connection.userId}/connections`, reciprocalId));

    await showSuccess('Connection Removed', 'The connection has been removed from your network');
  } catch (error) {
    console.error('Error removing connection:', error);
    await showError(
      'Failed to Remove Connection',
      error instanceof Error ? error.message : 'An unexpected error occurred'
    );
    throw error;
  }
}

// Check if users are connected
export async function checkConnectionStatus(userId: string, otherUserId: string): Promise<'none' | 'pending' | 'accepted'> {
  try {
    const db = await getDb();
    const connectionRef = doc(db, `users/${userId}/connections`, `${otherUserId}_${userId}`);
    const connectionDoc = await getDoc(connectionRef);

    if (!connectionDoc.exists()) {
      return 'none';
    }

    return connectionDoc.data().status as 'pending' | 'accepted';
  } catch (error) {
    console.error('Error checking connection status:', error);
    throw error;
  }
}
