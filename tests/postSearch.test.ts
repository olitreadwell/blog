import { describe, expect, it } from "vitest";

import type { PostFileEntry } from "../src/lib/postFileStore";
import { searchPostFileEntries } from "../src/lib/postSearch";

/** Builds an entry with the fields a search test cares about. */
function buildEntry(overrides: Partial<PostFileEntry> & { id: string }): PostFileEntry {
  return {
    kind: "posts",
    fileName: `${overrides.id}.md`,
    filePath: `content/posts/${overrides.id}.md`,
    date: new Date("2024-01-02T00:00:00.000Z"),
    tags: [],
    draft: false,
    body: "",
    ...overrides,
  };
}

describe("searchPostFileEntries", () => {
  it("reports which fields matched", () => {
    const entry = buildEntry({
      id: "about-astro",
      title: "Why I moved to Astro",
      summary: "Notes on a static pipeline.",
      tags: ["astro", "mcp"],
      body: "The build is fast.",
    });

    const [match] = searchPostFileEntries([entry], "astro");

    expect(match?.matchedIn).toEqual(["title", "tags"]);
  });

  it("matches a body-only hit and returns a snippet around it", () => {
    const entry = buildEntry({
      id: "long-post",
      title: "Long post",
      body: `${"filler ".repeat(60)}the paywall runs in Playwright${" filler".repeat(60)}`,
    });

    const [match] = searchPostFileEntries([entry], "playwright");

    expect(match?.matchedIn).toEqual(["body"]);
    expect(match?.snippet).toContain("paywall runs in Playwright");
    expect(match?.snippet.startsWith("...")).toBe(true);
  });

  it("ranks a title hit above a body hit", () => {
    const bodyOnly = buildEntry({
      id: "body-only",
      title: "Nothing",
      body: "mcp appears here",
    });
    const titleHit = buildEntry({
      id: "title-hit",
      title: "MCP first",
      body: "unrelated",
    });

    const matches = searchPostFileEntries([bodyOnly, titleHit], "mcp");

    expect(matches.map((match) => match.entry.id)).toEqual(["title-hit", "body-only"]);
  });

  it("ignores case", () => {
    const entry = buildEntry({ id: "cased", title: "GitHub Actions" });

    expect(searchPostFileEntries([entry], "github")).toHaveLength(1);
  });

  it("returns nothing for an empty query", () => {
    const entry = buildEntry({ id: "anything", title: "Anything" });

    expect(searchPostFileEntries([entry], "   ")).toEqual([]);
  });

  it("respects the limit", () => {
    const entries = Array.from({ length: 5 }, (_, index) =>
      buildEntry({ id: `post-${index}`, title: "Shared word" }),
    );

    expect(searchPostFileEntries(entries, "shared", 2)).toHaveLength(2);
  });

  it("falls back to the summary when only the summary matches", () => {
    const entry = buildEntry({
      id: "summarised",
      title: "Something else",
      summary: "A note about testing.",
    });

    const [match] = searchPostFileEntries([entry], "testing");

    expect(match?.matchedIn).toEqual(["summary"]);
    expect(match?.snippet).toBe("A note about testing.");
  });
});
