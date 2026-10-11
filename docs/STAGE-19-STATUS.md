# Stage 19 — Remembered Accounts and Character Selection

## Scope
- Keep a server-issued, long-lived session token on the current device; never store the player's password.
- Remember the player's email and show a saved-character chooser when the game is reopened.
- Each login owner can own at most three independently saved characters.
- Character names are globally unique, case-insensitively, and follow Firstname_lastname format.
- Existing accounts are migrated with their current character preserved as their first character.
- The server validates character ownership, name uniqueness and the three-character cap.

## Verification
- Browser build and server type-check must pass before the stage is accepted.
- On mobile, log in once, close/reopen, verify the chooser appears, continue a character, create the second and third characters, and confirm a fourth is rejected.
- Confirm names differing only by letter casing are treated as duplicates and each character has independent progress.

Status: implementation committed; CI and Railway verification pending.
