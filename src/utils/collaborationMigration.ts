export interface MigrationResult {
  success: boolean;
  migratedCount?: number;
  error?: string;
}

export async function migrateCollaborations(): Promise<MigrationResult> {
  // Placeholder migration to satisfy type-check in scripts; no-op in app builds
  try {
    return { success: true, migratedCount: 0 };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Unknown error' };
  }
}


