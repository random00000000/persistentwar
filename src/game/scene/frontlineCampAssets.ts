import type { TownWarFactionId } from "../townWar";

type FrontlineAssetLoadDefinition =
  | {
      type: "image";
      key: string;
      url: string;
    }
  | {
      type: "spritesheet";
      key: string;
      url: string;
      frameWidth: number;
      frameHeight: number;
    };

export type CampAssetRole =
  | "command"
  | "command-damaged"
  | "tent"
  | "tent-damaged"
  | "supply"
  | "ammo"
  | "radio"
  | "sandbag"
  | "watch"
  | "fuel"
  | "truck"
  | "wreck"
  | "mortar"
  | "wire"
  | "trench"
  | "checkpoint"
  | "medical"
  | "generator"
  | "kitchen"
  | "large-supply"
  | "camo-storage"
  | "command-core"
  | "large-tent"
  | "motor-pool"
  | "supply-dump"
  | "trench-gate";

export type CampAssetSheet =
  | "props-32"
  | "services-64"
  | "interiors-64"
  | "modules-64"
  | "heavy-64"
  | "perimeter-64"
  | "supply-stacks-64"
  | "damage-64"
  | "terrain-64"
  | "trench-modules-64"
  | "abandoned-64"
  | "camo-command-64"
  | "night-watch-64"
  | "recovery-medical-64"
  | "logistics-markers-32"
  | "signal-panels-32"
  | "ground-markers-32"
  | "fieldwork-stages-64";

const russianAssetRoot = "../../../assets/frontline-officer/russian-camp";
const ukrainianAssetRoot = "../../../assets/frontline-officer/ukrainian-camp";
const environmentAssetRoot = "../../../assets/frontline-officer/environment";

function assetUrl(path: string): string {
  return new URL(path, import.meta.url).href;
}

function campAssetKey(faction: TownWarFactionId, role: CampAssetRole): string {
  return `frontline-camp-${faction}-${role}`;
}

function campSheetKey(faction: TownWarFactionId, sheet: CampAssetSheet): string {
  return `frontline-camp-${faction}-${sheet}`;
}

function campVisualFaction(faction: TownWarFactionId): TownWarFactionId {
  // The player owns camp-a on the right, but this fork currently presents the player side as Russian.
  return faction === "camp-a" ? "camp-b" : "camp-a";
}

function campAsset(
  faction: TownWarFactionId,
  role: CampAssetRole,
  root: string,
  file: string
): FrontlineAssetLoadDefinition {
  return {
    type: "image",
    key: campAssetKey(faction, role),
    url: assetUrl(`${root}/${file}`)
  };
}

function campSheet(
  faction: TownWarFactionId,
  sheet: CampAssetSheet,
  root: string,
  file: string,
  frameWidth: number,
  frameHeight: number
): FrontlineAssetLoadDefinition {
  return {
    type: "spritesheet",
    key: campSheetKey(faction, sheet),
    url: assetUrl(`${root}/${file}`),
    frameWidth,
    frameHeight
  };
}

