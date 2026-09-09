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

You need Node 20+ and a [Convex](https://dashboard.convex.dev) account (sign in with GitHub).

```bash
npm install
npm run dev
```

The first `convex dev` run will log you in, create a deployment, and write `VITE_CONVEX_URL` to `.env.local`. Then:

1. Open http://localhost:5173
2. Sign up with email, password (8+ characters), and a display name
3. Duplicate the tab (or use a private window) and sign up as a second user
4. Send messages, create a channel, and watch presence + typing

## Scripts

- `npm run dev` — Vite frontend + `convex dev` together
- `npm run dev:frontend` / `npm run dev:backend` — each process on its own
- `npm run build` — production frontend build
