/** Query parameter /login reads to send the user back where they were headed. */
export const RETURN_TO_PARAM = "returnTo";

/**
 * Accepts only a path on this origin. Anything else — an absolute URL, a
 * protocol-relative `//host`, a backslash trick — would turn the login page into an
 * open redirect, so it is dropped and the caller falls back to the dashboard.
 */
export function sanitizeReturnTo(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null;
  if (value === "/login" || value.startsWith("/login?")) return null;
  return value;
}

/** `/login?returnTo=<path>` for the given path (and query). */
export function loginUrlReturningTo(pathWithQuery: string): string {
  return `/login?${RETURN_TO_PARAM}=${encodeURIComponent(pathWithQuery)}`;
}
