/**
 * Types for the Evidence Embed System
 */

/**
 * Represents an embedded evidence item from a third-party platform
 */
export interface EmbeddedEvidence {
  id: string;
  userId: string;
  userName?: string | null;
  userPhotoURL?: string | null;
  createdAt: any; // Timestamp
  title: string;
  description: string;

  // Embed information
  embedUrl: string;  // The URL to embed
  embedCode?: string | null;  // Optional direct embed code
  embedType: 'image' | 'video' | 'audio' | 'document' | 'code' | 'design' | 'other';
  embedService: string; // youtube, vimeo, imgur, etc.

  // Metadata
  thumbnailUrl?: string | null;  // For preview displays
  originalUrl: string;  // Link to view on original platform

  // Allow any additional properties for type safety when cleaning objects
  [key: string]: any;
}

/**
 * Props for the EvidenceSubmitter component
 */
export interface EvidenceSubmitterProps {
  evidence: EmbeddedEvidence[];
  onChange: (evidence: EmbeddedEvidence[]) => void;
  maxItems?: number;
}

/**
 * Props for the EvidenceGallery component
 */
export interface EvidenceGalleryProps {
  evidence: EmbeddedEvidence[];
  onRemove?: (id: string) => void;
  isEditable?: boolean;
  title?: string;
  emptyMessage?: string;
  className?: string;
  expanded?: boolean;
}
