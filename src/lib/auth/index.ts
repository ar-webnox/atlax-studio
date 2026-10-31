import type { Role } from "../rbac";

/**
 * Authentication seam.
 *
 * Today the app uses `demoSessionSource` (browser-only, no credentials). To go live, implement
 * `SessionSource` with a real provider (Auth.js, Clerk, Cognito, your own OIDC) and:
 *   1. Resolve the session on the server (middleware / server components) and pass it down.
 *   2. Call `authorize(session.role, permission)` from the lib/rbac module inside every route
 *      handler or server action that reads or writes data. Never rely on hidden UI for security.
 *   3. Store roles and permission overrides in your database, not localStorage.
 */
export type Session = { userId: string; name: string; email: string; role: Role; mode: "demo" | "authenticated" };

export interface SessionSource {
  readonly mode: Session["mode"];
  getSession(): Promise<Session | null>;
}

export const AUTH_MODE: Session["mode"] = "demo";
