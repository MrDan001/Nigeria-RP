# Stage 8 — Rivers News Network

**Status:** Implemented on `main`; automated verification and Railway deployment follow this release.

## Scope implemented

- Reuses the walkable `news-main` newsroom/studio and six-rank ladder: Intern, Production Assistant, Reporter, Anchor, Editor and Editor-in-Chief.
- Rank 3+ newsroom employees submit event-based stories while inside reception, on duty and in the authorised uniform. Headlines, category, body and event/location context are validated server-side. Active Stage 6 government announcements and Stage 7 incidents can be linked as sources.
- Stories stay private in a submitted queue. Rank 5+ Editors approve or reject; rank 4+ Anchors broadcast only editor-approved stories. Editors cannot approve their own submissions.
- Published stories appear in an Android-conscious public feed and as a brief, line-wrapped in-game news notification when a new report is broadcast.
- Citizen story ideas are routed to newsroom staff in person; citizens cannot file or publish directly. Only authorised news workers can submit, Rank 5+ Editors approve, and Rank 4+ Anchors broadcast. Server-side cooldowns, replay protection, profanity filtering, rank/duty/uniform/location checks, content reports, protected moderation and a bounded audit trail remain enforced.
- Editors and protected administrators can dismiss reports or remove stories. Removed stories leave the public feed/ticker and moderation decisions are logged.

## Verification

- Game Server CI includes a dedicated Stage 8 suite alongside Stage 1–7 regression, typecheck and production builds.
- Browser build and Android debug-APK workflows run on the push.
- Railway deployment and health check must be confirmed before marking this stage deployed.
- Real-device visual walkthrough and live two-account newsroom workflow remain unclaimed until explicitly performed.
