#!/usr/bin/env node
/**
 * Frontend process started by `convex dev --start`.
 *
 * The local backend is already running at this point, so we can set Auth
 * env vars, then bind Vite on :5173 (the only port the browser should use).
 */
import { spawn } from "node:child_process";
import { ensureLocalAuthEnv } from "./ensure-local-auth-env.mjs";

ensureLocalAuthEnv();

const vite = spawn("npx", ["vite"], {
  stdio: "inherit",
  env: process.env,
});

vite.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
