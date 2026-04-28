export type InventoryItemCategory =
  | "weapon"
  | "ammo"
  | "medical"
  | "gear"
  | "container"
  | "intel"
  | "provisions"
  | "barter"
  | "tool";

export type InventoryItemSubcategory =
  | "knife"
  | "rifle"
  | "smg"
  | "shotgun"
  | "pkm"
  | "amr"
  | "rpg"
  | "pistol"
  | "magazine"
  | "medical"
  | "hardware"
  | "documents"
  | "toolkit"
  | "relay"
  | "beacon"
  | "armor"
  | "rig"
  | "backpack"
  | "pouch"
  | "headwear"
  | "rations"
  | "dogtags"
  | "container"
  | "cash"
  | "generic";

export type EquipmentSlotId =
  | "headwear"
  | "face-cover"
  | "eyewear"
  | "earpiece"
  | "armband"
  | "body-armor"
  | "tactical-rig"
  | "backpack"
  | "pockets"
  | "pouch"
  | "holster"
  | "on-sling"
  | "on-back"
  | "melee";

export interface InventoryItemDefinition {
  itemId: string;
  displayName: string;
  category: InventoryItemCategory;
  subcategory: InventoryItemSubcategory;
  width: number;
  height: number;
  weight: number;
  stackable: boolean;
  maxStack: number;
  containerCapacity?: { width: number; height: number };
  allowedSlots: EquipmentSlotId[];
  allowedParents: string[];
  rotationAllowed: boolean;
  value: number;
  description: string;
  tags: string[];
}

export interface GridSurfaceDefinition {
  id: string;
  width: number;
  height: number;
}

export interface GridPlacement {
  columnStart: number;
  rowStart: number;
  rotated: boolean;
}

export interface GridOccupant {
  id: string;
  width: number;
  height: number;
  placement: GridPlacement;
}

export type GridPlacementFailureReason = "out-of-bounds" | "overlap";

export type GridPlacementValidation =
  | { ok: true }
  | { ok: false; reason: GridPlacementFailureReason; blockedByIds: string[] };

