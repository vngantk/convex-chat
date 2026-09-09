import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation, mutation, query } from "./_generated/server";
import { requireUserId } from "./lib/auth";

/** How long a typing row stays valid before {@link clearIfStale} may delete it. */
const TYPING_TTL_MS = 3000;

/**
 * Who is currently typing in a channel (including the viewer).
 *
 * The client filters out the current user. Returning everyone keeps this
 * query **room-scoped** so clients in the same channel share the Convex cache.
 *
 * @param args.channelId Channel to inspect.
 * @returns `{ userId, name }` for each typing row, or `[]` if signed out.
 */
export const list = query({
  args: { channelId: v.id("channels") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return [];
    }
    const typing = await ctx.db
      .query("typing")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .collect();

    return await Promise.all(
      typing.map(async (entry) => {
        const user = await ctx.db.get(entry.userId);
        return {
          userId: entry.userId,
          name: user?.name ?? "Someone",
        };
      }),
    );
  },
});

/**
 * Record that the current user is typing in a channel.
 *
 * Upserts one `typing` document, then schedules {@link clearIfStale} in 3s.
 * If the user types again, `updatedAt` changes and the old scheduled job
 * becomes a no-op (it only deletes when `updatedAt` still matches).
 *
 * @param args.channelId Channel the user is typing in.
 */
export const upsert = mutation({
  args: { channelId: v.id("channels") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const existing = await ctx.db
      .query("typing")
      .withIndex("by_channel_and_user", (q) =>
        q.eq("channelId", args.channelId).eq("userId", userId),
      )
      .unique();
    const updatedAt = Date.now();
    const typingId = existing
      ? existing._id
      : await ctx.db.insert("typing", {
          channelId: args.channelId,
          userId,
          updatedAt,
        });
    if (existing) {
      await ctx.db.patch(existing._id, { updatedAt });
    }
    await ctx.scheduler.runAfter(TYPING_TTL_MS, internal.typing.clearIfStale, {
      typingId,
      updatedAt,
    });
  },
});

/**
 * Remove the current user's typing row immediately (send, blur, unmount).
 *
 * @param args.channelId Channel to clear typing in.
 */
export const clear = mutation({
  args: { channelId: v.id("channels") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const existing = await ctx.db
      .query("typing")
      .withIndex("by_channel_and_user", (q) =>
        q.eq("channelId", args.channelId).eq("userId", userId),
      )
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

/**
 * Delete a typing row only if it was not refreshed since it was scheduled.
 *
 * An **internalMutation**: not in the public `api`, only callable from
 * `ctx.scheduler` (or other Convex functions). This is why the indicator
 * disappears without the client polling — the write invalidates {@link list}.
 *
 * @param args.typingId Row to maybe delete.
 * @param args.updatedAt Snapshot of `updatedAt` when the job was scheduled.
 */
export const clearIfStale = internalMutation({
  args: {
    typingId: v.id("typing"),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.typingId);
    if (entry && entry.updatedAt === args.updatedAt) {
      await ctx.db.delete(args.typingId);
    }
  },
});
