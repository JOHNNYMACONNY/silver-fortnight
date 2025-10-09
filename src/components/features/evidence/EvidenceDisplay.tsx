/**
 * EvidenceDisplay Component
 *
 * A component for displaying embedded evidence with expand/collapse functionality.
 */

import React, { useState } from 'react';
import DOMPurify from 'dompurify';
import { EmbeddedEvidence } from '../../../utils/embedUtils';
import { getProfileImageUrl } from '../../../utils/imageUtils';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../ui/Card';
import { Button } from '../../ui/Button';
import { formatDate } from '../../../utils/dateUtils';
import {
  Code,
  FileText,
  ImageIcon,
  Link,
  Palette,
  PlaySquare,
  Volume2,
} from 'lucide-react';

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
        return <PlaySquare className="h-5 w-5" />;
      case 'audio':
        return <Volume2 className="h-5 w-5" />;
      case 'document':
        return <FileText className="h-5 w-5" />;
      case 'code':
        return <Code className="h-5 w-5" />;
      case 'design':
        return <Palette className="h-5 w-5" />;
      default:
        return <Link className="h-5 w-5" />;
    }
  };

  return (
    <Card
      variant="premium"
      tilt={true}
      tiltIntensity={5}
      depth="lg"
      glow="subtle"
      glowColor="orange"
      hover={true}
      interactive={true}
      className={`overflow-hidden h-[380px] ${className}`}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            {getTypeIcon()}
            <CardTitle className="ml-2">{evidence.title}</CardTitle>
          </div>
          <span className="px-2 py-1 text-xs rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 font-medium">
            {evidence.embedService}
          </span>
        </div>
        {evidence.description && (
          <CardDescription className="mt-2">
            {evidence.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {evidence.userName && (
          <div className="mt-2 flex items-center text-sm text-muted-foreground">
            {evidence.userPhotoURL && (
              <img
                src={getProfileImageUrl(evidence.userPhotoURL, 20)}
                alt={evidence.userName}
                className="w-5 h-5 rounded-full mr-1"
              />
            )}
            <span>Submitted by {evidence.userName}</span>
            <span className="mx-1">•</span>
            <span>{formatDate(evidence.createdAt)}</span>
          </div>
        )}

        {!expanded ? (
          <div
            className="mt-4 cursor-pointer relative rounded-lg overflow-hidden group focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            onClick={() => setExpanded(true)}
            role="button"
            tabIndex={0}
            aria-label={`View ${evidence.title}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setExpanded(true);
              }
            }}
          >
            {evidence.thumbnailUrl ? (
              <img
                src={evidence.thumbnailUrl}
                alt={evidence.title}
                loading="lazy"
                decoding="async"
                className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-48 bg-muted flex items-center justify-center">
                {getTypeIcon()}
              </div>
            )}
            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center transition-opacity duration-300 opacity-0 group-hover:opacity-100">
              <Button variant="secondary">Click to view</Button>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <div className="embed-container rounded-lg overflow-hidden border bg-background shadow-sm">
              {evidence.embedCode ? (
                <div dangerouslySetInnerHTML={{ 
                  __html: DOMPurify.sanitize(evidence.embedCode, {
                    ALLOWED_TAGS: ['iframe', 'video', 'audio', 'source', 'img', 'div', 'span', 'p', 'br', 'a', 'blockquote'],
                    ALLOWED_ATTR: ['src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen', 'controls', 'autoplay', 'loop', 'muted', 'poster', 'alt', 'class', 'style', 'href', 'title', 'data-id'],
                    ALLOW_DATA_ATTR: false,
                    FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur', 'onsubmit'],
                    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'button', 'link']
                  })
                }} />
              ) : (
                <a
                  href={evidence.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 text-center text-primary hover:underline"
                >
                  View on {evidence.embedService}
                </a>
              )}
            </div>
            <div className="mt-2 flex justify-between">
              <Button variant="ghost" onClick={() => setExpanded(false)}>
                Collapse
              </Button>
              <Button variant="ghost" asChild>
                <a
                  href={evidence.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Original
                </a>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
