// Minimal vitest mock to avoid runtime import issues when tests accidentally import vitest
module.exports = {
  describe: global.describe || (() => {}),
  it: global.it || (() => {}),
  expect: global.expect || (() => {}),
  beforeEach: global.beforeEach || (() => {}),
  afterEach: global.afterEach || (() => {}),
  vi: {
  fn: (impl) => jest.fn(impl),
    mock: () => {},
    clearAllMocks: () => jest.clearAllMocks(),
    restoreAllMocks: () => {
      // Jest doesn't have a built-in restoreAllMocks prior to v29; emulate
      try {
        if (jest.restoreAllMocks) jest.restoreAllMocks();
      } catch (e) {}
    }
  }
};
