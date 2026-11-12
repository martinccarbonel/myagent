#!/usr/bin/env node
/**
 * Minimal dependency-free API stub for the Agentic OS dashboard.
 * Run:  node server.js   (then set API_BASE = "http://localhost:8787" in index.html)
 */
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 8787;

/* LLM brain: any Ollama-compatible server. Start Ollama and pick a model:
     ollama pull qwen3.8        (or any model you have: llama3.2, qwen3:4b, …)
     LLM_MODEL=qwen3.8 node server.js
   If Ollama is unreachable, Jarvis falls back to the built-in rule brain. */
const LLM_BASE = process.env.LLM_BASE || "http://localhost:11434";
const LLM_MODEL = process.env.LLM_MODEL || "qwen3.8";
const chatHistory = [];

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

function systemPrompt() {
  return "You are Jarvis, the voice assistant inside the user's Agentic OS dashboard. " +
    "Answer in 1-3 short sentences, spoken style, no markdown. Current dashboard state: " +
    `agents: ${agents.map(a => `${a.name}=${a.status}`).join(", ")}; ` +
    `tasks today: ${metrics.tasksToday}; spend last 24h: $${metrics.cost.toFixed(2)}; ` +
    `workflows: ${workflows.map(w => w.name).join(", ")}; ` +
    `scheduled jobs: ${schedule.map(s => `${s.name}=${s.on ? "on" : "off"}`).join(", ")}. ` +
    'To control the dashboard, reply ONLY with JSON: {"say":"short spoken reply","actions":[{"type":"run_workflow","name":"Morning Brief"},{"type":"toggle_schedule","name":"Inbox Triage","on":false}]}. ' +
    "Supported action types: run_workflow, toggle_schedule. Use actions only when the user asks you to do something; otherwise reply plain text.";
}

function fuzzyFind(list, t) {
  const toks = String(t).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  return list.find(item => {
    const words = item.name.toLowerCase().split(/\s+/).filter(w => w.length >= 3);
    if (!words.length) return false;
    return words.every(w => toks.some(tok =>
      tok === w || (tok.length >= 3 && (w.startsWith(tok) || tok.startsWith(w)))));
  });
}

function executeActions(actions) {
  if (!Array.isArray(actions)) return;
  for (const a of actions) {
    if (!a || !a.type) continue;
    if (a.type === "run_workflow") {
      const wf = fuzzyFind(workflows, String(a.name || "").toLowerCase());
      if (wf) { wf.runs += 1; wf.last = "just now"; }
    } else if (a.type === "toggle_schedule") {
      const s = fuzzyFind(schedule, String(a.name || "").toLowerCase());
      if (s) s.on = a.on !== false;
    }
  }
}

async function askLLM(text) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 60000);
  try {
    const res = await fetch(LLM_BASE + "/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: LLM_MODEL,
        stream: false,
        messages: [
          { role: "system", content: systemPrompt() },
          ...chatHistory,
          { role: "user", content: text }
        ]
      }),
      signal: ctrl.signal
    });
    if (!res.ok) throw new Error("llm " + res.status);
    const data = await res.json();
    const content = ((data.message && data.message.content) || "").trim();
    if (!content) throw new Error("empty reply");
    let reply = content;
    let actions = null;
    if (content.startsWith("{")) {
      try {
        const j = JSON.parse(content);
        reply = j.say || content;
        actions = j.actions || (j.run ? [{ type: "run_workflow", name: j.run }] : null);
      } catch {}
    }
    chatHistory.push({ role: "user", content: text });
    chatHistory.push({ role: "assistant", content: reply });
    while (chatHistory.length > 12) chatHistory.shift();
    executeActions(actions);
    return reply;
  } finally {
    clearTimeout(timer);
  }
}

function assistantReply(text) {
  const t = (text || "").toLowerCase();
  const running = agents.filter(a => a.status === "running" || a.status === "thinking");
  if (/\b(hello|hi|hey|jarvis)\b/.test(t))
    return `Hey there. ${running.length} agents active, ${metrics.tasksToday} tasks done today.`;
  const wantsOff = /off|disable|stop|pause|shut|kill/.test(t);
  const wantsOn = /\bon\b|enable|resume|arm|start/.test(t);
  if (wantsOff || wantsOn) {
    const s = fuzzyFind(schedule, t);
    if (s) {
      s.on = !wantsOff;
      return `${s.name} is now ${s.on ? "armed" : "off"}.`;
    }
  }
  if (/status|agent/.test(t))
    return agents.map(a => `${a.name} is ${a.status}`).join(". ");
  if (/spend|cost/.test(t))
    return `Spend in the last 24 hours is $${metrics.cost.toFixed(2)}.`;
  if (/token/.test(t))
    return `About ${(metrics.tokens / 1000).toFixed(0)} thousand tokens used this session.`;
  if (/task/.test(t)) return `${metrics.tasksToday} tasks completed today.`;
  if (/\btime\b/.test(t)) return `It's ${new Date().toLocaleTimeString()}.`;
  if (/memory/.test(t))
    return memories[0] ? `Most recent memory: ${memories[0].text}` : "Memory is empty.";
  if (/schedule|cron/.test(t)) {
    const s = schedule.filter(x => x.on);
    return s.length ? `${s.length} jobs armed. Next up: ${s[0].name}, ${s[0].next}.` : "No jobs are armed.";
  }
  const wf = fuzzyFind(workflows, t);
  if (wf && /run|start|launch|execute/.test(t)) { wf.runs += 1; wf.last = "just now"; return `Running ${wf.name} now.`; }
  if (/workflow/.test(t))
    return `You have ${workflows.length} workflows: ${workflows.map(w => w.name).join(", ")}.`;
  return "Ask me about agents, status, spend, tasks, schedule, memory — or say run followed by a workflow name.";
}

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

  if (req.method === "POST" && url.pathname === "/api/assistant") {
    let body = "";
    req.on("data", c => body += c);
    req.on("end", () => {
      let text = "";
      try { text = JSON.parse(body).text || ""; } catch {}
      askLLM(text)
        .then(reply => {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ reply, brain: "llm:" + LLM_MODEL }));
        })
        .catch(() => {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ reply: assistantReply(text), brain: "rules" }));
        });
    });
    return;
  }

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
