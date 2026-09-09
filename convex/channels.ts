import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUserId } from "./lib/auth";

/** Default room created on first login. Kept first in {@link list}. */
const GENERAL_CHANNEL = "general";

/**
 * Normalize a channel name into a URL-safe slug.
 *
 * @param name Raw input from the create-channel form.
 * @returns Lowercase slug with spaces turned into hyphens.
 */
function normalizeChannelName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, "-");
}

/**
 * All channels, with `general` first then alphabetical.
 *
 * A **query**: the sidebar subscribes with `useQuery`. Creating a channel
 * inserts a document, this query reruns, and every signed-in client updates.
 *
 * @returns Channel documents, or `[]` if the caller is not signed in.
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return [];
    }
    const channels = await ctx.db.query("channels").collect();
    return channels.sort((a, b) => {
      if (a.name === GENERAL_CHANNEL) return -1;
      if (b.name === GENERAL_CHANNEL) return 1;
      return a.name.localeCompare(b.name);
    });
  },
});

/**
 * Create the `general` channel if it does not exist yet.
 *
 * A **mutation** (transaction): called once when the chat UI mounts.
 * Uses the `by_name` index instead of scanning the table.
 *
 * @returns The existing or newly inserted channel id.
 */
export const ensureGeneral = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const existing = await ctx.db
      .query("channels")
      .withIndex("by_name", (q) => q.eq("name", GENERAL_CHANNEL))
      .first();
    if (existing) {
      return existing._id;
    }
    return await ctx.db.insert("channels", {
      name: GENERAL_CHANNEL,
      createdBy: userId,
    });
  },
});

/**
 * Create a channel, or return the existing one with the same slug.
 *
 * @param args.name Display name; normalized to `[a-z0-9-]`, 1–32 characters.
 * @returns The channel id.
 * @throws If the name is empty, too long, or has invalid characters.
 */
export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const name = normalizeChannelName(args.name);
    if (!name || name.length > 32) {
      throw new Error("Channel names must be 1–32 characters.");
    }
    if (!/^[a-z0-9-]+$/.test(name)) {
      throw new Error("Use letters, numbers, and hyphens only.");
    }
    const existing = await ctx.db
      .query("channels")
      .withIndex("by_name", (q) => q.eq("name", name))
      .first();
    if (existing) {
      return existing._id;
    }
    return await ctx.db.insert("channels", {
      name,
      createdBy: userId,
    });
  },
});
