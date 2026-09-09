import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import type { DataModel } from "./_generated/dataModel";

/**
 * Convex Auth setup for email + password.
 *
 * `convexAuth` returns HTTP helpers plus public Convex functions:
 * - {@link signIn} / {@link signOut} — called from the React client
 * - {@link auth} — attaches HTTP routes in `http.ts`
 * - {@link store} / {@link isAuthenticated} — used internally by the library
 *
 * The Password `profile` callback maps form fields onto the `users` document.
 * It runs for every auth flow (`signUp`, `signIn`, …).
 */
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password<DataModel>({
      /**
       * Build the `users` document fields from the sign-in form.
       *
       * On **sign up**, requires a display `name` in addition to `email`.
       * On **sign in**, only `email` is returned (the existing user is loaded).
       *
       * @param params Form fields from `signIn("password", formData)` plus `flow`.
       * @returns Fields written onto the Convex Auth `users` document.
       * @throws {ConvexError} If sign-up is missing a display name.
       */
      profile(params) {
        const email = params.email as string;
        if (params.flow === "signUp") {
          const name = typeof params.name === "string" ? params.name.trim() : "";
          if (!name) {
            throw new ConvexError("Display name is required.");
          }
          return { email, name };
        }
        return { email };
      },
    }),
  ],
});
