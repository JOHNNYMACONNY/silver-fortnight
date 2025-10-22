import { migrateCollaborations } from '../utils/collaborationMigration';

/**
 * This script migrates existing collaborations to the new schema with roles subcollection.
 * 
 * To run this script:
 * 1. Import it in a component or page temporarily
 * 2. Call runMigration() from a useEffect or button click handler
 * 3. Check the console for migration results
 * 4. Remove the script after migration is complete
 */
export const runMigration = async () => {
  console.log('Starting collaboration migration...');
  
  try {
    const result = await migrateCollaborations();
    
    if (result.success) {
      console.log(`Migration completed successfully. Migrated ${result.migratedCount} collaborations.`);
    } else {
      console.error(`Migration failed: ${result.error}`);
    }
  } catch (error) {
    console.error('Error running migration:', error);
  }
};

/**
 * Example usage in a component:
 * 
 * import { runMigration } from '../scripts/migrateCollaborations';
 * 
 * const MigrationComponent = () => {
 *   const handleMigrate = async () => {
 *     await runMigration();
 *   };
 * 
 *   return (
 *     <button onClick={handleMigrate}>
 *       Migrate Collaborations
 *     </button>
 *   );
 * };
 */
