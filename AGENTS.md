# Agent notes for this repo

Read `docs/SPEC.md` before changing content shapes, routes or the pipeline. It
is the specification, this file is the working convention.

## Commands

```
npm run check      The gate. Run it before saying a change is done.
npm run check:full Adds Playwright end-to-end and axe accessibility tests.
npm run test       Unit tests only, when iterating.
npm run a11y       Accessibility scans only.
npm run dev        Local server at http://localhost:4321/blog/
```

The live site is https://olitreadwell.github.io/blog/, deployed from `main` by
`.github/workflows/deploy.yml`.

## Where things live

- `content/<kind>/` holds markdown. The four kinds are `posts`, `notes`,
  `links`, `photos`. Never write entries anywhere else.
- The content directory is empty on purpose. Do not add sample or placeholder
  entries, and do not fill the blog with generated posts. Drafting help is
  welcome, publishing is a human decision.
- `src/lib/` holds logic worth testing: schemas, slug rules, date formatting,
  the merged entry stream. Keep pure functions here.
- `src/pages/` holds routes. `[kind]/[slug].astro` serves every entry, so the
  URL shape is consistent across kinds.
- `tests/` mirrors `src/lib/`. A test file is named after its source file.
- `e2e/` holds Playwright specs. They run against `dist/` served by
  `scripts/serve-dist.mjs` on the real base path, not against a dev server.

## Conventions

- Front matter is validated by the zod schema in `src/lib/postFrontMatter.ts`.
  Add a field there first, then use it in content. Never hand-validate.
- Every image needs `alt`. That is a build failure on purpose.
- Ids come from the filename through `slugifyPostEntryId`, which strips the
  `YYYY-MM-DD-` prefix. Keep the date in the filename, out of the URL.
- `draft: true` hides an entry from production builds and keeps it visible in
  development.
- Dependency versions are exact. No carets. Add a dependency only after asking.
- Public functions get a doc comment above the definition, and names carry the
  domain word (`loadPublishedStream`, not `load`).

## Prose

Anything that ships, in content or in a commit message, passes the prose gate:
no em dashes, no rule-of-three padding, no banned words from the oli-style
list, no platitude openers, no closing summaries. Plain language, specific
facts.
