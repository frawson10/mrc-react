import { useEffect, useRef, useState } from "react";
import { BrowserRouter, Navigate, useLocation } from "react-router-dom";
import type { EidosPage, LoadedSiteData } from "./types/eidos";
import {
  getPageByPath,
  getPageKeyFromPath,
  loadSiteData,
} from "./lib/eidos-data";
import {
  resolveActivePreviewBranch,
  resolvePreservedPreviewSearch,
  siteConfig,
} from "./lib/config";
import { articleHeader, field, plainText, text } from "./lib/content";
import { applyPageSeo } from "./lib/seo";
import { trackPublicPage } from "./lib/analytics";
import { BlockRenderer } from "./components/Blocks";
import { SiteChrome } from "./components/SiteChrome";
import { StartupAnimation } from "./components/StartupAnimation";
import {
  AdminPage,
  BookingStatus,
  CancellationPage,
  ConfirmationPage,
} from "./components/Reservations";
import { Action, ErrorNotice, RichText, SiteLink } from "./components/ui";

declare global {
  interface Window {
    __MRC_INITIAL_SITE_DATA__?: LoadedSiteData;
  }
}
export const aliases: Record<string, string> = {
  "/our-ministry": "/community",
  "/announcements": "/news",
  "/support-us": "/support",
  "/retreat-opportunities": "/retreats",
  "/restorative-partners": "/partners",
  "/index.html": "/",
  "/visit.html": "/visit",
  "/retreats.html": "/retreats",
  "/community.html": "/community",
  "/reflections.html": "/reflections",
  "/news.html": "/news",
  "/support.html": "/support",
  "/contact.html": "/contact",
  "/partners.html": "/partners",
};
function ArticleFooter({ page, search }: { page: EidosPage; search: string }) {
  const header = articleHeader(page);
  return (
    <div className="article-footer">
      <div className="button-row">
        <Action
          source={field(header, "Video")}
          search={search}
          className="btn"
        />
        <Action
          source={field(header, "Resource")}
          search={search}
          className="btn outline"
        />
      </div>
      {text(header, "Source Credit") && (
        <div className="source-note">
          <RichText html={text(header, "Source Credit")} className="" />
          {text(header, "Original Title") &&
            plainText(text(header, "Original Title")) !==
              plainText(text(header, "Title")) && (
              <p>
                Originally published as “
                {plainText(text(header, "Original Title"))}”.
              </p>
            )}
        </div>
      )}
      <div className="button-row">
        <SiteLink
          to={`/${text(header, "Collection").toLowerCase()}`}
          search={search}
        >
          Return to{" "}
          {text(header, "Collection").toLowerCase() === "news"
            ? "community news"
            : "the library"}
        </SiteLink>
      </div>
    </div>
  );
}

