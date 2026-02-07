/**
 * browser_search.ts — The First Dynamic Skill
 *
 * A real web search skill using DuckDuckGo's HTML endpoint.
 * Drop this file into /skills and the agent gains search capability
 * as a hot-loaded tool — no code changes needed.
 *
 * Implements the Skill interface from src/agent-os/types/skill.interface.ts
 */

import { z } from "zod";
import type { Skill } from "../src/agent-os/types/skill.interface";

const browserSearch: Skill = {
  name: "browser_search",

  description:
    "Search the web using DuckDuckGo and return structured results with titles, snippets, and URLs. Use this to find current information, research topics, or discover relevant web pages.",

  parameters: z.object({
    query: z.string().describe("The search query to look up"),
    max_results: z
      .number()
      .min(1)
      .max(10)
      .default(5)
      .describe("Maximum number of results to return (1-10)"),
  }),

  execute: async (params: { query: string; max_results?: number }) => {
    const { query, max_results = 5 } = params;
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

    try {
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

      // Parse DuckDuckGo HTML results
      const resultBlocks = html.match(
        /<div class="result[^"]*results_links[^"]*"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi
      );

      if (resultBlocks) {
        for (const block of resultBlocks.slice(0, max_results)) {
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
        return {
          query,
          results: [],
          message: "No results found for this query.",
        };
      }

      return { query, results, total: results.length };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { query, results: [], error: `Search failed: ${message}` };
    }
  },
};

export default browserSearch;
