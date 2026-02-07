import dotenv from "dotenv";
import path from "node:path";

// Load .env.local before anything else
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { IhsanAgent } from "../src/agent-os/agent";
import { ensureDirs } from "../src/agent-os/fs-adapter";

// ─── Express + Socket.io Setup ──────────────────────────────────────

const app = express();
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// ─── Connectors Data ────────────────────────────────────────────────

interface Connector {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: "connected" | "disconnected";
  category: string;
}

const connectors: Connector[] = [
  {
    id: "browser",
    name: "My Browser",
    description: "Let Ihsan access your personalized context and perform tasks directly in your browser.",
    icon: "chrome",
    status: "connected",
    category: "app",
  },
  {
    id: "gmail",
    name: "Gmail",
    description: "Draft replies, search your inbox, and summarize email threads instantly.",
    icon: "gmail",
    status: "disconnected",
    category: "app",
  },
  {
    id: "calendar",
    name: "Google Calendar",
    description: "Understand your schedule, manage events, and optimize your time effectively.",
    icon: "calendar",
    status: "disconnected",
    category: "app",
  },
  {
    id: "drive",
    name: "Google Drive",
    description: "Access your files, search instantly, and let Ihsan help you manage documents intelligently.",
    icon: "drive",
    status: "disconnected",
    category: "app",
  },
  {
    id: "outlook_mail",
    name: "Outlook Mail",
    description: "Write, search, and manage your Outlook emails seamlessly within Ihsan.",
    icon: "outlook",
    status: "disconnected",
    category: "app",
  },
  {
    id: "outlook_calendar",
    name: "Outlook Calendar",
    description: "Schedule, view, and manage your Outlook events just with a prompt.",
    icon: "outlook",
    status: "disconnected",
    category: "app",
  },
  {
    id: "github",
    name: "GitHub",
    description: "Manage repositories, track code changes, and collaborate on team projects.",
    icon: "github",
    status: "disconnected",
    category: "app",
  },
  {
    id: "slack",
    name: "Slack",
    description: "Read and write Slack conversations in Ihsan.",
    icon: "slack",
    status: "disconnected",
    category: "app",
  },
  {
    id: "notion",
    name: "Notion",
    description: "Search workspace content, update notes, and automate workflows in Notion.",
    icon: "notion",
    status: "disconnected",
    category: "app",
  },
  {
    id: "zapier",
    name: "Zapier",
    description: "Connect Ihsan and automate workflows across thousands of apps.",
    icon: "zapier",
    status: "disconnected",
    category: "app",
  },
];

app.get("/api/connectors", (_req, res) => {
  res.json(connectors);
});

// ─── File Upload (mock) ─────────────────────────────────────────────

app.post("/api/upload", (_req, res) => {
  setTimeout(() => {
    res.json({ success: true, fileId: `file_${Date.now()}`, message: "File processed successfully" });
  }, 1000);
});

// ─── Skills Data + API ──────────────────────────────────────────────

interface Skill {
  id: string;
  title: string;
  desc: string;
  enabled: boolean;
  official: boolean;
  date: string;
  tools: string[];  // Maps to agentTools keys
  skillDir?: string; // Path to skill spec dir (e.g. "skills/slides")
}

const skills: Skill[] = [
  { id: "video", title: "video-generator", desc: "Professional AI video production workflow. Use when creating videos, short films, or visual content.", enabled: false, official: true, date: "Feb 3, 2026", tools: ["generate_video_script"] },
  { id: "creator", title: "skill-creator", desc: "Guide for creating effective skills. This skill should be used when users want to create a new custom skill.", enabled: true, official: true, date: "Jan 23, 2026", tools: ["generate_document", "generate_code"] },
  { id: "stock", title: "stock-analysis", desc: "Analyze stocks and companies using financial market data. Get company profiles, technical indicators, and more.", enabled: false, official: true, date: "Jan 23, 2026", tools: ["web_search", "web_fetch", "run_javascript", "generate_spreadsheet"] },
  { id: "web", title: "similarweb-analytics", desc: "Analyze websites and domains using SimilarWeb traffic data. Get traffic metrics, audience insights, and competitors.", enabled: false, official: true, date: "Jan 23, 2026", tools: ["web_search", "web_fetch", "run_javascript"] },
  { id: "slides", title: "slides-generator", desc: "Create professional presentation slides from any text or outline automatically.", enabled: true, official: true, date: "Jan 18, 2026", tools: ["generate_slides", "generate_image_prompts"], skillDir: "skills/slides" },
  { id: "deep", title: "deep-research", desc: "Conduct thorough academic and technical research across millions of sources.", enabled: true, official: true, date: "Jan 15, 2026", tools: ["web_search", "web_fetch", "run_javascript", "generate_document"] },
];

