import { siteConfig } from "./config";
let sessionId = "";
let started = false;
let queue: Record<string, unknown>[] = [];
let flushTimer: ReturnType<typeof setTimeout> | undefined;
function flush(keepalive = false) {
  if (!queue.length) return;
  const events = queue.splice(0, 12);
  void fetch(
    "https://us-central1-symposio-9b1b2.cloudfunctions.net/analytics-ingestWebsiteActivityBatch_v1",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: { clientId: "MRC", events } }),
      keepalive,
      referrerPolicy: "no-referrer",
    },
  ).catch(() => {
    /* Analytics must never interrupt the visitor. */
  });
}
export function trackPublicPage(path: string, pageTitle: string) {
  if (
    !siteConfig.analyticsEnabled ||
    ["/admin", "/reservation/confirm", "/cancel-reservation"].includes(path) ||
    ["localhost", "127.0.0.1"].includes(location.hostname)
  )
    return () => {};
  if (!sessionId) {
    try {
      sessionId =
        sessionStorage.getItem("symposio.analytics.session.MRC") ||
        crypto.randomUUID();
      sessionStorage.setItem("symposio.analytics.session.MRC", sessionId);
    } catch {
      sessionId = crypto.randomUUID();
    }
  }
  const push = (
    eventType: string,
    label: string,
    targetType = "",
    targetValue = "",
  ) => {
    queue.push({
      clientId: "MRC",
      eventType,
      label,
      path,
      pageKey: path === "/" ? "_home" : path.slice(1),
      pageTitle,
      targetType,
      targetValue,
      sessionId,
      language: "en",
      deviceBucket:
        innerWidth <= 650
          ? "mobile"
          : innerWidth <= 1024
            ? "tablet"
            : "desktop",
      viewportBucket:
        innerWidth <= 650 ? "small" : innerWidth <= 1024 ? "medium" : "large",
      referrerHost: (() => {
        try {
          return document.referrer ? new URL(document.referrer).hostname : "";
        } catch {
          return "";
        }
      })(),
      ts: Date.now(),
    });
    clearTimeout(flushTimer);
    flushTimer = setTimeout(flush, 1200);
  };
  if (!started) {
    push("session_start", "Session Start");
    started = true;
  }
  push("page_view", pageTitle);
  const engaged = setTimeout(() => push("page_engaged", pageTitle), 15000);
  const milestones = new Set<number>();
  const scroll = () => {
    const progress = Math.round(
      ((scrollY + innerHeight) / document.documentElement.scrollHeight) * 100,
    );
    for (const depth of [25, 50, 75, 100])
      if (progress >= depth && !milestones.has(depth)) {
        milestones.add(depth);
        push("scroll_depth", `${depth}%`, "scroll", String(depth));
      }
  };
  const click = (event: MouseEvent) => {
    const element =
      event.target instanceof Element
        ? event.target.closest("a,button,summary")
        : null;
    if (!element || element.closest("dialog")) return;
    const label = (
      element.getAttribute("aria-label") ||
      element.textContent ||
      ""
    )
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 140);
    const href = element.getAttribute("href") || "";
    const target = href.split(/[?#]/)[0];
    if (
      !label ||
      /\/admin|\/cancel-reservation|\/reservation\/confirm/.test(target)
    )
      return;
    push(
      href.includes("stripe.com")
        ? "donation_click"
        : href.startsWith("tel:")
          ? "phone_click"
          : href.startsWith("mailto:")
            ? "email_click"
            : "button_click",
      label,
      href ? "link" : "button",
      target,
    );
  };
  const hide = () => {
    if (document.visibilityState === "hidden") flush(true);
  };
  document.addEventListener("click", click);
  window.addEventListener("scroll", scroll, { passive: true });
  document.addEventListener("visibilitychange", hide);
  return () => {
    clearTimeout(engaged);
    document.removeEventListener("click", click);
    window.removeEventListener("scroll", scroll);
    document.removeEventListener("visibilitychange", hide);
    flush(true);
  };
}
