#!/usr/bin/env node
'use strict';

const { runFilter } = require('../lib/filter');

const args = process.argv.slice(2);
const options = { env: 'development', cwd: process.cwd() };
const cmdArgs = [];

let i = 0;
while (i < args.length) {
  if (args[i] === '--env' && args[i + 1]) { options.env = args[++i]; }
  else if (args[i] === '--cwd' && args[i + 1]) { options.cwd = args[++i]; }
  else if (args[i] === '--track') { options.track = true; }
  else { cmdArgs.push(args[i]); }
  i++;
}

if (!cmdArgs.length) {
  console.error('Usage: filter [--env <val>] [--cwd <path>] [--track] <command...>');
  console.error('');
  console.error('Examples:');
  console.error('  filter node server.js');
  console.error('  filter --track node server.js');
  console.error('  filter npx nodemon server.js');
  console.error('  filter python main.py');
  console.error('  filter --env production npm start');
  process.exit(1);
}

runFilter(cmdArgs, options);
