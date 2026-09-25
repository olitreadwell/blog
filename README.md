# blog

Notes, links, photos and longer writing, published at
[olitreadwell.github.io/blog](https://olitreadwell.github.io/blog/).

Astro builds a static site from markdown in `content/`. There is no database
and no server. An MCP server (later milestone) reads and writes the same
markdown, so an agent session can draft, edit and publish without a CMS.

## Quickstart

```bash
nvm use            # Node from .nvmrc, currently 24
npm ci
npm run dev        # http://localhost:4321/blog/
npm run check      # format, lint, types, tests, build
```

## What an entry is

Four collections share one set of front matter fields. The filename carries the
date for sorting, and the URL drops it.

```
content/posts/2026-09-24-a-blog-i-own.md    -> /posts/a-blog-i-own/
content/notes/2026-09-24-small-notes.md     -> /notes/small-notes/
content/links/2026-09-24-astro-docs.md      -> /links/astro-docs/
content/photos/2026-09-24-waterfront.md     -> /photos/waterfront/
```

Shared fields: `date`, optional `title`, optional `summary`, `tags`, `draft`,
optional `canonical`. Links add `url` and optional `site`. Photos add
`images[]`, and every image needs `alt`, because the build rejects it
otherwise.

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
npm run check         The gate CI runs: format, lint, types, tests, build
```

## Deploying

Push to `main`. GitHub Actions runs the check and deploys `dist/` to GitHub
Pages. The site is built with a `/blog` base path, since it is a project site.
Set `SITE_BASE=/` at build time when it moves to its own domain.

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
docs/          SPEC.md, the full specification
tasks/         plan.md and todo.md, the build order
```

## License

AGPL-3.0. The writing in `content/` is mine; the code is yours to reuse.
