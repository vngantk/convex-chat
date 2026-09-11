#!/usr/bin/env node
/**
 * Ensure the currently selected Convex deployment has Convex Auth JWT keys.
 *
 * Local CLI deployments do not inherit `JWT_PRIVATE_KEY` / `JWKS` from the
 * cloud project. Password sign-in fails until they exist. Idempotent: skips
 * generation when `JWT_PRIVATE_KEY` is already set.
 *
 * Run after the local backend is up (`convex dev --start` is the right hook).
 */
import { generateKeyPairSync } from "node:crypto";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const convexBin = join(fileURLToPath(new URL("..", import.meta.url)), "node_modules/.bin/convex");

/**
 * @param {string} name
 * @returns {string}
 */
function envGet(name) {
  const result = spawnSync(convexBin, ["env", "get", name], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    return "";
  }
  return (result.stdout ?? "").trim();
}

/**
 * @param {string} name
 * @param {string} value
 */
function envSet(name, value) {
  const result = spawnSync(convexBin, ["env", "set", name], {
    input: value,
    encoding: "utf8",
    stdio: ["pipe", "inherit", "inherit"],
  });
  if (result.status !== 0) {
    throw new Error(`Failed to set ${name} on the local deployment.`);
  }
}

function generateAuthKeys() {
  const { publicKey, privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
  });
  const jwtPrivateKey = privateKey
    .export({ type: "pkcs8", format: "pem" })
    .toString()
    .trimEnd()
    .replaceAll("\n", " ");
  const jwk = publicKey.export({ format: "jwk" });
  const jwks = JSON.stringify({ keys: [{ use: "sig", ...jwk }] });
  return { jwtPrivateKey, jwks };
}

export function ensureLocalAuthEnv() {
  if (envGet("JWT_PRIVATE_KEY")) {
    console.log("Local Convex Auth JWT keys are already set.");
    return;
  }

  console.log("Generating Convex Auth JWT keys for the local deployment…");
  const { jwtPrivateKey, jwks } = generateAuthKeys();
  envSet("JWT_PRIVATE_KEY", jwtPrivateKey);
  envSet("JWKS", jwks);

  if (!envGet("SITE_URL")) {
    envSet("SITE_URL", "http://localhost:5173");
  }
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);
if (isDirectRun) {
  ensureLocalAuthEnv();
}
