import { renderHook, act, waitFor } from "@testing-library/react";
import { useTradesData } from "../useTradesData";

jest.mock("../../../services/entities/TradeService", () => ({
  tradeService: {
    getTradesByUserId: jest.fn(),
  },
}));

jest.mock("../../../contexts/ToastContext", () => ({
  useToast: () => ({ showToast: jest.fn() }),
}));

describe("useTradesData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize with loading state", () => {
    const { result } = renderHook(() =>
      useTradesData("user-123", "about", jest.fn())
    );

    expect(result.current.tradesLoading).toBe(true);
    expect(result.current.trades).toBeNull();
  });

  it("should not fetch trades when tab is not active", () => {
    const { tradeService } = require("../../../services/entities/TradeService");

    const { result } = renderHook(() =>
      useTradesData("user-123", "about", jest.fn())
    );

    expect(tradeService.getTradesByUserId).not.toHaveBeenCalled();
  });

  it("should fetch trades when tab becomes active", async () => {
    const mockTrades = [
      { id: "trade-1", title: "Trade 1" },
      { id: "trade-2", title: "Trade 2" },
    ];

    const { tradeService } = require("../../../services/entities/TradeService");
    tradeService.getTradesByUserId.mockResolvedValue({
      data: mockTrades,
    });

    const { result, rerender } = renderHook(
      ({ tab }) => useTradesData("user-123", tab, jest.fn()),
      { initialProps: { tab: "about" as const } }
    );

    rerender({ tab: "trades" as const });

    await waitFor(() => {
      expect(result.current.tradesLoading).toBe(false);
    });

    expect(result.current.trades).toEqual(mockTrades);
  });

  it("should filter trades based on filter state", async () => {
    const mockTrades = [
      { id: "trade-1", participants: ["user-123", "user-456"] },
      { id: "trade-2", participants: ["user-789"] },
    ];

    const { tradeService } = require("../../../services/entities/TradeService");
    tradeService.getTradesByUserId.mockResolvedValue({
      data: mockTrades,
    });

    const { result, rerender } = renderHook(
      ({ tab }) => useTradesData("user-123", tab, jest.fn()),
      { initialProps: { tab: "trades" as const } }
    );

    await waitFor(() => {
      expect(result.current.tradesLoading).toBe(false);
    });

    act(() => {
      result.current.setTradeFilter("yours");
    });

    expect(result.current.tradeFilter).toBe("yours");
  });

  it("should manage pagination with visible count", async () => {
    const mockTrades = Array.from({ length: 20 }, (_, i) => ({
      id: `trade-${i}`,
      title: `Trade ${i}`,
    }));

    const { tradeService } = require("../../../services/entities/TradeService");
    tradeService.getTradesByUserId.mockResolvedValue({
      data: mockTrades,
    });

    const { result, rerender } = renderHook(
      ({ tab }) => useTradesData("user-123", tab, jest.fn()),
      { initialProps: { tab: "trades" as const } }
    );

    await waitFor(() => {
      expect(result.current.tradesLoading).toBe(false);
    });

    expect(result.current.tradesVisibleCount).toBe(6);

    act(() => {
      result.current.setTradesVisibleCount(12);
    });

    expect(result.current.tradesVisibleCount).toBe(12);
  });

  it("should handle errors gracefully", async () => {
    const { tradeService } = require("../../../services/entities/TradeService");
    tradeService.getTradesByUserId.mockRejectedValue(
      new Error("Network error")
    );

    const { result, rerender } = renderHook(
      ({ tab }) => useTradesData("user-123", tab, jest.fn()),
      { initialProps: { tab: "trades" as const } }
    );

    await waitFor(() => {
      expect(result.current.tradesLoading).toBe(false);
    });

    expect(result.current.trades).toBeNull();
  });

  it("should provide refetch function", async () => {
    const { result } = renderHook(() =>
      useTradesData("user-123", "trades", jest.fn())
    );

    expect(typeof result.current.refetch).toBe("function");
  });
});
