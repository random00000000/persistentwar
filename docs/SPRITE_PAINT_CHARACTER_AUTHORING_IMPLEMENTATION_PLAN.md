# Sprite Paint Character Authoring Implementation Plan

## Scope

This plan is for the decoupled `Sprite Paint Lab` front-door experiment, not the live raid runtime.

The goal is to make the lab behave more like a real human sprite-authoring workflow:

- keep the source animation intact
- paint modifications on reusable layers
- move frame to frame without losing authoring continuity
- save work in an editable project format
- load it later and keep working
- export modified characters so they can be reused in the actual game

## Human Workflow Reference

This plan is based on how pixel artists commonly work in tools like Aseprite and Piskel:

- keep a master working file that preserves layers and frames
- use the timeline as the source of truth for animation edits
- reuse linked or repeated cel content where a change should persist across frames
- export a separate game-ready output instead of treating the working file as the shipped asset

Relevant references:

- [Aseprite Docs: Basics](https://www.aseprite.org/docs/basics/)
- [Aseprite Docs: Timeline](https://www.aseprite.org/docs/timeline/)
- [Aseprite Docs: Linked Cels](https://www.aseprite.org/docs/linked-cels/)
- [Aseprite Docs: Save](https://www.aseprite.org/docs/save)
- [Aseprite Docs: Exporting](https://www.aseprite.org/docs/exporting)
- [Aseprite Docs: Sprite Sheet](https://aseprite.com/docs/sprite-sheet/)

## Product Intent

When this is done, the `Sprite Paint Lab` should feel like a lightweight in-game character workshop:

- choose a base imported character set
- paint an armband and other texture edits across animated frames
- decide whether an edit is shared across frames or only local to the current frame
- save the character as a reusable editable project
- load it later and continue
- export a runtime-ready character variant that can be consumed by the game

## Milestone 1. Authoring Project Backbone

Deliver one explicit editable project model for the lab.

Implementation pass:

- add a `SpritePaintProject` runtime model with:
  - project id
  - label
  - base animation set reference
  - per-layer data
  - per-frame overrides
  - metadata for armband faction/team read
- stop treating the current lab state as anonymous temporary UI state
- introduce named authoring layers such as:
  - `clone-detail`
  - `armband`
  - `markings`
- keep all edits non-destructive and separate from imported source frames

Done when:

- the lab operates on a named project object
- the source sprite remains untouched
- editing state is serializable in principle even if save/load is not finished yet

## Milestone 2. Timeline-Aware Paint Workflow

Make frame stepping behave like real animation authoring instead of a frame viewer.

Implementation pass:

- add explicit `current frame` and `current layer` authoring focus
- make `Prev` and `Next` preserve:
  - selected tool
  - selected layer
  - brush size
  - paint color
- add a frame edit mode split:
  - `shared across frames`
  - `current frame only`
- make armband workflow default to a shared timeline-safe layer so artists can paint faction identity without repainting every frame manually
- show a visible read for whether the current edit is:
  - shared
  - frame-local

Done when:

- going to the next frame still leaves the lab ready to keep painting immediately
- shared edits persist across animation playback
- frame-local edits only affect the intended frame

## Milestone 3. Save And Load Editable Projects

Turn the lab into a reusable workshop, not a one-session toy.

Implementation pass:

- add `Save Project` and `Load Project` buttons
- store editable projects in a local project folder inside this repo
- choose one stable file format, likely JSON plus image payload files
- save:
  - project metadata
  - active animation set
  - shared layer content
  - frame-local layer content
  - team/faction annotation data
- load a saved project back into the exact lab state

Done when:

- a painted character can be saved with one button
- that same character can be loaded later
- the loaded project is still editable, not flattened

## Milestone 4. Character Variant Library

Make saved work accessible later without hand-managing files.

Implementation pass:

- add a saved-character browser inside the lab
- show:
  - project name
  - source base set
  - last modified time
  - small animated preview
  - team/armband color
- add actions:
  - `Load`
  - `Duplicate`
  - `Rename`
  - `Delete`
- make duplication create a new editable branch from an existing character variant

Done when:

- previously saved variants are easy to find and reopen
- one finished variant can become the starting point for enemy sub-factions or role variants

## Milestone 5. Export Runtime-Ready Character Bundles

Separate editable authoring projects from shipped game assets.

Implementation pass:

- add `Export Variant`
- render composited frames out to a runtime-ready bundle:
  - PNG frames or sheet
  - metadata manifest
  - stable variant id
- include enough metadata for later game use:
  - variant id
  - label
  - source base set
  - team/faction color
  - animation set names
  - frame count
- keep export independent from the editable save format

Done when:

- one button produces a reusable character asset bundle
- exported output is distinct from the editable project file

## Milestone 6. Game Reuse And Integration Handoff

Close the loop so the lab can actually feed the game later.

Implementation pass:

- add a simple in-app integration preview that loads exported variants back into a runtime preview list
- verify that exported variants can be:
  - browsed
  - selected
  - previewed in idle and move
- define the contract for live-game consumption:
  - folder layout
  - manifest fields
  - variant naming rules
- optionally add a lightweight `Promote To Game Candidate` flag so a good lab output is easy to find later

Done when:

- exported character bundles are no longer dead files
- there is one clear pipeline from painted lab asset to future in-game enemy unit

## Constraints

- keep this work scoped to the decoupled `Sprite Paint Lab` unless a later directive explicitly promotes it
- do not overwrite the imported base survivor frames
- preserve animation playback while editing
- default to faction/armband use cases first, because that is the immediate need for enemy-unit production
- prefer a workflow that matches human sprite-authoring expectations over clever custom behavior

## Recommended Build Order

1. `Milestone 1`: authoring project backbone
2. `Milestone 2`: timeline-aware paint workflow
3. `Milestone 3`: save/load editable projects
4. `Milestone 4`: character variant library
5. `Milestone 5`: export runtime-ready bundles
6. `Milestone 6`: integration handoff

## Success Bar

The experiment is successful when:

- you can paint an armband and texture edits across an animated character
- next/previous frame still feels ready for continued work
- you can save the project, close the lab, reopen it, and continue
- you can export a modified character and reuse it later instead of repainting from scratch
