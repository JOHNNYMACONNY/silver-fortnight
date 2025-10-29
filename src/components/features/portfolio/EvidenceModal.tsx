// src/components/features/portfolio/EvidenceModal.tsx

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ExternalLink, ZoomIn, ZoomOut } from 'lucide-react';
import type { EmbeddedEvidence } from '../../../types/portfolio';

interface EvidenceModalProps {
  evidence: EmbeddedEvidence[];
  isOpen: boolean;
  onClose: () => void;
  initialIndex?: number;
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({
  evidence,
  isOpen,
  onClose,
  initialIndex = 0
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [imageZoom, setImageZoom] = useState(1);
  
  // Reset index when modal opens with new evidence
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setImageZoom(1);
    }
  }, [isOpen, initialIndex]);
  
  // Safety check: Don't render if no evidence
  if (!evidence || evidence.length === 0 || !isOpen) return null;
  
  const currentItem = evidence[currentIndex];

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : evidence.length - 1));
    setImageZoom(1); // Reset zoom when changing items
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < evidence.length - 1 ? prev + 1 : 0));
    setImageZoom(1); // Reset zoom when changing items
  };

  const handleZoomIn = () => {
    setImageZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setImageZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') goToPrevious();
    if (e.key === 'ArrowRight') goToNext();
    if (e.key === 'Escape') onClose();
  };

  const renderEvidenceContent = (item: EmbeddedEvidence) => {
    const isImage = item.type === 'image' || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(item.url);
    const isVideo = item.type === 'video' || /\.(mp4|webm|ogg|mov)$/i.test(item.url);
    const isPDF = item.type === 'pdf' || item.url.toLowerCase().endsWith('.pdf');

    if (isImage) {
      return (
        <div className="relative flex items-center justify-center w-full h-full overflow-auto">
          <img
            src={item.url}
            alt={item.title || 'Evidence'}
            className="max-w-full max-h-full object-contain transition-transform duration-200"
            style={{ transform: `scale(${imageZoom})` }}
            loading="eager"
          />
        </div>
      );
    }

    if (isVideo) {
      return (
        <div className="flex items-center justify-center w-full h-full">
          <video
            src={item.url}
            controls
            className="max-w-full max-h-full"
            autoPlay={false}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    if (isPDF) {
      return (
        <div className="w-full h-full">
          <iframe
            src={item.url}
            className="w-full h-full border-0"
            title={item.title || 'PDF Document'}
          />
        </div>
      );
    }

    // Fallback for links and other types
    return (
      <div className="flex flex-col items-center justify-center w-full h-full p-12 text-center">
        <div className="glassmorphic p-12 rounded-2xl max-w-2xl">
          {item.thumbnailUrl && (
            <img
              src={item.thumbnailUrl}
              alt={item.title || 'Preview'}
              className="w-full max-h-64 object-contain rounded-lg mb-6"
            />
          )}
          <div className="mb-4">
            <div className="text-6xl mb-4">
              {item.type === 'link' ? '🔗' : '📄'}
            </div>
            <h3 className="text-2xl font-semibold text-text-primary mb-2">
              {item.title || 'External Link'}
            </h3>
            {item.description && (
              <p className="text-text-secondary mb-6 max-w-xl mx-auto">
                {item.description}
              </p>
            )}
          </div>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 font-medium"
          >
            <ExternalLink className="w-5 h-5" />
            Open in New Tab
          </a>
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="dialog"
        aria-modal="true"
        aria-label="Evidence viewer"
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/50 to-transparent">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-white">
                {currentItem.title || 'Evidence'}
              </h2>
              <p className="text-sm text-white/70">
                {currentIndex + 1} of {evidence.length}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Zoom controls (only for images) */}
              {(currentItem.type === 'image' || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(currentItem.url)) && (
                <div className="flex items-center gap-1 mr-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleZoomOut();
                    }}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                    title="Zoom out"
                    disabled={imageZoom <= 0.5}
                  >
                    <ZoomOut className="w-5 h-5" />
                  </button>
                  <span className="text-white text-sm px-2 min-w-[4rem] text-center">
                    {Math.round(imageZoom * 100)}%
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleZoomIn();
                    }}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                    title="Zoom in"
                    disabled={imageZoom >= 3}
                  >
                    <ZoomIn className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* External link button */}
              <a
                href={currentItem.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Open in new tab"
              >
                <ExternalLink className="w-5 h-5" />
              </a>

              {/* Close button */}
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div
          className="absolute inset-0 flex items-center justify-center p-4 pt-24 pb-20"
          onClick={(e) => e.stopPropagation()}
        >
          {renderEvidenceContent(currentItem)}
        </div>

        {/* Navigation arrows */}
        {evidence.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-sm"
              title="Previous (←)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-sm"
              title="Next (→)"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
          <div className="max-w-7xl mx-auto">
            {currentItem.description && (
              <p className="text-white/90 text-center mb-2">
                {currentItem.description}
              </p>
            )}
            {/* Thumbnail navigation */}
            {evidence.length > 1 && (
              <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
                {evidence.map((item, index) => (
                  <button
                    key={item.id || index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentIndex(index);
                      setImageZoom(1);
                    }}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all duration-200 ${
                      index === currentIndex
                        ? 'ring-2 ring-primary scale-110'
                        : 'opacity-50 hover:opacity-100'
                    }`}
                    title={item.title || `Evidence ${index + 1}`}
                  >
                    {item.thumbnailUrl || (item.type === 'image' || /\.(jpg|jpeg|png|gif|webp)$/i.test(item.url)) ? (
                      <img
                        src={item.thumbnailUrl || item.url}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-white/10 flex items-center justify-center text-white text-xs">
                        {item.type === 'video' ? '🎥' : item.type === 'pdf' ? '📄' : '🔗'}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EvidenceModal;

