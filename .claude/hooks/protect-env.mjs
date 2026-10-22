// PreToolUse hook: blocks file edits to .env and .env.local.
import path from "node:path";

const PROTECTED = new Set([".env", ".env.local"]);

let raw = "";
for await (const chunk of process.stdin) raw += chunk;

const input = JSON.parse(raw || "{}");
const filePath = input.tool_input?.file_path ?? input.tool_input?.notebook_path ?? "";

if (PROTECTED.has(path.basename(filePath))) {
  console.error(`${path.basename(filePath)} is protected. Ask the user before editing it.`);
  // Exit code 2 tells Claude Code to block the tool call; stderr is shown to Claude as the reason.
  process.exit(2);
}

process.exit(0);
