# Playable North Star Gap Report

The north star promises a game where the player wins by shaping terrain, placing build orders, and watching NPC soldiers survive or die because of those choices. The current playable build has many of the right underlying nouns: camps, soldiers, skills, priorities, build stock, trenches, ammo crates, build orders, cover slots, debriefs, and an Orders drawer. The gap is that most of this work is still expressed as state, text, or debug-friendly UI rather than as the dominant playable experience.

The first problem is access. Building is reachable through a small `Orders` button, then the `Build` tab, then a placement button. That is usable, but it does not yet feel like the main verb of the game. The screen is still crowded by inherited raid HUD, tactical readouts, route text, combat audio cards, and extraction-era panels. The officer tools compete with old systems instead of owning the player’s attention.

The second problem is feedback. The UI can place a trench and queue an ammo crate, but the result is not yet dramatic. The build queue updates, stock changes, and cover count increments, yet the player does not get a strong visual before/after moment: no earth mound, dug channel, direction arrow, sandbag lip, soldiers visibly flowing into the trench, or clear “this saved them” battlefield read.

The third problem is art quality. Trenches are currently drawn with Phaser primitive lines and ellipses on top of the scene. They read like debug marks, not terrain. They do not carve into the ground, connect into networks, cast shadows, show depth, show facing, or visually explain where soldiers can stand and shoot. This is why they look bad even when mechanically present.

The fourth problem is AI legibility. The simulation tracks skills and priorities, but the player does not yet see a clean chain like: “Rook built slowly because low Construction,” “Nika held because the trench reduced pressure,” or “ammo crate placement kept suppression alive.” Without these cause-and-effect reads, emergence remains invisible.

Bottom line: the feature push added important systems, but the playable surface still lacks a dedicated construction mode, terrain-grade trench art, and visible NPC behavior proof. The next pass should prioritize visual terrain transformation and soldier use over adding more simulation depth.
