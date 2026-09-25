import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

import { linkEntryFields, photoEntryFields, postBaseFields } from "./lib/postFrontMatter";
import { slugifyPostEntryId } from "./lib/postSlug";

// Every collection uses the same loader shape: markdown in `content/<kind>/`,
// ids from the filename, one schema on top of the shared base fields.
function defineMarkdownCollection<
  const TKind extends string,
  TShape extends z.ZodRawShape,
>(kind: TKind, kindFields: TShape) {
  return defineCollection({
    loader: glob({
      pattern: "**/*.md",
      base: `./content/${kind}`,
      generateId: ({ entry }) => slugifyPostEntryId(entry),
    }),
    schema: z.object({ ...postBaseFields, ...kindFields }),
  });
}

export const collections = {
  posts: defineMarkdownCollection("posts", { title: z.string().min(1) }),
  notes: defineMarkdownCollection("notes", {}),
  links: defineMarkdownCollection("links", linkEntryFields),
  photos: defineMarkdownCollection("photos", photoEntryFields),
};
