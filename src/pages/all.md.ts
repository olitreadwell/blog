import { toMachineEntries } from "../lib/machineEntries";
import { renderAllMarkdown } from "../lib/machineOutput";
import { loadPublishedStream } from "../lib/postStream";
import { buildFeedSiteInfo } from "../site.config";

export async function GET() {
  const entries = toMachineEntries(await loadPublishedStream());
  const body = renderAllMarkdown(entries, buildFeedSiteInfo());

  return new Response(body, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
