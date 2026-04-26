# Stash Menu Requirements

## 1. Purpose

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

## 2. Core Player Fantasy

The player should feel like they are:

- organizing real physical gear
- optimizing limited space
- preparing for danger
- making tactical loadout decisions
- building a meaningful kit, not just clicking icons

This means the menu is not just storage. It is part of the game loop.

## 3. Main Screen Layout

Use a 3-column layout.

### Left Panel: Character Equipment

Shows player silhouette or paper doll with equipment slots.

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

Shows currently equipped containers with their internal grids.

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

Large persistent storage grid.

Stash behavior:

- fixed-width grid with scroll vertically
- larger than equipped containers
- accepts all legal storable items
- acts as long-term home storage
- can contain nested containers if allowed by design

Optional:

- stash tabs
- category filters
- sorting tools
- search bar
- auto-sort button

## 4. Bottom Bar

Quick access / hotbar.

Numbered slots:

- `1` through `0`
- drag compatible
- assign weapons, meds, tools, throwables, etc.

Bottom navigation buttons:

- Character
- Traders
- Market
- Crafting
- Tasks
- Hideout
- Handbook

These are meta-navigation and should not overwhelm the main inventory function.

## 5. Item Data Model

Every item needs structured properties.

Required item fields:

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
- `Durability` if relevant
- `ContainerCapacity` if item is a container
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
- `Buffs` / `debuffs`
- `FoldedSize`
- `MagazineCapacity`
- `ChamberedAmmo`
- `ModSlots`

## 6. Grid System

This is the heart of the stash menu.

Grid rules:

- inventory spaces are measured in tiles
- every item occupies rectangular space
- items can be rotated if allowed
- placement must check bounds
- placement must check overlap
- placement must check container rules

Example:

- Bandage = `1x1`
- Pistol = `2x2`
- Rifle = `5x2`
- Backpack = `4x5`
- Water bottle = `1x2`

Placement states:

- valid placement highlight
- invalid placement highlight
- ghost preview while dragging

## 7. Interaction Model

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
- within same grid to reorganize
- between weapon slots and hotbar if allowed

## 8. Auto-Move Logic

Important for quality of life.

`Ctrl` click or equivalent:

- move item to best valid destination automatically

Destination priority examples.

From stash:

- equipped compatible slot
- open container
- backpack
- rig
- pockets

From equipment:

- stash
- backpack
- rig

This should feel smart but predictable.

## 9. Container Rules

Containers make the menu deep.

Types of containers:

- Backpack
- Tactical rig
- Secure container
- Ammo box
- Med case
- Weapon case
- Key holder
- Pouch

Container properties:

- grid width/height
- accepted item categories
- nesting allowed true/false
- weight modifier
- quick access allowed or not

Design choice to resolve early.

Realistic route:

- some containers only accept certain items
- nesting restricted
- secure container protected on death
- rigs provide both armor visuals and storage logic

Simplified route:

- all containers behave as generic grids
- fewer special restrictions
- easier to implement

## 10. Equipment Slot Rules

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
- Scabbard -> knife/melee
- Backpack -> backpacks
- Pouch -> secure pouch class only

If an item supports multiple slots, the UI should pick the most sensible default.

## 11. Visual Design Spec

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

## 12. Information Display

Show enough information without drowning the player.

Persistent HUD values in inventory:

- carried weight
- max carry weight
- health summary
- hydration
- energy
- money
- maybe armor status

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

## 13. Sorting and Filtering

Useful but secondary.

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

## 14. Audio / Feedback

This matters a lot.

Sounds:

- soft drag pickup
- placement click
- error buzz for invalid move
- bag unzip for opening container
- metal/plastic/fabric item handling sounds depending on item

Visual feedback:

- valid slot glows
- wrong slot flashes red
- container briefly highlights when item can go there

## 15. Technical Systems Needed

UI systems:

- item widget
- slot widget
- grid container widget
- drag-drop controller
- tooltip controller
- context menu controller

Logic systems:

- item definition database
- inventory instance data
- placement validator
- container hierarchy system
- equipment validation rules
- stack split / merge logic
- quickslot assignment logic
- persistence save/load

## 16. Persistence Requirements

The menu must save:

- stash item positions
- equipped items
- container contents
- rotations
- stack counts
- durability
- weapon states if needed
- assigned quickslots

If you lose exact item placement, the whole system feels bad.

## 17. MVP Version

MVP features:

- left equipment panel
- right stash panel
- backpack + pockets in center
- grid-based items with width/height
- drag and drop
- item rotation
- slot restrictions
- tooltip
- right click equip / inspect / discard
- save/load positions

That alone is enough to feel real.

## 18. Advanced Version

Later additions:

- nested containers
- weapon modding
- folding weapons
- ammo loading/unloading
- magazine inspection
- secure container rules
- insurance-like return systems
- auto-sort
- stash upgrades
- multi-select move
- controller support
- trader buy/sell integration directly inside same item UI language

## 19. Design Risks

Things that break this kind of menu:

- icons too small or unclear
- drag/drop not precise
- too many special case rules too early
- no auto-move shortcuts
- no rotate key
- bad save persistence
- invisible container restrictions
- cluttered fonts and unreadable numbers

## 20. Recommended Build Order

- item data definitions
- generic grid placement logic
- stash grid
- equipment slots
- backpack/rig/pockets containers
- drag/drop + rotate
- tooltip + context menu
- save/load
- quickslots
- sorting/filtering
- sounds and polish
