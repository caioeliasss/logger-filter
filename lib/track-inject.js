'use strict';

const { basename } = require('path');
const { format } = require('util');

const METHODS = ['log', 'error', 'warn', 'info', 'debug'];

function getCallerFile() {
  if (!Error.captureStackTrace) return null;
  const err = {};
  Error.captureStackTrace(err);
  const lines = err.stack.split('\n');
  for (let i = 1; i < lines.length; i++) {
    const m = lines[i].match(/\((.+?):\d+:\d+\)|at (.+?):\d+:\d+/);
    if (!m) continue;
    const fp = m[1] || m[2];
    if (!fp) continue;
    if (
      fp.includes('track-inject') ||
      fp.includes('node_modules') ||
      fp.startsWith('internal/') ||
      fp.startsWith('node:')
    ) continue;
    return basename(fp);
  }
  return null;
}

METHODS.forEach((m) => {
  const stream = (m === 'error' || m === 'warn') ? process.stderr : process.stdout;
  console[m] = function (...args) {
    const file = getCallerFile();
    const msg = format(...args);
    const prefix = file ? `[[[TRACK:${file}]]]` : '';
    stream.write(`${prefix}${msg}\n`);
  };
});
