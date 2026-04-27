# Frontline Art Assets

Runtime art for the officer-war slice now lives under `assets/frontline-officer`.

## Active Runtime Packs

- `assets/frontline-officer/ukrainian-camp`: fictional enemy camp sprites. The raw legacy key is `camp-a`, but runtime lookup swaps it onto `camp-b`, the left-side Ukrainian enemy camp.
- `assets/frontline-officer/russian-camp`: fictional player camp sprites. The raw legacy key is `camp-b`, but runtime lookup swaps it onto `camp-a`, the right-side Russian player camp.
- `assets/frontline-officer/environment`: foliage and battlefield scatter sprite sheets used around camps and the contested center.

The camp art is faction-readable but fictionalized. Do not add real unit insignia, official flags, slogans, or current-event markings.

## Scene Integration

`src/game/scene/frontlineCampAssets.ts` is the active manifest for the runtime camp and environment art. Camp simulation sides stay fixed: `camp-a` is the right-side Russian player camp, and `camp-b` is the left-side Ukrainian enemy camp. `getFrontlineCampAssetKey` and `getFrontlineCampSheetKey` invert the legacy visual faction lookup so the correct art appears without moving spawns, labels, health, soldiers, or orders. `src/game/scene/RaidScene.ts` preloads those PNGs/sprite sheets, places persistent camp compounds near the town-war camp spawns, and keeps the existing dynamic camp rings/command overlays on top.

Both camp packs have runtime props for the current first-town compound: damaged command/tent states, logistics truck, wreck, mortar pit, wire belt, trench firing bay, checkpoint, medical dugout, generator, field kitchen, large supply dump, camo storage, command core, large tent, motor-pool truck, supply dump, and trench gate. The runtime also uses camp detail sheets for services, interiors, modules, heavy emplacements, perimeter pieces, supply stacks, damage decals, abandoned-camp scatter, camo command, night watch, recovery medical, logistics markers, signal panels, ground markers, and fieldwork stages. The Russian-side pack additionally exposes a trench-module sheet, used as extra opposing-camp perimeter dressing.

The environment pack is now runtime-active beyond the original road/foliage pass. The first-town scene places muddy road edges, trench edges, shell scars, tree-line blockers, concealment foliage, ruined village props, crater-field tiles, mud/water terrain, industrial ruin scatter, seasonal foliage, rural fields, hedgerows, orchard foliage, wet mud, artillery aftermath, weather haze, woodland terrain, woodland 32 px foliage, 96 px trees, 64 px logs, 128x96 tree-line clumps, deadfall cover, dense bushline, and bare-tree props around the camps and contested center.

Use `node scripts/generate-frontline-art.mjs` for the baseline deterministic PNG set. If adding hand-authored or one-off generated sprites, update the relevant pack `manifest.json` and this doc.
