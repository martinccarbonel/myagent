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

## Voice assistant (Jarvis)

Bottom-right corner of the dashboard: click the **glowing orb** and speak. Jarvis listens, answers **out loud**, and the conversation also shows up in the Live Activity feed. You can also just type to it.

Try saying:

- *"Hey Jarvis"* / *"what's my status"*
- *"how much spend today"*
- *"what's on the schedule"*
- *"run morning brief"* — actually triggers that workflow
- *"turn off my inbox triage agent"* — actually disarms that scheduled job (the Scheduler tab updates too)
- *"turn on inbox triage"* — arms it again

It understands fuzzy names, so "pause the triage job" works as well as the exact name.

**Browser note:** voice input works in **Chrome and Edge** (Firefox doesn't support it — you'll still be able to type). The first time, your browser will ask for **microphone permission** — click Allow.

The assistant's brain is a `POST /api/assistant` endpoint (send `{"text": "..."}`, get `{"reply": "...", "brain": "..."}` back). In demo mode the reply comes from a built-in rule-based brain, so it works even without the server. To give Jarvis a real LLM brain later, implement that one endpoint and call your model in it — the voice layer stays exactly the same. The LLM can control the dashboard by returning a `say` plus `actions` array (`run_workflow`, `toggle_schedule`) — see `systemPrompt()` in `server.js`.

## Give Jarvis a real (local) LLM brain

Yes — Jarvis can run on a **local LLM** and act like a full voice assistant (think Claude voice mode, but private and offline). It uses [Ollama](https://ollama.com):

1. Install Ollama (free): **[ollama.com/download](https://ollama.com/download)**
2. Pull a model (one terminal command):
   ```
   ollama pull qwen3.8
   ```
   Any Ollama model works. Bigger = smarter but slower: `qwen3.8` needs a beefy machine; `qwen3:4b` or `llama3.2` (2–4 GB) run fine on most laptops.
3. Start the dashboard server (Ollama can stay running in the background):
   ```
   LLM_MODEL=qwen3.8 node server.js
   ```
   (Windows PowerShell: `$env:LLM_MODEL="qwen3.8"; node server.js`)

That's it. Every voice command now goes through your local model, with **live dashboard state injected into every prompt** — so Jarvis knows your real agent statuses, spend, and workflows, and remembers the last few conversation turns.

**It can also act, not just talk:** ask it to *"run repo watcher"* and the model triggers the actual workflow in the dashboard.

**Automatic fallback:** if Ollama isn't running (or is still loading the model), Jarvis silently uses the built-in rule-based brain instead — the dashboard never breaks. The first question after starting Ollama may take a while (model load time); after that it's fast.

**Hardware note:** a 27B model wants ~20 GB of RAM/VRAM. On a normal laptop, use a small model (`qwen3:4b`, `llama3.2`) — still very capable for a dashboard assistant.

## Files

- `index.html` — the entire dashboard (HTML + CSS + JS, no dependencies)
- `server.js` — dependency-free Node API stub + static server
