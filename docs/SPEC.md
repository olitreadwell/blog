# Spec: Personal Blog with an MCP-Native Content Pipeline

Status: draft, awaiting review
Author: Oli Treadwell
Date: 2026-09-24

## Objective

Build a personal publishing system for four content shapes:

- Long posts (essays, technical write-ups)
- Links (a URL plus commentary)
- Photos (one or more images plus a caption)
- Notes (short thoughts, no title required)

The site is self-hosted, the source is open, and the primary way to write and
manage content is an MCP server. Writing happens in an agent session ("draft a
post from these notes", "attach this photo", "prepare the cross-post text")
rather than in a CMS admin panel or a hand-edited HTML file.

Success means:

- Adding a post from an agent session takes under two minutes.
- Every post exists as plain markdown in git, readable without the build tool.
- Machines can read the archive: feeds, per-post markdown twins, an index of
  everything as JSON, and `llms.txt`.
- Cross-post text gets prepared automatically and never leaves the machine
  without an explicit human send.
- The whole thing runs on free or near-free hosting and can move hosts without
  rewriting content.

## Non-goals for v1

- Comments. (Webmentions are a later, separate decision.)
- A web admin UI for editing posts. The editor is the agent and the filesystem.
- Multi-author support, accounts, or anything with a login.
- Migrating old content. There is none to migrate.
- Newsletter delivery.
- Generated filler. The tools help with drafting and publishing, but the
  published entries are mine. No sample posts, no placeholder content.

## Decisions taken (correct these now, not later)

1. **Location.** New repo at `~/code/blog`, published to GitHub Pages at
   `https://olitreadwell.github.io/blog/`. The existing `olitreadwell.github.io`
   repo keeps its landing page role. Alternative: a subdomain
   (`blog.olitreadwell.com`) if a domain gets bought. The path choice is
   reversible in one config line.
2. **Static site generator.** Astro. Typed content collections, markdown and
   MDX, built-in image processing, zero JavaScript by default, and a Node
   adapter available later if a server is ever needed. Next.js is the fallback
   if I would rather stay in one framework everywhere; Eleventy is the fallback
   if Astro's build feels like too much machinery.
3. **Content lives in git as markdown.** Front matter plus a body. No database.
   The corpus must outlive the generator.
4. **MCP is the primary interface.** A local stdio server that reads and writes
   the content directory, wired into `~/.codex/config.toml` the same way
   `workspace-mcp` is.
5. **Publish means commit and push.** No separate deploy step to remember.
6. **License.** AGPL-3.0, matching the existing site repo. MIT is the
   alternative if I would rather encourage forks over copyleft.
7. **Cross-post destinations for v1.** Bluesky and Mastodon by API, LinkedIn by
   prepared text for manual paste, RSS and JSON Feed for everything else.
8. **Photography workflow reuses `~/code/photography` conventions** where they
   fit, and `~/code/tech-post-studio`'s prose gate (`npm run prose`, which runs
   de-ai-text plus the oli-style hard rules) gets reused verbatim for post
   bodies.

## Options: build the pipeline, or run Ghost

Ghost is a real contender for this, so the choice belongs in the spec rather
than in a chat message. Verified 2026-09-24:

| | Ghost | Hand-built static pipeline |
| --- | --- | --- |
| License | MIT (core), `TryGhost/Ghost`, 55.4k stars | your pick |
| Latest release | v6.65.0, 2026-09-22, ships weekly | n/a |
| Self-host cost | Ubuntu box with 1GB RAM, or the new docker compose install (marked preview), plus MySQL 8 | free on GitHub Pages |
| Ops | upgrades, MySQL backups, TLS. Call it an hour a month after setup | near zero |
| MCP | no official server. `docs.ghost.org/llms.txt` lists zero MCP pages. Community npm packages exist and are unvetted | you write it, so it matches your habits exactly |
| Content storage | MySQL rows, Lexical JSON, exportable as JSON | markdown in git |
| Theming | Handlebars. Real work to make it look like your site | Astro, or anything you want |
| Included | admin editor, image resizing, search, comments, memberships, newsletters, email sending | none of it |
| Cross-post | ActivityPub ships in 6.0 as a separate open-source service. Self-host it, or use the hosted one free under limits: 2000 followers, 2000 following, 100 interactions a day | you write the adapters |
| Automation hook | Admin API (JWT key and secret) does everything the admin UI does | the MCP server is the hook |

Two viable paths:

