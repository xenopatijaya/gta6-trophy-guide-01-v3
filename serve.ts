// Leonida Atlas v3 — tiny local preview server.
//
// Serves the app/ folder over HTTP so the tracker can fetch its data
// file (browsers will not fetch JSON from file:// pages). No routes,
// no logging of request bodies, no network calls of its own: it maps
// each URL path to a file under app/ and answers 404 otherwise.

import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "app");
const port = Number(process.env.PORT ?? 4173);

const contentTypes: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", "http://localhost");
    const wanted = url.pathname === "/" ? "/index.html" : url.pathname;
    const filePath = normalize(join(root, wanted));
    if (!filePath.startsWith(root)) {
      res.writeHead(403).end("Forbidden");
      return;
    }
    const body = await readFile(filePath);
    res.writeHead(200, {
      "content-type": contentTypes[extname(filePath)] ?? "application/octet-stream",
      "cache-control": "no-store",
    });
    res.end(body);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" }).end("Not found");
  }
});

server.listen(port, () => {
  console.log(`Leonida Atlas v3 preview: http://localhost:${port}/`);
});
