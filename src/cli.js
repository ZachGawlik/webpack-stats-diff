#!/usr/bin/env node
/* eslint-disable no-console */
const program = require('commander');
const path = require('path');
const fs = require('fs');
const { table, getBorderCharacters } = require('table');
const chalk = require('chalk');
const webpackStatsDiff = require('./');

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

const printError = text => {
  console.error(chalk.red(text));
  process.exit(1);
};

const checkPathExists = p => {
  if (!fs.existsSync(p)) {
    printError(`Error: ${p} does not exist!`);
  }
};

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

const capitalize = text => text[0].toUpperCase() + text.slice(1);

const printAssetsTables = results => {
  ['added', 'removed', 'bigger', 'smaller'].forEach(field => {
    const assets = results[field];
    if (assets.length > 0) {
      const sectionColor = ['added', 'bigger'].includes(field)
        ? chalk.green.underline.bold
        : chalk.red.underline.bold;
      console.log(sectionColor(capitalize(field)));

      const tableData = [
        TABLE_HEADERS,
        ...assets.map(asset => [
          asset.name,
          getSizeText(asset.oldSize),
          getSizeText(asset.newSize),
          getSizeText(asset.diff),
          `${asset.diffPercentage} %`
        ])
      ];
      console.log(table(tableData, ASSET_TABLE_CONFIG));
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
    diffColor(`${total.diffPercentage} %`)
  ]);

  console.log(table(totalData, { columnDefault: { alignment: 'right' } }));
};

const formatExtensions = extensions =>
  extensions.split(',').map(ext => (ext[0] === '.' ? ext : `.${ext}`));

program
  .arguments('<old-stats.json> <new-stats.json>')
  .option(
    '-e, --extensions <ext>',
    'Filter assets by extension. Comma separate.'
  )
  .action((oldStats, newStats) => {
    const config = {};
    if (program.extensions) {
      config.extensions = formatExtensions(program.extensions);
    }
    const oldPath = path.resolve(process.cwd(), oldStats);
    const newPath = path.resolve(process.cwd(), newStats);

    checkPathExists(oldPath);
    checkPathExists(newPath);

    const oldAssets = require(oldPath).assets;
    const newAssets = require(newPath).assets;

    const results = webpackStatsDiff(oldAssets, newAssets, config);
    printAssetsTables(results);
    printTotalTable(results.total);
  })
  .on('--help', () => {
    console.log();
    console.log('  Examples:');
    console.log(
      '    $ webpack-stats-diff master-stats.json stats.json --extensions js,jsx'
    );
  })
  .parse(process.argv);

if (!program.args.length) {
  program.help();
}
