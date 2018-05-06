#!/usr/bin/env node
/* eslint-disable no-console */
const program = require('commander');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const webpackStatsDiff = require('./');

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
    return '0 bytes';
  }

  const abbreviations = ['bytes', 'KiB', 'MiB', 'GiB'];
  const index = Math.floor(Math.log(Math.abs(size)) / Math.log(1024));

  return `${+(size / Math.pow(1024, index)).toPrecision(3)} ${
    abbreviations[index]
  }`;
};

program
  .arguments('<old-stats.json> <new-stats.json>')
  .action(function(oldStats, newStats) {
    const oldPath = path.resolve(process.cwd(), oldStats);
    const newPath = path.resolve(process.cwd(), newStats);

    checkPathExists(oldPath);
    checkPathExists(newPath);

    const oldAssets = require(oldPath).assets;
    const newAssets = require(newPath).assets;

    const results = webpackStatsDiff(oldAssets, newAssets);

    ['added', 'removed', 'bigger', 'smaller'].forEach(field => {
      const assets = results[field];
      if (assets.length > 0) {
        console.log(chalk.bold(field));
        assets.forEach(asset => {
          console.log(`${asset.name}  ${getSizeText(asset.diff)}`);
        });
        console.log('');
      }
    });

    console.log(chalk.bold('total'));
    console.log(`Old:  ${getSizeText(results.total.oldSize)}`);
    console.log(`New:  ${getSizeText(results.total.newSize)}`);
    console.log(`Diff: ${getSizeText(results.total.diff)}`);
  })
  .parse(process.argv);
