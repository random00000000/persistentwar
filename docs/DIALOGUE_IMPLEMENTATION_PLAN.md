# Dialogue Implementation Plan

## Goal

Implement the RimWorld-style dialogue architecture in layers, with the dialogue architecture spec as the source of truth and the current chatter system treated as replaceable scaffolding.

## Milestone 1. Event Packet Foundation

Status: shipped in first slice

Build:

- `DialogueEventPacket`
- persistent `DialogueMemory` state on squad roster and live squadmates
- current and recent dialogue event state on `RaidState`
- a template-based squad dialogue resolver

Acceptance:

- the game can emit structured dialogue packets
- squad lines can resolve from templates instead of only hand-picked string buckets
- the game persists key memory tags across raids

## Milestone 2. First Story Slice

Status: shipped in first slice

Covered beats:

- `advance`
- `contact`
- `loot`
- `body-recovery`
- `surrender`
- `extract-open`
- `extract-hot`

Covered memory tags:

- `mate-recovered`
- `mate-left-behind`

Acceptance:

- contact and extract pressure can pull memory-aware lines
- loot and recovery beats resolve through the new dialogue layer
- recovered and left-behind bodies can echo into later raids

## Milestone 3. Replace Remaining Legacy Context Buckets

Status: materially shipped, cleanup still open

Replace legacy chatter paths for:

- `intel`
- `civilian`
- `coffee`
- `claim-breaking`
- `claim-held`
- `claim-loss`
- squad order chatter

Shipped now:

- packet/template squad resolution now also covers `intel`, `civilian`, `coffee`, `claim-breaking`, `claim-held`, and `claim-loss`
- `completeIntelCapture` now emits through the dialogue event layer instead of only a direct hardcoded comms line
- focused incident chatter and frontline support order chatter now route through dialogue packets/templates instead of bypassing the system
- several high-signal one-off moments now route through dialogue packets/templates:
  - squadmate loss in-lane
  - grenade returns
  - extract-open
  - extract-hot
  - extract crash pressure
  - noise-response escalation

Still open:

- patch/heal, frag-support, pocket-objective, raid-collapse, and raid-success one-offs still need migration
- some low-level direct `pushSquadLog` emitters still bypass packet history and template cooldowns

Acceptance:

- the ambient squad net no longer depends on legacy bucket selection for major player-facing moments

## Milestone 4. Hostile Dialogue Architecture

Status: shipped in ambient form

Build the same packet/template logic for hostile traffic:

- Blue regulars
- Green elite push elements
- Yellow volunteer lanes

Shipped now:

- hostile ambient traffic now resolves through a packet builder plus hostile template resolver
- the old hostile ambient bucket block has been removed from the runtime path

Acceptance:

- hostile chatter is driven by packet logic and tape identity rather than only fixed bucket selection
- the enemy side sounds distinct and reactive

## Milestone 5. Memory Deepening

Status: partially shipped

Add more memory tags:

- `extract-barely-made`
- `sector-held`
- `sector-lost`
- `civilian-saved`
- `surrender-taken`
- `loot-greed-burned`

Shipped now:

- `extract-barely-made`
- `sector-held`
- `sector-lost`
- `civilian-saved`
- `surrender-taken`

Still open:

- `loot-greed-burned`
- broader use of the new memory tags in more templates and debrief surfaces

Acceptance:

- return visits to routes and sectors sound historically loaded instead of fresh every time

## Milestone 6. Presentation Pass

Status: partially shipped in CLI form, UI pass still open

Add:

- local world barks for nearby high-priority lines
- debrief echo lines
- memorial and route-return callback surfaces
- richer player-facing HUD/debug views for current dialogue packet and memory state

Shipped now:

- the agent snapshot now exposes current squad/hostile comms, current and recent dialogue packets, and live plus roster dialogue memories
- live squadmate snapshot data now includes per-mate recent dialogue memories for reliability inspection and automation

Acceptance:

- dialogue sharpens map storytelling without cluttering combat readability

## Risks

- too many lines turning the war into noise
- too much template reuse flattening voice identity
- memory callbacks firing too often and feeling melodramatic
- preserving too much legacy chatter and weakening the architecture

## Current Notes

The first slice is intentionally narrow. It proves:

- packet-driven dialogue can coexist with the live game loop
- memory can persist from one raid to the next
- the boys can start sounding like remembered people instead of generic tactical bark emitters

The next correct step is to migrate the remaining direct one-off emitters, then surface memory callbacks in the debrief, memorial, and route-return UI so the player can feel persistent story fallout rather than only seeing it in telemetry.
