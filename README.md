# Monastery of the Risen Christ · React

React, TypeScript, and Vite replacement for the Angular MRC website. The design and primary content follow the approved October 2026 mockup. Production content, Eidos preview loading, media normalization, prerendering, and App Hosting follow the San Carlos Cathedral V5 model.

## Run locally

```sh
npm ci
npm run dev
```

The default development build reads local `public/pages.json`, so it works before a remote repository or Eidos connection exists. Public reservations are paused by default in every environment.

```sh
npm run validate:content
npm run typecheck
npm test
npm run build:production
npm run verify:build
npm start
```

The production server listens on `PORT` (8080 by default). Set `HOST=127.0.0.1` for local-only access. `npm run build:testing` creates the dynamic Eidos preview build; `npm run dev:testing` runs that mode locally. Preview mode needs the new repository to be available to the existing preview function.

## Content and structure

- `public/pages.json`: runtime and Eidos source of truth; 31 seeded content pages.
- `public/block-schema.json`: 22 block types using the existing Eidos editor contract.
- `public/claims.json`: empty initial claims, ready for Eidos branch ownership.
- `routes.txt`: Eidos-compatible content route list. Eidos updates this when pages change.
- `src/app/lib/eidos-data.ts`: SCC-based production/preview loader and media normalization.
- `src/app/components/Blocks.tsx`: full-width block stack and responsive layouts inside each block.
- `src/app/components/Reservations.tsx`: managed suite booking, admin, confirmation, and cancellation.
- `src/app/lib/reservation-api.ts`: existing Firebase HTTP contracts; no Firestore booking access.
- `src/app/lib/config.ts`: repository, endpoints, calendar feed, and operational booking pause.
- `public/assets/`: supplied optimized photographs and licensed local fonts.
- `public/asset-map.json` and its matching source copy in `src/app/lib/asset-map.json`: map initial absolute CMS image URLs to bundled optimized copies. Content validation checks that these copies agree. Newly selected Eidos images render directly.
- `content/`: import provenance and initial source snapshots, not runtime CMS data.

`scripts/generate-content.mjs` is an explicit seed/reset utility. **Do not run it during normal builds or after editorial changes without reviewing what it would overwrite.** Builds read the current Eidos-edited JSON and never regenerate it from the initial snapshots.

## Handoff

Read [Eidos connection](docs/EIDOS_HANDOFF.md), [content editing](docs/CONTENT_EDITING.md), [reservation compatibility](docs/RESERVATIONS.md), and [verification results](docs/VERIFICATION.md).

No remote repository, deployment, Eidos code change, Firebase configuration change, booking-data migration, or live Stripe transaction is required to review this local repository. The owner completes the remote/Firebase connection and then validates the real Eidos edit-preview-publish cycle.