export function SiteApp({
  initialPayload = null,
}: {
  initialPayload?: LoadedSiteData | null;
}) {
  const location = useLocation();
  const path = location.pathname.replace(/\/$/, "") || "/";
  const requestedBranch = new URLSearchParams(location.search).get("branch");
  const branch = resolveActivePreviewBranch(requestedBranch);
  const search = resolvePreservedPreviewSearch(requestedBranch);
  const initial = useRef(initialPayload);
  const [payload, setPayload] = useState(initialPayload);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!initialPayload);
  const [reload, setReload] = useState(0);
  const operational = [
    "/admin",
    "/reservation/confirm",
    "/cancel-reservation",
  ].includes(path);
  const [showStartup, setShowStartup] = useState(!operational);
  useEffect(() => {
    if (operational) setShowStartup(false);
  }, [operational]);
  const pages = payload?.siteData.pages || {};
  const page = getPageByPath(pages, path);
  const article = Boolean(articleHeader(page));
  useEffect(() => {
    if (initial.current && siteConfig.contentSource === "bundled") return;
    let cancelled = false;
    setLoading(true);
    setError("");
    void loadSiteData(branch, getPageKeyFromPath(path))
      .then((next) => {
        if (!cancelled) setPayload(next);
      })
      .catch((failure) => {
        if (!cancelled) {
          setError(
            failure instanceof Error
              ? failure.message
              : "Content could not be loaded.",
          );
          setPayload(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [branch, reload]);
  useEffect(() => {
    applyPageSeo(
      page,
      payload?.siteData.settings || {},
      path,
      siteConfig.contentSource === "api",
      operational,
    );
  }, [page, path, operational, payload]);
  useEffect(() => {
    if (!loading && page && !operational)
      return trackPublicPage(path, page.title || path);
  }, [loading, page, path, operational]);
  useEffect(() => {
    if (loading) return;
    if (location.hash) {
      const id = decodeURIComponent(location.hash.slice(1));
      const frame = requestAnimationFrame(() =>
        document.getElementById(id)?.scrollIntoView(),
      );
      return () => cancelAnimationFrame(frame);
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [path, location.hash, loading]);
  if (aliases[path])
    return (
      <Navigate
        replace
        to={`${aliases[path]}${location.search}${location.hash}`}
      />
    );
  if (path === "/article.html") {
    const query = new URLSearchParams(location.search);
    const id = query.get("id");
    const collection = query.get("kind") === "news" ? "news" : "reflections";
    if (id && /^[a-z0-9-]+$/.test(id))
      return <Navigate replace to={`/${collection}/${id}${search}`} />;
  }
  return (
    <>
      <SiteChrome
        pages={pages}
        path={path}
        search={search}
        branch={branch}
        operational={operational}
      >
        {operational ? (
          path === "/admin" ? (
            <AdminPage />
          ) : path === "/reservation/confirm" ? (
            <ConfirmationPage />
          ) : (
            <CancellationPage />
          )
        ) : loading ? (
          <section className="section">
            <div className="wrap">
              <p role="status">Preparing a quiet welcome…</p>
            </div>
          </section>
        ) : error ? (
          <section className="section">
            <div className="wrap">
              <h1>A moment of patience.</h1>
              <ErrorNotice>
                We could not load the monastery’s page content. Please try
                again.
              </ErrorNotice>
              {branch && (
                <p className="muted">
                  Preview branch: {branch}. Check that the new repository is
                  connected to Eidos.
                </p>
              )}
              <button
                className="btn"
                onClick={() => setReload((value) => value + 1)}
              >
                Try again
              </button>
            </div>
          </section>
        ) : page ? (
          <div className={article ? "article-page" : "standard-page"}>
            {!page.content?.some((block) =>
              ["Hero", "Page Intro", "Article Header"].includes(block.type),
            ) && (
              <div className="wrap page-intro">
                <h1>{page.title}</h1>
                <p>{page.description}</p>
              </div>
            )}
            <BlockRenderer
              blocks={page.content || []}
              pages={pages}
              search={search}
              afterIntro={
                path === "/retreats" ? (
                  <div className="wrap" id="booking">
                    <BookingStatus search={search} />
                  </div>
                ) : undefined
              }
            />
            {article && <ArticleFooter page={page} search={search} />}
          </div>
        ) : (
          <section className="section">
            <div className="wrap">
              <div className="eyebrow">Page not found</div>
              <h1>Let’s find your way.</h1>
              <p>This page is no longer available.</p>
              <div className="button-row">
                <SiteLink to="/" search={search} className="btn">
                  Return home
                </SiteLink>
                <SiteLink to="/contact" search={search}>
                  Contact the monastery
                </SiteLink>
              </div>
            </div>
          </section>
        )}
      </SiteChrome>
      {showStartup && <StartupAnimation />}
    </>
  );
}
export function App() {
  return (
    <BrowserRouter>
      <SiteApp
        initialPayload={
          typeof window === "undefined"
            ? null
            : window.__MRC_INITIAL_SITE_DATA__ || null
        }
      />
    </BrowserRouter>
  );
}
