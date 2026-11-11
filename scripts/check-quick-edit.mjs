import { readFile } from "node:fs/promises";
import { validateQuickEdit } from "./validate-quick-edit.mjs";
const read = async (name) => JSON.parse(await readFile(new URL("../public/" + name, import.meta.url), "utf8"));
const [site, schema] = await Promise.all([read("pages.json"), read("block-schema.json")]);
const errors = validateQuickEdit(site, schema);
if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else console.log("Quick Edit configuration valid: " + (schema.quickEdit?.flows.length || 0) + " flow(s).");