**Path A, run Ghost.** Docker compose, Ghost plus MySQL. Write a small MCP
server over the Admin API (create, update, publish, schedule, upload image)
instead of building a site. Cross-posting to Mastodon and the fediverse comes
from ActivityPub rather than an adapter you maintain. You get an editor and a
newsletter you did not have to build. You give up markdown in git, and theme
work becomes Handlebars work.

**Path B, build the pipeline in the rest of this spec.** More code, no server
to babysit, markdown stays the source of truth, and the MCP surface is exactly
what you want rather than a wrapper around someone else's API.

A hybrid is also coherent: Ghost for the site and the fediverse, plus the
adapters and prose gate from this spec for Bluesky and LinkedIn. That is more
moving parts than either path alone, so it only makes sense if the fediverse
matters more than owning the file format.

Everything below describes Path B. If Path A wins, sections "Architecture",
"Content model", "MCP surface", and "Self-host options" get rewritten around
the Admin API and the docker compose install, and the milestones shrink to
about half a day.

### Other open source options, checked 2026-09-24

The generator choice is narrow once hosting has to be free and static. The
interesting spread is in the federation and syndication tools.

- **Astro.** MIT core, 62.8k stars, pushed today. Content collections, image
  pipeline, near-zero JavaScript. The default in this spec.
- **Hugo.** Apache-2.0, 89.9k stars, pushed today. One Go binary, fastest
  builds of anything here, biggest theme library. Cost is Go templating.
- **Eleventy.** Minimal, markdown in and HTML out, no build magic. Weakest
  image story of the three.
- **Quartz.** MIT, 13.3k stars, pushed 2026-09-20. Turns an Obsidian vault into
  a static site with backlinks and a graph view, deploys to GitHub Pages. Good
  for notes, weaker for long posts and photo sets.
- **WriteFreely.** AGPL-3.0, 5.2k stars, active. Federated blogging with
  ActivityPub built in. Needs a server, so it fails the free static hosting
  requirement.
- **WordPress and Ghost.** Both need PHP or Node plus MySQL somewhere. Out for
  the same reason.

For syndication without a server:

- **Bridgy Fed.** CC0, 1.2k stars, pushed 2026-09-23. Bridges a static site or
  its RSS feed into the fediverse. The hosted instance is free.
- **rss-to-activitypub.** MIT, but the last commit is 2021. Stale, do not
  depend on it.
- **Bluesky.** No bridge needed. A GitHub Action or a scheduled local job calls
  the AT Protocol API with an app password.
- **Obsidian MCP servers** exist on npm (`obsidian-mcp-server` 3.6.0, updated
  2026-09-23) if drafting inside Obsidian and publishing from there is
  preferred over writing through a bespoke MCP server.
- **The official `modelcontextprotocol/servers` filesystem server**, 90.5k
  stars, already gives read and write access to a content directory. The blog
  MCP server in this spec is the schema-aware layer on top of that, not a
  replacement for it.

## Tech stack

- Node 24 (`.nvmrc` plus `engines`, exact versions in the lockfile)
- TypeScript in strict mode, ESM only
- Astro for the site, `sharp` for images, `zod` for front matter schemas
- MCP TypeScript SDK for the server, stdio transport by default
- Vitest for unit and integration tests, Playwright for the accessibility and
  end-to-end checks
- GitHub Actions for CI and Pages deploy

## Architecture

Three parts, one source of truth.

```
agent session  --stdio-->  MCP server  --reads/writes-->  content/*.md
                                                              |
                                                    (git commit, push)
                                                              v
                                                   GitHub Actions build
                                                              v
                                                    GitHub Pages site
```

- **Content directory.** The only source of truth. Markdown files plus a media
  directory plus a syndication state file.
- **MCP server.** Owns the rules: slug generation, front matter validation,
  image processing, feed regeneration, and the publish sequence. All writes go
  through it so the rules cannot drift from what the site expects.
- **Build.** A static build in CI. The same build runs locally with
  `npm run dev` and `npm run build`.

Nothing in the pipeline requires a database, a queue, or a long-running
service. The MCP server is disposable: start it, do work, exit.

## Content model

Four collections, one front matter schema each, all extending a shared base.

```yaml
# content/posts/2026-09-24-mcp-native-blog.md
title: "An MCP-native blog"
date: 2026-09-24
kind: post            # post | link | photo | note
summary: "One sentence for feeds and cards."
tags: [mcp, astro]
draft: false
canonical: "https://olitreadwell.github.io/blog/posts/mcp-native-blog/"
```

Shared fields: `title` (optional for notes), `date`, `kind`, `summary`,
`tags`, `draft`, `canonical`.

Kind-specific fields:

- `link`: `url` (required), `site` (optional display name)
- `photo`: `images[]` with `src`, `alt` (required, build fails without it),
  `caption`
