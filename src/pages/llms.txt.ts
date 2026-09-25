import { toMachineEntries } from "../lib/machineEntries";
import { renderLlmsTxt } from "../lib/machineOutput";
import { loadPublishedStream } from "../lib/postStream";
import { buildFeedSiteInfo } from "../site.config";

export async function GET() {
  const entries = toMachineEntries(await loadPublishedStream());
  const body = renderLlmsTxt(entries, buildFeedSiteInfo());

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
