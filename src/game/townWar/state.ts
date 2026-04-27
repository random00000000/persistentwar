import { WORLD_HEIGHT, WORLD_WIDTH, type Vec2 } from "../arena";
import { TOWN_WAR_ENEMY_FACTION, TOWN_WAR_PLAYER_FACTION } from "./types";
import type {
  TownWarCurrentNeedId,
  TownWarEntityKind,
  TownWarFactionId,
  TownWarMatchStatus,
  TownWarOfficerRiskTier,
  TownWarRoleId,
  TownWarSkillId,
  TownWarSoldierArchetype,
  TownWarTask,
  TownWarTraitId,
  TownWarWorkPriorityId
} from "./types";

export type TownWarBuildOrderKind = "trench" | "ammo-crate" | "dugout";

export type TownWarBuildOrderStatus = "assigned" | "completed" | "cancelled";

export type TownWarDramaEventKind =
  | "build-order-issued"
  | "builder-moving"
  | "builder-exposed"
  | "construction-started"
  | "construction-stalled"
  | "trench-completed"
  | "ammo-crate-completed"
  | "dugout-completed"
  | "dugout-contested"
  | "dugout-damaged"
  | "ammo-crate-low"
  | "ammo-crate-empty"
  | "line-held"
  | "line-collapsed"
  | "camp-under-fire"
  | "camp-damaged"
  | "camp-destroyed"
  | "fallback-ordered"
  | "casualty-staged"
  | "medic-rescue-started"
  | "medic-rescue-stalled"
  | "wounded-stabilized"
  | "wounded-lost"
  | "camp-sustainment-warning"
  | "bad-order-cost";

export type TownWarDramaCause =
  | "order-saved-line"
  | "order-exposed-builder"
  | "late-fallback"
  | "ammo-shortage"
  | "trench-held"
  | "trench-failed"
  | "camp-hit"
  | "body-recovered"
  | "body-left"
  | "officer-intervened";

export type TownWarDramaResponsibility =
  | "officer-helped"
  | "officer-cost"
  | "enemy-pressure"
  | "supply-failure"
  | "terrain-failure"
  | "unclear";

export type TownWarLocationScarKind = "trench" | "road" | "ammo" | "dugout" | "camp" | "body" | "line";

export type TownWarDramaBeatKind =
  | "setup"
  | "rising-pressure"
  | "complication"
  | "cost"
  | "reversal"
  | "payoff"
  | "aftermath"
  | "echo";

export interface TownWarChatterEntry {
  id: string;
  atSeconds: number;
  faction: TownWarFactionId | null;
  channel: string;
  text: string;
  tags: string[];
}

export interface TownWarDramaEvent {
  id: string;
  atSeconds: number;
  kind: TownWarDramaEventKind;
  faction: TownWarFactionId;
  campId: TownWarFactionId | null;
  orderId: string | null;
  orderKind: TownWarBuildOrderKind | null;
  soldierId: string | null;
  ammoCrateId: string | null;
  locationLabel: string;
  riskTier: TownWarOfficerRiskTier | null;
  intensity: "low" | "medium" | "high" | "critical";
  summary: string;
  tags: string[];
  speaker: string | null;
  channel: string | null;
  text: string | null;
  referencedMemoryTag: string | null;
}

export interface TownWarDialogueState {
  lastDramaEvent: TownWarDramaEvent | null;
  recentDramaEvents: TownWarDramaEvent[];
  activeOfficerWarTags: string[];
  activeScarTags: string[];
}

export interface TownWarDramaMemory {
  id: string;
  eventId: string;
  eventKind: TownWarDramaEventKind;
  tag: string;
  subjectId: string | null;
  subjectName: string | null;
  locationId: string;
  locationName: string;
  orderId: string | null;
  cause: TownWarDramaCause;
  witnessIds: string[];
  responsibility: TownWarDramaResponsibility;
  emotionalWeight: number;
  ageOperations: number;
  createdAtSeconds: number;
  lastReferencedAt: number | null;
  summary: string;
}

