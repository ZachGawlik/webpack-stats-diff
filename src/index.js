const path = require('path');

const filterByExtension = (assets, config) => {
  return config.extensions
    ? assets.filter(({ name }) =>
        config.extensions.includes(path.extname(name))
      )
    : assets;
};

const indexByName = assets => {
  return assets.reduce((assetsByName, asset) => {
    assetsByName[asset.name] = asset;
    return assetsByName;
  }, {});
};

const diffDesc = (diff1, diff2) => Math.abs(diff2.diff) - Math.abs(diff1.diff);

const createDiff = (oldSize, newSize) => ({
  newSize,
  oldSize,
  diff: newSize - oldSize,
  diffPercentage: +((1 - newSize / oldSize) * -100).toFixed(2) || 0
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
      if (diff.diff > 0) {
        bigger.push(diff);
      } else if (diff.diff < 0) {
        smaller.push(diff);
      } else {
        sameSize.push(diff);
      }
    }
  });

  Object.keys(newAssetsByName).forEach(name => {
    const newAsset = newAssetsByName[name];
    newSizeTotal += newAsset.size;
    if (!oldAssetsByName[newAsset.name]) {
      added.push(Object.assign({ name }, createDiff(0, newAsset.size)));
    }
  });

  return {
    added: added.sort(diffDesc),
    removed: removed.sort(diffDesc),
    bigger: bigger.sort(diffDesc),
    smaller: smaller.sort(diffDesc),
    sameSize,
    total: createDiff(oldSizeTotal, newSizeTotal)
  };
};

module.exports = webpackStatsDiff;
