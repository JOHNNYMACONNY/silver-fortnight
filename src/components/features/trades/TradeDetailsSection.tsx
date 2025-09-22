import React from 'react';
import { motion } from 'framer-motion';
import { TradeSkillDisplay } from './TradeSkillDisplay';
import { Trade } from '../../../services/firestore-exports';
import { cn } from '../../../utils/cn';

interface TradeDetailsSectionProps {
  trade: Trade;
}

const EmptyState: React.FC<{ type: 'offered' | 'requested' }> = ({ type }) => (
  <motion.div 
    className="glassmorphic p-6 text-center border border-dashed border-border/50"
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3 }}
  >
    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted/20 flex items-center justify-center">
      <span className="text-2xl">{type === 'offered' ? '🎯' : '🔍'}</span>
    </div>
    <p className="text-muted-foreground text-sm">
      No skills {type === 'offered' ? 'offered' : 'requested'}
    </p>
  </motion.div>
);

export const TradeDetailsSection: React.FC<TradeDetailsSectionProps> = React.memo(({
  trade
}) => {
  const skillsOffered = trade.skillsOffered || trade.offeredSkills || [];
  const skillsWanted = trade.skillsWanted || trade.requestedSkills || [];

  return (
    <section 
      id="trade-details-section"
      aria-labelledby="trade-details-heading"
      className="glassmorphic p-4 sm:p-6 mb-6 border border-border/50 backdrop-blur-sm"
    >
      <h2 id="trade-details-heading" className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4">
        Trade Description
      </h2>
      <div className="text-muted-foreground mb-6 whitespace-pre-line text-sm sm:text-base leading-relaxed" role="text" aria-label="Trade description">
        {trade.description}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skills Offered */}
        <motion.div 
          className="glassmorphic p-4 border border-border/30"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <h3 id="offering-heading" className="text-base sm:text-lg font-semibold text-foreground mb-4 flex items-center gap-3">
            <div className="w-3 h-3 bg-success rounded-full shadow-sm"></div>
            <span>Skills Offered</span>
            <span className="text-xs bg-success/20 text-success-foreground px-2 py-1 rounded-full">
              {skillsOffered.length}
            </span>
          </h3>
          <div 
            className="flex flex-wrap gap-2" 
            role="list" 
            aria-labelledby="offering-heading"
            aria-label="List of skills being offered in this trade"
          >
            {skillsOffered.length > 0 ? (
              skillsOffered.map((skill: any, index: number) => (
                <motion.div 
                  key={index} 
                  role="listitem"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <TradeSkillDisplay
                    skill={skill}
                    variant="offered"
                    size="md"
                  />
                </motion.div>
              ))
            ) : (
              <EmptyState type="offered" />
            )}
          </div>
        </motion.div>

        {/* Skills Requested */}
        <motion.div 
          className="glassmorphic p-4 border border-border/30"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <h3 id="seeking-heading" className="text-base sm:text-lg font-semibold text-foreground mb-4 flex items-center gap-3">
            <div className="w-3 h-3 bg-info rounded-full shadow-sm"></div>
            <span>Skills Sought</span>
            <span className="text-xs bg-info/20 text-info-foreground px-2 py-1 rounded-full">
              {skillsWanted.length}
            </span>
          </h3>
          <div 
            className="flex flex-wrap gap-2" 
            role="list" 
            aria-labelledby="seeking-heading"
            aria-label="List of skills being sought in this trade"
          >
            {skillsWanted.length > 0 ? (
              skillsWanted.map((skill: any, index: number) => (
                <motion.div 
                  key={index} 
                  role="listitem"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <TradeSkillDisplay
                    skill={skill}
                    variant="requested"
                    size="md"
                  />
                </motion.div>
              ))
            ) : (
              <EmptyState type="requested" />
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
});

TradeDetailsSection.displayName = 'TradeDetailsSection';
