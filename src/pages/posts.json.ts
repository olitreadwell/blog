import { toMachineEntries } from "../lib/machineEntries";
import { renderArchiveIndex } from "../lib/machineOutput";
import { loadPublishedStream } from "../lib/postStream";
import { buildFeedSiteInfo } from "../site.config";

export async function GET() {
  const entries = toMachineEntries(await loadPublishedStream());
  const index = renderArchiveIndex(entries, buildFeedSiteInfo());

  return new Response(JSON.stringify(index, null, 2), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
