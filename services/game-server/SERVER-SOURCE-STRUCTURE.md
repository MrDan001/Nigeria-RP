# Game server source layout

`src/server.ts` is generated from four ordered source fragments in `src/server-source/` by `scripts/assemble-server.mjs`. It is byte-preserving concatenation; the fragments are not independent TypeScript modules.

Use `npm run dev`, `npm run build`, or `npm run typecheck` as usual. These commands assemble the entry point before the existing tooling runs.
