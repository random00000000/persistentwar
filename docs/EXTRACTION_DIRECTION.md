# Extraction Direction

## Purpose

Lock in the intended direction for the game so future implementation keeps the project aligned with a true extraction-shooter loop instead of drifting into a top-down shooter with an exit button.

## Core Problem

The game currently has extraction mechanics, but extraction does not yet carry enough emotional or strategic weight.

Right now the player can:

- fight
- loot
- complete objectives
- reach extraction

But the player is not yet consistently asking:

- `What am I risking if I stay?`
- `What am I giving up if I leave now?`
- `Can I still get out alive with this damage, this ammo state, and this haul?`

If those questions are weak, extraction becomes a checkbox instead of the defining decision of the raid.

## Product Direction

Extraction should be the moment where the run becomes real.

The target player feeling is:

`I got in, solved a few fights, found something valuable, burned half my meds, heard the route getting hotter, and had to decide whether to greed one more room or cut for extract.`

That sentence should describe the game more accurately than:

`I cleared the content and then used the extract.`

## Locked Design Statement

`Extraction is the decision to lock in a win before greed, noise, and damage turn the raid against you.`

This should be treated as the main direction for the raid loop.

## What Extraction Must Do

Extraction must create three kinds of tension at the same time:

1. `Carry risk`
   What the player brought in or has secured during the raid must feel meaningfully losable.

2. `Greed temptation`
   Staying in raid must offer real upside, not just filler cleanup.

3. `Escalating danger`
   The map must become more hostile over time, through noise, route pressure, or degraded player condition.

When these three forces overlap, extraction becomes a meaningful decision instead of a script beat.

## Four Pillars To Build Around

### 1. Carry Risk

The player should care about extraction because death does not only lose temporary score.

Desired direction:

- equipped raid kit matters
- committed supplies matter
- carried loot matters
- recovered stash items matter

The loss model should make the player care about surviving with the haul, not just finishing objectives.

### 2. Greed Temptation

The correct play should not always be `full clear, then leave`.

Desired direction:

- early raid gives stable but smaller gains
- mid-raid offers more valuable opportunities
- late greed offers major upside but sharply worse odds

Extraction should often happen while the player still wants more.

### 3. Escalating Route Pressure

The longer the player stays, or the louder they get, the worse the route should become.

Desired direction:

- louder raids pull stronger response
- delayed extraction increases pressure
- hot objectives make the final route home more dangerous
- extraction itself can become a noisy commitment that invites collapse

The player should feel that the raid is turning against them, not simply waiting for them.

### 4. Stash Consequence

Extraction should matter because it changes the next run.

Desired direction:

- successful extractions improve future optionality
- failed raids reduce future strength or flexibility
- the stash should feel like the memory of previous raids

The stash is not a detached menu. It is the long-term consequence layer of extraction.

## What Is Missing Today

These gaps are the main reasons extraction feels underweighted:

- loot is useful, but not yet painful enough to lose
- staying longer does not yet create a strong enough reward-versus-danger curve
- raid state does not yet force enough live decision-making around greed versus safety
- extraction often reads as the final step after success, instead of the act that confirms success

## Why The Game Still Feels One-Dimensional

Right now the game is mostly:

- move
- shoot
- loot
- extract

What it needs is more push and pull in these layers:

- `How do I approach this space?`
- `How do these enemies perceive and react to me?`
- `What tools let me create a different solution?`
- `What happens if I stay loud, go quiet, bait, split, flank, or force a route?`
- `How does this run become a story instead of a skirmish?`

That is why the game can still feel one-dimensional even though the controller and firefights already feel good.

The current combat base is not the main weakness. The missing layer is situation design.

## The 5-Minute Trap

The core issue is not that the combat loop is bad. The issue is that the player runs out of new kinds of decisions too quickly.

A short prototype feels complete when:

- the player has seen the main gunfeel
- the enemy behavior pattern is understood
- the space is fully legible after one pass
- loot does not create enough rerouting pressure
- extraction is just cleanup

A longer-lasting raid game needs fresh decisions to keep appearing after minute five:

- new enemy relationships
- new route pressure
- new traversal opportunities
- new information
- new risk tradeoffs
- new reasons to stay or leave

The fix is not:

`make raids longer`

The fix is:

`make decision density keep evolving`

## North Star For Replayability

The strongest comparison point is this:

`In ARC Raiders and Hitman, you can learn how things work and exploit them intelligently.`

