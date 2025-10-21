import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Type definitions based on firestore.indexes.json structure and Firebase Admin SDK
export interface IndexField {
  fieldPath: string;
  order?: 'ASCENDING' | 'DESCENDING';
  arrayConfig?: 'CONTAINS';
}

export interface IndexDefinition {
  collectionGroup: string;
  queryScope: 'COLLECTION' | 'COLLECTION_GROUP';
  fields: IndexField[];
}

interface FirestoreIndexesFormat {
  indexes: IndexDefinition[];
  fieldOverrides?: FieldOverride[];
}

interface FieldOverride {
  collectionGroup: string;
  fieldPath: string;
  indexes: Array<{
    order?: 'ASCENDING' | 'DESCENDING';
    arrayConfig?: 'CONTAINS';
    queryScope: 'COLLECTION' | 'COLLECTION_GROUP';
  }>;
}

// Type for indexes returned by Firebase Admin SDK
export interface DeployedIndex {
  name: string;
  queryScope: string;
  fields: Array<{
    fieldPath: string;
    order?: string;
    arrayConfig?: string;
  }>;
  state: string;
  collectionGroup?: string;
}

interface ComparisonResult {
  allMatch: boolean;
  missingIndexes: IndexDefinition[];
  notReadyIndexes: Array<{ expected: IndexDefinition; actual: DeployedIndex }>;
  unexpectedIndexes: DeployedIndex[];
}

/**
 * Parses index definitions from the JSON string content of firestore.indexes.json.
 * Handles both top-level 'indexes' and 'fieldOverrides'.
 */
export function parseIndexDefinitions(jsonString: string): IndexDefinition[] {
  const parsedContent: FirestoreIndexesFormat = JSON.parse(jsonString);
  const definitions: IndexDefinition[] = [];

  // Process top-level indexes
  if (parsedContent.indexes) {
    definitions.push(...parsedContent.indexes);
  }

  // Process fieldOverrides
  if (parsedContent.fieldOverrides) {
    for (const override of parsedContent.fieldOverrides) {
      for (const singleIndex of override.indexes) {
        definitions.push({
          collectionGroup: override.collectionGroup,
          queryScope: singleIndex.queryScope,
          fields: [
            {
              fieldPath: override.fieldPath,
              order: singleIndex.order,
              arrayConfig: singleIndex.arrayConfig,
            },
          ],
        });
      }
    }
  }
  return definitions;
}

/**
 * Compares expected index definitions with actually deployed indexes.
 */
