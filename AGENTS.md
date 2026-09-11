# Agent context — convex-chat

Learning demo of an **idiomatic Convex** fullstack chat app (not a production Slack clone). Prefer extending existing patterns over introducing a second backend or router.

Full product + architecture for a **same-app, different-stack** rewrite: [docs/PRODUCT.md](docs/PRODUCT.md) and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Stack

- Vite + React 19 + TypeScript
- Convex (schema, queries, mutations, scheduler) on **Convex Cloud** or a **local CLI** deployment (`npm run dev:local`)
- Convex Auth: Password provider (email + password + display `name` on sign-up)
- Tailwind v4 + shadcn/ui (`src/components/ui/`)
- `@convex-dev/presence` component (not a custom presence table)

Frontend is local (`http://localhost:5173`). Vite proxies `/api` to Convex so the browser uses one port. `npm run dev` uses the currently selected deployment (cloud by default). `npm run dev:local` selects a local CLI backend. `VITE_CONVEX_URL` lives in `.env.local` (gitignored). Never commit `.env.local`, JWT keys, or `.convex/`.

Repo remote: Cursor-hosted `vincent-ngan/convex-chat`.

## Mental model

Convex is a document-relational database. App tables (`channels`, `messages`, `typing`) are **not** SQL tables you can query with `psql`. Persistence under Cloud/self-host is opaque. Access data via Convex functions, the dashboard, or `npx convex data`.

- **Query** = live subscription (`useQuery`). Reruns when documents it read change.
- **Mutation** = transaction. All-or-nothing writes.
- **Action** = external I/O. **Do not add actions** unless the feature needs `fetch` or a third-party SDK.
- **Component** = isolated package with its own tables (`presence` in `convex/convex.config.ts`).

## Layout

| Path | Role |
| --- | --- |
| `convex/schema.ts` | `authTables` + `channels` / `messages` / `typing` + indexes |
| `convex/auth.ts` | Password provider; `profile` writes `name` on sign-up |
| `convex/lib/auth.ts` | `requireUserId` for mutations |
| `convex/channels.ts`, `messages.ts`, `typing.ts`, `users.ts`, `presence.ts` | One domain per file |
| `src/App.tsx` | Auth gate (`Authenticated` / `Unauthenticated`) |
| `src/components/` | Chat UI; selected channel is React state (no router) |

Keep JSDoc on public functions, table shapes, and component props when you add or change them.

## Out of scope (unless the user asks)

DMs, file uploads, unread badges, password-reset email, Next.js, pagination beyond `take(50)`.

Local CLI deployments (`npm run dev:local`) are **beta / dev-only**. Self-hosted Convex (Docker + optional Postgres) is a **production-on-your-infra** option, separate from this Cloud demo.
