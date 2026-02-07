"use strict";
/**
 * run_code.ts — The Cloud Sandbox Skill (E2B Code Interpreter)
 *
 * Executes code in a secure, cloud-based sandbox via E2B.
 * Supports Python, JavaScript, and Shell.
 *
 * This replaces the limited local `run_javascript` tool with a
 * full cloud environment that can:
 *   - Run Python with pip packages (numpy, pandas, matplotlib, etc.)
 *   - Execute shell commands (uname, curl, ls, etc.)
 *   - Generate charts/images (returned as base64 data URLs)
 *   - Handle multi-cell stateful sessions
 *
 * Requires E2B_API_KEY in .env.local
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const runCode = {
    name: "run_code",
    description: "Execute code in a secure cloud sandbox. Supports Python, JavaScript, and Shell. " +
        "ALWAYS use this instead of local execution. Use this for calculations, data analysis, " +
        "generating charts (matplotlib, plotly), running scripts, installing packages (!pip install), " +
        "and any computational task. Returns text output, logs, and generated images.",
    parameters: zod_1.z.object({
        language: zod_1.z
            .enum(["python", "javascript", "shell"])
            .default("python")
            .describe("Programming language to execute (python, javascript, or shell)"),
        code: zod_1.z.string().describe("The code to execute in the cloud sandbox"),
    }),
    execute: async (params) => {
        const { language, code } = params;
        // Lazy-import E2B to avoid crashing if the package isn't installed
        // or the API key isn't set (graceful degradation)
        let Sandbox;
        try {
            const e2b = await Promise.resolve().then(() => __importStar(require("@e2b/code-interpreter")));
            Sandbox = e2b.default || e2b.Sandbox;
        }
        catch (err) {
            throw new Error("E2B Code Interpreter is not available. " +
                "Install it with: npm install @e2b/code-interpreter");
        }
        // Check for API key
        const apiKey = process.env.E2B_API_KEY;
        if (!apiKey) {
            throw new Error("E2B_API_KEY is not set. Add it to your .env.local file. " +
                "Get a free key at https://e2b.dev");
        }
        let sandbox = null;
        try {
            // ── Create sandbox ────────────────────────────────────
            sandbox = await Sandbox.create({ apiKey });
            // ── Execute code ──────────────────────────────────────
            let execution;
            if (language === "shell") {
                // For shell commands, wrap in a Python subprocess call
                // E2B's runCode default is Python, so we use subprocess
                const shellWrapper = `
import subprocess
result = subprocess.run(
    ${JSON.stringify(code)},
    shell=True,
    capture_output=True,
    text=True,
    timeout=30
)
if result.stdout:
    print(result.stdout)
if result.stderr:
    print("[stderr]", result.stderr)
if result.returncode != 0:
    print(f"[exit code: {result.returncode}]")
`;
                execution = await sandbox.runCode(shellWrapper);
            }
            else if (language === "javascript") {
                // Run as JavaScript using E2B's language option
                execution = await sandbox.runCode(code, { language: "javascript" });
            }
            else {
                // Default: Python
                execution = await sandbox.runCode(code);
            }
            // ── Process results ───────────────────────────────────
            const output = {
                success: !execution.error,
                language,
                text: "",
                logs: {
                    stdout: execution.logs?.stdout || [],
                    stderr: execution.logs?.stderr || [],
                },
                images: [],
            };
            // Collect text results
            const textParts = [];
            if (execution.results && execution.results.length > 0) {
                for (const result of execution.results) {
                    // Text output (e.g. print statements, expression results)
                    if (result.text) {
                        textParts.push(result.text);
                    }
                    // Image output (e.g. matplotlib plots)
                    if (result.png) {
                        output.images.push(`data:image/png;base64,${result.png}`);
                    }
                    else if (result.jpeg) {
                        output.images.push(`data:image/jpeg;base64,${result.jpeg}`);
                    }
                    else if (result.svg) {
                        output.images.push(`data:image/svg+xml;base64,${Buffer.from(result.svg).toString("base64")}`);
                    }
                    // HTML output (e.g. pandas DataFrames)
                    if (result.html && !result.text) {
                        textParts.push("[HTML output generated]");
                    }
                }
            }
            // Combine stdout logs and results
            if (output.logs.stdout.length > 0) {
                textParts.unshift(...output.logs.stdout);
            }
            output.text = textParts.join("\n").trim();
            // Handle errors
            if (execution.error) {
                output.error = `${execution.error.name}: ${execution.error.value}`;
                if (!output.text) {
                    output.text = `Error: ${execution.error.name}: ${execution.error.value}`;
                }
            }
            // If no output at all, indicate that
            if (!output.text && output.images.length === 0 && !output.error) {
                output.text = "(Code executed successfully with no output)";
            }
            return output;
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            return {
                success: false,
                language,
                text: `Sandbox error: ${message}`,
                logs: { stdout: [], stderr: [] },
                images: [],
                error: message,
            };
        }
        finally {
            // ── Always close the sandbox ──────────────────────────
            if (sandbox) {
                try {
                    await sandbox.kill();
                }
                catch {
                    // Ignore cleanup errors
                }
            }
        }
    },
};
exports.default = runCode;
