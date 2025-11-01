import React from "react";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { CollaborationCard } from "../../../components/features/collaborations/CollaborationCard";

interface CollaborationsTabProps {
  // Data
  collaborations: any[] | null;
  collaborationsLoading: boolean;
  filteredCollaborations: any[];
  userRoleByCollabId: Record<string, string>;
  targetUserId: string;

  // Pagination
  collabVisibleCount: number;
  onLoadMore: () => void;
  isLoadingMore: boolean;

  // Filter
  collabFilter: "all" | "yours";
  onFilterChange: (filter: "all" | "yours") => void;

  // Navigation
  isOwnProfile: boolean;
  onNavigate: (path: string) => void;

  // Refs
  sentinelRef: React.RefObject<HTMLDivElement>;
}

const CollaborationsTabComponent: React.FC<CollaborationsTabProps> = ({
  collaborations,
  collaborationsLoading,
  filteredCollaborations,
  userRoleByCollabId,
  targetUserId,
  collabVisibleCount,
  onLoadMore,
  isLoadingMore,
  collabFilter,
  onFilterChange,
  isOwnProfile,
  onNavigate,
  sentinelRef,
}) => {
  if (collaborationsLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-40 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!collaborations || collaborations.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-muted-foreground">No collaborations yet.</p>
        <div className="flex items-center justify-center gap-2">
          {isOwnProfile && (
            <Button
              topic="collaboration"
              onClick={() => onNavigate("/collaborations/new")}
            >
              Create a collaboration
            </Button>
          )}
          <Button variant="outline" onClick={() => onNavigate("/collaborations")}>
            Browse collaborations
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="text-sm text-muted-foreground">
          <span className="hidden sm:inline">Showing </span>
          {Math.min(collabVisibleCount, filteredCollaborations.length)} of{" "}
          {filteredCollaborations.length}
          <span className="sm:hidden"> collaborations</span>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-sm text-muted-foreground hidden sm:inline">
            Show:
          </label>
          <select
            className="w-full sm:w-auto rounded-xl border-glass glassmorphic backdrop-blur-xl bg-white/5 text-foreground text-sm px-3 py-2 outline-hidden focus:ring-2 focus:ring-primary/50 transition-all duration-200"
            value={collabFilter}
            onChange={(e) => {
              onFilterChange(e.target.value as "all" | "yours");
            }}
          >
            <option value="all">All collaborations</option>
            <option value="yours">Created by me</option>
          </select>
        </div>
      </div>
      <div
        id="profile-trades-list"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4"
      >
        {filteredCollaborations
          .slice(0, collabVisibleCount)
          .map((c) => (
            <div key={c.id} className="space-y-2">
              <CollaborationCard collaboration={c as any} variant="premium" />
              {/* Role hint */}
              <div className="text-xs text-muted-foreground">
                {c?.creatorId === targetUserId ? (
                  <Badge variant="outline">Your role: Creator</Badge>
                ) : userRoleByCollabId[c.id] ? (
                  <Badge variant="outline">
                    Your role: {userRoleByCollabId[c.id]}
                  </Badge>
                ) : Array.isArray(c?.participants) &&
                  c.participants.includes(targetUserId) ? (
                  <Badge variant="outline">Your role: Participant</Badge>
                ) : null}
              </div>
            </div>
          ))}
      </div>
      <div className="flex flex-col sm:flex-row justify-center sm:justify-end gap-2 mt-4">
        {filteredCollaborations &&
          collabVisibleCount < filteredCollaborations.length && (
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={onLoadMore}
              disabled={isLoadingMore}
              aria-busy={isLoadingMore}
              aria-controls="profile-collaborations-list"
              aria-label={`Load more collaborations. Currently showing ${collabVisibleCount} of ${filteredCollaborations.length}`}
            >
              {isLoadingMore ? "Loading…" : "Load more"}
            </Button>
          )}
        <span className="sr-only" aria-live="polite" aria-atomic="true">
          {isLoadingMore
            ? `Loading more collaborations. Currently showing ${collabVisibleCount} of ${filteredCollaborations.length}`
            : ""}
        </span>
        <Button
          variant="outline"
          className="w-full sm:w-auto"
          onClick={() => onNavigate("/collaborations")}
          aria-label={`View all ${filteredCollaborations?.length || 0} collaborations`}
        >
          View all collaborations
        </Button>
      </div>
      <div ref={sentinelRef} className="h-1" aria-hidden="true" />
    </>
  );
};

export const CollaborationsTab = React.memo(CollaborationsTabComponent);
