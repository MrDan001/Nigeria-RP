# Stage 7 — Police, Army, FRSC & Fire Service

**Release:** Stage 7: Police, Army, FRSC and Fire Service  
**Status:** Implemented on main; automated regression and deployment verification follows the release commit.

## Scope delivered

- Reuses the existing Police, Army, FRSC and Fire Service workplaces and six-rank ladders ending at Commissioner of Police, Brigadier General, Sector Commander and Chief Fire Officer.
- Server-authoritative incident reports cover crime, traffic accidents, fires and major public-safety incidents. The authoritative server position is recorded, not a client-supplied location.
- Dispatch checks the appropriate unit, rank, duty status and uniform. Assigned incidents persist and remain linked to response outcomes.
- Police investigations, arrests and case closure require an assigned active case, on-duty uniform, rank, server-computed proximity, reason and evidence. The system rejects self-arrest, duplicate incident arrests and targets in private interiors.
- FRSC/Police road clearance and Fire Service response outcomes must be recorded at the incident location.
- Recognised traffic offences have rank-based fine ceilings. Fine settlement debits online citizen cash and credits the Stage 6 state treasury in one database transaction with the incident and audit record.
- Army checkpoints use server-defined locations; only an authorised nearby Army officer can activate them, activation expires after 20 minutes, and the movement server rejects unauthorised crossing.
- Custody automatically expires, freezes ordinary server movement, offers citizens an appeal reviewed by an independent senior Police officer or protected administrator, and provides a logged escape attempt only after the delay and when no on-duty Police officer is nearby.
- Actions are persisted in a bounded audit trail with actor, target, reason/evidence, time, and value details where applicable. Duplicate request IDs are rejected; reporting has a server-side cooldown.

## Verification boundary

The Game Server CI runs the Stage 1–7 domain suites, then typecheck and build. Browser-client and Android debug-APK workflows are also expected to run after the main push. Real-device visual checks and a live two-account session are not claimed unless performed explicitly.
