# AAA Shoot Feel Implementation Plan For The Survivor Walk Test

## Goal

Make shooting feel fast, weighty, readable, and expensive **inside the decoupled `Survivor Walk Test` scene** so we can push presentation quality without destabilizing the live raid runtime.

This plan is intentionally split into **six milestones**, with the expectation that each milestone is one focused coding pass. The order matters. Early milestones build the runtime hooks and feedback timing that later milestones depend on.

## Product Intent

In the test scene, the player should feel:

- rounds leave the gun instantly and with authority
- each weapon has a distinct firing identity
- recoil, muzzle flash, tracers, and impacts work together as one event
- hits look and sound expensive
- suppressed or unsuppressed fire changes the whole read of the lane
- top-down presentation stays readable even when the gunfeel gets more aggressive

This is not a “more particles” plan. It is a **shot event quality** plan for the sandbox scene.

## Constraints

- Preserve the top-down readability of the raid.
- Favor player-facing combat feel over back-end abstraction work.
- Reuse the existing weapon/simulation/render path where possible.
- **Keep this work scoped to the `Survivor Walk Test` front-door sandbox unless a later directive explicitly promotes it into the live raid.**
- Do not make the screen noisy enough that targets, cover, and lanes become harder to read.
- Every milestone should leave the game in a shippable state by itself.

## Milestone 1. Shot Event Backbone

### Objective

Unify firing in the `Survivor Walk Test` into one explicit shot-feel event so visual, audio, recoil, and impact timing all come from the same source of truth.

### Deliver

- create a shared shot event payload for player and hostile fire
- include weapon id, muzzle origin, aim angle, projectile speed, suppression class, and hit result
- route muzzle flash, tracer, recoil kick, shot audio, shell feel, and impact cue from that one event
- remove scattered per-surface timing hacks where one exists

### Success Bar

- firing a weapon produces one coherent event instead of several loosely-timed reactions
- future milestones can hook into one shot event instead of patching many systems

## Milestone 2. Fast Projectile Read

### Objective

Make test-scene projectiles feel faster and more lethal without making them invisible.

### Deliver

- tune projectile speeds upward by weapon family, especially rifles and marksman weapons
- add a clearer near-muzzle streak and slimmer flight read for fast rounds
- make projectile brightness and length scale by caliber / weapon class
- keep a lighter visual treatment for junk guns and low-tier weapons
- make shot travel timing feel immediate in close and mid-range lanes

### Success Bar

- rounds feel like they leave the gun hard and fast
- faster weapons visibly read faster than low-tier or improvised weapons
- the player can still track where dangerous lanes are coming from

## Milestone 3. Recoil, Kick, and Camera Response

### Objective

Give each sandbox shot physical force.

### Deliver

- add weapon-specific screen kick / camera punch values
- add actor kickback on the firing body
- tune shot cadence recovery so spammy weapons feel nervous and hard-hitting weapons feel heavier
- make brace / steady states reduce recoil in a readable way
- separate camera response for pistol, SMG, rifle, shotgun, MG, bolt gun, and AMR classes

### Success Bar

- firing no longer feels like a flat sprite state change
- weapons carry distinct physical identities
- controlled fire and bad fire look and feel different

## Milestone 4. Muzzle, Impact, and Surface Effects

### Objective

Make sandbox shots terminate beautifully.

### Deliver

- stronger muzzle flash families by weapon class
- impact sparks, dirt puffs, bark hits, concrete chips, and soft-body hit reactions
- stronger near-hit suppression visuals around the player
- short-lived smoke / heat after heavier fire where it helps readability
- better hit confirmation for lethal and nonlethal impacts

### Success Bar

- muzzle and impact read as one continuous event
- surface material matters visually
- near misses feel dangerous

## Milestone 5. Audio and Shot Layering

### Objective

Add the sound stack needed for the `Survivor Walk Test` shots to feel premium.

### Deliver

- add per-weapon shot families instead of generic fire sounds
- layer crack, body, tail, and distant report where appropriate
- make suppressed and unsuppressed reads clearly different
- add impact and hit sounds that match surface/body type
- add dry fire, reload punctuation, and shot-finish tails so weapons feel mechanically complete

### Success Bar

- the player can identify weapon class from sound alone
- firing feels expensive even before looking at particles
- loud guns dominate the lane in the way they should

## Milestone 6. Final Polish and Combat Readability Pass

### Objective

Push the whole `Survivor Walk Test` firing stack to the highest-quality readable state the current game can support.

### Deliver

- tune all shot layers together in the test scene: speed, tracer, kick, flash, audio, impacts
- remove any effect combinations that muddy target readability
- tune low-tier weapons so they still feel bad in the right ways, but not unfinished
- tune high-end weapons so they feel premium without becoming visual clutter
- add one or two showcase verifies or test states specifically for shoot-feel regression
- document the supported shot-feel tuning surfaces for future agents

### Success Bar

- the whole firing loop feels cohesive instead of individually improved
- shooting quality is visibly and audibly above the current prototype bar
- future agents can keep polishing without regressing the feel stack

## Recommended Build Order

1. Milestone 1 first, no exceptions.
2. Milestone 2 and 3 next, because speed and physical response define the feel.
3. Milestone 4 after the shot backbone is stable.
4. Milestone 5 once the visual stack is already coherent.
5. Milestone 6 only after the previous five are in and individually tested.

## Regression Risks

- making projectiles faster but less readable
- adding too much flash and losing lane clarity
- making all guns feel loud but not distinct
- making low-tier guns feel unfinished instead of intentionally bad
- layering effects from different sources and reintroducing timing drift

## Verification Expectations

Each milestone should finish with:

- a build pass
- one direct runtime test of the affected weapons
- one documented note in the wiki
- at least one stable way to re-check the new behavior later

## Immediate Next Step

Start with **Milestone 1. Shot Event Backbone** in the `Survivor Walk Test`.
