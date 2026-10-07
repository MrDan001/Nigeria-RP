# Railway deployment

The repository is an isolated monorepo. The authoritative multiplayer server lives at:

`/services/game-server`

The root workspace package intentionally delegates the Railway build/start lifecycle to that service so a Railway service configured at repository root can build without relying on dashboard-specific monorepo settings.

## Runtime

- Build: `npm run build`
- Start: `npm run start`
- Health: `/`
- Port: Railway-provided `PORT`
- WebSocket: the same HTTP server upgrades to WebSocket.

## Important

The authoritative game server must run on persistent/dedicated compute. Vercel remains the web/API/admin layer.

For a future isolated Railway service, the preferred configuration is a service root directory of `/services/game-server`, with build `npm run build` and start `npm run start`.

## Deployment acceptance

1. Build succeeds.
2. Service stays online.
3. HTTP health endpoint returns `ok: true`.
4. Public WebSocket connection succeeds.
5. Five simultaneous clients can connect.
