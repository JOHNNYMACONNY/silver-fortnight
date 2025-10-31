import { useState, useEffect, useCallback } from "react";
import { collaborationService } from "../../../services/entities/CollaborationService";
import { collection, query, where, getDocs } from "firebase/firestore";
import { initializeFirebase, getFirebaseInstances } from "../../../firebase-config";

/**
 * Collaboration data interface
 */
export interface CollaborationData {
  id: string;
  title: string;
  description?: string;
  creatorId: string;
  participants?: string[];
  [key: string]: any;
}

/**
 * Return type for useCollaborationsData hook
 */
export interface CollaborationsDataHookReturn {
  collaborations: CollaborationData[] | null;
  collaborationsLoading: boolean;
  collabVisibleCount: number;
  setCollabVisibleCount: (count: number) => void;
  collabFilter: "all" | "yours";
  setCollabFilter: (filter: "all" | "yours") => void;
  userRoleByCollabId: Record<string, string>;
  setUserRoleByCollabId: (roles: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
  isLoadingMoreCollabs: boolean;
  setIsLoadingMoreCollabs: (loading: boolean) => void;
  filteredCollaborations: CollaborationData[];
  refetch: () => Promise<void>;
}

/**
 * Custom hook for fetching and managing collaborations data
 * Handles lazy loading, filtering, role enrichment, and pagination
 *
 * @param targetUserId - The ID of the user whose collaborations to fetch
 * @param activeTab - The currently active tab
 * @param roleEnrichmentEnabled - Whether to enrich collaborations with role data
 * @param showToast - Toast notification function
 * @returns CollaborationsDataHookReturn object with collaborations data and utilities
 *
 * @example
 * const { collaborations, filteredCollaborations, collabFilter, setCollabFilter } = 
 *   useCollaborationsData(userId, activeTab, true, showToast);
 */
export const useCollaborationsData = (
  targetUserId: string | undefined,
  activeTab: string,
  roleEnrichmentEnabled: boolean,
  showToast: (message: string, type: "error" | "success" | "info") => void
): CollaborationsDataHookReturn => {
  const [collaborations, setCollaborations] = useState<CollaborationData[] | null>(null);
  const [collaborationsLoading, setCollaborationsLoading] = useState(false);
  const [collabVisibleCount, setCollabVisibleCount] = useState(6);
  const [collabFilter, setCollabFilter] = useState<"all" | "yours">("all");
  const [userRoleByCollabId, setUserRoleByCollabId] = useState<Record<string, string>>({});
  const [isLoadingMoreCollabs, setIsLoadingMoreCollabs] = useState(false);

  // Lazy fetch collaborations when tab is activated
  useEffect(() => {
    if (!targetUserId) return;
    if (activeTab === "collaborations" && collaborations === null && !collaborationsLoading) {
      setCollaborationsLoading(true);
      collaborationService
        .getCollaborationsForUser(targetUserId)
        .then((res) => {
          if (res.error) {
            showToast(res.error.message || "Failed to load collaborations", "error");
            setCollaborations([]);
          } else {
            setCollaborations((res.data as CollaborationData[]) || []);
          }
        })
        .catch(() => setCollaborations([]))
        .finally(() => setCollaborationsLoading(false));
    }
  }, [activeTab, targetUserId, collaborationsLoading, showToast]);

  // Enrich collaborations with user role titles from roles subcollection
  useEffect(() => {
    if (!roleEnrichmentEnabled) return;
    if (!targetUserId || !collaborations || collaborations.length === 0) return;

    let isCancelled = false;

    (async () => {
      try {
        await initializeFirebase();
        const { db } = await getFirebaseInstances();
        if (!db || isCancelled) return;

        const roleMap: Record<string, string> = {};
        // Fetch roles for currently visible set first to avoid excessive reads
        const slice = collaborations.slice(0, collabVisibleCount);

        for (const c of slice) {
          // Skip if we already have a cached role for this collaboration
          if (userRoleByCollabId[c.id]) continue;

          try {
            const rolesRef = collection(db, "collaborations", c.id, "roles");
            const q = query(rolesRef, where("participantId", "==", targetUserId));
            const snap = await getDocs(q);
            const first = snap.docs[0]?.data() as any | undefined;
            if (first?.title) {
              roleMap[c.id] = String(first.title);
            }
          } catch {
            // ignore per-collaboration role fetch errors
          }
        }

        if (!isCancelled && Object.keys(roleMap).length > 0) {
          setUserRoleByCollabId((prev) => ({ ...prev, ...roleMap }));
        }
      } catch {
        // ignore batch errors
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [targetUserId, collaborations, collabVisibleCount, roleEnrichmentEnabled, userRoleByCollabId]);

  // Filter collaborations based on filter setting
  const filteredCollaborations = useCallback(() => {
    if (!collaborations) return [] as CollaborationData[];
    if (collabFilter === "yours") {
      return collaborations.filter(
        (c) =>
          c?.creatorId === targetUserId ||
          (Array.isArray(c?.participants) && targetUserId && c.participants.includes(targetUserId))
      );
    }
    return collaborations;
  }, [collaborations, collabFilter, targetUserId])();

  const refetch = async () => {
    setCollaborations(null);
    setUserRoleByCollabId({});
    setCollabVisibleCount(6);
  };

  return {
    collaborations,
    collaborationsLoading,
    collabVisibleCount,
    setCollabVisibleCount,
    collabFilter,
    setCollabFilter,
    userRoleByCollabId,
    setUserRoleByCollabId,
    isLoadingMoreCollabs,
    setIsLoadingMoreCollabs,
    filteredCollaborations,
    refetch,
  };
};

