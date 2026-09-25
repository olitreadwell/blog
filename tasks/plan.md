# Implementation plan

Source of truth for scope and order is `docs/SPEC.md`. This file is the build
order and the checkpoints.

## Shape of the work

```
scaffold  ->  content model  ->  derived files  ->  MCP server  ->  images
                    |                                  |
                    v                                  v
              routes render                      publish path
                                                       |
                                                       v
                                            cross-post -> a11y -> OSS files
```

The content model comes before routes because the schema decides what the
pages can read. The MCP server comes after the derived files, because the tools
write those files and should not duplicate that logic.

## Milestones

1. Scaffold repo, Astro site, entries rendering. Done.
2. Content collections and schemas for the four kinds, index and archives.
   Done with milestone 1.
3. Feeds, `posts.json`, markdown twins, `llms.txt`, sitemap.
4. MCP server: read tools, then write tools, wired into Codex.
5. Image pipeline and photo entries.
6. Publish path: commit, push, deploy, CI gate.
7. Cross-post adapters: Bluesky and Mastodon, LinkedIn outbox.
8. Accessibility and Lighthouse pass, then the open source files.

## Checkpoints

- After 3: `dist/` contains valid RSS, a JSON index and a markdown twin per
  entry, verified by an integration test.
- After 4: the MCP server lists tools over stdio and creates a real entry, with
  a contract test covering the schemas.
- After 6: a push publishes the site without a manual step.
- After 8: zero axe violations and the Lighthouse targets in the spec.

## Risks

- **Schema churn.** Front matter changes ripple into the MCP tools and the
  feeds. Mitigation: one schema file, one place to change, tests on it.
- **Base path mistakes.** A GitHub Pages project site lives at `/blog`, so
  absolute links break when the base is wrong. Mitigation: build with the real
  base path locally, keep URLs derived from `BASE_URL`.
- **Cross-post duplication.** Posting twice to the same place is the likely
  failure. Mitigation: the syndication state file, plus a test for the
  idempotency rule.
- **Scope creep into a CMS.** The blog is files plus tools, not an app.
  Mitigation: no login, no admin UI, per the spec non-goals.
