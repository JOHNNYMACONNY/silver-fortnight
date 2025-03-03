import { 
  collection,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { getDb } from './firebase';
import type { 
  TradeRequest, 
  ProjectPositionRequest, 
  RequestStatus, 
  RequestType,
  RequestNotification 
} from '../types/requests';
import { createContextConversation } from './messaging';

/**
 * Creates a new trade request
 */
export async function createTradeRequest(
  senderId: string,
  recipientId: string,
  tradeId: string,
  tradeName: string,
  type: RequestType,
  message?: string,
  expiresAt?: Date
): Promise<string> {
  try {
    // Validate inputs
    if (!senderId || !recipientId || !tradeId || !tradeName) {
      throw new Error('Required fields missing for trade request');
    }

    // Validate sender != recipient
    if (senderId === recipientId) {
      throw new Error('Cannot send trade request to yourself');
    }

    // Check if request already exists
    const db = await getDb();
    const existingRequest = await getDocs(
      query(
        collection(db, 'tradeRequests'),
        where('tradeId', '==', tradeId),
        where('senderId', '==', senderId),
        where('recipientId', '==', recipientId),
        where('status', '==', 'pending')
      )
    );

    if (!existingRequest.empty) {
      throw new Error('A pending request already exists for this trade');
    }

    const request: Omit<TradeRequest, 'id'> = {
      senderId,
      recipientId,
      tradeId,
      tradeName,
      type,
      status: 'pending',
      message: message?.trim() || null,
      createdAt: Timestamp.now(),
      expiresAt: expiresAt ? Timestamp.fromDate(expiresAt) : undefined,
      notificationSent: false
    };

    const requestRef = await addDoc(collection(await getDb(), 'tradeRequests'), request);
    await createRequestNotification(recipientId, requestRef.id, 'trade_request');
    
    // Create a trade-specific conversation
    await createContextConversation(senderId, [recipientId], 'trade', tradeId, tradeName);

    return requestRef.id;
  } catch (error) {
    console.error('Error creating trade request:', error);
    throw error;
  }
}

/**
 * Creates a new project position request
 */
export async function createProjectRequest(
  senderId: string,
  recipientId: string,
  projectId: string,
  projectName: string,
  positionId: string,
  positionName: string,
  type: RequestType,
  requiredSkills?: string[],
  proposedSkills?: string[],
  message?: string,
  expiresAt?: Date
): Promise<string> {
  try {
    // Validate inputs
    if (!senderId || !recipientId || !projectId || !projectName || !positionId || !positionName) {
      throw new Error('Required fields missing for project request');
    }

    // Validate sender != recipient
    if (senderId === recipientId) {
      throw new Error('Cannot send project request to yourself');
    }

    // Check if request already exists
    const db = await getDb();
    const existingRequest = await getDocs(
      query(
        collection(db, 'projectRequests'),
        where('projectId', '==', projectId),
        where('positionId', '==', positionId),
        where('senderId', '==', senderId),
        where('recipientId', '==', recipientId),
        where('status', '==', 'pending')
      )
    );

    if (!existingRequest.empty) {
      throw new Error('A pending request already exists for this position');
    }

    // Validate skills if provided
    if (requiredSkills?.length && proposedSkills?.length) {
      const invalidSkills = proposedSkills.filter(skill => !requiredSkills.includes(skill));
      if (invalidSkills.length > 0) {
        throw new Error(`Invalid skills provided: ${invalidSkills.join(', ')}`);
      }
    }

    const request: Omit<ProjectPositionRequest, 'id'> = {
      senderId,
      recipientId,
      projectId,
      projectName,
      positionId,
      positionName,
      type,
      status: 'pending',
      requiredSkills: requiredSkills || [],
      proposedSkills: proposedSkills || [],
      message: message?.trim() || null,
      createdAt: Timestamp.now(),
      expiresAt: expiresAt ? Timestamp.fromDate(expiresAt) : undefined,
      notificationSent: false
    };

    const requestRef = await addDoc(collection(await getDb(), 'projectRequests'), request);
    await createRequestNotification(recipientId, requestRef.id, 'project_request');
    
    // Create a project-specific conversation
    await createContextConversation(senderId, [recipientId], 'project', projectId, projectName);

    return requestRef.id;
  } catch (error) {
    console.error('Error creating project request:', error);
    throw error;
  }
}

/**
 * Updates the status of a request
 */
export async function updateRequestStatus(
  requestId: string,
  collectionName: 'tradeRequests' | 'projectRequests',
  status: RequestStatus,
  userId: string // Add userId parameter for validation
): Promise<void> {
  try {
    const db = await getDb();
    const requestRef = doc(db, collectionName, requestId);
    const request = await getDoc(requestRef);
    
    if (!request.exists()) {
      throw new Error('Request not found');
    }

    // Verify user has permission to update status
    const requestData = request.data();
    if (requestData.recipientId !== userId) {
      throw new Error('Only the request recipient can update the status');
    }

    // Don't allow status updates for already accepted/declined requests
    if (requestData.status !== 'pending') {
      throw new Error(`Request is already ${requestData.status}`);
    }

    await updateDoc(requestRef, {
      status,
      updatedAt: serverTimestamp(),
      statusUpdatedAt: serverTimestamp(),
      statusUpdatedBy: userId
    });

  } catch (error) {
    console.error('Error updating request status:', error);
    throw error;
  }
}

/**
 * Creates a notification for a new request
 */
async function createRequestNotification(
  recipientId: string,
  requestId: string,
  type: 'trade_request' | 'project_request'
): Promise<void> {
  try {
    const notification: Omit<RequestNotification, 'id'> = {
      requestId,
      recipientId,
      type,
      read: false,
      createdAt: Timestamp.now()
    };

    await addDoc(collection(await getDb(), 'requestNotifications'), notification);
  } catch (error) {
    console.error('Error creating request notification:', error);
    throw error;
  }
}

/**
 * Fetches all requests for a user (both sent and received)
 */
export async function getUserRequests(
  userId: string,
  collectionName: 'tradeRequests' | 'projectRequests'
) {
  try {
    const db = await getDb();
    const requestsRef = collection(db, collectionName);
    const q = query(
      requestsRef,
      where('recipientId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const sentQ = query(
      requestsRef,
      where('senderId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const [receivedSnap, sentSnap] = await Promise.all([
      getDocs(q),
      getDocs(sentQ)
    ]);

    // Fetch sender data and add it to the request object
    const received = await Promise.all(receivedSnap.docs.map(async (doc) => {
      const requestData = doc.data();
      const db = await getDb();
      const senderRef = doc(db, 'users', requestData.senderId);
      const senderSnap = await getDoc(senderRef);
      const senderData = senderSnap.exists() ? { id: senderSnap.id, ...senderSnap.data() } : null;

      return { id: doc.id, ...requestData, sender: senderData };
    }));

    const sent = await Promise.all(sentSnap.docs.map(async (doc) => {
      const requestData = doc.data();
      const db = await getDb();
      const senderRef = doc(db, 'users', requestData.senderId);
      const senderSnap = await getDoc(senderRef);
      const senderData = senderSnap.exists() ? { id: senderSnap.id, ...senderSnap.data() } : null;

      return { id: doc.id, ...requestData, sender: senderData };
    }));

    return {
      received,
      sent
    };
  } catch (error) {
    console.error('Error fetching user requests:', error);
    throw error;
  }
}

/**
 * Marks a request as viewed
 */
export async function markRequestViewed(
  requestId: string,
  collectionName: 'tradeRequests' | 'projectRequests'
): Promise<void> {
  try {
    const db = await getDb();
    const requestRef = doc(db, collectionName, requestId);
    await updateDoc(requestRef, {
      viewedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error marking request as viewed:', error);
    throw error;
  }
}

/**
 * Marks a request notification as read
 */
export async function markNotificationRead(notificationId: string): Promise<void> {
  try {
    const db = await getDb();
    const notificationRef = doc(db, 'requestNotifications', notificationId);
    await updateDoc(notificationRef, {
      read: true
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}
