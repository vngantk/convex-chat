import { httpRouter } from "convex/server";
import { auth } from "./auth";

/**
 * HTTP router for this Convex deployment.
 *
 * Convex Auth registers its OAuth/callback routes here via {@link auth.addHttpRoutes}.
 * Password auth does not need extra HTTP handlers beyond that.
 */
const http = httpRouter();

auth.addHttpRoutes(http);

export default http;
