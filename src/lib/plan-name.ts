const MAX_NAME_LENGTH = 60;

/** Collapses whitespace and caps the length so a plan name stays label-sized. */
export function cleanName(raw: unknown, fallback = "Untitled plan"): string {
  if (typeof raw !== "string") return fallback;
  const trimmed = raw.trim().replace(/\s+/g, " ").slice(0, MAX_NAME_LENGTH);
  return trimmed || fallback;
}
