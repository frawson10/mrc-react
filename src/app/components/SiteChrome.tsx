import { useEffect, useRef, useState, type ReactNode } from "react";
import { articleHeader, pagePath, primaryNavigation } from "../lib/content";
import { siteConfig } from "../lib/config";
import type { EidosPageMap } from "../types/eidos";
import { SiteLink } from "./ui";
function Brand({
  search = "",
  footer = false,
}: {
  search?: string;
  footer?: boolean;
}) {
  return (
    <SiteLink
      to="/"
      search={search}
      className="brand"
      aria-label="Monastery of the Risen Christ home"
    >
      <img src="/assets/logo-small.png" width={49} height={54} alt="" />
      <span className="brand-text">
        Monastery of
        <br />
        the Risen Christ
        <span>
          {footer
            ? "A Camaldolese Benedictine community"
            : "San Luis Obispo, California"}
        </span>
      </span>
    </SiteLink>
  );
}
export function SiteChrome({
  children,
  pages,
  path,
  search,
  branch,
  operational,
}: {
  children: ReactNode;
  pages: EidosPageMap;
  path: string;
  search: string;
  branch: string | null;
  operational: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    setMenuOpen(false);
  }, [path]);
  useEffect(() => {
    document.body.classList.toggle("menu-open", menuOpen);
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape" && menuOpen) {
        setMenuOpen(false);
        toggle.current?.focus();
      }
    };
    document.addEventListener("keydown", close);
    return () => {
      document.body.classList.remove("menu-open");
      document.removeEventListener("keydown", close);
    };
  }, [menuOpen]);
  const coreKeys = new Set<string>(primaryNavigation.map(([key]) => key));
  const extras = Object.entries(pages).filter(
    ([key, page]) =>
      !coreKeys.has(key) &&
      key !== "_home" &&
      page.settings?.showMenu === true &&
      !articleHeader(page),
  );
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      {branch && (
        <div className="preview-banner" role="status">
          Eidos preview · {branch}
        </div>
      )}
      <div className="notice">
        <div className="wrap">
          <SiteLink to="/retreats#booking" search={search} className="">
            <span>
              <span className="notice-dot" />
              {siteConfig.publicReservationsPaused
                ? "Overnight hospitality is temporarily paused."
                : "A quiet welcome on California’s Central Coast."}
            </span>
            <span>Latest update</span>
          </SiteLink>
          <SiteLink to="/contact" search={search} className="utility">
            Contact & directions
          </SiteLink>
        </div>
      </div>
      <header className="site-header">
        <div className="wrap header-inner">
          <Brand search={search} />
          <button
            type="button"
            ref={toggle}
            className="menu-toggle"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={menuOpen}
            aria-controls="main-nav"
            onClick={() => setMenuOpen((value) => !value)}
          >
            <span className="menu-lines" aria-hidden="true" />
          </button>
          <nav
            id="main-nav"
            className={`nav ${menuOpen ? "open" : ""}`}
            aria-label="Main navigation"
          >
            {primaryNavigation
              .filter(([key]) => pages[key] || Object.keys(pages).length === 0)
              .map(([key, label]) => (
                <SiteLink
                  key={key}
                  to={`/${key}`}
                  search={search}
                  className={`${path === `/${key}` || path.startsWith(`/${key}/`) ? "active" : ""} ${key === "support" ? "nav-support" : ""}`}
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                </SiteLink>
              ))}
            {extras.map(([key, page]) => (
              <SiteLink
                key={key}
                to={pagePath(key)}
                search={search}
                className=""
                onClick={() => setMenuOpen(false)}
              >
                {page.title || key}
              </SiteLink>
            ))}
            <SiteLink
              to="/retreats#booking"
              search={search}
              className="nav-book"
              onClick={() => setMenuOpen(false)}
            >
              Book a stay
            </SiteLink>
          </nav>
        </div>
      </header>
      <main
        id="main"
        tabIndex={-1}
        inert={menuOpen}
        className={operational ? "operational-page" : undefined}
      >
        {children}
      </main>
      <footer className="site-footer" inert={menuOpen}>
        <div className="wrap">
          <div className="footer-grid">
            <div className="footer-brand">
              <Brand search={search} footer />
              <p>
                A life of prayer and contemplative hospitality on California’s
                Central Coast.
              </p>
            </div>
            <div>
              <div className="footer-title">Find your way</div>
              <div className="footer-links">
                {[
                  ["/visit", "Visit & prayer"],
                  ["/retreats", "Retreat hospitality"],
                  ["/community", "Our community"],
                  ["/community#oblates", "Our Oblate community"],
                  ["/partners", "Restorative Partners"],
                ].map(([to, label]) => (
                  <SiteLink to={to} key={to} search={search} className="">
                    {label}
                  </SiteLink>
                ))}
              </div>
            </div>
            <div>
              <div className="footer-title">Stay connected</div>
              <div className="footer-links">
                {[
                  ["/reflections", "Reflections & resources"],
                  ["/news", "News & events"],
                  ["/support", "Giving & volunteering"],
                  ["/calendar", "Prayer calendar"],
                  ["https://www.facebook.com/SLOMonastery", "Facebook"],
                  ["https://www.instagram.com/mrc.slo/", "Instagram"],
                  [
                    "https://www.youtube.com/@MonasteryoftheRisenChrist",
                    "YouTube",
                  ],
                ].map(([to, label]) => (
                  <SiteLink to={to} key={to} search={search} className="">
                    {label}
                  </SiteLink>
                ))}
              </div>
            </div>
            <div className="footer-address">
              <div className="footer-title">Come find us</div>2308 O’Connor Way
              <br />
              San Luis Obispo, CA 93405
              <SiteLink to="tel:+18055441810" className="">
                805 544 1810
              </SiteLink>
              <SiteLink to="/contact" search={search} className="">
                Contact & directions
              </SiteLink>
            </div>
          </div>
          <div className="footer-bottom">
            <span>
              © {new Date().getFullYear()} Monastery of the Risen Christ
            </span>
            <span>Solitude · Community · Contemplative outreach</span>
            <SiteLink to="/contact" search={search} className="">
              Contact the monastery
            </SiteLink>
          </div>
        </div>
      </footer>
    </>
  );
}
