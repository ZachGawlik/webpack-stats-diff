const webpackStatsDiff = require('../index');

test('handles blank inputs', () => {
  expect(webpackStatsDiff([], [])).toEqual({
    added: [],
    removed: [],
    bigger: [],
    smaller: [],
    sameSize: [],
    total: {
      newSize: 0,
      oldSize: 0,
      diff: 0
    }
  });
});

test('reports stat diffs between old and new assets', () => {
  const oldAssets = [
    { name: 'commons.js', size: 32768 },
    { name: 'logo.svg', size: 588 },
    { name: 'me.jpg', size: 1200000 },
    { name: 'other-page.js', size: 40000 },
    { name: 'main-site.js', size: 68000 }
  ];
  const newAssets = [
    { name: 'commons.js', size: 65536 },
    { name: 'Roboto-Regular.ttf', size: 176999 },
    { name: 'me.jpg', size: 1200000 },
    { name: 'other-page.js', size: 12345 },
    { name: 'main-site.js', size: 38000 }
  ];
  expect(webpackStatsDiff(oldAssets, newAssets)).toEqual({
    added: [
      {
        name: 'Roboto-Regular.ttf',
        newSize: 176999,
        oldSize: 0,
        diff: 176999
      }
    ],
    removed: [{ name: 'logo.svg', newSize: 0, oldSize: 588, diff: -588 }],
    bigger: [
      {
        name: 'commons.js',
        newSize: 65536,
        oldSize: 32768,
        diff: 32768
      }
    ],
    smaller: [
      {
        name: 'other-page.js',
        newSize: 12345,
        oldSize: 40000,
        diff: -27655
      },
      {
        name: 'main-site.js',
        newSize: 38000,
        oldSize: 68000,
        diff: -30000
      }
    ],
    sameSize: [
      {
        name: 'me.jpg',
        newSize: 1200000,
        oldSize: 1200000,
        diff: 0
      }
    ],
    total: {
      newSize: 1492880,
      oldSize: 1341356,
      diff: 151524
    }
  });
});

test('filters assets by ext config', () => {
  const oldAssets = [
    { name: 'commons.js', size: 32768 },
    { name: 'main-site.js', size: 68000 },
    { name: 'old-page.js', size: 8000 },
    { name: 'styles.css', size: 10000 },
    { name: 'logo.svg', size: 588 },
    { name: 'me.jpg', size: 1200000 }
  ];
  const newAssets = [
    { name: 'commons.js', size: 65536 },
    { name: 'main-site.js', size: 38000 },
    { name: 'styles.css', size: 10000 },
    { name: 'me.jpg', size: 1200000 },
    { name: 'Roboto-Regular.ttf', size: 176999 }
  ];

  expect(
    webpackStatsDiff(oldAssets, newAssets, { extensions: ['.js', '.css'] })
  ).toEqual({
    added: [],
    removed: [
      {
        name: 'old-page.js',
        newSize: 0,
        oldSize: 8000,
        diff: -8000
      }
    ],
    bigger: [
      {
        name: 'commons.js',
        newSize: 65536,
        oldSize: 32768,
        diff: 32768
      }
    ],
    smaller: [
      {
        name: 'main-site.js',
        newSize: 38000,
        oldSize: 68000,
        diff: -30000
      }
    ],
    sameSize: [
      {
        name: 'styles.css',
        newSize: 10000,
        oldSize: 10000,
        diff: 0
      }
    ],
    total: {
      newSize: 113536,
      oldSize: 118768,
      diff: -5232
    }
  });
});
