import { defineApp } from "convex/server";
import presence from "@convex-dev/presence/convex.config";

/**
 * Convex app config: registers reusable **components**.
 *
 * Components are packages that ship their own tables and functions, isolated
 * from your app schema. `@convex-dev/presence` owns heartbeat / room membership
 * so this chat app does not store presence rows in `schema.ts`.
 *
 * @see https://www.convex.dev/components
 */
const app = defineApp();
app.use(presence);

export default app;
