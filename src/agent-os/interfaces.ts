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

export interface StreamInterface {
  /** Send a named event with arbitrary data to the consumer */
  send(event: string, data: any): void;

  /** Optional: tear down the connection when the agent is done */
  disconnect?(): void;
}
