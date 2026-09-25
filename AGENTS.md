# Agent notes for this repo

Read `docs/SPEC.md` before changing content shapes, routes or the pipeline. It
is the specification, this file is the working convention.

## Commands

```
npm run check     The gate. Run it before saying a change is done.
npm run test      Tests only, when iterating.
npm run dev       Local server at http://localhost:4321/blog/
```

## Where things live

- `content/<kind>/` holds markdown. The four kinds are `posts`, `notes`,
  `links`, `photos`. Never write entries anywhere else.
- `src/lib/` holds logic worth testing: schemas, slug rules, date formatting,
  the merged entry stream. Keep pure functions here.
- `src/pages/` holds routes. `[kind]/[slug].astro` serves every entry, so the
  URL shape is consistent across kinds.
- `tests/` mirrors `src/lib/`. A test file is named after its source file.

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
