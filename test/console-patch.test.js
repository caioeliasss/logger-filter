'use strict';

// Tests for lib/track-inject.js — file must NOT contain "track-inject" in its path,
// otherwise getCallerFile() skips it (fp.includes('track-inject') guard).

const assert = require('assert');

function captureStream(stream) {
  const chunks = [];
  const orig = stream.write.bind(stream);
  stream.write = (s) => { chunks.push(s); return true; };
  return { chunks, restore: () => { stream.write = orig; } };
}

require('../lib/track-inject');

// --- console.log injects TRACK prefix ---
{
  const cap = captureStream(process.stdout);
  console.log('hello world');
  cap.restore();

  const out = cap.chunks.join('');
  assert.ok(
    out.startsWith('[[[TRACK:console-patch.test.js]]]'),
    `Expected TRACK:console-patch.test.js prefix, got: ${JSON.stringify(out)}`
  );
  assert.ok(out.includes('hello world'), 'Missing message body');
  process.stderr.write('PASS: console.log injects TRACK prefix\n');
}

// --- console.error goes to stderr ---
{
  const cap = captureStream(process.stderr);
  console.error('boom');
  cap.restore();

  const out = cap.chunks.join('');
  assert.ok(
    out.startsWith('[[[TRACK:console-patch.test.js]]]'),
    `Expected TRACK prefix on stderr, got: ${JSON.stringify(out)}`
  );
  assert.ok(out.includes('boom'), 'Missing error body');
  process.stderr.write('PASS: console.error injects TRACK prefix on stderr\n');
}

// --- multiple args use util.format ---
{
  const cap = captureStream(process.stdout);
  console.log('value: %d', 42);
  cap.restore();

  const out = cap.chunks.join('');
  assert.ok(out.includes('value: 42'), `util.format not applied, got: ${JSON.stringify(out)}`);
  process.stderr.write('PASS: multiple args formatted with util.format\n');
}

// --- caller is never track-inject.js itself ---
{
  const cap = captureStream(process.stdout);
  console.log('stack check');
  cap.restore();

  const out = cap.chunks.join('');
  assert.ok(!out.includes('[[[TRACK:track-inject.js]]]'), 'Should not show track-inject.js as caller');
  process.stderr.write('PASS: caller file is not track-inject.js itself\n');
}
