# Foxhole-Like War Experience Picker

This doc is for designing the experience, not the systems.

The question is not "which trench modifier do we tune?"

The question is:

What kind of war do we want the player to feel they are fighting?

## The Product Promise

You are an officer in a slow NPC-driven war.

You do not win by clearing one arena. You win by building a war machine that can move forward, survive losses, establish camps, hold ground, and eventually break the enemy camp.

The player should be able to say:

"We started with one muddy camp. I built a forward trench line, stocked it, lost the first line, fell back to the MG trench, then used that breathing room to build a second camp closer to the enemy. That camp became the new launch point for the next push."

That is the target.

## Three Experience Templates

Pick one of these as the product shape.

## Template A: The One Town Siege

The whole game happens in one replayable town. There are two main camps: your camp and the enemy camp. The player builds trenches, ammo points, dugouts, and forward posts inside that one battlefield until one camp falls.

What the player does:

- starts a war from the home camp
- prepares supplies
- places trenches and ammo positions
- watches soldiers build and occupy them
- pushes the front a little farther
- loses or holds forward positions
- eventually attacks the enemy camp
- wins when the enemy camp is destroyed

Why this is good:

- easiest to ship
- strongest first playable
- makes every trench and soldier matter
- keeps the fantasy focused

What it may lack:

- less sense of a large Foxhole-style war
- camp-building is mostly "forward posts," not a full campaign map

Best for:

The first real version.

## Template B: The Road War

The war is a chain of connected battlefield zones along a road, rail line, river, or town approach. Your first camp is the rear camp. To progress, you build forward camps, supply them, and turn them into new launch points.

What the player does:

- starts at the rear camp
- captures or secures a nearby road section
- builds a forward camp
- stocks that camp with ammo, food, medical supplies, and build materials
- uses it as the new base for trench lines and assaults
- repeats the process toward the enemy main camp
- wins when the enemy rear camp or command camp falls

Why this is good:

- feels much more like a war
- makes camp-building meaningful
- creates natural chapters
- lets losses matter without ending everything instantly

What it may lack:

- more scope than the one-town siege
- needs good UI for "where is the front?"
- needs clear rules for when a camp is active, cut off, or lost

Best for:

The product direction after the first town works.

## Template C: The Living Front

The war is a larger living front. Multiple camps, roads, supply lines, trench networks, and assaults exist at once. The player chooses where to spend attention while NPCs continue fighting elsewhere.

What the player does:

- chooses a sector
- builds camps and trench networks
- assigns soldiers and supplies
- reacts to enemy attacks
- opens new fronts
- abandons weak fronts
- reinforces important fronts
- tries to collapse the enemy war network

Why this is good:

- closest to the Foxhole fantasy
- most replayable
- creates large emergent stories
- camps become real strategic anchors

What it may lack:

- too large for the current first playable
- risks becoming a map-management game
- requires strong automation so the player is not forced to babysit everything

Best for:

The long-term dream, not the first shippable version.

## Recommended Product Shape

Start with Template A, but design it so Template B can grow naturally.

That means:

The first town should already have the language of a bigger war:

- rear camp
- forward camp
- trench line
- supply route
- enemy camp
- camp destruction
- camp loss
- camp upgrade
- next push

Do not build the giant living front yet. Build one town where the player can feel the future war.

## The Core Campaign Loop

The loop should be simple enough to say out loud.

### 1. Start A War

The player begins from a camp.

The camp has:

- soldiers
- stored weapons
- ammo
- food
- medical stock
- build material
- basic defenses

The player chooses a first objective:

- hold the current camp
- build a forward trench
- establish a forward camp
- raid for supplies
- attack the enemy line

### 2. Prepare The Push

The player decides what to risk.

They can:

- assign soldiers
- place build orders
- stock ammo
- prepare medical support
- bring better weapons
- build trenches
- stage a forward camp

This should feel like planning a dangerous operation, not filling a spreadsheet.

### 3. Watch The War Execute

NPC soldiers carry out the plan.

They:

- haul supplies
- build positions
- occupy trenches
- shoot
- suppress
- fall back
- rescue wounded
- run out of ammo
- panic
- recover

The officer watches and intervenes only when it matters.

### 4. The Front Moves Or Breaks

After contact, the war state changes.

Possible outcomes:

- the trench line holds
- the forward camp is established
- the enemy loses a position
- your soldiers fall back
- a camp is damaged
- a supply route is cut
- a camp is abandoned
- a camp is destroyed

The map should remember this.

### 5. Bank, Rebuild, Or Escalate

After the action, the player chooses the next move.

They can:

