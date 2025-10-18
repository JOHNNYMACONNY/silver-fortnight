import React, { useState } from 'react';
import { useAuth } from '../../../AuthContext';
import { createCollaboration, updateCollaboration, Collaboration } from '../../../services/firestore-exports';
import { EvidenceSubmitter } from '../../features/evidence/EvidenceSubmitter';
import { EmbeddedEvidence } from '../../../types/evidence';
import { useToast } from '../../../contexts/ToastContext';
import { Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../ui/Card';
import { Label } from '../../ui/Label';
import { Input } from '../../ui/Input';
import { Textarea } from '../../ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/Select';
import { Button } from '../../ui/Button';
import { Alert, AlertDescription } from '../../ui/Alert';
import { Checkbox } from '../../ui/Checkbox';
import { cn } from '../../../utils/cn';
import { PlusCircle, XCircle } from 'lucide-react';

interface CollaborationFormProps {
  collaboration?: Collaboration;
  onSuccess: (collaborationId: string) => void;
  onCancel?: () => void;
}

const COLLABORATION_CATEGORIES = [
  'Web Development',
  'Mobile Development',
  'UI/UX Design',
  'Graphic Design',
  'Content Writing',
  'Marketing',
  'Video Production',
  'Audio Production',
  'Photography',
  'Data Analysis',
  'Other'
];

export const CollaborationForm_legacy: React.FC<CollaborationFormProps> = ({ collaboration, onSuccess, onCancel }) => {
  const { currentUser, userProfile } = useAuth();
  const { addToast } = useToast();

  const [title, setTitle] = useState(collaboration?.title || '');
  const [description, setDescription] = useState(collaboration?.description || '');
  const [category, setCategory] = useState(collaboration?.category || COLLABORATION_CATEGORIES[0]);
  const [skillsNeeded, setSkillsNeeded] = useState(collaboration?.skillsNeeded?.join(', ') || '');
  const [timeline, setTimeline] = useState(collaboration?.timeline || '');
  const [compensation, setCompensation] = useState(collaboration?.compensation || '');
  const [location, setLocation] = useState(collaboration?.location || '');
  const [isRemote, setIsRemote] = useState(collaboration?.isRemote ?? true);
  const [mediaEvidence, setMediaEvidence] = useState<EmbeddedEvidence[]>(collaboration?.mediaEvidence || []);
  const [showEvidenceForm, setShowEvidenceForm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser || !userProfile) {
      setError('You must be logged in to create a collaboration');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Parse skills from comma-separated string to array
      const skillsArray = skillsNeeded
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill !== '');

      const collaborationData = {
        title,
        description,
        category,
        skillsNeeded: skillsArray,
        timeline,
        compensation,
        location,
        isRemote,
        mediaEvidence,
        creatorId: currentUser.uid,
        ownerId: currentUser.uid,
        ownerName: userProfile.displayName || 'Anonymous',
        ownerPhotoURL: userProfile.photoURL || null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        status: 'open' as const,
        public: true,
        visibility: 'public' as const,
      };

      let result;

      if (collaboration) {
        // Update existing collaboration
        if (collaboration.id) {
          result = await updateCollaboration(collaboration.id, collaborationData as any);

          if (result.error) {
            throw new Error(result.error.message || 'Failed to update collaboration');
          }

          addToast('success', 'Collaboration updated successfully');
          onSuccess(collaboration.id);
        }
      } else {
        // Create new collaboration
        result = await createCollaboration(collaborationData as any);

        if (result.error || !result.data) {
          throw new Error(result.error?.message || 'Failed to create collaboration');
        }

        addToast('success', 'Collaboration created successfully');
        onSuccess(result.data);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      addToast('error', err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <Alert variant="destructive" className="mx-auto max-w-2xl">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Basic Information Section */}
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-6 text-center">Basic Information</h3>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">Collaboration Title *</Label>
              <Input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g. Website Redesign for Small Business"
                className="text-base h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">Collaboration Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={6}
                placeholder="Describe your collaboration in detail..."
                className="text-base resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium">Category *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category" className="text-base h-12">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {COLLABORATION_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeline" className="text-sm font-medium">Timeline *</Label>
                <Input
                  id="timeline"
                  type="text"
                  value={timeline}
                  onChange={(e) => setTimeline(e.target.value)}
                  required
                  placeholder="e.g. 2-3 weeks, 1-2 months"
                  className="text-base h-12"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-6 text-center">Collaboration Details</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="compensation" className="text-sm font-medium">Compensation *</Label>
              <Input
                id="compensation"
                type="text"
                value={compensation}
                onChange={(e) => setCompensation(e.target.value)}
                required
                placeholder="e.g. $500-1000, Skill exchange, Negotiable"
                className="text-base h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-medium">Location</Label>
              <Input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. New York, NY"
                disabled={isRemote}
                className="text-base h-12"
              />
              <div className="flex items-center space-x-2 mt-3">
                <Checkbox
                  id="isRemote"
                  checked={isRemote}
                  onCheckedChange={(checked) => setIsRemote(Boolean(checked))}
                />
                <Label htmlFor="isRemote" className="text-sm">This is a remote collaboration</Label>
              </div>
            </div>

            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="skillsNeeded" className="text-sm font-medium">Skills Needed *</Label>
              <Input
                id="skillsNeeded"
                type="text"
                value={skillsNeeded}
                onChange={(e) => setSkillsNeeded(e.target.value)}
                required
                placeholder="e.g. React, UI Design, Content Writing (comma separated)"
                className="text-base h-12"
              />
            </div>
          </div>
        </div>

        {/* Media Section */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-6 text-center">Collaboration Media</h3>
          <div className="space-y-4">
            <Label className="text-sm font-medium">Collaboration Media Links</Label>
            <p className="text-xs text-muted-foreground">Add links to images, videos, documents, or design files to showcase your collaboration</p>
            
            {/* Display existing media */}
            {mediaEvidence.length > 0 && (
              <div className="space-y-3 rounded-lg glassmorphic border-glass backdrop-blur-xl bg-white/5 p-4">
                {mediaEvidence.map((evidence, index) => (
                  <div 
                    key={`media-${evidence.id || index}`}
                    className="flex items-center justify-between rounded-lg glassmorphic border-glass backdrop-blur-sm bg-white/5 p-3 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{evidence.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">{evidence.embedService} - {evidence.embedType}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (window.confirm(`Remove "${evidence.title}"?`)) {
                          const updated = [...mediaEvidence];
                          updated.splice(index, 1);
                          setMediaEvidence(updated);
                        }
                      }}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={`Remove ${evidence.title}`}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Evidence Form or Button */}
            {showEvidenceForm ? (
              <EvidenceSubmitter
                onSubmit={async (evidence) => {
                  setMediaEvidence([...mediaEvidence, evidence]);
                  setShowEvidenceForm(false);
                  addToast('success', 'Media added successfully');
                }}
                onCancel={() => setShowEvidenceForm(false)}
              />
            ) : (
              <Button
                type="button"
                variant="glassmorphic"
                topic="collaboration"
                onClick={() => setShowEvidenceForm(true)}
                className="w-full hover:shadow-purple-500/25 hover:shadow-lg transition-all duration-300 min-h-[44px]"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Media Link
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-center space-x-4 pt-8 border-t border-border">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} size="lg">
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={loading} size="lg">
            {loading ? 'Saving...' : collaboration ? 'Save Changes' : 'Create Collaboration'}
          </Button>
        </div>
      </form>
  );
};

export default CollaborationForm_legacy;
