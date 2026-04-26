# Casualty State Player Spec

## Purpose

This feature turns damage into a battlefield story instead of an instant deletion.

The game should support a full casualty ladder:

- `healthy`
- `wounded`
- `downed`
- `dead`

That ladder applies to Blue, the boys, and hostile fighters.

The point is not to make fights slower for their own sake. The point is to make firefights feel more like desperate squad combat where wounded men change the plan, rescue under fire matters, and extraction can become a body-drag or carry-out story.

## Product Promise

The player can still fight through disaster.

When a brother gets hit hard, he does not always disappear from the raid. He can be wounded, collapse, call for help, get stabilized, dragged, carried, finished, or brought out alive.

When Blue goes down, the raid does not always instantly hard-fail. Sometimes Blue can still issue degraded orders while the boys try to save him. Sometimes the team helps him limp out. Sometimes they carry him. Sometimes Blue dies and the boys still try to bring his body home.

Enemy casualties follow the same logic. A hostile can be wounded or downed, and the player must decide whether to finish him, ignore him, or risk letting his side recover him.

The ideal player sentence is:

`Rook got dropped in the ditch, Makar dragged him back while Yara held the lane, then I went down too and the boys still hauled me to extract.`

## Core Fantasy

The player should feel like:

- damage has consequences before death
- men can break without the fight being over
- the squad is partially autonomous, not a perfect RTS puppet line
- rescue, covering fire, dragging, and carrying are as important as shooting
- extraction becomes more personal when a brother cannot walk
- leaving someone behind feels like a real choice, not a UI state change

This is the `me and the boys` fantasy under pressure.

## Three Layers

## Fantasy Layer

This is a RimWorld-style fight in a top-down extraction shooter.

The player is not controlling every footstep. The player is steering named men through panic, pain, bravery, and bad ground. Sometimes a boy holds because he is disciplined. Sometimes he hesitates because he is wounded and the lane is ugly. Sometimes he drags a brother without waiting for a perfect order because that is the human thing to do.

## Gameplay Layer

The player reads who is wounded, who is downed, which lane is collapsing, and then chooses:

- patch now or keep pushing
- finish that hostile or let him bleed
- order a boy to cover, drag, carry, or retreat
- stay for loot or turn the raid into a casualty extract
- when Blue is downed, keep issuing reduced orders or trust the boys to execute the rescue

The player is still in command, but not in total control.

## Code / Simulation Layer

The engine tracks:

- health-band transitions
- wound severity and effects
- downed timers and bleed-out pressure
- who is stabilizing, dragging, carrying, or finishing whom
- limited control state for downed Blue
- rescue and finish outcomes for squad and enemy combatants
- story hooks that later feed dialogue, aftermath, and persistent memories

## Health Ladder

## Healthy

The combatant is fully functional.

## Wounded

The combatant stays in the fight, but with visible and meaningful degradation.

Expected effects:

- slower movement and weaker acceleration
- shakier aim or longer target reacquisition
- less confidence pushing open ground
- more stress lines and pain reactions
- higher risk of becoming downed from the next serious hit

`Wounded` is the state that makes the raid feel like it is slipping before anyone collapses.

## Downed

The combatant is incapacitated and no longer fighting effectively.

Expected behaviors:

- can collapse, crawl a little, or stay in place
- cannot perform normal full-speed combat
- enters a rescue-or-finish window
- may bleed out if ignored

This is the state where the fight changes shape.

## Dead

The combatant is fully dead.

For friendlies, the body may still matter for recovery, extraction, memory, and later storytelling. For enemies, the body may still matter for loot, tactical space, and later evac/recovery beats.

## Wounded State

## Why It Exists

Without `wounded`, damage only matters at the moment of collapse. With `wounded`, the squad can start failing in human ways before anyone goes down.

That gives the fight more depth:

- a shotgun boy can still hold a doorway while hurt, but not as cleanly
- a rifle boy on a long lane may stop being reliable after a bad hit
- a wounded Blue can still lead, but greed gets riskier

## Friendly Wounded Behavior

A wounded boy can still:

- follow
- defend
- attack if ordered
- reposition
- extract under his own power

But he should do those things worse, with more friction, and with less certainty.

Examples:

- he may obey `attack` but stop short if the lane looks suicidal
- he may choose closer cover than the exact commanded point
- he may verbally resist a bad push
- he may prefer to fall back if he is one trade from collapse

This is where the RimWorld influence matters. Orders are strong intent, not perfect puppet strings.

## Enemy Wounded Behavior

A wounded hostile remains dangerous, but unstable.

Possible behavior:

- staggers to closer cover
- blind-fires more
- retreats or calls out
- attempts self-stabilization
- becomes easier to finish if caught exposed

The player should read that an enemy is compromised without assuming he is harmless.

## Downed State

## Friendly Downed Behavior

When a boy is downed:

- he is no longer a normal combatant
- he may crawl or reach for cover in a small local radius
- he calls for help or goes quiet depending on the severity
- he enters a rescue timer before death

Friendly priorities around him become:

- stabilize him
- drag him off the lethal lane
- carry or assist-walk him toward extract
- cover the rescue with the rest of the squad

## Blue Downed Behavior

Blue downed is the most important expression of the feature.

The raid should not instantly end every time the player drops. Instead, Blue can enter an incapacitated command state.

Possible outcomes:

- Blue is conscious enough to issue a small subset of orders
- Blue can be helped to walk by a brother
- Blue must be fully carried
- Blue dies and the boys can still attempt body extraction

The fantasy is:

`Even when I am broken, the raid is still about whether my boys can get me home.`

