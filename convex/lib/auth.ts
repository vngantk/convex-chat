import { getAuthUserId } from "@convex-dev/auth/server";
import type { MutationCtx, QueryCtx } from "../_generated/server";

/**
 * Require a signed-in Convex Auth user, or throw.
 *
 * Use this in **mutations** (and queries that should fail closed). Prefer
 * returning `[]` / `null` from public list queries so signed-out clients
 * do not error.
 *
 * @param ctx Query or mutation context from a Convex function.
 * @returns The `users` document id for the current session.
 * @throws If there is no authenticated user.
 */
export async function requireUserId(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new Error("Not authenticated");
  }
  return userId;
}
