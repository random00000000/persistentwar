import type { Vec2 } from "../arena";

export type TownWarFactionId = "camp-a" | "camp-b";

export const TOWN_WAR_PLAYER_FACTION: TownWarFactionId = "camp-a";
export const TOWN_WAR_ENEMY_FACTION: TownWarFactionId = "camp-b";

export type TownWarFactionSide = "right" | "left";

export interface TownWarFactionRead {
  faction: TownWarFactionId;
  side: TownWarFactionSide;
  campLabel: string;
  forceLabel: string;
  armbandColor: string;
  playerControlled: boolean;
}

export const TOWN_WAR_FACTION_READ: Record<TownWarFactionId, TownWarFactionRead> = {
  "camp-a": {
    faction: "camp-a",
    side: "right",
    campLabel: "Russian Camp",
    forceLabel: "Russian",
    armbandColor: "#ef4444",
    playerControlled: true
  },
  "camp-b": {
    faction: "camp-b",
    side: "left",
    campLabel: "Ukrainian Enemy Camp",
    forceLabel: "Ukrainian",
    armbandColor: "#2563eb",
    playerControlled: false
  }
};

export function getTownWarFactionRead(faction: TownWarFactionId): TownWarFactionRead {
  return TOWN_WAR_FACTION_READ[faction];
}

export type TownWarRoleId = "builder" | "rifleman" | "suppressor" | "medic" | "defender";

export type TownWarSoldierArchetype =
  | "builder"
  | "engineer"
  | "medic"
  | "rifleman"
  | "suppressor"
  | "cook"
  | "quartermaster"
  | "sergeant"
  | "scout";

export type TownWarSkillId =
  | "construction"
  | "medical"
  | "logistics"
  | "shooting"
  | "suppression"
  | "nerve"
  | "perception"
  | "engineering"
  | "cooking"
  | "social"
  | "endurance"
  | "stealth"
  | "leadership";

export type TownWarTraitId =
  | "brave"
  | "cautious"
  | "reckless"
  | "steady-hands"
  | "fast-learner"
  | "field-cook"
  | "quartermaster"
  | "natural-leader"
  | "shaken"
  | "loyal"
  | "resentful"
  | "tunnel-rat";

export type TownWarWorkPriorityId =
  | "Build"
  | "Rescue"
  | "Resupply"
  | "Defend"
  | "Suppress"
  | "Rest"
  | "Repair"
  | "Haul"
  | "Medic"
  | "Cook"
  | "Assault"
  | "Scout";

export type TownWarCurrentNeedId = "ready" | "tired" | "hungry" | "shaken" | "wounded" | "low-ammo";

export type TownWarEntityKind = "soldier" | "ammo-crate";

export type TownWarOfficerRiskTier = "low" | "medium" | "high";

export type TownWarTaskKind = "idle" | "move" | "hold" | "build" | "resupply" | "suppress" | "heal" | "defend" | "attack";

export interface TownWarTask {
  kind: TownWarTaskKind;
  label?: string | null;
  targetPosition?: Vec2 | null;
  targetEntityId?: string | null;
  resumeTask?: TownWarTask | null;
}

export type TownWarMatchStatus = "active" | "ended";
