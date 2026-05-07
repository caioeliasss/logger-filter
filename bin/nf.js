#!/usr/bin/env node
'use strict';

const path = require('path');
const { runFilter } = require('../lib/filter');

function loadConfig() {
  const fs = require('fs');
  const p = path.join(process.cwd(), '.filter.json');
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch { return null; }
}

const args = process.argv.slice(2);
const options = { env: 'development', cwd: process.cwd() };
const cmdArgs = [];

let i = 0;
while (i < args.length) {
  if (args[i] === '--env' && args[i + 1]) { options.env = args[++i]; }
  else if (args[i] === '--cwd' && args[i + 1]) { options.cwd = args[++i]; }
  else if (args[i] === '--track') { options.track = true; }
  else if (args[i] === '--no-track') { options.noTrack = true; }
  else { cmdArgs.push(args[i]); }
  i++;
}

if (cmdArgs[0] === 'init') {
  require('../lib/init').runInit();
  return;
}

if (!cmdArgs.length) {
  const config = loadConfig();
  if (!config) {
    console.error('Usage: filter [--env <val>] [--cwd <path>] [--track|--no-track] <command...>');
    console.error('  or:  filter init   (create project config)');
    process.exit(1);
  }
  cmdArgs.push(...config.run.trim().split(/\s+/));
  if (options.env === 'development' && config.env) options.env = config.env;
}

const NODE_CMDS = new Set(['node', 'nodemon', 'npx', 'ts-node', 'tsx', 'bun']);
if (!options.track && !options.noTrack && NODE_CMDS.has(cmdArgs[0])) {
  options.track = true;
}

runFilter(cmdArgs, options);
