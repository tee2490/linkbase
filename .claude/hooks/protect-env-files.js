#!/usr/bin/env node
const path = require("path");

const PROTECTED = new Set([".env", ".env.local"]);

let raw = "";
process.stdin.on("data", (chunk) => (raw += chunk));
process.stdin.on("end", () => {
  const input = JSON.parse(raw || "{}");
  const toolInput = input.tool_input || {};
  const target = toolInput.file_path || toolInput.notebook_path || "";

  if (PROTECTED.has(path.basename(target))) {
    // Exit code 2 tells Claude Code to block the tool call; stderr is shown to Claude as the reason.
    console.error(`${path.basename(target)} is protected. Ask the user before editing it.`);
    process.exit(2);
  }
  process.exit(0);
});
