# Squad Directional Brace Player Spec

## Purpose

Add a deeper direct-boy directional-command family:

- `Alt + RMB` tells the selected boy to plant, aim, and be ready to kill anything entering a chosen direction or lane.
- `Ctrl + RMB` tells the selected boy to stay mobile while covering a chosen sector during movement.

This is not a generic "stand here" order. It is a committed sector-watch family:

- place the boy
- lock his attention to a lane
- give him either a planted braced edge or a moving readiness edge
- make the player win harder by choosing the right lane and the right gun

## Product Promise

The player should be able to say:

- "Rook, lock that hallway."
- "Hold that window and kill the first body that crosses."
- "Brace on the doorway while I move."
- "You watch the push lane. I breach."
- "Watch left while we cross."
- "Cover that treeline on the move."

This should make the squad feel deeper without adding RTS drag-box complexity.

## Three Layers

### Fantasy Layer

The player is not babysitting followers. The player is placing armed brothers onto killing lanes and building room-control setups.

### Gameplay Layer

The player selects one boy, points at the world, and issues:

- `Alt + RMB` to create a planted sector-watch order
- `Ctrl + RMB` to create a moving sector-coverage order

The planted version faces the lane, gains a modest braced benefit, and meaningfully reacts to threats in or near that watched direction unless pressure breaks the hold.

The moving version keeps the boy mobile but pre-commits his attention to one side or lane, making him more efficient in that direction and less efficient elsewhere.

### Code / Simulation Layer

The engine tracks:

- the selected squadmate
- the command mode
- the plant point or moving origin
- the facing direction / watched lane
- the planted or moving sector-watch state
- entry and exit conditions
- the same real weapon, line-of-sight, ammo, suppression, and projectile logic already used elsewhere

## Player Loop Position

This command sits between basic positioning and explicit tactical actions.

Current direct-boy verbs:

- `C` follow
- `X` defend at cursor
- `V` attack
- `Alt + G` frag
- `Alt + Click / Alt + V` suppress

New deeper verbs:

- `Alt + RMB` planted sector watch
- `Ctrl + RMB` moving sector coverage

That creates a richer stack:

1. move one boy into a strong spot
2. point him at the correct lane
3. use another boy for frag or suppress
4. move yourself through the opening they create

## Feature Behavior

### Core Inputs

`Alt + RMB` issues a directional braced-overwatch order to the selected live boy.

The command should use:

- the current cursor ground point as the watched direction reference
- the boy's current or nearest viable planted position as the brace origin

The first implementation should prefer low-friction input:

- if the boy is already close to a plausible hold point, he plants there
- if not, he moves to a nearby viable brace point first, then locks the lane

`Ctrl + RMB` issues a moving sector-coverage order to the selected live boy.

The command should use:

- the current cursor ground point as the watched direction reference
- the boy's current movement/follow path as the mobile base state

The moving version should not force a full stop unless survival or terrain handling requires it.

### What The Boy Does

When ordered into planted sector watch:

- he plants rather than follows
- he orients toward the specified lane
- he prefers threats inside that watched wedge
- he gets a braced firing benefit similar in spirit to the player's brace
- he does not chase far outside the watched lane
- he stays more disciplined than `Attack`
- he is more directional and lethal than `Defend`

When ordered into moving sector coverage:

- he keeps moving or following
- he biases facing toward the specified sector
- he prefers threats inside that watched wedge
- he gets a smaller readiness benefit than the planted version
- he is less responsive to off-sector threats
- he does not get the full planted brace edge

### What Makes It Deep

The depth comes from matchup and geometry:

- shotgun boy watching a door: strong
- shotgun boy watching a long road: bad
- rifle boy braced on a window lane: strong
- rifle boy pointed into a blind room corner: wasteful
- SMG boy braced on a short cross: good
- rifle boy covering a field edge while moving: useful
- shotgun boy covering a long lane while moving: weak

The player should improve over time by learning:

- where to plant
- which lane matters
- which gun belongs on that lane
- when to stay planted versus move with coverage
- when to use overwatch instead of suppress or frag

## Design Rules

### One Clear Verb

The player-facing idea is:

- "Watch this sector."

It should not become a submenu tree of:

