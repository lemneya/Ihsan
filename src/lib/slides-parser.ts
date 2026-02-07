export interface ParsedSlide {
  index: number;
  title: string;
  bullets: string[];
  speakerNotes: string;
  imageQuery: string;
}

/**
 * Parse markdown output from `generate_slides` into structured slides.
 * Expected format:
 *   ## Slide 1: Title
 *   - Bullet one
 *   - Bullet two
 *   [Image: description of the image]
 *   **Speaker Notes:** some notes
 *   ---
 */
export function parseSlideMarkdown(markdown: string): ParsedSlide[] {
  // Split by --- separators (horizontal rules)
  const rawSlides = markdown
    .split(/\n---\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  return rawSlides.map((raw, i) => {
    const lines = raw.split("\n");

    // Extract title from ## heading
    let title = `Slide ${i + 1}`;
    const headingLine = lines.find((l) => /^#{1,3}\s/.test(l));
    if (headingLine) {
      // Remove "## Slide N:" prefix if present, or just the ##
      title = headingLine
        .replace(/^#{1,3}\s+/, "")
        .replace(/^Slide\s+\d+\s*[:：]\s*/i, "")
        .trim();
    }

    // Extract [Image: ...] tag if present
    let imageQuery = "";
    const imageMatch = raw.match(/\[Image:\s*(.+?)\]/i);
    if (imageMatch) {
      imageQuery = imageMatch[1].trim();
    }

    // Derive image query from title if not explicitly provided
    if (!imageQuery) {
      imageQuery = deriveImageQuery(title, i === 0);
    }

    // Extract speaker notes
    let speakerNotes = "";
    const notesIdx = raw.search(/\*\*Speaker\s*Notes?\s*:?\*\*/i);
    if (notesIdx !== -1) {
      const afterNotes = raw.slice(notesIdx);
      speakerNotes = afterNotes
        .replace(/\*\*Speaker\s*Notes?\s*:?\*\*\s*/i, "")
        .trim();
    }

    // Extract bullet points (lines starting with - or *)
    const bullets = lines
      .filter((l) => /^\s*[-*]\s/.test(l))
      // Exclude lines that are part of speaker notes
      .filter((l) => {
        if (notesIdx === -1) return true;
        const lineIdx = raw.indexOf(l);
        return lineIdx < notesIdx;
      })
      // Exclude [Image:] lines that happen to start with - or *
      .filter((l) => !/\[Image:/i.test(l))
      .map((l) => l.replace(/^\s*[-*]\s+/, "").trim());

    return { index: i, title, bullets, speakerNotes, imageQuery };
  });
}

/** Derive a good image search query from a slide title */
function deriveImageQuery(title: string, isTitleSlide: boolean): string {
  // Clean up the title for image search
  const cleaned = title
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  if (isTitleSlide) {
    return `professional presentation cover, ${cleaned}, modern abstract digital art, dark background`;
  }

  return `${cleaned}, professional photography, modern concept`;
}

/**
 * Build a Pollinations.ai image URL from a query.
 * Works without any API keys — generates AI images on the fly.
 */
export function getSlideImageUrl(
  query: string,
  width = 1280,
  height = 720
): string {
  const prompt = `${query}, high quality, professional, suitable for presentation slide, 16:9 aspect ratio`;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&nologo=true`;
}
