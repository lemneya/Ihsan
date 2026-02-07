/**
 * cognition.ts — System 2 Meta-Cognition Loop
 *
 * Phase 12: Think → Critique → Refine
 *
 * Implements a "Reward Model" pattern: after the agent generates
 * a draft response, the Critic evaluates it on three axes
 * (Grounding, Safety, Completeness). If the score falls below 90,
 * the Refiner rewrites the response using the Critic's fix instructions.
 *
 * Both functions use generateText() (non-streaming) with the same
 * base model but a "Strict Logic" system prompt to simulate
 * a separate evaluation model.
 */

import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

// ─── Types ──────────────────────────────────────────────────────────

export interface CriticResult {
  grounding: number;
  safety: number;
  completeness: number;
  score: number;
  instructions: string;
}

// ─── Critic System Prompt ───────────────────────────────────────────

const CRITIC_SYSTEM_PROMPT = `You are a Strict Logic Critic — a hostile peer reviewer simulating a separate Reward Model.

Your job is to evaluate an AI assistant's draft response against the user's original prompt.

## Evaluation Criteria

Score on three axes:

1. **Grounding (0-33)**: Is the response factually accurate? Does it avoid hallucination? Are claims verifiable or properly hedged?
2. **Safety (0-33)**: Is the response free of harmful, biased, or inappropriate content? Does it respect ethical boundaries?
3. **Completeness (0-34)**: Does the response fully address the user's request? Are there missing aspects, unanswered questions, or incomplete reasoning?

## Output Format

You MUST respond with ONLY a valid JSON object. No markdown fences, no explanation, no preamble:

{"grounding": <0-33>, "safety": <0-33>, "completeness": <0-34>, "score": <0-100>, "instructions": "<specific fix instructions if score < 90, otherwise PASS>"}

## Rules
- The "score" field MUST equal grounding + safety + completeness
- Be ruthless but fair — only give high scores for genuinely excellent responses
- If the response is a simple greeting or acknowledgment, score it high on all axes
- The "instructions" field must contain actionable, specific feedback when score < 90`;

// ─── Refiner System Prompt ──────────────────────────────────────────

const REFINER_SYSTEM_PROMPT = `You are a Refiner — your sole job is to improve a draft response based on specific critic feedback.

## Rules
1. Apply the critic's fix instructions precisely and completely
2. Preserve the original tone, style, and formatting
3. Do NOT add unnecessary padding, filler, or disclaimers
4. Do NOT mention the refinement process, the critic, or scoring to the user
5. Do NOT start with "Here's the refined version" or similar meta-commentary
6. Output ONLY the improved response — nothing else`;

// ─── Quality Threshold ─────────────────────────────────────────────

export const QUALITY_THRESHOLD = 90;

// ─── criticize() ───────────────────────────────────────────────────

export async function criticize(
  draft: string,
  originalPrompt: string
): Promise<CriticResult> {
  const model = anthropic("claude-sonnet-4-5-20250929");

  const { text } = await generateText({
    model,
    system: CRITIC_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          "## Original User Prompt",
          originalPrompt,
          "",
          "## Draft Response to Evaluate",
          draft,
        ].join("\n"),
      },
    ],
    maxOutputTokens: 512,
  });

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { grounding: 33, safety: 33, completeness: 29, score: 95, instructions: "PASS" };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      grounding: typeof parsed.grounding === "number" ? parsed.grounding : 33,
      safety: typeof parsed.safety === "number" ? parsed.safety : 33,
      completeness: typeof parsed.completeness === "number" ? parsed.completeness : 29,
      score: typeof parsed.score === "number" ? parsed.score : 95,
      instructions: typeof parsed.instructions === "string" ? parsed.instructions : "PASS",
    };
  } catch {
    // JSON parsing failed — default to passing the draft
    return { grounding: 33, safety: 33, completeness: 29, score: 95, instructions: "PASS" };
  }
}

// ─── refine() ──────────────────────────────────────────────────────

export async function refine(
  draft: string,
  instructions: string,
  originalPrompt: string
): Promise<string> {
  const model = anthropic("claude-sonnet-4-5-20250929");

  const { text } = await generateText({
    model,
    system: REFINER_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          "## Original User Prompt",
          originalPrompt,
          "",
          "## Draft Response",
          draft,
          "",
          "## Critic's Fix Instructions",
          instructions,
          "",
          "Produce the improved response:",
        ].join("\n"),
      },
    ],
    maxOutputTokens: 16000,
  });

  return text;
}
