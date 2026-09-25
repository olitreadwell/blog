// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// The site is built as a GitHub Pages project site, so links carry a base path.
// Set SITE_BASE="/" when the blog moves to its own domain.
const siteBase = process.env.SITE_BASE ?? "/blog";

export default defineConfig({
  site: "https://olitreadwell.github.io",
  base: siteBase,
  trailingSlash: "always",
  integrations: [sitemap()],
  build: {
    format: "directory",
  },
});