export interface TownWarSoldierDramaArc {
  trustInOfficer: number;
  trustBySoldierId: Record<string, number>;
  resentment: number;
  guilt: number;
  confidence: number;
  combatNerve: number;
  protectiveOfSoldierIds: string[];
  rivalryWithSoldierIds: string[];
  signatureTraumaTags: string[];
  signaturePrideTags: string[];
  relationshipPressure: {
    protective: number;
    rivalry: number;
    summary: string;
  };
}

export interface TownWarLocationScar {
  id: string;
  label: string;
  kind: TownWarLocationScarKind;
  position: Vec2 | null;
  tags: string[];
  createdByEventId: string;
  subjectNames: string[];
  orderId: string | null;
  controlSide: TownWarFactionId | null;
  emotionalWeight: number;
  timesReferenced: number;
  createdAtSeconds: number;
  lastChangedAt: number;
}

export interface TownWarDramaBeatEntry {
  id: string;
  beat: TownWarDramaBeatKind;
  eventId: string;
  eventKind: TownWarDramaEventKind;
  orderId: string | null;
  locationLabel: string;
  atSeconds: number;
  intensity: TownWarDramaEvent["intensity"];
  summary: string;
  tags: string[];
}

export interface TownWarDramaBeatState {
  current: TownWarDramaBeatEntry | null;
  chain: TownWarDramaBeatEntry[];
  lastPayoff: TownWarDramaBeatEntry | null;
}

export interface TownWarDebriefEcho {
  id: string;
  atSeconds: number;
  beat: TownWarDramaBeatKind;
  eventId: string;
  eventKind: TownWarDramaEventKind;
  category: "after-action" | "memorial" | "officer-responsibility";
  text: string;
  sourceSummary: string;
  tags: string[];
}

export interface TownWarBuildOrderState {
  id: string;
  kind: TownWarBuildOrderKind;
  faction: TownWarFactionId;
  position: Vec2;
  facingAngleRadians: number;
  status: TownWarBuildOrderStatus;
  assignedSoldierId: string | null;
  build: TownWarBuildExecutionState;
  ammoPayload: number | null;
  builtEntityId: string | null;
  createdAtSeconds: number;
  completedAtSeconds: number | null;
}

export interface TownWarBuildExecutionState {
  progress: number;
  requiredProgress: number;
  buildRate: number;
  stalled: boolean;
  stallReason: string | null;
  supportingSuppressorId: string | null;
  supportAmmoState: "none" | "dry" | "low" | "steady";
  coverFireSupport: number;
  exposure: number;
  outcomeCause: string | null;
  causeChain: string[];
  lastUpdatedAtSeconds: number;
}

export interface TownWarAmmoCrateState {
  id: string;
  kind: "ammo-crate";
  faction: TownWarFactionId;
  position: Vec2;
  ammo: number;
  maxAmmo: number;
  health: number;
  maxHealth: number;
  riskTier: TownWarOfficerRiskTier;
  builtFromOrderId: string | null;
  createdAtSeconds: number;
  destroyedAtSeconds: number | null;
  destroyedByFaction: TownWarFactionId | null;
}

export type TownWarDugoutStatus = "active" | "contested" | "damaged" | "destroyed";

export interface TownWarDugoutState {
  id: string;
  kind: "dugout";
  faction: TownWarFactionId;
  position: Vec2;
  facingAngleRadians: number;
  health: number;
  maxHealth: number;
  status: TownWarDugoutStatus;
  rallyRadius: number;
  shelterRadius: number;
  connectedTrenchSlotIds: string[];
  shelteringSoldierIds: string[];
  contestedBySoldierIds: string[];
  builtFromOrderId: string | null;
  createdAtSeconds: number;
  lastUpdatedAtSeconds: number;
  destroyedAtSeconds: number | null;
  readable: string;
}

export type TownWarCasualtySeverity = "light" | "serious" | "critical";

export type TownWarCasualtyStatus = "wounded" | "downed" | "stabilized" | "recovering" | "lost";

export interface TownWarCasualtyState {
  id: string;
  soldierId: string;
  faction: TownWarFactionId;
  position: Vec2;
  severity: TownWarCasualtySeverity;
  status: TownWarCasualtyStatus;
  assignedMedicId: string | null;
  rescueScore: number;
  rescueReason: string;
  pathRisk: number;
  coveredPath: number;
  treatmentProgress: number;
  requiredTreatment: number;
  outcomeCause: string | null;
  causeChain: string[];
  createdAtSeconds: number;
  lastUpdatedAtSeconds: number;
  completedAtSeconds: number | null;
}

