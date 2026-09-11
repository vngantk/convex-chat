#!/usr/bin/env node
/**
 * Select (or create) a local Convex CLI deployment and run it with Vite.
 *
 * The browser only talks to http://localhost:5173. Vite proxies `/api` and
 * auth HTTP routes to the local backend ports (3210 / 3211).
 */
import { spawn, spawnSync } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const convexBin = join(root, "node_modules/.bin/convex");

/**
 * @param {string[]} args
 * @param {{ stdio?: import("node:child_process").StdioOptions }} [opts]
 */
function convexSync(args, opts = {}) {
  return spawnSync(convexBin, args, {
    cwd: root,
    encoding: "utf8",
    stdio: opts.stdio ?? "inherit",
  });
}

const selected = convexSync(["deployment", "select", "local"], {
  stdio: ["inherit", "pipe", "pipe"],
});
if (selected.status !== 0) {
  console.log("No local deployment yet — creating one and selecting it.");
  const created = convexSync(["deployment", "create", "local", "--select"]);
  if (created.status !== 0) {
    process.exit(created.status ?? 1);
  }
} else if (selected.stdout) {
  process.stdout.write(selected.stdout);
}
if (selected.stderr) {
  process.stderr.write(selected.stderr);
}

const child = spawn(
  convexBin,
  ["dev", "--start", "node scripts/start-local-frontend.mjs"],
  { cwd: root, stdio: "inherit" },
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
