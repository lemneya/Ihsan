"use strict";
/**
 * http-adapter.ts — HTTP/REST Transport Adapter
 *
 * Phase 11: Headless Mode
 *
 * Collects all agent events into an in-memory buffer.
 * When the agent finishes, the caller reads the buffer
 * and sends it as a single JSON response.
 *
 * Perfect for:
 *   - REST API endpoints (POST /api/chat)
 *   - WhatsApp/Telegram webhook handlers
 *   - CLI tools
 *   - Automated testing
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpAdapter = void 0;
class HttpAdapter {
    buffer = [];
    send(event, data) {
        this.buffer.push({
            event,
            data,
            timestamp: Date.now(),
        });
    }
    /** Get all collected events */
    getEvents() {
        return this.buffer;
    }
    /** Extract the final assistant text from buffered text-delta events */
    getFullText() {
        return this.buffer
            .filter((e) => e.event === "agent:text-delta")
            .map((e) => e.data?.text || "")
            .join("");
    }
    /** Extract tool calls made during the run */
    getToolCalls() {
        const calls = [];
        for (const e of this.buffer) {
            if (e.event === "agent:tool-call") {
                calls.push({ toolName: e.data.toolName, args: e.data.args });
            }
            if (e.event === "agent:tool-result") {
                const existing = calls.find((c) => c.toolName === e.data.toolName && !c.result);
                if (existing)
                    existing.result = e.data.result;
            }
        }
        return calls;
    }
    /** Build a clean JSON response for the REST API */
    toResponse() {
        const errorEvent = this.buffer.find((e) => e.event === "agent:error");
        return {
            text: this.getFullText(),
            toolCalls: this.getToolCalls(),
            events: this.buffer,
            ...(errorEvent ? { error: errorEvent.data.error } : {}),
        };
    }
    /** Reset the buffer for reuse */
    clear() {
        this.buffer = [];
    }
}
exports.HttpAdapter = HttpAdapter;
