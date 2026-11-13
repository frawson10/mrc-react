# MRC React website launch audit

Audited November 11, 2026, before the main-domain migration. The starting checkout was clean at commit `b01a401` (`updates`).

## Launch decision

**The updated source is ready for deployment and a final domain cutover check. Deploy the audit fixes before switching the domain.** No unresolved website code or broken-content-link blocker was found in the checks below. The domain migration itself remains an owner action, including correcting the existing `www` hostname problem.

Public reservations remain paused. No commit, source push, hosting deployment, DNS change, live reservation, cancellation, refund, or payment submission was performed during this audit.

| Environment | Observed state |
| --- | --- |
| [Current main domain](https://mrcslo.com/) | Still serves the predecessor website; HTTPS works and HTTP redirects to HTTPS |
| [Current www hostname](https://www.mrcslo.com/) | Returns HTTP 404; configure it during cutover and redirect it to the preferred bare domain |
| [React production site](https://mrc-react--eidos-sites.us-central1.hosted.app/) | Responds successfully; build-info identifies a production build; its published pages.json matched the starting local content exactly |
| Local audited release | Includes the fixes below, passes the checks below, and ends with a production dist build |
| React production rollout | Still needed to publish this audit's code, content polish, and security patches |

## Fixes made locally

1. **Unlocked navigation after resizing.** Opening the mobile menu makes the page behind it inactive. Previously, widening the browser into the desktop layout hid the menu toggle while leaving the page inactive and scrolling locked. The menu now closes when crossing the desktop breakpoint, restoring interaction and scrolling. Reproduced before the fix and confirmed in Chrome afterward.
2. **Fixed direct reservation-link rendering.** The production build prerenders pages without query parameters. Direct cancelled-checkout links and emailed cancellation links could render different content immediately in the browser, causing a React hydration warning and replacement of the prerendered markup. Query-dependent notices and reservation loading now wait until the first browser render matches the page. Added regression coverage for the retreat cancellation notice, confirmation cancellation notice, and emailed cancellation link. No booking or payment contract changed.
3. **Made News & Events search wording consistent.** Its search label, default search hint, All stories filter, and no-results message now refer to news/stories rather than the reflections library/resources. Schema-provided search hints still take precedence.
4. **Cleaned up imported article text.** Replaced two generic YOUTUBE VIDEO link labels with Watch the recorded homily, preserving their destinations. Corrected one San Luis Obispo place-name transcription. Article instance IDs, page paths, ordering, and archive dates were preserved.
5. **Applied compatible security patches.** Updated DOMPurify 3.4.13 → 3.4.17, Vite 6.4.1 → 6.4.6, and transitive source-map-js 1.2.1 → 1.2.2. The initial npm audit flagged three affected packages (one critical, two high by package severity). The final audit reports zero known vulnerabilities across production and development dependencies. The advisory ratings do not establish that the particular vulnerable modes were exploitable in this application. These remain within the existing major versions. See the maintainers' [DOMPurify release](https://github.com/cure53/DOMPurify/releases/tag/3.4.17) and [Vite release](https://github.com/vitejs/vite/releases/tag/v6.4.6).

## Verification results

| Area | Result |
| --- | --- |
| Content/schema validation | Passed: 31 pages, 22 block types, 381 unique schema IDs |
| Quick Edit configuration | Passed: Add Announcement, Edit Announcements, Add Reflection, Edit Reflections |
| TypeScript | Passed as part of both builds |
| Automated tests | 36 passed, including two new regression tests covering the rendering and menu issues |
| Production build | Passed; 31 content pages and three operational routes prerendered |
| Production route verification | Passed: every content route, internal link, anchor, bundled image, page metadata, structured data, sitemap, legacy checkout redirect, private-page indexing, and missing-page response |
| Browser page coverage | All 31 public pages at widths 1440, 768, 390, and 320 pixels: 124 page views |
| Browser errors/resources | No application errors or failed resource requests in the final walkthrough; no broken rendered images, horizontal overflow, duplicate IDs, missing image alt attributes, empty unnamed links, or visible unlabelled form fields found |
| Testing build | Passed: dynamic draft-route fallback, noindex HTML and response headers, blocking robots.txt, and empty sitemap |
| Dependency audit | Zero known vulnerabilities after the patch updates |
| Whitespace checks | Passed |

Reviewed desktop and phone screenshots of the home page, visiting, retreats, community, reflections, news, support, contact, calendar, and representative articles. Also exercised mobile menu/Escape behavior, the desktop resize transition, article navigation, reflection and news search, empty results, category filtering, FAQs, suite details, donation frequency switching, and calendar Month/Week/Agenda controls.

These are practical launch and basic accessibility checks, not a formal WCAG conformance assessment or penetration test.

## Deployed routes, links, and search readiness

Read-only checks against the existing React deployment covered 43 URLs: all 31 public content pages, all three operational pages, robots.txt, sitemap.xml, two missing-page/asset cases, and five legacy redirects. All expected statuses matched. Admin, confirmation, and cancellation routes have noindex metadata and response headers. Missing pages and assets return real 404 responses.

The old navigation's renamed routes remain covered:

| Old route | New destination | Deployed response |
| --- | --- | --- |
| /our-ministry | /community | 308 |
| /announcements | /news | 308 |
| /support-us | /support | 308 |
| /retreat-opportunities | /retreats | 308; cancelled-checkout query retained |
| /restorative-partners | /partners | 308 |

Existing /calendar, /contact, and /reflections paths remain available. Production canonical URLs and the 31-entry sitemap use https://mrcslo.com. Operational routes are excluded from the sitemap. Production ignores draft-branch query parameters by configuration; testing remains excluded from indexing.

All 22 distinct third-party destinations/endpoints checked responded with HTTP 200: eight Stripe donation links, three videos, two PDFs, the book publisher, Crux, Living Water, Restorative Partners giving, Google Maps, the public Google calendar, and the three social profiles. Both document responses have PDF content types and PDF file signatures. YouTube's player metadata reported all three videos playable with the expected titles.

Read-only browser inspection of the Stripe pages confirmed the monastery name and the correct recurring amounts for $10, $20, $25, $50, $75, $100, and $200 per month. The one-time giving page also opens. No donor information was entered or payment submitted. Stripe-hosted pages are live payment pages, separate from the paused room-reservation flow.

Telephone/email links have the intended destinations; no calls or messages were sent. External pages can change after this audit, and social sites can require a visitor to sign in.

## Reservations: keep paused

- apphosting.yaml, apphosting.production.yaml, and apphosting.testing.yaml retain VITE_PUBLIC_RESERVATIONS_PAUSED=true.
- The application defaults to paused unless the build setting is explicitly false. There is no date-based automatic reopening.
- Both the deployed React site and the audited release show the pause notice and disable all three suite reservation buttons.
- The browser walkthrough made no reservation-service requests. The API-client test also confirms that a paused public checkout is rejected without a network request.
- Admin access and existing-reservation confirmation/cancellation remain available; they do not reopen new public booking.
- The existing Firebase reservation backend itself does not globally enforce this website pause. Its functions and data were not changed. Reopening or enforcing a service-wide pause is a separate backend operation; the website must remain paused for this launch.
- The notice still describes the evacuated monks and the conditional hope of reopening after February 2027. That text is informational; the pause flag continues to control access until explicitly changed.

Live payment, refund, email delivery, administrator authentication, and actual booking creation were intentionally not exercised. Reservation contract and race-condition tests use synthetic responses. Retain the existing reopening acceptance steps in [RESERVATIONS.md](RESERVATIONS.md) for any later decision to reopen.

## Editorial status

No lorem ipsum, example-domain links, test email addresses, or unfinished placeholder articles were found in the published page content. Search input hints and explanatory error states are intentional interface copy.

The existing year-not-specified labels on archive notices are retained with the owner's explicit approval for launch. No event years were guessed. The news listing and relevant notices direct readers to confirm current arrangements. Existing original writings/transcripts retain their authored wording apart from the small corrections listed above.

One optional polish item is outside this repository: the one-time Stripe donation description includes a duplicated punctuation mark after “however large or small”. It can be corrected in Stripe's payment-link/product copy; it does not prevent giving or the domain switch.

## Publish and domain cutover

1. Review and commit this audit's changes in mrc-react. Its App Hosting rollout is triggered by the configured main branch. Publish the reviewed commit:

   ```sh
   cd /Users/finrawson/symp/clients/mrc/mrc-react
   git push origin main
   ```

2. Wait for the production App Hosting rollout to succeed, then check the hosted.app site. Verify the menu resize fix, News & Events wording, a cancelled-checkout return link, and all three disabled reservation buttons. Keep the production target and reservation pause settings as above.
3. In the production App Hosting backend's domain settings, use the **Migrate a domain** workflow for mrcslo.com. Follow Firebase's generated records and preparation/traffic-switch order. Add www.mrcslo.com and configure it to redirect to the bare domain. Firebase documents domain preparation, certificate provisioning, and the optional redirect in its [custom-domain migration instructions](https://firebase.google.com/docs/app-hosting/custom-domain#migrate-a-domain). No DNS record values have been guessed or changed here.
4. Preserve the old site's deployment and record the current DNS configuration for rollback until the new domain is accepted. Keep email-related DNS records intact.
5. After cutover, verify both HTTPS hostnames, HTTP-to-HTTPS behavior, the five legacy redirects, direct article loads, missing-page 404s, images, calendar, giving links, and the continued reservation pause. Confirm the new sitemap at https://mrcslo.com/sitemap.xml, then submit/update it in Search Console.
6. If final acceptance fails, use the retained old deployment and recorded domain configuration to restore service while investigating.

This is the existing Firebase App Hosting site. No generic static Hosting deploy, Firebase Functions deployment, Firestore rules/index change, reservation-data migration, or Eidos deployment is required for these audit fixes.

## Reproduce local release checks

Use Node.js 22 or another supported project runtime:

```sh
cd /Users/finrawson/symp/clients/mrc/mrc-react
npm ci
npm test
npm run validate:quick-edit
npm audit
npm run build:production
npm run verify:build
```

The repository was left with a production build in dist. No development-only reservation-unpause setting was used.
