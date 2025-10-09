import React from 'react';
import { TradeProposal, TradeSkill } from '../../../services/firestore';
import ProfileImageWithUser from '../../ui/ProfileImageWithUser';
import { EvidenceGallery } from '../../features/evidence/EvidenceGallery';
import { motion } from 'framer-motion';
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
  className?: string;
}

const TradeProposalCard: React.FC<TradeProposalCardProps> = ({
  proposal,
  onAccept,
  onReject,
  isCreator,
  variant = 'premium', // Use premium variant for standardization
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
      // In production, we should use a proper logging service instead of console.error
      // For now, we'll return a fallback value
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
    <article
      className={`${className}`}
      aria-labelledby="proposal-title"
      aria-describedby="proposal-message"
    >
      <div className="flex flex-col">
        {/* Header: User Info and Status */}
        <div className="p-0 pb-3 sm:pb-4 space-y-3">
          <header className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
              {/* User Profile Section */}
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="flex-shrink-0">
                  <ProfileImageWithUser
                    userId={proposal.proposerId}
                    profileUrl={proposal.proposerPhotoURL}
                    size="medium"
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full ring-2 ring-border/50"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 
                    id="proposal-title"
                    className="text-base sm:text-lg font-semibold text-foreground hover:text-primary/80 transition-colors duration-200 truncate"
                  >
                    {proposal.proposerName || 'Anonymous'}
                  </h3>
                  <time 
                    dateTime={proposal.createdAt?.toDate?.()?.toISOString()}
                    className="text-xs sm:text-sm text-muted-foreground block"
                  >
                    Proposed {formatDate(proposal.createdAt)}
                  </time>
                </div>
              </div>
              
              {/* Status Badge */}
              <Badge 
                variant={getStatusVariant(proposal.status)} 
                className="flex-shrink-0 self-start sm:self-auto px-3 py-1"
                aria-label={`Proposal status: ${proposal.status}`}
              >
              {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
            </Badge>
          </header>
        </div>

      {/* Content: Message, Skills, Evidence */}
      <div className="space-y-4 sm:space-y-5 md:space-y-6 px-0 sm:px-0 md:px-0 pt-0 pb-4 sm:pb-5 md:pb-6">
        <main className="space-y-4 sm:space-y-5 md:space-y-6">
          {/* Proposal Message */}
          <section className="space-y-2" aria-labelledby="proposal-message-heading">
            <h4 
              id="proposal-message-heading"
              className="text-xs font-bold text-foreground/80 uppercase tracking-wider flex items-center gap-2"
            >
              <span className="w-1 h-4 rounded-full bg-primary/60" aria-hidden="true"></span>
              Message
            </h4>
            <div className="rounded-lg sm:rounded-xl bg-white/5 dark:bg-white/5 border border-white/20 p-3 sm:p-4 md:p-5 hover:border-white/30 transition-all duration-200 overflow-hidden">
              <p 
                id="proposal-message"
                className="text-xs sm:text-sm md:text-base text-foreground/90 whitespace-pre-line leading-relaxed break-words overflow-wrap-anywhere max-w-full"
              >
                {proposal.message}
              </p>
            </div>
          </section>

          {/* Skills Section */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 lg:gap-6" aria-label="Skills exchange">
            {/* Skills Offered */}
            <div className="space-y-2">
              <h4 
                id="skills-offered-heading"
                className="text-xs font-bold text-foreground/80 uppercase tracking-wider flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-500/50" aria-hidden="true"></span>
                Skills Offered
              </h4>
              <div 
                className="rounded-xl bg-white/5 dark:bg-white/5 border border-white/20 p-3 sm:p-4 min-h-[80px] hover:border-green-500/30 transition-all duration-200 relative after:absolute after:inset-0 after:rounded-xl after:bg-gradient-to-br after:from-green-500/5 after:to-transparent after:pointer-events-none"
                role="list"
                aria-labelledby="skills-offered-heading"
              >
                <div className="flex flex-wrap gap-2 relative z-10">
                  {proposal.skillsOffered && proposal.skillsOffered.length > 0 ? (
                    proposal.skillsOffered.map((skill, index) => (
                      <SkillBadge key={`offered-${skill.name}-${index}`} skill={skill.name} level={skill.level} />
                    ))
                  ) : (
                    <span className="text-xs sm:text-sm text-muted-foreground italic">
                      No skills specified
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Skills Requested */}
            <div className="space-y-2">
              <h4 
                id="skills-requested-heading"
                className="text-xs font-bold text-foreground/80 uppercase tracking-wider flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" aria-hidden="true"></span>
                Skills Requested
              </h4>
              <div 
                className="rounded-xl bg-white/5 dark:bg-white/5 border border-white/20 p-3 sm:p-4 min-h-[80px] hover:border-blue-500/30 transition-all duration-200 relative after:absolute after:inset-0 after:rounded-xl after:bg-gradient-to-br after:from-blue-500/5 after:to-transparent after:pointer-events-none"
                role="list"
                aria-labelledby="skills-requested-heading"
              >
                <div className="flex flex-wrap gap-2 relative z-10">
                  {proposal.skillsRequested && proposal.skillsRequested.length > 0 ? (
                    proposal.skillsRequested.map((skill, index) => (
                      <SkillBadge key={`requested-${skill.name}-${index}`} skill={skill.name} level={skill.level} />
                    ))
                  ) : (
                    <span className="text-xs sm:text-sm text-muted-foreground italic">
                      No skills specified
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Evidence Section */}
          {proposal.evidence && proposal.evidence.length > 0 && (
            <section className="space-y-2" aria-labelledby="evidence-heading">
              <h4 
                id="evidence-heading"
                className="text-xs font-bold text-foreground/80 uppercase tracking-wider flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-orange-500 shadow-sm shadow-orange-500/50" aria-hidden="true"></span>
                Portfolio Evidence ({proposal.evidence.length})
              </h4>
              <div className="rounded-xl bg-white/5 dark:bg-white/5 border border-white/20 p-4 sm:p-5 hover:border-orange-500/30 transition-all duration-200 relative after:absolute after:inset-0 after:rounded-xl after:bg-gradient-to-br after:from-orange-500/5 after:to-transparent after:pointer-events-none">
                <div className="relative z-10">
                  <EvidenceGallery evidence={proposal.evidence} />
                </div>
              </div>
            </section>
          )}
        </main>
      </div>

      {/* Footer: Action Buttons (only for pending proposals) */}
      {isCreator && proposal.status === 'pending' && (
        <div className="p-0 pt-3 sm:pt-4 md:pt-5 border-t border-border/30">
          <footer className="flex flex-col sm:flex-row justify-stretch sm:justify-end gap-2 sm:gap-3 w-full" role="group" aria-label="Proposal actions">
            <Button 
              variant="outline" 
              onClick={onReject} 
              className="w-full sm:w-auto min-w-[120px] sm:min-w-[140px] order-2 sm:order-1 glassmorphic hover:bg-destructive/10 hover:border-destructive/50 transition-all duration-200 text-sm sm:text-base min-h-[44px]"
              aria-label="Reject this proposal"
            >
              Reject
            </Button>
            <Button 
              variant="glassmorphic"
              topic="trades"
              onClick={onAccept} 
              className="w-full sm:w-auto min-w-[120px] sm:min-w-[140px] order-1 sm:order-2 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all duration-200 text-sm sm:text-base min-h-[44px]"
              aria-label="Accept this proposal"
            >
              Accept Proposal
            </Button>
          </footer>
        </div>
      )}
      </div>
    </article>
  );
};

export default TradeProposalCard;
