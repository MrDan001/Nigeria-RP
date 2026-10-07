# NRS Technical Architecture

## Repository

```
/
├── game/                 # Unity project
├── services/             # Backend/API services
├── admin/                # Admin and moderation web application
├── infrastructure/      # Deployment/configuration
├── docs/                 # Product and technical documentation
├── tests/                # Cross-system/integration tests
└── tools/                # Developer/content tooling
```

## Runtime boundaries

### Unity client
Responsible for rendering, input, local UX, animation, audio, camera, local prediction/interpolation and sending requests.

### Authoritative game server
Responsible for sessions, player state, movement authority, vehicles, proximity interactions, role state, world state, replication and anti-cheat validation.

### API/web layer
Responsible for authentication flows, account/profile services, admin tools, dashboards, webhooks and non-realtime operations.

### PostgreSQL
Source of truth for durable player/account/game data.

### Redis/equivalent
Only for state that genuinely benefits from fast transient storage, presence, coordination or caching.

## Data ownership

Client:
- input;
- presentation;
- temporary prediction.

Server:
- money;
- inventory;
- ownership;
- permissions;
- job completion;
- authoritative world state;
- persistent character state.

Database:
- durable records.

## Networking decision

Do not lock the project to a networking framework until the Stage 0 benchmark compares viable approaches against:

- 5/20/50+ concurrent players;
- vehicle synchronization;
- mobile bandwidth;
- latency;
- reconnect behavior;
- interest management;
- server authority;
- hosting cost;
- development complexity.

## Vercel boundary

Vercel is part of the platform, not the entire multiplayer simulation. It can host the web/admin/API layer and suitable realtime/API workloads, while the dedicated game server owns the persistent simulation.

## Development rule

If a system crosses runtime boundaries, define the contract before implementation. Avoid hidden coupling between Unity, APIs and database internals.
