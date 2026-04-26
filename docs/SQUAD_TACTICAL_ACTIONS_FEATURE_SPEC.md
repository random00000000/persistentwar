# Squad Tactical Actions Feature Spec

## Purpose

Extend the current per-boy command layer from pure stance orders into targeted tactical actions.

The first action slice is:

- `Alt + G`: selected boy throws a grenade at the mouse position

This must be designed as a generic action-order system, not a one-off grenade hack, so future agents can add:

- suppress this point
- hose this doorway
- smoke this lane
- breach this room
- clear this room
- drag this body

without building alternate combat systems.

## Product Promise

The player can point at a place in the world and tell one specific boy to create a battlefield effect there.

The fantasy is:

- “Rook, frag that room.”
- “Makar, suppress that window.”
- “Yara, keep that doorway dead while I move.”

This deepens combat because the player stops treating the boys as followers and starts using them as specialized tools:

- a shotgun boy can hold a room or punish a door
- an SMG boy can hose a short lane
- a rifle boy can lock a longer cut
- one boy can pin while another throws utility

## Design Rule

This feature must reuse existing combat systems.

It must not create:

- a separate grenade simulation for squad orders
- a separate shooting system for suppress orders
- a second “fake squad action” runtime disconnected from real squadmate combatants

Instead, tactical actions should be thin orchestration on top of systems that already exist:

- selected-boy command state
- live squadmate combatants
- current grenade throwing/runtime
- current weapon fire/runtime
- existing CLI and snapshot surfaces
- existing HUD and Phaser world readability surfaces

## Three Layers

### Fantasy Layer

The player feels like a squad leader who can bend the fight with specific boys and specific battlefield effects.

The player story should become:

- “I had the shotgun boy hold the side room.”
- “I had the rifle boy pin the windows.”
- “I had the SMG boy frag the back pocket before I crossed.”

### Gameplay Layer

The player:

1. cycles to a specific boy
2. points at a location
3. issues a tactical action
4. the boy executes it
5. the boy returns to his prior stance behavior

This creates combination play:

- hold + grenade
- hold + suppress
- suppress + push
- grenade + breach

### Code / Simulation Layer

The game tracks:

- who is selected
- which stance order the boy is currently on
- whether a tactical action is queued or active
- the target point for that action
- whether the action is valid, executing, blocked, or completed
- which prior stance the boy returns to after the action resolves

## Core Architecture

Add a generic `tactical action overlay` on top of existing boy stance orders.

Current stance orders stay:

- `follow`
- `defend`
- `attack`

New concept:

- each boy may temporarily execute a `tacticalAction`
- after it resolves, he resumes his base stance order

That means the mental model becomes:

- base order = where and how this boy lives in the fight
- tactical action = a short committed battlefield effect he performs now

## Generic Tactical Action Model

Each tactical action should share one reusable structure.

Recommended shape:

- `actionId`
- `actorSquadMateId`
- `targetPosition`
- `status`
- `issuedAtSeconds`
- `startedAtSeconds`
- `completedAtSeconds`
- `resumeOrder`
- `failureReason`

Recommended statuses:

- `queued`
- `moving-into-range`
- `executing`
- `completed`
- `failed`
- `cancelled`

Recommended generic fields:

- `requiredRange`
- `resourceType`
- `resourceCost`
- `telegraphLabel`
- `worldCueLabel`

This lets future actions plug into one shared lifecycle.

## First Tactical Action Slice

### Action

- `Alt + G`

### Behavior

When the player presses `Alt + G`:

1. use the currently selected boy
2. read the mouse world position
3. queue a `grenade` tactical action on that boy

The selected boy should:

1. validate that he has a grenade
2. validate the target is reachable or move into throw range
3. use the existing grenade runtime to throw the grenade
4. return to his previous order after the throw

### Player-Facing Rule

If the selected boy was:

- holding a room, he returns to holding it
- following the player, he returns to follow
- attacking, he returns to attack

The grenade action is an overlay, not a stance replacement.

## Future Tactical Actions

The architecture must clearly support the next obvious actions:

### Suppress Target Point

Player fantasy:

- “Spray that house.”
- “Pin that trench.”

Behavior:

