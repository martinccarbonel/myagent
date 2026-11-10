# Agentic OS — Command Center Dashboard

A single-file, zero-build dashboard ("mission control") for your AI agents: live agent status, one-click workflow tiles, a streaming activity feed, shared memory, a cron scheduler, and cost analytics — in the style of the Agentic OS visual command center.

## Run it

Option A — just open the file:

```
open index.html        # macOS
xdg-open index.html    # Linux
```

Option B — serve the UI and the API stub together:

```
node server.js
# → http://localhost:8787
```

## Going live

The dashboard ships with realistic mock data. To wire it to a real agent runtime, set `API_BASE` at the top of the `<script>` block in `index.html`:

```js
const CONFIG = { API_BASE: "http://localhost:8787", ... };
```

Expected endpoints (all JSON, see `server.js` for the exact shapes):

| Method | Path                     | Purpose                        |
|--------|--------------------------|--------------------------------|
| GET    | `/api/agents`            | Agent list + status/progress   |
| GET    | `/api/workflows`         | Workflow tiles                 |
| POST   | `/api/workflows/:id/run` | Trigger a workflow             |
| GET    | `/api/memories`          | Shared memory entries          |
| GET    | `/api/schedule`          | Cron tasks                     |
| GET    | `/api/metrics`           | Tokens, spend, usage per day   |

If the API is unreachable, the UI silently falls back to mock data, so it never breaks.

## Files

- `index.html` — the entire dashboard (HTML + CSS + JS, no dependencies)
- `server.js` — dependency-free Node API stub + static server