## Hostile Downed Behavior

Enemies can also become downed.

That gives the player new decisions:

- finish him now
- ignore him and keep solving the lane
- risk his allies recovering him
- loot later after the pocket is truly dead

A downed hostile should make the battlefield feel messier and more alive.

## Rescue Actions

The first version should support these battlefield verbs:

- `stabilize`
- `drag`
- `assist-walk`
- `carry`
- `finish`

## Stabilize

Short interaction that slows or pauses bleed-out and can move a downed ally from immediate death risk into an extractable wounded state.

## Drag

Fast, ugly casualty movement under fire. Lower speed, limited shooting, but enough to pull someone out of a kill lane.

## Assist-Walk

Used when the casualty can still move a little. Better than a full carry, worse than normal movement.

## Carry

Slow, high-commitment extraction movement for Blue, a brother, or eventually a body bag.

## Finish

Used on downed enemies and, if ever allowed, must be treated as a very intentional tone-heavy act. For the current feature direction, finishing is primarily about hostile combatants.

## Command Philosophy

This feature should move the game toward `RimWorld pressure with shooter readability`.

That means:

- the player still gives orders and chooses destinations
- squadmates still have their own local judgment
- wounded and fear states can make execution messy
- a boy should sometimes refuse the dumbest possible push
- a rescue can begin autonomously if the human truth is obvious

The player is the squad leader, not a telepath.

## Player Control While Blue Is Downed

Blue downed should use a reduced command set, not full normal play.

Good degraded commands:

- tell the boys where to fall back
- tell one boy to help Blue
- tell one boy to hold or cover
- tell the squad to extract
- tell the boys to finish a nearby downed hostile only if the lane is already won

Bad degraded commands:

- normal full-precision aim-and-gunplay
- hyper-clean micromanagement that ignores incapacitation

The reduced command set should feel tense, limited, and dramatic.

## UI Language

Use blunt battlefield language.

Preferred state labels:

- `WOUNDED`
- `DOWN`
- `BLEEDING OUT`
- `STABLE`
- `DRAGGING`
- `ASSISTING`
- `CARRYING`
- `FINISHED`

Preferred squad callouts:

- `Rook wounded`
- `Makar down`
- `Dragging Yara`
- `Blue cannot walk`
- `Carry him out`
- `Finish Blue tape`
- `Hold the lane`

Avoid:

- `incapacitation phase entered`
- `recovery interaction available`
- `ally state updated`

## Feedback Requirements

Permanent readability should show:

- each squadmate's casualty state
- whether he can still fight, walk, or needs help
- whether Blue is in degraded command mode
- whether a downed enemy is still alive

Transient feedback should show:

- impact-to-wounded transitions
- collapse into downed
- rescue progress bursts
- carry/drag state callouts
- enemy finish confirmations
- short barks that explain autonomous decisions

Examples:

- `YARA WOUNDED`
- `ROOK DOWN`
- `MAKAR DRAGGING BLUE`
- `BLUE STABLE, CAN'T WALK`
- `GREEN TAPE FINISHED`

## Emergent Storytelling Hooks

This feature should later feed the dialogue and memory system already being built.

Good story hooks include:

- who rescued whom
- who was left behind
- whether Blue was carried out alive or dead
- who ignored a rescue to finish the lane
- whether an enemy was mercy-left or intentionally finished
- whether a boy held the lane while wounded
- whether the extract became a body-drag operation

These hooks should become future triggers for:

- short combat barks
- stash debrief lines
- memorial and wake references
- relationship-specific squad memories

## Example Scenarios

## Doorway Collapse

- Yara gets hit and becomes `wounded`
- the player keeps the push on for two more seconds
- Yara takes another hard hit and goes `downed`
- Rook automatically leans toward a drag because the doorway is lost
- the player orders Makar to `hold`
- Yara gets dragged behind the wall and stabilized
- the raid becomes a wounded extract instead of a full clear

## Blue Down, Squad Still Alive

- Blue gets dropped crossing a hot lane
- the camera and HUD shift into degraded command mode
- one boy starts moving to help without waiting
- the player orders the other boy to cover the ditch
- Blue becomes `stable but cannot walk`
- the team assist-walks Blue toward extract

## Enemy Casualty Pressure

- a Green tape hostile goes `downed` behind sandbags
- the player can see he is still alive
- Yara wants to finish him but the lane is still contested
- the player chooses to pull instead
- later the hostile is either finished by bleed-out or recovered by his side

## How This Strengthens The Existing Loop

This feature deepens the raid loop directly:

- combat lasts longer in interesting ways, not spongey ways
- extraction becomes heavier because wounded men change route value
- squad commands matter more because rescue needs lane jobs
- stash consequence matters more because survival has gradations
- dialogue and persistent memory get stronger source material

It also strengthens the current body-recovery direction. Right now the game already cares about bodies after death. This feature makes the moments before that death playable and dramatic.

## Design Rules

- `Wounded` must change behavior, not just tint the portrait
- `Downed` must create a rescue or finish decision, not dead time
- Blue downed should not become a cheap arcade extra life
- boys should remain partially autonomous under stress
- enemy downed states must create tactical pressure, not cleanup chore spam
- the feature must make extraction stories richer, not just slower

## Success Criteria

The feature is successful when:

- a firefight can visibly deteriorate before anyone dies
- the player makes meaningful rescue-versus-push decisions
- the boys feel like humans with partial autonomy, not perfect puppets
- a downed Blue scenario can still produce a memorable extraction
- enemies being downed creates real finish-or-ignore tension
- the player tells stories about who saved whom and who got left behind
