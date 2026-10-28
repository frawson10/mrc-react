import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { resolve, dirname, join, extname } from "node:path";
import { fileURLToPath } from "node:url";
const root = join(dirname(fileURLToPath(import.meta.url)), "dist");
const info = JSON.parse(await readFile(join(root, "build-info.json"), "utf8"));
const testing = info.target === "testing";
const aliases = {
  "/our-ministry": "/community",
  "/announcements": "/news",
  "/support-us": "/support",
  "/retreat-opportunities": "/retreats",
  "/restorative-partners": "/partners",
  "/index.html": "/",
  "/visit.html": "/visit",
  "/retreats.html": "/retreats",
  "/community.html": "/community",
  "/reflections.html": "/reflections",
  "/news.html": "/news",
  "/support.html": "/support",
  "/contact.html": "/contact",
  "/partners.html": "/partners",
};
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};
async function exists(path) {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}
const server = createServer(async (request, response) => {
  try {
    if (!["GET", "HEAD"].includes(request.method)) {
      response.writeHead(405, { Allow: "GET, HEAD" });
      response.end();
      return;
    }
    const url = new URL(request.url || "/", "http://localhost");
    const path = decodeURIComponent(url.pathname).replace(/\/$/, "") || "/";
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader(
      "Referrer-Policy",
      /^\/(admin|reservation|cancel-reservation)/.test(path)
        ? "no-referrer"
        : "strict-origin-when-cross-origin",
    );
    if (testing || /^\/(admin|reservation|cancel-reservation)/.test(path))
      response.setHeader("X-Robots-Tag", "noindex, nofollow");
    let redirect = aliases[path];
    if (path === "/article.html") {
      const id = url.searchParams.get("id");
      if (id && /^[a-z0-9-]+$/.test(id)) {
        redirect = `/${url.searchParams.get("kind") === "news" ? "news" : "reflections"}/${id}`;
        url.searchParams.delete("kind");
        url.searchParams.delete("id");
      }
    }
    if (redirect) {
      response.writeHead(308, {
        Location: `${redirect}${url.searchParams.size ? `?${url.searchParams}` : ""}`,
      });
      response.end();
      return;
    }
    if (
      path.split("/").some((segment) => segment.startsWith(".")) ||
      path.includes("\0")
    ) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }
    const candidate = resolve(root, `.${path}`);
    if (candidate !== root && !candidate.startsWith(root + "/")) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }
    let file = (await exists(candidate))
      ? candidate
      : (await exists(join(candidate, "index.html")))
        ? join(candidate, "index.html")
        : null;
    let status = 200;
    if (!file) {
      if (testing && !extname(path)) file = join(root, "index.html");
      else {
        status = 404;
        file = extname(path) ? null : join(root, "404.html");
      }
    }
    if (!file) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }
    const extension = extname(file);
    response.setHeader(
      "Content-Type",
      types[extension] || "application/octet-stream",
    );
    response.setHeader(
      "Cache-Control",
      extension === ".html"
        ? "no-cache, max-age=0, must-revalidate"
        : /-[a-zA-Z0-9_-]{8,}\./.test(file)
          ? "public, max-age=31536000, immutable"
          : "public, max-age=300, must-revalidate",
    );
    response.writeHead(status);
    if (request.method === "HEAD") response.end();
    else
      createReadStream(file)
        .on("error", () => response.destroy())
        .pipe(response);
  } catch {
    response.writeHead(400);
    response.end("Invalid request");
  }
});
const host = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT || 8080);
server.listen(port, host, () =>
  console.log(`Monastery of the Risen Christ: http://${host}:${port}`),
);