- `note`: nothing extra. Body is short.

Media layout:

```
content/media/<year>/<slug>/
  original.jpg      # gitignored if over 5 MB, kept locally
  hero-1600.avif
  hero-1600.webp
  hero-1600.jpg
  hero-800.avif
  hero-800.webp
  hero-800.jpg
```

The image step strips GPS and other EXIF by default. Camera make, model, lens,
and exposure get kept for photo posts, because the caption often wants them.

Syndication state lives in `content/.syndication.json`, keyed by slug:

```json
{
  "an-mcp-native-blog": {
    "bluesky": { "status": "posted", "url": "https://bsky.app/...", "at": "2026-09-24T09:00:00Z" },
    "mastodon": { "status": "prepared", "at": "2026-09-24T08:59:00Z" },
    "linkedin": { "status": "prepared", "at": "2026-09-24T08:59:00Z" }
  }
}
```

`status` is one of `prepared`, `posted`, `failed`. The file makes syndication
idempotent: a post that already went to Bluesky does not go twice.

## MCP surface

Tool names use the `blog_` prefix with a two-word verb phrase.

Write path:

- `blog_create_draft` (kind, title, body, tags) creates a file under
  `content/drafts/`.
- `blog_update_draft` (slug, field, value) edits a draft in place.
- `blog_attach_image` (slug, path, alt, caption) processes variants and writes
  the front matter.
- `blog_publish_post` (slug, publish_at) moves the draft into `content/posts/`,
  regenerates derived files, commits, and pushes.
- `blog_unschedule_post` (slug) reverses a scheduled publish.

Read path:

- `blog_list_posts` (kind, tag, limit, include_drafts)
- `blog_get_post` (slug)
- `blog_search_posts` (query) searches titles, summaries, tags, and bodies.
- `blog_get_stats` (period) returns counts by kind, posting cadence, and
  syndication state.

Cross-post path:

- `blog_prepare_crosspost` (slug, destinations[]) builds per-destination text
  with the right length and formatting per platform, and records
  `status: prepared`.
- `blog_record_crosspost` (slug, destination, url) records what got posted
  after the human sends it.
- `blog_list_pending_crossposts` lists prepared but unrecorded items.

Resources:

- `blog://posts/recent`
- `blog://drafts`
- `blog://post/<slug>`
- `blog://feeds/summary`

Prompts:

- `blog_draft_from_notes` turns raw notes into a draft body in my voice, then
  runs the prose gate before showing it.
- `blog_photo_caption_from_exif` reads EXIF and proposes a caption.

Every tool returns a plain JSON result with the file path it touched, so the
agent can report exactly what changed.

## Cross-post and syndication

One adapter per destination, each a small module with the same shape:

```ts
export type CrosspostPayload = { text: string; images: string[] };
export type CrosspostResult =
  | { status: "prepared"; text: string }
  | { status: "posted"; url: string };

export function buildBlueskyPayload(post: PostWithBody): CrosspostPayload;
```

- **Bluesky.** API with an app password. `build` and `prepare` run freely;
  `post` requires a per-message confirmation in the session.
- **Mastodon.** Same shape, instance set by env var.
- **LinkedIn.** Text only, written to
  `content/outbox/linkedin-<slug>.md`, plus a browser flow using the
  `chrome-devtools` MCP tools that fills the compose box. The human presses
  Post. This follows the standing rule that the agent never sends to a real
  person.
- **RSS and JSON Feed.** Generated at build. Feed readers and other sites
  syndicate without any action.

No adapter runs on a schedule by default. Automation can call
`blog_prepare_crosspost` after a publish, which stops at `prepared`.

## AI-native outputs

Generated at build, committed so plain file access works without a build:

- `/blog/rss.xml` and `/blog/feed.json`
- `/blog/posts/<slug>.md`, a markdown twin of each post, same body, front
  matter as a small JSON block at the top
- `/blog/all.md`, every post concatenated for whole-corpus reading
- `/blog/posts.json`, the archive index with titles, dates, tags, summaries,
  and word counts
- `/blog/llms.txt`, a short orientation file pointing at the above
- `/blog/sitemap.xml`
- `robots.txt` allowing everything, since it is my own writing

Every page keeps a canonical URL and Open Graph tags, matching what the landing
page already does.

## Self-host options

v1 ships as static output, deployed to GitHub Pages by Actions. The same
`dist/` folder works on Cloudflare Pages, Netlify, an S3 bucket, or a VPS with
Caddy.

If drafts-from-phone or webhooks ever matter, add the Astro Node adapter and run
the container anywhere. That mode gets `GET /health`, an OpenAPI spec at
`/docs`, and token auth on every write route. It is not part of v1.

