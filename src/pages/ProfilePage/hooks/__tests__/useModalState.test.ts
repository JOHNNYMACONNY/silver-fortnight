import { renderHook, act } from "@testing-library/react";
import { useModalState } from "../useModalState";

describe("useModalState", () => {
  it("should initialize with modals closed", () => {
    const { result } = renderHook(() => useModalState());

    expect(result.current.isEditOpen).toBe(false);
    expect(result.current.showShareMenu).toBe(false);
  });

  it("should open edit modal with openEditModal", () => {
    const { result } = renderHook(() => useModalState());

    act(() => {
      result.current.openEditModal();
    });

    expect(result.current.isEditOpen).toBe(true);
  });

  it("should close edit modal with closeEditModal", () => {
    const { result } = renderHook(() => useModalState());

    act(() => {
      result.current.openEditModal();
    });

    expect(result.current.isEditOpen).toBe(true);

    act(() => {
      result.current.closeEditModal();
    });

    expect(result.current.isEditOpen).toBe(false);
  });

  it("should set edit modal state directly with setIsEditOpen", () => {
    const { result } = renderHook(() => useModalState());

    act(() => {
      result.current.setIsEditOpen(true);
    });

    expect(result.current.isEditOpen).toBe(true);

    act(() => {
      result.current.setIsEditOpen(false);
    });

    expect(result.current.isEditOpen).toBe(false);
  });

  it("should open share menu with openShareMenu", () => {
    const { result } = renderHook(() => useModalState());

    act(() => {
      result.current.openShareMenu();
    });

    expect(result.current.showShareMenu).toBe(true);
  });

  it("should close share menu with closeShareMenu", () => {
    const { result } = renderHook(() => useModalState());

    act(() => {
      result.current.openShareMenu();
    });

    expect(result.current.showShareMenu).toBe(true);

    act(() => {
      result.current.closeShareMenu();
    });

    expect(result.current.showShareMenu).toBe(false);
  });

  it("should toggle share menu with toggleShareMenu", () => {
    const { result } = renderHook(() => useModalState());

    expect(result.current.showShareMenu).toBe(false);

    act(() => {
      result.current.toggleShareMenu();
    });

    expect(result.current.showShareMenu).toBe(true);

    act(() => {
      result.current.toggleShareMenu();
    });

    expect(result.current.showShareMenu).toBe(false);
  });

  it("should set share menu state directly with setShowShareMenu", () => {
    const { result } = renderHook(() => useModalState());

    act(() => {
      result.current.setShowShareMenu(true);
    });

    expect(result.current.showShareMenu).toBe(true);

    act(() => {
      result.current.setShowShareMenu(false);
    });

    expect(result.current.showShareMenu).toBe(false);
  });

  it("should manage both modals independently", () => {
    const { result } = renderHook(() => useModalState());

    act(() => {
      result.current.openEditModal();
      result.current.openShareMenu();
    });

    expect(result.current.isEditOpen).toBe(true);
    expect(result.current.showShareMenu).toBe(true);

    act(() => {
      result.current.closeEditModal();
    });

    expect(result.current.isEditOpen).toBe(false);
    expect(result.current.showShareMenu).toBe(true);
  });
});

