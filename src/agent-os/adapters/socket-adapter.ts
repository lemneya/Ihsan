/**
 * socket-adapter.ts — WebSocket Transport Adapter
 *
 * Phase 11: Headless Mode
 *
 * Wraps a socket.io Socket into the StreamInterface.
 * Drop-in replacement — the agent emits events exactly as before,
 * but now through the universal interface.
 */

import type { Socket } from "socket.io";
import type { StreamInterface } from "../interfaces";

export class SocketAdapter implements StreamInterface {
  private socket: Socket;

  constructor(socket: Socket) {
    this.socket = socket;
  }

  send(event: string, data: any): void {
    this.socket.emit(event, data);
  }

  disconnect(): void {
    this.socket.disconnect(true);
  }
}
