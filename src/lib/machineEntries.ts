import type { PostEntry } from "./postStream";
import { buildAbsoluteUrl } from "../site.config";
import { buildEntryPath } from "./postStream";
import type { MachineEntry } from "./machineOutput";

/**
 * Flattens Astro content entries into the plain shape the feed and index
 * builders take. This is the only place that knows about both.
 */
export function toMachineEntries(entries: PostEntry[]): MachineEntry[] {
  return entries.map((entry) => {
    const path = buildEntryPath(entry);

    return {
      kind: entry.collection,
      slug: entry.id,
      title: entry.data.title ?? firstLineOfBody(entry.body),
      date: entry.data.date,
      summary: entry.data.summary,
      tags: entry.data.tags,
      path,
      url: buildAbsoluteUrl(path),
      body: entry.body ?? "",
    };
  });
}

/** Notes have no title, so the first line of the body stands in for one. */
function firstLineOfBody(body: string | undefined): string {
  const line = body?.split("\n").find((candidate) => candidate.trim());
  return line?.trim() ?? "Note";
}
