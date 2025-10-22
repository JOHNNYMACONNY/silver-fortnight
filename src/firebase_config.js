// CommonJS-compatible lightweight fallback used by Jest tests that require '../firebase_config'
// This intentionally mirrors the minimal API surface tests need (getSyncFirebaseDb, db alias)
const getSyncFirebaseDb = () => {
  return {
    ref: () => ({
      on: () => {},
      off: () => {},
      once: async () => ({ val: () => null }),
      set: async () => {},
      update: async () => {},
      remove: async () => {}
    }),
    collection: () => ({
      doc: () => ({})
    })
  };
};

module.exports = {
  __esModule: true,
  default: getSyncFirebaseDb,
  getSyncFirebaseDb,
  db: getSyncFirebaseDb,
  getSyncFirebaseAuth: () => ({ currentUser: null }),
  getSyncFirebaseStorage: () => ({})
};
