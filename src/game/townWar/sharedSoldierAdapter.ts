import { WEAPONS } from "../weapons";
import type { WeaponId } from "../weapons";
import type { SharedSoldierSquadStatus, SharedSoldierState } from "../soldiers/sharedSoldier";
import { TOWN_WAR_PLAYER_FACTION } from "./types";
import type { TownWarSoldierState } from "./state";

function clonePosition(position: TownWarSoldierState["position"]): TownWarSoldierState["position"] {
  return { x: position.x, y: position.y };
}

function getSharedSoldierWeaponId(soldier: TownWarSoldierState): WeaponId {
  if (soldier.role === "suppressor") {
    return "pkm";
  }
  if (soldier.role === "medic") {
    return "smg";
  }
  if (soldier.role === "defender" || soldier.role === "rifleman") {
    return "rifle";
  }
  if (soldier.skills.shooting >= 12) {
    return "worn-ak";
  }
  return "rifle";
}

export function getSharedSoldierSquadStatus(soldier: TownWarSoldierState): SharedSoldierSquadStatus {
  if (soldier.health.current <= 0) {
    return "lost";
  }

  if (soldier.currentNeed === "wounded") {
    return "wounded";
  }

  if (soldier.squadBridge.status === "assigned") {
    return "assigned";
  }

  if (soldier.task.kind === "attack" || soldier.task.kind === "suppress" || soldier.task.kind === "defend") {
    return "deployed";
  }

  return "camp";
}

export function buildSharedSoldierFromTownWarSoldier(soldier: TownWarSoldierState, clockSeconds: number): SharedSoldierState {
  const pressureRatio = soldier.morale.pressure / Math.max(1, soldier.morale.maxPressure);
  const weaponId = getSharedSoldierWeaponId(soldier);
  const weaponName = WEAPONS[weaponId]?.name ?? weaponId;
  const orderLabel = soldier.task.label ?? soldier.task.kind;
  const squadStatus = getSharedSoldierSquadStatus(soldier);

  return {
    contractVersion: 1,
    identity: {
      id: soldier.id,
      source: "town-war-soldier",
      sourceId: soldier.id,
      displayName: soldier.displayName,
      archetype: soldier.archetype,
      traits: [...soldier.traits]
    },
    faction: soldier.faction,
    role: soldier.role,
    weapon: {
      weaponId
    },
    ammo: {
      inMag: soldier.ammo.inMag,
      reserve: soldier.ammo.reserve,
      maxMag: soldier.ammo.maxMag,
      lowAmmo: soldier.ammo.inMag + soldier.ammo.reserve <= Math.max(2, Math.ceil(soldier.ammo.maxMag * 0.5))
    },
    health: {
      current: soldier.health.current,
      max: soldier.health.max,
      alive: soldier.health.current > 0,
      wounded: soldier.health.current > 0 && soldier.health.current < soldier.health.max * 0.5
    },
    morale: {
      pressure: soldier.morale.pressure,
      maxPressure: soldier.morale.maxPressure,
      pressureRatio
    },
    suppression: {
      pressure: soldier.morale.pressure,
      pressureRatio,
      tacticalState: soldier.tacticalIntent.state,
      targetId: soldier.targetIntent.targetId,
      reason: soldier.tacticalIntent.reason || soldier.targetIntent.reason
    },
    needs: {
      fatigue: soldier.needs.fatigue,
      hunger: soldier.needs.hunger,
      morale: soldier.needs.morale,
      currentNeed: soldier.currentNeed
    },
    currentOrder: {
      kind: soldier.task.kind,
      label: orderLabel,
      targetPosition: soldier.task.targetPosition ? clonePosition(soldier.task.targetPosition) : null,
      targetEntityId: soldier.task.targetEntityId ?? null,
      resumeKind: soldier.task.resumeTask?.kind ?? null
    },
    coverAssignment: {
      coverSlotId: soldier.coverIntent.coverSlotId,
      state: soldier.coverIntent.state,
      reason: soldier.coverIntent.reason
    },
    squadAssignment: {
      status: squadStatus,
      squadSlot: soldier.squadBridge.squadSlot,
      assignable: soldier.faction === TOWN_WAR_PLAYER_FACTION && soldier.health.current > 0 && soldier.squadBridge.status !== "assigned",
      legacySquadMateId: soldier.squadBridge.legacySquadMateId,
      operatorMenuVisible: soldier.squadBridge.operatorMenuVisible
    },
    runtime: {
      position: clonePosition(soldier.position),
      spawnedAtSeconds: soldier.spawnedAtSeconds,
      lastUpdatedAtSeconds: clockSeconds
    },
    readable: `${soldier.displayName} shared soldier: ${soldier.faction}, ${soldier.role}, ${weaponName}, ${orderLabel}, ${squadStatus}.`
  };
}
