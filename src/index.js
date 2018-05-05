const indexByName = assets => {
  return assets.reduce((assetsByName, asset) => {
    assetsByName[asset.name] = asset;
    return assetsByName;
  }, {});
};

const webpackStatsDiff = (oldAssets, newAssets) => {
  const oldAssetsByName = indexByName(oldAssets);
  const newAssetsByName = indexByName(newAssets);

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
      removed.push({
        name,
        newSize: 0,
        oldSize: oldAsset.size,
        diff: -1 * oldAsset.size
      });
    } else {
      const diff = {
        name,
        newSize: newAssetsByName[name].size,
        oldSize: oldAsset.size,
        diff: newAssetsByName[name].size - oldAsset.size
      };
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
      added.push({
        name,
        newSize: newAsset.size,
        oldSize: 0,
        diff: newAsset.size
      });
    }
  });

  return {
    added,
    removed,
    bigger,
    smaller,
    sameSize,
    total: {
      newSize: newSizeTotal,
      oldSize: oldSizeTotal,
      diff: newSizeTotal - oldSizeTotal
    }
  };
};

module.exports = webpackStatsDiff;
