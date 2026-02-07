"use strict";
/**
 * whatsapp.ts — WhatsApp Bridge via Twilio
 *
 * Phase 12: The Magic
 *
 * Receives incoming WhatsApp messages from the Twilio webhook,
 * runs them through IhsanAgent using HttpAdapter, and replies
 * with the agent's response via TwiML.
 *
 * Flow:
 *   1. Twilio sends POST with form-encoded Body + From
 *   2. We instantiate IhsanAgent with HttpAdapter (headless)
 *   3. Agent processes the message (tools, memory, skills — everything)
 *   4. We extract the agent's text and return TwiML XML
 *   5. Twilio delivers the reply to the user's WhatsApp
 *
 * Setup:
 *   - Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN in .env.local (optional, for signature validation)
 *   - In Twilio Console → WhatsApp Sandbox → set webhook to:
 *     https://<your-ngrok-url>/api/whatsapp
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWhatsAppRouter = createWhatsAppRouter;
const express_1 = require("express");
const agent_1 = require("../../src/agent-os/agent");
const http_adapter_1 = require("../../src/agent-os/adapters/http-adapter");
// ─── Twilio Signature Validation (optional security layer) ──────────
let validateRequest = null;
try {
    // Lazy-load Twilio's validation helper — only if twilio is installed
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const twilio = require("twilio");
    validateRequest = twilio.validateRequest;
}
catch {
    // Twilio not installed — skip signature validation
}
// ─── Helper: Build TwiML response ───────────────────────────────────
function twiml(message) {
    // Escape XML special characters
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
// ─── Helper: Truncate for WhatsApp's 1600-char limit ────────────────
const WHATSAPP_MAX_LENGTH = 1500; // Leave room for ellipsis
function truncate(text) {
    if (text.length <= WHATSAPP_MAX_LENGTH)
        return text;
    return text.slice(0, WHATSAPP_MAX_LENGTH) + "...";
}
// ─── Route Factory ──────────────────────────────────────────────────
function createWhatsAppRouter(registry, skills) {
    const router = (0, express_1.Router)();
    router.post("/", async (req, res) => {
        const body = req.body;
        const messageText = body.Body?.trim();
        const from = body.From || "unknown";
        const profileName = body.ProfileName || "User";
        console.log(`[WhatsApp] Message from ${profileName} (${from}): "${messageText?.slice(0, 80)}..."`);
        // ── Validate: Must have a message body ──────────────────────
        if (!messageText) {
            console.warn("[WhatsApp] Empty message received, ignoring");
            res.type("text/xml").send(twiml("I received an empty message. Please send me some text!"));
            return;
        }
        // ── Optional: Twilio signature validation ───────────────────
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        if (authToken && validateRequest) {
            const signature = req.headers["x-twilio-signature"];
            const url = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
            const isValid = validateRequest(authToken, signature || "", url, req.body);
            if (!isValid) {
                console.warn("[WhatsApp] Invalid Twilio signature — rejecting request");
                res.status(403).send("Forbidden");
                return;
            }
        }
        // ── Run the Agent ───────────────────────────────────────────
        const adapter = new http_adapter_1.HttpAdapter();
        const agent = new agent_1.IhsanAgent(adapter, registry);
        try {
            await agent.wakeUp();
            await agent.execute(messageText, { skills });
            const responseText = adapter.getFullText();
            const reply = responseText.trim() || "I processed your request but have nothing to say right now.";
            console.log(`[WhatsApp] Reply to ${profileName}: "${reply.slice(0, 80)}..."`);
            res.type("text/xml").send(twiml(truncate(reply)));
        }
        catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Unknown error";
            console.error(`[WhatsApp] Agent error for ${from}:`, errorMsg);
            res.type("text/xml").send(twiml("Sorry, I encountered an error processing your message. Please try again."));
        }
    });
    // ── Health check for the WhatsApp endpoint ────────────────────
    router.get("/", (_req, res) => {
        res.json({
            status: "ok",
            service: "Ihsan WhatsApp Bridge",
            info: "POST messages to this endpoint from Twilio webhook",
        });
    });
    return router;
}
