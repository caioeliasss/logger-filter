'use strict';

// Fixture app — used to manually test filter modes.
// Run: node bin/nf.js node test/fixtures/log-sample.js
// Run with track: node bin/nf.js --track node test/fixtures/log-sample.js

const lines = [
  () => console.log('INFO: server started on port 3000'),
  () => console.log('GET /api/users 200 12ms'),
  () => console.error('ERROR: database connection refused'),
  () => console.log('DEBUG: cache miss for key=session_abc'),
  () => console.warn('WARN: high memory usage 87%'),
  () => console.log('GET /api/orders 200 45ms'),
  () => console.log('POST /api/login 401 5ms'),
  () => console.error('ERROR: timeout after 5000ms'),
  () => console.log('DEBUG: query took 230ms'),
  () => console.log('INFO: graceful shutdown initiated'),
];

let i = 0;
const tick = setInterval(() => {
  if (i >= lines.length) { clearInterval(tick); return; }
  lines[i++]();
}, 300);
