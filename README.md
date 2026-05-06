# logger-filter

Interactive log filter for any CLI process. Wrap any command and filter its output in real time — no restarts needed.

Zero dependencies. Node.js only.

## Install

```bash
npm install -g logger-filter
```

Or clone and link locally:

```bash
git clone https://github.com/your-username/logger-filter.git
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
| `/help` | Show command reference |
| `Ctrl+C` | Kill process and exit |

**Highlight colors:** `yellow` (default), `red`, `green`, `blue`, `magenta`, `cyan`, `white`

## Demo

```
$ filter node server.js

Server listening on port 3000
GET /api/users 200 12ms
GET /healthcheck 200 1ms
GET /api/orders 200 34ms
GET /healthcheck 200 1ms
POST /api/users 201 88ms
GET /healthcheck 200 1ms

[filter] > -healthcheck
[filter] hide: "healthcheck" (total: 1)

GET /api/products 200 22ms
POST /api/orders 201 55ms
GET /api/users 200 11ms

[filter] > !error --red
[filter] highlight: "error" (red)

[filter] > +error
[filter] show only: "error" (total: 1)

ERROR Failed to connect to database: timeout after 5000ms
ERROR Retrying connection (1/3)...
ERROR Retrying connection (2/3)...

[filter] > /list
[filter] show: healthcheck
[filter] hide: error
[filter] highlight: error(red)

[filter] > /remove error
[filter] removed filter: "error"

GET /api/users 200 12ms
GET /api/products 200 19ms
ERROR Failed to connect to database: timeout after 5000ms

[filter] > /reset
[filter] all filters and highlights removed
```

## License

MIT
