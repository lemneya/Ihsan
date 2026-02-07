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

import type { StreamInterface } from "../interfaces";

export interface BufferedEvent {
  event: string;
  data: any;
  timestamp: number;
}

export class HttpAdapter implements StreamInterface {
  private buffer: BufferedEvent[] = [];

  send(event: string, data: any): void {
    this.buffer.push({
      event,
      data,
      timestamp: Date.now(),
    });
  }

  /** Get all collected events */
  getEvents(): BufferedEvent[] {
    return this.buffer;
  }

  /** Extract the final assistant text from buffered text-delta events */
  getFullText(): string {
    return this.buffer
      .filter((e) => e.event === "agent:text-delta")
      .map((e) => e.data?.text || "")
      .join("");
  }

  /** Extract tool calls made during the run */
  getToolCalls(): Array<{ toolName: string; args: any; result?: any }> {
    const calls: Array<{ toolName: string; args: any; result?: any }> = [];

    for (const e of this.buffer) {
      if (e.event === "agent:tool-call") {
        calls.push({ toolName: e.data.toolName, args: e.data.args });
      }
      if (e.event === "agent:tool-result") {
        const existing = calls.find(
          (c) => c.toolName === e.data.toolName && !c.result
        );
        if (existing) existing.result = e.data.result;
      }
    }

    return calls;
  }

  /** Build a clean JSON response for the REST API */
  toResponse(): {
    text: string;
    toolCalls: Array<{ toolName: string; args: any; result?: any }>;
    events: BufferedEvent[];
    error?: string;
  } {
    const errorEvent = this.buffer.find((e) => e.event === "agent:error");

    return {
      text: this.getFullText(),
      toolCalls: this.getToolCalls(),
      events: this.buffer,
      ...(errorEvent ? { error: errorEvent.data.error } : {}),
    };
  }

  /** Reset the buffer for reuse */
  clear(): void {
    this.buffer = [];
  }
}
