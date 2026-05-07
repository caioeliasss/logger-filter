'use strict';

// Pure functions mirrored from lib/filter.js for unit testing.
// These must stay in sync with filter.js.

const assert = require('assert');

const TRACK_RE = /^\[\[\[TRACK:([^\]]+)\]\]\](.*)/s;

const COLOR_MAP = {
  yellow:  '\x1b[43m\x1b[30m',
  red:     '\x1b[41m\x1b[97m',
  green:   '\x1b[42m\x1b[30m',
  blue:    '\x1b[44m\x1b[97m',
  magenta: '\x1b[45m\x1b[97m',
  cyan:    '\x1b[46m\x1b[30m',
  white:   '\x1b[47m\x1b[30m',
};

function toRegex(pattern) {
  return new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
}

function shouldShow(line, inclusions, exclusions) {
  if (inclusions.length && !inclusions.some((re) => re.test(line))) return false;
  if (exclusions.some((re) => re.test(line))) return false;
  return true;
}

function formatLine(line, trackMode) {
  const m = line.match(TRACK_RE);
  if (!m) return line;
  if (!trackMode) return m[2];
  return `\x1b[3m${m[1]}\x1b[23m - ${m[2]}`;
}

function applyHighlight(line, highlights) {
  if (!highlights.length) return line;
  const match = highlights.find(({ pattern }) =>
    new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(line)
  );
  if (!match) return line;
  const color = COLOR_MAP[match.color] || COLOR_MAP.yellow;
  return `${color}${line}\x1b[0m`;
}

// --- toRegex ---
{
  assert.ok(toRegex('error').test('Error: something'), 'case insensitive');
  assert.ok(!toRegex('error').test('Warning'), 'no false match');
  // dot in pattern should be literal, not wildcard
  assert.ok(toRegex('user.name').test('user.name'), 'literal dot matches dot');
  assert.ok(!toRegex('user.name').test('username'), 'literal dot does not match any char');
  assert.ok(toRegex('GET /api').test('GET /api/users'), 'slash not special');
  console.error('PASS: toRegex');
}

// --- shouldShow: no filters → always show ---
{
  assert.strictEqual(shouldShow('anything', [], []), true);
  console.error('PASS: shouldShow no filters');
}

// --- shouldShow: inclusion filter ---
{
  const incl = [toRegex('error')];
  assert.strictEqual(shouldShow('ERROR: bad', incl, []), true, 'matches inclusion');
  assert.strictEqual(shouldShow('INFO: ok', incl, []), false, 'blocked by inclusion');
  console.error('PASS: shouldShow inclusion');
}

// --- shouldShow: exclusion filter ---
{
  const excl = [toRegex('debug')];
  assert.strictEqual(shouldShow('DEBUG: verbose', [], excl), false, 'excluded');
  assert.strictEqual(shouldShow('INFO: shown', [], excl), true, 'not excluded');
  console.error('PASS: shouldShow exclusion');
}

// --- shouldShow: exclusion wins over inclusion ---
{
  const incl = [toRegex('error')];
  const excl = [toRegex('error')];
  assert.strictEqual(shouldShow('ERROR: bad', incl, excl), false, 'exclusion wins');
  console.error('PASS: shouldShow exclusion beats inclusion');
}

// --- formatLine: no TRACK prefix → passthrough ---
{
  assert.strictEqual(formatLine('plain log line', false), 'plain log line');
  assert.strictEqual(formatLine('plain log line', true), 'plain log line');
  console.error('PASS: formatLine no prefix');
}

// --- formatLine: with TRACK prefix, trackMode=false → strip prefix ---
{
  const raw = '[[[TRACK:server.js]]]GET /api/users 200';
  const result = formatLine(raw, false);
  assert.strictEqual(result, 'GET /api/users 200');
  console.error('PASS: formatLine strip prefix when trackMode=false');
}

// --- formatLine: with TRACK prefix, trackMode=true → show filename ---
{
  const raw = '[[[TRACK:server.js]]]GET /api/users 200';
  const result = formatLine(raw, true);
  assert.ok(result.includes('server.js'), 'filename shown');
  assert.ok(result.includes('GET /api/users 200'), 'message shown');
  console.error('PASS: formatLine show filename when trackMode=true');
}

// --- applyHighlight: no highlights → passthrough ---
{
  assert.strictEqual(applyHighlight('line', []), 'line');
  console.error('PASS: applyHighlight no highlights');
}

// --- applyHighlight: matching highlight wraps with color ---
{
  const hl = [{ pattern: 'error', color: 'red' }];
  const result = applyHighlight('ERROR: crash', hl);
  assert.ok(result.startsWith(COLOR_MAP.red), 'red color prefix');
  assert.ok(result.endsWith('\x1b[0m'), 'reset suffix');
  assert.ok(result.includes('ERROR: crash'), 'message preserved');
  console.error('PASS: applyHighlight matching line');
}

// --- applyHighlight: non-matching → passthrough ---
{
  const hl = [{ pattern: 'error', color: 'red' }];
  assert.strictEqual(applyHighlight('INFO: fine', hl), 'INFO: fine');
  console.error('PASS: applyHighlight non-matching');
}

// --- applyHighlight: unknown color falls back to yellow ---
{
  const hl = [{ pattern: 'warn', color: 'purple' }];
  const result = applyHighlight('WARN: watch out', hl);
  assert.ok(result.startsWith(COLOR_MAP.yellow), 'unknown color falls back to yellow');
  console.error('PASS: applyHighlight unknown color fallback');
}
