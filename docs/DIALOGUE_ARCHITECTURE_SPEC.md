# Dialogue Architecture Spec

## Purpose

Define the authoritative RimWorld-style dialogue architecture for `Top Down Extraction Shooter`.

This document is intentionally opinionated:

- the game should do dialogue the RimWorld way
- if the current code conflicts with that architecture, the code should change
- the existing chatter system is a temporary baseline, not the source of truth

The goal is not to write bigger banter lists. The goal is to build a story-generator dialogue layer that turns simulation state into short, memorable battlefield story fragments.

## Core Rule

Dialogue must be:

- event-driven
- character-shaped
- memory-aware
- sparse
- consequential

Dialogue must not be:

- scene-scripted
- exposition-heavy
- long-form conversation
- generic shooter bark spam
- lore dumping

## What "RimWorld Way" Means Here

The useful principles to carry over are:

- short text can create bigger stories than fully authored scenes
- the player should infer most of the emotion
- lines should resolve from state, not from cutscene logic
- loss and recovery matter more than spectacle alone
- memory makes repetition feel like history instead of noise
- abstracted feedback is a strength when it is emotionally legible

The system should feel like:

- "me and the boys got pinned in the same trench where we lost Lev"
- "Blue kept shouting across the lane while Yara tried to pull the body"
- "Makar saw a clean rifle on a corpse and immediately wanted one more bad decision"

## Fiction Rule

This project's direction document already locks the war framing to a fictional frontline with `Blue`, `Green`, and `Yellow` enemy reads.

The dialogue should stay inside that fictionalized frame.

Use:

- `Blue`, `Green`, `Yellow`
- `the boys`
- `the lane`
- `the block`
- `the trench`
- `the bunker`
- `the route`
- `the pull`

Avoid:

- direct real-world slogan mimicry
- politician references
- ideology speeches
- documentary-style imitation of real war communications

The tone can still be:

- dark
- proud
- fatalistic
- exhausted
- funny in a bad way
- human

## Product Promise

When the player watches a raid, the dialogue system should make it feel like:

- both sides are actively contesting the same piece of ground
- each boy is recognizably himself
- every raid can generate different story fragments
- body recovery, surrender, civilians, loot greed, bunker downtime, and extract pressure all sound different
- history leaks into the present through short callbacks
- the player wants to keep watching because the war sounds alive

## Non-Goals

- no dialogue tree system
- no cutscene conversation system
- no runtime LLM dependency
- no long subtitle walls
- no "movie script" pacing that freezes gameplay

## Source Of Truth Rule

If the current `simulation.ts` chatter buckets, current UI surfaces, or current logs are too shallow for this architecture:

- refactor them
- replace them
- do not preserve them out of convenience

The architecture is the source of truth.

## Current Baseline

The project already has useful pieces:

- named boys with `voiceTag` and `voiceSignature`
- current squad ambient call buckets
- current hostile call buckets by tape color
- `squadComms`, `hostileComms`, `squadLog`, and `hostileLog`
- `Boys Net`, `Blue Shouts`, and in-scene traffic surfaces

These are good scaffolds, but not the finished architecture.

The missing parts are:

- structured event packets
- a real template taxonomy
- speaker-fit scoring
- memory callbacks
- repetition guards beyond simple duplicate suppression
- long-term emotional consequence in line selection

## Design Pillars

### 1. State First

Dialogue should resolve from real gameplay state.

Lines are outputs of:

- threat
- loss
- opportunity
- memory
- role
- tone

### 2. Short And Sharp

Target length:

- normal line: 4-14 words
- intense line: up to 22 words

Most lines should fit on one read and land instantly.

### 3. Character Through Priority

Characters should differ by what they notice first.

Not everyone should describe the same moment the same way.

Examples:

- Rook notices discipline, timing, angle control, bad pushes
- Makar notices noise, pressure, bravado, momentum
- Yara notices casualties, med time, body cost, civilians, dumb greed

### 4. Memory Makes Stories

Most lines should be present-tense.

Some lines should remember:

- who died here
- who got dragged out
- whether the last extract barely worked
- whether the squad already got greedy on this route

### 5. Dialogue Supports The Map

The map is still the main storytelling surface.

Dialogue should sharpen what the player already sees.

It should not try to replace:

- top-down combat readability
- route pressure
- body recovery visuals
- bunker calm
- surrender posture

## Three Layers

### Fantasy Layer

What the player feels and says:

