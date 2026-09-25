/**
 * Turns a content filename into a URL slug.
 *
 * `2026-09-24-hello-blog.md` becomes `hello-blog`, so the date stays in the
 * filename for sorting and out of the URL for reading.
 */
export function slugifyPostEntryId(entryPath: string): string {
  const withoutExtension = entryPath.replace(/\.mdx?$/i, "");
  const filename = withoutExtension.split("/").pop() ?? withoutExtension;
  const withoutDatePrefix = filename.replace(/^\d{4}-\d{2}-\d{2}[^a-zA-Z0-9]*/, "");

  return withoutDatePrefix
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
