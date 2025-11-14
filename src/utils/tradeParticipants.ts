export type ParticipantLike =
  | string
  | null
  | undefined
  | ParticipantLike[]
  | Record<string, unknown>;

export interface TradeLike {
  participantId?: unknown;
  participantIds?: unknown;
  participants?: unknown;
  creatorId?: string;
}

const PARTICIPANT_ID_KEYS = [
  "id",
  "userId",
  "uid",
  "participant",
  "participantId",
  "creator",
  "creatorId",
] as const;

const isString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const normalizeString = (value: string): string => value.trim();

/**
 * Collect every participant ID that might appear on a trade, handling
 * both legacy and migrated schemas (single ids, arrays, object maps,
 * arrays of participant objects, etc.).
 */
export const collectParticipantIdsFromTrade = (
  trade: TradeLike | null | undefined
): string[] => {
  const ids = new Set<string>();

  const addId = (value: unknown) => {
    if (isString(value)) {
      ids.add(normalizeString(value));
    }
  };

  const extractFromValue = (value: unknown) => {
    if (!value) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach(extractFromValue);
      return;
    }

    if (isString(value)) {
      addId(value);
      return;
    }

    if (typeof value === "object") {
      const record = value as Record<string, unknown>;

      let matchedKey = false;
      for (const key of PARTICIPANT_ID_KEYS) {
        if (Object.prototype.hasOwnProperty.call(record, key)) {
          matchedKey = true;
          extractFromValue(record[key]);
        }
      }

      // If this object didn't expose any of the canonical keys, it might
      // be the legacy map shape where each value is a string user id.
      Object.values(record).forEach((innerValue) => {
        if (isString(innerValue) && !matchedKey) {
          addId(innerValue);
        } else if (
          innerValue &&
          (typeof innerValue === "object" || Array.isArray(innerValue))
        ) {
          extractFromValue(innerValue);
        }
      });
    }
  };

  if (trade) {
    addId(trade.participantId);
    extractFromValue(trade.participantIds);
    extractFromValue(trade.participants);
  }

  return Array.from(ids);
};

/**
 * Determine whether the provided trade references the given user either
 * as the creator or as one of the participants.
 */
export const isTradeOwnedByUser = (
  trade: TradeLike | null | undefined,
  userId: string | null | undefined
): boolean => {
  if (!trade || !userId || userId.trim().length === 0) {
    return false;
  }

  const normalizedUserId = userId.trim();

  if (trade.creatorId && trade.creatorId === normalizedUserId) {
    return true;
  }

  return collectParticipantIdsFromTrade(trade).includes(normalizedUserId);
};

