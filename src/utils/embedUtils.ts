/**
 * Embed Utilities
 *
 * Utilities for handling embedded content from third-party services.
 * Includes service detection, URL validation, embed code generation,
 * and thumbnail extraction.
 */

import { v4 as uuidv4 } from 'uuid';
import DOMPurify from 'dompurify';
import { Timestamp } from 'firebase/firestore';

/**
 * Interface for embedded evidence
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
 * Interface for a supported service
 */
interface SupportedService {
  name: string;
  pattern: RegExp;
  type: 'image' | 'video' | 'audio' | 'document' | 'code' | 'design' | 'other';
  extractId: (url: string) => string | null;
  generateEmbed?: (id: string) => string;
  generateThumbnail?: (id: string) => string;
}

/**
 * Map of supported services and their URL patterns
 */
export const SUPPORTED_SERVICES: SupportedService[] = [
  // Video Services
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
    generateThumbnail: undefined // Vimeo requires API for thumbnails
  },
  {
    name: 'loom',
    pattern: /loom\.com\/share\/([a-zA-Z0-9]+)/i,
    type: 'video',
    extractId: (url: string) => {
      const match = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/i);
      return match ? match[1] : null;
    },
    generateEmbed: (id: string) => `<iframe src="https://www.loom.com/embed/${id}" width="640" height="360" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>`,
    generateThumbnail: undefined
  },

  // Image Services
  {
    name: 'imgur',
    pattern: /imgur\.com\/(?:a\/|gallery\/)?([a-zA-Z0-9]+)(?:\.[a-zA-Z0-9]+)?/i,
    type: 'image',
    extractId: (url: string) => {
      const match = url.match(/imgur\.com\/(?:a\/|gallery\/)?([a-zA-Z0-9]+)(?:\.[a-zA-Z0-9]+)?/i);
      return match ? match[1] : null;
    },
    generateEmbed: (id: string) => {
      // Check if it's an album by looking at the id extraction
      const isAlbum = id.includes('a/') || id.includes('gallery/');
      if (isAlbum) {
        return `<blockquote class="imgur-embed-pub" lang="en" data-id="a/${id}"><a href="https://imgur.com/a/${id}">View on Imgur</a></blockquote><script async src="//s.imgur.com/min/embed.js" charset="utf-8"></script>`;
      }
      // Single image
      return `<img src="https://i.imgur.com/${id}.jpg" alt="Imgur Image" style="max-width: 100%; height: auto;" />`;
    },
    generateThumbnail: (id: string) => `https://i.imgur.com/${id}m.jpg` // m for medium thumbnail
  },

  // Document Services
  {
    name: 'google-docs',
    pattern: /docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/i,
    type: 'document',
    extractId: (url: string) => {
      const match = url.match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/i);
      return match ? match[1] : null;
    },
    generateEmbed: (id: string) => `<iframe src="https://docs.google.com/document/d/${id}/preview" width="640" height="480" frameborder="0" allowfullscreen></iframe>`,
    generateThumbnail: undefined
  },
  {
    name: 'google-sheets',
    pattern: /docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/i,
    type: 'document',
    extractId: (url: string) => {
      const match = url.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/i);
      return match ? match[1] : null;
    },
    generateEmbed: (id: string) => `<iframe src="https://docs.google.com/spreadsheets/d/${id}/preview" width="640" height="480" frameborder="0" allowfullscreen></iframe>`,
    generateThumbnail: undefined
  },
  {
    name: 'google-slides',
    pattern: /docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/i,
    type: 'document',
    extractId: (url: string) => {
      const match = url.match(/docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/i);
      return match ? match[1] : null;
    },
    generateEmbed: (id: string) => `<iframe src="https://docs.google.com/presentation/d/${id}/embed" width="640" height="480" frameborder="0" allowfullscreen></iframe>`,
    generateThumbnail: undefined
  },
  {
    name: 'google-drive-file',
    pattern: /drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([a-zA-Z0-9_-]+)/i,
    type: 'document',
    extractId: (url: string) => {
      const match = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([a-zA-Z0-9_-]+)/i);
      return match ? match[1] : null;
    },
    generateEmbed: (id: string) => `<iframe src="https://drive.google.com/file/d/${id}/preview" width="640" height="480" frameborder="0" allowfullscreen></iframe>`,
    generateThumbnail: undefined
  },
  {
    name: 'google-drive-folder',
    pattern: /drive\.google\.com\/drive\/folders\/([a-zA-Z0-9_-]+)/i,
    type: 'document',
    extractId: (url: string) => {
      const match = url.match(/drive\.google\.com\/drive\/folders\/([a-zA-Z0-9_-]+)/i);
      return match ? match[1] : null;
    },
    generateEmbed: (id: string) => `<iframe src="https://drive.google.com/embeddedfolderview?id=${id}" width="640" height="480" frameborder="0" allowfullscreen></iframe>`,
    generateThumbnail: undefined
  },

  // Code Services
  {
    name: 'github-gist',
    pattern: /gist\.github\.com\/(?:[a-zA-Z0-9_-]+\/)?([a-zA-Z0-9]+)/i,
    type: 'code',
    extractId: (url: string) => {
      const match = url.match(/gist\.github\.com\/(?:[a-zA-Z0-9_-]+\/)?([a-zA-Z0-9]+)/i);
      return match ? match[1] : null;
    },
    generateEmbed: (id: string) => `<script src="https://gist.github.com/${id}.js"></script>`,
    generateThumbnail: undefined
  },
  {
    name: 'codepen',
    pattern: /codepen\.io\/([a-zA-Z0-9_-]+)\/pen\/([a-zA-Z0-9_-]+)/i,
    type: 'code',
    extractId: (url: string) => {
      const match = url.match(/codepen\.io\/([a-zA-Z0-9_-]+)\/pen\/([a-zA-Z0-9_-]+)/i);
      return match ? `${match[1]}/pen/${match[2]}` : null;
    },
    generateEmbed: (id: string) => {
      const [user, _, penId] = id.split('/');
      return `<iframe height="300" style="width: 100%;" scrolling="no" title="CodePen Embed" src="https://codepen.io/${user}/embed/${penId}?height=300&theme-id=dark&default-tab=result" frameborder="no" loading="lazy" allowtransparency="true" allowfullscreen="true">See the Pen <a href='https://codepen.io/${user}/pen/${penId}'>CodePen</a> by ${user}.</iframe>`;
    },
    generateThumbnail: undefined
  },

  // Design Services
  {
    name: 'figma',
    pattern: /figma\.com\/file\/([a-zA-Z0-9]+)(?:\/([^?]+))?/i,
    type: 'design',
    extractId: (url: string) => {
      const match = url.match(/figma\.com\/file\/([a-zA-Z0-9]+)(?:\/([^?]+))?/i);
      return match ? match[1] : null;
    },
    generateEmbed: (id: string) => `<iframe style="border: 1px solid rgba(0, 0, 0, 0.1);" width="800" height="450" src="https://www.figma.com/embed?embed_host=share&url=https%3A%2F%2Fwww.figma.com%2Ffile%2F${id}" allowfullscreen></iframe>`,
    generateThumbnail: undefined
  }
];

