import type { Vec2 } from "../arena";

export interface SharedSoldierCombatAmmoState {
  inMag: number;
  reserve: number;
  maxMag: number;
}

export interface SharedSoldierCombatHealthState {
  current: number;
  max: number;
}

export interface SharedSoldierCombatMoraleState {
  pressure: number;
  maxPressure: number;
}

export interface SharedSoldierCombatTaskState {
  kind: string;
  label?: string | null;
  targetPosition?: Vec2 | null;
  targetEntityId?: string | null;
}

export interface SharedSoldierCombatant {
  id: string;
  ammo: SharedSoldierCombatAmmoState;
  health: SharedSoldierCombatHealthState;
  morale: SharedSoldierCombatMoraleState;
  task: SharedSoldierCombatTaskState;
}

export interface SharedSoldierIncomingFireResult {
  healthBefore: number;
  healthAfter: number;
  pressureBefore: number;
  pressureAfter: number;
  pressureRatio: number;
  died: boolean;
}

export function getSharedSoldierAmmoTotal(soldier: SharedSoldierCombatant): number {
  return Math.max(0, soldier.ammo.inMag) + Math.max(0, soldier.ammo.reserve);
}

export function canSharedSoldierShoot(soldier: SharedSoldierCombatant): boolean {
  return soldier.health.current > 0 && getSharedSoldierAmmoTotal(soldier) > 0;
}

export function consumeSharedSoldierFireAmmo(soldier: SharedSoldierCombatant, requestedShots: number): number {
  const shots = Math.max(0, Math.floor(requestedShots));
  let consumed = 0;

  for (let shot = 0; shot < shots; shot += 1) {
    if (soldier.ammo.inMag > 0) {
      soldier.ammo.inMag = Math.max(0, soldier.ammo.inMag - 1);
      consumed += 1;
      continue;
    }

    if (soldier.ammo.reserve <= 0) {
      break;
    }

    const load = Math.min(soldier.ammo.maxMag, soldier.ammo.reserve);
    soldier.ammo.inMag = load;
    soldier.ammo.reserve = Math.max(0, soldier.ammo.reserve - load);
  }

  return consumed;
}

export function recoverSharedSoldierPressure(soldier: SharedSoldierCombatant, amount: number): void {
  soldier.morale.pressure = Math.max(0, soldier.morale.pressure - Math.max(0, amount));
}

export function applySharedSoldierIncomingFire(
  soldier: SharedSoldierCombatant,
  damage: number,
  pressure: number
): SharedSoldierIncomingFireResult {
  const healthBefore = soldier.health.current;
  const pressureBefore = soldier.morale.pressure;
  soldier.health.current = Math.max(0, soldier.health.current - Math.max(0, damage));
  soldier.morale.pressure = Math.min(soldier.morale.maxPressure, soldier.morale.pressure + Math.max(0, pressure));
  return {
    healthBefore,
    healthAfter: soldier.health.current,
    pressureBefore,
    pressureAfter: soldier.morale.pressure,
    pressureRatio: soldier.morale.pressure / Math.max(1, soldier.morale.maxPressure),
    died: soldier.health.current <= 0 && healthBefore > 0
  };
}

export function shouldSharedSoldierRetreatFromSuppression(soldier: SharedSoldierCombatant, threshold: number): boolean {
  return soldier.morale.pressure / Math.max(1, soldier.morale.maxPressure) >= threshold;
}
