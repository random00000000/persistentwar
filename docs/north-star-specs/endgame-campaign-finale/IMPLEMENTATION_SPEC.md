# Endgame Campaign Finale Implementation Spec

## Purpose

Define the implementation baseline and acceptance criteria for the final campaign-ending offensive and true-escape structure.

This package should turn the whole north-star stack into a finishable campaign without breaking the systemic rules that make the rest of the game scalable.

## Source Direction

- [Tactical Squad Extraction North Star](../../TACTICAL_SQUAD_EXTRACTION_NORTH_STAR.md)
- [Endgame Direction](../../ENDGAME_DIRECTION.md)
- [Systemic Reuse And Prefab Rules](../../SYSTEMIC_REUSE_AND_PREFAB_RULES.md)
- [Main Map Tactical Slice Implementation Spec](../main-map-tactical-slice/IMPLEMENTATION_SPEC.md)
- [AI Pressure And Territorial Replayability Implementation Spec](../ai-pressure-and-territorial-replayability/IMPLEMENTATION_SPEC.md)
- [Gun Doctrine Implementation Spec](../gun-doctrine/IMPLEMENTATION_SPEC.md)
- [Stash Normalization And Squad Recovery Implementation Spec](../stash-normalization-and-squad-recovery/IMPLEMENTATION_SPEC.md)
- [Extraction Pressure And Operation Flow Implementation Spec](../extraction-pressure-and-operation-flow/IMPLEMENTATION_SPEC.md)
- [RimWorld Dialogue Campaign Flavor Implementation Spec](../rimworld-dialogue-campaign-flavor/IMPLEMENTATION_SPEC.md)

## Package Boundary

This package should turn the whole north-star stack into a finishable campaign.

It should not become a bespoke final-mission system that ignores the shared primitives.

It owns:

- final stronghold campaign state
- campaign-threshold gating
- preparation-raid relationship to finale
- final offensive outcome and true-escape resolution

It does not own:

- new core map geometry systems
- separate weapon or stash frameworks
- separate extraction mechanics unrelated to the shared operation grammar

## Current Code Baseline

The game already has several strong foundations for a finale, even though a true endgame does not exist yet.

### Existing Campaign Continuity Baseline

Current systems already track:

- raid history
- route history
- debrief war logs
- campaign fallout
- memorial debt
- body recovery debt
- stash and deployment consequence

This means the game already remembers that operations happened and already has a campaign-like after-action structure.

### Existing Final-Feeling Surfaces

In [main.ts](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/topdownextractionshooter/src/main.ts), the current project already includes:

- campaign fallout surfaces
- story-finale choice and credit surfaces
- route and weapon history confidence reads
- debrief consequence boards

These are not yet the actual endgame, but they show that the game can already frame operations as part of a longer arc.

### Existing Reusable Primitive Baseline

The rest of the north-star stack already gives the finale its likely building blocks:

- reusable district and subzone structure
- shared combatant and pressure posture logic
- shared weapon and squad doctrine
- shared stash, memorial, and replacement grammar
- shared operation and extraction grammar
- shared dialogue hooks and story packs

The finale package should be built almost entirely by composing those systems.

## Problem Statement

Right now the game has:

- strong raids
- strong tactical identity
- strong consequence direction

but no finishable campaign arc.

Without an endgame package:

- the campaign can deepen but never conclude
- progression can matter but never culminate
- the true-escape promise stays only thematic

This package should solve that by giving the campaign:

- one final threshold
- one final district or stronghold
- one true-escape state

## Reuse Rule

This package should be one of the strictest followers of [Systemic Reuse And Prefab Rules](../../SYSTEMIC_REUSE_AND_PREFAB_RULES.md).

It should reuse:

- the shared district and subzone model
- the shared combatant and AI-pressure model
- the shared weapon and squad framework
- the shared stash and memorial framework
- the shared operation and extraction grammar
- the shared dialogue-hook framework

If the endgame appears to require a brand-new system, the default question should be:

- is this actually a new primitive, or just the hardest authored composition of the existing ones

## Feature Goals

### 1. Make The Campaign Beatable

The base game needs one clear win condition.

### 2. Gate The Finale Through Capability And Mastery

The finale should require:

- enough preparation
- enough tactical competence

but not infinite grinding.

### 3. Make The Final Stronghold Qualitatively Harder

The final district should feel like:

- the hardest geometry
- the hardest pressure
- the hardest extraction problem

not just a bigger enemy count.

### 4. Preserve Extensibility

The finale should end this campaign arc while leaving space for future maps or war chapters.

## State Additions

### Campaign Finale State

Add or derive a campaign-level finale state.

Suggested structure:

```ts
type CampaignFinaleState = "locked" | "revealed" | "preparing" | "ready" | "launched" | "won";
```

This should be compact and easy to inspect.

### Final Stronghold State

