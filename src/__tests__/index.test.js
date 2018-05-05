const webpackStatsDiff = require('../index');

test('returns empty object', () => {
  expect(webpackStatsDiff({}, {})).toEqual({});
});
