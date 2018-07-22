const path = require('path');

const DIFF_THRESHOLD = 5;

const sanitizeExtensions = (extensions = null) => {
  if (!extensions) {
    return null;
  } else if (!Array.isArray(extensions)) {
    throw new Error('`extensions` must be an array of strings');
  } else {
    return extensions.map(ext => (ext[0] === '.' ? ext : `.${ext}`));
  }
};

const sanitizeThreshold = (threshold = DIFF_THRESHOLD) => {
  if (typeof threshold !== 'number' || threshold < 0) {
    throw new Error('`threshold` must be a non-negative number');
  }
  return threshold;
};

const filterByExtension = (assets, extensions) => {
  return extensions
    ? assets.filter(({ name }) => extensions.includes(path.extname(name)))
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
  const extensions = sanitizeExtensions(config.extensions);
  const threshold = sanitizeThreshold(config.threshold);
  const oldAssetsByName = indexByName(filterByExtension(oldAssets, extensions));
  const newAssetsByName = indexByName(filterByExtension(newAssets, extensions));

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
      if (diff.diffPercentage > threshold) {
        bigger.push(diff);
      } else if (diff.diffPercentage < -1 * threshold) {
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
