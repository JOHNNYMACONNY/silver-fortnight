import { getSystemStats, canWriteSystemStatsCache } from "../firestore-extensions";

jest.mock("../../firebase-config", () => ({
  getSyncFirebaseDb: jest.fn(() => ({})),
}));

const mockDoc = jest.fn(() => ({}));
const mockSetDoc = jest.fn();
const mockGetDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockCollection = jest.fn(() => ({}));
const mockQuery = jest.fn(() => ({}));
const mockWhere = jest.fn(() => ({}));

jest.mock("firebase/firestore", () => {
  const actual = jest.requireActual("firebase/firestore");
  return {
    ...actual,
    doc: (...args: any[]) => mockDoc(...args),
    setDoc: (...args: any[]) => mockSetDoc(...args),
    getDoc: (...args: any[]) => mockGetDoc(...args),
    getDocs: (...args: any[]) => mockGetDocs(...args),
    collection: (...args: any[]) => mockCollection(...args),
    query: (...args: any[]) => mockQuery(...args),
    where: (...args: any[]) => mockWhere(...args),
    Timestamp: actual.Timestamp,
  };
});

const buildDocsSnapshot = (size: number, items: Array<Record<string, any>> = []) => ({
  size,
  forEach: (cb: (doc: any) => void) =>
    items.forEach((item) =>
      cb({
        data: () => item,
      })
    ),
});

const primeGetDocsQueue = () => {
  const recentDate = new Date();
  const usersSnapshot = buildDocsSnapshot(3, [
    { lastActiveAt: recentDate },
    { metadata: { lastSignInTime: recentDate.toISOString() } },
    { updatedAt: recentDate },
  ]);
  const queue = [
    usersSnapshot,
    buildDocsSnapshot(5),
    buildDocsSnapshot(4),
    buildDocsSnapshot(3),
    buildDocsSnapshot(2),
  ];
  mockGetDocs.mockImplementation(() => Promise.resolve(queue.shift() ?? buildDocsSnapshot(0)));
};

describe("system stats caching", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockGetDoc.mockResolvedValue({ exists: () => false });
  });

  it("writes cache when running server-side", async () => {
    delete (global as any).window;
    primeGetDocsQueue();

    const result = await getSystemStats();

    expect(result.data).toBeTruthy();
    expect(mockSetDoc).toHaveBeenCalledTimes(1);
  });

  it("skips cache write when window is defined (client)", async () => {
    (global as any).window = {} as any;
    primeGetDocsQueue();

    const result = await getSystemStats();

    expect(result.data).toBeTruthy();
    expect(mockSetDoc).not.toHaveBeenCalled();

    delete (global as any).window;
  });
});

describe("canWriteSystemStatsCache", () => {
  afterEach(() => {
    delete (global as any).window;
  });

  it("returns true on server", () => {
    delete (global as any).window;
    expect(canWriteSystemStatsCache()).toBe(true);
  });

  it("returns false on client", () => {
    (global as any).window = {} as any;
    expect(canWriteSystemStatsCache()).toBe(false);
  });
});

