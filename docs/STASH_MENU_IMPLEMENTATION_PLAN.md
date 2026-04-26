# Stash Menu Implementation Plan

## Source Of Truth

This plan is directly aligned to `STASH_MENU_REQUIREMENTS.md` and the updated stash specs. It replaces the earlier looser planning pass.

## Recommended Build Order

1. item data definitions
2. generic grid placement logic
3. stash grid
4. equipment slots
5. backpack, rig, and pockets containers
6. drag and drop plus rotate
7. tooltip plus context menu
8. save and load
9. quickslots
10. sorting and filtering
11. sounds and polish

## Phase 1: Item Data Definitions

Goal:

- establish the structured item definition model

Deliverables:

- item definition database
- item categories and subcategories
- width and height data
- weight, stack, durability, and value fields
- allowed slot and parent metadata
- optional advanced combat or healing fields where needed

Done when:

- all visible stash items can be represented as structured item definitions

## Phase 2: Generic Grid Placement Logic

Goal:

- centralize grid placement, overlap, bounds, and rotation validation

Deliverables:

- tile-based grid validator
- rectangular footprint support
- rotation support
- container rule hooks
- valid, invalid, and ghost preview states

Done when:

- the stash and container grids no longer depend on bespoke one-off placement rules

## Phase 3: Stash Grid

Goal:

- make the right panel the first true persistent storage surface

Deliverables:

- fixed-width stash grid
- vertical internal scroll
- item placement persistence
- support for all legal storable items

Done when:

- the stash acts as stable long-term storage with exact item positions

## Phase 4: Equipment Slots

Goal:

- replace placeholder planning slots with real equipment slots

Deliverables:

- full left paper-doll equipment panel
- slot validation by item type
- empty and occupied slot states
- drag in and drag out
- right click actions
- hover tooltip support

Required slots:

- Headwear
- Face cover
- Eyewear
- Earpiece
- Armband
- Body armor
- Tactical rig
- Backpack
- Pockets
- Pouch / secure container
- Holster
- On sling weapon
- On back weapon
- Melee / scabbard

Done when:

- the left panel clearly answers what the operator is wearing and carrying

## Phase 5: Backpack, Rig, And Pockets Containers

Goal:

- make the center panel a real inventory puzzle surface

Deliverables:

- Tactical rig grid
- Pockets row
- Backpack grid
- Secure container grid
- persistent internal contents
- blocked placement feedback

Done when:

- the player can move items between worn containers and stash using the same shared rules

## Phase 6: Drag And Drop Plus Rotate

Goal:

- make the whole stash feel tactile and precise

Deliverables:

- drag between stash and slots
- drag between stash and containers
- drag within the same grid
- rotate key support
- reliable hover feedback
- rejected placement messaging

Done when:

- players can reorganize gear entirely through drag flow without brittle behavior

## Phase 7: Tooltip Plus Context Menu

Goal:

- make dense information readable without cluttering the screen

Deliverables:

- hover tooltip with core item data
- right click actions:
- equip
- unequip
- inspect
- use
- unload
- fold
- unfold
- disassemble
- discard
- move to stash
- equip to slot
- assign to quick slot

Done when:

- expert players can work fast and new players can still understand what items do

## Phase 8: Save And Load

Goal:

- preserve exact inventory state

Deliverables:

- save stash positions
- save equipped items
- save container contents
- save rotations
- save stack counts
- save durability
- save weapon states if needed
- save quickslot assignments

Done when:

- no item jumps, resets, or loses its exact placement across sessions

## Phase 9: Quickslots

Goal:

- implement the bottom hotbar as a real inventory surface

Deliverables:

- slots `1` through `0`
- drag assignment
- validation for compatible items
- quickslot persistence

Done when:

- the bottom bar supports active-use loadout prep without distracting from the main stash

## Phase 10: Sorting And Filtering

Goal:

- improve quality of life after the core inventory loop is stable

Minimum:

- search text
- sort by size
- sort by category

Nice to have:

- weapons filter
- ammo filter
- meds filter
- food filter
- gear filter
- barter filter
- hide incompatible items when dragging into a slot

## Phase 11: Sounds And Polish

Goal:

- finish the interaction language

Deliverables:

- soft drag pickup
- placement click
- invalid move buzz
- container open sound
- material-sensitive handling sounds
- valid slot glow
- wrong slot red flash
- container eligibility highlight

Done when:

- the stash feels like a finished game system instead of a prototype utility screen

## MVP Scope

Smallest real version:

- left equipment panel
- right stash panel
- backpack plus pockets in center
- grid-based items with width and height
- drag and drop
- item rotation
- slot restrictions
- tooltip
- right click equip / inspect / discard
- save and load positions

## Advanced Scope

Later additions:

- nested containers
- weapon modding
- folding weapons
- ammo loading and unloading
- magazine inspection
- secure container rules
- insurance-like return systems
- auto-sort
- stash upgrades
- multi-select move
- controller support
- trader buy and sell integration inside the same item UI language

## Risks To Watch

- icons too small or unclear
- drag and drop not precise
- too many special-case rules too early
- missing auto-move shortcuts
- missing rotate key
- weak persistence
- invisible container restrictions
- cluttered fonts or unreadable numbers
