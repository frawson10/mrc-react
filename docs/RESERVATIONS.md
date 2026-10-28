# Reservation compatibility and acceptance

The React site uses the existing MRC reservation Functions and private records. It never reads or writes Firestore booking documents directly. No backend function, Stripe secret, webhook, email template, security rule, or data record is changed by this repository.

## Public flow

Availability → arrival/checkout dates → guest details → review → one server-created Stripe Checkout session → existing server confirmation/webhook → confirmation page. The current backend creates the temporary date hold when checkout starts. The unsupported early `mode:hold` protocol from the Angular client is not sent, and guest-details copy does not claim an early hold.

The service controls the deposit (currently 12,000 cents) and payment deadline (30 minutes plus the existing buffer). The frontend requires public stays of 1–7 nights, allows longer admin stays, and treats checkout as exclusive. It keeps calendar day keys for selection, uses UTC arithmetic for nights, and sends explicit noon-UTC ISO instants to the existing UTC Functions parser so visitor timezones do not shift chosen days.

Public booking is blocked in both the widget and API client unless `VITE_PUBLIC_RESERVATIONS_PAUSED=false` is explicitly set at build time. Supplied production/testing configuration keeps it `true`. This preserves the approved pause; the existing backend itself does not enforce that pause.

## Stable routes and records

- Exact suites: `St. Scholastica`, `St. Benedict`, `St. Romuald`.
- Records: `clients/MRC/booking/{suite}/reservations/{reservationId}`.
- Success: `/reservation/confirm?session_id=…`.
- Cancelled checkout: `/retreat-opportunities?checkout=cancelled`, redirected to `/retreats` with its query intact.
- Cancellation email: `/cancel-reservation?token=…` on `mrcslo.com`.
- Admin: `/admin`, preserving the `mrc_admin_session` sessionStorage key on the same origin.

Legacy confirmed records, payment deadlines, and `paymentId` fallback remain backend-compatible. Request keys such as `reservationID` retain the backend's exact casing. HTTP 200 business failures are displayed as failures. Mutations are not automatically retried.

All calls POST `{data:{...}}` and consume `{data:{...}}` through the configured Functions origin. Endpoints include availability, checkout creation/confirmation, admin login/list/logout/create/cancel, cancellation token preview/lookup, and cancellation by token/lookup.

## Admin and privacy

Admin views include occupancy calendars, next reservations, per-suite records, search, pagination, protected creation, and cancellation. Logout and session expiry clear guest data and the stored token. Late requests cannot restore a logged-out session. The existing test-record email filter is retained for the table; occupancy still accounts for all blocking records.

Cancellation acts on the credentials/token that verified the displayed reservation, with a separate confirmation dialog. Guest text returned HTML-escaped by the backend is decoded and rendered as text. No reservation query parameters, guest inputs, admin actions, or cancellation actions are sent to website analytics. System pages use noindex and stricter referrer handling.

## Existing backend constraints

The local shared backend source selects **live Stripe**. Older remediation notes describe test mode and are not evidence of the deployed mode. A frontend migration must not assume a Stripe test secret is active.

The current return-origin whitelist allows `mrcslo.com`, HTTPS `*.web.app` and `*.firebaseapp.com`, and local HTTP(S) localhost/127.0.0.1 ports. It does **not** include Firebase App Hosting `*.hosted.app`; unsupported origins fall back to production `mrcslo.com`. Select an accepted test origin or address that separately during owner backend setup before a real checkout test.

Admin creation currently marks a record paid without a Stripe payment reference, while admin cancellation can reject paid records without such a reference. The React site displays that backend restriction; it does not bypass it. Admin cancellation remains future-only, while public cancellation defers eligibility to its existing backend.

## Acceptance boundaries

Automated tests use simulated responses and synthetic guests. Local interface testing uses the committed local fixture service, never real reservations, payments, refunds, or email. Before public reopening, the owner must validate deployed function versions and an isolated Stripe test environment, then verify payment success, pending/expired sessions, cancellation/refunds, legacy records, admin sessions, and email delivery. Reopening is an operational decision separate from connecting Eidos.

To exercise the local fixture, start `node scripts/mock-reservations.mjs` in one terminal. In another, run:

```sh
VITE_RESERVATION_API_BASE_URL=http://127.0.0.1:5176 \
VITE_PUBLIC_RESERVATIONS_PAUSED=false \
npm run dev -- --host 127.0.0.1 --port 5177 --strictPort
```

Use the synthetic admin password `local-demo`. Confirmation fixtures accept `cs_test_paid` and `cs_test_pending`; cancellation accepts `fixture-token`. The public checkout fixture deliberately returns a completion message without redirecting to Stripe. Fixture records are held only in memory and reset on restart. This development-only command does not alter the paused production configuration.

For local Eidos preview verification, add `VITE_SITE_BUILD_TARGET=testing` and `VITE_EIDOS_PREVIEW_ENDPOINT=http://127.0.0.1:5176/bitbucket-githubGetPageDataLatest_v2` to that development command. A `?branch=example` URL changes the home heading to show which draft branch was requested.
