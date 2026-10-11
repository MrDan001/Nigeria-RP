# Stage 0 — Repository and Delivery Foundation (Historical Status)

> **Status refreshed 11 October 2026:** Stage 0 has been superseded by the live Railway-hosted browser game. This file is a historical record, not an active deployment blocker or the current stage authority. Use [the roadmap](ROADMAP.md) for the current stage.

## Foundation established

- Repository and documentation structure established.
- Product specification, technical architecture, contribution rules and stage roadmap added.
- Network/client-server contract notes added.
- Root workspace build/start scripts configured.
- Browser client and TypeScript game-server workspaces established.
- HTTP health response and GitHub Actions workflows added.
- Railway production deployment is connected to `MrDan001/Nigeria-RP` on `main`.

## Superseded assumptions

Early notes referred to a planned API-hosting setup and a different client/server boundary. Those were planning-time notes and must not override the current production facts: the game is browser-native, the Railway `Nigeria-RP` service builds the browser workspace and runs the authoritative Node/WebSocket server, and PostgreSQL provides durable storage.

## Foundation maintenance checklist

- [ ] Keep both the browser-client and game-server workflows green.
- [ ] Keep root `npm run build`, `npm run typecheck`, Stage 1/2 tests and Railway health checks reproducible.
- [ ] Keep backup/recovery and rollback guidance current.
- [ ] Test production gameplay after deployment; successful health checks are not gameplay acceptance.

Stage 3 is the current user-approved implementation stage. Stage 4 is next after Stage 3 acceptance, as documented in [ROADMAP.md](ROADMAP.md).
