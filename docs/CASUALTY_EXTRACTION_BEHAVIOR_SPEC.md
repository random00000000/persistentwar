# Casualty Extraction Behavior Spec

## Purpose

Make the boys extract Blue like a real player would once rescue turns into escape.

This system starts after local casualty handling. Its job is not to stabilize Blue. Its job is to get him out.

## Product Promise

When Blue is too hurt to self-extract, the boys should stop behaving like idle followers or body-interaction bots and start behaving like a casualty extraction team.

## Fantasy Layer

The squad is no longer clearing for loot. They are trying to bring Blue home.

The player story should sound like:

- "They stopped fighting like an assault wedge and turned into an extraction team."
- "One boy had me, the other screened the lane."
- "They actually tried to get me out, not just circle around me."

## Gameplay Layer

Once Blue enters a carry or assist state, the squad should:

- commit to an exfil route
- move with casualty-aware pathing
- assign one boy to movement and another to screening when possible
- reduce greed and stop re-entering bad pockets
- enter the normal extraction ring flow once they reach exfil

This should feel like a wounded run for the exit, not like a paused fight.

## Core Separation

This system must be separate from local rescue.

### Rescue System

- detect casualty
- stabilize
- get Blue upright or into a carry state

### Casualty Extraction System

- choose destination
- choose route
- choose squad roles during movement
- manage stop-and-fight thresholds
- enter exfil ring behavior

If these are merged, the squad gets stuck trying to "finish rescue" forever.

## Behavior Rules

### Trigger

Enter `casualty extract mode` when:

- Blue has been stabilized and is now `assisted-walk` or `carry`
- or Blue is dead and the boys commit to body recovery extraction

### Destination Choice

Priority:

1. currently focused exfil if still viable
2. nearest viable exfil with lowest local threat
3. fallback exfil if the original route is too hot

The squad should not choose purely by shortest distance.

### Movement Doctrine

- carrier stays committed to movement
- screener stays between threat and carrier when possible
- squad tries to avoid fresh loot detours
- squad deprioritizes offensive pushes unless blocked
- squad uses the same route logic a cautious player would use: shorter safe path beats longer greedy path

### Stop-And-Fight Threshold

The squad may briefly stop or peel only if:

- the path is blocked
- the carrier is about to be collapsed on
- a nearby hostile must be suppressed to reopen movement

Otherwise the default answer is: keep moving.

### Handoff To Exfil

Once the casualty team reaches the extraction zone:

- the existing extraction hold logic should take over
- casualty extract mode should not keep fighting for movement ownership
- if Blue is conscious, his reduced command state should remain until the extract resolves or he is set down

## Squad Role Split

Preferred split:

- `carrier / assister`
- `screen / suppress`

If only one boy remains:

- he carries or assists Blue and prioritizes movement over fighting

If Blue is dead:

- body carry should still use simplified exfil behavior, but with no Blue combat agency

## Readability

The player should know the squad has transitioned into extraction logic.

Required signals:

- banner or callout: `EXFIL COMMITTED`
- squad tags like `CARRY`, `ASSIST`, `SCREEN`
- exfil HUD note that casualty extract mode is live
- short barks like `I got him`, `screen the gate`, `move move move`

## Success Criteria

- the boys do not get stuck oscillating around Blue after rescue begins
- the boys choose and follow a real exfil path
- one boy can move Blue while another covers when available
- the squad transitions cleanly into the extraction ring instead of conflicting with rescue logic

## Main Risks

- If the mode is too aggressive, the squad suicides into the nearest exit.
- If the mode is too cautious, the squad stalls and dies slowly.
- If role ownership is unclear, the boys bunch up and path badly.
- If rescue and extraction share one state machine, stuck behavior returns.
