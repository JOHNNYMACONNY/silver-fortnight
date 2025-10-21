jest.mock("firebase/firestore", () => ({
  ...jest.requireActual<typeof import("firebase/firestore")>(
    "firebase/firestore"
  ),
}));

import { Timestamp } from "firebase/firestore";

import { BaseService } from "../core/BaseService";

describe("BaseService.sanitizeData", () => {
  class TestService extends BaseService<Record<string, unknown>> {
    constructor() {
      super("test-collection");
    }

    public exposeSanitize(data: Record<string, unknown>) {
      return this.sanitizeData(data);
    }
  }

  let service: TestService;

  beforeEach(() => {
    service = new TestService();
  });

  it("removes undefined values from nested objects and arrays", () => {
    const original = {
      topLevel: undefined,
      nested: {
        keep: "value",
        remove: undefined,
        array: [{ a: 1, b: undefined }, undefined, "text"],
      },
    } as Record<string, unknown>;

    const sanitized = service.exposeSanitize(original);

    expect(sanitized).toEqual({
      nested: {
        keep: "value",
        array: [{ a: 1 }, "text"],
      },
    });
    expect(original.nested).toEqual({
      keep: "value",
      remove: undefined,
      array: [{ a: 1, b: undefined }, undefined, "text"],
    });
  });

  it("preserves special Firestore values without cloning their prototypes", () => {
    class CustomSpecial {
      constructor(public readonly marker: string) {}
    }

    const timestamp = Timestamp.now();
    const special = new CustomSpecial("sentinel");

    const sanitized = service.exposeSanitize({
      timestamp,
      special,
      array: [timestamp, special, undefined],
      nested: {
        timestamp,
        special,
        optional: undefined,
      },
    });

    expect(typeof sanitized.timestamp?.toDate).toBe("function");
    expect(sanitized.timestamp.isEqual(timestamp)).toBe(true);
    expect(sanitized.special).toBe(special);
    expect(sanitized.array).toEqual([timestamp, special]);
    expect(sanitized.nested).toEqual({ timestamp, special });
  });

  it("retains explicit null assignments while trimming undefined siblings", () => {
    const sanitized = service.exposeSanitize({
      maybeNull: null,
      nested: {
        keepNull: null,
        removeUndefined: undefined,
        deep: [{ value: null, skip: undefined }],
      },
    });

    expect(sanitized).toEqual({
      maybeNull: null,
      nested: {
        keepNull: null,
        deep: [{ value: null }],
      },
    });
  });
});
