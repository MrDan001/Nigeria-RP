# Nigeria RP game script segments

The large browser game script is now kept as four ordered source fragments under `services/web-client/game-source/`:

1. `01-world-foundation.js.part` — shared setup, 3D world, map geometry and character foundation.
2. `02-controls-and-city-architecture.js.part` — input, player/camera movement, vehicles, garages and city buildings.
3. `03-traffic-homes-and-careers.js.part` — traffic, interiors, homes, workplaces, careers and service systems.
4. `04-news-menus-navigation-and-runtime.js.part` — newsroom, menus, navigation, HUD, fuel systems and the main runtime loop.

These are deliberately **fragments**, not standalone scripts. They must be assembled in this exact order into `public/nrs-game.js`. Do not load the fragments individually or add wrappers around them. The single classic-script bundle preserves the global lexical scope and initialization behavior used by the existing game.

The web-client build and typecheck commands assemble the bundle and syntax-check it before proceeding. The generated `public/nrs-game.js` is kept in the repository as the served asset.
