import { htmlToText } from "@/lib/html-to-text";

export const maxDuration = 30;

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
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return Response.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return Response.json({ error: "Invalid URL" }, { status: 400 });
    }

    // Only allow http/https
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return Response.json(
        { error: "Only HTTP/HTTPS URLs are supported" },
        { status: 400 }
      );
    }

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; IhsanBot/1.0; +https://ihsan.ai)",
        Accept: "text/html,application/xhtml+xml,text/plain,*/*",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      return Response.json(
        { error: `Failed to fetch: ${res.status} ${res.statusText}` },
        { status: 502 }
      );
    }

    const contentType = res.headers.get("content-type") || "";
    const html = await res.text();

    // Extract title from HTML
    let title = "";
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (titleMatch) {
      title = titleMatch[1].trim().replace(/\s+/g, " ");
    }

    // Convert HTML to readable text
    let textContent = html;

    if (contentType.includes("html")) {
      textContent = htmlToText(html);
    }

    // Truncate to a reasonable size
    const maxLength = 80000;
    if (textContent.length > maxLength) {
      textContent = textContent.slice(0, maxLength) + "\n\n[Content truncated...]";
    }

    return Response.json({
      content: textContent,
      title,
      url: parsedUrl.href,
      length: textContent.length,
    });
  } catch (err) {
    console.error("[Browser Agent Fetch Error]", err);
    const message =
      err instanceof Error ? err.message : "Failed to fetch page";
    return Response.json({ error: message }, { status: 500 });
  }
}
