import { formatEntryDateMachine } from "./formatEntryDate";

/**
 * One entry, flattened for machine readers. Feed and index builders take this
 * shape rather than Astro content entries, so the renderers stay pure and
 * testable without a running Astro instance.
 */
export interface MachineEntry {
  kind: string;
  slug: string;
  title: string;
  date: Date;
  summary?: string;
  tags: string[];
  /** Site path including the base path, for example `/blog/posts/hello/`. */
  path: string;
  /** Absolute URL, for feeds and canonical links. */
  url: string;
  body: string;
}

export interface FeedSiteInfo {
  title: string;
  description: string;
  url: string;
  authorName: string;
}

/** Builds RSS items from entries, newest first as supplied. */
export function buildRssItems(entries: MachineEntry[]) {
  return entries.map((entry) => ({
    title: entry.title,
    link: entry.url,
    pubDate: entry.date,
    description: entry.summary ?? "",
    categories: entry.tags,
  }));
}

/** Builds a JSON Feed 1.1 document. https://www.jsonfeed.org/version/1.1/ */
export function renderJsonFeed(entries: MachineEntry[], site: FeedSiteInfo) {
  return {
    version: "https://jsonfeed.org/version/1.1",
    title: site.title,
    home_page_url: site.url,
    feed_url: `${site.url}/feed.json`,
    description: site.description,
    language: "en-NZ",
    authors: [{ name: site.authorName }],
    items: entries.map((entry) => ({
      id: entry.url,
      url: entry.url,
      title: entry.title,
      summary: entry.summary,
      content_text: entry.body,
      date_published: entry.date.toISOString(),
      tags: entry.tags.length > 0 ? entry.tags : undefined,
      _blog: {
        kind: entry.kind,
        slug: entry.slug,
      },
    })),
  };
}

/** Builds the archive index written to `posts.json`. */
export function renderArchiveIndex(entries: MachineEntry[], site: FeedSiteInfo) {
  return {
    title: site.title,
    home_page_url: site.url,
    generated_from: "content/",
    count: entries.length,
    entries: entries.map((entry) => ({
      kind: entry.kind,
      slug: entry.slug,
      title: entry.title,
      date: formatEntryDateMachine(entry.date),
      summary: entry.summary,
      tags: entry.tags,
      path: entry.path,
      url: entry.url,
      word_count: countWords(entry.body),
    })),
  };
}

/**
 * Renders one entry as markdown for agents and plain-text readers. The body is
 * already markdown, so only the front matter needs turning into JSON.
 */
export function renderMarkdownTwin(entry: MachineEntry): string {
  const frontMatter = {
    kind: entry.kind,
    slug: entry.slug,
    title: entry.title,
    date: formatEntryDateMachine(entry.date),
    summary: entry.summary,
    tags: entry.tags,
    url: entry.url,
  };

  return `---\n${JSON.stringify(frontMatter, null, 2)}\n---\n\n${entry.body.trim()}\n`;
}

/** Renders every entry into one markdown file so a model can read the corpus. */
export function renderAllMarkdown(entries: MachineEntry[], site: FeedSiteInfo): string {
  const header = `# ${site.title}: everything published\n\n${site.description}\n\nSource: ${site.url}\nEntries: ${entries.length}\n`;

  const sections = entries.map((entry) => {
    const meta = [
      `Kind: ${entry.kind}`,
      `Date: ${formatEntryDateMachine(entry.date)}`,
      `URL: ${entry.url}`,
      entry.tags.length > 0 ? `Tags: ${entry.tags.join(", ")}` : undefined,
    ].filter((line): line is string => Boolean(line));

    // The marker keeps the section count checkable: entry bodies contain their
    // own `##` headings, so counting those would overcount.
    return `\n---\n\n<!-- entry: ${entry.kind}/${entry.slug} -->\n\n## ${entry.title}\n\n${meta.join("\n")}\n\n${entry.body.trim()}\n`;
  });

  return `${header}${sections.join("")}`;
}

/** Renders `llms.txt`: a short orientation plus an index of every entry. */
export function renderLlmsTxt(entries: MachineEntry[], site: FeedSiteInfo): string {
  const machineFiles = [
    `- [Full corpus as markdown](${site.url}/all.md): every entry, one file`,
    `- [Archive index](${site.url}/posts.json): kind, date, tags and word count per entry`,
    `- [JSON Feed](${site.url}/feed.json): newest first, includes entry bodies`,
    `- [RSS](${site.url}/rss.xml): newest first`,
  ];

  const byKind = new Map<string, MachineEntry[]>();
  for (const entry of entries) {
    const group = byKind.get(entry.kind) ?? [];
    group.push(entry);
    byKind.set(entry.kind, group);
  }

  const listings = [...byKind.entries()].map(([kind, kindEntries]) => {
    const lines = kindEntries.map((entry) => {
      const summary = entry.summary ? `: ${entry.summary}` : "";
      return `- [${entry.title}](${entry.url}) (${formatEntryDateMachine(entry.date)})${summary}`;
    });
    return `## ${kind}\n\n${lines.join("\n")}`;
  });

  return [
    `# ${site.title}`,
    "",
    `> ${site.description}`,
    "",
    "This site publishes posts, notes, links and photos as markdown in git. Each entry has a plain markdown copy at its own URL with `.md` appended.",
    "",
    "## Machine-readable files",
    "",
    machineFiles.join("\n"),
    "",
    "## Entries",
    "",
    listings.join("\n\n"),
    "",
  ].join("\n");
}

/** Counts words in a body, used for the archive index. */
export function countWords(body: string): number {
  return body.split(/\s+/).filter(Boolean).length;
}
