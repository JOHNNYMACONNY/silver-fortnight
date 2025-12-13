
import 'dotenv/config';
import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const projectId = process.env.VITE_FIREBASE_PROJECT_ID || 'tradeya-45ede';

// Initialize Firebase Admin
if (!getApps().length) {
    try {
        initializeApp({
            credential: applicationDefault(),
            projectId: projectId
        });
    } catch (e) {
        console.error('Failed to init admin SDK.', e);
        process.exit(1);
    }
}

const db = getFirestore();

/**
 * Backfill Message Participants Script (Admin SDK Version)
 */

const BATCH_SIZE = 400;

async function backfillMessageParticipants() {
    console.log(`\n🚀 Starting Message Participant Backfill (Admin Mode) for project: ${projectId}...`);

    let totalMessagesUpdated = 0;
    let conversationsProcessed = 0;

    try {
        // 1. Get all conversations
        console.log('📦 Fetching conversations...');
        const conversationsSnapshot = await db.collection('conversations').get();

        console.log(`📊 Found ${conversationsSnapshot.size} conversations to process`);

        // 2. Process each conversation
        for (const conversationDoc of conversationsSnapshot.docs) {
            const conversationData = conversationDoc.data();
            const conversationId = conversationDoc.id;
            const participantIds = conversationData.participantIds;

            if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
                continue;
            }

            // 3. Get messages
            const messagesRef = db.collection('conversations').doc(conversationId).collection('messages');
            const messagesSnapshot = await messagesRef.get();

            if (messagesSnapshot.empty) {
                continue;
            }

            // Chunk updates
            const updates = [];
            for (const messageDoc of messagesSnapshot.docs) {
                const messageData = messageDoc.data();
                // If missing participantIds OR different
                if (!messageData.participantIds ||
                    JSON.stringify((messageData.participantIds || []).sort()) !== JSON.stringify([...participantIds].sort())) {
                    updates.push(messageDoc);
                }
            }

            let updatesInConversation = 0;
            // Process updates in batches
            for (let i = 0; i < updates.length; i += BATCH_SIZE) {
                const chunk = updates.slice(i, i + BATCH_SIZE);
                const chunkBatch = db.batch();
                chunk.forEach(doc => {
                    chunkBatch.update(doc.ref, {
                        participantIds: participantIds,
                        _backfilledAt: FieldValue.serverTimestamp()
                    });
                });
                await chunkBatch.commit();
                totalMessagesUpdated += chunk.length;
                updatesInConversation += chunk.length;
            }

            if (updatesInConversation > 0) {
                console.log(`✅ Updated ${updatesInConversation} messages in conversation ${conversationId}`);
            }

            conversationsProcessed++;
        }

        console.log('\n🎉 Backfill Complete!');
        console.log(`   Conversations Processed: ${conversationsProcessed}`);
        console.log(`   Messages Updated: ${totalMessagesUpdated}`);

    } catch (error) {
        console.error('❌ Backfill failed:', error);
        process.exit(1);
    }
}

backfillMessageParticipants();