export interface TownWarClockState {
  seconds: number;
}

export interface TownWarOfficerState {
  faction: TownWarFactionId;
  position: Vec2;
  focusedLane: "north" | "mid" | "south";
  lastCommandRead: string | null;
  lastCommandAtSeconds: number;
}

export interface TownWarCombatantAmmoState {
  inMag: number;
  reserve: number;
  maxMag: number;
}

export interface TownWarCombatantHealthState {
  current: number;
  max: number;
}

export interface TownWarCombatantMoraleState {
  pressure: number;
  maxPressure: number;
}

export type TownWarTargetKind =
  | "none"
  | "soldier"
  | "suppression-source"
  | "builder"
  | "camp"
  | "build-site"
  | "ammo"
  | "player"
  | "fallback";

export interface TownWarTargetIntentState {
  targetKind: TownWarTargetKind;
  targetId: string | null;
  targetScore: number;
  reason: string;
  lastUpdatedAtSeconds: number;
}

export type TownWarTacticalState =
  | "idle"
  | "seek-cover"
  | "hold-cover"
  | "suppress-area"
  | "bound-forward"
  | "reload-behind-cover"
  | "fallback"
  | "cover-builder"
  | "recover-wounded";

export interface TownWarTacticalIntentState {
  state: TownWarTacticalState;
  reason: string;
  coverSlotId: string | null;
  partnerId: string | null;
  pressureRatio: number;
  lastUpdatedAtSeconds: number;
}

export interface TownWarCoverSlotState {
  id: string;
  faction: TownWarFactionId | null;
  lane: "north" | "mid" | "south";
  label: string;
  sourceKind: "camp" | "ruin" | "crater" | "trench" | "ammo-position" | "dugout";
  sourceId: string | null;
  position: Vec2;
  facing: TownWarFactionId;
  facingAngleRadians: number;
  exposure: number;
  protection: number;
  occupiedBySoldierId: string | null;
  createdAtSeconds: number;
}

export interface TownWarCoverIntentState {
  coverSlotId: string | null;
  state: "none" | "moving" | "occupying" | "reserved";
  reason: string;
}

export interface TownWarCombatantBaseState {
  id: string;
  kind: TownWarEntityKind;
  faction: TownWarFactionId;
  position: Vec2;
  health: TownWarCombatantHealthState;
  ammo: TownWarCombatantAmmoState;
  morale: TownWarCombatantMoraleState;
  task: TownWarTask;
  targetIntent: TownWarTargetIntentState;
  tacticalIntent: TownWarTacticalIntentState;
  coverIntent: TownWarCoverIntentState;
}

export type TownWarSkillState = Record<TownWarSkillId, number>;

export type TownWarWorkPriorityState = Record<TownWarWorkPriorityId, number>;

export interface TownWarNeedState {
  fatigue: number;
  hunger: number;
  morale: number;
}

export interface TownWarExperienceState {
  operations: number;
  buildsCompleted: number;
  rescuesCompleted: number;
  kills: number;
  woundsTreated: number;
  trenchesHeld: number;
}

export interface TownWarSoldierIdentitySummary {
  bestSkills: string;
  usefulSkill: string;
  risk: string;
  trust: string;
  currentNeed: TownWarCurrentNeedId;
}

export interface TownWarTaskCandidateState {
  work: TownWarWorkPriorityId;
  taskKind: TownWarTask["kind"];
  score: number;
  reason: string;
  blockedReason: string | null;
  scoreParts: {
    priority: number;
    skillFit: number;
    urgency: number;
    safety: number;
    morale: number;
    supplyNeed: number;
    distance: number;
  };
}

export interface TownWarTaskDecisionState {
  selectedWork: TownWarWorkPriorityId | null;
  selectedReason: string | null;
  selectedScore: number;
  blockedReason: string | null;
  candidates: TownWarTaskCandidateState[];
  lastUpdatedAtSeconds: number;
}