- brace mode
- cone mode
- target priority mode
- hold discipline mode

The depth should come from terrain, weapon, timing, and support combinations.

### Braced Means Stronger But Narrower

This verb needs push/pull tension.

Strength:

- better first-shot stability
- better short burst discipline
- cleaner lane punishment
- stronger anti-peek behavior

Exposure:

- narrower coverage
- worse responsiveness outside the watched lane
- bad if the player watches the wrong direction
- vulnerable to flanks, grenades, and cross-lane pushes

Moving sector coverage should keep the same logic, but softer:

- less payoff than planted watch
- more flexibility than planted watch
- still punished if the wrong sector is chosen

### Distinct From Existing Orders

`X Defend`

- move there
- hold locally
- fight nearby enemies
- flexible pocket defense

`V Attack`

- push aggressively
- chase finishes
- accept exposure

`Alt + Click / Alt + V Suppress`

- create pressure on a point
- pin bodies
- lower precision, higher area denial

`Alt + RMB Directional Brace`

- lock one lane
- better precision and readiness
- limited directional commitment

`Ctrl + RMB Moving Sector Coverage`

- stay mobile
- watch one side or lane while moving
- medium readiness boost in that direction
- lower commitment and lower payoff than planted watch

## UI Language

Preferred military language:

- `Brace Lane`
- `Watch Lane`
- `Hold Angle`
- `Overwatch`
- `Braced`

Avoid abstract/debug language like:

- directional cone mode
- lane vector stance
- focus orientation state

Recommended player-facing command title:

- `Brace Lane`

Recommended short live readouts:

- `Braced Left Hall`
- `Watching Door`
- `Holding Window`
- `Overwatch Yard`
- `Covering Left Move`
- `Watching Treeline On Move`

## Feedback

### World Feedback

The order should read in-world with:

- a planted marker at the boy
- a visible wedge or directional chevron
- a lane line or short sector arc
- a brief braced confirmation pulse

The moving version should read with:

- a lighter directional chevron
- a watched-side indicator
- less visual weight than the planted version

### HUD Feedback

The HUD should show:

- selected boy is in `Brace Lane`
- watched lane label
- readiness / active state
- whether he is planted, lining up, or broken out of brace

### Audio / Comms

Good bark examples:

- "Set. Watching the hall."
- "Braced on the window."
- "I have the lane."
- "Lost the angle. Resetting."
- "Grenade. Breaking brace."
- "Moving. Watching left."
- "Crossing with eyes on the yard."

## Example Scenarios

### Door Control

The player puts a shotgun boy on a room threshold with `Alt + RMB` aimed into the doorway. The boy braces and waits for the first body to push through while the player clears the side room.

### Crossfire Setup

The player sets a rifle boy to watch the yard lane, then orders another boy to suppress a shack window. The first boy punishes anyone displaced into the open.

### Breach Stack

One boy braces the staircase. Another throws the frag. The player enters after the pop.

### Covered Crossing

The player uses `Ctrl + RMB` on a treeline while moving. The selected rifle boy stays in motion with the squad but keeps his attention on that side, making the crossing safer without giving up mobility.

## Success Criteria

The feature succeeds if:

- players can easily understand what `Alt + RMB` does
- players can easily understand what `Ctrl + RMB` does
- the order creates visible tactical stories
- lane choice and gun choice clearly matter
- the order feels stronger than `Defend` but more limited than `Attack`
- the planted version feels stronger than the moving version
- it combines naturally with `Suppress` and `Frag`
- it adds mastery rather than just another button

## Failure Risks

The feature fails if:

- it feels identical to `Defend`
- the moving version feels like passive autofire instead of pre-committed attention
- it becomes a hidden stat buff with no readable lane behavior
- it turns into permanent turret mode with no tradeoff
- the UI shows a fancy cone but the AI ignores it
- it demands too much placement friction for too little payoff

## Why This Strengthens The Existing Loop

This makes squad command more than follower automation.

It turns room clears, hallway fights, and extraction holds into real setup problems:

- who holds
- who pushes
- who suppresses
- who frags
- which lane is dangerous enough to deserve a braced rifle

That directly supports the game's promise of deeper fights, real skill gap, and winning strategies built from positioning and role choice.
