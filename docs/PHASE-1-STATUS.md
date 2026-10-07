# Phase 1 — Multiplayer Laboratory Status

## Implemented

### Server
- authoritative Node/TypeScript WebSocket laboratory server
- server-assigned player identity
- server-owned movement
- input clamping
- 10 Hz snapshots
- join/leave presence
- interaction request/response
- HTTP health endpoint

### Unity
- Unity 2022.3 Android project skeleton
- NativeWebSocket transport
- laboratory scene
- runtime-generated test ground
- runtime-generated player avatars
- mobile movement joystick
- interaction button
- follow camera
- server snapshot consumption

### Contracts
- Network Protocol v1 documented.

## Not yet approved as complete

The laboratory is not considered Gate 1 complete until the server is deployed and five real devices/clients can connect simultaneously.

## Current infrastructure blocker

Railway cannot provision the dedicated runtime through the connected account because its trial has expired.

See GitHub Issue #2.

## Gate 1 acceptance

- [ ] Dedicated game server deployed
- [ ] Android build connects
- [ ] 5 concurrent players connect
- [ ] Players see each other
- [ ] Movement is server authoritative
- [ ] Interaction request reaches server
- [ ] Disconnect removes player
- [ ] Reconnect works
- [ ] Low-end Android test completed
- [ ] Gate 1 explicitly approved
