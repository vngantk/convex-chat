import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

/**
 * WebSocket URL of this project's Convex deployment.
 * Written to `.env.local` by `npx convex dev` as `VITE_CONVEX_URL`.
 */
const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;

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
        Run <code className="rounded bg-muted px-1">npm run dev</code> so Convex
        can write it to <code className="rounded bg-muted px-1">.env.local</code>.
      </div>
    )}
  </StrictMode>,
);
