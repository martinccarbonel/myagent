# Agentic OS — Command Center Dashboard

A single-file, zero-build dashboard ("mission control") for your AI agents: live agent status, one-click workflow tiles, a streaming activity feed, shared memory, a cron scheduler, and cost analytics — in the style of the Agentic OS visual command center.

## Quick start (pick one)

**Way 1 — Easiest: just look at it**

1. Download `index.html`
2. Double-click it. It opens in your browser with realistic demo data.

The header pill will say **LOCAL MODE**. Nothing to install, nothing to configure.

**Way 2 — With the backend (LIVE mode)**

You need [Node.js](https://nodejs.org) installed (any recent version). Then, in this folder:

```
node server.js
```

Open **http://localhost:8787** in your browser. The dashboard auto-detects the API and the header pill switches to **LIVE**. Clicking ▶ RUN on a workflow now actually calls the server, which updates its run count.

## How LIVE mode works (plain English)

- The dashboard tries to talk to an API every 5 seconds.
- If nothing answers, it quietly uses the demo data built into the file — it never shows an error or breaks.
- If something answers, it uses that data instead and shows **LIVE**.
- You don't have to edit anything for this. `node server.js` serves both the dashboard and the API on the same address, so it just works.

## Connecting YOUR real agents later

When you build a real agent runtime, it only needs to answer these URLs with JSON (exact shapes are in `server.js` — copy them):

| Method | Path                     | What it returns                        |
|--------|--------------------------|----------------------------------------|
| GET    | `/api/agents`            | Your agents + status/progress          |
| GET    | `/api/workflows`         | Your workflows                         |
| POST   | `/api/workflows/:id/run` | Called when someone clicks ▶ RUN       |
| GET    | `/api/memories`          | Memory entries                         |
| GET    | `/api/schedule`          | Cron tasks                             |
| GET    | `/api/metrics`           | Token counts, spend, usage per day     |

If your runtime runs somewhere else (another machine or port), set its address in one place — near the top of the `<script>` section in `index.html`:

```js
const CONFIG = { API_BASE: "http://192.168.1.50:8787", ... };
```

## Files

- `index.html` — the entire dashboard (HTML + CSS + JS, no dependencies)
- `server.js` — dependency-free Node API stub + static server
