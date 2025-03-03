import { db } from '../src/lib/firebase';
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
  addDoc,
  writeBatch,
} from 'firebase/firestore';
import type { TradeRequest, ProjectPositionRequest } from '../src/types/requests';

export interface Migration {
  totalProcessed: number;
  successful: number;
  failed: number;
  errors: Error[];
}

export async function migrateTrades(): Promise<Migration> {
  const results: Migration = {
    totalProcessed: 0,
    successful: 0,
    failed: 0,
    errors: [],
  };

  try {
    const tradesRef = collection(db, 'trades');
    const tradesSnap = await getDocs(tradesRef);
    const batch = writeBatch(db);

    for (const tradeDoc of tradesSnap.docs) {
      try {
        results.totalProcessed++;
        const trade = tradeDoc.data();

        // Skip already migrated trades
        if (trade.migratedToRequestSystem) {
          results.successful++;
          continue;
        }

        // Only migrate trades that have pending participants
        if (trade.pendingParticipants?.length > 0) {
          for (const participantId of trade.pendingParticipants) {
            const request: Omit<TradeRequest, 'id'> = {
              senderId: trade.ownerId,
              recipientId: participantId,
              tradeId: tradeDoc.id,
              tradeName: trade.title || 'Unnamed Trade',
              status: 'pending',
              type: 'invitation',
              createdAt: Timestamp.now(),
              message: `Migration: Original trade invitation from ${trade.ownerName || 'trade owner'}`,
              notificationSent: true
            };

            await addDoc(collection(db, 'tradeRequests'), request);
          }

          // Remove pendingParticipants field after migration
          const tradeRef = tradeDoc.ref;
          batch.update(tradeRef, {
            pendingParticipants: [],
            migratedToRequestSystem: true,
            updatedAt: Timestamp.now()
          });
        }

        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push(error as Error);
        console.error(`Error migrating trade ${tradeDoc.id}:`, error);
      }
    }

    await batch.commit();
  } catch (error) {
    console.error('Error in trade migration:', error);
    throw error;
  }

  return results;
}

export async function migrateProjects(): Promise<Migration> {
  const results: Migration = {
    totalProcessed: 0,
    successful: 0,
    failed: 0,
    errors: [],
  };

  try {
    const projectsRef = collection(db, 'projects');
    const projectsSnap = await getDocs(projectsRef);
    const batch = writeBatch(db);

    for (const projectDoc of projectsSnap.docs) {
      try {
        results.totalProcessed++;
        const project = projectDoc.data();

        // Skip already migrated projects
        if (project.migratedToRequestSystem) {
          results.successful++;
          continue;
        }

        // Check each position for pending applicants
        if (project.positions?.length > 0) {
          for (const position of project.positions) {
            if (position.pendingApplicants && position.pendingApplicants.length > 0) {
              for (const applicantId of position.pendingApplicants) {
                const request: Omit<ProjectPositionRequest, 'id'> = {
                  senderId: applicantId,
                  recipientId: project.ownerId,
                  projectId: projectDoc.id,
                  projectName: project.title || 'Unnamed Project',
                  positionId: position.id,
                  positionName: position.title || 'Unnamed Position',
                  requiredSkills: position.requiredSkills || [],
                  status: 'pending',
                  type: 'application',
                  createdAt: Timestamp.now(),
                  message: 'Migration: Original position application',
                  notificationSent: true
                };

                await addDoc(collection(db, 'projectRequests'), request);
              }
            }
          }

          // Update positions to remove pendingApplicants
          const updatedPositions = project.positions.map((pos: any) => ({
            ...pos,
            pendingApplicants: [],
          }));

          batch.update(projectDoc.ref, {
            positions: updatedPositions,
            migratedToRequestSystem: true,
            updatedAt: Timestamp.now()
          });
        }

        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push(error as Error);
        console.error(`Error migrating project ${projectDoc.id}:`, error);
      }
    }

    await batch.commit();
  } catch (error) {
    console.error('Error in project migration:', error);
    throw error;
  }

  return results;
}

export async function runMigration() {
  console.log('Starting migration to request system...');
  
  try {
    const tradeResults = await migrateTrades();
    console.log('\nTrade Migration Results:');
    console.log(`Total Processed: ${tradeResults.totalProcessed}`);
    console.log(`Successful: ${tradeResults.successful}`);
    console.log(`Failed: ${tradeResults.failed}`);
    if (tradeResults.errors.length > 0) {
      console.log('\nTrade Migration Errors:');
      tradeResults.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.message}`);
      });
    }

    const projectResults = await migrateProjects();
    console.log('\nProject Migration Results:');
    console.log(`Total Processed: ${projectResults.totalProcessed}`);
    console.log(`Successful: ${projectResults.successful}`);
    console.log(`Failed: ${projectResults.failed}`);
    if (projectResults.errors.length > 0) {
      console.log('\nProject Migration Errors:');
      projectResults.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.message}`);
      });
    }

    console.log('\nMigration completed.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  runMigration();
}
