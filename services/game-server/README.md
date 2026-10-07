# NRS Authoritative Game Server

This is the runtime boundary for the persistent multiplayer simulation.

Railway deploys this service from the repository subdirectory `/services/game-server`. The browser client is deployed separately and is not part of the game-server build.

The game server owns:
- sessions
- authoritative player state
- movement validation
- player replication
- vehicle state
- proximity interactions
- role/work state
- valuable world state
- anti-cheat validation
- reconnect/handoff behavior

This service must not depend on Vercel request lifetime for its core simulation loop.

Before implementation is locked, benchmark the candidate networking/runtime stack against mobile bandwidth, latency, vehicle synchronization, interest management, reconnects and hosting cost.
