import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { validateQuickEdit } from "../scripts/validate-quick-edit.mjs";
import { referencedArticles, resolvePageSeo } from "../.test-server/test-entry.mjs";

const site = JSON.parse(await readFile(new URL("../public/pages.json", import.meta.url), "utf8"));
const schema = JSON.parse(await readFile(new URL("../public/block-schema.json", import.meta.url), "utf8"));

test("the two pilot flows resolve their templates, questions, editing bindings, and destinations", () => {
  assert.deepEqual(validateQuickEdit(site, schema), []);
  assert.deepEqual(schema.quickEdit.flows.map((flow) => flow.title), ["Add Announcement", "Add Reflection"]);
  for (const flow of schema.quickEdit.flows) assert.ok(flow.screens.every((screen) => screen.questions.length <= 3));
});
test("missing or duplicated destination IDs fail pilot validation", () => {
  const broken = structuredClone(site);
  broken.pages._home.content.find((block) => block.id === "home-news").id = "changed";
  assert.ok(validateQuickEdit(broken, schema).some((error) => error.includes("homeNews")));
});
test("a new article with the Quick Edit structure renders in its collection and gets ordinary page SEO", () => {
  const pageId = "news/pilot-article";
  const header = {id: "article-header", type: "Article Header", settings: {}, data: {Collection: {data: {text: "news"}}, Title: {data: {text: "Pilot article"}}, Summary: {data: {text: "A short invitation."}}}};
  const page = {title: "Pilot article", description: "A short invitation.", url: pageId, settings: {showMenu: false, showFooter: true}, content: [header, {id: "article-body", type: "Text Section", data: {Body: {data: {text: "<p>Article writing.</p>"}}}}]};
  const pages = {...site.pages, [pageId]: page};
  const index = structuredClone(site.pages.news.content.find((block) => block.id === "news-index"));
  index.data.Items.data.objects.unshift({id: "new-reference", data: {Page: {data: {target: pageId}}}});
  assert.equal(referencedArticles(index, pages)[0][0], pageId);
  const seo = resolvePageSeo(page, site.settings, "/" + pageId);
  assert.match(seo.title, /Pilot article/);
  assert.equal(seo.description, "A short invitation.");
  assert.equal(seo.canonical, "https://mrcslo.com/news/pilot-article");
  assert.equal(seo.type, "article");
});


test("the one-time importer refuses to erase Quick Edit configuration or editorial content", async () => {
  const root = new URL("../", import.meta.url);
  const before = await readFile(new URL("public/pages.json", root), "utf8");
  const result = spawnSync(process.execPath, ["scripts/generate-content.mjs"], {cwd: root, encoding: "utf8"});
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /one-time import is disabled/);
  assert.equal(await readFile(new URL("public/pages.json", root), "utf8"), before);
});


test("complex articles created in the ordinary Editor remain valid even when a quick binding is ambiguous", () => {
  const edited = structuredClone(site);
  const page = edited.pages["news/renewed-chapel"];
  const body = page.content.find((block) => block.id === "article-body");
  body.id = "ordinary-editor-body";
  page.content.push({...structuredClone(body), id: "additional-body"});
  assert.deepEqual(validateQuickEdit(edited, schema), []);
});
