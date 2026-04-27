# Emergent War Drama Layer Plan

## Purpose

Build a full `Emergent War Drama Layer` for `Frontline Officer`: a systemic dialogue and memory layer where simple battlefield rules combine into persistent character drama.

The goal is not to script a war movie. The goal is to let the game generate war-drama moments from real simulation truth:

- an officer order exposed a builder;
- a trench saved a line;
- ammo ran dry at the wrong time;
- one soldier witnessed another get dragged out;
- a camp survived because a player-built position held;
- the same road, trench, crate, and ruined house carry memory into later fights.

This layer must support the active product direction in `PERSISTENT_WAR_OFFICER_FORK_INTENT.md`: officer consequence, NPC war first, slow cinematic combat, build-order risk and reward, and first-town replayability.

## Current Baseline

The inherited dialogue system already has useful foundations:

- story packs under `src/game/dialogue/story-packs`;
- `DialogueEventPacket`, `DialogueMemory`, event history, speaker scoring, and repetition guards in `src/game/simulation.ts`;
- named squad voices such as Rook, Makar, and Yara;
- squad roster persistence with fatigue, readiness, casualty records, memorial notes, family notification, wake state, and dialogue memories;
- post-raid memory generation for recovered bodies, left-behind bodies, sector held/lost states, civilians saved, surrender, convoy hits, and hot extracts;
- CLI authoring and review surfaces such as `story-pack list`, `story-pack scaffold`, `snapshot`, `showcase`, and `verify`.

The gap is that the system still mostly remembers extraction-era beats. It needs officer-war causes, witnesses, location scars, relationship pressure, and content authored around build orders, trenches, ammo, camp survival, and command responsibility.

## Design Rule

Emergence comes from interaction density:

`simple battlefield rules + persistent memory + character bias + feedback loops = cinematic war drama`

Every milestone should add simple rules that can combine with existing systems. Avoid broad authored scenes, cutscenes, or random line quantity.

## Milestone 1 - Officer War Drama Event Spine

Status: implemented as the first town-war dialogue spine. `TownWarState.dialogue` now exposes `lastDramaEvent`, `recentDramaEvents`, and `activeOfficerWarTags`; officer trench/ammo orders, risky builder movement, construction completion, ammo-crate depletion/destruction, casualties, and camp damage can emit structured drama events and readable chatter. The first content pack is `src/game/dialogue/story-packs/officer-war-orders.ts`.

### Player Promise

The war starts speaking in the language of officer consequence. Build orders, construction risk, camp damage, line pressure, and supply failures become first-class dialogue events.

### Simulation Work

Add officer-war event kinds to the dialogue packet layer:

- `build-order-issued`
- `builder-moving`
- `builder-exposed`
- `construction-started`
- `construction-stalled`
- `trench-completed`
- `ammo-crate-completed`
- `ammo-crate-low`
- `ammo-crate-empty`
- `line-held`
- `line-collapsed`
- `camp-under-fire`
- `camp-damaged`
- `camp-destroyed`
- `fallback-ordered`
- `bad-order-cost`

Map current town-war facts into those packets:

- build order type;
- order position;
- assigned soldier count;
- builder state;
- nearby enemy pressure;
- camp health;
- ammo state;
- lane focus;
- recent casualties.

### Content Needed

Create story-pack content family `officer-war-orders`:

- Rook: discipline, timing, exposed orders, late retreats.
- Makar: pressure, covering fire, loud confidence, resentment when orders waste bodies.
- Yara: builder exposure, casualties, exhaustion, civilian/body cost.
- Hostile net: enemy noticing exposed builders, dry crates, collapsing lines.

Minimum authored lines:

- 8 build-order issued lines;
- 8 builder exposed lines;
- 8 construction completed lines;
- 8 ammo low/empty lines;
- 8 line held/collapsed lines;
- 6 camp under fire/damaged lines;
- 6 hostile reaction lines.

### CLI And Verification

Add compact snapshot reads:

- `war.dialogue.lastDramaEvent`
- `war.dialogue.recentDramaEvents`
- `war.dialogue.activeOfficerWarTags`

Add or extend CLI flows:

- `war-order-trench`
- `war-order-ammo-crate`
- `war-advance`
- `snapshot`

### Acceptance

After placing a trench or ammo-crate order and advancing the war, the CLI can show the last drama event and at least one squad or hostile line caused by the officer-war state.

## Milestone 2 - Cause, Witness, And Responsibility Memory

