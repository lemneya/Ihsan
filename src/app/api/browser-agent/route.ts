import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

export const maxDuration = 120;

const BROWSER_AGENT_PROMPT = `You are Ihsan Browser Agent — an AI that analyzes web page content provided by the user.

You can:
- **Summarize** pages concisely or in detail
- **Extract** key information, data, quotes, links, and structured content
- **Answer questions** about the page content
- **Translate** content to other languages
- **Analyze** the page's tone, bias, credibility, and key arguments
- **Compare** content across multiple pages
- **Generate** action items, notes, or follow-up tasks from the content

When analyzing content:
- Structure your response with clear markdown headings
- Use bullet points for key takeaways
- Bold important terms and findings
- Include relevant quotes from the source when helpful
- Note any limitations (e.g., content that may have been truncated)

Be thorough, accurate, and well-organized. If the user asks a question about the content, answer directly and cite specific parts of the page.`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { pageContent, pageUrl, pageTitle, userMessage, action } = body;

    if (!pageContent && !userMessage) {
      return new Response(
        JSON.stringify({ error: "Page content or message is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    let prompt = "";

    // Build context from page content
    if (pageContent) {
      prompt += `## Page Information\n`;
      if (pageTitle) prompt += `**Title:** ${pageTitle}\n`;
      if (pageUrl) prompt += `**URL:** ${pageUrl}\n`;
      prompt += `\n## Page Content\n\`\`\`\n${pageContent.slice(0, 50000)}\n\`\`\`\n\n`;
    }

    // Add action-specific instructions
    switch (action) {
      case "summarize":
        prompt += `Provide a comprehensive summary of this page. Include:\n- Main topic/purpose\n- Key points (5-7 bullet points)\n- Important details or data\n- Conclusion/takeaway`;
        break;
      case "extract":
        prompt += `Extract all structured data from this page including:\n- Key facts and figures\n- Names, dates, and places\n- Links and references\n- Data tables if any\n- Contact information if present`;
        break;
      case "explain":
        prompt += `Explain this page's content in simple, easy-to-understand terms. Break down any complex concepts, jargon, or technical language.`;
        break;
      case "translate":
        prompt += userMessage
          ? `Translate the key content of this page to: ${userMessage}`
          : `Translate the key content of this page to English.`;
        break;
      case "analyze":
        prompt += `Analyze this page for:\n- Main arguments or claims\n- Tone and writing style\n- Potential bias or perspective\n- Credibility indicators\n- Missing information or gaps`;
        break;
      case "action-items":
        prompt += `Extract actionable items from this page:\n- Tasks or to-dos mentioned\n- Deadlines or dates\n- Decisions that need to be made\n- Follow-up items\nFormat as a checklist.`;
        break;
      default:
        if (userMessage) {
          prompt += `User question: ${userMessage}`;
        } else {
          prompt += `Provide a comprehensive summary of this page.`;
        }
    }

    const model = anthropic("claude-sonnet-4-5-20250929");

    const result = streamText({
      model,
      system: BROWSER_AGENT_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    return result.toTextStreamResponse();
  } catch (err) {
    console.error("[Browser Agent Error]", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
