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
import { GlassmorphicBadge } from '../../ui/GlassmorphicBadge';
import { X } from 'lucide-react';
import { cn } from '../../../utils/cn';

export const EvidenceGallery: React.FC<EvidenceGalleryProps> = ({
  evidence,
  onRemove,
  isEditable,
  title = 'Evidence',
  emptyMessage = 'No evidence has been submitted yet.',
  className = ''
}) => {
  const [hoveredItem, setHoveredItem] = React.useState<string | null>(null);

  if (!evidence || evidence.length === 0) {
    return (
      <div className={className}>
        {title && <h3 className="text-xl font-semibold mb-4">{title}</h3>}
        <div className="glassmorphic rounded-xl p-8 text-center transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 hover:scale-[1.02] group">
          <p className="text-muted-foreground group-hover:text-foreground transition-colors duration-300">
            {emptyMessage}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {title && (
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-xl font-semibold transition-colors duration-300 hover:text-primary">
            {title}
          </h3>
          <GlassmorphicBadge 
            brandAccent="blue" 
            size="sm" 
            glow
            interactive
            bounceOnMount
            pulsing={evidence.length > 5} // Pulse if many items
          >
            {evidence.length} item{evidence.length !== 1 ? 's' : ''}
          </GlassmorphicBadge>
        </div>
      )}
      <div className="glassmorphic rounded-xl p-6 space-y-4 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:scale-[1.01] group">
        {evidence.map((item, index) => (
          <div 
            key={item.id} 
            className="relative transition-all duration-300 ease-out hover:scale-[1.02] hover:z-10"
            style={{
              animationDelay: `${index * 100}ms`,
              animation: 'fadeInUp 0.6s ease-out forwards'
            }}
            onMouseEnter={() => setHoveredItem(item.id)}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <div className={cn(
              "transition-all duration-300",
              hoveredItem === item.id && "glassmorphic rounded-xl p-2 shadow-lg shadow-blue-500/20"
            )}>
              <EvidenceDisplay
                evidence={item}
              />
            </div>
            {isEditable && onRemove && (
              <Button
                variant="destructive"
                size="icon"
                onClick={() => onRemove(item.id)}
                className={cn(
                  "absolute top-2 right-2 glassmorphic border-destructive/20 bg-destructive/10 hover:bg-destructive/20",
                  "transition-all duration-300 ease-out",
                  "hover:scale-110 hover:shadow-lg hover:shadow-destructive/30",
                  "active:scale-95",
                  "opacity-0 group-hover:opacity-100",
                  "transform translate-y-1 group-hover:translate-y-0"
                )}
                aria-label="Remove evidence"
              >
                <X className="h-4 w-4 transition-transform duration-200 hover:rotate-90" />
              </Button>
            )}
          </div>
        ))}
      </div>
      
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};
