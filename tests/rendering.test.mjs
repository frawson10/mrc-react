import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import {
  createBundledPayload,
  renderRoute,
} from "../.test-server/test-entry.mjs";
const source = JSON.parse(
  await readFile(new URL("../public/pages.json", import.meta.url), "utf8"),
);
const blockSchema = JSON.parse(
  await readFile(
    new URL("../public/block-schema.json", import.meta.url),
    "utf8",
  ),
);
const window = new JSDOM("").window;
const purifier = createDOMPurify(window);
globalThis.__MRC_SANITIZE_HTML__ = (html) =>
  purifier.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ["target"],
    FORBID_TAGS: ["style", "iframe", "form", "input", "button"],
  });
function render(path, data = source) {
  return new JSDOM(renderRoute(path, createBundledPayload(data))).window
    .document;
}
test("all supplied FAQ questions and answers render from the actual schema fields", () => {
  for (const key of ["visit", "retreats"]) {
    const doc = render(`/${key}`);
    const faq = source.pages[key].content.find(
      (block) => block.type === "FAQ Section",
    );
    for (const item of faq.data.Items.data.objects) {
      assert.ok(doc.body.textContent.includes(item.data.Question.data.text));
      const answer = new JSDOM(item.data.Answer.data.text).window.document.body
        .textContent;
      assert.ok(doc.body.textContent.includes(answer));
    }
    assert.ok(
      [...doc.querySelectorAll("summary")].every((item) =>
        item.textContent.trim(),
      ),
    );
  }
});
test("Quill-edited article metadata renders correctly in cards and detail pages", () => {
  const data = structuredClone(source);
  const header = data.pages["reflections/romuald-hope"].content[0];
  header.data.Title.data.text = "<p>A <em>new</em> title &amp; hope</p>";
  header.data.Summary.data.text =
    "<p>An <strong>edited</strong> introduction.</p>";
  const index = render("/reflections", data);
  assert.ok(index.body.textContent.includes("A new title & hope"));
  assert.ok(index.body.textContent.includes("An edited introduction."));
  assert.equal(
    index.querySelector(".library-entry").textContent.includes("<p>"),
    false,
  );
  const detail = render("/reflections/romuald-hope", data);
  assert.equal(detail.querySelector("h1").textContent, "A new title & hope");
  assert.equal(
    detail.querySelector(".article-intro strong").textContent,
    "edited",
  );
});
test("rich text is sanitized in prerendered output too", () => {
  const data = structuredClone(source);
  data.pages.partners.content[1].data.Body.data.text =
    '<p>Welcome</p><img src="x" onerror="alert(1)"><script>alert(1)</script><a href="javascript:alert(1)">Bad link</a>';
  const doc = render("/partners", data);
  assert.equal(doc.querySelector("[onerror]"), null);
  assert.equal(doc.querySelector('a[href^="javascript:"]'), null);
  assert.equal(
    [...doc.querySelectorAll("script")].filter((script) =>
      script.textContent.includes("alert(1)"),
    ).length,
    0,
  );
});
test("image-right variants and additional discovery items have an effect", () => {
  const data = structuredClone(source);
  const image = data.pages._home.content.find(
    (block) => block.type === "Image Text",
  );
  image.settings.style = "Image Right";
  const discovery = data.pages._home.content.find(
    (block) => block.type === "Discover Monastery",
  );
  const extra = structuredClone(discovery.data.Items.data.objects[2]);
  extra.data.Title.data.text = "Fourth visible item";
  discovery.data.Items.data.objects.push(extra);
  const doc = render("/", data);
  assert.ok(doc.querySelector(".community-grid.text-first"));
  assert.ok(
    doc
      .querySelector(".discover-extra")
      .textContent.includes("Fourth visible item"),
  );
});
test("new empty Eidos blocks render without crashing", () => {
  const data = structuredClone(source);
  data.pages.partners.content = blockSchema.blocks.map(({ label }) => ({
    type: label,
    nickname: "New block",
    settings: {},
    data: {},
  }));
  assert.ok(render("/partners", data).querySelector("main"));
});