That is the real north star.

Not:

- realism by itself
- harder AI by itself
- bigger maps by themselves

The game wants enemies and spaces that can be:

- studied
- manipulated
- countered
- baited
- separated
- ambushed
- disabled in specific ways
- beaten differently depending on loadout and timing

That is what creates replayability.

## Broader Direction

The next step should not be treated as:

`add more content`

It should be treated as:

`Build a systemic raid game where the player reads hostile forces, navigates layered spaces, and uses specialized tools to create their own extraction route.`

That direction is stronger and broader than trying to make the project read as only `top-down Tarkov`.

## Thematic Direction

The project should not anchor itself to a literal real-world ongoing war, real current factions, or propaganda framing.

The safer and stronger direction is:

`A fictional modern frontline war in a collapsing exclusion zone, where contractor squads, militia crews, entrenched regulars, civilians, logistics teams, and machine-supported defenses all overlap in a living battlefield.`

This keeps the desired tone:

- persistent frontline pressure
- urban warfare
- village fighting
- tree line assaults
- trench and bunker warfare
- supply runs under fire
- shifting control over ground
- periods of eerie calm that can explode into sudden violence
- squad persistence and battlefield memory
- stash growth that supports larger operations

### Fictional Premise

The player is part of a four-person assault and logistics detachment operating inside a dead sector along an unstable frontline.

The war does not wait for the player.

The player moves through:

- shattered villages
- ruined apartment blocks
- trench networks
- tree lines and shell craters
- industrial compounds
- bunker chains
- temporary logistics bases

Friendly squads and hostile squads fight in real time, can die, can lose ground, can request supply, and can drag the local situation into crisis even if the player is not the one who starts the firefight.

The stash is not just personal greed. It is the operational memory of the squad:

- weapons
- explosives
- food
- medical stock
- optics
- radios
- breaching tools
- mortar rounds
- vehicle access
- assigned squad gear

### Desired Battlefield Feel

The intended emotional target is:

- you and the squad moving through hostile territory during a quiet lull
- then contact erupts suddenly and the whole space becomes a fight
- suppressive fire distorts the battlefield even before direct hits land
- trenches and elevation dominate survival
- logistics and casualty recovery matter
- vehicles can abruptly change the scale of a fight
- the war keeps moving whether or not the player is ready

### Thematic Pillars

#### Persistent War

The frontline should feel alive.

- positions can be reinforced
- positions can be overrun
- squads can be cut off
- artillery or armor can change a stable zone into a kill box
- the player can return to places shaped by earlier outcomes

#### Squad Attachment

The player should care about the people around them.

- squadmates can be equipped from stash
- squadmates can be assigned sectors and pushes
- squadmates can die
- bodies may be recoverable or unrecoverable
- survival, recovery, and replacement all matter

The goal is not abstract unit management. The goal is to make the player remember names, losses, roles, and bad calls.

#### Battlefield Logistics

The player is not only there to kill.

Strong mission shapes include:

- bringing ammunition or food to a position
- reinforcing a trench line
- recovering wounded or dead
- escorting a convoy
- resupplying a mortar or machine-gun nest
- bringing breaching gear for an assault
- securing a basement or bunker as a temporary foothold

#### Entrenchment And Shelter

The world should reward fighting from prepared ground.

Future-facing direction:

- trenches
- bunkers
- firing ports
- blind fire
- grenades dominating confined trench fights
- elevation and cover making in-trench defenders very dangerous

#### Sudden Scale Changes

A fight should be able to escalate quickly.

Examples of the kind of stories the game should support:

- a squad clears a house and then armor appears
- a quiet village turns into a block-by-block firefight
- artillery lands on a mortar pit
- a convoy drives into an obvious trap
- a discovered position starts pulling reinforcements
- a truck that looked routine turns out to be carrying high-value battlefield equipment

### Verbs And Situation Types To Preserve

The following desired themes and situations should guide future feature design:

- suppressive fire changing behavior even on near misses
- trench warfare and bunker-to-bunker movement
- supply delivery under fire
- squad pushing, holding, and falling back in real time
- ambushing logistics
- holding villages and compounds
- setting up in basements and bunkers
- recovering bodies and dealing with the consequences of failure
- convoy movement through dangerous sectors
- artillery, vehicles, and machine guns changing the tempo of a fight
- quiet movement, stealthy infiltration, and sudden catastrophic detection

### Thematic Rule

Keep the project focused on:

