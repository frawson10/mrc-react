import type {
  ActionLink,
  EidosField,
  EidosPage,
  EidosPageMap,
  EidosSiteData,
  Language,
  LoadedSiteData,
} from "../types/eidos";
import { siteConfig } from "./config";

const MEDIA_REF_METADATA_KEYS = [
  "assetId",
  "storagePath",
  "fileName",
  "contentType",
  "sizeBytes",
  "downloadUrl",
  "libraryId",
];

const siteDataCache = new Map<string, Promise<LoadedSiteData>>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isMediaRef(value: unknown): value is Record<string, unknown> {
  if (!isRecord(value)) {
    return false;
  }

  if (typeof value.url !== "string") {
    return false;
  }

  return MEDIA_REF_METADATA_KEYS.some((key) => key in value);
}

function normalizeMediaValue<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeMediaValue(item)) as T;
  }

  if (!isRecord(value)) {
    return value;
  }

  if (isMediaRef(value)) {
    return (value.url || "") as T;
  }

  const normalized: Record<string, unknown> = {};
  for (const [key, nestedValue] of Object.entries(value)) {
    normalized[key] = normalizeMediaValue(nestedValue);
  }

  return normalized as T;
}

export function normalizeSiteData(rawValue: unknown): EidosSiteData {
  const normalized = normalizeMediaValue(rawValue);

  if (!isRecord(normalized)) {
    return { pages: {}, settings: {} };
  }

  const pagesCandidate = isRecord(normalized.pages)
    ? (normalized.pages as EidosPageMap)
    : (Object.fromEntries(
        Object.entries(normalized).filter(
          ([key]) => key !== "settings" && key !== "commitSha",
        ),
      ) as EidosPageMap);
  const settingsCandidate = isRecord(normalized.settings)
    ? (normalized.settings as Record<string, unknown>)
    : {};

  return {
    pages: pagesCandidate,
    settings: settingsCandidate,
    commitSha:
      typeof normalized.commitSha === "string"
        ? normalized.commitSha
        : undefined,
  };
}

function toPublicUrl(fileName: string) {
  return `${import.meta.env.BASE_URL}${fileName}`.replace(/(?<!:)\/{2,}/g, "/");
}

async function fetchJson(url: string) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(15000),
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Unable to load ${url}: ${response.status}`);
  }

  return response.json();
}

async function loadBundledSiteData(): Promise<LoadedSiteData> {
  const payload = await fetchJson(toPublicUrl("pages.json"));
  return {
    siteData: normalizeSiteData(payload),
    source: "bundled",
  };
}

async function loadPreviewSiteData(
  branch: string,
  initialPageKey: string,
): Promise<LoadedSiteData> {
  const response = await fetch(siteConfig.previewEndpoint, {
    signal: AbortSignal.timeout(15000),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: {
        repoName: siteConfig.repoName,
        branch,
        pagePath: initialPageKey,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Preview request failed with status ${response.status}`);
  }

  const payload = await response.json();
  const dataEnvelope = isRecord(payload.data)
    ? payload.data
    : isRecord(payload.result)
      ? payload.result
      : payload;

  return {
    siteData: normalizeSiteData(dataEnvelope),
    source: "preview",
  };
}

export function loadSiteData(
  branch: string | null,
  initialPageKey: string,
): Promise<LoadedSiteData> {
  const cacheKey = branch ? `preview:${branch}` : "bundled";
  const cached = siteDataCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const promise = (
    branch ? loadPreviewSiteData(branch, initialPageKey) : loadBundledSiteData()
  ).catch((error) => {
    siteDataCache.delete(cacheKey);
    throw error;
  });
  siteDataCache.set(cacheKey, promise);
  return promise;
}

