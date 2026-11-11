import { readFile } from "node:fs/promises";
import { validateQuickEdit } from "./validate-quick-edit.mjs";
const read = async (name) => JSON.parse(await readFile(new URL("../public/" + name, import.meta.url), "utf8"));
const [site, schema] = await Promise.all([read("pages.json"), read("block-schema.json")]);
const errors = validateQuickEdit(site, schema);
if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  const guided = schema.quickEdit?.flows.length || 0;
  const management = schema.quickEdit?.collections.length || 0;
  console.log("Quick Edit configuration valid: " + (guided + management) + " task entry points (" + guided + " guided flows, " + management + " collection edit flows).");
}
