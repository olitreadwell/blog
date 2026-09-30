#!/usr/bin/env node
// Talks to the built MCP server over stdio the way Codex does, so a broken
// tool schema or a bad content read fails the gate instead of a live session.
import { fileURLToPath } from "node:url";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

/** Reads the JSON payload every blog tool returns as its only text block. */
function readToolJson(result, label) {
  const text = result.content?.find((block) => block.type === "text")?.text;
  if (typeof text !== "string") {
    failures.push(`${label} returned no text block`);
    return undefined;
  }

  try {
    return JSON.parse(text);
  } catch {
    if (result.isError) return { error: text };
    failures.push(`${label} did not return JSON`);
    return undefined;
  }
}

const transport = new StdioClientTransport({
  command: process.execPath,
  args: ["mcp/dist/server.js"],
  cwd: repoRoot,
  stderr: "inherit",
});

const client = new Client({ name: "blog-smoke", version: "0.1.0" });
await client.connect(transport);

const { tools } = await client.listTools();
const toolNames = tools.map((tool) => tool.name);
for (const expected of ["blog_list_posts", "blog_get_post", "blog_search_posts"]) {
  check(toolNames.includes(expected), `tool is missing: ${expected}`);
}
for (const tool of tools) {
  check(Boolean(tool.inputSchema), `${tool.name} has no input schema`);
}

const listed = readToolJson(
  await client.callTool({ name: "blog_list_posts", arguments: { limit: 5 } }),
  "blog_list_posts",
);
check(Array.isArray(listed?.posts), "blog_list_posts returned no posts array");
check(listed?.posts?.length > 0, "blog_list_posts returned nothing from content/posts");
check(
  listed?.posts?.every((post) => !post.draft),
  "blog_list_posts returned a draft without include_drafts",
);
check(
  listed?.posts?.every((post) => post.path.startsWith("/blog/")),
  "blog_list_posts returned a path without the /blog base",
);

const withDrafts = readToolJson(
  await client.callTool({
    name: "blog_list_posts",
    arguments: { limit: 500, include_drafts: true },
  }),
  "blog_list_posts include_drafts",
);
check(
  withDrafts?.posts?.some((post) => post.draft) &&
    withDrafts.posts.length > (listed?.posts?.length ?? 0),
  "include_drafts did not surface the drafts",
);

const notes = readToolJson(
  await client.callTool({ name: "blog_list_posts", arguments: { kind: "notes" } }),
  "blog_list_posts kind=notes",
);
check(notes?.posts?.length === 0, "blog_list_posts kind=notes should be empty");

const firstId = listed?.posts?.[0]?.id;
const fetched = readToolJson(
  await client.callTool({ name: "blog_get_post", arguments: { slug: firstId } }),
  "blog_get_post",
);
check(fetched?.id === firstId, "blog_get_post returned a different entry");
check(
  typeof fetched?.body === "string" && fetched.body.length > 0,
  "blog_get_post has no body",
);
check(
  fetched?.path === listed?.posts?.[0]?.path,
  "blog_get_post path differs from the list path",
);

const missing = await client.callTool({
  name: "blog_get_post",
  arguments: { slug: "no-such-entry-anywhere" },
});
check(missing.isError === true, "blog_get_post did not error on an unknown slug");

const searched = readToolJson(
  await client.callTool({ name: "blog_search_posts", arguments: { query: "the" } }),
  "blog_search_posts",
);
check(searched?.matches?.length > 0, "blog_search_posts found nothing for a common word");
check(
  searched?.matches?.every((match) => match.matched_in.length > 0),
  "blog_search_posts returned a match with no matched_in field",
);

const noMatches = readToolJson(
  await client.callTool({
    name: "blog_search_posts",
    arguments: { query: "zzzzzzzznotpresent" },
  }),
  "blog_search_posts no match",
);
check(noMatches?.count === 0, "blog_search_posts matched a nonsense query");

await client.close();

if (failures.length > 0) {
  console.error(`MCP smoke check failed with ${failures.length} problem(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `MCP smoke check passed: ${toolNames.length} tools, ${listed?.posts?.length} posts listed, search and get answered`,
);
