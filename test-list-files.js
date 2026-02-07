"use strict";
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
var list_files_1 = require("./skills/list_files");
function run() {
    return __awaiter(this, void 0, void 0, function () {
        function check(name, condition) {
            if (condition) {
                console.log("  ✅ " + name);
                passed++;
            }
            else {
                console.log("  ❌ " + name);
                failed++;
            }
        }
        var passed, failed, root, skills, src, agentOs, types, err_1, err_2, err_3;
        var _a, _b, _c, _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    passed = 0;
                    failed = 0;
                    // Test 1: List project root (non-recursive)
                    console.log("\n=== Test 1: Root listing (non-recursive) ===\n");
                    return [4 /*yield*/, list_files_1.default.execute({ dir_path: ".", recursive: false, depth: 1 })];
                case 1:
                    root = _f.sent();
                    console.log(root.tree);
                    console.log("\n" + root.summary);
                    check("Root listing returned entries", root.entries.length > 0);
                    check("Root has tree string", root.tree.length > 0);
                    check("Root has skills/ dir", root.entries.some(function (e) { return e.name === "skills" && e.type === "dir"; }));
                    check("Root has src/ dir", root.entries.some(function (e) { return e.name === "src" && e.type === "dir"; }));
                    check("Root skips node_modules", !root.entries.some(function (e) { return e.name === "node_modules"; }));
                    check("Root skips .git", !root.entries.some(function (e) { return e.name === ".git"; }));
                    // Test 2: List skills/ directory
                    console.log("\n=== Test 2: Skills directory ===\n");
                    return [4 /*yield*/, list_files_1.default.execute({ dir_path: "skills", recursive: false, depth: 1 })];
                case 2:
                    skills = _f.sent();
                    console.log(skills.tree);
                    console.log("\n" + skills.summary);
                    check("Skills has write_file.ts", skills.entries.some(function (e) { return e.name === "write_file.ts"; }));
                    check("Skills has list_files.ts", skills.entries.some(function (e) { return e.name === "list_files.ts"; }));
                    check("Skills has browser_search.ts", skills.entries.some(function (e) { return e.name === "browser_search.ts"; }));
                    check("Skills has generate_slides.ts", skills.entries.some(function (e) { return e.name === "generate_slides.ts"; }));
                    check("Skills has memorize.ts", skills.entries.some(function (e) { return e.name === "memorize.ts"; }));
                    // Test 3: List src/ recursively
                    console.log("\n=== Test 3: src/ recursive (depth 3) ===\n");
                    return [4 /*yield*/, list_files_1.default.execute({ dir_path: "src", recursive: true, depth: 3 })];
                case 3:
                    src = _f.sent();
                    console.log(src.tree);
                    console.log("\n" + src.summary);
                    check("src/ has agent-os/ dir", src.entries.some(function (e) { return e.name === "agent-os" && e.type === "dir"; }));
                    agentOs = src.entries.find(function (e) { return e.name === "agent-os"; });
                    check("agent-os/ has agent.ts", (_a = agentOs === null || agentOs === void 0 ? void 0 : agentOs.children) === null || _a === void 0 ? void 0 : _a.some(function (e) { return e.name === "agent.ts"; }));
                    check("agent-os/ has safety.ts", (_b = agentOs === null || agentOs === void 0 ? void 0 : agentOs.children) === null || _b === void 0 ? void 0 : _b.some(function (e) { return e.name === "safety.ts"; }));
                    check("agent-os/ has types/ dir", (_c = agentOs === null || agentOs === void 0 ? void 0 : agentOs.children) === null || _c === void 0 ? void 0 : _c.some(function (e) { return e.name === "types" && e.type === "dir"; }));
                    types = (_d = agentOs === null || agentOs === void 0 ? void 0 : agentOs.children) === null || _d === void 0 ? void 0 : _d.find(function (e) { return e.name === "types"; });
                    check("types/ has skill.interface.ts", (_e = types === null || types === void 0 ? void 0 : types.children) === null || _e === void 0 ? void 0 : _e.some(function (e) { return e.name === "skill.interface.ts"; }));
                    // Test 4: Safety — reject absolute path
                    console.log("\n=== Test 4: Safety checks ===\n");
                    _f.label = 4;
                case 4:
                    _f.trys.push([4, 6, , 7]);
                    return [4 /*yield*/, list_files_1.default.execute({ dir_path: "/etc", recursive: false, depth: 1 })];
                case 5:
                    _f.sent();
                    check("Rejects absolute path", false);
                    return [3 /*break*/, 7];
                case 6:
                    err_1 = _f.sent();
                    check("Rejects absolute path", err_1.message.includes("ACCESS DENIED"));
                    return [3 /*break*/, 7];
                case 7:
                    _f.trys.push([7, 9, , 10]);
                    return [4 /*yield*/, list_files_1.default.execute({ dir_path: "../../..", recursive: false, depth: 1 })];
                case 8:
                    _f.sent();
                    check("Rejects path traversal", false);
                    return [3 /*break*/, 10];
                case 9:
                    err_2 = _f.sent();
                    check("Rejects path traversal", err_2.message.includes("ACCESS DENIED"));
                    return [3 /*break*/, 10];
                case 10:
                    _f.trys.push([10, 12, , 13]);
                    return [4 /*yield*/, list_files_1.default.execute({ dir_path: "nonexistent_dir", recursive: false, depth: 1 })];
                case 11:
                    _f.sent();
                    check("Rejects non-existent dir", false);
                    return [3 /*break*/, 13];
                case 12:
                    err_3 = _f.sent();
                    check("Rejects non-existent dir", err_3.message.includes("not found"));
                    return [3 /*break*/, 13];
                case 13:
                    console.log("\n=== RESULTS: ".concat(passed, " passed, ").concat(failed, " failed ===\n"));
                    if (failed > 0)
                        process.exit(1);
                    return [2 /*return*/];
            }
        });
    });
}
run().catch(function (err) { console.error(err); process.exit(1); });
