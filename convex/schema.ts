import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

/**
 * Convex document schema for this chat app.
 *
 * This is **not** a SQL schema. Tables are collections of JSON-like documents.
 * Indexes (`by_name`, `by_channel`, …) are Convex indexes used by `.withIndex()`
 * in queries — they are how you avoid full-table scans.
 *
 * `authTables` comes from Convex Auth and includes `users`, sessions, accounts,
 * and related auth documents. Spreading it in is required for password login.
 *
 * @see https://docs.convex.dev/database/schemas
 */
export default defineSchema({
  ...authTables,

  /**
   * Chat rooms (Slack-style channels).
   *
   * @property {string} name Unique slug such as `"general"` (normalized lowercase).
   * @property {import("./_generated/dataModel").Id<"users">} createdBy User who first created the channel.
   */
  channels: defineTable({
    name: v.string(),
    createdBy: v.id("users"),
  }).index("by_name", ["name"]),

  /**
   * Chat messages belonging to a single channel.
   *
   * @property {import("./_generated/dataModel").Id<"channels">} channelId Parent channel.
   * @property {import("./_generated/dataModel").Id<"users">} authorId User who sent the message.
   * @property {string} body Message text (trimmed, max 2000 chars at write time).
   */
  messages: defineTable({
    channelId: v.id("channels"),
    authorId: v.id("users"),
    body: v.string(),
  }).index("by_channel", ["channelId"]),

  /**
   * Ephemeral "is typing" rows. One document per (channel, user).
   *
   * A scheduled mutation deletes a row if `updatedAt` has not changed for 3s,
   * so subscribed clients drop the indicator without polling.
   *
   * @property {import("./_generated/dataModel").Id<"channels">} channelId Channel being typed in.
   * @property {import("./_generated/dataModel").Id<"users">} userId User who is typing.
   * @property {number} updatedAt Unix ms of the last keystroke upsert.
   */
  typing: defineTable({
    channelId: v.id("channels"),
    userId: v.id("users"),
    updatedAt: v.number(),
  })
    .index("by_channel", ["channelId"])
    .index("by_channel_and_user", ["channelId", "userId"]),
});