export interface TownWarSoldierState extends TownWarCombatantBaseState {
  kind: "soldier";
  role: TownWarRoleId;
  displayName: string;
  archetype: TownWarSoldierArchetype;
  skills: TownWarSkillState;
  traits: TownWarTraitId[];
  needs: TownWarNeedState;
  workPriorities: TownWarWorkPriorityState;
  currentNeed: TownWarCurrentNeedId;
  experience: TownWarExperienceState;
  identitySummary: TownWarSoldierIdentitySummary;
  taskDecision: TownWarTaskDecisionState;
  spawnedFromCampId: TownWarFactionId;
  spawnedAtSeconds: number;
  spawnReason: "initial" | "reinforcement" | "script";
  dramaMemoryTags: string[];
  witnessedEventCount: number;
  dramaArc: TownWarSoldierDramaArc;
}

export type TownWarCombatantState = TownWarSoldierState;

export interface TownWarTownState {
  id: string;
  label: string;
  control: Record<TownWarFactionId, number>;
}

export interface TownWarCampHealthState {
  current: number;
  max: number;
}

export interface TownWarCampSupplyState {
  ammo: number;
  build: number;
  food: number;
  med: number;
}

export interface TownWarCampControlState {
  morale: number;
  readiness: number;
}

export type TownWarCampWorkPriorityId = "Cook" | "Resupply" | "Rest";

export type TownWarFlankLaneId = "north" | "mid" | "south";

export type TownWarFlankPressureLevel = "low" | "medium" | "high";

export type TownWarFlankPressureStatus = "active" | "spotted" | "held" | "failed";

export type TownWarSkillOutcomeId =
  | "held-by-suppression"
  | "failed-low-nerve"
  | "failed-ammo-dry"
  | "failed-no-rescue"
  | "failed-flank-unseen"
  | "held-scout-warning"
  | "held-good-sustainment";

export interface TownWarFlankPressureState {
  id: string;
  faction: TownWarFactionId;
  lane: TownWarFlankLaneId;
  pressure: TownWarFlankPressureLevel;
  position: Vec2;
  status: TownWarFlankPressureStatus;
  scoutId: string | null;
  scoutScore: number;
  spottedAtSeconds: number | null;
  resolvedAtSeconds: number | null;
  outcome: TownWarSkillOutcomeId | null;
  causeChain: string[];
  readable: string;
  createdAtSeconds: number;
  lastUpdatedAtSeconds: number;
}

export interface TownWarSkillOutcomeState {
  id: string;
  atSeconds: number;
  outcome: TownWarSkillOutcomeId;
  lane: TownWarFlankLaneId;
  pressure: TownWarFlankPressureLevel;
  summary: string;
  causeChain: string[];
  scoutId: string | null;
  readiness: number;
  ammoFlow: number;
  memoryTags: string[];
}

export interface TownWarSkillDebriefState {
  lastOutcome: TownWarSkillOutcomeState | null;
  outcomes: TownWarSkillOutcomeState[];
  recommendedNextPlan: string;
  causeChain: string[];
  summary: string;
  lastUpdatedAtSeconds: number;
}

export interface TownWarCampSustainmentState {
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
  manpowerAvailable: number;
  bottleneckReason: string | null;
  warnings: string[];
  workPriorities: Record<TownWarCampWorkPriorityId, number>;
  lastUpdatedAtSeconds: number;
}

export interface TownWarCampState {
  id: TownWarFactionId;
  label: string;
  spawn: {
    position: Vec2;
    radius: number;
    lastReinforcementAtSeconds: number;
    totalSpawned: number;
  };
  health: TownWarCampHealthState;
  supply: TownWarCampSupplyState;
  control: TownWarCampControlState;
  sustainment: TownWarCampSustainmentState;
  destroyed: boolean;
}

export interface TownWarMatchState {
  status: TownWarMatchStatus;
  winner: TownWarFactionId | null;
  reason: string | null;
}

export interface TownWarThreatContactState {
  id: string;
  faction: TownWarFactionId;
  sourceId: string;
  sourceKind: TownWarTargetKind;
  position: Vec2;
  score: number;
  reason: string;
  seenAtSeconds: number;
}

