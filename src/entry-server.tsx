import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";
import { SiteApp } from "./app/App";
import { normalizeSiteData } from "./app/lib/eidos-data";
import type { LoadedSiteData } from "./app/types/eidos";
export { resolvePageSeo } from "./app/lib/seo";
export function createBundledPayload(raw: unknown): LoadedSiteData {
  return { siteData: normalizeSiteData(raw), source: "bundled" };
}
export function renderRoute(path: string, payload: LoadedSiteData) {
  return renderToString(
    <StaticRouter location={path}>
      <SiteApp initialPayload={payload} />
    </StaticRouter>,
  );
}
