import { WORLD_HEIGHT, WORLD_WIDTH, type Vec2 } from "../arena";
import { HOSTILE_DIALOGUE_TEMPLATES, SQUAD_DIALOGUE_TEMPLATES } from "../dialogue/storyPacks";
import type { HostileDialogueTemplateDefinition, SquadDialogueTemplateDefinition } from "../dialogue/storyPackSchema";
import { TOWN_WAR_ENEMY_FACTION, TOWN_WAR_PLAYER_FACTION } from "./types";
import type {
  TownWarCurrentNeedId,
  TownWarFactionId,
  TownWarOfficerRiskTier,
  TownWarRoleId,
  TownWarSkillId,
  TownWarSoldierArchetype,
  TownWarTask,
  TownWarTraitId,
  TownWarWorkPriorityId
} from "./types";
import {
  createTownWarState,
  createTownWarSoldierDramaArc,
  damageTownWarCamp,
  resolveTownWarMatch,
  type TownWarBuildOrderKind,
  type TownWarChatterEntry,
  type TownWarAmmoCrateState,
  type TownWarBuildOrderState,
  type TownWarBuildExecutionState,
  type TownWarCampState,
  type TownWarCampSupplyState,
  type TownWarCampWorkPriorityId,
  type TownWarCasualtySeverity,
  type TownWarCasualtyState,
  type TownWarCombatantAmmoState,
  type TownWarCombatantState,
  type TownWarCoverIntentState,
  type TownWarCoverSlotState,
  type TownWarDramaCause,
  type TownWarDebriefEcho,
  type TownWarDramaBeatEntry,
  type TownWarDramaBeatKind,
  type TownWarDramaEvent,
  type TownWarDramaEventKind,
  type TownWarDramaMemory,
  type TownWarDramaResponsibility,
  type TownWarDugoutState,
  type TownWarFlankLaneId,
  type TownWarFlankPressureLevel,
  type TownWarFlankPressureState,
  type TownWarFrontlineStoryKind,
  type TownWarFrontlineStoryState,
  type TownWarLocationScar,
  type TownWarLocationScarKind,
  type TownWarNeedState,
  type TownWarOperationDebriefState,
  type TownWarOperationState,
  type TownWarPersistentSoldierRecordState,
  type TownWarSkillDebriefState,
  type TownWarSkillOutcomeId,
  type TownWarSkillOutcomeState,
  type TownWarSoldierDramaArc,
  type TownWarSoldierIdentitySummary,
  type TownWarSoldierState,
  type TownWarSkillState,
  type TownWarTaskCandidateState,
  type TownWarTaskDecisionState,
  type TownWarTacticalIntentState,
  type TownWarTacticalPairState,
  type TownWarTargetIntentState,
  type TownWarWorkPriorityState,
  type TownWarThreatContactState,
  type TownWarState,
  type TownWarTownState
} from "./state";

const DEFAULT_MOVEMENT_SPEED = 72;
const AMMO_SUPPLY_ROUNDS_PER_POINT = 6;
const AMMO_CRATE_RESUPPLY_DISTANCE = 170;
const AMMO_CRATE_RESUPPLY_PER_SECOND = 6;
const AMMO_CRATE_LOOT_DISTANCE = 54;
const SUPPRESS_FIRE_ROUNDS_PER_SECOND = 6;
const ATTACK_FIRE_ROUNDS_PER_SECOND = 4;
const DEFEND_FIRE_ROUNDS_PER_SECOND = 2;
const PRESSURE_RECOVERY_PER_SECOND = 2.75;
const SUPPRESS_FIRE_RANGE = 420;
const ATTACK_FIRE_RANGE = 340;
const DEFEND_FIRE_RANGE = 300;
const TRENCH_FIRE_RANGE_FRONT_MULTIPLIER = 1.48;
const TRENCH_FIRE_RANGE_ANGLED_MULTIPLIER = 1.24;
const TRENCH_FIRE_RANGE_ENFILADED_MULTIPLIER = 0.92;
const TRENCH_INCOMING_SUPPRESSION_MIN_SCALE = 0.62;
const TRENCH_INCOMING_SUPPRESSION_ATTACK_MULTIPLIER = 1.18;
const TRENCH_INCOMING_SUPPRESSION_SUPPRESS_MULTIPLIER = 1.45;
const TRENCH_GRENADE_RANGE = 280;
const TRENCH_GRENADE_DAMAGE = 9.5;
const TRENCH_GRENADE_PRESSURE = 18;
const TRENCH_GRENADE_INSIDE_MULTIPLIER = 1.65;
const SUPPRESS_DAMAGE_PER_SECOND = 1.25;
const ATTACK_DAMAGE_PER_SECOND = 2.15;
const DEFEND_DAMAGE_PER_SECOND = 1.55;
const SUPPRESS_PRESSURE_PER_SECOND = 7.5;
const ATTACK_PRESSURE_PER_SECOND = 5.25;
const DEFEND_PRESSURE_PER_SECOND = 4.25;
const SUPPRESSION_RETREAT_THRESHOLD = 0.88;
const FRONTLINE_CONTACT_RANGE = 560;
const PLAYER_THREAT_IDLE_DISTANCE = 330;
const PLAYER_THREAT_MAX_SHARE = 0.28;
const COVER_OCCUPY_DISTANCE = 42;
const COVER_SEEK_PRESSURE_RATIO = 0.025;
const COVER_FALLBACK_PRESSURE_RATIO = 0.55;
const TRENCH_PROACTIVE_SEEK_DISTANCE = 620;
const TRENCH_TASK_ANCHOR_DISTANCE = 320;
const AMMO_CRATE_MAX_HEALTH = 25;
const DUGOUT_MAX_HEALTH = 80;
const DUGOUT_RALLY_RADIUS = 360;
const DUGOUT_SHELTER_RADIUS = 300;
const DUGOUT_CONTEST_DISTANCE = 210;
const BUILD_PROGRESS_REQUIRED = 100;
const AMMO_CRATE_ATTRITION_DAMAGE_PER_SECOND: Record<TownWarOfficerRiskTier, number> = {
  low: 0,
  medium: 0.25,
  high: 0.6
};

const TOWN_WAR_SKILLS: TownWarSkillId[] = [
  "construction",
  "medical",
  "logistics",
  "shooting",
  "suppression",
  "nerve",
  "perception",
  "engineering",
  "cooking",
  "social",
  "endurance",
  "stealth",
  "leadership"
];

const TOWN_WAR_WORK_PRIORITIES: TownWarWorkPriorityId[] = [
  "Build",
  "Rescue",
  "Resupply",
  "Defend",
  "Suppress",
  "Rest",
  "Repair",
  "Haul",
  "Medic",
  "Cook",
  "Assault",
  "Scout"
];

const TOWN_WAR_NAMES = [
  "Sokol",
  "Vira",
  "Makar",
  "Olek",
  "Yara",
  "Rook",
  "Mira",
  "Taran",
  "Dima",
  "Kira",
  "Lev",
  "Nika"
];

const DEBRIEF_AFTER_ACTION_TEMPLATES = [
  "{summary}",
  "The line recorded it plainly: {summary}",
  "Command log marks the beat as {beat}: {summary}",
  "No speech needed in the report. {summary}",
  "The town shifted around one fact: {summary}",
  "The order left a clean trace. {summary}",
  "Witnesses agree on the shape of it: {summary}",
  "The front absorbed the move and kept going. {summary}",
  "After-action read: {summary}",
  "The map changed because of it: {summary}",
  "The watch officer logged the moment: {summary}",
  "The next order starts from this truth: {summary}"
];

const DEBRIEF_MEMORIAL_TEMPLATES = [
  "The wake note does not decorate it: {summary}",
  "Names stayed attached to the ground after this: {summary}",
  "The section went quiet around the fact: {summary}",
  "Nobody needed a speech to remember it: {summary}",
  "The loss stayed local and specific: {summary}",
  "The line carried the count forward: {summary}",
  "The debrief kept the cost visible: {summary}",
  "The ground kept its witness: {summary}"
];

const DEBRIEF_RESPONSIBILITY_TEMPLATES = [
  "Officer responsibility remains attached to the order: {summary}",
  "The command trace points back to the order: {summary}",
  "The debrief names the cause without softening it: {summary}",
  "The section will remember who sent it there: {summary}",
  "The order created the situation, and the log says so: {summary}",
  "Command consequence is clear: {summary}",
  "The report keeps the officer in the sentence: {summary}",
  "This is not random weather. {summary}"
];

export interface SpawnTownWarSoldierInput {
  faction: TownWarFactionId;
  role: TownWarRoleId;
  position: Vec2;
  spawnedFromCampId?: TownWarFactionId;
  spawnReason?: "initial" | "reinforcement" | "script";
  healthMax?: number;
  ammoInMag?: number;
  ammoReserve?: number;
  ammoMaxMag?: number;
  maxPressure?: number;
  task?: TownWarTask;
}

export type TownWarOfficerLaneId = "north" | "mid" | "south";

export interface TownWarOfficerOrderResult {
  ok: boolean;
  reason?: string | null;
  campId: TownWarFactionId;
  campSupply?: { ammo: number; build: number } | null;
  assignedSoldierId?: string | null;
  assignedRole?: TownWarRoleId | null;
  task?: TownWarTask | null;
  orderId?: string | null;
  travelDistance?: number | null;
  etaSeconds?: number | null;
  riskTier?: TownWarOfficerRiskTier | null;
}

export interface TownWarDebugTrenchResult {
  ok: boolean;
  reason?: string | null;
  order: TownWarOfficerOrderResult;
  coverSlot: TownWarCoverSlotState | null;
  readable: string;
}

export interface TownWarBuildPlacementPreviewState {
  kind: TownWarBuildOrderKind | null;
  faction: TownWarFactionId | null;
  position: Vec2 | null;
  facingAngleRadians: number;
  valid: boolean;
}

export interface TownWarOfficerFocusResult {
  ok: boolean;
  reason?: string | null;
  campId: TownWarFactionId;
  lane: TownWarOfficerLaneId;
  assignments: Array<{ soldierId: string; role: TownWarRoleId; task: TownWarTask }>;
}

export interface TownWarPriorityMutationResult {
  ok: boolean;
  reason?: string | null;
  soldierId: string;
  work: TownWarWorkPriorityId | null;
  priority: number | null;
  soldier: TownWarSoldierState | null;
  candidates: TownWarTaskCandidateState[];
}

export interface TownWarBuildReportResult {
  ok: boolean;
  reason?: string | null;
  order: TownWarBuildOrderState | null;
  builder: TownWarSoldierState | null;
  supportingSuppressor: TownWarSoldierState | null;
  readable: string;
}

export interface TownWarCasualtyMutationResult {
  ok: boolean;
  reason?: string | null;
  casualty: TownWarCasualtyState | null;
  soldier: TownWarSoldierState | null;
  medic: TownWarSoldierState | null;
  readable: string;
}

export interface TownWarRescueReportResult {
  ok: boolean;
  reason?: string | null;
  casualties: TownWarCasualtyState[];
  candidates: Array<{
    medicId: string;
    medicName: string;
    targetSoldierId: string;
    casualtyId: string;
    score: number;
    reason: string;
    pathRisk: number;
    coveredPath: number;
    blockedReason: string | null;
  }>;
  readable: string;
}

export interface TownWarSustainmentReportResult {
  ok: boolean;
  reason?: string | null;
  camps: Array<{
    campId: TownWarFactionId;
    label: string;
    readiness: number;
    fatigueAverage: number;
    hungerAverage: number;
    moraleAverage: number;
    ammoFlow: number;
    cookEffect: number;
    restCycle: number;
    logisticsScore: number;
    cookingScore: number;
    enduranceScore: number;
    bottleneckReason: string | null;
    warnings: string[];
    workPriorities: Record<TownWarCampWorkPriorityId, number>;
  }>;
  readable: string;
}

export interface TownWarOperationMutationResult {
  ok: boolean;
  reason?: string | null;
  operation: TownWarOperationState;
  debrief: TownWarOperationDebriefState | null;
  readable: string;
}

export interface TownWarFlankPressureResult {
  ok: boolean;
  reason?: string | null;
  flank: TownWarFlankPressureState | null;
  outcome: TownWarSkillOutcomeState | null;
  debrief: TownWarSkillDebriefState;
  scout: TownWarSoldierState | null;
  readable: string;
}

export interface TownWarSkillEmergenceDemoResult {
  ok: boolean;
  reason?: string | null;
  hold: TownWarFlankPressureResult;
  failure: TownWarFlankPressureResult;
  debrief: TownWarSkillDebriefState;
  readable: string;
}

export interface TownWarCampWorkMutationResult {
  ok: boolean;
  reason?: string | null;
  campId: TownWarFactionId;
  work: TownWarCampWorkPriorityId | null;
  priority: number | null;
  report: TownWarSustainmentReportResult | null;
}

export interface TownWarOfficerAdvanceResult {
  ok: boolean;
  reason?: string | null;
  requestedSeconds: number;
  appliedTicks: number;
  tickSeconds: number;
}

export interface TownWarReinforceResult {
  ok: boolean;
  reason?: string | null;
  campId: TownWarFactionId;
  role: TownWarRoleId;
  requested: number;
  spawned: number;
  soldierIds: string[];
}

function cloneVec2(position: Vec2): Vec2 {
  return { x: position.x, y: position.y };
}

function cloneTown(town: TownWarTownState): TownWarTownState {
  return {
    ...town,
    control: { ...town.control }
  };
}

function cloneCamp(camp: TownWarCampState): TownWarCampState {
  return {
    ...camp,
    spawn: {
      position: cloneVec2(camp.spawn.position),
      radius: camp.spawn.radius,
      lastReinforcementAtSeconds: camp.spawn.lastReinforcementAtSeconds,
      totalSpawned: camp.spawn.totalSpawned
    },
    health: { ...camp.health },
    supply: { ...camp.supply },
    control: { ...camp.control },
    sustainment: {
      ...camp.sustainment,
      warnings: [...camp.sustainment.warnings],
      workPriorities: { ...camp.sustainment.workPriorities }
    }
  };
}

function cloneSupply(supply: TownWarCampSupplyState): TownWarCampSupplyState {
  return { ...supply };
}

function clonePersistentSoldierRecord(record: TownWarPersistentSoldierRecordState): TownWarPersistentSoldierRecordState {
  return {
    ...record,
    memoryTags: [...record.memoryTags]
  };
}

function cloneOperationDebrief(debrief: TownWarOperationDebriefState): TownWarOperationDebriefState {
  return {
    ...debrief,
    recommendations: [...debrief.recommendations],
    supplyRemaining: cloneSupply(debrief.supplyRemaining),
    carriedSoldiers: debrief.carriedSoldiers.map((record) => clonePersistentSoldierRecord(record)),
    warnings: [...debrief.warnings]
  };
}

function cloneOperationState(operation: TownWarOperationState): TownWarOperationState {
  return {
    ...operation,
    stockpile: {
      protected: cloneSupply(operation.stockpile.protected),
      committed: cloneSupply(operation.stockpile.committed),
      lastCommitted: cloneSupply(operation.stockpile.lastCommitted)
    },
    carriedSoldiers: operation.carriedSoldiers.map((record) => clonePersistentSoldierRecord(record)),
    lastDebrief: operation.lastDebrief ? cloneOperationDebrief(operation.lastDebrief) : null,
    recommendations: [...operation.recommendations]
  };
}

function cloneSoldierDramaArc(arc: TownWarSoldierDramaArc): TownWarSoldierDramaArc {
  return {
    ...arc,
    trustBySoldierId: { ...arc.trustBySoldierId },
    protectiveOfSoldierIds: [...arc.protectiveOfSoldierIds],
    rivalryWithSoldierIds: [...arc.rivalryWithSoldierIds],
    signatureTraumaTags: [...arc.signatureTraumaTags],
    signaturePrideTags: [...arc.signaturePrideTags],
    relationshipPressure: { ...arc.relationshipPressure }
  };
}

function cloneLocationScar(scar: TownWarLocationScar): TownWarLocationScar {
  return {
    ...scar,
    position: scar.position ? cloneVec2(scar.position) : null,
    tags: [...scar.tags],
    subjectNames: [...scar.subjectNames]
  };
}

function cloneDramaBeatEntry(entry: TownWarDramaBeatEntry): TownWarDramaBeatEntry {
  return {
    ...entry,
    tags: [...entry.tags]
  };
}

function cloneDebriefEcho(echo: TownWarDebriefEcho): TownWarDebriefEcho {
  return {
    ...echo,
    tags: [...echo.tags]
  };
}

function cloneFrontlineStory(story: TownWarFrontlineStoryState): TownWarFrontlineStoryState {
  return {
    ...story,
    position: story.position ? cloneVec2(story.position) : null
  };
}

function cloneFlankPressure(flank: TownWarFlankPressureState): TownWarFlankPressureState {
  return {
    ...flank,
    position: cloneVec2(flank.position),
    causeChain: [...flank.causeChain]
  };
}

function cloneSkillOutcome(outcome: TownWarSkillOutcomeState): TownWarSkillOutcomeState {
  return {
    ...outcome,
    causeChain: [...outcome.causeChain],
    memoryTags: [...outcome.memoryTags]
  };
}

function cloneSkillDebrief(debrief: TownWarSkillDebriefState): TownWarSkillDebriefState {
  return {
    ...debrief,
    lastOutcome: debrief.lastOutcome ? cloneSkillOutcome(debrief.lastOutcome) : null,
    outcomes: debrief.outcomes.map((outcome) => cloneSkillOutcome(outcome)),
    causeChain: [...debrief.causeChain]
  };
}

function cloneTargetIntent(intent: TownWarTargetIntentState): TownWarTargetIntentState {
  return {
    ...intent
  };
}

function createIdleTargetIntent(reason: string, seconds: number): TownWarTargetIntentState {
  return {
    targetKind: "none",
    targetId: null,
    targetScore: 0,
    reason,
    lastUpdatedAtSeconds: seconds
  };
}

function cloneTacticalIntent(intent: TownWarTacticalIntentState): TownWarTacticalIntentState {
  return {
    ...intent
  };
}

function cloneCoverIntent(intent: TownWarCoverIntentState): TownWarCoverIntentState {
  return {
    ...intent
  };
}

function cloneCoverSlot(slot: TownWarCoverSlotState): TownWarCoverSlotState {
  return {
    ...slot,
    position: cloneVec2(slot.position)
  };
}

function cloneDugout(dugout: TownWarDugoutState): TownWarDugoutState {
  return {
    ...dugout,
    position: cloneVec2(dugout.position),
    connectedTrenchSlotIds: [...dugout.connectedTrenchSlotIds],
    shelteringSoldierIds: [...dugout.shelteringSoldierIds],
    contestedBySoldierIds: [...dugout.contestedBySoldierIds]
  };
}

function cloneBuildExecution(build: TownWarBuildExecutionState): TownWarBuildExecutionState {
  return {
    ...build,
    causeChain: [...build.causeChain]
  };
}

function cloneCasualty(casualty: TownWarCasualtyState): TownWarCasualtyState {
  return {
    ...casualty,
    position: cloneVec2(casualty.position),
    causeChain: [...casualty.causeChain]
  };
}

function cloneTaskCandidate(candidate: TownWarTaskCandidateState): TownWarTaskCandidateState {
  return {
    ...candidate,
    scoreParts: { ...candidate.scoreParts }
  };
}

function cloneTaskDecision(decision: TownWarTaskDecisionState): TownWarTaskDecisionState {
  return {
    ...decision,
    candidates: decision.candidates.map((candidate) => cloneTaskCandidate(candidate))
  };
}

function clampSkill(value: number): number {
  return Math.max(0, Math.min(10, Math.round(value)));
}

function clampNeed(value: number): number {
  return Math.max(0, Math.min(1, Number(value.toFixed(2))));
}

function createBaseSkills(): TownWarSkillState {
  return TOWN_WAR_SKILLS.reduce((skills, skill) => {
    skills[skill] = 3;
    return skills;
  }, {} as TownWarSkillState);
}

function createBaseWorkPriorities(): TownWarWorkPriorityState {
  return TOWN_WAR_WORK_PRIORITIES.reduce((priorities, priority) => {
    priorities[priority] = 2;
    return priorities;
  }, {} as TownWarWorkPriorityState);
}

function createEmptyTaskDecision(seconds = 0): TownWarTaskDecisionState {
  return {
    selectedWork: null,
    selectedReason: null,
    selectedScore: 0,
    blockedReason: null,
    candidates: [],
    lastUpdatedAtSeconds: seconds
  };
}

function getSkillLabel(skill: TownWarSkillId): string {
  return skill
    .split("-")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function getTopSkillSummary(skills: TownWarSkillState): string {
  return Object.entries(skills)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 2)
    .map(([skill, value]) => `${getSkillLabel(skill as TownWarSkillId)} ${value}`)
    .join(", ");
}

function pickRoleArchetype(role: TownWarRoleId, variant: number): TownWarSoldierArchetype {
  if (role === "builder") {
    return variant % 3 === 0 ? "engineer" : "builder";
  }
  if (role === "medic") {
    return "medic";
  }
  if (role === "suppressor") {
    return "suppressor";
  }
  if (role === "defender") {
    return variant % 2 === 0 ? "sergeant" : "rifleman";
  }
  return variant % 4 === 0 ? "scout" : "rifleman";
}

function deriveCurrentNeed(needs: TownWarNeedState, healthCurrent: number, healthMax: number, ammoReserve: number): TownWarCurrentNeedId {
  if (healthMax > 0 && healthCurrent / healthMax < 0.55) {
    return "wounded";
  }
  if (ammoReserve <= 0) {
    return "low-ammo";
  }
  if (needs.morale < 0.35) {
    return "shaken";
  }
  if (needs.fatigue > 0.58) {
    return "tired";
  }
  if (needs.hunger > 0.55) {
    return "hungry";
  }
  return "ready";
}

function deriveTrustLabel(trustInOfficer: number): string {
  if (trustInOfficer >= 0.68) {
    return "steady";
  }
  if (trustInOfficer >= 0.48) {
    return "strained";
  }
  return "resentful";
}

function buildIdentitySummary(
  skills: TownWarSkillState,
  traits: TownWarTraitId[],
  currentNeed: TownWarCurrentNeedId,
  trustInOfficer: number
): TownWarSoldierIdentitySummary {
  const topSkills = Object.entries(skills).sort((left, right) => right[1] - left[1]);
  const [bestSkill, bestValue] = topSkills[0] ?? ["construction", 0];
  const [riskSkill, riskValue] =
    topSkills
      .filter(([skill]) => skill === "nerve" || skill === "perception" || skill === "endurance")
      .sort((left, right) => left[1] - right[1])[0] ?? ["nerve", skills.nerve];
  const traitRisk = traits.includes("reckless")
    ? "reckless"
    : traits.includes("shaken")
      ? "shaken"
      : `${getSkillLabel(riskSkill as TownWarSkillId)} ${riskValue}`;

  return {
    bestSkills: getTopSkillSummary(skills),
    usefulSkill: `${getSkillLabel(bestSkill as TownWarSkillId)} ${bestValue}`,
    risk: traitRisk,
    trust: deriveTrustLabel(trustInOfficer),
    currentNeed
  };
}

function createSoldierIdentity(input: {
  id: string;
  role: TownWarRoleId;
  faction: TownWarFactionId;
  healthCurrent: number;
  healthMax: number;
  ammoReserve: number;
  spawnReason: "initial" | "reinforcement" | "script";
}): Pick<
  TownWarSoldierState,
  "displayName" | "archetype" | "skills" | "traits" | "needs" | "workPriorities" | "currentNeed" | "experience" | "identitySummary"
> {
  const numericId = Number.parseInt(input.id.replace(/\D+/g, ""), 10) || 0;
  const campBias = input.faction === "camp-a" ? 1 : -1;
  const variant = numericId + (input.faction === "camp-b" ? 5 : 0);
  const skills = createBaseSkills();
  const workPriorities = createBaseWorkPriorities();
  const traits: TownWarTraitId[] = [];
  const archetype = pickRoleArchetype(input.role, variant);

  if (input.role === "builder") {
    skills.construction = 7 + campBias + (variant % 2);
    skills.engineering = 5 + (variant % 3);
    skills.logistics = 4 + (variant % 2);
    skills.nerve = 4 - campBias + (variant % 2);
    workPriorities.Build = 5;
    workPriorities.Repair = 4;
    workPriorities.Haul = 3;
    traits.push(variant % 2 === 0 ? "steady-hands" : "cautious");
  } else if (input.role === "medic") {
    skills.medical = 8;
    skills.social = 5 + (variant % 2);
    skills.perception = 5;
    skills.nerve = 5;
    workPriorities.Rescue = 5;
    workPriorities.Medic = 5;
    workPriorities.Rest = 3;
    traits.push("steady-hands");
  } else if (input.role === "suppressor") {
    skills.suppression = 8;
    skills.shooting = 6;
    skills.logistics = 4;
    skills.nerve = 5 + (variant % 2);
    workPriorities.Suppress = 5;
    workPriorities.Resupply = 3;
    workPriorities.Defend = 4;
    traits.push(variant % 2 === 0 ? "brave" : "reckless");
  } else if (input.role === "defender") {
    skills.shooting = 5;
    skills.suppression = 5;
    skills.nerve = 6;
    skills.leadership = 5 + (variant % 2);
    workPriorities.Defend = 5;
    workPriorities.Suppress = 3;
    workPriorities.Assault = 2;
    traits.push(variant % 2 === 0 ? "loyal" : "natural-leader");
  } else {
    skills.shooting = 6;
    skills.perception = 5 + (variant % 2);
    skills.nerve = 5;
    skills.endurance = 5;
    workPriorities.Defend = 4;
    workPriorities.Assault = 3;
    workPriorities.Scout = 3;
    traits.push(variant % 3 === 0 ? "brave" : "fast-learner");
  }

  if (!traits.includes("field-cook") && variant % 7 === 0) {
    traits.push("field-cook");
    skills.cooking = Math.max(skills.cooking, 6);
    workPriorities.Cook = Math.max(workPriorities.Cook, 3);
  }

  for (const skill of TOWN_WAR_SKILLS) {
    const variation = ((variant + skill.length) % 3) - 1;
    skills[skill] = clampSkill(skills[skill] + variation);
  }

  const needs: TownWarNeedState = {
    fatigue: clampNeed(0.08 + (variant % 5) * 0.07),
    hunger: clampNeed(0.06 + (variant % 4) * 0.06),
    morale: clampNeed(0.54 + (skills.nerve - 4) * 0.045)
  };
  const currentNeed = deriveCurrentNeed(needs, input.healthCurrent, input.healthMax, input.ammoReserve);
  const trustInOfficer = 0.55 + (traits.includes("loyal") ? 0.12 : 0) - (traits.includes("resentful") ? 0.18 : 0);

  return {
    displayName: `${TOWN_WAR_NAMES[variant % TOWN_WAR_NAMES.length]} ${input.faction === TOWN_WAR_PLAYER_FACTION ? "Rus" : "Ukr"}-${numericId || variant}`,
    archetype,
    skills,
    traits,
    needs,
    workPriorities,
    currentNeed,
    experience: {
      operations: input.spawnReason === "initial" ? 1 : 0,
      buildsCompleted: 0,
      rescuesCompleted: 0,
      kills: 0,
      woundsTreated: 0,
      trenchesHeld: 0
    },
    identitySummary: buildIdentitySummary(skills, traits, currentNeed, trustInOfficer)
  };
}

function createIdleTacticalIntent(reason: string, seconds: number): TownWarTacticalIntentState {
  return {
    state: "idle",
    reason,
    coverSlotId: null,
    partnerId: null,
    pressureRatio: 0,
    lastUpdatedAtSeconds: seconds
  };
}

function createNoCoverIntent(reason: string): TownWarCoverIntentState {
  return {
    coverSlotId: null,
    state: "none",
    reason
  };
}

