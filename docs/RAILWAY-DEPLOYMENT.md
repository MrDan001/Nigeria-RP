# Railway Production Deployment

> **Project status — 11 October 2026:** Stage 3 (workplace/job/rank/faction framework) is the active, user-approved stage. Stage 4 (market salespeople and bank tellers) is next after Stage 3 acceptance is verified. The Face-Me-I-Face-You visibility defect was fixed in commit `6ccc856` and the user confirmed the buildings now appear in the live Railway game; this closes that specific visual defect, not the full housing or Stage 3 acceptance checklist. See [the roadmap](ROADMAP.md) and [the full implementation handoff](IMPLEMENTATION-ROADMAP.md).

## Current service

- **Project:** `innovative-imagination`
- **Service:** `Nigeria-RP`
- **Source:** `MrDan001/Nigeria-RP`, branch `main`
- **Root directory:** repository root `/`
- **Production URL:** https://nigeria-rp-production.up.railway.app/
- **Build command:** `npm run build`
- **Start command:** `npm run start`
- **Health check:** `/` (the root serves the game client; `/health` is also handled by the server)
- **Persistence:** PostgreSQL.

The repository-root build compiles the game-server workspace and the browser-client workspace. The root start command starts `nigeria-rp-game-server`; that server serves the built browser client from `services/web-client/dist` and upgrades the same HTTP server to WebSocket. The playable app is therefore served by the Railway production service, not by a separate browser-host deployment.

## Deployment workflow

1. Push approved source/documentation changes to `main`; Railway builds the connected source.
2. Check the exact deployment status in Railway; do not infer success from the existence of a commit.
3. Inspect build/deploy logs if the rollout fails or remains pending.
4. Confirm the deployment is live and the health check passes.
5. For gameplay or client rendering changes, hard-refresh the live game and test the affected behavior on Android. CI and HTTP health alone do not verify visuals, touch controls or multiplayer interactions.
6. Preserve the previous successful deployment for rollback until the new build is verified.

## Deployment acceptance

- [ ] Build succeeds and the service stays online.
- [ ] The public root returns the game client.
- [ ] The public WebSocket connection succeeds.
- [ ] PostgreSQL-backed login/persistence works.
- [ ] At least two clients can connect for basic multiplayer verification; five simultaneous real devices remain a broader capacity acceptance target.
- [ ] Current-stage gameplay acceptance checks are recorded separately from hosting/health checks.
