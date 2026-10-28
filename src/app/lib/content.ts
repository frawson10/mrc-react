import assetMap from "./asset-map.json";
import type { EidosBlock, EidosPage, EidosPageMap } from "../types/eidos";
import {
  getFieldSource,
  getLocalizedText,
  getFileValue,
  getObjectsValue,
} from "./eidos-data";

export const text = (source: unknown, label: string) =>
  getLocalizedText(source, label, "en");
export function plainText(value: string) {
  const entities: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
  };
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(
      /&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi,
      (match, key: string) => {
        if (key.startsWith("#")) {
          const point =
            key[1].toLowerCase() === "x"
              ? parseInt(key.slice(2), 16)
              : parseInt(key.slice(1), 10);
          return point > 0 && point <= 0x10ffff
            ? String.fromCodePoint(point)
            : "";
        }
        return entities[key.toLowerCase()] ?? match;
      },
    )
    .replace(/\s+/g, " ")
    .trim();
}
export const field = getFieldSource;
export const items = (source: unknown, label = "Items") =>
  getObjectsValue(source, label);
export function imageUrl(source: unknown, label = "Image") {
  const url = getFileValue(source, label);
  return (assetMap as Record<string, string>)[url] || url;
}
export function articleHeader(page?: EidosPage | null) {
  return page?.content?.find((block) => block.type === "Article Header");
}
export function articleCollection(page: EidosPage) {
  return text(articleHeader(page), "Collection").toLowerCase();
}
export function articleEntries(pages: EidosPageMap, collection: string) {
  return Object.entries(pages).filter(
    ([, page]) => articleCollection(page) === collection,
  );
}
export function targetPage(source: unknown, label = "Page") {
  const value = field(source, label)?.data?.target;
  return typeof value === "string" ? value.replace(/^\//, "") : "";
}
export function referencedArticles(block: EidosBlock, pages: EidosPageMap) {
  const references = items(block)
    .map((item) => targetPage(item))
    .filter(Boolean);
  const collection = text(block, "Collection").toLowerCase();
  const ordered = references
    .filter((key) => Boolean(pages[key]))
    .map((key) => [key, pages[key]] as const);
  return collection
    ? [
        ...ordered,
        ...articleEntries(pages, collection).filter(
          ([key]) => !references.includes(key),
        ),
      ]
    : ordered;
}
export const primaryNavigation = [
  ["visit", "Visit & Prayer"],
  ["retreats", "Retreats"],
  ["community", "Our Community"],
  ["reflections", "Reflections"],
  ["news", "News & Events"],
  ["support", "Support Us"],
] as const;
export function pagePath(key: string) {
  return !key || key === "_home" ? "/" : `/${key.replace(/^\//, "")}`;
}
export function safeExternalUrl(value: string) {
  if (/^(https?:|mailto:|tel:)/i.test(value)) return value;
  return "";
}
