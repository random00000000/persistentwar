# Frontline Colony Sim Gameplay Impact Report

## Summary

The new north star shifts `Frontline Officer` from "place a trench and watch AI use it" toward "manage a living frontline camp whose named soldiers build, supply, heal, and defend the trench line." The player still plays as the Russian-side camp (`camp-a`) on the right for now, while `camp-b` is the Ukrainian enemy camp on the left. The gameplay focus is no longer only construction placement. It is the chain between camp priorities, individual soldier skills, battlefield work, and the final fight result.

## What Changes In The Player Loop

Before this north star, building could feel like a separate tactical tool: place trench, wait for construction, see whether soldiers occupy it. The new loop makes building part of a colony-sim system:

1. The player opens officer tools and reads camp condition.
2. The player adjusts camp work and soldier priorities.
3. Named soldiers choose work based on skills, needs, priorities, and battlefield pressure.
4. Those soldiers build, suppress, haul, rescue, or occupy.
5. The debrief explains the outcome through named actions and consequences.

The result should feel less like an RTS command queue and more like a frontline management sim where people, supplies, exhaustion, and terrain all matter.

## Gameplay Advantages

The biggest improvement is causality. A trench is not just "good cover." It becomes good because Nika built it, Yara covered the dig, Lev occupied it, camp readiness kept the work moving, and the trench faced the enemy correctly. If the line fails, the game can point to specific causes: no ammo runner, tired builder, exposed medic, poor facing, bad camp sustainment, or nobody occupying the bay.

This also gives the player more meaningful mastery. The player learns not only where to place trenches, but how to prepare the camp before placing them. Good play becomes: raise resupply before a push, protect medics from routine assault work, keep builders rested, put suppressors on cover duty, and place trenches where defenders will actually survive.

## Current Runtime Impact

Milestone 1 makes the camp readable as a work site: readiness, food, build supply, med load, ammo need, fatigue, hunger, and active jobs are surfaced in officer tools.

Milestone 2 makes the war more personal: named soldiers now generate frontline stories for build, cover, resupply, medic, and occupation actions. The priorities panel shows who each soldier is and what they are doing. The debrief now explains trench outcomes through named soldier actions, and soldiers carry consequences like fatigue or trench-hold memory.

## Remaining Gameplay Gap

The system is now more explainable, but the player still needs stronger moment-to-moment feedback that priorities changed behavior before the battle is over. The next gameplay gains should come from clearer pre-order recommendations, fewer repeated map labels during crowded fights, and stronger failure stories when camp preparation is bad.

The north star is working when the player says: "I prepared my camp, changed named soldiers' priorities, watched them build and hold the line, and understood exactly why the trench held or failed."
