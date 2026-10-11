# Phase 1 — Multiplayer Foundation Status (Historical Record)

> **Historical note — updated 11 October 2026:** This file began as an early multiplayer-laboratory plan and is not the live stage/status authority. The project has since moved to a browser-native Three.js client and a TypeScript/Node.js WebSocket server on Railway. Current state and approval gates are maintained in [the roadmap](ROADMAP.md) and [the implementation handoff](IMPLEMENTATION-ROADMAP.md).

## Foundation that remains relevant

The multiplayer foundation must provide:

- server-assigned player identity and authenticated sessions;
- server-validated movement/input and bounded network messages;
- join/leave presence and player visibility;
- contextual interaction request/result handling;
- a shared HTTP health endpoint and WebSocket runtime;
- reconnect behavior that recovers the same saved citizen and does not duplicate progression;
- persistence backed by the configured PostgreSQL store.

The production browser client is now in `services/web-client/`; the authoritative server is in `services/game-server/`. Old prototype/client assumptions recorded before that runtime was established must not be treated as current implementation requirements.

## Acceptance still required as a release regression

- [ ] Verify two separate accounts can join the same production world and see one another.
- [ ] Verify movement and consequential changes are validated by the server.
- [ ] Verify interaction requests produce authoritative results.
- [ ] Disconnect and reconnect; confirm saved identity and valuable state remain intact.
- [ ] Complete a real-device Android performance check.
- [ ] Preserve this foundation while testing Stage 3 work; do not claim five-player production capacity until it has been measured.

This historical phase note does not override Stage 3 as the current approved implementation stage.
