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

async function findEntryPages() {
  const kinds = ["posts", "notes", "links", "photos"];
  const found = [];

  for (const kind of kinds) {
    let directoryEntries;
    try {
      directoryEntries = await readdir(join(distRoot, kind), { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of directoryEntries) {
      if (!entry.isDirectory()) continue;
      try {
        await stat(join(distRoot, kind, entry.name, "index.html"));
        found.push({ kind, slug: entry.name });
      } catch {
        failures.push(`entry page has no index.html: ${kind}/${entry.name}`);
      }
    }
  }

  return found;
}

const indexHtml = await readDistFile("index.html");
check(Boolean(indexHtml?.includes('id="main"')), "index.html has no main landmark");

const entryPages = await findEntryPages();
check(entryPages.length > 0, "no entry pages found in dist/");

const rssXml = await readDistFile("rss.xml");
check(Boolean(rssXml?.includes("<rss")), "rss.xml does not look like RSS");
check(
  (rssXml?.match(/<item>/g) ?? []).length === entryPages.length,
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
      feed.items.length === entryPages.length,
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
    check(
      archive.count === entryPages.length,
      "posts.json count differs from entry pages",
    );
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
  (allMarkdown?.match(/^## /gm) ?? []).length === entryPages.length,
  "all.md section count differs from entry pages",
);

const llmsTxt = await readDistFile("llms.txt");
check(Boolean(llmsTxt?.startsWith("# ")), "llms.txt has no heading");

for (const { kind, slug } of entryPages) {
  check(
    Boolean(llmsTxt?.includes(`/${kind}/${slug}/`)),
    `llms.txt is missing ${kind}/${slug}`,
  );
  check(
    Boolean(allMarkdown?.includes(`/${kind}/${slug}/`)),
    `all.md is missing ${kind}/${slug}`,
  );

  try {
    const twin = await readFile(join(distRoot, kind, `${slug}.md`), "utf8");
    check(twin.startsWith("---"), `${kind}/${slug}.md has no front matter block`);
  } catch {
    failures.push(`missing markdown twin: dist/${kind}/${slug}.md`);
  }
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
  `smoke check passed: ${entryPages.length} entries, feeds and machine files present`,
);
