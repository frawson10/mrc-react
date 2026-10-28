import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  normalizeSiteData,
  getPageByPath,
  blockRegistry,
  referencedArticles,
  resolvePageSeo,
} from "../.test-server/test-entry.mjs";
const site = JSON.parse(
  await readFile(new URL("../public/pages.json", import.meta.url), "utf8"),
);
const schema = JSON.parse(
  await readFile(
    new URL("../public/block-schema.json", import.meta.url),
    "utf8",
  ),
);
test("every Eidos schema block has a concrete React renderer", () =>
  assert.deepEqual(
    Object.keys(blockRegistry).sort(),
    schema.blocks.map((block) => block.label).sort(),
  ));
test("media refs normalize recursively, retaining Eidos nested shape", () => {
  const result = normalizeSiteData({
    settings: {},
    pages: {
      _home: {
        content: [
          {
            type: "Image",
            data: {
              Image: {
                data: {
                  file: { url: "https://example.test/photo.jpg", assetId: "a" },
                },
              },
            },
          },
        ],
      },
    },
  });
  assert.equal(
    result.pages._home.content[0].data.Image.data.file,
    "https://example.test/photo.jpg",
  );
});
test("page navigation supports home and nested article keys", () => {
  assert.equal(getPageByPath(site.pages, "/").title, "Home");
  assert.equal(
    getPageByPath(site.pages, "/reflections/labyrinth-peace-walk/").title,
    "Walking Together in Peace",
  );
});
test("all selected mockup entries are independently editable article pages", () => {
  const articles = Object.entries(site.pages).filter(([, page]) =>
    page.content.some((block) => block.type === "Article Header"),
  );
  assert.equal(articles.length, 21);
  assert.equal(
    articles.filter(([key]) => key.startsWith("reflections/")).length,
    13,
  );
  assert.equal(articles.filter(([key]) => key.startsWith("news/")).length, 8);
});
test("index preserves ordered references and includes newly created article pages", () => {
  const index = site.pages.reflections.content.find(
    (block) => block.type === "Article Index",
  );
  const added = {
    ...site.pages,
    "new-reflection": {
      title: "New",
      content: [
        {
          type: "Article Header",
          data: { Collection: { data: { text: "reflections" } } },
        },
      ],
    },
  };
  const entries = referencedArticles(index, added);
  assert.equal(entries.length, 14);
  assert.equal(entries.at(-1)[0], "new-reflection");
});
test("preview, operational, and explicitly excluded pages never index", () => {
  const settings = site.settings;
  assert.match(
    resolvePageSeo(site.pages._home, settings, "/", true).robots,
    /noindex/,
  );
  assert.match(
    resolvePageSeo(null, settings, "/reservation/confirm", false, true).robots,
    /noindex/,
  );
  assert.equal(
    resolvePageSeo(
      { title: "Draft", seo: { robots: { index: false } } },
      settings,
      "/draft",
    ).excludeFromSitemap,
    true,
  );
});
test("managed reservations have no editable payment or availability fields", () => {
  const managed = schema.blocks.find(
    (block) => block.label === "Suite Reservations",
  );
  assert.equal(managed.kind, "managed");
  assert.equal((managed.children || []).length, 0);
  const serialized = JSON.stringify(
    site.pages.retreats.content.find(
      (block) => block.type === "Suite Reservations",
    ),
  );
  assert.doesNotMatch(
    serialized,
    /holdToken|depositAmount|blockedDates|publicReservationsPaused/,
  );
});
