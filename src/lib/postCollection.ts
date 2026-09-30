/**
 * Collection names, in the order the site lists them.
 *
 * This module imports nothing, so both the Astro build (`postStream.ts`) and
 * the MCP server (`postFileStore.ts`) can share one list. `postStream.ts`
 * re-exports these names to keep its existing callers working.
 */
export const postCollectionNames = ["posts", "notes", "links", "photos"] as const;

export type PostCollectionName = (typeof postCollectionNames)[number];