const INVENTORY_ITEM_DEFINITIONS: Record<string, InventoryItemDefinition> = {
  "weapon-knife": {
    itemId: "weapon-knife",
    displayName: "Field Knife",
    category: "weapon",
    subcategory: "knife",
    width: 1,
    height: 3,
    weight: 0.4,
    stackable: false,
    maxStack: 1,
    allowedSlots: ["on-sling", "melee"],
    allowedParents: ["stash", "backpack", "tactical-rig", "pouch"],
    rotationAllowed: true,
    value: 70,
    description: "A fixed blade that can be staged as a primary desperation weapon or worn as a close-contact backup.",
    tags: ["primary", "melee", "silent", "operator"]
  },
  "weapon-pistol": {
    itemId: "weapon-pistol",
    displayName: "Civic-9 Sidearm",
    category: "weapon",
    subcategory: "pistol",
    width: 2,
    height: 2,
    weight: 1.2,
    stackable: false,
    maxStack: 1,
    allowedSlots: ["holster"],
    allowedParents: ["stash", "backpack", "tactical-rig"],
    rotationAllowed: false,
    value: 160,
    description: "Compact secondary weapon for last-ditch fights.",
    tags: ["secondary", "sidearm"]
  },
  "weapon-worn-ak": {
    itemId: "weapon-worn-ak",
    displayName: "Worn AK",
    category: "weapon",
    subcategory: "rifle",
    width: 5,
    height: 2,
    weight: 4.4,
    stackable: false,
    maxStack: 1,
    allowedSlots: ["on-sling", "on-back"],
    allowedParents: ["stash", "backpack", "tactical-rig"],
    rotationAllowed: true,
    value: 165,
    description: "A rough starter AK that belongs in the stash wall as the cheap first long gun, not the rifle you brag about.",
    tags: ["primary", "starter", "rough", "operator"]
  },
  "weapon-rifle": {
    itemId: "weapon-rifle",
    displayName: "VKR Rifle",
    category: "weapon",
    subcategory: "rifle",
    width: 5,
    height: 2,
    weight: 4.2,
    stackable: false,
    maxStack: 1,
    allowedSlots: ["on-sling", "on-back"],
    allowedParents: ["stash", "backpack", "tactical-rig"],
    rotationAllowed: true,
    value: 480,
    description: "Long rifle platform for controlled route work.",
    tags: ["primary", "long-gun", "operator"]
  },
  "weapon-short-mosin": {
    itemId: "weapon-short-mosin",
    displayName: "Cut-Down Mosin",
    category: "weapon",
    subcategory: "rifle",
    width: 5,
    height: 2,
    weight: 4.9,
    stackable: false,
    maxStack: 1,
    allowedSlots: ["on-sling", "on-back"],
    allowedParents: ["stash", "backpack", "tactical-rig"],
    rotationAllowed: true,
    value: 240,
    description: "A crude surplus bolt rifle in bad shape. Hard to run, hard to trust, but it still hits if you earn the shot.",
    tags: ["primary", "bolt-gun", "junk", "operator"]
  },
  "weapon-smg": {
    itemId: "weapon-smg",
    displayName: "Room-Clear SMG",
    category: "weapon",
    subcategory: "smg",
    width: 4,
    height: 2,
    weight: 3.1,
    stackable: false,
    maxStack: 1,
    allowedSlots: ["on-sling", "on-back"],
    allowedParents: ["stash", "backpack", "tactical-rig"],
    rotationAllowed: true,
    value: 410,
    description: "Compact automatic platform for close pushes.",
    tags: ["primary", "compact", "operator"]
  },
  "weapon-shotgun": {
    itemId: "weapon-shotgun",
    displayName: "Breaching Shotgun",
    category: "weapon",
    subcategory: "shotgun",
    width: 5,
    height: 2,
    weight: 4.8,
    stackable: false,
    maxStack: 1,
    allowedSlots: ["on-sling", "on-back"],
    allowedParents: ["stash", "backpack"],
    rotationAllowed: true,
    value: 390,
    description: "Heavy breach platform for brutal short-range holds.",
    tags: ["primary", "breach", "operator"]
  },
  "weapon-pkm": {
    itemId: "weapon-pkm",
    displayName: "PKM Support Gun",
    category: "weapon",
    subcategory: "pkm",
    width: 6,
    height: 2,
    weight: 8.8,
    stackable: false,
    maxStack: 1,
    allowedSlots: ["on-sling", "on-back"],
    allowedParents: ["stash", "backpack"],
    rotationAllowed: true,
    value: 620,
    description: "Belt-fed support gun for long-lane pressure and crossing control.",
    tags: ["primary", "support-gun", "operator"]
  },
  "weapon-amr": {
    itemId: "weapon-amr",
    displayName: "Bastion AMR",
    category: "weapon",
    subcategory: "amr",
    width: 6,
    height: 2,
    weight: 9.6,
    stackable: false,
    maxStack: 1,
    allowedSlots: ["on-sling", "on-back"],
    allowedParents: ["stash", "backpack"],
    rotationAllowed: true,
    value: 880,
    description: "Heavy anti-materiel rifle for late-war lane dominance and plated kills.",
    tags: ["primary", "endgame", "precision", "operator"]
  },
  "weapon-rpg": {
    itemId: "weapon-rpg",
    displayName: "RPG-7 Launcher",
    category: "weapon",
    subcategory: "rpg",
    width: 6,
    height: 1,
    weight: 7.8,
    stackable: false,
    maxStack: 1,
    allowedSlots: ["on-sling", "on-back"],
    allowedParents: ["stash", "backpack"],
    rotationAllowed: true,
    value: 980,
    description: "Earned siege launcher for cracking bunker mouths, camp anchors, and packed trench lines.",
    tags: ["primary", "endgame", "siege", "rocket", "operator"]
  },
  "item-pistol": {
    itemId: "item-pistol",
    displayName: "Sidearm",
    category: "weapon",
    subcategory: "pistol",
    width: 2,
    height: 2,
    weight: 1.2,
    stackable: false,
    maxStack: 1,
    allowedSlots: ["holster"],
    allowedParents: ["stash", "backpack", "tactical-rig"],
    rotationAllowed: false,
    value: 160,
    description: "Compact secondary weapon for last-ditch fights.",
    tags: ["secondary", "sidearm"]
  },
  "item-armor": {
    itemId: "item-armor",
    displayName: "Armor Carrier",
    category: "gear",
    subcategory: "armor",
    width: 2,
    height: 3,
    weight: 6.3,
    stackable: false,
    maxStack: 1,
    allowedSlots: ["body-armor"],
    allowedParents: ["stash"],
    rotationAllowed: true,
    value: 520,
    description: "Carrier with hard plates for live inserts.",
    tags: ["armor", "worn"]
  },
  "item-rig": {
    itemId: "item-rig",
    displayName: "Chest Rig",
    category: "gear",
    subcategory: "rig",
    width: 3,
    height: 3,
    weight: 2.6,
    stackable: false,
    maxStack: 1,
    containerCapacity: { width: 4, height: 4 },
    allowedSlots: ["tactical-rig"],
    allowedParents: ["stash"],
    rotationAllowed: false,
    value: 280,
    description: "Load-bearing rig with direct-access storage.",
    tags: ["rig", "worn", "container"]
  },
  "item-backpack": {
    itemId: "item-backpack",
    displayName: "Raid Backpack",
    category: "gear",
    subcategory: "backpack",
    width: 4,
    height: 5,
    weight: 2.9,
    stackable: false,
    maxStack: 1,
    containerCapacity: { width: 5, height: 6 },
    allowedSlots: ["backpack"],
    allowedParents: ["stash"],
    rotationAllowed: false,
    value: 340,
    description: "Field pack for long-route carry capacity.",
    tags: ["backpack", "container", "worn"]
  },
  "item-pouch": {
    itemId: "item-pouch",
    displayName: "Secure Pouch",
    category: "gear",
    subcategory: "pouch",
    width: 2,
    height: 2,
    weight: 0.6,
    stackable: false,
    maxStack: 1,
    containerCapacity: { width: 2, height: 2 },
    allowedSlots: ["pouch"],
    allowedParents: ["stash"],
    rotationAllowed: false,
    value: 250,
    description: "Compact secure container for critical items.",
    tags: ["pouch", "container", "worn"]
  },
  "item-headwear": {
    itemId: "item-headwear",
    displayName: "Ballistic Helmet",
    category: "gear",
    subcategory: "headwear",
    width: 2,
    height: 2,
    weight: 1.7,
    stackable: false,
    maxStack: 1,
    allowedSlots: ["headwear"],
    allowedParents: ["stash"],
    rotationAllowed: false,
    value: 210,
    description: "Protective helmet for direct contact lanes.",
    tags: ["helmet", "worn"]
  },
  "item-medcase": {
    itemId: "item-medcase",
    displayName: "Field Med Case",
    category: "container",
    subcategory: "container",
    width: 2,
    height: 2,
    weight: 1.6,
    stackable: false,
    maxStack: 1,
    containerCapacity: { width: 3, height: 3 },
    allowedSlots: [],
    allowedParents: ["stash", "backpack"],
    rotationAllowed: false,
    value: 220,
    description: "Compact medical case for treatment supplies.",
    tags: ["container", "medical"]
  },
  "item-medical": {
    itemId: "item-medical",
    displayName: "Medical Crate",
    category: "medical",
    subcategory: "medical",
    width: 2,
    height: 2,
    weight: 1.1,
    stackable: false,
    maxStack: 1,
    allowedSlots: [],
    allowedParents: ["stash", "backpack", "tactical-rig"],
    rotationAllowed: false,
    value: 140,
    description: "Packed treatment bundle for sustained operations.",
    tags: ["medical", "loot"]
  },
  "item-munitions": {
    itemId: "item-munitions",
    displayName: "Munitions Pack",
    category: "ammo",
    subcategory: "magazine",
    width: 2,
    height: 2,
    weight: 1.5,
    stackable: false,
    maxStack: 1,
    allowedSlots: [],
    allowedParents: ["stash", "backpack", "tactical-rig"],
    rotationAllowed: false,
    value: 150,
    description: "Ammo reserve bundle for hot route pushes.",
    tags: ["ammo", "loot"]
  },
  "item-hardware": {
    itemId: "item-hardware",
    displayName: "Hardware Crate",
    category: "barter",
    subcategory: "hardware",
    width: 2,
    height: 2,
    weight: 2.2,
    stackable: false,
    maxStack: 1,
    allowedSlots: [],
    allowedParents: ["stash", "backpack"],
    rotationAllowed: false,
    value: 170,
    description: "Broker-grade salvage for high-value trade lanes.",
    tags: ["barter", "loot"]
  },
  "item-toolkit": {
    itemId: "item-toolkit",
    displayName: "Toolkit",
    category: "tool",
    subcategory: "toolkit",
    width: 2,
    height: 1,
    weight: 1.8,
    stackable: false,
    maxStack: 1,
    allowedSlots: [],
    allowedParents: ["stash", "backpack"],
    rotationAllowed: true,
    value: 110,
    description: "Compact breach and salvage tool roll.",
    tags: ["tool", "utility"]
  },
  "item-documents": {
    itemId: "item-documents",
    displayName: "Archive Folder",
    category: "intel",
    subcategory: "documents",
    width: 2,
    height: 1,
    weight: 0.3,
    stackable: false,
    maxStack: 1,
    allowedSlots: [],
    allowedParents: ["stash", "backpack", "pouch"],
    rotationAllowed: true,
    value: 240,
    description: "Sensitive route paperwork and cut-in notes.",
    tags: ["intel", "quest"]
  },
  "item-magstack": {
    itemId: "item-magstack",
    displayName: "Magazine Stack",
    category: "ammo",
    subcategory: "magazine",
    width: 2,
    height: 1,
    weight: 0.9,
    stackable: false,
    maxStack: 1,
    allowedSlots: [],
    allowedParents: ["stash", "backpack", "tactical-rig"],
    rotationAllowed: true,
    value: 100,
    description: "Loose magazine cluster for fast refills.",
    tags: ["ammo", "container"]
  },
  "item-relay": {
    itemId: "item-relay",
    displayName: "Signal Relay",
    category: "intel",
    subcategory: "relay",
    width: 2,
    height: 1,
    weight: 0.8,
    stackable: false,
    maxStack: 1,
    allowedSlots: [],
    allowedParents: ["stash", "backpack"],
    rotationAllowed: true,
    value: 260,
    description: "Electronic route gear tied to relay objectives.",
    tags: ["intel", "electronics"]
  },
  "item-beacon": {
    itemId: "item-beacon",
    displayName: "Beacon Kit",
    category: "tool",
    subcategory: "beacon",
    width: 2,
    height: 1,
    weight: 0.7,
    stackable: false,
    maxStack: 1,
    allowedSlots: [],
    allowedParents: ["stash", "backpack"],
    rotationAllowed: true,
    value: 180,
    description: "Extraction signaling kit for route marking.",
    tags: ["tool", "route"]
  },
  "item-dogtags": {
    itemId: "item-dogtags",
    displayName: "Dogtags",
    category: "intel",
    subcategory: "dogtags",
    width: 1,
    height: 1,
    weight: 0.1,
    stackable: true,
    maxStack: 8,
    allowedSlots: [],
    allowedParents: ["stash", "backpack", "pouch", "pockets"],
    rotationAllowed: false,
    value: 90,
    description: "Identity tags with broker and story value.",
    tags: ["intel", "stack"]
  },
  "item-rations": {
    itemId: "item-rations",
    displayName: "Rations",
    category: "provisions",
    subcategory: "rations",
    width: 1,
    height: 1,
    weight: 0.4,
    stackable: true,
    maxStack: 4,
    allowedSlots: [],
    allowedParents: ["stash", "backpack", "pockets"],
    rotationAllowed: false,
    value: 45,
    description: "Food and hydration support for long raids.",
    tags: ["food", "consumable"]
  },
  "item-cash": {
    itemId: "item-cash",
    displayName: "Broker Cash",
    category: "barter",
    subcategory: "cash",
    width: 1,
    height: 1,
    weight: 0.1,
    stackable: true,
    maxStack: 500000,
    allowedSlots: [],
    allowedParents: ["stash", "pouch"],
    rotationAllowed: false,
    value: 1,
    description: "Portable currency tied to route-side tradeoffs.",
    tags: ["currency", "stack"]
  },
  "item-generic": {
    itemId: "item-generic",
    displayName: "Stash Item",
    category: "barter",
    subcategory: "generic",
    width: 1,
    height: 1,
    weight: 0.5,
    stackable: false,
    maxStack: 1,
    allowedSlots: [],
    allowedParents: ["stash"],
    rotationAllowed: false,
    value: 20,
    description: "Generic stash item placeholder.",
    tags: ["misc"]
  }
};

