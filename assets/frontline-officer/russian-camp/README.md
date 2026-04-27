# Frontline Officer Russian-Side Camp Art

Top-down fictional opposing-side camp art for the first-town war slice.

These assets are faction-readable without using real flags, unit marks, slogans, or political symbols. The shared visual language is gray-green field hardware with muted red/white identification panels, suitable for a Russian-side/opfor camp in the current fictional persistent-war direction.

## Runtime Notes

- Use the individual transparent PNGs as Phaser sprites or static images.
- Use `russian_camp_props_32_sheet.png` as a 4 by 4 sprite sheet with 32 px frames.
- Treat `russian_camp_preview_sheet.png` and `russian_camp_extended_preview_sheet.png` as visual indexes only, not runtime tile sheets.
- Camp assets are sized for top-down readability and can be scaled down in-engine as needed.

## Asset Roles

- Command and camp health: `russian_command_bunker_128.png`, `russian_command_bunker_damaged_128.png`.
- Larger command health target: `russian_command_core_160x144.png`.
- Soldier support: `russian_barracks_tent_96.png`, `russian_barracks_tent_112x96.png`, `russian_barracks_tent_damaged_96.png`, `russian_medical_dugout_96.png`, `russian_field_kitchen_64.png`.
- Logistics: `russian_supply_depot_96.png`, `russian_large_supply_dump_128.png`, `russian_supply_dump_128x112.png`, `russian_camo_net_storage_128.png`, `russian_ammo_cache_64.png`, `russian_fuel_drums_64.png`, `russian_generator_trailer_96.png`.
- Defense and camp boundary: `russian_sandbag_wall_128x32.png`, `russian_trench_gate_128x64.png`, `russian_trench_firing_bay_128x64.png`, `russian_wire_belt_128x64.png`, `russian_watch_post_96.png`, `russian_checkpoint_gate_128x64.png`, `russian_mortar_pit_96.png`.
- Vehicles and scars: `russian_logistics_truck_128x96.png`, `russian_motor_pool_truck_128x96.png`, `russian_motor_pool_truck_144x96.png`, `russian_vehicle_wreck_128x96.png`.
- Dressing: `russian_camp_props_32_sheet.png`.
- Terrain sheets: `russian_camp_terrain_64_sheet.png` is a 4 by 4 sheet with 64 px camp ground, road, mud, crater, pad, plank, mark, and scorch tiles.
- Trench modules: `russian_trench_modules_64_sheet.png` is a 64 px modular trench sheet with straight, corner, junction, and firing bay pieces.
- Damage overlays: `russian_damage_decals_32_sheet.png` is an 8 by 8 transparent 32 px sheet for scorch, crack, ash, and blast marks.
- Additional defenses: `russian_log_wall_128x64.png` and `russian_steel_barricade_128x64.png`.
- Camp support: `russian_drone_control_table_96.png`, `russian_battery_bank_96.png`, `russian_medical_van_128x96.png`, and `russian_medical_van_damaged_128x96.png`.
- Runtime module sheets: `russian_camp_modules_64_sheet.png` is a 4 by 4, 64 px camp module sheet; `russian_camp_damage_64_sheet.png` is a 4 by 2, 64 px damaged-state sheet.
- Officer-war support sheets: `russian_perimeter_defenses_64_sheet.png`, `russian_fieldwork_build_stages_64_sheet.png`, and `russian_logistics_markers_32_sheet.png`.
- Camp interior and supply sheets: `russian_camp_interiors_64_sheet.png`, `russian_supply_stacks_64_sheet.png`, and `russian_signal_panels_32_sheet.png`.
- Heavy and service sheets: `russian_heavy_emplacements_64_sheet.png`, `russian_camp_services_64_sheet.png`, and `russian_ground_markers_32_sheet.png`.
- State and recovery sheets: `russian_abandoned_camp_64_sheet.png` and `russian_recovery_medical_64_sheet.png`.
- Camouflage and night sheets: `russian_camo_command_64_sheet.png` and `russian_night_watch_64_sheet.png`.
- Preview: `russian_camp_terrain_preview_sheet.png` is a non-runtime visual index focused on terrain and defenses.
