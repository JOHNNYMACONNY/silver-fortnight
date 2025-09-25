/**
 * EvidenceSubmitter Component
 *
 * A form component for submitting evidence from third-party services.
 * Validates URLs, shows previews, and handles submission.
 */

import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { useAuth } from '../../../AuthContext';
import {
  isValidEmbedUrl,
  detectService,
  generateSafeEmbedCode,
  createEmbeddedEvidence,
  EmbeddedEvidence
} from '../../../utils/embedUtils';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../ui/Card';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { useToast } from '../../../contexts/ToastContext';
import { Label } from '../../ui/Label';
import { Textarea } from '../../ui/Textarea';

interface EvidenceSubmitterProps {
  onSubmit: (evidence: EmbeddedEvidence) => Promise<void>;
  onCancel?: () => void;
  // roleId is for future use when associating evidence with specific collaboration roles
  roleId?: string;
  className?: string;
}

export const EvidenceSubmitter: React.FC<EvidenceSubmitterProps> = ({
  onSubmit,
  onCancel,
  roleId = '', // Default to empty string to avoid unused parameter warning
  className = ''
}) => {
  const { currentUser } = useAuth();
  const { addToast } = useToast();

  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [serviceInfo, setServiceInfo] = useState<{ name: string; type: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      const embedCode = generateSafeEmbedCode(url);
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

      addToast('success', 'Evidence submitted successfully');
    } catch (err: any) {
      console.error('Error submitting evidence:', err);
      setError(err.message || 'Failed to submit evidence');
      addToast('error', err.message || 'Failed to submit evidence');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={`p-4 ${className}`}>
      <CardHeader>
        <CardTitle>Submit Evidence</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Changed to div to prevent form submission */}
        <div className="evidence-form">
          {/* Hidden input to store roleId if provided */}
          {roleId && <input type="hidden" name="roleId" value={roleId} />}
          <div className="space-y-4">
            <div>
              <Label htmlFor="evidence-url">Evidence URL</Label>
              <Input
                id="evidence-url"
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
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your evidence a title"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this evidence shows"
                rows={3}
                required
              />
            </div>

            {preview && (
              <div className="mt-4">
                <h4 className="text-lg font-medium mb-2">Preview</h4>
                <div
                  className="border rounded-lg p-2 bg-muted"
                  dangerouslySetInnerHTML={{ 
                    __html: DOMPurify.sanitize(preview, {
                      ALLOWED_TAGS: ['iframe', 'video', 'audio', 'source', 'img', 'div', 'span', 'p', 'br'],
                      ALLOWED_ATTR: ['src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen', 'controls', 'autoplay', 'loop', 'muted', 'poster', 'alt', 'class', 'style'],
                      ALLOW_DATA_ATTR: false,
                      FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur'],
                      FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'button']
                    })
                  }}
                />
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button
          type="button"
          onClick={(e) => handleSubmit(e as any)}
          disabled={
            isSubmitting ||
            !url ||
            !title ||
            !description ||
            !isValidEmbedUrl(url)
          }
        >
          {isSubmitting ? 'Submitting...' : 'Submit Evidence'}
        </Button>
      </CardFooter>
    </Card>
  );
};
