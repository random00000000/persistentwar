# Stash Menu Player Spec

## Purpose

The stash menu is a high-density inventory management screen where the player can:

- equip gear onto their character
- inspect carried containers
- move items between equipment and stash
- manage item size and space
- prepare loadouts before entering gameplay

The menu should feel:

- military
- dense
- grid-based
- high information
- drag-and-drop first

## Core Player Fantasy

The player should feel like they are:

- organizing real physical gear
- optimizing limited space
- preparing for danger
- making tactical loadout decisions
- building a meaningful kit, not just clicking icons

This menu is not just storage. It is part of the game loop.

## Main Screen Layout

Use a 3-column layout.

### Left Panel: Character Equipment

This panel shows the player silhouette or paper doll with equipment slots.

Equipment slots:

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

Each slot should:

- accept only valid item categories
- visually show empty vs occupied state
- support hover tooltip
- support right click actions
- support drag in / drag out

### Center Panel: Open Containers / Equipped Storage

This panel shows currently equipped containers with their internal grids.

Typical blocks:

- Tactical rig grid
- Pockets row
- Backpack grid
- Secure container grid

Each one should:

- display item dimensions in tile units
- allow drag-and-drop rearrangement
- allow items inside to remain persistent
- show blocked placement feedback if item does not fit

This middle panel is where the player actively solves inventory puzzles.

### Right Panel: Stash

This panel is the large persistent storage grid.

Stash behavior:

- fixed-width grid with vertical scroll
- larger than equipped containers
- accepts all legal storable items
- acts as long-term home storage
- can contain nested containers if allowed by design

Optional features:

- stash tabs
- category filters
- sorting tools
- search bar
- auto-sort button

## Bottom Bar

### Quick Access / Hotbar

Numbered slots:

- `1` through `0`
- drag compatible
- assign weapons, meds, tools, throwables, and similar items

### Bottom Navigation Buttons

Optional buttons:

- Character
- Traders
- Market
- Crafting
- Tasks
- Hideout
- Handbook

These are meta-navigation and should not overwhelm the main inventory function.

## Grid System

This is the heart of the stash menu.

Grid rules:

- inventory spaces are measured in tiles
- every item occupies rectangular space
- items can be rotated if allowed
- placement must check bounds
- placement must check overlap
- placement must check container rules

Example item sizes:

- Bandage = `1x1`
- Pistol = `2x2`
- Rifle = `5x2`
- Backpack = `4x5`
- Water bottle = `1x2`

Placement states:

- valid placement highlight
- invalid placement highlight
- ghost preview while dragging

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

- between stash and slots
- between stash and containers
- within the same grid to reorganize
- between weapon slots and hotbar if allowed

## Auto-Move Logic

`Ctrl` click or equivalent should move an item to the best valid destination automatically.

Destination priority examples from stash:

- equipped compatible slot
- open container
- backpack
- rig
- pockets

Destination priority examples from equipment:

- stash
- backpack
- rig

This behavior should feel smart but predictable.

## Container Rules

Container types:

- Backpack
- Tactical rig
- Secure container
- Ammo box
- Med case
- Weapon case
- Key holder
- Pouch

Container properties:

- grid width and height
- accepted item categories
- nesting allowed true or false
- weight modifier
- quick access allowed or not

Early design decision:

- Realistic route: restrictions, protected secure container behavior, rigs as storage plus visual equipment
- Simplified route: generic grids with fewer restrictions and faster implementation

## Equipment Slot Rules

Each slot should validate by item type.

Example mapping:

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

If an item supports multiple slots, the UI should pick the most sensible default.

## Visual Design Spec

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
- hovered tile brighter
- empty slots readable
- occupied slots high contrast

Icons:

- realistic rendered item icons
- strong silhouette readability
- dimensions visually consistent

## Information Display

Persistent HUD values in inventory:

- carried weight
- max carry weight
- health summary
- hydration
- energy
- money
- optionally armor status

Item tooltip should show:

- name
- size
- weight
- category
- durability
- stack amount
- sell value
- short description

Optional advanced tooltip:

- armor class
- recoil modifiers
- ergonomics
- penetration
- healing effect

## Sorting And Filtering

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
- hide incompatible items while dragging into a slot

## Audio And Feedback

Sounds:

- soft drag pickup
- placement click
- error buzz for invalid move
- bag unzip for opening container
- material-specific item handling sounds

Visual feedback:

- valid slot glows
- wrong slot flashes red
- container briefly highlights when an item can go there

## Persistence Requirements

The menu must save:

- stash item positions
- equipped items
- container contents
- rotations
- stack counts
- durability
- weapon states if needed
- assigned quickslots

If exact item placement is lost, the system feels bad immediately.

## MVP Version

Minimum real version:

- left equipment panel
- right stash panel
- backpack and pockets in the center
- grid-based items with width and height
- drag and drop
- item rotation
- slot restrictions
- tooltip
- right click equip / inspect / discard
- save and load positions

## Advanced Version

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
- trader buy and sell integration using the same item UI language

## Design Risks

Things that break this menu type:

- icons too small or unclear
- drag and drop not precise
- too many special case rules too early
- no auto-move shortcuts
- no rotate key
- bad save persistence
- invisible container restrictions
- cluttered fonts and unreadable numbers