export function normalizePath(path: string) {
  const [pathname] = (path || "/").split(/[?#]/, 1);
  if (!pathname || pathname === "/") {
    return "/";
  }

  const withLeadingSlash = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return withLeadingSlash.length > 1 && withLeadingSlash.endsWith("/")
    ? withLeadingSlash.slice(0, -1)
    : withLeadingSlash;
}

export function getPageKeyFromPath(path: string) {
  const normalizedPath = normalizePath(path);
  if (normalizedPath === "/") {
    return "_home";
  }

  return normalizedPath.slice(1);
}

export function getPathFromPageKey(value: string) {
  const trimmed = String(value || "").trim();
  if (!trimmed || trimmed === "_home" || trimmed === "/") {
    return "/";
  }

  const withoutLeadingSlash = trimmed.startsWith("/")
    ? trimmed.slice(1)
    : trimmed;
  return `/${withoutLeadingSlash}`;
}

export function getPageByPath(
  pages: EidosPageMap,
  path: string,
): EidosPage | null {
  const pageKey = getPageKeyFromPath(path);
  return pages[pageKey] || null;
}

function asDataRecord(source: unknown): Record<string, unknown> | null {
  if (!source) {
    return null;
  }

  if (isRecord(source) && isRecord(source.data)) {
    return source.data as Record<string, unknown>;
  }

  return isRecord(source) ? source : null;
}

function asField(value: unknown): EidosField | null {
  return isRecord(value) ? (value as EidosField) : null;
}

function getField(source: unknown, label: string) {
  const data = asDataRecord(source);
  if (!data) {
    return null;
  }

  return asField(data[label]);
}

export function getFieldSource(source: unknown, label: string) {
  return getField(source, label);
}

function getFieldString(source: unknown, label: string, dataKey: string) {
  const field = getField(source, label);
  const value = field?.data?.[dataKey];
  return typeof value === "string" ? value.trim() : "";
}

function chooseLocalizedLabels(label: string, language: Language) {
  return language === "es"
    ? [`${label} (Spanish)`, label]
    : [label, `${label} (Spanish)`];
}

export function getLocalizedText(
  source: unknown,
  label: string,
  language: Language,
) {
  for (const candidate of chooseLocalizedLabels(label, language)) {
    const value = getFieldString(source, candidate, "text");
    if (value) {
      return value;
    }
  }

  return "";
}

export function getLocalizedHtml(
  source: unknown,
  label: string,
  language: Language,
) {
  return getLocalizedText(source, label, language);
}

export function getFileValue(source: unknown, label: string | string[]) {
  const labels = Array.isArray(label) ? label : [label];
  for (const candidate of labels) {
    const value = getFieldString(source, candidate, "file");
    if (value) {
      return value;
    }
  }

  return "";
}

export function getObjectsValue(source: unknown, label = "objects") {
  const data = asDataRecord(source);
  if (!data) {
    return [];
  }

  const value = data[label];
  if (Array.isArray(value)) {
    return value;
  }

  if (
    isRecord(value) &&
    isRecord(value.data) &&
    Array.isArray(value.data.objects)
  ) {
    return value.data.objects;
  }

  return [];
}

export function resolveActionLink(
  source: unknown,
  language: Language,
): ActionLink | null {
  const internalTarget =
    getFieldString(source, "Internal Target", "target") ||
    getFieldString(source, "Internal Page", "target") ||
    getFieldString(source, "Page", "target");

  const externalHref =
    getFieldString(source, "External URL", "url") ||
    getFieldString(source, "External Link", "url") ||
    getFieldString(source, "URL", "url");

  const labelCandidates = [
    getLocalizedText(source, "Button Text", language),
    getLocalizedText(source, "Announcement Title", language),
    getLocalizedText(source, "News Title", language),
    getLocalizedText(source, "Title", language),
    getLocalizedText(source, "Name of Ministry", language),
    getLocalizedText(source, "Sacrament Name", language),
    getLocalizedText(source, "Date", language),
    "Learn more",
  ];

  const label = labelCandidates.find(Boolean) || "Learn more";

  if (internalTarget) {
    return {
      kind: "internal",
      href: getPathFromPageKey(internalTarget),
      label,
    };
  }

  if (externalHref) {
    return {
      kind: "external",
      href: externalHref,
      label,
    };
  }

  return null;
}

export function formatPathLabel(path: string) {
  const normalizedPath = normalizePath(path);
  if (normalizedPath === "/") {
    return "Home";
  }

  return normalizedPath
    .slice(1)
    .split("/")
    .filter(Boolean)
    .map((segment) =>
      segment
        .replace(/[-_]+/g, " ")
        .replace(/\b\w/g, (character) => character.toUpperCase()),
    )
    .join(" / ");
}