- bank captured supplies
- repair trenches
- upgrade camp defenses
- reinforce the forward camp
- abandon a bad position
- prepare a bigger assault
- personally enter the war for a high-risk push

## Camp Building As Progression

Camps should be the main way the war advances.

A camp is not just a spawn point. A camp is a commitment.

## Camp Types

### Rear Camp

This is the starting base.

It is safer, slower, and stores the protected stash.

Player feeling:

"This is home. Losing it is catastrophic."

### Forward Camp

This is built closer to the fighting.

It lets soldiers launch pushes faster, resupply trenches, and hold new ground.

Player feeling:

"This is how we move the war forward."

### Emergency Camp

This is a rough fallback position.

It is weak, fast, and temporary.

Player feeling:

"We are barely keeping the line alive."

### Siege Camp

This is a late-stage assault camp near the enemy base.

It stores heavy weapons, more ammo, and assault supplies.

Player feeling:

"This is the camp we build when we are ready to end the war."

## Camp Lifecycle

A camp should go through clear states:

- planned
- being built
- active
- supplied
- pressured
- damaged
- cut off
- abandoned
- destroyed

This makes the war readable.

## How A War Starts

The player should press a clear button:

Start Operation.

Before starting, the game shows:

- your camp
- enemy camp
- available soldiers
- available stock
- likely pressure
- first suggested objective

The first operation should not ask the player to solve everything. It should ask one clear question:

"Where do you want the first foothold?"

## How A War Ends

A war should end in one of four ways.

### Victory

The enemy main camp is destroyed or forced to abandon the town.

Player feeling:

"We built the line, paid the cost, and finally broke them."

### Defeat

Your main camp is destroyed or your force can no longer hold the town.

Player feeling:

"The war machine collapsed."

### Withdrawal

The player chooses to abandon the town and save what can be saved.

Player feeling:

"We lost the ground, but some people and supplies made it out."

### Stalemate

Both sides are exhausted. The player can end the operation, bank partial progress, and return later.

Player feeling:

"The town is not won, but the front has changed."

## Three Product Options

If this were a client presentation, these are the three options.

## Option 1: First Town Siege

Build one complete town war.

It has one rear camp, one enemy camp, trenches, forward posts, fallback, and a final camp assault.

Choose this if:

You want the fastest path to a shippable game loop.

Risk:

It may feel smaller than Foxhole at first.

## Option 2: Camp-To-Camp Road War

Build a chain of camps across one long battlefield.

The player wins by establishing forward camps and pushing the launch point closer to the enemy camp.

Choose this if:

You want the first version to already feel like a campaign.

Risk:

It needs more map structure and clearer progression UI.

## Option 3: Living Sector War

Build a larger front with multiple active camps and semi-autonomous NPC fronts.

The player chooses where to intervene.

Choose this if:

You want the full Foxhole-like dream.

Risk:

It is too big unless the automation is excellent.

## My Recommendation

Choose Option 2 as the product target, but ship Option 1 first.

In practice:

The first version is one town siege.

But the town siege should include one forward camp.

That gives us the bridge:

- rear camp is home
- forward camp is progress
- trenches protect the forward camp
- supply routes feed the forward camp
- enemy pressure can damage or cut off the forward camp
- final assault launches from the forward camp

This lets the game feel like a bigger war without needing a giant world map yet.

## The First Shippable Experience

The first shippable experience should be:

1. Start at rear camp.
2. Pick a forward camp location.
3. Soldiers haul build material.
4. Soldiers build the forward camp.
5. Player places trenches around it.
6. Enemy pressure hits the trench line.
7. Soldiers hold or fall back.
8. If the forward camp survives, it becomes the new launch point.
9. Player uses it to attack the enemy camp.
10. War ends when one camp falls.

That is the minimum product-level loop.

## What This Means For Trenches

Trenches are not the whole game.

Trenches are the thing that lets camps survive.

A trench line should answer:

- Can this camp survive the next enemy push?
- Can wounded soldiers fall back?
- Can ammo reach the firing line?
- Can the player buy time for the next assault?

This keeps trench design tied to the bigger war.

## What This Means For Soldiers

Soldiers are not generic units.

They are the reason the war has emotion.

The player should remember:

- who built the forward camp
- who held the first trench
- who fell back too late
- who saved the MG bay
- who died because the officer ordered the line to hold

## The Next Design Question

The next decision is not about upgrade stats.

The next decision is:

Do we want the first forward camp to be:

- A: a small buildable outpost inside the current town
- B: a second full camp that becomes the new base
- C: a temporary assault camp used only for the final push

Recommendation:

Pick A first. Then grow it into B.

