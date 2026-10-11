# NRS Infrastructure

> **Project status — 11 October 2026:** Stage 3 is active and approved; Stage 4 (market salespeople and bank tellers) is the next planned stage after Stage 3 acceptance. The Face-Me-I-Face-You visibility defect was fixed in commit `6ccc856` and the user confirmed that the buildings now appear on the live Railway game. See [the roadmap](../docs/ROADMAP.md).

## Production topology

- **Source and CI:** GitHub repository `MrDan001/Nigeria-RP`, production branch `main`.
- **Game/web runtime:** Railway project `innovative-imagination`, service `Nigeria-RP`, repository root `/`.
- **Browser delivery:** the Railway service serves the Vite-built browser client from `services/web-client/dist`.
- **Real-time game server:** TypeScript/Node.js WebSocket process from `services/game-server`, started by the root workspace script.
- **Durable persistence:** PostgreSQL.
- **Health check:** Railway service root `/`; the server also exposes `/health`.

## Current commands

From repository root:

```bash
npm ci
npm run build
npm run typecheck
npm run test:stage1 --workspace nigeria-rp-game-server
npm run test:stage2 --workspace nigeria-rp-game-server
npm run start
```

Railway configuration currently uses root directory `/`, build `npm run build`, and start `npm run start`. Do not change the service root or move the app to another host as part of unrelated gameplay work.

## Operating rules

1. Check the actual Railway deployment status after pushing to `main`.
2. Inspect build/deploy logs when the status is not successful.
3. Do not conflate a green health check with successful gameplay testing.
4. Confirm the deployed phone/browser behavior for client rendering or interaction changes.
5. Keep database backup, restore and rollback instructions current before production releases.

Stage 3 is active and approved. Stage 4 is next after Stage 3 acceptance, as specified in [the roadmap](../docs/ROADMAP.md).
