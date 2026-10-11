# NRS Authoritative Game Server

> **Project status — 11 October 2026:** Stage 3 (workplace/job/rank/faction framework) is the active, user-approved stage. Stage 4 (market salespeople and bank tellers) is next after Stage 3 acceptance is verified. The Face-Me-I-Face-You visibility defect was fixed in commit `6ccc856` and the user confirmed the buildings now appear in the live Railway game; this closes that specific visual defect, not the full housing or Stage 3 acceptance checklist. See [the roadmap](../../docs/ROADMAP.md) and [the full implementation handoff](../../docs/IMPLEMENTATION-ROADMAP.md).

This directory contains the TypeScript/Node.js WebSocket server for the persistent multiplayer world. In production, Railway deploys the repository from the **repository root** so the browser client and server workspaces are built together. The root start command launches this game-server workspace; this server also serves the built browser client from `services/web-client/dist`.

## Current Railway configuration

- Repository: `MrDan001/Nigeria-RP`, branch `main`
- Root directory: `/`
- Build: `npm run build`
- Start: `npm run start`
- Health check: `/`
- Durable store: PostgreSQL

Do not change this to an isolated `/services/game-server` root without explicitly redesigning and testing how the browser client is built and served.

## Server-owned responsibilities

- authenticated sessions and identity;
- persistent player/life state and player replication;
- movement/input validation;
- housing, rent, tenancy and route eligibility;
- vehicle ownership and car-park exit checks;
- workplace, rank, employment, task, permission and reward validation;
- banking and valuable world-state mutations;
- anti-cheat checks and reconnect/failure handling.

Browser UI may request an action but must never be the final authority for money, owned items, property, ranks or rewards.

## Development checks

Run from repository root:

```bash
npm run typecheck
npm run test:stage1 --workspace nigeria-rp-game-server
npm run test:stage2 --workspace nigeria-rp-game-server
npm run build
```

Stage 3 workplace/job/rank/faction behavior is the active approved stage. Stage 4 market/bank workflows are next after Stage 3 acceptance; see [the full roadmap](../../docs/IMPLEMENTATION-ROADMAP.md).
