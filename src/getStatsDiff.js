const path = require('path');

const DIFF_THRESHOLD = 5;

const requiredAssets = argumentName => {
  throw new Error(`${argumentName} is required`);
};

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
  if (!extensions) {
    return assets;
  }
  const filteredAssets = {};
  Object.keys(assets).forEach(name => {
    if (extensions.includes(path.extname(name))) {
      filteredAssets[name] = assets[name];
    }
  });
  return filteredAssets;
};

const removeHash = filename => {
  const fileParts = filename.split('.');
  return `${fileParts[0]}.${fileParts[fileParts.length - 1]}`;
};

const indexNameToSize = statAssets => {
  const assetsByName = {};
  statAssets.forEach(asset => {
    assetsByName[removeHash(asset.name)] = asset.size;
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

// Note: since this is to be called with sizes from indexNameToSize or
// react-dev-tool's measureFileSizesBeforeBuild, the filenames will be hash-less
const getAssetsDiff = (
  oldAssets = requiredAssets('oldAssets'),
  newAssets = requiredAssets('newAssets'),
  config = {}
) => {
  const extensions = sanitizeExtensions(config.extensions);
  const threshold = sanitizeThreshold(config.threshold);
  return webpackStatsDiff(
    filterByExtension(oldAssets, extensions),
    filterByExtension(newAssets, extensions),
    {
      extensions,
      threshold
    }
  );
};

const getStatsDiff = (
  oldAssetStats = requiredAssets('oldAssetStats'),
  newAssetStats = requiredAssets('newAssetStats'),
  config = {}
) => {
  return getAssetsDiff(
    indexNameToSize(oldAssetStats),
    indexNameToSize(newAssetStats),
    config
  );
};

const webpackStatsDiff = (oldAssets, newAssets, { extensions, threshold }) => {
  const added = [];
  const removed = [];
  const bigger = [];
  const smaller = [];
  const sameSize = [];
  let newSizeTotal = 0;
  let oldSizeTotal = 0;

  Object.keys(oldAssets).forEach(name => {
    const oldAssetSize = oldAssets[name];
    oldSizeTotal += oldAssetSize;
    if (!newAssets[name]) {
      removed.push(Object.assign({ name }, createDiff(oldAssetSize, 0)));
    } else {
      const diff = Object.assign(
        { name },
        createDiff(oldAssetSize, newAssets[name])
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

  Object.keys(newAssets).forEach(name => {
    const newAssetSize = newAssets[name];
    newSizeTotal += newAssetSize;
    if (!oldAssets[name]) {
      added.push(Object.assign({ name }, createDiff(0, newAssetSize)));
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
    ),
    extensions,
    threshold
  };
};

module.exports = {
  getAssetsDiff,
  getStatsDiff
};
