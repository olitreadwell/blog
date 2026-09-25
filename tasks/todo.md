# Tasks

Format: task, acceptance, verification, files.

- [x] Task: Scaffold the Astro repo with pinned dependencies
  - Acceptance: `npm run build` produces `dist/` on a clean clone
  - Verify: `npm ci && npm run build`
  - Files: `package.json`, `astro.config.mjs`, `tsconfig.json`, `.nvmrc`

- [x] Task: Define content collections and front matter schemas
  - Acceptance: the four kinds validate, a bad date or missing alt fails
  - Verify: `npm run test`
  - Files: `src/content.config.ts`, `src/lib/postFrontMatter.ts`,
    `src/lib/postSlug.ts`, `tests/`

- [x] Task: Render the index, per-kind archives and one entry route
  - Acceptance: every published entry has a page, drafts stay out of builds
  - Verify: `npm run build`, then check `dist/` for each entry
  - Files: `src/pages/`, `src/components/EntryCard.astro`,
    `src/layouts/BaseLayout.astro`

- [x] Task: Wire the single check command and CI
  - Acceptance: `npm run check` passes; CI runs the same command
  - Verify: `npm run check`, then a push to a branch
  - Files: `package.json`, `eslint.config.mjs`, `.prettierrc.json`,
    `.github/workflows/check.yml`

- [x] Task: Add feeds, `posts.json`, markdown twins and `llms.txt`
  - Acceptance: `rss.xml` parses, `all.md` holds every entry, `llms.txt` lists
    them
  - Verify: integration test over `dist/`, plus a feed validator
  - Files: `src/pages/rss.xml.ts`, `src/pages/feed.json.ts`,
    `src/pages/posts.json.ts`, `src/pages/all.md.ts`, `src/lib/buildFeeds.ts`

- [ ] Task: Build the MCP server read path
  - Acceptance: `blog_list_posts`, `blog_get_post`, `blog_search_posts` answer
    from `content/`
  - Verify: stdio smoke test, then a real call from Codex
  - Files: `mcp/server.ts`, `mcp/tools/listPosts.ts`, `tests/mcp/`

- [ ] Task: Build the MCP server write path
  - Acceptance: create, update and publish tools write valid entries only
  - Verify: unit tests plus one end-to-end draft to publish
  - Files: `mcp/tools/`, `src/lib/postFrontMatter.ts`

- [ ] Task: Add the image pipeline
  - Acceptance: a 6 MB photo becomes avif, webp and jpg at two widths with GPS
    stripped
  - Verify: `npm run images -- <slug>`, then inspect output metadata
  - Files: `scripts/processPhoto.ts`, `content/media/`

- [x] Task: Deploy from `main` through GitHub Actions
  - Acceptance: a push publishes the site with no manual step
  - Verify: push to `main`, then load the live URL
  - Files: `.github/workflows/deploy.yml`

- [ ] Task: Cross-post adapters
  - Acceptance: Bluesky and Mastodon produce platform-sized text, LinkedIn
    writes to `content/outbox/`, state stops double posting
  - Verify: unit tests on payload builders, then one prepared cross-post
  - Files: `adapters/`, `content/.syndication.json`

- [x] Task: End-to-end, smoke and accessibility tests
  - Acceptance: Playwright covers navigation and the machine endpoints, axe
    reports zero violations, `scripts/smoke-dist.mjs` checks the built output
  - Verify: `npm run check:full`
  - Files: `e2e/`, `playwright.config.ts`, `scripts/smoke-dist.mjs`,
    `scripts/serve-dist.mjs`

- [ ] Task: Lighthouse pass
  - Acceptance: zero axe violations, Lighthouse performance 95 or better
  - Verify: Lighthouse on a post page against the live URL
  - Files: `src/styles/global.css`, `src/layouts/BaseLayout.astro`

- [ ] Task: Open source files
  - Acceptance: LICENSE, CONTRIBUTING, SECURITY and a run-your-own README
    section exist
  - Verify: read them, check the licence matches `package.json`
  - Files: `LICENSE`, `CONTRIBUTING.md`, `SECURITY.md`, `README.md`
