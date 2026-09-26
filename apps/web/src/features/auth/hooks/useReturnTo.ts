"use client";

import { useSearchParams } from "next/navigation";
import { RETURN_TO_PARAM, sanitizeReturnTo } from "@/lib/utils/returnTo";

/**
 * Where to go after a successful sign-in: the page that sent the visitor to /login
 * (the proxy passes it as `?returnTo=`), or the dashboard.
 */
export function useReturnTo(): string {
  const searchParams = useSearchParams();
  return sanitizeReturnTo(searchParams.get(RETURN_TO_PARAM)) ?? "/dashboard";
}
