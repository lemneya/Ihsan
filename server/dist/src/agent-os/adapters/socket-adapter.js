"use strict";
/**
 * socket-adapter.ts — WebSocket Transport Adapter
 *
 * Phase 11: Headless Mode
 *
 * Wraps a socket.io Socket into the StreamInterface.
 * Drop-in replacement — the agent emits events exactly as before,
 * but now through the universal interface.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketAdapter = void 0;
class SocketAdapter {
    socket;
    constructor(socket) {
        this.socket = socket;
    }
    send(event, data) {
        this.socket.emit(event, data);
    }
    disconnect() {
        this.socket.disconnect(true);
    }
}
exports.SocketAdapter = SocketAdapter;
