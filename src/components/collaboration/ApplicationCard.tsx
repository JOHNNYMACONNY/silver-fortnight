import React, { useState } from 'react';
import { RoleApplication } from '../../types/collaboration';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import ProfileImageWithUser from '../ui/ProfileImageWithUser';
import { EvidenceGallery } from '../features/evidence/EvidenceGallery';
import { EmbeddedEvidence } from '../../types/evidence';
import Box from '../layout/primitives/Box';

interface ApplicationCardProps {
  application: RoleApplication;
  onAccept: () => Promise<void>;
  onReject: () => Promise<void>;
}

export const ApplicationCard: React.FC<ApplicationCardProps> = ({
  application,
  onAccept,
  onReject
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAccept = async () => {
    setIsProcessing(true);
    try {
      await onAccept();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      await onReject();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Box className="@container mb-4" style={{ containerType: 'inline-size' }}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="bg-card text-card-foreground border border-border rounded-lg shadow-sm p-4"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <ProfileImageWithUser
              userId={application.applicantId}
              profileUrl={application.applicantPhotoURL}
              size="small"
            />
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {new Date(application.createdAt.toDate()).toLocaleDateString()}
          </div>
        </div>

        <div className="mt-4">
          <h4 className="text-sm font-medium text-foreground">Application Message</h4>
          <p className="mt-1 text-sm text-foreground">{application.message}</p>
        </div>

        {application.evidence && application.evidence.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-foreground">Portfolio Evidence</h4>
            <div className="mt-2">
              <EvidenceGallery evidence={application.evidence as EmbeddedEvidence[]} />
            </div>
          </div>
        )}

        <div className="mt-4 flex justify-end space-x-3">
          <Button
            onClick={handleReject}
            variant="secondary"
            size="sm"
            isLoading={isProcessing}
            aria-label="Reject application"
          >
            Reject
          </Button>
          <Button
            onClick={handleAccept}
            variant="default"
            size="sm"
            isLoading={isProcessing}
            aria-label="Accept application"
          >
            Accept
          </Button>
        </div>
      </motion.div>
    </Box>
  );
};

export type { ApplicationCardProps };