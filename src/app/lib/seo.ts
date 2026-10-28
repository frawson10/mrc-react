import type { EidosPage } from "../types/eidos";
import { siteConfig } from "./config";
export function record(value: unknown): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, any>)
    : {};
}
const clean = (value: unknown) =>
  String(value || "")
    .replace(/<[^>]*>/g, "")
    .trim();
export function resolvePageSeo(
  page: EidosPage | null,
  settings: Record<string, unknown>,
  path: string,
  preview = false,
  operational = false,
) {
  const site = record(settings.seo);
  const seo = record(page?.seo);
  const siteName = clean(site.siteName || siteConfig.siteName);
  const rawTitle = clean(
    seo.seoTitle ||
      page?.title ||
      (operational ? "Suite Reservations" : "Page not found"),
  );
  const title =
    path === "/" || rawTitle.toLowerCase() === "home"
      ? siteName
      : `${rawTitle} | ${clean(site.titleSuffix || siteName)}`;
  const description = clean(
    seo.metaDescription ||
      seo.pageSummary ||
      page?.description ||
      site.defaultDescription,
  );
  const siteUrl = clean(site.siteUrl || siteConfig.siteUrl).replace(/\/$/, "");
  const canonicalPath =
    "/" +
    clean(seo.canonicalPath || page?.url || path).replace(/^\/+|\/+$/g, "");
  const canonical = `${siteUrl}${canonicalPath === "/" ? "/" : canonicalPath}`;
  const index =
    !preview &&
    !operational &&
    Boolean(page) &&
    record(seo.robots).index !== false;
  const follow =
    !preview && !operational && record(seo.robots).follow !== false;
  const image =
    typeof seo.ogImage === "string"
      ? seo.ogImage
      : typeof site.defaultShareImage === "string"
        ? site.defaultShareImage
        : "";
  const article = page?.content?.some(
    (block) => block.type === "Article Header",
  );
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": clean(site.organizationType || "Church"),
        "@id": `${siteUrl}/#organization`,
        name: clean(site.organizationName || siteName),
        url: siteUrl,
        telephone: clean(site.phone),
        email: clean(site.email),
        address: {
          "@type": "PostalAddress",
          streetAddress: clean(site.streetAddress),
          addressLocality: clean(site.addressLocality),
          addressRegion: clean(site.addressRegion),
          postalCode: clean(site.postalCode),
          addressCountry: "US",
        },
        sameAs: Array.isArray(site.sameAs) ? site.sameAs : [],
      },
      {
        "@type": article
          ? "Article"
          : clean(seo.structuredDataType || "WebPage"),
        "@id": `${canonical}#page`,
        url: canonical,
        name: rawTitle,
        headline: rawTitle,
        description,
        ...(image ? { image } : {}),
        isPartOf: { "@id": `${siteUrl}/#website` },
        publisher: { "@id": `${siteUrl}/#organization` },
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        name: siteName,
        url: siteUrl,
        publisher: { "@id": `${siteUrl}/#organization` },
      },
    ],
  };
  return {
    title,
    description,
    canonical,
    image,
    index,
    excludeFromSitemap: Boolean(seo.excludeFromSitemap) || !index,
    robots: `${index ? "index" : "noindex"}, ${follow ? "follow" : "nofollow"}`,
    ogTitle: clean(seo.ogTitle || rawTitle),
    ogDescription: clean(seo.ogDescription || description),
    siteName,
    type: article ? "article" : "website",
    structuredData,
  };
}
export function applyPageSeo(...args: Parameters<typeof resolvePageSeo>) {
  const seo = resolvePageSeo(...args);
  document.title = seo.title;
  const setMeta = (attribute: string, key: string, content: string) => {
    let tag = document.head.querySelector(`meta[${attribute}="${key}"]`);
    if (!tag) {
      tag = document.createElement("meta");
      tag.setAttribute(attribute, key);
      document.head.append(tag);
    }
    tag.setAttribute("content", content);
  };
  setMeta("name", "description", seo.description);
  setMeta("name", "robots", seo.robots);
  for (const [key, value] of Object.entries({
    title: seo.ogTitle,
    description: seo.ogDescription,
    url: seo.canonical,
    image: seo.image,
    site_name: seo.siteName,
    type: seo.type,
  }))
    setMeta("property", `og:${key}`, value);
  for (const [key, value] of Object.entries({
    card: seo.image ? "summary_large_image" : "summary",
    title: seo.ogTitle,
    description: seo.ogDescription,
    image: seo.image,
  }))
    setMeta("name", `twitter:${key}`, value);
  let canonical = document.head.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    document.head.append(canonical);
  }
  canonical.setAttribute("href", seo.canonical);
  let script = document.getElementById("site-structured-data");
  if (!script) {
    script = document.createElement("script");
    script.id = "site-structured-data";
    script.setAttribute("type", "application/ld+json");
    document.head.append(script);
  }
  script.textContent = JSON.stringify(seo.structuredData);
}
