# Contributing to NRS

> **Project status — 11 October 2026:** Stage 3 (workplace/job/rank/faction framework) is the active, user-approved stage. Stage 4 (market salespeople and bank tellers) is next after Stage 3 acceptance is verified. The Face-Me-I-Face-You visibility defect was fixed in commit `6ccc856` and the user confirmed the buildings now appear in the live Railway game; this closes that specific visual defect, not the full housing or Stage 3 acceptance checklist. See [the roadmap](ROADMAP.md) and [the full implementation handoff](IMPLEMENTATION-ROADMAP.md).

## Golden rule

**Patches are prohibited as a substitute for root-cause fixes.** Do not stack overrides or workarounds to hide a defect.

If the current approach cannot support the required behavior reliably, stop and redesign the responsible layer before adding more features.

## Workflow

1. Read the relevant specification.
2. Create a focused branch.
3. Define the contract before implementation.
4. Implement the smallest complete vertical slice.
5. Test locally.
6. Test multiplayer behavior.
7. Test reconnect/failure behavior.
8. Test low-end Android performance where relevant.
9. Update documentation.
10. Open a pull request.

## No fake completion

A button that opens a panel is not a finished feature. A job that only changes a UI number is not a finished job. A reward that the client can award itself is a security defect.

## Approval gates

Do not start the next major roadmap stage until the current gate has been explicitly approved.


## Production safety

The live game is deployed on Railway from the repository root. After documentation-only changes, do not alter game code or configuration as part of the same task. For gameplay changes, confirm the Railway deployment and then test the exact affected behavior on a real Android/browser client.

## Current stage gate

Stage 3 remains active until its server validation, two-account checks, persistence/reconnect behavior, mobile verification and CI acceptance are recorded. Stage 4 is the next stage, but pre-existing market/bank groundwork in the code does not count as acceptance or permission to skip the Stage 3 gate.