app.get("/api/skills", (_req, res) => {
  res.json(skills);
});

// Core tools always available (never gated by skills)
const CORE_TOOLS = ["web_search", "web_fetch", "run_javascript", "create_artifact", "create_diagram"];

/** Returns de-duplicated list of tool names the agent may use right now */
function getEnabledToolNames(): string[] {
  const enabled = new Set<string>(CORE_TOOLS);
  for (const skill of skills) {
    if (skill.enabled) {
      for (const t of skill.tools) enabled.add(t);
    }
  }
  return [...enabled];
}

app.get("/api/skills/enabled-tools", (_req, res) => {
  const enabledSkills = skills.filter((s) => s.enabled);
  res.json({
    skills: enabledSkills.map((s) => ({ id: s.id, title: s.title, desc: s.desc, tools: s.tools, skillDir: s.skillDir })),
    tools: getEnabledToolNames(),
  });
});

app.put("/api/skills/:id/toggle", (req, res) => {
  const skill = skills.find((s) => s.id === req.params.id);
  if (skill) {
    skill.enabled = !skill.enabled;
    res.json({ success: true, skill });
  } else {
    res.status(404).json({ error: "Skill not found" });
  }
});

// ─── Integrations Data + API ─────────────────────────────────────────

interface Integration {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  workflows: number;
}

const integrations: Integration[] = [
  { id: "zapier", name: "Zapier", icon: "zapier", connected: true, workflows: 5 },
  { id: "make", name: "Make.com", icon: "make", connected: false, workflows: 0 },
  { id: "github_actions", name: "GitHub Actions", icon: "github", connected: true, workflows: 12 },
  { id: "vercel", name: "Vercel", icon: "vercel", connected: false, workflows: 0 },
];

app.get("/api/integrations", (_req, res) => {
  res.json(integrations);
});

// ─── Personalization Data + API ──────────────────────────────────────

interface Personalization {
  theme: "light" | "dark" | "system";
  language: string;
  memory: boolean;
  tone: string;
}

let personalization: Personalization = {
  theme: "light",
  language: "English (US)",
  memory: true,
  tone: "Professional",
};

app.get("/api/personalization", (_req, res) => {
  res.json(personalization);
});

app.put("/api/personalization", (req, res) => {
  personalization = { ...personalization, ...req.body };
  res.json({ success: true, data: personalization });
});

// ─── Active IhsanAgent Instances ─────────────────────────────────────

const agents = new Map<string, IhsanAgent>();

// ─── Socket.io Connection Handler ───────────────────────────────────

io.on("connection", async (socket) => {
  console.log(`[WS] Client connected: ${socket.id}`);

  // Heartbeat interval for this connection
  const heartbeatInterval = setInterval(() => {
    socket.emit("agent:heartbeat");
  }, 15000);

  // Instantiate the agent for this connection and wake it up
  const agent = new IhsanAgent(socket);
  agents.set(socket.id, agent);

  try {
    await agent.wakeUp();
  } catch (err) {
    console.error(`[WS] Agent wakeUp failed for ${socket.id}:`, err);
  }

  // ── agent:start — delegate to IhsanAgent.execute() ────────────

  socket.on("agent:start", async (payload: { task: string; mode?: "deep" }) => {
    const { task, mode } = payload;

    if (!task || typeof task !== "string" || task.trim().length === 0) {
      socket.emit("agent:error", { error: "Task is required" });
      return;
    }

    await agent.execute(task, {
      mode: mode === "deep" ? "deep" : undefined,
      skills,
    });
  });

  // ── slides:generate — delegate to IhsanAgent.generateSlides() ─

  socket.on("slides:generate", async (payload: { prompt: string }) => {
    const { prompt } = payload;
    if (!prompt || typeof prompt !== "string") {
      socket.emit("slides:error", { error: "Prompt is required" });
      return;
    }

    await agent.generateSlides(prompt);
  });

  // ── agent:stop — abort current run ────────────────────────────

  socket.on("agent:stop", () => {
    agent.abort();
    socket.emit("agent:finish", { finishReason: "stopped", totalSteps: 0 });
  });

  // ── disconnect — cleanup ──────────────────────────────────────

  socket.on("disconnect", () => {
    console.log(`[WS] Client disconnected: ${socket.id}`);
    clearInterval(heartbeatInterval);
    agent.abort();
    agents.delete(socket.id);
  });
});

// ─── Start ──────────────────────────────────────────────────────────

const PORT = parseInt(process.env.WS_PORT || "3001", 10);

// Ensure AgentOS directories exist before accepting connections
ensureDirs().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`[AgentOS] Directories verified (config/, memory/, skills/)`);
    console.log(`[WS] Ihsan WebSocket server running on http://localhost:${PORT}`);
  });
});
