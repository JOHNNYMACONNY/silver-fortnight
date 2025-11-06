import { XPTransaction } from "../../../types/gamification";

const isValidDate = (value: unknown): value is Date =>
  value instanceof Date && !Number.isNaN(value.getTime());

type NormalizableInput =
  | XPTransaction["createdAt"]
  | Date
  | string
  | number
  | null
  | undefined;

interface RawTimestamp {
  seconds?: number;
  nanoseconds?: number;
  _seconds?: number;
  _nanoseconds?: number;
}

const toFiniteNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
};

const extractRawTimestamp = (value: unknown): RawTimestamp | null => {
  if (!value || typeof value !== "object") return null;

  const { seconds, nanoseconds } = value as RawTimestamp;
  const normalizedSeconds = toFiniteNumber(seconds);
  const normalizedNanoseconds = toFiniteNumber(nanoseconds);

  const fallbackSeconds = toFiniteNumber((value as RawTimestamp)._seconds);
  const fallbackNanoseconds = toFiniteNumber(
    (value as RawTimestamp)._nanoseconds
  );

  const finalSeconds = normalizedSeconds ?? fallbackSeconds;
  const finalNanoseconds = normalizedNanoseconds ?? fallbackNanoseconds;

  if (typeof finalSeconds === "number") {
    return {
      seconds: finalSeconds,
      nanoseconds: typeof finalNanoseconds === "number" ? finalNanoseconds : 0,
    };
  }

  return null;
};

const normalizeNumericInput = (value: number | string): number | null => {
  const parsed = toFiniteNumber(value);
  return typeof parsed === "number" ? parsed : null;
};

export const normalizeTransactionDate = (
  value: NormalizableInput
): Date | null => {
  if (value === null || value === undefined) {
    return null;
  }

  const maybeTimestamp = value as { toDate?: () => unknown } | null | undefined;
  if (typeof maybeTimestamp?.toDate === "function") {
    try {
      const date = maybeTimestamp.toDate();
      if (isValidDate(date)) {
        return date;
      }
    } catch {
      // noop - fall through to other parsing strategies
    }
  }

  const rawTimestamp = extractRawTimestamp(value);
  if (rawTimestamp && rawTimestamp.seconds !== undefined && rawTimestamp.nanoseconds !== undefined) {
    const millis =
      rawTimestamp.seconds * 1000 + Math.floor(rawTimestamp.nanoseconds / 1e6);
    const date = new Date(millis);
    if (isValidDate(date)) {
      return date;
    }
  }

  if (isValidDate(value)) {
    return value;
  }

  const maybeNumeric = normalizeNumericInput(value as number | string);
  if (maybeNumeric !== null) {
    const epochMillis =
      Math.abs(maybeNumeric) < 1e12
        ? Math.trunc(maybeNumeric * 1000)
        : maybeNumeric;
    const date = new Date(epochMillis);
    if (isValidDate(date)) {
      return date;
    }
  }

  try {
    const parsed = new Date(value as any);
    if (isValidDate(parsed)) {
      return parsed;
    }
  } catch {
    // noop - handled by returning null below
  }

  return null;
};

interface FormatOptions {
  includeTime?: boolean;
  fallback?: string;
}

export const formatTransactionDate = (
  value: NormalizableInput,
  { includeTime = false, fallback = "Unknown date" }: FormatOptions = {}
): string => {
  const date = normalizeTransactionDate(value);
  if (!date) return fallback;

  return includeTime ? date.toLocaleString() : date.toLocaleDateString();
};
