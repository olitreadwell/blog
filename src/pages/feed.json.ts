import { toMachineEntries } from "../lib/machineEntries";
import { renderJsonFeed } from "../lib/machineOutput";
import { loadPublishedStream } from "../lib/postStream";
import { buildFeedSiteInfo } from "../site.config";

export async function GET() {
  const entries = toMachineEntries(await loadPublishedStream());
  const feed = renderJsonFeed(entries, buildFeedSiteInfo());

  return new Response(JSON.stringify(feed, null, 2), {
    headers: { "Content-Type": "application/feed+json; charset=utf-8" },
  });
}
