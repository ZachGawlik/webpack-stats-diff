/* eslint-disable no-console */
const { table, getBorderCharacters } = require('table');
const chalk = require('chalk');

const ASSET_TABLE_CONFIG = {
  border: getBorderCharacters('void'),
  columnDefault: {
    alignment: 'right',
    paddingLeft: 2,
    paddingRight: 2
  },
  columns: {
    0: { alignment: 'left' }
  },
  drawHorizontalLine: () => false
};

const TABLE_HEADERS = [
  chalk.bold('Asset'),
  chalk.bold('Old size'),
  chalk.bold('New size'),
  chalk.bold('Diff'),
  chalk.bold('Diff %')
];

const capitalize = text => text[0].toUpperCase() + text.slice(1);

const getSizeText = size => {
  if (size === 0) {
    return '0';
  }

  const abbreviations = ['bytes', 'KiB', 'MiB', 'GiB'];
  const index = Math.floor(Math.log(Math.abs(size)) / Math.log(1024));

  return `${+(size / Math.pow(1024, index)).toPrecision(3)} ${
    abbreviations[index]
  }`;
};

const printAssetsTables = results => {
  ['added', 'removed', 'bigger', 'smaller'].forEach(field => {
    const assets = results[field];
    if (assets.length > 0) {
      const sectionColor = ['added', 'bigger'].includes(field)
        ? chalk.green.underline.bold
        : chalk.red.underline.bold;
      console.log(sectionColor(capitalize(field)));

      if (['added', 'removed'].includes(field)) {
        const tableData = [
          [chalk.bold('Asset'), chalk.bold('Diff')],
          ...assets.map(asset => [asset.name, getSizeText(asset.diff)])
        ];
        console.log(table(tableData, ASSET_TABLE_CONFIG));
      } else {
        const tableData = [
          TABLE_HEADERS,
          ...assets.map(asset => [
            asset.name,
            getSizeText(asset.oldSize),
            getSizeText(asset.newSize),
            getSizeText(asset.diff),
            `${asset.diffPercentage.toFixed(2)} %`
          ])
        ];
        console.log(table(tableData, ASSET_TABLE_CONFIG));
      }
    }
  });
};

const printTotalTable = total => {
  const totalData = [];
  totalData.push(['', ...TABLE_HEADERS.slice(1)]);
  const diffColor = total.diff > 0 ? chalk.green.bold : chalk.red.bold;

  totalData.push([
    total.name,
    getSizeText(total.oldSize),
    getSizeText(total.newSize),
    diffColor(getSizeText(total.diff)),
    diffColor(`${total.diffPercentage.toFixed(2)} %`)
  ]);

  console.log(table(totalData, { columnDefault: { alignment: 'right' } }));
};

module.exports = statsDiff => {
  printAssetsTables(statsDiff);
  if (statsDiff.extensions) {
    console.log(
      `For assets with extensions ${statsDiff.extensions.join(', ')}`
    );
  }
  printTotalTable(statsDiff.total);
};