Status: implemented as the first responsibility-memory layer. `TownWarState.dramaMemories` now records cause, subject, location, order id, witnesses, responsibility, emotional weight, and reference timestamps for officer-war events. Town-war soldiers expose `dramaMemoryTags` and `witnessedEventCount`, and the `responsibility-echoes` story pack can bias later lines toward earlier remembered causes.

### Player Promise

Characters do not merely remember that something happened. They remember why it happened, who saw it, and whether the officer's order helped or hurt.

### Simulation Work

Expand `DialogueMemory` or add a linked `WarDramaMemory` model with:

- `tag`
- `subjectId`
- `subjectName`
- `locationId`
- `locationName`
- `orderId`
- `cause`
- `witnessIds`
- `responsibility`
- `emotionalWeight`
- `ageOperations`
- `lastReferencedAt`

Recommended causes:

- `order-saved-line`
- `order-exposed-builder`
- `late-fallback`
- `ammo-shortage`
- `trench-held`
- `trench-failed`
- `camp-hit`
- `body-recovered`
- `body-left`
- `officer-intervened`

Recommended responsibility reads:

- `officer-helped`
- `officer-cost`
- `enemy-pressure`
- `supply-failure`
- `terrain-failure`
- `unclear`

### Content Needed

Create story-pack content family `responsibility-echoes`:

- good-order echoes;
- bad-order echoes;
- ambiguous-order echoes;
- witness-specific callbacks;
- short blame lines during repeated risk;
- quiet after-action reflections.

Minimum authored lines:

- 10 good-order memory callbacks;
- 10 bad-order memory callbacks;
- 8 ambiguous responsibility lines;
- 6 witness-to-witness lines;
- 6 after-action echo lines.

### CLI And Verification

Snapshot should expose:

- `war.dramaMemories`
- `war.soldiers[*].dramaMemoryTags`
- `war.soldiers[*].witnessedEventCount`

Add a deterministic staged scenario:

1. place risky trench order;
2. advance until builder is exposed or wounded;
3. inspect witness memories;
4. place another risky order;
5. confirm a callback is eligible.

Implemented verification:

- `npm run game:cli -- verify --id war-drama-responsibility`

### Acceptance

A later line can reference an earlier officer-caused event without hard scripting the scene.

## Milestone 3 - Persistent Character Arcs And Relationship Pressure

Status: implemented as the first compact character-arc layer. Town-war soldiers now carry `dramaArc` state for officer trust, resentment, guilt, confidence, combat nerve, protective/rivalry pressure, and signature trauma/pride tags. Arc pressure feeds dialogue eligibility through `long-haul-voices`, so repeated similar events can produce different lines as soldier pressure changes.

### Player Promise

Rook, Makar, Yara, and future soldiers stay consistent over long play. They develop pressure, trust, resentment, guilt, and loyalty based on what they repeatedly witness.

### Simulation Work

Add compact per-soldier drama state:

- `trustInOfficer`
- `trustBySoldierId`
- `resentment`
- `guilt`
- `confidence`
- `combatNerve`
- `protectiveOfSoldierIds`
- `rivalryWithSoldierIds`
- `signatureTraumaTags`
- `signaturePrideTags`

Do not build a full relationship sim. Use small numeric pressures that bias line selection and a few visible readouts.

Update line scoring to consider:

- speaker relationship to subject;
- speaker relationship to officer;
- whether the speaker witnessed the original event;
- whether the current event repeats an old pattern.

### Content Needed

Create story-pack content family `long-haul-voices`:

- Rook increasingly strict after repeated costly orders;
- Makar more reckless or loyal after covering successful builds;
- Yara colder after repeated unrecovered bodies;
- repair lines when the officer makes a good rescue/build decision after a failure;
- relationship lines between soldiers who repeatedly save or fail each other.

Minimum authored lines:

- 8 Rook pressure-arc lines;
- 8 Makar pressure-arc lines;
- 8 Yara pressure-arc lines;
- 8 trust repair lines;
- 8 soldier-to-soldier relationship lines;
- 6 reserve/replacement reaction lines.

### CLI And Verification

Snapshot should expose:

- `war.soldiers[*].dramaArc`
- `war.soldiers[*].trustInOfficer`
- `war.soldiers[*].relationshipPressure`

Add CLI showcase:

- `showcase --id war-drama-relationships`

Implemented verification:

- `npm run game:cli -- verify --id war-drama-relationships`

### Acceptance

Two similar battlefield events can produce different dialogue because the speaker's long-term arc and relationships changed.

## Milestone 4 - Location Scars And Battlefield Reputation

### Player Promise

