import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  loadPostFileEntries,
  loadPostFileEntryById,
  parsePostMarkdownFile,
  splitPostMarkdownSource,
} from "../src/lib/postFileStore";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));

/** Writes markdown files into a throwaway content directory. */
async function createContentFixture(files: Record<string, string>): Promise<string> {
  const contentRoot = await mkdtemp(join(tmpdir(), "blog-content-"));

  for (const [relativePath, source] of Object.entries(files)) {
    const filePath = join(contentRoot, relativePath);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, source, "utf8");
  }

  return contentRoot;
}

const firstPost = `---
title: "First post"
date: 2024-01-02
tags: [alpha]
---

Body of the first post.
`;

const secondPost = `---
title: "Second post"
date: 2024-03-04
tags: [beta]
---

Body of the second post.
`;

const draftPost = `---
title: "Unfinished"
date: 2024-05-06
draft: true
---

Not published yet.
`;

describe("splitPostMarkdownSource", () => {
  it("splits the front matter from the body", () => {
    const split = splitPostMarkdownSource(firstPost);

    expect(split?.frontMatter).toContain('title: "First post"');
    expect(split?.body.trim()).toBe("Body of the first post.");
  });

  it("returns undefined when the file has no front matter", () => {
    expect(splitPostMarkdownSource("Just a body.")).toBeUndefined();
  });
});

describe("parsePostMarkdownFile", () => {
  it("derives the id from the filename, not the title", () => {
    const entry = parsePostMarkdownFile({
      kind: "posts",
      fileName: "2024-01-02-first-post.md",
      filePath: "content/posts/2024-01-02-first-post.md",
      source: firstPost,
    });

    expect(entry.id).toBe("first-post");
    expect(entry.kind).toBe("posts");
    expect(entry.tags).toEqual(["alpha"]);
    expect(entry.draft).toBe(false);
    expect(entry.date.toISOString()).toBe("2024-01-02T00:00:00.000Z");
  });

  it("rejects a file with no front matter block", () => {
    expect(() =>
      parsePostMarkdownFile({
        kind: "posts",
        fileName: "2024-01-02-bare.md",
        filePath: "content/posts/2024-01-02-bare.md",
        source: "No front matter here.",
      }),
    ).toThrow(/no front matter block/);
  });

  it("rejects front matter that fails the schema", () => {
    expect(() =>
      parsePostMarkdownFile({
        kind: "posts",
        fileName: "2024-01-02-undated.md",
        filePath: "content/posts/2024-01-02-undated.md",
        source: '---\ntitle: "Undated"\n---\n\nNo date.\n',
      }),
    ).toThrow(/invalid front matter/);
  });

  it("requires a title for posts but not for notes", () => {
    expect(() =>
      parsePostMarkdownFile({
        kind: "posts",
        fileName: "2024-01-02-no-title.md",
        filePath: "content/posts/2024-01-02-no-title.md",
        source: "---\ndate: 2024-01-02\n---\n\nBody.\n",
      }),
    ).toThrow(/invalid front matter/);

    const note = parsePostMarkdownFile({
      kind: "notes",
      fileName: "2024-01-02-a-thought.md",
      filePath: "content/notes/2024-01-02-a-thought.md",
      source: "---\ndate: 2024-01-02\n---\n\nA thought.\n",
    });

    expect(note.title).toBeUndefined();
  });
});

describe("loadPostFileEntries", () => {
  it("sorts newest first and hides drafts by default", async () => {
    const contentRoot = await createContentFixture({
      "posts/2024-01-02-first-post.md": firstPost,
      "posts/2024-03-04-second-post.md": secondPost,
      "posts/2024-05-06-unfinished.md": draftPost,
    });

    const entries = await loadPostFileEntries({ contentRoot });

    expect(entries.map((entry) => entry.id)).toEqual(["second-post", "first-post"]);
  });

  it("includes drafts when asked", async () => {
    const contentRoot = await createContentFixture({
      "posts/2024-01-02-first-post.md": firstPost,
      "posts/2024-05-06-unfinished.md": draftPost,
    });

    const entries = await loadPostFileEntries({ contentRoot, includeDrafts: true });

    expect(entries.map((entry) => entry.id)).toEqual(["unfinished", "first-post"]);
  });

  it("narrows to one kind", async () => {
    const contentRoot = await createContentFixture({
      "posts/2024-01-02-first-post.md": firstPost,
      "notes/2024-02-03-a-thought.md": "---\ndate: 2024-02-03\n---\n\nA thought.\n",
    });

    const entries = await loadPostFileEntries({ contentRoot, kinds: ["notes"] });

    expect(entries.map((entry) => entry.id)).toEqual(["a-thought"]);
  });

  it("treats an empty or missing collection as an empty list", async () => {
    const contentRoot = await createContentFixture({ "notes/.keep": "" });

    await expect(loadPostFileEntries({ contentRoot })).resolves.toEqual([]);
  });

  it("finds an entry by slug", async () => {
    const contentRoot = await createContentFixture({
      "posts/2024-01-02-first-post.md": firstPost,
    });

    const entry = await loadPostFileEntryById({ contentRoot, id: "first-post" });

    expect(entry?.fileName).toBe("2024-01-02-first-post.md");
  });

  it("returns undefined for an unknown slug", async () => {
    const contentRoot = await createContentFixture({
      "posts/2024-01-02-first-post.md": firstPost,
    });

    await expect(
      loadPostFileEntryById({ contentRoot, id: "not-here" }),
    ).resolves.toBeUndefined();
  });
});

describe("the real content directory", () => {
  it("parses every entry the blog ships with, with unique ids", async () => {
    const entries = await loadPostFileEntries({
      contentRoot: join(repoRoot, "content"),
      includeDrafts: true,
    });

    expect(entries.length).toBeGreaterThan(0);
    expect(new Set(entries.map((entry) => entry.id)).size).toBe(entries.length);
    expect(entries.every((entry) => entry.fileName.endsWith(".md"))).toBe(true);
    expect(entries.every((entry) => entry.body.trim().length > 0)).toBe(true);
  });
});
