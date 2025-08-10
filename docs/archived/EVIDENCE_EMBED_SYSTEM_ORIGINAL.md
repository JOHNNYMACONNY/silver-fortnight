# TradeYa Evidence Embed System

This document outlines the implementation plan for a cost-effective, scalable evidence system for trades and collaborations using embedded content from third-party services.

## Table of Contents

1. [System Overview](#system-overview)
2. [Supported Services](#supported-services)
3. [Technical Implementation](#technical-implementation)
4. [User Interface Components](#user-interface-components)
5. [User Experience Flow](#user-experience-flow)
6. [Integration Points](#integration-points)
7. [Security Considerations](#security-considerations)
8. [Implementation Strategy](#implementation-strategy)

## System Overview

### Goals

- Provide a robust system for users to submit evidence of completed work
- Avoid storage costs by using third-party hosting services
- Support multiple media types (images, videos, documents, etc.)
- Integrate seamlessly with existing trade and collaboration systems
- Maintain a consistent user experience

### Key Features

- URL-based evidence submission
- Automatic service detection
- Embedded content previews
- Metadata storage in Firestore
- Responsive display components

## Supported Services

### Image Hosting

| Service | URL Pattern | Embed Method | Notes |
|---------|------------|--------------|-------|
| Imgur | imgur.com/*, i.imgur.com/* | Direct embed | Free, no account required |
| Flickr | flickr.com/photos/* | oEmbed API | Good for photographers |
| ImgBB | ibb.co/*, i.ibb.co/* | Direct image | Simple, free hosting |
| Postimages | postimg.cc/* | Direct image | No account required |

### Video Hosting

| Service | URL Pattern | Embed Method | Notes |
|---------|------------|--------------|-------|
| YouTube | youtube.com/watch?v=*, youtu.be/* | iframe embed | Best for longer videos |
| Vimeo | vimeo.com/* | iframe embed | More professional appearance |
| Streamable | streamable.com/* | iframe embed | Quick uploads |
| Loom | loom.com/share/* | iframe embed | Screen recordings |

### Document Hosting

| Service | URL Pattern | Embed Method | Notes |
|---------|------------|--------------|-------|
| Google Docs | docs.google.com/document/d/* | iframe embed | Collaborative documents |
| Google Sheets | docs.google.com/spreadsheets/d/* | iframe embed | Spreadsheets |
| Google Slides | docs.google.com/presentation/d/* | iframe embed | Presentations |
| PDF (Google Drive) | drive.google.com/file/d/* | iframe embed | PDF files |

### Audio Hosting

| Service | URL Pattern | Embed Method | Notes |
|---------|------------|--------------|-------|
| SoundCloud | soundcloud.com/* | iframe embed | Music and audio clips |
| Vocaroo | vocaroo.com/* | iframe embed | Voice recordings |
| Bandcamp | *.bandcamp.com/* | iframe embed | Music producers |

### Code Hosting

| Service | URL Pattern | Embed Method | Notes |
|---------|------------|--------------|-------|
| GitHub Gist | gist.github.com/* | script embed | Code snippets |
| CodePen | codepen.io/* | iframe embed | Interactive demos |
| JSFiddle | jsfiddle.net/* | iframe embed | Web development |
| Replit | replit.com/* | iframe embed | Complex programming |

### Design Work

| Service | URL Pattern | Embed Method | Notes |
|---------|------------|--------------|-------|
| Behance | behance.net/gallery/* | iframe embed | Design portfolios |
| Dribbble | dribbble.com/shots/* | iframe embed | Design shots |
| Figma | figma.com/file/* | iframe embed | Interactive prototypes |

## Technical Implementation

### Data Model

```typescript
// In src/services/firestore.ts

export interface EmbeddedEvidence {
  id: string;
  userId: string;
  userName?: string;
  userPhotoURL?: string;
  createdAt: any; // Timestamp
  title: string;
  description: string;
  
  // Embed information
  embedUrl: string;  // The URL to embed
  embedCode?: string;  // Optional direct embed code
  embedType: 'image' | 'video' | 'audio' | 'document' | 'code' | 'design' | 'other';
  embedService: string; // youtube, vimeo, imgur, etc.
  
  // Metadata
  thumbnailUrl?: string;  // For preview displays
  originalUrl: string;  // Link to view on original platform
}

// Update Trade interface
export interface Trade {
  // Existing fields...
  
  // New fields
  evidence?: EmbeddedEvidence[];
  completionEvidence?: EmbeddedEvidence[];
}

// Update Collaboration interface
export interface Collaboration {
  // Existing fields...
  
  // New fields
  evidence?: EmbeddedEvidence[];
  roleEvidence?: { [roleId: string]: EmbeddedEvidence[] };
}
```

### Helper Functions

Create a new utility file: `src/utils/embedUtils.ts`

```typescript
/**
 * Utility functions for handling embedded content
 */

// Map of supported services and their URL patterns
const SUPPORTED_SERVICES = [
  {
    name: 'youtube',
    pattern: /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i,
    type: 'video',
    extractId: (url: string) => {
      const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
      return match ? match[1] : null;
    },
    generateEmbed: (id: string) => `<iframe width="560" height="315" src="https://www.youtube.com/embed/${id}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`,
    generateThumbnail: (id: string) => `https://img.youtube.com/vi/${id}/hqdefault.jpg`
  },
  {
    name: 'vimeo',
    pattern: /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|)(\d+)(?:$|\/|\?)/i,
    type: 'video',
    extractId: (url: string) => {
      const match = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|)(\d+)(?:$|\/|\?)/i);
      return match ? match[1] : null;
    },
    generateEmbed: (id: string) => `<iframe src="https://player.vimeo.com/video/${id}" width="640" height="360" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`,
    generateThumbnail: null // Requires API call
  },
  // Add more services here...
];

/**
 * Detect the service from a URL
 */
export const detectService = (url: string): { name: string; type: string } | null => {
  for (const service of SUPPORTED_SERVICES) {
    if (service.pattern.test(url)) {
      return {
        name: service.name,
        type: service.type
      };
    }
  }
  return null;
};

/**
 * Generate embed code from a URL
 */
export const generateEmbedCode = (url: string): string | null => {
  for (const service of SUPPORTED_SERVICES) {
    if (service.pattern.test(url)) {
      const id = service.extractId(url);
      if (id && service.generateEmbed) {
        return service.generateEmbed(id);
      }
    }
  }
  return null;
};

/**
 * Generate thumbnail URL from a URL
 */
export const generateThumbnailUrl = (url: string): string | null => {
  for (const service of SUPPORTED_SERVICES) {
    if (service.pattern.test(url)) {
      const id = service.extractId(url);
      if (id && service.generateThumbnail) {
        return service.generateThumbnail(id);
      }
    }
  }
  return null;
};

/**
 * Validate if a URL is from a supported service
 */
export const isValidEmbedUrl = (url: string): boolean => {
  return SUPPORTED_SERVICES.some(service => service.pattern.test(url));
};

/**
 * Create an embedded evidence object
 */
export const createEmbeddedEvidence = async (
  url: string,
  title: string,
  description: string,
  userId: string,
  userName?: string,
  userPhotoURL?: string
): Promise<EmbeddedEvidence> => {
  const service = detectService(url);
  
  if (!service) {
    throw new Error('Unsupported service URL');
  }
  
  const embedCode = generateEmbedCode(url);
  const thumbnailUrl = generateThumbnailUrl(url);
  
  return {
    id: uuidv4(), // Assuming you have a UUID generator
    userId,
    userName,
    userPhotoURL,
    createdAt: new Date(),
    title,
    description,
    embedUrl: url,
    embedCode: embedCode || undefined,
    embedType: service.type,
    embedService: service.name,
    thumbnailUrl: thumbnailUrl || undefined,
    originalUrl: url
  };
};
```

### Service Functions

Add to `src/services/firestore.ts`:

```typescript
/**
 * Add evidence to a trade
 */
export const addTradeEvidence = async (
  tradeId: string,
  evidence: EmbeddedEvidence
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const tradeRef = doc(db, COLLECTIONS.TRADES, tradeId);
    const tradeSnap = await getDoc(tradeRef);
    
    if (!tradeSnap.exists()) {
      return { success: false, error: 'Trade not found' };
    }
    
    const trade = tradeSnap.data() as Trade;
    const evidenceArray = trade.evidence || [];
    
    await updateDoc(tradeRef, {
      evidence: [...evidenceArray, evidence],
      updatedAt: Timestamp.now()
    });
    
    return { success: true, error: null };
  } catch (err: any) {
    console.error('Error adding trade evidence:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Add evidence to a collaboration
 */
export const addCollaborationEvidence = async (
  collaborationId: string,
  evidence: EmbeddedEvidence,
  roleId?: string
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const collabRef = doc(db, COLLECTIONS.COLLABORATIONS, collaborationId);
    const collabSnap = await getDoc(collabRef);
    
    if (!collabSnap.exists()) {
      return { success: false, error: 'Collaboration not found' };
    }
    
    const collab = collabSnap.data() as Collaboration;
    
    if (roleId) {
      // Add to specific role
      const roleEvidence = collab.roleEvidence || {};
      const roleEvidenceArray = roleEvidence[roleId] || [];
      
      const updatedRoleEvidence = {
        ...roleEvidence,
        [roleId]: [...roleEvidenceArray, evidence]
      };
      
      await updateDoc(collabRef, {
        roleEvidence: updatedRoleEvidence,
        updatedAt: Timestamp.now()
      });
    } else {
      // Add to general collaboration evidence
      const evidenceArray = collab.evidence || [];
      
      await updateDoc(collabRef, {
        evidence: [...evidenceArray, evidence],
        updatedAt: Timestamp.now()
      });
    }
    
    return { success: true, error: null };
  } catch (err: any) {
    console.error('Error adding collaboration evidence:', err);
    return { success: false, error: err.message };
  }
};
```

## User Interface Components

### Evidence Submission Component

Create a new component: `src/components/features/evidence/EvidenceSubmitter.tsx`

```tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../AuthContext';
import { createEmbeddedEvidence, isValidEmbedUrl, detectService } from '../../../utils/embedUtils';
import { Button } from '../../ui/Button';
import { TextInput } from '../../ui/TextInput';
import { TextArea } from '../../ui/TextArea';

interface EvidenceSubmitterProps {
  onSubmit: (evidence: EmbeddedEvidence) => Promise<void>;
  roleId?: string;
}

export const EvidenceSubmitter: React.FC<EvidenceSubmitterProps> = ({
  onSubmit,
  roleId
}) => {
  const { currentUser } = useAuth();
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [serviceInfo, setServiceInfo] = useState<{ name: string; type: string } | null>(null);
  
  // Validate URL and generate preview
  useEffect(() => {
    if (!url) {
      setPreview(null);
      setServiceInfo(null);
      return;
    }
    
    if (isValidEmbedUrl(url)) {
      const service = detectService(url);
      setServiceInfo(service);
      
      const embedCode = generateEmbedCode(url);
      setPreview(embedCode);
      setError(null);
    } else {
      setPreview(null);
      setServiceInfo(null);
      setError('Unsupported URL. Please use a supported service.');
    }
  }, [url]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError('You must be logged in to submit evidence');
      return;
    }
    
    if (!url || !title || !description) {
      setError('All fields are required');
      return;
    }
    
    if (!isValidEmbedUrl(url)) {
      setError('Please enter a valid URL from a supported service');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const evidence = await createEmbeddedEvidence(
        url,
        title,
        description,
        currentUser.uid,
        currentUser.displayName || undefined,
        currentUser.photoURL || undefined
      );
      
      await onSubmit(evidence);
      
      // Reset form
      setUrl('');
      setTitle('');
      setDescription('');
      setPreview(null);
      
    } catch (err: any) {
      setError(err.message || 'Failed to submit evidence');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold mb-4">Add Evidence</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <TextInput
              label="Evidence URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste a link from YouTube, Imgur, Google Drive, etc."
              required
            />
            {serviceInfo && (
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                Detected: {serviceInfo.name} ({serviceInfo.type})
              </p>
            )}
          </div>
          
          <div>
            <TextInput
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your evidence a title"
              required
            />
          </div>
          
          <div>
            <TextArea
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this evidence shows"
              required
            />
          </div>
          
          {preview && (
            <div className="mt-4">
              <h4 className="text-lg font-medium mb-2">Preview</h4>
              <div 
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-2 bg-gray-50 dark:bg-gray-900"
                dangerouslySetInnerHTML={{ __html: preview }}
              />
            </div>
          )}
          
          {error && (
            <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>
          )}
          
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || !url || !title || !description || !isValidEmbedUrl(url)}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Evidence'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
```

### Evidence Display Component

Create a new component: `src/components/features/evidence/EvidenceDisplay.tsx`

```tsx
import React, { useState } from 'react';
import { EmbeddedEvidence } from '../../../services/firestore';
import { formatDate } from '../../../utils/dateUtils';

interface EvidenceDisplayProps {
  evidence: EmbeddedEvidence;
  className?: string;
}

export const EvidenceDisplay: React.FC<EvidenceDisplayProps> = ({
  evidence,
  className = ''
}) => {
  const [expanded, setExpanded] = useState(false);
  
  // Get icon based on evidence type
  const getTypeIcon = () => {
    switch (evidence.embedType) {
      case 'image':
        return <ImageIcon className="h-5 w-5" />;
      case 'video':
        return <VideoIcon className="h-5 w-5" />;
      case 'audio':
        return <AudioIcon className="h-5 w-5" />;
      case 'document':
        return <DocumentIcon className="h-5 w-5" />;
      case 'code':
        return <CodeIcon className="h-5 w-5" />;
      case 'design':
        return <DesignIcon className="h-5 w-5" />;
      default:
        return <LinkIcon className="h-5 w-5" />;
    }
  };
  
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            {getTypeIcon()}
            <h4 className="ml-2 text-lg font-medium">{evidence.title}</h4>
          </div>
          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
            {evidence.embedService}
          </span>
        </div>
        
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          {evidence.description}
        </p>
        
        {!expanded ? (
          <div 
            className="mt-4 cursor-pointer relative rounded-lg overflow-hidden"
            onClick={() => setExpanded(true)}
          >
            {evidence.thumbnailUrl ? (
              <img 
                src={evidence.thumbnailUrl} 
                alt={evidence.title}
                className="w-full h-48 object-cover"
              />
            ) : (
              <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                {getTypeIcon()}
              </div>
            )}
            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
              <span className="text-white font-medium px-4 py-2 rounded-full bg-black bg-opacity-50">
                Click to view
              </span>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <div className="embed-container rounded-lg overflow-hidden">
              {evidence.embedCode ? (
                <div dangerouslySetInnerHTML={{ __html: evidence.embedCode }} />
              ) : (
                <a 
                  href={evidence.originalUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block p-4 text-center bg-gray-100 dark:bg-gray-700"
                >
                  View on {evidence.embedService}
                </a>
              )}
            </div>
            <button
              className="mt-2 text-sm text-blue-600 dark:text-blue-400"
              onClick={() => setExpanded(false)}
            >
              Collapse
            </button>
          </div>
        )}
        
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center">
            <span>Added by {evidence.userName || 'Unknown'}</span>
          </div>
          <div>
            <a 
              href={evidence.originalUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              View Original
            </a>
            <span className="mx-2">•</span>
            <span>{formatDate(evidence.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Icon components would be defined here
```

### Evidence Gallery Component

Create a new component: `src/components/features/evidence/EvidenceGallery.tsx`

```tsx
import React from 'react';
import { EmbeddedEvidence } from '../../../services/firestore';
import { EvidenceDisplay } from './EvidenceDisplay';

interface EvidenceGalleryProps {
  evidenceItems: EmbeddedEvidence[];
  className?: string;
}

export const EvidenceGallery: React.FC<EvidenceGalleryProps> = ({
  evidenceItems,
  className = ''
}) => {
  if (evidenceItems.length === 0) {
    return (
      <div className={`text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg ${className}`}>
        <p className="text-gray-500 dark:text-gray-400">No evidence has been submitted yet.</p>
      </div>
    );
  }
  
  return (
    <div className={`space-y-4 ${className}`}>
      {evidenceItems.map((evidence) => (
        <EvidenceDisplay 
          key={evidence.id} 
          evidence={evidence} 
        />
      ))}
    </div>
  );
};
```

## User Experience Flow

### Adding Evidence to a Trade

1. User navigates to trade detail page
2. For trades in "pending_confirmation" or when marking complete:
   - User sees "Add Evidence" button
   - Clicking opens the EvidenceSubmitter component
   - User pastes URL from supported service
   - System validates URL and shows preview
   - User adds title and description
   - On submit, evidence is added to the trade

### Adding Evidence to a Collaboration

1. User navigates to collaboration detail page
2. For their assigned role:
   - User sees "Add Evidence" button
   - Similar flow to trade evidence
   - Evidence is associated with specific role

### Viewing Evidence

1. Evidence appears in a gallery format
2. Thumbnails shown by default
3. Click expands to show embedded content
4. "View Original" link available for direct access

## Integration Points

### Trade Confirmation System

```typescript
// In TradeDetailPage.tsx

// When requesting completion
const handleRequestCompletion = async () => {
  if (!trade || !currentUser) return;
  
  setIsSubmitting(true);
  
  try {
    // Update trade status
    await requestTradeCompletion(trade.id, currentUser.uid);
    
    // Show evidence submitter
    setShowEvidenceSubmitter(true);
    
  } catch (err: any) {
    setError(err.message || 'Failed to request completion');
  } finally {
    setIsSubmitting(false);
  }
};

// When submitting evidence
const handleEvidenceSubmit = async (evidence: EmbeddedEvidence) => {
  if (!trade || !currentUser) return;
  
  try {
    await addTradeEvidence(trade.id, evidence);
    
    // Refresh trade data
    fetchTradeDetails();
    
    // Hide evidence submitter
    setShowEvidenceSubmitter(false);
    
  } catch (err: any) {
    setError(err.message || 'Failed to add evidence');
  }
};
```

### Collaboration Role Management

```typescript
// In CollaborationDetailPage.tsx

// When submitting role evidence
const handleRoleEvidenceSubmit = async (evidence: EmbeddedEvidence, roleId: string) => {
  if (!collaboration || !currentUser) return;
  
  try {
    await addCollaborationEvidence(collaboration.id, evidence, roleId);
    
    // Refresh collaboration data
    fetchCollaborationDetails();
    
  } catch (err: any) {
    setError(err.message || 'Failed to add evidence');
  }
};
```

## Security Considerations

### URL Validation

- Whitelist allowed domains
- Validate URLs against patterns
- Sanitize URLs before generating embed codes

### Content Security Policy

Add to `index.html`:

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' https://gist.github.com;
  frame-src 'self' https://www.youtube.com https://player.vimeo.com https://drive.google.com https://docs.google.com https://codepen.io https://jsfiddle.net https://replit.com https://www.figma.com;
  img-src 'self' https://i.imgur.com https://img.youtube.com https://i.vimeocdn.com data:;
  style-src 'self' 'unsafe-inline';
  connect-src 'self' https://firestore.googleapis.com https://api.cloudinary.com;
">
```

### Sanitization

Use a library like DOMPurify to sanitize embed codes:

```typescript
import DOMPurify from 'dompurify';

// In embedUtils.ts
export const generateSafeEmbedCode = (url: string): string | null => {
  const embedCode = generateEmbedCode(url);
  
  if (!embedCode) {
    return null;
  }
  
  // Sanitize the embed code
  return DOMPurify.sanitize(embedCode);
};
```

## Implementation Strategy

### Phase 1: Core Utilities and Components

1. Create embedUtils.ts with core functions
2. Build EvidenceSubmitter component
3. Build EvidenceDisplay component
4. Update Firestore interfaces

### Phase 2: Trade Integration

1. Update Trade interface
2. Add evidence submission to trade confirmation flow
3. Add evidence display to trade details page
4. Test with various media types

### Phase 3: Collaboration Integration

1. Update Collaboration interface
2. Add role-specific evidence submission
3. Add evidence display to collaboration details page
4. Test with various collaboration scenarios

### Phase 4: Security and Polish

1. Implement content security policy
2. Add sanitization for embed codes
3. Improve error handling and validation
4. Add user guidance for supported services

## User Documentation

Create a help page explaining supported services:

### Image Evidence
- Upload to Imgur: https://imgur.com/upload
- Copy the direct image link
- Paste into evidence URL field

### Video Evidence
- Upload to YouTube (can be unlisted)
- Copy the video URL
- Paste into evidence URL field

### Document Evidence
- Upload to Google Drive
- Set sharing to "Anyone with the link can view"
- Copy the link
- Paste into evidence URL field

## Compatibility Notes

This system is designed to work with the existing codebase:
- No changes to current Firebase structure
- Compatible with planned trade confirmation system
- Works with collaboration role management
- Supports both light and dark mode
- Responsive design for all screen sizes
