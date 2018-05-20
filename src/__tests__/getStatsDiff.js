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
    getStatsDiff(oldAssets, newAssets, { extensions: ['.js', '.css'] })
  ).toMatchObject({
    added: [],
    removed: [{ name: 'old-page.js' }],
    bigger: [{ name: 'commons.js' }],
    smaller: [{ name: 'main-site.js' }],
    sameSize: [{ name: 'styles.css' }],
    total: { name: 'Total' }
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
    { name: 'big-file-small-change', size: 100000 },
    { name: 'big-file-biggest-change', size: 100000 },
    { name: 'big-file-no-change', size: 100000 },
    { name: 'small-file-small-change', size: 1000 },
    { name: 'small-file-big-change', size: 1000 }
  ];
  const newAssets = [
    { name: 'big-file-small-change', size: 104000 },
    { name: 'big-file-biggest-change', size: 110001 },
    { name: 'big-file-no-change', size: 100000 },
    { name: 'small-file-small-change', size: 960 },
    { name: 'small-file-big-change', size: 949 }
  ];

  test('Default threshold is 5%', () => {
    expect(getStatsDiff(oldAssets, newAssets)).toMatchObject({
      bigger: [{ name: 'big-file-biggest-change' }],
      smaller: [{ name: 'small-file-big-change' }],
      sameSize: [
        { name: 'big-file-small-change' },
        { name: 'big-file-no-change' },
        { name: 'small-file-small-change' }
      ]
    });
  });

  test('Threshold can be adjusted by configuration', () => {
    expect(getStatsDiff(oldAssets, newAssets, { threshold: 0 })).toMatchObject({
      bigger: [
        { name: 'big-file-biggest-change' },
        { name: 'big-file-small-change' }
      ],
      smaller: [
        { name: 'small-file-big-change' },
        { name: 'small-file-small-change' }
      ],
      sameSize: [{ name: 'big-file-no-change' }]
    });

    expect(getStatsDiff(oldAssets, newAssets, { threshold: 10 })).toMatchObject(
      {
        bigger: [{ name: 'big-file-biggest-change' }],
        smaller: [],
        sameSize: [
          { name: 'big-file-small-change' },
          { name: 'big-file-no-change' },
          { name: 'small-file-small-change' },
          { name: 'small-file-big-change' }
        ]
      }
    );
  });
});
