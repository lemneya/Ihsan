"use strict";
/**
 * adapters/index.ts — Barrel export for all transport adapters
 *
 * Phase 11: Headless Mode
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpAdapter = exports.SocketAdapter = void 0;
var socket_adapter_1 = require("./socket-adapter");
Object.defineProperty(exports, "SocketAdapter", { enumerable: true, get: function () { return socket_adapter_1.SocketAdapter; } });
var http_adapter_1 = require("./http-adapter");
Object.defineProperty(exports, "HttpAdapter", { enumerable: true, get: function () { return http_adapter_1.HttpAdapter; } });