export interface TownWarFrontlineFocusState {
  lane: "north" | "mid" | "south";
  position: Vec2;
  label: string;
  pressure: Record<TownWarFactionId, number>;
}

export interface TownWarAiThreatState {
  playerThreatShare: number;
  playerThreatReason: string;
  playerThreatScore: number;
  frontlineFocus: TownWarFrontlineFocusState;
  contacts: TownWarThreatContactState[];
}

export interface TownWarSuppressionFieldState {
  faction: TownWarFactionId;
  lane: "north" | "mid" | "south";
  pressure: number;
  pinnedSoldierIds: string[];
}

export interface TownWarTacticalPairState {
  id: string;
  faction: TownWarFactionId;
  suppressorId: string;
  moverId: string;
  state: "covering-advance" | "covering-builder" | "line-hold";
  reason: string;
}

export interface TownWarCompletedConstructionImpactState {
  orderId: string;
  coverSlotId: string;
  kind: TownWarBuildOrderKind;
  faction: TownWarFactionId;
  label: string;
  protection: number;
  createdAtSeconds: number;
}

export type TownWarFrontlineStoryKind = "build" | "cover" | "resupply" | "medic" | "occupy" | "consequence";

export interface TownWarFrontlineStoryState {
  id: string;
  kind: TownWarFrontlineStoryKind;
  faction: TownWarFactionId;
  soldierId: string;
  soldierName: string;
  role: TownWarRoleId;
  work: TownWarWorkPriorityId | null;
  orderId: string | null;
  relatedId: string | null;
  position: Vec2 | null;
  summary: string;
  consequence: string;
  memoryTag: string;
  atSeconds: number;
}

export type TownWarOperationPhase = "preparing" | "active" | "debriefed";

export type TownWarPersistentSoldierStatus = "ready" | "wounded" | "recovering" | "lost";

export interface TownWarPersistentSoldierRecordState {
  soldierId: string;
  displayName: string;
  faction: TownWarFactionId;
  role: TownWarRoleId;
  status: TownWarPersistentSoldierStatus;
  healthCurrent: number;
  healthMax: number;
  fatigue: number;
  hunger: number;
  morale: number;
  currentNeed: TownWarCurrentNeedId;
  operations: number;
  memoryTags: string[];
  trustInOfficer: number;
  resentment: number;
  confidence: number;
  lastSeenAtSeconds: number;
}

export interface TownWarOperationDebriefState {
  operationId: number;
  startedAtSeconds: number;
  endedAtSeconds: number;
  campId: TownWarFactionId;
  summary: string;
  recommendations: string[];
  supplyRemaining: TownWarCampSupplyState;
  carriedSoldiers: TownWarPersistentSoldierRecordState[];
  warnings: string[];
}

export interface TownWarOperationStockpileState {
  protected: TownWarCampSupplyState;
  committed: TownWarCampSupplyState;
  lastCommitted: TownWarCampSupplyState;
}

export interface TownWarOperationState {
  activeId: number;
  nextOperationId: number;
  phase: TownWarOperationPhase;
  startedAtSeconds: number;
  stockpile: TownWarOperationStockpileState;
  carriedSoldiers: TownWarPersistentSoldierRecordState[];
  lastDebrief: TownWarOperationDebriefState | null;
  recommendations: string[];
  cycleCount: number;
}

export interface TownWarAiTacticsState {
  coverSlots: TownWarCoverSlotState[];
  suppressionFields: TownWarSuppressionFieldState[];
  tacticalPairs: TownWarTacticalPairState[];
  completedConstructionImpact: TownWarCompletedConstructionImpactState[];
}

