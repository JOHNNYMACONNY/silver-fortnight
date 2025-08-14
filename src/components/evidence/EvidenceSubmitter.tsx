import React, { useState } from 'react';
import { EmbeddedEvidence, EvidenceSubmitterProps } from '../../types/evidence';
import { createEmbeddedEvidence, detectService, isValidEmbedUrl } from '../../utils/embedUtils';
import Box from '../layout/primitives/Box';

const EvidenceSubmitter: React.FC<EvidenceSubmitterProps> = ({
  evidence,
  onChange,
  maxItems = 10
}) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [embedType, setEmbedType] = useState<'image' | 'video' | 'audio' | 'document' | 'code' | 'design' | 'other'>('other');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    try {
      if (!url.trim()) {
        throw new Error('URL is required');
      }

      // Basic URL validation
      try {
        new URL(url);
      } catch {
        throw new Error('Please enter a valid URL');
      }

      // Check if URL is from a supported service
      if (!isValidEmbedUrl(url)) {
        // If not a supported embed service, show a warning but still allow it
        console.warn('URL is not from a supported embed service, but will be added as a regular link');
      }

      // Detect service for better type assignment
      const service = detectService(url);
      const detectedType = service?.type as 'image' | 'video' | 'audio' | 'document' | 'code' | 'design' | 'other' || embedType;

      // Create embedded evidence with proper embedding
      const newEvidence = await createEmbeddedEvidence(
        url,
        title || url,
        description || '',
        'temp-user-id', // This will be replaced by the actual user ID
        undefined, // Use undefined to let the function handle it
        undefined  // Use undefined to let the function handle it
      ).catch(() => {
        // Fallback if createEmbeddedEvidence fails
        return {
          id: `evidence-${Date.now()}`,
          userId: 'temp-user-id',
          createdAt: new Date(),
          embedType: detectedType,
          embedUrl: url,
          embedService: service?.name || 'website',
          originalUrl: url,
          title: title || url,
          description: description || '',
          // Add null values for optional fields to avoid undefined
          userName: null,
          userPhotoURL: null,
          embedCode: null,
          thumbnailUrl: null
        } as EmbeddedEvidence;
      });

      // Clean the evidence object to ensure no undefined values
      const cleanEvidence = { ...newEvidence };
      Object.keys(cleanEvidence).forEach(key => {
        if ((cleanEvidence as any)[key] === undefined) {
          (cleanEvidence as any)[key] = null;
        }
      });

      console.log('Clean evidence object:', cleanEvidence);

      // Add to evidence array - use the cleaned evidence object
      const updatedEvidence = [...evidence, cleanEvidence];
      onChange(updatedEvidence);

      // Reset form
      setUrl('');
      setTitle('');
      setDescription('');
      setEmbedType('other');
    } catch (err: any) {
      setError(err.message || 'Failed to add evidence');
    }
  };

  const handleRemove = (id: string) => {
    const updatedEvidence = evidence.filter(item => item.id !== id);
    onChange(updatedEvidence);
  };

  return (
    <Box className="space-y-4 @container" style={{ containerType: 'inline-size' }}>
      {/* Current evidence items */}
      {evidence.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Added Evidence ({evidence.length}/{maxItems})</h4>
          <div className="space-y-2">
            {evidence.map(item => (
              <div key={item.id} className="flex justify-between items-center p-2 bg-muted/50 rounded border border-border">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-foreground">{item.title}</p>
                  <p className="text-sm text-muted-foreground truncate">{item.embedUrl}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  className="ml-2 text-red-500 hover:text-red-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add new evidence form */}
      {evidence.length < maxItems && (
        <div className="space-y-4 border border-border rounded-md p-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="evidence-type" className="block text-sm font-medium mb-1">
              Evidence Type
            </label>
            <select
              id="evidence-type"
              value={embedType}
              onChange={(e) => setEmbedType(e.target.value as 'image' | 'video' | 'audio' | 'document' | 'code' | 'design' | 'other')}
              className="w-full rounded-md border border-input px-3 py-2 text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
            >
              <option value="image">Image</option>
              <option value="video">Video</option>
              <option value="audio">Audio</option>
              <option value="document">Document</option>
              <option value="code">Code</option>
              <option value="design">Design</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="evidence-url" className="block text-sm font-medium mb-1">
              URL *
            </label>
            <input
              id="evidence-url"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full rounded-md border border-input px-3 py-2 text-foreground bg-background placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
              placeholder="https://example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="evidence-title" className="block text-sm font-medium mb-1">
              Title (Optional)
            </label>
            <input
              id="evidence-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-input px-3 py-2 text-foreground bg-background placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
              placeholder="My Project"
            />
          </div>

          <div>
            <label htmlFor="evidence-description" className="block text-sm font-medium mb-1">
              Description (Optional)
            </label>
            <textarea
              id="evidence-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-input px-3 py-2 text-foreground bg-background placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
              placeholder="Brief description of this evidence"
            />
          </div>

          <div>
            <button
              type="button"
              onClick={() => handleSubmit()}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              Add Evidence
            </button>
          </div>
        </div>
      )}
    </Box>
  );
};

export default EvidenceSubmitter;
