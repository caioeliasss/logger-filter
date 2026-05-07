# logger-filter

Interactive log filter for any CLI process. Wrap any command and filter its output in real time — no restarts needed.

Zero dependencies. Node.js only.

## Install

```bash
npm install -g logger-filter
```

Or clone and link locally:

```bash
git clone https://github.com/caioeliasss/logger-filter.git
cd logger-filter
npm link
```

## Usage

```bash
filter <command> [args]
```

**Examples:**

```bash
filter node server.js
filter npx nodemon server.js
filter python main.py
filter --env production npm start
filter --cwd /path/to/project node app.js
```

**Flags:**

| Flag | Description |
|------|-------------|
| `--env <value>` | Set `NODE_ENV` (default: `development`) |
| `--cwd <path>` | Working directory for the child process |
| `--track` | Inject source filename into every log line (Node.js only) |
| `--no-track` | Disable auto-track even for Node.js commands |

**Auto-track:** `--track` is enabled automatically when the command is `node`, `nodemon`, `npx`, `ts-node`, `tsx`, or `bun`. Use `--no-track` to opt out.

## Project Config

Run `filter init` in your project directory to create a `.filter.json` config:

```bash
filter init
```

This creates `.filter.json` with your runner and environment. After that, running `filter` with no arguments uses the config:

```json
{
  "run": "npx nodemon server.js",
  "env": "development"
}
```

## Interactive Commands

Type while the process is running and press Enter:

| Command | Description |
|---------|-------------|
| `+pattern` | Show only lines matching pattern |
| `-pattern` | Hide lines matching pattern |
| `!pattern [--color]` | Highlight matching lines |
| `/remove <text>` | Remove a specific filter by pattern text |
| `/reset` | Remove all filters and highlights |
| `/clear` | Clear screen and reprint history |
| `/list` | List all active filters |
| `/track` | Toggle source filename display |
| `/help` | Show command reference |
| `Ctrl+C` | Kill process and exit |

**Highlight colors:** `yellow` (default), `red`, `green`, `blue`, `magenta`, `cyan`, `white`

## Demo

Start any process and filter its output without restarting:

```
$ filter node server.js

Server listening on port 3000
GET /api/users 200 12ms
GET /healthcheck 200 1ms
GET /api/orders 200 34ms
GET /healthcheck 200 1ms
POST /api/users 201 88ms

[filter] > -healthcheck
[filter] hide: "healthcheck" (total: 1)

GET /api/products 200 22ms
POST /api/orders 201 55ms
GET /api/users 200 11ms
```

Highlight errors in red with `!error --red`:

```diff
  [filter] > !error --red
  [filter] highlight: "error" (red)

  GET /api/users 200 14ms
- ERROR Failed to connect to database: timeout after 5000ms
- ERROR Retrying connection (1/3)...
  GET /api/products 200 22ms
- ERROR Retrying connection (2/3)...
  POST /api/orders 201 55ms
```

Remove a specific filter or reset everything:

```
[filter] > /remove healthcheck
[filter] removed filter: "healthcheck"

[filter] > /reset
[filter] all filters and highlights removed
```

## Track Mode

Start with `--track` to inject source filenames into every log line. Works with any Node.js process. Enabled automatically for `node`, `nodemon`, `npx`, `ts-node`, `tsx`, and `bun`.

```bash
filter --track node app.js
```

Each `console.log` call is prefixed with the file it came from, rendered in italic:

```
main.js - Server listening on port 3000
routes/users.js - GET /api/users 200 12ms
middleware/auth.js - Token verified for user 42
routes/users.js - GET /api/users 200 11ms
```

Toggle the filename display at runtime with `/track` — history reprints with or without filenames.

Since filenames appear in the output, you can filter by source file:

```
[filter] > -middleware/auth.js
[filter] hide: "middleware/auth.js" (total: 1)

main.js - Server listening on port 3000
routes/users.js - GET /api/users 200 12ms
```

## License

MIT
