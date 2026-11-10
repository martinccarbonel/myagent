#!/usr/bin/env node
/**
 * Minimal dependency-free API stub for the Agentic OS dashboard.
 * Run:  node server.js   (then set API_BASE = "http://localhost:8787" in index.html)
 */
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 8787;

let agents = [
  { id: "orchestrator", name: "Orchestrator", role: "Routes tasks, plans and delegates", status: "running", progress: 72, tokens: 48210 },
  { id: "researcher",   name: "Researcher",   role: "Web research, source synthesis",   status: "thinking", progress: 45, tokens: 91340 },
  { id: "coder",        name: "Coder",        role: "Writes and reviews code",          status: "running", progress: 88, tokens: 130540 },
  { id: "writer",       name: "Writer",       role: "Drafts docs and content",          status: "idle",    progress: 0,  tokens: 22110 }
];

let workflows = [
  { id: "w1", name: "Morning Brief",    desc: "Scrape news, summarize, email digest",        runs: 42,  success: 98,  last: "06:00 today" },
  { id: "w2", name: "Inbox Triage",     desc: "Classify, draft replies, flag urgent",        runs: 118, success: 96,  last: "12 min ago" },
  { id: "w3", name: "Repo Watcher",     desc: "Review PRs, run tests, comment findings",     runs: 67,  success: 91,  last: "1 h ago" }
];

const memories = [
  { tag: "PREFERENCE", text: "User prefers concise answers with code examples in TypeScript.", date: "2 h ago" },
  { tag: "PROJECT",    text: "myagent repo: single-file dashboard, Node API stub on :8787.",   date: "today" }
];

const schedule = [
  { id: "s1", name: "Morning Brief", cron: "0 6 * * *",    next: "in 7 h",   on: true },
  { id: "s2", name: "Inbox Triage",  cron: "*/15 * * * *", next: "in 4 m",   on: true }
];

const metrics = {
  tasksToday: 137,
  tokens: 317070,
  cost: 4.83,
  perDay: [310, 428, 380, 512, 466, 590, 317],
  breakdown: [
    { k: "deepseek-v4.1-flash", v: "$2.41" },
    { k: "claude-opus-5.5",     v: "$1.62" },
    { k: "qwen3.8 (local)",     v: "$0.00" }
  ]
};

const routes = {
  "/api/agents":    () => agents,
  "/api/workflows": () => workflows,
  "/api/memories":  () => memories,
  "/api/schedule":  () => schedule,
  "/api/metrics":   () => metrics
};

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (req.method === "POST" && /^\/api\/workflows\/[\w-]+\/run$/.test(url.pathname)) {
    const id = url.pathname.split("/")[3];
    const wf = workflows.find(w => w.id === id);
    if (wf) { wf.runs += 1; wf.last = "just now"; }
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ ok: true, id }));
  }

  const handler = routes[url.pathname];
  if (req.method === "GET" && handler) {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(handler()));
  }

  if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
    res.writeHead(200, { "Content-Type": "text/html" });
    return fs.createReadStream(path.join(__dirname, "index.html")).pipe(res);
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "not found" }));
});

server.listen(PORT, () => console.log(`Agentic OS API stub listening on http://localhost:${PORT}`));
