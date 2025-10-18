import {
  formatTransactionDate,
  normalizeTransactionDate,
} from "../transactionDates";

describe("normalizeTransactionDate", () => {
  it("returns Date when given Firestore Timestamp-like object", () => {
    const date = new Date("2024-04-12T10:30:00Z");
    const timestampLike = {
      toDate: jest.fn(() => date),
    };

    const result = normalizeTransactionDate(timestampLike as any);

    expect(result).toBe(date);
    expect(timestampLike.toDate).toHaveBeenCalledTimes(1);
  });

  it("falls back to parsing strings and numbers", () => {
    expect(
      normalizeTransactionDate("2024-01-02T03:04:05Z")?.toISOString()
    ).toBe("2024-01-02T03:04:05.000Z");
    expect(normalizeTransactionDate(1704164645000)?.toISOString()).toBe(
      "2024-01-02T03:04:05.000Z"
    );
    expect(normalizeTransactionDate("1704164645000")?.toISOString()).toBe(
      "2024-01-02T03:04:05.000Z"
    );
  });

  it("parses raw Firestore timestamp objects", () => {
    const firestoreJson = { seconds: 1701906600, nanoseconds: 0 };
    const legacyJson = { _seconds: 1701906600, _nanoseconds: 123000000 };

    expect(normalizeTransactionDate(firestoreJson as any)?.toISOString()).toBe(
      "2023-12-06T23:50:00.000Z"
    );
    expect(normalizeTransactionDate(legacyJson as any)?.toISOString()).toBe(
      "2023-12-06T23:50:00.123Z"
    );
  });

  it("returns null when parsing fails", () => {
    const badTimestamp = { toDate: () => new Date("invalid") };

    expect(normalizeTransactionDate(badTimestamp as any)).toBeNull();
    expect(normalizeTransactionDate("not-a-date")).toBeNull();
    expect(normalizeTransactionDate(null as any)).toBeNull();
  });

  it("supports epoch seconds and zero values", () => {
    expect(normalizeTransactionDate(1701906600)?.toISOString()).toBe(
      "2023-12-06T23:50:00.000Z"
    );
    expect(normalizeTransactionDate("1701906600")?.toISOString()).toBe(
      "2023-12-06T23:50:00.000Z"
    );
    expect(normalizeTransactionDate(0)?.toISOString()).toBe(
      "1970-01-01T00:00:00.000Z"
    );
    expect(normalizeTransactionDate("0")?.toISOString()).toBe(
      "1970-01-01T00:00:00.000Z"
    );
  });
});

describe("formatTransactionDate", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("uses locale date formatting when includeTime is false", () => {
    const date = new Date("2024-05-01T12:00:00Z");
    const spy = jest
      .spyOn(Date.prototype, "toLocaleDateString")
      .mockReturnValue("5/1/2024");

    const formatted = formatTransactionDate(date, { includeTime: false });

    expect(formatted).toBe("5/1/2024");
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("uses locale datetime formatting when includeTime is true", () => {
    const date = new Date("2024-05-01T12:00:00Z");
    const spy = jest
      .spyOn(Date.prototype, "toLocaleString")
      .mockReturnValue("5/1/2024, 12:00 PM");

    const formatted = formatTransactionDate(date, { includeTime: true });

    expect(formatted).toBe("5/1/2024, 12:00 PM");
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("returns fallback when value cannot be normalized", () => {
    expect(formatTransactionDate(undefined)).toBe("Unknown date");
    expect(formatTransactionDate(undefined, { fallback: "N/A" })).toBe("N/A");
  });
});
