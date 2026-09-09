import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUserId } from "./lib/auth";

/**
 * A message document plus the author's display name.
 *
 * Convex has no SQL joins. This type is built in {@link list} by reading
 * each `authorId` from the `users` table.
 *
 * @typedef {object} MessageWithAuthor
 * @property {import("./_generated/dataModel").Id<"messages">} _id
 * @property {import("./_generated/dataModel").Id<"channels">} channelId
 * @property {import("./_generated/dataModel").Id<"users">} authorId
 * @property {string} body
 * @property {string} authorName Fallback `"Unknown"` if the user was deleted.
 */

/**
 * Latest messages in a channel (up to 50), oldest first.
 *
 * A **query**: `useQuery(api.messages.list, { channelId })` is a live
 * subscription. Inserts/deletes in this channel rerun the query for every
 * subscribed client.
 *
 * @param args.channelId Channel whose thread to load.
 * @returns {@link MessageWithAuthor}[] or `[]` if signed out.
 */
export const list = query({
  args: { channelId: v.id("channels") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return [];
    }
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .order("desc")
      .take(50);

    return await Promise.all(
      messages.reverse().map(async (message) => {
        const author = await ctx.db.get(message.authorId);
        return {
          ...message,
          authorName: author?.name ?? "Unknown",
        };
      }),
    );
  },
});

/**
 * Insert a message into a channel.
 *
 * A **mutation**: the whole handler is one database transaction. If anything
 * throws, nothing is written.
 *
 * @param args.channelId Destination channel.
 * @param args.body Message text (trimmed; must be 1–2000 characters).
 * @throws If empty, too long, or the channel does not exist.
 */
export const send = mutation({
  args: {
    channelId: v.id("channels"),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const body = args.body.trim();
    if (!body) {
      throw new Error("Message cannot be empty.");
    }
    if (body.length > 2000) {
      throw new Error("Message is too long.");
    }
    const channel = await ctx.db.get(args.channelId);
    if (!channel) {
      throw new Error("Channel not found.");
    }
    await ctx.db.insert("messages", {
      channelId: args.channelId,
      authorId: userId,
      body,
    });
  },
});

/**
 * Delete a message, but only if the caller is the author.
 *
 * @param args.messageId Message to remove.
 * @throws If the message exists and belongs to someone else.
 */
export const removeOwn = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const message = await ctx.db.get(args.messageId);
    if (!message) {
      return;
    }
    if (message.authorId !== userId) {
      throw new Error("You can only delete your own messages.");
    }
    await ctx.db.delete(args.messageId);
  },
});
