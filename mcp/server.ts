import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "astro/zod";

import { blogBasePath } from "../src/lib/blogSite";
import { buildEntryAbsoluteUrl, buildEntrySitePath } from "../src/lib/entrySitePath";
import { formatEntryDateMachine } from "../src/lib/formatEntryDate";
import { countWords } from "../src/lib/machineOutput";
import { postCollectionNames, type PostCollectionName } from "../src/lib/postCollection";
import { loadPostFileEntries, loadPostFileEntryById } from "../src/lib/postFileStore";
import type { PostFileEntry } from "../src/lib/postFileStore";
import { searchPostFileEntries } from "../src/lib/postSearch";

/**
 * Resolves the blog repo root.
 *
 * The build writes `mcp/dist/server.js`, so the root sits two levels up. Set
 * `BLOG_REPO_ROOT` when running the server from somewhere else.
 */
function resolveBlogRepoRoot(): string {
  const override = process.env.BLOG_REPO_ROOT;
  if (override) return resolve(override);

  const serverDirectory = fileURLToPath(new URL(".", import.meta.url));
  const candidate = resolve(serverDirectory, "..", "..");

  if (!existsSync(join(candidate, "content"))) {
    throw new Error(
      `No content/ directory beside ${candidate}. Set BLOG_REPO_ROOT to the blog repo root.`,
    );
  }

  return candidate;
}

const repoRoot = resolveBlogRepoRoot();
const contentRoot = join(repoRoot, "content");
const siteBase = process.env.BLOG_SITE_BASE ?? blogBasePath;

/** The list shape every tool returns. Bodies are only in `blog_get_post`. */
function buildPostSummary(entry: PostFileEntry) {
  const sitePath = buildEntrySitePath(
    { directory: entry.kind, id: entry.id, date: entry.date },
    siteBase,
  );

  return {
    id: entry.id,
    kind: entry.kind,
    title: entry.title ?? firstLineOfBody(entry.body),
    date: formatEntryDateMachine(entry.date),
    summary: entry.summary ?? null,
    tags: entry.tags,
    draft: entry.draft,
    path: sitePath,
    url: buildEntryAbsoluteUrl(sitePath),
    file: relativeToRepo(entry.filePath),
    word_count: countWords(entry.body),
  };
}

function buildPostDetail(entry: PostFileEntry) {
  const summary = buildPostSummary(entry);
  return {
    ...summary,
    ...(entry.url ? { link_url: entry.url } : {}),
    ...(entry.site ? { link_site: entry.site } : {}),
    ...(entry.canonical ? { canonical: entry.canonical } : {}),
    ...(entry.images ? { images: entry.images } : {}),
    body: entry.body.trim(),
  };
}

function firstLineOfBody(body: string): string {
  const line = body.split("\n").find((candidate) => candidate.trim());
  return line?.trim() ?? "Untitled";
}

function relativeToRepo(filePath: string): string {
  return filePath.startsWith(`${repoRoot}/`)
    ? filePath.slice(repoRoot.length + 1)
    : filePath;
}

/** Every tool answers with JSON text, so an agent can read or parse it. */
function respond(payload: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }] };
}

function fail(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

const kindSchema = z.enum(postCollectionNames);

const server = new McpServer(
  { name: "blog", version: "0.1.0" },
  {
    instructions:
      "Read and write Oli's blog at ~/code/blog. Posts are his writing: draft and tidy freely, never publish invented content, and never send a cross-post.",
  },
);

server.registerTool(
  "blog_list_posts",
  {
    title: "List blog posts",
    description:
      "Lists blog entries newest first. Filter by kind (posts, notes, links, photos) or tag. " +
      "Drafts are hidden unless include_drafts is true.",
    inputSchema: {
      kind: kindSchema.optional().describe("Only this kind. Defaults to all four."),
      tag: z.string().optional().describe("Only entries carrying this tag."),
      limit: z.number().int().positive().max(500).optional().describe("Default 50."),
      include_drafts: z
        .boolean()
        .optional()
        .describe("Include draft entries. Default false."),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ kind, tag, limit, include_drafts }) => {
    const entries = await loadPostFileEntries({
      contentRoot,
      kinds: kind ? [kind as PostCollectionName] : undefined,
      includeDrafts: include_drafts ?? false,
    });

    const wanted = tag
      ? entries.filter((entry) =>
          entry.tags.some((entryTag) => entryTag.toLowerCase() === tag.toLowerCase()),
        )
      : entries;
    const visible = wanted.slice(0, limit ?? 50);

    return respond({
      count: visible.length,
      total_matching: wanted.length,
      content_root: relativeToRepo(contentRoot),
      posts: visible.map(buildPostSummary),
    });
  },
);

server.registerTool(
  "blog_get_post",
  {
    title: "Get one blog post",
    description:
      "Returns one entry in full, including its markdown body. Look it up by slug (the filename " +
      "without the date prefix). Drafts need include_drafts.",
    inputSchema: {
      slug: z.string().min(1).describe("Entry id, for example conde-nast-paywall-e2e."),
      kind: kindSchema.optional().describe("Narrow the lookup to one kind."),
      include_drafts: z
        .boolean()
        .optional()
        .describe("Allow a draft entry. Default false."),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ slug, kind, include_drafts }) => {
    const entry = await loadPostFileEntryById({
      contentRoot,
      id: slug,
      kinds: kind ? [kind as PostCollectionName] : undefined,
      includeDrafts: include_drafts ?? false,
    });

    if (!entry) {
      return fail(
        `No entry with slug "${slug}".${include_drafts ? "" : " If it is a draft, pass include_drafts: true."}`,
      );
    }

    return respond(buildPostDetail(entry));
  },
);

server.registerTool(
  "blog_search_posts",
  {
    title: "Search blog posts",
    description:
      "Searches entry titles, summaries, tags and bodies, case-insensitively. Title hits rank " +
      "above tags, tags above summaries, summaries above body text.",
    inputSchema: {
      query: z.string().min(1).describe("Text to look for."),
      limit: z.number().int().positive().max(200).optional().describe("Default 20."),
      include_drafts: z
        .boolean()
        .optional()
        .describe("Include draft entries. Default false."),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ query, limit, include_drafts }) => {
    const entries = await loadPostFileEntries({
      contentRoot,
      includeDrafts: include_drafts ?? false,
    });
    const matches = searchPostFileEntries(entries, query, limit ?? 20);

    return respond({
      query,
      count: matches.length,
      matches: matches.map((match) => ({
        ...buildPostSummary(match.entry),
        matched_in: match.matchedIn,
        snippet: match.snippet,
      })),
    });
  },
);

await server.connect(new StdioServerTransport());
