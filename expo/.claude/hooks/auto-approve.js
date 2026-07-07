#!/usr/bin/env node
/**
 * Claude Code PreToolUse hook — auto-approve safe operations.
 *
 * Place at: .claude/hooks/auto-approve.js
 * Wired up via: .claude/settings.json (see settings.json in this folder)
 *
 * Decision logic:
 *   - Write/Edit: ALLOW inside the project, DENY for sensitive files (.env, credentials, .git internals)
 *   - Bash: DENY dangerous commands, ALLOW a whitelist of safe ones, ASK for everything else
 */

let raw = "";
process.stdin.on("data", (chunk) => (raw += chunk));
process.stdin.on("end", () => {
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    // Malformed input -> fall back to normal permission flow
    respond("ask", "Hook could not parse input");
    return;
  }

  const toolName = input.tool_name || "";
  const toolInput = input.tool_input || {};

  if (toolName === "Write" || toolName === "Edit" || toolName === "MultiEdit") {
    handleFileEdit(toolInput);
  } else if (toolName === "Bash") {
    handleBash(toolInput);
  } else {
    respond("ask", "No policy for this tool");
  }
});

// ---------------------------------------------------------------
// File edits
// ---------------------------------------------------------------
function handleFileEdit(toolInput) {
  const filePath = (toolInput.file_path || "").replace(/\\/g, "/");

  const SENSITIVE_PATTERNS = [
    /\.env($|\.)/i,          // .env, .env.local, .env.production
    /credentials/i,
    /secrets?\./i,
    /\.pem$/i,
    /\.key$/i,
    /id_rsa/i,
    /\.git\//,                // git internals
    /application-prod\.(ya?ml|properties)$/i, // prod Spring config
  ];

  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(filePath)) {
      respond("deny", `Blocked: edits to sensitive file (${filePath}) require manual action`);
      return;
    }
  }

  respond("allow", "Auto-approved: project file edit");
}

// ---------------------------------------------------------------
// Bash commands
// ---------------------------------------------------------------
function handleBash(toolInput) {
  const command = (toolInput.command || "").trim();

  // 1. Hard blocks — destructive or irreversible
  const DANGEROUS_PATTERNS = [
    /\brm\s+(-[a-z]*\s+)*-[a-z]*r[a-z]*f/i, // rm -rf variants
    /\brm\s+-fr/i,
    /\bsudo\b/i,
    /\bchmod\s+777\b/,
    /git\s+push\s+.*--force/i,
    /git\s+push\s+.*-f\b/i,
    /git\s+reset\s+--hard/i,
    /git\s+clean\s+-[a-z]*f/i,
    /\bdel\s+\/[sq]/i,               // Windows: del /s /q
    /\brmdir\s+\/s/i,                // Windows: rmdir /s
    /\bformat\b/i,
    /\bmkfs\b/,
    /\bdd\s+if=/,
    /curl\s+.*\|\s*(ba)?sh/i,        // pipe-to-shell installs
    /wget\s+.*\|\s*(ba)?sh/i,
    /\bDROP\s+(TABLE|DATABASE)\b/i,
    /\bTRUNCATE\s+TABLE\b/i,
    /flyway\s+clean/i,               // wipes your DB schema!
    /npm\s+publish/i,
    /mvn\s+deploy/i,
    /railway\s+(up|deploy)/i,        // no accidental prod deploys
  ];

  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(command)) {
      respond("deny", `Blocked by policy: matches dangerous pattern (${pattern})`);
      return;
    }
  }

  // 2. Auto-approve — read-only and safe dev commands
  const SAFE_PREFIXES = [
    // Read-only shell
    "ls", "dir", "cat", "type ", "head", "tail", "grep", "find ", "findstr",
    "pwd", "cd ", "echo", "which", "where ", "tree",
    // Git (read-only + safe writes)
    "git status", "git log", "git diff", "git branch", "git show",
    "git add", "git stash list", "git fetch", "git remote -v",
    // Java / Maven
    "mvn compile", "mvn test", "mvn verify", "mvn clean compile",
    "mvn clean test", "mvn spring-boot:run", "mvn dependency:tree",
    "./mvnw ", "mvnw ",
    // Node / Expo / React Native
    "npm test", "npm run", "npm ls", "npm list", "npm install", "npm ci",
    "npx expo start", "npx expo doctor", "npx tsc", "npx eslint",
    "npx prettier", "yarn install", "yarn test",
    // Info
    "node -v", "npm -v", "java -version", "mvn -v", "adb devices",
  ];

  const normalized = command.toLowerCase();
  for (const prefix of SAFE_PREFIXES) {
    if (normalized.startsWith(prefix.toLowerCase())) {
      // Reject chained commands hiding behind a safe prefix (e.g. "ls; rm -rf /")
      if (/[;&|]{1,2}/.test(command) && !/^git (log|diff|show)/.test(normalized)) {
        respond("ask", "Chained command — needs manual review");
        return;
      }
      respond("allow", `Auto-approved: safe command (${prefix.trim()})`);
      return;
    }
  }

  // 3. Everything else -> normal permission prompt
  respond("ask", "Not in safe list — asking user");
}

// ---------------------------------------------------------------
// Output
// ---------------------------------------------------------------
function respond(decision, reason) {
  const output = {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: decision, // "allow" | "deny" | "ask"
      permissionDecisionReason: reason,
    },
  };
  console.log(JSON.stringify(output));
  process.exit(0);
}
