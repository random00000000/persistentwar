# Stash Menu Implementation Spec

## Goal

Implement the stash menu directly against the required three-column inventory surface:

- left panel for character equipment
- center panel for equipped storage and open containers
- right panel for persistent stash

The implementation should prioritize:

- item data definitions
- generic grid placement logic
- stash grid
- equipment slots
- backpack, rig, and pockets containers
- drag and drop plus rotate
- tooltip plus context menu
- save and load
- quickslots
- sorting and filtering
- sounds and polish

## Required Data Model

Every item needs structured properties.

Required fields:

- `ItemID`
- `DisplayName`
- `Icon`
- `Category`
- `Subcategory`
- `Width`
- `Height`
- `Weight`
- `Stackable`
- `MaxStack`
- `CurrentStack`
- `Durability` when relevant
- `ContainerCapacity` when the item is a container
- `AllowedSlots`
- `AllowedParents`
- `RotationAllowed`
- `Value`
- `Rarity` optional
- `Description`
- `Tags`

Optional advanced fields:

- `AmmoType`
- `WeaponClass`
- `ArmorClass`
- `ProtectionZones`
- `HealingValue`
- `BleedStopValue`
- `HydrationChange`
- `EnergyChange`
- `Buffs`
- `debuffs`
- `FoldedSize`
- `MagazineCapacity`
- `ChamberedAmmo`
- `ModSlots`

## Inventory Model

The codebase should move to a unified inventory model with:

- item definitions
- item instances
- grid surfaces
- equipment slot surfaces
- container hierarchy
- quickslot assignments

Implementation rule:

- visible items in stash, worn slots, and equipped containers must all be backed by the same placement and validation model

## Grid System

This is the core technical system.

Grid rules:

- inventory space is measured in tiles
- every item uses a rectangular footprint
- items rotate only if `RotationAllowed`
- placement checks bounds
- placement checks overlap
- placement checks container rules

Reference sizes:

- Bandage = `1x1`
- Pistol = `2x2`
- Rifle = `5x2`
- Backpack = `4x5`
- Water bottle = `1x2`

Required placement states:

- valid placement highlight
- invalid placement highlight
- ghost preview while dragging

## Layout Structure

### Left Panel: Character Equipment

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

Each slot must:

- accept only valid item categories
- show empty versus occupied state
- support hover tooltip
- support right click actions
- support drag in and drag out

### Center Panel: Open Containers / Equipped Storage

Required surfaces:

- Tactical rig grid
- Pockets row
- Backpack grid
- Secure container grid

Each surface must:

- display item dimensions in tile units
- allow rearrangement
- persist internal contents
- show blocked placement feedback

### Right Panel: Stash

Required stash behavior:

- fixed-width grid
- vertical internal scroll
- larger than equipped containers
- accepts all legal storable items
- acts as long-term storage
- supports nested containers only if allowed by chosen rule set

Optional systems:

- stash tabs
- category filters
- sorting tools
- search bar
- auto-sort button

## Interaction Model

Left click:

- pick up item
- place item
- select item

Right click context menu:

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

Double click:

- auto-equip if obvious
- open container if applicable

Drag and drop:

- stash to slot
- slot to stash
- stash to container
- container to stash
- within the same grid
- weapon slot to hotbar if allowed

## Auto-Move Logic

`Ctrl` click or equivalent should move an item to the best valid destination.

From stash priority:

- equipped compatible slot
- open container
- backpack
- rig
- pockets

From equipment priority:

- stash
- backpack
- rig

This logic should be deterministic and readable to the player.

## Container Rules

Supported container types:

- Backpack
- Tactical rig
- Secure container
- Ammo box
- Med case
- Weapon case
- Key holder
- Pouch

Each container needs:

- grid width and height
- accepted categories
- nesting flag
- weight modifier
- quick access flag

Implementation decision to lock:

- `Simplified` first for MVP: mostly generic grids with selective restrictions only where required by slot rules
- `Realistic` later if we deepen secure-container rules, restricted nesting, and specialized rigs

## Equipment Slot Rules

Minimum validation mapping:

- Headwear -> helmets, hats
- Face cover -> masks
- Eyewear -> glasses, goggles
- Earpiece -> headset
- Body armor -> armor vests
- Tactical rig -> chest rigs
- Holster -> pistols only
- On sling -> primary weapons
- On back -> primary weapons
- Scabbard -> knife or melee
- Backpack -> backpacks
- Pouch -> secure pouch class only

If an item supports multiple slots, the code should choose the most sensible default slot.

## UI Systems Needed

- item widget
- slot widget
- grid container widget
- drag-drop controller
- tooltip controller
- context menu controller

## Logic Systems Needed

- item definition database
- inventory instance data
- placement validator
- container hierarchy system
- equipment validation rules
- stack split and merge logic
- quickslot assignment logic
- persistence save and load

## Bottom Bar

Required quick access bar:

- numbered slots `1` through `0`
- drag compatible
- accepts weapons, meds, tools, throwables, and other supported active-use items

Bottom navigation buttons may include:

- Character
- Traders
- Market
- Crafting
- Tasks
- Hideout
- Handbook

These should remain secondary to inventory operations.

## Information Display

Persistent values in the stash menu:

- carried weight
- max carry weight
- health summary
- hydration
- energy
- money
- optional armor status

Tooltip minimum:

- name
- size
- weight
- category
- durability
- stack amount
- sell value
- short description

## Visual Direction

Tone:

- dark background
- muted colors
- small bright highlights
- clean military typography
- subtle glass or brushed metal feeling
- not cartoonish

Panels:

- semi-transparent dark surfaces
- thin borders
- slight gradient or worn texture
- consistent spacing

Grids:

- visible but subtle tile borders
- hovered tiles brighter
- empty slots readable
- occupied slots high contrast

Icons:

- realistic rendered item icons
- strong silhouette readability
- consistent dimensions

## Persistence Requirements

The system must save:

- stash item positions
- equipped items
- container contents
- rotations
- stack counts
- durability
- weapon states if needed
- assigned quickslots

Exact placement persistence is mandatory.
