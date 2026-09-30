import { z } from "astro/zod";

import type { PostCollectionName } from "./postCollection";

/** The four shapes a blog entry can take. */
export const postKindSchema = z.enum(["post", "link", "photo", "note"]);

export type PostKind = z.infer<typeof postKindSchema>;

/**
 * Fields every entry carries, whatever its kind. Long posts need a title,
 * notes do not, so `title` stays optional here and each collection tightens it.
 */
export const postBaseFields = {
  title: z.string().min(1).optional(),
  date: z.coerce.date(),
  summary: z.string().max(280).optional(),
  tags: z.array(z.string().min(1)).default([]),
  draft: z.boolean().default(false),
  canonical: z.url().optional(),
};

/** Fields only link entries need. */
export const linkEntryFields = {
  url: z.url(),
  site: z.string().min(1).optional(),
};

/** Fields only photo entries need. Alt text is required, never optional. */
export const photoEntryFields = {
  images: z
    .array(
      z.object({
        src: z.string().min(1),
        alt: z.string().min(1),
        caption: z.string().min(1).optional(),
      }),
    )
    .min(1),
};

/**
 * The extra front matter fields each kind adds on top of `postBaseFields`.
 *
 * Both `src/content.config.ts` (the Astro build) and `src/lib/postFileStore.ts`
 * (the MCP server, which reads the same markdown without Astro) build their
 * schemas from this map, so the two can never drift apart.
 */
export const postKindFields = {
  posts: { title: z.string().min(1) },
  notes: {},
  links: linkEntryFields,
  photos: photoEntryFields,
} as const;

/**
 * Builds the full front matter schema for one kind: the shared base fields plus
 * that kind's own fields.
 */
export function buildPostFrontMatterSchema(kind: PostCollectionName) {
  return z.object({ ...postBaseFields, ...postKindFields[kind] });
}
