import React, { useState } from 'react';
import { useAuth } from '../../../AuthContext';
import { createCollaboration, updateCollaboration, Collaboration } from '../../../services/firestore-exports';
import { MultipleImageUploader } from '../../features/uploads/MultipleImageUploader';
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
  const [images, setImages] = useState<string[]>(collaboration?.images || []);

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
        images,
        creatorId: currentUser.uid,
        ownerId: currentUser.uid,
        ownerName: userProfile.displayName || 'Anonymous',
        ownerPhotoURL: userProfile.photoURL,
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
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Basic Information Section */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Basic Information</h3>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Collaboration Title *</Label>
              <Input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g. Website Redesign for Small Business"
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Collaboration Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={6}
                placeholder="Describe your collaboration in detail..."
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category" className="text-base">
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
          </div>
        </div>

        {/* Details Section */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Collaboration Details</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="timeline">Timeline *</Label>
              <Input
                id="timeline"
                type="text"
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
                required
                placeholder="e.g. 2-3 weeks, 1-2 months"
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="compensation">Compensation *</Label>
              <Input
                id="compensation"
                type="text"
                value={compensation}
                onChange={(e) => setCompensation(e.target.value)}
                required
                placeholder="e.g. $500-1000, Skill exchange, Negotiable"
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. New York, NY"
                disabled={isRemote}
                className="text-base"
              />
              <div className="flex items-center space-x-2 mt-2">
                <Checkbox
                  id="isRemote"
                  checked={isRemote}
                  onCheckedChange={(checked) => setIsRemote(Boolean(checked))}
                />
                <Label htmlFor="isRemote" className="text-sm">This is a remote collaboration</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skillsNeeded">Skills Needed *</Label>
              <Input
                id="skillsNeeded"
                type="text"
                value={skillsNeeded}
                onChange={(e) => setSkillsNeeded(e.target.value)}
                required
                placeholder="e.g. React, UI Design, Content Writing (comma separated)"
                className="text-base"
              />
            </div>
          </div>
        </div>

        {/* Media Section */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Collaboration Media</h3>
          <div className="space-y-2">
            <Label>Collaboration Images</Label>
            <MultipleImageUploader
              onImagesChange={setImages}
              initialImageUrls={images}
              folder={`collaborations/${collaboration?.id || 'new'}`}
            />
          </div>
        </div>
        <div className="flex justify-end space-x-4 pt-6 border-t border-border">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
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