- selected boy fires repeated bursts at a target point or target zone
- uses existing weapon fire/projectile logic
- temporarily favors volume and lane denial over precision
- then resumes prior order

### Hose Doorway / Lane

Player fantasy:

- “Keep that doorway dead.”

Behavior:

- mechanically a suppression-family action with different UI language or duration tuning

### Smoke Position

Behavior:

- same generic action lifecycle as grenade
- different resource type and grenade payload

### Breach / Clear

Behavior:

- higher-level tactical action built on top of movement, grenade, and firing systems

## Input Rules

Initial requirement:

- `8 / 9 / 0`: select boy
- `C / X / V`: base stance orders
- `Alt + G`: grenade tactical action at mouse position

Design rule:

- tactical actions should use modifiers or a clearly separated action layer
- do not overload the base stance keys into ambiguous multi-step interactions

This keeps the system scalable.

## Tactical Action Resolution Rules

Every tactical action should obey the same execution flow.

### 1. Validate

Check:

- selected boy exists
- selected boy is alive
- required resource exists
- action is allowed in current phase

### 2. Resolve Range

If already in valid range:

- execute immediately

If out of range:

- move toward a valid execution point

If impossible:

- fail with readable feedback

### 3. Execute Using Existing Runtime

Examples:

- grenade action calls the same grenade-spawn/runtime path the player already uses
- suppress action calls the same weapon/projectile path the boy already uses

### 4. Resume Prior Order

When complete:

- restore the pre-action base order

## Reuse Requirements

Future implementation must explicitly reuse:

- existing selected-boy state
- existing squadmate command state
- existing friendly combatant update loop
- existing grenade stock and grenade spawn/runtime
- existing bullet / burst / projectile runtime
- existing squad comms and HUD update surfaces

Forbidden implementation style:

- `if action == grenade then use totally separate squad grenade system`
- fake invisible suppress entities
- action effects that only change a UI state without driving real combatants

## Player Feedback

Tactical actions must be readable in motion.

### Permanent / Semi-Permanent Read

- selected boy
- current base order
- current tactical action if any
- target point label when useful

### Transient Read

- short world marker on target point
- short squad bark
- short HUD line like `Makar fragging back room`
- short failure read like `Out of range` or `No grenade`

The battlefield should tell the story without turning into debug clutter.

## CLI-First Requirement

Before UI completion, the feature must be drivable through CLI.

Recommended first CLI shape:

- `select-boy --index <n>`
- `squad-action --id grenade --x <n> --y <n>`

Later:

- `squad-action --id suppress --x <n> --y <n>`

Snapshot should expose:

- selected boy id
- current base order
- current tactical action
- tactical action status
- target point
- resource validation state if relevant

## Why This Makes Combat Deeper

This feature adds skill gap through:

- choosing the right boy
- choosing the right position
- choosing the right action
- timing combinations correctly
- matching weapon role to terrain and intent

The system gets deeper over time without needing many more buttons, because the same verbs interact with:

- room shapes
- doorways
- windows
- trenches
- gun roles
- grenade stock
- pressure timing

## Scalability Rules For Future Agents

Future agents should be able to add new tactical actions by:

1. defining a new tactical action id
2. reusing the shared action lifecycle
3. plugging into existing combat or grenade systems
4. adding UI text and world cues
5. exposing CLI and snapshot support

They should not need to redesign the whole command stack.

## Risks

### Too Special-Cased

If grenade is built as a one-off branch, future suppress / smoke / breach work becomes messy and duplicated.

### Too Abstract

If the action exists only as state and does not visibly change combatant behavior, it will feel fake.

### Too Passive

If a hold-position boy stops fighting while “holding,” the room-control fantasy collapses.

### Too Smart / Too Automatic

If the AI chooses too much on its own, the player loses the sense of authored tactical intent.

### Too Many Verbs Too Early

Ship grenade first through a generic architecture, then layer suppress next.

## Success Criteria

This feature is successful when:

- the player can select one boy and target one battlefield effect at a world position
- the boy executes the action using real existing combat systems
- the boy returns to his prior stance after execution
- the action is readable in HUD and world feedback
- the system clearly supports suppress as the next feature without re-architecture
- the player can start creating combinations like hold plus grenade and suppress plus push
