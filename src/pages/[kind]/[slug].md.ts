import type { MachineEntry } from "../../lib/machineOutput";
import { toMachineEntries } from "../../lib/machineEntries";
import { renderMarkdownTwin } from "../../lib/machineOutput";
import { loadPublishedStream } from "../../lib/postStream";

// Every entry gets a markdown copy at its own URL with `.md` appended, so an
// agent can fetch one entry without parsing HTML.
export async function getStaticPaths() {
  const entries = toMachineEntries(await loadPublishedStream());

  return entries.map((entry) => ({
    params: { kind: entry.kind, slug: entry.slug },
    props: { entry },
  }));
}

interface EndpointContext {
  props: { entry: MachineEntry };
}

export function GET({ props }: EndpointContext) {
  return new Response(renderMarkdownTwin(props.entry), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