The town becomes a remembered place. Roads, trenches, ammo crates, camps, and ruined buildings gain reputations that characters recognize later.

### Simulation Work

Add persistent location scar records:

- `id`
- `label`
- `kind`
- `position`
- `tags`
- `createdByEventId`
- `subjectNames`
- `orderId`
- `controlSide`
- `emotionalWeight`
- `timesReferenced`
- `lastChangedAt`

Recommended scar tags:

- `builder-hit-here`
- `trench-saved-line`
- `trench-overrun`
- `ammo-ran-dry`
- `camp-shelled`
- `body-left-here`
- `body-recovered-here`
- `fallback-collapsed`
- `last-stand`
- `quiet-after-loss`

Integrate with:

- build order completion;
- camp damage;
- soldier casualties;
- line held/collapsed results;
- ammo crate depletion;
- body recovery.

### Content Needed

Create story-pack content family `scarred-town-echoes`:

- return to a remembered road;
- standing inside a trench that saved soldiers;
- passing an ammo crate that failed;
- seeing a camp section damaged again;
- revisiting a body-left location;
- enemy net recognizing old weak points.

Minimum authored lines:

- 10 trench scar lines;
- 8 road/lane scar lines;
- 8 ammo/depot scar lines;
- 8 camp scar lines;
- 8 body location scar lines;
- 6 hostile scar exploitation lines.

### CLI And Verification

Snapshot should expose:

- `war.locationScars`
- `war.focusedLocationScar`
- `war.dialogue.activeScarTags`

Add CLI showcase:

- `showcase --id scarred-town-return`

### Acceptance

Returning to the same lane or fighting near an old construction/casualty site makes eligible dialogue change based on that location's history.

### Milestone 4 Implementation Status

Implemented as the location-scar ledger in the town-war controller. Build orders, line outcomes, ammo failures, camp damage, and bad-order costs can now create or update persistent scars with tags such as `builder-hit-here`, `trench-saved-line`, `trench-overrun`, `ammo-ran-dry`, `camp-shelled`, `body-left-here`, and `last-stand`.

Runtime and CLI inspect surfaces now expose `war.locationScars`, `war.focusedLocationScar`, and `war.dialogue.activeScarTags`. The `scarred-town-echoes` story pack provides callbacks when a later event happens at a scarred location.

Verification:

- `npm run game:cli -- verify --id war-drama-location-scars`

## Milestone 5 - Cinematic Beat Director Without Scripting Outcomes

### Player Promise

The war feels paced like a movie because the system recognizes drama shapes: setup, complication, cost, payoff, and echo. Gameplay remains fully systemic.

### Simulation Work

Add a lightweight beat classifier:

- `setup`
- `rising-pressure`
- `complication`
- `cost`
- `reversal`
- `payoff`
- `aftermath`
- `echo`

Classify combinations such as:

- build order placed near enemy pressure = `setup`;
- builder pinned = `complication`;
- soldier down during construction = `cost`;
- trench completed under pressure = `payoff`;
- later return to trench = `echo`;
- ammo crate empty during camp attack = `reversal`;
- line survives with low camp health = `aftermath`.

Use beat state to tune dialogue frequency:

- sparse during setup;
- sharp during complication/cost;
- restrained after payoff;
- quieter and longer in aftermath.

### Content Needed

Create story-pack content family `cinematic-beats`:

- setup tension;
- complication calls;
- cost lines;
- payoff lines;
- aftermath breaths;
- echo callbacks.

Minimum authored lines:

- 8 setup lines;
- 10 complication lines;
- 10 cost lines;
- 10 payoff lines;
- 8 aftermath lines;
- 8 echo lines.

Add debrief micro-prose templates:

- 12 short after-action summaries;
- 8 memorial/wake echoes;
- 8 officer responsibility summaries.

### CLI And Verification

Snapshot should expose:

- `war.dramaBeat.current`
- `war.dramaBeat.chain`
- `war.dramaBeat.lastPayoff`
- `war.debriefEchoes`

Add CLI showcase:

- `showcase --id war-drama-beat-chain`

### Acceptance

A trench build under fire produces a readable beat chain from setup to payoff or cost, and the debrief summarizes the truth without inventing events.

### Milestone 5 Implementation Status

Implemented as the first cinematic beat director in the town-war controller. Each drama event is classified into `setup`, `rising-pressure`, `complication`, `cost`, `reversal`, `payoff`, `aftermath`, or `echo` based on the real event kind, order continuity, risk, and location-scar context.

