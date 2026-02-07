import type { ParsedSlide } from "./slides-parser";
import { getSlideImageUrl } from "./slides-parser";
import { getStyleTokens, toPptxColor, type SlideStyleTokens } from "./slide-styles";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PptxSlide = any;

// ─── Image Fetching ─────────────────────────────────────────────────

async function fetchImageBase64(query: string): Promise<string | null> {
  try {
    const res = await fetch("/api/slide-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: query }),
      signal: AbortSignal.timeout(35000),
    });
    if (res.ok) {
      const blob = await res.blob();
      return await blobToBase64(blob);
    }
  } catch {
    // Server route failed, try direct Pollinations URL
  }

  try {
    const url = getSlideImageUrl(query);
    const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (res.ok) {
      const blob = await res.blob();
      return await blobToBase64(blob);
    }
  } catch {
    // Image fetch failed entirely
  }
  return null;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function fetchAllImages(
  slides: ParsedSlide[],
  onProgress?: (done: number, total: number) => void
): Promise<(string | null)[]> {
  let done = 0;
  const results = await Promise.all(
    slides.map(async (slide) => {
      const img = await fetchImageBase64(slide.imageQuery);
      done++;
      onProgress?.(done, slides.length);
      return img;
    })
  );
  return results;
}

// ─── Theme Helpers ──────────────────────────────────────────────────

