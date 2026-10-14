# Nigeria RP source layout

The browser game source is stored as seven ordered fragments in `game-source/`, each below 100 KB. The build assembles them into seven ordered classic-script assets in `public/`; the page loads those assets sequentially before `nrs-online.js`. This preserves the shared global scope and original initialization order. Do not wrap them in modules or change their order without testing the complete game.

Browser source order:
1. `01-world-foundation.js.part`
2. `02-controls-and-city-architecture.js.part`
3. `03a-traffic-and-interiors.js.part`
4. `03b-careers-and-city-services.js.part`
5. `04a-news-market-and-hospital.js.part`
6. `04b-government-finance-and-navigation.js.part`
7. `04c-hud-fuel-and-runtime.js.part`

Courier delivery routing lives in `game-source/03a-traffic-and-interiors.js.part`: it builds its address pool from the Port Harcourt housing catalogue, apartment/building entrances and registered shop/workplace POIs. `04b-government-finance-and-navigation.js.part` handles parcel pickup, recipient drop-off and reward settlement; `04c-hud-fuel-and-runtime.js.part` displays the current waypoint on the map. Run `npm run typecheck` and `npm run build` from `services/web-client` after changing these fragments; `index.html` script query keys must be bumped when the assembled browser assets change.

The authoritative server is stored as four ordered fragments under `src/server-source/`, also each below 100 KB. Build, typecheck, development and test commands assemble the exact original `src/server.ts` before TypeScript runs. The generated monolithic source is ignored by Git.

Server source order:
1. `01-server-foundation.ts.part`
2. `02-player-and-world-persistence.ts.part`
3. `03-workplace-services-and-actions.ts.part`
4. `04-lifecycle-sync-and-runtime.ts.part`

These files are ordered source fragments, not independent modules. Their purpose is to keep committed source files manageable while preserving existing declarations, shared state, APIs, and startup behavior exactly. Build scripts assemble them automatically.
