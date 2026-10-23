import { blogBasePath, blogSiteOrigin } from "./blogSite";
import { splitEntryDateParts } from "./formatEntryDate";

/**
 * Builds the site path for an entry, for example
 * `/blog/posts/2018/06/08/conde-nast-paywall-e2e/`.
 *
 * The Astro side passes its Vite base path in; the MCP server passes the same
 * string from `blogBasePath` or `BLOG_SITE_BASE` because it has no Vite.
 */
export function buildEntrySitePath(
  entry: { directory: string; id: string; date: Date },
  basePath: string = blogBasePath,
): string {
  const base = basePath.replace(/\/+$/, "");
  const { year, month, day } = splitEntryDateParts(entry.date);
  return `${base}/${entry.directory}/${year}/${month}/${day}/${entry.id}/`;
}

/** Turns a site path such as `/blog/posts/hello/` into a full URL. */
export function buildEntryAbsoluteUrl(
  sitePath: string,
  origin: string = blogSiteOrigin,
): string {
  return new URL(sitePath.replace(/^\/+/, ""), `${origin}/`).toString();
}
