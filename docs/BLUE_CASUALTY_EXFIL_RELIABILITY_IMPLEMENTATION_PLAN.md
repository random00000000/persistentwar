# Blue Casualty Exfil Reliability Implementation Plan

## Goal

Make squad-led extraction of Blue reliable enough that:

- the boys can truly extract downed Blue
- the boys can keep trying after Blue dies
- the attempt only ends when the squad succeeds or is genuinely broken

## Milestone 1: Extraction Ownership Helpers

Add the generic helper layer in simulation:

- extract lookup by arbitrary point
- casualty exfil task detection
- extraction anchor resolution
- living-squad availability checks

Acceptance:

- extraction ownership no longer assumes Blue's own feet are the only anchor

## Milestone 2: Bleedout To Body Exfil Transition

Replace the instant Blue bleedout hard-fail with a proper transition:

- `downed -> dead`
- preserve or continue the extraction attempt if any squadmate is still alive
- keep failure only for true squad collapse

Acceptance:

- Blue can die without the raid instantly ending if the boys are still in the lane

## Milestone 3: Rescue AI Reliability

Expand auto rescue so the boys can reacquire Blue generically:

- dead player becomes a `carry` rescue target
- attack posture can be overridden by player-casualty emergency
- if the current carrier dies, another living boy can still try

Acceptance:

- body extraction attempts can continue across carrier losses

## Milestone 4: Hold Progress And Outcome Text

Wire the new ownership into extraction outcome:

- extraction hold progresses from the carrier anchor during casualty exfil
- success reasons distinguish alive / downed / dead extraction
- failure reasons distinguish no-rescuer collapse

Acceptance:

- the result screen no longer lies about how Blue got out

## Milestone 5: Agent Surface And Verification

Expose the feature clearly:

- `raid.casualtyExtractMode`
- `raid.casualtyExtractOwner`
- `blue-body-extract` showcase
- `blue-body-extract` verify path

Acceptance:

- future agents can inspect and verify the feature without rereading simulation internals

## Milestone 6: Opening Fight Casualty Bias

Bias the first serious raid beats toward rescue stories instead of abrupt deletion:

- add opening-engagement damage leniency for Blue and squadmates
- add low-health down thresholds for Blue, squadmates, and enemies
- keep the helper layer generic so later dialogue, HUD, and story systems can query the same states

Acceptance:

- the first bad trade is more likely to produce `wounded/downed/extract` drama than an instant collapse

## Milestone 7: Casualty Ring Forgiveness

Polish the extraction finish so committed carriers complete more reliably:

- allow casualty extraction checks to use a small ring-forgiveness buffer
- slow hold slip slightly while a casualty carrier is trying to stay inside the ring

Acceptance:

- the boys stop dropping committed casualty pulls because of tiny edge misses at extraction

## Required Checks

- `npm run build`
- `npm run game:cli -- verify --id blue-carried-fire`
- `npm run game:cli -- verify --id blue-body-extract`

## Main Risks

- extraction may still count the wrong anchor if rescue ownership falls out of sync
- dead-body carry could accidentally keep rescue-fire enabled
- emergency rescue priority could become too strong and make boys ignore reasonable combat pressure
- opening-engagement leniency could become so strong that raids lose bite if the scaling is overtuned
- result text could stay misleading if success/failure messaging is not updated with casualty context
