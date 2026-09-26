#!/usr/bin/env node
// Checks the built site in dist/. Runs after the build in `npm run check`, so a
// broken feed or a missing markdown copy fails the gate before shipping.
import { readdir, readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const distRoot = fileURLToPath(new URL("../dist/", import.meta.url));
const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

async function readDistFile(relativePath) {
  try {
    return await readFile(join(distRoot, relativePath), "utf8");
  } catch {
    failures.push(`missing file: dist/${relativePath}`);
    return undefined;
  }
}

/**
 * Finds every entry by walking for its markdown twin. Entries live at
 * `<kind>/<year>/<month>/<day>/<slug>/` with a twin at `<...>/<slug>.md`, so the
 * twin is the reliable marker and the page has to sit beside it.
 */
async function walkForMarkdownTwins(directory, relativePath = "") {
  const found = [];
  let directoryEntries;

  try {
    directoryEntries = await readdir(directory, { withFileTypes: true });
  } catch {
    return found;
  }

  for (const entry of directoryEntries) {
    const entryPath = join(directory, entry.name);
    const entryRelativePath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      found.push(...(await walkForMarkdownTwins(entryPath, entryRelativePath)));
      continue;
    }

    if (!entry.name.endsWith(".md")) continue;

    const sitePath = entryRelativePath.slice(0, -3);
    try {
      await stat(join(distRoot, `${sitePath}/index.html`));
      found.push({ sitePath, twinPath: entryRelativePath });
    } catch {
      failures.push(`markdown twin has no page beside it: ${entryRelativePath}`);
    }
  }

  return found;
}

async function findEntries() {
  const kinds = ["posts", "notes", "links", "photos"];
  const found = [];

  for (const kind of kinds) {
    found.push(...(await walkForMarkdownTwins(join(distRoot, kind), kind)));
  }

  return found;
}

const indexHtml = await readDistFile("index.html");
check(Boolean(indexHtml?.includes('id="main"')), "index.html has no main landmark");

const entries = await findEntries();
// An empty content directory is a valid state: the site ships unpublished.
// Everything below still checks the build output is internally consistent.

const rssXml = await readDistFile("rss.xml");
check(Boolean(rssXml?.includes("<rss")), "rss.xml does not look like RSS");
check(
  (rssXml?.match(/<item>/g) ?? []).length === entries.length,
  "rss.xml item count differs from entry pages",
);

const feedJson = await readDistFile("feed.json");
if (feedJson) {
  try {
    const feed = JSON.parse(feedJson);
    check(
      feed.version === "https://jsonfeed.org/version/1.1",
      "feed.json version is wrong",
    );
    check(
      feed.items.length === entries.length,
      "feed.json item count differs from entry pages",
    );
  } catch {
    failures.push("feed.json is not valid JSON");
  }
}

const archiveJson = await readDistFile("posts.json");
if (archiveJson) {
  try {
    const archive = JSON.parse(archiveJson);
    check(archive.count === entries.length, "posts.json count differs from entry pages");
    check(
      archive.entries.every((entry) => typeof entry.word_count === "number"),
      "posts.json entry is missing a word count",
    );
  } catch {
    failures.push("posts.json is not valid JSON");
  }
}

const allMarkdown = await readDistFile("all.md");
check(
  (allMarkdown?.match(/^<!-- entry: /gm) ?? []).length === entries.length,
  "all.md section count differs from entry pages",
);

const llmsTxt = await readDistFile("llms.txt");
check(Boolean(llmsTxt?.startsWith("# ")), "llms.txt has no heading");

for (const { sitePath, twinPath } of entries) {
  check(Boolean(llmsTxt?.includes(`/${sitePath}/`)), `llms.txt is missing ${sitePath}`);
  check(Boolean(allMarkdown?.includes(`/${sitePath}/`)), `all.md is missing ${sitePath}`);

  const twin = await readFile(join(distRoot, twinPath), "utf8");
  check(twin.startsWith("---"), `${twinPath} has no front matter block`);
}

const sitemap = await readDistFile("sitemap-index.xml");
check(
  Boolean(sitemap?.includes("<sitemapindex")),
  "sitemap-index.xml is missing or malformed",
);

const robots = await readDistFile("robots.txt");
check(Boolean(robots?.includes("Sitemap:")), "robots.txt does not point at the sitemap");

if (failures.length > 0) {
  console.error(`smoke check failed with ${failures.length} problem(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `smoke check passed: ${entries.length} entries, feeds and machine files present`,
);
