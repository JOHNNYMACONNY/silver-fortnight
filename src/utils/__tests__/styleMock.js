module.exports = {};

// Add basic test to satisfy jest requirement
test('style mock is empty object', () => {
  expect(module.exports).toEqual({});
});