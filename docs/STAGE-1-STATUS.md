# Jobs, ranks and homes expansion - Stage 1 (Foundation)

Built on the server (`services/game-server/src`). No new screens yet.

## What is in
- `world.ts`: ranks (6, multipliers x1.0 / 1.25 / 1.6 / 2.0 / 2.6 / 3.5), workplaces with titled ranks,
  6 house classes with daily rent, 30 house slots, car ids, the Nigeria-time (WAT) day clock,
  per-player `life` state, rent settling, and the promotion rule check.
- Storage: new `life` column on `nrs_accounts` and a new `nrs_world` table (file fallback: `world` key in accounts.json).
  Both are created automatically on start-up; existing accounts load with a default life.
- Midnight: the server checks twice a minute. Online players are settled at midnight; offline players when they log in.
- Messages: `getLife` (answer: `lifeState`), server pushes `lifeUpdate` at midnight.
- Test tools, only when the server starts with `NRS_DEBUG_CLOCK=1`: `debugSkipDays`, `debugGiveHome`.
  Client helpers: `NRS.debugSkipDays(n)`, `NRS.debugGiveHome(houseId, rentDays)`, `NRS.getLife()`, and `NRS.life` / `NRS.today`.

## Boss setup (by hand, until the admin tool exists)
Set a workplace boss by writing the account id into the stored world data:
- Postgres: `UPDATE nrs_world SET value = jsonb_set(value, '{bosses,bank-main}', '"<account id>"') WHERE key='world';`
- File fallback: edit `world.bosses["bank-main"]` in accounts.json.
Workplace ids: market-mile1, bank-main, hospital-main, park-main, news-main, gov-rivers.

## Checks
- `npm run test:stage1 --workspace nigeria-rp-game-server` (13 checks, no server needed)
- `npm run typecheck`
