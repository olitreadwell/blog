import { getCollection, type CollectionEntry } from "astro:content";

/** Collection names, in the order the site lists them. */
export const postCollectionNames = ["posts", "notes", "links", "photos"] as const;

export type PostCollectionName = (typeof postCollectionNames)[number];

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

/** Builds the site path for an entry, for example `/posts/hello-blog/`. */
export function buildEntryPath(entry: { collection: string; id: string }): string {
  const base = import.meta.env.BASE_URL.replace(/\/+$/, "");
  return `${base}/${entry.collection}/${entry.id}/`;
}
