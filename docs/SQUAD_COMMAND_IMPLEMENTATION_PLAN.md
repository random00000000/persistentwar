# Squad Command Implementation Plan

## Source Of Truth

This plan implements the individual squad command feature described in:

- `docs/SQUAD_COMMAND_PLAYER_SPEC.md`

## Current Progress

Current implementation status:

- Phase 1 is live: raid state now carries a selected boy id and per-boy `follow` / `defend` / `attack` command state.
- Phase 2 is live: `8`, `9`, `0`, `C`, `X`, and `V` now drive direct selected-boy commands in raid.
- Phase 3 is live in first-pass form: follow, defend, and attack now bias live squadmate combat behavior differently through the shared combatant runtime.
- Phase 4 is now stronger but still not final: selected-boy highlighting, order labels, a DOM command surface, and a live Phaser defend-anchor marker are in place, while deeper command-feel polish and richer contextual orders still need another pass.
- Phase 5 is live in stronger form: the agent API, CLI commands, and snapshot output now expose selected-boy state plus per-boy orders, anchor metadata, and command freshness.

## Review Summary

Current review of the per-boy command slice:

- Core control path is present and usable: direct selection, direct commands, HUD surfacing, Phaser surfacing, and CLI hooks all exist.
- The biggest remaining risk is no longer missing verbs. It is player trust: the feature only feels good when the player can immediately read who is selected, what that boy is anchored to, and whether the current order is fresh or stale.
- This pass specifically tightened that trust gap by turning command freshness into real state, surfacing it in HUD and snapshot reads, and making selected-boy defend anchors visible in the playfield.

It is intentionally staged on top of the current runtime, which already has:

- named `squadMates`
- live squadmate-friendly combatants
- an aggregate `support order` command layer
- raid HUD and Phaser `Boys Net` surfaces
- CLI snapshot support for squadmate reads

The first implementation slices should add one-boy commandability without deleting the older support-net system yet.

## Recommended Build Order

1. per-boy command state model
2. selected-boy state and input routing
3. follow / defend / attack simulation behavior
4. raid HUD and world readability
5. agent API and CLI command hooks
6. authored showcase and verification support
7. tuning and command-feel polish

## Phase 1: Per-Boy Command State Model

Goal:

- give each live squadmate a persistent individual order state

Deliverables:

- selected boy id or selected squad slot in raid state
- per-boy command state for `follow`, `defend`, and `attack`
- defend anchor position and leash radius
- lightweight command acknowledgement/readout fields
- snapshot exposure for current selected boy and live boy orders

Done when:

- the sim can answer `which boy is selected` and `what is each boy currently trying to do`

## Phase 2: Selected-Boy State And Input Routing

Goal:

- let the player directly select one boy and issue commands in-raid

Deliverables:

- `8`, `9`, `0` direct selection keys
- `C` follow command for selected boy
- `X` defend command for selected boy
- `V` attack command for selected boy
- ground-target capture for `Defend` using the live cursor world position
- no accidental overlap with current movement, interact, grenade, or reload inputs

Design rule:

- this phase should coexist with the current aggregate support-order keys instead of replacing them all at once

Done when:

- a player can switch boys and issue one-boy commands without opening any menu

## Phase 3: Follow / Defend / Attack Simulation Behavior

Goal:

- make the three commands produce meaningfully different outcomes

Deliverables:

- `Follow`: return to player-bound formation and stop long chases
- `Defend`: move to ordered anchor, settle into nearby cover, hold a tight leash, and re-anchor after short displacements
- `Attack`: loosen leash, push toward reachable enemies, and commit harder than baseline autonomy
- weapon-role-aware bias so shotgun / SMG / rifle boys do not all behave identically

Important rule:

- this phase should reuse the existing friendly combatant combat lane wherever possible instead of forking a second AI system

Done when:

- `Follow`, `Defend`, and `Attack` are visible and reliable enough that a player can deliberately use them in a fight

## Phase 4: Raid HUD And World Readability

Goal:

- make the selected boy and his current order obvious in the playfield

Deliverables:

- stronger selected-boy highlight in the boys roster and world labels
- current order labels for each boy
- transient defend destination marker
- short confirmation text or bark when an order lands
- `Boys Net` updates that describe the selected boy and his current task instead of only aggregate net state

Done when:

- screenshots and live play make it obvious who is selected, where he was sent, and what he is doing

## Phase 5: Agent API And CLI Command Hooks

Goal:

- make the feature testable without manual-only play

Deliverables:

- agent API methods for:
- selecting a boy
- queueing `follow`
- queueing `attack`
- queueing `defend` at a supplied world position
- CLI support for those commands
- snapshot output for selected boy id, live order, defend anchor, and command age if useful
- CLI manual updates in `wiki/project-cli.md`

Done when:

- the command system can be exercised and asserted through the project CLI

## Phase 6: Authored Showcase And Verification Support

Goal:

- make the new feature reviewable and regression-testable

Deliverables:

- update or extend the `boys-command` showcase
- at least one deterministic staged scenario where command differences are easy to read
- screenshot path or verification path for:
- selected-boy readability
- defend anchor readability
- attack posture readability

Done when:

- future agents can review the feature without replaying a full raid from scratch

## Phase 7: Tuning And Command-Feel Polish

Goal:

- push the feature from functional to believable

Deliverables:

- leash radius tuning
- better nearby-cover settle behavior for defend
- better pursuit cutoff for attack
- command acknowledgement dialogue pass
- role-specific command bias tuning by weapon and combat profile

Done when:

- players start using positions and orders intentionally instead of treating the feature like a novelty

## First Implementation Slice

The first playable slice should be deliberately narrow:

- direct selection on `8`, `9`, `0`
- selected-boy state in snapshot
- `C = Follow`
- `V = Attack`
- `X = Defend at current cursor world position`
- per-boy order labels in the boys roster and world tags
- initial AI behavior differences wired through the existing friendly combatant update loop

This slice is enough to prove the squad-leader fantasy before deeper polish.

## Why This Order

This order keeps the risk low:

- state first so the feature has a clean source of truth
- inputs next so the feature is actually usable
- behavior next so the commands are meaningful
- readability next so players can trust what they are seeing
- CLI and showcase after that so future tuning is testable

It also avoids a high-risk rewrite of the older support-net system during the first pass.

## Risks To Watch

- command state living only on the HUD instead of actually steering combatants
- defend anchors fighting the existing player-follow wedge logic
- attack behavior becoming indistinguishable from normal combat autonomy
- selected-boy readability being too weak in the middle of a firefight
- keybind conflicts with current support-order keys and existing raid controls
- the first pass trying to solve all 3-man and 4-man squad edge cases before the 3-boy slice feels good

## Acceptance Gate For This Pass

This first pass is successful when:

- the player can select Rook, Makar, or Yara with direct keys
- `C`, `X`, and `V` only affect the selected boy
- the selected boy’s current order is visible in both world and HUD reads
- a defend order produces visibly stickier position play than follow
- an attack order produces visibly riskier pursuit than follow or defend
- the feature can be driven through the CLI and inspected in snapshot output
