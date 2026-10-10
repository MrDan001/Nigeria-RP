# Contributing to NRS

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
