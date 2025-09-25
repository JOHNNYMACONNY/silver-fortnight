import React from 'react';
import { TradeProposal, TradeSkill } from '../../../services/firestore';
import ProfileImageWithUser from '../../ui/ProfileImageWithUser';
import { EvidenceGallery } from '../../features/evidence/EvidenceGallery';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardContent, CardFooter } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { SkillBadge } from '../../ui/SkillBadge';

interface TradeProposalCardProps {
  proposal: TradeProposal;
  onAccept: () => void;
  onReject: () => void;
  isCreator: boolean;
  // Enhanced Card customization props for trade proposals
  variant?: 'default' | 'glass' | 'elevated' | 'premium';
  enhanced?: boolean; // Enable/disable enhanced effects
  className?: string;
}

const TradeProposalCard: React.FC<TradeProposalCardProps> = ({
  proposal,
  onAccept,
  onReject,
  isCreator,
  variant = 'premium', // Use premium variant for standardization
  enhanced = true, // Enable enhanced effects by default
  className
}) => {
  // Format date
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Recently';

    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }).format(date);
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'Invalid Date';
    }
  };

  // Get status variant
  const getStatusVariant = (status: string): 'default' | 'secondary' | 'outline' => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'default';
      case 'accepted':
        return 'secondary';
      case 'rejected':
        return 'outline'; // Or 'destructive' if available and appropriate
      case 'withdrawn':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <Card 
      // Enhanced Card props for trade proposal styling
      variant={variant}
      tilt={enhanced}
      tiltIntensity={5} // Moderate tilt for engaging trade feel
      depth="lg"
      glow={enhanced ? "subtle" : "none"}
      glowColor="orange" // Orange for TradeYa brand consistency
      hover={true}
      interactive={true}
      className={className}
    >
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-center min-w-0 flex-1">
            <div className="flex-shrink-0 mr-4">
              <ProfileImageWithUser
                userId={proposal.proposerId}
                profileUrl={proposal.proposerPhotoURL}
                size="medium"
                className="w-12 h-12 rounded-full"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold text-foreground hover:text-primary/80 transition-colors duration-200 truncate">
                {proposal.proposerName || 'Anonymous'}
              </h3>
              <p className="text-sm text-muted-foreground">
                Proposed {formatDate(proposal.createdAt)}
              </p>
            </div>
          </div>
          <Badge variant={getStatusVariant(proposal.status)} className="flex-shrink-0">
            {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="text-md font-medium text-foreground mb-2">Message</h4>
          <p className="text-muted-foreground whitespace-pre-line">{proposal.message}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="min-w-0">
            <h4 className="text-md font-medium text-foreground mb-2">Skills Offered</h4>
            <div className="flex flex-wrap gap-2">
              {proposal.skillsOffered && proposal.skillsOffered.length > 0 ? (
                proposal.skillsOffered.map((skill, index) => (
                  <SkillBadge key={index} skill={skill.name} level={skill.level} />
                ))
              ) : (
                <span className="text-sm text-muted-foreground italic">No skills specified</span>
              )}
            </div>
          </div>
          <div className="min-w-0">
            <h4 className="text-md font-medium text-foreground mb-2">Skills Requested</h4>
            <div className="flex flex-wrap gap-2">
              {proposal.skillsRequested && proposal.skillsRequested.length > 0 ? (
                proposal.skillsRequested.map((skill, index) => (
                  <SkillBadge key={index} skill={skill.name} level={skill.level} />
                ))
              ) : (
                <span className="text-sm text-muted-foreground italic">No skills specified</span>
              )}
            </div>
          </div>
        </div>
        {proposal.evidence && proposal.evidence.length > 0 && (
          <div>
            <h4 className="text-md font-medium text-foreground mb-2">Evidence</h4>
            <EvidenceGallery evidence={proposal.evidence} />
          </div>
        )}
      </CardContent>
      {isCreator && proposal.status === 'pending' && (
        <CardFooter className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-border">
          <Button variant="outline" onClick={onReject} className="w-full sm:w-auto">
            Reject
          </Button>
          <Button onClick={onAccept} className="w-full sm:w-auto">
            Accept Proposal
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default TradeProposalCard;
