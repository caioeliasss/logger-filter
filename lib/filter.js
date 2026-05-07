'use strict';

const { spawn, spawnSync } = require('child_process');
const path = require('path');

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

function runFilter(cmdArgs, options) {
  const exclusions = [];
  const inclusions = [];
  const highlights = [];
  const history = [];
  let trackMode = false;

  const PROMPT = '\x1b[36m[filter]\x1b[0m > ';

  function toRegex(pattern) {
    return new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  }

  function shouldShow(line) {
    if (inclusions.length && !inclusions.some((re) => re.test(line))) return false;
    if (exclusions.some((re) => re.test(line))) return false;
    return true;
  }

  function formatLine(line) {
    const m = line.match(TRACK_RE);
    if (!m) return line;
    if (!trackMode) return m[2];
    return `\x1b[3m${m[1]}\x1b[23m - ${m[2]}`;
  }

  function applyHighlight(line) {
    if (!highlights.length) return line;
    const match = highlights.find(({ pattern }) =>
      new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(line)
    );
    if (!match) return line;
    const color = COLOR_MAP[match.color] || COLOR_MAP.yellow;
    return `${color}${line}\x1b[0m`;
  }

  let currentInput = '';

  function clearLine() {
    process.stdout.write('\r\x1b[K');
  }

  function redrawPrompt() {
    process.stdout.write(`\r${PROMPT}${currentInput}`);
  }

  function writeLog(line) {
    history.push(line);
    const display = formatLine(line);
    if (!shouldShow(display)) return;
    clearLine();
    process.stdout.write(applyHighlight(display) + '\n');
    redrawPrompt();
  }

  function reprintHistory() {
    process.stdout.write('\x1b[2J\x1b[H');
    history.forEach((line) => {
      const display = formatLine(line);
      if (shouldShow(display)) process.stdout.write(applyHighlight(display) + '\n');
    });
    redrawPrompt();
  }

  function makeLineBuffer(writer) {
    let buf = '';
    return (data) => {
      buf += data.toString();
      const lines = buf.split('\n');
      buf = lines.pop();
      lines.forEach((line) => { if (line) writer(line); });
    };
  }

  const [cmd, ...rest] = cmdArgs;
  const spawnEnv = { ...process.env, NODE_ENV: options.env };
  if (options.track) {
    const injectPath = path.resolve(__dirname, 'track-inject.js').replace(/\\/g, '/');
    const existing = spawnEnv.NODE_OPTIONS || '';
    spawnEnv.NODE_OPTIONS = `${existing} --require "${injectPath}"`.trim();
  }
  const child = spawn(cmd, rest, {
    env: spawnEnv,
    cwd: options.cwd,
    shell: true,
  });

  child.stdout.on('data', makeLineBuffer(writeLog));
  child.stderr.on('data', makeLineBuffer(writeLog));

  function killChild() {
    try {
      if (process.platform === 'win32') {
        spawnSync('taskkill', ['/F', '/T', '/PID', String(child.pid)]);
      } else {
        child.kill();
      }
    } catch (_) {}
  }

  child.on('exit', (code) => {
    clearLine();
    process.stdout.write(`[filter] process exited (code ${code})\n`);
    process.exit(code);
  });

  process.on('exit', killChild);
  process.on('SIGHUP', () => { killChild(); process.exit(0); });
  process.on('SIGTERM', () => { killChild(); process.exit(0); });

  function printInfo(msg) {
    clearLine();
    process.stdout.write(`\x1b[33m[filter]\x1b[0m ${msg}\n`);
    redrawPrompt();
  }

  function clearLogs() {
    history.length = 0;
    process.stdout.write('\x1b[3J\x1b[2J\x1b[H');

    const active = [
      ...inclusions.map((r) => `\x1b[32m+${r.source}\x1b[0m`),
      ...exclusions.map((r) => `\x1b[31m-${r.source}\x1b[0m`),
      ...highlights.map((h) => `\x1b[33m!${h.pattern}\x1b[0m`),
    ];
    if (active.length) {
      process.stdout.write(`\x1b[90m[active filters]\x1b[0m ${active.join('  ')}\n`);
    }

    redrawPrompt();
  }

  function handleCommand(c) {
    if (c.startsWith('!')) {
      const raw = c.slice(1);
      if (!raw) return;
      const colorMatch = raw.match(/\s+--(\w+)$/);
      const color = colorMatch ? colorMatch[1].toLowerCase() : 'yellow';
      const pattern = colorMatch ? raw.slice(0, colorMatch.index).trim() : raw.trim();
      if (!pattern) return;
      highlights.push({ pattern, color });
      printInfo(`highlight: "${pattern}" (${color})`);
      reprintHistory();
    } else if (c.startsWith('+')) {
      const pattern = c.slice(1);
      if (!pattern) return;
      inclusions.push(toRegex(pattern));
      printInfo(`show only: "${pattern}" (total: ${inclusions.length})`);
    } else if (c.startsWith('-')) {
      const pattern = c.slice(1);
      if (!pattern) return;
      exclusions.push(toRegex(pattern));
      printInfo(`hide: "${pattern}" (total: ${exclusions.length})`);
    } else if (c === '/reset') {
      exclusions.length = 0;
      inclusions.length = 0;
      highlights.length = 0;
      printInfo('all filters and highlights removed');
      reprintHistory();
    } else if (c === '/clear') {
      clearLogs();
    } else if (c === '/list') {
      printInfo(`show: ${inclusions.length ? inclusions.map((r) => r.source).join(', ') : 'all'}`);
      printInfo(`hide: ${exclusions.length ? exclusions.map((r) => r.source).join(', ') : 'none'}`);
      printInfo(`highlight: ${highlights.length ? highlights.map((h) => `${h.pattern}(${h.color})`).join(', ') : 'none'}`);
    } else if (c === '/track') {
      trackMode = !trackMode;
      printInfo(`track mode: ${trackMode ? 'on (showing source filenames)' : 'off'}`);
      if (!options.track && trackMode) {
        printInfo('hint: start with --track flag to inject file info (e.g. filter --track node app.js)');
      }
      reprintHistory();
    } else if (c === '/help') {
      printInfo('!<pattern> [--color]  highlight lines  (e.g. !error, !GET --blue)');
      printInfo('+<pattern>            show only lines matching pattern');
      printInfo('-<pattern>            hide lines matching pattern');
      printInfo('/remove <text>        remove specific filter by pattern text');
      printInfo('/reset                remove all filters and highlights');
      printInfo('/clear                clear screen and reprint history');
      printInfo('/list                 list active filters');
      printInfo('/track                toggle source filename display (requires --track flag)');
    } else if (c.startsWith('/remove ')) {
      const text = c.slice(8).trim();
      if (!text) return;
      const before = inclusions.length + exclusions.length + highlights.length;
      const inclIdx = inclusions.findIndex((r) => r.source === text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      if (inclIdx !== -1) inclusions.splice(inclIdx, 1);
      const exclIdx = exclusions.findIndex((r) => r.source === text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      if (exclIdx !== -1) exclusions.splice(exclIdx, 1);
      const hlIdx = highlights.findIndex((h) => h.pattern === text);
      if (hlIdx !== -1) highlights.splice(hlIdx, 1);
      const after = inclusions.length + exclusions.length + highlights.length;
      if (before === after) {
        printInfo(`no filter found for: "${text}"`);
      } else {
        printInfo(`removed filter: "${text}"`);
        reprintHistory();
      }
    } else if (c) {
      printInfo(`unknown command: "${c}" — type /help`);
    }
  }

  process.stdin.setRawMode(true);
  process.stdin.setEncoding('utf8');
  process.stdin.resume();

  redrawPrompt();

  process.stdin.on('data', (key) => {
    if (key === '\r' || key === '\n') {
      const c = currentInput.trim();
      clearLine();
      if (c) process.stdout.write(`\x1b[90m> ${c}\x1b[0m\n`);
      currentInput = '';
      handleCommand(c);
      if (!c) redrawPrompt();
    } else if (key === '\x7f' || key === '\b') {
      if (currentInput.length > 0) {
        currentInput = currentInput.slice(0, -1);
        process.stdout.write('\r\x1b[K');
        redrawPrompt();
      }
    } else if (key === '\x03') {
      process.stdout.write('\n');
      child.kill();
      process.exit(0);
    } else if (key >= ' ') {
      currentInput += key;
      process.stdout.write(key);
    }
  });
}

module.exports = { runFilter };
