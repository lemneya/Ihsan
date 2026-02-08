/**
 * whatsapp.ts — WhatsApp Bridge via Twilio
 *
 * Phase 13: Async Processing + Session Memory
 *
 * Fixes:
 *   1. AMNESIA: Uses From phone number as threadId for per-user memory.
 *      Each WhatsApp user gets their own conversation history.
 *   2. TIMEOUT: Responds to Twilio immediately (HTTP 200), processes
 *      in the background, then sends the reply via Twilio REST API.
 *
 * Flow (Async Mode):
 *   1. Twilio sends POST with form-encoded Body + From
 *   2. We immediately respond with empty TwiML (HTTP 200)
 *   3. Background: IhsanAgent processes the message (tools, memory, System 2)
 *   4. Background: Reply sent via twilioClient.messages.create()
 *   5. Twilio delivers the reply to the user's WhatsApp
 *
 * Flow (Sync Fallback — when Twilio credentials are missing):
 *   1. Twilio sends POST → Agent processes → TwiML response
 *   2. May timeout for complex queries (System 2 adds ~30-60s)
 *
 * Required env vars for async mode:
 *   - TWILIO_ACCOUNT_SID
 *   - TWILIO_AUTH_TOKEN
 */

import { Router } from "express";
import type { Request, Response } from "express";
import { IhsanAgent } from "../../src/agent-os/agent";
import { HttpAdapter } from "../../src/agent-os/adapters/http-adapter";
import { SkillRegistry } from "../../src/agent-os/skill-registry";

// ─── Twilio Client (for async message delivery) ──────────────────

let twilioClient: any = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Twilio = require("twilio");
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (sid && token) {
    twilioClient = new Twilio(sid, token);
    console.log("[WhatsApp] Twilio client initialized — async mode enabled");
  } else {
    console.warn("[WhatsApp] Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN — sync fallback mode");
  }
} catch {
  console.warn("[WhatsApp] Twilio SDK not installed — sync fallback mode");
}

// ─── Types ──────────────────────────────────────────────────────────

interface TwilioWebhookBody {
  Body?: string;        // The message text
  From?: string;        // "whatsapp:+1234567890"
  To?: string;          // "whatsapp:+0987654321"
  MessageSid?: string;  // Unique message ID
  NumMedia?: string;    // Number of media attachments
  ProfileName?: string; // Sender's WhatsApp display name
}

// ─── Helpers ────────────────────────────────────────────────────────

const WHATSAPP_MAX_LENGTH = 1500;

function truncate(text: string): string {
  if (text.length <= WHATSAPP_MAX_LENGTH) return text;
  return text.slice(0, WHATSAPP_MAX_LENGTH) + "...";
}

function emptyTwiml(): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    "<Response></Response>",
  ].join("\n");
}

function twiml(message: string): string {
  const escaped = message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    "<Response>",
    `  <Message>${escaped}</Message>`,
    "</Response>",
  ].join("\n");
}

// ─── Route Factory ──────────────────────────────────────────────────

export function createWhatsAppRouter(
  registry: SkillRegistry,
  skills: Array<{ id: string; title: string; desc: string; enabled: boolean; tools: string[]; skillDir?: string }>
): Router {
  const router = Router();

  router.post("/", async (req: Request, res: Response) => {
    const body = req.body as TwilioWebhookBody;
    const messageText = body.Body?.trim();
    const from = body.From || "unknown";
    const to = body.To || "";
    const profileName = body.ProfileName || "User";

    console.log(`[WhatsApp] Message from ${profileName} (${from}): "${messageText?.slice(0, 80)}..."`);

    // ── Validate: Must have a message body ──────────────────────
    if (!messageText) {
      console.warn("[WhatsApp] Empty message received, ignoring");
      res.type("text/xml").send(twiml("I received an empty message. Please send me some text!"));
      return;
    }

    // ── ASYNC MODE: Respond immediately, process in background ──
    if (twilioClient) {
      // Acknowledge Twilio immediately — no timeout risk
      res.type("text/xml").send(emptyTwiml());

      // Fire and forget — process in background
      processAndReply(messageText, from, to, profileName, registry, skills).catch((err) => {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[WhatsApp] Background processing error for ${from}: ${msg}`);
      });
      return;
    }

    // ── SYNC FALLBACK: Process and reply via TwiML ──────────────
    // (Used when TWILIO_AUTH_TOKEN is not set — may timeout with System 2)
    console.warn("[WhatsApp] Sync mode — response may timeout for complex queries");
    const adapter = new HttpAdapter();
    const agent = new IhsanAgent(adapter, registry, from);

    try {
      await agent.wakeUp();
      await agent.execute(messageText, { skills });

      const responseText = adapter.getFullText();
      const reply = responseText.trim() || "I processed your request but have nothing to say right now.";

      console.log(`[WhatsApp] Reply to ${profileName}: "${reply.slice(0, 80)}..."`);
      res.type("text/xml").send(twiml(truncate(reply)));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      console.error(`[WhatsApp] Agent error for ${from}:`, errorMsg);
      res.type("text/xml").send(
        twiml("Sorry, I encountered an error processing your message. Please try again.")
      );
    }
  });

  // ── Background Processor ──────────────────────────────────────

  async function processAndReply(
    messageText: string,
    from: string,
    to: string,
    profileName: string,
    registry: SkillRegistry,
    skills: Array<{ id: string; title: string; desc: string; enabled: boolean; tools: string[]; skillDir?: string }>
  ): Promise<void> {
    console.log(`[WhatsApp] [Async] Processing message from ${profileName} (${from})...`);

    const adapter = new HttpAdapter();
    // threadId = phone number → per-user memory isolation
    const agent = new IhsanAgent(adapter, registry, from);

    await agent.wakeUp();
    await agent.execute(messageText, { skills });

    const responseText = adapter.getFullText();
    const reply = responseText.trim() || "I processed your request but have nothing to say right now.";

    console.log(`[WhatsApp] [Async] Reply to ${profileName}: "${reply.slice(0, 80)}..."`);

    // Send via Twilio REST API
    await twilioClient.messages.create({
      from: to,   // Twilio's WhatsApp number
      to: from,   // The user's WhatsApp number
      body: truncate(reply),
    });

    console.log(`[WhatsApp] [Async] Message delivered to ${profileName} (${from})`);
  }

  // ── Health check for the WhatsApp endpoint ────────────────────
  router.get("/", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      service: "Ihsan WhatsApp Bridge",
      mode: twilioClient ? "async" : "sync (fallback)",
      info: "POST messages to this endpoint from Twilio webhook",
    });
  });

  return router;
}