Add a stronghold state layer for the final district.

Suggested structure:

```ts
interface FinalStrongholdState {
  id: string;
  label: string;
  revealed: boolean;
  readinessScore: number;
  prepOperationsCompleted: string[];
  pressureTier: number;
  assaultLaunched: boolean;
  escaped: boolean;
}
```

The exact fields can change, but the system needs:

- reveal state
- readiness read
- preparation relationship
- launch state
- completion state

### Preparation Hook Model

Preparation raids should be expressed through existing operation and stash frameworks wherever possible.

Useful shared outputs:

- unlocked approach lane
- reduced pressure on one flank
- improved recovery path
- recovered heavy asset
- added route intel

These should be modeled as reusable campaign or district modifiers rather than bespoke finale-only hacks where possible.

## Behavior Requirements

### Reveal And Preparation

The stronghold should not be available as a normal first-hour raid.

Required behavior:

- it is known, hinted, or partially seen before it is viable
- the player can understand they are not ready yet
- the campaign can shift into a `preparing` state once enough baseline mastery exists

### Final Stronghold Composition

The final stronghold must be built from the same shared tactical language as the rest of the game:

- room stacks
- trench segments
- crossings
- bunker or command-node interiors
- extract edges

Required rule:

- the finale should be the hardest composition of the normal game, not a different genre

### Finale Operation Flow

The final offensive should reuse the shared operation grammar and extraction wrapper.

Required outcomes:

- approach
- pressure build
- major break-in
- crisis
- decisive objective
- true extract

Casualty and body outcomes should still be valid, not silently disabled because it is the finale.

### Failure And Retry

The player must be able to fail and try again.

Required rule:

- failing the finale should return the campaign to a valid preparation-capable state
- consequences remain real
- the campaign should not fully reset unless a future mode explicitly chooses that structure

### True Escape Resolution

The final success state must be clearly different from a normal successful extract.

Required outcomes:

- the game recognizes that the campaign chapter has been completed
- the player is framed as having escaped the war sector
- the debrief and campaign surfaces resolve into closure rather than another normal prep cycle

## CLI Changes

This package should remain inspectable and verifiable through CLI-first surfaces.

### Snapshot Additions

Extend `snapshot` with a compact finale read, for example:

- `campaign.finaleState`
- `campaign.strongholdRevealed`
- `campaign.strongholdReady`
- `campaign.prepProgress`
- `campaign.trueEscapeAchieved`

These should be enough to prove:

- where the campaign is in the endgame arc
- whether the player can launch the finale
- whether the finale was won

### CLI Flows

Support or extend CLI flows for:

- inspecting finale readiness
- previewing final-stronghold status
- showcasing a preparation-ready campaign state
- showcasing the finale launch state
- showcasing the true-escape success state

### Showcases

Add or expand showcases for:

- finale-revealed
- finale-preparation
- final-stronghold launch
- finale failure recovery state
- true escape or campaign-complete state

## Manual / Documentation Changes

Update [wiki/project-cli.md](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/topdownextractionshooter/wiki/project-cli.md) with:

- finale-state snapshot fields
- any new showcase or inspect paths
- one end-to-end example of campaign preparation into finale launch

Update [wiki/README.md](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/topdownextractionshooter/wiki/README.md) if additional finale review surfaces are added.

## UI Changes

### Campaign Readability

The player should be able to understand when:

- the final stronghold has been revealed
- they are not yet ready
- they are preparation-capable
- they are ready to launch

This should not require a massive new strategy menu.

### Preparation Readability

The player should be able to understand which preparation operations matter and why.

### Finale Closure

On success, the game should visibly resolve into:

- campaign completion
- true-escape framing
- a sense of ending rather than another routine debrief

## System Interactions

This package must interlock cleanly with:

- map state
- AI and town-state replayability
- stash consequence
- squad replacement and memorial debt
- extraction flow
- dialogue memory and campaign voice

Important rule:

- the endgame should be the culmination of those systems, not a bypass around them

## Acceptance Criteria

The package is complete for the first north-star version when:

- the campaign has a real, inspectable endgame state
- one final stronghold can be revealed, prepared for, launched, and won
- the finale uses the same tactical language as the rest of the game
- preparation raids materially support the final push
- true escape is clearly different from a normal raid extract
- failure still preserves a recoverable campaign state

## Out Of Scope For This Package

- multiple separate finales at ship time
- a full branching narrative campaign tree
- a brand-new strategic metagame layer
- post-win chapter-two content at the same time as the first finale

Those can come later once one beatable campaign arc is proven.

## Risks

- the finale becomes a bespoke mission that ignores the systemic game
- the finale is mostly gear-gated and not skill-gated
- the campaign lacks enough preparation texture to make the ending earned
- true escape is framed too similarly to a normal extract
- the ending becomes too final to support later expansion
