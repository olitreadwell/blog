import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import { parse as parseYamlDocument } from "yaml";

import { buildPostFrontMatterSchema } from "./postFrontMatter";
import { postCollectionNames, type PostCollectionName } from "./postCollection";
import { slugifyPostEntryId } from "./postSlug";

/** One image attached to a photo entry, as it appears in front matter. */
export interface PostFileImage {
  src: string;
  alt: string;
  caption?: string;
}

/**
 * One markdown entry read straight off disk.
 *
 * The MCP server has no Astro runtime, so it cannot use `postStream.ts` (which
 * imports `astro:content`). It reads `content/<kind>/*.md` itself and validates
 * the front matter with the same schema the build uses, from
 * `buildPostFrontMatterSchema`. Every read tool returns this shape.
 */
export interface PostFileEntry {
  kind: PostCollectionName;
  id: string;
  fileName: string;
  filePath: string;
  date: Date;
  title?: string;
  summary?: string;
  tags: string[];
  draft: boolean;
  canonical?: string;
  url?: string;
  site?: string;
  images?: PostFileImage[];
  body: string;
}

/** The fields every kind can carry once front matter is parsed. */
interface ParsedEntryData {
  title?: string;
  date: Date;
  summary?: string;
  tags: string[];
  draft: boolean;
  canonical?: string;
  url?: string;
  site?: string;
  images?: PostFileImage[];
}

const frontMatterPattern = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*\r?\n?/;

/**
 * Splits a markdown file into its YAML front matter and its body.
 *
 * Returns undefined when the file does not open with a front matter block, so
 * the caller can report the file rather than treating the whole file as a body.
 */
export function splitPostMarkdownSource(
  source: string,
): { frontMatter: string; body: string } | undefined {
  const match = frontMatterPattern.exec(source);
  if (!match) return undefined;
  return { frontMatter: match[1] ?? "", body: source.slice(match[0].length) };
}

/**
 * Parses one markdown file into a `PostFileEntry`.
 *
 * Throws when the front matter is missing or fails the schema. A broken post
 * should be loud: silently dropping it would hide it from list and search.
 */
export function parsePostMarkdownFile(options: {
  kind: PostCollectionName;
  fileName: string;
  filePath: string;
  source: string;
}): PostFileEntry {
  const { kind, fileName, filePath, source } = options;
  const split = splitPostMarkdownSource(source);

  if (!split) {
    throw new Error(`${filePath} has no front matter block`);
  }

  const parsedFrontMatter = parseYamlDocument(split.frontMatter);
  const result = buildPostFrontMatterSchema(kind).safeParse(parsedFrontMatter);

  if (!result.success) {
    throw new Error(`${filePath} has invalid front matter: ${result.error.message}`);
  }

  const data = result.data as ParsedEntryData;

  return {
    kind,
    id: slugifyPostEntryId(fileName),
    fileName,
    filePath,
    date: data.date,
    title: data.title,
    summary: data.summary,
    tags: data.tags,
    draft: data.draft,
    canonical: data.canonical,
    url: data.url,
    site: data.site,
    images: data.images,
    body: split.body,
  };
}

/** Options shared by every read in this module. */
export interface ReadPostEntryOptions {
  /** Directory holding `posts/`, `notes/`, `links/` and `photos/`. */
  contentRoot: string;
  /** Limit the read to some kinds. Defaults to all four. */
  kinds?: readonly PostCollectionName[];
  /** Include `draft: true` entries. Defaults to false, as production does. */
  includeDrafts?: boolean;
}

/**
 * Reads every markdown entry under `contentRoot`, newest first.
 *
 * A missing kind directory is a normal state, not an error: the blog ships with
 * `content/notes/`, `content/links/` and `content/photos/` empty.
 */
export async function loadPostFileEntries(
  options: ReadPostEntryOptions,
): Promise<PostFileEntry[]> {
  const kinds = options.kinds ?? postCollectionNames;
  const loaded = await Promise.all(
    kinds.map((kind) => loadPostKindEntries(options, kind)),
  );

  const entries = loaded.flat();
  const visible = options.includeDrafts
    ? entries
    : entries.filter((entry) => !entry.draft);

  return visible.sort((left, right) => {
    const byDate = right.date.getTime() - left.date.getTime();
    return byDate !== 0 ? byDate : left.id.localeCompare(right.id);
  });
}

/** Reads one entry by slug, searching every kind unless narrowed. */
export async function loadPostFileEntryById(
  options: ReadPostEntryOptions & { id: string },
): Promise<PostFileEntry | undefined> {
  const entries = await loadPostFileEntries(options);
  return entries.find((entry) => entry.id === options.id);
}

async function loadPostKindEntries(
  options: ReadPostEntryOptions,
  kind: PostCollectionName,
): Promise<PostFileEntry[]> {
  const kindDirectory = join(options.contentRoot, kind);
  const fileNames = await readMarkdownFileNames(kindDirectory);

  return Promise.all(
    fileNames.map(async (fileName) => {
      const filePath = join(kindDirectory, fileName);
      const source = await readFile(filePath, "utf8");
      return parsePostMarkdownFile({ kind, fileName, filePath, source });
    }),
  );
}

async function readMarkdownFileNames(directory: string): Promise<string[]> {
  try {
    const directoryEntries = await readdir(directory, { withFileTypes: true });
    return directoryEntries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
      .map((entry) => entry.name)
      .sort();
  } catch (error) {
    if (isMissingDirectoryError(error)) return [];
    throw error;
  }
}

function isMissingDirectoryError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "ENOENT"
  );
}
