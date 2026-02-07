import { tool } from "ai";
import { z } from "zod";
import { htmlToText } from "./html-to-text";
import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// ─── Load SSOT Spec Files ───────────────────────────────────────────

const SKILLS_DIR = join(process.cwd(), "skills", "slides");

function loadSkillFile(filename: string): string {
  try {
    return readFileSync(join(SKILLS_DIR, filename), "utf-8");
  } catch {
    return "";
  }
}

const SLIDES_SPEC = loadSkillFile("SLIDES_SPEC.md");
const WORKFLOW = loadSkillFile("WORKFLOW.md");
const QUALITY_GATES = loadSkillFile("QUALITY_GATES.md");
const STYLE_TOKENS_RAW = loadSkillFile("STYLE_TOKENS.json");
const STYLE_TOKENS = STYLE_TOKENS_RAW ? JSON.parse(STYLE_TOKENS_RAW) : null;

// ─── Ihsan Tool System Prompts (reused from /api/tools) ─────────────

export const ihsanToolPrompts: Record<string, string> = {
  slides: `You are Ihsan Slides — a professional presentation engine.
You MUST follow the SLIDES_SPEC (SSOT) exactly. Do not improvise structure, slide count, or style.

${SLIDES_SPEC}

## Style Tokens
${STYLE_TOKENS_RAW}

## Output Format
Create a full slide deck in markdown. Format each slide as:
---
## Slide [number]: [Title]
- Bullet point (max 12 words)
- Another bullet (max 6 bullets per slide)
[Image: a vivid, specific description of a relevant professional image for this slide]
**Speaker Notes:** brief talking points
---

HARD RULES:
- One idea per slide — never mix topics.
- Max 6 bullets per slide, max 12 words per bullet.
- Every slide MUST have an [Image: ...] tag with a specific, visual description.
- Image descriptions must be vivid and concrete (e.g. "[Image: close-up of a robotic hand touching a human hand, soft blue lighting, dark background]").
- Do NOT use generic images. Each image must relate directly to the slide content.
- Include a Cover slide, structured content slides, and a Conclusion/Summary slide.
- Follow the structure template that matches the goal (Executive Brief / Education Explainer / Data Report).
- Compute slide count from the spec rules based on duration and goal.

## Pre-Built Content
If a pre-built outline is provided, follow it closely — use the slide titles, order, and takeaways as given.
If pre-researched sources are provided, weave them into the content with inline citations (e.g., "According to [Source]...").
Do NOT invent additional claims beyond what the research supports.`,

  docs: `You are an AI document writer. Create professional, well-structured documents.
Format with: Clear title and subtitle, table of contents for longer documents, properly structured sections with headings, professional tone, bullet points and numbered lists, bold key terms, and a summary/abstract for reports.`,

  developer: `You are an AI developer assistant. Generate complete, working code.
Rules: Write clean, well-commented code, include all necessary imports, provide full file structure if multiple files are needed, use modern best practices, include setup instructions, add error handling, use TypeScript for web projects by default, format code in proper markdown code blocks with language tags.`,

  designer: `You are an AI design assistant. Create detailed design specifications.
Provide: Design Brief, Color Palette (hex codes), Typography, Layout description, Components list, CSS/Tailwind code, HTML structure, Responsive notes, Accessibility notes. Generate SVG code for logos/icons when requested.`,

  sheets: `You are an AI spreadsheet/data analyst. Generate data as well-structured markdown tables.
Rules: Create proper column headers, generate realistic data, include formulas/calculations, add a summary/analysis section, format numbers properly (currency, percentages, etc.). Always output in markdown table format.`,

  image: `You are an AI image prompt engineer. Create 4 detailed prompts optimized for AI image generators (DALL-E, Midjourney, Stable Diffusion). Each should vary in style (photorealistic, illustration, digital art, watercolor). Include technical parameters: aspect ratio, lighting, camera angle, mood. Provide negative prompt suggestions.`,

  music: `You are an AI music composition assistant. Provide: Lyrics with verse/chorus/bridge structure, chord progressions, tempo (BPM), time signature, instrumentation, genre, mood, and AI music prompts for Suno/Udio.`,

  video: `You are an AI video production assistant. Provide: Video concept, full script with scenes, shot list, storyboard descriptions, B-roll suggestions, music/SFX recommendations, editing notes, and AI video prompts for Sora/Runway/Kling.`,
};

