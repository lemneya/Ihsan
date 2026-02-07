import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/slide-image
 * Generates or fetches an image for a presentation slide.
 *
 * Body: { prompt: string }
 * Returns: image/png binary
 *
 * Strategy:
 *   1. If GOOGLE_GENERATIVE_AI_API_KEY is set → use Gemini Nano Banana (image generation)
 *   2. Fallback → proxy from Pollinations.ai (free, no API key)
 */
export async function POST(req: NextRequest) {
  const { prompt } = (await req.json()) as { prompt: string };

  if (!prompt) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }

  const googleKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  // ── Strategy 1: Gemini Nano Banana ────────────────────────────────
  if (googleKey) {
    try {
      const imageData = await generateWithGemini(googleKey, prompt);
      if (imageData) {
        const buffer = Buffer.from(imageData, "base64");
        return new NextResponse(buffer, {
          headers: {
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=86400",
          },
        });
      }
    } catch (err) {
      console.warn("Gemini image generation failed, falling back to Pollinations:", err);
    }
  }

  // ── Strategy 2: Pollinations.ai (free fallback) ───────────────────
  try {
    const imagePrompt = `${prompt}, high quality, professional, suitable for presentation slide, 16:9 aspect ratio`;
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=1280&height=720&nologo=true`;

    const res = await fetch(url, {
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      throw new Error(`Pollinations returned ${res.status}`);
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": res.headers.get("content-type") || "image/jpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err) {
    console.error("Image generation failed:", err);
    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 }
    );
  }
}

/**
 * Generate an image using Gemini Nano Banana (gemini-2.0-flash-exp).
 * Returns base64-encoded PNG data, or null on failure.
 */
async function generateWithGemini(
  apiKey: string,
  prompt: string
): Promise<string | null> {
  const body = {
    contents: [
      {
        parts: [
          {
            text: `Generate a professional, high-quality image for a presentation slide. The image should be visually striking with a dark/navy color scheme. Subject: ${prompt}`,
          },
        ],
      },
    ],
    generationConfig: {
      responseModalities: ["IMAGE", "TEXT"],
    },
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.warn("Gemini API error:", res.status, text);
    return null;
  }

  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!parts) return null;

  for (const part of parts) {
    if (part.inlineData?.data) {
      return part.inlineData.data;
    }
  }

  return null;
}
