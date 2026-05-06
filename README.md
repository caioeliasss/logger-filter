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

## Examples

```
filter node server.js
```

```
[filter] > -healthcheck        # hide health check noise
[filter] > +error              # show only error lines
[filter] > !timeout --red      # highlight "timeout" in red
[filter] > /remove error       # remove the +error filter
[filter] > /list               # see active filters
[filter] > /reset              # clear everything
```

## License

MIT
