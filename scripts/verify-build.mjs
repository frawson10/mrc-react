import { readFile, access } from "node:fs/promises";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const site = JSON.parse(
  await readFile(join(root, "public/pages.json"), "utf8"),
);
const info = JSON.parse(
  await readFile(join(root, "dist/build-info.json"), "utf8"),
);
assert.equal(
  info.target,
  "production",
  "Run a production build before verifying it",
);
const server = spawn(process.execPath, ["server.js"], {
  cwd: root,
  env: { ...process.env, HOST: "127.0.0.1", PORT: "5180" },
  stdio: ["ignore", "pipe", "inherit"],
});
await new Promise((done, reject) => {
  const timeout = setTimeout(
    () => reject(new Error("Verification server did not start")),
    10000,
  );
  server.stdout.once("data", () => {
    clearTimeout(timeout);
    done();
  });
  server.once("exit", (code) => {
    clearTimeout(timeout);
    reject(new Error(`Server exited: ${code}`));
  });
});
const base = "http://127.0.0.1:5180";
const documents = new Map();
try {
  for (const [key] of Object.entries(site.pages)) {
    const path = key === "_home" ? "/" : `/${key}`;
    const response = await fetch(base + path);
    assert.equal(response.status, 200, path);
    const doc = new JSDOM(await response.text()).window.document;
    documents.set(path, doc);
    assert.equal(
      doc.querySelectorAll("h1").length,
      1,
      `${path} has one page heading`,
    );
    assert.ok(
      doc.querySelector("h1").textContent.trim(),
      `${path} has heading text`,
    );
    assert.equal(
      doc.querySelectorAll('meta[name="description"]').length,
      1,
      `${path} has one description`,
    );
    assert.ok(
      doc
        .querySelector('link[rel="canonical"]')
        .href.startsWith("https://mrcslo.com/"),
    );
    assert.ok(doc.querySelector("#site-structured-data"));
    assert.equal(
      doc.querySelector('[src=""]'),
      null,
      `${path} has no empty image requests`,
    );
    for (const image of doc.querySelectorAll('img[src^="/"]'))
      await access(
        join(root, "dist", decodeURIComponent(image.getAttribute("src"))),
      );
  }
  const operational = new Set([
    "/admin",
    "/reservation/confirm",
    "/cancel-reservation",
  ]);
  for (const [path, doc] of documents)
    for (const link of doc.querySelectorAll("a[href]")) {
      const href = link.getAttribute("href");
      if (!href.startsWith("/") && !href.startsWith("#")) continue;
      const url = new URL(href, base + path);
      const target = documents.get(url.pathname.replace(/\/$/, "") || "/");
      assert.ok(
        target || operational.has(url.pathname),
        `Internal link ${path} → ${href} resolves`,
      );
      if (target && url.hash)
        assert.ok(
          target.getElementById(decodeURIComponent(url.hash.slice(1))),
          `Anchor ${path} → ${href} exists`,
        );
    }
  const redirect = await fetch(
    base + "/retreat-opportunities?checkout=cancelled&branch=draft",
    { redirect: "manual" },
  );
  assert.equal(redirect.status, 308);
  assert.equal(
    redirect.headers.get("location"),
    "/retreats?checkout=cancelled&branch=draft",
  );
  for (const path of operational) {
    const response = await fetch(base + path);
    assert.match(response.headers.get("x-robots-tag"), /noindex/);
    assert.match(await response.text(), /noindex, nofollow/);
  }
  assert.equal((await fetch(base + "/this-page-does-not-exist")).status, 404);
  assert.equal((await fetch(base + "/missing-asset.png")).status, 404);
  const sitemap = await readFile(join(root, "dist/sitemap.xml"), "utf8");
  assert.equal(
    (sitemap.match(/<loc>/g) || []).length,
    Object.keys(site.pages).length,
  );
  assert.doesNotMatch(
    sitemap,
    /cancel-reservation|reservation\/confirm|\/admin/,
  );
  console.log(
    `Production verified: ${documents.size} routes, internal links and anchors, image files, metadata, sitemap, legacy checkout redirect, private-route indexing, and 404 responses.`,
  );
} finally {
  server.kill("SIGTERM");
}
