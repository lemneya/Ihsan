"use strict";
/**
 * interfaces.ts — The Universal Stream Interface
 *
 * Phase 11: Headless Mode
 *
 * Decouples IhsanAgent from socket.io so it can stream events
 * through any transport: WebSocket, HTTP response, CLI, tests, etc.
 *
 * Any adapter that implements StreamInterface can power the agent.
 */
Object.defineProperty(exports, "__esModule", { value: true });