export const FRONTLINE_CAMP_ASSETS: FrontlineAssetLoadDefinition[] = [
  campAsset("camp-a", "command", ukrainianAssetRoot, "ukrainian_command_bunker_128.png"),
  campAsset("camp-a", "command-damaged", ukrainianAssetRoot, "ukrainian_command_bunker_damaged_128.png"),
  campAsset("camp-a", "tent", ukrainianAssetRoot, "ukrainian_barracks_tent_96.png"),
  campAsset("camp-a", "tent-damaged", ukrainianAssetRoot, "ukrainian_barracks_tent_damaged_96.png"),
  campAsset("camp-a", "supply", ukrainianAssetRoot, "ukrainian_supply_depot_96.png"),
  campAsset("camp-a", "ammo", ukrainianAssetRoot, "ukrainian_ammo_cache_64.png"),
  campAsset("camp-a", "radio", ukrainianAssetRoot, "ukrainian_radio_mast_64.png"),
  campAsset("camp-a", "sandbag", ukrainianAssetRoot, "ukrainian_sandbag_wall_128x32.png"),
  campAsset("camp-a", "watch", ukrainianAssetRoot, "ukrainian_watch_post_96.png"),
  campAsset("camp-a", "fuel", ukrainianAssetRoot, "ukrainian_fuel_drums_64.png"),
  campAsset("camp-a", "truck", ukrainianAssetRoot, "ukrainian_logistics_truck_128x96.png"),
  campAsset("camp-a", "wreck", ukrainianAssetRoot, "ukrainian_vehicle_wreck_128x96.png"),
  campAsset("camp-a", "mortar", ukrainianAssetRoot, "ukrainian_mortar_pit_96.png"),
  campAsset("camp-a", "wire", ukrainianAssetRoot, "ukrainian_wire_belt_128x64.png"),
  campAsset("camp-a", "trench", ukrainianAssetRoot, "ukrainian_trench_firing_bay_128x64.png"),
  campAsset("camp-a", "checkpoint", ukrainianAssetRoot, "ukrainian_checkpoint_gate_128x64.png"),
  campAsset("camp-a", "medical", ukrainianAssetRoot, "ukrainian_medical_dugout_96.png"),
  campAsset("camp-a", "generator", ukrainianAssetRoot, "ukrainian_generator_trailer_96.png"),
  campAsset("camp-a", "kitchen", ukrainianAssetRoot, "ukrainian_field_kitchen_64.png"),
  campAsset("camp-a", "large-supply", ukrainianAssetRoot, "ukrainian_large_supply_dump_128.png"),
  campAsset("camp-a", "camo-storage", ukrainianAssetRoot, "ukrainian_camo_net_storage_128.png"),
  campAsset("camp-a", "command-core", ukrainianAssetRoot, "ukrainian_command_core_160x144.png"),
  campAsset("camp-a", "large-tent", ukrainianAssetRoot, "ukrainian_barracks_tent_112x96.png"),
  campAsset("camp-a", "motor-pool", ukrainianAssetRoot, "ukrainian_motor_pool_truck_128x96.png"),
  campAsset("camp-a", "supply-dump", ukrainianAssetRoot, "ukrainian_supply_dump_128x112.png"),
  campAsset("camp-a", "trench-gate", ukrainianAssetRoot, "ukrainian_trench_gate_128x64.png"),
  campAsset("camp-b", "command", russianAssetRoot, "russian_command_bunker_128.png"),
  campAsset("camp-b", "command-damaged", russianAssetRoot, "russian_command_bunker_damaged_128.png"),
  campAsset("camp-b", "tent", russianAssetRoot, "russian_barracks_tent_96.png"),
  campAsset("camp-b", "tent-damaged", russianAssetRoot, "russian_barracks_tent_damaged_96.png"),
  campAsset("camp-b", "supply", russianAssetRoot, "russian_supply_depot_96.png"),
  campAsset("camp-b", "ammo", russianAssetRoot, "russian_ammo_cache_64.png"),
  campAsset("camp-b", "radio", russianAssetRoot, "russian_radio_mast_64.png"),
  campAsset("camp-b", "sandbag", russianAssetRoot, "russian_sandbag_wall_128x32.png"),
  campAsset("camp-b", "watch", russianAssetRoot, "russian_watch_post_96.png"),
  campAsset("camp-b", "fuel", russianAssetRoot, "russian_fuel_drums_64.png"),
  campAsset("camp-b", "truck", russianAssetRoot, "russian_logistics_truck_128x96.png"),
  campAsset("camp-b", "wreck", russianAssetRoot, "russian_vehicle_wreck_128x96.png"),
  campAsset("camp-b", "mortar", russianAssetRoot, "russian_mortar_pit_96.png"),
  campAsset("camp-b", "wire", russianAssetRoot, "russian_wire_belt_128x64.png"),
  campAsset("camp-b", "trench", russianAssetRoot, "russian_trench_firing_bay_128x64.png"),
  campAsset("camp-b", "checkpoint", russianAssetRoot, "russian_checkpoint_gate_128x64.png"),
  campAsset("camp-b", "medical", russianAssetRoot, "russian_medical_dugout_96.png"),
  campAsset("camp-b", "generator", russianAssetRoot, "russian_generator_trailer_96.png"),
  campAsset("camp-b", "kitchen", russianAssetRoot, "russian_field_kitchen_64.png"),
  campAsset("camp-b", "large-supply", russianAssetRoot, "russian_large_supply_dump_128.png"),
  campAsset("camp-b", "camo-storage", russianAssetRoot, "russian_camo_net_storage_128.png"),
  campAsset("camp-b", "command-core", russianAssetRoot, "russian_command_core_160x144.png"),
  campAsset("camp-b", "large-tent", russianAssetRoot, "russian_barracks_tent_112x96.png"),
  campAsset("camp-b", "motor-pool", russianAssetRoot, "russian_motor_pool_truck_128x96.png"),
  campAsset("camp-b", "supply-dump", russianAssetRoot, "russian_supply_dump_128x112.png"),
  campAsset("camp-b", "trench-gate", russianAssetRoot, "russian_trench_gate_128x64.png"),
  campSheet("camp-a", "props-32", ukrainianAssetRoot, "ukrainian_camp_props_32_sheet.png", 32, 32),
  campSheet("camp-a", "services-64", ukrainianAssetRoot, "ukrainian_camp_services_64_sheet.png", 64, 64),
  campSheet("camp-a", "interiors-64", ukrainianAssetRoot, "ukrainian_camp_interiors_64_sheet.png", 64, 64),
  campSheet("camp-a", "modules-64", ukrainianAssetRoot, "ukrainian_camp_modules_64_sheet.png", 64, 64),
  campSheet("camp-a", "heavy-64", ukrainianAssetRoot, "ukrainian_heavy_emplacements_64_sheet.png", 64, 64),
  campSheet("camp-a", "perimeter-64", ukrainianAssetRoot, "ukrainian_perimeter_defenses_64_sheet.png", 64, 64),
  campSheet("camp-a", "supply-stacks-64", ukrainianAssetRoot, "ukrainian_supply_stacks_64_sheet.png", 64, 64),
  campSheet("camp-a", "damage-64", ukrainianAssetRoot, "ukrainian_camp_damage_64_sheet.png", 64, 64),
  campSheet("camp-a", "abandoned-64", ukrainianAssetRoot, "ukrainian_abandoned_camp_64_sheet.png", 64, 64),
  campSheet("camp-a", "camo-command-64", ukrainianAssetRoot, "ukrainian_camo_command_64_sheet.png", 64, 64),
  campSheet("camp-a", "night-watch-64", ukrainianAssetRoot, "ukrainian_night_watch_64_sheet.png", 64, 64),
  campSheet("camp-a", "recovery-medical-64", ukrainianAssetRoot, "ukrainian_recovery_medical_64_sheet.png", 64, 64),
  campSheet("camp-a", "logistics-markers-32", ukrainianAssetRoot, "ukrainian_logistics_markers_32_sheet.png", 32, 32),
  campSheet("camp-a", "signal-panels-32", ukrainianAssetRoot, "ukrainian_signal_panels_32_sheet.png", 32, 32),
  campSheet("camp-a", "ground-markers-32", ukrainianAssetRoot, "ukrainian_ground_markers_32_sheet.png", 32, 32),
  campSheet("camp-a", "fieldwork-stages-64", ukrainianAssetRoot, "ukrainian_fieldwork_build_stages_64_sheet.png", 64, 64),
  campSheet("camp-b", "props-32", russianAssetRoot, "russian_camp_props_32_sheet.png", 32, 32),
  campSheet("camp-b", "services-64", russianAssetRoot, "russian_camp_services_64_sheet.png", 64, 64),
  campSheet("camp-b", "interiors-64", russianAssetRoot, "russian_camp_interiors_64_sheet.png", 64, 64),
  campSheet("camp-b", "modules-64", russianAssetRoot, "russian_camp_modules_64_sheet.png", 64, 64),
  campSheet("camp-b", "heavy-64", russianAssetRoot, "russian_heavy_emplacements_64_sheet.png", 64, 64),
  campSheet("camp-b", "perimeter-64", russianAssetRoot, "russian_perimeter_defenses_64_sheet.png", 64, 64),
  campSheet("camp-b", "supply-stacks-64", russianAssetRoot, "russian_supply_stacks_64_sheet.png", 64, 64),
  campSheet("camp-b", "damage-64", russianAssetRoot, "russian_camp_damage_64_sheet.png", 64, 64),
  campSheet("camp-b", "abandoned-64", russianAssetRoot, "russian_abandoned_camp_64_sheet.png", 64, 64),
  campSheet("camp-b", "camo-command-64", russianAssetRoot, "russian_camo_command_64_sheet.png", 64, 64),
  campSheet("camp-b", "night-watch-64", russianAssetRoot, "russian_night_watch_64_sheet.png", 64, 64),
  campSheet("camp-b", "recovery-medical-64", russianAssetRoot, "russian_recovery_medical_64_sheet.png", 64, 64),
  campSheet("camp-b", "terrain-64", russianAssetRoot, "russian_camp_terrain_64_sheet.png", 64, 64),
  campSheet("camp-b", "trench-modules-64", russianAssetRoot, "russian_trench_modules_64_sheet.png", 64, 64),
  campSheet("camp-b", "logistics-markers-32", russianAssetRoot, "russian_logistics_markers_32_sheet.png", 32, 32),
  campSheet("camp-b", "signal-panels-32", russianAssetRoot, "russian_signal_panels_32_sheet.png", 32, 32),
  campSheet("camp-b", "ground-markers-32", russianAssetRoot, "russian_ground_markers_32_sheet.png", 32, 32),
  campSheet("camp-b", "fieldwork-stages-64", russianAssetRoot, "russian_fieldwork_build_stages_64_sheet.png", 64, 64),
  {
    type: "spritesheet",
    key: "frontline-foliage-sheet",
    url: assetUrl(`${environmentAssetRoot}/frontline_foliage_sheet_256x128.png`),
    frameWidth: 64,
    frameHeight: 64
  },
  {
    type: "spritesheet",
    key: "frontline-environment-sheet",
    url: assetUrl(`${environmentAssetRoot}/frontline_environment_props_256x128.png`),
    frameWidth: 64,
    frameHeight: 64
  },
  {
    type: "spritesheet",
    key: "frontline-env-foliage-32",
    url: assetUrl(`${environmentAssetRoot}/foliage_32_sheet.png`),
    frameWidth: 32,
    frameHeight: 32
  },
  {
    type: "spritesheet",
    key: "frontline-env-props-64",
    url: assetUrl(`${environmentAssetRoot}/environmental_props_64_sheet.png`),
    frameWidth: 64,
    frameHeight: 64
  },
  {
    type: "spritesheet",
    key: "frontline-env-trench-64",
    url: assetUrl(`${environmentAssetRoot}/trench_tiles_64_sheet.png`),
    frameWidth: 64,
    frameHeight: 64
  },
  {
    type: "spritesheet",
    key: "frontline-env-road-64",
    url: assetUrl(`${environmentAssetRoot}/muddy_road_tiles_64_sheet.png`),
    frameWidth: 64,
    frameHeight: 64
  },
  {
    type: "spritesheet",
    key: "frontline-env-road-edge-64",
    url: assetUrl(`${environmentAssetRoot}/road_edge_tiles_64_sheet.png`),
    frameWidth: 64,
    frameHeight: 64
  },
  {
    type: "spritesheet",
    key: "frontline-env-trench-edge-64",
    url: assetUrl(`${environmentAssetRoot}/trench_edge_tiles_64_sheet.png`),
    frameWidth: 64,
    frameHeight: 64
  },
  {
    type: "spritesheet",
    key: "frontline-env-scars-64",
    url: assetUrl(`${environmentAssetRoot}/battlefield_scars_64_sheet.png`),
    frameWidth: 64,
    frameHeight: 64
  },
  {
    type: "spritesheet",
    key: "frontline-env-treeline-64",
    url: assetUrl(`${environmentAssetRoot}/tree_line_64_sheet.png`),
    frameWidth: 64,
    frameHeight: 64
  },
  {
    type: "spritesheet",
    key: "frontline-env-village-props-64",
    url: assetUrl(`${environmentAssetRoot}/village_war_props_64_sheet.png`),
    frameWidth: 64,
    frameHeight: 64
  },
  {
    type: "spritesheet",
    key: "frontline-env-mud-water-64",
    url: assetUrl(`${environmentAssetRoot}/mud_water_terrain_64_sheet.png`),
    frameWidth: 64,
    frameHeight: 64
  },
  {
    type: "spritesheet",
    key: "frontline-env-smoke-fire-64",
    url: assetUrl(`${environmentAssetRoot}/smoke_fire_fx_64_sheet.png`),
    frameWidth: 64,
    frameHeight: 64
  },
  {
    type: "spritesheet",
    key: "frontline-env-ruined-town-64",
    url: assetUrl(`${environmentAssetRoot}/ruined_town_scatter_64_sheet.png`),
    frameWidth: 64,
    frameHeight: 64
  },
  {
    type: "spritesheet",
    key: "frontline-env-concealment-64",
    url: assetUrl(`${environmentAssetRoot}/concealment_foliage_64_sheet.png`),
    frameWidth: 64,
    frameHeight: 64
  },
  {
    type: "spritesheet",
    key: "frontline-env-crater-field-64",
    url: assetUrl(`${environmentAssetRoot}/crater_field_tiles_64_sheet.png`),
    frameWidth: 64,
    frameHeight: 64
  },
  {
    type: "spritesheet",
    key: "frontline-env-industrial-ruins-64",
    url: assetUrl(`${environmentAssetRoot}/industrial_ruins_64_sheet.png`),
    frameWidth: 64,
    frameHeight: 64
  },
  {
    type: "spritesheet",
    key: "frontline-env-seasonal-foliage-64",
    url: assetUrl(`${environmentAssetRoot}/seasonal_foliage_64_sheet.png`),
    frameWidth: 64,
    frameHeight: 64
  },
  {
    type: "spritesheet",
    key: "frontline-env-artillery-aftermath-64",
    url: assetUrl(`${environmentAssetRoot}/artillery_aftermath_64_sheet.png`),
    frameWidth: 64,
    frameHeight: 64
  },
  {
    type: "spritesheet",
    key: "frontline-env-rural-field-64",
    url: assetUrl(`${environmentAssetRoot}/rural_field_tiles_64_sheet.png`),
    frameWidth: 64,
    frameHeight: 64
  },
  {
    type: "spritesheet",
    key: "frontline-env-hedgerow-64",
    url: assetUrl(`${environmentAssetRoot}/hedgerow_foliage_64_sheet.png`),
    frameWidth: 64,
    frameHeight: 64
  },
  {
    type: "spritesheet",
    key: "frontline-env-weather-64",
    url: assetUrl(`${environmentAssetRoot}/weather_overlay_64_sheet.png`),
    frameWidth: 64,
    frameHeight: 64
  },
  {
    type: "spritesheet",
    key: "frontline-env-wet-mud-64",
    url: assetUrl(`${environmentAssetRoot}/wet_mud_variants_64_sheet.png`),
    frameWidth: 64,
    frameHeight: 64
  },
  {
    type: "spritesheet",
    key: "frontline-env-orchard-64",
    url: assetUrl(`${environmentAssetRoot}/orchard_foliage_64_sheet.png`),
    frameWidth: 64,
    frameHeight: 64
  },
  {
    type: "spritesheet",
    key: "frontline-env-woodland-terrain-64",
    url: assetUrl(`${environmentAssetRoot}/woodland_terrain_64_sheet.png`),
    frameWidth: 64,
    frameHeight: 64
  },
  {
    type: "spritesheet",
    key: "frontline-env-woodland-foliage-32",
    url: assetUrl(`${environmentAssetRoot}/woodland_foliage_32_sheet.png`),
    frameWidth: 32,
    frameHeight: 32
  },
  {
    type: "spritesheet",
    key: "frontline-env-woodland-trees-96",
    url: assetUrl(`${environmentAssetRoot}/woodland_trees_96_sheet.png`),
    frameWidth: 96,
    frameHeight: 96
  },
  {
    type: "spritesheet",
    key: "frontline-env-woodland-logs-64",
    url: assetUrl(`${environmentAssetRoot}/woodland_logs_64_sheet.png`),
    frameWidth: 64,
    frameHeight: 64
  },
  {
    type: "spritesheet",
    key: "frontline-env-woodland-treeline-128x96",
    url: assetUrl(`${environmentAssetRoot}/woodland_treeline_128x96_sheet.png`),
    frameWidth: 128,
    frameHeight: 96
  },
  {
    type: "image",
    key: "frontline-env-ruined-house-128",
    url: assetUrl(`${environmentAssetRoot}/ruined_house_128.png`)
  },
  {
    type: "image",
    key: "frontline-env-woodland-deadfall-128x96",
    url: assetUrl(`${environmentAssetRoot}/woodland_deadfall_cover_128x96.png`)
  },
  {
    type: "image",
    key: "frontline-env-woodland-bushline-128",
    url: assetUrl(`${environmentAssetRoot}/woodland_dense_bushline_128.png`)
  },
  {
    type: "image",
    key: "frontline-env-woodland-bare-tree-96",
    url: assetUrl(`${environmentAssetRoot}/woodland_bare_tree_96.png`)
  }
];

export function getFrontlineCampAssetKey(faction: TownWarFactionId, role: CampAssetRole): string {
  return campAssetKey(campVisualFaction(faction), role);
}

export function getFrontlineCampSheetKey(faction: TownWarFactionId, sheet: CampAssetSheet): string {
  return campSheetKey(campVisualFaction(faction), sheet);
}