export interface TownWarState {
  version: 1;
  nextSoldierId: number;
  nextOrderId: number;
  nextCrateId: number;
  nextDugoutId: number;
  nextCasualtyId: number;
  nextFlankId: number;
  nextSkillOutcomeId: number;
  nextChatterId: number;
  nextDramaEventId: number;
  nextDramaMemoryId: number;
  nextLocationScarId: number;
  nextDramaBeatId: number;
  nextDebriefEchoId: number;
  nextFrontlineStoryId: number;
  clock: TownWarClockState;
  officer: TownWarOfficerState;
  orders: TownWarBuildOrderState[];
  ammoCrates: TownWarAmmoCrateState[];
  dugouts: TownWarDugoutState[];
  casualties: TownWarCasualtyState[];
  flankPressures: TownWarFlankPressureState[];
  skillDebrief: TownWarSkillDebriefState;
  chatter: TownWarChatterEntry[];
  dialogue: TownWarDialogueState;
  dramaMemories: TownWarDramaMemory[];
  locationScars: TownWarLocationScar[];
  focusedLocationScar: TownWarLocationScar | null;
  dramaBeat: TownWarDramaBeatState;
  debriefEchoes: TownWarDebriefEcho[];
  frontlineStories: TownWarFrontlineStoryState[];
  operation: TownWarOperationState;
  town: TownWarTownState;
  camps: TownWarCampState[];
  match: TownWarMatchState;
  aiThreats: TownWarAiThreatState;
  aiTactics: TownWarAiTacticsState;
  combatants: TownWarCombatantState[];
  soldiers: TownWarSoldierState[];
}

function buildDefaultTownControl(): Record<TownWarFactionId, number> {
  const control: Record<TownWarFactionId, number> = {
    "camp-a": 0.5,
    "camp-b": 0.5
  };
  return control;
}

function createTownWarCampState(id: TownWarFactionId, label: string, spawnPosition: Vec2): TownWarCampState {
  const maxHealth = 1000;
  return {
    id,
    label,
    spawn: {
      position: { x: spawnPosition.x, y: spawnPosition.y },
      radius: 70,
      lastReinforcementAtSeconds: 0,
      totalSpawned: 0
    },
    health: {
      current: maxHealth,
      max: maxHealth
    },
    supply: {
      ammo: 250,
      build: 250,
      food: 180,
      med: 80
    },
    control: {
      morale: 1,
      readiness: 1
    },
    sustainment: {
      readiness: 1,
      fatigueAverage: 0,
      hungerAverage: 0,
      moraleAverage: 1,
      ammoFlow: 1,
      cookEffect: 0.5,
      restCycle: 0.35,
      logisticsScore: 0,
      cookingScore: 0,
      enduranceScore: 0,
      manpowerAvailable: 0,
      bottleneckReason: null,
      warnings: [],
      workPriorities: {
        Cook: 2,
        Resupply: 2,
        Rest: 2
      },
      lastUpdatedAtSeconds: 0
    },
    destroyed: false
  };
}

function createTownWarSupplyState(ammo: number, build: number, food: number, med: number): TownWarCampSupplyState {
  return { ammo, build, food, med };
}

function createTownWarOperationState(): TownWarOperationState {
  return {
    activeId: 1,
    nextOperationId: 2,
    phase: "active",
    startedAtSeconds: 0,
    stockpile: {
      protected: createTownWarSupplyState(420, 420, 320, 180),
      committed: createTownWarSupplyState(250, 250, 180, 80),
      lastCommitted: createTownWarSupplyState(250, 250, 180, 80)
    },
    carriedSoldiers: [],
    lastDebrief: null,
    recommendations: [
      "Prepare build supply before a trench push.",
      "Keep med and food stock visible before ordering exposed work."
    ],
    cycleCount: 1
  };
}

export function resolveTownWarMatch(state: TownWarState): TownWarMatchState {
  const campA = state.camps.find((camp) => camp.id === TOWN_WAR_PLAYER_FACTION) ?? null;
  const campB = state.camps.find((camp) => camp.id === TOWN_WAR_ENEMY_FACTION) ?? null;

  const campADestroyed = campA ? campA.health.current <= 0 : false;
  const campBDestroyed = campB ? campB.health.current <= 0 : false;

  for (const camp of state.camps) {
    camp.destroyed = camp.health.current <= 0;
  }

  if (!campADestroyed && !campBDestroyed) {
    state.match = { status: "active", winner: null, reason: null };
    return state.match;
  }

  if (campADestroyed && campBDestroyed) {
    state.match = { status: "ended", winner: null, reason: "mutual-camp-destruction" };
    return state.match;
  }

  state.match = {
    status: "ended",
    winner: campADestroyed ? TOWN_WAR_ENEMY_FACTION : TOWN_WAR_PLAYER_FACTION,
    reason: "camp-destroyed"
  };
  return state.match;
}

