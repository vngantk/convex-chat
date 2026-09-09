import { getAuthUserId } from "@convex-dev/auth/server";
import { Presence } from "@convex-dev/presence";
import { v } from "convex/values";
import { components } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

/**
 * Handle for the `@convex-dev/presence` component.
 *
 * Presence rows live in the component's tables, not in `schema.ts`.
 * The React hook `usePresence(api.presence, roomId, userId)` calls
 * {@link heartbeat}, {@link list}, and {@link disconnect} for you.
 */
export const presence = new Presence(components.presence);

/**
 * Tell the presence component this tab is still in the room.
 *
 * Called on an interval by `usePresence`. `userId` must match the
 * authenticated user so one client cannot heartbeat as another.
 *
 * @param args.roomId Channel id (string; presence rooms are not typed as `Id`s).
 * @param args.userId Authenticated `users` id.
 * @param args.sessionId Opaque tab/session id from the client hook.
 * @param args.interval Heartbeat interval in ms (from the hook).
 */
export const heartbeat = mutation({
  args: {
    roomId: v.string(),
    userId: v.string(),
    sessionId: v.string(),
    interval: v.number(),
  },
  handler: async (ctx, { roomId, userId, sessionId, interval }) => {
    const authUserId = await getAuthUserId(ctx);
    if (authUserId === null || authUserId !== userId) {
      throw new Error("Unauthorized");
    }
    return await presence.heartbeat(ctx, roomId, userId, sessionId, interval);
  },
});

/**
 * Who is in a room, with `name` / `image` joined from `users`.
 *
 * Args are only `roomToken` (no viewer id) so every client in the same
 * room shares one cached query result. Heartbeats do **not** rerun this
 * for every tick — the component only notifies on join/leave.
 *
 * @param args.roomToken Opaque token from the presence component (not the channel id).
 * @returns Presence entries plus optional `name` and `image`.
 */
export const list = query({
  args: { roomToken: v.string() },
  handler: async (ctx, { roomToken }) => {
    const presenceList = await presence.list(ctx, roomToken);
    return await Promise.all(
      presenceList.map(async (entry) => {
        const user = await ctx.db.get(entry.userId as Id<"users">);
        if (!user) {
          return entry;
        }
        return {
          ...entry,
          name: user.name,
          image: user.image,
        };
      }),
    );
  },
});

/**
 * Mark a tab as gone. Invoked via `navigator.sendBeacon` on close.
 *
 * Auth is intentionally skipped: sendBeacon cannot attach the Convex JWT
 * the same way `useMutation` does.
 *
 * @param args.sessionToken Token issued by {@link heartbeat}.
 */
export const disconnect = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    return await presence.disconnect(ctx, sessionToken);
  },
});
