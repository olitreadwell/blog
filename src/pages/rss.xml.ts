import rss from "@astrojs/rss";

import { toMachineEntries } from "../lib/machineEntries";
import { buildRssItems } from "../lib/machineOutput";
import { loadPublishedStream } from "../lib/postStream";
import { siteConfig } from "../site.config";

export async function GET(context: { site: URL | undefined }) {
  const entries = toMachineEntries(await loadPublishedStream());

  return rss({
    title: siteConfig.title,
    description: siteConfig.description,
    site: context.site ?? siteConfig.url,
    items: buildRssItems(entries),
    customData: "<language>en-nz</language>",
  });
}