export function damageTownWarCamp(state: TownWarState, campId: TownWarFactionId, amount: number): TownWarCampState | null {
  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  const camp = state.camps.find((entry) => entry.id === campId) ?? null;
  if (!camp) {
    return null;
  }

  camp.health.current = Math.max(0, camp.health.current - amount);
  resolveTownWarMatch(state);
  return camp;
}

export function createTownWarState(): TownWarState {
  const midY = WORLD_HEIGHT * 0.5;
  const playerCampSpawn: Vec2 = { x: WORLD_WIDTH * 0.68, y: midY };
  const enemyCampSpawn: Vec2 = { x: WORLD_WIDTH * 0.32, y: midY };
  const frontlinePosition: Vec2 = { x: (playerCampSpawn.x + enemyCampSpawn.x) / 2, y: midY };
  return {
    version: 1,
    nextSoldierId: 1,
    nextOrderId: 1,
    nextCrateId: 1,
    nextDugoutId: 1,
    nextCasualtyId: 1,
    nextFlankId: 1,
    nextSkillOutcomeId: 1,
    nextChatterId: 1,
    nextDramaEventId: 1,
    nextDramaMemoryId: 1,
    nextLocationScarId: 1,
    nextDramaBeatId: 1,
    nextDebriefEchoId: 1,
    nextFrontlineStoryId: 1,
    clock: {
      seconds: 0
    },
    officer: {
      faction: TOWN_WAR_PLAYER_FACTION,
      position: { x: playerCampSpawn.x, y: playerCampSpawn.y },
      focusedLane: "mid",
      lastCommandRead: null,
      lastCommandAtSeconds: 0
    },
    orders: [],
    ammoCrates: [],
    dugouts: [],
    casualties: [],
    flankPressures: [],
    skillDebrief: {
      lastOutcome: null,
      outcomes: [],
      recommendedNextPlan: "No flank pressure resolved yet. Place scouts and sustain ammo before trusting a line.",
      causeChain: [],
      summary: "No skill-emergence debrief yet.",
      lastUpdatedAtSeconds: 0
    },
    chatter: [],
    dialogue: {
      lastDramaEvent: null,
      recentDramaEvents: [],
      activeOfficerWarTags: [],
      activeScarTags: []
    },
    dramaMemories: [],
    locationScars: [],
    focusedLocationScar: null,
    dramaBeat: {
      current: null,
      chain: [],
      lastPayoff: null
    },
    debriefEchoes: [],
    frontlineStories: [],
    operation: createTownWarOperationState(),
    town: {
      id: "town-001",
      label: "First Town",
      control: buildDefaultTownControl()
    },
    camps: [
      createTownWarCampState(TOWN_WAR_PLAYER_FACTION, "Russian Camp", playerCampSpawn),
      createTownWarCampState(TOWN_WAR_ENEMY_FACTION, "Ukrainian Enemy Camp", enemyCampSpawn)
    ],
    match: { status: "active", winner: null, reason: null },
    aiThreats: {
      playerThreatShare: 0,
      playerThreatReason: "officer quiet behind friendly line",
      playerThreatScore: 0,
      frontlineFocus: {
        lane: "mid",
        position: frontlinePosition,
        label: "mid road crossing",
        pressure: {
          "camp-a": 0,
          "camp-b": 0
        }
      },
      contacts: []
    },
    aiTactics: {
      coverSlots: [],
      suppressionFields: [],
      tacticalPairs: [],
      completedConstructionImpact: []
    },
    combatants: [],
    soldiers: []
  };
}

export function createTownWarSoldierDramaArc(): TownWarSoldierDramaArc {
  return {
    trustInOfficer: 0.55,
    trustBySoldierId: {},
    resentment: 0,
    guilt: 0,
    confidence: 0.5,
    combatNerve: 0.55,
    protectiveOfSoldierIds: [],
    rivalryWithSoldierIds: [],
    signatureTraumaTags: [],
    signaturePrideTags: [],
    relationshipPressure: {
      protective: 0,
      rivalry: 0,
      summary: "unformed"
    }
  };
}