- "Rook kept the lane together."
- "Makar sounded like he loved the worst moments."
- "Yara got colder every time a body hit the ground."
- "That trench already had history before we even pushed it."

### Gameplay Layer

What the player actually does:

- move
- hold
- suppress
- breach
- loot
- recover
- escort
- surrender
- extract
- return

### Code / Simulation Layer

What the engine tracks:

- event kind
- intensity
- speaker profile
- relationship pressure
- memory tags
- location type
- enemy tape
- cooldown state
- channel destination

## Architecture Overview

The pipeline should be:

1. Simulation emits a `DialogueEventPacket`.
2. Eligible speakers are collected.
3. Speaker-fit and tone are scored.
4. Matching templates are filtered and weighted.
5. One line resolves through a token layer.
6. The result is sent to:
   - lead comms
   - traffic log
   - optional local bark
   - optional debrief echo

## Dialogue Event Packet

This is the core unit of the system.

```ts
interface DialogueEventPacket {
  id: string;
  kind:
    | "advance"
    | "contact"
    | "suppression"
    | "grenade"
    | "blind-fire"
    | "breach"
    | "flank"
    | "loot"
    | "intel"
    | "body-down"
    | "body-recovery"
    | "civilian"
    | "surrender"
    | "bunker-reset"
    | "coffee"
    | "extract-open"
    | "extract-hot"
    | "claim-held"
    | "claim-breaking"
    | "claim-lost"
    | "return-sector"
    | "memorial";
  locationLabel: string;
  locationType: "village" | "tree-line" | "trench" | "bunker" | "room" | "road" | "extract";
  intensity: "low" | "medium" | "high" | "critical";
  dominantTapeId: EnemyTapeId | null;
  civilianPresent: boolean;
  playerRisk: number;
  squadRisk: number;
  greedPressure: number;
  memoryTags: string[];
}
```

The current context strings in code should become adapters into this packet system, then eventually disappear if they stop helping.

## Speaker Profile Model

Current `voiceTag` and `voiceSignature` are not enough.

Every recurring speaker should gain a lightweight voice profile:

```ts
interface DialogueVoiceProfile {
  cadence: "clipped" | "plain" | "swagger" | "dry" | "grim";
  stressStyle: "quieter" | "sharper" | "louder" | "colder";
  humor: "none" | "dark" | "dry" | "cocky";
  focusBias: ("angles" | "ammo" | "bodies" | "civilians" | "loot" | "speed" | "discipline")[];
  relationshipStyle: "protective" | "transactional" | "brotherly" | "abrasive";
  forbiddenTags: string[];
  preferredTags: string[];
}
```

Initial squad anchors:

- `Rook`
  - clipped
  - protective through discipline
  - calls out lane shape and bad timing
- `Makar`
  - swaggering
  - gets louder under pressure
  - likes suppression, breach noise, and ugly momentum
- `Yara`
  - dry and cold under stress
  - body-cost aware
  - keeps civilians and casualties emotionally grounded

## Memory Model

This is the most important missing system.

Each squadmate should carry a small rolling memory buffer:

```ts
interface DialogueMemory {
  tag:
    | "mate-downed"
    | "mate-recovered"
    | "mate-left-behind"
    | "civilian-saved"
    | "surrender-taken"
    | "sector-held"
    | "sector-lost"
    | "extract-barely-made"
    | "loot-greed-paid"
    | "loot-greed-burned"
    | "bunker-reset";
  routeId?: string;
  sectorId?: string;
  subjectId?: string;
  ageRaids: number;
  emotionalWeight: number;
}
```

Rules:

- most lines ignore memory
- a minority of high-value lines callback to memory
- memory callbacks must cool down
- grief and consequence should recur more than once, but not constantly

## Template Taxonomy

Templates should be authored by:

- event kind
- speaker fit
- tone
- optional memory hook
- optional enemy tape
- optional location type

Suggested structure:

```ts
interface DialogueTemplate {
  id: string;
  eventKinds: DialogueEventPacket["kind"][];
  tone: SquadCommsTone | "any";
  allowedSpeakers?: string[];
  requiredTags?: string[];
  blockedTags?: string[];
  weight: number;
  cooldownSeconds: number;
  text: string;
}
```

## Token Layer

Keep the resolver tight and explicit.

Useful tokens:

- `{focus}`
- `{focusLower}`
- `{extract}`
- `{extractLower}`
- `{breach}`
- `{breachLower}`
- `{enemyTape}`
- `{mate}`
- `{fallenMate}`
- `{weapon}`

