import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { db } from '../db';

const router = Router();

// Validation schema for connection request
const connectionSchema = z.object({
  fromUserId: z.string(),
  toUserId: z.string()
});

/**
 * POST /api/connections
 * Create a new connection request
 */
router.post('/', async (req, res) => {
  try {
    // Validate request body
    const result = connectionSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: result.error.issues
      });
    }

    const { fromUserId, toUserId } = result.data;

    // Validate users exist
    const usersCollection = db.collection('users');
    const [fromUser, toUser] = await Promise.all([
      usersCollection.findOne({ _id: new ObjectId(fromUserId) }),
      usersCollection.findOne({ _id: new ObjectId(toUserId) })
    ]);

    if (!fromUser || !toUser) {
      return res.status(404).json({
        error: 'One or both users not found'
      });
    }

    // Check if connection already exists
    const connectionsCollection = db.collection('connections');
    const existingConnection = await connectionsCollection.findOne({
      $or: [
        { fromUserId, toUserId, status: { $in: ['pending', 'accepted'] } },
        { fromUserId: toUserId, toUserId: fromUserId, status: { $in: ['pending', 'accepted'] } }
      ]
    });

    if (existingConnection) {
      return res.status(409).json({
        error: 'Connection request already exists',
        status: existingConnection.status
      });
    }

    // Create connection request
    const now = new Date();
    const connectionRequest = {
      fromUserId,
      toUserId,
      status: 'pending',
      createdAt: now,
      updatedAt: now
    };

    const result = await connectionsCollection.insertOne(connectionRequest);

    // Update user's connections array
    await usersCollection.updateOne(
      { _id: new ObjectId(toUserId) },
      { 
        $push: { 
          pendingConnections: {
            userId: fromUserId,
            connectionId: result.insertedId,
            createdAt: now
          }
        }
      }
    );

    return res.status(201).json({
      message: 'Connection request sent successfully',
      connectionId: result.insertedId,
      status: 'pending'
    });

  } catch (error) {
    console.error('Error creating connection request:', error);
    
    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('Invalid ObjectId')) {
        return res.status(400).json({
          error: 'Invalid user ID format'
        });
      }
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create connection request'
    });
  }
});

export default router;