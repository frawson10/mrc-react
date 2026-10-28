# Local verification · October 28, 2026

The local implementation is ready for the owner to connect the new repository to Firebase and Eidos. These results verify the supplied content, frontend, and existing API contracts; they do not claim a deployed Eidos connection or completed live payment.

## Automated checks

| Check | Result |
| --- | --- |
| `npm run validate:content` | Passed: 31 pages, 22 block types, 381 unique schema IDs; content wrappers, references, assets, and both image maps agree |
| `npm run typecheck` | Passed |
| `npm test` | Passed: 28 tests |
| `npm run build:testing` | Passed; dynamic preview HTML, empty sitemap, noindex metadata, and blocking robots verified |
| `npm run build:production` | Passed; 31 content routes and three operational routes prerendered |
| `npm run verify:build` | Passed for all content routes, internal links/anchors, local image files, page metadata, structured data, sitemap, legacy redirects, private-route indexing, and missing-page responses |

Tests cover the Eidos block registry and media references; article discovery and rich-text editing; rendered FAQ fields; HTML sanitization; empty new blocks; preview/private SEO; booking pause; exact API envelopes and reservation identifiers; business failures; confirmation payment states; exclusive checkout dates, timezone/DST arithmetic, and legacy availability; longer admin stays; cancellation restrictions; and stale admin/cancellation/confirmation requests.

## Browser checks

Reviewed the supplied design at desktop (1280 × 800) and phone (390 × 844) sizes. Home and article views fit the phone viewport without horizontal overflow. Verified mobile navigation, article search/navigation, suite links, disabled public booking, monthly giving destinations, the live Google prayer calendar and its view controls, and console output without application warnings or errors in the reviewed production pages. The original welcome artwork/timing is retained, with a keyboard-accessible skip and reduced-motion support; its modal keeps focus on the animation while active.

With the explicit localhost fixture, exercised the public date/guest/review flow, checkout request, admin login and 21-night creation, logout, paid and pending confirmations, cancellation preview, and separate cancellation confirmation. Exercised the Eidos preview envelope with a synthetic branch: the changed heading loaded, navigation and anchors preserved the branch, and the preview stayed noindex. These actions created no real booking records, payment sessions, refunds, or email.

Screenshots: [desktop home](screenshots/home-desktop.png), [phone home](screenshots/home-mobile.png).

## Owner acceptance after connection

Follow [EIDOS_HANDOFF.md](EIDOS_HANDOFF.md) for remote repository, App Hosting, and organization metadata setup, then validate a real Eidos edit-preview-publish cycle. Both supplied hosting environments keep public reservations paused.

Before reopening, validate the deployed reservation Functions and an isolated Stripe test setup, including return-origin acceptance, payment/webhook completion, existing records, cancellations/refunds, administrator sessions, and email. The existing local backend source uses live Stripe and excludes `*.hosted.app` from its checkout return-origin whitelist. The frontend preserves those backend contracts; see [RESERVATIONS.md](RESERVATIONS.md) for the known constraints and reproducible local simulation.

No remote repository or deployment was created. The existing Angular MRC site, SCC site, Eidos application, and reservation backend were left unchanged. The final generated `dist/` is the production build and is intentionally ignored by Git.
