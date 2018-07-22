const path = require('path');

const DIFF_THRESHOLD = 5;

const filterByExtension = (assets, config) => {
  const extensionsWithDot =
    Array.isArray(config.extensions) &&
    config.extensions.map(ext => (ext[0] === '.' ? ext : `.${ext}`));

  return extensionsWithDot
    ? assets.filter(({ name }) =>
        extensionsWithDot.includes(path.extname(name))
      )
    : assets;
};

const removeHash = filename => {
  const fileParts = filename.split('.');
  return `${fileParts[0]}.${fileParts[fileParts.length - 1]}`;
};

const indexByName = assets => {
  const assetsByName = {};
  assets.forEach(asset => {
    assetsByName[removeHash(asset.name)] = asset;
  });
  return assetsByName;
};

const diffDesc = (diff1, diff2) => Math.abs(diff2.diff) - Math.abs(diff1.diff);

const createDiff = (oldSize, newSize) => ({
  newSize,
  oldSize,
  diff: newSize - oldSize,
  diffPercentage: +((1 - newSize / oldSize) * -100).toFixed(5) || 0
});

const webpackStatsDiff = (oldAssets, newAssets, config = {}) => {
  const oldAssetsByName = indexByName(filterByExtension(oldAssets, config));
  const newAssetsByName = indexByName(filterByExtension(newAssets, config));

  const added = [];
  const removed = [];
  const bigger = [];
  const smaller = [];
  const sameSize = [];
  let newSizeTotal = 0;
  let oldSizeTotal = 0;

  Object.keys(oldAssetsByName).forEach(name => {
    const oldAsset = oldAssetsByName[name];
    oldSizeTotal += oldAsset.size;
    if (!newAssetsByName[name]) {
      removed.push(Object.assign({ name }, createDiff(oldAsset.size, 0)));
    } else {
      const diff = Object.assign(
        { name },
        createDiff(oldAsset.size, newAssetsByName[name].size)
      );
      const diffThreshold =
        typeof config.threshold === 'number' && config.threshold >= 0
          ? config.threshold
          : DIFF_THRESHOLD;
      if (diff.diffPercentage > diffThreshold) {
        bigger.push(diff);
      } else if (diff.diffPercentage < -1 * diffThreshold) {
        smaller.push(diff);
      } else {
        sameSize.push(diff);
      }
    }
  });

  Object.keys(newAssetsByName).forEach(name => {
    const newAsset = newAssetsByName[name];
    newSizeTotal += newAsset.size;
    if (!oldAssetsByName[name]) {
      added.push(Object.assign({ name }, createDiff(0, newAsset.size)));
    }
  });

  return {
    added: added.sort(diffDesc),
    removed: removed.sort(diffDesc),
    bigger: bigger.sort(diffDesc),
    smaller: smaller.sort(diffDesc),
    sameSize,
    total: Object.assign(
      { name: 'Total' },
      createDiff(oldSizeTotal, newSizeTotal)
    )
  };
};

module.exports = webpackStatsDiff;
