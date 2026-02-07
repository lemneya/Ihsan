/**
 * adapters/index.ts — Barrel export for all transport adapters
 *
 * Phase 11: Headless Mode
 */

export { SocketAdapter } from "./socket-adapter";
export { HttpAdapter } from "./http-adapter";
export type { BufferedEvent } from "./http-adapter";
