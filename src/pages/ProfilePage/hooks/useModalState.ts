import { useState, useCallback } from "react";

/**
 * Return type for useModalState hook
 */
export interface ModalStateHookReturn {
  isEditOpen: boolean;
  setIsEditOpen: (open: boolean) => void;
  openEditModal: () => void;
  closeEditModal: () => void;
  showShareMenu: boolean;
  setShowShareMenu: (show: boolean) => void;
  openShareMenu: () => void;
  closeShareMenu: () => void;
  toggleShareMenu: () => void;
}

/**
 * Custom hook for managing modal and menu state
 * Handles:
 * - Edit profile modal open/close state
 * - Share menu open/close state
 * - Convenience functions for toggling modals
 *
 * @returns ModalStateHookReturn object with modal states and handlers
 *
 * @example
 * const {
 *   isEditOpen,
 *   openEditModal,
 *   closeEditModal,
 *   showShareMenu,
 *   toggleShareMenu,
 * } = useModalState();
 */
export const useModalState = (): ModalStateHookReturn => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  /**
   * Open edit modal
   */
  const openEditModal = useCallback(() => {
    setIsEditOpen(true);
  }, []);

  /**
   * Close edit modal
   */
  const closeEditModal = useCallback(() => {
    setIsEditOpen(false);
  }, []);

  /**
   * Open share menu
   */
  const openShareMenu = useCallback(() => {
    setShowShareMenu(true);
  }, []);

  /**
   * Close share menu
   */
  const closeShareMenu = useCallback(() => {
    setShowShareMenu(false);
  }, []);

  /**
   * Toggle share menu
   */
  const toggleShareMenu = useCallback(() => {
    setShowShareMenu((prev) => !prev);
  }, []);

  return {
    isEditOpen,
    setIsEditOpen,
    openEditModal,
    closeEditModal,
    showShareMenu,
    setShowShareMenu,
    openShareMenu,
    closeShareMenu,
    toggleShareMenu,
  };
};

