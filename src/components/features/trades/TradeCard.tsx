import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SparklesIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Calendar } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { Card, CardHeader, CardContent, CardTitle } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { TradeStatusIndicator, type TradeStatus } from '../../animations/TradeStatusIndicator';
import ProfileAvatarButton from '../../ui/ProfileAvatarButton';
import { migrationRegistry, Trade as BaseTrade, TradeSkill } from '../../../services/migration';
import { formatDate } from '../../../utils/dateUtils';
import { themeClasses } from '../../../utils/themeUtils';
import { Button } from '../../ui/Button';
import { logger } from '@utils/logging/logger';

// Extended Trade interface to include missing fields used in the UI
export interface ExtendedTrade extends BaseTrade {
  creatorName?: string;
  creatorPhotoURL?: string;
  category?: string;
}

interface TradeCardProps {
  trade: ExtendedTrade;
  onInitiateTrade?: (tradeId: string) => void;
  className?: string;
  showInitiateButton?: boolean;
  showStatus?: boolean;
  // Enhanced Card customization props
  variant?: 'default' | 'glass' | 'elevated' | 'premium';
  enhanced?: boolean; // Enable/disable enhanced effects
}

type DisplaySkill = {
  name: string;
  level?: TradeSkill['level'];
};

const toDisplaySkill = (skill: TradeSkill | string | null | undefined): DisplaySkill | null => {
  if (!skill) {
    return null;
  }

  if (typeof skill === 'string') {
    const trimmed = skill.trim();
    return trimmed ? { name: trimmed } : null;
  }

  if (typeof skill === 'object') {
    const nameCandidates = [
      (skill as TradeSkill).name,
      (skill as any)?.label,
      (skill as any)?.title,
      (skill as any)?.id
    ];

    const resolvedName = nameCandidates.find(
      (candidate) => typeof candidate === 'string' && candidate.trim().length > 0
    );

    if (!resolvedName) {
      return null;
    }

    return {
      name: resolvedName.trim(),
      level: (skill as TradeSkill).level
    };
  }

  return null;
};

const mergeSkillSources = (
  primary: unknown,
  legacy: unknown
): DisplaySkill[] => {
  const combined = [
    ...(Array.isArray(primary) ? primary : []),
    ...(Array.isArray(legacy) ? legacy : [])
  ];

  const unique = new Map<string, DisplaySkill>();

  combined.forEach((entry) => {
    const normalized = toDisplaySkill(entry as TradeSkill | string | null | undefined);
    if (normalized) {
      const key = normalized.name.toLowerCase();
      if (!unique.has(key)) {
        unique.set(key, normalized);
      }
    }
  });

  return Array.from(unique.values());
};

