import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";
import { defineConfig, type ProxyOptions } from "vite";

const DEV_PORT = 5173;

/**
 * Parse a dotenv file into key/value pairs (no process.env overlay).
 *
 * Vite's `loadEnv` prefers already-set `process.env`, which can still hold
 * cloud Convex URLs when `convex dev --start` launches this config. The
 * proxy must follow `.env.local` (the selected deployment) instead.
 */
function readEnvFile(path: string): Record<string, string> {
  if (!existsSync(path)) {
    return {};
  }
  const parsed: Record<string, string> = {};
  for (const raw of readFileSync(path, "utf8").split(/\r?\n/u)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }
    const eq = line.indexOf("=");
    if (eq <= 0) {
      continue;
    }
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    parsed[key] = value;
  }
  return parsed;
}

/**
 * HTTP-actions origin that pairs with a Convex cloud / local URL.
 *
 * Cloud: `*.convex.cloud` → `*.convex.site`.
 * Local CLI: port `3210` (sync API) → `3211` (HTTP actions / Auth routes).
 */
function deriveConvexSiteUrl(cloudUrl: string): string {
  const url = new URL(cloudUrl);
  if (url.hostname.endsWith(".convex.cloud")) {
    url.hostname = url.hostname.replace(/\.convex\.cloud$/u, ".convex.site");
    return url.origin;
  }
  if (url.port) {
    url.port = String(Number(url.port) + 1);
    return url.origin;
  }
  return url.origin;
}

/**
 * Same-origin Vite proxies so the browser only uses {@link DEV_PORT}.
 *
 * `/api` (WebSocket + HTTP client) goes to the Convex deployment URL.
 * Auth HTTP routes live on the site origin (`/api/auth`, `/.well-known`).
 */
function convexDevProxy(
  cloudUrl: string | undefined,
  siteUrl: string | undefined,
): Record<string, ProxyOptions> {
  if (!cloudUrl) {
    return {};
  }
  const site = siteUrl ?? deriveConvexSiteUrl(cloudUrl);
  return {
    "/api/auth": {
      target: site,
      changeOrigin: true,
    },
    "/.well-known": {
      target: site,
      changeOrigin: true,
    },
    "/api": {
      target: cloudUrl,
      changeOrigin: true,
      ws: true,
      rewriteWsOrigin: true,
    },
  };
}

export default defineConfig(() => {
  const env = {
    ...readEnvFile(fileURLToPath(new URL("./.env", import.meta.url))),
    ...readEnvFile(fileURLToPath(new URL("./.env.local", import.meta.url))),
  };
  const convexUrl = env.VITE_CONVEX_URL;
  const convexSiteUrl = env.VITE_CONVEX_SITE_URL;

  if (convexUrl) {
    console.info(`[vite] proxy /api → ${convexUrl}`);
    console.info(
      `[vite] proxy Auth HTTP → ${convexSiteUrl ?? deriveConvexSiteUrl(convexUrl)}`,
    );
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    server: {
      port: DEV_PORT,
      strictPort: true,
      proxy: convexDevProxy(convexUrl, convexSiteUrl),
    },
  };
});
