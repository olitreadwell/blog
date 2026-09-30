/**
 * Origin and base path the blog is published under.
 *
 * `astro.config.mjs` reads `SITE_BASE` for the base path. The MCP server runs
 * without Astro, so it reads the same value through `blogBasePath` and
 * `BLOG_SITE_BASE` instead of through Vite.
 */
export const blogSiteOrigin = "https://olitreadwell.github.io";

/** Base path the site is served from, for example `/blog`. */
export const blogBasePath = "/blog";