This should stay a controlled grammar layer, not a procedural language generator.

## Channel Model

### Lead Comms

Best for:

- immediate danger
- order payoff
- extract pressure
- body-recovery urgency

### Traffic Log

Best for:

- hearing multiple overlapping beats
- preserving story fragments
- letting players reconstruct what just happened

### Local Bark

Future extension for nearby high-priority lines only.

Use sparingly for:

- grenade
- surrender
- breach
- body-down

### Debrief Echo

Future extension for:

- last line before collapse
- memorable recovery line
- notable extract callback

## Frequency Rules

The system should speak on change, not continuously.

Priority:

1. irreversible consequence
2. immediate threat
3. timed opportunity
4. order acknowledgement
5. ambient color

Hard rules:

- one lead squad line at a time
- one lead hostile line at a time
- per-speaker cooldown
- per-template cooldown
- repetition penalty for same idea even with different wording

## Scoring Rules

Favor:

- exact event match
- speaker focus fit
- emotional relevance
- memory relevance during high-pressure beats
- novelty
- tape/location specificity

Penalize:

- same speaker too often
- same template family too often
- jokes during civilian or memorial beats
- soft flavor lines during critical pressure

## Story Families To Author First

### Contact And Pressure

- first contact
- suppression
- blind fire
- trench pressure
- breach stack

### Loot Greed

- fresh enemy gun
- exposed strip
- "one more room"
- haul versus extract tension

### Body Cost

- wounded mate
- body down
- body recovery
- body left behind
- next-raid callback

### Human Beats

- civilians moving
- surrender
- bunker calm
- coffee reset

### Persistent Frontline

- same sector revisited
- old flag still there
- old kill zone remembered
- route got worse while away

## Authoring Examples

### Contact

- Rook:
  - "Blue on the mouth. Win the angle, then move."
  - "Do not rush the first burst."
- Makar:
  - "Good. Let them hear us."
  - "I will make this lane loud."
- Yara:
  - "Contact already. Try not to become paperwork."
  - "Keep someone standing before you get brave."

### Body Recovery

- Rook:
  - "Bag him clean. Nobody stays on this road."
- Makar:
  - "I bark, you pull."
- Yara:
  - "Lift together. He goes home."

### Loot Greed

- Rook:
  - "Nice rifle. Not worth the whole lane unless we own it."
- Makar:
  - "That gun is criminal to leave there."
- Yara:
  - "Take it fast or forget it. I am not dying over hardware."

### Memory Callback

- Rook:
  - "Same trench. Cleaner this time."
- Makar:
  - "This road still owes us one."
- Yara:
  - "Last time we left a body here. Not again."

## Implementation Order

### Phase 1. Packet Layer

Add `DialogueEventPacket` and adapters for current contexts.

### Phase 2. Speaker Profiles

Attach real voice profiles to squadmates and hostile leads.

### Phase 3. Template Refactor

Convert current line buckets into weighted templates with tags and cooldowns.

### Phase 4. Memory Layer

Write and consume lightweight per-squadmate memories.

### Phase 5. Presentation Pass

Add local barks and debrief echoes only after the core system feels right.

## CLI Rule

The system must be inspectable from the CLI before it is considered done.

Expose:

- current lead squad line
- current lead hostile line
- recent dialogue event packets
- recent traffic logs
- speaker cooldowns
- active memory tags

## UI Rule

Permanent UI:

- lead line
- recent traffic
- speaker identity

Transient UI:

- nearby bark
- grenade shout
- surrender warning
- recovery urgency

The UI should stay readable during top-down combat.

## Acceptance Criteria

This architecture is working when:

- players can tell the boys apart from their lines
- the same raid route can produce different emotional reads
- losses echo later without melodrama spam
- hostile chatter makes the fight feel two-sided
- the system sounds sparse but alive
- players want to watch the war because it sounds like stories are forming on their own

## Failure Modes

- too much chatter
- too much exposition
- too little character distinction
- too little memory
- too much memory
- bark spam replacing atmosphere
- current-code compromise weakening the architecture

## First Vertical Slice

Build this first:

1. event packet layer
2. speaker-fit scoring for `Rook`, `Makar`, `Yara`
3. template refactor for:
   - `contact`
   - `loot`
   - `body-recovery`
   - `surrender`
   - `extract-hot`
4. one memory callback family:
   - `mate-recovered`
   - `mate-left-behind`

If that slice already makes raids feel like the boys are living through remembered fights instead of reading generic combat barks, the architecture is on the right track.
