# Squad Command Player Spec

## Purpose

This feature turns the boys from a passive escort blob into individually commandable operators that the player can direct during a raid.

The player should be able to:

- cycle or directly select a specific boy
- send that boy to a key position
- order that boy to follow
- order that boy to defend a position
- order that boy to attack aggressively
- build role-driven plays by pairing the right weapon with the right position

This is not meant to feel like an RTS army bar. It should feel like being a squad leader in the middle of a dangerous raid.

## Product Promise

The player can lead `me and the boys` one man at a time.

Each boy feels like a real operator with a role, a weapon, a lane, and a job:

- shotgun boy gets sent to the doorway
- SMG boy gets sent to the close flank
- rifle boy gets sent to the long lane
- wounded or low-readiness boy can be pulled back onto follow

The skill gap comes from putting the right boy in the right place at the right time, then knowing when to switch him from defend to attack or pull him back before the lane collapses.

## Core Fantasy

The player should feel like they are:

- leading named men, not clicking generic pawns
- winning fights through positioning, timing, and weapon-role matching
- using the terrain well by placing boys into good cover and strong lanes
- making live battlefield calls under pressure
- surviving because the squad was positioned correctly, not because companions aim-botted the fight

The ideal player sentence is:

`I put Makar on the tree line, sent Yara to hold the doorway, told Rook to go aggro on the right, and we took the compound clean.`

## Three Layers

### Fantasy Layer

This is the `squad leader vibe`.

The player is not issuing abstract support cards. They are pointing at real ground and telling a specific boy what to do there.

### Gameplay Layer

The player selects one boy, issues one of three fast commands, and reads the results in the playfield.

The skill is:

- picking the right boy
- choosing the right command
- choosing the right location
- reacting when the lane changes

### Simulation Layer

Each selected boy receives an individual order package that changes:

- his assignment
- his destination
- his local movement behavior
- his aggression level
- how far he is allowed to chase
- whether he should return to the ordered spot

## Control Scheme

This control scheme is intentionally simple and fast.

### Boy Selection

Direct selection keys:

- `8` = select Boy 1
- `9` = select Boy 2
- `0` = select Boy 3

If fewer boys are deployed, empty slots do nothing.

If the game later supports more than three directly commandable boys in the active field group, this spec should expand the selection scheme instead of overloading the same keys with awkward cycling.

### Orders

- `C` = Follow
- `X` = Defend
- `V` = Attack

The selected boy is the only one affected by these commands.

This is the key identity of the feature. The player gives orders one by one.

## Selection Behavior

When a boy is selected:

- his shoulder tag, portrait, and world ring become more prominent
- his current weapon and condition become clearly readable
- his current order is shown near his portrait and in the raid HUD
- the player gets a visible command cursor or ghost marker before confirming a ground order

Selection should feel crisp and low-friction. The player needs to swap boys mid-fight without opening a menu.

## Follow Command

Hotkey:

- `C`

Behavior:

- the selected boy returns to the player's local formation
- he tries to stay in a sensible escort slot
- he fights normally while staying anchored to the player
- he should not wander off chasing kills

Player meaning:

- `Get back on me.`
- `Stop holding that lane and move with the squad.`
- `I need you close for a push, retreat, loot cover, or extraction move.`

Best uses:

- regrouping after a split
- pulling a boy out of a bad angle
- moving the whole squad after individual lane play
- re-forming before extracting

## Defend Command

Hotkey:

- `X`

Behavior:

- the player points at a visible ground position in the top-down world
- the selected boy moves to that position
- once there, he anchors to that pocket and defends it
- he prefers nearby cover, corners, trench lips, windows, sandbags, vehicles, and doorway edges
- he engages enemies from that area without taking long chase paths
- if displaced briefly by combat pressure, he tries to re-stabilize near the ordered spot

Player meaning:

- `Hold this.`
- `Watch this angle.`
- `Stay here and make this lane expensive for them.`

This is the top-down replacement for the Conqueror's Blade `hold X to send farther` behavior.

Because this game is top-down and the player can directly point anywhere visible, the destination should come from the cursor location instead of charge time.

Best uses:

- putting a shotgun boy on a doorway
- putting an SMG boy on a close flank
- putting a rifle boy on a long lane or courtyard edge
- leaving a boy to watch the extract approach
- covering a body recovery or loot strip

## Attack Command

Hotkey:

- `V`

Behavior:

- the selected boy enters an aggressive attack posture
- he actively seeks and chases reachable enemies near his current lane
- he is more willing to leave cover to finish pressure
- he uses shorter hesitation windows and stronger pursuit behavior
- he still obeys weapon logic, fear, and survival rules, but he should feel noticeably more committed

Player meaning:

- `Go kill them.`
- `Push them off this lane.`
- `Stop playing safe and take the fight.`

This command should create real upside and real risk.

That risk is part of the mastery:

- defensive boys in bad matchups can die if the player greedily presses `V`
- offensive boys in a favorable lane can wipe the pocket if the player presses `V` at the right time

Best uses:

- sending an SMG or shotgun boy to finish a softened room
- collapsing onto a routed scav
- punishing a reloading or exposed enemy
- helping a defending boy convert pressure into a kill

## Command Loop

The intended loop is:

1. Select a boy with `8`, `9`, or `0`.
2. Read his weapon, condition, and current lane.
3. Press `C`, `X`, or `V`.
4. If `X`, point at a specific visible position.
5. Watch the boy execute the order.
6. Swap to another boy and issue the next order.
7. Reassess as the fight changes.

This should feel fast enough to use during active combat, not like a pause-and-plan tactics layer.

## Positioning Rules

The feature lives or dies on whether boys go to good spots.

Defend orders should strongly favor:

