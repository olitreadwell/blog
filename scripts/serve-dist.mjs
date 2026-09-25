#!/usr/bin/env node
// Serves dist/ in the foreground for end-to-end tests. Astro's preview command
// detaches from the shell when it is not attached to a terminal, which makes it
// unusable as a Playwright web server, so this stays in the foreground and
// serves the same base path the real host uses.
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const distRoot = fileURLToPath(new URL("../dist/", import.meta.url));
const port = Number(process.env.PORT ?? 4321);
const basePath = process.env.SITE_BASE ?? "/blog";

const contentTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".xml", "application/xml; charset=utf-8"],
  [".txt", "text/plain; charset=utf-8"],
  [".md", "text/markdown; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".ico", "image/x-icon"],
]);

async function resolveFile(urlPath) {
  const relative = decodeURIComponent(urlPath.slice(basePath.length)).replace(/^\/+/, "");
  const candidate = normalize(join(distRoot, relative));

  if (!candidate.startsWith(distRoot)) return undefined;

  try {
    const stats = await stat(candidate);
    if (stats.isDirectory()) {
      const indexFile = join(candidate, "index.html");
      await stat(indexFile);
      return indexFile;
    }
    return candidate;
  } catch {
    return undefined;
  }
}

const server = createServer(async (request, response) => {
  const urlPath = (request.url ?? "/").split("?")[0] ?? "/";

  if (!urlPath.startsWith(basePath)) {
    response.writeHead(302, { Location: `${basePath}/` });
    response.end();
    return;
  }

  const filePath = await resolveFile(urlPath);

  if (!filePath) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("404");
    return;
  }

  response.writeHead(200, {
    "Content-Type": contentTypes.get(extname(filePath)) ?? "application/octet-stream",
  });
  createReadStream(filePath).pipe(response);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`serving dist/ at http://127.0.0.1:${port}${basePath}/`);
});
