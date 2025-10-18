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

export const normalizeTransactionDate = (
  value: NormalizableInput
): Date | null => {
  if (!value) return null;

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

  if (isValidDate(value)) {
    return value;
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
