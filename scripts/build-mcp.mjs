#!/usr/bin/env node
// Bundles the MCP server into mcp/dist/server.js.
//
// The server imports the shared modules in src/lib with extension-less
// specifiers, which Node's ESM resolver rejects, so esbuild inlines our own
// code. Packages stay external and resolve from node_modules at run time.
import { build } from "esbuild";

await build({
  entryPoints: ["mcp/server.ts"],
  outfile: "mcp/dist/server.js",
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  packages: "external",
  logLevel: "info",
});
