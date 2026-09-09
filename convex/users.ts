import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "./_generated/server";

/**
 * The signed-in user document, or `null` if anonymous.
 *
 * A **query**: `useQuery(api.users.viewer)` stays live. When the session
 * changes (sign in / sign out), this reruns and the React tree updates.
 *
 * @returns The `users` document (`name`, `email`, `_id`, …) or `null`.
 */
export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }
    return await ctx.db.get(userId);
  },
});