- hard cover over open ground
- trench lips over flat dirt
- doorway shoulders over standing in the center of the doorway
- wall corners over exposed room centers
- windows with sightlines over blind interior positions
- slight offsets from other friendlies so the squad does not stack into one grenade target

The player is choosing the pocket, but the boy should help by settling into the best nearby micro-position.

## Weapon Role Expression

This feature becomes deep when weapon identity changes how the same order plays.

### Shotgun Boy

- strongest on defend in doorways, corners, trenches, and room entries
- strong on attack in close compounds
- weak when sent to defend long open lanes

### SMG Boy

- strong on attack and short-range defend
- good at flanks, alleys, sheds, and room pushes
- weaker on long exposed sightlines

### Rifle Boy

- strong on defend over medium-long lanes
- stable follow anchor in open transitions
- decent attack option when sightlines are clean

The player should gradually learn:

- not every boy should get the same order
- not every position suits every weapon
- good command play starts before the shooting by assigning the right lane to the right man

## UI Language

Use military and squad language, not strategy-game jargon.

Preferred command language:

- `FOLLOW`
- `DEFEND`
- `ATTACK`

Preferred order confirmation language:

- `Rook on me`
- `Makar holding doorway`
- `Yara attacking right lane`

Preferred warning language:

- `Too open`
- `Pinned`
- `No clean push`
- `Falling back to cover`
- `Out of range from order`

Avoid:

- `Unit selected`
- `Target destination confirmed`
- `Aggression state applied`

## Feedback Requirements

The player needs immediate readable feedback.

### Permanent Readability

- selected boy portrait highlight
- selected boy world ring
- selected boy name and weapon read
- current order label on each boy

### Transient Feedback

- short-lived destination marker when issuing `Defend`
- short order confirmation text near the boy and in the HUD
- bark or radio line acknowledging the command
- brief order-change flash on the selected portrait

Examples:

- `ROOK DEFENDING`
- `MAKAR ATTACKING`
- `YARA ON YOU`

## Voice And Barks

Command acknowledgement should strengthen the fantasy and explain behavior.

Examples:

- `On you.`
- `Holding here.`
- `I see the lane.`
- `Pushing.`
- `Going aggressive.`
- `Too open, sliding left.`
- `Can't hold center, taking the wall.`

These lines are not just flavor. They help the player trust the system.

## Skill Gap And Mastery

The command system should create mastery through:

- weapon-role matching
- terrain reading
- timing aggression correctly
- recovering from overextension
- choosing when to split the boys versus pull them back onto follow

The player should get punished for:

- sending the wrong weapon to the wrong lane
- using `Attack` into a defensive disadvantage
- leaving boys isolated too long
- defending open ground with no cover
- forgetting to reassign boys as the raid shifts

The player should get rewarded for:

- locking strong angles before contact
- using defend to create overlapping fire
- using attack only when the lane is favorable
- rotating boys back to follow before the route collapses

## Example Scenarios

### Compound Entry

- `8` selects Rook with a rifle
- player presses `X` and places him on the outer wall watching the road
- `9` selects Makar with a shotgun
- player presses `X` and places him on the doorway shoulder
- `0` selects Yara with an SMG
- player presses `C` to keep her on the player for the breach
- after first contact, player presses `V` on Yara to collapse the right room

### Extract Cover

- player sends a rifle boy to `Defend` the extract lane
- keeps one SMG boy on `Follow`
- puts the shotgun boy on `Defend` near the beacon approach
- when Blue starts closing, the player flips the SMG boy to `Attack` to peel the nearest threat, then recalls him with `C`

### Body Recovery

- one boy defends the road
- one boy follows the player to the body
- one boy attacks a weakened scav trying to close the lane

This creates the feeling of a real, improvised battlefield job split.

## Design Rules

- one keypress should never command every boy unless a future separate all-squad feature is added intentionally
- the selected boy must always be obvious
- `Defend` must feel reliable and sticky
- `Attack` must feel riskier and more aggressive than normal autonomy
- `Follow` must feel safe and easy to recover to
- weapon identity must matter to order outcomes
- terrain and cover must matter more than raw hidden stat bonuses

## MVP Scope

The first real version should include:

- direct boy selection on `8`, `9`, `0`
- one selected-boy highlight path in HUD and world
- `C = Follow`
- `X = Defend at cursor position`
- `V = Attack aggressively`
- visible order labels
- acknowledgement feedback
- enough AI behavior difference that the commands feel distinct

This is enough to prove the fantasy.

## Advanced Extensions

Later additions can include:

- more than three actively commandable boys
- explicit cycle-left and cycle-right controls
- drag-select or pair-select fireteams
- context-specific `Defend` variants for trench, window, doorway, and roof edge
- `Attack this target` versus generic aggro attack
- breach-specific orders
- body recovery as a first-class order
- loot strip order
- hold-fire and noise-discipline variants
- stash-side pre-raid role presets that influence how each boy interprets `Attack` and `Defend`

## Risks

Things that would make this feel bad:

- boys ignoring good nearby cover and standing in the open
- weak selected-boy readability
- `Defend` drifting into random chase behavior
- `Attack` feeling almost the same as `Defend`
- commands being too slow to issue during a firefight
- all weapons feeling equally good in all positions
- feedback living only in side panels instead of the playfield
- the system feeling like debug AI puppeteering instead of a war game fantasy

## Success Criteria

The feature is successful when:

- the player can instantly tell which boy is selected
- the player can issue one-boy-at-a-time orders without stopping the fight
- boys reliably take up stronger nearby micro-positions around the commanded point
- `Follow`, `Defend`, and `Attack` create clearly different outcomes
- the player starts making role-based decisions like `shotgun on doorway, rifle on lane, SMG on push`
- the player tells stories about how they positioned the boys, not just how much damage the AI did
