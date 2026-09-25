import { z } from "astro/zod";

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
