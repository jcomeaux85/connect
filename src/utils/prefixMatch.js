/** Match the start of a word, including a one-letter query. "o" hits Orbital, not Lazer. */
export function wordStartsWith(value, query) {
  const q = (query || "").trim().toLowerCase();
  if (!q) return true;
  if (!value) return false;
  return String(value)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .some((word) => word.startsWith(q));
}

/** Title that starts with the query ranks ahead of a later word that starts with it. */
export function prefixRank(value, query) {
  const q = (query || "").trim().toLowerCase();
  if (!q) return 0;
  const v = String(value || "").toLowerCase();
  if (v.startsWith(q)) return 0;
  return 1;
}
