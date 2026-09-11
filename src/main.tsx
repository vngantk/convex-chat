import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

/**
 * WebSocket URL of this project's Convex deployment.
 *
 * Written to `.env.local` by `npx convex dev` as `VITE_CONVEX_URL`.
 * In Vite dev the client uses this origin instead: `vite.config.ts` proxies
 * `/api` (and Auth HTTP routes) to the real deployment so the browser only
 * needs http://localhost:5173.
 */
const configuredUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;
const convexUrl =
  import.meta.env.DEV && configuredUrl ? window.location.origin : configuredUrl;

/**
 * Browser client that talks to Convex over a WebSocket.
 *
 * `useQuery` / `useMutation` inside {@link ConvexAuthProvider} use this client.
 * `null` when the env var is missing (first clone before `convex dev`).
 */
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {convex ? (
      <ConvexAuthProvider client={convex}>
        <App />
      </ConvexAuthProvider>
    ) : (
      <div className="flex min-h-svh items-center justify-center p-6 text-center text-sm text-muted-foreground">
        Missing <code className="rounded bg-muted px-1">VITE_CONVEX_URL</code>.
        Run <code className="rounded bg-muted px-1">npm run dev:local</code> or{" "}
        <code className="rounded bg-muted px-1">npm run dev</code> so Convex
        can write it to <code className="rounded bg-muted px-1">.env.local</code>.
      </div>
    )}
  </StrictMode>,
);
