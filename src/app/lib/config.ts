export type SiteBuildTarget = "production" | "testing";
const buildTarget: SiteBuildTarget =
  import.meta.env.VITE_SITE_BUILD_TARGET === "testing"
    ? "testing"
    : "production";

export const siteConfig = {
  buildTarget,
  contentSource: buildTarget === "testing" ? "api" : "bundled",
  previewDefaultBranch:
    import.meta.env.VITE_EIDOS_DEFAULT_BRANCH?.trim() || "main",
  repoName: import.meta.env.VITE_EIDOS_REPO_NAME?.trim() || "mrc-react",
  previewEndpoint:
    import.meta.env.VITE_EIDOS_PREVIEW_ENDPOINT?.trim() ||
    "https://us-central1-symposio-9b1b2.cloudfunctions.net/bitbucket-githubGetPageDataLatest_v2",
  siteName: "Monastery of the Risen Christ",
  languageStorageKey: "mrc-react.language",
  siteUrl: "https://mrcslo.com",
  reservationApiBase:
    import.meta.env.VITE_RESERVATION_API_BASE_URL?.trim() ||
    "https://us-central1-symposio-9b1b2.cloudfunctions.net",
  // Operational setting: never read from pages.json, a URL parameter, or browser storage.
  publicReservationsPaused:
    import.meta.env.VITE_PUBLIC_RESERVATIONS_PAUSED !== "false",
  analyticsEnabled:
    buildTarget === "production" &&
    import.meta.env.PROD &&
    import.meta.env.VITE_ENABLE_ANALYTICS === "true",
  calendarId:
    "c_78e03d14a410a65c98bef067b12b733c5804032d1ae6ffdd6c5a6e1fde39e19b@group.calendar.google.com",
};

export const reservationPauseCopy =
  "Our hospitality suites are temporarily accommodating monks evacuated from New Camaldoli Hermitage. We hope to resume reservations after February 2027, circumstances permitting. Please contact the monastery for the latest information.";

export function resolveActivePreviewBranch(requestedBranch: string | null) {
  return siteConfig.contentSource === "api"
    ? requestedBranch?.trim() || siteConfig.previewDefaultBranch
    : null;
}
export function resolvePreservedPreviewSearch(requestedBranch: string | null) {
  return siteConfig.contentSource === "api" && requestedBranch?.trim()
    ? `?branch=${encodeURIComponent(requestedBranch.trim())}`
    : "";
}