- fictional factions
- fictional dead sectors
- fictional frontline history
- grounded squad warfare and logistics

Avoid:

- direct real-world national framing
- current-war propaganda
- supremacist or dehumanizing faction language
- one-to-one retelling of active real conflicts

## Next Pillars To Explore

### Enemy Ecology, Not Just Enemy AI

Enemies should fill different battlefield roles and interact with noise, sightlines, objectives, and each other.

Examples to keep in mind:

- searcher units that flush the player
- anchor units that lock lanes
- mobile hunters that chase noise
- support units that call pressure
- armored weak-point enemies that demand angle or ammo choice
- enemies that are easier to avoid than fight, and vice versa

The player should be solving hostile ecosystems, not just individual targets.

### Spaces With Multiple Solution Paths

The map cannot just be a fight box.

It needs:

- layered interiors and exteriors
- soft flanks
- dangerous shortcuts
- collapse points
- stealth routes
- loud routes
- vantage routes
- commitment routes

The player should be routing through the map, not just walking across it.

### A Special Traversal Or Breaching Verb

The point of the breaching-C4 idea is not specifically `add C4`.

The important insight is that the game likely wants one signature verb that changes how the player reads space.

Possible categories:

- breaching charge
- climbing line or traversal launcher
- cutting torch
- portable jammer
- wall drill
- door wedge or barricade kit

The point is:

`give the player one tool that turns "the map is fixed" into "the player can reshape the route"`

### Stealth-Pressure Spectrum

The game needs more than a simple quiet-versus-loud split.

It wants readable states such as:

- unnoticed
- suspicious
- searching
- tracking
- converging
- committed assault

That allows the player to intentionally play in the seams instead of only thinking in terms of detected or not detected.

### Knowledge-Based Kills

Enemies should reward understanding, not just raw aim.

This is the ARC Raiders lesson worth preserving.

Desired direction:

- hit the right part
- use the right weapon class
- wait for the right behavior window
- bait the right attack
- punish a recovery state

The player should feel smart, not only accurate.

## Directional Levers

These are the major design levers to use when strengthening extraction:

### Raid Profit Curve

The raid should have a clear value curve:

- safe opener
- tempting mid-raid gains
- dangerous late-raid greed

This creates the reason to leave before the map fully collapses.

### Persistent Player Condition

Player condition should change extraction math.

Examples:

- lower health
- weaker handling
- reduced movement quality
- reduced control under burden
- worse survivability after repeated mistakes

The exact system can stay simple at first, but damage must affect extraction decisions.

### Burden And Haul Pressure

More loot should not be purely upside.

Desired direction:

- extra haul can reduce mobility
- extra haul can worsen handling
- extra haul can make the final run to extract riskier

Greed should reshape the combat and escape problem.

### Extract Tradeoffs

Different extracts should not all mean the same thing.

Desired direction:

- one extract may be faster but louder
- one may be safer but farther
- one may require a stronger clear first
- one may be better for a damaged player, another for a greedy player

The player should choose extraction based on current run state, not habit alone.

### Partial Success

Leaving early with a smaller win should often be smart.

This is critical to the genre identity.

If the best move is almost always to fully clear every time, the game stops feeling like extraction and starts feeling like content consumption.

## What Not To Prioritize First

These directions are lower priority than making extraction meaningful:

- adding more detached economy systems
- adding more questline complexity before the raid loop is sharp
- adding more menu depth that does not change raid decisions
- increasing punishment without also increasing temptation and readability

Punishment alone does not create a strong extraction loop. It only creates stress.

## Implementation Heuristic

When evaluating future features, ask:

`Does this make the player more likely to face a meaningful leave-or-stay decision?`

If the answer is no, the feature is probably not helping the extraction identity enough.

## Near-Term Direction

Future work should prioritize features that directly improve:

- the value of making it out alive
- the fear of losing what was committed or secured
- the temptation to stay one step too long
- the final run home as a tense, readable survival phase

## Success Criteria

This direction is working when players naturally describe runs in terms like:

- `I should have left earlier`
- `I got greedy and paid for it`
- `I barely made it out with the good haul`
- `I had to cut the run because my meds and ammo were too low`
- `I skipped one objective because the route was turning hot`

Those are extraction-shooter sentences.

## Durable Rule

Do not let the game drift into:

`clear the map, then press extract`

Keep it aimed at:

`decide what the run is worth, decide when to leave, and survive the cost of that decision`
