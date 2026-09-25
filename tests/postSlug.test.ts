import { describe, expect, it } from "vitest";

import { slugifyPostEntryId } from "../src/lib/postSlug";

describe("slugifyPostEntryId", () => {
  it("strips the date prefix and the extension", () => {
    expect(slugifyPostEntryId("2026-09-24-a-blog-i-own.md")).toBe("a-blog-i-own");
  });

  it("keeps a filename that has no date prefix", () => {
    expect(slugifyPostEntryId("small-notes.md")).toBe("small-notes");
  });

  it("lowercases and collapses separators", () => {
    expect(slugifyPostEntryId("2026-09-24_Notes On MCP.md")).toBe("notes-on-mcp");
  });

  it("drops a directory part", () => {
    expect(slugifyPostEntryId("drafts/2026-09-24-tested.md")).toBe("tested");
  });

  it("handles mdx files", () => {
    expect(slugifyPostEntryId("2026-09-24-mdx-post.mdx")).toBe("mdx-post");
  });

  it("trims leading and trailing separators", () => {
    expect(slugifyPostEntryId("2026-09-24-draft!")).toBe("draft");
  });
});
