# Evidence Embed System Implementation

This document provides detailed information about the implementation of the Evidence Embed System in the TradeYa application.

## Table of Contents

1. [Overview](#overview)
2. [Implementation Details](#implementation-details)
3. [Components](#components)
4. [Utilities](#utilities)
5. [Service Integration](#service-integration)
6. [Supported Services](#supported-services)
7. [Security Considerations](#security-considerations)
8. [Usage Examples](#usage-examples)
9. [Testing](#testing)
10. [Future Enhancements](#future-enhancements)

## Overview

The Evidence Embed System allows users to showcase their work through embedded content from third-party platforms without storing media files directly. This system serves as a foundation for the Trade Confirmation System, enabling users to provide evidence of completed work.

### Key Features

- URL-based evidence submission
- Automatic service detection
- Embedded content previews
- Metadata storage in Firestore
- Responsive display components
- Support for multiple media types (images, videos, documents, etc.)

## Implementation Details

### Data Model

The Evidence Embed System uses the following data model:

```typescript
// EmbeddedEvidence interface
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
```

This interface is used to store evidence in Firestore, associated with trades and collaborations:

```typescript
// Updated Trade interface
export interface Trade {
  // Existing fields...

  // Evidence fields
  evidence?: EmbeddedEvidence[];
  completionEvidence?: EmbeddedEvidence[];
}

// Updated Collaboration interface
export interface Collaboration {
  // Existing fields...

  // Evidence fields
  evidence?: EmbeddedEvidence[];
  roleEvidence?: { [roleId: string]: EmbeddedEvidence[] };
}
```

## Components

The Evidence Embed System includes the following components:

### EvidenceSubmitter

A form component for submitting evidence from third-party services. It validates URLs, shows previews, and handles submission.

**Features:**
- URL validation with service detection
- Title and description fields
- Preview of embedded content
- Error handling and loading states

**Usage:**
```tsx
<EvidenceSubmitter
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  roleId={roleId} // Optional, for role-specific evidence
/>
```

### EvidenceDisplay

A component for displaying embedded evidence with expand/collapse functionality.

**Features:**
- Display evidence title, description, and embedded content
- Expand/collapse functionality
- Thumbnail view when collapsed
- Safe rendering of embed code
- User attribution

**Usage:**
```tsx
<EvidenceDisplay
  evidence={evidenceItem}
  className="my-4"
/>
```

### EvidenceGallery

A component for displaying multiple evidence items in a gallery format.

**Features:**
- Display multiple evidence items
- Empty state handling
- Responsive grid layout
- Title and custom empty message

**Usage:**
```tsx
<EvidenceGallery
  evidenceItems={tradeEvidence}
  title="Trade Evidence"
  emptyMessage="No evidence has been submitted for this trade yet."
/>
```

## Utilities

The Evidence Embed System includes the following utility functions:

### embedUtils.ts

A utility module for handling embedded content from third-party services.

**Key Functions:**
- `detectService`: Identify which service a URL belongs to
- `generateEmbedCode`: Generate HTML embed code for a given URL
- `generateThumbnailUrl`: Extract thumbnail URL from a service URL
- `isValidEmbedUrl`: Validate if a URL is from a supported service
- `generateSafeEmbedCode`: Generate sanitized HTML embed code
- `createEmbeddedEvidence`: Create an evidence object with all necessary metadata and ensure Firestore compatibility

## Service Integration

The Evidence Embed System integrates with Firebase Firestore through the following service functions:

### addTradeEvidence

Adds evidence to a trade.

```typescript
export const addTradeEvidence = async (
  tradeId: string,
  evidence: EmbeddedEvidence,
  isCompletionEvidence: boolean = false
): Promise<{ success: boolean; error: string | null }> => {
  // Implementation details...
}
```

### addCollaborationEvidence

Adds evidence to a collaboration, optionally associated with a specific role.

```typescript
export const addCollaborationEvidence = async (
  collaborationId: string,
  evidence: EmbeddedEvidence,
  roleId?: string
): Promise<{ success: boolean; error: string | null }> => {
  // Implementation details...
}
```

## Supported Services

The Evidence Embed System supports the following services:

### Video Services
- YouTube (youtube.com, youtu.be)
- Vimeo (vimeo.com)
- Loom (loom.com)

### Image Services
- Imgur (imgur.com)

### Document Services
- Google Docs (docs.google.com/document)
- Google Sheets (docs.google.com/spreadsheets)
- Google Slides (docs.google.com/presentation)

### Code Services
- GitHub Gist (gist.github.com)
- CodePen (codepen.io)

### Design Services
- Figma (figma.com)

## Firestore Compatibility

The Evidence Embed System is designed to work seamlessly with Firestore, which has specific requirements for data storage:

### Handling Undefined Values

Firestore does not support undefined values. To ensure compatibility, the system:

1. Uses null instead of undefined for optional fields
2. Includes cleaning logic to replace any undefined values with null before saving to Firestore
3. Adds type safety with proper type assertions

```typescript
// Example of cleaning evidence objects before saving to Firestore
const cleanEvidence = { ...evidence };
Object.keys(cleanEvidence).forEach(key => {
  if ((cleanEvidence as any)[key] === undefined) {
    (cleanEvidence as any)[key] = null;
  }
});
```

### Type Safety

The EmbeddedEvidence interface includes an index signature to allow for dynamic property access while maintaining type safety:

```typescript
export interface EmbeddedEvidence {
  // Regular properties...

  // Allow any additional properties for type safety when cleaning objects
  [key: string]: any;
}
```

### createEmbeddedEvidence Implementation

The `createEmbeddedEvidence` function has been updated to ensure Firestore compatibility:

```typescript
export const createEmbeddedEvidence = async (
  url: string,
  title: string,
  description: string,
  userId: string,
  userName?: string | null,
  userPhotoURL?: string | null
): Promise<EmbeddedEvidence> => {
  const service = detectService(url);

  if (!service) {
    throw new Error('Unsupported service URL');
  }

  const embedCode = generateSafeEmbedCode(url);
  const thumbnailUrl = generateThumbnailUrl(url);

  // Create the evidence object with null instead of undefined for Firestore compatibility
  const evidence = {
    id: uuidv4(),
    userId,
    userName: userName || null,
    userPhotoURL: userPhotoURL || null,
    createdAt: Timestamp.now(),
    title,
    description,
    embedUrl: url,
    embedCode: embedCode || null,
    embedType: service.type as any,
    embedService: service.name,
    thumbnailUrl: thumbnailUrl || null,
    originalUrl: url
  };

  // Ensure no undefined values
  Object.keys(evidence).forEach(key => {
    if ((evidence as any)[key] === undefined) {
      (evidence as any)[key] = null;
    }
  });

  return evidence;
};
```

## Security Considerations

The Evidence Embed System includes several security measures:

### Content Security Policy

The application's Content Security Policy has been updated to allow embedding content from trusted sources:

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://gist.github.com https://s.imgur.com https://www.youtube.com https://player.vimeo.com;
  frame-src 'self' https://www.youtube.com https://player.vimeo.com https://drive.google.com https://docs.google.com https://codepen.io https://jsfiddle.net https://replit.com https://www.figma.com https://www.loom.com;
  img-src 'self' https://i.imgur.com https://img.youtube.com https://i.vimeocdn.com https://res.cloudinary.com data: blob:;
  style-src 'self' 'unsafe-inline';
  connect-src 'self' https://firestore.googleapis.com https://api.cloudinary.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com;
  font-src 'self' data:;
">
```

### HTML Sanitization

The system uses DOMPurify to sanitize HTML before rendering:

```typescript
export const generateSafeEmbedCode = (url: string): string | null => {
  const embedCode = generateEmbedCode(url);

  if (!embedCode) {
    return null;
  }

  // Configure DOMPurify to allow iframes and scripts from trusted sources
  const purifyConfig = {
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling'],
    ALLOWED_TAGS: ['iframe', 'img', 'a', 'p', 'br', 'blockquote', 'script'],
    ALLOWED_ATTR: ['src', 'href', 'style', 'class', 'width', 'height', 'alt', 'title', 'async', 'charset', 'data-id', 'lang']
  };

  // Sanitize the embed code
  return DOMPurify.sanitize(embedCode, purifyConfig);
};
```

### URL Validation

The system validates URLs against patterns for supported services:

```typescript
export const isValidEmbedUrl = (url: string): boolean => {
  if (!url) return false;
  return SUPPORTED_SERVICES.some(service => service.pattern.test(url));
};
```

## Usage Examples

### Adding Evidence to a Trade

```tsx
import { EvidenceSubmitter } from '../components/features/evidence';
import { addTradeEvidence } from '../services/firestore';
import { EmbeddedEvidence } from '../utils/embedUtils';

const TradeDetailPage = () => {
  const { tradeId } = useParams();

  const handleSubmitEvidence = async (evidence: EmbeddedEvidence) => {
    const { success, error } = await addTradeEvidence(tradeId, evidence);

    if (success) {
      addToast('success', 'Evidence added successfully');
    } else {
      addToast('error', error || 'Failed to add evidence');
    }
  };

  return (
    <div>
      {/* Trade details */}

      <h3>Add Evidence</h3>
      <EvidenceSubmitter onSubmit={handleSubmitEvidence} />

      {/* Display existing evidence */}
      <EvidenceGallery evidenceItems={trade.evidence || []} />
    </div>
  );
};
```

### Adding Evidence to a Collaboration Role

```tsx
import { EvidenceSubmitter } from '../components/features/evidence';
import { addCollaborationEvidence } from '../services/firestore';
import { EmbeddedEvidence } from '../utils/embedUtils';

const CollaborationRoleSection = ({ collaborationId, role }) => {
  const handleSubmitEvidence = async (evidence: EmbeddedEvidence) => {
    const { success, error } = await addCollaborationEvidence(
      collaborationId,
      evidence,
      role.id
    );

    if (success) {
      addToast('success', 'Evidence added successfully');
    } else {
      addToast('error', error || 'Failed to add evidence');
    }
  };

  return (
    <div>
      <h3>{role.title}</h3>

      <EvidenceSubmitter
        onSubmit={handleSubmitEvidence}
        roleId={role.id}
      />

      <EvidenceGallery
        evidenceItems={collaboration.roleEvidence?.[role.id] || []}
        title={`Evidence for ${role.title}`}
      />
    </div>
  );
};
```

## Testing

The Evidence Embed System can be tested using the EvidenceDemo component, which is accessible to admin users through the user menu. This component allows adding and viewing evidence items without affecting actual trades or collaborations.

## Future Enhancements

Planned enhancements for the Evidence Embed System include:

1. **Additional Service Support**: Add support for more third-party services
2. **Improved Thumbnail Generation**: Implement API-based thumbnail generation for services like Vimeo
3. **Evidence Verification**: Add verification mechanisms for evidence
4. **Evidence Filtering**: Add filtering and sorting options for evidence galleries
5. **Evidence Comments**: Allow users to comment on evidence items
6. **Evidence Ratings**: Allow users to rate evidence items
7. **Evidence Reporting**: Add reporting functionality for inappropriate evidence
8. **Evidence Analytics**: Track views and interactions with evidence items

These enhancements will be implemented as part of the Trade Confirmation System and other future features.
