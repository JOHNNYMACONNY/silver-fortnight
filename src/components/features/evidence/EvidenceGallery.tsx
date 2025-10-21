/**
 * EvidenceGallery Component
 *
 * A component for displaying multiple evidence items in a gallery format.
 */

import React from 'react';
import { EvidenceDisplay } from './EvidenceDisplay';
import { Card, CardContent } from '../../ui/Card';
import { EvidenceGalleryProps } from '../../../types/evidence';
import { Button } from '../../ui/Button';
import { X } from 'lucide-react';

export const EvidenceGallery: React.FC<EvidenceGalleryProps> = ({
  evidence,
  onRemove,
  isEditable,
  title = 'Evidence',
  emptyMessage = 'No evidence has been submitted yet.',
  className = ''
}) => {
  if (!evidence || evidence.length === 0) {
    return (
      <div className={className}>
        {title && <h3 className="text-xl font-semibold mb-4">{title}</h3>}
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">{emptyMessage}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      {title && <h3 className="text-xl font-semibold mb-4">{title}</h3>}
      <div className="space-y-4">
        {evidence.map((item) => (
          <div key={item.id} className="relative">
            <EvidenceDisplay
              key={item.id}
              evidence={item}
            />
            {isEditable && onRemove && (
              <Button
                variant="destructive"
                size="icon"
                onClick={() => onRemove(item.id)}
                className="absolute top-2 right-2"
                aria-label="Remove evidence"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
