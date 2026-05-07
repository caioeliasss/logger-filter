'use strict';

const readline = require('readline');
const fs = require('fs');
const path = require('path');

function prompt(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function runInit() {
  const configPath = path.join(process.cwd(), '.filter.json');

  if (fs.existsSync(configPath)) {
    const rl0 = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await prompt(rl0, '.filter.json already exists. Overwrite? [y/N] ');
    rl0.close();
    if (answer.trim().toLowerCase() !== 'y') {
      process.stdout.write('[filter] Aborted.\n');
      process.exit(0);
    }
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  process.stdout.write('[filter] Initializing project config...\n\n');

  const runner = (await prompt(rl, 'Runner (e.g. node, npx nodemon, python): ')).trim();
  const entry  = (await prompt(rl, 'Entry file (e.g. server.js): ')).trim();
  const envRaw = (await prompt(rl, 'Environment [development]: ')).trim();

  rl.close();

  const run = `${runner} ${entry}`.trim();
  const env = envRaw || 'development';

  const config = { run, env };
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');

  process.stdout.write(`\n[filter] Created ${configPath}\n`);
  process.stdout.write('[filter] Run \'filter\' to start.\n');
}

module.exports = { runInit };
