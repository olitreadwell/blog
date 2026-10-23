import type { PostFileEntry } from "./postFileStore";

/** One search hit: the entry, where it matched, and a readable snippet. */
export interface PostSearchMatch {
  entry: PostFileEntry;
  matchedIn: string[];
  snippet: string;
}

const snippetRadius = 120;

const fieldWeights = {
  title: 4,
  tag: 3,
  summary: 2,
  body: 1,
} as const;

/**
 * Searches titles, summaries, tags and bodies, case-insensitively.
 *
 * A title hit outranks a tag hit, which outranks a summary hit, which outranks
 * a body hit. Ties fall back to the order the caller supplied, which is newest
 * first, so recent writing surfaces above older writing of equal relevance.
 */
export function searchPostFileEntries(
  entries: PostFileEntry[],
  query: string,
  limit = 20,
): PostSearchMatch[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];

  const matches: { match: PostSearchMatch; score: number }[] = [];

  for (const entry of entries) {
    const matchedIn: string[] = [];
    let score = 0;

    if (entry.title?.toLowerCase().includes(needle)) {
      matchedIn.push("title");
      score += fieldWeights.title;
    }

    if (entry.tags.some((tag) => tag.toLowerCase().includes(needle))) {
      matchedIn.push("tags");
      score += fieldWeights.tag;
    }

    if (entry.summary?.toLowerCase().includes(needle)) {
      matchedIn.push("summary");
      score += fieldWeights.summary;
    }

    const bodyHit = findFirstMatch(entry.body, needle);
    if (bodyHit >= 0) {
      matchedIn.push("body");
      score += fieldWeights.body;
    }

    if (score === 0) continue;

    matches.push({
      match: { entry, matchedIn, snippet: buildSnippet(entry, needle, bodyHit) },
      score,
    });
  }

  return matches
    .sort((left, right) => right.score - left.score)
    .slice(0, Math.max(0, limit))
    .map((ranked) => ranked.match);
}

function findFirstMatch(haystack: string, needle: string): number {
  return haystack.toLowerCase().indexOf(needle);
}

/** Shows the matched line from the body, or the summary when the body misses. */
function buildSnippet(entry: PostFileEntry, needle: string, bodyHit: number): string {
  if (bodyHit < 0) return entry.summary ?? entry.title ?? "";

  const start = Math.max(0, bodyHit - snippetRadius);
  const end = Math.min(entry.body.length, bodyHit + needle.length + snippetRadius);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < entry.body.length ? "..." : "";

  return `${prefix}${entry.body.slice(start, end).replace(/\s+/g, " ").trim()}${suffix}`;
}
