# Convex Chat

A small Slack-style demo of an **idiomatic Convex** fullstack app: Vite + React, Convex Auth (password), Tailwind + shadcn/ui, and the official Presence component.

**Porting or reading as another agent:** start at [docs/PRODUCT.md](docs/PRODUCT.md) (behavior to match) and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) (how this repo is built). Index: [docs/README.md](docs/README.md).

Open two browser windows, sign in as two users, and watch messages, typing, and who’s-online update without any extra websocket code.

## What Convex is doing

| Concept | Where to look |
| --- | --- |
| Schema + indexes | [`convex/schema.ts`](convex/schema.ts) |
| Password auth + user `name` | [`convex/auth.ts`](convex/auth.ts) |
| Queries (live subscriptions) | `list` functions in `convex/channels.ts`, `messages.ts`, `typing.ts` |
| Mutations (transactions) | `send`, `create`, `ensureGeneral` |
| Authz | [`convex/lib/auth.ts`](convex/lib/auth.ts) (`getAuthUserId`) |
| Generated typed API | `api.messages.list` from `convex/_generated/api` |
| Convex component | [`convex/presence.ts`](convex/presence.ts) + [`convex/convex.config.ts`](convex/convex.config.ts) |
| Scheduler | `typing.clearIfStale` expires typing indicators |

`useQuery` is a **subscription**. When a mutation writes documents a query read, Convex reruns that query and every client updates. You do not set up websockets, cache invalidation, or REST routes for this.

**Actions** (for calling external HTTP APIs) are intentionally not used here. Reach for an action when a mutation would need `fetch`, a third-party SDK, or anything that is not a database transaction.

## Run it

You need Node 20+. A [Convex](https://dashboard.convex.dev) account (GitHub sign-in) is only required for the **cloud** backend.

The browser always uses **http://localhost:5173**. Vite proxies `/api` (and Auth HTTP routes) to Convex, so you do not open the backend ports.

**Local backend** (no cloud quota; data in `.convex/`):

```bash
npm install
npm run dev:local
```

The first run creates a local CLI deployment, writes `VITE_CONVEX_URL` to `.env.local`, and generates Convex Auth JWT keys if they are missing.

**Cloud backend** (needs a Convex account):

```bash
npx convex deployment select dev
npm run dev
```

Then:

1. Open http://localhost:5173
2. Sign up with email, password (8+ characters), and a display name
3. Duplicate the tab (or use a private window) and sign up as a second user
4. Send messages, create a channel, and watch presence + typing

Switch back and forth with `npx convex deployment select local` or `npx convex deployment select dev`. Local deployments are a Convex beta, for development only.

## Scripts

- `npm run dev:local` — local Convex backend + Vite on port 5173
- `npm run dev` — Vite frontend + `convex dev` (currently selected deployment)
- `npm run dev:frontend` / `npm run dev:backend` — each process on its own
- `npm run build` — production frontend build