The MCP server runs locally over stdio. No inbound port, no auth surface, no
hosted service holding my credentials.

## Commands

```
Setup:    npm ci
Dev:      npm run dev
Build:    npm run build
Preview:  npm run preview
Check:    npm run check          # lint, format check, typecheck, test, build, smoke
Test:     npm test
Coverage: npm run test:coverage
Prose:    npm run prose -- <slug> # de-ai-text plus oli-style hard rules
Images:   npm run images -- <slug>
MCP:      npm run mcp            # stdio server, for wiring into a client
A11y:     npm run a11y           # Playwright plus axe against the built site
License:  npm run license-check
```

`npm run check` is the single gate. CI runs exactly that command.

## Project structure

```
content/            markdown posts, drafts, notes, links, photos
content/media/      processed image variants, committed
content/outbox/     prepared cross-post text waiting for a human
content/.syndication.json
src/                Astro site: layouts, pages, components, styles
src/lib/            shared logic: front matter, slugs, dates, feeds
mcp/                MCP server: tools, resources, prompts, transport
mcp/tools/          one module per tool
adapters/           bluesky, mastodon, linkedin, rss
scripts/            build helpers, image pipeline, prose gate, link check
tests/              unit and integration tests, mirrors src layout
e2e/                Playwright specs against the built site
docs/               this spec, architecture notes, glossary
public/             static passthrough: favicon, robots.txt
.github/workflows/  check.yml, deploy.yml, audit.yml
```

## Code style

TypeScript, strict, ESM. Function names carry the domain word so a text search
lands on one definition.

```ts
// Builds the front matter for a new draft and validates it against the schema.
export function buildDraftFrontMatter(input: DraftInput): PostFrontMatter {
  return postFrontMatterSchema.parse({
    ...input,
    slug: slugifyPostTitle(input.title),
    date: input.date ?? todayInSiteTimezone(),
  });
}
```

- No `any`, no non-null assertions in application code.
- Prettier for formatting, ESLint with the typed rules on.
- `camelCase` for values, `kebab-case` for files, one concept per module.
- Comments explain why, sit directly above the thing they explain, and never
  restate the code.
- Every exported function has a doc comment naming its input and output.
- No em dashes, no rule-of-three padding, no banned words in any prose that
  ships, whether that is a post, a commit message, or a README.

## Testing strategy

- **Unit.** Front matter parsing and validation, slug and date rules, feed
  generation, adapter payload builders with `fetch` mocked, syndication
  idempotency, image pipeline against a small fixture photo.
- **Integration.** Build a fixture content set, then assert the built site
  contains the post, the feeds parse, `posts.json` matches the content
  directory, and `llms.txt` lists every published post.
- **Contract.** Validate every MCP tool's input schema against the JSON schema
  file, and smoke test the server over stdio: spawn it, list tools, call
  `blog_list_posts` against a fixture directory.
- **End-to-end.** Playwright against the built site for keyboard navigation,
  skip links, colour contrast, and a full-page axe run. Zero violations is the
  gate, matching the landing page's current standard.
- **Coverage.** 90% lines on `mcp/`, `adapters/`, `src/lib/`, and the pure
  parts of `scripts/`. Slug generation, front matter validation, and the
  syndication state machine need 100%.

## Observability and operations

- Structured JSON logs from the MCP server and scripts, one line per event, to
  stdout.
- Errors surface as a tool result with the failing path and the reason, never a
  stack trace the agent has to guess at.
- The publish path reports what it did: files written, commit hash, push
  result.
- A weekly link check over published posts reports dead outbound links as a
  GitHub issue.
- Backups are git plus a periodic `git bundle` written outside the repo.

## Security

- Secrets (Bluesky app password, Mastodon token) live in `.env.local`,
  gitignored, and are read from the environment only.
- No secret is ever written into a post, a commit, or a log line.
- `npm audit` in CI weekly, plus a documented upgrade path.
- The MCP server refuses to write outside the content directory.
- No inbound network surface in v1.
- A `SECURITY.md` with a private reporting address.

## Open source hygiene

The repo ships with a README (quickstart, commands, architecture in five
lines), `LICENSE` (AGPL-3.0 unless changed), `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`,
`SECURITY.md`, issue and PR templates, `AGENTS.md` for future agent sessions,
CI badges, and a docs folder with this spec plus a glossary.

Because it is open source and meant to be forked, the README includes a
"run your own" section: what to change, which env vars to set, and how to point
it at a different domain.

## App quality baseline mapping

The global baseline applies, with these translations:

