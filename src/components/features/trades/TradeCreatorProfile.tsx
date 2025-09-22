import React from 'react';
import { Link } from 'react-router-dom';
import ProfileImageWithUser from '../../ui/ProfileImageWithUser';
import { Trade } from '../../../services/firestore-exports';
import { User } from '../../../services/firestore-exports';

interface TradeCreatorProfileProps {
  trade: Trade;
  tradeCreator: User | null;
  loadingCreator: boolean;
}

export const TradeCreatorProfile: React.FC<TradeCreatorProfileProps> = React.memo(({
  trade,
  tradeCreator,
  loadingCreator
}) => {
  return (
    <div className="glassmorphic p-6 border-b border-border">
      <h2 className="text-xl font-semibold text-foreground mb-4 transition-colors duration-300 hover:text-primary">
        Posted By
      </h2>
      <div className="flex items-center group">
        <div className="flex-shrink-0">
          {loadingCreator ? (
            <div className="w-16 h-16 rounded-full bg-muted animate-pulse glassmorphic transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-primary/20"></div>
          ) : (
            <div className="w-16 h-16 rounded-full glassmorphic p-1 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-primary/20 hover:border-primary/30 group-hover:border-primary/40">
              <ProfileImageWithUser
                userId={trade.creatorId || ''}
                profileUrl={tradeCreator?.profilePicture || tradeCreator?.photoURL}
                size="medium"
                className="w-14 h-14 rounded-full transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          )}
        </div>
        <div className="ml-4 flex-1">
          <h3 className="text-lg font-medium text-foreground transition-colors duration-300 group-hover:text-primary">
            {tradeCreator?.displayName || 'Unknown User'}
          </h3>
          {tradeCreator && (
            <p className="text-muted-foreground text-sm transition-colors duration-300 group-hover:text-foreground">
              {tradeCreator.location || 'No location provided'}
            </p>
          )}
          <div className="mt-2">
            <Link
              to={`/profile/${trade.creatorId}`}
              className="inline-flex items-center gap-2 text-primary hover:text-primary/90 text-sm font-medium glassmorphic px-4 py-2 rounded-lg transition-all duration-300 hover:bg-primary/10 hover:shadow-lg hover:shadow-primary/20 hover:scale-105 active:scale-95 group/link"
            >
              <span className="transition-transform duration-200 group-hover/link:translate-x-1">
                View Profile
              </span>
              <svg 
                className="w-4 h-4 transition-transform duration-200 group-hover/link:translate-x-1" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
});

TradeCreatorProfile.displayName = 'TradeCreatorProfile';
