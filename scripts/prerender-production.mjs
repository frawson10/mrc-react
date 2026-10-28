import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "vite";
import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const testing = process.env.VITE_SITE_BUILD_TARGET === "testing";
await writeFile(
  join(dist, "build-info.json"),
  JSON.stringify({ target: testing ? "testing" : "production" }),
);
if (testing) {
  const html = await readFile(join(dist, "index.html"), "utf8");
  await writeFile(
    join(dist, "index.html"),
    html.replace(
      "</head>",
      '<meta name="robots" content="noindex, nofollow"></head>',
    ),
  );
  await writeFile(join(dist, "robots.txt"), "User-agent: *\nDisallow: /\n");
  await writeFile(
    join(dist, "sitemap.xml"),
    '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>',
  );
  console.log("Testing build: dynamic Eidos previews; indexing disabled.");
  process.exit(0);
}
const window = new JSDOM("").window;
const purifier = createDOMPurify(window);
globalThis.__MRC_SANITIZE_HTML__ = (html) =>
  purifier.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ["target"],
    FORBID_TAGS: ["style", "iframe", "form", "input", "button"],
  });
await build({
  root,
  build: {
    ssr: "src/entry-server.tsx",
    outDir: ".prerender-server",
    emptyOutDir: true,
  },
});
const { createBundledPayload, renderRoute, resolvePageSeo } = await import(
  pathToFileURL(join(root, ".prerender-server/entry-server.js")).href
);
const raw = JSON.parse(await readFile(join(root, "public/pages.json"), "utf8"));
const payload = createBundledPayload(raw);
const template = await readFile(join(dist, "index.html"), "utf8");
const escape = (value) =>
  String(value || "").replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
const serialize = (value) =>
  JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
const routes = Object.keys(payload.siteData.pages).map((key) =>
  key === "_home" ? "/" : `/${key}`,
);
const operational = ["/admin", "/reservation/confirm", "/cancel-reservation"];
const sitemap = [];
for (const path of [...routes, ...operational, "/404"]) {
  const page =
    payload.siteData.pages[path === "/" ? "_home" : path.slice(1)] || null;
  const seo = resolvePageSeo(
    page,
    payload.siteData.settings,
    path,
    false,
    operational.includes(path),
  );
  const head =
    `<title>${escape(seo.title)}</title><meta name="description" content="${escape(seo.description)}"><meta name="robots" content="${seo.robots}"><link rel="canonical" href="${escape(seo.canonical)}">` +
    Object.entries({
      title: seo.ogTitle,
      description: seo.ogDescription,
      url: seo.canonical,
      image: seo.image,
      site_name: seo.siteName,
      type: seo.type,
    })
      .map(
        ([key, value]) =>
          `<meta property="og:${key}" content="${escape(value)}">`,
      )
      .join("") +
    Object.entries({
      card: seo.image ? "summary_large_image" : "summary",
      title: seo.ogTitle,
      description: seo.ogDescription,
      image: seo.image,
    })
      .map(
        ([key, value]) =>
          `<meta name="twitter:${key}" content="${escape(value)}">`,
      )
      .join("") +
    `<script id="site-structured-data" type="application/ld+json">${serialize(seo.structuredData)}</script>`;
  const html = template
    .replace(/<title>[\s\S]*?<\/title>/, head)
    .replace(/<meta name="description"[^>]+\/>/, "")
    .replace(
      '<div id="root"></div>',
      `<div id="root">${renderRoute(path, payload)}</div><script>window.__MRC_INITIAL_SITE_DATA__=${serialize(payload)};</script>`,
    );
  const output =
    path === "/"
      ? join(dist, "index.html")
      : path === "/404"
        ? join(dist, "404.html")
        : join(dist, path.slice(1), "index.html");
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, html);
  if (page && !seo.excludeFromSitemap) sitemap.push(seo.canonical);
}
await writeFile(
  join(dist, "route-manifest.json"),
  JSON.stringify([...routes, ...operational]),
);
await writeFile(
  join(dist, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemap.map((url) => `<url><loc>${escape(url)}</loc></url>`).join("")}</urlset>\n`,
);
const siteUrl = raw.settings?.seo?.siteUrl || "https://mrcslo.com";
await writeFile(
  join(dist, "robots.txt"),
  `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /reservation/\nDisallow: /cancel-reservation\nSitemap: ${siteUrl.replace(/\/$/, "")}/sitemap.xml\n`,
);
window.close();
console.log(
  `Prerendered ${routes.length} content pages and ${operational.length} reservation routes; sitemap and metadata generated.`,
);
