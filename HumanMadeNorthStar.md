Frontline Officer game North Star

This game should be like a combination of Rimworld and Foxhole


The current implementation works with the player using the Russians at the right side and the Enemy uses the Ukranians at the left side.


Currently the character controller used by the player is good and deep, the player can command units to shoot and delegate actions but this depth is limited to a specific type of AI and is not yet integrated with the rimowrld like NPC's.


This creates unexpected beahvior, when the player places a trench it expect the soldiers in it to shoot but those soldiers at the time of this writing were not wired to shoot projectiles making the game unplayable.

In the future the rimowrld like AI should shoot from trenches and be able to do the deep combat from the commanded AI.

One other big hurdle is that in game deveolment we are supposed to do everything reusable so things like this does not happen, In the future the two npc' trypes will need to be consolidated in a way we don't loose what already works.

The Dream: The dream is to have one NPC type that can do all, fight for me when I need it, build trenches and anything rimworld like. 

We alos must take into cnsideration that regression took out the emergent story telling of the russian side so we must try to ship the game before everything collapses to regression.


The trenches and build system is in need of being designed so that should be a matter of making simple sistemic rules thatwill make trenches behave well for everyone.

One big risk we face is that the enemy and my AI should be exactly the same if we make it reusable so it seems like we are not fully reusable yet. In games like conquerors blade and RImworld all AI is reusable so units are made of the same stuff and everything works fine, in our case it seems like everything is different so extending existing features to the ukranian side could be risky.


What is the fix? We need to move into doing reusable code and making both sides of the fight leverage the exact same code so we do't have unexpected behavior.