/**
 * Style tokens for slide generation — mirrors skills/slides/STYLE_TOKENS.json
 * Defines multiple style modes as specified in the SLIDES_SPEC SSOT.
 */

export interface SlideStyleTokens {
  style_mode: string;
  fonts: {
    title: { name: string; size: number; weight: string };
    subtitle: { name: string; size: number; weight: string };
    body: { name: string; size: number; weight: string };
    small: { name: string; size: number; weight: string };
  };
  colors: {
    background: string;
    text: string;
    muted: string;
    accent: string;
  };
  layout: {
    ratio: string;
    margins_px: { top: number; right: number; bottom: number; left: number };
    two_column_split: { left_pct: number; right_pct: number };
  };
  rules: {
    max_bullets: number;
    max_words_per_bullet: number;
    one_idea_per_slide: boolean;
  };
}

// ─── Style Modes from SSOT ──────────────────────────────────────────

export const STYLE_MODES: Record<string, SlideStyleTokens> = {
  "Mono+Red": {
    style_mode: "Mono+Red",
    fonts: {
      title: { name: "Inter", size: 40, weight: "700" },
      subtitle: { name: "Inter", size: 20, weight: "500" },
      body: { name: "Inter", size: 22, weight: "400" },
      small: { name: "Inter", size: 14, weight: "400" },
    },
    colors: {
      background: "#FFFFFF",
      text: "#111111",
      muted: "#555555",
      accent: "#D0021B",
    },
    layout: {
      ratio: "16:9",
      margins_px: { top: 56, right: 64, bottom: 48, left: 64 },
      two_column_split: { left_pct: 58, right_pct: 42 },
    },
    rules: {
      max_bullets: 6,
      max_words_per_bullet: 12,
      one_idea_per_slide: true,
    },
  },

  "Corporate Blue": {
    style_mode: "Corporate Blue",
    fonts: {
      title: { name: "Inter", size: 40, weight: "700" },
      subtitle: { name: "Inter", size: 20, weight: "500" },
      body: { name: "Inter", size: 22, weight: "400" },
      small: { name: "Inter", size: 14, weight: "400" },
    },
    colors: {
      background: "#F8FAFC",
      text: "#0F172A",
      muted: "#64748B",
      accent: "#2563EB",
    },
    layout: {
      ratio: "16:9",
      margins_px: { top: 56, right: 64, bottom: 48, left: 64 },
      two_column_split: { left_pct: 58, right_pct: 42 },
    },
    rules: {
      max_bullets: 6,
      max_words_per_bullet: 12,
      one_idea_per_slide: true,
    },
  },

  "Minimal White": {
    style_mode: "Minimal White",
    fonts: {
      title: { name: "Inter", size: 40, weight: "700" },
      subtitle: { name: "Inter", size: 20, weight: "500" },
      body: { name: "Inter", size: 22, weight: "400" },
      small: { name: "Inter", size: 14, weight: "400" },
    },
    colors: {
      background: "#FFFFFF",
      text: "#1A1A1A",
      muted: "#999999",
      accent: "#1A1A1A",
    },
    layout: {
      ratio: "16:9",
      margins_px: { top: 56, right: 64, bottom: 48, left: 64 },
      two_column_split: { left_pct: 58, right_pct: 42 },
    },
    rules: {
      max_bullets: 6,
      max_words_per_bullet: 12,
      one_idea_per_slide: true,
    },
  },

  "Dark Ihsan": {
    style_mode: "Dark Ihsan",
    fonts: {
      title: { name: "Arial", size: 42, weight: "700" },
      subtitle: { name: "Arial", size: 20, weight: "500" },
      body: { name: "Arial", size: 15, weight: "400" },
      small: { name: "Arial", size: 10, weight: "400" },
    },
    colors: {
      background: "#0F172A",
      text: "#F8FAFC",
      muted: "#64748B",
      accent: "#8B5CF6",
    },
    layout: {
      ratio: "16:9",
      margins_px: { top: 56, right: 64, bottom: 48, left: 64 },
      two_column_split: { left_pct: 58, right_pct: 42 },
    },
    rules: {
      max_bullets: 6,
      max_words_per_bullet: 12,
      one_idea_per_slide: true,
    },
  },
};

/** Default style mode */
export const DEFAULT_STYLE = "Mono+Red";

/** Get style tokens by mode name, falls back to default */
export function getStyleTokens(mode?: string): SlideStyleTokens {
  if (mode && STYLE_MODES[mode]) return STYLE_MODES[mode];
  return STYLE_MODES[DEFAULT_STYLE];
}

/** Convert hex color (with #) to pptx hex (without #) */
export function toPptxColor(hex: string): string {
  return hex.replace("#", "");
}