/**
 * Detect the service from a URL
 * @param url URL to detect service from
 * @returns Object with service name and type, or null if not supported
 */
export const detectService = (url: string): { name: string; type: string } | null => {
  if (!url) return null;

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
 * @param url URL to generate embed code from
 * @returns HTML embed code or null if not supported
 */
export const generateEmbedCode = (url: string): string | null => {
  if (!url) return null;

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
 * @param url URL to generate thumbnail from
 * @returns Thumbnail URL or null if not available
 */
export const generateThumbnailUrl = (url: string): string | null => {
  if (!url) return null;

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
 * @param url URL to validate
 * @returns Boolean indicating if URL is supported
 */
export const isValidEmbedUrl = (url: string): boolean => {
  if (!url) return false;
  return SUPPORTED_SERVICES.some(service => service.pattern.test(url));
};

/**
 * Generate safe embed code using DOMPurify
 * @param url URL to generate safe embed code from
 * @returns Sanitized HTML embed code or null if not supported
 */
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

/**
 * Create an embedded evidence object
 * @param url URL to embed
 * @param title Title of the evidence
 * @param description Description of the evidence
 * @param userId ID of the user submitting the evidence
 * @param userName Optional name of the user
 * @param userPhotoURL Optional photo URL of the user
 * @returns Promise resolving to an EmbeddedEvidence object
 */
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
    embedType: service.type as any, // Cast to satisfy TypeScript
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
