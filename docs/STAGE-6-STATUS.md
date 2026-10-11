# Stage 6 — Rivers State Government & Civic Finance

**Status: DEPLOYED — Stage 1–6 automated regression, server typecheck/build, browser build and Railway production deployment passed.**

- Reuses the existing Rivers State Government workplace and six-rank ladder.
- Persistent treasury starts with a recorded ₦5,000,000 opening allocation. Public-housing rent credits it; daily government payroll and government workplace task pay debit it. Citizen cash and bank balances remain separate.
- Rank-calculated payroll can be claimed once per Nigeria-time game day and is blocked when the treasury lacks funds.
- Rank-2 government staff can publish official announcements with a server-side cooldown.
- The appointed Rank-6 Governor is the only ordinary in-game official who can authorize state expenditure, capped at ₦1,000,000 per transaction with a required purpose.
- Treasury transactions include actor, amount, direction, purpose, time and resulting balance. Client-supplied treasury balances are never trusted.
- Known limitation: the existing shared workplace ranks combine Vice Chairman, Special Adviser and PRO at Rank 2; this stage does not distinguish those sub-posts.

Stage 6 automated tests cover rent credits and replay, treasury-funded government duty pay, daily payroll, announcement permissions/cooldown, spending caps and persistence normalization. Game Server CI runs the Stage 6 suite plus Stage 1–5 regression, typecheck and builds. Integrated testing across Stages 1–6 will follow deployment. Manual Android/two-account checks remain explicitly unclaimed until performed.

Railway commit/deployment label: **Stage 6: Rivers State Government and Civic Finance**. Deployed commit: `f4e795c446bdc5927b9cc3ec30f72bafa32fdee4`.

Android debug-APK was still in progress at last check; real-device and two-account review are not claimed as performed.
