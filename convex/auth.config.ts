/**
 * Convex Auth JWT issuer config.
 *
 * Convex Auth mints tokens whose `iss` (issuer) is `CONVEX_SITE_URL`
 * (your deployment's HTTP actions origin, e.g. `https://….convex.site`).
 * This file tells Convex to trust those tokens.
 *
 * `CONVEX_SITE_URL` is set automatically on cloud deployments.
 *
 * @see https://labs.convex.dev/auth/setup/manual
 */
export default {
  providers: [
    {
      domain: process.env.CONVEX_SITE_URL,
      applicationID: "convex",
    },
  ],
};
