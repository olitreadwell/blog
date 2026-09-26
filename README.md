# blog

Notes, links, photos and longer writing, published at
[olitreadwell.github.io/blog](https://olitreadwell.github.io/blog/).

Astro builds a static site from markdown in `content/`. There is no database
and no server. An MCP server (later milestone) reads and writes the same
markdown, so an agent session can draft, edit and publish without a CMS.

The content directory starts empty on purpose. Entries here are written by me.
Agent help with drafting is fine, the words are still mine.

Live site: <https://olitreadwell.github.io/blog/>

## Quickstart

```bash
nvm use            # Node from .nvmrc, currently 24
npm ci
npm run dev        # http://localhost:4321/blog/
npm run check      # format, lint, types, unit tests, build, smoke check
npm run check:full # the above plus Playwright end-to-end and axe tests
```

## What an entry is

Four collections share one set of front matter fields. The filename carries the
date for sorting, and the URL carries it as path segments so the archive reads
chronologically.

```
content/posts/2018-06-08-conde-nast-paywall-e2e.md -> /posts/2018/06/08/conde-nast-paywall-e2e/
content/notes/2026-09-26-small-notes.md            -> /notes/2026/09/26/small-notes/
content/links/2026-09-26-astro-docs.md             -> /links/2026/09/26/astro-docs/
content/photos/2026-09-26-waterfront.md            -> /photos/2026/09/26/waterfront/
```

Shared fields: `date`, optional `title`, optional `summary`, `tags`, `draft`,
optional `canonical` (used when a post was first published somewhere else, and
it changes the canonical link on the page). Links add `url` and optional
`site`. Photos add `images[]`, and every image needs `alt`, because the build
rejects it otherwise.

Set `draft: true` to keep an entry out of production builds while it renders in
development.

## Commands

```
npm run dev           Local server with content watching
npm run build         Static output in dist/
npm run preview       Serve the built site
npm run typecheck     astro check
npm run lint          eslint
npm run format        prettier --write
npm run test          vitest run
npm run e2e           Playwright end-to-end tests against the built site
npm run a11y          The axe scans, which are the accessibility subset of e2e
npm run serve         Serve dist/ in the foreground on port 4321
npm run check         Format, lint, types, unit tests, build, smoke
npm run check:full    Everything CI runs, including Playwright and axe
```

## Deploying

Push to `main`. GitHub Actions runs the check and deploys `dist/` to GitHub
Pages. The site is built with a `/blog` base path, since it is a project site.
Set `SITE_BASE=/` at build time when it moves to its own domain.

Pages is configured with `build_type: workflow`, so the deploy job is what
publishes the site. A failing check blocks nothing on its own: check the run
before merging anything into `main`.

Dependency bumps arrive as Dependabot pull requests. Merge one only after the
`check` workflow is green on the branch. TypeScript major bumps are ignored for
now, because `@astrojs/check` and `typescript-eslint` cap their peer range below
version 7.

Any static host works with the same output: Cloudflare Pages, Netlify, an S3
bucket or a VPS running Caddy.

## Layout

```
content/       markdown entries, one directory per kind
src/lib/       front matter schemas, slugs, date formatting, the entry stream
src/pages/     index, per-kind archives, one route for every entry
src/layouts/   the page shell
src/styles/    global CSS, light and dark
tests/         unit tests for the lib layer
e2e/           Playwright end-to-end and axe accessibility tests
scripts/       smoke check over dist/ and the foreground static server
docs/          SPEC.md, the full specification
tasks/         plan.md and todo.md, the build order
```

## License

AGPL-3.0. The writing in `content/` is mine; the code is yours to reuse.
