# NRS Network Protocol — Client/Server Contract Notes

> **Current project status — 11 October 2026:** Stage 3 is active; Stage 4 (market salespeople and bank tellers) is the next planned stage after Stage 3 acceptance. Production is hosted on Railway. See [the roadmap](../docs/ROADMAP.md).

## Purpose

This document records the intended boundary between the current browser-native Three.js client and the authoritative TypeScript/Node.js WebSocket game server. It is a domain-contract summary, not a claim that every example message name below exists verbatim or that every live message is already version-tagged. For shipped behavior, inspect `services/web-client/public/nrs-online.js` and `services/game-server/src/server.ts`.

## Rule

The client sends **intent**. The server authenticates, authorizes, validates and commits valuable state. The browser displays the server result; it is not the source of truth.

## Message categories

Examples of the supported domain categories include:

### Client → Server

- Authentication and session requests
- Movement/input snapshots and contextual interactions
- Vehicle and car-park entry/exit requests
- Work applications, duty state, task requests and rank/roster actions
- Housing, rent, interior and route requests
- Bank, wallet and player-transfer requests
- Chat and communication messages

### Server → Client

- Authentication/session outcomes
- Player and world snapshots
- Housing and workplace state
- Task, job, bank and interaction results
- Wallet/balance updates and receipts
- Player presence, notifications and server errors

The concrete request/response names and payloads must be read from the current client/server implementation rather than inferred from this list.

## Valuable actions

Never trust the browser alone for:

- cash, bank balances or transaction values;
- inventory, product stock or item grants;
- vehicle/property ownership and rent;
- job eligibility, ranks, permissions or boss identity;
- task completion, commission, salary or reward amounts;
- consequential position/proximity claims or administrative actions.

Mutations that move money or couple money with inventory, property or rewards should be atomic or idempotent so retries and reconnects cannot duplicate value.

## Compatibility and versioning

When the live protocol is formally versioned, document its envelope, validation and migration policy here. Do not claim universal protocol-version enforcement until it is implemented and tested across both endpoints.

## Current stage gate

Stage 3 workplace/job/rank/faction work is active. Stage 4 commerce/banking is next after Stage 3 acceptance. The live Face-Me-I-Face-You rendering defect was corrected in commit `6ccc856` and confirmed visible by the user; this was a browser rendering/registration fix, not a protocol change.
