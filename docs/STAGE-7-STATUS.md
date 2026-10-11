# Stage 7 — Police, Army, FRSC & Fire Service

**Release:** Stage 7: Police, Army, FRSC and Fire Service  
**Status: DEPLOYED — Railway production succeeded on 11 October 2026 at commit `3d50df0da4a1cfb749bbc56d9a844c2a6ca1d29e`. Stage 1–7 regression (including 13 Stage 7 tests), typecheck, server/browser builds, Browser Client Build and Android debug-APK workflows passed.

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

The Game Server CI for `3d50df0da4a1cfb749bbc56d9a844c2a6ca1d29e` passed Stage 1–7 suites, including 13 Stage 7 tests, typecheck and production builds. Browser Client Build and Android debug-APK workflows passed. Railway reports the service online with one running replica, successful `/` health check, PostgreSQL online and no pending changes. Deployment: `79abcb4f-0a1c-485d-ae0f-929fc0d16c4a`. Real-device visual checks and a live two-account session remain unclaimed.
