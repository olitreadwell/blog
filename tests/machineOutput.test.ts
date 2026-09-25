import { describe, expect, it } from "vitest";

import {
  buildRssItems,
  countWords,
  renderAllMarkdown,
  renderArchiveIndex,
  renderJsonFeed,
  renderLlmsTxt,
  renderMarkdownTwin,
  type FeedSiteInfo,
  type MachineEntry,
} from "../src/lib/machineOutput";

const site: FeedSiteInfo = {
  title: "Oli Treadwell",
  description: "Notes and writing.",
  url: "https://olitreadwell.github.io/blog",
  authorName: "Oli Treadwell",
};

const postEntry: MachineEntry = {
  kind: "posts",
  slug: "hello-blog",
  title: "Hello blog",
  date: new Date("2026-09-24T00:00:00Z"),
  summary: "A first post.",
  tags: ["meta"],
  path: "/blog/posts/hello-blog/",
  url: "https://olitreadwell.github.io/blog/posts/hello-blog/",
  body: "First line.\n\nSecond paragraph here.",
};

const noteEntry: MachineEntry = {
  kind: "notes",
  slug: "small-note",
  title: "A short note",
  date: new Date("2026-09-25T00:00:00Z"),
  tags: [],
  path: "/blog/notes/small-note/",
  url: "https://olitreadwell.github.io/blog/notes/small-note/",
  body: "Just one line.",
};

const entries = [postEntry, noteEntry];

describe("buildRssItems", () => {
  it("maps each entry to a feed item", () => {
    const items = buildRssItems(entries);

    expect(items).toHaveLength(2);
    expect(items[0]?.link).toBe(postEntry.url);
    expect(items[0]?.pubDate).toEqual(postEntry.date);
    expect(items[1]?.description).toBe("");
  });
});

describe("renderJsonFeed", () => {
  it("declares version 1.1 and includes bodies", () => {
    const feed = renderJsonFeed(entries, site);

    expect(feed.version).toBe("https://jsonfeed.org/version/1.1");
    expect(feed.feed_url).toBe(`${site.url}/feed.json`);
    expect(feed.items[0]?.content_text).toContain("Second paragraph");
    expect(feed.items[0]?._blog.kind).toBe("posts");
  });

  it("leaves tags undefined when an entry has none", () => {
    const feed = renderJsonFeed(entries, site);

    expect(feed.items[1]?.tags).toBeUndefined();
  });
});

describe("renderArchiveIndex", () => {
  it("counts entries and words", () => {
    const index = renderArchiveIndex(entries, site);

    expect(index.count).toBe(2);
    expect(index.entries[0]?.date).toBe("2026-09-24");
    expect(index.entries[0]?.word_count).toBeGreaterThan(0);
    expect(index.entries[0]?.path).toBe("/blog/posts/hello-blog/");
  });
});

describe("renderMarkdownTwin", () => {
  it("writes JSON front matter above the body", () => {
    const twin = renderMarkdownTwin(postEntry);
    const [, frontMatter, body] = twin.split("---");

    expect(JSON.parse(frontMatter ?? "{}").url).toBe(postEntry.url);
    expect(body).toContain("First line.");
  });
});

describe("renderAllMarkdown", () => {
  it("gives every entry a heading", () => {
    const all = renderAllMarkdown(entries, site);

    expect(all.match(/^## /gm)).toHaveLength(2);
    expect(all).toContain(postEntry.url);
    expect(all).toContain(noteEntry.title);
  });
});

describe("renderLlmsTxt", () => {
  it("groups entries by kind and links the machine files", () => {
    const llms = renderLlmsTxt(entries, site);

    expect(llms.startsWith("# Oli Treadwell")).toBe(true);
    expect(llms).toContain("## posts");
    expect(llms).toContain("## notes");
    expect(llms).toContain(`${site.url}/all.md`);
    expect(llms).toContain(`${site.url}/posts.json`);
  });

  it("keeps a note with no summary on one line", () => {
    const llms = renderLlmsTxt(entries, site);

    expect(llms).toContain(`- [A short note](${noteEntry.url}) (2026-09-25)`);
  });
});

describe("countWords", () => {
  it("ignores extra whitespace", () => {
    expect(countWords("one   two\nthree")).toBe(3);
    expect(countWords("")).toBe(0);
  });
});
