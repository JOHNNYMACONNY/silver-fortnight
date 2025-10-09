import React, { useState } from 'react';
import { CollaborationRoleData } from '../../types/collaboration';
import { EmbeddedEvidence } from '../../types/evidence';
import EvidenceSubmitter from '../evidence/EvidenceSubmitter';
import EvidenceGallery from '../evidence/EvidenceGallery';
import { SkillBadge } from '../ui/SkillBadge';
import { Button } from '../ui/Button';
import Box from '../layout/primitives/Box';

interface RoleApplicationFormProps {
  role: CollaborationRoleData;
  collaborationTitle: string;
  onSubmit: (applicationData: {
    message: string;
    evidence?: EmbeddedEvidence[];
  }) => Promise<void>;
  onCancel: () => void;
}

export const RoleApplicationForm: React.FC<RoleApplicationFormProps> = ({
  role,
  collaborationTitle,
  onSubmit,
  onCancel
}) => {
  const [message, setMessage] = useState('');
  const [evidence, setEvidence] = useState<EmbeddedEvidence[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!message.trim()) {
      setError('Please explain why you are a good fit for this role');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        message,
        evidence: evidence.length > 0 ? evidence : undefined
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while submitting your application');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box className="@container" style={{ containerType: 'inline-size' }}>
      <div className="glassmorphic border-glass backdrop-blur-xl bg-white/5 rounded-xl p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            Apply for: {role.title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Part of collaboration: {collaborationTitle}
          </p>
        </div>

        <div className="mb-6">
          <h3 className="text-md font-medium text-foreground">Required Skills</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {role.requiredSkills?.map(skill => (
              <SkillBadge
                key={skill.name}
                skill={skill.name}
                level={skill.level}
              />
            ))}
          </div>

          {role.preferredSkills && role.preferredSkills.length > 0 && (
            <>
              <h3 className="mt-4 text-md font-medium text-foreground">Preferred Skills</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {role.preferredSkills.map(skill => (
                  <SkillBadge
                    key={skill.name}
                    skill={skill.name}
                    level={skill.level}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded dark:bg-red-900/20 dark:text-red-300 dark:border-red-800">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="role-application-message" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Why are you a good fit for this role?
            </label>
            <textarea
              id="role-application-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="mt-1 block w-full rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Describe your relevant experience, skills, and why you're interested in this role..."
              required
            />
            <p className="mt-1 text-sm text-muted-foreground">
              Be specific about your experience with the required skills and any relevant past work.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Portfolio Evidence (Optional)
            </label>
            <p className="text-sm text-muted-foreground mb-2">
              Add links to your work that demonstrates the required skills. This will strengthen your application.
            </p>

            {/* Display submitted evidence */}
            {evidence.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Submitted Evidence ({evidence.length})
                </h4>
                <EvidenceGallery evidence={evidence} className="mb-4" />
              </div>
            )}

            <EvidenceSubmitter
              evidence={evidence}
              onChange={setEvidence}
              maxItems={5}
            />
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="secondary"
              size="default"
              onClick={onCancel}
              disabled={isSubmitting}
              aria-label="Cancel application"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              size="default"
              isLoading={isSubmitting}
              disabled={isSubmitting}
              aria-label="Submit application"
            >
              Submit Application
          </Button>
        </div>
        </form>
      </div>
    </Box>
  );
};

export default RoleApplicationForm;