function isDarkBg(hex: string): boolean {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

function buildTheme(tokens: SlideStyleTokens) {
  const dark = isDarkBg(tokens.colors.background);
  return {
    bg: toPptxColor(tokens.colors.background),
    text: toPptxColor(tokens.colors.text),
    muted: toPptxColor(tokens.colors.muted),
    accent: toPptxColor(tokens.colors.accent),
    body: dark ? "CBD5E1" : toPptxColor(tokens.colors.text),
    bullet: toPptxColor(tokens.colors.accent),
    slideNum: toPptxColor(tokens.colors.muted),
    overlay: toPptxColor(tokens.colors.background),
    font: tokens.fonts.title.name,
    titleSize: tokens.fonts.title.size,
    subtitleSize: tokens.fonts.subtitle.size,
    bodySize: tokens.fonts.body.size,
    smallSize: tokens.fonts.small.size,
    dark,
    splitLeft: tokens.layout.two_column_split.left_pct / 100,
    splitRight: tokens.layout.two_column_split.right_pct / 100,
  };
}

// ─── PPTX Generation ────────────────────────────────────────────────

/**
 * Generate a PPTX deck following the SLIDES_SPEC SSOT.
 * Supports multiple style modes (Mono+Red, Corporate Blue, Minimal White, Dark Ihsan).
 */
export async function generatePptx(
  slides: ParsedSlide[],
  title: string,
  onProgress?: (done: number, total: number) => void,
  styleMode?: string
): Promise<Blob> {
  const tokens = getStyleTokens(styleMode);
  const T = buildTheme(tokens);

  // Fetch all images in parallel
  const images = await fetchAllImages(slides, onProgress);

  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();

  pptx.layout = "LAYOUT_WIDE";
  pptx.title = title;
  pptx.author = "Ihsan AI";

  const rectType = "rect" as PptxSlide;

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const s = pptx.addSlide();
    const imageData = images[i];
    const isTitle = i === 0;
    const isClosing = i === slides.length - 1 && slides.length > 2 && (
      slide.title.toLowerCase().includes("conclusion") ||
      slide.title.toLowerCase().includes("summary") ||
      slide.title.toLowerCase().includes("thank") ||
      slide.title.toLowerCase().includes("next step") ||
      slide.title.toLowerCase().includes("action")
    );

    s.background = { color: T.bg };

    const textShadow = T.dark || imageData
      ? { type: "outer" as const, blur: 8, offset: 2, color: "000000", opacity: 0.5 }
      : undefined;

    if (isTitle) {
      // ─── Cover Slide ──────────────────────────────────
      if (imageData) {
        s.addImage({ data: imageData, x: 0, y: 0, w: "100%", h: "100%" });
        s.addShape(rectType, {
          x: 0, y: 0, w: "100%", h: "100%",
          fill: { color: T.overlay, transparency: T.dark ? 35 : 55 },
        });
      }

      // Top accent bar
      s.addShape(rectType, { x: 0, y: 0, w: "100%", h: 0.06, fill: { color: T.accent } });

      // Title
      s.addText(slide.title, {
        x: 0.8, y: 1.8, w: 11, h: 1.6,
        fontSize: T.titleSize, bold: true,
        color: imageData ? "FFFFFF" : T.text,
        align: "left", fontFace: T.font,
        shadow: textShadow,
      });

      // Accent divider
      s.addShape(rectType, { x: 0.8, y: 3.4, w: 2.5, h: 0.05, fill: { color: T.accent } });

      // Subtitle
      const subtitle = slide.bullets.length > 0 ? slide.bullets[0] : "A presentation by Ihsan AI";
      s.addText(subtitle, {
        x: 0.8, y: 3.65, w: 9, h: 0.6,
        fontSize: T.subtitleSize,
        color: imageData ? "E2E8F0" : T.muted,
        align: "left", fontFace: T.font,
        shadow: textShadow,
      });

      // Branding
      s.addText("Created with Ihsan AI", {
        x: 0.8, y: 6.8, w: 4, h: 0.4,
        fontSize: T.smallSize, color: T.slideNum, fontFace: T.font,
      });

    } else if (isClosing) {
      // ─── Closing Slide ────────────────────────────────
      if (imageData) {
        s.addImage({ data: imageData, x: 0, y: 0, w: "100%", h: "100%" });
        s.addShape(rectType, {
          x: 0, y: 0, w: "100%", h: "100%",
          fill: { color: T.overlay, transparency: T.dark ? 30 : 50 },
        });
      }

      s.addShape(rectType, { x: 0, y: 0, w: "100%", h: 0.06, fill: { color: T.accent } });

      s.addText(slide.title, {
        x: 1, y: 2, w: 11, h: 1.2,
        fontSize: T.titleSize - 2, bold: true,
        color: imageData ? "FFFFFF" : T.text,
        align: "center", fontFace: T.font,
        shadow: textShadow,
      });

      if (slide.bullets.length > 0) {
        s.addText(
          slide.bullets.map((b) => ({
            text: b,
            options: {
              bullet: { code: "2022", color: T.bullet },
              breakLine: true,
              color: imageData ? "E2E8F0" : T.body,
            },
          })),
          {
            x: 2, y: 3.5, w: 9, h: 3,
            fontSize: T.bodySize - 6, lineSpacingMultiple: 1.5,
            valign: "top", align: "center", fontFace: T.font,
            shadow: textShadow,
          }
        );
      }

    } else {
      // ─── Content Slide ────────────────────────────────
      // Left accent bar
      s.addShape(rectType, { x: 0, y: 0, w: 0.08, h: "100%", fill: { color: T.accent } });

      // Two-column layout: text left, image right
      const textW = imageData ? T.splitLeft * 12.5 : 11;
      const imgX = T.splitLeft * 12.5 + 0.4;
      const imgW = T.splitRight * 12.5;

      if (imageData) {
        s.addImage({
          data: imageData,
          x: imgX, y: 0.4, w: imgW, h: 6.5,
          rounding: true,
        });
        // Soft edge blend
        s.addShape(rectType, {
          x: imgX, y: 0.4, w: 0.8, h: 6.5,
          fill: { color: T.bg, transparency: 30 },
        });
      }

      // Title
      s.addText(slide.title, {
        x: 0.6, y: 0.3, w: textW, h: 0.9,
        fontSize: T.titleSize - 14, bold: true, color: T.text,
        fontFace: T.font, valign: "middle",
      });

      // Title underline
      s.addShape(rectType, { x: 0.6, y: 1.2, w: 1.8, h: 0.03, fill: { color: T.accent } });

      // Bullets (enforce max 6 from SSOT)
      const displayBullets = slide.bullets.slice(0, tokens.rules.max_bullets);
      if (displayBullets.length > 0) {
        s.addText(
          displayBullets.map((b) => ({
            text: b,
            options: {
              bullet: { code: "2022", color: T.bullet },
              breakLine: true,
              color: T.body,
            },
          })),
          {
            x: 0.6, y: 1.5, w: textW, h: 4.8,
            fontSize: T.bodySize - 7, lineSpacingMultiple: 1.5,
            valign: "top", fontFace: T.font,
          }
        );
      }

      // Slide number
      s.addText(`${i + 1} / ${slides.length}`, {
        x: 11.5, y: 6.9, w: 1.5, h: 0.35,
        fontSize: 9, color: T.slideNum, align: "right", fontFace: T.font,
      });
    }

    // Speaker notes
    if (slide.speakerNotes) {
      s.addNotes(slide.speakerNotes);
    }
  }

  const output = (await pptx.write({ outputType: "blob" })) as Blob;
  return output;
}

/** Trigger browser download of a Blob */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
