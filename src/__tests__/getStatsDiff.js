const { getStatsDiff } = require('../index');

test('handles blank inputs', () => {
  expect(getStatsDiff([], [])).toMatchSnapshot();
});

test('reports stat diffs between old and new assets', () => {
  const oldAssets = [
    { name: 'commons.js', size: 32768 },
    { name: 'logo.svg', size: 588 },
    { name: 'me.jpg', size: 1200000 },
    { name: 'main-site.js', size: 68000 },
    { name: 'other-page.js', size: 40000 }
  ];
  const newAssets = [
    { name: 'commons.js', size: 65536 },
    { name: 'Roboto-Regular.ttf', size: 176999 },
    { name: 'me.jpg', size: 1200000 },
    { name: 'main-site.js', size: 38000 },
    { name: 'other-page.js', size: 12345 }
  ];
  expect(getStatsDiff(oldAssets, newAssets)).toMatchSnapshot();
});

test('Matches bundles by name (string before first period) and ext', () => {
  const oldAssets = [
    { name: 'main.a83fjads83ja.js', size: 32768 },
    { name: 'main.23r8f2398sdz.css', size: 4000 },
    { name: 'form.i8aejf3iad.chunk.js', size: 5000 },
    { name: 'form.aefc83zl9a.css', size: 2000 }
  ];
  const newAssets = [
    { name: 'main.aweifa09eh3.js', size: 16384 },
    { name: 'main.jo821kjdsi9.css', size: 5000 },
    { name: 'form.awe9f3nads893oz.chunk.js', size: 6500 },
    { name: 'form.89aw3jiuawefh8d.css', size: 1500 }
  ];
  expect(getStatsDiff(oldAssets, newAssets)).toMatchObject({
    added: [],
    removed: [],
    bigger: [
      { name: 'form.js', oldSize: 5000, newSize: 6500 },
      { name: 'main.css', oldSize: 4000, newSize: 5000 }
    ],
    smaller: [
      {
        name: 'main.js',
        oldSize: 32768,
        newSize: 16384
      },
      { name: 'form.css', oldSize: 2000, newSize: 1500 }
    ],
    sameSize: []
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
    getStatsDiff(oldAssets, newAssets, { extensions: ['.js', 'css'] })
  ).toMatchObject({
    added: [],
    removed: [{ name: 'old-page.js' }],
    bigger: [{ name: 'commons.js' }],
    smaller: [{ name: 'main-site.js' }],
    sameSize: [{ name: 'styles.css' }],
    total: { name: 'Total' },
    extensions: ['.js', '.css']
  });
});

test('Sorts by greatest size differences first', () => {
  const newAssets = [
    { name: 'commons.js', size: 65536 },
    { name: 'new-page.js', size: 8000 },
    { name: 'main-site.js', size: 38000 }
  ];
  expect(getStatsDiff([], newAssets).added).toMatchObject([
    { name: 'commons.js' },
    { name: 'main-site.js' },
    { name: 'new-page.js' }
  ]);
});

describe('Marks an asset as sameSize if % change is below threshold', () => {
  const oldAssets = [
    { name: 'big-file-small-change.js', size: 100000 },
    { name: 'big-file-biggest-change.js', size: 100000 },
    { name: 'big-file-no-change.js', size: 100000 },
    { name: 'small-file-small-change.js', size: 1000 },
    { name: 'small-file-big-change.js', size: 1000 }
  ];
  const newAssets = [
    { name: 'big-file-small-change.js', size: 104000 },
    { name: 'big-file-biggest-change.js', size: 110001 },
    { name: 'big-file-no-change.js', size: 100000 },
    { name: 'small-file-small-change.js', size: 960 },
    { name: 'small-file-big-change.js', size: 949 }
  ];

  test('Default threshold is 5%', () => {
    expect(getStatsDiff(oldAssets, newAssets)).toMatchObject({
      bigger: [{ name: 'big-file-biggest-change.js' }],
      smaller: [{ name: 'small-file-big-change.js' }],
      sameSize: [
        { name: 'big-file-small-change.js' },
        { name: 'big-file-no-change.js' },
        { name: 'small-file-small-change.js' }
      ],
      threshold: 5
    });
  });

  test('Threshold can be adjusted by configuration', () => {
    expect(getStatsDiff(oldAssets, newAssets, { threshold: 0 })).toMatchObject({
      bigger: [
        { name: 'big-file-biggest-change.js' },
        { name: 'big-file-small-change.js' }
      ],
      smaller: [
        { name: 'small-file-big-change.js' },
        { name: 'small-file-small-change.js' }
      ],
      sameSize: [{ name: 'big-file-no-change.js' }],
      threshold: 0
    });

    expect(getStatsDiff(oldAssets, newAssets, { threshold: 10 })).toMatchObject(
      {
        bigger: [{ name: 'big-file-biggest-change.js' }],
        smaller: [],
        sameSize: [
          { name: 'big-file-small-change.js' },
          { name: 'big-file-no-change.js' },
          { name: 'small-file-small-change.js' },
          { name: 'small-file-big-change.js' }
        ],
        threshold: 10
      }
    );
  });
});
