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
  CardHeader,
  CardTitle,
} from '../../ui/Card';
import { Button } from '../../ui/Button';
import { GlassmorphicInput } from '../../ui/GlassmorphicInput';
import { AccessibleFormField } from '../../ui/AccessibleFormField';
import { useToast } from '../../../contexts/ToastContext';
import { CheckCircle, Eye, Loader2 } from 'lucide-react';

interface EvidenceSubmitterProps {
  onSubmit: (evidence: EmbeddedEvidence) => Promise<void>;
  onCancel?: () => void;
  variant?: 'standalone' | 'embedded';
  className?: string;
}

export const EvidenceSubmitter: React.FC<EvidenceSubmitterProps> = ({
  onSubmit,
  onCancel,
  variant = 'embedded',
  className = ''
}) => {
  const { currentUser } = useAuth();
  const { addToast } = useToast();

  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [serviceInfo, setServiceInfo] = useState<{ name: string; type: string } | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    url?: string;
    title?: string;
    description?: string;
  }>({});

  // Real-time validation function
  const validateField = (field: 'url' | 'title' | 'description', value: string) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'url':
        if (!value.trim()) {
          newErrors.url = 'URL is required';
        } else if (!isValidEmbedUrl(value)) {
          newErrors.url = 'Please enter a valid URL from a supported service';
        } else {
          delete newErrors.url;
        }
        break;
      case 'title':
        if (!value.trim()) {
          newErrors.title = 'Title is required';
        } else if (value.length < 5) {
          newErrors.title = 'Title must be at least 5 characters';
        } else {
          delete newErrors.title;
        }
        break;
      case 'description':
        if (!value.trim()) {
          newErrors.description = 'Description is required';
        } else if (value.length < 20) {
          newErrors.description = 'Description must be at least 20 characters';
        } else {
          delete newErrors.description;
        }
        break;
    }
    
    setErrors(newErrors);
  };

  // Validate URL and generate preview with debouncing
  useEffect(() => {
    if (!url) {
      setPreview(null);
      setServiceInfo(null);
      setIsLoadingPreview(false);
      return;
    }

    setIsLoadingPreview(true);
    
    // Debounce preview generation
    const timer = setTimeout(() => {
      if (isValidEmbedUrl(url)) {
        const service = detectService(url);
        setServiceInfo(service);
        const embedCode = generateSafeEmbedCode(url);
        setPreview(embedCode);
      } else {
        setPreview(null);
        setServiceInfo(null);
      }
      setIsLoadingPreview(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [url]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      addToast('error', 'You must be logged in to submit evidence');
      return;
    }

    // Validate all fields
    validateField('url', url);
    validateField('title', title);
    validateField('description', description);

    // Check if there are any errors
    const hasErrors = !url.trim() || !title.trim() || !description.trim() || 
                     !isValidEmbedUrl(url) || title.length < 5 || description.length < 20;
    
    if (hasErrors) {
      addToast('error', 'Please fix the errors in your evidence submission.');
      return;
    }

    setIsSubmitting(true);

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
      setErrors({});

      addToast('success', 'Evidence submitted successfully');
    } catch (err: any) {
      console.error('Error submitting evidence:', err);
      addToast('error', err.message || 'Failed to submit evidence');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formContent = (
    <div className={`space-y-3 sm:space-y-4 p-3 rounded-lg border border-border/30 bg-muted/10 ${className}`}>
      <p className="text-muted-foreground text-sm">
        Submit evidence from supported services to showcase your work.
      </p>
      
      {/* Evidence URL Field */}
      <AccessibleFormField
        label="Evidence URL"
        id="evidence-url"
        required
        hint="Paste a link from YouTube, Google Drive (files & folders), Google Docs/Sheets/Slides, Imgur, etc."
        error={errors.url}
      >
        <GlassmorphicInput
          id="evidence-url"
          type="text"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            validateField('url', e.target.value);
          }}
          placeholder="https://youtube.com/watch?v=..."
          required
          className="text-foreground"
          validationState={errors.url ? 'error' : serviceInfo ? 'success' : 'default'}
        />
      </AccessibleFormField>
      
      {/* Service Detection Badge */}
      {serviceInfo && (
        <div className="mt-2 flex items-center gap-2 text-sm text-success-foreground bg-success/10 border border-success/20 rounded-lg px-3 py-2">
          <CheckCircle className="h-4 w-4" />
          <span>Detected: {serviceInfo.name} ({serviceInfo.type})</span>
        </div>
      )}

      {/* Title Field */}
      <AccessibleFormField
        label="Title"
        id="title"
        required
        hint="Give your evidence a descriptive title"
        error={errors.title}
      >
        <GlassmorphicInput
          id="title"
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            validateField('title', e.target.value);
          }}
          placeholder="My Portfolio Project"
          required
          className="text-foreground"
          validationState={errors.title ? 'error' : title.length >= 5 ? 'success' : 'default'}
        />
      </AccessibleFormField>
      
      {/* Character Counter for Title */}
      <div className="text-xs text-muted-foreground -mt-2">
        {title.length}/50 characters
      </div>

      {/* Description Field */}
      <AccessibleFormField
        label="Description"
        id="description"
        required
        hint="Describe what this evidence shows and how it demonstrates your skills"
        error={errors.description}
      >
        <GlassmorphicInput
          id="description"
          type="textarea"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            validateField('description', e.target.value);
          }}
          placeholder="This project demonstrates my skills in..."
          required
          className="text-foreground min-h-[80px] max-h-[150px]"
          validationState={errors.description ? 'error' : description.length >= 20 ? 'success' : 'default'}
        />
      </AccessibleFormField>
      
      {/* Character Counter for Description */}
      <div className="text-xs text-muted-foreground -mt-2">
        {description.length}/100 characters
      </div>

      {/* Preview Section */}
      {preview && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </h4>
          <div className="border border-border/50 rounded-lg p-4 bg-muted/20 max-h-[200px] sm:max-h-[250px] overflow-y-auto">
            <div
              dangerouslySetInnerHTML={{ 
                __html: DOMPurify.sanitize(preview, {
                  ALLOWED_TAGS: ['iframe', 'video', 'audio', 'source', 'img', 'div', 'span', 'p', 'br', 'a', 'blockquote'],
                  ALLOWED_ATTR: ['src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen', 'controls', 'autoplay', 'loop', 'muted', 'poster', 'alt', 'class', 'style', 'href', 'title', 'data-id'],
                  ALLOW_DATA_ATTR: false,
                  FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur', 'onsubmit'],
                  FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'button', 'link']
                })
              }}
            />
          </div>
        </div>
      )}

      {/* Loading State for Preview */}
      {isLoadingPreview && (
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Generating preview...</span>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4 pt-3 sm:pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
        )}
        <Button
          type="button"
          onClick={handleSubmit}
          variant="premium"
          topic="trades"
          disabled={
            isSubmitting ||
            !url.trim() ||
            !title.trim() ||
            !description.trim() ||
            !isValidEmbedUrl(url) ||
            title.length < 5 ||
            description.length < 20
          }
          className="w-full sm:w-auto hover:shadow-orange-500/25 hover:shadow-lg transition-all duration-300"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Evidence'}
        </Button>
      </div>
    </div>
  );

  // Return with or without Card wrapper based on variant
  return variant === 'standalone' ? (
    <Card className="p-6">
      <CardHeader>
        <CardTitle>Submit Evidence</CardTitle>
      </CardHeader>
      <CardContent>
        {formContent}
      </CardContent>
    </Card>
  ) : (
    formContent
  );
};
