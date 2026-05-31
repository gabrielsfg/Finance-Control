import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeStr(s: string): string {
  return s.normalize("NFD").replace(/\p{Mn}/gu, "").toLowerCase();
}

export function includesNormalized(text: string, query: string): boolean {
  return normalizeStr(text).includes(normalizeStr(query));
}