export function compareIndexes(
  expected: IndexDefinition[],
  deployed: DeployedIndex[]
): ComparisonResult {
  const result: ComparisonResult = {
    allMatch: true,
    missingIndexes: [],
    notReadyIndexes: [],
    unexpectedIndexes: [],
  };

  const deployedMap = new Map<string, DeployedIndex[]>();
  for (const dep of deployed) {
    // Extract collectionGroup from the name if not directly available
    const cgMatch = dep.name.match(/collectionGroups\/([^/]+)\//);
    const collectionGroup = cgMatch ? cgMatch[1] : 'unknown';

    const key = `${collectionGroup}-${dep.queryScope}`;
    if (!deployedMap.has(key)) {
      deployedMap.set(key, []);
    }
    deployedMap.get(key)!.push({ ...dep, collectionGroup });
  }

  for (const exp of expected) {
    let foundMatch = false;
    const deployedForScope = deployedMap.get(`${exp.collectionGroup}-${exp.queryScope}`) || [];

    for (const dep of deployedForScope) {
      if (
        exp.fields.length === dep.fields.length &&
        exp.fields.every((expField, i) => {
          const depField = dep.fields[i];
          return (
            depField &&
            expField.fieldPath === depField.fieldPath &&
            (expField.order || 'NONE') === (depField.order || 'NONE') &&
            (expField.arrayConfig || 'NONE') === (depField.arrayConfig || 'NONE')
          );
        })
      ) {
        foundMatch = true;
        if (dep.state !== 'READY') {
          result.allMatch = false;
          result.notReadyIndexes.push({ expected: exp, actual: dep });
        }
        // Mark as "seen" by removing from consideration for unexpected
        deployedForScope.splice(deployedForScope.indexOf(dep), 1);
        if (deployedForScope.length === 0) {
            deployedMap.delete(`${exp.collectionGroup}-${exp.queryScope}`);
        }
        break;
      }
    }
    if (!foundMatch) {
      result.allMatch = false;
      result.missingIndexes.push(exp);
    }
  }

  deployedMap.forEach(deps => result.unexpectedIndexes.push(...deps));
  if (result.unexpectedIndexes.length > 0) {
    result.allMatch = false;
  }

  return result;
}

/**
 * Fetch deployed indexes - For now, this is a placeholder that returns empty array
 * In production, this would integrate with Firebase Admin SDK or Google Cloud APIs
 */
async function fetchDeployedIndexes(projectId: string): Promise<DeployedIndex[]> {
  console.warn(`Note: Index fetching not implemented yet for project ${projectId}.`);
  console.warn('This tool currently supports parsing and comparison logic.');
  console.warn('To use with real Firebase data, integrate with Firebase Admin SDK or Google Cloud APIs.');
  
  // Return empty array - in tests, this will be mocked
  return [];
}

/**
 * Main function to verify Firestore indexes.
 */
export async function verifyIndexes(environment: string, indexesFilePath: string): Promise<void> {
  let projectId: string | undefined;

  // 1. Determine Project ID from environment
  try {
    const firebasercContent = fs.readFileSync(path.resolve('.firebaserc'), 'utf-8');
    const firebaserc = JSON.parse(firebasercContent);
    if (firebaserc.projects && firebaserc.projects[environment]) {
      projectId = firebaserc.projects[environment];
    } else if (environment === 'default' && firebaserc.projects && firebaserc.projects.default) {
        projectId = firebaserc.projects.default;
    } else if (firebaserc.projects && Object.values(firebaserc.projects).includes(environment)) {
        projectId = environment;
    } else {
      if (environment !== 'default' && (!firebaserc.projects || !firebaserc.projects[environment])) {
        console.error(`Error: Project ID for environment '${environment}' not found in .firebaserc and it's not 'default'.`);
        process.exit(1);
        return;
      }
      if (environment === 'default' && (!firebaserc.projects || !firebaserc.projects.default)) {
        console.error(`Error: 'default' project ID not found in .firebaserc.`);
        process.exit(1);
        return;
      }
    }
  } catch (error: any) {
    console.error(`Error reading .firebaserc: ${error.message}`);
    process.exit(1);
    return;
  }

  if (!projectId) {
    console.error(`Error: Could not determine Project ID for environment '${environment}'.`);
    process.exit(1);
    return;
  }

  console.log(`Verifying indexes for Firebase project: ${projectId} (environment: ${environment})`);

  // 2. Load expected index definitions
  let expectedIndexes: IndexDefinition[];
  try {
    const indexesJsonContent = fs.readFileSync(path.resolve(indexesFilePath), 'utf-8');
    expectedIndexes = parseIndexDefinitions(indexesJsonContent);
  } catch (error: any) {
    console.error(`Error reading or parsing indexes file ${indexesFilePath}: ${error.message}`);
    process.exit(1);
    return;
  }

  if (expectedIndexes.length === 0) {
    console.log("No index definitions found in specified file. Exiting.");
    process.exit(0);
    return;
  }

  // 3. Initialize Firebase Admin SDK (optional, mainly for authentication setup)
  try {
    if (admin.apps.length === 0) {
        admin.initializeApp({ projectId });
    }
  } catch (error: any) {
    console.error(`Error initializing Firebase Admin SDK: ${error.message}`);
    process.exit(1);
    return;
  }

  // 4. Fetch deployed indexes
  let deployedIndexes: DeployedIndex[];
  try {
    deployedIndexes = await fetchDeployedIndexes(projectId);
  } catch (error: any) {
    console.error(`Error fetching deployed indexes: ${error.message}`);
    process.exit(1);
    return;
  }

  // 5. Compare and report
  const comparison = compareIndexes(expectedIndexes, deployedIndexes);

  let success = true;

  if (comparison.missingIndexes.length > 0) {
    success = false;
    console.error("\nMissing indexes:");
    comparison.missingIndexes.forEach(idx => {
      console.error(`- Collection: ${idx.collectionGroup}, Scope: ${idx.queryScope}, Fields: ${JSON.stringify(idx.fields)}`);
    });
  }

  if (comparison.notReadyIndexes.length > 0) {
    success = false;
    console.error("\nIndexes not ready:");
    comparison.notReadyIndexes.forEach(item => {
      console.error(`- Collection: ${item.expected.collectionGroup}, Scope: ${item.expected.queryScope}, Fields: ${JSON.stringify(item.expected.fields)}, Current state: ${item.actual.state}`);
    });
  }

  if (comparison.unexpectedIndexes.length > 0) {
    success = false;
    console.warn("\nUnexpected indexes found:");
    comparison.unexpectedIndexes.forEach(idx => {
      console.warn(`- Name: ${idx.name}, Collection: ${idx.collectionGroup}, Scope: ${idx.queryScope}, Fields: ${JSON.stringify(idx.fields)}, State: ${idx.state}`);
    });
  }

  if (success) {
    console.log(`\nAll ${expectedIndexes.length} expected indexes are deployed and active.`);
    process.exit(0);
  } else {
    console.error("\nIndex verification failed.");
    process.exit(1);
  }
}

// Check if running as main module for CLI usage
const isMainModule = typeof require !== 'undefined' && process.argv[1] === fileURLToPath(import.meta.url);

// Basic command-line argument parsing (only when run as standalone script)
if (isMainModule) {
  const args = process.argv.slice(2);
  if (args.length < 1 || args.length > 2) {
    console.log("Usage: npx tsx verify-indexes.ts <environment> [pathToIndexesJson]");
    console.log("Example: npx tsx verify-indexes.ts staging");
    console.log("Example: npx tsx verify-indexes.ts default custom-indexes.json");
    process.exit(1);
  }
  const environment = args[0];
  const indexesFilePath = args[1] || 'firestore.indexes.json';

  verifyIndexes(environment, indexesFilePath).catch(error => {
    console.error("Unhandled error in script:", error);
    process.exit(1);
  });
}