# Nigerian Roleplay Simulator — Master Document

## 1. Vision

NRS is a persistent multiplayer roleplay simulator set in Nigeria. The first city is Port Harcourt. The world is designed around player-to-player services, physical interactions, persistent ownership, a living economy, and meaningful consequences.

The target is Android first, including affordable devices with approximately 3 GB RAM. iOS follows after the Android foundation is stable.

## 2. Non-negotiable principles

1. Real players perform meaningful service roles.
2. Core jobs happen physically in-world.
3. The server owns valuable state.
4. Menus support the world; they do not replace it.
5. NPCs provide ambient life but do not secretly replace designated player services.
6. Persistence must survive disconnects and reconnects.
7. Security and anti-cheat are architectural requirements.
8. Performance is designed for low-end Android from the beginning.
9. No patching broken architecture. Rebuild the correct layer.
10. Major stages require explicit approval before the next stage.

## 3. First playable slice

A small test environment, not the full Port Harcourt map:

**login → spawn → movement → camera → interaction → player visibility → vehicle enter/exit → driving → communication → taxi role → physical passenger pickup/drop-off → server-validated Naira reward → logout → reconnect → persistent state**

Success requires five concurrent real players on low-end Android test devices.

## 4. Core systems

- Identity and character progression
- Mobile movement/camera/interaction controls
- Player sessions and multiplayer replication
- Vehicles and vehicle persistence
- Inventory and items
- Phone and communication
- Jobs and role permissions
- Economy, wallet and banking
- Property and housing
- Businesses
- Crime, police and justice
- Emergency services
- Reputation/social systems
- Time, weather and world simulation
- Port Harcourt world
- Inter-city travel
- Administration/moderation
- Analytics and live operations

## 5. Universal interaction model

Every meaningful interaction follows:

**Look → Prompt → Action → Permission check → Server validation → World action → Result → Persistence**

The client may request an action; it never gets to authoritatively award money, ownership, inventory, job completion or other valuable state.

## 6. Role architecture

Jobs use a common Work framework. Each role defines:

- eligibility;
- equipment;
- work state;
- world locations;
- interaction verbs;
- player-to-player dependencies;
- server validation;
- rewards/expenses;
- reputation;
- failure/consequence rules.

Initial proof role: Taxi Driver.

Future roles include police, mechanic, doctor, pilot, bus driver, delivery worker and other player-run services.

## 7. World architecture

Port Harcourt is the first production city. The eventual world can connect:

Port Harcourt → Lagos → Abuja → Calabar → Aba → Umuahia → Uyo

Inter-city movement is physical by road or flight, with checkpoints/borders and atomic server-side transfer between city simulation contexts.

## 8. Multiplayer architecture

The real-time simulation must run on dedicated authoritative compute. Vercel is not the sole game-server platform.

Responsibilities:

- Unity: presentation, input, prediction/interpolation and client UX.
- Game server: authoritative world/session simulation and replication.
- Vercel/API layer: web services, account/profile APIs, admin, webhooks and suitable non-realtime endpoints.
- PostgreSQL: durable state.
- Redis/equivalent: transient presence/cache/coordination where justified.

## 9. Security

Never trust client claims for:

- money;
- inventory;
- vehicle ownership;
- property ownership;
- job completion;
- permissions;
- player position when it affects valuable outcomes;
- administrative actions.

All valuable mutations are validated server-side and recorded where appropriate.

## 10. Performance target

Android is the primary target. Every major system must be tested on low-memory hardware, not only developer phones.

Performance priorities:

- controlled scene complexity;
- object pooling;
- efficient replication;
- distance-based interest management;
- compressed network state;
- low draw calls/material overhead;
- bounded memory use;
- graceful degradation for low-end devices.

## 11. Approval gates

### Gate 0 — Architecture
Repository, architecture, stack, networking approach and first slice approved.

### Gate 1 — Foundation
Players can connect, move, see one another and persist identity.

### Gate 2 — Vehicle
Vehicle ownership, enter/exit, driving and server validation work.

### Gate 3 — First role
Taxi workflow works physically between real players.

### Gate 4 — Persistence
Disconnect/reconnect preserves authoritative state.

Only after Gate 4 do we expand the production city and additional jobs.

## 12. Definition of done

A system is not done because its UI appears.

It is done only when:

- client behavior is implemented;
- server validation exists;
- persistence exists where required;
- failure/reconnect behavior is tested;
- low-end Android behavior is tested;
- multiplayer behavior is tested;
- exploit paths are considered;
- documentation is updated;
- the relevant approval gate passes.
