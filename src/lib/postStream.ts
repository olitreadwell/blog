import { getCollection, type CollectionEntry } from "astro:content";

import { buildEntrySitePath } from "./entrySitePath";
import { splitEntryDateParts } from "./formatEntryDate";
import { postCollectionNames, type PostCollectionName } from "./postCollection";

export { postCollectionNames };
export type { PostCollectionName };

/** Every entry kind the blog publishes. */
export type PostEntry =
  | CollectionEntry<"posts">
  | CollectionEntry<"notes">
  | CollectionEntry<"links">
  | CollectionEntry<"photos">;

/**
 * Loads every entry, newest first. Drafts are dropped from production builds
 * and kept in development so unfinished work stays visible while writing.
 */
export async function loadPublishedStream(): Promise<PostEntry[]> {
  const [posts, notes, links, photos] = await Promise.all([
    getCollection("posts"),
    getCollection("notes"),
    getCollection("links"),
    getCollection("photos"),
  ]);

  const entries: PostEntry[] = [...posts, ...notes, ...links, ...photos];
  const visible = import.meta.env.PROD
    ? entries.filter((entry) => !entry.data.draft)
    : entries;

  return visible.sort((left, right) => {
    const byDate = right.data.date.getTime() - left.data.date.getTime();
    return byDate !== 0 ? byDate : left.id.localeCompare(right.id);
  });
}

/** The route params for one entry, with the date split into path segments. */
export function buildEntryRouteParams(entry: {
  collection: string;
  id: string;
  data: { date: Date };
}): { kind: string; year: string; month: string; day: string; slug: string } {
  const { year, month, day } = splitEntryDateParts(entry.data.date);
  return { kind: entry.collection, year, month, day, slug: entry.id };
}

/**
 * Builds the site path for an entry, for example
 * `/posts/2018/06/08/conde-nast-paywall-e2e/`.
 */
export function buildEntryPath(entry: {
  collection: string;
  id: string;
  data: { date: Date };
}): string {
  return buildEntrySitePath(
    { directory: entry.collection, id: entry.id, date: entry.data.date },
    import.meta.env.BASE_URL,
  );
}
