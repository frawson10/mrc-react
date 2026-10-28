import { readFile, access } from "node:fs/promises";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = async (name) =>
  JSON.parse(await readFile(join(root, name), "utf8"));
const [site, schema, claims, assetMap] = await Promise.all(
  [
    "public/pages.json",
    "public/block-schema.json",
    "public/claims.json",
    "public/asset-map.json",
  ].map(read),
);
const sourceAssetMap = await read("src/app/lib/asset-map.json");
if (JSON.stringify(assetMap) !== JSON.stringify(sourceAssetMap)) {
  throw new Error(
    "Public and source asset maps differ; update both mapping files together.",
  );
}
const errors = [];
const ids = new Set();
const labels = new Set();
const kinds = new Set([
  "text",
  "fileUpload",
  "listOfFileUploads",
  "object",
  "listOfObjects",
  "internalNavAction",
  "externalNavAction",
  "managed",
]);
function checkSchema(node, location) {
  if (!node.id || ids.has(node.id))
    errors.push(`${location}: missing/duplicate schema ID`);
  ids.add(node.id);
  if (!kinds.has(node.kind))
    errors.push(`${location}: unsupported kind ${node.kind}`);
  if (
    ["object", "listOfObjects"].includes(node.kind) &&
    !Array.isArray(node.children)
  )
    errors.push(`${location}: children must be an array`);
  const children = new Set();
  for (const child of node.children || []) {
    if (children.has(child.label))
      errors.push(`${location}: duplicate child ${child.label}`);
    children.add(child.label);
    checkSchema(child, `${location}/${child.label}`);
  }
}
for (const block of schema.blocks || []) {
  if (labels.has(block.label))
    errors.push(`Duplicate block label ${block.label}`);
  labels.add(block.label);
  checkSchema(block, block.label);
}
const definitions = new Map(schema.blocks.map((block) => [block.label, block]));
function checkValue(value, definition, location) {
  if (!value || typeof value !== "object" || !value.data || !value.settings) {
    errors.push(`${location}: field wrapper requires data and settings`);
    return;
  }
  if (definition.kind === "text" && typeof value.data.text !== "string")
    errors.push(`${location}: text value must be a string`);
  if (
    definition.kind === "internalNavAction" &&
    value.data.target &&
    !site.pages[value.data.target]
  )
    errors.push(`${location}: missing target page ${value.data.target}`);
  if (
    definition.kind === "externalNavAction" &&
    value.data.url &&
    !/^(https?:|mailto:|tel:)/.test(value.data.url)
  )
    errors.push(`${location}: unsupported link protocol`);
  if (
    definition.kind === "fileUpload" &&
    typeof value.data.file !== "string" &&
    !(value.data.file && typeof value.data.file.url === "string")
  )
    errors.push(`${location}: invalid image value`);
  if (definition.kind === "listOfFileUploads") {
    if (!Array.isArray(value.data.fileUploads))
      errors.push(`${location}: fileUploads must be an array`);
    else
      for (const [index, item] of value.data.fileUploads.entries())
        checkValue(item, { kind: "fileUpload" }, `${location}/${index}`);
  }
  if (definition.kind === "object")
    for (const child of definition.children || []) {
      if (!value.data[child.label])
        errors.push(`${location}: missing ${child.label}`);
      else {
        if (value.data[child.label].type !== child.kind)
          errors.push(`${location}/${child.label}: kind mismatch`);
        checkValue(
          value.data[child.label],
          child,
          `${location}/${child.label}`,
        );
      }
    }
  if (definition.kind === "listOfObjects") {
    if (!Array.isArray(value.data.objects))
      errors.push(`${location}: objects must be an array`);
    else
      value.data.objects.forEach((item, index) =>
        checkValue(
          item,
          { ...definition, kind: "object" },
          `${location}/${index}`,
        ),
      );
  }
}
for (const [key, page] of Object.entries(site.pages || {})) {
  if (key !== "_home" && !/^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/.test(key))
    errors.push(`${key}: invalid page key`);
  if (!page.title || !Array.isArray(page.content))
    errors.push(`${key}: missing title/content`);
  for (const [index, block] of page.content.entries()) {
    const definition = definitions.get(block.type);
    if (!definition) errors.push(`${key}: missing schema for ${block.type}`);
    else checkValue(block, definition, `${key}/${index}:${block.type}`);
  }
}
for (const file of Object.values(assetMap)) {
  try {
    await access(join(root, "public", file));
  } catch {
    errors.push(`Missing bundled asset ${file}`);
  }
}
if (!claims.claims || typeof claims.claims !== "object")
  errors.push("claims.json must contain a claims object");
if (!site.settings?.seo?.siteName || !site.settings?.seo?.siteUrl)
  errors.push("Site SEO identity is required");
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(
  `Content valid: ${Object.keys(site.pages).length} pages, ${schema.blocks.length} block types, ${ids.size} unique schema IDs.`,
);
