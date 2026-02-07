"use strict";
/**
 * list_files.ts — The Mirror Skill
 *
 * Gives Ihsan self-awareness of his own file structure.
 * Without this, the agent creates duplicate files because it
 * can't see what already exists.
 *
 * Supports recursive tree walking with depth limits.
 * Automatically skips node_modules, .git, and .next for performance.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var zod_1 = require("zod");
var promises_1 = require("node:fs/promises");
var node_path_1 = require("node:path");
// ─── Constants ──────────────────────────────────────────────────
var ROOT = process.cwd();
/** Directories to always skip — scanning these would be slow and useless */
var SKIP_DIRS = new Set([
    "node_modules",
    ".git",
    ".next",
    ".turbo",
    ".vercel",
    "dist",
    ".cache",
]);
/**
 * Recursively walk a directory and build a tree of entries.
 * Respects depth limits and skips blacklisted directories.
 */
function walkDir(dirPath, currentDepth, maxDepth) {
    return __awaiter(this, void 0, void 0, function () {
        var entries, dirContents, _a, sorted, _i, sorted_1, entry, fullPath, relativePath, node, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    entries = [];
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, (0, promises_1.readdir)(dirPath, { withFileTypes: true })];
                case 2:
                    dirContents = _c.sent();
                    return [3 /*break*/, 4];
                case 3:
                    _a = _c.sent();
                    return [2 /*return*/, entries]; // Permission denied or missing — skip silently
                case 4:
                    sorted = dirContents.sort(function (a, b) {
                        if (a.isDirectory() && !b.isDirectory())
                            return -1;
                        if (!a.isDirectory() && b.isDirectory())
                            return 1;
                        return a.name.localeCompare(b.name);
                    });
                    _i = 0, sorted_1 = sorted;
                    _c.label = 5;
                case 5:
                    if (!(_i < sorted_1.length)) return [3 /*break*/, 10];
                    entry = sorted_1[_i];
                    fullPath = (0, node_path_1.join)(dirPath, entry.name);
                    relativePath = (0, node_path_1.relative)(ROOT, fullPath).replace(/\\/g, "/");
                    if (!entry.isDirectory()) return [3 /*break*/, 8];
                    // Skip blacklisted directories
                    if (SKIP_DIRS.has(entry.name))
                        return [3 /*break*/, 9];
                    node = {
                        name: entry.name,
                        path: relativePath,
                        type: "dir",
                    };
                    if (!(currentDepth < maxDepth)) return [3 /*break*/, 7];
                    _b = node;
                    return [4 /*yield*/, walkDir(fullPath, currentDepth + 1, maxDepth)];
                case 6:
                    _b.children = _c.sent();
                    _c.label = 7;
                case 7:
                    entries.push(node);
                    return [3 /*break*/, 9];
                case 8:
                    entries.push({
                        name: entry.name,
                        path: relativePath,
                        type: "file",
                    });
                    _c.label = 9;
                case 9:
                    _i++;
                    return [3 /*break*/, 5];
                case 10: return [2 /*return*/, entries];
            }
        });
    });
}
/**
 * Format a tree into a visual ASCII tree string.
 *
 * Example output:
 *   ├── src/
 *   │   ├── agent-os/
 *   │   │   ├── agent.ts
 *   │   │   ├── safety.ts
 *   │   │   └── types/
 *   │   │       └── skill.interface.ts
 *   └── skills/
 *       ├── browser_search.ts
 *       └── write_file.ts
 */
function formatTree(entries, prefix) {
    if (prefix === void 0) { prefix = ""; }
    var lines = [];
    for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];
        var isLast = i === entries.length - 1;
        var connector = isLast ? "└── " : "├── ";
        var childPrefix = isLast ? "    " : "│   ";
        var suffix = entry.type === "dir" ? "/" : "";
        lines.push("".concat(prefix).concat(connector).concat(entry.name).concat(suffix));
        if (entry.children && entry.children.length > 0) {
            lines.push(formatTree(entry.children, prefix + childPrefix));
        }
    }
    return lines.join("\n");
}
// ─── Skill Definition ───────────────────────────────────────────
var listFiles = {
    name: "list_files",
    description: "List files and directories. Use this to explore the codebase, map the project " +
        "structure, or find specific files before creating new ones. Supports recursive " +
        "listing with depth control. Use this BEFORE writing files to avoid duplicates.",
    parameters: zod_1.z.object({
        dir_path: zod_1.z
            .string()
            .default(".")
            .describe("Relative path from project root (e.g. '.', 'src', 'skills', 'src/agent-os')"),
        recursive: zod_1.z
            .boolean()
            .default(false)
            .describe("If true, list all files recursively in subdirectories"),
        depth: zod_1.z
            .number()
            .min(1)
            .max(10)
            .default(3)
            .describe("Maximum depth for recursive listing (1-10, default 3)"),
    }),
    execute: function (params) { return __awaiter(void 0, void 0, void 0, function () {
        function countEntries(entries) {
            for (var _i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
                var e = entries_1[_i];
                if (e.type === "file")
                    fileCount++;
                else
                    dirCount++;
                if (e.children)
                    countEntries(e.children);
            }
        }
        var _a, dir_path, _b, recursive, _c, depth, normalized, targetDir, resolvedRelative, stats, err_1, maxDepth, tree, header, treeString, fileCount, dirCount;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _a = params.dir_path, dir_path = _a === void 0 ? "." : _a, _b = params.recursive, recursive = _b === void 0 ? false : _b, _c = params.depth, depth = _c === void 0 ? 3 : _c;
                    normalized = (0, node_path_1.normalize)(dir_path).replace(/\\/g, "/");
                    if ((0, node_path_1.isAbsolute)(normalized)) {
                        throw new Error("ACCESS DENIED: Absolute paths are not allowed. Use a relative path from the project root.");
                    }
                    if (normalized.startsWith("..")) {
                        throw new Error("ACCESS DENIED: Path traversal (..) is not allowed. Stay within the project.");
                    }
                    targetDir = (0, node_path_1.join)(ROOT, normalized);
                    resolvedRelative = (0, node_path_1.relative)(ROOT, targetDir);
                    if (resolvedRelative.startsWith("..")) {
                        throw new Error("ACCESS DENIED: The resolved path escapes the project root.");
                    }
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, (0, promises_1.stat)(targetDir)];
                case 2:
                    stats = _d.sent();
                    if (!stats.isDirectory()) {
                        throw new Error("\"".concat(dir_path, "\" is a file, not a directory."));
                    }
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _d.sent();
                    if (err_1.code === "ENOENT") {
                        throw new Error("Directory not found: \"".concat(dir_path, "\""));
                    }
                    throw err_1;
                case 4:
                    maxDepth = recursive ? depth : 1;
                    return [4 /*yield*/, walkDir(targetDir, 0, maxDepth)];
                case 5:
                    tree = _d.sent();
                    header = normalized === "." ? "/" : "/".concat(normalized, "/");
                    treeString = formatTree(tree);
                    fileCount = 0;
                    dirCount = 0;
                    countEntries(tree);
                    return [2 /*return*/, {
                            root: header,
                            tree: treeString,
                            summary: "".concat(dirCount, " directories, ").concat(fileCount, " files"),
                            entries: tree, // structured data for programmatic use
                        }];
            }
        });
    }); },
};
exports.default = listFiles;