const TradeCard: React.FC<TradeCardProps> = React.memo(({
  trade: initialTrade,
  onInitiateTrade,
  className = '',
  showInitiateButton = true,
  showStatus = false,
  variant = 'glass', // Default to glassmorphism for modern feel
  enhanced = true, // Enable enhanced effects by default
}) => {

  // Map trade status to TradeStatusIndicator status
  const mapTradeStatusToIndicatorStatus = (status: string): TradeStatus => {
    switch (status) {
      case 'draft':
      case 'active':
        return 'pending';
      case 'matched':
      case 'in-progress':
      case 'in_progress':
      case 'pending_evidence':
      case 'pending-evidence':
        return 'negotiating';
      case 'pending_confirmation':
      case 'pending-confirmation':
        return 'pending';
      case 'completed':
        return 'completed';
      case 'cancelled':
        return 'cancelled';
      case 'expired':
        return 'expired';
      default:
        return 'pending';
    }
  };
  const navigate = useNavigate();
  const [trade, setTrade] = useState<ExtendedTrade>(initialTrade);
  const [migrationStatus, setMigrationStatus] = useState<string>('ready');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Monitor migration status and refresh trade data if needed
  useEffect(() => {
    const refreshTradeData = async () => {
      if (!migrationRegistry.isInitialized()) {
        setMigrationStatus('not_initialized');
        return;
      }

      try {
        const tradeService = migrationRegistry.trades;
        const refreshedTrade = await tradeService.getTrade(initialTrade.id);
        
        if (refreshedTrade) {
          // Merge refreshed data with existing extended properties
          setTrade({
            ...refreshedTrade,
            creatorName: initialTrade.creatorName,
            creatorPhotoURL: initialTrade.creatorPhotoURL,
            category: initialTrade.category,
          } as ExtendedTrade);
          setMigrationStatus(migrationRegistry.isMigrationMode() ? 'compatibility' : 'direct');
        }
        setError(null);
      } catch (error) {
        logger.warn('Failed to refresh trade data through migration service:', 'COMPONENT', error);
        // Fallback to original trade data
        setTrade(initialTrade);
        setError('Migration service unavailable');
        setMigrationStatus('fallback');
      }
    };

    refreshTradeData();
  }, [initialTrade.id, initialTrade]);

  const handleInitiateTrade = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when button is clicked
    
    if (!trade.id) return;
    
    setIsRefreshing(true);
    try {
      // Use migration-aware trade operations if available
      if (migrationRegistry.isInitialized() && onInitiateTrade) {
        onInitiateTrade(trade.id);
      } else if (onInitiateTrade) {
        // Fallback to direct operation
        onInitiateTrade(trade.id);
      }
    } catch (error) {
      logger.error('Error initiating trade:', 'COMPONENT', {}, error as Error);
      setError('Failed to initiate trade');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCardClick = () => {
    if (trade.id) {
      navigate(`/trades/${trade.id}`);
    }
  };

  const handleCardKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (trade.id && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      navigate(`/trades/${trade.id}`);
    }
  };
  
  // Determine creator name with migration-aware fallback
  const getCreatorInfo = () => {
    // Try new format first
    if (trade.participants?.creator) {
      return {
        id: trade.participants.creator,
        name: trade.creatorName || `User ${trade.participants.creator.substring(0,6)}...`
      };
    }
    
    // Fallback to legacy format
    if (trade.creatorId) {
      return {
        id: trade.creatorId,
        name: trade.creatorName || `User ${trade.creatorId.substring(0,6)}...`
      };
    }
    
    // Ultimate fallback
    return {
      id: 'unknown',
      name: 'Unknown User'
    };
  };

  const creatorInfo = getCreatorInfo();
  const creatorInitial = creatorInfo.name?.charAt(0).toUpperCase() || 'U';

  // Get skills with migration compatibility
  const getSkills = (type: 'offered' | 'wanted'): DisplaySkill[] => {
    if (type === 'offered') {
      return mergeSkillSources(trade.skillsOffered, trade.offeredSkills);
    } else {
      return mergeSkillSources(trade.skillsWanted, trade.requestedSkills);
    }
  };

  const skillsOffered = getSkills('offered');
  const skillsWanted = getSkills('wanted');

  return (
    <motion.div layout>
      <div
        onKeyDown={handleCardKeyDown}
        tabIndex={0}
        role="button"
        aria-label={`View trade: ${trade.title}`}
        className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg"
      >
        <Card
          variant="premium"
          tilt={enhanced}
          depth="lg"
          glow={enhanced ? "subtle" : "none"}
          glowColor="orange"
          hover={true}
          interactive={true}
          onClick={handleCardClick}
          className={cn("h-[380px] flex flex-col cursor-pointer overflow-hidden", className)} // Standardized height and layout
        >
          {/* Standardized Header: Profile + Title + Status */}
          <CardHeader className="pb-3 flex-shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Clickable Profile Avatar */}
                {creatorInfo.id && creatorInfo.id !== 'unknown' && (
                  <ProfileAvatarButton
                    userId={creatorInfo.id}
                    size={32}
                    className="flex-shrink-0"
                  />
                )}
                {/* Title (truncated) */}
                <CardTitle className="truncate text-base font-semibold">
                  {trade.title}
                </CardTitle>
              </div>
              {/* Animated Status Indicator - Enhanced with TradeYa animations */}
              {showStatus && trade.status && (
                <TradeStatusIndicator
                  status={mapTradeStatusToIndicatorStatus(trade.status)}
                  size="sm"
                  showLabel={true}
                  showAnimation={true}
                  className="flex-shrink-0"
                />
              )}
            </div>
          </CardHeader>
          {/* Content Section */}
          <CardContent className="flex-1 overflow-hidden !flex !flex-col">
            {/* Skills Section - Compact */}
            <div className="flex-shrink-0 space-y-3 mb-3">
              {/* Skills Offered */}
              <div>
                <h4 className={cn(themeClasses.overline, 'mb-1.5')}>
                  Offering
                </h4>
                <div className="flex gap-1.5 flex-nowrap overflow-x-auto items-center">
                  {skillsOffered.length > 0 ? skillsOffered.slice(0, 3).map((skill, index) => (
                    <Badge key={index} variant="default" className="flex-shrink-0 whitespace-nowrap">{skill.name}</Badge>
                  )) : <span className={themeClasses.caption}>No skills offered</span>}
                  {skillsOffered.length > 3 && (
                    <Badge variant="outline" className="flex-shrink-0 whitespace-nowrap">+{skillsOffered.length - 3} more</Badge>
                  )}
                </div>
              </div>
              {/* Skills Wanted */}
              <div>
                <h4 className={cn(themeClasses.overline, 'mb-1.5')}>
                  Requesting
                </h4>
                <div className="flex gap-1.5 flex-nowrap overflow-x-auto items-center">
                  {skillsWanted.length > 0 ? skillsWanted.slice(0, 3).map((skill, index) => (
                    <Badge key={index} variant="secondary" className="flex-shrink-0 whitespace-nowrap">{skill.name}</Badge>
                  )) : <span className={themeClasses.caption}>No skills requested</span>}
                  {skillsWanted.length > 3 && (
                    <Badge variant="outline" className="flex-shrink-0 whitespace-nowrap">+{skillsWanted.length - 3} more</Badge>
                  )}
                </div>
              </div>
            </div>
            
            {/* Description Preview - Takes remaining space */}
            {trade.description && (
              <div className="flex-1 min-h-0 mb-3">
                <p className={cn(themeClasses.bodySmall, 'text-muted-foreground line-clamp-4')}>{trade.description}</p>
              </div>
            )}

            {showInitiateButton && typeof onInitiateTrade === 'function' && (
              <div className="mt-2 mb-3">
                <Button
                  variant="glassmorphic"
                  className="backdrop-blur-lg bg-white/10 text-white border border-white/15 shadow-[0_10px_30px_rgba(15,23,42,0.25)] transition-all duration-300 hover:bg-white/16 hover:shadow-[0_18px_45px_rgba(15,23,42,0.35)]"
                  fullWidth
                  isLoading={isRefreshing}
                  onClick={handleInitiateTrade}
                  disabled={isRefreshing}
                >
                  Join Trade
                </Button>
              </div>
            )}
            
            {/* Info Section - Pinned to bottom */}
            <div className={cn('flex items-center gap-2 sm:gap-3 mt-auto flex-shrink-0', themeClasses.caption)}>
              <div className="flex items-center min-w-0 flex-shrink-0">
                <Calendar className="mr-1 h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate text-xs">{formatDate(trade.createdAt)}</span>
              </div>
              {/* Chevron icon for interactivity */}
              <span className="ml-auto flex items-center opacity-60 group-hover:opacity-100 group-focus:opacity-100 transition-opacity flex-shrink-0">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
});

TradeCard.displayName = 'TradeCard';

export default TradeCard;