function getDistance(a: Vec2, b: Vec2): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function getDeterministicUnit(seed: number): number {
  const value = Math.sin(seed) * 10000;
  return value - Math.floor(value);
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.max(min, Math.min(max, value));
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

function uniqueLimited<T>(values: T[], limit: number): T[] {
  return [...new Set(values)].slice(0, limit);
}

function getTrailingIdNumber(value: string): number {
  if (typeof value !== "string") {
    return 0;
  }
  const match = value.match(/(\d+)\s*$/);
  if (!match) {
    return 0;
  }
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildSoldierId(state: TownWarState): string {
  const id = `town-war-soldier-${state.nextSoldierId}`;
  state.nextSoldierId += 1;
  return id;
}

function buildOrderId(state: TownWarState): string {
  const id = `town-war-order-${state.nextOrderId}`;
  state.nextOrderId += 1;
  return id;
}

function buildAmmoCrateId(state: TownWarState): string {
  const id = `town-war-ammo-crate-${state.nextCrateId}`;
  state.nextCrateId += 1;
  return id;
}

function buildDugoutId(state: TownWarState): string {
  const id = `town-war-dugout-${state.nextDugoutId}`;
  state.nextDugoutId += 1;
  return id;
}

function buildCasualtyId(state: TownWarState): string {
  const id = `town-war-casualty-${state.nextCasualtyId}`;
  state.nextCasualtyId += 1;
  return id;
}

function buildCoverSlotId(state: TownWarState, sourceKind: TownWarCoverSlotState["sourceKind"]): string {
  return `town-war-cover-${sourceKind}-${state.aiTactics.coverSlots.length + 1}`;
}

function buildChatterId(state: TownWarState): string {
  const id = `town-war-chatter-${state.nextChatterId}`;
  state.nextChatterId += 1;
  return id;
}

function normalizeAngleRadians(angle: number): number {
  if (!Number.isFinite(angle)) {
    return 0;
  }
  const fullTurn = Math.PI * 2;
  return ((angle % fullTurn) + fullTurn) % fullTurn;
}

function buildDramaEventId(state: TownWarState): string {
  const id = `town-war-drama-${state.nextDramaEventId}`;
  state.nextDramaEventId += 1;
  return id;
}

function buildDramaMemoryId(state: TownWarState): string {
  const id = `town-war-memory-${state.nextDramaMemoryId}`;
  state.nextDramaMemoryId += 1;
  return id;
}

function buildDramaBeatId(state: TownWarState): string {
  const id = `town-war-beat-${state.nextDramaBeatId}`;
  state.nextDramaBeatId += 1;
  return id;
}

function buildDebriefEchoId(state: TownWarState): string {
  const id = `town-war-debrief-${state.nextDebriefEchoId}`;
  state.nextDebriefEchoId += 1;
  return id;
}

function buildFlankId(state: TownWarState): string {
  const id = `town-war-flank-${state.nextFlankId}`;
  state.nextFlankId += 1;
  return id;
}

function buildSkillOutcomeId(state: TownWarState): string {
  const id = `town-war-skill-outcome-${state.nextSkillOutcomeId}`;
  state.nextSkillOutcomeId += 1;
  return id;
}

export class TownWarController {
  state: TownWarState = createTownWarState();
  private demoSeeded = false;
  private chatterCooldownSecondsByKey = new Map<string, number>();
  private buildPlacementPreview: TownWarBuildPlacementPreviewState = {
    kind: null,
    faction: null,
    position: null,
    facingAngleRadians: 0,
    valid: false
  };

  private getCamp(campId: TownWarFactionId): TownWarCampState | null {
    return this.state.camps.find((camp) => camp.id === campId) ?? null;
  }

  private getCampSpawn(campId: TownWarFactionId): TownWarCampState["spawn"] {
    const camp = this.getCamp(campId);
    if (camp) {
      return camp.spawn;
    }

      return {
        position: {
          x: campId === "camp-a" ? WORLD_WIDTH * 0.68 : WORLD_WIDTH * 0.32,
          y: WORLD_HEIGHT * 0.5
        },
        radius: 70,
        lastReinforcementAtSeconds: 0,
        totalSpawned: 0
      };
    }

  private getCampLineX(campId: TownWarFactionId): number {
    const camp = this.getCamp(campId);
    return camp?.spawn.position.x ?? (campId === "camp-a" ? WORLD_WIDTH * 0.68 : WORLD_WIDTH * 0.32);
  }

  private getCampFrontlineX(campId: TownWarFactionId, offset: number): number {
    return this.getCampLineX(campId) + (campId === "camp-a" ? -offset : offset);
  }

  private getOpposingCampId(campId: TownWarFactionId): TownWarFactionId {
    return campId === "camp-a" ? "camp-b" : "camp-a";
  }

  private computeRiskTier(campId: TownWarFactionId, position: Vec2): TownWarOfficerRiskTier {
    const campLineX = this.getCampLineX(campId);
    const forwardOffset = campId === "camp-a" ? campLineX - position.x : position.x - campLineX;
    return forwardOffset > 220 ? "high" : forwardOffset > 140 ? "medium" : "low";
  }

  private getExposureForRisk(riskTier: TownWarOfficerRiskTier): number {
    return riskTier === "high" ? 0.78 : riskTier === "medium" ? 0.46 : 0.18;
  }

  private createBuildExecution(campId: TownWarFactionId, position: Vec2): TownWarBuildExecutionState {
    const riskTier = this.computeRiskTier(campId, position);
    return {
      progress: 0,
      requiredProgress: BUILD_PROGRESS_REQUIRED,
      buildRate: 0,
      stalled: false,
      stallReason: null,
      supportingSuppressorId: null,
      supportAmmoState: "none",
      coverFireSupport: 0,
      exposure: this.getExposureForRisk(riskTier),
      outcomeCause: null,
      causeChain: [`risk-${riskTier}`, `exposure-${this.getExposureForRisk(riskTier).toFixed(2)}`],
      lastUpdatedAtSeconds: this.state.clock.seconds
    };
  }

  private getSeverityUrgency(severity: TownWarCasualtySeverity): number {
    return severity === "critical" ? 18 : severity === "serious" ? 12 : 6;
  }

  private getRequiredTreatment(severity: TownWarCasualtySeverity): number {
    return severity === "critical" ? 100 : severity === "serious" ? 72 : 44;
  }

  private getCoveredRescuePath(faction: TownWarFactionId, position: Vec2, casualtyId?: string | null): number {
    const nearbyCover =
      this.state.aiTactics.coverSlots
        .filter((slot) => (slot.faction === null || slot.faction === faction) && getDistance(slot.position, position) <= 150)
        .map((slot) => slot.protection)
        .sort((left, right) => right - left)[0] ?? 0;
    const suppressionCover =
      this.state.soldiers
        .filter(
          (soldier) =>
            soldier.faction === faction &&
            soldier.health.current > 0 &&
            soldier.task.kind === "suppress" &&
            (soldier.task.targetEntityId === casualtyId || getDistance(soldier.position, position) <= 620)
        )
        .map((soldier) => {
          const ammoTotal = soldier.ammo.inMag + soldier.ammo.reserve;
          if (ammoTotal <= 0) {
            return 0;
          }
          const supportAnchor = soldier.task.targetEntityId === casualtyId && soldier.task.targetPosition ? soldier.task.targetPosition : soldier.position;
          const distanceFit = clamp(1 - getDistance(supportAnchor, position) / 760, 0, 1);
          const skillFit = clamp((soldier.skills.suppression + soldier.skills.shooting * 0.4) / 13, 0, 1);
          return distanceFit * skillFit;
        })
        .sort((left, right) => right - left)[0] ?? 0;
    return Number(clamp(Math.max(nearbyCover, suppressionCover), 0, 1).toFixed(2));
  }

  private pushCasualtyCause(casualty: TownWarCasualtyState, cause: string): void {
    casualty.causeChain = uniqueLimited([...casualty.causeChain, cause], 12);
  }

  private scoreRescueCandidate(
    medic: TownWarSoldierState,
    casualty: TownWarCasualtyState
  ): { score: number; reason: string; pathRisk: number; coveredPath: number; blockedReason: string | null } {
    const riskTier = this.computeRiskTier(casualty.faction, casualty.position);
    const exposure = this.getExposureForRisk(riskTier);
    const coveredPath = this.getCoveredRescuePath(casualty.faction, casualty.position, casualty.id);
    const pathRisk = Number(clamp(exposure - coveredPath * 0.55, 0, 1).toFixed(2));
    const attachment = medic.dramaArc.protectiveOfSoldierIds.includes(casualty.soldierId)
      ? 12
      : medic.dramaArc.trustBySoldierId[casualty.soldierId]
        ? 6
        : 0;
    const priority = clamp(Math.max(medic.workPriorities.Rescue ?? 0, medic.workPriorities.Medic ?? 0), 0, 5) * 10;
    const skill = medic.skills.medical * 2 + medic.skills.social * 0.8 + medic.skills.nerve * 0.7;
    const urgency = this.getSeverityUrgency(casualty.severity);
    const fatiguePenalty = medic.needs.fatigue * 9;
    const riskPenalty = pathRisk * 24 + (medic.skills.nerve <= 3 ? pathRisk * 12 : 0);
    const distancePenalty = clamp(getDistance(medic.position, casualty.position) / 115, 0, 12);
    const score = Number((priority + skill + urgency + attachment + coveredPath * 16 - riskPenalty - fatiguePenalty - distancePenalty).toFixed(2));
    const blockedReason =
      medic.health.current <= 0
        ? "medic down"
        : medic.skills.nerve <= 3 && pathRisk >= 0.55 && attachment < 10
          ? "medic waiting for suppression"
          : coveredPath <= 0.12 && pathRisk >= 0.65
            ? "no covered rescue path"
            : null;
    const reason =
      `priority ${priority.toFixed(0)} + medical ${medic.skills.medical} + social ${medic.skills.social} + urgency ${urgency.toFixed(0)} ` +
      `+ cover ${coveredPath.toFixed(2)} - risk ${pathRisk.toFixed(2)} - fatigue ${medic.needs.fatigue.toFixed(2)}`;
    return { score, reason, pathRisk, coveredPath, blockedReason };
  }

  private pickCampSpawnPosition(campId: TownWarFactionId, role: TownWarRoleId): Vec2 {
    const spawn = this.getCampSpawn(campId);
    const laneOffset = role === "builder" ? -80 : role === "rifleman" ? 40 : role === "suppressor" ? -20 : 0;
    const seedBase = this.state.nextSoldierId * 97 + (campId === "camp-a" ? 13 : 37) + laneOffset * 0.01;
    const angle = getDeterministicUnit(seedBase) * Math.PI * 2;
    const radius = Math.max(0, spawn.radius);
    const r = Math.sqrt(getDeterministicUnit(seedBase + 0.5)) * radius;

    return {
      x: spawn.position.x + Math.cos(angle) * r,
      y: spawn.position.y + laneOffset + Math.sin(angle) * r
    };
  }

  private findSoldierById(soldierId: string): TownWarSoldierState | null {
    return this.state.soldiers.find((soldier) => soldier.id === soldierId || soldier.displayName === soldierId) ?? null;
  }

  private isPriorityWork(work: string): work is TownWarWorkPriorityId {
    return TOWN_WAR_WORK_PRIORITIES.includes(work as TownWarWorkPriorityId);
  }

  private isCampWork(work: string): work is TownWarCampWorkPriorityId {
    return work === "Cook" || work === "Resupply" || work === "Rest";
  }

  private getTaskKindForWork(work: TownWarWorkPriorityId): TownWarTask["kind"] {
    if (work === "Build" || work === "Repair") {
      return "build";
    }
    if (work === "Rescue" || work === "Medic") {
      return "heal";
    }
    if (work === "Resupply" || work === "Haul") {
      return "resupply";
    }
    if (work === "Suppress") {
      return "suppress";
    }
    if (work === "Defend" || work === "Scout") {
      return "defend";
    }
    if (work === "Assault") {
      return "attack";
    }
    return "hold";
  }

  private getSkillFitForWork(soldier: TownWarSoldierState, work: TownWarWorkPriorityId): number {
    const skills = soldier.skills;
    if (work === "Build" || work === "Repair") {
      return skills.construction * 1.6 + skills.engineering * 0.8 + skills.endurance * 0.25;
    }
    if (work === "Rescue" || work === "Medic") {
      return skills.medical * 1.65 + skills.social * 0.55 + skills.nerve * 0.35;
    }
    if (work === "Resupply" || work === "Haul") {
      return skills.logistics * 1.45 + skills.endurance * 0.8 + skills.nerve * 0.25;
    }
    if (work === "Suppress") {
      return skills.suppression * 1.55 + skills.shooting * 0.6 + skills.logistics * 0.35 + skills.nerve * 0.3;
    }
    if (work === "Defend") {
      return skills.shooting * 1.05 + skills.nerve * 0.7 + skills.perception * 0.45 + skills.leadership * 0.25;
    }
    if (work === "Scout") {
      return skills.perception * 1.45 + skills.stealth * 0.85 + skills.nerve * 0.35 + skills.endurance * 0.25;
    }
    if (work === "Assault") {
      return skills.shooting * 1.1 + skills.nerve * 0.8 + skills.endurance * 0.4;
    }
    if (work === "Cook") {
      return skills.cooking * 1.5 + skills.social * 0.35;
    }
    return skills.endurance + skills.nerve * 0.4;
  }

  private getFriendlyAmmoNeed(campId: TownWarFactionId): number {
    let need = 0;
    for (const soldier of this.state.soldiers) {
      if (soldier.faction !== campId || soldier.health.current <= 0) {
        continue;
      }
      const totalAmmo = soldier.ammo.inMag + soldier.ammo.reserve;
      const desired =
        soldier.task.kind === "suppress"
          ? Math.max(1, Math.floor(soldier.ammo.maxMag * 3))
          : Math.max(1, Math.floor(soldier.ammo.maxMag * 2));
      if (totalAmmo < desired) {
        need += clamp((desired - totalAmmo) / Math.max(1, desired), 0, 1);
      }
    }
    return clamp(need, 0, 3);
  }

  private getFriendlyRescueNeed(campId: TownWarFactionId): number {
    return clamp(
      this.state.casualties.filter(
        (casualty) => casualty.faction === campId && (casualty.status === "wounded" || casualty.status === "downed")
      ).length +
        this.state.soldiers.filter((soldier) => soldier.faction === campId && soldier.health.current / soldier.health.max < 0.55).length,
      0,
      4
    );
  }

  private getCampSustainment(campId: TownWarFactionId): TownWarCampState["sustainment"] | null {
    return this.getCamp(campId)?.sustainment ?? null;
  }

  private getCampWorkPriority(campId: TownWarFactionId, work: TownWarCampWorkPriorityId): number {
    return clamp(this.getCampSustainment(campId)?.workPriorities[work] ?? 2, 0, 5);
  }

  private getCampSustainmentScore(campId: TownWarFactionId, work: TownWarCampWorkPriorityId): number {
    const soldiers = this.state.soldiers.filter((soldier) => soldier.faction === campId && soldier.health.current > 0);
    if (soldiers.length <= 0) {
      return 0;
    }

    const campPriority = this.getCampWorkPriority(campId, work);
    const score = soldiers.reduce((total, soldier) => {
      const soldierPriority =
        work === "Cook"
          ? soldier.workPriorities.Cook ?? 0
          : work === "Resupply"
            ? Math.max(soldier.workPriorities.Resupply ?? 0, soldier.workPriorities.Haul ?? 0)
            : soldier.workPriorities.Rest ?? 0;
      const activePriority = Math.max(soldierPriority, campPriority);
      if (activePriority <= 0) {
        return total;
      }
      if (work === "Cook") {
        return total + soldier.skills.cooking * 1.8 + soldier.skills.social * 0.45 + activePriority * 1.2;
      }
      if (work === "Resupply") {
        return total + soldier.skills.logistics * 1.65 + soldier.skills.endurance * 0.45 + activePriority * 1.25;
      }
      return total + soldier.skills.endurance * 1.35 + soldier.skills.social * 0.35 + activePriority * 1.15;
    }, 0);

    return Number((score / Math.max(1, Math.sqrt(soldiers.length))).toFixed(2));
  }

  private scoreTaskCandidate(input: {
    soldier: TownWarSoldierState;
    work: TownWarWorkPriorityId;
    targetPosition?: Vec2 | null;
    urgency?: number;
    supplyNeed?: number;
    riskTier?: TownWarOfficerRiskTier;
    reason?: string;
  }): TownWarTaskCandidateState {
    const { soldier, work } = input;
    const priority = clamp(soldier.workPriorities[work] ?? 0, 0, 5) * 10;
    const skillFit = this.getSkillFitForWork(soldier, work);
    const riskPenalty = input.riskTier === "high" ? 7 : input.riskTier === "medium" ? 3 : 0;
    const fatiguePenalty = work === "Rest" ? 0 : soldier.needs.fatigue * 9;
    const safety = -(riskPenalty * clamp((6 - soldier.skills.nerve) / 5, 0, 1)) - fatiguePenalty;
    const morale =
      work === "Rest"
        ? soldier.needs.fatigue * 18 + (1 - soldier.needs.morale) * 8
        : soldier.needs.morale * 4 - (1 - soldier.needs.morale) * 4;
    const distance = input.targetPosition ? clamp(7 - getDistance(soldier.position, input.targetPosition) / 90, -9, 7) : 0;
    const supplyNeed = input.supplyNeed ?? 0;
    const urgency = input.urgency ?? 0;
    const scoreParts = {
      priority,
      skillFit,
      urgency,
      safety,
      morale,
      supplyNeed,
      distance
    };

    let blockedReason: string | null = null;
    if (soldier.health.current <= 0) {
      blockedReason = "soldier down";
    } else if (work !== "Rest" && soldier.needs.fatigue >= 0.72 && soldier.workPriorities.Rest >= 4) {
      blockedReason = "rest priority overrides noncritical work";
    } else if (input.riskTier === "high" && soldier.skills.nerve <= 3 && (work === "Build" || work === "Resupply" || work === "Rescue")) {
      blockedReason = "low nerve resists exposed work";
    }

    const score = Object.values(scoreParts).reduce((total, value) => total + value, 0) - (blockedReason ? 18 : 0);
    const reason =
      input.reason ??
      `${work}: priority ${soldier.workPriorities[work] ?? 0}, skill ${skillFit.toFixed(1)}, urgency ${urgency.toFixed(1)}, safety ${safety.toFixed(1)}`;

    return {
      work,
      taskKind: this.getTaskKindForWork(work),
      score: Number(score.toFixed(2)),
      reason,
      blockedReason,
      scoreParts: {
        priority: Number(priority.toFixed(2)),
        skillFit: Number(skillFit.toFixed(2)),
        urgency: Number(urgency.toFixed(2)),
        safety: Number(safety.toFixed(2)),
        morale: Number(morale.toFixed(2)),
        supplyNeed: Number(supplyNeed.toFixed(2)),
        distance: Number(distance.toFixed(2))
      }
    };
  }

  private buildTaskCandidates(
    soldier: TownWarSoldierState,
    targetPosition?: Vec2 | null,
    riskTier?: TownWarOfficerRiskTier | null
  ): TownWarTaskCandidateState[] {
    const camp = this.getCamp(soldier.faction);
    const pendingBuildOrders = this.state.orders.filter((order) => order.faction === soldier.faction && order.status === "assigned").length;
    const activeFriendlyBuild = this.state.soldiers.some(
      (entry) => entry.faction === soldier.faction && entry.id !== soldier.id && entry.task.kind === "build"
    );
    const ammoNeed = this.getFriendlyAmmoNeed(soldier.faction);
    const rescueNeed = this.getFriendlyRescueNeed(soldier.faction);
    const actualRiskTier = riskTier ?? (targetPosition ? this.computeRiskTier(soldier.faction, targetPosition) : "low");
    const hasSupplyCrate = this.state.ammoCrates.some((crate) => crate.faction === soldier.faction && crate.destroyedAtSeconds === null && crate.ammo > 0);
    const campAmmoNeed = camp ? clamp((250 - camp.supply.ammo) / 80, 0, 3) : 0;
    const sustainment = this.getCampSustainment(soldier.faction);
    const ammoFlowNeed = sustainment ? clamp((1 - sustainment.ammoFlow) * 3, 0, 3) : 0;
    const cookNeed = sustainment ? clamp((1 - sustainment.cookEffect) * 3 + sustainment.hungerAverage * 2, 0, 5) : 0;

    return (["Build", "Rescue", "Medic", "Resupply", "Haul", "Defend", "Suppress", "Rest", "Cook", "Scout"] as TownWarWorkPriorityId[])
      .map((work) =>
        this.scoreTaskCandidate({
          soldier,
          work,
          targetPosition,
          riskTier: actualRiskTier,
          urgency:
            work === "Build"
              ? pendingBuildOrders > 0 || soldier.task.kind === "build"
                ? 14
                : 7
              : work === "Suppress"
                ? activeFriendlyBuild
                  ? 12
                  : 6
                : work === "Resupply" || work === "Haul"
                ? ammoNeed > 0
                  ? 10
                  : 3
                  + ammoFlowNeed * 2
                : work === "Rescue" || work === "Medic"
                  ? rescueNeed > 0
                    ? 11
                    : 2
                : work === "Rest"
                  ? soldier.needs.fatigue * 12 + (sustainment?.workPriorities.Rest ?? 0)
                  : work === "Cook"
                    ? cookNeed * 4 + (sustainment?.workPriorities.Cook ?? 0) * 2
                    : work === "Scout"
                      ? 5
                      : 4,
          supplyNeed:
            work === "Resupply" || work === "Haul"
              ? ammoNeed * 8 + campAmmoNeed + ammoFlowNeed * 4 + (hasSupplyCrate ? 2 : 0)
              : work === "Build"
                ? camp?.supply.build && camp.supply.build > 0
                  ? 2
                  : -8
              : work === "Rescue" || work === "Medic"
                ? rescueNeed * 5
                : work === "Cook"
                  ? cookNeed * 5 + (camp?.supply.food && camp.supply.food > 0 ? 2 : -8)
                  : 0,
          reason:
            work === "Build"
              ? "build orders want construction skill, close distance, and enough nerve for exposed digging"
              : work === "Suppress"
                ? "suppressors protect builders and hold lanes when construction is exposed"
                : work === "Resupply" || work === "Haul"
                  ? "logistics soldiers answer low ammo and reachable crate/camp supply"
                  : work === "Rescue" || work === "Medic"
                    ? "medics favor wounded allies over routine defense"
                    : work === "Rest"
                      ? "fatigue and morale can override noncritical work"
                      : work === "Cook"
                        ? "camp cooking improves fatigue recovery, morale, and readiness"
                        : work === "Scout"
                          ? "perception and stealth watch flanks before contact"
                          : "rifle skill, nerve, and morale hold the line"
        })
      )
      .sort((left, right) => right.score - left.score);
  }

  private refreshTaskDecisionForSoldier(
    soldier: TownWarSoldierState,
    targetPosition?: Vec2 | null,
    riskTier?: TownWarOfficerRiskTier | null,
    selectedWork?: TownWarWorkPriorityId | null
  ): TownWarTaskDecisionState {
    const candidates = this.buildTaskCandidates(soldier, targetPosition, riskTier);
    const selectedCandidate = selectedWork
      ? candidates.find((candidate) => candidate.work === selectedWork) ?? candidates[0] ?? null
      : candidates[0] ?? null;
    soldier.taskDecision = {
      selectedWork: selectedCandidate?.work ?? null,
      selectedReason: selectedCandidate?.reason ?? null,
      selectedScore: selectedCandidate?.score ?? 0,
      blockedReason: selectedCandidate?.blockedReason ?? null,
      candidates: candidates.slice(0, 7),
      lastUpdatedAtSeconds: this.state.clock.seconds
    };
    return soldier.taskDecision;
  }

  private pickSoldierForWork(
    campId: TownWarFactionId,
    work: TownWarWorkPriorityId,
    targetPosition?: Vec2 | null,
    riskTier?: TownWarOfficerRiskTier | null
  ): { soldier: TownWarSoldierState; candidate: TownWarTaskCandidateState } | null {
    const ranked = this.state.soldiers
      .filter((soldier) => soldier.faction === campId && soldier.health.current > 0 && soldier.task.kind !== "build")
      .map((soldier) => {
        const candidates = this.buildTaskCandidates(soldier, targetPosition, riskTier);
        return {
          soldier,
          candidate: candidates.find((candidate) => candidate.work === work) ?? candidates[0]
        };
      })
      .filter((entry): entry is { soldier: TownWarSoldierState; candidate: TownWarTaskCandidateState } => Boolean(entry.candidate))
      .sort((left, right) => right.candidate.score - left.candidate.score);

    return ranked[0] ?? null;
  }

  private pickAvailableSoldierForColonyWork(
    campId: TownWarFactionId,
    work: TownWarWorkPriorityId,
    targetPosition?: Vec2 | null,
    riskTier?: TownWarOfficerRiskTier | null,
    excludedIds = new Set<string>()
  ): { soldier: TownWarSoldierState; candidate: TownWarTaskCandidateState } | null {
    const lockedTaskKinds = new Set<TownWarTask["kind"]>(["build", "heal", "resupply"]);
    const ranked = this.state.soldiers
      .filter((soldier) => soldier.faction === campId && soldier.health.current > 0)
      .filter((soldier) => !excludedIds.has(soldier.id))
      .filter((soldier) => !lockedTaskKinds.has(soldier.task.kind))
      .filter((soldier) => soldier.currentNeed !== "wounded")
      .map((soldier) => {
        const candidate = this.scoreTaskCandidate({
          soldier,
          work,
          targetPosition,
          riskTier: riskTier ?? (targetPosition ? this.computeRiskTier(campId, targetPosition) : "low"),
          urgency: work === "Suppress" ? 13 : work === "Rescue" || work === "Medic" ? 15 : work === "Resupply" || work === "Haul" ? 11 : 8,
          supplyNeed: work === "Rescue" || work === "Medic" ? this.getFriendlyRescueNeed(campId) * 7 : work === "Resupply" || work === "Haul" ? this.getFriendlyAmmoNeed(campId) * 7 : 0
        });
        return { soldier, candidate };
      })
      .filter((entry) => entry.candidate.score >= (entry.candidate.blockedReason ? 45 : 34))
      .sort((left, right) => right.candidate.score - left.candidate.score);

    return ranked[0] ?? null;
  }

  private recordSelectedWork(
    soldier: TownWarSoldierState,
    work: TownWarWorkPriorityId,
    targetPosition?: Vec2 | null,
    riskTier?: TownWarOfficerRiskTier | null
  ): void {
    this.refreshTaskDecisionForSoldier(soldier, targetPosition, riskTier, work);
  }

  private findAmmoCrate(id: string): TownWarAmmoCrateState | null {
    return this.state.ammoCrates.find((crate) => crate.id === id) ?? null;
  }

  private findAmmoCrateFromOrder(orderId: string): TownWarAmmoCrateState | null {
    return this.state.ammoCrates.find((crate) => crate.builtFromOrderId === orderId) ?? null;
  }

  private findDugoutFromOrder(orderId: string): TownWarDugoutState | null {
    return this.state.dugouts.find((dugout) => dugout.builtFromOrderId === orderId) ?? null;
  }

  private findDugout(id: string | null | undefined): TownWarDugoutState | null {
    if (!id) {
      return null;
    }
    return this.state.dugouts.find((dugout) => dugout.id === id) ?? null;
  }

  private getActiveDugouts(faction: TownWarFactionId): TownWarDugoutState[] {
    return this.state.dugouts.filter((dugout) => dugout.faction === faction && dugout.destroyedAtSeconds === null && dugout.status !== "destroyed");
  }

  private getNearestActiveDugout(faction: TownWarFactionId, position: Vec2, maxDistance = DUGOUT_SHELTER_RADIUS): TownWarDugoutState | null {
    return this.getActiveDugouts(faction).reduce<{ dugout: TownWarDugoutState; distance: number } | null>((best, dugout) => {
      const distance = getDistance(dugout.position, position);
      if (distance > maxDistance) {
        return best;
      }
      if (!best || distance < best.distance) {
        return { dugout, distance };
      }
      return best;
    }, null)?.dugout ?? null;
  }

  private getDugoutForCoverSlot(slotId: string | null | undefined): TownWarDugoutState | null {
    if (!slotId) {
      return null;
    }
    return this.getActiveDugouts("camp-a").concat(this.getActiveDugouts("camp-b")).find((dugout) => dugout.connectedTrenchSlotIds.includes(slotId)) ?? null;
  }

  private findCoverSlot(id: string | null | undefined): TownWarCoverSlotState | null {
    if (!id) {
      return null;
    }
    return this.state.aiTactics.coverSlots.find((slot) => slot.id === id) ?? null;
  }

  private findOrder(orderId: string | null | undefined): TownWarBuildOrderState | null {
    if (!orderId) {
      return null;
    }
    return this.state.orders.find((order) => order.id === orderId) ?? null;
  }

  private findCasualty(casualtyId: string | null | undefined): TownWarCasualtyState | null {
    if (!casualtyId) {
      return null;
    }
    return this.state.casualties.find((casualty) => casualty.id === casualtyId || casualty.soldierId === casualtyId) ?? null;
  }

  private pushCause(order: TownWarBuildOrderState, cause: string): void {
    if (!order.build.causeChain.includes(cause)) {
      order.build.causeChain.push(cause);
    }
  }

  private getBuildFeedbackStage(order: TownWarBuildOrderState): string {
    if (order.status === "completed") {
      return `complete via ${order.build.outcomeCause ?? "finished"}`;
    }
    if (order.build.stalled) {
      return `stalled: ${order.build.stallReason ?? "unknown"}`;
    }
    if (order.build.progress <= 0 && order.build.buildRate <= 0) {
      return "builder en route";
    }
    const progressPercent =
      order.build.requiredProgress > 0 ? Math.round((order.build.progress / order.build.requiredProgress) * 100) : 0;
    const support =
      order.build.coverFireSupport >= 0.45
        ? "covered"
        : order.build.coverFireSupport >= 0.2
          ? "partly covered"
          : "exposed";
    return `${progressPercent}% ${support} @ ${order.build.buildRate}/s`;
  }

  private addCoverSlot(input: {
    faction: TownWarFactionId | null;
    lane?: TownWarOfficerLaneId;
    label: string;
    sourceKind: TownWarCoverSlotState["sourceKind"];
    sourceId: string | null;
    position: Vec2;
    facing: TownWarFactionId;
    facingAngleRadians?: number;
    exposure: number;
    protection: number;
  }): TownWarCoverSlotState {
    const existing =
      input.sourceId !== null
        ? this.state.aiTactics.coverSlots.find((slot) => slot.sourceKind === input.sourceKind && slot.sourceId === input.sourceId) ?? null
        : null;
    if (existing) {
      return existing;
    }

    const slot: TownWarCoverSlotState = {
      id: buildCoverSlotId(this.state, input.sourceKind),
      faction: input.faction,
      lane: input.lane ?? this.state.officer.focusedLane,
      label: input.label,
      sourceKind: input.sourceKind,
      sourceId: input.sourceId,
      position: cloneVec2(input.position),
      facing: input.facing,
      facingAngleRadians: normalizeAngleRadians(input.facingAngleRadians ?? (input.facing === "camp-a" ? Math.PI : 0)),
      exposure: clamp01(input.exposure),
      protection: clamp01(input.protection),
      occupiedBySoldierId: null,
      createdAtSeconds: this.state.clock.seconds
    };
    this.state.aiTactics.coverSlots.push(slot);
    return slot;
  }

  private ensureDefaultCoverSlots(): void {
    const focus = this.getFrontlineFocusPosition("mid");
    const definitions: Array<{
      faction: TownWarFactionId | null;
      label: string;
      sourceKind: TownWarCoverSlotState["sourceKind"];
      sourceId: string;
      position: Vec2;
      facing: TownWarFactionId;
      exposure: number;
      protection: number;
    }> = [
      {
        faction: "camp-a",
        label: "west crater lip",
        sourceKind: "crater",
        sourceId: "west-crater-lip",
        position: { x: focus.x + 140, y: focus.y + 36 },
        facing: "camp-b",
        exposure: 0.42,
        protection: 0.3
      },
      {
        faction: "camp-a",
        label: "market wall firing cut",
        sourceKind: "ruin",
        sourceId: "market-wall-a",
        position: { x: focus.x + 180, y: focus.y - 70 },
        facing: "camp-b",
        exposure: 0.34,
        protection: 0.38
      },
      {
        faction: "camp-b",
        label: "east crater lip",
        sourceKind: "crater",
        sourceId: "east-crater-lip",
        position: { x: focus.x - 140, y: focus.y - 36 },
        facing: "camp-a",
        exposure: 0.42,
        protection: 0.3
      },
      {
        faction: "camp-b",
        label: "school wall firing cut",
        sourceKind: "ruin",
        sourceId: "school-wall-b",
        position: { x: focus.x - 180, y: focus.y + 70 },
        facing: "camp-a",
        exposure: 0.34,
        protection: 0.38
      }
    ];

    for (const definition of definitions) {
      this.addCoverSlot({ ...definition, lane: "mid" });
    }
  }

  private spawnAmmoCrate(input: {
    faction: TownWarFactionId;
    position: Vec2;
    ammo: number;
    maxAmmo: number;
    builtFromOrderId: string | null;
  }): TownWarAmmoCrateState {
    const ammo = Math.max(0, Math.floor(input.ammo));
    const maxAmmo = Math.max(ammo, Math.max(0, Math.floor(input.maxAmmo)));
    const maxHealth = AMMO_CRATE_MAX_HEALTH;
    const riskTier = this.computeRiskTier(input.faction, input.position);
    const crate: TownWarAmmoCrateState = {
      id: buildAmmoCrateId(this.state),
      kind: "ammo-crate",
      faction: input.faction,
      position: cloneVec2(input.position),
      ammo,
      maxAmmo,
      health: maxHealth,
      maxHealth,
      riskTier,
      builtFromOrderId: input.builtFromOrderId,
      createdAtSeconds: this.state.clock.seconds,
      destroyedAtSeconds: null,
      destroyedByFaction: null
    };
    this.state.ammoCrates.push(crate);
    return crate;
  }

  private spawnDugout(input: {
    faction: TownWarFactionId;
    position: Vec2;
    facingAngleRadians: number;
    builtFromOrderId: string | null;
  }): TownWarDugoutState {
    const dugout: TownWarDugoutState = {
      id: buildDugoutId(this.state),
      kind: "dugout",
      faction: input.faction,
      position: cloneVec2(input.position),
      facingAngleRadians: normalizeAngleRadians(input.facingAngleRadians),
      health: DUGOUT_MAX_HEALTH,
      maxHealth: DUGOUT_MAX_HEALTH,
      status: "active",
      rallyRadius: DUGOUT_RALLY_RADIUS,
      shelterRadius: DUGOUT_SHELTER_RADIUS,
      connectedTrenchSlotIds: [],
      shelteringSoldierIds: [],
      contestedBySoldierIds: [],
      builtFromOrderId: input.builtFromOrderId,
      createdAtSeconds: this.state.clock.seconds,
      lastUpdatedAtSeconds: this.state.clock.seconds,
      destroyedAtSeconds: null,
      readable: "Rally active"
    };
    this.state.dugouts.push(dugout);
    this.refreshDugoutConnections();
    return dugout;
  }

  private refreshDugoutConnections(): void {
    for (const dugout of this.state.dugouts) {
      if (dugout.destroyedAtSeconds !== null) {
        dugout.connectedTrenchSlotIds = [];
        continue;
      }
      dugout.connectedTrenchSlotIds = this.state.aiTactics.coverSlots
        .filter((slot) => slot.sourceKind === "trench" && slot.faction === dugout.faction)
        .filter((slot) => getDistance(slot.position, dugout.position) <= dugout.rallyRadius)
        .map((slot) => slot.id);
    }
  }

  private getDugoutDirectionalWeakness(dugout: TownWarDugoutState, sourcePosition: Vec2): number {
    const sourceAngle = Math.atan2(sourcePosition.y - dugout.position.y, sourcePosition.x - dugout.position.x);
    const delta = this.getShortestAngleDeltaRadians(sourceAngle, dugout.facingAngleRadians);
    return clamp01(1 - Math.abs(Math.sin(delta)));
  }

  private routeDugoutDefenders(dugout: TownWarDugoutState): void {
    const slots = dugout.connectedTrenchSlotIds
      .map((slotId) => this.findCoverSlot(slotId))
      .filter((slot): slot is TownWarCoverSlotState => slot !== null)
      .slice(0, 4);
    for (const slot of slots) {
      if (slot.occupiedBySoldierId) {
        continue;
      }
      const candidate =
        this.state.soldiers
          .filter((soldier) => soldier.faction === dugout.faction && soldier.health.current > 0)
          .filter((soldier) => soldier.task.kind !== "build" && soldier.task.kind !== "heal" && soldier.task.kind !== "resupply")
          .filter((soldier) => this.findCoverSlot(soldier.coverIntent.coverSlotId)?.sourceKind !== "trench")
          .sort((left, right) => getDistance(left.position, slot.position) - getDistance(right.position, slot.position))[0] ?? null;
      if (candidate) {
        this.assignSoldierToTrench(candidate, slot, "dugout rally connected trench");
      }
    }
  }

  private completeOrder(order: TownWarBuildOrderState): void {
    if (order.status === "completed") {
      return;
    }

    order.status = "completed";
    order.completedAtSeconds = this.state.clock.seconds;
    order.build.progress = order.build.requiredProgress;
    order.build.stalled = false;
    order.build.stallReason = null;
    order.build.outcomeCause =
      order.build.outcomeCause ??
      (order.build.coverFireSupport >= 0.45
        ? "finished-under-suppression"
        : order.build.exposure >= 0.7
          ? "finished-through-exposure"
          : "finished-steady-work");
    this.pushCause(order, order.build.outcomeCause);

    if (order.kind === "ammo-crate") {
      const existing = this.findAmmoCrateFromOrder(order.id);
      if (existing) {
        order.builtEntityId = existing.id;
        return;
      }

      const ammoPayload = order.ammoPayload ?? 0;
      const crate = this.spawnAmmoCrate({
        faction: order.faction,
        position: order.position,
        ammo: ammoPayload,
        maxAmmo: ammoPayload,
        builtFromOrderId: order.id
      });
      order.builtEntityId = crate.id;
    }

    if (order.kind === "dugout") {
      const existing = this.findDugoutFromOrder(order.id);
      if (existing) {
        order.builtEntityId = existing.id;
      } else {
        const dugout = this.spawnDugout({
          faction: order.faction,
          position: order.position,
          facingAngleRadians: order.facingAngleRadians,
          builtFromOrderId: order.id
        });
        order.builtEntityId = dugout.id;
        const slot = this.addCoverSlot({
          faction: order.faction,
          lane: this.state.officer.focusedLane,
          label: `${order.faction} dugout rally point`,
          sourceKind: "dugout",
          sourceId: dugout.id,
          position: order.position,
          facing: this.getOpposingCampId(order.faction),
          facingAngleRadians: order.facingAngleRadians,
          exposure: 0.18,
          protection: 0.42
        });
        this.state.aiTactics.completedConstructionImpact.push({
          orderId: order.id,
          coverSlotId: slot.id,
          kind: order.kind,
          faction: order.faction,
          label: `${slot.label} shelters wounded and rallies connected trenches`,
          protection: slot.protection,
          createdAtSeconds: this.state.clock.seconds
        });
        this.routeDugoutDefenders(dugout);
      }
    }

    if (order.kind === "trench") {
      const dx = Math.cos(order.facingAngleRadians);
      const dy = Math.sin(order.facingAngleRadians);
      const slotOffsets = [-42, 0, 42];
      const slots = slotOffsets.map((offset, index) =>
        this.addCoverSlot({
          faction: order.faction,
          lane: this.state.officer.focusedLane,
          label: `${order.faction} trench ${index + 1}`,
          sourceKind: "trench",
          sourceId: `${order.id}:slot-${index + 1}`,
          position: {
            x: order.position.x + dx * offset,
            y: order.position.y + dy * offset
          },
          facing: this.getOpposingCampId(order.faction),
          facingAngleRadians: order.facingAngleRadians,
          exposure: 0.2,
          protection: 0.54
        })
      );
      for (const slot of slots) {
        this.state.aiTactics.completedConstructionImpact.push({
          orderId: order.id,
          coverSlotId: slot.id,
          kind: order.kind,
          faction: order.faction,
          label: `${slot.label} gives an occupiable trench firing bay`,
          protection: slot.protection,
          createdAtSeconds: this.state.clock.seconds
        });
        this.routeCompletedTrenchOccupant(order, slot);
      }
      this.refreshDugoutConnections();
    }

    if (order.kind === "ammo-crate" && order.builtEntityId) {
      const slot = this.addCoverSlot({
        faction: order.faction,
        lane: this.state.officer.focusedLane,
        label: `${order.faction} ammo position`,
        sourceKind: "ammo-position",
        sourceId: order.builtEntityId,
        position: order.position,
        facing: this.getOpposingCampId(order.faction),
        facingAngleRadians: order.facingAngleRadians,
        exposure: 0.48,
        protection: 0.18
      });
      this.state.aiTactics.completedConstructionImpact.push({
        orderId: order.id,
        coverSlotId: slot.id,
        kind: order.kind,
        faction: order.faction,
        label: `${slot.label} gives a shallow reload position`,
        protection: slot.protection,
        createdAtSeconds: this.state.clock.seconds
      });
    }

    const assignedSoldier = order.assignedSoldierId ? this.state.soldiers.find((soldier) => soldier.id === order.assignedSoldierId) ?? null : null;
    if (assignedSoldier) {
      assignedSoldier.experience.buildsCompleted += 1;
      assignedSoldier.needs.fatigue = clampNeed(assignedSoldier.needs.fatigue + 0.12 + order.build.exposure * 0.1);
      assignedSoldier.dramaArc.confidence = clamp01(assignedSoldier.dramaArc.confidence + 0.04);
      assignedSoldier.dramaArc.trustInOfficer = clamp01(assignedSoldier.dramaArc.trustInOfficer + (order.build.exposure > 0.7 ? 0.01 : 0.03));
      assignedSoldier.currentNeed = deriveCurrentNeed(
        assignedSoldier.needs,
        assignedSoldier.health.current,
        assignedSoldier.health.max,
        assignedSoldier.ammo.reserve
      );
      assignedSoldier.identitySummary = buildIdentitySummary(
        assignedSoldier.skills,
        assignedSoldier.traits,
        assignedSoldier.currentNeed,
        assignedSoldier.dramaArc.trustInOfficer
      );
      this.pushFrontlineStory({
        kind: "build",
        faction: order.faction,
        soldier: assignedSoldier,
        work: "Build",
        orderId: order.id,
        relatedId: order.builtEntityId,
        position: order.position,
        summary: `${assignedSoldier.displayName} finished the ${order.kind === "trench" ? "trench" : order.kind === "dugout" ? "dugout" : "ammo position"} at ${Math.round(order.position.x)},${Math.round(order.position.y)}.`,
        consequence: `${assignedSoldier.displayName} carries ${Math.round(assignedSoldier.needs.fatigue * 100)}% fatigue into the next order.`,
        memoryTag: `${order.kind}-built-${order.id}`
      });
    }

    const supportingSuppressor = order.build.supportingSuppressorId ? this.findSoldierById(order.build.supportingSuppressorId) : null;
    if (supportingSuppressor) {
      supportingSuppressor.dramaArc.confidence = clamp01(supportingSuppressor.dramaArc.confidence + 0.025);
      supportingSuppressor.experience.trenchesHeld += order.kind === "trench" ? 1 : 0;
      this.pushFrontlineStory({
        kind: "cover",
        faction: order.faction,
        soldier: supportingSuppressor,
        work: "Suppress",
        orderId: order.id,
        relatedId: assignedSoldier?.id ?? null,
        position: order.position,
        summary: `${supportingSuppressor.displayName} covered ${assignedSoldier?.displayName ?? "the builder"} while the ${order.kind} was exposed.`,
        consequence: `Cover fire support was ${Math.round(order.build.coverFireSupport * 100)}%, changing build safety and tempo.`,
        memoryTag: `covered-build-${order.id}`
      });
    }
    const riskTier = this.computeRiskTier(order.faction, order.position);
    this.emitDramaEvent({
      kind: order.kind === "trench" ? "trench-completed" : order.kind === "dugout" ? "dugout-completed" : "ammo-crate-completed",
      faction: order.faction,
      campId: order.faction,
      orderId: order.id,
      orderKind: order.kind,
      soldierId: order.assignedSoldierId,
      ammoCrateId: order.builtEntityId,
      position: order.position,
      riskTier,
      summary:
        order.kind === "trench"
          ? `${assignedSoldier?.id ?? "Builder"} completed a trench under ${riskTier} risk because ${order.build.outcomeCause}.`
          : order.kind === "dugout"
            ? `${assignedSoldier?.id ?? "Builder"} completed a dugout rally node under ${riskTier} risk because ${order.build.outcomeCause}.`
          : `${assignedSoldier?.id ?? "Builder"} completed a forward ammo crate under ${riskTier} risk because ${order.build.outcomeCause}.`,
      tags: ["construction", "complete", order.kind, `risk-${riskTier}`, order.build.outcomeCause]
    });

    if (riskTier !== "low") {
      this.emitDramaEvent({
        kind: "line-held",
        faction: order.faction,
        campId: order.faction,
        orderId: order.id,
        orderKind: order.kind,
        soldierId: order.assignedSoldierId,
        ammoCrateId: order.builtEntityId,
        position: order.position,
        riskTier,
        summary: `${order.kind === "trench" ? "Trench" : order.kind === "dugout" ? "Dugout rally" : "Ammo order"} gave the ${this.state.officer.focusedLane} line a stronger hold.`,
        tags: ["line", "held", order.kind, `risk-${riskTier}`]
      });
    }
  }

  private assignSoldierToTrench(soldier: TownWarSoldierState, slot: TownWarCoverSlotState, reason = "completed trench"): void {
    soldier.task = {
      kind: "move",
      label: `Occupy trench: ${slot.label}`,
      targetPosition: cloneVec2(slot.position),
      targetEntityId: slot.id,
      resumeTask: {
        kind: soldier.role === "suppressor" ? "suppress" : "defend",
        label: `Hold from ${slot.label}`,
        targetPosition: null,
        targetEntityId: slot.id
      }
    };
    soldier.coverIntent = {
      coverSlotId: slot.id,
      state: "moving",
      reason: `moving into ${reason}: ${slot.label}`
    };
    soldier.tacticalIntent = {
      state: "seek-cover",
      reason: `taking ${reason}: ${slot.label}`,
      coverSlotId: slot.id,
      partnerId: null,
      pressureRatio: Number((soldier.morale.pressure / Math.max(1, soldier.morale.maxPressure)).toFixed(3)),
      lastUpdatedAtSeconds: this.state.clock.seconds
    };
  }

  private routeCompletedTrenchOccupant(order: TownWarBuildOrderState, slot: TownWarCoverSlotState): void {
    const assigned = order.assignedSoldierId ? this.findSoldierById(order.assignedSoldierId) : null;
    const candidates = this.state.soldiers
      .filter((soldier) => soldier.faction === order.faction && soldier.health.current > 0)
      .filter((soldier) => soldier.task.kind !== "heal" && soldier.task.kind !== "resupply")
      .filter((soldier) => this.findCoverSlot(soldier.coverIntent.coverSlotId)?.sourceKind !== "trench")
      .sort((left, right) => {
        const leftAssigned = assigned && left.id === assigned.id ? 0 : 1;
        const rightAssigned = assigned && right.id === assigned.id ? 0 : 1;
        if (leftAssigned !== rightAssigned) {
          return leftAssigned - rightAssigned;
        }
        const roleScore = (soldier: TownWarSoldierState) =>
          soldier.role === "defender" ? 0 : soldier.role === "suppressor" ? 1 : soldier.role === "rifleman" ? 2 : soldier.role === "builder" ? 3 : 4;
        const leftRole = roleScore(left);
        const rightRole = roleScore(right);
        if (leftRole !== rightRole) {
          return leftRole - rightRole;
        }
        return getDistance(left.position, slot.position) - getDistance(right.position, slot.position);
      });

    const occupant = candidates[0] ?? null;
    if (!occupant) {
      return;
    }

    this.assignSoldierToTrench(occupant, slot);
    occupant.experience.trenchesHeld += 1;
    occupant.dramaArc.confidence = clamp01(occupant.dramaArc.confidence + 0.02);
    this.pushFrontlineStory({
      kind: "occupy",
      faction: order.faction,
      soldier: occupant,
      work: occupant.taskDecision.selectedWork ?? "Defend",
      orderId: order.id,
      relatedId: slot.id,
      position: slot.position,
      summary: `${occupant.displayName} moved into the new trench bay to hold the ${this.state.officer.focusedLane} line.`,
      consequence: `${occupant.displayName} now has ${occupant.experience.trenchesHeld} trench hold${occupant.experience.trenchesHeld === 1 ? "" : "s"} on record.`,
      memoryTag: `held-trench-${slot.id}`
    });
    this.pushChatter({
      faction: occupant.faction,
      channel: this.buildSoldierChannel(occupant),
      text: "Taking the trench. This should cut the pressure.",
      tags: ["trench", "cover", "occupy"],
      cooldownKey: `${occupant.id}:occupy-trench:${slot.id}`,
      cooldownSeconds: 12
    });
  }

  private buildSoldierChannel(soldier: TownWarSoldierState): string {
    if (typeof soldier.displayName === "string" && soldier.displayName.length > 0) {
      return soldier.displayName;
    }
    const side = soldier.faction === "camp-a" ? "A" : "B";
    const number = Math.max(0, getTrailingIdNumber(soldier.id));
    if (number > 0) {
      return `${side} ${soldier.role} ${number}`;
    }
    return `${side} ${soldier.role}`;
  }

  private resolvePlayerDialogueParticipants(input: {
    faction: TownWarFactionId;
    soldierId?: string | null;
    position?: Vec2 | null;
  }): { speaker: TownWarSoldierState | null; addressee: TownWarSoldierState | null } {
    if (input.faction !== TOWN_WAR_PLAYER_FACTION) {
      return { speaker: null, addressee: null };
    }

    const aliveSoldiers = this.state.soldiers.filter(
      (soldier) => soldier.faction === input.faction && soldier.health.current > 0
    );
    const subject = input.soldierId ? aliveSoldiers.find((soldier) => soldier.id === input.soldierId) ?? null : null;
    const nearby = input.position
      ? [...aliveSoldiers].sort((left, right) => getDistance(left.position, input.position!) - getDistance(right.position, input.position!))
      : [...aliveSoldiers];
    const speaker = subject ?? nearby[0] ?? aliveSoldiers[0] ?? null;
    const addressee =
      nearby.find((soldier) => soldier.id !== speaker?.id) ??
      aliveSoldiers.find((soldier) => soldier.id !== speaker?.id) ??
      null;

    return { speaker, addressee };
  }

  private hasRecentFrontlineStory(soldierId: string, kind: TownWarFrontlineStoryKind, withinSeconds: number): boolean {
    return this.state.frontlineStories.some(
      (story) => story.soldierId === soldierId && story.kind === kind && this.state.clock.seconds - story.atSeconds <= withinSeconds
    );
  }

  private pushFrontlineStory(input: {
    kind: TownWarFrontlineStoryKind;
    faction: TownWarFactionId;
    soldier: TownWarSoldierState;
    work?: TownWarWorkPriorityId | null;
    orderId?: string | null;
    relatedId?: string | null;
    position?: Vec2 | null;
    summary: string;
    consequence: string;
    memoryTag: string;
  }): TownWarFrontlineStoryState {
    const story: TownWarFrontlineStoryState = {
      id: `town-war-story-${this.state.nextFrontlineStoryId++}`,
      kind: input.kind,
      faction: input.faction,
      soldierId: input.soldier.id,
      soldierName: input.soldier.displayName,
      role: input.soldier.role,
      work: input.work ?? input.soldier.taskDecision.selectedWork ?? null,
      orderId: input.orderId ?? null,
      relatedId: input.relatedId ?? null,
      position: input.position ? cloneVec2(input.position) : null,
      summary: input.summary,
      consequence: input.consequence,
      memoryTag: input.memoryTag,
      atSeconds: this.state.clock.seconds
    };

    this.state.frontlineStories = [story, ...this.state.frontlineStories].slice(0, 32);
    input.soldier.dramaMemoryTags = uniqueLimited([input.memoryTag, ...input.soldier.dramaMemoryTags], 8);
    input.soldier.identitySummary = buildIdentitySummary(
      input.soldier.skills,
      input.soldier.traits,
      input.soldier.currentNeed,
      input.soldier.dramaArc.trustInOfficer
    );
    return cloneFrontlineStory(story);
  }

  private getBuildSupport(order: TownWarBuildOrderState): {
    suppressor: TownWarSoldierState | null;
    coverFireSupport: number;
    supportAmmoState: TownWarBuildExecutionState["supportAmmoState"];
  } {
    const sustainment = this.getCampSustainment(order.faction);
    const ammoFlow = sustainment?.ammoFlow ?? 1;
    const suppressors = this.state.soldiers
      .filter((soldier) => soldier.faction === order.faction && soldier.health.current > 0 && soldier.task.kind === "suppress")
      .filter((soldier) => soldier.task.targetEntityId === order.id)
      .map((soldier) => {
        const distance = getDistance(soldier.position, order.position);
        const ammoTotal = soldier.ammo.inMag + soldier.ammo.reserve;
        const distanceFit = clamp(1 - distance / 780, 0, 1);
        const ammoFit = clamp(ammoTotal / Math.max(1, soldier.ammo.maxMag * 2), 0, 1);
        const skillFit = clamp((soldier.skills.suppression + soldier.skills.shooting * 0.35 + soldier.skills.logistics * 0.2) / 14, 0, 1);
        const flowFit = clamp(0.45 + ammoFlow * 0.55, 0, 1);
        return {
          soldier,
          ammoTotal,
          score: (distanceFit * 0.45 + ammoFit * 0.25 + skillFit * 0.3) * flowFit
        };
      })
      .sort((left, right) => right.score - left.score);

    const best = suppressors[0] ?? null;
    if (!best) {
      return { suppressor: null, coverFireSupport: 0, supportAmmoState: "none" };
    }

    const naturalAmmoState = best.ammoTotal <= 0 ? "dry" : best.ammoTotal <= best.soldier.ammo.maxMag ? "low" : "steady";
    const flowAmmoState =
      ammoFlow <= 0.18 ? "dry" : ammoFlow <= 0.38 && naturalAmmoState === "steady" ? "low" : naturalAmmoState;

    return {
      suppressor: best.soldier,
      coverFireSupport: clamp(best.score, 0, 1),
      supportAmmoState: flowAmmoState
    };
  }

  private tickBuildOrderProgress(deltaSeconds: number): void {
    for (const order of this.state.orders) {
      if (order.status !== "assigned") {
        continue;
      }

      const builder = order.assignedSoldierId ? this.findSoldierById(order.assignedSoldierId) : null;
      if (!builder || builder.health.current <= 0) {
        order.build.stalled = true;
        order.build.stallReason = "builder unavailable";
        order.build.buildRate = 0;
        this.pushCause(order, "builder-unavailable");
        continue;
      }

      if (builder.task.kind !== "build" || builder.task.targetEntityId !== order.id) {
        continue;
      }

      if (getDistance(builder.position, order.position) > 8) {
        order.build.stalled = false;
        order.build.stallReason = null;
        order.build.buildRate = 0;
        order.build.lastUpdatedAtSeconds = this.state.clock.seconds;
        continue;
      }

      const support = this.getBuildSupport(order);
      order.build.supportingSuppressorId = support.suppressor?.id ?? null;
      order.build.coverFireSupport = Number(support.coverFireSupport.toFixed(2));
      order.build.supportAmmoState = support.supportAmmoState;
      order.build.exposure = this.getExposureForRisk(this.computeRiskTier(order.faction, order.position));
      order.build.lastUpdatedAtSeconds = this.state.clock.seconds;

      const construction = builder.skills.construction;
      const nerve = builder.skills.nerve;
      const fatigue = builder.needs.fatigue;
      const campReadiness = this.getCampSustainment(order.faction)?.readiness ?? 1;
      const campBuildStock = clamp((this.getCamp(order.faction)?.supply.build ?? 0) / 250, 0, 1);
      const logisticsSupport = support.suppressor ? support.suppressor.skills.logistics / 10 : 0;
      const supportRelief = support.coverFireSupport * (support.supportAmmoState === "steady" ? 0.85 : support.supportAmmoState === "low" ? 0.42 : 0);
      const sustainmentPenalty = clamp(1 - campReadiness, 0, 1) * 0.28;
      const stallPressure = clamp(order.build.exposure + fatigue * 0.65 + sustainmentPenalty - supportRelief - logisticsSupport * 0.12, 0, 1.3);
      const nerveCapacity = clamp(nerve / 10 + builder.dramaArc.confidence * 0.12, 0, 1.1);
      const stalled = stallPressure > nerveCapacity + 0.16;
      const tiredPenalty = fatigue >= 0.55 ? fatigue * 3 : fatigue * 1.2;
      const readinessMultiplier = clamp(0.68 + campReadiness * 0.42, 0.58, 1.12);
      const buildSupplyMultiplier = clamp(0.7 + campBuildStock * 0.34, 0.62, 1.08);
      const baseRate = (4.2 + construction * 1.05 + builder.skills.engineering * 0.28 + support.coverFireSupport * 2.6 - tiredPenalty) * readinessMultiplier * buildSupplyMultiplier;
      const buildRate = Math.max(0.8, baseRate * (stalled ? 0.22 : 1));
      const progressBefore = order.build.progress;

      order.build.stalled = stalled;
      order.build.stallReason = stalled
        ? support.coverFireSupport < 0.25
          ? "stalled under fire"
          : fatigue >= 0.55
            ? "build slowed: tired worker"
            : "nerve break under exposure"
        : support.coverFireSupport >= 0.45
          ? "covered by suppression"
          : fatigue >= 0.55
            ? "build slowed: tired worker"
            : null;
      order.build.buildRate = Number(buildRate.toFixed(2));
      order.build.progress = Number(Math.min(order.build.requiredProgress, order.build.progress + buildRate * deltaSeconds).toFixed(2));
      for (const milestone of [25, 50, 75] as const) {
        const milestoneProgress = order.build.requiredProgress * (milestone / 100);
        const milestoneCause = `feedback-progress-${milestone}`;
        if (progressBefore < milestoneProgress && order.build.progress >= milestoneProgress && !order.build.causeChain.includes(milestoneCause)) {
          this.pushCause(order, milestoneCause);
          this.pushChatter({
            faction: builder.faction,
            channel: this.buildSoldierChannel(builder),
            text:
              order.kind === "trench"
                ? `Trench work ${milestone}% - ${order.build.stallReason ?? "still digging"}.`
                : `Build ${milestone}% - ${order.build.stallReason ?? "work continuing"}.`,
            tags: ["build", "progress", order.kind],
            cooldownKey: `${builder.id}:build-progress:${order.id}:${milestone}`,
            cooldownSeconds: 2
          });
        }
      }

      if (stalled) {
        builder.needs.morale = clampNeed(builder.needs.morale - deltaSeconds * 0.005);
        builder.dramaArc.resentment = clamp01(builder.dramaArc.resentment + deltaSeconds * 0.003);
        this.pushCause(order, order.build.stallReason ?? "stalled");
      } else {
        builder.dramaArc.confidence = clamp01(builder.dramaArc.confidence + deltaSeconds * 0.0015);
        this.pushCause(order, support.coverFireSupport >= 0.45 ? "covered-by-suppression" : "builder-kept-working");
      }

      if (support.supportAmmoState === "dry" || support.supportAmmoState === "low") {
        this.pushCause(order, support.supportAmmoState === "dry" ? "ammo-support-dry" : "ammo-support-low");
      }
      if (campReadiness < 0.46) {
        this.pushCause(order, "bad-sustainment");
      }
      if (campBuildStock < 0.25) {
        this.pushCause(order, "build-supply-low");
      }

      if (order.build.progress >= order.build.requiredProgress) {
        order.build.outcomeCause =
          support.coverFireSupport >= 0.45
            ? "finished-under-suppression"
            : campReadiness < 0.46
              ? "finished-despite-bad-sustainment"
            : stalled
              ? "finished-after-stall"
              : order.build.exposure >= 0.7
                ? "finished-through-exposure"
                : "finished-steady-work";
        this.completeOrder(order);
      }
    }
  }

  private tickRescueProgress(deltaSeconds: number): void {
    for (const casualty of this.state.casualties) {
      if (casualty.status === "stabilized" || casualty.status === "recovering" || casualty.status === "lost") {
        continue;
      }

      const wounded = this.findSoldierById(casualty.soldierId);
      if (!wounded || wounded.health.current <= 0) {
        casualty.status = "lost";
        casualty.outcomeCause = "wounded-lost";
        casualty.completedAtSeconds = this.state.clock.seconds;
        this.pushCasualtyCause(casualty, "wounded-lost");
        continue;
      }

      const medic = casualty.assignedMedicId ? this.findSoldierById(casualty.assignedMedicId) : null;
      if (!medic || medic.health.current <= 0 || medic.task.kind !== "heal" || medic.task.targetEntityId !== casualty.id) {
        const openLossSeconds = casualty.severity === "critical" ? 42 : casualty.severity === "serious" ? 75 : 110;
        if (this.state.clock.seconds - casualty.createdAtSeconds >= openLossSeconds) {
          casualty.status = "lost";
          casualty.outcomeCause = "wounded-left-in-open";
          casualty.completedAtSeconds = this.state.clock.seconds;
          casualty.lastUpdatedAtSeconds = this.state.clock.seconds;
          this.pushCasualtyCause(casualty, "wounded-left-in-open");
          wounded.health.current = 0;
          wounded.currentNeed = deriveCurrentNeed(wounded.needs, wounded.health.current, wounded.health.max, wounded.ammo.reserve);
          wounded.identitySummary = buildIdentitySummary(wounded.skills, wounded.traits, wounded.currentNeed, wounded.dramaArc.trustInOfficer);
          this.emitDramaEvent({
            kind: "wounded-lost",
            faction: casualty.faction,
            campId: casualty.faction,
            soldierId: casualty.soldierId,
            position: casualty.position,
            locationLabel: `${wounded.displayName} casualty site`,
            riskTier: this.computeRiskTier(casualty.faction, casualty.position),
            summary: `${wounded.displayName} was left in the open and became a loss.`,
            tags: ["casualty", "wounded", "lost", "body-left", casualty.outcomeCause]
          });
        }
        continue;
      }

      if (getDistance(medic.position, casualty.position) > 10) {
        continue;
      }

      const score = this.scoreRescueCandidate(medic, casualty);
      casualty.rescueScore = score.score;
      casualty.rescueReason = score.reason;
      casualty.pathRisk = score.pathRisk;
      casualty.coveredPath = score.coveredPath;
      casualty.lastUpdatedAtSeconds = this.state.clock.seconds;
      if (score.blockedReason && score.pathRisk >= 0.65) {
        casualty.outcomeCause = score.blockedReason;
        this.pushCasualtyCause(casualty, score.blockedReason);
        medic.task = {
          kind: "hold",
          label: score.blockedReason,
          targetPosition: null,
          targetEntityId: casualty.id
        };
        this.emitDramaEvent({
          kind: "medic-rescue-stalled",
          faction: casualty.faction,
          campId: casualty.faction,
          soldierId: medic.id,
          position: casualty.position,
          locationLabel: `${wounded.displayName} casualty site`,
          riskTier: this.computeRiskTier(casualty.faction, casualty.position),
          summary: `${medic.displayName} held short of ${wounded.displayName}: ${score.blockedReason}.`,
          tags: ["casualty", "medic", "stalled", score.blockedReason]
        });
        continue;
      }

      const treatmentRate = Math.max(1.5, medic.skills.medical * 1.15 + medic.skills.social * 0.35 + score.coveredPath * 2.5 - score.pathRisk * 1.8);
      casualty.treatmentProgress = Number(Math.min(casualty.requiredTreatment, casualty.treatmentProgress + treatmentRate * deltaSeconds).toFixed(2));
      this.pushCasualtyCause(casualty, score.coveredPath >= 0.35 ? "treated-in-cover" : "treated-under-exposure");
      wounded.health.current = Math.max(wounded.health.current, casualty.severity === "critical" ? 35 : casualty.severity === "serious" ? 48 : 62);
      wounded.currentNeed = "wounded";
      wounded.identitySummary = buildIdentitySummary(wounded.skills, wounded.traits, wounded.currentNeed, wounded.dramaArc.trustInOfficer);

      if (casualty.treatmentProgress >= casualty.requiredTreatment) {
        casualty.status = "stabilized";
        casualty.outcomeCause = score.coveredPath >= 0.35 ? "stabilized-from-covered-path" : "stabilized-under-fire";
        casualty.completedAtSeconds = this.state.clock.seconds;
        this.pushCasualtyCause(casualty, casualty.outcomeCause);
        medic.experience.rescuesCompleted += 1;
        medic.experience.woundsTreated += 1;
        medic.dramaArc.confidence = clamp01(medic.dramaArc.confidence + 0.05);
        medic.dramaArc.trustBySoldierId[wounded.id] = clamp01((medic.dramaArc.trustBySoldierId[wounded.id] ?? 0.5) + 0.12);
        medic.dramaArc.protectiveOfSoldierIds = uniqueLimited([wounded.id, ...medic.dramaArc.protectiveOfSoldierIds], 6);
        medic.task = { kind: "idle", label: `Stabilized ${wounded.displayName}`, targetPosition: null, targetEntityId: casualty.id };
        this.pushFrontlineStory({
          kind: "medic",
          faction: casualty.faction,
          soldier: medic,
          work: "Rescue",
          orderId: null,
          relatedId: casualty.id,
          position: casualty.position,
          summary: `${medic.displayName} stabilized ${wounded.displayName} after a ${casualty.rescueReason}.`,
          consequence: `${medic.displayName} now watches ${wounded.displayName}; ${wounded.displayName} stays wounded instead of becoming a loss.`,
          memoryTag: `stabilized-${wounded.id}`
        });
        this.emitDramaEvent({
          kind: "wounded-stabilized",
          faction: casualty.faction,
          campId: casualty.faction,
          soldierId: wounded.id,
          position: casualty.position,
          locationLabel: `${wounded.displayName} casualty site`,
          riskTier: this.computeRiskTier(casualty.faction, casualty.position),
          summary: `${medic.displayName} stabilized ${wounded.displayName} because ${casualty.outcomeCause}.`,
          tags: ["casualty", "medic", "stabilized", casualty.outcomeCause]
        });
      }
    }
  }

  private pushChatter(input: {
    faction: TownWarFactionId;
    channel: string;
    text: string;
    tags: string[];
    cooldownKey: string;
    cooldownSeconds?: number;
  }): void {
    const cooldownSeconds = input.cooldownSeconds ?? 6;
    const lastAtSeconds = this.chatterCooldownSecondsByKey.get(input.cooldownKey) ?? Number.NEGATIVE_INFINITY;
    if (this.state.clock.seconds - lastAtSeconds < cooldownSeconds) {
      return;
    }

    this.chatterCooldownSecondsByKey.set(input.cooldownKey, this.state.clock.seconds);
    const entry: TownWarChatterEntry = {
      id: buildChatterId(this.state),
      atSeconds: this.state.clock.seconds,
      faction: input.faction,
      channel: input.channel,
      text: input.text,
      tags: [...input.tags]
    };

    this.state.chatter.push(entry);
    if (this.state.chatter.length > 80) {
      this.state.chatter.splice(0, this.state.chatter.length - 80);
    }
  }

  private getDramaLocationLabel(position: Vec2 | null | undefined, fallback: string): string {
    if (!position || !Number.isFinite(position.x) || !Number.isFinite(position.y)) {
      return fallback;
    }

    return `${fallback} ${Math.round(position.x)},${Math.round(position.y)}`;
  }

  private getLocationScarId(position: Vec2 | null | undefined, label: string): string {
    if (!position || !Number.isFinite(position.x) || !Number.isFinite(position.y)) {
      return `label-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "unknown"}`;
    }
    return `grid-${Math.round(position.x / 50)}-${Math.round(position.y / 50)}`;
  }

  private getDramaIntensity(kind: TownWarDramaEventKind, riskTier: TownWarOfficerRiskTier | null): TownWarDramaEvent["intensity"] {
    if (
      kind === "builder-exposed" ||
      kind === "construction-stalled" ||
      kind === "ammo-crate-empty" ||
      kind === "line-collapsed" ||
      kind === "camp-damaged" ||
      kind === "camp-destroyed" ||
      kind === "wounded-lost" ||
      kind === "bad-order-cost"
    ) {
      return "critical";
    }

    if (kind === "camp-under-fire" || kind === "ammo-crate-low" || kind === "medic-rescue-stalled" || riskTier === "high") {
      return "high";
    }

    return riskTier === "medium" ? "medium" : "low";
  }

  private getActiveMemoryTagsForFaction(faction: TownWarFactionId): Set<string> {
    return new Set(
      [
        ...this.state.dramaMemories
        .filter((memory) => {
          if (memory.witnessIds.length === 0) {
            return false;
          }
          return memory.witnessIds.some((witnessId) => this.state.soldiers.some((soldier) => soldier.id === witnessId && soldier.faction === faction));
        })
          .flatMap((memory) => [memory.tag, memory.cause, memory.responsibility]),
        ...this.state.soldiers.filter((soldier) => soldier.faction === faction).flatMap((soldier) => this.getSoldierArcTags(soldier))
      ]
    );
  }

  private getActiveScarTags(faction: TownWarFactionId, position: Vec2 | null | undefined, locationLabel: string): string[] {
    const locationId = this.getLocationScarId(position, locationLabel);
    return uniqueLimited(
      this.state.locationScars
        .filter((scar) => {
          if (scar.controlSide !== null && scar.controlSide !== faction) {
            return false;
          }
          if (scar.id === locationId) {
            return true;
          }
          if (position && scar.position) {
            return getDistance(scar.position, position) <= 120;
          }
          return scar.label === locationLabel;
        })
        .flatMap((scar) => scar.tags),
      12
    );
  }

  private getSoldierArcTags(soldier: TownWarSoldierState): string[] {
    const { dramaArc } = soldier;
    const tags: string[] = [...dramaArc.signatureTraumaTags, ...dramaArc.signaturePrideTags];
    if (dramaArc.trustInOfficer <= 0.42) {
      tags.push("arc-officer-distrust");
    }
    if (dramaArc.resentment >= 0.16) {
      tags.push("arc-officer-resentment", "arc-rook-strict");
    }
    if (dramaArc.guilt >= 0.14) {
      tags.push("arc-guilt", "arc-yara-cold");
    }
    if (dramaArc.confidence >= 0.62) {
      tags.push("arc-confidence", "arc-makar-reckless");
    }
    if (dramaArc.protectiveOfSoldierIds.length > 0 || dramaArc.relationshipPressure.protective > 0.1) {
      tags.push("arc-protective");
    }
    if (dramaArc.rivalryWithSoldierIds.length > 0 || dramaArc.relationshipPressure.rivalry > 0.1) {
      tags.push("arc-rivalry");
    }
    if (dramaArc.trustInOfficer >= 0.62 && dramaArc.resentment > 0) {
      tags.push("arc-trust-repair");
    }
    return uniqueLimited(tags, 16);
  }

  private markMemoryReferenced(tag: string | null | undefined): void {
    if (!tag) {
      return;
    }

    const memory = this.state.dramaMemories.find(
      (entry) => entry.tag === tag || entry.cause === tag || entry.responsibility === tag
    );
    if (memory) {
      memory.lastReferencedAt = this.state.clock.seconds;
    }

    const scar = this.state.locationScars.find((entry) => entry.tags.includes(tag));
    if (scar) {
      scar.timesReferenced += 1;
      scar.lastChangedAt = this.state.clock.seconds;
      this.state.focusedLocationScar = scar;
    }
  }

  private fillDramaTemplate(
    template: string,
    values: { focus: string; orderKind: string; risk: string; camp: string; speaker: string; addressee: string }
  ): string {
    return template
      .split("{focus}")
      .join(values.focus)
      .split("{focusLower}")
      .join(values.focus.toLowerCase())
      .split("{breach}")
      .join(values.orderKind)
      .split("{breachLower}")
      .join(values.orderKind.toLowerCase())
      .split("{extract}")
      .join(values.camp)
      .split("{extractLower}")
      .join(values.camp.toLowerCase())
      .split("{enemyTape}")
      .join("Enemy Camp")
      .split("{memoryMate}")
      .join("the last one")
      .split("{addressee}")
      .join(values.addressee)
      .split("{addresseeLower}")
      .join(values.addressee.toLowerCase())
      .split("{speaker}")
      .join(values.speaker)
      .split("{speakerLower}")
      .join(values.speaker.toLowerCase())
      .split("{risk}")
      .join(values.risk);
  }

  private buildPlayerFallbackDramaText(input: {
    kind: TownWarDramaEventKind;
    orderKind: TownWarBuildOrderKind | null;
    locationLabel: string;
    summary: string;
    riskTier: TownWarOfficerRiskTier | null;
  }, addressee: string): string {
    const focus = input.locationLabel;
    if (input.kind === "dugout-completed") {
      return `${addressee}, dugout is up at ${focus}. Fall back through it if the trench gets hot.`;
    }
    if (input.kind === "dugout-damaged") {
      return `${addressee}, dugout took damage at ${focus}. Keep the linked trench covered.`;
    }
    if (input.kind === "dugout-contested") {
      return `${addressee}, they are pressing the dugout at ${focus}. Shift fire before the line folds.`;
    }
    if (input.kind === "casualty-staged") {
      return `${addressee}, casualty at ${focus}. Mark the route and keep their head down.`;
    }
    if (input.kind === "medic-rescue-started") {
      return `${addressee}, medic is moving on ${focus}. Cover the recovery.`;
    }
    if (input.kind === "medic-rescue-stalled") {
      return `${addressee}, recovery stalled at ${focus}. We need safer ground before they move.`;
    }
    if (input.kind === "wounded-stabilized") {
      return `${addressee}, wounded is stabilized at ${focus}. Hold the lane.`;
    }
    if (input.kind === "wounded-lost") {
      return `${addressee}, we lost one at ${focus}. Remember why that ground went bad.`;
    }
    if (input.kind === "camp-sustainment-warning") {
      return `${addressee}, Russian camp is running thin. Priorities need to change now.`;
    }
    if (input.kind === "build-order-issued" || input.kind === "builder-moving" || input.kind === "builder-exposed") {
      const orderKind = input.orderKind ?? "build";
      return `${addressee}, ${orderKind} order is active at ${focus}. Risk is ${input.riskTier ?? "unknown"}.`;
    }
    return `${addressee}, ${input.summary}`;
  }

  private scoreDramaTemplate(
    template: SquadDialogueTemplateDefinition | HostileDialogueTemplateDefinition,
    kind: TownWarDramaEventKind,
    faction: TownWarFactionId,
    riskTier: TownWarOfficerRiskTier | null,
    activeMemoryTags: Set<string>
  ): number {
    let score = template.weight + Math.random() * 0.3;
    if ("requiredMemoryTag" in template && template.requiredMemoryTag && activeMemoryTags.has(template.requiredMemoryTag)) {
      score += 1.6;
    }
    if ("allowedSpeakers" in template) {
      if (template.allowedSpeakers?.includes("Rook") && activeMemoryTags.has("arc-rook-strict")) {
        score += 0.65;
      }
      if (template.allowedSpeakers?.includes("Yara") && activeMemoryTags.has("arc-yara-cold")) {
        score += 0.75;
      }
      if (template.allowedSpeakers?.includes("Makar") && activeMemoryTags.has("arc-makar-reckless")) {
        score += 0.55;
      }
      if (template.allowedSpeakers?.includes("Yara") && activeMemoryTags.has("arc-protective")) {
        score += 0.35;
      }
    }
    if (riskTier === "high" && template.tone === "critical") {
      score += 0.45;
    }
    if (riskTier === "low" && template.tone === "steady") {
      score += 0.2;
    }
    if (faction === TOWN_WAR_PLAYER_FACTION && "allowedSpeakers" in template && template.allowedSpeakers?.includes("Rook") && kind.includes("line")) {
      score += 0.18;
    }
    if (faction === TOWN_WAR_PLAYER_FACTION && "allowedSpeakers" in template && template.allowedSpeakers?.includes("Yara") && kind.includes("builder")) {
      score += 0.22;
    }
    return score;
  }

  private resolveDramaLine(input: {
    kind: TownWarDramaEventKind;
    faction: TownWarFactionId;
    orderKind: TownWarBuildOrderKind | null;
    locationLabel: string;
    summary: string;
    soldierId?: string | null;
    position?: Vec2 | null;
    riskTier: TownWarOfficerRiskTier | null;
    beat: TownWarDramaBeatKind;
  }): { speaker: string; channel: string; text: string; referencedMemoryTag: string | null } | null {
    const activeMemoryTags = this.getActiveMemoryTagsForFaction(input.faction);
    activeMemoryTags.add(this.getDramaBeatTag(input.beat));
    for (const scarTag of this.getActiveScarTags(input.faction, input.position ?? null, input.locationLabel)) {
      activeMemoryTags.add(scarTag);
    }
    const sourceTemplates =
      input.faction === TOWN_WAR_PLAYER_FACTION
        ? SQUAD_DIALOGUE_TEMPLATES.filter(
            (template) => template.kind === input.kind && (!template.requiredMemoryTag || activeMemoryTags.has(template.requiredMemoryTag))
          )
        : HOSTILE_DIALOGUE_TEMPLATES.filter((template) => template.kind === input.kind);
    const playerParticipants = this.resolvePlayerDialogueParticipants({
      faction: input.faction,
      soldierId: input.soldierId ?? null,
      position: input.position ?? null
    });
    const playerSpeaker = playerParticipants.speaker ? this.buildSoldierChannel(playerParticipants.speaker) : "Russian Squad Net";
    const playerAddressee = playerParticipants.addressee ? this.buildSoldierChannel(playerParticipants.addressee) : "Officer";

    let bestTemplate: SquadDialogueTemplateDefinition | HostileDialogueTemplateDefinition | null = null;
    let bestScore = Number.NEGATIVE_INFINITY;

    for (const template of sourceTemplates) {
      const score = this.scoreDramaTemplate(template, input.kind, input.faction, input.riskTier, activeMemoryTags);
      if (score > bestScore) {
        bestScore = score;
        bestTemplate = template;
      }
    }

    if (!bestTemplate) {
      if (input.faction === TOWN_WAR_PLAYER_FACTION) {
        return {
          speaker: playerSpeaker,
          channel: "Russian Squad Net",
          text: this.buildPlayerFallbackDramaText(
            {
              kind: input.kind,
              orderKind: input.orderKind,
              locationLabel: input.locationLabel,
              summary: input.summary,
              riskTier: input.riskTier
            },
            playerAddressee
          ),
          referencedMemoryTag: null
        };
      }
      return null;
    }

    const speaker =
      input.faction === TOWN_WAR_PLAYER_FACTION
        ? playerSpeaker
        : "Enemy Net";

    const referencedMemoryTag =
      "requiredMemoryTag" in bestTemplate && bestTemplate.requiredMemoryTag ? bestTemplate.requiredMemoryTag : null;
    this.markMemoryReferenced(referencedMemoryTag);

    return {
      speaker,
      channel: bestTemplate.channel,
      text: this.fillDramaTemplate(bestTemplate.text, {
        focus: input.locationLabel,
        orderKind: input.orderKind ?? "order",
        risk: input.riskTier ?? "unknown",
        camp: input.faction === TOWN_WAR_PLAYER_FACTION ? "Russian Camp" : "Ukrainian Enemy Camp",
        speaker,
        addressee: input.faction === TOWN_WAR_PLAYER_FACTION ? playerAddressee : "Enemy Net"
      }),
      referencedMemoryTag
    };
  }

  private classifyDramaMemory(
    event: TownWarDramaEvent
  ): { cause: TownWarDramaCause; responsibility: TownWarDramaResponsibility; tag: string; emotionalWeight: number } | null {
    if (event.kind === "builder-exposed") {
      return { cause: "order-exposed-builder", responsibility: "officer-cost", tag: "order-exposed-builder", emotionalWeight: 0.78 };
    }
    if (event.kind === "trench-completed" || event.kind === "line-held") {
      return { cause: event.kind === "line-held" ? "order-saved-line" : "trench-held", responsibility: "officer-helped", tag: event.kind === "line-held" ? "order-saved-line" : "trench-held", emotionalWeight: 0.62 };
    }
    if (event.kind === "ammo-crate-low" || event.kind === "ammo-crate-empty") {
      return { cause: "ammo-shortage", responsibility: "supply-failure", tag: "ammo-shortage", emotionalWeight: event.kind === "ammo-crate-empty" ? 0.72 : 0.48 };
    }
    if (event.kind === "camp-damaged" || event.kind === "camp-destroyed") {
      return { cause: "camp-hit", responsibility: "enemy-pressure", tag: "camp-hit", emotionalWeight: event.kind === "camp-destroyed" ? 0.95 : 0.7 };
    }
    if (event.kind === "line-collapsed") {
      return { cause: "trench-failed", responsibility: "enemy-pressure", tag: "trench-failed", emotionalWeight: 0.84 };
    }
    if (event.kind === "wounded-stabilized") {
      return { cause: "body-recovered", responsibility: "officer-helped", tag: "wounded-stabilized", emotionalWeight: 0.66 };
    }
    if (event.kind === "wounded-lost" || event.kind === "medic-rescue-stalled") {
      return {
        cause: "body-left",
        responsibility: "officer-cost",
        tag: event.kind === "wounded-lost" ? "wounded-left" : "rescue-stalled",
        emotionalWeight: event.kind === "wounded-lost" ? 0.88 : 0.64
      };
    }
    if (event.kind === "bad-order-cost") {
      const supplyFailure = event.tags.some((tag) => tag === "ammo" || tag === "looted" || tag === "destroyed");
      return {
        cause: supplyFailure ? "ammo-shortage" : "order-exposed-builder",
        responsibility: supplyFailure ? "supply-failure" : "officer-cost",
        tag: supplyFailure ? "supply-failure" : "officer-cost",
        emotionalWeight: 0.82
      };
    }
    return null;
  }

  private findDramaWitnesses(faction: TownWarFactionId, position: Vec2 | null | undefined, subjectId: string | null): TownWarSoldierState[] {
    const sameFaction = this.state.soldiers.filter((soldier) => soldier.faction === faction);
    const nearby = position
      ? sameFaction
          .map((soldier) => ({ soldier, distance: getDistance(soldier.position, position) }))
          .filter((entry) => entry.distance <= 620)
          .sort((left, right) => left.distance - right.distance)
          .map((entry) => entry.soldier)
      : sameFaction;

    const witnesses = nearby.slice(0, 4);
    if (subjectId) {
      const subject = sameFaction.find((soldier) => soldier.id === subjectId) ?? null;
      if (subject && !witnesses.some((soldier) => soldier.id === subject.id)) {
        witnesses.unshift(subject);
      }
    }
    return witnesses.slice(0, 5);
  }

  private updateWitnessDramaArc(witness: TownWarSoldierState, memory: TownWarDramaMemory): void {
    const arc = witness.dramaArc;
    if (memory.responsibility === "officer-cost") {
      arc.trustInOfficer = clamp01(arc.trustInOfficer - 0.1 * memory.emotionalWeight);
      arc.resentment = clamp01(arc.resentment + 0.12 * memory.emotionalWeight);
      arc.guilt = clamp01(arc.guilt + 0.06 * memory.emotionalWeight);
      arc.combatNerve = clamp01(arc.combatNerve - 0.04 * memory.emotionalWeight);
      arc.signatureTraumaTags = uniqueLimited([memory.tag, memory.cause, ...arc.signatureTraumaTags], 8);
    } else if (memory.responsibility === "officer-helped") {
      arc.trustInOfficer = clamp01(arc.trustInOfficer + 0.09 * memory.emotionalWeight);
      arc.confidence = clamp01(arc.confidence + 0.1 * memory.emotionalWeight);
      arc.combatNerve = clamp01(arc.combatNerve + 0.04 * memory.emotionalWeight);
      arc.resentment = clamp01(arc.resentment - 0.05 * memory.emotionalWeight);
      arc.signaturePrideTags = uniqueLimited([memory.tag, memory.cause, ...arc.signaturePrideTags], 8);
    } else if (memory.responsibility === "supply-failure" || memory.responsibility === "enemy-pressure") {
      arc.guilt = clamp01(arc.guilt + 0.04 * memory.emotionalWeight);
      arc.combatNerve = clamp01(arc.combatNerve - 0.03 * memory.emotionalWeight);
      arc.signatureTraumaTags = uniqueLimited([memory.tag, memory.cause, ...arc.signatureTraumaTags], 8);
    }

    if (memory.subjectId && memory.subjectId !== witness.id && this.state.soldiers.some((soldier) => soldier.id === memory.subjectId)) {
      const currentTrust = arc.trustBySoldierId[memory.subjectId] ?? 0.5;
      if (memory.responsibility === "officer-cost" || memory.responsibility === "enemy-pressure") {
        arc.trustBySoldierId[memory.subjectId] = clamp01(currentTrust + 0.06 * memory.emotionalWeight);
        arc.protectiveOfSoldierIds = uniqueLimited([memory.subjectId, ...arc.protectiveOfSoldierIds], 6);
        arc.relationshipPressure.protective = clamp01(arc.relationshipPressure.protective + 0.12 * memory.emotionalWeight);
      } else if (memory.responsibility === "supply-failure") {
        arc.trustBySoldierId[memory.subjectId] = clamp01(currentTrust - 0.04 * memory.emotionalWeight);
        arc.rivalryWithSoldierIds = uniqueLimited([memory.subjectId, ...arc.rivalryWithSoldierIds], 6);
        arc.relationshipPressure.rivalry = clamp01(arc.relationshipPressure.rivalry + 0.08 * memory.emotionalWeight);
      }
    }

    const relationshipSummary =
      arc.relationshipPressure.protective >= 0.18
        ? "protective"
        : arc.relationshipPressure.rivalry >= 0.18
          ? "rivalry"
          : arc.resentment >= 0.18
            ? "officer strain"
            : arc.confidence >= 0.62
              ? "confident"
              : "steady";
    arc.relationshipPressure.summary = relationshipSummary;
  }

  private rememberDramaEvent(event: TownWarDramaEvent, position: Vec2 | null | undefined): TownWarDramaMemory | null {
    const classification = this.classifyDramaMemory(event);
    if (!classification) {
      return null;
    }

    const subjectId = event.soldierId ?? event.ammoCrateId ?? event.orderId ?? event.campId;
    const witnesses = this.findDramaWitnesses(event.faction, position, subjectId);
    const locationId = position
      ? `grid-${Math.round(position.x / 50)}-${Math.round(position.y / 50)}`
      : event.campId
        ? `${event.campId}-${this.state.officer.focusedLane}`
        : this.state.town.id;
    const subjectName = subjectId
      ? this.state.soldiers.find((soldier) => soldier.id === subjectId)
        ? this.buildSoldierChannel(this.state.soldiers.find((soldier) => soldier.id === subjectId)!)
        : subjectId
      : null;

    const memory: TownWarDramaMemory = {
      id: buildDramaMemoryId(this.state),
      eventId: event.id,
      eventKind: event.kind,
      tag: classification.tag,
      subjectId,
      subjectName,
      locationId,
      locationName: event.locationLabel,
      orderId: event.orderId,
      cause: classification.cause,
      witnessIds: witnesses.map((soldier) => soldier.id),
      responsibility: classification.responsibility,
      emotionalWeight: classification.emotionalWeight,
      ageOperations: 0,
      createdAtSeconds: this.state.clock.seconds,
      lastReferencedAt: null,
      summary: event.summary
    };

    this.state.dramaMemories = [memory, ...this.state.dramaMemories].slice(0, 40);
    for (const witness of witnesses) {
      witness.witnessedEventCount += 1;
      this.updateWitnessDramaArc(witness, memory);
      witness.dramaMemoryTags = uniqueLimited(
        [memory.tag, memory.cause, memory.responsibility, ...this.getSoldierArcTags(witness), ...witness.dramaMemoryTags],
        16
      );
    }

    return memory;
  }

  private classifyLocationScar(event: TownWarDramaEvent): {
    kind: TownWarLocationScarKind;
    tags: string[];
    emotionalWeight: number;
  } | null {
    if (event.kind === "builder-exposed") {
      return { kind: "road", tags: ["builder-hit-here"], emotionalWeight: 0.62 };
    }
    if (event.kind === "trench-completed" || event.kind === "line-held") {
      return { kind: "trench", tags: uniqueLimited(["trench-saved-line", ...event.tags], 12), emotionalWeight: event.kind === "line-held" ? 0.72 : 0.58 };
    }
    if (event.kind === "line-collapsed") {
      return { kind: "line", tags: uniqueLimited(["trench-overrun", "fallback-collapsed", ...event.tags], 12), emotionalWeight: 0.84 };
    }
    if (event.kind === "wounded-stabilized") {
      return { kind: "body", tags: ["wounded-saved-here"], emotionalWeight: 0.64 };
    }
    if (event.kind === "wounded-lost" || event.kind === "medic-rescue-stalled") {
      return {
        kind: "body",
        tags: [event.kind === "wounded-lost" ? "body-left-here" : "rescue-stalled-here"],
        emotionalWeight: event.kind === "wounded-lost" ? 0.86 : 0.62
      };
    }
    if (event.kind === "ammo-crate-empty") {
      return { kind: "ammo", tags: ["ammo-ran-dry"], emotionalWeight: 0.72 };
    }
    if (event.kind === "camp-damaged" || event.kind === "camp-destroyed") {
      return { kind: "camp", tags: [event.kind === "camp-destroyed" ? "last-stand" : "camp-shelled"], emotionalWeight: event.kind === "camp-destroyed" ? 0.95 : 0.72 };
    }
    if (event.kind === "bad-order-cost") {
      if (event.tags.some((tag) => tag === "ammo" || tag === "looted" || tag === "destroyed")) {
        return { kind: "ammo", tags: ["ammo-ran-dry"], emotionalWeight: 0.74 };
      }
      return { kind: "body", tags: ["body-left-here"], emotionalWeight: 0.82 };
    }
    return null;
  }

  private rememberLocationScar(event: TownWarDramaEvent, position: Vec2 | null | undefined): TownWarLocationScar | null {
    const classification = this.classifyLocationScar(event);
    if (!classification) {
      return null;
    }

    const scarId = this.getLocationScarId(position, event.locationLabel);
    const subjectNames = [
      event.soldierId
        ? this.state.soldiers.find((soldier) => soldier.id === event.soldierId)
          ? this.buildSoldierChannel(this.state.soldiers.find((soldier) => soldier.id === event.soldierId)!)
          : event.soldierId
        : null,
      event.ammoCrateId,
      event.campId
    ].filter((entry): entry is string => typeof entry === "string" && entry.length > 0);
    const existing = this.state.locationScars.find((scar) => scar.id === scarId) ?? null;

    if (existing) {
      existing.tags = uniqueLimited([...classification.tags, ...existing.tags], 12);
      existing.subjectNames = uniqueLimited([...subjectNames, ...existing.subjectNames], 8);
      existing.emotionalWeight = Math.max(existing.emotionalWeight, classification.emotionalWeight);
      existing.lastChangedAt = this.state.clock.seconds;
      existing.controlSide = event.faction;
      if (!existing.orderId && event.orderId) {
        existing.orderId = event.orderId;
      }
      this.state.focusedLocationScar = existing;
      return existing;
    }

    const scar: TownWarLocationScar = {
      id: scarId,
      label: event.locationLabel,
      kind: classification.kind,
      position: position ? cloneVec2(position) : null,
      tags: uniqueLimited(classification.tags, 12),
      createdByEventId: event.id,
      subjectNames: uniqueLimited(subjectNames, 8),
      orderId: event.orderId,
      controlSide: event.faction,
      emotionalWeight: classification.emotionalWeight,
      timesReferenced: event.referencedMemoryTag && classification.tags.includes(event.referencedMemoryTag) ? 1 : 0,
      createdAtSeconds: this.state.clock.seconds,
      lastChangedAt: this.state.clock.seconds
    };

    this.state.locationScars = [scar, ...this.state.locationScars].slice(0, 48);
    this.state.focusedLocationScar = scar;
    return scar;
  }

  private getDramaBeatTag(beat: TownWarDramaBeatKind): string {
    return `beat-${beat}`;
  }

  private classifyDramaBeat(input: {
    kind: TownWarDramaEventKind;
    faction: TownWarFactionId;
    orderId?: string | null;
    position?: Vec2 | null;
    riskTier: TownWarOfficerRiskTier | null;
    locationLabel: string;
  }): TownWarDramaBeatKind {
    const hasScarEcho = this.getActiveScarTags(input.faction, input.position ?? null, input.locationLabel).length > 0;
    const recentSameOrder = input.orderId
      ? this.state.dramaBeat.chain.find((entry) => entry.orderId === input.orderId && this.state.clock.seconds - entry.atSeconds <= 90) ?? null
      : null;

    if (hasScarEcho && !recentSameOrder && (input.kind === "builder-exposed" || input.kind === "line-held" || input.kind === "trench-completed")) {
      return "echo";
    }
    if (input.kind === "build-order-issued") {
      return "setup";
    }
    if (input.kind === "builder-moving" || input.kind === "construction-started") {
      return input.riskTier === "high" ? "rising-pressure" : "setup";
    }
    if (input.kind === "builder-exposed" || input.kind === "construction-stalled" || input.kind === "camp-under-fire" || input.kind === "medic-rescue-stalled") {
      return "complication";
    }
    if (input.kind === "ammo-crate-empty") {
      return "reversal";
    }
    if (input.kind === "bad-order-cost" || input.kind === "line-collapsed" || input.kind === "camp-destroyed" || input.kind === "wounded-lost") {
      return "cost";
    }
    if (input.kind === "trench-completed" || input.kind === "ammo-crate-completed" || input.kind === "line-held" || input.kind === "wounded-stabilized") {
      return recentSameOrder || input.riskTier !== "low" ? "payoff" : "aftermath";
    }
    if (input.kind === "camp-damaged") {
      const camp = this.getCamp(input.locationLabel.includes("Enemy") ? TOWN_WAR_ENEMY_FACTION : TOWN_WAR_PLAYER_FACTION);
      const healthRatio = camp ? camp.health.current / Math.max(1, camp.health.max) : 1;
      return healthRatio <= 0.35 ? "aftermath" : "complication";
    }
    if (input.kind === "ammo-crate-low" || input.kind === "fallback-ordered" || input.kind === "casualty-staged" || input.kind === "medic-rescue-started") {
      return "rising-pressure";
    }
    return "aftermath";
  }

  private getBeatCooldownSeconds(beat: TownWarDramaBeatKind, eventKind: TownWarDramaEventKind): number {
    if (eventKind === "camp-destroyed") {
      return 5;
    }
    if (beat === "setup") {
      return 12;
    }
    if (beat === "rising-pressure") {
      return 10;
    }
    if (beat === "payoff" || beat === "echo") {
      return 12;
    }
    if (beat === "aftermath") {
      return 18;
    }
    return 4;
  }

  private rememberDramaBeat(event: TownWarDramaEvent, beat: TownWarDramaBeatKind): TownWarDramaBeatEntry {
    const entry: TownWarDramaBeatEntry = {
      id: buildDramaBeatId(this.state),
      beat,
      eventId: event.id,
      eventKind: event.kind,
      orderId: event.orderId,
      locationLabel: event.locationLabel,
      atSeconds: event.atSeconds,
      intensity: event.intensity,
      summary: event.summary,
      tags: uniqueLimited([this.getDramaBeatTag(beat), ...event.tags], 12)
    };

    this.state.dramaBeat.current = entry;
    this.state.dramaBeat.chain = [entry, ...this.state.dramaBeat.chain].slice(0, 24);
    if (beat === "payoff") {
      this.state.dramaBeat.lastPayoff = entry;
    }
    return entry;
  }

  private chooseDebriefCategory(event: TownWarDramaEvent, beat: TownWarDramaBeatKind): TownWarDebriefEcho["category"] {
    if (event.tags.includes("casualty") || event.tags.includes("body") || beat === "cost") {
      return "memorial";
    }
    if (event.tags.includes("builder") || event.tags.includes("order") || event.referencedMemoryTag === "officer-cost") {
      return "officer-responsibility";
    }
    return "after-action";
  }

  private rememberDebriefEcho(event: TownWarDramaEvent, beat: TownWarDramaBeatKind): TownWarDebriefEcho {
    const category = this.chooseDebriefCategory(event, beat);
    const templates =
      category === "memorial"
        ? DEBRIEF_MEMORIAL_TEMPLATES
        : category === "officer-responsibility"
          ? DEBRIEF_RESPONSIBILITY_TEMPLATES
          : DEBRIEF_AFTER_ACTION_TEMPLATES;
    const index = Math.floor(getDeterministicUnit(event.atSeconds + event.id.length + event.summary.length) * templates.length);
    const template = templates[Math.min(templates.length - 1, Math.max(0, index))] ?? "{summary}";
    const text = template.split("{summary}").join(event.summary).split("{beat}").join(beat);
    const echo: TownWarDebriefEcho = {
      id: buildDebriefEchoId(this.state),
      atSeconds: event.atSeconds,
      beat,
      eventId: event.id,
      eventKind: event.kind,
      category,
      text,
      sourceSummary: event.summary,
      tags: uniqueLimited([this.getDramaBeatTag(beat), category, ...event.tags], 12)
    };

    this.state.debriefEchoes = [echo, ...this.state.debriefEchoes].slice(0, 20);
    return echo;
  }

  private emitDramaEvent(input: {
    kind: TownWarDramaEventKind;
    faction: TownWarFactionId;
    campId?: TownWarFactionId | null;
    orderId?: string | null;
    orderKind?: TownWarBuildOrderKind | null;
    soldierId?: string | null;
    ammoCrateId?: string | null;
    position?: Vec2 | null;
    locationLabel?: string | null;
    riskTier?: TownWarOfficerRiskTier | null;
    summary: string;
    tags: string[];
  }): TownWarDramaEvent {
    const locationLabel = input.locationLabel ?? this.getDramaLocationLabel(input.position, input.orderKind ?? "war order");
    const riskTier = input.riskTier ?? (input.position ? this.computeRiskTier(input.faction, input.position) : null);
    const beat = this.classifyDramaBeat({
      kind: input.kind,
      faction: input.faction,
      orderId: input.orderId ?? null,
      position: input.position ?? null,
      riskTier,
      locationLabel
    });
    const line = this.resolveDramaLine({
      kind: input.kind,
      faction: input.faction,
      orderKind: input.orderKind ?? null,
      locationLabel,
      summary: input.summary,
      soldierId: input.soldierId ?? null,
      position: input.position ?? null,
      riskTier,
      beat
    });
    const event: TownWarDramaEvent = {
      id: buildDramaEventId(this.state),
      atSeconds: this.state.clock.seconds,
      kind: input.kind,
      faction: input.faction,
      campId: input.campId ?? input.faction,
      orderId: input.orderId ?? null,
      orderKind: input.orderKind ?? null,
      soldierId: input.soldierId ?? null,
      ammoCrateId: input.ammoCrateId ?? null,
      locationLabel,
      riskTier,
      intensity: this.getDramaIntensity(input.kind, riskTier),
      summary: input.summary,
      tags: [...input.tags],
      speaker: line?.speaker ?? null,
      channel: line?.channel ?? null,
      text: line?.text ?? null,
      referencedMemoryTag: line?.referencedMemoryTag ?? null
    };

    this.state.dialogue.lastDramaEvent = event;
    this.state.dialogue.recentDramaEvents = [event, ...this.state.dialogue.recentDramaEvents].slice(0, 12);
    this.state.dialogue.activeOfficerWarTags = [
      ...new Set(this.state.dialogue.recentDramaEvents.flatMap((entry) => [entry.kind, ...entry.tags]))
    ].slice(0, 16);
    this.state.dialogue.activeScarTags = this.getActiveScarTags(input.faction, input.position ?? null, locationLabel);

    if (line) {
      this.pushChatter({
        faction: input.faction,
        channel: line.speaker,
        text: line.text,
        tags: ["drama", this.getDramaBeatTag(beat), input.kind, ...input.tags],
        cooldownKey: `drama:${input.faction}:${input.kind}:${input.orderId ?? input.ammoCrateId ?? locationLabel}`,
        cooldownSeconds: this.getBeatCooldownSeconds(beat, input.kind)
      });
    }

    this.rememberDramaBeat(event, beat);
    this.rememberDebriefEcho(event, beat);
    this.rememberDramaEvent(event, input.position ?? null);
    const scar = this.rememberLocationScar(event, input.position ?? null);
    if (scar) {
      this.state.dialogue.activeScarTags = uniqueLimited([...scar.tags, ...this.state.dialogue.activeScarTags], 12);
    }
    return event;
  }

  private tickAmmoConsumption(deltaSeconds: number): void {
    for (const combatant of this.state.combatants) {
      if (combatant.task.targetPosition) {
        continue;
      }
      const roundsPerSecond =
        combatant.task.kind === "suppress"
          ? SUPPRESS_FIRE_ROUNDS_PER_SECOND
          : combatant.task.kind === "attack"
            ? ATTACK_FIRE_ROUNDS_PER_SECOND
            : combatant.task.kind === "defend"
              ? DEFEND_FIRE_ROUNDS_PER_SECOND
              : 0;
      const shots = Math.max(0, Math.round(deltaSeconds * roundsPerSecond));
      if (shots <= 0) {
        continue;
      }

      for (let shot = 0; shot < shots; shot += 1) {
        if (combatant.ammo.inMag > 0) {
          combatant.ammo.inMag = Math.max(0, combatant.ammo.inMag - 1);
          continue;
        }

        if (combatant.ammo.reserve <= 0) {
          break;
        }

        const load = Math.min(combatant.ammo.maxMag, combatant.ammo.reserve);
        combatant.ammo.inMag = load;
        combatant.ammo.reserve = Math.max(0, combatant.ammo.reserve - load);
      }
    }
  }

  private tickPressureRecovery(deltaSeconds: number): void {
    for (const combatant of this.state.combatants) {
      const trenchRecoveryScale = this.getOccupiedTrenchSlot(combatant) ? 0.38 : 1;
      combatant.morale.pressure = Math.max(0, combatant.morale.pressure - PRESSURE_RECOVERY_PER_SECOND * trenchRecoveryScale * deltaSeconds);
    }
  }

  private getFrontlineLaneY(lane: TownWarOfficerLaneId = this.state.officer.focusedLane): number {
    return lane === "north" ? WORLD_HEIGHT * 0.5 - 140 : lane === "south" ? WORLD_HEIGHT * 0.5 + 140 : WORLD_HEIGHT * 0.5;
  }

  private getFrontlineFocusPosition(lane: TownWarOfficerLaneId = this.state.officer.focusedLane): Vec2 {
    const campALineX = this.getCampLineX("camp-a");
    const campBLineX = this.getCampLineX("camp-b");
    return {
      x: (campALineX + campBLineX) / 2,
      y: this.getFrontlineLaneY(lane)
    };
  }

  private getContestedSectorLabel(position: Vec2): string {
    const focus = this.getFrontlineFocusPosition();
    const yDelta = position.y - focus.y;
    if (yDelta < -90) {
      return "school wall";
    }
    if (yDelta > 90) {
      return "fuel yard approach";
    }
    const xDelta = Math.abs(position.x - focus.x);
    return xDelta < 150 ? "road crossing" : "market ruins";
  }

  private getOfficerThreatRead(): { score: number; share: number; reason: string } {
    const officer = this.state.officer;
    const opposingCampId = this.getOpposingCampId(officer.faction);
    const opposingCamp = this.getCamp(opposingCampId);
    const ownCamp = this.getCamp(officer.faction);
    const distanceToEnemyCamp = opposingCamp ? getDistance(officer.position, opposingCamp.spawn.position) : Number.POSITIVE_INFINITY;
    const distanceToOwnCamp = ownCamp ? getDistance(officer.position, ownCamp.spawn.position) : Number.POSITIVE_INFINITY;
    const secondsSinceCommand = this.state.clock.seconds - (officer.lastCommandAtSeconds ?? 0);
    const recentForwardCommand =
      typeof officer.lastCommandRead === "string" &&
      (officer.lastCommandRead.includes("Order") || officer.lastCommandRead.includes("Focus lane")) &&
      secondsSinceCommand >= 0 &&
      secondsSinceCommand <= 10;

    let score = 0;
    let reason = "officer quiet behind friendly line";

    if (distanceToEnemyCamp <= PLAYER_THREAT_IDLE_DISTANCE) {
      score += 55;
      reason = "officer exposed near enemy camp";
    } else if (distanceToOwnCamp > 420) {
      score += 22;
      reason = "officer forward of friendly line";
    }

    if (recentForwardCommand) {
      score += 16;
      reason = score >= 45 ? `${reason}; recent command traffic` : "recent command traffic";
    }

    const share = clamp01(Math.min(PLAYER_THREAT_MAX_SHARE, score / 100));
    return {
      score: Number(score.toFixed(2)),
      share: Number(share.toFixed(3)),
      reason
    };
  }

  private scoreThreatTarget(
    combatant: TownWarCombatantState,
    candidate: TownWarCombatantState,
    maxDistance: number
  ): { enemy: TownWarCombatantState; distance: number; intent: TownWarTargetIntentState } | null {
    if (candidate.faction === combatant.faction) {
      return null;
    }

    const distance = getDistance(candidate.position, combatant.position);
    const rangeRead = this.getTrenchFireRangeRead(combatant, maxDistance, candidate.position);
    const effectiveMaxDistance = rangeRead.range;
    if (distance > effectiveMaxDistance) {
      return null;
    }

    const focus = this.state.aiThreats.frontlineFocus.position;
    const distanceScore = (1 - distance / Math.max(1, effectiveMaxDistance)) * 40;
    const frontlineScore = Math.max(0, 20 - getDistance(candidate.position, focus) / 24);
    const pressureRatio = candidate.morale.pressure / Math.max(1, candidate.morale.maxPressure);
    let score = 45 + distanceScore + frontlineScore + pressureRatio * 12;
    let targetKind: TownWarTargetIntentState["targetKind"] = "soldier";
    let reason = "visible enemy soldier on the frontline";
    if (rangeRead.slot && rangeRead.label !== "none") {
      if (rangeRead.label === "front-protected") {
        score += 18;
        reason = `trench firing bay extends reach to ${Math.round(effectiveMaxDistance)}m`;
      } else if (rangeRead.label === "angled") {
        score += 7;
        reason = `angled trench extends partial fire to ${Math.round(effectiveMaxDistance)}m`;
      } else {
        score -= 10;
        reason = "enfiladed trench has poor firing reach";
      }
    }

    if (candidate.role === "builder" || candidate.task.kind === "build") {
      score += 28;
      targetKind = "builder";
      reason = rangeRead.slot && rangeRead.label !== "none" ? `${reason}; exposed builder near active work` : "exposed builder near active work";
    } else if (candidate.task.kind === "suppress") {
      score += 24;
      targetKind = "suppression-source";
      reason = rangeRead.slot && rangeRead.label !== "none" ? `${reason}; enemy suppressor spotted` : "enemy suppressor spotted";
    } else if (candidate.task.kind === "resupply") {
      score += 18;
      targetKind = "ammo";
      reason = rangeRead.slot && rangeRead.label !== "none" ? `${reason}; covering ammo run` : "covering ammo run";
    } else if (candidate.task.kind === "defend") {
      score += 10;
      reason = rangeRead.slot && rangeRead.label !== "none" ? `${reason}; defender holding the contested lane` : "defender holding the contested lane";
    }

    const candidateCover = this.findCoverSlot(candidate.coverIntent.coverSlotId);
    const candidateInTrench =
      candidateCover !== null &&
      candidateCover.sourceKind === "trench" &&
      candidateCover.occupiedBySoldierId === candidate.id &&
      getDistance(candidate.position, candidateCover.position) <= COVER_OCCUPY_DISTANCE;
    if (candidateInTrench && candidateCover) {
      const directionRead = this.getDirectionalCoverProtection(candidateCover, combatant.position);
      if (combatant.task.kind === "suppress") {
        score += directionRead.label === "enfiladed" ? 30 : directionRead.label === "angled" ? 22 : 14;
        targetKind = "suppression-source";
        reason =
          directionRead.label === "enfiladed"
            ? "suppressing exposed trench from the flank"
            : directionRead.label === "angled"
              ? "suppressing angled occupied trench"
              : "pinning fronted occupied trench";
      } else if (combatant.task.kind === "attack" && distance <= TRENCH_GRENADE_RANGE) {
        score += directionRead.label === "front-protected" ? 18 : 26;
        reason =
          directionRead.label === "front-protected"
            ? "close assault on occupied trench with grenades"
            : "flank assault on occupied trench with grenades";
      } else if (directionRead.label === "front-protected") {
        score -= 22;
        reason = "fronted trench is hard to dislodge";
      } else if (directionRead.label === "angled") {
        score -= 4;
        reason = "angled trench defender partially exposed";
      } else {
        score += 26;
        reason = "enfiladed trench defender exposed down the trench";
      }
    }

    const enemyOrder = candidate.task.targetEntityId
      ? this.state.orders.find((order) => order.id === candidate.task.targetEntityId && order.status === "assigned") ?? null
      : null;
    if (enemyOrder) {
      score += 16;
      targetKind = "build-site";
      reason = "active enemy build site";
    }

    return {
      enemy: candidate,
      distance,
      intent: {
        targetKind,
        targetId: candidate.id,
        targetScore: Number(score.toFixed(2)),
        reason,
        lastUpdatedAtSeconds: this.state.clock.seconds
      }
    };
  }

  private findBestThreatTarget(
    combatant: TownWarCombatantState,
    maxDistance: number
  ): { enemy: TownWarCombatantState; distance: number; intent: TownWarTargetIntentState } | null {
    let best: { enemy: TownWarCombatantState; distance: number; intent: TownWarTargetIntentState } | null = null;

    for (const candidate of this.state.combatants) {
      const scored = this.scoreThreatTarget(combatant, candidate, maxDistance);
      if (!scored) {
        continue;
      }
      if (!best || scored.intent.targetScore > best.intent.targetScore) {
        best = scored;
      }
    }

    return best;
  }

  private refreshAiThreats(): void {
    const focusPosition = this.getFrontlineFocusPosition();
    const pressure: Record<TownWarFactionId, number> = { "camp-a": 0, "camp-b": 0 };
    const contacts: TownWarThreatContactState[] = [];
    const officerThreat = this.getOfficerThreatRead();

    for (const combatant of this.state.combatants) {
      const nearbyEnemies = this.state.combatants.filter(
        (candidate) =>
          candidate.faction !== combatant.faction &&
          getDistance(candidate.position, combatant.position) <= FRONTLINE_CONTACT_RANGE
      );
      const closestEnemy = nearbyEnemies.reduce<TownWarCombatantState | null>((best, candidate) => {
        if (!best) {
          return candidate;
        }
        return getDistance(candidate.position, combatant.position) < getDistance(best.position, combatant.position) ? candidate : best;
      }, null);

      if (!closestEnemy) {
        combatant.targetIntent = createIdleTargetIntent("moving toward assigned frontline objective", this.state.clock.seconds);
      } else {
        const scored = this.scoreThreatTarget(combatant, closestEnemy, this.getBaseFireRangeForCombatant(combatant) ?? FRONTLINE_CONTACT_RANGE);
        combatant.targetIntent = scored?.intent ?? createIdleTargetIntent("watching for contact", this.state.clock.seconds);
      }

      const pressureContribution = Math.max(0, 1 - getDistance(combatant.position, focusPosition) / FRONTLINE_CONTACT_RANGE);
      pressure[combatant.faction] = Number((pressure[combatant.faction] + pressureContribution).toFixed(3));

      if (closestEnemy) {
        contacts.push({
          id: `${combatant.id}->${closestEnemy.id}`,
          faction: combatant.faction,
          sourceId: closestEnemy.id,
          sourceKind: combatant.targetIntent.targetKind,
          position: cloneVec2(closestEnemy.position),
          score: combatant.targetIntent.targetScore,
          reason: combatant.targetIntent.reason,
          seenAtSeconds: this.state.clock.seconds
        });
      }
    }

    if (officerThreat.score > 0) {
      contacts.push({
        id: `${this.getOpposingCampId(this.state.officer.faction)}->officer`,
        faction: this.getOpposingCampId(this.state.officer.faction),
        sourceId: "officer",
        sourceKind: "player",
        position: cloneVec2(this.state.officer.position),
        score: officerThreat.score,
        reason: officerThreat.reason,
        seenAtSeconds: this.state.clock.seconds
      });
    }

    this.state.aiThreats = {
      playerThreatShare: officerThreat.share,
      playerThreatScore: officerThreat.score,
      playerThreatReason: officerThreat.reason,
      frontlineFocus: {
        lane: this.state.officer.focusedLane,
        position: focusPosition,
        label: `${this.state.officer.focusedLane} ${this.getContestedSectorLabel(focusPosition)}`,
        pressure
      },
      contacts: contacts.sort((left, right) => right.score - left.score).slice(0, 16)
    };
  }

  private getBestCoverSlotForSoldier(soldier: TownWarSoldierState): TownWarCoverSlotState | null {
    const expectedThreatPosition =
      this.state.aiThreats.contacts.find((contact) => contact.faction === soldier.faction)?.position ??
      this.getCampSpawn(this.getOpposingCampId(soldier.faction)).position;

    const getScore = (slot: TownWarCoverSlotState): number => {
      const distance = getDistance(soldier.position, slot.position);
      const taskAnchor = soldier.task.targetPosition ?? this.getFrontlineFocusPosition();
      const taskAnchorDistance = getDistance(slot.position, taskAnchor);
      const directionRead = this.getDirectionalCoverProtection(slot, expectedThreatPosition);
      const trenchTaskFit =
        slot.sourceKind === "trench" && taskAnchorDistance <= TRENCH_TASK_ANCHOR_DISTANCE
          ? 42 + (1 - taskAnchorDistance / TRENCH_TASK_ANCHOR_DISTANCE) * 24
          : 0;
      const trenchCombatFit =
        slot.sourceKind === "trench" && (soldier.task.kind === "defend" || soldier.task.kind === "suppress" || soldier.task.kind === "attack")
          ? 18
          : 0;
      const directionalFit =
        slot.sourceKind === "trench"
          ? directionRead.label === "front-protected"
            ? 34
            : directionRead.label === "angled"
              ? 10
              : -42
          : 0;
      const connectedDugout = slot.sourceKind === "trench" ? this.getDugoutForCoverSlot(slot.id) : null;
      const dugoutRallyFit =
        connectedDugout && connectedDugout.status !== "destroyed"
          ? connectedDugout.status === "contested"
            ? 16
            : connectedDugout.status === "damaged"
              ? 24
              : 44
          : 0;
      return (
        directionRead.protection * 100 -
        slot.exposure * 35 -
        distance * 0.08 +
        (slot.sourceKind === "trench" ? 18 : 0) +
        trenchTaskFit +
        trenchCombatFit +
        directionalFit +
        dugoutRallyFit
      );
    };

    return this.state.aiTactics.coverSlots.reduce<TownWarCoverSlotState | null>((best, slot) => {
      if (slot.faction !== null && slot.faction !== soldier.faction) {
        return best;
      }
      if (slot.occupiedBySoldierId !== null && slot.occupiedBySoldierId !== soldier.id) {
        return best;
      }
      const score = getScore(slot);
      if (!best) {
        return slot;
      }
      const bestScore = getScore(best);
      return score > bestScore ? slot : best;
    }, null);
  }

  private getShortestAngleDeltaRadians(left: number, right: number): number {
    const delta = Math.abs(normalizeAngleRadians(left - right));
    return delta > Math.PI ? Math.PI * 2 - delta : delta;
  }

  private getTrenchBroadsideFit(slot: TownWarCoverSlotState, sourcePosition: Vec2): number {
    if (slot.sourceKind !== "trench") {
      return 1;
    }
    const sourceAngle = Math.atan2(sourcePosition.y - slot.position.y, sourcePosition.x - slot.position.x);
    const delta = this.getShortestAngleDeltaRadians(sourceAngle, slot.facingAngleRadians);
    return clamp01(Math.abs(Math.sin(delta)));
  }

  private getDirectionalCoverProtection(
    slot: TownWarCoverSlotState,
    sourcePosition: Vec2
  ): { protection: number; fit: number; label: "front-protected" | "angled" | "enfiladed" } {
    if (slot.sourceKind !== "trench") {
      return { protection: slot.protection, fit: 1, label: "front-protected" };
    }

    const fit = this.getTrenchBroadsideFit(slot, sourcePosition);
    const multiplier = clamp(0.22 + fit * 0.94, 0.18, 1.08);
    return {
      protection: clamp01(slot.protection * multiplier),
      fit,
      label: fit >= 0.72 ? "front-protected" : fit >= 0.38 ? "angled" : "enfiladed"
    };
  }

  private getOccupiedTrenchSlot(combatant: TownWarCombatantState): TownWarCoverSlotState | null {
    const slot = this.findCoverSlot(combatant.coverIntent.coverSlotId);
    if (
      slot?.sourceKind === "trench" &&
      slot.occupiedBySoldierId === combatant.id &&
      getDistance(combatant.position, slot.position) <= COVER_OCCUPY_DISTANCE
    ) {
      return slot;
    }

    return null;
  }

  private isSoldierOccupyingCoverSlot(soldier: TownWarSoldierState, slot: TownWarCoverSlotState | null): boolean {
    return Boolean(slot && slot.occupiedBySoldierId === soldier.id && getDistance(soldier.position, slot.position) <= COVER_OCCUPY_DISTANCE);
  }

  private getTrenchFireRangeRead(
    combatant: TownWarCombatantState,
    baseRange: number,
    targetPosition: Vec2
  ): { range: number; multiplier: number; label: "none" | "front-protected" | "angled" | "enfiladed"; slot: TownWarCoverSlotState | null } {
    const slot = this.getOccupiedTrenchSlot(combatant);
    if (!slot) {
      return { range: baseRange, multiplier: 1, label: "none", slot: null };
    }

    const directionRead = this.getDirectionalCoverProtection(slot, targetPosition);
    const multiplier =
      directionRead.label === "front-protected"
        ? TRENCH_FIRE_RANGE_FRONT_MULTIPLIER
        : directionRead.label === "angled"
          ? TRENCH_FIRE_RANGE_ANGLED_MULTIPLIER
          : TRENCH_FIRE_RANGE_ENFILADED_MULTIPLIER;
    return {
      range: baseRange * multiplier,
      multiplier,
      label: directionRead.label,
      slot
    };
  }

  private getBaseFireRangeForCombatant(combatant: TownWarCombatantState): number | null {
    if (combatant.task.kind === "suppress") {
      return SUPPRESS_FIRE_RANGE;
    }
    if (combatant.task.kind === "attack") {
      return ATTACK_FIRE_RANGE;
    }
    if (combatant.task.kind === "defend") {
      return DEFEND_FIRE_RANGE;
    }
    return null;
  }

  private getTrenchGrenadeRead(
    attacker: TownWarCombatantState,
    target: TownWarCombatantState,
    targetCover: TownWarCoverSlotState | null,
    seed: number,
    deltaSeconds: number
  ): { damage: number; pressure: number; reason: string | null } {
    if (
      targetCover?.sourceKind !== "trench" ||
      targetCover.occupiedBySoldierId !== target.id ||
      getDistance(target.position, targetCover.position) > COVER_OCCUPY_DISTANCE
    ) {
      return { damage: 0, pressure: 0, reason: null };
    }

    const distanceToTrench = getDistance(attacker.position, targetCover.position);
    if (distanceToTrench > TRENCH_GRENADE_RANGE) {
      return { damage: 0, pressure: 0, reason: null };
    }

    const roleChance =
      attacker.task.kind === "attack"
        ? 0.25
        : attacker.task.kind === "suppress"
          ? 0.14
          : 0.08;
    const roll = getDeterministicUnit(seed + 701);
    if (roll > roleChance * deltaSeconds) {
      return { damage: 0, pressure: 0, reason: null };
    }

    const proximity = clamp(1 - distanceToTrench / Math.max(1, TRENCH_GRENADE_RANGE), 0.18, 1);
    const directionRead = this.getDirectionalCoverProtection(targetCover, attacker.position);
    const flankMultiplier = directionRead.label === "enfiladed" ? 1.22 : directionRead.label === "angled" ? 1.08 : 0.94;
    const scale = proximity * TRENCH_GRENADE_INSIDE_MULTIPLIER * flankMultiplier;
    return {
      damage: TRENCH_GRENADE_DAMAGE * scale,
      pressure: TRENCH_GRENADE_PRESSURE * scale,
      reason: `grenade into occupied trench ${Math.round(distanceToTrench)}m`
    };
  }

  private getNearestFriendlySuppressor(soldier: TownWarSoldierState): TownWarSoldierState | null {
    return this.state.soldiers.reduce<TownWarSoldierState | null>((best, candidate) => {
      if (candidate.id === soldier.id || candidate.faction !== soldier.faction || candidate.role !== "suppressor") {
        return best;
      }
      const distance = getDistance(candidate.position, soldier.position);
      if (distance > 360) {
        return best;
      }
      if (!best || distance < getDistance(best.position, soldier.position)) {
        return candidate;
      }
      return best;
    }, null);
  }

  private refreshCoverOccupancy(): void {
    for (const slot of this.state.aiTactics.coverSlots) {
      slot.occupiedBySoldierId = null;
    }

    for (const soldier of this.state.soldiers) {
      const slot = this.findCoverSlot(soldier.coverIntent.coverSlotId);
      if (!slot) {
        continue;
      }
      if (slot.occupiedBySoldierId !== null && slot.occupiedBySoldierId !== soldier.id) {
        continue;
      }
      if (getDistance(soldier.position, slot.position) <= COVER_OCCUPY_DISTANCE) {
        slot.occupiedBySoldierId = soldier.id;
        soldier.coverIntent = {
          coverSlotId: slot.id,
          state: "occupying",
          reason: `holding ${slot.label}`
        };
      }
    }
  }

  private refreshTacticalIntents(): void {
    this.refreshCoverOccupancy();
    const suppressionByFaction: Record<TownWarFactionId, { pressure: number; pinnedSoldierIds: string[] }> = {
      "camp-a": { pressure: 0, pinnedSoldierIds: [] },
      "camp-b": { pressure: 0, pinnedSoldierIds: [] }
    };
    const tacticalPairs: TownWarTacticalPairState[] = [];

    for (const soldier of this.state.soldiers) {
      const pressureRatio = soldier.morale.pressure / Math.max(1, soldier.morale.maxPressure);
      suppressionByFaction[soldier.faction].pressure += pressureRatio;
      if (pressureRatio >= COVER_SEEK_PRESSURE_RATIO) {
        suppressionByFaction[soldier.faction].pinnedSoldierIds.push(soldier.id);
      }

      const coverSlot = this.getBestCoverSlotForSoldier(soldier);
      const occupiedCover = this.findCoverSlot(soldier.coverIntent.coverSlotId);
      const ownedCover = this.isSoldierOccupyingCoverSlot(soldier, occupiedCover) ? occupiedCover : null;
      const inCover = ownedCover !== null;
      const suppressor = this.getNearestFriendlySuppressor(soldier);

      if (soldier.task.kind === "move" && soldier.task.label?.toLowerCase().includes("retreat")) {
        soldier.tacticalIntent = {
          state: "fallback",
          reason: "falling back under pressure",
          coverSlotId: null,
          partnerId: suppressor?.id ?? null,
          pressureRatio: Number(pressureRatio.toFixed(3)),
          lastUpdatedAtSeconds: this.state.clock.seconds
        };
        continue;
      }

      if (soldier.role === "builder" && soldier.task.kind === "build" && pressureRatio >= COVER_SEEK_PRESSURE_RATIO) {
        soldier.tacticalIntent = {
          state: "cover-builder",
          reason: suppressor ? "builder waiting for fire support" : "builder exposed without covering fire",
          coverSlotId: coverSlot?.id ?? null,
          partnerId: suppressor?.id ?? null,
          pressureRatio: Number(pressureRatio.toFixed(3)),
          lastUpdatedAtSeconds: this.state.clock.seconds
        };
        soldier.coverIntent = coverSlot
          ? { coverSlotId: coverSlot.id, state: inCover ? "occupying" : "reserved", reason: `nearest fallback cover: ${coverSlot.label}` }
          : createNoCoverIntent("no cover near build site");
        if (suppressor) {
          tacticalPairs.push({
            id: `${suppressor.id}->${soldier.id}`,
            faction: soldier.faction,
            suppressorId: suppressor.id,
            moverId: soldier.id,
            state: "covering-builder",
            reason: "suppressor covering exposed builder"
          });
        }
        continue;
      }

      if (pressureRatio >= COVER_FALLBACK_PRESSURE_RATIO) {
        soldier.tacticalIntent = {
          state: "fallback",
          reason: "falling back under pressure",
          coverSlotId: coverSlot?.id ?? null,
          partnerId: suppressor?.id ?? null,
          pressureRatio: Number(pressureRatio.toFixed(3)),
          lastUpdatedAtSeconds: this.state.clock.seconds
        };
        soldier.coverIntent = coverSlot
          ? { coverSlotId: coverSlot.id, state: inCover ? "occupying" : "reserved", reason: `fallback through ${coverSlot.label}` }
          : createNoCoverIntent("fallback has no safe cover");
        continue;
      }

      if (pressureRatio >= COVER_SEEK_PRESSURE_RATIO && coverSlot) {
        if (!inCover && soldier.task.kind !== "build" && soldier.task.kind !== "resupply" && soldier.task.kind !== "heal") {
          const resumeTask: TownWarTask = {
            ...soldier.task,
            targetPosition: null,
            resumeTask: null
          };
          soldier.task = {
            kind: "move",
            label: `Seek cover: ${coverSlot.label}`,
            targetPosition: cloneVec2(coverSlot.position),
            targetEntityId: coverSlot.id,
            resumeTask
          };
        }

        soldier.tacticalIntent = {
          state: inCover ? "hold-cover" : "seek-cover",
          reason: inCover ? `pinned behind ${coverSlot.label}` : `seeking ${coverSlot.label}`,
          coverSlotId: coverSlot.id,
          partnerId: suppressor?.id ?? null,
          pressureRatio: Number(pressureRatio.toFixed(3)),
          lastUpdatedAtSeconds: this.state.clock.seconds
        };
        soldier.coverIntent = {
          coverSlotId: coverSlot.id,
          state: inCover ? "occupying" : "moving",
          reason: inCover ? `holding ${coverSlot.label}` : `moving to ${coverSlot.label}`
        };
        if (suppressor && suppressor.id !== soldier.id) {
          tacticalPairs.push({
            id: `${suppressor.id}->${soldier.id}`,
            faction: soldier.faction,
            suppressorId: suppressor.id,
            moverId: soldier.id,
            state: "covering-advance",
            reason: "covering movement under suppression"
          });
        }
        continue;
      }

      const shouldProactivelyOccupyTrench =
        coverSlot?.sourceKind === "trench" &&
        !inCover &&
        soldier.task.kind !== "move" &&
        soldier.task.kind !== "build" &&
        soldier.task.kind !== "resupply" &&
        soldier.task.kind !== "heal" &&
        getDistance(soldier.position, coverSlot.position) <= TRENCH_PROACTIVE_SEEK_DISTANCE;

      if (coverSlot && shouldProactivelyOccupyTrench) {
        const connectedDugout = this.getDugoutForCoverSlot(coverSlot.id);
        const resumeTask: TownWarTask = {
          kind: soldier.task.kind === "suppress" ? "suppress" : "defend",
          label: `Hold from ${coverSlot.label}`,
          targetPosition: null,
          targetEntityId: coverSlot.id
        };
        soldier.task = {
          kind: "move",
          label: `Occupy trench: ${coverSlot.label}`,
          targetPosition: cloneVec2(coverSlot.position),
          targetEntityId: coverSlot.id,
          resumeTask
        };
        soldier.tacticalIntent = {
          state: "seek-cover",
          reason: connectedDugout ? `dugout rally pulling soldier into connected trench: ${coverSlot.label}` : `taking trench cover: ${coverSlot.label}`,
          coverSlotId: coverSlot.id,
          partnerId: suppressor?.id ?? null,
          pressureRatio: Number(pressureRatio.toFixed(3)),
          lastUpdatedAtSeconds: this.state.clock.seconds
        };
        soldier.coverIntent = {
          coverSlotId: coverSlot.id,
          state: "moving",
          reason: connectedDugout ? `moving into dugout-connected trench: ${coverSlot.label}` : `moving into trench: ${coverSlot.label}`
        };
        continue;
      }

      if (soldier.role === "suppressor" && soldier.task.kind === "suppress") {
        soldier.tacticalIntent = {
          state: "suppress-area",
          reason: "covering advance",
          coverSlotId: ownedCover ? ownedCover.id : (coverSlot?.id ?? null),
          partnerId: null,
          pressureRatio: Number(pressureRatio.toFixed(3)),
          lastUpdatedAtSeconds: this.state.clock.seconds
        };
        soldier.coverIntent = ownedCover
          ? { coverSlotId: ownedCover.id, state: "occupying", reason: `weapon braced at ${ownedCover.label}` }
          : coverSlot
            ? { coverSlotId: coverSlot.id, state: "reserved", reason: `preferred firing cut: ${coverSlot.label}` }
            : createNoCoverIntent("no cover assigned");
        continue;
      }

      if (soldier.ammo.inMag <= Math.max(1, Math.floor(soldier.ammo.maxMag * 0.18)) && coverSlot) {
        soldier.tacticalIntent = {
          state: "reload-behind-cover",
          reason: "reload window",
          coverSlotId: coverSlot.id,
          partnerId: suppressor?.id ?? null,
          pressureRatio: Number(pressureRatio.toFixed(3)),
          lastUpdatedAtSeconds: this.state.clock.seconds
        };
        soldier.coverIntent = {
          coverSlotId: coverSlot.id,
          state: inCover ? "occupying" : "reserved",
          reason: `reload cover: ${coverSlot.label}`
        };
        continue;
      }

      if (inCover && occupiedCover?.sourceKind === "trench") {
        soldier.tacticalIntent = {
          state: "hold-cover",
          reason: `trench reducing pressure at ${ownedCover.label}`,
          coverSlotId: ownedCover.id,
          partnerId: suppressor?.id ?? null,
          pressureRatio: Number(pressureRatio.toFixed(3)),
          lastUpdatedAtSeconds: this.state.clock.seconds
        };
        soldier.coverIntent = {
          coverSlotId: ownedCover.id,
          state: "occupying",
          reason: `holding trench: ${ownedCover.label}`
        };
        continue;
      }

      soldier.tacticalIntent = createIdleTacticalIntent("watching assigned sector", this.state.clock.seconds);
      soldier.tacticalIntent.pressureRatio = Number(pressureRatio.toFixed(3));
      soldier.coverIntent = coverSlot
        ? { coverSlotId: coverSlot.id, state: "reserved", reason: `nearest cover: ${coverSlot.label}` }
        : createNoCoverIntent("no cover assigned");
    }

    for (const faction of ["camp-a", "camp-b"] as TownWarFactionId[]) {
      if (tacticalPairs.some((pair) => pair.faction === faction)) {
        continue;
      }

      const suppressor = this.state.soldiers.find(
        (soldier) =>
          soldier.faction === faction &&
          soldier.role === "suppressor" &&
          (soldier.task.kind === "suppress" || soldier.tacticalIntent.state === "suppress-area")
      );

      if (!suppressor) {
        continue;
      }

      const movers = this.state.soldiers
        .filter((soldier) => soldier.faction === faction && soldier.id !== suppressor.id && soldier.task.kind !== "heal")
        .sort((a, b) => {
          const priorityA = a.role === "builder" ? 0 : a.tacticalIntent.state === "seek-cover" || a.tacticalIntent.state === "hold-cover" ? 1 : 2;
          const priorityB = b.role === "builder" ? 0 : b.tacticalIntent.state === "seek-cover" || b.tacticalIntent.state === "hold-cover" ? 1 : 2;
          if (priorityA !== priorityB) {
            return priorityA - priorityB;
          }
          return getDistance(a.position, suppressor.position) - getDistance(b.position, suppressor.position);
        });

      const mover = movers[0] ?? null;
      if (!mover) {
        continue;
      }

      tacticalPairs.push({
        id: `${suppressor.id}->${mover.id}`,
        faction,
        suppressorId: suppressor.id,
        moverId: mover.id,
        state: mover.role === "builder" ? "covering-builder" : "line-hold",
        reason: mover.role === "builder" ? "suppressor anchoring exposed builder" : "suppressor anchoring rifle line"
      });
    }

    this.state.aiTactics.suppressionFields = (Object.entries(suppressionByFaction) as Array<[TownWarFactionId, { pressure: number; pinnedSoldierIds: string[] }]>).map(
      ([faction, field]) => ({
        faction,
        lane: this.state.officer.focusedLane,
        pressure: Number(field.pressure.toFixed(3)),
        pinnedSoldierIds: [...field.pinnedSoldierIds]
      })
    );
    this.state.aiTactics.tacticalPairs = tacticalPairs.slice(0, 12);
    this.refreshCoverOccupancy();
  }

  private applyCasualties(deadIds: Set<string>): void {
    if (deadIds.size === 0) {
      return;
    }

    const deadByFaction: Record<TownWarFactionId, number> = { "camp-a": 0, "camp-b": 0 };

    for (const combatant of this.state.combatants) {
      if (!deadIds.has(combatant.id)) {
        continue;
      }
      deadByFaction[combatant.faction] += 1;
    }

    this.state.combatants = this.state.combatants.filter((combatant) => !deadIds.has(combatant.id));
    this.state.soldiers = this.state.soldiers.filter((soldier) => !deadIds.has(soldier.id));

    for (const [campId, deaths] of Object.entries(deadByFaction) as Array<[TownWarFactionId, number]>) {
      if (deaths <= 0) {
        continue;
      }

      const camp = this.getCamp(campId);
      if (camp) {
        camp.control.morale = clamp01(camp.control.morale - 0.09 * deaths);
        camp.control.readiness = clamp01(camp.control.readiness - 0.07 * deaths);
      }

      const opponent = this.getCamp(this.getOpposingCampId(campId));
      if (opponent) {
        opponent.control.morale = clamp01(opponent.control.morale + 0.035 * deaths);
        opponent.control.readiness = clamp01(opponent.control.readiness + 0.02 * deaths);
      }

      const pressureShift = 0.015 * deaths;
      this.state.town.control[campId] = clamp01(this.state.town.control[campId] - pressureShift);
      const opponentId = this.getOpposingCampId(campId);
      this.state.town.control[opponentId] = clamp01(this.state.town.control[opponentId] + pressureShift);

      this.emitDramaEvent({
        kind: deaths >= 2 ? "line-collapsed" : "bad-order-cost",
        faction: campId,
        campId,
        locationLabel: `${campId} ${this.state.officer.focusedLane} line`,
        summary:
          deaths >= 2
            ? `${campId} lost ${deaths} soldiers and the ${this.state.officer.focusedLane} line buckled.`
            : `${campId} lost a soldier while the ${this.state.officer.focusedLane} line was under pressure.`,
        tags: ["casualty", deaths >= 2 ? "line-collapsed" : "bad-order-cost", this.state.officer.focusedLane]
      });
    }
  }

  private tickCombat(deltaSeconds: number): void {
    const deadIds = new Set<string>();
    const tickIndex = Math.max(0, Math.floor(this.state.clock.seconds * 4));

    for (const combatant of this.state.combatants) {
      if (deadIds.has(combatant.id)) {
        continue;
      }
      if (combatant.task.targetPosition) {
        continue;
      }

      const baseFireRange = this.getBaseFireRangeForCombatant(combatant);
      let damagePerSecond = 0;
      let pressurePerSecond = 0;
      let hitChance = 0;

      if (combatant.task.kind === "suppress") {
        damagePerSecond = SUPPRESS_DAMAGE_PER_SECOND;
        pressurePerSecond = SUPPRESS_PRESSURE_PER_SECOND;
        hitChance = 0.42;
      } else if (combatant.task.kind === "attack") {
        damagePerSecond = ATTACK_DAMAGE_PER_SECOND;
        pressurePerSecond = ATTACK_PRESSURE_PER_SECOND;
        hitChance = 0.55;
      } else if (combatant.task.kind === "defend") {
        damagePerSecond = DEFEND_DAMAGE_PER_SECOND;
        pressurePerSecond = DEFEND_PRESSURE_PER_SECOND;
        hitChance = 0.5;
      }

      if (baseFireRange === null) {
        continue;
      }

      const ammoAvailable = combatant.ammo.inMag + combatant.ammo.reserve;
      if (ammoAvailable <= 0) {
        continue;
      }

      const target = this.findBestThreatTarget(combatant, baseFireRange);
      if (!target) {
        combatant.targetIntent = createIdleTargetIntent("no valid threat inside weapon range", this.state.clock.seconds);
        continue;
      }
      combatant.targetIntent = target.intent;
      if (deadIds.has(target.enemy.id)) {
        continue;
      }

      const attackerId = getTrailingIdNumber(combatant.id);
      const targetId = getTrailingIdNumber(target.enemy.id);
      const baseSeed = tickIndex * 131 + attackerId * 97 + targetId * 53;
      const roll = getDeterministicUnit(baseSeed);
      const targetCover = this.findCoverSlot(target.enemy.coverIntent.coverSlotId);
      const targetInCover =
        targetCover !== null &&
        targetCover.occupiedBySoldierId === target.enemy.id &&
        getDistance(target.enemy.position, targetCover.position) <= COVER_OCCUPY_DISTANCE;
      const targetInTrench = targetInCover && targetCover?.sourceKind === "trench";
      const targetDirectionalCover =
        targetInCover && targetCover ? this.getDirectionalCoverProtection(targetCover, combatant.position) : null;
      const coverProtection = targetDirectionalCover?.protection ?? 0;
      const attackerCover = this.findCoverSlot(combatant.coverIntent.coverSlotId);
      const attackerInCover =
        attackerCover !== null &&
        attackerCover.occupiedBySoldierId === combatant.id &&
        getDistance(combatant.position, attackerCover.position) <= COVER_OCCUPY_DISTANCE;
      const attackerDirectionalCover =
        attackerInCover && attackerCover?.sourceKind === "trench" ? this.getDirectionalCoverProtection(attackerCover, target.enemy.position) : null;
      const attackerRangeRead = this.getTrenchFireRangeRead(combatant, baseFireRange, target.enemy.position);
      const extendedRangeShot = attackerRangeRead.slot !== null && target.distance > baseFireRange;
      const trenchFireBonus =
        attackerDirectionalCover === null ? 0 : attackerDirectionalCover.label === "front-protected" ? 0.12 : attackerDirectionalCover.label === "angled" ? 0.04 : -0.08;
      const trenchPressureScale =
        attackerDirectionalCover === null
          ? 1
          : attackerDirectionalCover.label === "front-protected"
            ? 1.16
            : attackerDirectionalCover.label === "angled"
              ? 1.04
              : 0.84;
      const tacticalAccuracyPenalty =
        target.enemy.tacticalIntent.state === "hold-cover" || target.enemy.tacticalIntent.state === "reload-behind-cover"
          ? coverProtection * 0.28
          : coverProtection * 0.18;
      const extendedRangeAccuracyPenalty = extendedRangeShot ? clamp((target.distance - baseFireRange) / Math.max(1, attackerRangeRead.range - baseFireRange), 0, 1) * 0.1 : 0;
      const missed = roll > Math.max(0.08, hitChance + trenchFireBonus - tacticalAccuracyPenalty - extendedRangeAccuracyPenalty);

      const scaledRoll = 0.7 + roll * 0.6;
      const coverDamageScale = targetInCover ? (targetInTrench ? Math.max(0.18, 1 - coverProtection) : 1 - coverProtection) : 1;
      const trenchIncomingPressureMultiplier =
        targetInTrench && combatant.task.kind === "suppress"
          ? TRENCH_INCOMING_SUPPRESSION_SUPPRESS_MULTIPLIER
          : targetInTrench && combatant.task.kind === "attack"
            ? TRENCH_INCOMING_SUPPRESSION_ATTACK_MULTIPLIER
            : 1;
      const coverPressureScale = targetInTrench
        ? Math.max(TRENCH_INCOMING_SUPPRESSION_MIN_SCALE, 1 - coverProtection * 0.44)
        : targetInCover
          ? 1 - coverProtection * 0.72
          : 1;
      const extendedRangePowerScale = extendedRangeShot ? 0.82 : 1;
      const damage = missed ? 0 : damagePerSecond * deltaSeconds * scaledRoll * coverDamageScale * extendedRangePowerScale;
      const pressure =
        pressurePerSecond *
        deltaSeconds *
        (missed ? 0.25 : 0.85 + roll * 0.4) *
        coverPressureScale *
        trenchIncomingPressureMultiplier *
        trenchPressureScale *
        (extendedRangeShot ? 1.08 : 1);
      const grenadeRead = this.getTrenchGrenadeRead(combatant, target.enemy, targetCover, baseSeed, deltaSeconds);

      target.enemy.health.current = Math.max(0, target.enemy.health.current - damage - grenadeRead.damage);
      target.enemy.morale.pressure = Math.min(target.enemy.morale.maxPressure, target.enemy.morale.pressure + pressure + grenadeRead.pressure);

      if (grenadeRead.reason && target.enemy.kind === "soldier") {
        this.pushChatter({
          faction: target.enemy.faction,
          channel: this.buildSoldierChannel(target.enemy),
          text: "Grenade in the trench!",
          tags: ["trench", "grenade", "suppression"],
          cooldownKey: `${target.enemy.id}:trench-grenade`,
          cooldownSeconds: 14
        });
        target.enemy.targetIntent = {
          ...target.enemy.targetIntent,
          reason: `${target.enemy.targetIntent.reason}; ${grenadeRead.reason}`
        };
      }

      if (missed && grenadeRead.damage <= 0 && grenadeRead.pressure <= 0) {
        continue;
      }

      if (target.enemy.health.current <= 0) {
        deadIds.add(target.enemy.id);
        continue;
      }

      const suppressed = target.enemy.morale.pressure / Math.max(1, target.enemy.morale.maxPressure);
      if (suppressed < SUPPRESSION_RETREAT_THRESHOLD) {
        continue;
      }

      if (target.enemy.task.kind === "resupply" || target.enemy.task.kind === "heal" || target.enemy.task.kind === "build") {
        continue;
      }

      const fallbackDugout = this.getNearestActiveDugout(target.enemy.faction, target.enemy.position, DUGOUT_SHELTER_RADIUS);

      if (target.enemy.kind === "soldier") {
        this.pushChatter({
          faction: target.enemy.faction,
          channel: this.buildSoldierChannel(target.enemy),
          text: fallbackDugout ? "Pinned - falling back to the dugout!" : "Pinned - falling back to camp!",
          tags: fallbackDugout ? ["suppression", "retreat", "dugout"] : ["suppression", "retreat"],
          cooldownKey: `${target.enemy.id}:suppression-retreat`,
          cooldownSeconds: 10
        });
      }

      const campSpawn = this.getCampSpawn(target.enemy.faction).position;
      const fallbackPosition = fallbackDugout ? fallbackDugout.position : campSpawn;
      const resumeTask: TownWarTask = {
        ...target.enemy.task,
        targetPosition: null,
        resumeTask: null
      };

      target.enemy.task = {
        kind: "move",
        label: `${fallbackDugout ? "Retreat to dugout" : "Retreat"} (suppressed ${Math.round(target.enemy.morale.pressure)}/${target.enemy.morale.maxPressure})`,
        targetPosition: cloneVec2(fallbackPosition),
        targetEntityId: fallbackDugout?.id ?? null,
        resumeTask
      };
      target.enemy.targetIntent = {
        targetKind: "fallback",
        targetId: fallbackDugout?.id ?? target.enemy.faction,
        targetScore: 100,
        reason: fallbackDugout ? "pinned by frontline pressure, dugout shelter available" : "pinned by frontline pressure",
        lastUpdatedAtSeconds: this.state.clock.seconds
      };
    }

    this.applyCasualties(deadIds);
  }

  private tickDugouts(deltaSeconds: number): void {
    this.refreshDugoutConnections();
    for (const dugout of this.state.dugouts) {
      if (dugout.destroyedAtSeconds !== null) {
        dugout.status = "destroyed";
        dugout.readable = "Position collapsing";
        continue;
      }

      const enemies = this.state.combatants.filter(
        (combatant) =>
          combatant.faction !== dugout.faction &&
          combatant.health.current > 0 &&
          getDistance(combatant.position, dugout.position) <= DUGOUT_CONTEST_DISTANCE
      );
      const sheltering = this.state.soldiers.filter(
        (soldier) =>
          soldier.faction === dugout.faction &&
          soldier.health.current > 0 &&
          getDistance(soldier.position, dugout.position) <= dugout.shelterRadius &&
          (soldier.health.current <= soldier.health.max * 0.62 || soldier.morale.pressure / Math.max(1, soldier.morale.maxPressure) >= 0.58)
      );

      dugout.contestedBySoldierIds = enemies.map((enemy) => enemy.id);
      dugout.shelteringSoldierIds = sheltering.map((soldier) => soldier.id);

      if (enemies.length > 0) {
        const worstWeakness = enemies.reduce((max, enemy) => Math.max(max, this.getDugoutDirectionalWeakness(dugout, enemy.position)), 0);
        dugout.health = Math.max(0, dugout.health - deltaSeconds * enemies.length * (0.9 + worstWeakness * 1.35));
      }

      if (dugout.health <= 0) {
        dugout.status = "destroyed";
        dugout.destroyedAtSeconds = this.state.clock.seconds;
        dugout.readable = "Position collapsing";
      } else if (enemies.length > 0) {
        dugout.status = "contested";
        dugout.readable = "Dugout contested";
      } else if (dugout.health / Math.max(1, dugout.maxHealth) < 0.45) {
        dugout.status = "damaged";
        dugout.readable = "Position collapsing";
      } else if (sheltering.length > 0) {
        dugout.status = "active";
        dugout.readable = "Wounded sheltering";
      } else if (dugout.connectedTrenchSlotIds.length > 0) {
        dugout.status = "active";
        dugout.readable = "Line supplied";
      } else {
        dugout.status = "active";
        dugout.readable = "Rally active";
      }

      dugout.lastUpdatedAtSeconds = this.state.clock.seconds;
      if (dugout.status === "active") {
        this.routeDugoutDefenders(dugout);
      }
    }
  }

  private tickAmmoCrateResupply(deltaSeconds: number): void {
    const perTick = Math.max(1, Math.floor(deltaSeconds * AMMO_CRATE_RESUPPLY_PER_SECOND));

    for (const soldier of this.state.soldiers) {
      if (soldier.role === "builder") {
        continue;
      }

      const desiredReserve = soldier.ammo.maxMag * 3;
      const missingMag = Math.max(0, soldier.ammo.maxMag - soldier.ammo.inMag);
      const missingReserve = Math.max(0, desiredReserve - soldier.ammo.reserve);
      const missing = missingMag + missingReserve;
      if (missing <= 0) {
        continue;
      }

      const nearest = this.state.ammoCrates
        .filter((crate) => crate.destroyedAtSeconds === null && crate.faction === soldier.faction && crate.ammo > 0)
        .reduce<{ crate: TownWarAmmoCrateState; distance: number } | null>((best, crate) => {
          const distance = getDistance(crate.position, soldier.position);
          if (distance > AMMO_CRATE_RESUPPLY_DISTANCE) {
            return best;
          }
          if (!best || distance < best.distance) {
            return { crate, distance };
          }
          return best;
        }, null);

      if (!nearest) {
        continue;
      }

      const previousAmmo = nearest.crate.ammo;
      const transfer = Math.min(nearest.crate.ammo, perTick, missing);
      if (transfer <= 0) {
        continue;
      }

      const toMag = Math.min(missingMag, transfer);
      soldier.ammo.inMag += toMag;
      soldier.ammo.reserve += transfer - toMag;
      nearest.crate.ammo = Math.max(0, nearest.crate.ammo - transfer);
      if (!this.hasRecentFrontlineStory(soldier.id, "resupply", 24)) {
        this.pushFrontlineStory({
          kind: "resupply",
          faction: soldier.faction,
          soldier,
          work: "Resupply",
          orderId: nearest.crate.builtFromOrderId,
          relatedId: nearest.crate.id,
          position: nearest.crate.position,
          summary: `${soldier.displayName} pulled ${Math.round(transfer)} rounds from ${nearest.crate.id} and kept the line fed.`,
          consequence: `${soldier.displayName} resumed with ${soldier.ammo.inMag + soldier.ammo.reserve} rounds while the crate fell to ${Math.round(nearest.crate.ammo)}.`,
          memoryTag: `ammo-run-${nearest.crate.id}`
        });
      }

      const previousRatio = previousAmmo / Math.max(1, nearest.crate.maxAmmo);
      const nextRatio = nearest.crate.ammo / Math.max(1, nearest.crate.maxAmmo);
      if (previousRatio > 0.25 && nextRatio <= 0.25 && nextRatio > 0) {
        this.emitDramaEvent({
          kind: "ammo-crate-low",
          faction: nearest.crate.faction,
          campId: nearest.crate.faction,
          orderId: nearest.crate.builtFromOrderId,
          orderKind: "ammo-crate",
          soldierId: soldier.id,
          ammoCrateId: nearest.crate.id,
          position: nearest.crate.position,
          riskTier: nearest.crate.riskTier,
          summary: `${nearest.crate.id} is low with ${Math.round(nearest.crate.ammo)} rounds left.`,
          tags: ["ammo", "low", "resupply", `risk-${nearest.crate.riskTier}`]
        });
      }
      if (previousAmmo > 0 && nearest.crate.ammo <= 0) {
        this.emitDramaEvent({
          kind: "ammo-crate-empty",
          faction: nearest.crate.faction,
          campId: nearest.crate.faction,
          orderId: nearest.crate.builtFromOrderId,
          orderKind: "ammo-crate",
          soldierId: soldier.id,
          ammoCrateId: nearest.crate.id,
          position: nearest.crate.position,
          riskTier: nearest.crate.riskTier,
          summary: `${nearest.crate.id} ran dry while ${soldier.id} was resupplying.`,
          tags: ["ammo", "empty", "resupply", `risk-${nearest.crate.riskTier}`]
        });
      }
    }
  }

  private tickAmmoCrateResupplyTrips(): void {
    for (const soldier of this.state.soldiers) {
      if (soldier.task.kind === "build" || soldier.task.kind === "resupply" || soldier.task.kind === "heal") {
        continue;
      }

      const totalAmmo = soldier.ammo.inMag + soldier.ammo.reserve;
      const desiredTotal =
        soldier.task.kind === "suppress"
          ? Math.max(1, Math.floor(soldier.ammo.maxMag * (2.6 + soldier.workPriorities.Resupply * 0.18)))
          : soldier.task.kind === "attack"
            ? Math.max(1, Math.floor(soldier.ammo.maxMag * 2.5))
            : Math.max(1, Math.floor(soldier.ammo.maxMag * 2));

      if (totalAmmo >= desiredTotal) {
        continue;
      }

      const alreadyInRange =
        this.state.ammoCrates.find(
          (crate) =>
            crate.destroyedAtSeconds === null &&
            crate.faction === soldier.faction &&
            crate.ammo > 0 &&
            getDistance(crate.position, soldier.position) <= AMMO_CRATE_RESUPPLY_DISTANCE
        ) ?? null;

      if (alreadyInRange) {
        continue;
      }

      const nearest = this.state.ammoCrates
        .filter((crate) => crate.destroyedAtSeconds === null && crate.faction === soldier.faction && crate.ammo > 0)
        .reduce<{ crate: TownWarAmmoCrateState; distance: number } | null>((best, crate) => {
          const distance = getDistance(crate.position, soldier.position);
          if (distance > AMMO_CRATE_RESUPPLY_DISTANCE * 4) {
            return best;
          }
          if (!best || distance < best.distance) {
            return { crate, distance };
          }
          return best;
        }, null);

      if (!nearest) {
        continue;
      }

      const candidate = this.scoreTaskCandidate({
        soldier,
        work: "Resupply",
        targetPosition: nearest.crate.position,
        urgency: 10,
        supplyNeed: 10,
        riskTier: this.computeRiskTier(soldier.faction, nearest.crate.position),
        reason: "low ammunition forced an ammo run before the firing line dried out"
      });
      if (candidate.score < 35 && totalAmmo > soldier.ammo.maxMag) {
        this.refreshTaskDecisionForSoldier(soldier, nearest.crate.position, this.computeRiskTier(soldier.faction, nearest.crate.position));
        continue;
      }

      const resumeTask: TownWarTask = {
        ...soldier.task,
        targetPosition: soldier.task.targetPosition ? cloneVec2(soldier.task.targetPosition) : soldier.task.targetPosition ?? null,
        resumeTask: null
      };

      soldier.task = {
        kind: "resupply",
        label: `Resupply: ammo crate (${totalAmmo}/${desiredTotal})`,
        targetPosition: cloneVec2(nearest.crate.position),
        targetEntityId: nearest.crate.id,
        resumeTask
      };
      this.recordSelectedWork(soldier, "Resupply", nearest.crate.position, this.computeRiskTier(soldier.faction, nearest.crate.position));

      this.pushChatter({
        faction: soldier.faction,
        channel: this.buildSoldierChannel(soldier),
        text: "Low on mags - running to the crate.",
        tags: ["resupply", "ammo"],
        cooldownKey: `${soldier.id}:resupply-run`,
        cooldownSeconds: 12
      });
    }
  }

  private tickAmmoCrateAttrition(deltaSeconds: number): void {
    for (const crate of this.state.ammoCrates) {
      if (crate.destroyedAtSeconds !== null) {
        continue;
      }

      const damagePerSecond = AMMO_CRATE_ATTRITION_DAMAGE_PER_SECOND[crate.riskTier] ?? 0;
      if (!Number.isFinite(damagePerSecond) || damagePerSecond <= 0) {
        continue;
      }

      crate.health = Math.max(0, crate.health - damagePerSecond * deltaSeconds);
      if (crate.health > 0) {
        continue;
      }

      crate.ammo = 0;
      crate.destroyedAtSeconds = this.state.clock.seconds;
      crate.destroyedByFaction = null;
      this.emitDramaEvent({
        kind: "bad-order-cost",
        faction: crate.faction,
        campId: crate.faction,
        orderId: crate.builtFromOrderId,
        orderKind: "ammo-crate",
        ammoCrateId: crate.id,
        position: crate.position,
        riskTier: crate.riskTier,
        summary: `${crate.id} was destroyed by exposure before the line could keep using it.`,
        tags: ["ammo", "destroyed", "bad-order-cost", `risk-${crate.riskTier}`]
      });
    }
  }

  private tickAmmoCrateLooting(): void {
    for (const crate of this.state.ammoCrates) {
      if (crate.destroyedAtSeconds !== null) {
        continue;
      }

      const looter =
        this.state.combatants.find(
          (combatant) => combatant.faction !== crate.faction && getDistance(combatant.position, crate.position) <= AMMO_CRATE_LOOT_DISTANCE
        ) ?? null;

      if (!looter) {
        continue;
      }

      const camp = this.getCamp(looter.faction);
      if (camp) {
        camp.supply.ammo += Math.max(0, Math.floor(crate.ammo / AMMO_SUPPLY_ROUNDS_PER_POINT));
      }

      crate.ammo = 0;
      crate.health = 0;
      crate.destroyedAtSeconds = this.state.clock.seconds;
      crate.destroyedByFaction = looter.faction;
      this.emitDramaEvent({
        kind: "bad-order-cost",
        faction: crate.faction,
        campId: crate.faction,
        orderId: crate.builtFromOrderId,
        orderKind: "ammo-crate",
        soldierId: looter.id,
        ammoCrateId: crate.id,
        position: crate.position,
        riskTier: crate.riskTier,
        summary: `${crate.id} was overrun and looted by ${looter.faction}.`,
        tags: ["ammo", "looted", "bad-order-cost", `risk-${crate.riskTier}`]
      });
    }
  }

  reset(options: { preserveOperation?: boolean } = {}): void {
    const operation = options.preserveOperation ? cloneOperationState(this.state.operation) : null;
    this.state = createTownWarState();
    if (operation) {
      this.state.operation = operation;
    }
    this.demoSeeded = false;
    this.chatterCooldownSecondsByKey.clear();
    this.clearBuildPlacementPreview();
  }

  private normalizeSupplyBundle(input: Partial<TownWarCampSupplyState>, fallback: TownWarCampSupplyState): TownWarCampSupplyState {
    return {
      ammo: Math.max(0, Math.round(Number.isFinite(input.ammo) ? Number(input.ammo) : fallback.ammo)),
      build: Math.max(0, Math.round(Number.isFinite(input.build) ? Number(input.build) : fallback.build)),
      food: Math.max(0, Math.round(Number.isFinite(input.food) ? Number(input.food) : fallback.food)),
      med: Math.max(0, Math.round(Number.isFinite(input.med) ? Number(input.med) : fallback.med))
    };
  }

  private applyOperationLoadoutToPlayerCamp(): void {
    const camp = this.getCamp(TOWN_WAR_PLAYER_FACTION);
    if (!camp) {
      return;
    }
    camp.supply = cloneSupply(this.state.operation.stockpile.lastCommitted);
    camp.sustainment.warnings = uniqueLimited(
      [
        ...this.buildOperationWarnings(camp),
        ...camp.sustainment.warnings
      ],
      8
    );
  }

  private applyCarriedSoldierRecords(): void {
    for (const record of this.state.operation.carriedSoldiers) {
      if (record.faction !== TOWN_WAR_PLAYER_FACTION) {
        continue;
      }
      const soldier =
        this.state.soldiers.find((entry) => entry.id === record.soldierId) ??
        this.state.soldiers.find((entry) => entry.displayName === record.displayName && entry.role === record.role && entry.faction === record.faction);
      if (!soldier) {
        continue;
      }
      soldier.health.current = record.status === "lost" ? 0 : Math.max(1, Math.min(record.healthMax, record.healthCurrent));
      soldier.health.max = record.healthMax;
      soldier.needs = {
        fatigue: clampNeed(record.fatigue),
        hunger: clampNeed(record.hunger),
        morale: clampNeed(record.morale)
      };
      soldier.currentNeed = record.currentNeed;
      soldier.experience.operations = Math.max(soldier.experience.operations, record.operations);
      soldier.dramaMemoryTags = uniqueLimited([...record.memoryTags, ...soldier.dramaMemoryTags], 16);
      soldier.dramaArc.trustInOfficer = clamp01(record.trustInOfficer);
      soldier.dramaArc.resentment = clamp01(record.resentment);
      soldier.dramaArc.confidence = clamp01(record.confidence);
      if (record.status === "wounded" || record.status === "recovering") {
        soldier.currentNeed = "wounded";
        soldier.task = {
          kind: "hold",
          label: `Recovering from operation ${this.state.operation.activeId - 1}`,
          targetPosition: null,
          targetEntityId: null
        };
      }
      soldier.identitySummary = buildIdentitySummary(
        soldier.skills,
        soldier.traits,
        soldier.currentNeed,
        soldier.dramaArc.trustInOfficer
      );
    }
  }

  private buildOperationWarnings(camp: TownWarCampState): string[] {
    const warnings: string[] = [];
    if (camp.supply.build < 75) {
      warnings.push("Build supply low");
    }
    if (camp.supply.ammo < 90) {
      warnings.push("Ammo runners needed");
    }
    if (camp.supply.med < 35) {
      warnings.push("Medic load high");
    }
    if (camp.supply.food < 80 || camp.sustainment.restCycle < 0.35) {
      warnings.push("Rest cycle weak");
    }
    return warnings;
  }

  private buildOperationRecommendations(camp: TownWarCampState, records: TownWarPersistentSoldierRecordState[]): string[] {
    const recommendations: string[] = [];
    if (camp.supply.build < 75) {
      recommendations.push("Commit more build supply before the next trench line; low build stock slows the whole position plan.");
    }
    if (camp.sustainment.ammoFlow < 0.45 || camp.supply.ammo < 90) {
      recommendations.push("Push Resupply and bring more ammo; weak ammo flow leaves builders without cover fire.");
    }
    const wounded = records.filter((record) => record.status === "wounded" || record.status === "recovering");
    if (wounded.length > 0 || camp.supply.med < 35) {
      recommendations.push(`Raise med stock and keep a medic free; ${wounded.length} named soldier${wounded.length === 1 ? "" : "s"} carried wounds forward.`);
    }
    if (camp.sustainment.fatigueAverage > 0.45 || records.some((record) => record.fatigue > 0.55)) {
      recommendations.push("Run a Rest cycle before the next exposed build; tired soldiers stall and panic sooner.");
    }
    if (camp.sustainment.cookEffect < 0.38 || camp.supply.food < 80) {
      recommendations.push("Protect food supply and cooking work; hunger is pulling readiness down before contact.");
    }
    if (recommendations.length < 2) {
      recommendations.push("Keep the balanced stockpile and build from the right-side Russian camp toward one lane at a time.");
      recommendations.push("Use the debrief to name one soldier to protect, then set priorities before ordering the next trench.");
    }
    return uniqueLimited(recommendations, 5);
  }

  private capturePersistentSoldierRecords(campId: TownWarFactionId): TownWarPersistentSoldierRecordState[] {
    return this.state.soldiers
      .filter((soldier) => soldier.faction === campId)
      .map((soldier) => {
        const casualty = this.state.casualties.find((entry) => entry.soldierId === soldier.id) ?? null;
        const status =
          soldier.health.current <= 0 || casualty?.status === "lost"
            ? "lost"
            : casualty?.status === "wounded" || casualty?.status === "downed"
              ? "wounded"
              : casualty?.status === "stabilized" || casualty?.status === "recovering" || soldier.currentNeed === "wounded"
                ? "recovering"
                : "ready";
        return {
          soldierId: soldier.id,
          displayName: soldier.displayName,
          faction: soldier.faction,
          role: soldier.role,
          status,
          healthCurrent: Number(soldier.health.current.toFixed(2)),
          healthMax: soldier.health.max,
          fatigue: soldier.needs.fatigue,
          hunger: soldier.needs.hunger,
          morale: soldier.needs.morale,
          currentNeed: soldier.currentNeed,
          operations: soldier.experience.operations + 1,
          memoryTags: uniqueLimited([`operation-${this.state.operation.activeId}`, status, ...soldier.dramaMemoryTags], 16),
          trustInOfficer: soldier.dramaArc.trustInOfficer,
          resentment: soldier.dramaArc.resentment,
          confidence: soldier.dramaArc.confidence,
          lastSeenAtSeconds: this.state.clock.seconds
        };
      });
  }

  prepareOperationStockpile(input: Partial<TownWarCampSupplyState>): TownWarOperationMutationResult {
    const current = this.state.operation.stockpile.committed;
    const protectedSupply = this.state.operation.stockpile.protected;
    const requested = this.normalizeSupplyBundle(input, current);
    const committed: TownWarCampSupplyState = {
      ammo: Math.min(requested.ammo, protectedSupply.ammo),
      build: Math.min(requested.build, protectedSupply.build),
      food: Math.min(requested.food, protectedSupply.food),
      med: Math.min(requested.med, protectedSupply.med)
    };
    this.state.operation.stockpile.committed = committed;
    this.state.operation.phase = "preparing";
    this.state.operation.recommendations = [
      `Prepared operation ${this.state.operation.nextOperationId}: ammo ${committed.ammo}, build ${committed.build}, food ${committed.food}, med ${committed.med}.`,
      "Launch next operation to apply this protected stockpile to the Russian camp."
    ];
    return {
      ok: true,
      reason: null,
      operation: cloneOperationState(this.state.operation),
      debrief: this.state.operation.lastDebrief ? cloneOperationDebrief(this.state.operation.lastDebrief) : null,
      readable: this.state.operation.recommendations.join(" ")
    };
  }

  startNextOperation(): TownWarOperationMutationResult {
    const previousOperation = cloneOperationState(this.state.operation);
    const committed = cloneSupply(previousOperation.stockpile.committed);
    const nextOperationId = previousOperation.nextOperationId;
    const protectedSupply: TownWarCampSupplyState = {
      ammo: Math.max(0, previousOperation.stockpile.protected.ammo - committed.ammo),
      build: Math.max(0, previousOperation.stockpile.protected.build - committed.build),
      food: Math.max(0, previousOperation.stockpile.protected.food - committed.food),
      med: Math.max(0, previousOperation.stockpile.protected.med - committed.med)
    };
    this.reset();
    this.state.operation = {
      activeId: nextOperationId,
      nextOperationId: nextOperationId + 1,
      phase: "active",
      startedAtSeconds: this.state.clock.seconds,
      stockpile: {
        protected: protectedSupply,
        committed,
        lastCommitted: committed
      },
      carriedSoldiers: previousOperation.carriedSoldiers.map((record) => clonePersistentSoldierRecord(record)),
      lastDebrief: previousOperation.lastDebrief ? cloneOperationDebrief(previousOperation.lastDebrief) : null,
      recommendations: previousOperation.recommendations.length > 0 ? [...previousOperation.recommendations] : ["Operation launched."],
      cycleCount: previousOperation.cycleCount + 1
    };
    this.ensureDemoSeeded();
    const camp = this.getCamp(TOWN_WAR_PLAYER_FACTION);
    const readable = camp
      ? `Operation ${nextOperationId} launched for Russian camp: ammo ${camp.supply.ammo}, build ${camp.supply.build}, food ${camp.supply.food}, med ${camp.supply.med}.`
      : `Operation ${nextOperationId} launched.`;
    return {
      ok: true,
      reason: null,
      operation: cloneOperationState(this.state.operation),
      debrief: this.state.operation.lastDebrief ? cloneOperationDebrief(this.state.operation.lastDebrief) : null,
      readable
    };
  }

  endOperation(): TownWarOperationMutationResult {
    this.ensureDemoSeeded();
    this.tickCampSustainment(0);
    const camp = this.getCamp(TOWN_WAR_PLAYER_FACTION);
    if (!camp) {
      return {
        ok: false,
        reason: "camp-missing",
        operation: cloneOperationState(this.state.operation),
        debrief: this.state.operation.lastDebrief ? cloneOperationDebrief(this.state.operation.lastDebrief) : null,
        readable: "Cannot end operation: Russian player camp missing."
      };
    }

    const records = this.capturePersistentSoldierRecords(TOWN_WAR_PLAYER_FACTION);
    const recommendations = this.buildOperationRecommendations(camp, records);
    const playerDugouts = this.state.dugouts.filter((dugout) => dugout.faction === TOWN_WAR_PLAYER_FACTION);
    for (const dugout of playerDugouts) {
      if (dugout.status === "active" && dugout.connectedTrenchSlotIds.length > 0) {
        recommendations.push("Position held because dugout rallied defenders into connected trenches.");
        break;
      }
    }
    if (playerDugouts.some((dugout) => dugout.status === "contested" || dugout.status === "damaged" || dugout.status === "destroyed")) {
      recommendations.push("Position failed because dugout was exposed or contested.");
    }
    if (playerDugouts.some((dugout) => dugout.shelteringSoldierIds.length > 0)) {
      recommendations.push("Wounded survived because they reached shelter.");
    }
    const warnings = uniqueLimited([...this.buildOperationWarnings(camp), ...camp.sustainment.warnings], 10);
    const woundedCount = records.filter((record) => record.status === "wounded" || record.status === "recovering").length;
    const summary = `Operation ${this.state.operation.activeId} ended: ${records.length} Russian soldiers carried, ${woundedCount} wounded/recovering, readiness ${camp.sustainment.readiness}, build ${camp.supply.build}, ammo ${camp.supply.ammo}.`;
    const debrief: TownWarOperationDebriefState = {
      operationId: this.state.operation.activeId,
      startedAtSeconds: this.state.operation.startedAtSeconds,
      endedAtSeconds: this.state.clock.seconds,
      campId: TOWN_WAR_PLAYER_FACTION,
      summary,
      recommendations,
      supplyRemaining: cloneSupply(camp.supply),
      carriedSoldiers: records.map((record) => clonePersistentSoldierRecord(record)),
      warnings
    };
    this.state.operation.phase = "debriefed";
    this.state.operation.lastDebrief = debrief;
    this.state.operation.carriedSoldiers = records;
    this.state.operation.recommendations = recommendations;
    return {
      ok: true,
      reason: null,
      operation: cloneOperationState(this.state.operation),
      debrief: cloneOperationDebrief(debrief),
      readable: `${summary} Next: ${recommendations.slice(0, 2).join(" ")}`
    };
  }

  getOperationReport(): TownWarOperationMutationResult {
    this.ensureDemoSeeded();
    const camp = this.getCamp(TOWN_WAR_PLAYER_FACTION);
    if (camp) {
      this.tickCampSustainment(0);
      this.state.operation.recommendations = this.state.operation.phase === "debriefed"
        ? this.state.operation.recommendations
        : this.buildOperationRecommendations(camp, this.state.operation.carriedSoldiers);
    }
    const supply = camp?.supply ?? this.state.operation.stockpile.lastCommitted;
    return {
      ok: true,
      reason: null,
      operation: cloneOperationState(this.state.operation),
      debrief: this.state.operation.lastDebrief ? cloneOperationDebrief(this.state.operation.lastDebrief) : null,
      readable: `Operation ${this.state.operation.activeId} ${this.state.operation.phase}: camp supply ammo ${supply.ammo}, build ${supply.build}, food ${supply.food}, med ${supply.med}. ${this.state.operation.recommendations.slice(0, 2).join(" ")}`
    };
  }

  setBuildPlacementPreview(input: {
    kind: TownWarBuildOrderKind | null;
    faction: TownWarFactionId | null;
    position?: Vec2 | null;
    facingAngleRadians?: number;
    valid?: boolean;
  }): void {
    this.buildPlacementPreview = {
      kind: input.kind,
      faction: input.faction,
      position: input.position ? cloneVec2(input.position) : null,
      facingAngleRadians: normalizeAngleRadians(input.facingAngleRadians ?? this.buildPlacementPreview.facingAngleRadians),
      valid: input.valid ?? input.kind !== null
    };
  }

  clearBuildPlacementPreview(): void {
    this.buildPlacementPreview = {
      kind: null,
      faction: null,
      position: null,
      facingAngleRadians: 0,
      valid: false
    };
  }

  getBuildPlacementPreview(): TownWarBuildPlacementPreviewState {
    return {
      ...this.buildPlacementPreview,
      position: this.buildPlacementPreview.position ? cloneVec2(this.buildPlacementPreview.position) : null
    };
  }

  spawnCombatant(combatant: TownWarCombatantState): TownWarCombatantState {
    this.state.combatants.push(combatant);
    return combatant;
  }

  spawnSoldier(input: SpawnTownWarSoldierInput): TownWarSoldierState {
    const healthMax = input.healthMax ?? 100;
    const ammoMaxMag = input.ammoMaxMag ?? 30;
    const ammoInMag = input.ammoInMag ?? ammoMaxMag;
    const ammoReserve = input.ammoReserve ?? ammoMaxMag * 3;
    const maxPressure = input.maxPressure ?? 100;

    const spawnedFromCampId = input.spawnedFromCampId ?? input.faction;
    const spawnReason = input.spawnReason ?? "script";
    const soldierId = buildSoldierId(this.state);
    const identity = createSoldierIdentity({
      id: soldierId,
      role: input.role,
      faction: input.faction,
      healthCurrent: healthMax,
      healthMax,
      ammoReserve,
      spawnReason
    });
    const soldier: TownWarSoldierState = {
      id: soldierId,
      kind: "soldier",
      faction: input.faction,
      role: input.role,
      displayName: identity.displayName,
      archetype: identity.archetype,
      skills: identity.skills,
      traits: identity.traits,
      needs: identity.needs,
      workPriorities: identity.workPriorities,
      currentNeed: identity.currentNeed,
      experience: identity.experience,
      identitySummary: identity.identitySummary,
      taskDecision: createEmptyTaskDecision(this.state.clock.seconds),
      position: cloneVec2(input.position),
      spawnedFromCampId,
      spawnedAtSeconds: this.state.clock.seconds,
      spawnReason,
      dramaMemoryTags: [],
      witnessedEventCount: 0,
      dramaArc: createTownWarSoldierDramaArc(),
      health: {
        current: healthMax,
        max: healthMax
      },
      ammo: {
        inMag: Math.max(0, ammoInMag),
        reserve: Math.max(0, ammoReserve),
        maxMag: Math.max(1, ammoMaxMag)
      },
      morale: {
        pressure: 0,
        maxPressure
      },
      task: input.task ?? { kind: "idle", label: null, targetPosition: null, targetEntityId: null },
      targetIntent: createIdleTargetIntent("newly spawned and awaiting contact", this.state.clock.seconds),
      tacticalIntent: createIdleTacticalIntent("newly spawned and finding the line", this.state.clock.seconds),
      coverIntent: createNoCoverIntent("no cover assigned")
    };

    this.spawnCombatant(soldier);
    this.state.soldiers.push(soldier);

    const camp = this.getCamp(spawnedFromCampId);
    if (camp) {
      camp.spawn.totalSpawned += 1;
      if (spawnReason === "reinforcement") {
        camp.spawn.lastReinforcementAtSeconds = this.state.clock.seconds;
      }
    }

    return soldier;
  }

  spawnSoldierFromCamp(input: Omit<SpawnTownWarSoldierInput, "position">): TownWarSoldierState | null {
    const camp = this.getCamp(input.faction);
    if (!camp || camp.destroyed || this.state.match.status !== "active") {
      return null;
    }

    return this.spawnSoldier({
      ...input,
      position: this.pickCampSpawnPosition(input.faction, input.role),
      spawnedFromCampId: input.faction,
      spawnReason: input.spawnReason ?? "reinforcement"
    });
  }

  deployOfficer(campId: TownWarFactionId): boolean {
    this.ensureDemoSeeded();

    if (campId !== TOWN_WAR_PLAYER_FACTION) {
      return false;
    }

    const camp = this.getCamp(campId);
    if (!camp || camp.destroyed || this.state.match.status !== "active") {
      return false;
    }

    this.state.officer.faction = TOWN_WAR_PLAYER_FACTION;
    this.state.officer.position = cloneVec2(camp.spawn.position);
    this.state.officer.lastCommandRead = `Deploy officer (${camp.label})`;
    this.state.officer.lastCommandAtSeconds = this.state.clock.seconds;
    return true;
  }

  reinforceCamp(campId: TownWarFactionId, role: TownWarRoleId, count = 1): TownWarReinforceResult {
    this.ensureDemoSeeded();

    const requested = Math.max(0, Math.floor(count));
    const camp = this.getCamp(campId);
    if (!camp) {
      return { ok: false, reason: "camp-missing", campId, role, requested, spawned: 0, soldierIds: [] };
    }

    if (this.state.match.status !== "active") {
      return { ok: false, reason: "match-ended", campId, role, requested, spawned: 0, soldierIds: [] };
    }

    if (camp.destroyed) {
      return { ok: false, reason: "camp-destroyed", campId, role, requested, spawned: 0, soldierIds: [] };
    }

    const soldierIds: string[] = [];
    const rallyDugout = this.getNearestActiveDugout(campId, camp.spawn.position, 2400);
    for (let index = 0; index < requested; index += 1) {
      const soldier = this.spawnSoldierFromCamp({ faction: campId, role });
      if (!soldier) {
        break;
      }
      if (rallyDugout) {
        const rallySlot = rallyDugout.connectedTrenchSlotIds
          .map((slotId) => this.findCoverSlot(slotId))
          .find((slot) => slot !== null && slot.occupiedBySoldierId === null) ?? null;
        soldier.position = cloneVec2(rallyDugout.position);
        soldier.task = rallySlot
          ? {
              kind: "move",
              label: `Rally from dugout to ${rallySlot.label}`,
              targetPosition: cloneVec2(rallySlot.position),
              targetEntityId: rallySlot.id,
              resumeTask: {
                kind: role === "suppressor" ? "suppress" : "defend",
                label: `Hold from ${rallySlot.label}`,
                targetPosition: null,
                targetEntityId: rallySlot.id
              }
            }
          : {
              kind: "defend",
              label: `Rally at dugout ${rallyDugout.id}`,
              targetPosition: null,
              targetEntityId: rallyDugout.id
            };
        soldier.coverIntent = rallySlot
          ? { coverSlotId: rallySlot.id, state: "moving", reason: `reinforcement rallied through dugout ${rallyDugout.id}` }
          : { coverSlotId: null, state: "none", reason: `holding dugout rally ${rallyDugout.id}` };
        soldier.targetIntent = {
          targetKind: "fallback",
          targetId: rallyDugout.id,
          targetScore: 120,
          reason: "reinforcement spawned/rallied from dugout network",
          lastUpdatedAtSeconds: this.state.clock.seconds
        };
      }
      soldierIds.push(soldier.id);
    }

    return {
      ok: soldierIds.length > 0,
      reason: soldierIds.length > 0 ? null : "spawn-failed",
      campId,
      role,
      requested,
      spawned: soldierIds.length,
      soldierIds
    };
  }

  private refreshSoldierNeedReadout(soldier: TownWarSoldierState): void {
    soldier.currentNeed = deriveCurrentNeed(soldier.needs, soldier.health.current, soldier.health.max, soldier.ammo.reserve);
    soldier.identitySummary = buildIdentitySummary(soldier.skills, soldier.traits, soldier.currentNeed, soldier.dramaArc.trustInOfficer);
  }

  private specializeCampWorker(soldier: TownWarSoldierState | null, specialty: "cook" | "quartermaster"): void {
    if (!soldier) {
      return;
    }

    if (specialty === "cook") {
      soldier.archetype = "cook";
      soldier.skills.cooking = 9;
      soldier.skills.social = Math.max(soldier.skills.social, 7);
      soldier.skills.shooting = Math.min(soldier.skills.shooting, 4);
      soldier.workPriorities.Cook = 5;
      soldier.workPriorities.Rest = 4;
      soldier.workPriorities.Defend = 1;
      if (!soldier.traits.includes("field-cook")) {
        soldier.traits.push("field-cook");
      }
      soldier.task = { kind: "hold", label: "Camp work: cook rotation", targetPosition: null, targetEntityId: null };
    } else {
      soldier.archetype = "quartermaster";
      soldier.skills.logistics = 9;
      soldier.skills.endurance = Math.max(soldier.skills.endurance, 7);
      soldier.skills.perception = Math.max(soldier.skills.perception, 6);
      soldier.workPriorities.Resupply = 5;
      soldier.workPriorities.Haul = 5;
      soldier.workPriorities.Cook = 1;
      soldier.workPriorities.Defend = 2;
      if (!soldier.traits.includes("quartermaster")) {
        soldier.traits.push("quartermaster");
      }
      soldier.task = { kind: "hold", label: "Camp work: supply ledger", targetPosition: null, targetEntityId: null };
    }

    this.refreshSoldierNeedReadout(soldier);
    this.refreshTaskDecisionForSoldier(soldier, soldier.position);
  }

  private tickColonyWorkAssignments(): void {
    for (const order of this.state.orders) {
      if (order.status !== "assigned" || order.build.supportingSuppressorId) {
        continue;
      }

      const builder = order.assignedSoldierId ? this.findSoldierById(order.assignedSoldierId) : null;
      const excludedIds = new Set<string>(builder ? [builder.id] : []);
      const riskTier = this.computeRiskTier(order.faction, order.position);
      const shouldCover =
        riskTier !== "low" || order.build.exposure >= 0.45 || (builder?.workPriorities.Suppress ?? 0) <= 1;
      if (!shouldCover) {
        continue;
      }

      const coverPick =
        this.pickAvailableSoldierForColonyWork(order.faction, "Suppress", order.position, riskTier, excludedIds) ??
        this.state.soldiers
          .filter((soldier) => soldier.faction === order.faction && soldier.health.current > 0)
          .filter((soldier) => !excludedIds.has(soldier.id))
          .filter((soldier) => soldier.task.kind !== "build" && soldier.task.kind !== "heal" && soldier.task.kind !== "resupply")
          .sort((left, right) => {
            const roleScore = (soldier: TownWarSoldierState) => (soldier.role === "suppressor" ? 0 : soldier.role === "rifleman" || soldier.role === "defender" ? 1 : 2);
            const roleDelta = roleScore(left) - roleScore(right);
            if (roleDelta !== 0) {
              return roleDelta;
            }
            return getDistance(left.position, order.position) - getDistance(right.position, order.position);
          })
          .map((soldier) => ({ soldier, candidate: this.scoreTaskCandidate({ soldier, work: "Suppress", targetPosition: order.position, riskTier, urgency: 18 }) }))[0] ??
        null;
      if (!coverPick) {
        continue;
      }

      const { soldier } = coverPick;
      soldier.task = {
        kind: "suppress",
        label: `Colony cover: ${order.kind} ${order.id}`,
        targetPosition: cloneVec2(order.position),
        targetEntityId: order.id
      };
      order.build.supportingSuppressorId = soldier.id;
      this.recordSelectedWork(soldier, "Suppress", order.position, riskTier);
      this.pushCause(order, `colony-cover-${soldier.id}`);
      this.pushChatter({
        faction: soldier.faction,
        channel: this.buildSoldierChannel(soldier),
        text: "Covering the work site. Keep digging.",
        tags: ["colony-work", "suppress", "build-cover"],
        cooldownKey: `${soldier.id}:colony-cover:${order.id}`,
        cooldownSeconds: 16
      });
    }

    for (const casualty of this.state.casualties) {
      if (casualty.status !== "wounded" && casualty.status !== "downed") {
        continue;
      }

      const assignedMedic = casualty.assignedMedicId ? this.findSoldierById(casualty.assignedMedicId) : null;
      if (assignedMedic && assignedMedic.health.current > 0 && assignedMedic.task.kind === "heal" && assignedMedic.task.targetEntityId === casualty.id) {
        continue;
      }

      const riskTier = this.computeRiskTier(casualty.faction, casualty.position);
      const rescuePick = this.pickAvailableSoldierForColonyWork(
        casualty.faction,
        "Rescue",
        casualty.position,
        riskTier,
        new Set([casualty.soldierId])
      );
      if (!rescuePick) {
        continue;
      }

      const rescueScore = this.scoreRescueCandidate(rescuePick.soldier, casualty);
      if (rescueScore.score < 45 && !rescuePick.soldier.dramaArc.protectiveOfSoldierIds.includes(casualty.soldierId)) {
        casualty.rescueScore = rescueScore.score;
        casualty.rescueReason = rescueScore.reason;
        casualty.pathRisk = rescueScore.pathRisk;
        casualty.coveredPath = rescueScore.coveredPath;
        casualty.lastUpdatedAtSeconds = this.state.clock.seconds;
        continue;
      }

      this.orderMedicRescue(rescuePick.soldier.id, casualty.soldierId);
    }
  }

  private tickCampSustainment(deltaSeconds: number): void {
    for (const camp of this.state.camps) {
      const soldiers = this.state.soldiers.filter((soldier) => soldier.faction === camp.id && soldier.health.current > 0);
      const manpower = soldiers.length;
      const fatigueAverage =
        manpower > 0 ? soldiers.reduce((total, soldier) => total + soldier.needs.fatigue, 0) / manpower : 1;
      const hungerAverage =
        manpower > 0 ? soldiers.reduce((total, soldier) => total + soldier.needs.hunger, 0) / manpower : 1;
      const moraleAverage =
        manpower > 0 ? soldiers.reduce((total, soldier) => total + soldier.needs.morale, 0) / manpower : 0;
      const ammoNeed = this.getFriendlyAmmoNeed(camp.id);
      const logisticsScore = this.getCampSustainmentScore(camp.id, "Resupply");
      const cookingScore = this.getCampSustainmentScore(camp.id, "Cook");
      const enduranceScore = this.getCampSustainmentScore(camp.id, "Rest");
      const resupplyPriority = this.getCampWorkPriority(camp.id, "Resupply");
      const cookPriority = this.getCampWorkPriority(camp.id, "Cook");
      const restPriority = this.getCampWorkPriority(camp.id, "Rest");
      const foodStock = clamp(camp.supply.food / 180, 0, 1);
      const ammoStock = clamp(camp.supply.ammo / 250, 0, 1);
      const cookEffect = clamp(cookingScore / 34 + cookPriority * 0.035 + foodStock * 0.18 - hungerAverage * 0.2, 0, 1);
      const restCycle = clamp(enduranceScore / 40 + restPriority * 0.045 - fatigueAverage * 0.15, 0, 1);
      const ammoFlow = clamp(logisticsScore / 38 + resupplyPriority * 0.04 + ammoStock * 0.18 - ammoNeed * 0.16, 0, 1);
      const readiness = clamp(
        0.2 + ammoFlow * 0.25 + cookEffect * 0.25 + restCycle * 0.18 + moraleAverage * 0.17 - fatigueAverage * 0.22 - hungerAverage * 0.2,
        0,
        1
      );
      const warnings: string[] = [];
      if (ammoFlow < 0.35) {
        warnings.push("No quartermaster: ammo flow slowing");
      }
      if (cookEffect < 0.32) {
        warnings.push("Cook shortage: readiness falling");
      }
      if (restCycle >= 0.55) {
        warnings.push("Rest cycle active");
      }
      if (fatigueAverage >= 0.68) {
        warnings.push("Exhausted line: panic threshold lower");
      }
      if (ammoNeed >= 1.2) {
        warnings.push("Suppressor dry");
      }

      const bottleneckReason =
        ammoFlow < 0.3
          ? "ammo-flow"
          : cookEffect < 0.28
            ? "cook-shortage"
            : fatigueAverage > 0.68
              ? "fatigue-collapse"
              : hungerAverage > 0.62
                ? "hunger-pressure"
                : null;

      camp.sustainment = {
        ...camp.sustainment,
        readiness: Number(readiness.toFixed(2)),
        fatigueAverage: Number(fatigueAverage.toFixed(2)),
        hungerAverage: Number(hungerAverage.toFixed(2)),
        moraleAverage: Number(moraleAverage.toFixed(2)),
        ammoFlow: Number(ammoFlow.toFixed(2)),
        cookEffect: Number(cookEffect.toFixed(2)),
        restCycle: Number(restCycle.toFixed(2)),
        logisticsScore,
        cookingScore,
        enduranceScore,
        manpowerAvailable: manpower,
        bottleneckReason,
        warnings,
        lastUpdatedAtSeconds: this.state.clock.seconds
      };
      camp.control.readiness = camp.sustainment.readiness;
      camp.control.morale = Number(clamp(moraleAverage, 0, 1).toFixed(2));

      const foodUse = (0.004 + manpower * 0.0009) * deltaSeconds * (cookPriority >= 4 ? 1.25 : 1);
      camp.supply.food = Number(Math.max(0, camp.supply.food - foodUse).toFixed(2));

      for (const soldier of soldiers) {
        const workFatigue =
          soldier.task.kind === "build"
            ? 0.011
            : soldier.task.kind === "resupply"
              ? 0.009
              : soldier.task.kind === "heal"
                ? 0.007
                : soldier.task.kind === "suppress" || soldier.task.kind === "attack"
                  ? 0.006
                  : soldier.task.kind === "defend"
                    ? 0.003
                    : 0.0015;
        const enduranceRelief = clamp(soldier.skills.endurance / 18, 0, 0.48);
        const restRecovery = (soldier.workPriorities.Rest >= 4 || restPriority >= 4 ? restCycle * 0.014 : restCycle * 0.006) + cookEffect * 0.003;
        const fatigueDelta = workFatigue * (1 - enduranceRelief) - restRecovery;
        const hungerDelta = 0.0025 - cookEffect * 0.0035;
        const moraleDelta = cookEffect * 0.005 + restCycle * 0.003 + readiness * 0.002 - soldier.needs.fatigue * 0.003;
        soldier.needs.fatigue = clampNeed(soldier.needs.fatigue + fatigueDelta * deltaSeconds);
        soldier.needs.hunger = clampNeed(soldier.needs.hunger + hungerDelta * deltaSeconds);
        soldier.needs.morale = clampNeed(soldier.needs.morale + moraleDelta * deltaSeconds);
        this.refreshSoldierNeedReadout(soldier);
        this.refreshTaskDecisionForSoldier(soldier, soldier.task.targetPosition ?? soldier.position);
      }

      if (warnings.length > 0 && this.state.clock.seconds - camp.sustainment.lastUpdatedAtSeconds <= deltaSeconds + 0.01) {
        this.pushChatter({
          faction: camp.id,
          channel: camp.label,
          text: warnings[0],
          tags: ["sustainment", "readiness", bottleneckReason ?? "warning"],
          cooldownKey: `${camp.id}:sustainment:${warnings[0]}`,
          cooldownSeconds: 24
        });
      }
    }
  }

  tick(deltaSeconds: number): void {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) {
      return;
    }

    this.state.clock.seconds += deltaSeconds;

    const movementSpeed = DEFAULT_MOVEMENT_SPEED;
    const movementTaskKinds = new Set<TownWarTask["kind"]>(["move", "build", "resupply", "heal", "defend", "attack", "suppress"]);

    for (const combatant of this.state.combatants) {
      if (!movementTaskKinds.has(combatant.task.kind)) {
        continue;
      }

      const target = combatant.task.targetPosition;
      if (!target) {
        if (combatant.task.kind === "move") {
          combatant.task = { kind: "idle", label: "Move target missing", targetPosition: null, targetEntityId: null };
        }
        continue;
      }

      const distance = getDistance(combatant.position, target);
      if (distance <= 0.001) {
        combatant.position = cloneVec2(target);

        const orderId = combatant.task.targetEntityId ?? null;
        const isOrderTask = combatant.task.kind === "build" || combatant.task.kind === "resupply";
        const order = orderId ? (this.state.orders.find((entry) => entry.id === orderId) ?? null) : null;

        if (order && combatant.task.kind === "build") {
          this.pushCause(order, "builder-on-site");
          combatant.task = { ...combatant.task, label: `Building: ${order.kind}`, targetPosition: null };
        } else if (order && isOrderTask) {
          this.completeOrder(order);
          if (combatant.kind === "soldier") {
            const soldier = combatant as TownWarSoldierState;
            const completionText =
              order.kind === "trench"
                ? "Trench is in. Get down and breathe."
                : order.kind === "ammo-crate"
                  ? "Crate is set - feed the line from here."
                  : "Order complete.";

            this.pushChatter({
              faction: soldier.faction,
              channel: this.buildSoldierChannel(soldier),
              text: completionText,
              tags: ["build", "complete", order.kind],
              cooldownKey: `${soldier.id}:order-complete:${order.id}`,
              cooldownSeconds: 20
            });
          }
          combatant.task = { kind: "idle", label: `Order complete: ${order.kind}`, targetPosition: null, targetEntityId: null };
        } else if (combatant.task.kind === "build") {
          combatant.task = { kind: "idle", label: "Build stop", targetPosition: null, targetEntityId: null };
        } else if (combatant.task.kind === "resupply") {
          const resumeTask = combatant.task.resumeTask ?? null;
          combatant.task = resumeTask
            ? {
                ...resumeTask,
                targetPosition: resumeTask.targetPosition ? cloneVec2(resumeTask.targetPosition) : resumeTask.targetPosition ?? null,
                resumeTask: null
              }
            : { kind: "idle", label: "Resupply stop", targetPosition: null, targetEntityId: null };
        } else {
          const resumeTask = combatant.task.kind === "move" ? (combatant.task.resumeTask ?? null) : null;
          combatant.task =
            resumeTask
              ? {
                  ...resumeTask,
                  targetPosition: resumeTask.targetPosition ? cloneVec2(resumeTask.targetPosition) : resumeTask.targetPosition ?? null,
                  resumeTask: null
                }
              : combatant.task.kind === "move"
                ? { kind: "idle", label: "Arrived", targetPosition: null, targetEntityId: null }
                : { ...combatant.task, label: combatant.task.label ?? `${combatant.task.kind} on site`, targetPosition: null };
        }
        continue;
      }

      const maxStep = movementSpeed * deltaSeconds;
      if (maxStep >= distance) {
        combatant.position = cloneVec2(target);

        const orderId = combatant.task.targetEntityId ?? null;
        const isOrderTask = combatant.task.kind === "build" || combatant.task.kind === "resupply";
        const order = orderId ? (this.state.orders.find((entry) => entry.id === orderId) ?? null) : null;

        if (order && combatant.task.kind === "build") {
          this.pushCause(order, "builder-on-site");
          combatant.task = { ...combatant.task, label: `Building: ${order.kind}`, targetPosition: null };
          continue;
        }

        if (order && isOrderTask) {
          this.completeOrder(order);
          if (combatant.kind === "soldier") {
            const soldier = combatant as TownWarSoldierState;
            const completionText =
              order.kind === "trench"
                ? "Trench is in. Get down and breathe."
                : order.kind === "ammo-crate"
                  ? "Crate is set - feed the line from here."
                  : "Order complete.";

            this.pushChatter({
              faction: soldier.faction,
              channel: this.buildSoldierChannel(soldier),
              text: completionText,
              tags: ["build", "complete", order.kind],
              cooldownKey: `${soldier.id}:order-complete:${order.id}`,
              cooldownSeconds: 20
            });
          }
          combatant.task = { kind: "idle", label: `Order complete: ${order.kind}`, targetPosition: null, targetEntityId: null };
          continue;
        }

        if (combatant.task.kind === "build") {
          combatant.task = { kind: "idle", label: "Build stop", targetPosition: null, targetEntityId: null };
          continue;
        }

        if (combatant.task.kind === "resupply") {
          const resumeTask = combatant.task.resumeTask ?? null;
          combatant.task = resumeTask
            ? {
                ...resumeTask,
                targetPosition: resumeTask.targetPosition ? cloneVec2(resumeTask.targetPosition) : resumeTask.targetPosition ?? null,
                resumeTask: null
              }
            : { kind: "idle", label: "Resupply stop", targetPosition: null, targetEntityId: null };
          continue;
        }

        const resumeTask = combatant.task.kind === "move" ? (combatant.task.resumeTask ?? null) : null;
        combatant.task =
          resumeTask
            ? {
                ...resumeTask,
                targetPosition: resumeTask.targetPosition ? cloneVec2(resumeTask.targetPosition) : resumeTask.targetPosition ?? null,
                resumeTask: null
              }
            : combatant.task.kind === "move"
              ? { kind: "idle", label: "Arrived", targetPosition: null, targetEntityId: null }
              : { ...combatant.task, label: combatant.task.label ?? `${combatant.task.kind} on site`, targetPosition: null };
        continue;
      }

      const dx = (target.x - combatant.position.x) / distance;
      const dy = (target.y - combatant.position.y) / distance;
      combatant.position.x += dx * maxStep;
      combatant.position.y += dy * maxStep;
    }

    this.refreshAiThreats();
    this.refreshTacticalIntents();
    this.tickCampSustainment(deltaSeconds);
    this.tickColonyWorkAssignments();
    this.tickAmmoConsumption(deltaSeconds);
    this.tickCombat(deltaSeconds);
    this.tickDugouts(deltaSeconds);
    this.tickBuildOrderProgress(deltaSeconds);
    this.tickRescueProgress(deltaSeconds);
    this.refreshAiThreats();
    this.refreshTacticalIntents();
    this.tickPressureRecovery(deltaSeconds);
    this.tickAmmoCrateResupply(deltaSeconds);
    this.tickAmmoCrateResupplyTrips();
    this.tickAmmoCrateAttrition(deltaSeconds);
    this.tickAmmoCrateLooting();
    resolveTownWarMatch(this.state);
  }

  ensureDemoSeeded(): void {
    if (this.demoSeeded) {
      return;
    }
    this.demoSeeded = true;

    const midY = WORLD_HEIGHT * 0.5;
    const focus = this.getFrontlineFocusPosition("mid");
    const playerCamp = this.getCampSpawn(TOWN_WAR_PLAYER_FACTION).position;
    this.ensureDefaultCoverSlots();

    this.spawnSoldierFromCamp({
      faction: TOWN_WAR_PLAYER_FACTION,
      role: "builder",
      spawnReason: "initial",
      ammoInMag: 12,
      ammoReserve: 24,
      task: {
        kind: "hold",
        label: "Camp work: builder waiting for orders",
        targetPosition: null,
        targetEntityId: null
      }
    });

    this.spawnSoldierFromCamp({
      faction: TOWN_WAR_PLAYER_FACTION,
      role: "rifleman",
      spawnReason: "initial",
      task: {
        kind: "defend",
        label: "Camp defense: right perimeter",
        targetPosition: { x: playerCamp.x - 260, y: playerCamp.y + 46 },
        targetEntityId: null
      }
    });

    this.spawnSoldierFromCamp({
      faction: TOWN_WAR_PLAYER_FACTION,
      role: "suppressor",
      spawnReason: "initial",
      ammoMaxMag: 60,
      ammoInMag: 60,
      ammoReserve: 180,
      task: {
        kind: "suppress",
        label: "Camp defense: cover right perimeter",
        targetPosition: { x: playerCamp.x - 310, y: playerCamp.y - 34 },
        targetEntityId: null
      }
    });

    this.spawnSoldierFromCamp({
      faction: TOWN_WAR_ENEMY_FACTION,
      role: "builder",
      spawnReason: "initial",
      ammoInMag: 12,
      ammoReserve: 24,
      task: {
        kind: "build",
        label: "Demo: fortify market berm",
        targetPosition: { x: focus.x - 180, y: midY + 80 },
        targetEntityId: null
      }
    });

    this.spawnSoldierFromCamp({
      faction: TOWN_WAR_ENEMY_FACTION,
      role: "rifleman",
      spawnReason: "initial",
      task: {
        kind: "attack",
        label: "Demo: probe the road crossing",
        targetPosition: { x: focus.x - 100, y: midY - 44 },
        targetEntityId: null
      }
    });

    this.spawnSoldierFromCamp({
      faction: TOWN_WAR_ENEMY_FACTION,
      role: "suppressor",
      spawnReason: "initial",
      ammoMaxMag: 60,
      ammoInMag: 60,
      ammoReserve: 180,
      task: {
        kind: "suppress",
        label: "Demo: suppress the road crossing",
        targetPosition: { x: focus.x - 150, y: midY + 30 },
        targetEntityId: null
      }
    });

    this.spawnSoldierFromCamp({
      faction: TOWN_WAR_PLAYER_FACTION,
      role: "medic",
      spawnReason: "initial",
      task: {
        kind: "hold",
        label: "Demo: aid station ready",
        targetPosition: { x: focus.x + 260, y: midY + 105 },
        targetEntityId: null
      }
    });

    this.spawnSoldierFromCamp({
      faction: TOWN_WAR_ENEMY_FACTION,
      role: "medic",
      spawnReason: "initial",
      task: {
        kind: "hold",
        label: "Demo: rear aid ready",
        targetPosition: { x: focus.x - 260, y: midY - 105 },
        targetEntityId: null
      }
    });

    this.specializeCampWorker(
      this.spawnSoldierFromCamp({
        faction: TOWN_WAR_PLAYER_FACTION,
        role: "defender",
        spawnReason: "initial",
        task: {
          kind: "hold",
          label: "Demo: camp meals and recovery",
          targetPosition: { x: focus.x + 330, y: midY + 150 },
          targetEntityId: null
        }
      }),
      "cook"
    );

    this.specializeCampWorker(
      this.spawnSoldierFromCamp({
        faction: TOWN_WAR_PLAYER_FACTION,
        role: "rifleman",
        spawnReason: "initial",
        task: {
          kind: "hold",
          label: "Demo: quartermaster tally",
          targetPosition: { x: focus.x + 335, y: midY - 145 },
          targetEntityId: null
        }
      }),
      "quartermaster"
    );

    this.specializeCampWorker(
      this.spawnSoldierFromCamp({
        faction: TOWN_WAR_ENEMY_FACTION,
        role: "defender",
        spawnReason: "initial",
        task: {
          kind: "hold",
          label: "Demo: rear kitchen rotation",
          targetPosition: { x: focus.x - 330, y: midY - 150 },
          targetEntityId: null
        }
      }),
      "cook"
    );

    this.specializeCampWorker(
      this.spawnSoldierFromCamp({
        faction: TOWN_WAR_ENEMY_FACTION,
        role: "rifleman",
        spawnReason: "initial",
        task: {
          kind: "hold",
          label: "Demo: rear supply ledger",
          targetPosition: { x: focus.x - 335, y: midY + 145 },
          targetEntityId: null
        }
      }),
      "quartermaster"
    );

    this.applyOperationLoadoutToPlayerCamp();
    this.applyCarriedSoldierRecords();
    this.tickCampSustainment(0.1);
    this.refreshAiThreats();
    this.refreshTacticalIntents();
    resolveTownWarMatch(this.state);
  }

  orderTrench(
    campId: TownWarFactionId,
    targetPosition?: Vec2 | null,
    costBuild = 25,
    facingAngleRadians = campId === "camp-a" ? Math.PI : 0
  ): TownWarOfficerOrderResult {
    this.ensureDemoSeeded();

    const camp = this.getCamp(campId);
    if (!camp) {
      return { ok: false, reason: "camp-missing", campId, campSupply: null, assignedSoldierId: null, assignedRole: null, task: null };
    }

    if (!Number.isFinite(costBuild) || costBuild <= 0) {
      return { ok: false, reason: "invalid-cost", campId, campSupply: { ...camp.supply }, assignedSoldierId: null, assignedRole: null, task: null };
    }

    if (camp.supply.build < costBuild) {
      return { ok: false, reason: "insufficient-build-supply", campId, campSupply: { ...camp.supply }, assignedSoldierId: null, assignedRole: null, task: null };
    }

    const fallbackSpawn = this.getCampSpawn(campId).position;
    const requestedPosition =
      targetPosition && Number.isFinite(targetPosition.x) && Number.isFinite(targetPosition.y)
        ? cloneVec2(targetPosition)
        : {
            x: this.getCampFrontlineX(campId, 140),
            y: fallbackSpawn.y - 80
          };
    const riskTier = this.computeRiskTier(campId, requestedPosition);
    const buildPick = this.pickSoldierForWork(campId, "Build", requestedPosition, riskTier);
    if (!buildPick) {
      return { ok: false, reason: "no-builder-available", campId, campSupply: { ...camp.supply }, assignedSoldierId: null, assignedRole: null, task: null };
    }
    const builder = buildPick.soldier;

    this.state.officer.lastCommandRead = `Order trench (${campId})`;
    this.state.officer.lastCommandAtSeconds = this.state.clock.seconds;

    const position = requestedPosition;
    const facingAngle = normalizeAngleRadians(facingAngleRadians);

    const travelDistance = getDistance(builder.position, position);
    const etaSeconds = travelDistance / DEFAULT_MOVEMENT_SPEED;

    const orderId = buildOrderId(this.state);
    const task: TownWarTask = {
      kind: "build",
      label: `Order: trench @ ${Math.round(position.x)},${Math.round(position.y)}`,
      targetPosition: position,
      targetEntityId: orderId
    };

    camp.supply.build = Math.max(0, camp.supply.build - costBuild);
    builder.task = task;
    this.recordSelectedWork(builder, "Build", position, riskTier);

    const buildOrder: TownWarBuildOrderState = {
      id: orderId,
      kind: "trench",
      faction: campId,
      position: cloneVec2(position),
      facingAngleRadians: facingAngle,
      status: "assigned",
      assignedSoldierId: builder.id,
      build: this.createBuildExecution(campId, position),
      ammoPayload: null,
      builtEntityId: null,
      createdAtSeconds: this.state.clock.seconds,
      completedAtSeconds: null
    };
    this.state.orders.push(buildOrder);
    this.pushCause(buildOrder, "order-accepted");

    this.emitDramaEvent({
      kind: "build-order-issued",
      faction: campId,
      campId,
      orderId,
      orderKind: "trench",
      soldierId: builder.id,
      position,
      riskTier,
      summary: `Officer ordered ${builder.id} to dig a trench at ${Math.round(position.x)},${Math.round(position.y)}.`,
      tags: ["order", "build", "trench", `risk-${riskTier}`]
    });

    this.emitDramaEvent({
      kind: riskTier === "high" ? "builder-exposed" : "builder-moving",
      faction: campId,
      campId,
      orderId,
      orderKind: "trench",
      soldierId: builder.id,
      position,
      riskTier,
      summary:
        riskTier === "high"
          ? `${builder.id} is crossing exposed ground for the trench order.`
          : `${builder.id} is moving to the trench build site.`,
      tags: ["builder", "build", "trench", `risk-${riskTier}`]
    });

    this.pushChatter({
      faction: builder.faction,
      channel: this.buildSoldierChannel(builder),
      text: `Copy. Digging a trench at ${Math.round(position.x)},${Math.round(position.y)}.`,
      tags: ["order", "build", "trench"],
      cooldownKey: `${builder.id}:order-build:trench`,
      cooldownSeconds: 8
    });

    return {
      ok: true,
      reason: null,
      campId,
      campSupply: { ...camp.supply },
      assignedSoldierId: builder.id,
      assignedRole: builder.role,
      task,
      orderId,
      travelDistance,
      etaSeconds,
      riskTier
    };
  }

  placeDebugTrench(campId: TownWarFactionId, targetPosition?: Vec2 | null, facingAngleRadians = campId === "camp-a" ? Math.PI : 0): TownWarDebugTrenchResult {
    this.ensureDemoSeeded();

    const camp = this.getCamp(campId);
    if (!camp) {
      const order = this.orderTrench(campId, targetPosition, 1, facingAngleRadians);
      return {
        ok: false,
        reason: "camp-missing",
        order,
        coverSlot: null,
        readable: `Debug trench failed: ${campId} is not a live camp.`
      };
    }

    camp.supply.build = Math.max(camp.supply.build, 1);
    const order = this.orderTrench(campId, targetPosition, 1, facingAngleRadians);
    if (!order.ok || !order.orderId) {
      return {
        ok: false,
        reason: order.reason ?? "order-failed",
        order,
        coverSlot: null,
        readable: `Debug trench failed: ${order.reason ?? "order failed"}.`
      };
    }

    const buildOrder = this.findOrder(order.orderId);
    if (!buildOrder) {
      return {
        ok: false,
        reason: "order-missing",
        order,
        coverSlot: null,
        readable: `Debug trench failed: ${order.orderId} was not recorded.`
      };
    }

    this.completeOrder(buildOrder);
    const coverSlot = this.state.aiTactics.coverSlots.find((slot) => slot.sourceKind === "trench" && slot.sourceId === buildOrder.id) ?? null;
    return {
      ok: true,
      reason: null,
      order,
      coverSlot,
      readable: `Debug trench placed at ${Math.round(buildOrder.position.x)},${Math.round(buildOrder.position.y)} for ${campId}.`
    };
  }

  orderAmmoCrate(campId: TownWarFactionId, targetPosition?: Vec2 | null, ammoCost = 120, buildCost = 10): TownWarOfficerOrderResult {
    this.ensureDemoSeeded();

    const camp = this.getCamp(campId);
    if (!camp) {
      return { ok: false, reason: "camp-missing", campId, campSupply: null, assignedSoldierId: null, assignedRole: null, task: null };
    }

    if (!Number.isFinite(ammoCost) || ammoCost <= 0 || !Number.isFinite(buildCost) || buildCost <= 0) {
      return { ok: false, reason: "invalid-cost", campId, campSupply: { ...camp.supply }, assignedSoldierId: null, assignedRole: null, task: null };
    }

    if (camp.supply.ammo < ammoCost) {
      return { ok: false, reason: "insufficient-ammo-supply", campId, campSupply: { ...camp.supply }, assignedSoldierId: null, assignedRole: null, task: null };
    }

    if (camp.supply.build < buildCost) {
      return { ok: false, reason: "insufficient-build-supply", campId, campSupply: { ...camp.supply }, assignedSoldierId: null, assignedRole: null, task: null };
    }

    const fallbackSpawn = this.getCampSpawn(campId).position;
    const requestedPosition =
      targetPosition && Number.isFinite(targetPosition.x) && Number.isFinite(targetPosition.y)
        ? cloneVec2(targetPosition)
        : {
            x: this.getCampFrontlineX(campId, 110),
            y: fallbackSpawn.y - 62
          };
    const riskTier = this.computeRiskTier(campId, requestedPosition);
    const buildPick = this.pickSoldierForWork(campId, "Build", requestedPosition, riskTier);
    if (!buildPick) {
      return { ok: false, reason: "no-builder-available", campId, campSupply: { ...camp.supply }, assignedSoldierId: null, assignedRole: null, task: null };
    }
    const builder = buildPick.soldier;

    this.state.officer.lastCommandRead = `Order ammo crate (${campId})`;
    this.state.officer.lastCommandAtSeconds = this.state.clock.seconds;

    const position = requestedPosition;

    const travelDistance = getDistance(builder.position, position);
    const etaSeconds = travelDistance / DEFAULT_MOVEMENT_SPEED;

    const orderId = buildOrderId(this.state);
    const task: TownWarTask = {
      kind: "build",
      label: `Order: ammo crate @ ${Math.round(position.x)},${Math.round(position.y)}`,
      targetPosition: position,
      targetEntityId: orderId
    };

    camp.supply.ammo = Math.max(0, camp.supply.ammo - ammoCost);
    camp.supply.build = Math.max(0, camp.supply.build - buildCost);
    builder.task = task;
    this.recordSelectedWork(builder, "Build", position, riskTier);

    const buildOrder: TownWarBuildOrderState = {
      id: orderId,
      kind: "ammo-crate",
      faction: campId,
      position: cloneVec2(position),
      facingAngleRadians: campId === "camp-a" ? Math.PI : 0,
      status: "assigned",
      assignedSoldierId: builder.id,
      build: this.createBuildExecution(campId, position),
      ammoPayload: ammoCost * AMMO_SUPPLY_ROUNDS_PER_POINT,
      builtEntityId: null,
      createdAtSeconds: this.state.clock.seconds,
      completedAtSeconds: null
    };
    this.state.orders.push(buildOrder);
    this.pushCause(buildOrder, "order-accepted");

    this.emitDramaEvent({
      kind: "build-order-issued",
      faction: campId,
      campId,
      orderId,
      orderKind: "ammo-crate",
      soldierId: builder.id,
      position,
      riskTier,
      summary: `Officer ordered ${builder.id} to place an ammo crate at ${Math.round(position.x)},${Math.round(position.y)}.`,
      tags: ["order", "build", "ammo-crate", "resupply", `risk-${riskTier}`]
    });

    this.emitDramaEvent({
      kind: riskTier === "high" ? "builder-exposed" : "builder-moving",
      faction: campId,
      campId,
      orderId,
      orderKind: "ammo-crate",
      soldierId: builder.id,
      position,
      riskTier,
      summary:
        riskTier === "high"
          ? `${builder.id} is exposed while carrying the ammo crate order.`
          : `${builder.id} is moving to the ammo crate build site.`,
      tags: ["builder", "build", "ammo-crate", "resupply", `risk-${riskTier}`]
    });

    this.pushChatter({
      faction: builder.faction,
      channel: this.buildSoldierChannel(builder),
      text: `Ammo crate order received - moving to ${Math.round(position.x)},${Math.round(position.y)}.`,
      tags: ["order", "build", "ammo-crate", "resupply"],
      cooldownKey: `${builder.id}:order-build:ammo-crate`,
      cooldownSeconds: 8
    });

    return {
      ok: true,
      reason: null,
      campId,
      campSupply: { ...camp.supply },
      assignedSoldierId: builder.id,
      assignedRole: builder.role,
      task,
      orderId,
      travelDistance,
      etaSeconds,
      riskTier
    };
  }

  orderDugout(
    campId: TownWarFactionId,
    targetPosition?: Vec2 | null,
    costBuild = 45,
    facingAngleRadians = campId === "camp-a" ? Math.PI : 0
  ): TownWarOfficerOrderResult {
    this.ensureDemoSeeded();

    const camp = this.getCamp(campId);
    if (!camp) {
      return { ok: false, reason: "camp-missing", campId, campSupply: null, assignedSoldierId: null, assignedRole: null, task: null };
    }
    if (!Number.isFinite(costBuild) || costBuild <= 0) {
      return { ok: false, reason: "invalid-cost", campId, campSupply: { ...camp.supply }, assignedSoldierId: null, assignedRole: null, task: null };
    }
    if (camp.supply.build < costBuild) {
      return { ok: false, reason: "insufficient-build-supply", campId, campSupply: { ...camp.supply }, assignedSoldierId: null, assignedRole: null, task: null };
    }

    const fallbackSpawn = this.getCampSpawn(campId).position;
    const requestedPosition =
      targetPosition && Number.isFinite(targetPosition.x) && Number.isFinite(targetPosition.y)
        ? cloneVec2(targetPosition)
        : {
            x: this.getCampFrontlineX(campId, 90),
            y: fallbackSpawn.y + 82
          };
    const riskTier = this.computeRiskTier(campId, requestedPosition);
    const buildPick = this.pickSoldierForWork(campId, "Build", requestedPosition, riskTier);
    if (!buildPick) {
      return { ok: false, reason: "no-builder-available", campId, campSupply: { ...camp.supply }, assignedSoldierId: null, assignedRole: null, task: null };
    }
    const builder = buildPick.soldier;
    const position = requestedPosition;
    const travelDistance = getDistance(builder.position, position);
    const etaSeconds = travelDistance / DEFAULT_MOVEMENT_SPEED;
    const orderId = buildOrderId(this.state);
    const task: TownWarTask = {
      kind: "build",
      label: `Order: dugout @ ${Math.round(position.x)},${Math.round(position.y)}`,
      targetPosition: position,
      targetEntityId: orderId
    };

    camp.supply.build = Math.max(0, camp.supply.build - costBuild);
    builder.task = task;
    this.recordSelectedWork(builder, "Build", position, riskTier);
    this.state.officer.lastCommandRead = `Order dugout (${campId})`;
    this.state.officer.lastCommandAtSeconds = this.state.clock.seconds;

    const buildOrder: TownWarBuildOrderState = {
      id: orderId,
      kind: "dugout",
      faction: campId,
      position: cloneVec2(position),
      facingAngleRadians: normalizeAngleRadians(facingAngleRadians),
      status: "assigned",
      assignedSoldierId: builder.id,
      build: this.createBuildExecution(campId, position),
      ammoPayload: null,
      builtEntityId: null,
      createdAtSeconds: this.state.clock.seconds,
      completedAtSeconds: null
    };
    this.state.orders.push(buildOrder);
    this.pushCause(buildOrder, "order-accepted");

    this.emitDramaEvent({
      kind: "build-order-issued",
      faction: campId,
      campId,
      orderId,
      orderKind: "dugout",
      soldierId: builder.id,
      position,
      riskTier,
      summary: `Officer ordered ${builder.id} to build a dugout rally node at ${Math.round(position.x)},${Math.round(position.y)}.`,
      tags: ["order", "build", "dugout", "rally", `risk-${riskTier}`]
    });
    this.pushChatter({
      faction: builder.faction,
      channel: this.buildSoldierChannel(builder),
      text: `Dugout order received - building shelter at ${Math.round(position.x)},${Math.round(position.y)}.`,
      tags: ["order", "build", "dugout"],
      cooldownKey: `${builder.id}:order-build:dugout`,
      cooldownSeconds: 8
    });

    return {
      ok: true,
      reason: null,
      campId,
      campSupply: { ...camp.supply },
      assignedSoldierId: builder.id,
      assignedRole: builder.role,
      task,
      orderId,
      travelDistance,
      etaSeconds,
      riskTier
    };
  }

  damageDugout(dugoutId: string, amount: number): TownWarDugoutState | null {
    const dugout = this.findDugout(dugoutId);
    if (!dugout || !Number.isFinite(amount) || amount <= 0 || dugout.destroyedAtSeconds !== null) {
      return dugout;
    }
    dugout.health = Math.max(0, dugout.health - amount);
    dugout.status = dugout.health <= 0 ? "destroyed" : "damaged";
    dugout.destroyedAtSeconds = dugout.health <= 0 ? this.state.clock.seconds : null;
    dugout.readable = dugout.status === "destroyed" ? "Position collapsing" : "Dugout damaged";
    dugout.lastUpdatedAtSeconds = this.state.clock.seconds;
    this.emitDramaEvent({
      kind: "dugout-damaged",
      faction: dugout.faction,
      campId: dugout.faction,
      orderId: dugout.builtFromOrderId,
      orderKind: "dugout",
      soldierId: null,
      ammoCrateId: null,
      position: dugout.position,
      riskTier: this.computeRiskTier(dugout.faction, dugout.position),
      summary: `${dugout.id} took damage; ${dugout.readable.toLowerCase()}.`,
      tags: ["dugout", "damage", dugout.status]
    });
    return dugout;
  }

  getDugoutReport(): {
    dugouts: TownWarDugoutState[];
    readable: string;
  } {
    this.ensureDemoSeeded();
    this.tickDugouts(0);
    const dugouts = this.state.dugouts.map((dugout) => cloneDugout(dugout));
    const readable =
      dugouts.length === 0
        ? "No dugouts built."
        : dugouts
            .map(
              (dugout) =>
                `${dugout.id} ${dugout.status}: ${dugout.readable}; connected trenches ${dugout.connectedTrenchSlotIds.length}; sheltering ${dugout.shelteringSoldierIds.length}; health ${Math.round(dugout.health)}/${dugout.maxHealth}.`
            )
            .join(" ");
    return { dugouts, readable };
  }

  focusLane(campId: TownWarFactionId, lane: TownWarOfficerLaneId): TownWarOfficerFocusResult {
    this.ensureDemoSeeded();

    this.state.officer.focusedLane = lane;
    this.state.officer.lastCommandRead = `Focus lane (${campId} -> ${lane})`;
    this.state.officer.lastCommandAtSeconds = this.state.clock.seconds;

    const laneY =
      lane === "north" ? WORLD_HEIGHT * 0.5 - 140 : lane === "south" ? WORLD_HEIGHT * 0.5 + 140 : WORLD_HEIGHT * 0.5;
    const campALineX = this.getCampLineX("camp-a");
    const campBLineX = this.getCampLineX("camp-b");
    const midX = (campALineX + campBLineX) / 2;
    const focusX = midX + (campId === "camp-a" ? 150 : -150);
    const focusPosition = { x: focusX, y: laneY };
    const riskTier = this.computeRiskTier(campId, focusPosition);

    const assignments: Array<{ soldierId: string; role: TownWarRoleId; task: TownWarTask }> = [];
    let holdChatterSent = false;
    let suppressChatterSent = false;
    let resupplyChatterSent = false;
    let restChatterSent = false;

    for (const soldier of this.state.soldiers) {
      if (soldier.faction !== campId) {
        continue;
      }

      if (soldier.task.kind === "build") {
        continue;
      }

      const decision = this.refreshTaskDecisionForSoldier(soldier, focusPosition, riskTier);
      const selectedWork = decision.selectedWork ?? "Defend";
      const nearestCrate =
        selectedWork === "Resupply"
          ? this.state.ammoCrates
              .filter((crate) => crate.faction === soldier.faction && crate.destroyedAtSeconds === null && crate.ammo > 0)
              .sort((left, right) => getDistance(left.position, soldier.position) - getDistance(right.position, soldier.position))[0] ?? null
          : null;

      const task: TownWarTask =
        selectedWork === "Suppress"
          ? {
              kind: "suppress",
              label: `Order: suppress ${lane} lane`,
              targetPosition: focusPosition,
              targetEntityId: null
            }
          : selectedWork === "Resupply"
            ? {
                kind: "resupply",
                label: `Order: resupply ${lane} lane`,
                targetPosition: nearestCrate ? cloneVec2(nearestCrate.position) : cloneVec2(this.getCampSpawn(campId).position),
                targetEntityId: nearestCrate?.id ?? campId,
                resumeTask: {
                  kind: "defend",
                  label: `Resume: hold ${lane} lane`,
                  targetPosition: focusPosition,
                  targetEntityId: null
                }
              }
            : selectedWork === "Rest"
              ? {
                  kind: "hold",
                  label: `Rest cycle: ${lane} reserve`,
                  targetPosition: cloneVec2(this.getCampSpawn(campId).position),
                  targetEntityId: campId
                }
              : selectedWork === "Scout"
                ? {
                    kind: "defend",
                    label: `Order: watch ${lane} flank`,
                    targetPosition: { x: focusX, y: laneY + (soldier.id.endsWith("1") ? -70 : 70) },
                    targetEntityId: null
                  }
                : {
                    kind: "defend",
                    label: `Order: hold ${lane} lane`,
                    targetPosition: focusPosition,
                    targetEntityId: null
                  };

      soldier.task = task;
      this.recordSelectedWork(soldier, selectedWork, task.targetPosition ?? focusPosition, riskTier);
      assignments.push({ soldierId: soldier.id, role: soldier.role, task });

      if (selectedWork === "Suppress" && !suppressChatterSent) {
        suppressChatterSent = true;
        this.pushChatter({
          faction: soldier.faction,
          channel: this.buildSoldierChannel(soldier),
          text: `Setting up suppressing fire on ${lane}.`,
          tags: ["order", "suppress", "hold"],
          cooldownKey: `${soldier.id}:order-suppress:${lane}`,
          cooldownSeconds: 10
        });
      } else if (selectedWork === "Resupply" && !resupplyChatterSent) {
        resupplyChatterSent = true;
        this.pushChatter({
          faction: soldier.faction,
          channel: this.buildSoldierChannel(soldier),
          text: `Ammo run assigned for ${lane}.`,
          tags: ["order", "resupply", "ammo"],
          cooldownKey: `${soldier.id}:order-resupply:${lane}`,
          cooldownSeconds: 10
        });
      } else if (selectedWork === "Rest" && !restChatterSent) {
        restChatterSent = true;
        this.pushChatter({
          faction: soldier.faction,
          channel: this.buildSoldierChannel(soldier),
          text: `Rotating back. Too tired to be useful forward.`,
          tags: ["order", "rest", "fatigue"],
          cooldownKey: `${soldier.id}:order-rest:${lane}`,
          cooldownSeconds: 10
        });
      } else if (selectedWork !== "Suppress" && !holdChatterSent) {
        holdChatterSent = true;
        this.pushChatter({
          faction: soldier.faction,
          channel: this.buildSoldierChannel(soldier),
          text: `Holding ${lane}. Don't drift.`,
          tags: ["order", "hold", "defend"],
          cooldownKey: `${soldier.id}:order-hold:${lane}`,
          cooldownSeconds: 10
        });
      }
    }

    if (assignments.length === 0) {
      return { ok: false, reason: "no-combatants-available", campId, lane, assignments: [] };
    }

    return { ok: true, reason: null, campId, lane, assignments };
  }

  stageCasualty(
    soldierId: string,
    targetPosition?: Vec2 | null,
    severity: TownWarCasualtySeverity = "serious"
  ): TownWarCasualtyMutationResult {
    this.ensureDemoSeeded();

    const soldier = this.findSoldierById(soldierId);
    if (!soldier) {
      return { ok: false, reason: "soldier-missing", casualty: null, soldier: null, medic: null, readable: "Casualty stage failed: soldier missing." };
    }
    const actualSeverity: TownWarCasualtySeverity = severity === "light" || severity === "serious" || severity === "critical" ? severity : "serious";
    const position =
      targetPosition && Number.isFinite(targetPosition.x) && Number.isFinite(targetPosition.y) ? cloneVec2(targetPosition) : cloneVec2(soldier.position);
    const existing = this.state.casualties.find((casualty) => casualty.soldierId === soldier.id && casualty.status !== "lost") ?? null;
    const casualty = existing ?? {
      id: buildCasualtyId(this.state),
      soldierId: soldier.id,
      faction: soldier.faction,
      position: cloneVec2(position),
      severity: actualSeverity,
      status: actualSeverity === "critical" ? "downed" : "wounded",
      assignedMedicId: null,
      rescueScore: 0,
      rescueReason: "not evaluated",
      pathRisk: this.getExposureForRisk(this.computeRiskTier(soldier.faction, position)),
      coveredPath: this.getCoveredRescuePath(soldier.faction, position),
      treatmentProgress: 0,
      requiredTreatment: this.getRequiredTreatment(actualSeverity),
      outcomeCause: null,
      causeChain: [`severity-${actualSeverity}`, `risk-${this.computeRiskTier(soldier.faction, position)}`],
      createdAtSeconds: this.state.clock.seconds,
      lastUpdatedAtSeconds: this.state.clock.seconds,
      completedAtSeconds: null
    };
    casualty.position = cloneVec2(position);
    casualty.severity = actualSeverity;
    casualty.status = actualSeverity === "critical" ? "downed" : "wounded";
    casualty.requiredTreatment = this.getRequiredTreatment(actualSeverity);
    casualty.pathRisk = this.getExposureForRisk(this.computeRiskTier(soldier.faction, position));
    casualty.coveredPath = this.getCoveredRescuePath(soldier.faction, position, casualty.id);
    casualty.lastUpdatedAtSeconds = this.state.clock.seconds;
    if (!existing) {
      this.state.casualties.push(casualty);
    }

    soldier.position = cloneVec2(position);
    soldier.health.current = actualSeverity === "critical" ? 22 : actualSeverity === "serious" ? 42 : 58;
    soldier.currentNeed = "wounded";
    soldier.task = { kind: "hold", label: `${actualSeverity} casualty`, targetPosition: null, targetEntityId: casualty.id };
    soldier.identitySummary = buildIdentitySummary(soldier.skills, soldier.traits, soldier.currentNeed, soldier.dramaArc.trustInOfficer);

    this.emitDramaEvent({
      kind: "casualty-staged",
      faction: soldier.faction,
      campId: soldier.faction,
      soldierId: soldier.id,
      position,
      locationLabel: `${soldier.displayName} casualty site`,
      riskTier: this.computeRiskTier(soldier.faction, position),
      summary: `${soldier.displayName} is ${casualty.status} near ${Math.round(position.x)},${Math.round(position.y)}.`,
      tags: ["casualty", casualty.status, `severity-${actualSeverity}`]
    });

    return {
      ok: true,
      reason: null,
      casualty,
      soldier,
      medic: null,
      readable: `${casualty.id} ${soldier.displayName} ${casualty.status} ${actualSeverity} risk ${casualty.pathRisk}`
    };
  }

  orderMedicRescue(medicId: string, targetSoldierId: string, coveredById?: string | null): TownWarCasualtyMutationResult {
    this.ensureDemoSeeded();

    const medic = this.findSoldierById(medicId);
    const target = this.findSoldierById(targetSoldierId);
    if (!medic || !target) {
      return { ok: false, reason: !medic ? "medic-missing" : "target-missing", casualty: null, soldier: target, medic, readable: "Medic order failed: missing soldier." };
    }
    const casualty = this.findCasualty(target.id);
    if (!casualty) {
      return { ok: false, reason: "casualty-missing", casualty: null, soldier: target, medic, readable: "Medic order failed: target has no active casualty." };
    }
    if (medic.faction !== casualty.faction) {
      return { ok: false, reason: "wrong-faction", casualty, soldier: target, medic, readable: "Medic order failed: medic is not same faction." };
    }

    const cover = coveredById ? this.findSoldierById(coveredById) : null;
    if (cover && cover.faction === medic.faction) {
      cover.task = {
        kind: "suppress",
        label: `Cover rescue: ${casualty.id}`,
        targetPosition: cloneVec2(casualty.position),
        targetEntityId: casualty.id
      };
      this.recordSelectedWork(cover, "Suppress", casualty.position, this.computeRiskTier(casualty.faction, casualty.position));
      this.pushCasualtyCause(casualty, `covered-by-${cover.id}`);
    }

    const score = this.scoreRescueCandidate(medic, casualty);
    casualty.rescueScore = score.score;
    casualty.rescueReason = score.reason;
    casualty.pathRisk = score.pathRisk;
    casualty.coveredPath = score.coveredPath;
    casualty.assignedMedicId = medic.id;
    casualty.lastUpdatedAtSeconds = this.state.clock.seconds;
    this.pushCasualtyCause(casualty, score.blockedReason ?? (score.coveredPath >= 0.35 ? "covered-rescue-path" : "open-rescue-path"));

    const attachmentOverride = medic.dramaArc.protectiveOfSoldierIds.includes(casualty.soldierId);
    if ((score.blockedReason && !attachmentOverride) || score.score < 45) {
      casualty.outcomeCause = score.blockedReason ?? "rescue-score-too-low";
      medic.task = { kind: "hold", label: casualty.outcomeCause, targetPosition: null, targetEntityId: casualty.id };
      this.emitDramaEvent({
        kind: "medic-rescue-stalled",
        faction: casualty.faction,
        campId: casualty.faction,
        soldierId: medic.id,
        position: casualty.position,
        locationLabel: `${target.displayName} casualty site`,
        riskTier: this.computeRiskTier(casualty.faction, casualty.position),
        summary: `${medic.displayName} is waiting on ${target.displayName}: ${casualty.outcomeCause}.`,
        tags: ["casualty", "medic", "stalled", casualty.outcomeCause]
      });
      return { ok: false, reason: casualty.outcomeCause, casualty, soldier: target, medic, readable: `${medic.displayName} held: ${casualty.outcomeCause} score ${score.score}` };
    }

    medic.task = {
      kind: "heal",
      label: `Rescue ${target.displayName}`,
      targetPosition: cloneVec2(casualty.position),
      targetEntityId: casualty.id
    };
    this.recordSelectedWork(medic, "Rescue", casualty.position, this.computeRiskTier(casualty.faction, casualty.position));
    this.emitDramaEvent({
      kind: "medic-rescue-started",
      faction: casualty.faction,
      campId: casualty.faction,
      soldierId: medic.id,
      position: casualty.position,
      locationLabel: `${target.displayName} casualty site`,
      riskTier: this.computeRiskTier(casualty.faction, casualty.position),
      summary: `${medic.displayName} is moving to recover ${target.displayName}.`,
      tags: ["casualty", "medic", "rescue", score.coveredPath >= 0.35 ? "covered-path" : "open-path"]
    });

    return { ok: true, reason: null, casualty, soldier: target, medic, readable: `${medic.displayName} moving to ${target.displayName} score ${score.score}` };
  }

  getRescueReport(): TownWarRescueReportResult {
    this.ensureDemoSeeded();

    const activeCasualties = this.state.casualties.filter((casualty) => casualty.status !== "lost" && casualty.status !== "recovering");
    const candidates = activeCasualties.flatMap((casualty) =>
      this.state.soldiers
        .filter((soldier) => soldier.faction === casualty.faction && soldier.health.current > 0 && soldier.id !== casualty.soldierId)
        .map((medic) => {
          const score = this.scoreRescueCandidate(medic, casualty);
          return {
            medicId: medic.id,
            medicName: medic.displayName,
            targetSoldierId: casualty.soldierId,
            casualtyId: casualty.id,
            score: score.score,
            reason: score.reason,
            pathRisk: score.pathRisk,
            coveredPath: score.coveredPath,
            blockedReason: score.blockedReason
          };
        })
    ).sort((left, right) => right.score - left.score);
    const readable = activeCasualties.length === 0
      ? "No active casualties."
      : activeCasualties
          .map((casualty) => `${casualty.id}:${casualty.soldierId} ${casualty.status} score ${casualty.rescueScore} cause ${casualty.outcomeCause ?? casualty.causeChain.join(">")}`)
          .join(" | ");
    return { ok: true, reason: null, casualties: activeCasualties.map((casualty) => cloneCasualty(casualty)), candidates, readable };
  }

  getSustainmentReport(): TownWarSustainmentReportResult {
    this.ensureDemoSeeded();
    this.tickCampSustainment(0);
    const camps = this.state.camps.map((camp) => ({
      campId: camp.id,
      label: camp.label,
      readiness: camp.sustainment.readiness,
      fatigueAverage: camp.sustainment.fatigueAverage,
      hungerAverage: camp.sustainment.hungerAverage,
      moraleAverage: camp.sustainment.moraleAverage,
      ammoFlow: camp.sustainment.ammoFlow,
      cookEffect: camp.sustainment.cookEffect,
      restCycle: camp.sustainment.restCycle,
      logisticsScore: camp.sustainment.logisticsScore,
      cookingScore: camp.sustainment.cookingScore,
      enduranceScore: camp.sustainment.enduranceScore,
      bottleneckReason: camp.sustainment.bottleneckReason,
      warnings: [...camp.sustainment.warnings],
      workPriorities: { ...camp.sustainment.workPriorities }
    }));
    const readable = camps
      .map(
        (camp) =>
          `${camp.campId} readiness ${camp.readiness.toFixed(2)} ammo-flow ${camp.ammoFlow.toFixed(2)} cook ${camp.cookEffect.toFixed(2)} rest ${camp.restCycle.toFixed(2)} bottleneck ${camp.bottleneckReason ?? "none"}`
      )
      .join(" | ");
    return { ok: true, reason: null, camps, readable };
  }

  setCampWorkPriority(campId: TownWarFactionId, work: string, priority: number): TownWarCampWorkMutationResult {
    this.ensureDemoSeeded();
    const camp = this.getCamp(campId);
    if (!camp) {
      return { ok: false, reason: "camp-missing", campId, work: null, priority: null, report: null };
    }
    if (!this.isCampWork(work)) {
      return { ok: false, reason: "invalid-work", campId, work: null, priority: null, report: this.getSustainmentReport() };
    }

    const value = Math.round(clamp(priority, 0, 5));
    camp.sustainment.workPriorities[work] = value;
    for (const soldier of this.state.soldiers) {
      if (soldier.faction !== campId) {
        continue;
      }
      if (work === "Cook") {
        soldier.workPriorities.Cook = value;
      } else if (work === "Resupply") {
        soldier.workPriorities.Resupply = value;
        soldier.workPriorities.Haul = value;
      } else {
        soldier.workPriorities.Rest = value;
      }
      this.refreshTaskDecisionForSoldier(soldier, soldier.position);
    }
    this.tickCampSustainment(0);
    return { ok: true, reason: null, campId, work, priority: value, report: this.getSustainmentReport() };
  }

  stageAmmoPressure(campId: TownWarFactionId): TownWarSustainmentReportResult {
    this.ensureDemoSeeded();
    const camp = this.getCamp(campId);
    if (!camp) {
      return { ok: false, reason: "camp-missing", camps: [], readable: `No camp found for ${campId}.` };
    }

    camp.supply.ammo = Math.min(camp.supply.ammo, 24);
    camp.sustainment.workPriorities.Resupply = Math.min(camp.sustainment.workPriorities.Resupply, 1);
    for (const soldier of this.state.soldiers) {
      if (soldier.faction !== campId) {
        continue;
      }
      soldier.ammo.reserve = Math.min(soldier.ammo.reserve, Math.floor(soldier.ammo.maxMag * 0.35));
      soldier.workPriorities.Resupply = Math.min(soldier.workPriorities.Resupply, 1);
      soldier.workPriorities.Haul = Math.min(soldier.workPriorities.Haul, 1);
      this.refreshSoldierNeedReadout(soldier);
      this.refreshTaskDecisionForSoldier(soldier, soldier.position);
    }
    this.tickCampSustainment(0);
    return this.getSustainmentReport();
  }

  stageFatigue(campId: TownWarFactionId, level: number): TownWarSustainmentReportResult {
    this.ensureDemoSeeded();
    const camp = this.getCamp(campId);
    if (!camp) {
      return { ok: false, reason: "camp-missing", camps: [], readable: `No camp found for ${campId}.` };
    }

    const fatigue = clampNeed(level);
    for (const soldier of this.state.soldiers) {
      if (soldier.faction !== campId) {
        continue;
      }
      soldier.needs.fatigue = fatigue;
      soldier.needs.hunger = clampNeed(Math.max(soldier.needs.hunger, fatigue * 0.65));
      soldier.needs.morale = clampNeed(Math.max(0.1, soldier.needs.morale - fatigue * 0.25));
      this.refreshSoldierNeedReadout(soldier);
      this.refreshTaskDecisionForSoldier(soldier, soldier.position);
    }
    this.tickCampSustainment(0);
    return this.getSustainmentReport();
  }

  stageFlankPressure(lane: TownWarFlankLaneId, pressure: TownWarFlankPressureLevel, campId: TownWarFactionId = "camp-a"): TownWarFlankPressureResult {
    this.ensureDemoSeeded();
    const camp = this.getCamp(campId);
    if (!camp) {
      return {
        ok: false,
        reason: "camp-missing",
        flank: null,
        outcome: null,
        debrief: cloneSkillDebrief(this.state.skillDebrief),
        scout: null,
        readable: `No camp found for ${campId}.`
      };
    }

    this.tickCampSustainment(0);
    const laneYOffset: Record<TownWarFlankLaneId, number> = { north: -190, mid: 0, south: 190 };
    const position = { x: this.getCampFrontlineX(campId, 230), y: this.getCampSpawn(campId).position.y + laneYOffset[lane] };
    const flank: TownWarFlankPressureState = {
      id: buildFlankId(this.state),
      faction: campId,
      lane,
      pressure,
      position,
      status: "active",
      scoutId: null,
      scoutScore: 0,
      spottedAtSeconds: null,
      resolvedAtSeconds: null,
      outcome: null,
      causeChain: [`flank-pressure-${pressure}`, `lane-${lane}`],
      readable: `${pressure} flank pressure entering ${lane}.`,
      createdAtSeconds: this.state.clock.seconds,
      lastUpdatedAtSeconds: this.state.clock.seconds
    };
    this.state.flankPressures.push(flank);

    const result = this.resolveFlankPressure(flank);
    return result;
  }

  runSkillEmergenceDemo(): TownWarSkillEmergenceDemoResult {
    this.reset();
    this.ensureDemoSeeded();
    const scout = this.state.soldiers.find((soldier) => soldier.faction === "camp-a" && soldier.archetype === "scout") ?? this.state.soldiers.find((soldier) => soldier.faction === "camp-a") ?? null;
    if (scout) {
      scout.skills.perception = 9;
      scout.skills.shooting = Math.max(scout.skills.shooting, 7);
      scout.skills.nerve = Math.max(scout.skills.nerve, 7);
      scout.workPriorities.Scout = 5;
      scout.workPriorities.Defend = Math.max(scout.workPriorities.Defend, 3);
      scout.ammo.reserve = Math.max(scout.ammo.reserve, scout.ammo.maxMag * 2);
      this.refreshSoldierNeedReadout(scout);
    }
    this.setCampWorkPriority("camp-a", "Resupply", 5);
    const hold = this.stageFlankPressure("north", "medium", "camp-a");

    for (const soldier of this.state.soldiers) {
      if (soldier.faction !== "camp-a") {
        continue;
      }
      soldier.workPriorities.Scout = 0;
      soldier.skills.perception = Math.min(soldier.skills.perception, 2);
      soldier.skills.nerve = Math.min(soldier.skills.nerve, 2);
      soldier.ammo.inMag = 0;
      soldier.ammo.reserve = 0;
      this.refreshSoldierNeedReadout(soldier);
      this.refreshTaskDecisionForSoldier(soldier, soldier.position);
    }
    this.stageAmmoPressure("camp-a");
    this.stageFatigue("camp-a", 0.95);
    const target = this.state.soldiers.find((soldier) => soldier.faction === "camp-a") ?? null;
    if (target) {
      this.stageCasualty(target.id, { x: this.getCampFrontlineX("camp-a", 230), y: this.getCampSpawn("camp-a").position.y + 190 }, "critical");
    }
    const failure = this.stageFlankPressure("south", "high", "camp-a");
    const readable = `Skill emergence demo: hold=${hold.outcome?.outcome ?? "none"} failure=${failure.outcome?.outcome ?? "none"} next=${this.state.skillDebrief.recommendedNextPlan}`;
    return { ok: hold.ok && failure.ok, reason: null, hold, failure, debrief: cloneSkillDebrief(this.state.skillDebrief), readable };
  }

  getSkillDebrief(): TownWarSkillDebriefState {
    this.ensureDemoSeeded();
    return cloneSkillDebrief(this.state.skillDebrief);
  }

  private resolveFlankPressure(flank: TownWarFlankPressureState): TownWarFlankPressureResult {
    const camp = this.getCamp(flank.faction);
    const defenders = this.state.soldiers.filter((soldier) => soldier.faction === flank.faction && soldier.health.current > 0);
    const scored = defenders
      .map((soldier) => ({ soldier, score: this.scoreFlankScout(soldier, flank) }))
      .sort((left, right) => right.score - left.score);
    const best = scored[0] ?? null;
    const scout = best?.soldier ?? null;
    const scoutScore = best?.score ?? 0;
    const pressureScore = flank.pressure === "high" ? 74 : flank.pressure === "medium" ? 58 : 42;
    const readiness = camp?.sustainment.readiness ?? 0.5;
    const ammoFlow = camp?.sustainment.ammoFlow ?? 0.5;
    const activeCasualties = this.state.casualties.filter((casualty) => casualty.faction === flank.faction && (casualty.status === "wounded" || casualty.status === "downed"));
    const scoutWarning = Boolean(scout && scout.workPriorities.Scout >= 4 && scout.skills.perception >= 6 && scoutScore >= pressureScore - 6);
    const suppressionHold = defenders.some((soldier) => soldier.workPriorities.Suppress >= 3 && soldier.skills.suppression >= 5 && soldier.ammo.inMag + soldier.ammo.reserve > 0);
    const goodSustainment = readiness >= 0.72 && ammoFlow >= 0.62;
    const totalAmmo = defenders.reduce((total, soldier) => total + soldier.ammo.inMag + soldier.ammo.reserve, 0);
    const lowNerve = scout ? scout.skills.nerve <= 3 || scout.dramaArc.combatNerve < 0.35 : true;
    const failedNoRescue = activeCasualties.length > 0 && this.state.soldiers.every((soldier) => soldier.faction !== flank.faction || soldier.workPriorities.Rescue <= 1);
    let outcome: TownWarSkillOutcomeId;
    const causeChain = [...flank.causeChain];

    if (scoutWarning || (suppressionHold && goodSustainment && scoutScore >= pressureScore - 14)) {
      outcome = scoutWarning ? "held-scout-warning" : suppressionHold ? "held-by-suppression" : "held-good-sustainment";
      if (goodSustainment && outcome !== "held-good-sustainment") {
        causeChain.push("held-good-sustainment");
      }
      if (suppressionHold && outcome !== "held-by-suppression") {
        causeChain.push("held-by-suppression");
      }
      if (scoutWarning && outcome !== "held-scout-warning") {
        causeChain.push("held-scout-warning");
      }
    } else if (totalAmmo <= defenders.length * 3 || ammoFlow < 0.2) {
      outcome = "failed-ammo-dry";
      causeChain.push("ammo-dry");
    } else if (lowNerve) {
      outcome = "failed-low-nerve";
      causeChain.push("low-nerve-warning-broke");
    } else if (failedNoRescue) {
      outcome = "failed-no-rescue";
      causeChain.push("casualty-pinned-no-rescue");
    } else {
      outcome = "failed-flank-unseen";
      causeChain.push("flank-unseen");
    }

    const held = outcome.startsWith("held-");
    flank.status = held ? "held" : "failed";
    flank.scoutId = scout?.id ?? null;
    flank.scoutScore = Math.round(scoutScore);
    flank.spottedAtSeconds = scoutScore >= pressureScore - 10 ? this.state.clock.seconds : null;
    flank.resolvedAtSeconds = this.state.clock.seconds;
    flank.outcome = outcome;
    flank.causeChain = uniqueLimited(causeChain, 12);
    flank.lastUpdatedAtSeconds = this.state.clock.seconds;
    flank.readable = this.describeFlankOutcome(flank, scout, readiness, ammoFlow);

    if (scout) {
      scout.task = {
        kind: held ? "suppress" : "hold",
        label: held ? `Warned ${flank.lane} flank` : `Missed ${flank.lane} flank`,
        targetPosition: cloneVec2(flank.position),
        targetEntityId: flank.id
      };
      scout.workPriorities.Scout = held ? Math.max(scout.workPriorities.Scout, 4) : scout.workPriorities.Scout;
      scout.dramaArc.trustInOfficer = clamp01(scout.dramaArc.trustInOfficer + (held ? 0.04 : -0.06));
      scout.dramaArc.confidence = clamp01(scout.dramaArc.confidence + (held ? 0.07 : -0.05));
      scout.dramaArc.guilt = clamp01(scout.dramaArc.guilt + (held ? 0 : 0.08));
      scout.dramaArc.signaturePrideTags = held ? uniqueLimited([outcome, ...scout.dramaArc.signaturePrideTags], 6) : scout.dramaArc.signaturePrideTags;
      scout.dramaArc.signatureTraumaTags = held ? scout.dramaArc.signatureTraumaTags : uniqueLimited([outcome, ...scout.dramaArc.signatureTraumaTags], 6);
      this.refreshSoldierNeedReadout(scout);
    }

    this.emitDramaEvent({
      kind: held ? "line-held" : "line-collapsed",
      faction: flank.faction,
      campId: flank.faction,
      soldierId: scout?.id ?? null,
      position: flank.position,
      locationLabel: `${flank.lane} flank trench mouth`,
      riskTier: flank.pressure === "high" ? "high" : flank.pressure === "medium" ? "medium" : "low",
      summary: flank.readable,
      tags: uniqueLimited(["skill-emergence", "flank", outcome, flank.lane, flank.pressure, ...flank.causeChain], 12)
    });

    for (const witness of defenders.slice(0, 5)) {
      witness.dramaMemoryTags = uniqueLimited(["skill-emergence", outcome, "flank", ...witness.dramaMemoryTags], 16);
    }

    const skillOutcome = this.recordSkillOutcome(flank, outcome, scout, readiness, ammoFlow);
    return { ok: true, reason: null, flank: cloneFlankPressure(flank), outcome: skillOutcome, debrief: cloneSkillDebrief(this.state.skillDebrief), scout, readable: flank.readable };
  }

  private scoreFlankScout(soldier: TownWarSoldierState, flank: TownWarFlankPressureState): number {
    const scoutPriority = soldier.workPriorities.Scout * 8;
    const perception = soldier.skills.perception * 5.2;
    const shooting = soldier.skills.shooting * 1.8;
    const nerve = soldier.skills.nerve * 2.4 + soldier.dramaArc.combatNerve * 12;
    const fatiguePenalty = soldier.needs.fatigue * 18 + soldier.needs.hunger * 8;
    const ammoBonus = soldier.ammo.inMag + soldier.ammo.reserve > 0 ? 8 : -18;
    const laneDistancePenalty = getDistance(soldier.position, flank.position) / 180;
    return Math.round(clamp(scoutPriority + perception + shooting + nerve + ammoBonus - fatiguePenalty - laneDistancePenalty, 0, 100));
  }

  private describeFlankOutcome(flank: TownWarFlankPressureState, scout: TownWarSoldierState | null, readiness: number, ammoFlow: number): string {
    const scoutRead = scout ? `${scout.displayName} scout-score ${Math.round(flank.scoutScore)}` : "no scout";
    const sustainment = `readiness ${readiness.toFixed(2)} ammo-flow ${ammoFlow.toFixed(2)}`;
    if (flank.status === "held") {
      return `${flank.lane} flank held by ${flank.outcome}: ${scoutRead}; ${sustainment}; chain ${flank.causeChain.join(" > ")}.`;
    }
    return `${flank.lane} flank failed by ${flank.outcome}: ${scoutRead}; ${sustainment}; chain ${flank.causeChain.join(" > ")}.`;
  }

  private recordSkillOutcome(
    flank: TownWarFlankPressureState,
    outcome: TownWarSkillOutcomeId,
    scout: TownWarSoldierState | null,
    readiness: number,
    ammoFlow: number
  ): TownWarSkillOutcomeState {
    const memoryTags = uniqueLimited(["skill-emergence", "flank", outcome, flank.lane, ...(scout?.dramaMemoryTags ?? [])], 12);
    const skillOutcome: TownWarSkillOutcomeState = {
      id: buildSkillOutcomeId(this.state),
      atSeconds: this.state.clock.seconds,
      outcome,
      lane: flank.lane,
      pressure: flank.pressure,
      summary: flank.readable,
      causeChain: [...flank.causeChain],
      scoutId: scout?.id ?? null,
      readiness,
      ammoFlow,
      memoryTags
    };
    this.state.skillDebrief.outcomes = [skillOutcome, ...this.state.skillDebrief.outcomes].slice(0, 10);
    this.state.skillDebrief.lastOutcome = skillOutcome;
    this.state.skillDebrief.causeChain = [...skillOutcome.causeChain];
    this.state.skillDebrief.summary = skillOutcome.summary;
    this.state.skillDebrief.recommendedNextPlan = this.recommendNextSkillPlan(outcome, flank, readiness, ammoFlow);
    this.state.skillDebrief.lastUpdatedAtSeconds = this.state.clock.seconds;
    return cloneSkillOutcome(skillOutcome);
  }

  private recommendNextSkillPlan(outcome: TownWarSkillOutcomeId, flank: TownWarFlankPressureState, readiness: number, ammoFlow: number): string {
    if (outcome === "failed-flank-unseen") {
      return `Put a high-Perception soldier on Scout 5 before rebuilding ${flank.lane}; the line failed before anyone saw the trench mouth threat.`;
    }
    if (outcome === "failed-low-nerve") {
      return `Pair the scout with a high-Nerve suppressor on ${flank.lane}; early warning existed but the warning action broke under pressure.`;
    }
    if (outcome === "failed-ammo-dry") {
      return `Raise Resupply and stage an ammo crate before holding ${flank.lane}; ammo flow ${ammoFlow.toFixed(2)} could not turn warning into fire.`;
    }
    if (outcome === "failed-no-rescue") {
      return `Assign a Rescue/Medic priority before pressuring ${flank.lane}; casualties pinned the line and no rescue lane existed.`;
    }
    if (readiness < 0.72) {
      return `The flank held, but improve Rest/Cook cycles before repeating it; readiness is only ${readiness.toFixed(2)}.`;
    }
    return `Repeatable plan: Scout 5 watches ${flank.lane}, suppressors cover the trench mouth, and Resupply keeps ammo flowing before the next push.`;
  }

  listPriorities(campId?: TownWarFactionId | null): TownWarSoldierState[] {
    this.ensureDemoSeeded();
    return this.state.soldiers
      .filter((soldier) => (campId ? soldier.faction === campId : true))
      .map((soldier) => {
        this.refreshTaskDecisionForSoldier(soldier, soldier.task.targetPosition ?? soldier.position);
        return soldier;
      });
  }

  getTaskCandidates(soldierId: string): TownWarPriorityMutationResult {
    this.ensureDemoSeeded();
    const soldier = this.findSoldierById(soldierId);
    if (!soldier) {
      return { ok: false, reason: "soldier-missing", soldierId, work: null, priority: null, soldier: null, candidates: [] };
    }
    const decision = this.refreshTaskDecisionForSoldier(soldier, soldier.task.targetPosition ?? soldier.position);
    return {
      ok: true,
      reason: null,
      soldierId: soldier.id,
      work: decision.selectedWork,
      priority: decision.selectedWork ? soldier.workPriorities[decision.selectedWork] : null,
      soldier,
      candidates: decision.candidates
    };
  }

  setSoldierPriority(soldierId: string, work: string, priority: number): TownWarPriorityMutationResult {
    this.ensureDemoSeeded();
    const soldier = this.findSoldierById(soldierId);
    if (!soldier) {
      return { ok: false, reason: "soldier-missing", soldierId, work: null, priority: null, soldier: null, candidates: [] };
    }
    if (!this.isPriorityWork(work)) {
      return { ok: false, reason: "invalid-work", soldierId: soldier.id, work: null, priority: null, soldier, candidates: [] };
    }
    if (!Number.isFinite(priority)) {
      return { ok: false, reason: "invalid-priority", soldierId: soldier.id, work, priority: null, soldier, candidates: [] };
    }

    soldier.workPriorities[work] = Math.round(clamp(priority, 0, 5));
    const decision = this.refreshTaskDecisionForSoldier(soldier, soldier.task.targetPosition ?? soldier.position);
    return {
      ok: true,
      reason: null,
      soldierId: soldier.id,
      work,
      priority: soldier.workPriorities[work],
      soldier,
      candidates: decision.candidates
    };
  }

  applySoldierPriorityPreset(soldierId: string, preset: string): TownWarPriorityMutationResult {
    this.ensureDemoSeeded();
    const soldier = this.findSoldierById(soldierId);
    if (!soldier) {
      return { ok: false, reason: "soldier-missing", soldierId, work: null, priority: null, soldier: null, candidates: [] };
    }

    const presets: Record<string, Partial<Record<TownWarWorkPriorityId, number>>> = {
      builder: { Build: 5, Repair: 4, Haul: 3, Defend: 1, Suppress: 1, Resupply: 2, Rescue: 1, Rest: 2, Scout: 1 },
      medic: { Rescue: 5, Medic: 5, Rest: 3, Defend: 1, Suppress: 1, Build: 1, Resupply: 2 },
      quartermaster: { Resupply: 5, Haul: 5, Build: 2, Repair: 2, Defend: 2, Suppress: 1, Rest: 2, Rescue: 1 },
      suppressor: { Suppress: 5, Defend: 4, Resupply: 3, Assault: 2, Build: 1, Rest: 2, Scout: 1 },
      rifleman: { Defend: 5, Assault: 3, Suppress: 2, Scout: 2, Build: 1, Resupply: 1, Rest: 2 },
      scout: { Scout: 5, Defend: 3, Suppress: 1, Build: 1, Resupply: 2, Rest: 2, Rescue: 1 },
      "rest-cycle": { Rest: 5, Defend: 1, Suppress: 1, Build: 1, Resupply: 1, Rescue: 1, Scout: 1, Assault: 0 }
    };
    const values = presets[preset] ?? null;
    if (!values) {
      return { ok: false, reason: "invalid-preset", soldierId: soldier.id, work: null, priority: null, soldier, candidates: [] };
    }

    for (const [work, value] of Object.entries(values)) {
      if (this.isPriorityWork(work)) {
        soldier.workPriorities[work] = Math.round(clamp(value ?? 0, 0, 5));
      }
    }

    const decision = this.refreshTaskDecisionForSoldier(soldier, soldier.task.targetPosition ?? soldier.position);
    return {
      ok: true,
      reason: null,
      soldierId: soldier.id,
      work: decision.selectedWork,
      priority: decision.selectedWork ? soldier.workPriorities[decision.selectedWork] : null,
      soldier,
      candidates: decision.candidates
    };
  }

  setSoldierNeeds(soldierId: string, needs: Partial<TownWarNeedState>): TownWarPriorityMutationResult {
    this.ensureDemoSeeded();
    const soldier = this.findSoldierById(soldierId);
    if (!soldier) {
      return { ok: false, reason: "soldier-missing", soldierId, work: null, priority: null, soldier: null, candidates: [] };
    }
    if (Number.isFinite(needs.fatigue)) {
      soldier.needs.fatigue = clampNeed(needs.fatigue ?? soldier.needs.fatigue);
    }
    if (Number.isFinite(needs.hunger)) {
      soldier.needs.hunger = clampNeed(needs.hunger ?? soldier.needs.hunger);
    }
    if (Number.isFinite(needs.morale)) {
      soldier.needs.morale = clampNeed(needs.morale ?? soldier.needs.morale);
    }
    soldier.currentNeed = deriveCurrentNeed(soldier.needs, soldier.health.current, soldier.health.max, soldier.ammo.reserve);
    soldier.identitySummary = buildIdentitySummary(soldier.skills, soldier.traits, soldier.currentNeed, soldier.dramaArc.trustInOfficer);
    const decision = this.refreshTaskDecisionForSoldier(soldier, soldier.task.targetPosition ?? soldier.position);
    return {
      ok: true,
      reason: null,
      soldierId: soldier.id,
      work: decision.selectedWork,
      priority: decision.selectedWork ? soldier.workPriorities[decision.selectedWork] : null,
      soldier,
      candidates: decision.candidates
    };
  }

  setSoldierAmmo(soldierId: string, ammo: Partial<TownWarCombatantAmmoState>): TownWarPriorityMutationResult {
    this.ensureDemoSeeded();
    const soldier = this.findSoldierById(soldierId);
    if (!soldier) {
      return { ok: false, reason: "soldier-missing", soldierId, work: null, priority: null, soldier: null, candidates: [] };
    }
    if (Number.isFinite(ammo.inMag)) {
      soldier.ammo.inMag = Math.max(0, Math.floor(ammo.inMag ?? soldier.ammo.inMag));
    }
    if (Number.isFinite(ammo.reserve)) {
      soldier.ammo.reserve = Math.max(0, Math.floor(ammo.reserve ?? soldier.ammo.reserve));
    }
    if (Number.isFinite(ammo.maxMag)) {
      soldier.ammo.maxMag = Math.max(1, Math.floor(ammo.maxMag ?? soldier.ammo.maxMag));
    }
    soldier.currentNeed = deriveCurrentNeed(soldier.needs, soldier.health.current, soldier.health.max, soldier.ammo.reserve);
    const decision = this.refreshTaskDecisionForSoldier(soldier, soldier.task.targetPosition ?? soldier.position);
    return {
      ok: true,
      reason: null,
      soldierId: soldier.id,
      work: decision.selectedWork,
      priority: decision.selectedWork ? soldier.workPriorities[decision.selectedWork] : null,
      soldier,
      candidates: decision.candidates
    };
  }

  orderTrenchForBuilder(
    builderId: string,
    targetPosition?: Vec2 | null,
    coveredById?: string | null,
    costBuild = 0
  ): TownWarOfficerOrderResult {
    this.ensureDemoSeeded();

    const builder = this.findSoldierById(builderId);
    if (!builder) {
      return { ok: false, reason: "builder-missing", campId: "camp-a", campSupply: null, assignedSoldierId: null, assignedRole: null, task: null };
    }

    const campId = builder.faction;
    const camp = this.getCamp(campId);
    if (!camp) {
      return { ok: false, reason: "camp-missing", campId, campSupply: null, assignedSoldierId: null, assignedRole: null, task: null };
    }

    if (costBuild > 0 && camp.supply.build < costBuild) {
      return { ok: false, reason: "insufficient-build-supply", campId, campSupply: { ...camp.supply }, assignedSoldierId: null, assignedRole: null, task: null };
    }

    const position =
      targetPosition && Number.isFinite(targetPosition.x) && Number.isFinite(targetPosition.y)
        ? cloneVec2(targetPosition)
        : { x: this.getCampFrontlineX(campId, 190), y: this.getCampSpawn(campId).position.y - 72 };
    const riskTier = this.computeRiskTier(campId, position);
    const orderId = buildOrderId(this.state);
    const task: TownWarTask = {
      kind: "build",
      label: `Build test: trench @ ${Math.round(position.x)},${Math.round(position.y)}`,
      targetPosition: position,
      targetEntityId: orderId
    };

    if (costBuild > 0) {
      camp.supply.build = Math.max(0, camp.supply.build - costBuild);
    }
    builder.task = task;
    this.recordSelectedWork(builder, "Build", position, riskTier);

    const coveredBy = coveredById ? this.findSoldierById(coveredById) : null;
    if (coveredBy && coveredBy.faction === campId) {
      coveredBy.task = {
        kind: "suppress",
        label: `Cover build: ${orderId}`,
        targetPosition: cloneVec2(position),
        targetEntityId: orderId
      };
      this.recordSelectedWork(coveredBy, "Suppress", position, riskTier);
    }

    const buildOrder: TownWarBuildOrderState = {
      id: orderId,
      kind: "trench",
      faction: campId,
      position: cloneVec2(position),
      facingAngleRadians: campId === "camp-a" ? Math.PI : 0,
      status: "assigned",
      assignedSoldierId: builder.id,
      build: this.createBuildExecution(campId, position),
      ammoPayload: null,
      builtEntityId: null,
      createdAtSeconds: this.state.clock.seconds,
      completedAtSeconds: null
    };
    if (coveredBy && coveredBy.faction === campId) {
      buildOrder.build.supportingSuppressorId = coveredBy.id;
      buildOrder.build.causeChain.push(`planned-cover-${coveredBy.id}`);
    }
    this.state.orders.push(buildOrder);
    this.pushCause(buildOrder, "order-accepted");

    this.pushChatter({
      faction: builder.faction,
      channel: this.buildSoldierChannel(builder),
      text: `Build test order received at ${Math.round(position.x)},${Math.round(position.y)}.`,
      tags: ["order", "build", "trench", "skill-test"],
      cooldownKey: `${builder.id}:build-test:${orderId}`,
      cooldownSeconds: 8
    });

    return {
      ok: true,
      reason: null,
      campId,
      campSupply: { ...camp.supply },
      assignedSoldierId: builder.id,
      assignedRole: builder.role,
      task,
      orderId,
      travelDistance: getDistance(builder.position, position),
      etaSeconds: getDistance(builder.position, position) / DEFAULT_MOVEMENT_SPEED,
      riskTier
    };
  }

  getBuildReport(orderId: string): TownWarBuildReportResult {
    this.ensureDemoSeeded();
    const order = this.findOrder(orderId);
    if (!order) {
      return { ok: false, reason: "order-missing", order: null, builder: null, supportingSuppressor: null, readable: `No build order found for ${orderId}.` };
    }
    const builder = order.assignedSoldierId ? this.findSoldierById(order.assignedSoldierId) : null;
    const supportingSuppressor = order.build.supportingSuppressorId ? this.findSoldierById(order.build.supportingSuppressorId) : null;
    const progressPercent =
      order.build.requiredProgress > 0 ? Math.round((order.build.progress / order.build.requiredProgress) * 100) : 0;
    const readable =
      `${order.id} ${order.kind} ${order.status}: ${progressPercent}% (${order.build.progress}/${order.build.requiredProgress}) ` +
      `rate ${order.build.buildRate}/s stall ${order.build.stallReason ?? "none"} support ${order.build.supportingSuppressorId ?? "none"} ` +
      `ammo ${order.build.supportAmmoState} stage ${this.getBuildFeedbackStage(order)} cause ${order.build.outcomeCause ?? order.build.causeChain.join(" > ")}`;
    return { ok: true, reason: null, order, builder, supportingSuppressor, readable };
  }

  advance(seconds: number, tickSeconds = 0.25): TownWarOfficerAdvanceResult {
    if (!Number.isFinite(seconds) || seconds <= 0) {
      return { ok: false, reason: "invalid-seconds", requestedSeconds: seconds, appliedTicks: 0, tickSeconds };
    }

    if (!Number.isFinite(tickSeconds) || tickSeconds <= 0) {
      return { ok: false, reason: "invalid-tick-seconds", requestedSeconds: seconds, appliedTicks: 0, tickSeconds };
    }

    this.ensureDemoSeeded();

    this.state.officer.lastCommandRead = `Advance (${seconds}s)`;
    this.state.officer.lastCommandAtSeconds = this.state.clock.seconds;

    const ticks = Math.max(1, Math.ceil(seconds / tickSeconds));
    for (let index = 0; index < ticks; index += 1) {
      this.tick(tickSeconds);
    }

    return { ok: true, reason: null, requestedSeconds: seconds, appliedTicks: ticks, tickSeconds };
  }

  damageCamp(campId: TownWarFactionId, amount: number): TownWarCampState | null {
    const beforeMatchStatus = this.state.match.status;
    const beforeCamp = this.getCamp(campId);
    const beforeHealth = beforeCamp?.health.current ?? null;
    const camp = damageTownWarCamp(this.state, campId, amount);
    if (!camp || beforeHealth === null) {
      return camp;
    }

    const damage = Math.max(0, beforeHealth - camp.health.current);
    if (damage > 0) {
      this.emitDramaEvent({
        kind: camp.destroyed ? "camp-destroyed" : "camp-damaged",
        faction: campId,
        campId,
        locationLabel: camp.label,
        summary: camp.destroyed
          ? `${camp.label} was destroyed after taking ${Math.round(damage)} damage.`
          : `${camp.label} took ${Math.round(damage)} damage and sits at ${Math.round(camp.health.current)}/${camp.health.max}.`,
        tags: ["camp", camp.destroyed ? "destroyed" : "damaged"]
      });
    }

    if (beforeMatchStatus === "active" && this.state.match.status === "ended") {
      const opponentId = this.getOpposingCampId(campId);
      this.emitDramaEvent({
        kind: "line-collapsed",
        faction: campId,
        campId,
        locationLabel: camp.label,
        summary: `${camp.label} collapsed and ${opponentId} won the town.`,
        tags: ["line", "collapsed", "match-ended"]
      });
    }

    return camp;
  }

  lootAmmoCrate(crateId: string, looterFaction: TownWarFactionId): TownWarAmmoCrateState | null {
    if (typeof crateId !== "string" || crateId.trim().length === 0) {
      return null;
    }

    this.ensureDemoSeeded();

    const crate = this.findAmmoCrate(crateId);
    if (!crate || crate.destroyedAtSeconds !== null) {
      return null;
    }

    const camp = this.getCamp(looterFaction);
    if (!camp) {
      return null;
    }

    camp.supply.ammo += crate.ammo;
    crate.ammo = 0;
    crate.health = 0;
    crate.destroyedAtSeconds = this.state.clock.seconds;
    crate.destroyedByFaction = looterFaction;

    return crate;
  }

  getSnapshot(): TownWarState {
    return {
      version: this.state.version,
      nextSoldierId: this.state.nextSoldierId,
      nextOrderId: this.state.nextOrderId,
      nextCrateId: this.state.nextCrateId,
      nextDugoutId: this.state.nextDugoutId,
      nextCasualtyId: this.state.nextCasualtyId,
      nextFlankId: this.state.nextFlankId,
      nextSkillOutcomeId: this.state.nextSkillOutcomeId,
      nextChatterId: this.state.nextChatterId,
      nextDramaEventId: this.state.nextDramaEventId,
      nextDramaMemoryId: this.state.nextDramaMemoryId,
      nextLocationScarId: this.state.nextLocationScarId,
      nextDramaBeatId: this.state.nextDramaBeatId,
      nextDebriefEchoId: this.state.nextDebriefEchoId,
      nextFrontlineStoryId: this.state.nextFrontlineStoryId,
      clock: {
        seconds: this.state.clock.seconds
      },
      officer: {
        faction: this.state.officer.faction,
        position: cloneVec2(this.state.officer.position),
        focusedLane: this.state.officer.focusedLane,
        lastCommandRead: this.state.officer.lastCommandRead,
        lastCommandAtSeconds: this.state.officer.lastCommandAtSeconds
      },
      orders: this.state.orders.map((order) => ({
        ...order,
        position: cloneVec2(order.position),
        build: cloneBuildExecution(order.build)
      })),
      ammoCrates: this.state.ammoCrates.map((crate) => ({
        ...crate,
        position: cloneVec2(crate.position)
      })),
      dugouts: this.state.dugouts.map((dugout) => cloneDugout(dugout)),
      casualties: this.state.casualties.map((casualty) => cloneCasualty(casualty)),
      flankPressures: this.state.flankPressures.map((flank) => cloneFlankPressure(flank)),
      skillDebrief: cloneSkillDebrief(this.state.skillDebrief),
      chatter: this.state.chatter.map((entry) => ({
        ...entry,
        tags: [...entry.tags]
      })),
      dialogue: {
        lastDramaEvent: this.state.dialogue.lastDramaEvent
          ? {
              ...this.state.dialogue.lastDramaEvent,
              tags: [...this.state.dialogue.lastDramaEvent.tags]
            }
          : null,
        recentDramaEvents: this.state.dialogue.recentDramaEvents.map((event) => ({
          ...event,
          tags: [...event.tags]
        })),
        activeOfficerWarTags: [...this.state.dialogue.activeOfficerWarTags],
        activeScarTags: [...this.state.dialogue.activeScarTags]
      },
      dramaMemories: this.state.dramaMemories.map((memory) => ({
        ...memory,
        witnessIds: [...memory.witnessIds]
      })),
      locationScars: this.state.locationScars.map((scar) => cloneLocationScar(scar)),
      focusedLocationScar: this.state.focusedLocationScar ? cloneLocationScar(this.state.focusedLocationScar) : null,
      dramaBeat: {
        current: this.state.dramaBeat.current ? cloneDramaBeatEntry(this.state.dramaBeat.current) : null,
        chain: this.state.dramaBeat.chain.map((entry) => cloneDramaBeatEntry(entry)),
        lastPayoff: this.state.dramaBeat.lastPayoff ? cloneDramaBeatEntry(this.state.dramaBeat.lastPayoff) : null
      },
      debriefEchoes: this.state.debriefEchoes.map((echo) => cloneDebriefEcho(echo)),
      frontlineStories: this.state.frontlineStories.map((story) => cloneFrontlineStory(story)),
      operation: cloneOperationState(this.state.operation),
      town: cloneTown(this.state.town),
      camps: this.state.camps.map((camp) => cloneCamp(camp)),
      match: { ...this.state.match },
      aiThreats: {
        playerThreatShare: this.state.aiThreats.playerThreatShare,
        playerThreatReason: this.state.aiThreats.playerThreatReason,
        playerThreatScore: this.state.aiThreats.playerThreatScore,
        frontlineFocus: {
          lane: this.state.aiThreats.frontlineFocus.lane,
          position: cloneVec2(this.state.aiThreats.frontlineFocus.position),
          label: this.state.aiThreats.frontlineFocus.label,
          pressure: { ...this.state.aiThreats.frontlineFocus.pressure }
        },
        contacts: this.state.aiThreats.contacts.map((contact) => ({
          ...contact,
          position: cloneVec2(contact.position)
        }))
      },
      aiTactics: {
        coverSlots: this.state.aiTactics.coverSlots.map((slot) => cloneCoverSlot(slot)),
        suppressionFields: this.state.aiTactics.suppressionFields.map((field) => ({
          ...field,
          pinnedSoldierIds: [...field.pinnedSoldierIds]
        })),
        tacticalPairs: this.state.aiTactics.tacticalPairs.map((pair) => ({ ...pair })),
        completedConstructionImpact: this.state.aiTactics.completedConstructionImpact.map((impact) => ({ ...impact }))
      },
      combatants: this.state.combatants.map((combatant) => ({
        ...combatant,
        ...(combatant.kind === "soldier"
          ? {
              traits: [...(combatant as TownWarSoldierState).traits],
              skills: { ...(combatant as TownWarSoldierState).skills },
              needs: { ...(combatant as TownWarSoldierState).needs },
              workPriorities: { ...(combatant as TownWarSoldierState).workPriorities },
              experience: { ...(combatant as TownWarSoldierState).experience },
              identitySummary: { ...(combatant as TownWarSoldierState).identitySummary },
              taskDecision: cloneTaskDecision((combatant as TownWarSoldierState).taskDecision),
              dramaMemoryTags: [...(combatant as TownWarSoldierState).dramaMemoryTags],
              witnessedEventCount: (combatant as TownWarSoldierState).witnessedEventCount,
              dramaArc: cloneSoldierDramaArc((combatant as TownWarSoldierState).dramaArc)
            }
          : {}),
        position: cloneVec2(combatant.position),
        health: { ...combatant.health },
        ammo: { ...combatant.ammo },
        morale: { ...combatant.morale },
        targetIntent: cloneTargetIntent(combatant.targetIntent),
        tacticalIntent: cloneTacticalIntent(combatant.tacticalIntent),
        coverIntent: cloneCoverIntent(combatant.coverIntent),
        task: {
          ...combatant.task,
          targetPosition: combatant.task.targetPosition ? cloneVec2(combatant.task.targetPosition) : combatant.task.targetPosition ?? null,
          resumeTask: combatant.task.resumeTask
            ? {
                ...combatant.task.resumeTask,
                targetPosition: combatant.task.resumeTask.targetPosition
                  ? cloneVec2(combatant.task.resumeTask.targetPosition)
                  : combatant.task.resumeTask.targetPosition ?? null,
                resumeTask: null
              }
            : combatant.task.resumeTask ?? null
        }
      })),
      soldiers: this.state.soldiers.map((soldier) => ({
        ...soldier,
        traits: [...soldier.traits],
        skills: { ...soldier.skills },
        needs: { ...soldier.needs },
        workPriorities: { ...soldier.workPriorities },
        experience: { ...soldier.experience },
        identitySummary: { ...soldier.identitySummary },
        taskDecision: cloneTaskDecision(soldier.taskDecision),
        dramaMemoryTags: [...soldier.dramaMemoryTags],
        dramaArc: cloneSoldierDramaArc(soldier.dramaArc),
        position: cloneVec2(soldier.position),
        health: { ...soldier.health },
        ammo: { ...soldier.ammo },
        morale: { ...soldier.morale },
        targetIntent: cloneTargetIntent(soldier.targetIntent),
        tacticalIntent: cloneTacticalIntent(soldier.tacticalIntent),
        coverIntent: cloneCoverIntent(soldier.coverIntent),
        task: {
          ...soldier.task,
          targetPosition: soldier.task.targetPosition ? cloneVec2(soldier.task.targetPosition) : soldier.task.targetPosition ?? null,
          resumeTask: soldier.task.resumeTask
            ? {
                ...soldier.task.resumeTask,
                targetPosition: soldier.task.resumeTask.targetPosition
                  ? cloneVec2(soldier.task.resumeTask.targetPosition)
                  : soldier.task.resumeTask.targetPosition ?? null,
                resumeTask: null
              }
            : soldier.task.resumeTask ?? null
        }
      }))
    };
  }
}

export const townWarController = new TownWarController();