Runtime and CLI inspect surfaces now expose `war.dramaBeat.current`, `war.dramaBeat.chain`, `war.dramaBeat.lastPayoff`, and `war.debriefEchoes`. The `cinematic-beats` story pack adds beat-gated active battlefield lines, and debrief echoes are generated from tracked event summaries so they do not invent casualties, rescues, wins, or failures.

Verification:

- `npm run game:cli -- verify --id war-drama-beat-chain`

## Milestone 6 - Full Content Pass, Tooling, And Regression Gate

Status: implemented as the first regression-ready hardening pass. The town-war snapshot now exposes `war.storyPackAudit`, the CLI has a single `verify --id emergent-war-drama` gate, and the content set currently validates with zero audit errors across 9 packs, 203 squad lines, 40 hostile lines, and 72 quiet/aftermath lines.

### Player Promise

The layer feels complete enough to ship as a product pillar. The war consistently generates memorable, readable, long-term character stories.

### Simulation Work

Harden the full loop:

- event packet generation;
- cause/witness memories;
- character arc scoring;
- location scars;
- beat director;
- debrief echoes;
- repetition and cooldown rules;
- snapshot and verification surfaces.

Add authoring validation:

- duplicate template id detection;
- missing allowed speaker warning;
- unsupported memory tag warning;
- line length warning by active/downtime channel;
- story-pack summary output grouped by drama family.

### Content Needed

Final content minimum across all packs:

- 180-220 active battlefield lines;
- 40-60 hostile net lines;
- 40-60 quiet aftermath/debrief lines;
- 30-40 location scar callbacks;
- 30-40 relationship/arc callbacks;
- 20 officer responsibility summaries;
- 12 replacement/reserve/handoff lines;
- 12 camp destruction or match-end lines.

Content quality rules:

- active combat lines should usually be 3-14 words;
- critical lines can reach 18 words when needed;
- aftermath/debrief lines can reach 30 words;
- every line should be tied to a real state hook;
- no line should imply a casualty, rescue, betrayal, victory, or failure the simulation did not track;
- keep the setting fictional and avoid real-world slogan mimicry.

### CLI And Verification

Add a single regression command or verify id:

- `verify --id emergent-war-drama`

It should prove:

- officer-war event packets appear;
- at least one cause/witness memory is created;
- location scar state persists;
- character arc pressure changes;
- beat chain appears;
- debrief echo references tracked state;
- story packs validate cleanly.

Add review showcases:

- `showcase --id war-drama-orders`
- `showcase --id war-drama-responsibility`
- `showcase --id war-drama-relationships`
- `showcase --id scarred-town-return`
- `showcase --id war-drama-beat-chain`

### Acceptance

The player can play or stage the first-town officer loop and later inspect a coherent story chain:

1. officer placed an order;
2. soldiers acted under risk;
3. a consequence happened;
4. witnesses remembered it;
5. the location was scarred;
6. relationships or officer trust shifted;
7. later dialogue referenced the truth;
8. debrief summarized the event without scripting a fake scene.

Implementation verification:

- `npm run game:cli -- verify --id emergent-war-drama`

The gate proves officer-war event packets, cause/witness memory, persistent location scars, character arc pressure, truth-referencing dialogue, a setup/complication/payoff-or-cost beat chain, debrief echoes derived from tracked state, and clean story-pack validation.

## Shipping Order

Ship the milestones in this exact order:

1. Officer War Drama Event Spine
2. Cause, Witness, And Responsibility Memory
3. Persistent Character Arcs And Relationship Pressure
4. Location Scars And Battlefield Reputation
5. Cinematic Beat Director Without Scripting Outcomes
6. Full Content Pass, Tooling, And Regression Gate

This order matters because content quality depends on state truth. Do not write the full content library before the event, memory, relationship, scar, and beat hooks exist.

## Definition Of Done For Each Milestone

Each milestone must leave:

- one shipped runtime capability;
- one story-pack/content addition;
- one CLI inspect or verify surface;
- one screenshot, CLI JSON output, or verification artifact;
- docs updated when the project reality changes.

## Risks

- Too many authored lines before the state model exists.
- Dialogue invents drama that the simulation did not earn.
- Character arcs become hidden numbers with no player-readable effect.
- Location scars become debug metadata instead of battlefield texture.
- The beat director over-controls the war and turns systemic play into scripted pacing.
- Content sounds poetic but not tactical.

## North Star Test

A feature belongs in this layer only if it helps the player believe:

`My orders shaped the war, my soldiers remember what happened, and this town carries the consequences forward.`