export function getInventoryItemDefinition(itemId: string): InventoryItemDefinition {
  return INVENTORY_ITEM_DEFINITIONS[itemId] ?? INVENTORY_ITEM_DEFINITIONS["item-generic"];
}

export function getTileInventoryItemId(variant: string, weaponId?: string): string {
  if (weaponId) {
    return `weapon-${weaponId}`;
  }

  if (variant === "ammo") {
    return "item-magstack";
  }

  if (variant === "breach") {
    return "item-toolkit";
  }

  return `item-${variant}`;
}

export function getItemFootprint(definition: InventoryItemDefinition, rotated: boolean): { width: number; height: number } {
  return rotated ? { width: definition.height, height: definition.width } : { width: definition.width, height: definition.height };
}

export function canRotateItem(definition: InventoryItemDefinition): boolean {
  return definition.rotationAllowed && definition.width !== definition.height;
}

export function rectanglesOverlap(
  leftA: number,
  topA: number,
  widthA: number,
  heightA: number,
  leftB: number,
  topB: number,
  widthB: number,
  heightB: number
): boolean {
  const rightA = leftA + widthA - 1;
  const bottomA = topA + heightA - 1;
  const rightB = leftB + widthB - 1;
  const bottomB = topB + heightB - 1;

  return !(rightA < leftB || rightB < leftA || bottomA < topB || bottomB < topA);
}

export function validateGridPlacement(
  surface: GridSurfaceDefinition,
  occupants: GridOccupant[],
  target: GridOccupant
): GridPlacementValidation {
  const left = target.placement.columnStart;
  const top = target.placement.rowStart;
  const right = left + target.width - 1;
  const bottom = top + target.height - 1;

  if (left < 1 || top < 1 || right > surface.width || bottom > surface.height) {
    return { ok: false, reason: "out-of-bounds", blockedByIds: [] };
  }

  const blockedByIds = occupants
    .filter((occupant) =>
      rectanglesOverlap(
        left,
        top,
        target.width,
        target.height,
        occupant.placement.columnStart,
        occupant.placement.rowStart,
        occupant.width,
        occupant.height
      )
    )
    .map((occupant) => occupant.id);

  if (blockedByIds.length > 0) {
    return { ok: false, reason: "overlap", blockedByIds };
  }

  return { ok: true };
}
