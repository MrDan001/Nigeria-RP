# NRS Network Protocol v1 — Initial Contract

## Purpose

This document defines the boundary between the Unity client and the authoritative game server.

## Rule

The client sends **intent**. The server validates and produces authoritative state.

## Initial message categories

### Client → Server

- ConnectRequest
- InputSnapshot
- InteractionRequest
- EnterVehicleRequest
- ExitVehicleRequest
- StartWorkRequest
- CompleteWorkRequest
- ChatMessageRequest
- DisconnectNotice

### Server → Client

- ConnectAccepted
- ConnectRejected
- PlayerSnapshot
- PlayerSpawned
- PlayerDespawned
- VehicleSnapshot
- InteractionResult
- WorkStateChanged
- WalletChanged
- ChatMessage
- ServerNotice
- DisconnectReason

## Valuable actions

The following can never be trusted from the client:

- wallet balance
- reward amount
- inventory mutation
- vehicle ownership
- property ownership
- job completion
- permission checks

## Versioning

All production messages must carry a protocol version. Breaking changes require a new protocol version and an explicit migration plan.
