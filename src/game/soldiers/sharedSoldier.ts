import type { Vec2 } from "../arena";
import type { WeaponId } from "../weapons";
import type {
  TownWarCurrentNeedId,
  TownWarFactionId,
  TownWarFactionSide,
  TownWarRoleId,
  TownWarSoldierArchetype,
  TownWarTaskKind,
  TownWarTraitId
} from "../townWar/types";

export type SharedSoldierContractVersion = 1;

export type SharedSoldierSource = "town-war-soldier";

export type SharedSoldierSquadStatus = "camp" | "assigned" | "deployed" | "wounded" | "lost";

export type SharedSoldierSuppressionTacticalState =
  | "idle"
  | "seek-cover"
  | "hold-cover"
  | "suppress-area"
  | "bound-forward"
  | "reload-behind-cover"
  | "fallback"
  | "cover-builder"
  | "recover-wounded";

export interface SharedSoldierIdentityState {
  id: string;
  source: SharedSoldierSource;
  sourceId: string;
  displayName: string;
  archetype: TownWarSoldierArchetype;
  traits: TownWarTraitId[];
}

export interface SharedSoldierFactionReadState {
  side: TownWarFactionSide;
  campLabel: string;
  forceLabel: string;
  armbandColor: string;
  playerControlled: boolean;
}

export interface SharedSoldierWeaponState {
  weaponId: WeaponId;
}

export interface SharedSoldierAmmoState {
  inMag: number;
  reserve: number;
  maxMag: number;
  lowAmmo: boolean;
}

export interface SharedSoldierHealthState {
  current: number;
  max: number;
  alive: boolean;
  wounded: boolean;
}

export interface SharedSoldierMoraleState {
  pressure: number;
  maxPressure: number;
  pressureRatio: number;
}

export interface SharedSoldierNeedState {
  fatigue: number;
  hunger: number;
  morale: number;
  currentNeed: TownWarCurrentNeedId;
}

export interface SharedSoldierSuppressionState {
  pressure: number;
  pressureRatio: number;
  tacticalState: SharedSoldierSuppressionTacticalState;
  targetId: string | null;
  reason: string;
}

export interface SharedSoldierOrderState {
  kind: TownWarTaskKind;
  label: string;
  targetPosition: Vec2 | null;
  targetEntityId: string | null;
  resumeKind: TownWarTaskKind | null;
}

export interface SharedSoldierCoverAssignmentState {
  coverSlotId: string | null;
  state: "none" | "moving" | "occupying" | "reserved";
  reason: string;
}

export interface SharedSoldierSquadAssignmentState {
  status: SharedSoldierSquadStatus;
  squadSlot: number | null;
  assignable: boolean;
  legacySquadMateId: string | null;
  operatorMenuVisible: boolean;
}

export interface SharedSoldierRuntimeState {
  position: Vec2;
  spawnedAtSeconds: number;
  lastUpdatedAtSeconds: number;
}

export interface SharedSoldierState {
  contractVersion: SharedSoldierContractVersion;
  identity: SharedSoldierIdentityState;
  faction: TownWarFactionId;
  factionRead: SharedSoldierFactionReadState;
  role: TownWarRoleId;
  weapon: SharedSoldierWeaponState;
  ammo: SharedSoldierAmmoState;
  health: SharedSoldierHealthState;
  morale: SharedSoldierMoraleState;
  suppression: SharedSoldierSuppressionState;
  needs: SharedSoldierNeedState;
  currentOrder: SharedSoldierOrderState;
  coverAssignment: SharedSoldierCoverAssignmentState;
  squadAssignment: SharedSoldierSquadAssignmentState;
  runtime: SharedSoldierRuntimeState;
  readable: string;
}
