# Connect this repository to the current Eidos

## Identity

These values have different purposes and must remain distinct:

| Value | Purpose |
| --- | --- |
| `mrc-react` | New Git repository and preview request `repoName` |
| `settings.client: mrc-web` | Existing generic MRC editor behavior in `pages.json` |
| Existing MRC organization in `clients_v2` | Eidos access, media library, preview/hosting metadata; retain the existing organization ID |
| `clients/MRC/booking/...` | Existing private reservation records; unchanged |
| Analytics client `MRC` | Existing website activity feed |

Do not copy San Carlos's `scc2` identifier or menu categories. This site supports the current generic Eidos Add Page flow. It supplies complete `settings.seo`, so the new repository does not depend on a hard-coded SEO default entry in Eidos.

## Owner setup

1. Create/connect the GitHub repository named `mrc-react` under the owner accessible to the existing Eidos GitHub integration. Push this local repository's `main` branch.
2. Create the desired Firebase App Hosting production and testing backends, selecting this repository and the appropriate build environment/overlay. The application builds with `npm run build` and runs with `node server.js`.
3. In the existing MRC organization document used by Eidos, set `repoName` to `mrc-react`; set `testingDomain` to the testing backend URL; set `liveSiteUrl` (or the existing live URL field) to `https://mrcslo.com`; and supply the production `appHostingBackendId`, `appHostingRegion`, and `appHostingProjectId`.
4. Enable `supportsMediaRefV2` for that organization if desired. The frontend accepts both URL strings and v2 library references. Preserve existing administrator and media-library membership.
5. Production must build with `VITE_SITE_BUILD_TARGET=production`. Testing must build with `VITE_SITE_BUILD_TARGET=testing`. Both use `VITE_EIDOS_REPO_NAME=mrc-react`, the existing preview endpoint, default branch `main`, and `VITE_PUBLIC_RESERVATIONS_PAUSED=true`.
6. Verify an Eidos edit in a new branch: change a heading, reorder a block, add a list item, select a library image, and open the testing link. Navigate to another page and an anchor; the branch query must stay active.
7. Publish through the existing Eidos workflow. Verify the new production build contains the change, article metadata, canonical links, and sitemap. Keep the previous MRC backend available until cutover acceptance is complete.

This repository does not change Eidos, GitHub/Firebase configuration, secrets, backend functions, Firestore rules, or the live domain.

## Content protocol

Published content lives at `public/pages.json` in the shape `{settings, pages}`. `_home` resolves to `/`; other page keys resolve to their paths, including nested article paths. Eidos loads `public/block-schema.json`, and its existing backend updates `public/pages.json`, `routes.txt`, and `public/claims.json`.

The testing site POSTs `{data:{repoName,branch,pagePath}}` to `bitbucket-githubGetPageDataLatest_v2`. It reads the returned whole-site map and commit SHA. Testing defaults to `main` without a branch query. It never silently substitutes published content for a failed draft request. Production ignores preview queries and uses only its built local page map, matching SCC V5.

Production prerendering derives routes from `pages.json`, so pages added through Eidos are included on the next build. `routes.txt` remains compatible with the existing Eidos backend. Testing keeps SPA fallback for new draft page paths. Testing HTML, server headers, robots, and sitemap disable indexing. Reservation/admin routes also remain outside the public sitemap.

## Hosting and URLs

App Hosting is the primary runtime. `server.js` supplies direct page loads, true missing-page responses, asset MIME/cache headers, and legacy redirects. `firebase.json` is an optional static Hosting configuration; no project target or live site has been selected.

The following old routes remain supported: `/our-ministry`, `/announcements`, `/support-us`, `/retreat-opportunities`, and `/restorative-partners`. The server also accepts the mockup's `.html` entry URLs and article query URLs. In-app aliases preserve query strings, including `checkout=cancelled` and Eidos branches.

Live calendar contents and external resources require internet access. The calendar uses the established MRC feed consistently for all view sizes, in `America/Los_Angeles`, with month, week, and agenda controls and an external-calendar fallback link.