- Health check: not applicable to a static site. The optional Node mode gets
  `/health`.
- API docs: the MCP tool schemas are the API. `docs/mcp-tools.md` is generated
  from them so it cannot drift.
- Containerisation: a Dockerfile in the optional Node mode only. v1 static
  output does not need one.
- CI/CD: `check.yml` on every push, `deploy.yml` on main.
- Input validation: zod at every boundary, meaning front matter and tool
  arguments.
- Testing: unit, integration, contract, and end-to-end, as above.

## Boundaries

Always:

- Run `npm run check` before saying a change is done.
- Validate front matter through the schema, never by hand.
- Require alt text on every image.
- Keep the prose gate green for anything that ships.

Ask first:

- Adding a dependency.
- Adding a cross-post destination.
- Changing the front matter schema.
- Adding a hosted service or anything with a monthly cost.
- Changing CI config.

Never:

- Send anything to a real person or a public channel without the human pressing
  send for that exact message.
- Commit secrets, full-resolution originals over 5 MB, or GPS EXIF.
- Break existing post URLs. Old slugs redirect.
- Write outside the content directory from the MCP server.

## Success criteria

Done means all of these hold:

1. `npm run check` passes on a clean clone, and CI runs the same command.
2. An agent session can create, edit, and publish a post with the MCP tools,
   and the post is live after CI finishes.
3. All four content kinds render, and the index page shows a mixed stream.
4. Every published post has a markdown twin, appears in `posts.json` and
   `rss.xml`, and is listed in `llms.txt`.
5. `npm run a11y` reports zero axe violations and full keyboard operability.
6. `blog_prepare_crosspost` produces platform-appropriate text for Bluesky,
   Mastodon, and LinkedIn, and records state so it never double-posts.
7. A 6 MB phone photo becomes avif, webp, and jpg at two widths, with GPS
   stripped, in under 30 seconds.
8. Lighthouse on a post page: performance at least 95, accessibility 100, SEO
   100, best practices 100.
9. Repo is public with license, README, CONTRIBUTING, and SECURITY in place.
10. Content in `content/` is readable and portable with no build tool present.

## Milestones

Estimates assume my own time, not agent time.

1. Scaffold repo, Astro site, one hard-coded post rendered. (about 2 hours)
2. Content collections plus zod schemas for all four kinds, index and post
   pages. (about 3 hours)
3. Feeds, `posts.json`, markdown twins, `llms.txt`, sitemap. (about 2 hours)
4. MCP server, read tools first, then write tools, wired into Codex. (about 4
   hours)
5. Image pipeline and photo posts. (about 2 hours)
6. Publish path: commit, push, deploy, with the CI gate. (about 1 hour)
7. Cross-post adapters, Bluesky and Mastodon live, LinkedIn outbox. (about 3
   hours)
8. Accessibility and Lighthouse pass, then the OSS files and README. (about 2
   hours)

Total: roughly two focused days, or a week of evenings.

## Open questions

1. Astro, or stay in Next.js since that is the framework I use at work?
2. AGPL-3.0, or MIT to make forking frictionless?
3. Subdomain (`blog.olitreadwell.com`) now, or the `/blog/` path until a domain
   exists?
4. Bluesky and Mastodon: is posting by API acceptable, or should both stop at
   prepared text like LinkedIn does?
5. Do notes and links belong in the same stream as posts on the index, or in
   separate feeds?
6. Any comments or webmentions at all, or leave it out entirely?
7. Should the landing page repo link to the blog, and does the blog link back?
8. Do you want a photo-specific layout (EXIF table, larger images) or one
   layout for everything?

## Review gate

Phase 1 ends here. Nothing gets built until the questions above are answered.
Question 1 decides whether the rest of this document applies at all.

## Decisions resolved, 2026-09-25

- Question 1: Path B, the static pipeline. Free hosting and no server to fall
  over beat what Ghost offers, so Ghost is out.
- Generator: Astro.
- Host: GitHub Pages at `https://olitreadwell.github.io/blog/`, deployed by
  GitHub Actions from `main`. Cloudflare Pages stays the fallback if a post
  ever gets real traffic, since its free tier has no bandwidth cap.
- Content storage: markdown in `content/`, drafts marked `draft: true` in the
  same directory rather than a separate `content/drafts/` folder.
- Tests: unit and integration in `tests/`, end-to-end and axe in `e2e/`, plus
  `scripts/smoke-dist.mjs` over the build output. No Lighthouse run yet.
- Still open: licence, cross-post destinations, whether Bluesky posts by API,
  one stream or separate feeds, comments, the landing page link, and whether
  photos get their own layout.
