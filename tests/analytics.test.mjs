import test from "node:test";
import assert from "node:assert/strict";
import { build } from "vite";
import { JSDOM } from "jsdom";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve } from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
async function tracker(target) {
  const outDir = resolve(root, ".test-server", `analytics-${target}`);
  await build({
    root,
    configFile: false,
    logLevel: "silent",
    define: {
      "import.meta.env.VITE_SITE_BUILD_TARGET": JSON.stringify(target),
      "import.meta.env.VITE_ENABLE_ANALYTICS": JSON.stringify("true"),
      "import.meta.env.PROD": "true",
    },
    build: {
      ssr: "src/app/lib/analytics.ts",
      outDir,
      emptyOutDir: true,
      rollupOptions: { output: { entryFileNames: "tracker.mjs" } },
    },
  });
  return import(pathToFileURL(resolve(outDir, "tracker.mjs")).href);
}
const dom = new JSDOM(
  '<!doctype html><a id="contact" href="/contact?branch=private-draft#directions">Contact the monastery</a><dialog><button id="private">Guest details</button></dialog>',
  { url: "https://mrcslo.com/" },
);
dom.window.document.addEventListener("click", (event) => event.preventDefault());
for (const key of [
  "window",
  "document",
  "location",
  "sessionStorage",
  "Element",
])
  Object.defineProperty(globalThis, key, {
    value: dom.window[key],
    configurable: true,
  });
Object.assign(globalThis, { innerWidth: 1280, innerHeight: 800, scrollY: 0 });
Object.defineProperty(globalThis, "crypto", {
  value: { randomUUID: () => "react-test-session" },
  configurable: true,
});
const requests = [];
globalThis.fetch = async (url, options) => {
  requests.push({ url, ...options, payload: JSON.parse(options.body) });
  return new Response(JSON.stringify({ data: { ingested: 1 } }));
};
const production = await tracker("production");
const preview = await tracker("testing");

test("React batches and individual events go to MRC2 with a separate session", () => {
  sessionStorage.setItem("symposio.analytics.session.MRC", "legacy-session");
  const stop = production.trackPublicPage("/", "Home");
  document
    .getElementById("contact")
    .dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true, cancelable: true }));
  document
    .getElementById("private")
    .dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true, cancelable: true }));
  stop();
  assert.equal(requests.length, 1);
  const request = requests[0];
  assert.match(request.url, /analytics-ingestWebsiteActivityBatch_v1$/);
  assert.equal(request.payload.data.clientId, "MRC2");
  assert.deepEqual(
    request.payload.data.events.map((event) => event.eventType),
    ["session_start", "page_view", "button_click"],
  );
  for (const event of request.payload.data.events) {
    assert.equal(event.clientId, "MRC2");
    assert.equal(event.sessionId, "react-test-session");
  }
  assert.equal(request.payload.data.events[2].targetValue, "/contact");
  assert.equal(
    sessionStorage.getItem("symposio.analytics.session.MRC2"),
    "react-test-session",
  );
  assert.equal(
    sessionStorage.getItem("symposio.analytics.session.MRC"),
    "legacy-session",
  );
  assert.equal(request.referrerPolicy, "no-referrer");
});

test("private routes and Eidos preview builds do not send analytics", () => {
  const before = requests.length;
  for (const path of ["/admin", "/reservation/confirm", "/cancel-reservation"])
    production.trackPublicPage(path, "Private")();
  preview.trackPublicPage("/", "Draft Home")();
  assert.equal(requests.length, before);
});

test("local production previews do not send analytics", () => {
  const before = requests.length;
  Object.defineProperty(globalThis, "location", {
    value: new URL("http://127.0.0.1:5175/"),
    configurable: true,
  });
  production.trackPublicPage("/", "Local Home")();
  assert.equal(requests.length, before);
});
