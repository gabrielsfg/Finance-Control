/**
 * The message a failed assistant/MCP request should show. Handles both the `{ error }`
 * body the services return and ASP.NET's validation problem details.
 */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: unknown } })?.response?.data;
  if (data && typeof data === "object") {
    const { error, errors } = data as { error?: unknown; errors?: Record<string, unknown> };
    if (typeof error === "string" && error.trim()) return error;
    if (errors && typeof errors === "object") {
      const first = Object.values(errors).flat().find((m) => typeof m === "string");
      if (typeof first === "string") return first;
    }
  }
  return fallback;
}
