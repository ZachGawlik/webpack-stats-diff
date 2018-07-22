#!/usr/bin/env node
/* eslint-disable no-console */
const program = require('commander');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const { getStatsDiff, printStatsDiff } = require('./');

const printError = text => {
  console.error(chalk.red(text));
  process.exit(1);
};

const checkPathExists = p => {
  if (!fs.existsSync(p)) {
    printError(`Error: ${p} does not exist!`);
  }
};

program
  .arguments('<old-stats.json> <new-stats.json>')
  .option(
    '-e, --extensions <ext>',
    'Filter assets by extension. Comma separate.'
  )
  .option(
    '-t, --threshold <int>',
    'minimum % size change to report. Default 5.',
    parseInt
  )
  .action((oldStats, newStats) => {
    const config = {};
    if (program.extensions) {
      config.extensions = program.extensions.split(',');
    }
    if (Number.isInteger(program.threshold)) {
      config.threshold = program.threshold;
    }
    const oldPath = path.resolve(process.cwd(), oldStats);
    const newPath = path.resolve(process.cwd(), newStats);

    checkPathExists(oldPath);
    checkPathExists(newPath);

    const oldAssets = require(oldPath).assets;
    const newAssets = require(newPath).assets;

    printStatsDiff(getStatsDiff(oldAssets, newAssets, config));
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
