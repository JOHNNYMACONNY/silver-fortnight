import React from 'react';
import { Link } from 'react-router-dom';
import { Edit, Trash2 } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { StandardPageHeader } from '../../layout/StandardPageHeader';
import { getTradeStatusClasses, formatStatus } from '../../../utils/statusUtils';
import { Trade } from '../../../services/firestore-exports';
import { User } from '../../../services/firestore-exports';

interface TradeDetailHeaderProps {
  trade: Trade;
  tradeCreator: User | null;
  loading: boolean;
  isOwner: boolean;
  onEdit: () => void;
  onDelete: () => void;
  formatDate: (date: Date) => string;
}

export const TradeDetailHeader: React.FC<TradeDetailHeaderProps> = React.memo(({
  trade,
  tradeCreator,
  loading,
  isOwner,
  onEdit,
  onDelete,
  formatDate
}) => {
  return (
    <>
      <div className="glassmorphic rounded-xl px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-5 mb-4 sm:mb-6 border border-border/50 backdrop-blur-sm shadow-lg">
        <Link 
          to="/trades" 
          className="font-medium text-primary hover:text-primary/90 text-sm sm:text-base"
          aria-label="Go back to trades list"
        >
          ← Back to Trades
        </Link>
      </div>

      {/* Hidden descriptions for screen readers */}
      <div className="sr-only">
        <div id="edit-trade-description">
          Edit this trade's details including title, description, and skills
        </div>
        <div id="delete-trade-description">
          Permanently delete this trade. This action cannot be undone.
        </div>
      </div>

      <StandardPageHeader
        title={trade.title}
        subtitle={`Posted by ${tradeCreator?.displayName || 'Unknown User'} • ${formatDate(trade.createdAt.toDate())}`}
        badge={{
          text: trade.category,
          variant: "outline",
          className: "border-primary/20 bg-primary/10 text-primary-foreground"
        }}
        actions={
          <div className="flex flex-col gap-2 items-end">
            <Badge 
              variant="outline" 
              className={`${getTradeStatusClasses(trade.status)} text-sm font-medium px-3 py-1`}
            >
              {formatStatus(trade.status)}
            </Badge>
            {isOwner && (
              <div className="flex flex-col sm:flex-row gap-2" role="group" aria-label="Trade management actions">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={onEdit}
                  className="flex items-center justify-center gap-2 min-h-[44px] min-w-[44px] text-sm sm:text-base transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                  aria-label={`Edit trade: ${trade.title}`}
                  aria-describedby="edit-trade-description"
                >
                  <Edit className="w-4 h-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Edit</span>
                  <span className="sm:hidden">Edit Trade</span>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={onDelete}
                  className="flex items-center justify-center gap-2 text-destructive hover:text-destructive min-h-[44px] min-w-[44px] text-sm sm:text-base transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                  aria-label={`Delete trade: ${trade.title}`}
                  aria-describedby="delete-trade-description"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Delete</span>
                  <span className="sm:hidden">Delete Trade</span>
                </Button>
              </div>
            )}
          </div>
        }
        isLoading={loading}
        loadingMessage="Loading trade details..."
      />
    </>
  );
});

TradeDetailHeader.displayName = 'TradeDetailHeader';