/** Helper: call an Ihsan tool by streaming from Claude with the tool-specific prompt, collect full text */
async function callIhsanTool(
  toolName: string,
  userPrompt: string
): Promise<string> {
  const systemPrompt = ihsanToolPrompts[toolName];
  if (!systemPrompt) throw new Error(`Unknown Ihsan tool: ${toolName}`);

  const model = anthropic("claude-sonnet-4-5-20250929");
  const result = streamText({
    model,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
    maxOutputTokens: 16000,
  });

  // Collect the full text
  let text = "";
  for await (const chunk of result.textStream) {
    text += chunk;
  }
  return text;
}

// ─── Agent Tools ────────────────────────────────────────────────────

// Core tools always available regardless of skill toggles
export const CORE_TOOL_NAMES = [
  "web_search",
  "web_fetch",
  "run_javascript",
  "create_artifact",
  "create_diagram",
] as const;

/** Filter agentTools to only include tools allowed by the given tool name list */
export function filterTools(allowedNames: string[]): typeof agentTools {
  const allowed = new Set(allowedNames);
  const filtered: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(agentTools)) {
    if (allowed.has(key)) {
      filtered[key] = value;
    }
  }
  return filtered as typeof agentTools;
}

export const agentTools = {
  // ── Web Tools ──────────────────────────────────────────────────────

  web_search: tool({
    description:
      "Search the web for information. Returns titles, snippets, and URLs. Use this to find current information, research topics, or discover relevant pages to fetch.",
    inputSchema: z.object({
      query: z.string().describe("The search query"),
    }),
    execute: async ({ query }) => {
      const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; IhsanAgent/1.0; +https://ihsan.ai)",
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        throw new Error(`Search failed: ${res.status} ${res.statusText}`);
      }

      const html = await res.text();
      const results: { title: string; snippet: string; url: string }[] = [];
      const resultBlocks = html.match(
        /<div class="result[^"]*results_links[^"]*"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi
      );

      if (resultBlocks) {
        for (const block of resultBlocks.slice(0, 8)) {
          const titleMatch = block.match(
            /<a[^>]*class="result__a"[^>]*>([\s\S]*?)<\/a>/i
          );
          const title = titleMatch
            ? titleMatch[1].replace(/<[^>]+>/g, "").trim()
            : "";

          const urlMatch = block.match(
            /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>/i
          );
          let resultUrl = urlMatch ? urlMatch[1] : "";
          if (resultUrl.includes("uddg=")) {
            const decoded = decodeURIComponent(
              resultUrl.split("uddg=")[1]?.split("&")[0] || ""
            );
            if (decoded) resultUrl = decoded;
          }

          const snippetMatch = block.match(
            /<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/i
          );
          const snippet = snippetMatch
            ? snippetMatch[1].replace(/<[^>]+>/g, "").trim()
            : "";

          if (title && resultUrl) {
            results.push({ title, snippet, url: resultUrl });
          }
        }
      }

      if (results.length === 0) {
        return { results: [], message: "No results found for this query." };
      }
      return { results };
    },
  }),

  web_fetch: tool({
    description:
      "Fetch a web page and extract its text content. Use this to read articles, documentation, or any web page.",
    inputSchema: z.object({
      url: z.string().url().describe("The URL to fetch"),
    }),
    execute: async ({ url }) => {
      const parsedUrl = new URL(url);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new Error("Only HTTP/HTTPS URLs are supported");
      }

      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; IhsanAgent/1.0; +https://ihsan.ai)",
          Accept: "text/html,application/xhtml+xml,text/plain,*/*",
        },
        redirect: "follow",
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
      }

      const contentType = res.headers.get("content-type") || "";
      const html = await res.text();

      let title = "";
      const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      if (titleMatch) {
        title = titleMatch[1].trim().replace(/\s+/g, " ");
      }

      let textContent = html;
      if (contentType.includes("html")) {
        textContent = htmlToText(html);
      }

      const maxLength = 30000;
      if (textContent.length > maxLength) {
        textContent =
          textContent.slice(0, maxLength) + "\n\n[Content truncated...]";
      }

      return { title, url: parsedUrl.href, content: textContent, length: textContent.length };
    },
  }),

  // ── Code & Artifacts ───────────────────────────────────────────────

  run_javascript: tool({
    description:
      "Execute JavaScript code and return the result. Useful for calculations, data processing, or generating structured output. The code runs in a sandbox with no access to require, process, or the file system. Use console.log() for output.",
    inputSchema: z.object({
      code: z.string().describe("The JavaScript code to execute"),
    }),
    execute: async ({ code }) => {
      const logs: string[] = [];
      const sandbox = {
        console: {
          log: (...args: unknown[]) => {
            logs.push(
              args
                .map((a) =>
                  typeof a === "object"
                    ? JSON.stringify(a, null, 2)
                    : String(a)
                )
                .join(" ")
            );
          },
          error: (...args: unknown[]) => {
            logs.push("[ERROR] " + args.map((a) => String(a)).join(" "));
          },
          warn: (...args: unknown[]) => {
            logs.push("[WARN] " + args.map((a) => String(a)).join(" "));
          },
        },
        JSON,
        Math,
        Date,
        Array,
        Object,
        String,
        Number,
        Boolean,
        RegExp,
        Map,
        Set,
        parseInt,
        parseFloat,
        isNaN,
        isFinite,
        encodeURIComponent,
        decodeURIComponent,
        encodeURI,
        decodeURI,
        setTimeout: undefined,
        setInterval: undefined,
        require: undefined,
        process: undefined,
        globalThis: undefined,
        global: undefined,
        fetch: undefined,
      };

      try {
        const context = vm.createContext(sandbox);
        const result = vm.runInContext(code, context, {
          timeout: 5000,
          displayErrors: true,
        });

        return {
          result: result !== undefined ? String(result) : undefined,
          logs: logs.length > 0 ? logs : undefined,
        };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Code execution failed";
        return { error: message, logs: logs.length > 0 ? logs : undefined };
      }
    },
  }),

  create_artifact: tool({
    description:
      "Create a downloadable file/artifact for the user. Use this when the user asks you to write code, create documents, or generate any file they might want to download.",
    inputSchema: z.object({
      title: z.string().describe("A short title for the artifact (e.g. 'fibonacci.py')"),
      language: z.string().describe("The programming language or file type (e.g. 'python', 'javascript', 'html', 'markdown')"),
      content: z.string().describe("The full content of the file"),
    }),
    execute: async ({ title, language, content }) => {
      return { title, language, content };
    },
  }),

  // ── Mermaid Diagram ────────────────────────────────────────────────

  create_diagram: tool({
    description:
      "Create a Mermaid diagram (flowchart, sequence diagram, mind map, timeline, architecture diagram, etc.). The diagram will be rendered visually in the browser. Use this to visualize processes, architectures, comparisons, timelines, or any concept that benefits from a visual representation.",
    inputSchema: z.object({
      title: z.string().describe("A short title for the diagram"),
      diagram: z.string().describe("The Mermaid diagram code (e.g. 'graph TD; A-->B; B-->C;')"),
    }),
    execute: async ({ title, diagram }) => {
      return { title, diagram };
    },
  }),

  // ── Ihsan Platform Tools (Agent as Orchestrator) ───────────────────
  // These let the agent invoke ANY Ihsan tool autonomously

  generate_slides: tool({
    description:
      "Generate a full presentation/slide deck using Ihsan Slides. IMPORTANT: Before calling this tool, you should have already completed Steps 0-3 of the workflow (intake, research, outline, visual planning). Pass your research and outline as parameters so the inner model can build a rich, evidence-backed deck.",
    inputSchema: z.object({
      topic: z.string().describe("The presentation topic"),
      audience: z.string().describe("Target audience (e.g., investors, staff, customers, students)").default("general"),
      goal: z.enum(["persuade", "educate", "report", "pitch"]).describe("Presentation goal").default("educate"),
      duration_min: z.number().describe("Presentation duration in minutes").default(10),
      tone: z.enum(["executive", "technical", "friendly", "academic"]).describe("Presentation tone").default("friendly"),
      constraints: z.string().describe("Optional constraints (e.g., 'no stock photos', 'cite sources')").optional(),
      research: z.string().describe("Bullet-point claims with source URLs from your web research (Steps 0-1)").optional(),
      outline: z.string().describe("Slide titles + one-sentence takeaways from your outline (Step 2)").optional(),
    }),
    execute: async ({ topic, audience, goal, duration_min, tone, constraints, research, outline }) => {
      // Deterministic slide count from SLIDES_SPEC
      let slideCount: number;
      if (goal === "pitch") {
        slideCount = Math.round(Math.min(14, Math.max(6, duration_min * 0.8)));
      } else if (goal === "educate") {
        slideCount = Math.round(Math.min(20, Math.max(8, duration_min * 1.2)));
      } else {
        slideCount = Math.round(Math.min(18, Math.max(6, duration_min * 1.0)));
      }

      // Select template
      let template: string;
      if (goal === "pitch" || goal === "persuade") {
        template = "Executive Brief";
      } else if (goal === "educate") {
        template = "Education Explainer";
      } else {
        template = "Data Report";
      }

      const researchSection = research
        ? `\n\n## Pre-Researched Sources\n${research}`
        : "";
      const outlineSection = outline
        ? `\n\n## Pre-Built Outline\n${outline}`
        : "";

      const structuredPrompt = `Topic: ${topic}
Audience: ${audience}
Goal: ${goal}
Duration: ${duration_min} minutes
Tone: ${tone}
Constraints: ${constraints || "none"}

REQUIRED: Use the "${template}" structure template.
REQUIRED: Generate exactly ${slideCount} slides (+-1 allowed only if template forces it).
REQUIRED: Follow all SLIDES_SPEC rules — one idea per slide, max 6 bullets, max 12 words per bullet.
REQUIRED: Every slide must have an [Image: ...] tag with a specific, vivid image description.${researchSection}${outlineSection}`;

      const content = await callIhsanTool("slides", structuredPrompt);
      return {
        tool: "slides",
        topic,
        audience,
        goal,
        template,
        slide_count: slideCount,
        tone,
        content,
      };
    },
  }),

  generate_document: tool({
    description:
      "Generate a professional document using Ihsan Docs. Use this for reports, proposals, essays, letters, memos, articles, guides, business plans, etc.",
    inputSchema: z.object({
      brief: z.string().describe("What document to create and any specific requirements"),
    }),
    execute: async ({ brief }) => {
      const content = await callIhsanTool("docs", brief);
      return { tool: "docs", brief, content };
    },
  }),

  generate_code: tool({
    description:
      "Generate complete, production-ready code using Ihsan Developer. Use this for full applications, components, scripts, or any substantial code the user needs. More powerful than run_javascript — this creates full files with imports, error handling, and setup instructions.",
    inputSchema: z.object({
      spec: z.string().describe("What code to generate — language, framework, and requirements"),
    }),
    execute: async ({ spec }) => {
      const content = await callIhsanTool("developer", spec);
      return { tool: "developer", spec, content };
    },
  }),

  generate_design: tool({
    description:
      "Generate a UI/UX design specification using Ihsan Designer. Includes color palette, typography, layout, components, CSS/HTML code, responsive notes, and accessibility guidelines.",
    inputSchema: z.object({
      brief: z.string().describe("What to design — app, website, component, logo, etc."),
    }),
    execute: async ({ brief }) => {
      const content = await callIhsanTool("designer", brief);
      return { tool: "designer", brief, content };
    },
  }),

  generate_spreadsheet: tool({
    description:
      "Generate data tables and analysis using Ihsan Sheets. Creates well-structured markdown tables with realistic data, formulas, and analysis.",
    inputSchema: z.object({
      request: z.string().describe("What data or analysis to generate"),
    }),
    execute: async ({ request }) => {
      const content = await callIhsanTool("sheets", request);
      return { tool: "sheets", request, content };
    },
  }),

  generate_image_prompts: tool({
    description:
      "Generate detailed AI image generation prompts using Ihsan Image. Creates 4 varied prompts optimized for DALL-E, Midjourney, and Stable Diffusion with technical parameters.",
    inputSchema: z.object({
      description: z.string().describe("What image the user wants to create"),
    }),
    execute: async ({ description }) => {
      const content = await callIhsanTool("image", description);
      return { tool: "image", description, content };
    },
  }),

  generate_music: tool({
    description:
      "Generate music composition, lyrics, and production specs using Ihsan Music. Includes chord progressions, lyrics with structure, tempo, instrumentation, and AI music prompts for Suno/Udio.",
    inputSchema: z.object({
      request: z.string().describe("What music/song to create — genre, mood, topic, etc."),
    }),
    execute: async ({ request }) => {
      const content = await callIhsanTool("music", request);
      return { tool: "music", request, content };
    },
  }),

  generate_video_script: tool({
    description:
      "Generate a complete video production plan using Ihsan Video. Includes script, shot list, storyboard descriptions, B-roll suggestions, and AI video prompts for Sora/Runway/Kling.",
    inputSchema: z.object({
      concept: z.string().describe("What video to create — topic, style, audience, duration"),
    }),
    execute: async ({ concept }) => {
      const content = await callIhsanTool("video", concept);
      return { tool: "video", concept, content };
    },
  }),
};
