import * as Phaser from "phaser";
import {
  ARENA_OBSTACLES,
  type ArenaObstacle,
  type ArenaDoorway,
  type RaidRouteDefinition,
  type RaidRouteId,
  type ScenicPropDefinition,
  type Vec2
} from "../arena";
import {
  getEnemyTapeDefinition,
  getEnemyTapeSummary,
  getExtractSquadRiskRead,
  getFrontlineCoffeePocketRead,
  getFrontlineOperationRead,
  getFrontlineIncidentActionRead,
  getExtractCommandRecommendation,
  getBlindFireRead,
  getNoisePressureRead,
  getPressurePostureRead,
  getRaidOperationRead,
  getReinforcementPressureRead,
  getSettlementStateRead,
  getActiveTacticalSubzoneRead,
  getEscortCommandPose,
  getPlannedExtractStageCues,
  getPlannedExtractPosture,
  getSquadLaneReadout,
  getSquadBattleRead,
  getSquadCommandAgeSeconds,
  getSquadTacticalActionAgeSeconds,
  getSquadStrainRead,
  getFrontlineSupportOrderPresentation,
  getFrontlineSupportOrderWorldCue,
  getFrontlineSupportOrderPayoff,
  type FrontlineSupportOrderId,
  type FrontlineIncidentState,
  type FrontlineImpactState,
  type FrontlineSectorState,
  type FrontlineSupportState,
  type FrontlineTracerState,
  type GrenadeState,
  getFrontlineRoomIdentityProfile,
  type RaidPocketPlanState,
  raidController,
  type BulletState,
  type ContrabandCategoryId,
  type EnemyArchetypeId,
  type EnemyState,
  type EnemyTapeId,
  type PendingReinforcementState,
  type SquadMateState
} from "../simulation";
import { WEAPONS, type WeaponId } from "../weapons";
import {
  ensureRaidTextures,
  getEnemyCombatantTextureKey,
  getFriendlyCombatantTextureKey,
  getGroundTextureKey,
  getPlayerTextureKey,
  getPropTextureKey,
  type GroundTextureKind
} from "./raidTextures";
import {
  FRONTLINE_CAMP_ASSETS,
  getFrontlineCampAssetKey,
  getFrontlineCampSheetKey,
  type CampAssetRole,
  type CampAssetSheet
} from "./frontlineCampAssets";
import {
  RAID_ACTION_KEY_CODES,
  RAID_MOVEMENT_KEY_CODES,
  RAID_SQUAD_COMMAND_KEY_CODES,
  RAID_SQUAD_SELECTION_KEY_CODES,
  RAID_SUPPORT_ORDER_KEY_CODES
} from "../controls";
import { buildCombatAudioRead, CombatAudioEngine } from "../combatAudio";
import {
  TOWN_WAR_ENEMY_FACTION,
  TOWN_WAR_PLAYER_FACTION,
  townWarController,
  type TownWarCampState,
  type TownWarFactionId,
  type TownWarRoleId,
  type TownWarSoldierState
} from "../townWar";

type SpriteMap = Map<number, Phaser.GameObjects.Sprite>;
type TownWarSpriteMap = Map<string, Phaser.GameObjects.Sprite>;
type AlphaCapableGameObject = Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.AlphaSingle;

interface ObstacleRevealTarget {
  gameObject: AlphaCapableGameObject;
  baseAlpha: number;
}

interface ObstacleRevealVisual {
  obstacle: ArenaObstacle;
  targets: ObstacleRevealTarget[];
  currentAlpha: number;
}

const OVERLAY_CULL_MARGIN = 160;
const ENEMY_INTENT_RENDER_LIMIT = 10;
const ENEMY_STATUS_RENDER_LIMIT = 12;
const DEFAULT_RAID_CAMERA_ZOOM = 1;
const BRACE_SCAN_CAMERA_ZOOM = 0.84;
const BRACE_SCAN_CAMERA_OFFSET_MAX = 220;
const BRACE_SCAN_CAMERA_OFFSET_MIN = 84;
const BRACE_SCAN_CAMERA_OFFSET_RATIO = 0.32;
const CAMERA_CENTER_LERP = 0.2;
const CAMERA_ZOOM_LERP = 0.16;

interface ObjectiveMarker {
  label: string;
  position: { x: number; y: number };
  color: number;
  accent: number;
  radius: number;
  priority: number;
  pulse: number;
  warning?: boolean;
}

interface PropShadowConfig {
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
}

interface GroundDecalDefinition {
  kind: GroundTextureKind;
  position: { x: number; y: number };
  rotation?: number;
  scale?: number;
  scaleX?: number;
  scaleY?: number;
  alpha?: number;
  tint?: number;
  depthOffset?: number;
}

interface AmbientPulseDefinition {
  scale: number;
  duration: number;
  phase?: number;
}

interface AmbientDriftDefinition {
  x?: number;
  y?: number;
  duration: number;
  phase?: number;
}

interface AmbientEllipseDefinition {
  kind: "ellipse";
  position: { x: number; y: number };
  width: number;
  height: number;
  color: number;
  alpha: number;
  rotation?: number;
  depthBias?: number;
  blendMode?: Phaser.BlendModes;
  strokeColor?: number;
  strokeAlpha?: number;
  strokeWidth?: number;
  pulse?: AmbientPulseDefinition;
  drift?: AmbientDriftDefinition;
}

interface AmbientBeamDefinition {
  kind: "beam";
  position: { x: number; y: number };
  width: number;
  height: number;
  color: number;
  alpha: number;
  rotation: number;
  depthBias?: number;
  blendMode?: Phaser.BlendModes;
  pulse?: AmbientPulseDefinition;
  drift?: AmbientDriftDefinition;
}

type AmbientOverlayDefinition = AmbientEllipseDefinition | AmbientBeamDefinition;

type PropPlacement = ScenicPropDefinition & {
  tint?: number;
  alpha?: number;
  shadowAlpha?: number;
  depthBias?: number;
};

interface FrontlineModifierAnchor {
  position: { x: number; y: number };
  angle: number;
}

interface ObjectiveLabelSlot {
  label: Phaser.GameObjects.Text;
  active: boolean;
}

interface WorldSpeechBubbleVisual {
  container: Phaser.GameObjects.Container;
  bg: Phaser.GameObjects.Graphics;
  text: Phaser.GameObjects.Text;
  anchorKind: "squad" | "hostile";
  anchorId: string | number;
  lineKey: string;
  lifetime: number;
  maxLifetime: number;
  driftY: number;
}

function getPocketPlanMarkerStyle(role: RaidPocketPlanState["role"]): {
  labelPrefix: string;
  color: number;
  accent: number;
  radius: number;
  priority: number;
  warning?: boolean;
} {
  if (role === "primary-hot") {
    return {
      labelPrefix: "Hot",
      color: 0xfb7185,
      accent: 0xffedd5,
      radius: 18,
      priority: 5,
      warning: true
    };
  }

  if (role === "secondary-hot") {
    return {
      labelPrefix: "Split",
      color: 0xf97316,
      accent: 0xffedd5,
      radius: 16,
      priority: 6
    };
  }

  if (role === "thin") {
    return {
      labelPrefix: "Thin",
      color: 0x4ade80,
      accent: 0xdcfce7,
      radius: 14,
      priority: 7
    };
  }

  if (role === "reserve") {
    return {
      labelPrefix: "Reserve",
      color: 0xc4b5fd,
      accent: 0xf5f3ff,
      radius: 14,
      priority: 8
    };
  }

  return {
    labelPrefix: "Sweep",
    color: 0x7dd3fc,
    accent: 0xe0f2fe,
    radius: 14,
    priority: 8
  };
}

function getCarriedManifestCount(manifest: {
  intel: number;
  medical: number;
  munitions: number;
  hardware: number;
}): number {
  return manifest.intel + manifest.medical + manifest.munitions + manifest.hardware;
}

function formatSceneSupplySummary(stock: { medkits: number; ammoPacks: number }): string {
  const parts: string[] = [];

  if (stock.medkits > 0) {
    parts.push(`${stock.medkits} med`);
  }

  if (stock.ammoPacks > 0) {
    parts.push(`${stock.ammoPacks} ammo`);
  }

  return parts.length > 0 ? parts.join(" + ") : "no stash stock";
}

function formatWeaponMixSummary(
  weaponIds: ReadonlyArray<keyof typeof WEAPONS>,
  fallback: string,
  limit = 2
): string {
  if (weaponIds.length === 0) {
    return fallback;
  }

  const counts = new Map<keyof typeof WEAPONS, number>();
  for (const weaponId of weaponIds) {
    counts.set(weaponId, (counts.get(weaponId) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([weaponId, count]) => `${count}x ${WEAPONS[weaponId].name}`)
    .join("  |  ");
}

function buildSceneNoiseDisciplinePanel(): {
  title: string;
  accent: string;
  borderColor: number;
  bodyColor: string;
  lines: string[];
} {
  const route = raidController.getActiveRoute();
  const read = getNoisePressureRead(route, raidController.state);
  const blindFireRead = getBlindFireRead(raidController.state);
  const accent = read.tone === "critical" ? "#fecaca" : read.tone === "warning" ? "#fde68a" : "#d1fae5";
  const borderColor = read.tone === "critical" ? 0xfb7185 : read.tone === "warning" ? 0xf59e0b : 0x4ade80;
  const bodyColor = read.tone === "critical" ? "#fee2e2" : read.tone === "warning" ? "#fef3c7" : "#dcfce7";
  const blindFireLine = blindFireRead.tone === "steady" ? "Blind fire quiet" : `${blindFireRead.title} | ${blindFireRead.compact}`;

  return {
    title: read.title,
    accent,
    borderColor,
    bodyColor,
    lines: [
      read.status,
      blindFireLine,
      `${read.pressureLabel}  |  ${read.nextResponseLabel}${read.reinforcementLabel !== "No flares stacked yet" ? `  |  ${read.reinforcementLabel}` : ""}`
    ]
  };
}

function buildSceneExtractPressurePanel(): {
  title: string;
  accent: string;
  borderColor: number;
  bodyColor: string;
  lines: string[];
} {
  const state = raidController.state;
  const route = raidController.getActiveRoute();
  const operationRead = getRaidOperationRead(state);
  const activeDemand = raidController.getActiveDemand();
  const manifestCount = getCarriedManifestCount(state.carriedManifest);
  const demandCredits = manifestCount * activeDemand.bonusPerItem;
  const contractCredits = state.activeContract.completed ? state.activeContract.rewardCredits : 0;
  const bankCredits = state.carriedValue + demandCredits + contractCredits;
  const activeExtract =
    state.activeExtractId !== null
      ? state.extractZones.find((extract) => extract.id === state.activeExtractId) ?? null
      : null;
  const focusedExtract = activeExtract ?? state.extractZones[0] ?? null;
  const focusedExtractLabel = focusedExtract?.label ?? route.extractLabel;
  const squadLeanActive =
    state.extractionReady &&
    state.activeExtractId !== null &&
    (state.activeFrontlineSupportOrderId === null || state.frontlineSupportOrderTimer <= 0);
  const playerInExtractZone =
    focusedExtract !== null &&
    Phaser.Math.Distance.Between(
      state.player.position.x,
      state.player.position.y,
      focusedExtract.position.x,
      focusedExtract.position.y
    ) <
      focusedExtract.radius - 12;
  const extractionHoldSlipping = state.extractionHoldTimer > 0 && !state.extractionContested && !playerInExtractZone;
  const nextWave =
    state.pendingReinforcements.length > 0
      ? state.pendingReinforcements.reduce((best, pending) => (pending.timer < best.timer ? pending : best))
      : null;
  const unsecuredIntel = state.intelSites.filter((site) => !site.secured).length;
  const untouchedCaches = state.supplyCaches.filter((cache) => !cache.searched).length;
  const looseLoot = state.loot.length;
  const nearestEnemyDistance =
    state.enemies.length > 0
      ? state.enemies.reduce((best, enemy) => {
          const distance = Phaser.Math.Distance.Between(
            state.player.position.x,
            state.player.position.y,
            enemy.position.x,
            enemy.position.y
          );
          return Math.min(best, distance);
        }, Number.POSITIVE_INFINITY)
      : null;
  const nearestEnemyLabel =
    nearestEnemyDistance === null || !Number.isFinite(nearestEnemyDistance)
      ? "no close hostile"
      : `${nearestEnemyDistance.toFixed(0)}u hostile`;
  const upsideParts: string[] = [];

  if (unsecuredIntel > 0) {
    upsideParts.push(`${unsecuredIntel} intel cache${unsecuredIntel === 1 ? "" : "s"}`);
  }
  if (!state.activeContract.completed && !state.activeContract.failed) {
    upsideParts.push(`${state.activeContract.rewardCredits}cr contract`);
  }
  if (untouchedCaches > 0) {
    upsideParts.push(`${untouchedCaches} cache${untouchedCaches === 1 ? "" : "s"}`);
  }
  if (looseLoot > 0) {
    upsideParts.push(`${looseLoot} loose touch${looseLoot === 1 ? "" : "es"}`);
  }

  let title = "CUT CLEAN EXFIL";
  let accent = "#fde68a";
  let borderColor = 0xf59e0b;
  let bodyColor = "#fef3c7";
  let statusLine = `${bankCredits}cr bank | ${manifestCount} hot | ${formatSceneSupplySummary(state.carriedSupplies)}`;

  if (state.extractionHoldTimer > 0 && state.extractionContested) {
    title = "CLEAR THE RING";
    accent = "#fecaca";
    borderColor = 0xfb7185;
    bodyColor = "#fee2e2";
    statusLine = `${focusedExtractLabel} blocked by ${state.extractionContesters} scav${state.extractionContesters === 1 ? "" : "s"}`;
  } else if (state.extractionHoldTimer > 0 && extractionHoldSlipping) {
    title = "RECOVER SIGNAL";
    accent = "#fde68a";
    borderColor = 0xfbbf24;
    bodyColor = "#fef3c7";
    statusLine = `${focusedExtractLabel} slipping | ${state.extractionHoldTimer.toFixed(1)}s still needed`;
  } else if (state.extractionHoldTimer > 0) {
    title = "HOLD THE PULL";
    accent = "#bbf7d0";
    borderColor = 0x4ade80;
    bodyColor = "#dcfce7";
    statusLine = `${focusedExtractLabel} live | ${state.extractionHoldTimer.toFixed(1)}s to clear`;
  } else if (!state.extractionReady) {
    title = "OPEN EXFIL";
    accent = "#bfdbfe";
    borderColor = 0x38bdf8;
    bodyColor = "#dbeafe";
    statusLine = `exfil should already be live`;
  } else if (bankCredits > 0 && (nextWave !== null || state.soundPressure >= 0.82 || state.timerRemaining <= 50)) {
    title = "BANK THE HAUL";
    accent = "#fecaca";
    borderColor = 0xfb7185;
    bodyColor = "#fee2e2";
    statusLine = `${bankCredits}cr bankable at ${focusedExtractLabel}`;
  } else if (upsideParts.length > 0) {
    title = "GREED ONE MORE";
    accent = "#bbf7d0";
    borderColor = 0x4ade80;
    bodyColor = "#dcfce7";
    statusLine = `${upsideParts.slice(0, 2).join(" | ")} still live`;
  }

  const riskLine =
    nextWave !== null
      ? `${nextWave.source === "extraction-wave" ? "crash wave" : nextWave.label.toLowerCase()} in ${nextWave.timer.toFixed(1)}s | hold ${state.extractionHoldDuration.toFixed(1)}s`
      : state.extractionContested
        ? `${state.extractionContesters} scav${state.extractionContesters === 1 ? "" : "s"} own the ring | ${nearestEnemyLabel}`
        : `${nearestEnemyLabel} | noise ${state.soundPressure.toFixed(2)} | ${focusedExtractLabel}`;
  const squadRisk = getExtractSquadRiskRead(state);
  const squadLine = squadLeanActive
    ? (() => {
        const plannedExtractPosture = getPlannedExtractPosture(state);
        return plannedExtractPosture
          ? plannedExtractPosture.hardCommittedFireteams > 0
            ? `${squadRisk.compact} | ${plannedExtractPosture.hardCommittedFireteams} hot-committed`
            : `${squadRisk.compact} | ${plannedExtractPosture.stagedFireteams} screen teams leaned`
          : `${squadRisk.compact} | boys lean ${focusedExtractLabel.toLowerCase()}`;
      })()
    : `${squadRisk.title} | ${squadRisk.compact}`;
  const commandRecommendation = getExtractCommandRecommendation(state);
  const reinforcementPressure = getReinforcementPressureRead(state);
  const plannedExtractSupportLine =
    squadLeanActive && !reinforcementPressure
      ? (() => {
          const supportNames = getPlannedExtractStageCues(state)
            .slice(0, 3)
            .map((cue) => cue.supportLabel)
            .filter((value, index, list) => list.indexOf(value) === index);
          return supportNames.length > 0 ? `SUPPORT ${supportNames.join(" | ")}` : null;
        })()
      : null;
  const commandLine =
    commandRecommendation.orderId !== null
      ? `${commandRecommendation.metric} | ${commandRecommendation.title}`
      : `${commandRecommendation.title} | ${commandRecommendation.metric}`;
  const threatLine = reinforcementPressure ? `FLARES ${reinforcementPressure.status}` : riskLine;
  const guidanceLine = reinforcementPressure ? reinforcementPressure.detail : plannedExtractSupportLine ?? commandLine;

  return {
    title: reinforcementPressure?.tone === "critical" ? "CRASH ON THE PULL" : operationRead.phase === "collapse" ? operationRead.title : title,
    accent,
    borderColor,
    bodyColor,
    lines: [
      statusLine,
      `${operationRead.phaseLabel} | ${operationRead.exitIntentLabel} | ${operationRead.extractCleanlinessLabel} | ${threatLine}`,
      `${squadLine}  |  ${guidanceLine}`
    ]
  };
}

function buildSceneCombatPulsePanel(): {
  visible: boolean;
  title: string;
  accent: string;
  borderColor: number;
  bodyColor: string;
  lines: string[];
} {
  const state = raidController.state;
  const selectedMate = state.squadMates.find((mate) => mate.id === state.selectedSquadMateId) ?? state.squadMates[0] ?? null;
  const activeTacticalMates = state.squadMates.filter(
    (mate) => mate.tacticalAction && mate.tacticalAction.status !== "failed" && mate.tacticalAction.status !== "completed"
  );
  const liveOrders = state.squadMates.filter((mate) => mate.command.orderId !== "follow").length;
  const nearbySuppressedEnemies = state.enemies.filter(
    (enemy) =>
      (enemy.pressureType === "suppressed" || enemy.pressureType === "pinned") &&
      Phaser.Math.Distance.Between(enemy.position.x, enemy.position.y, state.player.position.x, state.player.position.y) <= 360
  ).length;
  const nearbyFriendlySuppressors = activeTacticalMates.filter(
    (mate) =>
      mate.tacticalAction?.actionId === "suppress" &&
      Boolean(
        state.friendlyCombatants.find(
          (combatant) =>
            combatant.ownerKind === "squadmate" &&
            combatant.squadMateId === mate.id &&
            Phaser.Math.Distance.Between(
              combatant.position.x,
              combatant.position.y,
              state.player.position.x,
              state.player.position.y
            ) <= 420
        )
      )
  ).length;
  const effectLine = `${state.frontlineTracers.length} tracers  |  ${state.frontlineImpacts.length} impacts  |  ${state.grenades.length} grenades`;
  const selectedLine =
    selectedMate?.tacticalAction
      ? `${selectedMate.name.toUpperCase()} ${selectedMate.tacticalAction.actionId.toUpperCase()} ${selectedMate.tacticalAction.status.toUpperCase()}`
      : selectedMate
        ? `${selectedMate.name.toUpperCase()} ${selectedMate.command.orderId.toUpperCase()}`
        : "NO BOY SELECTED";
  const orderLine =
    state.activeFrontlineSupportOrderId !== null
      ? `${getFrontlineSupportOrderPayoff(state).title.toUpperCase()}  |  ${liveOrders} live order${liveOrders === 1 ? "" : "s"}`
      : `${liveOrders} live order${liveOrders === 1 ? "" : "s"}  |  ${activeTacticalMates.length} tactical action${activeTacticalMates.length === 1 ? "" : "s"}`;
  const pressureLine = `${nearbySuppressedEnemies} pinned  |  ${nearbyFriendlySuppressors} friendly suppressor${nearbyFriendlySuppressors === 1 ? "" : "s"}`;

  let title = "COMBAT PULSE";
  let accent = "#bfdbfe";
  let borderColor = 0x38bdf8;
  let bodyColor = "#dbeafe";
  if (state.grenades.length > 0 || state.frontlineTracers.length >= 6 || state.frontlineImpacts.length >= 4) {
    title = "EFFECTS CROSSING";
    accent = "#fecaca";
    borderColor = 0xfb7185;
    bodyColor = "#fee2e2";
  } else if (activeTacticalMates.length > 0 || nearbySuppressedEnemies > 0 || liveOrders > 0) {
    title = "FIRE PLAN LIVE";
    accent = "#fde68a";
    borderColor = 0xf59e0b;
    bodyColor = "#fef3c7";
  }

  return {
    visible:
      activeTacticalMates.length > 0 ||
      state.frontlineTracers.length > 0 ||
      state.frontlineImpacts.length > 0 ||
      state.grenades.length > 0 ||
      state.activeFrontlineSupportOrderId !== null,
    title,
    accent,
    borderColor,
    bodyColor,
    lines: [selectedLine, `${orderLine}  |  ${pressureLine}`, effectLine]
  };
}

function buildSceneCombatAudioPanel(mode: "armed" | "awaiting-gesture" | "unsupported"): {
  visible: boolean;
  title: string;
  accent: string;
  borderColor: number;
  bodyColor: string;
  lines: string[];
} {
  const read = buildCombatAudioRead(raidController.state, mode);

  return {
    visible: read.visible,
    title: read.title,
    accent: read.accent,
    borderColor: read.borderColor,
    bodyColor: read.bodyColor,
    lines: read.lines
  };
}

function buildSceneFrontlineOperationPanel(): {
  visible: boolean;
  title: string;
  accent: string;
  borderColor: number;
  bodyColor: string;
  lines: string[];
} {
  const read = getFrontlineOperationRead(raidController.state);
  const accent =
    read.tone === "critical"
      ? "#fecaca"
      : read.tone === "warning"
        ? "#fde68a"
        : read.tone === "support"
          ? "#bae6fd"
          : "#dbeafe";
  const borderColor =
    read.tone === "critical"
      ? 0xfb7185
      : read.tone === "warning"
        ? 0xf59e0b
        : read.tone === "support"
          ? 0x38bdf8
          : 0x7dd3fc;
  const bodyColor =
    read.tone === "critical"
      ? "#fee2e2"
      : read.tone === "warning"
        ? "#fef3c7"
        : read.tone === "support"
          ? "#e0f2fe"
          : "#dbeafe";

  return {
    visible: read.live,
    title: read.title.toUpperCase(),
    accent,
    borderColor,
    bodyColor,
    lines: [
      `${read.operationLabel.toUpperCase()}  |  ${read.districtLabel.toUpperCase()}`,
      read.effectLabel.toUpperCase(),
      read.deployLabel.toUpperCase()
    ]
  };
}

function buildScenePressurePosturePanel(): {
  visible: boolean;
  title: string;
  accent: string;
  borderColor: number;
  bodyColor: string;
  lines: string[];
} {
  const read = getPressurePostureRead(raidController.state);
  const settlementRead = getSettlementStateRead(raidController.state);
  const subzoneRead = getActiveTacticalSubzoneRead(raidController.state);
  const accent = read.tone === "critical" ? "#fecaca" : read.tone === "warning" ? "#fde68a" : "#d1fae5";
  const borderColor = read.tone === "critical" ? 0xfb7185 : read.tone === "warning" ? 0xf59e0b : 0x4ade80;
  const bodyColor = read.tone === "critical" ? "#fee2e2" : read.tone === "warning" ? "#fef3c7" : "#dcfce7";

  return {
    visible:
      read.posture !== "holding" ||
      read.pinnedCount > 0 ||
      read.suppressedCount > 0,
    title: `PRESSURE // ${read.title.toUpperCase()}`,
    accent,
    borderColor,
    bodyColor,
    lines: [
      `${settlementRead.label.toUpperCase()}  |  ${subzoneRead.label.toUpperCase()}`,
      `${read.windowLabel.toUpperCase()}  |  ${read.pinnedCount} PINNED`,
      `${read.actionLabel.toUpperCase()}  |  ${read.threatLabel.toUpperCase()}`
    ]
  };
}

function isRaidTacticalDrawerOpen(): boolean {
  return typeof document !== "undefined" && document.body.classList.contains("raid-hud-tactical-open");
}

function buildSceneSquadCommandPanel(): {
  title: string;
  accent: string;
  borderColor: number;
  bodyColor: string;
  lines: string[];
} {
  const state = raidController.state;
  const battleRead = getSquadBattleRead(state);
  const squadStrain = getSquadStrainRead(state);
  const focusedIncident = state.frontlineIncidents.find(
    (incident) => incident.id === state.focusedFrontlineIncidentId && !incident.resolved
  ) ?? null;
  const escortSupport = state.frontlineSupports.find((support) => support.playerEscort) ?? null;
  const activeOrder =
    state.activeFrontlineSupportOrderId !== null
      ? getFrontlineSupportOrderPresentation(state, state.activeFrontlineSupportOrderId)
      : null;
  const orderPayoff = getFrontlineSupportOrderPayoff(state);
  const orderWorldCue = getFrontlineSupportOrderWorldCue(state);
  const selectedMate = state.squadMates.find((mate) => mate.id === state.selectedSquadMateId) ?? state.squadMates[0] ?? null;
  const selectedCommandAge =
    selectedMate !== null ? getSquadCommandAgeSeconds(selectedMate.command, state.timerRemaining) : 0;
  const selectedCommandFreshness =
    selectedMate === null ? "No command age" : selectedCommandAge < 1 ? "issued now" : `${selectedCommandAge.toFixed(1)}s old`;
  const nearbyFriendlyWeaponIds = state.frontlineSupports
    .filter(
      (support) =>
        Phaser.Math.Distance.Between(
          support.position.x,
          support.position.y,
          state.player.position.x,
          state.player.position.y
        ) <= 360
    )
    .flatMap((support) =>
      support.playerEscort
        ? state.squadMates.slice(0, Math.max(1, support.strength)).map((mate) => mate.weaponId)
        : [support.weaponId]
    );
  const nearbyHostileWeaponIds = [
    ...state.enemies
      .filter(
        (enemy) =>
          Phaser.Math.Distance.Between(enemy.position.x, enemy.position.y, state.player.position.x, state.player.position.y) <=
          420
      )
      .map((enemy) => enemy.weaponId),
    ...state.frontlineIncidents
      .filter(
        (incident) =>
          !incident.resolved &&
          Phaser.Math.Distance.Between(
            incident.position.x,
            incident.position.y,
            state.player.position.x,
            state.player.position.y
          ) <= 520
      )
      .map((incident) => incident.weaponId)
  ];

  let title = "BOYS NET";
  let accent = "#bfdbfe";
  let borderColor = 0x38bdf8;
  let bodyColor = "#dbeafe";
  const plannedExtractPosture = getPlannedExtractPosture(state);

  if (state.activeFrontlineSupportOrderId === "breach-push") {
    title = "BOYS CLEARING HOUSE";
    accent = "#bbf7d0";
    borderColor = 0x4ade80;
    bodyColor = "#dcfce7";
  } else if (state.activeFrontlineSupportOrderId === "secure-exfil") {
    title = activeOrder?.title === "Hold Gate" ? "BOYS HOLDING GATE" : "BOYS HOLDING HOUSE";
    accent = "#fde68a";
    borderColor = 0xf59e0b;
    bodyColor = "#fef3c7";
    } else if (state.activeFrontlineSupportOrderId === "draw-heat") {
      title = "BOYS WATCHING TREE LINE";
      accent = "#fdba74";
      borderColor = 0xf97316;
      bodyColor = "#ffedd5";
    } else if (state.activeFrontlineSupportOrderId === "hold-position") {
      title = activeOrder?.title === "Hold House" ? "BOYS HOLDING HOUSE" : "BOYS HOLDING POSITION";
      accent = "#bbf7d0";
      borderColor = 0x4ade80;
      bodyColor = "#dcfce7";
  } else if (state.activeFrontlineSupportOrderId === "shift-fire") {
      title = "BOYS SUPPRESSING WINDOW";
    accent = "#bae6fd";
    borderColor = 0x38bdf8;
    bodyColor = "#e0f2fe";
  } else if (focusedIncident?.kind === "firefight" && focusedIncident.presentationVariant === "wounded-soldier") {
    title = "BOYS HOLDING THE MED LANE";
    accent = "#fecaca";
    borderColor = 0xfb7185;
    bodyColor = "#fff1f2";
  } else if (
    focusedIncident?.kind === "firefight" &&
    (focusedIncident.markerState === "raising" || focusedIncident.territoryState === "breaking")
  ) {
    title = "BOYS LOCKING THE SCAR";
    accent = "#fecaca";
    borderColor = 0xfb7185;
    bodyColor = "#fee2e2";
  } else if (
    focusedIncident?.kind === "firefight" &&
    (focusedIncident.markerState === "planted" || focusedIncident.territoryState === "reclaimed")
  ) {
    title = "BOYS HOLDING THE FLAG";
    accent = "#bbf7d0";
    borderColor = 0x4ade80;
    bodyColor = "#dcfce7";
  } else if (
    focusedIncident?.kind === "firefight" &&
    (focusedIncident.markerState === "bagged" || focusedIncident.territoryState === "lost")
  ) {
    title = "BOYS WORKING THE DEAD STRIP";
    accent = "#fde68a";
    borderColor = 0xf59e0b;
    bodyColor = "#fef3c7";
  } else if (plannedExtractPosture) {
    title = "BOYS LEANING PULL";
    accent = "#99f6e4";
    borderColor = 0x2dd4bf;
    bodyColor = "#ccfbf1";
  }

  const escortLoadoutSummary = formatWeaponMixSummary(
    state.squadMates.slice(0, 3).map((mate) => mate.weaponId),
    "no staged squad guns",
    3
  );
  const escortLine = escortSupport
    ? `${escortSupport.strength} up | ${escortLoadoutSummary} | ${escortSupport.note}`
    : "No armed boys wedge is stacked in this raid. Deploy armed and the escort command layer comes online.";
  const orderLine = activeOrder
    ? `${orderPayoff.title} | ${orderPayoff.metric}`
    : state.frontlineSupportOrderCooldown > 0
      ? `${orderPayoff.title} | ${orderPayoff.metric}`
      : plannedExtractPosture
        ? `${plannedExtractPosture.title} | ${plannedExtractPosture.status}`
        : `${orderPayoff.title} | ${orderPayoff.metric}`;
  const selectedLine = selectedMate
    ? `SELECTED ${selectedMate.name.toUpperCase()} ${WEAPONS[selectedMate.weaponId].name.toUpperCase()} | ${selectedMate.assignmentTag}${selectedMate.command.anchorLabel ? ` | ${selectedMate.command.anchorLabel}` : ""}${selectedMate.command.watchLabel ? ` | WATCH ${selectedMate.command.watchLabel}` : ""}${selectedMate.tacticalAction ? ` | ${selectedMate.tacticalAction.actionId.toUpperCase()} ${selectedMate.tacticalAction.status.toUpperCase()}` : ""} | ${selectedCommandFreshness.toUpperCase()}`
    : "SELECTED no named boy online";
  const tacticalActionLine =
    selectedMate?.tacticalAction
      ? `ACTION ${selectedMate.tacticalAction.actionId.toUpperCase()} ${selectedMate.tacticalAction.status.toUpperCase()} | ${selectedMate.tacticalAction.targetLabel.toUpperCase()} | ${getSquadTacticalActionAgeSeconds(selectedMate.tacticalAction, state.timerRemaining) < 1 ? "ISSUED NOW" : `${getSquadTacticalActionAgeSeconds(selectedMate.tacticalAction, state.timerRemaining).toFixed(1)}S OLD`}${selectedMate.tacticalAction.failureReason ? ` | ${selectedMate.tacticalAction.failureReason.toUpperCase()}` : ""}`
      : null;
  const coffeeRead = getFrontlineCoffeePocketRead(state);
  const commandLine =
    activeOrder || state.frontlineSupportOrderCooldown > 0
      ? orderPayoff.detail
      : plannedExtractPosture
        ? plannedExtractPosture.detail
        : selectedMate?.command.orderId === "defend"
          ? `8/9/0 Select  |  C Follow  |  X Defend  |  V Attack  |  ALT+LMB / ALT+V Quick Suppress  |  CTRL+LMB Commit Suppress  |  ALT+G Frag  |  HOLD ${selectedMate.command.anchorLabel ?? "ordered pocket"} | leash ${Math.round(selectedMate.command.holdRadius)}u`
          : selectedMate?.command.orderId === "brace-watch"
            ? `8/9/0 Select  |  C Follow  |  X Defend  |  V Attack  |  ALT+RMB Brace Lane  |  CTRL+RMB Covering Move  |  WATCH ${selectedMate.command.watchLabel ?? "ordered sector"} | arc ${Math.round(selectedMate.command.watchArcDegrees ?? 0)}deg`
            : selectedMate?.command.orderId === "move-watch"
              ? `8/9/0 Select  |  C Follow  |  X Defend  |  V Attack  |  ALT+RMB Brace Lane  |  CTRL+RMB Covering Move  |  SUPPRESS ${selectedMate.command.watchLabel ?? "ordered sector"} | arc ${Math.round(selectedMate.command.watchArcDegrees ?? 0)}deg`
          : "8/9/0 Select  |  C Follow  |  X Defend  |  V Attack  |  ALT+LMB / ALT+V Quick Suppress  |  CTRL+LMB Commit Suppress  |  ALT+G Frag  |  Z Suppress  |  B Hold Net";
  const worldCueLine = orderWorldCue ? `MARK ${orderWorldCue.label} | ${orderWorldCue.detail}` : "MARK No live world cue. Call a boys order to project one into raid.";
  const coffeeLine = coffeeRead ? `COFFEE ${coffeeRead.title.toUpperCase()} | ${coffeeRead.detail}` : null;
  const squadStrainLine = `STRAIN ${squadStrain.title.toUpperCase()} | ${squadStrain.compact}`;
  const battleReadLine = `${battleRead.label.toUpperCase()} | ${battleRead.detail}`;
  const commsLine = `${state.squadComms.channel} | ${state.squadComms.speaker} ${state.squadComms.voiceTag.toUpperCase()} ${state.squadComms.tone} | ${state.squadComms.line}`;
  const weaponLine = `Guns ${formatWeaponMixSummary(nearbyFriendlyWeaponIds, "no friendly gun read")}  ||  Blue ${formatWeaponMixSummary(nearbyHostileWeaponIds, "no hostile gun read")}`;
  const nearbyTapeEnemies = state.enemies.filter(
    (enemy) => Phaser.Math.Distance.Between(enemy.position.x, enemy.position.y, state.player.position.x, state.player.position.y) <= 420
  );
  const leadTapeId = [...nearbyTapeEnemies].sort((left, right) => {
    const leftPriority = left.tapeId === "yellow" ? 3 : left.tapeId === "green" ? 2 : 1;
    const rightPriority = right.tapeId === "yellow" ? 3 : right.tapeId === "green" ? 2 : 1;
    return rightPriority - leftPriority;
  })[0]?.tapeId;
  const leadTape = leadTapeId ? getEnemyTapeDefinition(leadTapeId) : null;
  const tapeLine = `Tape ${getEnemyTapeSummary(nearbyTapeEnemies, "no tape read")}  ||  ${leadTape?.shortCombatSummary ?? "no live hostile read"}`;

  return {
    title,
    accent,
    borderColor,
    bodyColor,
    lines: [
      selectedLine,
      ...(tacticalActionLine ? [tacticalActionLine] : []),
      `${escortLine}  |  ${orderLine}`,
      `${weaponLine}  |  ${tapeLine}`,
      `${squadStrainLine}  |  ${worldCueLine}`,
      ...(coffeeLine ? [coffeeLine] : []),
      `${battleReadLine}  |  ${commsLine}`,
      commandLine
    ]
  };
}

function buildSceneSquadTrafficPanel(): {
  visible: boolean;
  title: string;
  accent: string;
  borderColor: number;
  bodyColor: string;
  lines: string[];
} {
  const entries = raidController.state.squadLog.slice(0, 3);
  const hottestTone = entries.find((entry) => entry.tone === "critical")
    ? "critical"
    : entries.find((entry) => entry.tone === "extract")
      ? "extract"
      : entries.find((entry) => entry.tone === "warning")
        ? "warning"
        : "steady";

  let accent = "#cbd5e1";
  let borderColor = 0x64748b;
  let bodyColor = "#dbeafe";

  if (hottestTone === "critical") {
    accent = "#fecaca";
    borderColor = 0xfb7185;
    bodyColor = "#fee2e2";
  } else if (hottestTone === "extract") {
    accent = "#bfdbfe";
    borderColor = 0x38bdf8;
    bodyColor = "#dbeafe";
  } else if (hottestTone === "warning") {
    accent = "#fde68a";
    borderColor = 0xf59e0b;
    bodyColor = "#fef3c7";
  }

  return {
    visible: hottestTone !== "steady" || entries.length > 0,
    title: "NET TRAFFIC",
    accent,
    borderColor,
    bodyColor,
    lines:
      entries.length > 0
        ? entries.slice(0, 2).map((entry) => `[${entry.stamp}] ${entry.channel} | ${entry.speaker}: ${entry.line}`)
        : ["[Standby] Rook steady hand: Boys net is cold. Pick the route and step in together."]
  };
}

function buildSceneHostileTrafficPanel(): {
  visible: boolean;
  title: string;
  accent: string;
  borderColor: number;
  bodyColor: string;
  lines: string[];
} {
  const state = raidController.state;
  const leadTape = state.hostileComms.tapeId ? getEnemyTapeDefinition(state.hostileComms.tapeId) : null;
  const entries = state.hostileLog.slice(0, 2);
  const hottestTone = entries.find((entry) => entry.tone === "critical")
    ? "critical"
    : entries.find((entry) => entry.tone === "extract")
      ? "extract"
      : entries.find((entry) => entry.tone === "warning")
        ? "warning"
        : state.hostileComms.tone;

  let title = "BLUE SHOUTS";
  let accent = leadTape ? leadTape.hex : "#bfdbfe";
  let borderColor = leadTape?.color ?? 0x60a5fa;
  let bodyColor = "#dbeafe";

  if (hottestTone === "critical") {
    title = "BLUE NET BREAKING";
    accent = "#fecaca";
    borderColor = 0xfb7185;
    bodyColor = "#fee2e2";
  } else if (hottestTone === "warning") {
    title = "BLUE SHOUTS HOT";
    accent = "#fde68a";
    borderColor = 0xf59e0b;
    bodyColor = "#fef3c7";
  } else if (hottestTone === "extract") {
    title = "BLUE ON THE PULL";
    accent = "#bfdbfe";
    borderColor = 0x38bdf8;
    bodyColor = "#dbeafe";
  }

  const headerLine = `${state.hostileComms.channel} | ${state.hostileComms.speaker} ${state.hostileComms.role}`;
  const tapeLine = `${leadTape?.label ?? "Blue net"} | ${leadTape?.shortCombatSummary ?? "holding the lane"}`;
  const currentLine = `"${state.hostileComms.line}"`;
  const logLines =
    entries.length > 0
      ? entries.map((entry) => `[${entry.stamp}] ${entry.speaker}: ${entry.line}`)
      : ["[Standby] Blue line is quiet, but the lane still reads occupied."];

  return {
    visible: hottestTone !== "steady",
    title,
    accent,
    borderColor,
    bodyColor,
    lines: [headerLine, tapeLine, currentLine, ...logLines.slice(0, 1)]
  };
}

function getFrontlineTerritoryStatusLabel(state: FrontlineIncidentState["territoryState"]): string {
  if (state === "reclaimed") {
    return "Ground reclaimed";
  }

  if (state === "lost") {
    return "Ground lost";
  }

  if (state === "breaking") {
    return "Ground breaking";
  }

  return "Ground contested";
}

function getFrontlineScarIncidents(state: typeof raidController.state): FrontlineIncidentState[] {
  return state.frontlineIncidents.filter(
    (incident) =>
      incident.kind === "firefight" &&
      (incident.markerState !== "none" || incident.territoryState === "breaking" || incident.territoryState === "reclaimed")
  );
}

function getFrontlineScarPriority(incident: FrontlineIncidentState): number {
  if (incident.markerState === "raising") {
    return 0;
  }
  if (incident.markerState === "planted") {
    return 1;
  }
  if (incident.markerState === "bagged") {
    return 2;
  }
  if (incident.territoryState === "breaking") {
    return 3;
  }
  if (incident.territoryState === "reclaimed") {
    return 4;
  }
  if (incident.territoryState === "lost") {
    return 5;
  }
  return 6;
}

function createScarObjectiveMarker(
  incident: FrontlineIncidentState,
  playerPosition: { x: number; y: number },
  timeSeconds: number
): ObjectiveMarker {
  const distanceToPlayer = Phaser.Math.Distance.Between(
    incident.position.x,
    incident.position.y,
    playerPosition.x,
    playerPosition.y
  );
  const labelSuffix = distanceToPlayer <= 460 ? incident.label : `${incident.label} ${Math.round(distanceToPlayer)}m`;

  if (incident.markerState === "raising" || incident.territoryState === "breaking") {
    return {
      label: `Break // ${labelSuffix}`,
      position: incident.position,
      color: 0xfb7185,
      accent: 0xffedd5,
      radius: incident.radius + 12,
      priority: 3,
      pulse: Math.sin(timeSeconds * 4.8 + incident.id * 0.6) * 4 + 7,
      warning: true
    };
  }

  if (incident.markerState === "planted" || incident.territoryState === "reclaimed") {
    return {
      label: `Flag Hold // ${labelSuffix}`,
      position: incident.position,
      color: 0x4ade80,
      accent: 0xdcfce7,
      radius: incident.radius + 10,
      priority: 4,
      pulse: Math.sin(timeSeconds * 4.2 + incident.id * 0.6) * 3 + 5
    };
  }

  return {
    label: `Bodies // ${labelSuffix}`,
    position: incident.position,
    color: 0xf59e0b,
    accent: 0xfef3c7,
    radius: incident.radius + 10,
    priority: 4,
    pulse: Math.sin(timeSeconds * 3.9 + incident.id * 0.6) * 3 + 5
  };
}

function buildSceneFrontlineAftermathPanel(): {
  visible: boolean;
  title: string;
  accent: string;
  borderColor: number;
  bodyColor: string;
  lines: string[];
} {
  const state = raidController.state;
  const focusedSurrenderIncident =
    state.frontlineIncidents.find(
      (incident) =>
        incident.id === state.focusedFrontlineIncidentId &&
        !incident.resolved &&
        incident.kind === "firefight" &&
        incident.status === "routed" &&
        incident.territoryState === "reclaimed"
    ) ??
    state.frontlineIncidents.find(
      (incident) =>
        !incident.resolved &&
        incident.kind === "firefight" &&
        incident.status === "routed" &&
        incident.territoryState === "reclaimed"
    ) ??
    null;
  const focusedRecoveryIncident =
    state.frontlineIncidents.find(
      (incident) => incident.id === state.focusedFrontlineIncidentId && !incident.resolved && incident.kind === "casualty"
    ) ??
    state.frontlineIncidents.find((incident) => !incident.resolved && incident.kind === "casualty") ??
    null;
  const focusedMedicalHoldIncident =
    state.frontlineIncidents.find(
      (incident) =>
        incident.id === state.focusedFrontlineIncidentId &&
        !incident.resolved &&
        incident.kind === "firefight" &&
        incident.presentationVariant === "wounded-soldier"
    ) ??
    state.frontlineIncidents.find(
      (incident) => !incident.resolved && incident.kind === "firefight" && incident.presentationVariant === "wounded-soldier"
    ) ??
    null;
  const focusedDroneSweepIncident =
    state.frontlineIncidents.find(
      (incident) =>
        incident.id === state.focusedFrontlineIncidentId &&
        !incident.resolved &&
        incident.kind === "firefight" &&
        incident.presentationVariant === "drone-sweep"
    ) ??
    state.frontlineIncidents.find(
      (incident) => !incident.resolved && incident.kind === "firefight" && incident.presentationVariant === "drone-sweep"
    ) ??
    null;
  const focusedConvoyIncident =
    state.frontlineIncidents.find(
      (incident) => incident.id === state.focusedFrontlineIncidentId && !incident.resolved && incident.kind === "convoy"
    ) ??
    state.frontlineIncidents.find(
      (incident) => !incident.resolved && incident.kind === "convoy" && incident.presentationVariant === "armored-drop"
    ) ??
    null;
  const focusedCivilianIncident =
    state.frontlineIncidents.find(
      (incident) => incident.id === state.focusedFrontlineIncidentId && !incident.resolved && incident.kind === "civilian"
    ) ??
    state.frontlineIncidents.find((incident) => !incident.resolved && incident.kind === "civilian") ??
    null;
  const focusedBunkerIncident =
    state.frontlineIncidents.find(
      (incident) => incident.id === state.focusedFrontlineIncidentId && !incident.resolved && incident.kind === "bunker"
    ) ??
      state.frontlineIncidents.find((incident) => !incident.resolved && incident.kind === "bunker") ??
    null;
  const activeActionRead = getFrontlineIncidentActionRead(state);
  const coffeeRead = getFrontlineCoffeePocketRead(state);
  const recoverySupport = state.frontlineSupports.find((support) => support.kind === "recovery") ?? null;
  const escortSupport = state.frontlineSupports.find((support) => support.kind === "fireteam" && support.playerEscort) ?? null;
  const convoySupport = state.frontlineSupports.find((support) => support.kind === "convoy") ?? null;
  const convoyIncident = state.frontlineIncidents.find((incident) => !incident.resolved && incident.kind === "convoy") ?? null;
  const aidSatchelCount = state.supplyCaches.filter(
    (cache) =>
      !cache.searched &&
      cache.frontlineDrop &&
      cache.kind === "medical" &&
      focusedRecoveryIncident &&
      cache.frontlineDropSourceLabel === focusedRecoveryIncident.label
  ).length;
  const scarIncidents = getFrontlineScarIncidents(state);
  const yara = state.squadMates.find((mate) => mate.name.toLowerCase() === "yara") ?? null;

  if (focusedMedicalHoldIncident) {
    const activeMedicalHold = activeActionRead?.incidentId === focusedMedicalHoldIncident.id ? activeActionRead : null;
    const yaraLine = yara
      ? `${yara.name.toUpperCase()} ${WEAPONS[yara.weaponId].name.toUpperCase()} | ${yara.condition.toUpperCase()}`
      : "YARA | Stabilized but still on the hot shoulder";
    return {
      visible: true,
      title: activeMedicalHold ? "MEDICAL HOLD LIVE" : "WOUNDED SOLDIER",
      accent: activeMedicalHold ? "#fca5a5" : "#fecaca",
      borderColor: activeMedicalHold ? 0xef4444 : 0xfb7185,
      bodyColor: activeMedicalHold ? "#fee2e2" : "#fff1f2",
      lines: [
        `${focusedMedicalHoldIncident.label} | ${focusedMedicalHoldIncident.status === "engaged" ? "Needles and rifles both live" : "Hot shoulder still unsettled"}`,
        activeMedicalHold ? `${activeMedicalHold.title} | ${activeMedicalHold.status}` : focusedMedicalHoldIncident.note,
        `${yaraLine}`,
        `${escortSupport?.label ?? "Escort wedge"} | ${escortSupport?.note ?? "No boys screen is locking the split yet."}`,
        `${recoverySupport?.label ?? "Medical hand"} | ${recoverySupport?.note ?? "No relief kit is staged on the hold line yet."} | ${aidSatchelCount} aid satchel${aidSatchelCount === 1 ? "" : "s"} loose`
      ]
    };
  }

  if (focusedDroneSweepIncident) {
    const activeSweep = activeActionRead?.incidentId === focusedDroneSweepIncident.id ? activeActionRead : null;
    const hostileTraffic =
      state.hostileComms.line.length > 0
        ? `${state.hostileComms.speaker} | ${state.hostileComms.line}`
        : "Rotor buzz is hanging over the relay cut and Blue is walking bodies under the eye.";
    return {
      visible: true,
      title: activeSweep ? "DRONE WINDOW LIVE" : "DRONE SWEEP",
      accent: activeSweep ? "#bfdbfe" : "#bae6fd",
      borderColor: activeSweep ? 0x60a5fa : 0x38bdf8,
      bodyColor: activeSweep ? "#dbeafe" : "#e0f2fe",
      lines: [
        `${focusedDroneSweepIncident.label} | ${focusedDroneSweepIncident.status === "collapsing" ? "Lane burned under the eye" : "Sweep riding overhead"}`,
        activeSweep ? `${activeSweep.title} | ${activeSweep.status}` : focusedDroneSweepIncident.note,
        `${escortSupport?.label ?? "Escort wedge"} | ${escortSupport?.note ?? "No hedge screen is stacked under the drone lane yet."}`,
        `${hostileTraffic}`,
        `${getNoisePressureRead(raidController.getActiveRoute(), state).title} | ${state.frontlineIncidentExtractRelief > 0 ? `Extract relief -${state.frontlineIncidentExtractRelief.toFixed(1)}s` : "Route board still worth stealing before the eye drifts"}`
      ]
    };
  }

  if (focusedSurrenderIncident) {
    const activeSurrenderLock = activeActionRead?.incidentId === focusedSurrenderIncident.id ? activeActionRead : null;
    const plantedFlagCount = scarIncidents.filter((incident) => incident.markerState === "planted").length;
    const surrenderTraffic =
      state.hostileComms.line.length > 0 ? `${state.hostileComms.speaker} | ${state.hostileComms.line}` : "Blue is still shouting through the pocket.";
    return {
      visible: true,
      title: activeSurrenderLock ? "SURRENDER LOCK LIVE" : "SURRENDER WINDOW",
      accent: activeSurrenderLock ? "#fdba74" : "#fde68a",
      borderColor: activeSurrenderLock ? 0xf97316 : 0xf59e0b,
      bodyColor: activeSurrenderLock ? "#ffedd5" : "#fef3c7",
      lines: [
        `${focusedSurrenderIncident.label} | ${focusedSurrenderIncident.status === "routed" ? "Hands are up" : "Pocket still wavering"}`,
        activeSurrenderLock ? `${activeSurrenderLock.title} | ${activeSurrenderLock.status}` : focusedSurrenderIncident.note,
        `${escortSupport?.label ?? "Boys screen"} | ${escortSupport?.note ?? "No screen is stacked on the surrender lane yet."}`,
        `${surrenderTraffic}`,
        `${plantedFlagCount} planted scar${plantedFlagCount === 1 ? "" : "s"} | ${state.frontlineIncidentExtractRelief > 0 ? `Extract relief -${state.frontlineIncidentExtractRelief.toFixed(1)}s` : "Route notes still need bagging"}`
      ]
    };
  }

  if (focusedConvoyIncident?.presentationVariant === "white-van-ambush") {
    const activeStrip = activeActionRead?.incidentId === focusedConvoyIncident.id ? activeActionRead : null;
    const hostileTraffic =
      state.hostileComms.line.length > 0
        ? `${state.hostileComms.speaker} | ${state.hostileComms.line}`
        : "Blue is trying to recover the relay set off the road.";
    return {
      visible: true,
      title: activeStrip ? "COMMS STRIP LIVE" : "WHITE VAN HIT",
      accent: activeStrip ? "#bfdbfe" : "#fef3c7",
      borderColor: activeStrip ? 0x38bdf8 : 0xf59e0b,
      bodyColor: activeStrip ? "#e0f2fe" : "#fef3c7",
      lines: [
        `${focusedConvoyIncident.label} | ${focusedConvoyIncident.status === "engaged" ? "Comms tail ripped open" : "Recovery lane still open"}`,
        activeStrip ? `${activeStrip.title} | ${activeStrip.status}` : focusedConvoyIncident.note,
        `${convoySupport?.label ?? "White van shoulder"} | ${convoySupport?.note ?? "No split-tail logistics read is stacked in the lane yet."}`,
        `${escortSupport?.label ?? "Escort wedge"} | ${escortSupport?.note ?? "No strip screen is stacked on the relay shoulder yet."}`,
        `${hostileTraffic} | ${state.frontlineIncidentExtractRelief > 0 ? `Extract relief -${state.frontlineIncidentExtractRelief.toFixed(1)}s` : "Mast tube and battery crate still exposed"}`
      ]
    };
  }

  if (focusedConvoyIncident?.presentationVariant === "armored-drop") {
    const activeStrip = activeActionRead?.incidentId === focusedConvoyIncident.id ? activeActionRead : null;
    const hostileTraffic =
      state.hostileComms.line.length > 0
        ? `${state.hostileComms.speaker} | ${state.hostileComms.line}`
        : "Blue is barking dismount orders off the hull.";
    return {
      visible: true,
      title: activeStrip ? "TROOPS DISEMBARKING" : "ARMORED DROP",
      accent: activeStrip ? "#bae6fd" : "#fef3c7",
      borderColor: activeStrip ? 0x38bdf8 : 0xf59e0b,
      bodyColor: activeStrip ? "#e0f2fe" : "#fef3c7",
      lines: [
        `${focusedConvoyIncident.label} | ${focusedConvoyIncident.status === "engaged" ? "Ramp down under fire" : "Drop lane opening"}`,
        activeStrip ? `${activeStrip.title} | ${activeStrip.status}` : focusedConvoyIncident.note,
        `${convoySupport?.label ?? "Drop wagon"} | ${convoySupport?.note ?? "No armored hull is stacked on the ramp yet."}`,
        `${escortSupport?.label ?? "Escort wedge"} | ${escortSupport?.note ?? "No ramp kill lane is stacked yet."}`,
        `${hostileTraffic} | ${state.frontlineIncidentExtractRelief > 0 ? `Extract relief -${state.frontlineIncidentExtractRelief.toFixed(1)}s` : "Dismount crates still loose"}`
      ]
    };
  }

  if (focusedConvoyIncident?.presentationVariant === "caravan-trap") {
    const activeStrip = activeActionRead?.incidentId === focusedConvoyIncident.id ? activeActionRead : null;
    const hostileTraffic =
      state.hostileComms.line.length > 0
        ? `${state.hostileComms.speaker} | ${state.hostileComms.line}`
        : "Blue trap calls are still hanging over the road shoulder.";
    return {
      visible: true,
      title: activeStrip ? "AMMO COOKOFF" : "CARAVAN TRAP",
      accent: activeStrip ? "#fecaca" : "#fde68a",
      borderColor: activeStrip ? 0xfb7185 : 0xf59e0b,
      bodyColor: activeStrip ? "#fee2e2" : "#fef3c7",
      lines: [
        `${focusedConvoyIncident.label} | ${focusedConvoyIncident.status === "engaged" ? "Kill zone still burning" : "Trap lane still readable"}`,
        activeStrip ? `${activeStrip.title} | ${activeStrip.status}` : focusedConvoyIncident.note,
        `${convoySupport?.label ?? "Burning wagon shoulder"} | ${convoySupport?.note ?? "No wreck pile is stacked in the lane yet."}`,
        `${escortSupport?.label ?? "Escort wedge"} | ${escortSupport?.note ?? "No kill-zone screen is stacked on the road shoulder yet."}`,
        `${hostileTraffic} | ${state.frontlineIncidentExtractRelief > 0 ? `Extract relief -${state.frontlineIncidentExtractRelief.toFixed(1)}s` : "Loose haul still exposed between the wrecks"}`
      ]
    };
  }

  if (focusedRecoveryIncident) {
    const activeRecovery = activeActionRead?.incidentId === focusedRecoveryIncident.id ? activeActionRead : null;
    const medevacSupportLive =
      convoySupport !== null &&
      Phaser.Math.Distance.Between(
        convoySupport.position.x,
        convoySupport.position.y,
        focusedRecoveryIncident.position.x,
        focusedRecoveryIncident.position.y
      ) <=
        focusedRecoveryIncident.radius + 168;
    const medevacIncidentLive =
      convoyIncident !== null &&
      Phaser.Math.Distance.Between(
        convoyIncident.position.x,
        convoyIncident.position.y,
        focusedRecoveryIncident.position.x,
        focusedRecoveryIncident.position.y
      ) <=
        focusedRecoveryIncident.radius + 196;
    const medevacLine =
      convoySupport?.note ??
      convoyIncident?.note ??
      "No evac wagon is stacked close enough to turn this recovery into a living convoy beat yet.";
    if (medevacSupportLive || medevacIncidentLive) {
      return {
        visible: true,
        title: activeRecovery ? "ARMORED EVAC LIVE" : "MEDEVAC WINDOW",
        accent: activeRecovery ? "#bae6fd" : "#dbeafe",
        borderColor: activeRecovery ? 0x38bdf8 : 0x60a5fa,
        bodyColor: activeRecovery ? "#e0f2fe" : "#dbeafe",
        lines: [
          `${focusedRecoveryIncident.label} | ${focusedRecoveryIncident.status === "engaged" ? "Wagon loading under fire" : "Evac lane open"}`,
          activeRecovery ? `${activeRecovery.title} | ${activeRecovery.status}` : focusedRecoveryIncident.note,
          `${convoySupport?.label ?? convoyIncident?.label ?? "Armored wagon"} | ${medevacLine}`,
          `${recoverySupport?.label ?? "Recovery team"} | ${recoverySupport?.note ?? "No dedicated drag team is stacked on the ramp yet."}`,
          `${aidSatchelCount} aid satchel${aidSatchelCount === 1 ? "" : "s"} loose | ${state.frontlineIncidentExtractRelief > 0 ? `Extract relief -${state.frontlineIncidentExtractRelief.toFixed(1)}s` : "Blue can still steal the pullback window"}`
        ]
      };
    }
    return {
      visible: true,
      title: activeRecovery ? "BODY RECOVERY LIVE" : "RECOVERY WINDOW",
      accent: activeRecovery ? "#f5d0fe" : "#ddd6fe",
      borderColor: activeRecovery ? 0xe879f9 : 0xa78bfa,
      bodyColor: activeRecovery ? "#fae8ff" : "#ede9fe",
      lines: [
        `${focusedRecoveryIncident.label} | ${focusedRecoveryIncident.status === "engaged" ? "Under fire" : "Drag window open"}`,
        activeRecovery
          ? `${activeRecovery.title} | ${activeRecovery.status}`
          : focusedRecoveryIncident.note,
        `${recoverySupport?.label ?? "Recovery team"} | ${recoverySupport?.note ?? "No dedicated recovery cordon stacked yet."}`,
        `${aidSatchelCount} aid satchel${aidSatchelCount === 1 ? "" : "s"} loose | ${scarIncidents.filter((incident) => incident.markerState === "bagged").length} dead-strip scars`
      ]
    };
  }

  if (focusedCivilianIncident) {
    const activeEvac = activeActionRead?.incidentId === focusedCivilianIncident.id ? activeActionRead : null;
    const hunterSearch = focusedCivilianIncident.presentationVariant === "hunter-search";
    return {
      visible: true,
      title: hunterSearch ? (activeEvac ? "HUNTER MOVING" : "HUNTER SEARCH") : activeEvac ? "CIVILIANS MOVING" : "CELLAR SHELTER",
      accent: activeEvac ? "#99f6e4" : "#a7f3d0",
      borderColor: activeEvac ? 0x2dd4bf : 0x14b8a6,
      bodyColor: activeEvac ? "#ccfbf1" : "#d1fae5",
      lines: hunterSearch
        ? [
            `${focusedCivilianIncident.label} | ${focusedCivilianIncident.status === "collapsing" ? "Treeline still under pressure" : "Search lane briefly open"}`,
            activeEvac ? `${activeEvac.title} | ${activeEvac.status}` : focusedCivilianIncident.note,
            `${escortSupport?.label ?? "Escort wedge"} | ${escortSupport?.note ?? "No boys screen is stacked on the search lane yet."}`,
            `${recoverySupport?.label ?? "Relief hand"} | ${recoverySupport?.note ?? "No relief kit is staged beside the hunter yet."}`,
            `${state.frontlineIncidentExtractRelief > 0 ? `Extract relief -${state.frontlineIncidentExtractRelief.toFixed(1)}s` : "Son's route note still live"} | quiet voices only`
          ]
        : [
            `${focusedCivilianIncident.label} | ${focusedCivilianIncident.status === "collapsing" ? "House still under pressure" : "Evac lane open"}`,
            activeEvac ? `${activeEvac.title} | ${activeEvac.status}` : focusedCivilianIncident.note,
            `${escortSupport?.label ?? "Escort wedge"} | ${escortSupport?.note ?? "No boys escort screen is stacked on the block yet."}`,
            `${convoySupport?.label ?? "White van"} | ${convoySupport?.note ?? "No van pickup is holding outside the cellar lane."}`,
            `${state.frontlineIncidentExtractRelief > 0 ? `Extract relief -${state.frontlineIncidentExtractRelief.toFixed(1)}s` : "Cellar route note still live"} | disciplined guns only`
          ]
    };
  }

  if (focusedBunkerIncident) {
    const activeBunkerHold = activeActionRead?.incidentId === focusedBunkerIncident.id ? activeActionRead : null;
    const shedHide = focusedBunkerIncident.presentationVariant === "shed-hide";
    const cellarCounterhold = focusedBunkerIncident.presentationVariant === "cellar-counterhold";
    return {
      visible: true,
      title: shedHide
        ? activeBunkerHold
          ? "HIDE WINDOW LIVE"
          : "SHED HIDE"
        : cellarCounterhold
          ? activeBunkerHold
            ? "CELLAR HOLD LIVE"
            : "CELLAR COUNTERHOLD"
          : activeBunkerHold
            ? "BUNKER HOLD LIVE"
            : "CONCRETE CALM",
      accent: shedHide
        ? activeBunkerHold
          ? "#cbd5e1"
          : "#e2e8f0"
        : cellarCounterhold
          ? activeBunkerHold
            ? "#fcd34d"
            : "#fde68a"
          : activeBunkerHold
            ? "#bbf7d0"
            : "#dcfce7",
      borderColor: shedHide
        ? activeBunkerHold
          ? 0x94a3b8
          : 0x64748b
        : cellarCounterhold
          ? activeBunkerHold
            ? 0xf59e0b
            : 0xd97706
          : activeBunkerHold
            ? 0x22c55e
            : 0x4ade80,
      bodyColor: shedHide
        ? activeBunkerHold
          ? "#e2e8f0"
          : "#f8fafc"
        : cellarCounterhold
          ? activeBunkerHold
            ? "#fef3c7"
            : "#fffbeb"
          : activeBunkerHold
            ? "#dcfce7"
            : "#ecfccb",
      lines: shedHide
        ? [
            `${focusedBunkerIncident.label} | ${focusedBunkerIncident.status === "collapsing" ? "Sweep overhead" : "Hide still waiting"}`,
            activeBunkerHold ? `${activeBunkerHold.title} | ${activeBunkerHold.status}` : focusedBunkerIncident.note,
            `${escortSupport?.label ?? "Escort wedge"} | ${escortSupport?.note ?? "No slit watch is stacked on the shed mouth yet."}`,
            `${state.hostileComms.line.length > 0 ? `${state.hostileComms.speaker} | ${state.hostileComms.line}` : "Blue sweep is still combing the houses above the hide."}`,
            `${getNoisePressureRead(raidController.getActiveRoute(), state).title} | ${state.frontlineIncidentExtractRelief > 0 ? `Extract relief -${state.frontlineIncidentExtractRelief.toFixed(1)}s` : "Hold the hide until the sweep drifts deeper"}`
          ]
        : cellarCounterhold
          ? [
              `${focusedBunkerIncident.label} | ${focusedBunkerIncident.status === "collapsing" ? "Reserve shove outside" : "Concrete mouth still live"}`,
              activeBunkerHold ? `${activeBunkerHold.title} | ${activeBunkerHold.status}` : focusedBunkerIncident.note,
              `${escortSupport?.label ?? "Escort wedge"} | ${escortSupport?.note ?? "No boys screen is stacked on the cellar mouth yet."}`,
              `${state.hostileComms.line.length > 0 ? `${state.hostileComms.speaker} | ${state.hostileComms.line}` : "Blue reserve is still probing the dish lane outside the cellar."}`,
              `${state.frontlineIncidentExtractRelief > 0 ? `Extract relief -${state.frontlineIncidentExtractRelief.toFixed(1)}s` : "Route note still live"} | battery handoff still worth banking`
            ]
        : [
            `${focusedBunkerIncident.label} | ${focusedBunkerIncident.status === "collapsing" ? "Reset window open" : "Concrete hold waiting"}`,
            activeBunkerHold ? `${activeBunkerHold.title} | ${activeBunkerHold.status}` : focusedBunkerIncident.note,
            `${escortSupport?.label ?? "Escort wedge"} | ${escortSupport?.note ?? "No boys screen is stacked on the bunker mouth yet."}`,
            coffeeRead
              ? `${coffeeRead.title} | ${coffeeRead.detail}`
              : "Laptop glow, hot cups, and taped mags are still buying one cleaner shove.",
            `${state.soundPressure > 0.48 ? "Lane still loud outside" : "Lane briefly muted"} | ${state.frontlineIncidentExtractRelief > 0 ? `Extract relief -${state.frontlineIncidentExtractRelief.toFixed(1)}s` : "Route sketch still worth bagging"}`
          ]
    };
  }

  if (scarIncidents.length === 0) {
    return {
      visible: false,
      title: "SCAR MEMORY",
      accent: "#bbf7d0",
      borderColor: 0x4ade80,
      bodyColor: "#dcfce7",
      lines: [
        "No worked scar is live yet.",
        "Plant a route flag or recover bodies to make the frontline remember this push."
      ]
    };
  }

  const focusIncident = [...scarIncidents].sort((left, right) => {
    const priorityDelta = getFrontlineScarPriority(left) - getFrontlineScarPriority(right);
    if (priorityDelta !== 0) {
      return priorityDelta;
    }
    return (
      Phaser.Math.Distance.Between(left.position.x, left.position.y, state.player.position.x, state.player.position.y) -
      Phaser.Math.Distance.Between(right.position.x, right.position.y, state.player.position.x, state.player.position.y)
    );
  })[0];
  const flagCount = scarIncidents.filter((incident) => incident.markerState === "planted").length;
  const recoveryCount = scarIncidents.filter((incident) => incident.markerState === "bagged").length;
  const breakingCount = scarIncidents.filter(
    (incident) => incident.markerState === "raising" || incident.territoryState === "breaking"
  ).length;

  let title = "SCAR HOLD";
  let accent = "#bbf7d0";
  let borderColor = 0x4ade80;
  let bodyColor = "#dcfce7";

  if (focusIncident.markerState === "raising" || focusIncident.territoryState === "breaking") {
    title = "SCAR BREAK";
    accent = "#fecaca";
    borderColor = 0xfb7185;
    bodyColor = "#fee2e2";
  } else if (focusIncident.markerState === "bagged" || focusIncident.territoryState === "lost") {
    title = "DEAD STRIP";
    accent = "#fde68a";
    borderColor = 0xf59e0b;
    bodyColor = "#fef3c7";
  }

  return {
    visible: true,
    title,
    accent,
    borderColor,
    bodyColor,
    lines: [
      `${focusIncident.label} | ${getFrontlineTerritoryStatusLabel(focusIncident.territoryState)}`,
      focusIncident.markerNote || focusIncident.territoryNote || focusIncident.note,
      `Scars ${flagCount} flag ${recoveryCount} recover ${breakingCount} break`
    ]
  };
}

function isBurnerCoffeeSupport(
  support: Pick<FrontlineSupportState, "momentumFlavor" | "label" | "zoneLabel" | "note">
): boolean {
  if (support.momentumFlavor === "field-coffee" || support.momentumFlavor === "burner-coffee") {
    return true;
  }

  const source = `${support.label} ${support.zoneLabel} ${support.note}`.toLowerCase();
  return source.includes("coffee") || source.includes("burner") || source.includes("brew") || source.includes("thermos");
}

function getObstacleDoorRect(
  obstacle: (typeof ARENA_OBSTACLES)[number],
  doorway: ArenaDoorway
): { x: number; y: number; width: number; height: number } {
  const depth = doorway.depth ?? 40;

  if (doorway.side === "top") {
    return {
      x: obstacle.x + doorway.offset - doorway.width / 2,
      y: obstacle.y - 4,
      width: doorway.width,
      height: depth + 4
    };
  }

  if (doorway.side === "bottom") {
    return {
      x: obstacle.x + doorway.offset - doorway.width / 2,
      y: obstacle.y + obstacle.height - depth,
      width: doorway.width,
      height: depth + 4
    };
  }

  if (doorway.side === "left") {
    return {
      x: obstacle.x - 4,
      y: obstacle.y + doorway.offset - doorway.width / 2,
      width: depth + 4,
      height: doorway.width
    };
  }

  return {
    x: obstacle.x + obstacle.width - depth,
    y: obstacle.y + doorway.offset - doorway.width / 2,
    width: depth + 4,
    height: doorway.width
  };
}

function getClosestObstacleDoorway(
  obstacle: (typeof ARENA_OBSTACLES)[number],
  referencePoint: { x: number; y: number }
): ArenaDoorway | null {
  const doorways = obstacle.doorways ?? [];

  if (doorways.length === 0) {
    return null;
  }

  let closestDoorway = doorways[0];
  let closestDistance = Number.POSITIVE_INFINITY;

  for (const doorway of doorways) {
    const rect = getObstacleDoorRect(obstacle, doorway);
    const center = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
    const candidateDistance = Phaser.Math.Distance.Between(referencePoint.x, referencePoint.y, center.x, center.y);

    if (candidateDistance < closestDistance) {
      closestDistance = candidateDistance;
      closestDoorway = doorway;
    }
  }

  return closestDoorway;
}

function getObstacleDoorGuideRect(
  obstacle: (typeof ARENA_OBSTACLES)[number],
  doorway: ArenaDoorway
): { x: number; y: number; width: number; height: number } {
  const rect = getObstacleDoorRect(obstacle, doorway);

  if (doorway.side === "top" || doorway.side === "bottom") {
    return {
      x: rect.x - 20,
      y: rect.y - 42,
      width: rect.width + 40,
      height: rect.height + 84
    };
  }

  return {
    x: rect.x - 42,
    y: rect.y - 20,
    width: rect.width + 84,
    height: rect.height + 40
  };
}

function getDoorwayFlowDecals(
  obstacle: (typeof ARENA_OBSTACLES)[number],
  doorway: ArenaDoorway,
  tint: number
): GroundDecalDefinition[] {
  const guideRect = getObstacleDoorGuideRect(obstacle, doorway);
  const horizontal = doorway.side === "left" || doorway.side === "right";
  const forwardSign = doorway.side === "left" || doorway.side === "top" ? 1 : -1;
  const spacing = horizontal ? Math.max(26, guideRect.width * 0.22) : Math.max(26, guideRect.height * 0.22);
  const centerX = guideRect.x + guideRect.width / 2;
  const centerY = guideRect.y + guideRect.height / 2;

  return [-1, 0, 1].map((step, index) => ({
    kind: "extract-lane",
    position: horizontal
      ? { x: centerX + step * spacing * forwardSign, y: centerY }
      : { x: centerX, y: centerY + step * spacing * forwardSign },
    rotation: horizontal ? Math.PI / 2 : 0,
    scaleX: horizontal ? 0.46 : Math.max(0.44, guideRect.width / 132),
    scaleY: horizontal ? Math.max(0.44, guideRect.height / 132) : 0.46,
    alpha: index === 1 ? 0.24 : 0.16,
    tint,
    depthOffset: -0.074
  }));
}

function getDoorwayInteriorNormal(doorway: ArenaDoorway): { x: number; y: number } {
  if (doorway.side === "top") {
    return { x: 0, y: 1 };
  }

  if (doorway.side === "bottom") {
    return { x: 0, y: -1 };
  }

  if (doorway.side === "left") {
    return { x: 1, y: 0 };
  }

  return { x: -1, y: 0 };
}

function getObstacleInteriorCoverPoint(
  obstacle: (typeof ARENA_OBSTACLES)[number],
  doorway: ArenaDoorway,
  side: "left" | "right"
): { x: number; y: number } {
  const rect = getObstacleDoorRect(obstacle, doorway);
  const doorwayCenter = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  const interiorNormal = getDoorwayInteriorNormal(doorway);
  const lateral = { x: -interiorNormal.y, y: interiorNormal.x };
  const depth =
    doorway.side === "top" || doorway.side === "bottom" ? obstacle.height * 0.26 : obstacle.width * 0.26;
  const lateralReach =
    doorway.side === "top" || doorway.side === "bottom" ? obstacle.width * 0.28 : obstacle.height * 0.28;
  const sideDirection = side === "left" ? -1 : 1;

  return {
    x: Phaser.Math.Clamp(
      doorwayCenter.x + interiorNormal.x * depth + lateral.x * lateralReach * sideDirection,
      obstacle.x + 24,
      obstacle.x + obstacle.width - 24
    ),
    y: Phaser.Math.Clamp(
      doorwayCenter.y + interiorNormal.y * depth + lateral.y * lateralReach * sideDirection,
      obstacle.y + 24,
      obstacle.y + obstacle.height - 24
    )
  };
}

function getSupplyCacheTexture(kind: RaidRouteDefinition["supplyCaches"][number]["kind"]): string {
  if (kind === "medical") {
    return getPropTextureKey("medical-case");
  }

  if (kind === "ammo") {
    return getPropTextureKey("ammo-pallet");
  }

  return getPropTextureKey("tool-locker");
}

function getPocketAngle(routeId: RaidRouteId, index: number): number {
  if (routeId === "broken-signal") {
    return -0.44 + index * 0.06;
  }

  if (routeId === "sundered-run") {
    return 0.28 + index * 0.08;
  }

  return 0.12 + index * 0.07;
}

function getPocketDecals(
  route: RaidRouteDefinition,
  pocket: RaidRouteDefinition["combatPockets"][number],
  index: number
): GroundDecalDefinition[] {
  const angle = getPocketAngle(route.id, index);
  const laneOffset = pocket.radius * 0.22;
  const sideOffset = pocket.radius * 0.5;
  const routeTint =
    route.id === "broken-signal" ? 0xcbd5e1 : route.id === "sundered-run" ? 0xb45309 : 0x64748b;

  return [
    {
      kind: route.id === "broken-signal" ? "grate" : "tarp",
      position: {
        x: pocket.position.x - Math.cos(angle) * laneOffset,
        y: pocket.position.y - Math.sin(angle) * laneOffset * 0.7
      },
      rotation: angle,
      scale: 0.9 + pocket.radius / 190,
      alpha: 0.46,
      tint: routeTint,
      depthOffset: -0.09
    },
    {
      kind: "chevrons",
      position: {
        x: pocket.position.x + Math.cos(angle) * (pocket.radius * 0.32),
        y: pocket.position.y + Math.sin(angle) * (pocket.radius * 0.18)
      },
      rotation: angle + 0.04,
      scale: 0.72 + pocket.radius / 260,
      alpha: 0.42,
      tint: route.sceneTheme.accentColor,
      depthOffset: -0.08
    },
    {
      kind: index % 2 === 0 ? "cables" : "oil",
      position: {
        x: pocket.position.x + Math.cos(angle + Math.PI / 2) * sideOffset,
        y: pocket.position.y + Math.sin(angle + Math.PI / 2) * sideOffset * 0.72
      },
      rotation: angle + 1.12,
      scale: 0.74 + pocket.radius / 290,
      alpha: 0.34,
      tint: route.id === "sundered-run" ? 0x9a3412 : 0x475569,
      depthOffset: -0.07
    },
    {
      kind: index % 2 === 0 ? "oil" : "cables",
      position: {
        x: pocket.position.x + Math.cos(angle - Math.PI / 2) * (sideOffset * 0.82),
        y: pocket.position.y + Math.sin(angle - Math.PI / 2) * sideOffset * 0.58
      },
      rotation: angle - 0.86,
      scale: 0.66 + pocket.radius / 320,
      alpha: 0.28,
      tint: 0x334155,
      depthOffset: -0.065
    }
  ];
}

function getRouteSurfaceDecals(route: RaidRouteDefinition): GroundDecalDefinition[] {
  if (route.id === "crosswind-docks") {
    return [
      {
        kind: "dock-plates",
        position: { x: 470, y: 760 },
        rotation: 0,
        scale: 1.1,
        alpha: 0.38,
        tint: 0x7c8fa3,
        depthOffset: -0.1
      },
      {
        kind: "dock-plates",
        position: { x: 1220, y: 760 },
        rotation: 0.04,
        scale: 1.24,
        alpha: 0.34,
        tint: 0x7c8fa3,
        depthOffset: -0.1
      },
      {
        kind: "dock-plates",
        position: { x: 1890, y: 760 },
        rotation: 0.02,
        scale: 1.18,
        alpha: 0.4,
        tint: 0x9db5c7,
        depthOffset: -0.1
      },
      {
        kind: "chevrons",
        position: { x: 2060, y: 760 },
        rotation: 0,
        scale: 1.12,
        alpha: 0.28,
        tint: route.sceneTheme.accentColor,
        depthOffset: -0.09
      },
      {
        kind: "cables",
        position: { x: 760, y: 1120 },
        rotation: -0.08,
        scale: 1.14,
        alpha: 0.28,
        tint: 0x475569,
        depthOffset: -0.09
      },
      {
        kind: "dock-plates",
        position: { x: 2580, y: 760 },
        rotation: 0.03,
        scale: 1.3,
        alpha: 0.34,
        tint: 0x9db5c7,
        depthOffset: -0.1
      },
      {
        kind: "dock-plates",
        position: { x: 2980, y: 760 },
        rotation: 0.01,
        scale: 1.18,
        alpha: 0.32,
        tint: 0xb6c9d8,
        depthOffset: -0.1
      },
      {
        kind: "chevrons",
        position: { x: 2900, y: 700 },
        rotation: 0.04,
        scale: 1.06,
        alpha: 0.26,
        tint: route.sceneTheme.accentColor,
        depthOffset: -0.09
      },
      {
        kind: "cables",
        position: { x: 2520, y: 1180 },
        rotation: 0.12,
        scale: 1.08,
        alpha: 0.26,
        tint: 0x475569,
        depthOffset: -0.09
      }
    ];
  }

  if (route.id === "broken-signal") {
    return [
      {
        kind: "relay-grid",
        position: { x: 760, y: 320 },
        rotation: 0.04,
        scale: 1.04,
        alpha: 0.42,
        tint: 0xdbe7f3,
        depthOffset: -0.1
      },
      {
        kind: "relay-grid",
        position: { x: 1450, y: 540 },
        rotation: -0.46,
        scale: 1.2,
        alpha: 0.34,
        tint: 0xbfd0df,
        depthOffset: -0.1
      },
      {
        kind: "relay-grid",
        position: { x: 2040, y: 280 },
        rotation: 0.14,
        scale: 1.08,
        alpha: 0.4,
        tint: 0xdbe7f3,
        depthOffset: -0.1
      },
      {
        kind: "cables",
        position: { x: 1210, y: 330 },
        rotation: -0.14,
        scale: 1.1,
        alpha: 0.3,
        tint: 0x7dd3fc,
        depthOffset: -0.09
      },
      {
        kind: "oil",
        position: { x: 1850, y: 830 },
        rotation: 0.18,
        scale: 1.06,
        alpha: 0.24,
        tint: 0x334155,
        depthOffset: -0.09
      },
      {
        kind: "relay-grid",
        position: { x: 2470, y: 520 },
        rotation: 0.1,
        scale: 1.16,
        alpha: 0.32,
        tint: 0xdbe7f3,
        depthOffset: -0.1
      },
      {
        kind: "relay-grid",
        position: { x: 2860, y: 980 },
        rotation: 0.02,
        scale: 1.14,
        alpha: 0.34,
        tint: 0xcbd5e1,
        depthOffset: -0.1
      },
      {
        kind: "cables",
        position: { x: 2570, y: 1090 },
        rotation: 0.2,
        scale: 1.04,
        alpha: 0.28,
        tint: 0x7dd3fc,
        depthOffset: -0.09
      }
    ];
  }

  return [
    {
      kind: "freight-ruts",
      position: { x: 520, y: 930 },
      rotation: -0.14,
      scale: 1.18,
      alpha: 0.4,
      tint: 0x9a6a43,
      depthOffset: -0.1
    },
    {
      kind: "freight-ruts",
      position: { x: 1450, y: 930 },
      rotation: 0.18,
      scale: 1.24,
      alpha: 0.36,
      tint: 0x8b5e3c,
      depthOffset: -0.1
    },
    {
      kind: "freight-ruts",
      position: { x: 2040, y: 1120 },
      rotation: 1.02,
      scale: 1.06,
      alpha: 0.4,
      tint: 0xa36d43,
      depthOffset: -0.1
    },
    {
      kind: "chevrons",
      position: { x: 2080, y: 760 },
      rotation: 1.02,
      scale: 1,
      alpha: 0.24,
      tint: route.sceneTheme.accentColor,
      depthOffset: -0.09
    },
      {
        kind: "oil",
        position: { x: 1660, y: 1180 },
        rotation: 0.12,
        scale: 1.04,
        alpha: 0.22,
        tint: 0x3b2a24,
        depthOffset: -0.09
      },
      {
        kind: "freight-ruts",
        position: { x: 2470, y: 1180 },
        rotation: 0.24,
        scale: 1.22,
        alpha: 0.34,
        tint: 0xa36d43,
        depthOffset: -0.1
      },
      {
        kind: "freight-ruts",
        position: { x: 2890, y: 1550 },
        rotation: 0.82,
        scale: 1.16,
        alpha: 0.36,
        tint: 0xb07a4d,
        depthOffset: -0.1
      },
      {
        kind: "chevrons",
        position: { x: 2940, y: 1540 },
        rotation: 0.84,
        scale: 1.08,
        alpha: 0.24,
        tint: route.sceneTheme.accentColor,
        depthOffset: -0.09
      }
    ];
}

function getObstacleSurfaceDecals(
  obstacle: (typeof ARENA_OBSTACLES)[number],
  route: RaidRouteDefinition
): GroundDecalDefinition[] {
  const centerX = obstacle.x + obstacle.width / 2;
  const centerY = obstacle.y + obstacle.height / 2;
  const roofScaleX = Math.max(0.84, (obstacle.width - 24) / 96);
  const roofScaleY = Math.max(0.8, (obstacle.height - 28) / 72);
  const bayScaleX = Math.max(0.62, (obstacle.width - 92) / 96);
  const bayScaleY = Math.max(0.56, (obstacle.height - 94) / 72);
  const roofTint = route.id === "broken-signal" ? 0xb8cad8 : route.id === "sundered-run" ? 0x8f6c51 : 0x6f8ca3;
  const hatchTint = route.id === "broken-signal" ? 0xdbeafe : route.id === "sundered-run" ? 0xf59e0b : 0x7dd3fc;
  const bayTint = route.id === "broken-signal" ? 0x7c93a8 : route.id === "sundered-run" ? 0x7c2d12 : 0x475569;

  return [
    {
      kind: "roof-panels",
      position: { x: centerX, y: centerY },
      rotation: obstacle.id % 2 === 0 ? -0.02 : 0.02,
      scaleX: roofScaleX,
      scaleY: roofScaleY,
      alpha: 0.32,
      tint: roofTint,
      depthOffset: -0.082
    },
    {
      kind: "service-bay",
      position: {
        x: centerX + (obstacle.id % 2 === 0 ? -10 : 10),
        y: centerY + 10
      },
      rotation: obstacle.id % 2 === 0 ? -0.014 : 0.014,
      scaleX: bayScaleX,
      scaleY: bayScaleY,
      alpha: 0.24,
      tint: bayTint,
      depthOffset: -0.078
    },
    {
      kind: "roof-hatches",
      position: {
        x: obstacle.x + obstacle.width * 0.72,
        y: obstacle.y + obstacle.height * 0.34
      },
      rotation: obstacle.id % 2 === 0 ? -0.05 : 0.05,
      scaleX: Math.min(1.28, 0.84 + obstacle.width / 360),
      scaleY: Math.min(1.12, 0.8 + obstacle.height / 260),
      alpha: 0.56,
      tint: hatchTint,
      depthOffset: -0.074
    }
  ];
}

function getAmbientOverlays(route: RaidRouteDefinition): AmbientOverlayDefinition[] {
  if (route.id === "crosswind-docks") {
    return [
      {
        kind: "beam",
        position: { x: 1760, y: 520 },
        width: 280,
        height: 72,
        color: 0x7dd3fc,
        alpha: 0.12,
        rotation: 0.56,
        depthBias: -0.032,
        blendMode: Phaser.BlendModes.ADD,
        pulse: { scale: 1.08, duration: 1900, phase: 220 },
        drift: { x: 24, y: -10, duration: 2600, phase: 140 }
      },
      {
        kind: "beam",
        position: { x: 2080, y: 760 },
        width: 212,
        height: 54,
        color: 0xf59e0b,
        alpha: 0.12,
        rotation: 0,
        depthBias: -0.031,
        blendMode: Phaser.BlendModes.ADD,
        pulse: { scale: 1.12, duration: 1450, phase: 90 }
      },
      {
        kind: "ellipse",
        position: { x: 2180, y: 760 },
        width: 212,
        height: 136,
        color: 0x38bdf8,
        alpha: 0.1,
        rotation: 0,
        depthBias: -0.03,
        blendMode: Phaser.BlendModes.ADD,
        strokeColor: 0xe0f2fe,
        strokeAlpha: 0.22,
        strokeWidth: 2,
        pulse: { scale: 1.12, duration: 1500, phase: 310 }
      },
      {
        kind: "beam",
        position: { x: 2870, y: 640 },
        width: 260,
        height: 60,
        color: 0xf59e0b,
        alpha: 0.1,
        rotation: 0.06,
        depthBias: -0.031,
        blendMode: Phaser.BlendModes.ADD,
        pulse: { scale: 1.08, duration: 1600, phase: 180 },
        drift: { x: -18, y: 10, duration: 2500, phase: 120 }
      },
      {
        kind: "ellipse",
        position: { x: 2920, y: 660 },
        width: 240,
        height: 140,
        color: 0x38bdf8,
        alpha: 0.09,
        rotation: 0.04,
        depthBias: -0.03,
        blendMode: Phaser.BlendModes.ADD,
        strokeColor: 0xe0f2fe,
        strokeAlpha: 0.18,
        strokeWidth: 2,
        pulse: { scale: 1.1, duration: 1650, phase: 260 }
      }
    ];
  }

  if (route.id === "broken-signal") {
    return [
      {
        kind: "beam",
        position: { x: 980, y: 220 },
        width: 246,
        height: 58,
        color: 0x7dd3fc,
        alpha: 0.1,
        rotation: 0.18,
        depthBias: -0.032,
        blendMode: Phaser.BlendModes.ADD,
        pulse: { scale: 1.06, duration: 1800, phase: 80 },
        drift: { x: 16, y: 10, duration: 2400, phase: 200 }
      },
      {
        kind: "beam",
        position: { x: 2140, y: 170 },
        width: 238,
        height: 54,
        color: 0xfacc15,
        alpha: 0.1,
        rotation: 0.2,
        depthBias: -0.031,
        blendMode: Phaser.BlendModes.ADD,
        pulse: { scale: 1.08, duration: 1650, phase: 440 },
        drift: { x: -14, y: 14, duration: 2100, phase: 120 }
      },
      {
        kind: "ellipse",
        position: { x: 1450, y: 540 },
        width: 204,
        height: 116,
        color: 0x7dd3fc,
        alpha: 0.08,
        rotation: -0.46,
        depthBias: -0.03,
        blendMode: Phaser.BlendModes.ADD,
        strokeColor: 0xe0f2fe,
        strokeAlpha: 0.18,
        strokeWidth: 2,
        pulse: { scale: 1.1, duration: 1700, phase: 260 }
      },
      {
        kind: "beam",
        position: { x: 2480, y: 520 },
        width: 250,
        height: 56,
        color: 0x7dd3fc,
        alpha: 0.09,
        rotation: 0.12,
        depthBias: -0.031,
        blendMode: Phaser.BlendModes.ADD,
        pulse: { scale: 1.08, duration: 1750, phase: 340 }
      },
      {
        kind: "ellipse",
        position: { x: 2890, y: 980 },
        width: 226,
        height: 132,
        color: 0xfacc15,
        alpha: 0.08,
        rotation: 0.06,
        depthBias: -0.03,
        blendMode: Phaser.BlendModes.ADD,
        strokeColor: 0xfef3c7,
        strokeAlpha: 0.16,
        strokeWidth: 2,
        pulse: { scale: 1.1, duration: 1600, phase: 240 }
      }
    ];
  }

  return [
    {
      kind: "beam",
      position: { x: 1510, y: 980 },
      width: 220,
      height: 62,
      color: 0x4ade80,
      alpha: 0.1,
      rotation: 0.08,
      depthBias: -0.031,
      blendMode: Phaser.BlendModes.ADD,
      pulse: { scale: 1.08, duration: 1400, phase: 120 }
    },
    {
      kind: "ellipse",
      position: { x: 2140, y: 1260 },
      width: 224,
      height: 148,
      color: 0xf97316,
      alpha: 0.1,
      rotation: 0.08,
      depthBias: -0.03,
      blendMode: Phaser.BlendModes.ADD,
      strokeColor: 0xfef3c7,
      strokeAlpha: 0.2,
      strokeWidth: 2,
      pulse: { scale: 1.12, duration: 1350, phase: 260 }
    },
      {
        kind: "beam",
        position: { x: 1760, y: 1120 },
        width: 260,
        height: 70,
      color: 0xfacc15,
      alpha: 0.11,
      rotation: -1.06,
      depthBias: -0.032,
        blendMode: Phaser.BlendModes.ADD,
        pulse: { scale: 1.06, duration: 1700, phase: 320 },
        drift: { x: 18, y: -16, duration: 2200, phase: 60 }
      },
      {
        kind: "beam",
        position: { x: 2480, y: 1380 },
        width: 240,
        height: 64,
        color: 0xf97316,
        alpha: 0.09,
        rotation: 0.24,
        depthBias: -0.031,
        blendMode: Phaser.BlendModes.ADD,
        pulse: { scale: 1.08, duration: 1550, phase: 220 }
      },
      {
        kind: "ellipse",
        position: { x: 2960, y: 1540 },
        width: 240,
        height: 152,
        color: 0xf97316,
        alpha: 0.08,
        rotation: 0.12,
        depthBias: -0.03,
        blendMode: Phaser.BlendModes.ADD,
        strokeColor: 0xfef3c7,
        strokeAlpha: 0.18,
        strokeWidth: 2,
        pulse: { scale: 1.1, duration: 1500, phase: 280 }
      }
    ];
}

function getPressureStroke(pressureType: EnemyState["pressureType"]): { color: number; alpha: number } | null {
  if (pressureType === "pinned") {
    return { color: 0x7dd3fc, alpha: 0.86 };
  }

  if (pressureType === "suppressed") {
    return { color: 0x60a5fa, alpha: 0.82 };
  }

  if (pressureType === "staggered") {
    return { color: 0xfbbf24, alpha: 0.9 };
  }

  return null;
}

type CombatantPoseId = "ready" | "covering" | "suppressed" | "pinned" | "staggered" | "pushing" | "retreating";

interface CombatantRenderPose {
  id: CombatantPoseId;
  offsetX: number;
  offsetY: number;
  rotationOffset: number;
  scaleX: number;
  scaleY: number;
  alphaMultiplier: number;
  muzzleOffset: number;
  tracerLengthMultiplier: number;
}

function getCombatantRenderPose(
  facing: { x: number; y: number },
  poseId: CombatantPoseId,
  timeMs: number,
  varianceSeed = 0
): CombatantRenderPose {
  const facingLength = Math.hypot(facing.x, facing.y);
  const normalizedFacing = facingLength > 0.001 ? { x: facing.x / facingLength, y: facing.y / facingLength } : { x: 1, y: 0 };
  const lateral = rotateVector(normalizedFacing, Math.PI / 2);
  const sway = Math.sin(timeMs / 140 + varianceSeed * 1.73);
  const bob = Math.cos(timeMs / 190 + varianceSeed * 1.11);

  if (poseId === "pinned") {
    return {
      id: poseId,
      offsetX: -normalizedFacing.x * 3.4 + lateral.x * sway * 0.9,
      offsetY: -normalizedFacing.y * 3.4 + lateral.y * sway * 0.9,
      rotationOffset: sway * 0.08,
      scaleX: 1.08,
      scaleY: 0.72,
      alphaMultiplier: 0.92,
      muzzleOffset: 4.2,
      tracerLengthMultiplier: 0.56
    };
  }

  if (poseId === "suppressed" || poseId === "covering") {
    return {
      id: poseId,
      offsetX: -normalizedFacing.x * 2.1 + lateral.x * sway * 0.6,
      offsetY: -normalizedFacing.y * 2.1 + lateral.y * sway * 0.6,
      rotationOffset: sway * 0.04,
      scaleX: 1.04,
      scaleY: 0.82,
      alphaMultiplier: 0.95,
      muzzleOffset: 4.8,
      tracerLengthMultiplier: 0.72
    };
  }

  if (poseId === "staggered" || poseId === "retreating") {
    return {
      id: poseId,
      offsetX: -normalizedFacing.x * 1.4 + lateral.x * sway * 1.3,
      offsetY: -normalizedFacing.y * 1.4 + lateral.y * sway * 1.3,
      rotationOffset: sway * 0.14,
      scaleX: 0.94,
      scaleY: 0.92,
      alphaMultiplier: 0.86,
      muzzleOffset: 5.1,
      tracerLengthMultiplier: 0.7
    };
  }

  if (poseId === "pushing") {
    return {
      id: poseId,
      offsetX: normalizedFacing.x * (2.2 + bob * 0.6),
      offsetY: normalizedFacing.y * (2.2 + bob * 0.6),
      rotationOffset: sway * 0.03,
      scaleX: 0.98,
      scaleY: 1.04,
      alphaMultiplier: 1,
      muzzleOffset: 7.4,
      tracerLengthMultiplier: 1.12
    };
  }

  return {
    id: poseId,
    offsetX: lateral.x * sway * 0.25,
    offsetY: lateral.y * sway * 0.25,
    rotationOffset: sway * 0.02,
    scaleX: 1,
    scaleY: 1,
    alphaMultiplier: 1,
    muzzleOffset: 6,
    tracerLengthMultiplier: 1
  };
}

function getEnemyRenderPose(enemy: EnemyState, timeMs: number): CombatantRenderPose {
  const poseId: CombatantPoseId =
    enemy.pressureType === "pinned"
      ? "pinned"
      : enemy.pressureType === "suppressed"
        ? "suppressed"
        : enemy.pressureType === "staggered"
          ? "staggered"
          : enemy.awareness === "engaged"
            ? "pushing"
            : "ready";
  return getCombatantRenderPose(enemy.facing, poseId, timeMs, enemy.id);
}

function getFriendlyCombatantRenderPose(
  combatant: {
    id: number;
    facing: { x: number; y: number };
    pressureType: EnemyState["pressureType"];
    awareness: EnemyState["awareness"];
  },
  timeMs: number
): CombatantRenderPose {
  const poseId: CombatantPoseId =
    combatant.pressureType === "pinned"
      ? "pinned"
      : combatant.pressureType === "suppressed"
        ? "suppressed"
        : combatant.pressureType === "staggered"
          ? "staggered"
          : combatant.awareness === "engaged"
            ? "pushing"
            : "ready";
  return getCombatantRenderPose(combatant.facing, poseId, timeMs, combatant.id);
}

function getSupportRenderPose(support: FrontlineSupportState, timeMs: number): CombatantRenderPose {
  const poseId: CombatantPoseId =
    support.status === "retreating"
      ? "retreating"
      : support.pushTimer > 0
        ? "pushing"
        : support.status === "covering"
          ? "covering"
          : support.contactTimer > 0 && support.status === "holding"
            ? "suppressed"
            : "ready";
  return getCombatantRenderPose(support.facing, poseId, timeMs, support.id);
}

function getIncidentRenderPose(incident: FrontlineIncidentState, timeMs: number): CombatantRenderPose {
  const poseId: CombatantPoseId =
    incident.status === "routed"
      ? "retreating"
      : incident.status === "collapsing"
        ? "staggered"
        : incident.status === "engaged"
          ? "pushing"
          : incident.contactTimer > 0
            ? "covering"
            : "ready";
  return getCombatantRenderPose(incident.facing, poseId, timeMs, incident.id);
}

function getLootTint(category: ContrabandCategoryId): number {
  if (category === "intel") {
    return 0x7dd3fc;
  }

  if (category === "medical") {
    return 0x4ade80;
  }

  if (category === "munitions") {
    return 0x60a5fa;
  }

  return 0xf59e0b;
}

function getFrontlineSupportTexture(kind: FrontlineSupportState["kind"]): string {
  if (kind === "fireteam") {
    return "frontline-fireteam";
  }

  if (kind === "convoy") {
    return "frontline-convoy";
  }

  if (kind === "recovery") {
    return "frontline-recovery";
  }

  return "frontline-fireteam";
}

function getFrontlineIncidentTexture(kind: FrontlineIncidentState["kind"]): string {
  if (kind === "firefight") {
    return "frontline-fireteam";
  }

  if (kind === "convoy") {
    return "frontline-convoy";
  }

  if (kind === "casualty" || kind === "civilian" || kind === "bunker") {
    return "frontline-recovery";
  }

  return "frontline-fireteam";
}

function getCombatantTextureKey(archetypeId: EnemyArchetypeId, tapeId: EnemyTapeId = "blue"): string {
  return getEnemyCombatantTextureKey(archetypeId, tapeId);
}

function getFriendlyCombatantKey(archetypeId: EnemyArchetypeId): string {
  return getFriendlyCombatantTextureKey(archetypeId);
}

function getTownWarSoldierArchetype(role: TownWarRoleId): EnemyArchetypeId {
  if (role === "builder" || role === "medic") {
    return "skirmisher";
  }

  if (role === "suppressor" || role === "defender") {
    return "rifleman";
  }

  return "rusher";
}

function getTownWarSoldierSpriteKey(soldier: TownWarSoldierState): string {
  const archetypeId = getTownWarSoldierArchetype(soldier.role);
  return soldier.faction === TOWN_WAR_PLAYER_FACTION ? getFriendlyCombatantKey(archetypeId) : getCombatantTextureKey(archetypeId, "blue");
}

function getTownWarSoldierRenderId(id: string): number {
  return [...id].reduce((hash, char) => hash + char.charCodeAt(0), 0);
}

function getNearestTownWarEnemy(
  origin: Vec2,
  faction: TownWarFactionId,
  combatants: ReadonlyArray<{ faction: TownWarFactionId; health: { current: number }; position: Vec2 }>
): { faction: TownWarFactionId; health: { current: number }; position: Vec2 } | null {
  return combatants.reduce<{ faction: TownWarFactionId; health: { current: number }; position: Vec2 } | null>((best, combatant) => {
    if (combatant.faction === faction || combatant.health.current <= 0) {
      return best;
    }
    if (!best) {
      return combatant;
    }
    return Math.hypot(combatant.position.x - origin.x, combatant.position.y - origin.y) <
      Math.hypot(best.position.x - origin.x, best.position.y - origin.y)
      ? combatant
      : best;
  }, null);
}

function normalizeTownWarFacing(from: Vec2, to: Vec2): Vec2 | null {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  return length > 0.01 ? { x: dx / length, y: dy / length } : null;
}

function getTownWarSoldierFacing(
  soldier: TownWarSoldierState,
  coverSlots: ReadonlyArray<{ id: string; sourceKind: string; position: Vec2; facingAngleRadians: number; occupiedBySoldierId?: string | null }>,
  combatants: ReadonlyArray<{ faction: TownWarFactionId; health: { current: number }; position: Vec2 }>
): Vec2 {
  const coverSlot = soldier.coverIntent.coverSlotId ? coverSlots.find((slot) => slot.id === soldier.coverIntent.coverSlotId) ?? null : null;
  if (soldier.coverIntent.state === "occupying" && coverSlot?.sourceKind === "trench" && coverSlot.occupiedBySoldierId === soldier.id) {
    const nearestEnemy = getNearestTownWarEnemy(coverSlot.position, soldier.faction, combatants);
    const enemyFacing = nearestEnemy ? normalizeTownWarFacing(coverSlot.position, nearestEnemy.position) : null;
    if (enemyFacing) {
      return enemyFacing;
    }

    const defaultFacing = soldier.faction === TOWN_WAR_PLAYER_FACTION ? { x: -1, y: 0 } : { x: 1, y: 0 };
    const normalA = { x: -Math.sin(coverSlot.facingAngleRadians), y: Math.cos(coverSlot.facingAngleRadians) };
    const normalB = { x: -normalA.x, y: -normalA.y };
    return normalA.x * defaultFacing.x + normalA.y * defaultFacing.y >= normalB.x * defaultFacing.x + normalB.y * defaultFacing.y
      ? normalA
      : normalB;
  }

  const targetPosition = soldier.task.targetPosition;
  if (targetPosition) {
    const targetFacing = normalizeTownWarFacing(soldier.position, targetPosition);
    if (targetFacing) {
      return targetFacing;
    }
  }

  if (coverSlot) {
    return { x: Math.cos(coverSlot.facingAngleRadians), y: Math.sin(coverSlot.facingAngleRadians) };
  }

  return soldier.faction === TOWN_WAR_PLAYER_FACTION ? { x: -1, y: 0 } : { x: 1, y: 0 };
}

function getTownWarSoldierWeaponId(soldier: TownWarSoldierState): keyof typeof WEAPONS {
  if (soldier.role === "suppressor") {
    return "pkm";
  }
  if (soldier.role === "defender") {
    return "short-mosin";
  }
  return "worn-ak";
}

function getTownWarSoldierAwareness(soldier: TownWarSoldierState): EnemyState["awareness"] {
  return soldier.task.kind === "attack" || soldier.task.kind === "suppress" || soldier.tacticalIntent.state === "suppress-area"
    ? "engaged"
    : "investigating";
}

function getTownWarSoldierPressureType(soldier: TownWarSoldierState): EnemyState["pressureType"] {
  const pressureRatio = soldier.morale.pressure / Math.max(1, soldier.morale.maxPressure);
  if (pressureRatio >= 0.72) {
    return "pinned";
  }

  if (pressureRatio >= 0.44) {
    return "suppressed";
  }

  return null;
}

function getTownWarSoldierTint(soldier: TownWarSoldierState): number {
  if (soldier.health.current <= 0) {
    return 0x94a3b8;
  }

  if (soldier.task.kind === "build") {
    return 0xfde68a;
  }

  if (soldier.coverIntent.state === "occupying" && soldier.coverIntent.coverSlotId) {
    return 0xbbf7d0;
  }

  if (soldier.task.kind === "heal") {
    return 0x86efac;
  }

  if (soldier.task.kind === "resupply") {
    return 0xbfdbfe;
  }

  return 0xffffff;
}

function isTownWarPlayerFaction(faction: TownWarFactionId | null): boolean {
  return faction === TOWN_WAR_PLAYER_FACTION;
}

function getTownWarFactionColor(faction: TownWarFactionId | null): number {
  return isTownWarPlayerFaction(faction) ? 0xdc2626 : faction === TOWN_WAR_ENEMY_FACTION ? 0x2563eb : 0xd1d5db;
}

function getTownWarFactionAccent(faction: TownWarFactionId | null): number {
  return isTownWarPlayerFaction(faction) ? 0xfacc15 : faction === TOWN_WAR_ENEMY_FACTION ? 0x93c5fd : 0xe5e7eb;
}

function getTownWarFactionTextColor(faction: TownWarFactionId | null): string {
  return isTownWarPlayerFaction(faction) ? "#fde68a" : faction === TOWN_WAR_ENEMY_FACTION ? "#bfdbfe" : "#e5e7eb";
}

function getTownWarEnemyTextColor(faction: TownWarFactionId | null): string {
  return isTownWarPlayerFaction(faction) ? "#fde68a" : "#dbeafe";
}

function getFrontlineModifierAnchors(route: RaidRouteDefinition): FrontlineModifierAnchor[] {
  return route.combatPockets.map((pocket, index) => ({
    position: pocket.position,
    angle: getPocketAngle(route.id, index)
  }));
}

function getFrontlineModifierDecals(
  route: RaidRouteDefinition,
  sector: FrontlineSectorState | null
): GroundDecalDefinition[] {
  if (!sector) {
    return [];
  }

  const anchors = getFrontlineModifierAnchors(route);
  const scarScale = sector.scars >= 72 ? 1.12 : sector.scars >= 48 ? 1.02 : 0.94;

  if (sector.control === "lost") {
    return anchors.flatMap((anchor, index) => [
      {
        kind: "extract-lane",
        position: {
          x: anchor.position.x + Math.cos(anchor.angle) * 34,
          y: anchor.position.y + Math.sin(anchor.angle) * 26
        },
        rotation: anchor.angle,
        scale: scarScale + index * 0.04,
        alpha: 0.28,
        tint: route.id === "broken-signal" ? 0xf97316 : 0xf59e0b,
        depthOffset: -0.085
      },
      {
        kind: index % 2 === 0 ? "oil" : "cables",
        position: {
          x: anchor.position.x - Math.cos(anchor.angle) * 26,
          y: anchor.position.y - Math.sin(anchor.angle) * 18
        },
        rotation: anchor.angle + 0.8,
        scale: 0.96 + index * 0.05,
        alpha: 0.34,
        tint: route.id === "sundered-run" ? 0x45210f : 0x1f2937,
        depthOffset: -0.082
      }
    ]);
  }

  if (sector.control === "contested") {
    return anchors.flatMap((anchor, index) => [
      {
        kind: route.id === "broken-signal" ? "signal-pad" : "ops-grid",
        position: {
          x: anchor.position.x - Math.cos(anchor.angle) * 18,
          y: anchor.position.y - Math.sin(anchor.angle) * 12
        },
        rotation: anchor.angle,
        scale: 0.84 + index * 0.04,
        alpha: 0.26,
        tint: route.id === "sundered-run" ? 0xf59e0b : 0x93c5fd,
        depthOffset: -0.084
      },
      {
        kind: "extract-lane",
        position: {
          x: anchor.position.x + Math.cos(anchor.angle) * 22,
          y: anchor.position.y + Math.sin(anchor.angle) * 16
        },
        rotation: anchor.angle + 0.02,
        scale: 0.82 + index * 0.05,
        alpha: 0.2,
        tint: 0xfacc15,
        depthOffset: -0.083
      }
    ]);
  }

  return anchors.flatMap((anchor, index) => [
    {
      kind: route.id === "sundered-run" ? "med-bay" : "signal-pad",
      position: {
        x: anchor.position.x - Math.cos(anchor.angle) * 14,
        y: anchor.position.y - Math.sin(anchor.angle) * 10
      },
      rotation: anchor.angle - 0.02,
      scale: 0.8 + index * 0.04,
      alpha: 0.24,
      tint: route.id === "crosswind-docks" ? 0x7dd3fc : 0x86efac,
      depthOffset: -0.084
    },
    {
      kind: "extract-lane",
      position: {
        x: anchor.position.x + Math.cos(anchor.angle) * 18,
        y: anchor.position.y + Math.sin(anchor.angle) * 14
      },
      rotation: anchor.angle,
      scale: 0.78 + index * 0.05,
      alpha: 0.16,
      tint: 0x4ade80,
      depthOffset: -0.083
    }
  ]);
}

function getFrontlineModifierProps(route: RaidRouteDefinition, sector: FrontlineSectorState | null): PropPlacement[] {
  if (!sector) {
    return [];
  }

  const anchors = getFrontlineModifierAnchors(route);

  if (sector.control === "lost") {
    return anchors.flatMap((anchor, index) => {
      const tangent = anchor.angle + Math.PI / 2;
      return [
        {
          kind: route.id === "crosswind-docks" ? "checkpoint-gate" : "scrap-barricade",
          position: {
            x: anchor.position.x + Math.cos(anchor.angle) * 56,
            y: anchor.position.y + Math.sin(anchor.angle) * 40
          },
          rotation: anchor.angle + Math.PI / 2,
          scale: 0.88 + index * 0.04,
          alpha: 0.96,
          tint: route.id === "broken-signal" ? 0xc08457 : 0xa16207
        },
        {
          kind: "razorwire-coil",
          position: {
            x: anchor.position.x + Math.cos(tangent) * 38,
            y: anchor.position.y + Math.sin(tangent) * 28
          },
          rotation: anchor.angle + 0.18,
          scale: 0.92,
          alpha: 0.96,
          tint: 0xcbd5e1
        },
        {
          kind: index % 2 === 0 ? "wrecked-car" : "hesco-wall",
          position: {
            x: anchor.position.x - Math.cos(anchor.angle) * 58,
            y: anchor.position.y - Math.sin(anchor.angle) * 34
          },
          rotation: anchor.angle - 0.22,
          scale: index === 1 ? 0.96 : 0.88,
          alpha: 0.95,
          tint: route.id === "sundered-run" ? 0x9a7355 : undefined
        }
      ];
    });
  }

  if (sector.control === "contested") {
    return anchors.flatMap((anchor, index) => {
      const tangent = anchor.angle + Math.PI / 2;
      return [
        {
          kind: route.id === "broken-signal" ? "hesco-wall" : "sandbag-nest",
          position: {
            x: anchor.position.x + Math.cos(anchor.angle) * 44,
            y: anchor.position.y + Math.sin(anchor.angle) * 30
          },
          rotation: anchor.angle + 0.1,
          scale: 0.9,
          alpha: 0.96,
          tint: route.id === "sundered-run" ? 0xb08968 : undefined
        },
        {
          kind: index % 2 === 0 ? "camo-net" : "supply-rack",
          position: {
            x: anchor.position.x - Math.cos(tangent) * 34,
            y: anchor.position.y - Math.sin(tangent) * 24
          },
          rotation: anchor.angle - 0.06,
          scale: 0.82 + index * 0.04,
          alpha: 0.94,
          tint: index % 2 === 0 ? 0xb7d3bf : undefined
        },
        {
          kind: route.id === "crosswind-docks" ? "dock-bollards" : "checkpoint-gate",
          position: {
            x: anchor.position.x - Math.cos(anchor.angle) * 46,
            y: anchor.position.y - Math.sin(anchor.angle) * 28
          },
          rotation: anchor.angle + Math.PI / 2,
          scale: 0.84,
          alpha: 0.92,
          tint: route.id === "crosswind-docks" ? 0xb6c4d0 : undefined
        }
      ];
    });
  }

  return anchors.flatMap((anchor, index) => {
    const tangent = anchor.angle + Math.PI / 2;
    return [
      {
        kind: route.id === "sundered-run" ? "medical-case" : "supply-rack",
        position: {
          x: anchor.position.x + Math.cos(anchor.angle) * 34,
          y: anchor.position.y + Math.sin(anchor.angle) * 24
        },
        rotation: anchor.angle + 0.04,
        scale: 0.82,
        alpha: 0.94,
        tint: route.id === "sundered-run" ? 0xcddfb1 : 0xb8cad8
      },
      {
        kind: index % 2 === 0 ? "field-stretcher" : "camo-net",
        position: {
          x: anchor.position.x - Math.cos(tangent) * 28,
          y: anchor.position.y - Math.sin(tangent) * 20
        },
        rotation: anchor.angle - 0.12,
        scale: 0.84,
        alpha: 0.92,
        tint: index % 2 === 0 ? 0xd7e7d2 : 0xb7d3bf
      }
    ];
  });
}

function getRoomTraversalLabel(obstacle: (typeof ARENA_OBSTACLES)[number]): string {
  const breachLabel = obstacle.breach?.label ?? obstacle.label ?? "Room";
  const match = breachLabel.match(/Open room hold (\d+)\.(\d+)/);

  if (!match) {
    return `${breachLabel} route`;
  }

  const chainIndex = Number(match[1]);
  const depth = Number(match[2]);

  if (depth >= 3) {
    return `Route // chain ${chainIndex} deep stash`;
  }

  if (depth >= 2) {
    return `Route // chain ${chainIndex} follow-through`;
  }

  return `Route // chain ${chainIndex} breach mouth`;
}

function getRoomTraversalInfo(
  obstacle: (typeof ARENA_OBSTACLES)[number]
): { chainIndex: number; depth: number } | null {
  const breachLabel = obstacle.breach?.label ?? obstacle.label ?? "";
  const match = breachLabel.match(/Open room hold (\d+)\.(\d+)/);

  if (!match) {
    return null;
  }

  return {
    chainIndex: Number(match[1]),
    depth: Number(match[2])
  };
}

function getCondensedRoomTraversalLabel(
  obstacle: (typeof ARENA_OBSTACLES)[number],
  isActiveDepth: boolean
): string {
  const traversalInfo = getRoomTraversalInfo(obstacle);

  if (!traversalInfo) {
    return getRoomTraversalLabel(obstacle);
  }

  const chainPrefix = traversalInfo.chainIndex > 1 ? `Chain ${traversalInfo.chainIndex} ` : "";

  if (traversalInfo.depth >= 3) {
    return `${chainPrefix}${isActiveDepth ? "Locker" : "Deep"}`;
  }

  if (traversalInfo.depth >= 2) {
    return `${chainPrefix}${isActiveDepth ? "Stack" : "Clear"}`;
  }

  return `${chainPrefix}${isActiveDepth ? "Cut" : "Entry"}`;
}

function pointInsideObstacle(point: { x: number; y: number }, obstacle: (typeof ARENA_OBSTACLES)[number]): boolean {
  return (
    point.x >= obstacle.x &&
    point.x <= obstacle.x + obstacle.width &&
    point.y >= obstacle.y &&
    point.y <= obstacle.y + obstacle.height
  );
}

function isFrontlineRouteObstacle(obstacle: ArenaObstacle): boolean {
  return obstacle.label?.startsWith("Frontline ") ?? false;
}

type FrontlineRoomObstacleStage = "breach-mouth" | "room-hold" | "follow-through" | "deep-stash" | "other";

type FrontlineRoomIdentity = ReturnType<typeof getFrontlineRoomIdentityProfile>;

interface FrontlineRoomObstacleIdentity {
  chainIndex: number;
  depth: number;
  profile: FrontlineRoomIdentity;
  demand: ContrabandCategoryId;
  roomLabel: string;
  cacheLabel: string;
  tint: number;
  propKinds: [PropPlacement["kind"], PropPlacement["kind"]];
}

function getFrontlineRoomObstacleStage(obstacle: ArenaObstacle): FrontlineRoomObstacleStage {
  const label = obstacle.label?.toLowerCase() ?? "";

  if (label.includes("breach mouth")) {
    return "breach-mouth";
  }

  if (label.includes("follow-through")) {
    return "follow-through";
  }

  if (label.includes("deep stash")) {
    return "deep-stash";
  }

  if (label.includes("room hold") || label.includes("captured room")) {
    return "room-hold";
  }

  return "other";
}

function getFrontlineRoomObstacleIdentity(
  obstacle: ArenaObstacle,
  route: RaidRouteDefinition
): FrontlineRoomObstacleIdentity | null {
  const match = obstacle.breach?.label.match(/Open room hold (\d+)\.(\d+)/);
  if (!match) {
    return null;
  }

  const chainIndex = Math.max(1, Number(match[1]));
  const depth = Math.max(1, Number(match[2]));
  const profile = getFrontlineRoomIdentityProfile(route.id, chainIndex - 1);
  const demand =
    depth >= 3 ? profile.deepDemand : depth >= 2 ? profile.followThroughDemand : profile.roomDemand;
  const roomLabel =
    depth >= 3 ? profile.deepLabel : depth >= 2 ? profile.followThroughLabel : profile.roomLabel;
  const cacheLabel =
    depth >= 3 ? profile.deepCacheLabel : depth >= 2 ? profile.followThroughCacheLabel : profile.roomCacheLabel;

  if (demand === "intel") {
    return {
      chainIndex,
      depth,
      profile,
      demand,
      roomLabel,
      cacheLabel,
      tint: 0x93c5fd,
      propKinds: ["relay-case", "satcom-rig"]
    };
  }

  if (demand === "medical") {
    return {
      chainIndex,
      depth,
      profile,
      demand,
      roomLabel,
      cacheLabel,
      tint: 0x86efac,
      propKinds: ["medical-case", "trauma-rack"]
    };
  }

  if (demand === "munitions") {
    return {
      chainIndex,
      depth,
      profile,
      demand,
      roomLabel,
      cacheLabel,
      tint: 0xfbbf24,
      propKinds: ["ammo-pallet", "supply-rack"]
    };
  }

  return {
    chainIndex,
    depth,
    profile,
    demand,
    roomLabel,
    cacheLabel,
    tint: 0xf59e0b,
    propKinds: ["tool-locker", "cargo-container"]
  };
}

function getFrontlineRoomObstacleDecals(
  obstacle: ArenaObstacle,
  route: RaidRouteDefinition
): GroundDecalDefinition[] {
  const stage = getFrontlineRoomObstacleStage(obstacle);
  if (stage === "other") {
    return [];
  }

  const centerX = obstacle.x + obstacle.width / 2;
  const centerY = obstacle.y + obstacle.height / 2;
  const isVertical = obstacle.height > obstacle.width;
  const rotation = isVertical ? Math.PI / 2 : 0;
  const identity = getFrontlineRoomObstacleIdentity(obstacle, route);

  if (stage === "breach-mouth") {
    return [
      {
        kind: "chevrons",
        position: { x: centerX, y: centerY },
        rotation,
        scaleX: Math.max(0.9, obstacle.width / 120),
        scaleY: Math.max(0.72, obstacle.height / 92),
        alpha: 0.28,
        tint: 0xf59e0b,
        depthOffset: -0.07
      },
      {
        kind: "extract-lane",
        position: { x: centerX, y: centerY },
        rotation,
        scaleX: Math.max(0.96, obstacle.width / 104),
        scaleY: Math.max(0.84, obstacle.height / 108),
        alpha: 0.18,
        tint: route.sceneTheme.accentColor,
        depthOffset: -0.068
      }
    ];
  }

  if (stage === "follow-through") {
    return [
      {
        kind:
          identity?.demand === "intel"
            ? "signal-pad"
            : identity?.demand === "medical"
              ? "med-bay"
              : route.id === "broken-signal"
                ? "signal-pad"
                : "med-bay",
        position: { x: centerX, y: centerY },
        rotation: obstacle.id % 2 === 0 ? -0.08 : 0.08,
        scaleX: Math.max(0.84, (obstacle.width - 42) / 88),
        scaleY: Math.max(0.8, (obstacle.height - 48) / 84),
        alpha: 0.28,
        tint: identity?.tint ?? (route.id === "broken-signal" ? 0x93c5fd : 0x4ade80),
        depthOffset: -0.07
      },
      {
        kind: "extract-lane",
        position: { x: centerX, y: centerY + (isVertical ? 0 : 6) },
        rotation,
        scaleX: Math.max(0.82, obstacle.width / 108),
        scaleY: Math.max(0.74, obstacle.height / 112),
        alpha: 0.16,
        tint: 0x86efac,
        depthOffset: -0.068
      }
    ];
  }

  if (stage === "deep-stash") {
    return [
      {
        kind:
          identity?.demand === "intel"
            ? "relay-grid"
            : identity?.demand === "medical"
              ? "med-bay"
              : "service-bay",
        position: { x: centerX, y: centerY },
        rotation: obstacle.id % 2 === 0 ? -0.08 : 0.08,
        scaleX: Math.max(0.78, (obstacle.width - 36) / 82),
        scaleY: Math.max(0.76, (obstacle.height - 40) / 80),
        alpha: 0.28,
        tint: identity?.tint ?? (route.id === "crosswind-docks" ? 0xf59e0b : route.id === "broken-signal" ? 0x93c5fd : 0x4ade80),
        depthOffset: -0.07
      },
      {
        kind: "chevrons",
        position: { x: centerX, y: centerY + (isVertical ? 0 : 8) },
        rotation,
        scaleX: Math.max(0.72, obstacle.width / 116),
        scaleY: Math.max(0.68, obstacle.height / 118),
        alpha: 0.18,
        tint: 0xf8fafc,
        depthOffset: -0.068
      }
    ];
  }

  return [
    {
      kind: identity?.demand === "intel" ? "ops-grid" : identity?.demand === "medical" ? "med-bay" : "service-bay",
      position: { x: centerX, y: centerY },
      rotation: obstacle.id % 2 === 0 ? -0.06 : 0.06,
      scaleX: Math.max(0.88, (obstacle.width - 38) / 84),
      scaleY: Math.max(0.82, (obstacle.height - 44) / 82),
      alpha: 0.26,
      tint: identity?.tint ?? (route.id === "crosswind-docks" ? 0xf59e0b : route.sceneTheme.accentColor),
      depthOffset: -0.07
    },
    {
      kind: "extract-lane",
      position: { x: centerX, y: centerY },
      rotation,
      scaleX: Math.max(0.8, obstacle.width / 112),
      scaleY: Math.max(0.72, obstacle.height / 116),
      alpha: 0.15,
      tint: 0x86efac,
      depthOffset: -0.068
    }
  ];
}

function getFrontlineRoomObstacleDressings(obstacle: ArenaObstacle, route: RaidRouteDefinition): PropPlacement[] {
  const stage = getFrontlineRoomObstacleStage(obstacle);
  if (stage === "other") {
    return [];
  }

  const centerX = obstacle.x + obstacle.width / 2;
  const centerY = obstacle.y + obstacle.height / 2;
  const doorway = getClosestObstacleDoorway(obstacle, { x: centerX, y: centerY });
  const doorCoverLeft = doorway ? getObstacleInteriorCoverPoint(obstacle, doorway, "left") : null;
  const doorCoverRight = doorway ? getObstacleInteriorCoverPoint(obstacle, doorway, "right") : null;
  const identity = getFrontlineRoomObstacleIdentity(obstacle, route);
  const [primaryKind, secondaryKind] = identity?.propKinds ?? ["tool-locker", "supply-rack"];
  const identityTint = identity?.tint;

  if (stage === "breach-mouth") {
    return [
      {
        kind: route.id === "crosswind-docks" ? "checkpoint-gate" : "scrap-barricade",
        position: { x: centerX, y: centerY - obstacle.height * 0.18 },
        rotation: obstacle.width > obstacle.height ? 0 : Math.PI / 2,
        scale: 0.86,
        alpha: 0.96,
        tint: route.id === "broken-signal" ? 0xb45309 : 0xa16207
      },
      {
        kind: "razorwire-coil",
        position: { x: centerX + obstacle.width * 0.12, y: centerY + obstacle.height * 0.16 },
        rotation: obstacle.id % 2 === 0 ? 0.12 : -0.12,
        scale: 0.86,
        alpha: 0.94,
        tint: 0xcbd5e1
      }
    ];
  }

  if (stage === "follow-through") {
    return [
      {
        kind: primaryKind,
        position: { x: centerX - obstacle.width * 0.16, y: centerY + obstacle.height * 0.14 },
        rotation: obstacle.id % 2 === 0 ? -0.08 : 0.08,
        scale: 0.84,
        alpha: 0.96,
        tint: identityTint ?? (route.id === "broken-signal" ? 0xbfdbfe : 0xbfa792)
      },
      {
        kind: secondaryKind,
        position: { x: centerX + obstacle.width * 0.18, y: centerY - obstacle.height * 0.14 },
        rotation: obstacle.id % 2 === 0 ? 0.06 : -0.06,
        scale: 0.84,
        alpha: 0.94,
        tint: identityTint ?? (route.id === "sundered-run" ? 0xd7e7d2 : 0xb8cad8)
      },
      ...(doorCoverRight
        ? [
            {
              kind: "tool-locker" as const,
              position: { x: doorCoverRight.x, y: doorCoverRight.y },
              rotation: 0,
              scale: 0.76,
              alpha: 0.94,
              tint: 0x93c5fd
            }
          ]
        : [])
    ];
  }

  if (stage === "deep-stash") {
    return [
      {
        kind: secondaryKind,
        position: { x: centerX - obstacle.width * 0.14, y: centerY - obstacle.height * 0.16 },
        rotation: obstacle.width > obstacle.height ? 0.08 : Math.PI / 2 + 0.08,
        scale: 0.8,
        alpha: 0.95,
        tint: identityTint ?? (route.id === "broken-signal" ? 0xc4d3df : undefined)
      },
      {
        kind: primaryKind,
        position: { x: centerX + obstacle.width * 0.18, y: centerY + obstacle.height * 0.14 },
        rotation: obstacle.id % 2 === 0 ? 0.06 : -0.06,
        scale: 0.8,
        alpha: 0.94,
        tint: identityTint ?? (route.id === "crosswind-docks" ? 0xf59e0b : route.id === "broken-signal" ? 0x93c5fd : 0xd7e7d2)
      },
      ...(doorCoverLeft
        ? [
            {
              kind: "supply-rack" as const,
              position: { x: doorCoverLeft.x, y: doorCoverLeft.y },
              rotation: obstacle.width > obstacle.height ? Math.PI / 2 : 0,
              scale: 0.74,
              alpha: 0.94,
              tint: 0xb8cad8
            }
          ]
        : [])
    ];
  }

  return [
    {
      kind: primaryKind,
      position: { x: centerX + obstacle.width * 0.18, y: centerY + obstacle.height * 0.14 },
      rotation: obstacle.id % 2 === 0 ? 0.02 : -0.02,
      scale: 0.82,
      alpha: 0.95,
      tint: identityTint ?? (route.id === "crosswind-docks" ? 0xf59e0b : 0xcddfb1)
    },
    {
      kind: secondaryKind,
      position: { x: centerX - obstacle.width * 0.18, y: centerY - obstacle.height * 0.16 },
      rotation: obstacle.id % 2 === 0 ? -0.08 : 0.08,
      scale: 0.82,
      alpha: 0.94,
      tint: identityTint ?? (route.id === "broken-signal" ? 0x93c5fd : 0xb08968)
    },
    ...(doorCoverLeft
      ? [
          {
            kind: "supply-rack" as const,
            position: { x: doorCoverLeft.x, y: doorCoverLeft.y },
            rotation: obstacle.width > obstacle.height ? Math.PI / 2 : 0,
            scale: 0.74,
            alpha: 0.94,
            tint: 0xb8cad8
          }
        ]
      : [])
  ];
}

function rotateVector(vector: { x: number; y: number }, radians: number): { x: number; y: number } {
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  return {
    x: vector.x * cosine - vector.y * sine,
    y: vector.x * sine + vector.y * cosine
  };
}

function drawFrontlineFormation(
  graphics: Phaser.GameObjects.Graphics,
  center: { x: number; y: number },
  facing: { x: number; y: number },
  strength: number,
  color: number,
  kind: FrontlineSupportState["kind"] | FrontlineIncidentState["kind"],
  alpha: number
): void {
  const facingLength = Math.hypot(facing.x, facing.y);
  const normalizedFacing = facingLength > 0.001 ? { x: facing.x / facingLength, y: facing.y / facingLength } : { x: 1, y: 0 };
  const lateral = rotateVector(normalizedFacing, Math.PI / 2);
  const spacing = kind === "convoy" ? 8 : kind === "casualty" || kind === "recovery" ? 6 : 7;
  const start = -((strength - 1) * spacing) / 2;

  graphics.fillStyle(color, alpha);
  for (let index = 0; index < strength; index += 1) {
    const offset = start + index * spacing;
    const anchor =
      kind === "convoy" || kind === "casualty" || kind === "recovery"
        ? {
            x: center.x - normalizedFacing.x * offset,
            y: center.y - normalizedFacing.y * offset
          }
        : {
            x: center.x + lateral.x * offset,
            y: center.y + lateral.y * offset
          };
    graphics.fillCircle(anchor.x, anchor.y, kind === "convoy" ? 2.8 : 2.3);
  }
}

function getFrontlineFormationAnchors(
  center: { x: number; y: number },
  facing: { x: number; y: number },
  strength: number,
  kind: FrontlineSupportState["kind"] | FrontlineIncidentState["kind"],
  orderId: FrontlineSupportOrderId | null = null,
  playerEscort = false
): { x: number; y: number }[] {
  const facingLength = Math.hypot(facing.x, facing.y);
  const normalizedFacing = facingLength > 0.001 ? { x: facing.x / facingLength, y: facing.y / facingLength } : { x: 1, y: 0 };
  const lateral = rotateVector(normalizedFacing, Math.PI / 2);
  const spacing = kind === "convoy" ? 8 : kind === "casualty" || kind === "recovery" ? 6 : 7;
  const start = -((strength - 1) * spacing) / 2;
  const anchors: { x: number; y: number }[] = [];

  if (playerEscort && kind === "fireteam") {
    if (orderId === "breach-push") {
      for (let index = 0; index < strength; index += 1) {
        const slotOffset = index - (strength - 1) / 2;
        anchors.push({
          x: center.x - normalizedFacing.x * (18 - index * 8) + lateral.x * (slotOffset * 12),
          y: center.y - normalizedFacing.y * (18 - index * 8) + lateral.y * (slotOffset * 12)
        });
      }
      return anchors;
    }

    if (orderId === "secure-exfil") {
      for (let index = 0; index < strength; index += 1) {
        const offset = start * 2 + index * 18;
        anchors.push({
          x: center.x + lateral.x * offset - normalizedFacing.x * 14,
          y: center.y + lateral.y * offset - normalizedFacing.y * 14
        });
      }
      return anchors;
    }

    if (orderId === "draw-heat") {
      for (let index = 0; index < strength; index += 1) {
        const forward = index === 0 ? 18 : index === 1 ? 6 : -8;
        const spread = start * 2 + index * 20;
        anchors.push({
          x: center.x + lateral.x * spread + normalizedFacing.x * forward,
          y: center.y + lateral.y * spread + normalizedFacing.y * forward
        });
      }
      return anchors;
    }

    if (orderId === "shift-fire") {
      for (let index = 0; index < strength; index += 1) {
        const forward = index === 1 ? -4 : 12;
        const spread = start * 2 + index * 18;
        anchors.push({
          x: center.x + lateral.x * spread + normalizedFacing.x * forward,
          y: center.y + lateral.y * spread + normalizedFacing.y * forward
        });
      }
      return anchors;
    }

    if (orderId === "hold-position") {
      for (let index = 0; index < strength; index += 1) {
        const offset = start * 2 + index * 18;
        const settle = index === 1 ? -8 : -14;
        anchors.push({
          x: center.x + lateral.x * offset + normalizedFacing.x * settle,
          y: center.y + lateral.y * offset + normalizedFacing.y * settle
        });
      }
      return anchors;
    }

    if (strength === 1) {
      return [
        {
          x: center.x - normalizedFacing.x * 8,
          y: center.y - normalizedFacing.y * 8
        }
      ];
    }

    if (strength === 2) {
      return [
        {
          x: center.x - normalizedFacing.x * 12 - lateral.x * 14,
          y: center.y - normalizedFacing.y * 12 - lateral.y * 14
        },
        {
          x: center.x - lateral.x * 14,
          y: center.y - lateral.y * 14
        }
      ];
    }

    for (let index = 0; index < strength; index += 1) {
      const slotOffset = index - (strength - 1) / 2;
      const row = index === 0 ? 0 : 1;
      const lateralOffset = row === 0 ? 0 : slotOffset * 18;
      const forwardOffset = row === 0 ? 12 : -10;
      anchors.push({
        x: center.x + normalizedFacing.x * forwardOffset + lateral.x * lateralOffset,
        y: center.y + normalizedFacing.y * forwardOffset + lateral.y * lateralOffset
      });
    }
    return anchors;
  }

  for (let index = 0; index < strength; index += 1) {
    const offset = start + index * spacing;
    anchors.push(
      kind === "convoy" || kind === "casualty" || kind === "recovery"
        ? {
            x: center.x - normalizedFacing.x * offset,
            y: center.y - normalizedFacing.y * offset
          }
        : {
            x: center.x + lateral.x * offset,
            y: center.y + lateral.y * offset
          }
    );
  }

  return anchors;
}

function getEscortIntentPoint(
  anchor: { x: number; y: number },
  facing: { x: number; y: number },
  orderId: FrontlineSupportOrderId | null,
  slotIndex: number,
  plannedExtractLean: boolean
): { x: number; y: number } {
  const flankSign = slotIndex % 2 === 0 ? -1 : 1;
  const pose = getEscortCommandPose(orderId, flankSign, true, plannedExtractLean);
  const facingLength = Math.hypot(facing.x, facing.y);
  const normalizedFacing = facingLength > 0.001 ? { x: facing.x / facingLength, y: facing.y / facingLength } : { x: 1, y: 0 };
  const lateral = rotateVector(normalizedFacing, Math.PI / 2);
  const forwardReach =
    orderId === "breach-push" ? 26 : orderId === "secure-exfil" ? 12 : orderId === "draw-heat" ? 30 : plannedExtractLean ? 18 : 22;
  const lateralReach =
    orderId === "draw-heat"
      ? pose.targetOffset.y * 0.3
      : orderId === "shift-fire"
        ? pose.targetOffset.y * 0.22
        : plannedExtractLean
          ? pose.targetOffset.y * 0.22
          : pose.targetOffset.y * 0.12;

  return {
    x: anchor.x + normalizedFacing.x * forwardReach + lateral.x * lateralReach,
    y: anchor.y + normalizedFacing.y * forwardReach + lateral.y * lateralReach
  };
}

function drawFrontlineOperatorGlyph(
  graphics: Phaser.GameObjects.Graphics,
  anchor: { x: number; y: number },
  facing: { x: number; y: number },
  color: number,
  alpha: number,
  role: "line" | "support" | "medical",
  pose: CombatantRenderPose = getCombatantRenderPose(facing, "ready", 0)
): void {
  const facingLength = Math.hypot(facing.x, facing.y);
  const normalizedFacing = facingLength > 0.001 ? { x: facing.x / facingLength, y: facing.y / facingLength } : { x: 1, y: 0 };
  const lateral = rotateVector(normalizedFacing, Math.PI / 2);
  const posedAnchor = {
    x: anchor.x + pose.offsetX,
    y: anchor.y + pose.offsetY
  };
  const bodyLength = (role === "medical" ? 6.2 : 7.1) * pose.scaleX;
  const bodyWidth = (role === "support" ? 1.7 : 1.45) * (pose.id === "pinned" ? 1.16 : pose.id === "covering" ? 1.08 : 1);
  const head = {
    x: posedAnchor.x + normalizedFacing.x * 2.7,
    y: posedAnchor.y + normalizedFacing.y * 2.7
  };
  const shoulders = {
    x: posedAnchor.x - normalizedFacing.x * 0.6,
    y: posedAnchor.y - normalizedFacing.y * 0.6
  };
  const muzzle = {
    x:
      posedAnchor.x +
      normalizedFacing.x * (pose.muzzleOffset + (role === "support" ? 3.6 : 2.3)) +
      lateral.x * (role === "medical" ? 0.5 : 0),
    y:
      posedAnchor.y +
      normalizedFacing.y * (pose.muzzleOffset + (role === "support" ? 3.6 : 2.3)) +
      lateral.y * (role === "medical" ? 0.5 : 0)
  };

  if (pose.id === "suppressed" || pose.id === "covering" || pose.id === "pinned") {
    graphics.lineStyle(1.2, 0xe2e8f0, alpha * (pose.id === "pinned" ? 0.34 : 0.24));
    graphics.lineBetween(
      posedAnchor.x - lateral.x * 4.6 - normalizedFacing.x * 3,
      posedAnchor.y - lateral.y * 4.6 - normalizedFacing.y * 3,
      posedAnchor.x + lateral.x * 4.6 - normalizedFacing.x * 3,
      posedAnchor.y + lateral.y * 4.6 - normalizedFacing.y * 3
    );
  }

  graphics.lineStyle(bodyWidth, color, alpha * pose.alphaMultiplier);
  graphics.lineBetween(
    shoulders.x - normalizedFacing.x * bodyLength,
    shoulders.y - normalizedFacing.y * bodyLength,
    shoulders.x + normalizedFacing.x * 1.8,
    shoulders.y + normalizedFacing.y * 1.8
  );
  graphics.lineStyle(1.15, 0xf8fafc, alpha * 0.92 * pose.alphaMultiplier);
  graphics.lineBetween(
    shoulders.x + lateral.x * 1.6,
    shoulders.y + lateral.y * 1.6,
    muzzle.x,
    muzzle.y
  );

  graphics.fillStyle(0xf8fafc, alpha * pose.alphaMultiplier);
  graphics.fillCircle(head.x, head.y, (role === "support" ? 1.55 : 1.4) * (pose.id === "pinned" ? 0.92 : 1));

  if (role === "medical") {
    graphics.lineStyle(1, 0xc4b5fd, alpha * 0.92 * pose.alphaMultiplier);
    graphics.lineBetween(
      posedAnchor.x - lateral.x * 2.1,
      posedAnchor.y - lateral.y * 2.1,
      posedAnchor.x + lateral.x * 2.1,
      posedAnchor.y + lateral.y * 2.1
    );
  }
}

function getSquadMateConditionColor(condition: SquadMateState["condition"]): string {
  if (condition === "critical") {
    return "#fda4af";
  }

  if (condition === "heated") {
    return "#fdba74";
  }

  return "#bfdbfe";
}

function getSquadMateConditionTint(condition: SquadMateState["condition"]): number {
  if (condition === "critical") {
    return 0xfda4af;
  }

  if (condition === "heated") {
    return 0xfdba74;
  }

  return 0xbfdbfe;
}

function getSquadMateWeaponLabel(mate: SquadMateState): string {
  return WEAPONS[mate.weaponId].name.replace("VKR ", "").replace("Kite ", "").replace("Morrow ", "");
}

function drawFactionMarker(
  graphics: Phaser.GameObjects.Graphics,
  anchor: { x: number; y: number },
  facing: { x: number; y: number },
  color: number,
  alpha: number,
  scale = 1
): void {
  const facingLength = Math.hypot(facing.x, facing.y);
  const normalizedFacing = facingLength > 0.001 ? { x: facing.x / facingLength, y: facing.y / facingLength } : { x: 1, y: 0 };
  const lateral = rotateVector(normalizedFacing, Math.PI / 2);
  const shoulder = {
    x: anchor.x - normalizedFacing.x * (scale * 1.8) + lateral.x * (scale * 2.2),
    y: anchor.y - normalizedFacing.y * (scale * 1.8) + lateral.y * (scale * 2.2)
  };

  graphics.lineStyle(scale * 2.2, 0x020617, alpha * 0.55);
  graphics.lineBetween(
    shoulder.x - lateral.x * scale * 2.2,
    shoulder.y - lateral.y * scale * 2.2,
    shoulder.x + lateral.x * scale * 2.2,
    shoulder.y + lateral.y * scale * 2.2
  );
  graphics.lineStyle(scale * 1.4, color, alpha);
  graphics.lineBetween(
    shoulder.x - lateral.x * scale * 1.9,
    shoulder.y - lateral.y * scale * 1.9,
    shoulder.x + lateral.x * scale * 1.9,
    shoulder.y + lateral.y * scale * 1.9
  );
}

interface WeaponEffectProfile {
  muzzleCore: number;
  muzzleHalo: number;
  muzzleRadius: number;
  tracerCore: number;
  tracerHalo: number;
  tracerWidth: number;
  tailInset: number;
  impactCore: number;
  impactRing: number;
  impactShard: number;
  suppressionRing: number;
  blastRing: number;
}

function getWeaponEffectProfile(weaponId: WeaponId | null | undefined): WeaponEffectProfile {
  switch (weaponId) {
    case "pistol":
      return {
        muzzleCore: 0xfef3c7,
        muzzleHalo: 0xfda4af,
        muzzleRadius: 1.45,
        tracerCore: 0xfef3c7,
        tracerHalo: 0xfda4af,
        tracerWidth: 1,
        tailInset: 2.4,
        impactCore: 0xfda4af,
        impactRing: 0xfbcfe8,
        impactShard: 0xfef3c7,
        suppressionRing: 0xfbcfe8,
        blastRing: 0xfbcfe8
      };
    case "smg":
      return {
        muzzleCore: 0xf8fafc,
        muzzleHalo: 0x7dd3fc,
        muzzleRadius: 1.65,
        tracerCore: 0xe0f2fe,
        tracerHalo: 0x38bdf8,
        tracerWidth: 1.05,
        tailInset: 2.8,
        impactCore: 0x38bdf8,
        impactRing: 0xbfdbfe,
        impactShard: 0xe0f2fe,
        suppressionRing: 0x7dd3fc,
        blastRing: 0x93c5fd
      };
    case "shotgun":
      return {
        muzzleCore: 0xfef3c7,
        muzzleHalo: 0xfbbf24,
        muzzleRadius: 2.25,
        tracerCore: 0xfef3c7,
        tracerHalo: 0xf59e0b,
        tracerWidth: 1.35,
        tailInset: 1.6,
        impactCore: 0xf59e0b,
        impactRing: 0xfcd34d,
        impactShard: 0xfef3c7,
        suppressionRing: 0xfbbf24,
        blastRing: 0xf59e0b
      };
    case "pkm":
      return {
        muzzleCore: 0xfef3c7,
        muzzleHalo: 0xf97316,
        muzzleRadius: 2.05,
        tracerCore: 0xffedd5,
        tracerHalo: 0xf97316,
        tracerWidth: 1.4,
        tailInset: 3.6,
        impactCore: 0xf97316,
        impactRing: 0xfdba74,
        impactShard: 0xffedd5,
        suppressionRing: 0xfb923c,
        blastRing: 0xf97316
      };
    case "amr":
      return {
        muzzleCore: 0xffffff,
        muzzleHalo: 0xe2e8f0,
        muzzleRadius: 2.5,
        tracerCore: 0xffffff,
        tracerHalo: 0xcbd5e1,
        tracerWidth: 1.55,
        tailInset: 4.2,
        impactCore: 0xe2e8f0,
        impactRing: 0xf8fafc,
        impactShard: 0xffffff,
        suppressionRing: 0xe2e8f0,
        blastRing: 0xf8fafc
      };
    case "rifle":
    case "short-mosin":
    case "worn-ak":
      return {
        muzzleCore: 0xfef3c7,
        muzzleHalo: weaponId === "short-mosin" ? 0xd6b38a : weaponId === "worn-ak" ? 0xf59e0b : 0xa7f3d0,
        muzzleRadius: weaponId === "worn-ak" ? 2.05 : 1.8,
        tracerCore: weaponId === "worn-ak" ? 0xfffbeb : 0xf0fdf4,
        tracerHalo: weaponId === "short-mosin" ? 0xb08968 : weaponId === "worn-ak" ? 0xf97316 : 0x34d399,
        tracerWidth: weaponId === "worn-ak" ? 1.32 : 1.18,
        tailInset: weaponId === "worn-ak" ? 2.6 : 3.1,
        impactCore: weaponId === "short-mosin" ? 0xb08968 : weaponId === "worn-ak" ? 0xf59e0b : 0x34d399,
        impactRing: weaponId === "short-mosin" ? 0xd6b38a : weaponId === "worn-ak" ? 0xfdba74 : 0xa7f3d0,
        impactShard: 0xf0fdf4,
        suppressionRing: weaponId === "short-mosin" ? 0xc4a484 : weaponId === "worn-ak" ? 0xfb923c : 0x6ee7b7,
        blastRing: weaponId === "short-mosin" ? 0xd6b38a : weaponId === "worn-ak" ? 0xfdba74 : 0xa7f3d0
      };
    default:
      return {
        muzzleCore: 0xfef3c7,
        muzzleHalo: 0xcbd5e1,
        muzzleRadius: 1.72,
        tracerCore: 0xf8fafc,
        tracerHalo: 0xcbd5e1,
        tracerWidth: 1.12,
        tailInset: 3,
        impactCore: 0xcbd5e1,
        impactRing: 0xe2e8f0,
        impactShard: 0xf8fafc,
        suppressionRing: 0xbfdbfe,
        blastRing: 0xe2e8f0
      };
  }
}

function drawFrontlineTracerBurst(
  graphics: Phaser.GameObjects.Graphics,
  from: { x: number; y: number },
  facing: { x: number; y: number },
  color: number,
  alpha: number,
  length: number,
  weaponId: WeaponId | null = null,
  pose: CombatantRenderPose = getCombatantRenderPose(facing, "ready", 0)
): void {
  const facingLength = Math.hypot(facing.x, facing.y);
  const normalizedFacing = facingLength > 0.001 ? { x: facing.x / facingLength, y: facing.y / facingLength } : { x: 1, y: 0 };
  const profile = getWeaponEffectProfile(weaponId);
  const start = {
    x: from.x + pose.offsetX + normalizedFacing.x * pose.muzzleOffset,
    y: from.y + pose.offsetY + normalizedFacing.y * pose.muzzleOffset
  };
  const end = {
    x: start.x + normalizedFacing.x * length * pose.tracerLengthMultiplier,
    y: start.y + normalizedFacing.y * length * pose.tracerLengthMultiplier
  };
  const flare = profile.muzzleRadius * (pose.id === "pinned" ? 0.88 : 1);

  graphics.lineStyle(2.5 * profile.tracerWidth, profile.tracerHalo, alpha * 0.34 * pose.alphaMultiplier);
  graphics.lineBetween(start.x, start.y, end.x, end.y);
  graphics.lineStyle(1.45 * profile.tracerWidth, profile.tracerCore, alpha * 0.92 * pose.alphaMultiplier);
  graphics.lineBetween(
    start.x + normalizedFacing.x * profile.tailInset,
    start.y + normalizedFacing.y * profile.tailInset,
    end.x,
    end.y
  );
  graphics.fillStyle(profile.muzzleHalo, alpha * 0.34 * pose.alphaMultiplier);
  graphics.fillCircle(start.x, start.y, flare * 1.75);
  graphics.fillStyle(profile.muzzleCore, alpha * 0.96 * pose.alphaMultiplier);
  graphics.fillCircle(start.x, start.y, flare);
  graphics.lineStyle(1.1, color, alpha * 0.48 * pose.alphaMultiplier);
  graphics.lineBetween(
    start.x - normalizedFacing.x * 1.5,
    start.y - normalizedFacing.y * 1.5,
    start.x + normalizedFacing.x * (flare * 3.4),
    start.y + normalizedFacing.y * (flare * 3.4)
  );
}

function getFrontlineTracerDrawLength(weaponId: keyof typeof WEAPONS, boost = 0): number {
  if (weaponId === "pkm") {
    return 36 + boost * 1.1;
  }

  if (weaponId === "short-mosin") {
    return 44 + boost * 1.2;
  }

  if (weaponId === "worn-ak") {
    return 34 + boost * 1.06;
  }

  if (weaponId === "smg") {
    return 24 + boost;
  }

  if (weaponId === "shotgun") {
    return 20 + boost * 0.75;
  }

  return 32 + boost;
}

function drawFrontlineImpact(
  graphics: Phaser.GameObjects.Graphics,
  impact: FrontlineImpactState
): void {
  const lifeRatio = impact.maxLife > 0 ? Phaser.Math.Clamp(impact.life / impact.maxLife, 0, 1) : 0;
  const pulse = 1 - lifeRatio;
  const profile = getWeaponEffectProfile(impact.weaponId);
  const radius =
    impact.material === "dust"
      ? impact.radius * (0.76 + pulse * 0.92)
      : impact.material === "concrete"
        ? impact.radius * (0.48 + pulse * 0.54)
        : impact.radius * (0.55 + pulse * 0.65);
  const heading = {
    x: Math.cos(impact.angle),
    y: Math.sin(impact.angle)
  };
  const lateral = rotateVector(heading, Math.PI / 2);

  if (impact.kind === "blast") {
    const smokeColor = impact.material === "concrete" ? 0x94a3b8 : impact.material === "dust" ? 0xc08457 : 0x334155;
    graphics.fillStyle(impact.faction === "friendly" ? 0xfb7185 : 0x93c5fd, 0.12 + lifeRatio * 0.18);
    graphics.fillCircle(impact.position.x, impact.position.y, radius * 1.08);
    graphics.fillStyle(smokeColor, 0.08 + lifeRatio * 0.14);
    graphics.fillCircle(impact.position.x, impact.position.y, radius * 1.42);
    graphics.lineStyle(2.4, profile.blastRing, 0.34 + lifeRatio * 0.36);
    graphics.strokeCircle(impact.position.x, impact.position.y, radius * 0.82);
    graphics.lineStyle(1.4, impact.faction === "friendly" ? 0xfda4af : 0xbfdbfe, 0.18 + lifeRatio * 0.26);
    graphics.strokeCircle(impact.position.x, impact.position.y, radius * 1.44);
    graphics.lineStyle(2.1, impact.color, 0.26 + lifeRatio * 0.34);
    for (let shardIndex = 0; shardIndex < 6; shardIndex += 1) {
      const shardAngle = impact.angle + shardIndex * (Math.PI / 3);
      const shardHeading = { x: Math.cos(shardAngle), y: Math.sin(shardAngle) };
      graphics.lineBetween(
        impact.position.x + shardHeading.x * radius * 0.22,
        impact.position.y + shardHeading.y * radius * 0.22,
        impact.position.x + shardHeading.x * radius * 0.98,
        impact.position.y + shardHeading.y * radius * 0.98
      );
    }
    graphics.lineStyle(1, smokeColor, 0.18 + lifeRatio * 0.18);
    for (let streakIndex = 0; streakIndex < 3; streakIndex += 1) {
      const streakAngle = impact.angle + (streakIndex - 1) * 0.42;
      const streakHeading = { x: Math.cos(streakAngle), y: Math.sin(streakAngle) };
      graphics.lineBetween(
        impact.position.x + streakHeading.x * radius * 0.52,
        impact.position.y + streakHeading.y * radius * 0.52,
        impact.position.x + streakHeading.x * radius * 1.52,
        impact.position.y + streakHeading.y * radius * 1.52
      );
    }
    graphics.lineStyle(1.4, profile.impactShard, 0.22 + lifeRatio * 0.24);
    graphics.strokeCircle(impact.position.x, impact.position.y, radius * 1.18);
  } else if (impact.material === "dust") {
    graphics.fillStyle(0xc08457, 0.08 + lifeRatio * 0.12);
    graphics.fillCircle(impact.position.x, impact.position.y, radius * 0.92);
    graphics.fillStyle(profile.impactShard, 0.07 + lifeRatio * 0.1);
    graphics.fillEllipse(
      impact.position.x + heading.x * radius * 0.18,
      impact.position.y + heading.y * radius * 0.18,
      radius * 1.8,
      radius * 1.18
    );
    graphics.lineStyle(1.3, profile.impactRing, 0.16 + lifeRatio * 0.24);
    graphics.strokeCircle(impact.position.x, impact.position.y, radius * 1.08);
    graphics.lineStyle(1.05, 0xfcd34d, 0.12 + lifeRatio * 0.18);
    graphics.lineBetween(
      impact.position.x + heading.x * radius * 0.24,
      impact.position.y + heading.y * radius * 0.24,
      impact.position.x + heading.x * radius * 1.36,
      impact.position.y + heading.y * radius * 1.36
    );
    graphics.lineBetween(
      impact.position.x + heading.x * radius * 0.12 + lateral.x * radius * 0.26,
      impact.position.y + heading.y * radius * 0.12 + lateral.y * radius * 0.26,
      impact.position.x + heading.x * radius * 1.08 + lateral.x * radius * 0.48,
      impact.position.y + heading.y * radius * 1.08 + lateral.y * radius * 0.48
    );
    graphics.lineBetween(
      impact.position.x + heading.x * radius * 0.12 - lateral.x * radius * 0.26,
      impact.position.y + heading.y * radius * 0.12 - lateral.y * radius * 0.26,
      impact.position.x + heading.x * radius * 1.08 - lateral.x * radius * 0.48,
      impact.position.y + heading.y * radius * 1.08 - lateral.y * radius * 0.48
    );
  } else {
    graphics.lineStyle(2, profile.impactRing, 0.16 + lifeRatio * 0.42);
    graphics.strokeCircle(impact.position.x, impact.position.y, radius);
    graphics.fillStyle(
      impact.material === "concrete" ? profile.impactRing : profile.impactCore,
      impact.kind === "suppression" ? 0.08 + lifeRatio * 0.1 : 0.12 + lifeRatio * 0.14
    );
    graphics.fillCircle(impact.position.x, impact.position.y, impact.kind === "suppression" ? radius * 0.72 : radius * 0.44);

    graphics.lineStyle(1.5, impact.material === "concrete" ? profile.impactRing : impact.color, 0.28 + lifeRatio * 0.5);
    graphics.lineBetween(
      impact.position.x - heading.x * radius * 0.26,
      impact.position.y - heading.y * radius * 0.26,
      impact.position.x + heading.x * radius * 0.94,
      impact.position.y + heading.y * radius * 0.94
    );
    graphics.lineBetween(
      impact.position.x - lateral.x * radius * 0.46,
      impact.position.y - lateral.y * radius * 0.46,
      impact.position.x + lateral.x * radius * 0.46,
      impact.position.y + lateral.y * radius * 0.46
    );

    if (impact.material === "concrete" && impact.kind === "impact") {
      graphics.lineStyle(1, 0x94a3b8, 0.2 + lifeRatio * 0.34);
      graphics.lineBetween(
        impact.position.x - heading.x * radius * 0.14 + lateral.x * radius * 0.52,
        impact.position.y - heading.y * radius * 0.14 + lateral.y * radius * 0.52,
        impact.position.x + heading.x * radius * 0.68 + lateral.x * radius * 0.92,
        impact.position.y + heading.y * radius * 0.68 + lateral.y * radius * 0.92
      );
      graphics.lineBetween(
        impact.position.x - heading.x * radius * 0.12 - lateral.x * radius * 0.48,
        impact.position.y - heading.y * radius * 0.12 - lateral.y * radius * 0.48,
        impact.position.x + heading.x * radius * 0.62 - lateral.x * radius * 0.88,
        impact.position.y + heading.y * radius * 0.62 - lateral.y * radius * 0.88
      );
      graphics.lineBetween(
        impact.position.x - lateral.x * radius * 0.2,
        impact.position.y - lateral.y * radius * 0.2,
        impact.position.x + heading.x * radius * 1.06,
        impact.position.y + heading.y * radius * 1.06
      );
    }
  }

  if (impact.kind === "suppression") {
    graphics.lineStyle(1.35, profile.suppressionRing, 0.18 + lifeRatio * 0.28);
    graphics.strokeCircle(impact.position.x, impact.position.y, radius * 1.34);
    graphics.lineStyle(1, impact.faction === "friendly" ? 0xfca5a5 : 0xbfdbfe, 0.14 + lifeRatio * 0.22);
    graphics.strokeCircle(impact.position.x, impact.position.y, radius * 1.58);
    graphics.lineStyle(1.15, profile.suppressionRing, 0.16 + lifeRatio * 0.22);
    for (let chevronIndex = 0; chevronIndex < 3; chevronIndex += 1) {
      const lanePush = radius * (0.62 + chevronIndex * 0.22);
      const laneWidth = radius * (0.22 + chevronIndex * 0.05);
      const tip = {
        x: impact.position.x + heading.x * lanePush,
        y: impact.position.y + heading.y * lanePush
      };
      const left = {
        x: tip.x - heading.x * radius * 0.14 - lateral.x * laneWidth,
        y: tip.y - heading.y * radius * 0.14 - lateral.y * laneWidth
      };
      const right = {
        x: tip.x - heading.x * radius * 0.14 + lateral.x * laneWidth,
        y: tip.y - heading.y * radius * 0.14 + lateral.y * laneWidth
      };
      graphics.lineBetween(left.x, left.y, tip.x, tip.y);
      graphics.lineBetween(right.x, right.y, tip.x, tip.y);
    }
  }
}

function drawGrenade(
  graphics: Phaser.GameObjects.Graphics,
  grenade: GrenadeState,
  timeMs: number
): void {
  const fuseRatio = grenade.fuseTime > 0 ? Phaser.Math.Clamp(1 - grenade.elapsed / grenade.fuseTime, 0, 1) : 0;
  const pulse = 0.5 + 0.5 * Math.sin(timeMs / 85 + grenade.id * 0.8);
  const bodyColor = grenade.faction === "friendly" ? 0xfb7185 : 0x93c5fd;
  const warningRadius = grenade.radius * (0.24 + (1 - fuseRatio) * 0.42 + pulse * 0.08);
  const travel = {
    x: grenade.target.x - grenade.position.x,
    y: grenade.target.y - grenade.position.y
  };
  const travelLength = Math.hypot(travel.x, travel.y);
  const travelFacing =
    travelLength > 0.001
      ? {
          x: travel.x / travelLength,
          y: travel.y / travelLength
        }
      : { x: 1, y: 0 };
  const lateral = rotateVector(travelFacing, Math.PI / 2);
  graphics.fillStyle(0x020617, 0.86);
  graphics.fillCircle(grenade.position.x, grenade.position.y, 4.4);
  graphics.fillStyle(bodyColor, 0.84);
  graphics.fillCircle(grenade.position.x, grenade.position.y, 3.1);
  graphics.lineStyle(1, bodyColor, 0.1 + (1 - fuseRatio) * 0.14);
  graphics.lineBetween(
    grenade.position.x,
    grenade.position.y,
    grenade.target.x - travelFacing.x * warningRadius * 0.36,
    grenade.target.y - travelFacing.y * warningRadius * 0.36
  );
  graphics.fillStyle(bodyColor, 0.12 + (1 - fuseRatio) * 0.16);
  for (let pipIndex = 1; pipIndex <= 3; pipIndex += 1) {
    const progress = pipIndex / 4;
    graphics.fillCircle(
      Phaser.Math.Linear(grenade.position.x, grenade.target.x, progress),
      Phaser.Math.Linear(grenade.position.y, grenade.target.y, progress) - Math.sin(progress * Math.PI) * 10,
      1.5 + progress * 0.5
    );
  }
  graphics.lineStyle(1.4, bodyColor, 0.24 + (1 - fuseRatio) * 0.32);
  graphics.strokeCircle(grenade.target.x, grenade.target.y, warningRadius);
  graphics.lineStyle(1, 0xfef3c7, 0.16 + (1 - fuseRatio) * 0.24);
  graphics.strokeCircle(grenade.target.x, grenade.target.y, warningRadius * 0.72);
  graphics.lineStyle(1, bodyColor, 0.16);
  graphics.lineBetween(
    grenade.target.x - lateral.x * warningRadius * 0.16,
    grenade.target.y - lateral.y * warningRadius * 0.16,
    grenade.target.x + lateral.x * warningRadius * 0.16,
    grenade.target.y + lateral.y * warningRadius * 0.16
  );
  if (fuseRatio < 0.45) {
    const warningPulse = warningRadius * (1.1 + pulse * 0.12);
    graphics.lineStyle(1.2, 0xfef3c7, 0.2 + (1 - fuseRatio) * 0.3);
    graphics.strokeCircle(grenade.target.x, grenade.target.y, warningPulse);
    graphics.lineStyle(1, 0xfef3c7, 0.18 + (1 - fuseRatio) * 0.24);
    for (let spokeIndex = 0; spokeIndex < 4; spokeIndex += 1) {
      const spokeAngle = (Math.PI / 2) * spokeIndex + pulse * 0.08;
      const spokeHeading = { x: Math.cos(spokeAngle), y: Math.sin(spokeAngle) };
      graphics.lineBetween(
        grenade.target.x + spokeHeading.x * warningRadius * 0.84,
        grenade.target.y + spokeHeading.y * warningRadius * 0.84,
        grenade.target.x + spokeHeading.x * warningPulse,
        grenade.target.y + spokeHeading.y * warningPulse
      );
    }
  }
}

function drawOrientedQuad(
  graphics: Phaser.GameObjects.Graphics,
  center: { x: number; y: number },
  facing: { x: number; y: number },
  halfLength: number,
  halfWidth: number,
  fillColor: number,
  fillAlpha: number,
  strokeColor?: number,
  strokeAlpha = fillAlpha,
  lineWidth = 1.2
): void {
  const facingLength = Math.hypot(facing.x, facing.y);
  const normalizedFacing = facingLength > 0.001 ? { x: facing.x / facingLength, y: facing.y / facingLength } : { x: 1, y: 0 };
  const lateral = rotateVector(normalizedFacing, Math.PI / 2);
  const frontLeft = {
    x: center.x + normalizedFacing.x * halfLength - lateral.x * halfWidth,
    y: center.y + normalizedFacing.y * halfLength - lateral.y * halfWidth
  };
  const frontRight = {
    x: center.x + normalizedFacing.x * halfLength + lateral.x * halfWidth,
    y: center.y + normalizedFacing.y * halfLength + lateral.y * halfWidth
  };
  const rearRight = {
    x: center.x - normalizedFacing.x * halfLength + lateral.x * halfWidth,
    y: center.y - normalizedFacing.y * halfLength + lateral.y * halfWidth
  };
  const rearLeft = {
    x: center.x - normalizedFacing.x * halfLength - lateral.x * halfWidth,
    y: center.y - normalizedFacing.y * halfLength - lateral.y * halfWidth
  };

  graphics.fillStyle(fillColor, fillAlpha);
  graphics.beginPath();
  graphics.moveTo(frontLeft.x, frontLeft.y);
  graphics.lineTo(frontRight.x, frontRight.y);
  graphics.lineTo(rearRight.x, rearRight.y);
  graphics.lineTo(rearLeft.x, rearLeft.y);
  graphics.closePath();
  graphics.fillPath();

  if (strokeColor !== undefined) {
    graphics.lineStyle(lineWidth, strokeColor, strokeAlpha);
    graphics.beginPath();
    graphics.moveTo(frontLeft.x, frontLeft.y);
    graphics.lineTo(frontRight.x, frontRight.y);
    graphics.lineTo(rearRight.x, rearRight.y);
    graphics.lineTo(rearLeft.x, rearLeft.y);
    graphics.closePath();
    graphics.strokePath();
  }
}

function drawBunkerIncidentSetDressing(
  graphics: Phaser.GameObjects.Graphics,
  incident: FrontlineIncidentState,
  timeMs: number,
  focused: boolean,
  activeProgress: number | null
): void {
  if (incident.kind !== "bunker") {
    return;
  }

  const facingLength = Math.hypot(incident.facing.x, incident.facing.y);
  const normalizedFacing =
    facingLength > 0.001 ? { x: incident.facing.x / facingLength, y: incident.facing.y / facingLength } : { x: 1, y: 0 };
  const lateral = rotateVector(normalizedFacing, Math.PI / 2);
  const warmPulse = 0.5 + 0.5 * Math.sin(timeMs / 280 + incident.id * 0.7);
  const monitorPulse = 0.5 + 0.5 * Math.sin(timeMs / 190 + incident.id * 1.3);
  const moviePulse = 0.5 + 0.5 * Math.sin(timeMs / 240 + incident.id * 0.91);
  const actionProgress = activeProgress ?? 0;
  const quietAlpha = focused ? 0.26 : 0.2;
  const shedHide = incident.presentationVariant === "shed-hide";

  if (shedHide) {
    const shedCenter = {
      x: incident.position.x - normalizedFacing.x * 10,
      y: incident.position.y - normalizedFacing.y * 8
    };
    const slitCenter = {
      x: shedCenter.x + normalizedFacing.x * 11 - lateral.x * 6,
      y: shedCenter.y + normalizedFacing.y * 11 - lateral.y * 6
    };
    const ammoWrapCenter = {
      x: shedCenter.x - normalizedFacing.x * 8 + lateral.x * 8,
      y: shedCenter.y - normalizedFacing.y * 8 + lateral.y * 8
    };
    const radioCenter = {
      x: shedCenter.x + normalizedFacing.x * 4 + lateral.x * 10,
      y: shedCenter.y + normalizedFacing.y * 4 + lateral.y * 10
    };
    const blanketCenter = {
      x: shedCenter.x - normalizedFacing.x * 4 - lateral.x * 11,
      y: shedCenter.y - normalizedFacing.y * 4 - lateral.y * 11
    };
    const sweepCenter = {
      x: incident.position.x + normalizedFacing.x * 24 - lateral.x * 18,
      y: incident.position.y + normalizedFacing.y * 24 - lateral.y * 18
    };
    const sweepPulse = 0.5 + 0.5 * Math.sin(timeMs / 170 + incident.id * 1.2);
    const slitPulse = 0.5 + 0.5 * Math.sin(timeMs / 230 + incident.id * 0.9);

    graphics.fillStyle(0x020617, 0.22 + quietAlpha * 0.2);
    graphics.fillEllipse(shedCenter.x, shedCenter.y, 58 + slitPulse * 8, 30 + slitPulse * 5);
    drawOrientedQuad(graphics, shedCenter, incident.facing, 24, 15, 0x292524, 0.86, 0x78716c, 0.32, 1.3);
    drawOrientedQuad(
      graphics,
      {
        x: shedCenter.x + normalizedFacing.x * 2.6,
        y: shedCenter.y + normalizedFacing.y * 2.6
      },
      incident.facing,
      19,
      10.2,
      0x1c1917,
      0.9,
      0xa8a29e,
      0.16,
      0.9
    );
    graphics.lineStyle(1.1, 0xa8a29e, 0.28 + slitPulse * 0.08);
    for (let index = -1; index <= 1; index += 1) {
      const offset = index * 5.2;
      graphics.lineBetween(
        shedCenter.x - lateral.x * 11 + normalizedFacing.x * offset,
        shedCenter.y - lateral.y * 11 + normalizedFacing.y * offset,
        shedCenter.x + lateral.x * 11 + normalizedFacing.x * offset,
        shedCenter.y + lateral.y * 11 + normalizedFacing.y * offset
      );
    }
    drawOrientedQuad(graphics, slitCenter, incident.facing, 5.8, 1.2, 0x020617, 0.94, 0xe2e8f0, 0.12, 0.7);
    graphics.fillStyle(0xe2e8f0, 0.14 + slitPulse * 0.12 + actionProgress * 0.08);
    graphics.fillEllipse(slitCenter.x, slitCenter.y, 18 + slitPulse * 4, 8 + slitPulse * 2);

    drawOrientedQuad(graphics, ammoWrapCenter, incident.facing, 6.2, 3.6, 0x1d4ed8, 0.42, 0xbfdbfe, 0.16, 0.8);
    drawOrientedQuad(
      graphics,
      {
        x: ammoWrapCenter.x + lateral.x * 1.4,
        y: ammoWrapCenter.y + lateral.y * 1.4
      },
      incident.facing,
      1.8,
      0.9,
      0xf8fafc,
      0.26 + slitPulse * 0.1
    );
    drawOrientedQuad(graphics, radioCenter, incident.facing, 4.5, 3.1, 0x111827, 0.82, 0x64748b, 0.24, 0.8);
    graphics.lineStyle(0.9, 0x64748b, 0.22);
    graphics.lineBetween(radioCenter.x, radioCenter.y - 2, radioCenter.x, radioCenter.y - 8);
    graphics.lineBetween(radioCenter.x, radioCenter.y - 8, radioCenter.x - 3, radioCenter.y - 5);
    graphics.lineBetween(radioCenter.x, radioCenter.y - 8, radioCenter.x + 3, radioCenter.y - 5);
    drawOrientedQuad(graphics, blanketCenter, incident.facing, 7.2, 4.6, 0x334155, 0.44, 0xcbd5e1, 0.12, 0.8);

    const hiddenBodies = [
      {
        x: shedCenter.x + normalizedFacing.x * 4 - lateral.x * 6,
        y: shedCenter.y + normalizedFacing.y * 4 - lateral.y * 6
      },
      {
        x: shedCenter.x - normalizedFacing.x * 5 + lateral.x * 4,
        y: shedCenter.y - normalizedFacing.y * 5 + lateral.y * 4
      }
    ];
    hiddenBodies.forEach((bodyCenter, index) => {
      drawOrientedQuad(
        graphics,
        bodyCenter,
        incident.facing,
        4.6,
        2.4,
        0x0f172a,
        0.64,
        index === 0 ? 0x475569 : 0x64748b,
        0.14,
        0.7
      );
      graphics.fillStyle(0x0f172a, 0.72);
      graphics.fillCircle(
        bodyCenter.x + normalizedFacing.x * 2.4,
        bodyCenter.y + normalizedFacing.y * 2.4,
        1.2
      );
    });

    graphics.fillStyle(0xf8fafc, 0.04 + sweepPulse * 0.08);
    graphics.fillEllipse(sweepCenter.x, sweepCenter.y, 54 + sweepPulse * 10, 24 + sweepPulse * 6);
    graphics.lineStyle(1.4, 0xe2e8f0, 0.16 + sweepPulse * 0.18);
    graphics.lineBetween(
      sweepCenter.x - normalizedFacing.x * 18 - lateral.x * 4,
      sweepCenter.y - normalizedFacing.y * 18 - lateral.y * 4,
      sweepCenter.x + normalizedFacing.x * 14 - lateral.x * 2,
      sweepCenter.y + normalizedFacing.y * 14 - lateral.y * 2
    );
    graphics.lineBetween(
      sweepCenter.x - normalizedFacing.x * 10 + lateral.x * 8,
      sweepCenter.y - normalizedFacing.y * 10 + lateral.y * 8,
      sweepCenter.x + normalizedFacing.x * 20 + lateral.x * 10,
      sweepCenter.y + normalizedFacing.y * 20 + lateral.y * 10
    );
    graphics.fillStyle(0xf8fafc, 0.34);
    graphics.fillCircle(sweepCenter.x, sweepCenter.y, 2.2);
    graphics.fillCircle(sweepCenter.x + lateral.x * 7, sweepCenter.y + lateral.y * 7, 1.9);
    graphics.fillStyle(0xfef3c7, 0.12 + sweepPulse * 0.14);
    graphics.fillCircle(
      sweepCenter.x + normalizedFacing.x * 10 - lateral.x * 2,
      sweepCenter.y + normalizedFacing.y * 10 - lateral.y * 2,
      7 + sweepPulse * 2.4
    );
    graphics.fillStyle(0x64748b, 0.06 + actionProgress * 0.1);
    graphics.fillEllipse(incident.position.x, incident.position.y, 62 + actionProgress * 16, 36 + actionProgress * 10);

    if (focused || activeProgress !== null) {
      graphics.lineStyle(1.8, 0x94a3b8, 0.22 + actionProgress * 0.3);
      graphics.strokeEllipse(
        shedCenter.x,
        shedCenter.y,
        66 + slitPulse * 6 + actionProgress * 8,
        38 + slitPulse * 4 + actionProgress * 6
      );
    }
    return;
  }

  const bunkerCenter = {
    x: incident.position.x - normalizedFacing.x * 10,
    y: incident.position.y - normalizedFacing.y * 8
  };
  drawOrientedQuad(graphics, bunkerCenter, incident.facing, 28, 20, 0x020617, 0.34, 0x64748b, 0.34, 1.6);
  drawOrientedQuad(
    graphics,
    {
      x: bunkerCenter.x + normalizedFacing.x * 3,
      y: bunkerCenter.y + normalizedFacing.y * 2
    },
    incident.facing,
    23,
    15,
    0x111827,
    0.58,
    0x475569,
    0.44,
    1.2
  );

  graphics.fillStyle(0xf59e0b, 0.08 + warmPulse * 0.08 + actionProgress * 0.08);
  graphics.fillEllipse(
    bunkerCenter.x + normalizedFacing.x * 4,
    bunkerCenter.y + normalizedFacing.y * 3,
    46 + warmPulse * 10,
    28 + warmPulse * 8
  );
  graphics.fillStyle(0x22c55e, 0.04 + actionProgress * 0.12);
  graphics.fillEllipse(
    bunkerCenter.x,
    bunkerCenter.y,
    58 + actionProgress * 18,
    34 + actionProgress * 12
  );

  const laptopCenter = {
    x: bunkerCenter.x - normalizedFacing.x * 9 + lateral.x * 9,
    y: bunkerCenter.y - normalizedFacing.y * 9 + lateral.y * 9
  };
  drawOrientedQuad(graphics, laptopCenter, incident.facing, 4.8, 3.2, 0x0f172a, 0.86, 0x94a3b8, 0.5, 1);
  const screenCenter = {
    x: laptopCenter.x + normalizedFacing.x * 2.1,
    y: laptopCenter.y + normalizedFacing.y * 2.1
  };
  drawOrientedQuad(graphics, screenCenter, incident.facing, 2.2, 2.7, 0x67e8f9, 0.5 + monitorPulse * 0.22);
  graphics.fillStyle(0x67e8f9, 0.06 + monitorPulse * 0.08);
  graphics.fillCircle(screenCenter.x + normalizedFacing.x * 1.8, screenCenter.y + normalizedFacing.y * 1.8, 8 + monitorPulse * 2.4);

  const wallScreenCenter = {
    x: bunkerCenter.x + normalizedFacing.x * 13 - lateral.x * 10,
    y: bunkerCenter.y + normalizedFacing.y * 10 - lateral.y * 10
  };
  drawOrientedQuad(graphics, wallScreenCenter, incident.facing, 8.6, 5.2, 0x020617, 0.94, 0x93c5fd, 0.16, 0.8);
  drawOrientedQuad(
    graphics,
    {
      x: wallScreenCenter.x + normalizedFacing.x * 0.4,
      y: wallScreenCenter.y + normalizedFacing.y * 0.4
    },
    incident.facing,
    7.1,
    4.1,
    0x38bdf8,
    0.18 + moviePulse * 0.12 + actionProgress * 0.08
  );
  graphics.fillStyle(0x7dd3fc, 0.05 + moviePulse * 0.05 + actionProgress * 0.03);
  graphics.fillEllipse(
    wallScreenCenter.x + normalizedFacing.x * 2,
    wallScreenCenter.y + normalizedFacing.y * 2,
    26 + moviePulse * 7,
    18 + moviePulse * 5
  );
  graphics.lineStyle(0.9, 0xe0f2fe, 0.18 + moviePulse * 0.12);
  for (let index = -1; index <= 1; index += 1) {
    const offset = index * 2.2;
    graphics.lineBetween(
      wallScreenCenter.x - lateral.x * 5.2 + normalizedFacing.x * offset,
      wallScreenCenter.y - lateral.y * 5.2 + normalizedFacing.y * offset,
      wallScreenCenter.x + lateral.x * 5.2 + normalizedFacing.x * offset,
      wallScreenCenter.y + lateral.y * 5.2 + normalizedFacing.y * offset
    );
  }

  const magStackCenter = {
    x: bunkerCenter.x + normalizedFacing.x * 7 - lateral.x * 9,
    y: bunkerCenter.y + normalizedFacing.y * 7 - lateral.y * 9
  };
  for (let index = 0; index < 3; index += 1) {
    drawOrientedQuad(
      graphics,
      {
        x: magStackCenter.x - normalizedFacing.x * index * 2.2 + lateral.x * index * 1.2,
        y: magStackCenter.y - normalizedFacing.y * index * 2.2 + lateral.y * index * 1.2
      },
      incident.facing,
      3.8,
      1.15,
      0xfbbf24,
      0.62,
      0xfef3c7,
      0.38,
      0.9
    );
  }

  const cupCenter = {
    x: bunkerCenter.x + normalizedFacing.x * 10 + lateral.x * 10,
    y: bunkerCenter.y + normalizedFacing.y * 10 + lateral.y * 10
  };
  graphics.fillStyle(0xe2e8f0, 0.66);
  graphics.fillCircle(cupCenter.x, cupCenter.y, 2.2);
  graphics.fillStyle(0xf8fafc, 0.52);
  graphics.fillCircle(cupCenter.x + lateral.x * 4, cupCenter.y + lateral.y * 4, 1.9);
  graphics.lineStyle(1.1, 0xf8fafc, 0.2 + warmPulse * 0.12);
  graphics.beginPath();
  graphics.arc(cupCenter.x - 1, cupCenter.y - 5, 2.4, -Math.PI * 0.18, Math.PI * 0.72, false);
  graphics.strokePath();
  graphics.beginPath();
  graphics.arc(cupCenter.x + lateral.x * 4 + 0.4, cupCenter.y + lateral.y * 4 - 4.6, 2.1, -Math.PI * 0.14, Math.PI * 0.7, false);
  graphics.strokePath();

  const watcherBase = {
    x: bunkerCenter.x + normalizedFacing.x * 2 + lateral.x * 2,
    y: bunkerCenter.y + normalizedFacing.y * 3 + lateral.y * 2
  };
  for (let index = 0; index < 2; index += 1) {
    const sideOffset = index === 0 ? -6.5 : 5.5;
    const bodyCenter = {
      x: watcherBase.x + lateral.x * sideOffset - normalizedFacing.x * index * 2,
      y: watcherBase.y + lateral.y * sideOffset - normalizedFacing.y * index * 2
    };
    drawOrientedQuad(
      graphics,
      bodyCenter,
      incident.facing,
      4.2,
      6.2,
      0x0f172a,
      0.74,
      0x475569,
      0.18,
      0.8
    );
    graphics.fillStyle(0x0f172a, 0.82);
    graphics.fillCircle(
      bodyCenter.x - normalizedFacing.x * 2.9,
      bodyCenter.y - normalizedFacing.y * 2.9,
      1.9
    );
    graphics.lineStyle(1, 0x64748b, 0.22 + actionProgress * 0.1);
    graphics.lineBetween(
      bodyCenter.x + normalizedFacing.x * 3.1,
      bodyCenter.y + normalizedFacing.y * 0.8,
      bodyCenter.x + normalizedFacing.x * 7.2 + lateral.x * 1.5,
      bodyCenter.y + normalizedFacing.y * 0.8 + lateral.y * 1.5
    );
  }

  const rifleLeanBase = {
    x: bunkerCenter.x - lateral.x * 13 + normalizedFacing.x * 6,
    y: bunkerCenter.y - lateral.y * 13 + normalizedFacing.y * 6
  };
  graphics.lineStyle(1.2, 0x94a3b8, 0.34 + quietAlpha);
  graphics.lineBetween(
    rifleLeanBase.x,
    rifleLeanBase.y,
    rifleLeanBase.x + normalizedFacing.x * 8 + lateral.x * 2,
    rifleLeanBase.y + normalizedFacing.y * 8 + lateral.y * 2
  );
  graphics.lineBetween(
    rifleLeanBase.x + lateral.x * 3.4,
    rifleLeanBase.y + lateral.y * 3.4,
    rifleLeanBase.x + normalizedFacing.x * 7 + lateral.x * 5.2,
    rifleLeanBase.y + normalizedFacing.y * 7 + lateral.y * 5.2
  );

  graphics.lineStyle(1.2, 0x94a3b8, 0.32 + quietAlpha);
  graphics.lineBetween(
    bunkerCenter.x - lateral.x * 14 - normalizedFacing.x * 9,
    bunkerCenter.y - lateral.y * 14 - normalizedFacing.y * 9,
    bunkerCenter.x + lateral.x * 14 - normalizedFacing.x * 9,
    bunkerCenter.y + lateral.y * 14 - normalizedFacing.y * 9
  );
  graphics.lineBetween(
    bunkerCenter.x - lateral.x * 12 + normalizedFacing.x * 11,
    bunkerCenter.y - lateral.y * 12 + normalizedFacing.y * 11,
    bunkerCenter.x + lateral.x * 12 + normalizedFacing.x * 11,
    bunkerCenter.y + lateral.y * 12 + normalizedFacing.y * 11
  );

  if (focused || activeProgress !== null) {
    graphics.lineStyle(1.8, 0x22c55e, 0.26 + actionProgress * 0.34);
    graphics.strokeEllipse(
      bunkerCenter.x,
      bunkerCenter.y,
      64 + warmPulse * 6 + actionProgress * 8,
      40 + warmPulse * 5 + actionProgress * 6
    );
  }
}

function drawConvoyIncidentSetDressing(
  graphics: Phaser.GameObjects.Graphics,
  incident: FrontlineIncidentState,
  timeMs: number,
  focused: boolean,
  activeProgress: number | null
): void {
  if (incident.kind !== "convoy") {
    return;
  }

  const facingLength = Math.hypot(incident.facing.x, incident.facing.y);
  const normalizedFacing =
    facingLength > 0.001 ? { x: incident.facing.x / facingLength, y: incident.facing.y / facingLength } : { x: 1, y: 0 };
  const lateral = rotateVector(normalizedFacing, Math.PI / 2);
  const pulse = 0.5 + 0.5 * Math.sin(timeMs / 220 + incident.id * 0.8);
  const smokePulse = 0.5 + 0.5 * Math.sin(timeMs / 170 + incident.id * 1.1);
  const actionProgress = activeProgress ?? 0;

  if (incident.presentationVariant === "white-van-ambush") {
    const vanCenter = {
      x: incident.position.x + normalizedFacing.x * 4 + lateral.x * 2,
      y: incident.position.y + normalizedFacing.y * 4 + lateral.y * 2
    };
    const tailTruckCenter = {
      x: incident.position.x - normalizedFacing.x * 22 - lateral.x * 12,
      y: incident.position.y - normalizedFacing.y * 22 - lateral.y * 12
    };
    const tailgateCenter = {
      x: vanCenter.x - normalizedFacing.x * 12,
      y: vanCenter.y - normalizedFacing.y * 12
    };
    const mastTubeCenter = {
      x: incident.position.x + normalizedFacing.x * 18 + lateral.x * 16,
      y: incident.position.y + normalizedFacing.y * 18 + lateral.y * 16
    };
    const batteryCrateCenter = {
      x: incident.position.x + normalizedFacing.x * 6 - lateral.x * 16,
      y: incident.position.y + normalizedFacing.y * 6 - lateral.y * 16
    };
    const spoolCenter = {
      x: incident.position.x - normalizedFacing.x * 4 + lateral.x * 22,
      y: incident.position.y - normalizedFacing.y * 4 + lateral.y * 22
    };
    const vergeCenter = {
      x: incident.position.x + normalizedFacing.x * 40 - lateral.x * 28,
      y: incident.position.y + normalizedFacing.y * 40 - lateral.y * 28
    };

    graphics.fillStyle(0x7f1d1d, 0.06 + smokePulse * 0.08);
    graphics.fillEllipse(
      tailTruckCenter.x - normalizedFacing.x * 6,
      tailTruckCenter.y - normalizedFacing.y * 6,
      62 + smokePulse * 10,
      28 + smokePulse * 8
    );
    graphics.fillStyle(0xeab308, 0.04 + pulse * 0.06 + actionProgress * 0.08);
    graphics.fillEllipse(incident.position.x, incident.position.y, 76 + pulse * 10, 38 + pulse * 8);

    drawOrientedQuad(graphics, vanCenter, incident.facing, 16.5, 8.8, 0xf8fafc, 0.9, 0x94a3b8, 0.24, 1.2);
    drawOrientedQuad(
      graphics,
      {
        x: vanCenter.x + normalizedFacing.x * 5.6,
        y: vanCenter.y + normalizedFacing.y * 5.6
      },
      incident.facing,
      4.8,
      6.4,
      0xe5e7eb,
      0.84,
      0x1e293b,
      0.14,
      0.8
    );
    drawOrientedQuad(
      graphics,
      {
        x: vanCenter.x - normalizedFacing.x * 4.4,
        y: vanCenter.y - normalizedFacing.y * 4.4
      },
      incident.facing,
      7.6,
      6.4,
      0xffffff,
      0.86,
      0xcbd5e1,
      0.14,
      0.8
    );
    drawOrientedQuad(graphics, tailgateCenter, incident.facing, 8.2, 4.4, 0x94a3b8, 0.64, 0xe2e8f0, 0.22, 0.8);
    graphics.lineStyle(1.1, 0xe0f2fe, 0.22 + pulse * 0.14);
    graphics.lineBetween(
      tailgateCenter.x - lateral.x * 4,
      tailgateCenter.y - lateral.y * 4,
      tailgateCenter.x + lateral.x * 4,
      tailgateCenter.y + lateral.y * 4
    );

    drawOrientedQuad(graphics, tailTruckCenter, incident.facing, 13.5, 7.2, 0x111827, 0.8, 0x64748b, 0.24, 1);
    drawOrientedQuad(
      graphics,
      {
        x: tailTruckCenter.x + normalizedFacing.x * 5.2,
        y: tailTruckCenter.y + normalizedFacing.y * 5.2
      },
      incident.facing,
      4.4,
      5.2,
      0x334155,
      0.82,
      0x94a3b8,
      0.16,
      0.8
    );

    drawOrientedQuad(graphics, mastTubeCenter, incident.facing, 10.8, 2.2, 0x0f172a, 0.84, 0x93c5fd, 0.18, 0.7);
    drawOrientedQuad(
      graphics,
      {
        x: mastTubeCenter.x + normalizedFacing.x * 3.8,
        y: mastTubeCenter.y + normalizedFacing.y * 3.8
      },
      incident.facing,
      3.2,
      3.2,
      0x1e3a8a,
      0.72,
      0xbfdbfe,
      0.14,
      0.7
    );

    drawOrientedQuad(graphics, batteryCrateCenter, incident.facing, 6.6, 4.6, 0x78350f, 0.76, 0xfbbf24, 0.22, 0.9);
    drawOrientedQuad(
      graphics,
      {
        x: batteryCrateCenter.x - lateral.x * 4,
        y: batteryCrateCenter.y - lateral.y * 4
      },
      incident.facing,
      5.4,
      3.8,
      0x92400e,
      0.74,
      0xfef3c7,
      0.14,
      0.8
    );

    graphics.fillStyle(0x1d4ed8, 0.22 + pulse * 0.16);
    graphics.fillCircle(spoolCenter.x, spoolCenter.y, 4.8 + pulse * 0.8);
    graphics.lineStyle(1, 0xbfdbfe, 0.3 + pulse * 0.14);
    graphics.strokeCircle(spoolCenter.x, spoolCenter.y, 6.2 + pulse * 0.8);
    graphics.lineBetween(
      spoolCenter.x + normalizedFacing.x * 3,
      spoolCenter.y + normalizedFacing.y * 3,
      spoolCenter.x + normalizedFacing.x * 12 + lateral.x * 4,
      spoolCenter.y + normalizedFacing.y * 12 + lateral.y * 4
    );

    graphics.lineStyle(1.3, 0x93c5fd, 0.22 + pulse * 0.12);
    graphics.lineBetween(
      vergeCenter.x - lateral.x * 10 - normalizedFacing.x * 6,
      vergeCenter.y - lateral.y * 10 - normalizedFacing.y * 6,
      vergeCenter.x + lateral.x * 10 + normalizedFacing.x * 8,
      vergeCenter.y + lateral.y * 10 + normalizedFacing.y * 8
    );
    graphics.lineStyle(1.1, 0xe0f2fe, 0.16 + pulse * 0.1);
    graphics.lineBetween(
      vergeCenter.x - lateral.x * 5,
      vergeCenter.y - lateral.y * 5,
      vergeCenter.x + normalizedFacing.x * 9 - lateral.x * 3,
      vergeCenter.y + normalizedFacing.y * 9 - lateral.y * 3
    );

    graphics.fillStyle(0xfb7185, 0.1 + pulse * 0.08);
    graphics.fillCircle(
      vanCenter.x - normalizedFacing.x * 18 + lateral.x * 10,
      vanCenter.y - normalizedFacing.y * 18 + lateral.y * 10,
      5.8 + pulse * 1.4
    );

    if (focused || activeProgress !== null) {
      graphics.lineStyle(1.8, 0x38bdf8, 0.24 + pulse * 0.18 + actionProgress * 0.22);
      graphics.strokeEllipse(
        incident.position.x,
        incident.position.y,
        78 + pulse * 10 + actionProgress * 10,
        40 + pulse * 6 + actionProgress * 6
      );
    }
    return;
  }

  if (incident.presentationVariant === "armored-drop") {
    const hullCenter = {
      x: incident.position.x + normalizedFacing.x * 6 + lateral.x * 3,
      y: incident.position.y + normalizedFacing.y * 6 + lateral.y * 3
    };
    const rampCenter = {
      x: hullCenter.x - normalizedFacing.x * 15,
      y: hullCenter.y - normalizedFacing.y * 15
    };
    const bermCenter = {
      x: incident.position.x + normalizedFacing.x * 24 - lateral.x * 14,
      y: incident.position.y + normalizedFacing.y * 24 - lateral.y * 14
    };
    const dismountCenters = [
      {
        x: rampCenter.x - normalizedFacing.x * 5 + lateral.x * 7,
        y: rampCenter.y - normalizedFacing.y * 5 + lateral.y * 7
      },
      {
        x: rampCenter.x - normalizedFacing.x * 11 - lateral.x * 2,
        y: rampCenter.y - normalizedFacing.y * 11 - lateral.y * 2
      },
      {
        x: rampCenter.x - normalizedFacing.x * 17 - lateral.x * 10,
        y: rampCenter.y - normalizedFacing.y * 17 - lateral.y * 10
      }
    ];
    const dismountColors = [0x60a5fa, 0x4ade80, 0xfacc15];

    graphics.fillStyle(0x7f1d1d, 0.06 + smokePulse * 0.1);
    graphics.fillEllipse(
      hullCenter.x - normalizedFacing.x * 10,
      hullCenter.y - normalizedFacing.y * 10,
      64 + smokePulse * 12,
      28 + smokePulse * 8
    );
    graphics.fillStyle(0x38bdf8, 0.05 + actionProgress * 0.1 + pulse * 0.06);
    graphics.fillEllipse(incident.position.x, incident.position.y, 78 + pulse * 10, 38 + pulse * 8);

    drawOrientedQuad(graphics, hullCenter, incident.facing, 19, 10.5, 0x0f172a, 0.9, 0x94a3b8, 0.36, 1.4);
    drawOrientedQuad(
      graphics,
      {
        x: hullCenter.x + normalizedFacing.x * 4.8,
        y: hullCenter.y + normalizedFacing.y * 4.8
      },
      incident.facing,
      6,
      7.2,
      0x334155,
      0.86,
      0xe2e8f0,
      0.22,
      0.8
    );
    drawOrientedQuad(
      graphics,
      {
        x: hullCenter.x - normalizedFacing.x * 4.8,
        y: hullCenter.y - normalizedFacing.y * 4.8
      },
      incident.facing,
      8.6,
      7.6,
      0x1e293b,
      0.84,
      0xcbd5e1,
      0.18,
      0.8
    );
    drawOrientedQuad(graphics, rampCenter, incident.facing, 9.8, 4.6, 0x475569, 0.64, 0xe2e8f0, 0.24, 0.8);
    graphics.lineStyle(1.2, 0xe0f2fe, 0.28 + pulse * 0.18);
    graphics.lineBetween(
      rampCenter.x - lateral.x * 4,
      rampCenter.y - lateral.y * 4,
      rampCenter.x + lateral.x * 4,
      rampCenter.y + lateral.y * 4
    );
    graphics.lineBetween(
      rampCenter.x - normalizedFacing.x * 4,
      rampCenter.y - normalizedFacing.y * 4,
      rampCenter.x + normalizedFacing.x * 4,
      rampCenter.y + normalizedFacing.y * 4
    );

    dismountCenters.forEach((center, index) => {
      const accent = dismountColors[index] ?? 0x60a5fa;
      drawOrientedQuad(graphics, center, incident.facing, 5.2, 2.8, 0x111827, 0.72, accent, 0.34, 0.8);
      graphics.fillStyle(0xf8fafc, 0.56);
      graphics.fillCircle(center.x + normalizedFacing.x * 2.8, center.y + normalizedFacing.y * 2.8, 1.35);
      drawOrientedQuad(
        graphics,
        {
          x: center.x - lateral.x * 2.2,
          y: center.y - lateral.y * 2.2
        },
        incident.facing,
        1.4,
        0.8,
        accent,
        0.72,
        0xf8fafc,
        0.12,
        0.6
      );
    });

    drawOrientedQuad(graphics, bermCenter, incident.facing, 8.6, 5.2, 0x422006, 0.62, 0xfbbf24, 0.22, 0.9);
    for (let index = 0; index < 4; index += 1) {
      drawOrientedQuad(
        graphics,
        {
          x: bermCenter.x - normalizedFacing.x * (index * 2.1 - 3),
          y: bermCenter.y - normalizedFacing.y * (index * 2.1 - 3)
        },
        incident.facing,
        2.4,
        1.3,
        index < 2 ? 0x60a5fa : 0xcbd5e1,
        0.58,
        0xf8fafc,
        0.18,
        0.7
      );
    }

    graphics.fillStyle(0xfb7185, 0.12 + pulse * 0.12);
    graphics.fillCircle(
      hullCenter.x - normalizedFacing.x * 20 + lateral.x * 12,
      hullCenter.y - normalizedFacing.y * 20 + lateral.y * 12,
      6 + pulse * 2.4
    );
    graphics.lineStyle(1.3, 0xfca5a5, 0.22 + smokePulse * 0.12);
    graphics.lineBetween(
      hullCenter.x - lateral.x * 8 - normalizedFacing.x * 16,
      hullCenter.y - lateral.y * 8 - normalizedFacing.y * 16,
      hullCenter.x + lateral.x * 6 - normalizedFacing.x * 28,
      hullCenter.y + lateral.y * 6 - normalizedFacing.y * 28
    );

    if (focused || activeProgress !== null) {
      graphics.lineStyle(1.8, 0x38bdf8, 0.24 + actionProgress * 0.34);
      graphics.strokeEllipse(
        incident.position.x,
        incident.position.y,
        84 + pulse * 8 + actionProgress * 12,
        42 + pulse * 6 + actionProgress * 8
      );
    }
    return;
  }

  if (incident.presentationVariant === "caravan-trap") {
    const wreckCenters = [
      {
        x: incident.position.x - normalizedFacing.x * 14 + lateral.x * 3,
        y: incident.position.y - normalizedFacing.y * 14 + lateral.y * 3
      },
      {
        x: incident.position.x + normalizedFacing.x * 12 - lateral.x * 16,
        y: incident.position.y + normalizedFacing.y * 12 - lateral.y * 16
      },
      {
        x: incident.position.x + normalizedFacing.x * 34 + lateral.x * 18,
        y: incident.position.y + normalizedFacing.y * 34 + lateral.y * 18
      }
    ];
    const crateCenter = {
      x: incident.position.x + normalizedFacing.x * 8 + lateral.x * 20,
      y: incident.position.y + normalizedFacing.y * 8 + lateral.y * 20
    };
    const bagCenter = {
      x: incident.position.x - normalizedFacing.x * 18 - lateral.x * 12,
      y: incident.position.y - normalizedFacing.y * 18 - lateral.y * 12
    };
    const bermCenter = {
      x: incident.position.x + normalizedFacing.x * 44 - lateral.x * 32,
      y: incident.position.y + normalizedFacing.y * 44 - lateral.y * 32
    };
    const sparkPulse = 0.5 + 0.5 * Math.sin(timeMs / 120 + incident.id * 1.6);

    graphics.fillStyle(0x7f1d1d, 0.08 + smokePulse * 0.12);
    graphics.fillEllipse(incident.position.x, incident.position.y, 92 + smokePulse * 16, 44 + smokePulse * 10);
    graphics.fillStyle(0xf97316, 0.04 + pulse * 0.08 + actionProgress * 0.08);
    graphics.fillEllipse(
      incident.position.x + normalizedFacing.x * 10,
      incident.position.y + normalizedFacing.y * 10,
      84 + pulse * 12,
      36 + pulse * 8
    );

    wreckCenters.forEach((center, index) => {
      const width = index === 2 ? 15 : 17;
      const height = index === 2 ? 7.8 : 8.8;
      const localFacing =
        index === 1 ? rotateVector(normalizedFacing, 0.26) : index === 2 ? rotateVector(normalizedFacing, -0.48) : normalizedFacing;
      drawOrientedQuad(graphics, center, localFacing, width, height, 0x111827, 0.88, 0x94a3b8, 0.24, 1.2);
      drawOrientedQuad(
        graphics,
        {
          x: center.x + localFacing.x * 3.6,
          y: center.y + localFacing.y * 3.6
        },
        localFacing,
        4.6,
        5.2,
        0x374151,
        0.82,
        0xe2e8f0,
        0.16,
        0.8
      );
      graphics.fillStyle(0xf97316, 0.08 + smokePulse * 0.1 + (index === 0 ? 0.05 : 0));
      graphics.fillEllipse(center.x, center.y, 36 + smokePulse * 10, 20 + smokePulse * 6);
      graphics.fillStyle(0xfbbf24, 0.08 + sparkPulse * 0.14);
      graphics.fillCircle(center.x - localFacing.x * 6, center.y - localFacing.y * 6, 4.6 + sparkPulse * 1.8);
      graphics.fillStyle(0xf8fafc, 0.1 + sparkPulse * 0.12);
      graphics.fillCircle(center.x - localFacing.x * 9, center.y - localFacing.y * 9, 1.5 + sparkPulse * 0.8);
      graphics.fillCircle(
        center.x - localFacing.x * 4 + lateral.x * 2,
        center.y - localFacing.y * 4 + lateral.y * 2,
        1.2 + sparkPulse * 0.6
      );
    });

    drawOrientedQuad(graphics, crateCenter, incident.facing, 6.2, 4.2, 0x92400e, 0.72, 0xfbbf24, 0.28, 0.9);
    drawOrientedQuad(
      graphics,
      {
        x: crateCenter.x + lateral.x * 4,
        y: crateCenter.y + lateral.y * 4
      },
      incident.facing,
      4.6,
      3.2,
      0x78350f,
      0.68,
      0xfef3c7,
      0.18,
      0.8
    );
    graphics.lineStyle(1.1, 0xfef3c7, 0.18 + pulse * 0.12);
    graphics.lineBetween(
      crateCenter.x - normalizedFacing.x * 3.2,
      crateCenter.y - normalizedFacing.y * 3.2,
      crateCenter.x + normalizedFacing.x * 3.2,
      crateCenter.y + normalizedFacing.y * 3.2
    );

    drawOrientedQuad(graphics, bagCenter, incident.facing, 7.6, 4.4, 0x0f172a, 0.82, 0xe5e7eb, 0.14, 0.9);
    graphics.fillStyle(0xe5e7eb, 0.4);
    graphics.fillCircle(bagCenter.x + normalizedFacing.x * 3.2, bagCenter.y + normalizedFacing.y * 3.2, 1.4);

    graphics.lineStyle(1.4, 0x93c5fd, 0.22 + pulse * 0.14);
    graphics.lineBetween(
      bermCenter.x - lateral.x * 10 - normalizedFacing.x * 8,
      bermCenter.y - lateral.y * 10 - normalizedFacing.y * 8,
      bermCenter.x + lateral.x * 10 + normalizedFacing.x * 6,
      bermCenter.y + lateral.y * 10 + normalizedFacing.y * 6
    );
    graphics.lineStyle(1.1, 0xe0f2fe, 0.16 + pulse * 0.1);
    graphics.lineBetween(
      bermCenter.x - lateral.x * 6,
      bermCenter.y - lateral.y * 6,
      bermCenter.x + normalizedFacing.x * 10 - lateral.x * 3,
      bermCenter.y + normalizedFacing.y * 10 - lateral.y * 3
    );

    if (focused || activeProgress !== null) {
      graphics.lineStyle(1.8, 0xf97316, 0.24 + pulse * 0.18 + actionProgress * 0.18);
      graphics.strokeEllipse(
        incident.position.x,
        incident.position.y,
        72 + pulse * 10 + actionProgress * 10,
        38 + pulse * 6 + actionProgress * 6
      );
    }
    return;
  }

  const leadTruckCenter = {
    x: incident.position.x + normalizedFacing.x * 8 + lateral.x * 4,
    y: incident.position.y + normalizedFacing.y * 8 + lateral.y * 4
  };
  const rearTruckCenter = {
    x: incident.position.x - normalizedFacing.x * 18 - lateral.x * 10,
    y: incident.position.y - normalizedFacing.y * 18 - lateral.y * 10
  };
  const crateCenter = {
    x: incident.position.x - normalizedFacing.x * 4 + lateral.x * 15,
    y: incident.position.y - normalizedFacing.y * 4 + lateral.y * 15
  };
  const ammoPalletCenter = {
    x: incident.position.x + normalizedFacing.x * 10 - lateral.x * 14,
    y: incident.position.y + normalizedFacing.y * 10 - lateral.y * 14
  };
  const roadFlareCenter = {
    x: incident.position.x - normalizedFacing.x * 26,
    y: incident.position.y - normalizedFacing.y * 26
  };

  graphics.fillStyle(0x7c2d12, 0.08 + smokePulse * 0.08);
  graphics.fillEllipse(
    rearTruckCenter.x - normalizedFacing.x * 6,
    rearTruckCenter.y - normalizedFacing.y * 6,
    58 + smokePulse * 10,
    26 + smokePulse * 8
  );
  graphics.fillStyle(0xf59e0b, 0.04 + pulse * 0.08 + actionProgress * 0.08);
  graphics.fillEllipse(
    incident.position.x,
    incident.position.y,
    70 + pulse * 10 + actionProgress * 10,
    34 + pulse * 8 + actionProgress * 6
  );

  drawOrientedQuad(graphics, leadTruckCenter, incident.facing, 16, 8.4, 0x1f2937, 0.78, 0x94a3b8, 0.32, 1.2);
  drawOrientedQuad(
    graphics,
    {
      x: leadTruckCenter.x + normalizedFacing.x * 6.5,
      y: leadTruckCenter.y + normalizedFacing.y * 6.5
    },
    incident.facing,
    5.4,
    6.8,
    0x334155,
    0.84,
    0xe2e8f0,
    0.24,
    0.8
  );
  drawOrientedQuad(graphics, rearTruckCenter, incident.facing, 15, 7.6, 0x111827, 0.72, 0x64748b, 0.28, 1);
  drawOrientedQuad(
    graphics,
    {
      x: rearTruckCenter.x + normalizedFacing.x * 5.5,
      y: rearTruckCenter.y + normalizedFacing.y * 5.5
    },
    incident.facing,
    5,
    6,
    0x475569,
    0.78,
    0xcbd5e1,
    0.2,
    0.8
  );

  graphics.lineStyle(1.2, 0xf8fafc, 0.18 + pulse * 0.08);
  graphics.lineBetween(
    rearTruckCenter.x - lateral.x * 8 - normalizedFacing.x * 8,
    rearTruckCenter.y - lateral.y * 8 - normalizedFacing.y * 8,
    rearTruckCenter.x + lateral.x * 8 - normalizedFacing.x * 8,
    rearTruckCenter.y + lateral.y * 8 - normalizedFacing.y * 8
  );
  graphics.lineBetween(
    rearTruckCenter.x - lateral.x * 10 + normalizedFacing.x * 12,
    rearTruckCenter.y - lateral.y * 10 + normalizedFacing.y * 12,
    rearTruckCenter.x + lateral.x * 10 + normalizedFacing.x * 12,
    rearTruckCenter.y + lateral.y * 10 + normalizedFacing.y * 12
  );

  drawOrientedQuad(graphics, crateCenter, incident.facing, 5.2, 4.1, 0x92400e, 0.78, 0xfbbf24, 0.28, 1);
  drawOrientedQuad(
    graphics,
    {
      x: crateCenter.x - normalizedFacing.x * 1.8 + lateral.x * 2.8,
      y: crateCenter.y - normalizedFacing.y * 1.8 + lateral.y * 2.8
    },
    incident.facing,
    3.2,
    1.1,
    0xf8fafc,
    0.32 + pulse * 0.16
  );
  graphics.fillStyle(0x60a5fa, 0.12 + pulse * 0.1);
  graphics.fillCircle(crateCenter.x + lateral.x * 4, crateCenter.y + lateral.y * 4, 7 + pulse * 2.4);

  drawOrientedQuad(graphics, ammoPalletCenter, incident.facing, 8.2, 5.2, 0x422006, 0.58, 0x92400e, 0.28, 0.9);
  for (let index = 0; index < 3; index += 1) {
    drawOrientedQuad(
      graphics,
      {
        x: ammoPalletCenter.x - normalizedFacing.x * (index * 2.2 - 2),
        y: ammoPalletCenter.y - normalizedFacing.y * (index * 2.2 - 2)
      },
      incident.facing,
      2.6,
      1.4,
      0x1d4ed8,
      0.56,
      0xbfdbfe,
      0.22,
      0.7
    );
  }

  graphics.fillStyle(0xfb7185, 0.12 + pulse * 0.12);
  graphics.fillCircle(roadFlareCenter.x, roadFlareCenter.y, 6 + pulse * 2.4);
  graphics.lineStyle(1.3, 0xfca5a5, 0.22 + smokePulse * 0.12);
  graphics.lineBetween(
    roadFlareCenter.x + lateral.x * 5,
    roadFlareCenter.y + lateral.y * 5,
    roadFlareCenter.x - lateral.x * 7 - normalizedFacing.x * 16,
    roadFlareCenter.y - lateral.y * 7 - normalizedFacing.y * 16
  );
  graphics.lineBetween(
    roadFlareCenter.x - lateral.x * 5,
    roadFlareCenter.y - lateral.y * 5,
    roadFlareCenter.x + lateral.x * 8 - normalizedFacing.x * 14,
    roadFlareCenter.y + lateral.y * 8 - normalizedFacing.y * 14
  );

  if (focused || activeProgress !== null) {
    graphics.lineStyle(1.8, 0x60a5fa, 0.24 + actionProgress * 0.34);
    graphics.strokeEllipse(
      incident.position.x,
      incident.position.y,
      78 + pulse * 8 + actionProgress * 12,
      40 + pulse * 6 + actionProgress * 8
    );
  }
}

function getPlannedExtractCueVisualKind(cue: ReturnType<typeof getPlannedExtractStageCues>[number]):
  | "screen-cars"
  | "signal-van"
  | "relay-grid"
  | "logi-truck"
  | "bag-pull" {
  const cueRead = `${cue.label} ${cue.supportLabel} ${cue.compactLabel} ${cue.detail}`.toLowerCase();
  if (cue.label.startsWith("Bag Pull")) {
    return "bag-pull";
  }
  if (cueRead.includes("signal van") || cueRead.includes("white van") || cueRead.includes("van")) {
    return "signal-van";
  }
  if (cueRead.includes("relay")) {
    return "relay-grid";
  }
  if (cueRead.includes("truck") || cueRead.includes("logi") || cueRead.includes("convoy")) {
    return "logi-truck";
  }
  return "screen-cars";
}

function drawPlannedExtractCueSetDressing(
  graphics: Phaser.GameObjects.Graphics,
  cue: ReturnType<typeof getPlannedExtractStageCues>[number],
  extractPosition: { x: number; y: number },
  timeMs: number,
  index: number
): void {
  const toExtract = {
    x: extractPosition.x - cue.position.x,
    y: extractPosition.y - cue.position.y
  };
  const facingLength = Math.hypot(toExtract.x, toExtract.y);
  const facing =
    facingLength > 0.001 ? { x: toExtract.x / facingLength, y: toExtract.y / facingLength } : { x: 1, y: 0 };
  const lateral = rotateVector(facing, Math.PI / 2);
  const pulse = 0.5 + 0.5 * Math.sin(timeMs / 210 + cue.position.x * 0.01 + index * 0.8);
  const driftPulse = 0.5 + 0.5 * Math.sin(timeMs / 170 + cue.position.y * 0.012 + index);
  const visualKind = getPlannedExtractCueVisualKind(cue);

  graphics.fillStyle(cue.color, 0.04 + pulse * 0.08);
  graphics.fillEllipse(cue.position.x, cue.position.y, cue.radius * 3.2 + pulse * 8, cue.radius * 1.8 + pulse * 5);
  graphics.lineStyle(1.2, cue.accent, 0.16 + pulse * 0.08);
  graphics.lineBetween(
    cue.position.x + lateral.x * 8,
    cue.position.y + lateral.y * 8,
    cue.position.x - lateral.x * 8 + facing.x * 20,
    cue.position.y - lateral.y * 8 + facing.y * 20
  );
  graphics.lineBetween(
    cue.position.x - lateral.x * 8,
    cue.position.y - lateral.y * 8,
    cue.position.x + lateral.x * 8 + facing.x * 20,
    cue.position.y + lateral.y * 8 + facing.y * 20
  );

  if (visualKind === "screen-cars") {
    const carCenters = [
      {
        x: cue.position.x - facing.x * 6 - lateral.x * 8,
        y: cue.position.y - facing.y * 6 - lateral.y * 8
      },
      {
        x: cue.position.x + facing.x * 8 + lateral.x * 10,
        y: cue.position.y + facing.y * 8 + lateral.y * 10
      }
    ];
    const carColors = [0x9ca3af, 0x64748b];
    carCenters.forEach((center, carIndex) => {
      drawOrientedQuad(
        graphics,
        center,
        facing,
        9.6,
        4.8,
        carColors[carIndex] ?? 0x94a3b8,
        0.74,
        0xf8fafc,
        0.18,
        0.9
      );
      drawOrientedQuad(
        graphics,
        {
          x: center.x + facing.x * 2.6,
          y: center.y + facing.y * 2.6
        },
        facing,
        3.2,
        3.1,
        0x1e293b,
        0.78,
        0xe2e8f0,
        0.18,
        0.7
      );
    });
    graphics.fillStyle(0xf97316, 0.08 + driftPulse * 0.08);
    graphics.fillCircle(
      cue.position.x - facing.x * 16 + lateral.x * 3,
      cue.position.y - facing.y * 16 + lateral.y * 3,
      5 + driftPulse * 1.8
    );
    return;
  }

  if (visualKind === "signal-van") {
    drawOrientedQuad(graphics, cue.position, facing, 14, 6.8, 0xe5e7eb, 0.76, 0x94a3b8, 0.24, 1);
    drawOrientedQuad(
      graphics,
      {
        x: cue.position.x + facing.x * 4.8,
        y: cue.position.y + facing.y * 4.8
      },
      facing,
      4.6,
      5.2,
      0xcbd5e1,
      0.82,
      0xf8fafc,
      0.2,
      0.8
    );
    graphics.lineStyle(1.1, 0x67e8f9, 0.24 + pulse * 0.16);
    graphics.lineBetween(
      cue.position.x - facing.x * 2 + lateral.x * 2,
      cue.position.y - facing.y * 2 + lateral.y * 2,
      cue.position.x - facing.x * 2 + lateral.x * 2,
      cue.position.y - facing.y * 18 + lateral.y * 2
    );
    graphics.strokeCircle(
      cue.position.x - facing.x * 2 + lateral.x * 2,
      cue.position.y - facing.y * 20 + lateral.y * 2,
      4 + pulse * 2
    );
    return;
  }

  if (visualKind === "relay-grid") {
    drawOrientedQuad(graphics, cue.position, facing, 7.5, 6, 0x0f172a, 0.78, 0x94a3b8, 0.22, 0.9);
    drawOrientedQuad(
      graphics,
      {
        x: cue.position.x + lateral.x * 7,
        y: cue.position.y + lateral.y * 7
      },
      facing,
      4.4,
      3.2,
      0x1d4ed8,
      0.58,
      0xbfdbfe,
      0.22,
      0.7
    );
    graphics.lineStyle(1.2, 0x67e8f9, 0.2 + pulse * 0.14);
    graphics.lineBetween(cue.position.x, cue.position.y - 4, cue.position.x, cue.position.y - 16);
    graphics.lineBetween(cue.position.x, cue.position.y - 16, cue.position.x - 7, cue.position.y - 8);
    graphics.lineBetween(cue.position.x, cue.position.y - 16, cue.position.x + 7, cue.position.y - 8);
    return;
  }

  if (visualKind === "logi-truck") {
    const truckCenter = {
      x: cue.position.x - facing.x * 2,
      y: cue.position.y - facing.y * 2
    };
    drawOrientedQuad(graphics, truckCenter, facing, 15.5, 7.4, 0x1f2937, 0.76, 0x94a3b8, 0.24, 1);
    drawOrientedQuad(
      graphics,
      {
        x: truckCenter.x + facing.x * 5.8,
        y: truckCenter.y + facing.y * 5.8
      },
      facing,
      4.8,
      5.6,
      0x475569,
      0.82,
      0xe2e8f0,
      0.18,
      0.8
    );
    drawOrientedQuad(
      graphics,
      {
        x: truckCenter.x - facing.x * 10 - lateral.x * 9,
        y: truckCenter.y - facing.y * 10 - lateral.y * 9
      },
      facing,
      8.4,
      4.2,
      0x94a3b8,
      0.7,
      0xf8fafc,
      0.14,
      0.7
    );
    return;
  }

  const bodyCenter = {
    x: cue.position.x + facing.x * 6,
    y: cue.position.y + facing.y * 6
  };
  drawOrientedQuad(graphics, bodyCenter, facing, 12, 5.4, 0x020617, 0.8, 0x94a3b8, 0.36, 1);
  drawOrientedQuad(
    graphics,
    {
      x: cue.position.x - facing.x * 7 + lateral.x * 8,
      y: cue.position.y - facing.y * 7 + lateral.y * 8
    },
    facing,
    5,
    3.2,
    0x166534,
    0.68,
    0x86efac,
    0.28,
    0.8
  );
  graphics.lineStyle(1.2, 0xf8fafc, 0.22 + pulse * 0.1);
  graphics.strokeEllipse(
    cue.position.x - facing.x * 10 - lateral.x * 10,
    cue.position.y - facing.y * 10 - lateral.y * 10,
    16,
    9
  );
}

function drawCasualtyIncidentSetDressing(
  graphics: Phaser.GameObjects.Graphics,
  incident: FrontlineIncidentState,
  timeMs: number,
  focused: boolean,
  activeProgress: number | null
): void {
  if (incident.kind !== "casualty") {
    return;
  }

  const facingLength = Math.hypot(incident.facing.x, incident.facing.y);
  const normalizedFacing =
    facingLength > 0.001 ? { x: incident.facing.x / facingLength, y: incident.facing.y / facingLength } : { x: 1, y: 0 };
  const lateral = rotateVector(normalizedFacing, Math.PI / 2);
  const pulse = 0.5 + 0.5 * Math.sin(timeMs / 220 + incident.id * 0.9);
  const dragPulse = 0.5 + 0.5 * Math.sin(timeMs / 170 + incident.id * 1.4);
  const actionProgress = activeProgress ?? 0;
  const bodyCenter = {
    x: incident.position.x + normalizedFacing.x * 2,
    y: incident.position.y + normalizedFacing.y * 1
  };

  graphics.fillStyle(0x7f1d1d, 0.12 + dragPulse * 0.08);
  graphics.fillEllipse(
    bodyCenter.x - normalizedFacing.x * 8,
    bodyCenter.y - normalizedFacing.y * 6,
    42 + dragPulse * 8,
    18 + dragPulse * 5
  );
  graphics.lineStyle(1.4, 0xfca5a5, 0.22 + pulse * 0.14);
  graphics.lineBetween(
    bodyCenter.x - normalizedFacing.x * 28,
    bodyCenter.y - normalizedFacing.y * 10,
    bodyCenter.x - normalizedFacing.x * 8,
    bodyCenter.y - normalizedFacing.y * 2
  );
  graphics.lineBetween(
    bodyCenter.x - normalizedFacing.x * 24 + lateral.x * 4,
    bodyCenter.y - normalizedFacing.y * 8 + lateral.y * 4,
    bodyCenter.x - normalizedFacing.x * 5 + lateral.x * 2,
    bodyCenter.y - normalizedFacing.y * 1 + lateral.y * 2
  );

  const bagCenter = {
    x: incident.position.x - normalizedFacing.x * 13 - lateral.x * 6,
    y: incident.position.y - normalizedFacing.y * 13 - lateral.y * 6
  };
  drawOrientedQuad(graphics, bagCenter, incident.facing, 12, 5.6, 0x020617, 0.78, 0x94a3b8, 0.36, 1.2);
  drawOrientedQuad(
    graphics,
    {
      x: bagCenter.x - normalizedFacing.x * 3.8,
      y: bagCenter.y - normalizedFacing.y * 3.8
    },
    incident.facing,
    3.1,
    1.1,
    0xe2e8f0,
    0.42,
    0xf8fafc,
    0.28,
    0.8
  );

  const casualtyBodyCenter = {
    x: incident.position.x + normalizedFacing.x * 10 + lateral.x * 5,
    y: incident.position.y + normalizedFacing.y * 10 + lateral.y * 5
  };
  drawOrientedQuad(graphics, casualtyBodyCenter, incident.facing, 11, 4.6, 0x7c2d12, 0.44, 0xfb7185, 0.24, 1);
  graphics.fillStyle(0xf8fafc, 0.46);
  graphics.fillCircle(
    casualtyBodyCenter.x + normalizedFacing.x * 5.4,
    casualtyBodyCenter.y + normalizedFacing.y * 5.4,
    2.4
  );

  const satchelCenter = {
    x: incident.position.x - normalizedFacing.x * 4 + lateral.x * 13,
    y: incident.position.y - normalizedFacing.y * 4 + lateral.y * 13
  };
  drawOrientedQuad(graphics, satchelCenter, incident.facing, 5.2, 3.4, 0x166534, 0.7, 0x86efac, 0.34, 1);
  drawOrientedQuad(
    graphics,
    {
      x: satchelCenter.x + lateral.x * 1.8,
      y: satchelCenter.y + lateral.y * 1.8
    },
    incident.facing,
    1.8,
    0.9,
    0xf8fafc,
    0.28 + pulse * 0.18
  );

  const strapCenter = {
    x: incident.position.x + normalizedFacing.x * 1.5 - lateral.x * 15,
    y: incident.position.y + normalizedFacing.y * 1.5 - lateral.y * 15
  };
  graphics.lineStyle(1.2, 0xf8fafc, 0.28 + pulse * 0.1);
  graphics.strokeEllipse(strapCenter.x, strapCenter.y, 16, 9);
  graphics.strokeEllipse(strapCenter.x + lateral.x * 4, strapCenter.y + lateral.y * 4, 9, 5);

  graphics.fillStyle(0xc084fc, 0.05 + actionProgress * 0.12);
  graphics.fillEllipse(incident.position.x, incident.position.y, 56 + actionProgress * 18, 28 + actionProgress * 10);

  const medevacSupport =
    raidController.state.frontlineSupports.find(
      (support) =>
        support.kind === "convoy" &&
        Phaser.Math.Distance.Between(support.position.x, support.position.y, incident.position.x, incident.position.y) <=
          incident.radius + 172
    ) ?? null;
  const medevacIncident =
    raidController.state.frontlineIncidents.find(
      (entry) =>
        !entry.resolved &&
        entry.kind === "convoy" &&
        Phaser.Math.Distance.Between(entry.position.x, entry.position.y, incident.position.x, incident.position.y) <=
          incident.radius + 196
    ) ?? null;
  if (medevacSupport || medevacIncident) {
    const wagonFacing = medevacSupport?.facing ?? medevacIncident?.facing ?? incident.facing;
    const wagonFacingLength = Math.hypot(wagonFacing.x, wagonFacing.y);
    const normalizedWagonFacing =
      wagonFacingLength > 0.001 ? { x: wagonFacing.x / wagonFacingLength, y: wagonFacing.y / wagonFacingLength } : normalizedFacing;
    const wagonLateral = rotateVector(normalizedWagonFacing, Math.PI / 2);
    const strobePulse = 0.5 + 0.5 * Math.sin(timeMs / 120 + incident.id * 1.8);
    const wagonCenter = {
      x: incident.position.x - normalizedFacing.x * 18 + lateral.x * 22,
      y: incident.position.y - normalizedFacing.y * 18 + lateral.y * 22
    };
    const rampCenter = {
      x: wagonCenter.x + normalizedWagonFacing.x * 13,
      y: wagonCenter.y + normalizedWagonFacing.y * 13
    };
    drawOrientedQuad(graphics, wagonCenter, wagonFacing, 18, 9.6, 0x0f172a, 0.88, 0x94a3b8, 0.34, 1.3);
    drawOrientedQuad(
      graphics,
      {
        x: wagonCenter.x - normalizedWagonFacing.x * 4.5,
        y: wagonCenter.y - normalizedWagonFacing.y * 4.5
      },
      wagonFacing,
      5.6,
      4.2,
      0xe5e7eb,
      0.3 + strobePulse * 0.18,
      0xf8fafc,
      0.18,
      0.8
    );
    drawOrientedQuad(graphics, rampCenter, wagonFacing, 8.4, 4.1, 0x475569, 0.58, 0xcbd5e1, 0.22, 0.8);
    graphics.fillStyle(0x38bdf8, 0.12 + strobePulse * 0.18);
    graphics.fillEllipse(wagonCenter.x, wagonCenter.y, 48 + strobePulse * 10, 24 + strobePulse * 6);
    graphics.fillStyle(0xe2e8f0, 0.68);
    graphics.fillCircle(wagonCenter.x - wagonLateral.x * 5.5, wagonCenter.y - wagonLateral.y * 5.5, 1.9);
    graphics.fillCircle(wagonCenter.x + wagonLateral.x * 5.5, wagonCenter.y + wagonLateral.y * 5.5, 1.9);
    graphics.lineStyle(1.2, 0xe0f2fe, 0.34 + strobePulse * 0.18);
    graphics.lineBetween(
      rampCenter.x - wagonLateral.x * 4,
      rampCenter.y - wagonLateral.y * 4,
      rampCenter.x + wagonLateral.x * 4,
      rampCenter.y + wagonLateral.y * 4
    );
    graphics.lineBetween(
      rampCenter.x - normalizedWagonFacing.x * 3,
      rampCenter.y - normalizedWagonFacing.y * 3,
      rampCenter.x + normalizedWagonFacing.x * 3,
      rampCenter.y + normalizedWagonFacing.y * 3
    );
    const medicCenters = [
      {
        x: rampCenter.x - wagonLateral.x * 5 + normalizedWagonFacing.x * 2,
        y: rampCenter.y - wagonLateral.y * 5 + normalizedWagonFacing.y * 2
      },
      {
        x: rampCenter.x + wagonLateral.x * 4 - normalizedWagonFacing.x * 1.5,
        y: rampCenter.y + wagonLateral.y * 4 - normalizedWagonFacing.y * 1.5
      }
    ];
    for (const medicCenter of medicCenters) {
      drawOrientedQuad(graphics, medicCenter, wagonFacing, 4.2, 2.2, 0x94a3b8, 0.58, 0xe2e8f0, 0.24, 0.7);
      graphics.fillStyle(0xf8fafc, 0.58);
      graphics.fillCircle(
        medicCenter.x + normalizedWagonFacing.x * 2.2,
        medicCenter.y + normalizedWagonFacing.y * 2.2,
        1.2
      );
    }
  }

  if (focused || activeProgress !== null) {
    graphics.lineStyle(1.8, 0xe879f9, 0.22 + pulse * 0.2 + actionProgress * 0.22);
    graphics.strokeEllipse(
      incident.position.x,
      incident.position.y,
      62 + pulse * 8 + actionProgress * 10,
      34 + pulse * 5 + actionProgress * 6
    );
  }
}

function drawCivilianIncidentSetDressing(
  graphics: Phaser.GameObjects.Graphics,
  incident: FrontlineIncidentState,
  timeMs: number,
  focused: boolean,
  activeProgress: number | null
): void {
  if (incident.kind !== "civilian") {
    return;
  }

  const facingLength = Math.hypot(incident.facing.x, incident.facing.y);
  const normalizedFacing =
    facingLength > 0.001 ? { x: incident.facing.x / facingLength, y: incident.facing.y / facingLength } : { x: 1, y: 0 };
  const lateral = rotateVector(normalizedFacing, Math.PI / 2);
  const lampPulse = 0.5 + 0.5 * Math.sin(timeMs / 240 + incident.id * 0.7);
  const tensionPulse = 0.5 + 0.5 * Math.sin(timeMs / 180 + incident.id * 1.1);
  const actionProgress = activeProgress ?? 0;

  if (incident.presentationVariant === "hunter-search") {
    const shackCenter = {
      x: incident.position.x - normalizedFacing.x * 14,
      y: incident.position.y - normalizedFacing.y * 12
    };
    const lanternCenter = {
      x: shackCenter.x - normalizedFacing.x * 6 + lateral.x * 10,
      y: shackCenter.y - normalizedFacing.y * 6 + lateral.y * 10
    };
    const boardCenter = {
      x: incident.position.x + normalizedFacing.x * 6 - lateral.x * 16,
      y: incident.position.y + normalizedFacing.y * 6 - lateral.y * 16
    };
    const hunterCenter = {
      x: incident.position.x - normalizedFacing.x * 2 - lateral.x * 5,
      y: incident.position.y - normalizedFacing.y * 2 - lateral.y * 5
    };
    const sonTrackCenter = {
      x: incident.position.x + normalizedFacing.x * 15 + lateral.x * 8,
      y: incident.position.y + normalizedFacing.y * 15 + lateral.y * 8
    };

    graphics.fillStyle(0xf59e0b, 0.05 + lampPulse * 0.08 + actionProgress * 0.05);
    graphics.fillEllipse(incident.position.x, incident.position.y, 66 + actionProgress * 18, 36 + actionProgress * 12);
    graphics.fillStyle(0x14532d, 0.08 + tensionPulse * 0.05);
    graphics.fillEllipse(
      incident.position.x + normalizedFacing.x * 8,
      incident.position.y + normalizedFacing.y * 8,
      58 + tensionPulse * 12,
      26 + tensionPulse * 8
    );

    drawOrientedQuad(graphics, shackCenter, incident.facing, 15.5, 10.4, 0x292524, 0.84, 0x78716c, 0.32, 1.2);
    drawOrientedQuad(
      graphics,
      {
        x: shackCenter.x + normalizedFacing.x * 2.8,
        y: shackCenter.y + normalizedFacing.y * 2.8
      },
      incident.facing,
      8.4,
      5.6,
      0x1c1917,
      0.88,
      0xa8a29e,
      0.16,
      0.8
    );
    graphics.lineStyle(1.1, 0xa8a29e, 0.2 + lampPulse * 0.08);
    graphics.lineBetween(
      shackCenter.x - lateral.x * 8 - normalizedFacing.x * 8,
      shackCenter.y - lateral.y * 8 - normalizedFacing.y * 8,
      shackCenter.x + lateral.x * 8 - normalizedFacing.x * 8,
      shackCenter.y + lateral.y * 8 - normalizedFacing.y * 8
    );

    graphics.fillStyle(0xf8fafc, 0.2 + lampPulse * 0.1);
    graphics.fillCircle(lanternCenter.x, lanternCenter.y, 2.1);
    graphics.fillStyle(0xfbbf24, 0.16 + lampPulse * 0.18);
    graphics.fillCircle(lanternCenter.x, lanternCenter.y, 7 + lampPulse * 2.4);
    graphics.fillStyle(0xf59e0b, 0.06 + lampPulse * 0.08);
    graphics.fillEllipse(lanternCenter.x, lanternCenter.y, 24 + lampPulse * 8, 16 + lampPulse * 5);

    drawOrientedQuad(graphics, boardCenter, incident.facing, 5.2, 3.6, 0xf8fafc, 0.72, 0x38bdf8, 0.26, 0.9);
    graphics.lineStyle(0.9, 0x0f172a, 0.32 + lampPulse * 0.14);
    graphics.lineBetween(
      boardCenter.x - normalizedFacing.x * 1.2,
      boardCenter.y - normalizedFacing.y * 1.2,
      boardCenter.x + normalizedFacing.x * 1.2,
      boardCenter.y + normalizedFacing.y * 1.2
    );
    graphics.lineBetween(
      boardCenter.x - lateral.x * 0.8 + normalizedFacing.x * 0.4,
      boardCenter.y - lateral.y * 0.8 + normalizedFacing.y * 0.4,
      boardCenter.x + lateral.x * 0.8 + normalizedFacing.x * 0.4,
      boardCenter.y + lateral.y * 0.8 + normalizedFacing.y * 0.4
    );

    drawOrientedQuad(graphics, hunterCenter, incident.facing, 5.6, 3.8, 0xd6d3d1, 0.72, 0xf8fafc, 0.18, 0.8);
    graphics.fillStyle(0xf5f5f4, 0.6);
    graphics.fillCircle(
      hunterCenter.x + normalizedFacing.x * 2.9,
      hunterCenter.y + normalizedFacing.y * 2.9,
      1.7
    );
    graphics.lineStyle(1.1, 0x94a3b8, 0.28 + tensionPulse * 0.14);
    graphics.lineBetween(
      hunterCenter.x - normalizedFacing.x * 2.4 - lateral.x * 1.8,
      hunterCenter.y - normalizedFacing.y * 2.4 - lateral.y * 1.8,
      hunterCenter.x - normalizedFacing.x * 8 - lateral.x * 4.6,
      hunterCenter.y - normalizedFacing.y * 8 - lateral.y * 4.6
    );

    for (let index = 0; index < 4; index += 1) {
      const reedCenter = {
        x: sonTrackCenter.x + lateral.x * (index * 4 - 6),
        y: sonTrackCenter.y + lateral.y * (index * 4 - 6)
      };
      graphics.lineStyle(0.9, 0x86efac, 0.24 + tensionPulse * 0.08);
      graphics.lineBetween(
        reedCenter.x - normalizedFacing.x * 2,
        reedCenter.y - normalizedFacing.y * 2,
        reedCenter.x + normalizedFacing.x * 5,
        reedCenter.y + normalizedFacing.y * 5
      );
    }

    graphics.fillStyle(0x38bdf8, 0.14 + actionProgress * 0.12);
    graphics.fillCircle(sonTrackCenter.x, sonTrackCenter.y, 3.4 + actionProgress * 1.4);
    graphics.fillStyle(0xe0f2fe, 0.14 + lampPulse * 0.08);
    graphics.fillEllipse(
      sonTrackCenter.x + normalizedFacing.x * 6,
      sonTrackCenter.y + normalizedFacing.y * 6,
      14,
      7
    );

    if (focused || activeProgress !== null) {
      graphics.lineStyle(1.8, 0x2dd4bf, 0.22 + tensionPulse * 0.14 + actionProgress * 0.2);
      graphics.strokeEllipse(
        incident.position.x,
        incident.position.y,
        62 + actionProgress * 14,
        34 + actionProgress * 10
      );
    }
    return;
  }

  const shelterCenter = {
    x: incident.position.x - normalizedFacing.x * 10,
    y: incident.position.y - normalizedFacing.y * 10
  };
  const vanCenter = {
    x: incident.position.x + normalizedFacing.x * 18 + lateral.x * 12,
    y: incident.position.y + normalizedFacing.y * 18 + lateral.y * 12
  };
  const lampCenter = {
    x: shelterCenter.x - normalizedFacing.x * 8 + lateral.x * 12,
    y: shelterCenter.y - normalizedFacing.y * 8 + lateral.y * 12
  };
  const familyCenters = [
    {
      x: incident.position.x - normalizedFacing.x * 4 - lateral.x * 7,
      y: incident.position.y - normalizedFacing.y * 4 - lateral.y * 7
    },
    {
      x: incident.position.x + lateral.x * 2,
      y: incident.position.y + lateral.y * 2
    },
    {
      x: incident.position.x + normalizedFacing.x * 5 + lateral.x * 6,
      y: incident.position.y + normalizedFacing.y * 5 + lateral.y * 6
    }
  ];

  graphics.fillStyle(0x38bdf8, 0.04 + actionProgress * 0.08 + tensionPulse * 0.04);
  graphics.fillEllipse(
    incident.position.x + normalizedFacing.x * 3,
    incident.position.y + normalizedFacing.y * 3,
    62 + actionProgress * 18,
    34 + actionProgress * 12
  );
  graphics.fillStyle(0x0f172a, 0.26 + (focused ? 0.06 : 0));
  graphics.fillEllipse(shelterCenter.x, shelterCenter.y, 40, 24);
  drawOrientedQuad(graphics, shelterCenter, incident.facing, 16, 10, 0x111827, 0.78, 0x475569, 0.36, 1.2);
  drawOrientedQuad(
    graphics,
    {
      x: shelterCenter.x + normalizedFacing.x * 3,
      y: shelterCenter.y + normalizedFacing.y * 3
    },
    incident.facing,
    9.4,
    5.6,
    0x020617,
    0.84,
    0x94a3b8,
    0.18,
    0.9
  );
  graphics.fillStyle(0xf8fafc, 0.16 + lampPulse * 0.08);
  graphics.fillCircle(lampCenter.x, lampCenter.y, 2.4);
  graphics.fillStyle(0xfbbf24, 0.12 + lampPulse * 0.14);
  graphics.fillCircle(lampCenter.x, lampCenter.y, 8 + lampPulse * 2.8);
  graphics.fillStyle(0xf59e0b, 0.04 + lampPulse * 0.08);
  graphics.fillEllipse(lampCenter.x, lampCenter.y, 28 + lampPulse * 10, 18 + lampPulse * 6);

  drawOrientedQuad(graphics, vanCenter, incident.facing, 13, 6.8, 0xe5e7eb, 0.74, 0x94a3b8, 0.24, 1);
  drawOrientedQuad(
    graphics,
    {
      x: vanCenter.x + normalizedFacing.x * 4.8,
      y: vanCenter.y + normalizedFacing.y * 4.8
    },
    incident.facing,
    4.8,
    5.4,
    0xcbd5e1,
    0.78,
    0xf8fafc,
    0.2,
    0.8
  );
  graphics.lineStyle(1.2, 0x38bdf8, 0.16 + tensionPulse * 0.14);
  graphics.lineBetween(
    shelterCenter.x - lateral.x * 11 - normalizedFacing.x * 12,
    shelterCenter.y - lateral.y * 11 - normalizedFacing.y * 12,
    vanCenter.x - lateral.x * 7 - normalizedFacing.x * 2,
    vanCenter.y - lateral.y * 7 - normalizedFacing.y * 2
  );
  graphics.lineBetween(
    shelterCenter.x + lateral.x * 11 - normalizedFacing.x * 10,
    shelterCenter.y + lateral.y * 11 - normalizedFacing.y * 10,
    vanCenter.x + lateral.x * 7 - normalizedFacing.x * 2,
    vanCenter.y + lateral.y * 7 - normalizedFacing.y * 2
  );

  familyCenters.forEach((center, index) => {
    const size = index === 1 ? 3.2 : 4.2;
    const bodyLength = index === 1 ? 3.8 : 5.2;
    const tint = index === 1 ? 0xcbd5e1 : 0xe2e8f0;
    drawOrientedQuad(
      graphics,
      center,
      incident.facing,
      bodyLength,
      size,
      tint,
      0.68,
      0xf8fafc,
      0.16 + actionProgress * 0.08,
      0.8
    );
    graphics.fillStyle(0xf8fafc, 0.56);
    graphics.fillCircle(center.x + normalizedFacing.x * (bodyLength * 0.55), center.y + normalizedFacing.y * (bodyLength * 0.55), 1.8);
  });

  const routeNoteCenter = {
    x: incident.position.x - normalizedFacing.x * 1 + lateral.x * 16,
    y: incident.position.y - normalizedFacing.y * 1 + lateral.y * 16
  };
  drawOrientedQuad(graphics, routeNoteCenter, incident.facing, 4.6, 3.2, 0xf8fafc, 0.74, 0x38bdf8, 0.28, 1);
  graphics.lineStyle(1, 0x38bdf8, 0.34 + lampPulse * 0.16);
  graphics.lineBetween(
    routeNoteCenter.x - normalizedFacing.x * 1.2,
    routeNoteCenter.y - normalizedFacing.y * 1.2,
    routeNoteCenter.x + normalizedFacing.x * 1.2,
    routeNoteCenter.y + normalizedFacing.y * 1.2
  );

  if (focused || activeProgress !== null) {
    graphics.lineStyle(1.8, 0x2dd4bf, 0.2 + tensionPulse * 0.14 + actionProgress * 0.2);
    graphics.strokeEllipse(
      incident.position.x,
      incident.position.y,
      60 + actionProgress * 14,
      34 + actionProgress * 10
    );
  }
}

function drawSurrenderIncidentSetDressing(
  graphics: Phaser.GameObjects.Graphics,
  incident: FrontlineIncidentState,
  timeMs: number,
  focused: boolean,
  activeProgress: number | null
): void {
  const surrenderWindow =
    incident.kind === "firefight" &&
    incident.status === "routed" &&
    incident.territoryState === "reclaimed" &&
    !incident.resolved;
  if (!surrenderWindow) {
    return;
  }

  const facingLength = Math.hypot(incident.facing.x, incident.facing.y);
  const normalizedFacing =
    facingLength > 0.001 ? { x: incident.facing.x / facingLength, y: incident.facing.y / facingLength } : { x: 1, y: 0 };
  const lateral = rotateVector(normalizedFacing, Math.PI / 2);
  const pulse = 0.5 + 0.5 * Math.sin(timeMs / 190 + incident.id * 0.9);
  const flagPulse = 0.5 + 0.5 * Math.sin(timeMs / 240 + incident.id * 1.2);
  const actionProgress = activeProgress ?? 0;
  const hotspotCenter = {
    x: incident.position.x - normalizedFacing.x * 2,
    y: incident.position.y - normalizedFacing.y * 2
  };
  const prisonerCenters = [
    {
      x: incident.position.x - normalizedFacing.x * 5 - lateral.x * 8,
      y: incident.position.y - normalizedFacing.y * 5 - lateral.y * 8
    },
    {
      x: incident.position.x + normalizedFacing.x * 2 + lateral.x * 1,
      y: incident.position.y + normalizedFacing.y * 2 + lateral.y * 1
    }
  ];
  const bagCenter = {
    x: incident.position.x + normalizedFacing.x * 9 + lateral.x * 14,
    y: incident.position.y + normalizedFacing.y * 9 + lateral.y * 14
  };
  const flagBase = {
    x: incident.position.x - normalizedFacing.x * 12 + lateral.x * 15,
    y: incident.position.y - normalizedFacing.y * 12 + lateral.y * 15
  };
  const muzzleLineStart = {
    x: incident.position.x - normalizedFacing.x * 24 - lateral.x * 14,
    y: incident.position.y - normalizedFacing.y * 24 - lateral.y * 14
  };
  const muzzleLineEnd = {
    x: hotspotCenter.x + normalizedFacing.x * 2,
    y: hotspotCenter.y + normalizedFacing.y * 2
  };

  graphics.fillStyle(0xf97316, 0.05 + pulse * 0.06 + actionProgress * 0.08);
  graphics.fillEllipse(hotspotCenter.x, hotspotCenter.y, 56 + actionProgress * 14, 34 + actionProgress * 10);
  graphics.fillStyle(0x0f172a, 0.18 + (focused ? 0.06 : 0));
  graphics.fillEllipse(hotspotCenter.x, hotspotCenter.y, 28, 18);
  graphics.lineStyle(1.4, 0xf8fafc, 0.24 + pulse * 0.18);
  graphics.lineBetween(muzzleLineStart.x, muzzleLineStart.y, muzzleLineEnd.x, muzzleLineEnd.y);
  graphics.lineStyle(1.1, 0xfb7185, 0.28 + pulse * 0.16);
  graphics.lineBetween(
    muzzleLineStart.x + lateral.x * 6,
    muzzleLineStart.y + lateral.y * 6,
    hotspotCenter.x - lateral.x * 6,
    hotspotCenter.y - lateral.y * 6
  );

  prisonerCenters.forEach((center, index) => {
    const bodyLength = index === 0 ? 5.4 : 4.8;
    const bodyWidth = index === 0 ? 3.2 : 3;
    drawOrientedQuad(graphics, center, incident.facing, bodyLength, bodyWidth, 0xcbd5e1, 0.72, 0xf8fafc, 0.14, 0.8);
    graphics.fillStyle(0xf8fafc, 0.6);
    graphics.fillCircle(center.x + normalizedFacing.x * (bodyLength * 0.5), center.y + normalizedFacing.y * (bodyLength * 0.5), 1.7);
    const shoulderCenter = {
      x: center.x - normalizedFacing.x * 0.2,
      y: center.y - normalizedFacing.y * 0.2
    };
    graphics.lineStyle(1.1, 0xf8fafc, 0.44 + pulse * 0.12);
    graphics.lineBetween(
      shoulderCenter.x - lateral.x * 1.2,
      shoulderCenter.y - lateral.y * 1.2,
      shoulderCenter.x - lateral.x * 4.4 - normalizedFacing.x * 1.8,
      shoulderCenter.y - lateral.y * 4.4 - normalizedFacing.y * 1.8
    );
    graphics.lineBetween(
      shoulderCenter.x + lateral.x * 1.2,
      shoulderCenter.y + lateral.y * 1.2,
      shoulderCenter.x + lateral.x * 4.4 - normalizedFacing.x * 1.8,
      shoulderCenter.y + lateral.y * 4.4 - normalizedFacing.y * 1.8
    );
  });

  drawOrientedQuad(graphics, bagCenter, incident.facing, 6.4, 4.2, 0x111827, 0.84, 0xf97316, 0.24, 1);
  drawOrientedQuad(
    graphics,
    {
      x: bagCenter.x - normalizedFacing.x * 0.2 + lateral.x * 0.2,
      y: bagCenter.y - normalizedFacing.y * 0.2 + lateral.y * 0.2
    },
    incident.facing,
    3.8,
    2.4,
    0xf8fafc,
    0.74,
    0xfb7185,
    0.22,
    0.9
  );
  graphics.lineStyle(1, 0xfb7185, 0.28 + pulse * 0.18);
  graphics.lineBetween(
    bagCenter.x - normalizedFacing.x * 0.8 - lateral.x * 0.8,
    bagCenter.y - normalizedFacing.y * 0.8 - lateral.y * 0.8,
    bagCenter.x + normalizedFacing.x * 0.8 + lateral.x * 0.8,
    bagCenter.y + normalizedFacing.y * 0.8 + lateral.y * 0.8
  );

  graphics.lineStyle(1.6, 0xf8fafc, 0.56);
  graphics.lineBetween(
    flagBase.x,
    flagBase.y,
    flagBase.x + normalizedFacing.x * 14,
    flagBase.y + normalizedFacing.y * 14
  );
  graphics.fillStyle(0xfb7185, 0.24 + flagPulse * 0.18);
  graphics.fillTriangle(
    flagBase.x + normalizedFacing.x * 14,
    flagBase.y + normalizedFacing.y * 14,
    flagBase.x + normalizedFacing.x * 7 + lateral.x * 5,
    flagBase.y + normalizedFacing.y * 7 + lateral.y * 5,
    flagBase.x + normalizedFacing.x * 6 - lateral.x * 1.5,
    flagBase.y + normalizedFacing.y * 6 - lateral.y * 1.5
  );
  graphics.lineStyle(1.2, 0xf97316, 0.3 + flagPulse * 0.2);
  graphics.strokeEllipse(flagBase.x + normalizedFacing.x * 4, flagBase.y + normalizedFacing.y * 4, 16, 10);

  if (focused || activeProgress !== null) {
    graphics.lineStyle(1.8, 0xf59e0b, 0.24 + pulse * 0.18 + actionProgress * 0.18);
    graphics.strokeEllipse(incident.position.x, incident.position.y, 60 + actionProgress * 12, 36 + actionProgress * 10);
    graphics.lineStyle(1.2, 0xf8fafc, 0.36 + pulse * 0.14);
    graphics.strokeEllipse(incident.position.x, incident.position.y, 42, 24);
  }
}

function drawDroneSweepIncidentSetDressing(
  graphics: Phaser.GameObjects.Graphics,
  incident: FrontlineIncidentState,
  timeMs: number,
  focused: boolean,
  activeProgress: number | null
): void {
  if (incident.kind !== "firefight" || incident.presentationVariant !== "drone-sweep" || incident.resolved) {
    return;
  }

  const facingLength = Math.hypot(incident.facing.x, incident.facing.y);
  const normalizedFacing =
    facingLength > 0.001 ? { x: incident.facing.x / facingLength, y: incident.facing.y / facingLength } : { x: 1, y: 0 };
  const lateral = rotateVector(normalizedFacing, Math.PI / 2);
  const pulse = 0.5 + 0.5 * Math.sin(timeMs / 210 + incident.id * 0.77);
  const actionProgress = activeProgress ?? 0;
  const beamLength = incident.radius + 54 + pulse * 12;
  const beamWidth = 28 + pulse * 8 + actionProgress * 10;
  const droneCenter = {
    x: incident.position.x - normalizedFacing.x * 18 + lateral.x * 34,
    y: incident.position.y - normalizedFacing.y * 18 + lateral.y * 34
  };
  const scanCenter = {
    x: incident.position.x + normalizedFacing.x * 8,
    y: incident.position.y + normalizedFacing.y * 4
  };
  const tripodCenter = {
    x: incident.position.x - lateral.x * (incident.radius * 0.46),
    y: incident.position.y - lateral.y * (incident.radius * 0.46)
  };
  const routeBoardCenter = {
    x: incident.position.x + lateral.x * (incident.radius * 0.38),
    y: incident.position.y + lateral.y * (incident.radius * 0.38)
  };
  const silhouetteCenter = {
    x: incident.position.x - normalizedFacing.x * (incident.radius * 0.42),
    y: incident.position.y - normalizedFacing.y * (incident.radius * 0.28)
  };

  graphics.fillStyle(0x020617, 0.2 + pulse * 0.08);
  graphics.fillEllipse(droneCenter.x + 2, droneCenter.y + 6, 28, 12);
  drawOrientedQuad(graphics, droneCenter, normalizedFacing, 9.5, 3.2, 0x111827, 0.88, 0x93c5fd, 0.34, 1);
  drawOrientedQuad(
    graphics,
    { x: droneCenter.x - lateral.x * 10, y: droneCenter.y - lateral.y * 10 },
    normalizedFacing,
    7.5,
    1.2,
    0x94a3b8,
    0.56
  );
  drawOrientedQuad(
    graphics,
    { x: droneCenter.x + lateral.x * 10, y: droneCenter.y + lateral.y * 10 },
    normalizedFacing,
    7.5,
    1.2,
    0x94a3b8,
    0.56
  );

  drawOrientedQuad(graphics, scanCenter, normalizedFacing, beamLength, beamWidth, 0x7dd3fc, 0.06 + pulse * 0.05);
  graphics.lineStyle(1.4, 0xbae6fd, 0.22 + pulse * 0.16 + actionProgress * 0.1);
  graphics.strokeEllipse(scanCenter.x, scanCenter.y, beamLength, beamWidth);
  graphics.lineStyle(1.1, 0xe0f2fe, 0.16 + pulse * 0.14);
  graphics.strokeEllipse(
    scanCenter.x + normalizedFacing.x * 8,
    scanCenter.y + normalizedFacing.y * 4,
    beamLength * 0.64,
    beamWidth * 0.58
  );

  drawOrientedQuad(graphics, tripodCenter, normalizedFacing, 4.6, 3.4, 0x1f2937, 0.84, 0x38bdf8, 0.22, 0.8);
  graphics.lineStyle(1.1, 0x94a3b8, 0.54);
  graphics.lineBetween(tripodCenter.x, tripodCenter.y + 1, tripodCenter.x - 5, tripodCenter.y + 9);
  graphics.lineBetween(tripodCenter.x, tripodCenter.y + 1, tripodCenter.x + 1, tripodCenter.y + 10);
  graphics.lineBetween(tripodCenter.x, tripodCenter.y + 1, tripodCenter.x + 6, tripodCenter.y + 8);

  drawOrientedQuad(graphics, routeBoardCenter, normalizedFacing, 5.4, 3.6, 0xf8fafc, 0.74, 0x38bdf8, 0.26, 0.9);
  graphics.lineStyle(0.9, 0x0f172a, 0.3);
  graphics.lineBetween(routeBoardCenter.x - 1.8, routeBoardCenter.y - 0.8, routeBoardCenter.x + 1.8, routeBoardCenter.y - 0.8);
  graphics.lineBetween(routeBoardCenter.x - 1.8, routeBoardCenter.y + 0.6, routeBoardCenter.x + 1.3, routeBoardCenter.y + 0.6);

  drawOrientedQuad(graphics, silhouetteCenter, normalizedFacing, 5.8, 3.4, 0x0f172a, 0.78, 0xe2e8f0, 0.12, 0.8);
  drawOrientedQuad(
    graphics,
    { x: silhouetteCenter.x + lateral.x * 8, y: silhouetteCenter.y + lateral.y * 8 },
    normalizedFacing,
    5.2,
    3,
    0x1e293b,
    0.72,
    0xcbd5e1,
    0.1,
    0.7
  );

  if (focused) {
    graphics.lineStyle(1.8, 0xe0f2fe, 0.28 + pulse * 0.22);
    graphics.strokeCircle(incident.position.x, incident.position.y, incident.radius + 22 + pulse * 4);
  }
}

function drawMedicalHoldIncidentSetDressing(
  graphics: Phaser.GameObjects.Graphics,
  incident: FrontlineIncidentState,
  timeMs: number,
  focused: boolean,
  activeProgress: number | null
): void {
  if (incident.kind !== "firefight" || incident.presentationVariant !== "wounded-soldier" || incident.resolved) {
    return;
  }

  const facingLength = Math.hypot(incident.facing.x, incident.facing.y);
  const normalizedFacing =
    facingLength > 0.001 ? { x: incident.facing.x / facingLength, y: incident.facing.y / facingLength } : { x: 1, y: 0 };
  const lateral = rotateVector(normalizedFacing, Math.PI / 2);
  const pulse = 0.5 + 0.5 * Math.sin(timeMs / 190 + incident.id * 0.8);
  const actionProgress = activeProgress ?? 0;
  const casualtyCenter = {
    x: incident.position.x - normalizedFacing.x * 10 + lateral.x * 4,
    y: incident.position.y - normalizedFacing.y * 10 + lateral.y * 4
  };
  const medicCenter = {
    x: casualtyCenter.x - normalizedFacing.x * 7 - lateral.x * 6,
    y: casualtyCenter.y - normalizedFacing.y * 7 - lateral.y * 6
  };
  const satchelCenter = {
    x: casualtyCenter.x + normalizedFacing.x * 8 - lateral.x * 10,
    y: casualtyCenter.y + normalizedFacing.y * 8 - lateral.y * 10
  };
  const dressingLineCenter = {
    x: incident.position.x + normalizedFacing.x * 16 + lateral.x * 10,
    y: incident.position.y + normalizedFacing.y * 16 + lateral.y * 10
  };
  const holdEdgeCenter = {
    x: incident.position.x + normalizedFacing.x * 22 - lateral.x * 18,
    y: incident.position.y + normalizedFacing.y * 22 - lateral.y * 18
  };

  graphics.fillStyle(0x7f1d1d, 0.08 + pulse * 0.08 + actionProgress * 0.05);
  graphics.fillEllipse(incident.position.x, incident.position.y, 68 + pulse * 12, 34 + pulse * 8);
  graphics.fillStyle(0xdc2626, 0.08 + pulse * 0.08);
  graphics.fillEllipse(casualtyCenter.x, casualtyCenter.y, 34 + pulse * 6, 18 + pulse * 4);
  graphics.fillStyle(0xfb7185, 0.12 + pulse * 0.06);
  graphics.fillCircle(casualtyCenter.x + lateral.x * 7, casualtyCenter.y + lateral.y * 7, 4.8 + pulse * 1.1);

  drawOrientedQuad(graphics, casualtyCenter, incident.facing, 8.8, 4.2, 0xf8fafc, 0.82, 0xf87171, 0.24, 1);
  drawOrientedQuad(graphics, medicCenter, incident.facing, 6.4, 3.4, 0x0f172a, 0.84, 0x38bdf8, 0.22, 0.9);
  drawOrientedQuad(graphics, satchelCenter, incident.facing, 5.8, 4.2, 0x166534, 0.82, 0xbbf7d0, 0.2, 0.8);
  drawOrientedQuad(graphics, holdEdgeCenter, incident.facing, 9.4, 3.2, 0x111827, 0.82, 0xfca5a5, 0.18, 0.8);
  drawOrientedQuad(graphics, dressingLineCenter, incident.facing, 11.6, 1.2, 0xfca5a5, 0.5 + pulse * 0.16 + actionProgress * 0.12);

  graphics.lineStyle(1.4, 0xfda4af, 0.24 + pulse * 0.16);
  graphics.lineBetween(
    medicCenter.x + normalizedFacing.x * 3,
    medicCenter.y + normalizedFacing.y * 3,
    casualtyCenter.x - normalizedFacing.x * 3,
    casualtyCenter.y - normalizedFacing.y * 3
  );
  graphics.lineStyle(1.2, 0xfef2f2, 0.28 + pulse * 0.14);
  graphics.lineBetween(
    casualtyCenter.x - lateral.x * 3,
    casualtyCenter.y - lateral.y * 3,
    casualtyCenter.x + lateral.x * 3,
    casualtyCenter.y + lateral.y * 3
  );
  graphics.lineStyle(1.1, 0xbbf7d0, 0.24 + pulse * 0.12);
  graphics.strokeEllipse(satchelCenter.x, satchelCenter.y, 16 + pulse * 2, 10 + pulse * 1.4);

  if (focused || activeProgress !== null) {
    graphics.lineStyle(1.8, 0xfb7185, 0.28 + pulse * 0.18 + actionProgress * 0.2);
    graphics.strokeEllipse(
      incident.position.x,
      incident.position.y,
      74 + pulse * 10 + actionProgress * 12,
      38 + pulse * 6 + actionProgress * 6
    );
    graphics.lineStyle(1.2, 0xfef2f2, 0.34 + pulse * 0.14);
    graphics.strokeEllipse(casualtyCenter.x, casualtyCenter.y, 30 + pulse * 4, 16 + pulse * 2);
  }
}

function drawFrontlineEmplacement(
  graphics: Phaser.GameObjects.Graphics,
  center: { x: number; y: number },
  facing: { x: number; y: number },
  color: number,
  alpha: number
): void {
  const facingLength = Math.hypot(facing.x, facing.y);
  const normalizedFacing = facingLength > 0.001 ? { x: facing.x / facingLength, y: facing.y / facingLength } : { x: 1, y: 0 };
  const lateral = rotateVector(normalizedFacing, Math.PI / 2);
  const rear = {
    x: center.x - normalizedFacing.x * 10,
    y: center.y - normalizedFacing.y * 10
  };

  graphics.lineStyle(2, color, alpha);
  graphics.lineBetween(
    rear.x - lateral.x * 15,
    rear.y - lateral.y * 15,
    rear.x + lateral.x * 15,
    rear.y + lateral.y * 15
  );
  graphics.lineStyle(1.4, 0xf8fafc, alpha * 0.7);
  graphics.lineBetween(
    rear.x - lateral.x * 8 - normalizedFacing.x * 4,
    rear.y - lateral.y * 8 - normalizedFacing.y * 4,
    rear.x - lateral.x * 2 + normalizedFacing.x * 1,
    rear.y - lateral.y * 2 + normalizedFacing.y * 1
  );
  graphics.lineBetween(
    rear.x + lateral.x * 8 - normalizedFacing.x * 4,
    rear.y + lateral.y * 8 - normalizedFacing.y * 4,
    rear.x + lateral.x * 2 + normalizedFacing.x * 1,
    rear.y + lateral.y * 2 + normalizedFacing.y * 1
  );
}

function drawFrontlinePushMarker(
  graphics: Phaser.GameObjects.Graphics,
  center: { x: number; y: number },
  facing: { x: number; y: number },
  color: number,
  alpha: number
): void {
  const facingLength = Math.hypot(facing.x, facing.y);
  const normalizedFacing = facingLength > 0.001 ? { x: facing.x / facingLength, y: facing.y / facingLength } : { x: 1, y: 0 };
  const lateral = rotateVector(normalizedFacing, Math.PI / 2);
  const tip = {
    x: center.x + normalizedFacing.x * 22,
    y: center.y + normalizedFacing.y * 22
  };
  const rearLeft = {
    x: center.x - normalizedFacing.x * 8 - lateral.x * 8,
    y: center.y - normalizedFacing.y * 8 - lateral.y * 8
  };
  const rearRight = {
    x: center.x - normalizedFacing.x * 8 + lateral.x * 8,
    y: center.y - normalizedFacing.y * 8 + lateral.y * 8
  };

  graphics.lineStyle(2.2, 0xf8fafc, alpha * 0.72);
  graphics.strokeTriangle(tip.x, tip.y, rearLeft.x, rearLeft.y, rearRight.x, rearRight.y);
  graphics.fillStyle(color, alpha * 0.16);
  graphics.fillTriangle(tip.x, tip.y, rearLeft.x, rearLeft.y, rearRight.x, rearRight.y);
  graphics.lineStyle(1.4, color, alpha);
  graphics.lineBetween(center.x, center.y, tip.x, tip.y);
}

function drawFrontlineWeaponState(
  graphics: Phaser.GameObjects.Graphics,
  center: { x: number; y: number },
  weaponId: keyof typeof WEAPONS,
  ammoInMag: number,
  reloadTimer: number,
  dryFireTimer: number,
  resupplyTimer: number,
  color: number,
  alpha: number
): void {
  const weapon = WEAPONS[weaponId];
  const ammoRatio = weapon.magazineSize > 0 ? Phaser.Math.Clamp(ammoInMag / weapon.magazineSize, 0, 1) : 0;

  if (reloadTimer > 0 && weapon.reloadTime > 0) {
    const reloadRatio = Phaser.Math.Clamp(1 - reloadTimer / weapon.reloadTime, 0, 1);
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + Math.PI * 2 * reloadRatio;

    graphics.lineStyle(2.4, 0xf8fafc, alpha * 0.7);
    graphics.strokeCircle(center.x, center.y, 16);
    graphics.lineStyle(3.2, 0xfbbf24, alpha * 0.92);
    graphics.beginPath();
    graphics.arc(center.x, center.y, 16, startAngle, endAngle, false);
    graphics.strokePath();
    graphics.fillStyle(0xf59e0b, alpha * 0.12);
    graphics.fillCircle(center.x, center.y, 12);
    return;
  }

  const barWidth = 22;
  const fillWidth = Math.max(2, barWidth * ammoRatio);
  const barColor = ammoRatio <= 0.2 ? 0xfb7185 : ammoRatio <= 0.45 ? 0xfbbf24 : color;

  graphics.fillStyle(0x020617, alpha * 0.42);
  graphics.fillRoundedRect(center.x - barWidth / 2 - 1, center.y + 13, barWidth + 2, 6, 2);
  graphics.fillStyle(barColor, alpha * 0.8);
  graphics.fillRoundedRect(center.x - barWidth / 2, center.y + 14, fillWidth, 4, 2);
  graphics.lineStyle(1, 0xf8fafc, alpha * 0.4);
  graphics.strokeRoundedRect(center.x - barWidth / 2, center.y + 14, barWidth, 4, 2);

  if (resupplyTimer > 0) {
    graphics.lineStyle(2.2, 0x7dd3fc, alpha * 0.8);
    graphics.strokeCircle(center.x, center.y, 18);
  }

  if (dryFireTimer > 0) {
    graphics.lineStyle(2.4, 0xfb7185, alpha * 0.9);
    graphics.lineBetween(center.x - 8, center.y - 8, center.x + 8, center.y + 8);
    graphics.lineBetween(center.x - 8, center.y + 8, center.x + 8, center.y - 8);
  }
}

function drawFrontlineResupplyLink(
  graphics: Phaser.GameObjects.Graphics,
  origin: { x: number; y: number },
  target: { x: number; y: number },
  color: number,
  alpha: number
): void {
  graphics.lineStyle(2.2, 0xf8fafc, alpha * 0.32);
  graphics.lineBetween(origin.x, origin.y, target.x, target.y);
  graphics.lineStyle(1.6, color, alpha);
  graphics.lineBetween(origin.x, origin.y, target.x, target.y);
  graphics.fillStyle(color, alpha * 0.28);
  graphics.fillCircle(target.x, target.y, 7);
}

function drawFrontlineTerritory(
  graphics: Phaser.GameObjects.Graphics,
  incident: FrontlineIncidentState,
  timeNow: number
): void {
  if (incident.kind !== "firefight" || incident.territoryState === "none") {
    return;
  }

  const territoryColor =
    incident.territoryState === "reclaimed"
      ? 0x4ade80
      : incident.territoryState === "lost"
        ? 0xf59e0b
        : 0xfb7185;
  const pulse = Math.sin(timeNow / 180 + incident.id) * 2.5;
  const radius = incident.territoryRadius + pulse;

  graphics.lineStyle(2, territoryColor, incident.territoryState === "breaking" ? 0.28 : 0.36);
  graphics.strokeCircle(incident.position.x, incident.position.y, radius);
  graphics.lineStyle(1.2, 0xf8fafc, incident.territoryState === "reclaimed" ? 0.18 : 0.12);
  graphics.strokeCircle(incident.position.x, incident.position.y, Math.max(18, radius - 12));
  graphics.fillStyle(territoryColor, incident.territoryState === "breaking" ? 0.06 : 0.08);
  graphics.fillCircle(incident.position.x, incident.position.y, Math.max(14, radius - 4));

  if (incident.territoryState === "lost") {
    graphics.lineStyle(1.8, 0xfef3c7, 0.52);
    graphics.lineBetween(
      incident.position.x - 12,
      incident.position.y - 12,
      incident.position.x + 12,
      incident.position.y + 12
    );
    graphics.lineBetween(
      incident.position.x - 12,
      incident.position.y + 12,
      incident.position.x + 12,
      incident.position.y - 12
    );
  } else if (incident.territoryState === "reclaimed") {
    graphics.lineStyle(1.8, 0xdcfce7, 0.56);
    graphics.lineBetween(
      incident.position.x - 10,
      incident.position.y,
      incident.position.x - 2,
      incident.position.y + 8
    );
    graphics.lineBetween(
      incident.position.x - 2,
      incident.position.y + 8,
      incident.position.x + 12,
      incident.position.y - 10
    );
  }

  if (incident.territoryState === "reclaimed" || incident.territoryState === "lost" || incident.territoryState === "breaking") {
    drawFrontlineTerritoryFlag(graphics, incident, timeNow, territoryColor);
    drawFrontlineTerritoryEmplacements(graphics, incident, timeNow, territoryColor);
    drawFrontlineTerritoryBodies(graphics, incident, timeNow);
  }
}

function drawFrontlineTerritoryFlag(
  graphics: Phaser.GameObjects.Graphics,
  incident: FrontlineIncidentState,
  timeNow: number,
  territoryColor: number
): void {
  const flagOffsetX = incident.territoryState === "lost" ? 22 : -20;
  const flagOffsetY = incident.territoryState === "breaking" ? -26 : -22;
  const poleX = incident.position.x + flagOffsetX;
  const poleY = incident.position.y + flagOffsetY;
  const planted = incident.markerState === "planted";
  const raising = incident.markerState === "raising";
  const flagHeight = raising ? 20 : 24;
  const clothWave = Math.sin(timeNow / 160 + incident.id * 1.7) * 2.8;
  const clothLength = raising ? 12 : 16;
  const clothDrop = incident.territoryState === "lost" ? 9 : incident.territoryState === "breaking" ? 6 : 4;
  const clothColor =
    incident.territoryState === "lost"
      ? 0x60a5fa
      : incident.territoryState === "breaking"
        ? 0xf59e0b
        : 0xef4444;

  graphics.lineStyle(2.4, 0x0f172a, 0.7);
  graphics.lineBetween(poleX, poleY, poleX, poleY - flagHeight);
  graphics.lineStyle(1.1, 0xf8fafc, 0.32);
  graphics.lineBetween(poleX + 1, poleY, poleX + 1, poleY - flagHeight);
  graphics.fillStyle(clothColor, raising ? 0.74 : 0.86);
  graphics.beginPath();
  graphics.moveTo(poleX, poleY - flagHeight);
  graphics.lineTo(poleX + clothLength, poleY - flagHeight + clothWave);
  graphics.lineTo(poleX + clothLength - 2, poleY - flagHeight + clothDrop + clothWave * 0.45);
  graphics.lineTo(poleX, poleY - flagHeight + (raising ? 10 : 12));
  graphics.closePath();
  graphics.fillPath();
  graphics.lineStyle(1.3, territoryColor, 0.4);
  graphics.strokePath();
  graphics.fillStyle(0xf8fafc, 0.22);
  graphics.fillCircle(poleX, poleY - flagHeight, 2);
  if (planted) {
    graphics.fillStyle(0xf8fafc, 0.16);
    graphics.fillCircle(poleX, poleY, 3.2);
  }
}

function drawFrontlineTerritoryEmplacements(
  graphics: Phaser.GameObjects.Graphics,
  incident: FrontlineIncidentState,
  timeNow: number,
  territoryColor: number
): void {
  const facingLength = Math.hypot(incident.facing.x, incident.facing.y);
  const normalizedFacing =
    facingLength > 0.001 ? { x: incident.facing.x / facingLength, y: incident.facing.y / facingLength } : { x: 1, y: 0 };
  const lateral = rotateVector(normalizedFacing, Math.PI / 2);
  const pulse = 0.5 + 0.5 * Math.sin(timeNow / 220 + incident.id * 1.1);
  const rear = {
    x: incident.position.x - normalizedFacing.x * 24,
    y: incident.position.y - normalizedFacing.y * 24
  };
  const forward = {
    x: incident.position.x + normalizedFacing.x * 18,
    y: incident.position.y + normalizedFacing.y * 18
  };

  if (incident.territoryState === "reclaimed") {
    const sandbagAnchors = [-16, 0, 16].map((offset) => ({
      x: rear.x + lateral.x * offset,
      y: rear.y + lateral.y * offset
    }));
    sandbagAnchors.forEach((anchor) => {
      graphics.save();
      graphics.translateCanvas(anchor.x, anchor.y);
      graphics.rotateCanvas(Math.atan2(lateral.y, lateral.x));
      graphics.fillStyle(0x8b5e3c, 0.72);
      graphics.fillRoundedRect(-9, -4, 18, 8, 3);
      graphics.lineStyle(1, 0xf8fafc, 0.16);
      graphics.strokeRoundedRect(-9, -4, 18, 8, 3);
      graphics.restore();
    });

    const ammoTin = {
      x: rear.x - normalizedFacing.x * 8 + lateral.x * 26,
      y: rear.y - normalizedFacing.y * 8 + lateral.y * 26
    };
    graphics.save();
    graphics.translateCanvas(ammoTin.x, ammoTin.y);
    graphics.rotateCanvas(Math.atan2(normalizedFacing.y, normalizedFacing.x) - 0.2);
    graphics.fillStyle(0x334155, 0.88);
    graphics.fillRoundedRect(-8, -5, 16, 10, 2);
    graphics.lineStyle(1, territoryColor, 0.4);
    graphics.strokeRoundedRect(-8, -5, 16, 10, 2);
    graphics.restore();

    const routeBoard = {
      x: rear.x + lateral.x * -24,
      y: rear.y + lateral.y * -24
    };
    graphics.lineStyle(1.6, 0xe2e8f0, 0.3);
    graphics.lineBetween(routeBoard.x, routeBoard.y, routeBoard.x, routeBoard.y - 10);
    graphics.fillStyle(0x0f172a, 0.8);
    graphics.fillRoundedRect(routeBoard.x - 8, routeBoard.y - 18, 16, 9, 2);
    graphics.lineStyle(1, territoryColor, 0.44);
    graphics.strokeRoundedRect(routeBoard.x - 8, routeBoard.y - 18, 16, 9, 2);
    graphics.lineStyle(1, 0xf8fafc, 0.22 + pulse * 0.08);
    graphics.lineBetween(routeBoard.x - 4, routeBoard.y - 15, routeBoard.x + 4, routeBoard.y - 12);
  } else if (incident.territoryState === "breaking") {
    const crouchAnchors = [-10, 10].map((offset) => ({
      x: rear.x + lateral.x * offset,
      y: rear.y + lateral.y * offset
    }));
    crouchAnchors.forEach((anchor, index) => {
      graphics.fillStyle(0x020617, 0.74);
      graphics.fillCircle(anchor.x, anchor.y - 7, 3.6);
      graphics.lineStyle(2.2, 0xe2e8f0, 0.34 + pulse * 0.14);
      graphics.lineBetween(anchor.x, anchor.y - 3, anchor.x + normalizedFacing.x * (9 + index), anchor.y + 6);
      graphics.lineBetween(anchor.x, anchor.y + 1, anchor.x - lateral.x * 4, anchor.y + 7);
    });

    const routeBoard = {
      x: rear.x + lateral.x * 24,
      y: rear.y + lateral.y * 24
    };
    graphics.lineStyle(1.4, 0xe2e8f0, 0.28);
    graphics.lineBetween(routeBoard.x, routeBoard.y, routeBoard.x, routeBoard.y - 12);
    graphics.fillStyle(0x1f2937, 0.86);
    graphics.fillRoundedRect(routeBoard.x - 9, routeBoard.y - 21, 18, 10, 2);
    graphics.lineStyle(1, 0xf59e0b, 0.52);
    graphics.strokeRoundedRect(routeBoard.x - 9, routeBoard.y - 21, 18, 10, 2);
    graphics.lineStyle(1, 0xf8fafc, 0.24);
    graphics.lineBetween(routeBoard.x - 4, routeBoard.y - 18, routeBoard.x + 4, routeBoard.y - 15);

    const flareAnchor = {
      x: forward.x + lateral.x * -12,
      y: forward.y + lateral.y * -12
    };
    graphics.fillStyle(0xfb7185, 0.22 + pulse * 0.16);
    graphics.fillCircle(flareAnchor.x, flareAnchor.y, 6 + pulse * 2);
    graphics.lineStyle(1, 0xf8fafc, 0.22 + pulse * 0.12);
    graphics.strokeCircle(flareAnchor.x, flareAnchor.y, 9 + pulse * 2);
  } else {
    graphics.fillStyle(0x020617, 0.34);
    graphics.fillEllipse(incident.position.x + 6, incident.position.y + 14, 42, 24);
    graphics.lineStyle(1.4, 0xf59e0b, 0.38);
    graphics.strokeEllipse(incident.position.x + 6, incident.position.y + 14, 42, 24);

    const pennantBase = {
      x: forward.x + lateral.x * 18,
      y: forward.y + lateral.y * 14
    };
    graphics.lineStyle(1.8, 0x1e293b, 0.8);
    graphics.lineBetween(pennantBase.x, pennantBase.y, pennantBase.x, pennantBase.y - 14);
    graphics.fillStyle(0x60a5fa, 0.76);
    graphics.fillTriangle(
      pennantBase.x,
      pennantBase.y - 14,
      pennantBase.x + 11,
      pennantBase.y - 10 + pulse * 1.5,
      pennantBase.x,
      pennantBase.y - 6
    );
  }
}

function drawFrontlineTerritoryBodies(
  graphics: Phaser.GameObjects.Graphics,
  incident: FrontlineIncidentState,
  timeNow: number
): void {
  if (incident.markerState !== "bagged" && incident.markerState !== "planted") {
    return;
  }

  const sway = Math.sin(timeNow / 210 + incident.id * 0.9) * 1.6;
  const bagColor = incident.markerState === "bagged" ? 0x111827 : 0x1f2937;
  const highlightAlpha = incident.markerState === "bagged" ? 0.34 : 0.22;
  const bodyAnchors = [
    { x: incident.position.x + 18, y: incident.position.y + 14 },
    { x: incident.position.x + 30, y: incident.position.y + 20 }
  ];

  bodyAnchors.forEach((anchor, index) => {
    const rotation = 0.3 + index * 0.18 + sway * 0.03;
    const width = 16;
    const height = 7;
    graphics.save();
    graphics.translateCanvas(anchor.x, anchor.y);
    graphics.rotateCanvas(rotation);
    graphics.fillStyle(bagColor, incident.markerState === "bagged" ? 0.82 : 0.56);
    graphics.fillRoundedRect(-width / 2, -height / 2, width, height, 2.6);
    graphics.lineStyle(1, 0xf8fafc, highlightAlpha);
    graphics.strokeRoundedRect(-width / 2, -height / 2, width, height, 2.6);
    graphics.restore();
  });

  if (incident.markerState === "bagged") {
    const dragAnchor = {
      x: incident.position.x + 6,
      y: incident.position.y + 28
    };
    graphics.lineStyle(1.2, 0xf8fafc, 0.22);
    graphics.lineBetween(dragAnchor.x - 14, dragAnchor.y, dragAnchor.x + 14, dragAnchor.y + 4);
    graphics.lineBetween(dragAnchor.x - 10, dragAnchor.y + 5, dragAnchor.x + 10, dragAnchor.y + 9);
  }
}

function drawFrontlineFoothold(
  graphics: Phaser.GameObjects.Graphics,
  support: FrontlineSupportState,
  active: boolean,
  progressRatio: number
): void {
  const facingLength = Math.hypot(support.facing.x, support.facing.y);
  const normalizedFacing =
    facingLength > 0.001 ? { x: support.facing.x / facingLength, y: support.facing.y / facingLength } : { x: 1, y: 0 };
  const lateral = rotateVector(normalizedFacing, Math.PI / 2);
  const rear = {
    x: support.position.x - normalizedFacing.x * (support.kind === "fireteam" ? 18 : 14),
    y: support.position.y - normalizedFacing.y * (support.kind === "fireteam" ? 18 : 14)
  };
  const shellColor = active ? 0xe0f2fe : support.color;
  const shellAlpha = active ? 0.34 : support.status === "moving" ? 0.12 : 0.2;

  graphics.lineStyle(2, shellColor, shellAlpha);
  graphics.lineBetween(
    rear.x - lateral.x * (support.kind === "fireteam" ? 18 : 14),
    rear.y - lateral.y * (support.kind === "fireteam" ? 18 : 14),
    rear.x + lateral.x * (support.kind === "fireteam" ? 18 : 14),
    rear.y + lateral.y * (support.kind === "fireteam" ? 18 : 14)
  );

  if (support.kind === "fireteam") {
    graphics.lineStyle(1.6, 0xf8fafc, shellAlpha * 0.8);
    graphics.lineBetween(
      rear.x - lateral.x * 10 - normalizedFacing.x * 5,
      rear.y - lateral.y * 10 - normalizedFacing.y * 5,
      rear.x - lateral.x * 4 + normalizedFacing.x * 2,
      rear.y - lateral.y * 4 + normalizedFacing.y * 2
    );
    graphics.lineBetween(
      rear.x + lateral.x * 10 - normalizedFacing.x * 5,
      rear.y + lateral.y * 10 - normalizedFacing.y * 5,
      rear.x + lateral.x * 4 + normalizedFacing.x * 2,
      rear.y + lateral.y * 4 + normalizedFacing.y * 2
    );
  } else if (support.kind === "recovery") {
    graphics.lineStyle(1.4, 0xc4b5fd, shellAlpha * 0.88);
    graphics.strokeRect(rear.x - 10, rear.y - 7, 20, 14);
    graphics.lineBetween(rear.x - 5, rear.y, rear.x + 5, rear.y);
    graphics.lineBetween(rear.x, rear.y - 5, rear.x, rear.y + 5);
    if (isBurnerCoffeeSupport(support)) {
      graphics.lineStyle(1.2, 0xfde68a, shellAlpha * 0.92);
      graphics.beginPath();
      graphics.moveTo(rear.x - 4, rear.y - 10);
      graphics.lineTo(rear.x - 2, rear.y - 14);
      graphics.lineTo(rear.x - 5, rear.y - 18);
      graphics.moveTo(rear.x + 1, rear.y - 11);
      graphics.lineTo(rear.x + 4, rear.y - 15);
      graphics.lineTo(rear.x + 2, rear.y - 19);
      graphics.strokePath();
    }
  } else {
    graphics.lineStyle(1.5, 0xfde68a, shellAlpha * 0.84);
    graphics.strokeRect(rear.x - 12, rear.y - 6, 24, 12);
    graphics.lineBetween(rear.x - 5, rear.y - 6, rear.x - 1, rear.y - 10);
    graphics.lineBetween(rear.x + 1, rear.y - 10, rear.x + 5, rear.y - 6);
  }

  if (support.kind === "fireteam" && support.breachFootholdTimer > 0) {
    const breachAlpha = Math.min(0.54, 0.22 + support.breachFootholdTimer * 0.026);
    const tip = {
      x: support.position.x + normalizedFacing.x * 28,
      y: support.position.y + normalizedFacing.y * 28
    };
    const left = {
      x: support.position.x + lateral.x * 18 - normalizedFacing.x * 4,
      y: support.position.y + lateral.y * 18 - normalizedFacing.y * 4
    };
    const right = {
      x: support.position.x - lateral.x * 18 - normalizedFacing.x * 4,
      y: support.position.y - lateral.y * 18 - normalizedFacing.y * 4
    };
    graphics.fillStyle(0x22c55e, 0.08 + breachAlpha * 0.2);
    graphics.fillPoints([left, tip, right], true, true);
    graphics.lineStyle(2.4, 0x86efac, breachAlpha);
    graphics.strokePoints([left, tip, right], true, true);
    graphics.lineStyle(1.8, 0xdcfce7, breachAlpha * 0.8);
    graphics.strokeCircle(support.position.x, support.position.y, support.holdRadius - 18);
  }

  if (!active || support.sustainUsed) {
    return;
  }

  const progressColor = isBurnerCoffeeSupport(support) ? 0xf59e0b : 0x7dd3fc;
  graphics.lineStyle(2.2, progressColor, 0.7);
  graphics.beginPath();
  graphics.arc(
    support.position.x,
    support.position.y,
    Math.max(support.holdRadius - 8, 12),
    -Math.PI / 2,
    -Math.PI / 2 + Math.PI * 2 * progressRatio,
    false
  );
  graphics.strokePath();
}

function getPlayerAimProfile(weaponId: keyof typeof WEAPONS): { x: number; width: number; height: number; color: number; alpha: number } {
  if (weaponId === "none") {
    return { x: 12, width: 7, height: 2, color: 0x94a3b8, alpha: 0.82 };
  }

  if (weaponId === "knife") {
    return { x: 13, width: 8, height: 2, color: 0xe2e8f0, alpha: 0.9 };
  }

  if (weaponId === "pkm") {
    return { x: 20, width: 19, height: 4, color: 0xf97316, alpha: 0.96 };
  }

  if (weaponId === "worn-ak") {
    return { x: 17, width: 13, height: 4, color: 0xf59e0b, alpha: 0.93 };
  }

  if (weaponId === "short-mosin") {
    return { x: 18, width: 14, height: 3, color: 0xd6b38a, alpha: 0.94 };
  }

  if (weaponId === "smg") {
    return { x: 15, width: 11, height: 4, color: 0x7dd3fc, alpha: 0.94 };
  }

  if (weaponId === "shotgun") {
    return { x: 17, width: 12, height: 5, color: 0xfbbf24, alpha: 0.96 };
  }

  return { x: 19, width: 16, height: 3, color: 0xa7f3d0, alpha: 0.95 };
}

function getPropShadowConfig(kind: ScenicPropDefinition["kind"], scale: number): PropShadowConfig {
  switch (kind) {
    case "barrier":
    case "scrap-barricade":
      return { width: 48 * scale, height: 16 * scale, offsetX: 10, offsetY: 8 };
    case "forklift":
      return { width: 44 * scale, height: 18 * scale, offsetX: 8, offsetY: 10 };
    case "sandbag-nest":
      return { width: 40 * scale, height: 18 * scale, offsetX: 8, offsetY: 8 };
    case "generator":
      return { width: 36 * scale, height: 16 * scale, offsetX: 8, offsetY: 8 };
    case "cable-spool":
      return { width: 24 * scale, height: 16 * scale, offsetX: 6, offsetY: 8 };
    case "concrete-block":
      return { width: 30 * scale, height: 12 * scale, offsetX: 7, offsetY: 6 };
    case "cargo-container":
      return { width: 52 * scale, height: 20 * scale, offsetX: 10, offsetY: 8 };
    case "drum-stack":
      return { width: 26 * scale, height: 14 * scale, offsetX: 6, offsetY: 8 };
    case "vent-bank":
      return { width: 30 * scale, height: 12 * scale, offsetX: 8, offsetY: 6 };
    case "tool-locker":
      return { width: 22 * scale, height: 12 * scale, offsetX: 5, offsetY: 8 };
    case "watchtower":
      return { width: 28 * scale, height: 22 * scale, offsetX: 6, offsetY: 10 };
    case "field-tent":
      return { width: 44 * scale, height: 18 * scale, offsetX: 8, offsetY: 8 };
    case "dock-bollards":
      return { width: 28 * scale, height: 12 * scale, offsetX: 6, offsetY: 6 };
    case "antenna-array":
      return { width: 34 * scale, height: 18 * scale, offsetX: 7, offsetY: 8 };
    case "field-stretcher":
      return { width: 34 * scale, height: 14 * scale, offsetX: 6, offsetY: 7 };
    case "ammo-pallet":
      return { width: 30 * scale, height: 14 * scale, offsetX: 7, offsetY: 7 };
    case "cargo-truck":
      return { width: 54 * scale, height: 20 * scale, offsetX: 10, offsetY: 8 };
    case "hesco-wall":
      return { width: 42 * scale, height: 15 * scale, offsetX: 8, offsetY: 7 };
    case "satcom-rig":
      return { width: 34 * scale, height: 18 * scale, offsetX: 7, offsetY: 9 };
    case "razorwire-coil":
      return { width: 32 * scale, height: 10 * scale, offsetX: 6, offsetY: 5 };
    case "camo-net":
      return { width: 42 * scale, height: 16 * scale, offsetX: 8, offsetY: 8 };
    case "guard-shack":
      return { width: 32 * scale, height: 18 * scale, offsetX: 6, offsetY: 8 };
    case "wrecked-car":
      return { width: 34 * scale, height: 16 * scale, offsetX: 7, offsetY: 8 };
    case "checkpoint-gate":
      return { width: 48 * scale, height: 18 * scale, offsetX: 8, offsetY: 8 };
    case "supply-rack":
      return { width: 30 * scale, height: 15 * scale, offsetX: 6, offsetY: 8 };
    case "triage-canopy":
      return { width: 38 * scale, height: 16 * scale, offsetX: 8, offsetY: 8 };
    case "uplink-terminal":
      return { width: 24 * scale, height: 16 * scale, offsetX: 5, offsetY: 8 };
    case "medical-case":
      return { width: 24 * scale, height: 14 * scale, offsetX: 5, offsetY: 7 };
    case "extract-beacon":
      return { width: 24 * scale, height: 16 * scale, offsetX: 5, offsetY: 9 };
    case "relay-case":
      return { width: 26 * scale, height: 16 * scale, offsetX: 6, offsetY: 8 };
    case "trauma-rack":
      return { width: 30 * scale, height: 18 * scale, offsetX: 6, offsetY: 8 };
    case "beacon-array":
      return { width: 34 * scale, height: 18 * scale, offsetX: 7, offsetY: 8 };
    case "gantry-crane":
      return { width: 58 * scale, height: 24 * scale, offsetX: 10, offsetY: 10 };
    case "relay-dish":
      return { width: 42 * scale, height: 20 * scale, offsetX: 8, offsetY: 10 };
    case "reach-stacker":
      return { width: 56 * scale, height: 22 * scale, offsetX: 10, offsetY: 9 };
    case "radar-van":
      return { width: 40 * scale, height: 18 * scale, offsetX: 8, offsetY: 8 };
    case "ambulance-wreck":
      return { width: 42 * scale, height: 18 * scale, offsetX: 8, offsetY: 8 };
    case "apc-hulk":
      return { width: 48 * scale, height: 20 * scale, offsetX: 8, offsetY: 9 };
    default:
      return { width: 36 * scale, height: 18 * scale, offsetX: 8, offsetY: 10 };
  }
}

function getEncounterProps(
  route: RaidRouteDefinition,
  pocket: RaidRouteDefinition["combatPockets"][number],
  index: number
): PropPlacement[] {
  const angle = getPocketAngle(route.id, index);
  const tangent = angle + Math.PI / 2;
  const forwardDistance = pocket.radius * 0.56;
  const flankDistance = pocket.radius * 0.74;
  const rearDistance = pocket.radius * 0.48;
  const placements: PropPlacement[] = [
    {
      kind: route.id === "broken-signal" ? "barrier" : "sandbag-nest",
      position: {
        x: pocket.position.x + Math.cos(angle) * forwardDistance,
        y: pocket.position.y + Math.sin(angle) * forwardDistance * 0.72
      },
      rotation: angle + 0.16,
      scale: 0.86 + index * 0.04
    },
    {
      kind: route.id === "sundered-run" ? "scrap-barricade" : "concrete-block",
      position: {
        x: pocket.position.x + Math.cos(tangent) * flankDistance,
        y: pocket.position.y + Math.sin(tangent) * flankDistance * 0.68
      },
      rotation: tangent - 0.24,
      scale: 0.82 + index * 0.05
    },
    {
      kind: route.id === "crosswind-docks" ? "drum-stack" : "tool-locker",
      position: {
        x: pocket.position.x - Math.cos(tangent) * (flankDistance * 0.84),
        y: pocket.position.y - Math.sin(tangent) * flankDistance * 0.56
      },
      rotation: tangent + 0.22,
      scale: 0.88
    },
    {
      kind: route.id === "broken-signal" ? "satcom-rig" : route.id === "sundered-run" ? "hesco-wall" : "drum-stack",
      position: {
        x: pocket.position.x - Math.cos(angle) * rearDistance,
        y: pocket.position.y - Math.sin(angle) * rearDistance * 0.64
      },
      rotation: angle - 0.12,
      scale: route.id === "broken-signal" ? 0.82 : route.id === "sundered-run" ? 0.88 : 0.8,
      alpha: 0.96
    }
  ];

  if (route.id === "crosswind-docks") {
    placements.push({
      kind: "ammo-pallet",
      position: {
        x: pocket.position.x - Math.cos(angle - 0.18) * (pocket.radius * 0.28),
        y: pocket.position.y - Math.sin(angle - 0.18) * (pocket.radius * 0.2)
      },
      rotation: angle + 0.04,
      scale: 0.88,
      alpha: 0.96
    });

    placements.push({
      kind: "cable-spool",
      position: {
        x: pocket.position.x + Math.cos(angle + 0.42) * (pocket.radius * 0.34),
        y: pocket.position.y + Math.sin(angle + 0.42) * (pocket.radius * 0.28)
      },
      rotation: angle + 0.34,
      scale: 0.82
    });

    placements.push({
      kind: "guard-shack",
      position: {
        x: pocket.position.x - Math.cos(angle + 0.12) * (pocket.radius * 0.88),
        y: pocket.position.y - Math.sin(angle + 0.12) * pocket.radius * 0.66
      },
      rotation: angle + 0.02,
      scale: 0.86,
      alpha: 0.96
    });

    placements.push({
      kind: "checkpoint-gate",
      position: {
        x: pocket.position.x + Math.cos(angle + 0.08) * (pocket.radius * 0.58),
        y: pocket.position.y + Math.sin(angle + 0.08) * pocket.radius * 0.42
      },
      rotation: angle + Math.PI / 2,
      scale: 0.88,
      alpha: 0.96
    });

    placements.push({
      kind: "dock-bollards",
      position: {
        x: pocket.position.x + Math.cos(tangent + 0.08) * (pocket.radius * 0.22),
        y: pocket.position.y + Math.sin(tangent + 0.08) * pocket.radius * 0.18
      },
      rotation: angle + 0.18,
      scale: 0.82,
      alpha: 0.95,
      tint: 0xb6c4d0
    });

    if (index > 0) {
      placements.push({
        kind: index === 1 ? "cargo-truck" : "cargo-container",
        position: {
          x: pocket.position.x + Math.cos(angle - 0.14) * (pocket.radius * 0.86),
          y: pocket.position.y + Math.sin(angle - 0.14) * pocket.radius * 0.7
        },
        rotation: angle + Math.PI / 2 - 0.08,
        scale: index === 1 ? 0.88 : 0.92,
        alpha: 0.96
      });

      placements.push({
        kind: "supply-rack",
        position: {
          x: pocket.position.x - Math.cos(angle - 0.28) * (pocket.radius * 0.22),
          y: pocket.position.y - Math.sin(angle - 0.28) * (pocket.radius * 0.18)
        },
        rotation: angle + 0.08,
        scale: 0.9,
        alpha: 0.96
      });
    }
  }

  if (route.id === "broken-signal" && index > 0) {
    placements.push({
      kind: "hesco-wall",
      position: {
        x: pocket.position.x + Math.cos(angle + 0.2) * (pocket.radius * 0.48),
        y: pocket.position.y + Math.sin(angle + 0.2) * pocket.radius * 0.34
      },
      rotation: angle + 0.1,
      scale: 0.9,
      alpha: 0.98
    });

    placements.push({
      kind: "camo-net",
      position: {
        x: pocket.position.x + Math.cos(tangent - 0.12) * (pocket.radius * 0.28),
        y: pocket.position.y + Math.sin(tangent - 0.12) * pocket.radius * 0.24
      },
      rotation: angle - 0.04,
      scale: 0.82,
      alpha: 0.96
    });

    placements.push({
      kind: "wrecked-car",
      position: {
        x: pocket.position.x + Math.cos(angle - 0.44) * (pocket.radius * 0.32),
        y: pocket.position.y + Math.sin(angle - 0.44) * pocket.radius * 0.24
      },
      rotation: angle - 0.26,
      scale: 0.84,
      alpha: 0.94
    });

    placements.push({
      kind: "checkpoint-gate",
      position: {
        x: pocket.position.x + Math.cos(angle + 0.08) * (pocket.radius * 0.58),
        y: pocket.position.y + Math.sin(angle + 0.08) * pocket.radius * 0.38
      },
      rotation: angle + Math.PI / 2 + 0.08,
      scale: 0.84,
      alpha: 0.96
    });

    placements.push({
      kind: "supply-rack",
      position: {
        x: pocket.position.x - Math.cos(tangent - 0.18) * (pocket.radius * 0.18),
        y: pocket.position.y - Math.sin(tangent - 0.18) * pocket.radius * 0.12
      },
      rotation: angle - 0.06,
      scale: 0.86,
      alpha: 0.95
    });

    placements.push({
      kind: "watchtower",
      position: {
        x: pocket.position.x - Math.cos(angle) * (pocket.radius * 0.92),
        y: pocket.position.y - Math.sin(angle) * pocket.radius * 0.76
      },
      rotation: angle + 0.1,
      scale: 0.84,
      alpha: 0.98
    });

    placements.push({
      kind: "antenna-array",
      position: {
        x: pocket.position.x - Math.cos(tangent + 0.14) * (pocket.radius * 0.22),
        y: pocket.position.y - Math.sin(tangent + 0.14) * pocket.radius * 0.18
      },
      rotation: angle - 0.08,
      scale: 0.8,
      alpha: 0.96,
      tint: 0xc3d1dc
    });
  }

  if (route.id === "sundered-run" && index > 0) {
    placements.push({
      kind: "cargo-truck",
      position: {
        x: pocket.position.x + Math.cos(angle - 0.22) * (pocket.radius * 0.88),
        y: pocket.position.y + Math.sin(angle - 0.22) * pocket.radius * 0.7
      },
      rotation: angle + Math.PI / 2 + 0.04,
      scale: 0.86,
      alpha: 0.96
    });

    placements.push({
      kind: "razorwire-coil",
      position: {
        x: pocket.position.x + Math.cos(angle - 0.08) * (pocket.radius * 0.42),
        y: pocket.position.y + Math.sin(angle - 0.08) * pocket.radius * 0.26
      },
      rotation: angle + 0.26,
      scale: 0.94,
      alpha: 0.96
    });

    placements.push({
      kind: "guard-shack",
      position: {
        x: pocket.position.x - Math.cos(angle - 0.24) * (pocket.radius * 0.36),
        y: pocket.position.y - Math.sin(angle - 0.24) * pocket.radius * 0.26
      },
      rotation: angle + 0.1,
      scale: 0.86,
      alpha: 0.96
    });

    placements.push({
      kind: "field-tent",
      position: {
        x: pocket.position.x - Math.cos(tangent) * (pocket.radius * 0.94),
        y: pocket.position.y - Math.sin(tangent) * pocket.radius * 0.64
      },
      rotation: angle - 0.08,
      scale: 0.88,
      alpha: 0.96
    });

    placements.push({
      kind: "triage-canopy",
      position: {
        x: pocket.position.x - Math.cos(angle + 0.14) * (pocket.radius * 0.18),
        y: pocket.position.y - Math.sin(angle + 0.14) * pocket.radius * 0.12
      },
      rotation: angle - 0.04,
      scale: 0.88,
      alpha: 0.96
    });

    placements.push({
      kind: "wrecked-car",
      position: {
        x: pocket.position.x + Math.cos(tangent + 0.1) * (pocket.radius * 0.34),
        y: pocket.position.y + Math.sin(tangent + 0.1) * pocket.radius * 0.28
      },
      rotation: angle + 0.48,
      scale: 0.92,
      alpha: 0.95
    });

    placements.push({
      kind: "checkpoint-gate",
      position: {
        x: pocket.position.x + Math.cos(angle + 0.2) * (pocket.radius * 0.52),
        y: pocket.position.y + Math.sin(angle + 0.2) * pocket.radius * 0.4
      },
      rotation: angle + Math.PI / 2 - 0.06,
      scale: 0.88,
      alpha: 0.97
    });

    placements.push({
      kind: "field-stretcher",
      position: {
        x: pocket.position.x - Math.cos(angle + 0.2) * (pocket.radius * 0.12),
        y: pocket.position.y - Math.sin(angle + 0.2) * pocket.radius * 0.08
      },
      rotation: angle - 0.12,
      scale: 0.84,
      alpha: 0.96,
      tint: 0xb6c39c
    });
  }

  return placements;
}

function getObstacleSetDressings(obstacle: (typeof ARENA_OBSTACLES)[number], route: RaidRouteDefinition): PropPlacement[] {
  const centerX = obstacle.x + obstacle.width / 2;
  const centerY = obstacle.y + obstacle.height / 2;
  const edgeInset = 34;
  const roofTint = route.id === "sundered-run" ? 0xbfa792 : route.id === "broken-signal" ? 0xd1d9df : 0xcaa277;

  return [
    {
      kind: "vent-bank",
      position: {
        x: centerX - obstacle.width * 0.18,
        y: centerY - obstacle.height * 0.12
      },
      rotation: obstacle.id % 2 === 0 ? -0.04 : 0.04,
      scale: Math.min(1.14, 0.8 + obstacle.width / 520),
      tint: roofTint,
      alpha: 0.94,
      shadowAlpha: 0.18,
      depthBias: -0.018
    },
    {
      kind: "tool-locker",
      position: {
        x: centerX + obstacle.width * 0.16,
        y: centerY + obstacle.height * 0.14
      },
      rotation: obstacle.id % 2 === 0 ? 0.02 : -0.02,
      scale: 0.84,
      tint: route.id === "crosswind-docks" ? 0xf59e0b : 0xa3b3bf,
      alpha: 0.94,
      shadowAlpha: 0.14,
      depthBias: -0.016
    },
    {
      kind: route.id === "broken-signal" ? "hesco-wall" : "concrete-block",
      position: {
        x: obstacle.x + edgeInset,
        y: obstacle.y + obstacle.height + 22
      },
      rotation: -0.08,
      scale: 0.82,
      alpha: 0.92
    },
    {
      kind: route.id === "sundered-run" ? "drum-stack" : "pallet-stack",
      position: {
        x: obstacle.x + obstacle.width - edgeInset,
        y: obstacle.y - 18
      },
      rotation: 0.08,
      scale: 0.8,
      alpha: 0.94
    },
    {
      kind: route.id === "broken-signal" ? "camo-net" : "ammo-pallet",
      position: {
        x: centerX,
        y: obstacle.y + obstacle.height + 38
      },
      rotation: obstacle.id % 2 === 0 ? 0.04 : -0.04,
      scale: route.id === "broken-signal" ? 0.84 : 0.8,
      tint: route.id === "crosswind-docks" ? 0x9ca3af : undefined,
      alpha: 0.94,
      shadowAlpha: 0.12,
      depthBias: -0.01
    },
    {
      kind: route.id === "sundered-run" ? "wrecked-car" : "guard-shack",
      position: {
        x: obstacle.x + obstacle.width - edgeInset + 14,
        y: obstacle.y + obstacle.height + 54
      },
      rotation: route.id === "sundered-run" ? -0.22 : 0.04,
      scale: route.id === "sundered-run" ? 0.84 : 0.8,
      tint: route.id === "broken-signal" ? 0xaebdcb : undefined,
      alpha: 0.95,
      shadowAlpha: 0.16,
      depthBias: -0.008
    }
  ];
}


function getObjectiveSetDressings(route: RaidRouteDefinition): PropPlacement[] {
  const placements: PropPlacement[] = [];

  for (const [index, intelPosition] of route.intelPositions.entries()) {
    placements.push({
      kind: "uplink-terminal",
      position: intelPosition,
      rotation: route.id === "broken-signal" ? 0.06 : route.id === "sundered-run" ? -0.08 : 0.02,
      scale: 0.92,
      tint: route.id === "broken-signal" ? 0xc4d3df : route.id === "sundered-run" ? 0xa9b88e : 0x9eb4c5,
      alpha: 0.96,
      shadowAlpha: 0.2
    });

    placements.push({
      kind: route.id === "broken-signal" ? "satcom-rig" : route.id === "sundered-run" ? "field-tent" : "guard-shack",
      position: {
        x: intelPosition.x - 66 + index * 10,
        y: intelPosition.y + (route.id === "broken-signal" ? -30 : 32)
      },
      rotation: route.id === "broken-signal" ? -0.1 : route.id === "sundered-run" ? 0.08 : 0.04,
      scale: route.id === "sundered-run" ? 0.84 : 0.78,
      alpha: 0.95
    });

    placements.push({
      kind: route.id === "sundered-run" ? "sandbag-nest" : "barrier",
      position: {
        x: intelPosition.x + 62,
        y: intelPosition.y + (route.id === "broken-signal" ? 26 : -24)
      },
      rotation: route.id === "broken-signal" ? 0.2 : -0.14,
      scale: 0.82,
      alpha: 0.95
    });

    placements.push({
      kind: "relay-case",
      position: {
        x: intelPosition.x + (route.id === "broken-signal" ? 58 : route.id === "sundered-run" ? -18 : 18),
        y: intelPosition.y + (route.id === "sundered-run" ? 72 : 60)
      },
      rotation: route.id === "broken-signal" ? 0.08 : route.id === "sundered-run" ? -0.12 : 0.02,
      scale: 0.82,
      alpha: 0.96,
      tint: route.id === "sundered-run" ? 0xb4c28f : route.id === "broken-signal" ? 0xc5d4e0 : 0xa8bac7
    });

    placements.push({
      kind:
        route.id === "broken-signal"
          ? "watchtower"
          : route.id === "sundered-run"
            ? "triage-canopy"
            : "supply-rack",
      position: {
        x: intelPosition.x + (route.id === "broken-signal" ? -76 : 74),
        y: intelPosition.y + (route.id === "sundered-run" ? 56 : route.id === "crosswind-docks" ? 34 : -62)
      },
      rotation: route.id === "broken-signal" ? -0.08 : route.id === "sundered-run" ? 0.06 : 0.1,
      scale: route.id === "broken-signal" ? 0.78 : 0.82,
      alpha: 0.95
    });

    if (route.id === "crosswind-docks") {
      placements.push({
        kind: "ammo-pallet",
        position: { x: intelPosition.x - 22, y: intelPosition.y + 60 },
        rotation: 0.08,
        scale: 0.82,
        alpha: 0.94
      });

      placements.push({
        kind: "dock-bollards",
        position: { x: intelPosition.x + 84, y: intelPosition.y - 14 },
        rotation: 0.04,
        scale: 0.84,
        alpha: 0.95,
        tint: 0xb5c4d1
      });
    }

    if (route.id === "broken-signal") {
      placements.push({
        kind: "hesco-wall",
        position: { x: intelPosition.x + 8, y: intelPosition.y + 68 },
        rotation: 0.06,
        scale: 0.84,
        alpha: 0.95
      });

      placements.push({
        kind: "antenna-array",
        position: { x: intelPosition.x - 16, y: intelPosition.y - 82 },
        rotation: -0.04,
        scale: 0.88,
        alpha: 0.96,
        tint: 0xc8d7e3
      });
    }

    if (route.id === "sundered-run") {
      placements.push({
        kind: "medical-case",
        position: { x: intelPosition.x + 28, y: intelPosition.y + 44 },
        rotation: -0.04,
        scale: 0.8,
        alpha: 0.95
      });

      placements.push({
        kind: "field-stretcher",
        position: { x: intelPosition.x - 52, y: intelPosition.y + 54 },
        rotation: 0.06,
        scale: 0.86,
        alpha: 0.96,
        tint: 0xb7c59e
      });
    }
  }

  for (const cache of route.supplyCaches) {
    placements.push({
      kind: cache.kind === "medical" ? "medical-case" : cache.kind === "ammo" ? "ammo-pallet" : "tool-locker",
      position: {
        x: cache.position.x - 16,
        y: cache.position.y + 18
      },
      rotation: cache.kind === "ammo" ? 0.1 : -0.04,
      scale: cache.kind === "ammo" ? 0.8 : 0.86,
      alpha: 0.92,
      shadowAlpha: 0.18
    });

    if (cache.kind === "medical") {
      placements.push({
        kind: "trauma-rack",
        position: {
          x: cache.position.x - 62,
          y: cache.position.y - 18
        },
        rotation: route.id === "sundered-run" ? 0.08 : -0.04,
        scale: 0.84,
        alpha: 0.95,
        tint: route.id === "sundered-run" ? 0xb9cb9c : 0xd8e6de
      });
    }

    placements.push({
      kind: route.id === "broken-signal" ? "cable-spool" : route.id === "sundered-run" ? "hesco-wall" : "pallet-stack",
      position: {
        x: cache.position.x + 44,
        y: cache.position.y - 26
      },
      rotation: route.id === "sundered-run" ? 0.12 : -0.08,
      scale: 0.8,
      alpha: 0.94
    });

    placements.push({
      kind:
        cache.kind === "medical"
          ? route.id === "sundered-run"
            ? "triage-canopy"
            : "field-tent"
          : cache.kind === "ammo"
            ? "supply-rack"
            : route.id === "broken-signal"
              ? "satcom-rig"
              : "guard-shack",
      position: {
        x: cache.position.x + (cache.kind === "ammo" ? 58 : -52),
        y: cache.position.y + (cache.kind === "medical" ? -54 : 46)
      },
      rotation:
        cache.kind === "ammo" ? 0.08 : route.id === "broken-signal" ? -0.12 : route.id === "sundered-run" ? 0.08 : 0.04,
      scale: cache.kind === "medical" ? 0.8 : cache.kind === "ammo" ? 0.82 : 0.78,
      alpha: 0.95
    });

    if (route.id === "crosswind-docks" && cache.kind !== "medical") {
      placements.push({
        kind: "dock-bollards",
        position: {
          x: cache.position.x + 70,
          y: cache.position.y + 12
        },
        rotation: 0.08,
        scale: 0.8,
        alpha: 0.94,
        tint: 0xb4c3cf
      });
    }

    if (route.id === "broken-signal" && cache.kind !== "medical") {
      placements.push({
        kind: "antenna-array",
        position: {
          x: cache.position.x - 64,
          y: cache.position.y - 58
        },
        rotation: -0.08,
        scale: 0.82,
        alpha: 0.96,
        tint: 0xc4d4de
      });
    }

    if (route.id === "sundered-run" && cache.kind === "medical") {
      placements.push({
        kind: "field-stretcher",
        position: {
          x: cache.position.x + 62,
          y: cache.position.y - 18
        },
        rotation: 0.1,
        scale: 0.84,
        alpha: 0.95,
        tint: 0xb4c49a
      });
    }
  }

  placements.push({
    kind: "extract-beacon",
    position: route.extractZone.position,
    rotation: 0,
    scale: 0.98,
    tint: route.id === "sundered-run" ? 0xc99a62 : route.id === "broken-signal" ? 0xbfd3df : 0xc7a06c,
    alpha: 0.96,
    shadowAlpha: 0.22
  });

  placements.push({
    kind: "checkpoint-gate",
    position: {
      x: route.extractZone.position.x - route.extractZone.radius * 0.46,
      y: route.extractZone.position.y + 8
    },
    rotation: Math.PI / 2,
    scale: 0.86,
    alpha: 0.95
  });

  placements.push({
    kind: route.id === "sundered-run" ? "razorwire-coil" : route.id === "broken-signal" ? "watchtower" : "cargo-container",
    position: {
      x: route.extractZone.position.x + route.extractZone.radius * 0.52,
      y: route.extractZone.position.y - 34
    },
    rotation: route.id === "broken-signal" ? 0.08 : route.id === "sundered-run" ? 0.22 : Math.PI / 2,
    scale: route.id === "broken-signal" ? 0.82 : 0.8,
    alpha: 0.96
  });

  placements.push({
    kind: route.id === "sundered-run" ? "barrier" : "floodlight",
    position: {
      x: route.extractZone.position.x + 12,
      y: route.extractZone.position.y - route.extractZone.radius * 0.56
    },
    rotation: route.id === "sundered-run" ? -0.18 : 0.08,
    scale: route.id === "sundered-run" ? 0.86 : 0.82,
    alpha: 0.94
  });

  placements.push({
    kind: "beacon-array",
    position: {
      x: route.extractZone.position.x + (route.id === "sundered-run" ? 16 : -8),
      y: route.extractZone.position.y + route.extractZone.radius * 0.58
    },
    rotation: route.id === "sundered-run" ? 0.08 : -0.04,
    scale: route.id === "broken-signal" ? 0.88 : 0.92,
    alpha: 0.95,
    tint: route.id === "sundered-run" ? 0xcf9f66 : route.id === "broken-signal" ? 0xc8d7e2 : 0xc7ab72
  });

  if (route.id === "crosswind-docks") {
    placements.push(
      {
        kind: "cargo-truck",
        position: {
          x: route.extractZone.position.x - route.extractZone.radius * 1.08,
          y: route.extractZone.position.y - 78
        },
        rotation: Math.PI / 2,
        scale: 0.9,
        alpha: 0.96
      },
      {
        kind: "supply-rack",
        position: {
          x: route.extractZone.position.x - 24,
          y: route.extractZone.position.y + route.extractZone.radius * 0.66
        },
        rotation: 0.04,
        scale: 0.88,
        alpha: 0.95
      },
      {
        kind: "dock-bollards",
        position: {
          x: route.extractZone.position.x + route.extractZone.radius * 0.56,
          y: route.extractZone.position.y + 50
        },
        rotation: 0.06,
        scale: 0.9,
        alpha: 0.95,
        tint: 0xb7c8d4
      }
    );
  }

  if (route.id === "broken-signal") {
    placements.push(
      {
        kind: "satcom-rig",
        position: {
          x: route.extractZone.position.x - route.extractZone.radius * 0.92,
          y: route.extractZone.position.y - 74
        },
        rotation: -0.08,
        scale: 0.84,
        alpha: 0.96
      },
      {
        kind: "hesco-wall",
        position: {
          x: route.extractZone.position.x + route.extractZone.radius * 0.34,
          y: route.extractZone.position.y + 58
        },
        rotation: 0.12,
        scale: 0.88,
        alpha: 0.95
      },
      {
        kind: "antenna-array",
        position: {
          x: route.extractZone.position.x + route.extractZone.radius * 0.62,
          y: route.extractZone.position.y - 18
        },
        rotation: 0.08,
        scale: 0.84,
        alpha: 0.96,
        tint: 0xc5d4df
      }
    );
  }

  if (route.id === "sundered-run") {
    placements.push(
      {
        kind: "triage-canopy",
        position: {
          x: route.extractZone.position.x - route.extractZone.radius * 0.72,
          y: route.extractZone.position.y - 84
        },
        rotation: 0.06,
        scale: 0.86,
        alpha: 0.96
      },
      {
        kind: "wrecked-car",
        position: {
          x: route.extractZone.position.x + route.extractZone.radius * 0.46,
          y: route.extractZone.position.y + 68
        },
        rotation: -0.22,
        scale: 0.88,
        alpha: 0.95
      },
      {
        kind: "field-stretcher",
        position: {
          x: route.extractZone.position.x - 18,
          y: route.extractZone.position.y + route.extractZone.radius * 0.58
        },
        rotation: -0.06,
        scale: 0.86,
        alpha: 0.96,
        tint: 0xb7c59e
      }
    );
  }

  return placements;
}

function getObjectiveSurfaceDecals(route: RaidRouteDefinition): GroundDecalDefinition[] {
  const decals: GroundDecalDefinition[] = [];

  for (const intelPosition of route.intelPositions) {
    decals.push({
      kind: route.id === "broken-signal" ? "signal-pad" : route.id === "sundered-run" ? "med-bay" : "signal-pad",
      position: intelPosition,
      rotation: route.id === "broken-signal" ? 0.04 : route.id === "sundered-run" ? -0.1 : -0.02,
      scale: route.id === "broken-signal" ? 0.88 : route.id === "sundered-run" ? 0.76 : 0.82,
      alpha: 0.36,
      tint: route.id === "sundered-run" ? 0x88a76d : route.id === "broken-signal" ? 0xc2d2de : 0x9bb2c4,
      depthOffset: -0.085
    });

    decals.push({
      kind: route.id === "broken-signal" ? "relay-grid" : "cables",
      position: {
        x: intelPosition.x + (route.id === "broken-signal" ? -18 : 24),
        y: intelPosition.y + 34
      },
      rotation: route.id === "broken-signal" ? 0.08 : 0.24,
      scale: route.id === "broken-signal" ? 0.72 : 0.68,
      alpha: 0.24,
      tint: route.id === "sundered-run" ? 0x72815d : 0x7dd3fc,
      depthOffset: -0.082
    });
  }

  for (const cache of route.supplyCaches) {
    decals.push({
      kind: cache.kind === "ammo" ? "chevrons" : cache.kind === "locker" ? "grate" : "med-bay",
      position: {
        x: cache.position.x + 10,
        y: cache.position.y + 8
      },
      rotation: cache.kind === "ammo" ? 0.06 : -0.04,
      scale: cache.kind === "ammo" ? 0.7 : cache.kind === "medical" ? 0.64 : 0.62,
      alpha: 0.3,
      tint: cache.kind === "medical" ? 0x166534 : cache.kind === "ammo" ? route.sceneTheme.accentColor : 0x64748b,
      depthOffset: -0.08
    });

    decals.push({
      kind: cache.kind === "locker" ? "signal-pad" : cache.kind === "ammo" ? "dock-plates" : "tarp",
      position: {
        x: cache.position.x - 28,
        y: cache.position.y + 26
      },
      rotation: cache.kind === "ammo" ? 0.08 : -0.08,
      scale: cache.kind === "ammo" ? 0.66 : 0.58,
      alpha: 0.22,
      tint: cache.kind === "medical" ? 0x89b98f : cache.kind === "ammo" ? 0x9aa9b7 : 0xa0b5c6,
      depthOffset: -0.078
    });
  }

  decals.push({
    kind: "extract-lane",
    position: route.extractZone.position,
    rotation: route.id === "sundered-run" ? 1.02 : 0,
    scale: route.id === "broken-signal" ? 0.94 : 1.04,
    alpha: 0.28,
    tint: route.id === "sundered-run" ? 0xcc9d66 : route.id === "broken-signal" ? 0xc9d8e4 : 0xa6b9c8,
    depthOffset: -0.09
  });

  decals.push({
    kind: route.id === "broken-signal" ? "cables" : "dock-plates",
    position: {
      x: route.extractZone.position.x - route.extractZone.radius * 0.2,
      y: route.extractZone.position.y + route.extractZone.radius * 0.12
    },
    rotation: route.id === "broken-signal" ? -0.18 : 0.04,
    scale: 0.86,
    alpha: 0.24,
    tint: route.id === "broken-signal" ? 0x7dd3fc : 0x7b90a3,
    depthOffset: -0.09
  });

  decals.push({
    kind: "chevrons",
    position: {
      x: route.extractZone.position.x + route.extractZone.radius * 0.04,
      y: route.extractZone.position.y
    },
    rotation: route.id === "sundered-run" ? 1.02 : 0,
    scale: 0.96,
    alpha: 0.22,
    tint: route.sceneTheme.accentColor,
    depthOffset: -0.088
  });

  return decals;
}

export class RaidScene extends Phaser.Scene {
  private arenaLayer?: Phaser.GameObjects.Container;
  private playerSprite!: Phaser.GameObjects.Container;
  private playerBody!: Phaser.GameObjects.Sprite;
  private playerAim!: Phaser.GameObjects.Rectangle;
  private enemySprites: SpriteMap = new Map();
  private friendlyCombatantSprites: SpriteMap = new Map();
  private townWarSoldierSprites: TownWarSpriteMap = new Map();
  private fallenSquadBodySprites: SpriteMap = new Map();
  private fallenEnemyBodySprites: SpriteMap = new Map();
  private bulletSprites: SpriteMap = new Map();
  private frontlineTracerSprites: SpriteMap = new Map();
  private lootSprites: SpriteMap = new Map();
  private intelSprites: SpriteMap = new Map();
  private supplyCacheSprites: SpriteMap = new Map();
  private frontlineSupportSprites: SpriteMap = new Map();
  private frontlineIncidentSprites: SpriteMap = new Map();
  private squadMateEscortSprites: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private worldSpeechBubbles: WorldSpeechBubbleVisual[] = [];
  private lastSquadSpeechKey: string | null = null;
  private lastHostileSpeechKey: string | null = null;
  private extractionRing!: Phaser.GameObjects.Arc;
  private extractionPulse!: Phaser.GameObjects.Arc;
  private searchPulse!: Phaser.GameObjects.Arc;
  private intelPulse!: Phaser.GameObjects.Arc;
  private breachPulse!: Phaser.GameObjects.Arc;
  private noisePulse!: Phaser.GameObjects.Arc;
  private frontlineSupportGraphics!: Phaser.GameObjects.Graphics;
  private frontlineIncidentGraphics!: Phaser.GameObjects.Graphics;
  private frontlineImpactGraphics!: Phaser.GameObjects.Graphics;
  private townWarCampGraphics!: Phaser.GameObjects.Graphics;
  private grenadeGraphics!: Phaser.GameObjects.Graphics;
  private enemyIntentGraphics!: Phaser.GameObjects.Graphics;
  private enemyStatusGraphics!: Phaser.GameObjects.Graphics;
  private factionMarkerGraphics!: Phaser.GameObjects.Graphics;
  private objectiveGraphics!: Phaser.GameObjects.Graphics;
  private roomStackGraphics!: Phaser.GameObjects.Graphics;
  private edgeIndicatorGraphics!: Phaser.GameObjects.Graphics;
  private worldObjectiveLabels: ObjectiveLabelSlot[] = [];
  private townWarFieldworkLabels: ObjectiveLabelSlot[] = [];
  private townWarCampLabels: ObjectiveLabelSlot[] = [];
  private townWarSelectedSoldierLabels: ObjectiveLabelSlot[] = [];
  private townWarLookSoldierLabels: ObjectiveLabelSlot[] = [];
  private townWarPlayerCampArtObjects: Phaser.GameObjects.GameObject[] = [];
  private townWarPlayerCampArtVisible = true;
  private roomStackLabels: ObjectiveLabelSlot[] = [];
  private edgeObjectiveLabels: ObjectiveLabelSlot[] = [];
  private squadEscortLabels: ObjectiveLabelSlot[] = [];
  private selectedTownWarSoldierId: string | null = null;
  private townWarLookWorld: Vec2 | null = null;
  private revealableObstacleVisuals: ObstacleRevealVisual[] = [];
  private aimReticle!: Phaser.GameObjects.Graphics;
  private telemetryPanelBg!: Phaser.GameObjects.Rectangle;
  private telemetryPanelTitle!: Phaser.GameObjects.Text;
  private telemetryPanelBody!: Phaser.GameObjects.Text;
  private noiseDisciplinePanelBg!: Phaser.GameObjects.Rectangle;
  private noiseDisciplinePanelTitle!: Phaser.GameObjects.Text;
  private noiseDisciplinePanelBody!: Phaser.GameObjects.Text;
  private pressurePosturePanelBg!: Phaser.GameObjects.Rectangle;
  private pressurePosturePanelTitle!: Phaser.GameObjects.Text;
  private pressurePosturePanelBody!: Phaser.GameObjects.Text;
  private frontlineOperationPanelBg!: Phaser.GameObjects.Rectangle;
  private frontlineOperationPanelTitle!: Phaser.GameObjects.Text;
  private frontlineOperationPanelBody!: Phaser.GameObjects.Text;
  private combatPulsePanelBg!: Phaser.GameObjects.Rectangle;
  private combatPulsePanelTitle!: Phaser.GameObjects.Text;
  private combatPulsePanelBody!: Phaser.GameObjects.Text;
  private combatAudioPanelBg!: Phaser.GameObjects.Rectangle;
  private combatAudioPanelTitle!: Phaser.GameObjects.Text;
  private combatAudioPanelBody!: Phaser.GameObjects.Text;
  private extractPressurePanelBg!: Phaser.GameObjects.Rectangle;
  private extractPressurePanelTitle!: Phaser.GameObjects.Text;
  private extractPressurePanelBody!: Phaser.GameObjects.Text;
  private squadCommandPanelBg!: Phaser.GameObjects.Rectangle;
  private squadCommandPanelTitle!: Phaser.GameObjects.Text;
  private squadCommandPanelBody!: Phaser.GameObjects.Text;
  private squadTrafficPanelBg!: Phaser.GameObjects.Rectangle;
  private squadTrafficPanelTitle!: Phaser.GameObjects.Text;
  private squadTrafficPanelBody!: Phaser.GameObjects.Text;
  private hostileTrafficPanelBg!: Phaser.GameObjects.Rectangle;
  private hostileTrafficPanelTitle!: Phaser.GameObjects.Text;
  private hostileTrafficPanelBody!: Phaser.GameObjects.Text;
  private frontlineAftermathPanelBg!: Phaser.GameObjects.Rectangle;
  private frontlineAftermathPanelTitle!: Phaser.GameObjects.Text;
  private frontlineAftermathPanelBody!: Phaser.GameObjects.Text;
  private activeRouteId: RaidRouteId | null = null;
  private combatAudioEngine!: CombatAudioEngine;

  private movementKeys!: Record<"up" | "down" | "left" | "right", Phaser.Input.Keyboard.Key>;
    private altKey!: Phaser.Input.Keyboard.Key;
    private ctrlKey!: Phaser.Input.Keyboard.Key;
    private braceKey!: Phaser.Input.Keyboard.Key;
  private reloadKey!: Phaser.Input.Keyboard.Key;
  private grenadeKey!: Phaser.Input.Keyboard.Key;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private healKey!: Phaser.Input.Keyboard.Key;
  private supportOrderKeys!: Record<"shiftFire" | "holdPosition" | "dropAmmoCrate", Phaser.Input.Keyboard.Key>;
  private squadSelectionKeys!: Record<"first" | "second" | "third", Phaser.Input.Keyboard.Key>;
  private squadCommandKeys!: Record<"follow" | "defend" | "attack", Phaser.Input.Keyboard.Key>;

  public constructor() {
    super("raid-scene");
  }

  public setTownWarSelectedSoldierId(soldierId: string | null): void {
    this.selectedTownWarSoldierId = soldierId;
  }

  public setTownWarPlayerCampArtVisible(visible: boolean): void {
    this.townWarPlayerCampArtVisible = visible;
    for (const object of this.townWarPlayerCampArtObjects) {
      if ("setVisible" in object && typeof object.setVisible === "function") {
        object.setVisible(visible);
      }
    }
  }

  public preload(): void {
    for (const asset of FRONTLINE_CAMP_ASSETS) {
      if (this.textures.exists(asset.key)) {
        continue;
      }

      if (asset.type === "spritesheet") {
        this.load.spritesheet(asset.key, asset.url, {
          frameWidth: asset.frameWidth,
          frameHeight: asset.frameHeight
        });
      } else {
        this.load.image(asset.key, asset.url);
      }
    }
  }

  public create(): void {
    const { width, height } = raidController.state.world;
    this.activeRouteId = raidController.state.activeRouteId;

    this.cameras.main.setBounds(0, 0, width, height);
    this.cameras.main.setZoom(1);
    this.input.mouse?.disableContextMenu();

    this.createTextures();
    this.redrawArena(width, height);

    this.extractionRing = this.add.circle(
      raidController.state.extractZone.position.x,
      raidController.state.extractZone.position.y,
      raidController.state.extractZone.radius,
      0x22c55e,
      0.08
    );
    this.extractionRing.setStrokeStyle(3, 0x22c55e, 0.5);
    this.extractionPulse = this.add.circle(
      raidController.state.extractZone.position.x,
      raidController.state.extractZone.position.y,
      raidController.state.extractZone.radius + 16,
      0x38bdf8,
      0.08
    );
    this.extractionPulse.setStrokeStyle(2, 0x38bdf8, 0.34);
    this.searchPulse = this.add.circle(0, 0, 30, 0xf59e0b, 0.06);
    this.searchPulse.setStrokeStyle(2, 0xf59e0b, 0.7);
    this.searchPulse.setVisible(false);
    this.intelPulse = this.add.circle(0, 0, 34, 0x38bdf8, 0.08);
    this.intelPulse.setStrokeStyle(2, 0x7dd3fc, 0.78);
    this.intelPulse.setVisible(false);
    this.breachPulse = this.add.circle(0, 0, 34, 0x4ade80, 0.08);
    this.breachPulse.setStrokeStyle(3, 0x86efac, 0.82);
    this.breachPulse.setVisible(false);
    this.noisePulse = this.add.circle(0, 0, 40, 0xf87171, 0.08);
    this.noisePulse.setStrokeStyle(3, 0xf87171, 0.7);
    this.noisePulse.setVisible(false);
    this.frontlineSupportGraphics = this.add.graphics();
    this.frontlineIncidentGraphics = this.add.graphics();
    this.frontlineImpactGraphics = this.add.graphics();
    this.townWarCampGraphics = this.add.graphics();
    this.grenadeGraphics = this.add.graphics();
    this.enemyIntentGraphics = this.add.graphics();
    this.enemyStatusGraphics = this.add.graphics();
    this.factionMarkerGraphics = this.add.graphics();
    this.objectiveGraphics = this.add.graphics();
    this.roomStackGraphics = this.add.graphics();
    this.roomStackGraphics.setDepth(8);
    this.edgeIndicatorGraphics = this.add.graphics();
    this.edgeIndicatorGraphics.setScrollFactor(0);
    this.aimReticle = this.add.graphics();
    this.aimReticle.setScrollFactor(0);
    this.telemetryPanelBg = this.add.rectangle(16, 244, 324, 58, 0x020617, 0.86).setOrigin(0, 0);
    this.telemetryPanelBg.setScrollFactor(0);
    this.telemetryPanelBg.setStrokeStyle(1, 0x334155, 0.9);
    this.telemetryPanelBg.setDepth(1000);
    this.telemetryPanelTitle = this.add.text(26, 252, "FRONTLINE SPREAD", {
      fontFamily: "monospace",
      fontSize: "12px",
      color: "#e2e8f0"
    });
    this.telemetryPanelTitle.setScrollFactor(0);
    this.telemetryPanelTitle.setDepth(1001);
    this.telemetryPanelTitle.setShadow(0, 1, "#020617", 6, false, true);
    this.telemetryPanelBody = this.add.text(26, 270, "", {
      fontFamily: "monospace",
      fontSize: "10px",
      color: "#cbd5e1",
      lineSpacing: 3
    });
    this.telemetryPanelBody.setScrollFactor(0);
    this.telemetryPanelBody.setDepth(1001);
    this.telemetryPanelBody.setShadow(0, 1, "#020617", 6, false, true);
    const rightPanelX = Math.max(432, this.scale.width - 336);
    this.hostileTrafficPanelBg = this.add.rectangle(rightPanelX, 244, 320, 90, 0x020617, 0.88).setOrigin(0, 0);
    this.hostileTrafficPanelBg.setScrollFactor(0);
    this.hostileTrafficPanelBg.setStrokeStyle(1, 0x60a5fa, 0.9);
    this.hostileTrafficPanelBg.setDepth(1000);
    this.hostileTrafficPanelTitle = this.add.text(rightPanelX + 10, 252, "BLUE SHOUTS", {
      fontFamily: "monospace",
      fontSize: "12px",
      color: "#bfdbfe"
    });
    this.hostileTrafficPanelTitle.setScrollFactor(0);
    this.hostileTrafficPanelTitle.setDepth(1001);
    this.hostileTrafficPanelTitle.setShadow(0, 1, "#020617", 6, false, true);
    this.hostileTrafficPanelBody = this.add.text(rightPanelX + 10, 270, "", {
      fontFamily: "monospace",
      fontSize: "9px",
      color: "#dbeafe",
      lineSpacing: 3,
      wordWrap: { width: 288, useAdvancedWrap: true }
    });
    this.hostileTrafficPanelBody.setScrollFactor(0);
    this.hostileTrafficPanelBody.setDepth(1001);
    this.hostileTrafficPanelBody.setShadow(0, 1, "#020617", 6, false, true);
    this.frontlineOperationPanelBg = this.add.rectangle(rightPanelX, 342, 320, 74, 0x020617, 0.88).setOrigin(0, 0);
    this.frontlineOperationPanelBg.setScrollFactor(0);
    this.frontlineOperationPanelBg.setStrokeStyle(1, 0x38bdf8, 0.9);
    this.frontlineOperationPanelBg.setDepth(1000);
    this.frontlineOperationPanelTitle = this.add.text(rightPanelX + 10, 350, "SECTOR ORDER", {
      fontFamily: "monospace",
      fontSize: "12px",
      color: "#bae6fd"
    });
    this.frontlineOperationPanelTitle.setScrollFactor(0);
    this.frontlineOperationPanelTitle.setDepth(1001);
    this.frontlineOperationPanelTitle.setShadow(0, 1, "#020617", 6, false, true);
    this.frontlineOperationPanelBody = this.add.text(rightPanelX + 10, 368, "", {
      fontFamily: "monospace",
      fontSize: "9px",
      color: "#dbeafe",
      lineSpacing: 3,
      wordWrap: { width: 288, useAdvancedWrap: true }
    });
    this.frontlineOperationPanelBody.setScrollFactor(0);
    this.frontlineOperationPanelBody.setDepth(1001);
    this.frontlineOperationPanelBody.setShadow(0, 1, "#020617", 6, false, true);
    this.combatPulsePanelBg = this.add.rectangle(rightPanelX, 424, 320, 74, 0x020617, 0.88).setOrigin(0, 0);
    this.combatPulsePanelBg.setScrollFactor(0);
    this.combatPulsePanelBg.setStrokeStyle(1, 0x38bdf8, 0.9);
    this.combatPulsePanelBg.setDepth(1000);
    this.combatPulsePanelTitle = this.add.text(rightPanelX + 10, 432, "COMBAT PULSE", {
      fontFamily: "monospace",
      fontSize: "12px",
      color: "#bfdbfe"
    });
    this.combatPulsePanelTitle.setScrollFactor(0);
    this.combatPulsePanelTitle.setDepth(1001);
    this.combatPulsePanelTitle.setShadow(0, 1, "#020617", 6, false, true);
    this.combatPulsePanelBody = this.add.text(rightPanelX + 10, 450, "", {
      fontFamily: "monospace",
      fontSize: "9px",
      color: "#dbeafe",
      lineSpacing: 3,
      wordWrap: { width: 288, useAdvancedWrap: true }
    });
    this.combatPulsePanelBody.setScrollFactor(0);
    this.combatPulsePanelBody.setDepth(1001);
    this.combatPulsePanelBody.setShadow(0, 1, "#020617", 6, false, true);
    this.combatAudioPanelBg = this.add.rectangle(16, 176, 324, 60, 0x020617, 0.88).setOrigin(0, 0);
    this.combatAudioPanelBg.setScrollFactor(0);
    this.combatAudioPanelBg.setStrokeStyle(1, 0xf59e0b, 0.9);
    this.combatAudioPanelBg.setDepth(1000);
    this.combatAudioPanelTitle = this.add.text(26, 184, "COMBAT AUDIO", {
      fontFamily: "monospace",
      fontSize: "12px",
      color: "#fde68a"
    });
    this.combatAudioPanelTitle.setScrollFactor(0);
    this.combatAudioPanelTitle.setDepth(1001);
    this.combatAudioPanelTitle.setShadow(0, 1, "#020617", 6, false, true);
    this.combatAudioPanelBody = this.add.text(26, 202, "", {
      fontFamily: "monospace",
      fontSize: "9px",
      color: "#fef3c7",
      lineSpacing: 3,
      wordWrap: { width: 288, useAdvancedWrap: true }
    });
    this.combatAudioPanelBody.setScrollFactor(0);
    this.combatAudioPanelBody.setDepth(1001);
    this.combatAudioPanelBody.setShadow(0, 1, "#020617", 6, false, true);
    this.pressurePosturePanelBg = this.add.rectangle(16, 244, 324, 60, 0x020617, 0.88).setOrigin(0, 0);
    this.pressurePosturePanelBg.setScrollFactor(0);
    this.pressurePosturePanelBg.setStrokeStyle(1, 0xf59e0b, 0.9);
    this.pressurePosturePanelBg.setDepth(1000);
    this.pressurePosturePanelTitle = this.add.text(26, 252, "PRESSURE // HOLD", {
      fontFamily: "monospace",
      fontSize: "12px",
      color: "#fde68a"
    });
    this.pressurePosturePanelTitle.setScrollFactor(0);
    this.pressurePosturePanelTitle.setDepth(1001);
    this.pressurePosturePanelTitle.setShadow(0, 1, "#020617", 6, false, true);
    this.pressurePosturePanelBody = this.add.text(26, 270, "", {
      fontFamily: "monospace",
      fontSize: "9px",
      color: "#fef3c7",
      lineSpacing: 3,
      wordWrap: { width: 288, useAdvancedWrap: true }
    });
    this.pressurePosturePanelBody.setScrollFactor(0);
    this.pressurePosturePanelBody.setDepth(1001);
    this.pressurePosturePanelBody.setShadow(0, 1, "#020617", 6, false, true);
    this.noiseDisciplinePanelBg = this.add.rectangle(16, 312, 324, 72, 0x020617, 0.88).setOrigin(0, 0);
    this.noiseDisciplinePanelBg.setScrollFactor(0);
    this.noiseDisciplinePanelBg.setStrokeStyle(1, 0x4ade80, 0.9);
    this.noiseDisciplinePanelBg.setDepth(1000);
    this.noiseDisciplinePanelTitle = this.add.text(26, 320, "QUIET LANE", {
      fontFamily: "monospace",
      fontSize: "12px",
      color: "#d1fae5"
    });
    this.noiseDisciplinePanelTitle.setScrollFactor(0);
    this.noiseDisciplinePanelTitle.setDepth(1001);
    this.noiseDisciplinePanelTitle.setShadow(0, 1, "#020617", 6, false, true);
    this.noiseDisciplinePanelBody = this.add.text(26, 338, "", {
      fontFamily: "monospace",
      fontSize: "9px",
      color: "#dcfce7",
      lineSpacing: 3,
      wordWrap: { width: 288, useAdvancedWrap: true }
    });
    this.noiseDisciplinePanelBody.setScrollFactor(0);
    this.noiseDisciplinePanelBody.setDepth(1001);
    this.noiseDisciplinePanelBody.setShadow(0, 1, "#020617", 6, false, true);
    this.extractPressurePanelBg = this.add.rectangle(16, 392, 324, 76, 0x020617, 0.88).setOrigin(0, 0);
    this.extractPressurePanelBg.setScrollFactor(0);
    this.extractPressurePanelBg.setStrokeStyle(1, 0xf59e0b, 0.9);
    this.extractPressurePanelBg.setDepth(1000);
    this.extractPressurePanelTitle = this.add.text(26, 400, "CUT CLEAN EXFIL", {
      fontFamily: "monospace",
      fontSize: "12px",
      color: "#fde68a"
    });
    this.extractPressurePanelTitle.setScrollFactor(0);
    this.extractPressurePanelTitle.setDepth(1001);
    this.extractPressurePanelTitle.setShadow(0, 1, "#020617", 6, false, true);
    this.extractPressurePanelBody = this.add.text(26, 418, "", {
      fontFamily: "monospace",
      fontSize: "9px",
      color: "#fef3c7",
      lineSpacing: 3,
      wordWrap: { width: 288, useAdvancedWrap: true }
    });
    this.extractPressurePanelBody.setScrollFactor(0);
    this.extractPressurePanelBody.setDepth(1001);
    this.extractPressurePanelBody.setShadow(0, 1, "#020617", 6, false, true);
    this.squadCommandPanelBg = this.add.rectangle(16, 476, 324, 120, 0x020617, 0.88).setOrigin(0, 0);
    this.squadCommandPanelBg.setScrollFactor(0);
    this.squadCommandPanelBg.setStrokeStyle(1, 0x38bdf8, 0.9);
    this.squadCommandPanelBg.setDepth(1000);
    this.squadCommandPanelTitle = this.add.text(26, 484, "BOYS NET", {
      fontFamily: "monospace",
      fontSize: "12px",
      color: "#bfdbfe"
    });
    this.squadCommandPanelTitle.setScrollFactor(0);
    this.squadCommandPanelTitle.setDepth(1001);
    this.squadCommandPanelTitle.setShadow(0, 1, "#020617", 6, false, true);
    this.squadCommandPanelBody = this.add.text(26, 502, "", {
      fontFamily: "monospace",
      fontSize: "9px",
      color: "#dbeafe",
      lineSpacing: 3,
      wordWrap: { width: 288, useAdvancedWrap: true }
    });
    this.squadCommandPanelBody.setScrollFactor(0);
    this.squadCommandPanelBody.setDepth(1001);
    this.squadCommandPanelBody.setShadow(0, 1, "#020617", 6, false, true);
    this.squadTrafficPanelBg = this.add.rectangle(16, 604, 324, 74, 0x020617, 0.88).setOrigin(0, 0);
    this.squadTrafficPanelBg.setScrollFactor(0);
    this.squadTrafficPanelBg.setStrokeStyle(1, 0x64748b, 0.9);
    this.squadTrafficPanelBg.setDepth(1000);
    this.squadTrafficPanelTitle = this.add.text(26, 612, "NET TRAFFIC", {
      fontFamily: "monospace",
      fontSize: "12px",
      color: "#cbd5e1"
    });
    this.squadTrafficPanelTitle.setScrollFactor(0);
    this.squadTrafficPanelTitle.setDepth(1001);
    this.squadTrafficPanelTitle.setShadow(0, 1, "#020617", 6, false, true);
    this.squadTrafficPanelBody = this.add.text(26, 630, "", {
      fontFamily: "monospace",
      fontSize: "9px",
      color: "#dbeafe",
      lineSpacing: 3,
      wordWrap: { width: 288, useAdvancedWrap: true }
    });
    this.squadTrafficPanelBody.setScrollFactor(0);
    this.squadTrafficPanelBody.setDepth(1001);
    this.squadTrafficPanelBody.setShadow(0, 1, "#020617", 6, false, true);
    this.frontlineAftermathPanelBg = this.add.rectangle(16, 686, 324, 62, 0x020617, 0.88).setOrigin(0, 0);
    this.frontlineAftermathPanelBg.setScrollFactor(0);
    this.frontlineAftermathPanelBg.setStrokeStyle(1, 0x4ade80, 0.9);
    this.frontlineAftermathPanelBg.setDepth(1000);
    this.frontlineAftermathPanelTitle = this.add.text(26, 694, "SCAR MEMORY", {
      fontFamily: "monospace",
      fontSize: "12px",
      color: "#bbf7d0"
    });
    this.frontlineAftermathPanelTitle.setScrollFactor(0);
    this.frontlineAftermathPanelTitle.setDepth(1001);
    this.frontlineAftermathPanelTitle.setShadow(0, 1, "#020617", 6, false, true);
    this.frontlineAftermathPanelBody = this.add.text(26, 712, "", {
      fontFamily: "monospace",
      fontSize: "9px",
      color: "#dcfce7",
      lineSpacing: 3,
      wordWrap: { width: 288, useAdvancedWrap: true }
    });
    this.frontlineAftermathPanelBody.setScrollFactor(0);
    this.frontlineAftermathPanelBody.setDepth(1001);
    this.frontlineAftermathPanelBody.setShadow(0, 1, "#020617", 6, false, true);

    const playerAimProfile = getPlayerAimProfile(raidController.state.player.weaponId);
    this.playerBody = this.add.sprite(0, 0, getPlayerTextureKey(raidController.state.player.weaponId));
    this.playerAim = this.add.rectangle(
      playerAimProfile.x,
      0,
      playerAimProfile.width,
      playerAimProfile.height,
      playerAimProfile.color,
      playerAimProfile.alpha
    );
    this.playerSprite = this.add.container(
      raidController.state.player.position.x,
      raidController.state.player.position.y,
      [this.playerBody, this.playerAim]
    );

      this.movementKeys = this.input.keyboard!.addKeys({
        up: RAID_MOVEMENT_KEY_CODES.up,
        down: RAID_MOVEMENT_KEY_CODES.down,
        left: RAID_MOVEMENT_KEY_CODES.left,
        right: RAID_MOVEMENT_KEY_CODES.right
      }) as Record<"up" | "down" | "left" | "right", Phaser.Input.Keyboard.Key>;
      this.altKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ALT);
      this.ctrlKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.CTRL);
      this.braceKey = this.input.keyboard!.addKey(RAID_ACTION_KEY_CODES.brace);
    this.reloadKey = this.input.keyboard!.addKey(RAID_ACTION_KEY_CODES.reload);
    this.grenadeKey = this.input.keyboard!.addKey(RAID_ACTION_KEY_CODES.grenade);
    this.interactKey = this.input.keyboard!.addKey(RAID_ACTION_KEY_CODES.interact);
    this.healKey = this.input.keyboard!.addKey(RAID_ACTION_KEY_CODES.heal);
      this.supportOrderKeys = this.input.keyboard!.addKeys({
      shiftFire: RAID_SUPPORT_ORDER_KEY_CODES.shiftFire,
      holdPosition: RAID_SUPPORT_ORDER_KEY_CODES.holdPosition,
      dropAmmoCrate: RAID_SUPPORT_ORDER_KEY_CODES.dropAmmoCrate
    }) as Record<"shiftFire" | "holdPosition" | "dropAmmoCrate", Phaser.Input.Keyboard.Key>;
    this.squadSelectionKeys = this.input.keyboard!.addKeys({
      first: RAID_SQUAD_SELECTION_KEY_CODES.first,
      second: RAID_SQUAD_SELECTION_KEY_CODES.second,
      third: RAID_SQUAD_SELECTION_KEY_CODES.third
    }) as Record<"first" | "second" | "third", Phaser.Input.Keyboard.Key>;
    this.squadCommandKeys = this.input.keyboard!.addKeys({
      follow: RAID_SQUAD_COMMAND_KEY_CODES.follow,
      defend: RAID_SQUAD_COMMAND_KEY_CODES.defend,
      attack: RAID_SQUAD_COMMAND_KEY_CODES.attack
    }) as Record<"follow" | "defend" | "attack", Phaser.Input.Keyboard.Key>;
    this.combatAudioEngine = new CombatAudioEngine(this);
  }

  public update(_time: number, delta: number): void {
    const deltaSeconds = delta / 1000;
    const pointer = this.input.activePointer;
    const pointerWorld = (pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2 | null) ?? {
      x: pointer.worldX,
      y: pointer.worldY
    };
    this.townWarLookWorld = { x: pointerWorld.x, y: pointerWorld.y };

    if (this.activeRouteId !== raidController.state.activeRouteId) {
      this.redrawArena(raidController.state.world.width, raidController.state.world.height);
    }

    raidController.setAimTarget({ x: pointerWorld.x, y: pointerWorld.y });
    raidController.setMoveInput({
      x: Number(this.movementKeys.right.isDown) - Number(this.movementKeys.left.isDown),
      y: Number(this.movementKeys.down.isDown) - Number(this.movementKeys.up.isDown)
    });
    raidController.setLiveTriggerHeld(pointer.leftButtonDown() && !this.altKey.isDown && !this.ctrlKey.isDown);
    raidController.setLiveFocusHeld(this.braceKey.isDown || (pointer.rightButtonDown() && !this.altKey.isDown && !this.ctrlKey.isDown));

    if (Phaser.Input.Keyboard.JustDown(this.reloadKey)) {
      raidController.queueReload();
    }
    if (Phaser.Input.Keyboard.JustDown(this.grenadeKey) && !this.altKey.isDown) {
        raidController.queueGrenade();
      }
    if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      raidController.queueInteract();
    }
    if (Phaser.Input.Keyboard.JustDown(this.healKey)) {
      raidController.queueHeal();
    }
    if (Phaser.Input.Keyboard.JustDown(this.squadSelectionKeys.first)) {
      raidController.selectSquadMateByIndex(0);
    }
    if (Phaser.Input.Keyboard.JustDown(this.squadSelectionKeys.second)) {
      raidController.selectSquadMateByIndex(1);
    }
    if (Phaser.Input.Keyboard.JustDown(this.squadSelectionKeys.third)) {
      raidController.selectSquadMateByIndex(2);
    }

    if (Phaser.Input.Keyboard.JustDown(this.squadCommandKeys.follow)) {
      raidController.queueSelectedSquadCommand("follow");
    }
    if (Phaser.Input.Keyboard.JustDown(this.squadCommandKeys.defend)) {
      raidController.queueSelectedSquadCommand("defend", { x: pointerWorld.x, y: pointerWorld.y });
    }
    if (Phaser.Input.Keyboard.JustDown(this.squadCommandKeys.attack) && !this.altKey.isDown) {
      raidController.queueSelectedSquadCommand("attack");
    }

    if (Phaser.Input.Keyboard.JustDown(this.supportOrderKeys.shiftFire)) {
      raidController.queueFrontlineSupportOrder("shift-fire");
    }
    if (Phaser.Input.Keyboard.JustDown(this.supportOrderKeys.holdPosition)) {
      raidController.queueFrontlineSupportOrder("hold-position");
    }
    if (Phaser.Input.Keyboard.JustDown(this.supportOrderKeys.dropAmmoCrate)) {
      raidController.queueFrontlineSupportOrder("drop-ammo-crate");
    }

    raidController.update(deltaSeconds);
    this.syncCamera(pointerWorld);
    this.syncObstacleReveal();
    this.syncSprites();
    this.syncWorldSpeechBubbles(deltaSeconds);
    this.syncTelemetryPanel();
    this.syncNoiseDisciplinePanel();
    this.syncPressurePosturePanel();
    this.syncFrontlineOperationPanel();
    this.syncCombatPulsePanel();
    this.combatAudioEngine.update(raidController.state);
    this.syncCombatAudioPanel();
    this.syncExtractPressurePanel();
    this.syncSquadCommandPanel();
    this.syncSquadTrafficPanel();
    this.syncHostileTrafficPanel();
    this.syncFrontlineAftermathPanel();
    this.syncAimReticle(pointer.x, pointer.y);
  }

  private syncCamera(pointerWorld: { x: number; y: number }): void {
    const { phase, player, world } = raidController.state;
    const camera = this.cameras.main;

    if (phase !== "raid") {
      const relaxedZoom = Phaser.Math.Linear(camera.zoom, DEFAULT_RAID_CAMERA_ZOOM, CAMERA_ZOOM_LERP);
      camera.setZoom(relaxedZoom);
      camera.centerOn(player.position.x, player.position.y);
      return;
    }

    let desiredCenterX = player.position.x;
    let desiredCenterY = player.position.y;
    let desiredZoom = DEFAULT_RAID_CAMERA_ZOOM;

    if (player.focusActive) {
      const aimVector = new Phaser.Math.Vector2(pointerWorld.x - player.position.x, pointerWorld.y - player.position.y);
      const aimDistance = aimVector.length();

      if (aimDistance > 0.001) {
        const offsetDistance = Phaser.Math.Clamp(
          aimDistance * BRACE_SCAN_CAMERA_OFFSET_RATIO,
          BRACE_SCAN_CAMERA_OFFSET_MIN,
          BRACE_SCAN_CAMERA_OFFSET_MAX
        );
        aimVector.normalize().scale(offsetDistance);
        desiredCenterX += aimVector.x;
        desiredCenterY += aimVector.y;
      }

      desiredZoom = BRACE_SCAN_CAMERA_ZOOM;
    }

    const halfWidth = camera.width / (2 * desiredZoom);
    const halfHeight = camera.height / (2 * desiredZoom);
    desiredCenterX = Phaser.Math.Clamp(desiredCenterX, halfWidth, Math.max(halfWidth, world.width - halfWidth));
    desiredCenterY = Phaser.Math.Clamp(desiredCenterY, halfHeight, Math.max(halfHeight, world.height - halfHeight));

    const smoothedCenterX = Phaser.Math.Linear(camera.midPoint.x, desiredCenterX, CAMERA_CENTER_LERP);
    const smoothedCenterY = Phaser.Math.Linear(camera.midPoint.y, desiredCenterY, CAMERA_CENTER_LERP);
    const smoothedZoom = Phaser.Math.Linear(camera.zoom, desiredZoom, CAMERA_ZOOM_LERP);

    camera.setZoom(smoothedZoom);
    camera.centerOn(smoothedCenterX, smoothedCenterY);
  }

  private syncObstacleReveal(): void {
    const playerPosition = raidController.state.player.position;

    for (const visual of this.revealableObstacleVisuals) {
      const targetAlpha = this.getObstacleRevealAlpha(visual.obstacle, playerPosition);
      visual.currentAlpha = Phaser.Math.Linear(visual.currentAlpha, targetAlpha, 0.22);

      for (const target of visual.targets) {
        target.gameObject.setAlpha(target.baseAlpha * visual.currentAlpha);
      }
    }
  }

  private getObstacleRevealAlpha(obstacle: ArenaObstacle, playerPosition: { x: number; y: number }): number {
    if (pointInsideObstacle(playerPosition, obstacle)) {
      return 0.22;
    }

    const doorwayApproach = (obstacle.doorways ?? []).some((doorway) => {
      const guideRect = getObstacleDoorGuideRect(obstacle, doorway);
      const padding = 34;
      return (
        playerPosition.x >= guideRect.x - padding &&
        playerPosition.x <= guideRect.x + guideRect.width + padding &&
        playerPosition.y >= guideRect.y - padding &&
        playerPosition.y <= guideRect.y + guideRect.height + padding
      );
    });

    if (doorwayApproach) {
      return 0.52;
    }

    const nearestPoint = {
      x: Phaser.Math.Clamp(playerPosition.x, obstacle.x, obstacle.x + obstacle.width),
      y: Phaser.Math.Clamp(playerPosition.y, obstacle.y, obstacle.y + obstacle.height)
    };
    const edgeDistance = Phaser.Math.Distance.Between(playerPosition.x, playerPosition.y, nearestPoint.x, nearestPoint.y);

    if (edgeDistance <= 84) {
      return 0.76;
    }

    return 1;
  }

  private syncWorldSpeechBubbles(deltaSeconds: number): void {
    this.maybeSpawnWorldSpeechBubble();

    this.worldSpeechBubbles = this.worldSpeechBubbles.filter((bubble) => {
      bubble.lifetime = Math.max(0, bubble.lifetime - deltaSeconds);
      bubble.driftY += deltaSeconds * 4.6;

      const anchorPosition = this.resolveSpeechBubbleAnchorPosition(bubble);
      const lifeRatio = bubble.maxLifetime > 0 ? bubble.lifetime / bubble.maxLifetime : 0;
      const fadeAlpha = lifeRatio <= 0.5 ? lifeRatio / 0.5 : 1;
      const visible = anchorPosition !== null && fadeAlpha > 0.02 && this.isPointNearCamera(anchorPosition, 190);

      bubble.container.setVisible(visible);
      if (!visible || anchorPosition === null) {
        if (bubble.lifetime <= 0) {
          bubble.container.destroy(true);
          return false;
        }
        return true;
      }

      bubble.container.setPosition(anchorPosition.x, anchorPosition.y - 34 - bubble.driftY);
      bubble.container.setAlpha(Phaser.Math.Clamp(fadeAlpha, 0, 1));
      bubble.container.setDepth(anchorPosition.y * 0.001 + 0.35);

      if (bubble.lifetime <= 0) {
        bubble.container.destroy(true);
        return false;
      }

      return true;
    });
  }

  private maybeSpawnWorldSpeechBubble(): void {
    const latestSquadLogEntry = raidController.state.squadLog[0];
    const squadSpeechKey = latestSquadLogEntry
      ? `squad:${latestSquadLogEntry.id}`
      : `${raidController.state.squadComms.speaker}|${raidController.state.squadComms.channel}|${raidController.state.squadComms.line}`;
    if (
      raidController.state.squadComms.line.trim().length > 0 &&
      this.lastSquadSpeechKey !== squadSpeechKey
    ) {
      const anchorId = this.resolveSquadSpeechAnchorId(raidController.state.squadComms.speaker);
      if (anchorId !== null) {
      this.spawnWorldSpeechBubble("squad", anchorId, squadSpeechKey, raidController.state.squadComms.line, 6.8);
      }
      this.lastSquadSpeechKey = squadSpeechKey;
    }

    const latestHostileLogEntry = raidController.state.hostileLog[0];
    const hostileSpeechKey = latestHostileLogEntry
      ? `hostile:${latestHostileLogEntry.id}`
      : `${raidController.state.hostileComms.tapeId ?? "none"}|${raidController.state.hostileComms.speaker}|${raidController.state.hostileComms.channel}|${raidController.state.hostileComms.line}`;
    if (
      raidController.state.hostileComms.line.trim().length > 0 &&
      this.lastHostileSpeechKey !== hostileSpeechKey
    ) {
      const anchorId = this.resolveHostileSpeechAnchorId();
      if (anchorId !== null) {
      this.spawnWorldSpeechBubble("hostile", anchorId, hostileSpeechKey, raidController.state.hostileComms.line, 7.2);
      }
      this.lastHostileSpeechKey = hostileSpeechKey;
    }
  }

  private resolveSquadSpeechAnchorId(speaker: string): number | null {
    const combatant = raidController.state.friendlyCombatants.find(
      (entry) => entry.ownerKind === "squadmate" && entry.name === speaker
    );
    return combatant?.id ?? null;
  }

  private resolveHostileSpeechAnchorId(): number | null {
    const tapeId = raidController.state.hostileComms.tapeId;
    if (!tapeId) {
      return null;
    }

    const visibleEnemies = raidController.state.enemies.filter(
      (enemy) => enemy.tapeId === tapeId && this.isPointNearCamera(enemy.position, 220)
    );
    const sourcePool = visibleEnemies.length > 0 ? visibleEnemies : raidController.state.enemies.filter((enemy) => enemy.tapeId === tapeId);
    if (sourcePool.length === 0) {
      return null;
    }

    const playerPosition = raidController.state.player.position;
    const chosenEnemy = [...sourcePool].sort(
      (left, right) =>
        Phaser.Math.Distance.Between(left.position.x, left.position.y, playerPosition.x, playerPosition.y) -
        Phaser.Math.Distance.Between(right.position.x, right.position.y, playerPosition.x, playerPosition.y)
    )[0];
    return chosenEnemy?.id ?? null;
  }

  private spawnWorldSpeechBubble(
    anchorKind: "squad" | "hostile",
    anchorId: string | number,
    lineKey: string,
    line: string,
    lifetime: number
  ): void {
    this.worldSpeechBubbles = this.worldSpeechBubbles.filter((bubble) => {
      const duplicate = bubble.anchorKind === anchorKind && bubble.anchorId === anchorId;
      if (duplicate) {
        bubble.container.destroy(true);
      }
      return !duplicate;
    });

    const bubbleLine = this.getSpeechBubbleLine(line);
    const text = this.add.text(0, 0, bubbleLine, {
      fontFamily: "monospace",
      fontSize: "11px",
      color: anchorKind === "squad" ? "#f8fafc" : "#eff6ff",
      align: "center",
      wordWrap: { width: 124, useAdvancedWrap: true }
    });
    text.setOrigin(0.5, 0.5);
    text.setPadding(6, 4, 6, 5);

    const bounds = text.getBounds();
    const width = Math.max(72, bounds.width + 8);
    const height = Math.max(28, bounds.height + 6);
    const bg = this.add.graphics();
    const fillColor = anchorKind === "squad" ? 0x0f172a : 0x172554;
    const strokeColor = anchorKind === "squad" ? 0x7dd3fc : 0x93c5fd;
    bg.fillStyle(fillColor, 0.94);
    bg.lineStyle(1.4, strokeColor, 0.92);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 8);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 8);
    bg.fillTriangle(-7, height / 2 - 2, 7, height / 2 - 2, 0, height / 2 + 10);

    const container = this.add.container(0, 0, [bg, text]);
    container.setDepth(999);

    this.worldSpeechBubbles.push({
      container,
      bg,
      text,
      anchorKind,
      anchorId,
      lineKey,
      lifetime,
      maxLifetime: lifetime,
      driftY: 0
    });
  }

  private getSpeechBubbleLine(line: string): string {
    const normalized = line.replace(/\s+/g, " ").trim();
    if (normalized.length <= 48) {
      return normalized;
    }

    const firstSentence = normalized.split(/[.!?]/)[0]?.trim() ?? normalized;
    if (firstSentence.length >= 14 && firstSentence.length <= 48) {
      return firstSentence;
    }

    const commaTrimmed = normalized.split(",")[0]?.trim() ?? normalized;
    if (commaTrimmed.length >= 14 && commaTrimmed.length <= 48) {
      return commaTrimmed;
    }

    const shortened = normalized.slice(0, 45).trimEnd();
    const lastSpace = shortened.lastIndexOf(" ");
    return `${(lastSpace >= 24 ? shortened.slice(0, lastSpace) : shortened).trimEnd()}...`;
  }

  private resolveSpeechBubbleAnchorPosition(bubble: WorldSpeechBubbleVisual): { x: number; y: number } | null {
    if (bubble.anchorKind === "squad") {
      const sprite = this.friendlyCombatantSprites.get(Number(bubble.anchorId));
      if (!sprite || !sprite.visible) {
        return null;
      }
      return { x: sprite.x, y: sprite.y };
    }

    const sprite = this.enemySprites.get(Number(bubble.anchorId));
    if (!sprite || !sprite.visible) {
      return null;
    }
    return { x: sprite.x, y: sprite.y };
  }

  private createTextures(): void {
    ensureRaidTextures(this);

    if (!this.textures.exists("bullet")) {
      const bulletGraphics = this.make.graphics({ x: 0, y: 0 });
      bulletGraphics.fillStyle(0xf8fafc);
      bulletGraphics.fillCircle(4, 4, 4);
      bulletGraphics.generateTexture("bullet", 8, 8);
      bulletGraphics.destroy();
    }

    if (!this.textures.exists("frontline-tracer")) {
      const tracerGraphics = this.make.graphics({ x: 0, y: 0 });
      tracerGraphics.fillStyle(0xffffff, 1);
      tracerGraphics.fillRoundedRect(1, 5, 18, 4, 2);
      tracerGraphics.fillCircle(18, 7, 2);
      tracerGraphics.fillStyle(0xffffff, 0.68);
      tracerGraphics.fillRoundedRect(0, 4, 20, 6, 3);
      tracerGraphics.generateTexture("frontline-tracer", 20, 14);
      tracerGraphics.destroy();
    }

    if (!this.textures.exists("frontline-fireteam")) {
      const graphics = this.make.graphics({ x: 0, y: 0 });
      graphics.fillStyle(0xffffff, 1);
      graphics.fillCircle(10, 10, 6);
      graphics.lineStyle(2, 0xffffff, 0.95);
      graphics.strokeCircle(10, 10, 9);
      graphics.generateTexture("frontline-fireteam", 20, 20);
      graphics.destroy();
    }

    if (!this.textures.exists("frontline-convoy")) {
      const graphics = this.make.graphics({ x: 0, y: 0 });
      graphics.fillStyle(0xffffff, 1);
      graphics.fillRoundedRect(3, 6, 18, 10, 3);
      graphics.fillRect(16, 8, 6, 6);
      graphics.generateTexture("frontline-convoy", 24, 22);
      graphics.destroy();
    }

    if (!this.textures.exists("frontline-recovery")) {
      const graphics = this.make.graphics({ x: 0, y: 0 });
      graphics.fillStyle(0xffffff, 1);
      graphics.fillPoint(10, 2, 2);
      graphics.fillPoint(18, 10, 2);
      graphics.fillPoint(10, 18, 2);
      graphics.fillPoint(2, 10, 2);
      graphics.fillRect(8, 4, 4, 12);
      graphics.fillRect(4, 8, 12, 4);
      graphics.generateTexture("frontline-recovery", 20, 20);
      graphics.destroy();
    }
  }

  private redrawArena(width: number, height: number): void {
    this.arenaLayer?.destroy(true);
    const route = raidController.getActiveRoute();
    this.activeRouteId = route.id;
    this.revealableObstacleVisuals = [];
    this.drawArena(width, height, route);
  }

  private drawArena(width: number, height: number, route: RaidRouteDefinition): void {
    const graphics = this.add.graphics();
    const layerChildren: Phaser.GameObjects.GameObject[] = [graphics];

    graphics.fillStyle(route.sceneTheme.baseColor);
    graphics.fillRect(0, 0, width, height);

    this.drawRouteBackdrop(graphics, width, height, route);
    this.drawCombatPockets(graphics, route, layerChildren);
    this.drawRouteDressings(route, layerChildren);

    graphics.lineStyle(1, route.sceneTheme.gridColor, 0.7);
    for (let x = 0; x <= width; x += 80) {
      graphics.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y <= height; y += 80) {
      graphics.lineBetween(0, y, width, y);
    }

    for (const obstacle of ARENA_OBSTACLES) {
      this.addStaticObstacle(layerChildren, obstacle, route);
    }

    for (const prop of route.scenicProps) {
      this.addScenicProp(layerChildren, prop, route);
    }

    this.drawTownWarStaticArt(layerChildren, route);

    this.arenaLayer = this.add.container(0, 0, layerChildren);
    this.arenaLayer.setDepth(-20);
  }

  private drawRouteBackdrop(graphics: Phaser.GameObjects.Graphics, width: number, height: number, route: RaidRouteDefinition): void {
    graphics.fillStyle(route.sceneTheme.laneColor, route.sceneTheme.laneAlpha);

    if (route.id === "crosswind-docks") {
      graphics.fillRect(0, height * 0.42, width, height * 0.18);
      graphics.fillRect(width * 0.82, 0, width * 0.1, height);
      graphics.lineStyle(4, route.sceneTheme.accentColor, 0.22);
      for (let y = height * 0.08; y < height; y += 150) {
        graphics.lineBetween(width * 0.84, y, width * 0.91, y);
      }
    } else if (route.id === "broken-signal") {
      graphics.fillRect(width * 0.36, 0, width * 0.11, height);
      graphics.fillRect(0, height * 0.28, width, height * 0.09);
      graphics.lineStyle(2, route.sceneTheme.accentColor, 0.18);
      for (let x = width * 0.08; x < width; x += 230) {
        graphics.lineBetween(x, height * 0.325, x + 88, height * 0.325);
      }
    } else {
      graphics.fillRect(0, height * 0.73, width, height * 0.16);
      graphics.fillRect(width * 0.55, 0, width * 0.09, height);
      graphics.lineStyle(4, route.sceneTheme.accentColor, 0.22);
      for (let x = width * 0.06; x < width; x += 210) {
        graphics.lineBetween(x, height * 0.79, x + 90, height * 0.79);
      }
    }
  }

  private addFrontlineRouteObstacle(
    layerChildren: Phaser.GameObjects.GameObject[],
    obstacle: ArenaObstacle,
    route: RaidRouteDefinition
  ): void {
    const revealTargets: ObstacleRevealTarget[] = [];
    const centerX = obstacle.x + obstacle.width / 2;
    const centerY = obstacle.y + obstacle.height / 2;
    const severe = obstacle.label?.includes("blockade") ?? false;
    const shadow = this.add.ellipse(
      centerX + 12,
      centerY + 10,
      obstacle.width + 30,
      obstacle.height + 20,
      route.sceneTheme.shadowColor,
      0.26
    );
    layerChildren.push(shadow);
    this.trackObstacleRevealTarget(revealTargets, shadow, 1);

    const frame = this.add.rectangle(
      centerX,
      centerY,
      obstacle.width,
      obstacle.height,
      severe ? 0x4c1d12 : 0x3f3f46,
      severe ? 0.88 : 0.8
    );
    frame.setStrokeStyle(3, severe ? 0xfb923c : route.sceneTheme.accentColor, 0.44);
    layerChildren.push(frame);
    this.trackObstacleRevealTarget(revealTargets, frame, 1);

    const hardEdge = this.add.rectangle(
      centerX,
      centerY - obstacle.height * 0.18,
      Math.max(44, obstacle.width - 20),
      Math.max(10, obstacle.height * 0.24),
      severe ? 0xf59e0b : 0xeab308,
      0.2
    );
    layerChildren.push(hardEdge);
    this.trackObstacleRevealTarget(revealTargets, hardEdge, 1);

    const stripeCount =
      obstacle.width > obstacle.height
        ? Math.max(3, Math.floor(obstacle.width / 46))
        : Math.max(3, Math.floor(obstacle.height / 46));

    for (let index = 0; index < stripeCount; index += 1) {
      const stripe =
        obstacle.width > obstacle.height
          ? this.add.rectangle(
              obstacle.x + 18 + index * ((obstacle.width - 36) / Math.max(1, stripeCount - 1)),
              centerY,
              10,
              Math.max(18, obstacle.height - 12),
              route.sceneTheme.accentColor,
              0.14
            )
          : this.add.rectangle(
              centerX,
              obstacle.y + 18 + index * ((obstacle.height - 36) / Math.max(1, stripeCount - 1)),
              Math.max(18, obstacle.width - 12),
              10,
              route.sceneTheme.accentColor,
              0.14
            );
      layerChildren.push(stripe);
      this.trackObstacleRevealTarget(revealTargets, stripe, 1);
    }

    for (const doorway of obstacle.doorways ?? []) {
      const breachRect = getObstacleDoorRect(obstacle, doorway);
      const breach = this.add.rectangle(
        breachRect.x + breachRect.width / 2,
        breachRect.y + breachRect.height / 2,
        breachRect.width,
        breachRect.height,
        0x86efac,
        0.2
      );
      breach.setStrokeStyle(2, 0xdcfce7, 0.5);
      layerChildren.push(breach);
      this.trackObstacleRevealTarget(revealTargets, breach, 1);

      const breachLane = this.addGroundDecal(layerChildren, {
        kind: "extract-lane",
        position: {
          x: breachRect.x + breachRect.width / 2,
          y: breachRect.y + breachRect.height / 2
        },
        rotation: obstacle.width > obstacle.height ? 0 : Math.PI / 2,
        scaleX: Math.max(0.58, breachRect.width / 86),
        scaleY: Math.max(0.44, breachRect.height / 84),
        alpha: 0.26,
        tint: 0x86efac,
        depthOffset: -0.06
      }) as Phaser.GameObjects.Sprite;
      this.trackObstacleRevealTarget(revealTargets, breachLane, breachLane.alpha);
    }

    for (const decal of getFrontlineRoomObstacleDecals(obstacle, route)) {
      this.addGroundDecal(layerChildren, decal);
    }

    for (const prop of getFrontlineRoomObstacleDressings(obstacle, route)) {
      this.addScenicProp(layerChildren, prop, route);
    }

    const roomIdentity = getFrontlineRoomObstacleIdentity(obstacle, route);
    if (roomIdentity) {
      const roomStamp = this.add.text(centerX, obstacle.y + 14, roomIdentity.roomLabel.toUpperCase(), {
        fontFamily: "monospace",
        fontSize: "12px",
        color: Phaser.Display.Color.IntegerToColor(roomIdentity.tint).rgba,
        align: "center"
      });
      roomStamp.setOrigin(0.5, 0);
      roomStamp.setAlpha(0.84);
      roomStamp.setDepth(-18);
      roomStamp.setShadow(0, 1, "#020617", 6, false, true);
      layerChildren.push(roomStamp);
      this.trackObstacleRevealTarget(revealTargets, roomStamp, roomStamp.alpha);

      const cacheStamp = this.add.text(centerX, obstacle.y + obstacle.height - 18, roomIdentity.cacheLabel.toUpperCase(), {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#e2e8f0",
        align: "center"
      });
      cacheStamp.setOrigin(0.5, 1);
      cacheStamp.setAlpha(0.66);
      cacheStamp.setDepth(-18);
      cacheStamp.setShadow(0, 1, "#020617", 6, false, true);
      layerChildren.push(cacheStamp);
      this.trackObstacleRevealTarget(revealTargets, cacheStamp, cacheStamp.alpha);
    }

    this.registerRevealableObstacle(obstacle, revealTargets);
  }

  private addStaticObstacle(
    layerChildren: Phaser.GameObjects.GameObject[],
    obstacle: ArenaObstacle,
    route: RaidRouteDefinition
  ): void {
    const revealTargets: ObstacleRevealTarget[] = [];
    const obstacleGraphics = this.add.graphics();
    obstacleGraphics.fillStyle(route.sceneTheme.shadowColor, 0.36);
    obstacleGraphics.fillRoundedRect(obstacle.x + 10, obstacle.y + 14, obstacle.width, obstacle.height, 24);
    obstacleGraphics.fillStyle(0x111827);
    obstacleGraphics.fillRoundedRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height, 20);
    obstacleGraphics.lineStyle(2, route.sceneTheme.accentColor, 0.34);
    obstacleGraphics.strokeRoundedRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height, 20);
    layerChildren.push(obstacleGraphics);
    this.trackObstacleRevealTarget(revealTargets, obstacleGraphics, 1);

    for (const doorway of obstacle.doorways ?? []) {
      const rect = getObstacleDoorRect(obstacle, doorway);
      const guideRect = getObstacleDoorGuideRect(obstacle, doorway);
      const guide = this.add.rectangle(
        guideRect.x + guideRect.width / 2,
        guideRect.y + guideRect.height / 2,
        guideRect.width,
        guideRect.height,
        route.sceneTheme.accentColor,
        0.07
      );
      guide.setStrokeStyle(1, 0xf8fafc, 0.12);
      layerChildren.push(guide);
      this.trackObstacleRevealTarget(revealTargets, guide, 1);

      obstacleGraphics.fillStyle(route.sceneTheme.baseColor, 0.96);
      obstacleGraphics.fillRoundedRect(rect.x, rect.y, rect.width, rect.height, 10);
      obstacleGraphics.lineStyle(2, route.sceneTheme.accentColor, 0.42);
      obstacleGraphics.strokeRoundedRect(rect.x, rect.y, rect.width, rect.height, 10);

      const threshold = this.add.rectangle(
        rect.x + rect.width / 2,
        rect.y + rect.height / 2,
        Math.max(18, rect.width - 16),
        Math.max(18, rect.height - 16),
        0xf8fafc,
        0.1
      );
      threshold.setStrokeStyle(1, route.sceneTheme.accentColor, 0.24);
      layerChildren.push(threshold);
      this.trackObstacleRevealTarget(revealTargets, threshold, 1);
    }

    const inset = this.add.rectangle(
      obstacle.x + obstacle.width / 2,
      obstacle.y + obstacle.height / 2,
      Math.max(20, obstacle.width - 24),
      Math.max(20, obstacle.height - 24),
      0x1e293b,
      0.34
    );
    inset.setStrokeStyle(1, route.sceneTheme.gridColor, 0.45);
    layerChildren.push(inset);
    this.trackObstacleRevealTarget(revealTargets, inset, 1);

    obstacleGraphics.lineStyle(1, route.sceneTheme.gridColor, 0.24);
    const coverStep = Math.max(26, Math.floor(obstacle.width / 4));
    for (let offset = 18; offset < obstacle.width - 10; offset += coverStep) {
      obstacleGraphics.lineBetween(
        obstacle.x + offset,
        obstacle.y + 10,
        obstacle.x + Math.min(obstacle.width - 14, offset + 18),
        obstacle.y + 10
      );
      obstacleGraphics.lineBetween(
        obstacle.x + offset,
        obstacle.y + obstacle.height - 10,
        obstacle.x + Math.min(obstacle.width - 14, offset + 18),
        obstacle.y + obstacle.height - 10
      );
    }

    if (obstacle.label) {
      const label = this.add
        .text(obstacle.x + obstacle.width / 2, obstacle.y - 16, obstacle.label, {
          fontFamily: "monospace",
          fontSize: "16px",
          color: Phaser.Display.Color.IntegerToColor(route.sceneTheme.accentColor).rgba
        })
        .setOrigin(0.5, 0);
      layerChildren.push(label);
      this.trackObstacleRevealTarget(revealTargets, label, label.alpha);
    }

    this.registerRevealableObstacle(obstacle, revealTargets);
  }

  private trackObstacleRevealTarget(
    targets: ObstacleRevealTarget[],
    gameObject: AlphaCapableGameObject,
    baseAlpha: number
  ): void {
    targets.push({ gameObject, baseAlpha });
  }

  private registerRevealableObstacle(obstacle: ArenaObstacle, targets: ObstacleRevealTarget[]): void {
    if ((obstacle.doorways?.length ?? 0) === 0 || targets.length === 0) {
      return;
    }

    this.revealableObstacleVisuals.push({
      obstacle,
      targets,
      currentAlpha: 1
    });
  }

  private drawRouteDressings(route: RaidRouteDefinition, layerChildren: Phaser.GameObjects.GameObject[]): void {
    const accentColor = Phaser.Display.Color.IntegerToColor(route.sceneTheme.accentColor);
    const activeSector = raidController.state.frontlineSectors.find((sector) => sector.routeId === route.id) ?? null;
    const raidObstacles = raidController.state.obstacles;
    const staticObstacles = raidObstacles.filter((obstacle) => !isFrontlineRouteObstacle(obstacle));
    const frontlineObstacles = raidObstacles.filter((obstacle) => isFrontlineRouteObstacle(obstacle));

    for (const decal of getRouteSurfaceDecals(route)) {
      this.addGroundDecal(layerChildren, decal);
    }

    for (const decal of getFrontlineModifierDecals(route, activeSector)) {
      this.addGroundDecal(layerChildren, decal);
    }

    for (const decal of getObjectiveSurfaceDecals(route)) {
      this.addGroundDecal(layerChildren, decal);
    }

    for (const overlay of getAmbientOverlays(route)) {
      this.addAmbientOverlay(layerChildren, overlay);
    }

    for (const prop of getFrontlineModifierProps(route, activeSector)) {
      this.addScenicProp(layerChildren, prop, route);
    }

    for (const obstacle of frontlineObstacles) {
      this.addFrontlineRouteObstacle(layerChildren, obstacle, route);
    }

    for (const obstacle of staticObstacles) {
      const revealTargets = this.revealableObstacleVisuals.find((entry) => entry.obstacle.id === obstacle.id)?.targets ?? [];

      for (const decal of getObstacleSurfaceDecals(obstacle, route)) {
        const roofDecal = this.addGroundDecal(layerChildren, decal) as Phaser.GameObjects.Sprite;
        this.trackObstacleRevealTarget(revealTargets, roofDecal, roofDecal.alpha);
      }

      const sceneFrame = this.add.rectangle(
        obstacle.x + obstacle.width / 2,
        obstacle.y + obstacle.height / 2,
        Math.max(30, obstacle.width - 42),
        Math.max(24, obstacle.height - 42),
        route.sceneTheme.shadowColor,
        0.22
      );
      sceneFrame.setStrokeStyle(1, route.sceneTheme.gridColor, 0.32);
      sceneFrame.setRotation((obstacle.id % 2 === 0 ? -1 : 1) * 0.015);
      layerChildren.push(sceneFrame);
      this.trackObstacleRevealTarget(revealTargets, sceneFrame, 1);

      const hardCover = this.add.rectangle(
        obstacle.x + 28,
        obstacle.y + obstacle.height / 2,
        10,
        Math.max(24, obstacle.height - 56),
        route.sceneTheme.accentColor,
        0.18
      );
      hardCover.setRotation(-0.08);
      layerChildren.push(hardCover);
      this.trackObstacleRevealTarget(revealTargets, hardCover, 1);

      const hardCoverMirror = this.add.rectangle(
        obstacle.x + obstacle.width - 28,
        obstacle.y + obstacle.height / 2,
        10,
        Math.max(24, obstacle.height - 56),
        route.sceneTheme.accentColor,
        0.12
      );
      hardCoverMirror.setRotation(0.08);
      layerChildren.push(hardCoverMirror);
      this.trackObstacleRevealTarget(revealTargets, hardCoverMirror, 1);

      const roomSurface = this.addGroundDecal(layerChildren, {
        kind: obstacle.id % 3 === 0 ? "grate" : "tarp",
        position: {
          x: obstacle.x + obstacle.width / 2,
          y: obstacle.y + obstacle.height / 2
        },
        rotation: (obstacle.id % 2 === 0 ? -1 : 1) * 0.02,
        scaleX: Math.max(0.84, (obstacle.width - 56) / 88),
        scaleY: Math.max(0.72, (obstacle.height - 62) / 64),
        alpha: 0.15,
        tint: route.id === "sundered-run" ? 0x7c2d12 : 0x475569,
        depthOffset: -0.08
      }) as Phaser.GameObjects.Sprite;
      this.trackObstacleRevealTarget(revealTargets, roomSurface, roomSurface.alpha);

      const roofStrip = this.add.rectangle(
        obstacle.x + obstacle.width / 2,
        obstacle.y + 22,
        Math.max(80, obstacle.width - 46),
        8,
        route.sceneTheme.accentColor,
        0.16
      );
      roofStrip.setRotation(obstacle.id % 2 === 0 ? -0.02 : 0.02);
      layerChildren.push(roofStrip);
      this.trackObstacleRevealTarget(revealTargets, roofStrip, 1);

      const interiorGlow = this.add.ellipse(
        obstacle.x + obstacle.width / 2,
        obstacle.y + obstacle.height / 2,
        Math.max(40, obstacle.width - 110),
        Math.max(34, obstacle.height - 90),
        route.sceneTheme.laneColor,
        0.08
      );
      interiorGlow.setRotation(obstacle.id % 2 === 0 ? -0.08 : 0.08);
      layerChildren.push(interiorGlow);
      this.trackObstacleRevealTarget(revealTargets, interiorGlow, 1);

      for (const doorway of obstacle.doorways ?? []) {
        const guideRect = getObstacleDoorGuideRect(obstacle, doorway);
        const guide = this.add.rectangle(
          guideRect.x + guideRect.width / 2,
          guideRect.y + guideRect.height / 2,
          guideRect.width,
          guideRect.height,
          route.sceneTheme.accentColor,
          0.05
        );
        guide.setStrokeStyle(1.5, 0xf8fafc, 0.18);
        layerChildren.push(guide);
        this.trackObstacleRevealTarget(revealTargets, guide, 1);

        for (const decal of getDoorwayFlowDecals(obstacle, doorway, route.sceneTheme.accentColor)) {
          const flowDecal = this.addGroundDecal(layerChildren, decal) as Phaser.GameObjects.Sprite;
          this.trackObstacleRevealTarget(revealTargets, flowDecal, flowDecal.alpha);
        }

        if ((obstacle.label ?? "").includes("room hold") || (obstacle.label ?? "").includes("captured room")) {
          for (const side of ["left", "right"] as const) {
            const coverPoint = getObstacleInteriorCoverPoint(obstacle, doorway, side);
            const anchor = this.add.circle(coverPoint.x, coverPoint.y, 9, 0x86efac, 0.22);
            anchor.setStrokeStyle(2, 0xdcfce7, 0.5);
            layerChildren.push(anchor);
            this.trackObstacleRevealTarget(revealTargets, anchor, 1);

            const brace = this.add.rectangle(
              coverPoint.x,
              coverPoint.y,
              side === "left" || side === "right" ? 18 : 12,
              side === "left" || side === "right" ? 12 : 18,
              route.sceneTheme.accentColor,
              0.12
            );
            brace.setRotation(doorway.side === "top" || doorway.side === "bottom" ? Math.PI / 2 : 0);
            layerChildren.push(brace);
            this.trackObstacleRevealTarget(revealTargets, brace, 1);
          }
        }
      }

      for (const prop of getObstacleSetDressings(obstacle, route)) {
        this.addScenicProp(layerChildren, prop, route);
      }
    }

    for (const [index, pocket] of route.combatPockets.entries()) {
      const pocketAngle = getPocketAngle(route.id, index);
      const matte = this.add.ellipse(
        pocket.position.x,
        pocket.position.y,
        pocket.radius * 1.55,
        pocket.radius * 1.22,
        route.sceneTheme.shadowColor,
        0.22
      );
      matte.setRotation(pocketAngle);
      layerChildren.push(matte);

      const ring = this.add.ellipse(
        pocket.position.x,
        pocket.position.y,
        pocket.radius * 1.18,
        pocket.radius * 0.84,
        route.sceneTheme.pocketColor,
        0.05
      );
      ring.setStrokeStyle(2, route.sceneTheme.pocketColor, 0.16);
      ring.setRotation(pocketAngle + 0.04);
      layerChildren.push(ring);

      const flare = this.add.rectangle(
        pocket.position.x + pocket.radius * 0.22,
        pocket.position.y - pocket.radius * 0.2,
        pocket.radius * 0.72,
        16,
        route.sceneTheme.accentColor,
        0.15
      );
      flare.setRotation(pocketAngle + 0.06);
      layerChildren.push(flare);

      const sightLineA = this.add.rectangle(
        pocket.position.x,
        pocket.position.y + pocket.radius + 8,
        pocket.radius * 0.34,
        4,
        route.sceneTheme.pocketColor,
        0.16
      );
      sightLineA.setRotation(0.72);
      layerChildren.push(sightLineA);

      const sightLineB = this.add.rectangle(
        pocket.position.x,
        pocket.position.y + pocket.radius + 8,
        pocket.radius * 0.34,
        4,
        route.sceneTheme.pocketColor,
        0.16
      );
      sightLineB.setRotation(-0.72);
      layerChildren.push(sightLineB);

      for (const decal of getPocketDecals(route, pocket, index)) {
        this.addGroundDecal(layerChildren, decal);
      }

      for (const prop of getEncounterProps(route, pocket, index)) {
        this.addScenicProp(layerChildren, prop, route);
      }
    }

    for (const prop of getObjectiveSetDressings(route)) {
      this.addScenicProp(layerChildren, prop, route);
    }

    const paintStrips =
      route.id === "crosswind-docks"
        ? [
            { x: 372, y: 1110, width: 180, height: 8, rotation: -0.06 },
            { x: 1380, y: 760, width: 220, height: 10, rotation: 0.08 },
            { x: 2040, y: 600, width: 150, height: 8, rotation: 0 }
          ]
        : route.id === "broken-signal"
          ? [
              { x: 680, y: 330, width: 220, height: 8, rotation: 0.02 },
              { x: 1470, y: 500, width: 240, height: 10, rotation: -0.52 },
              { x: 2060, y: 290, width: 120, height: 8, rotation: 0.16 }
            ]
          : [
              { x: 430, y: 920, width: 180, height: 8, rotation: -0.18 },
              { x: 1520, y: 1010, width: 240, height: 10, rotation: 0.2 },
              { x: 2060, y: 760, width: 120, height: 8, rotation: 1.04 }
            ];

    for (const strip of paintStrips) {
      const paint = this.add.rectangle(strip.x, strip.y, strip.width, strip.height, route.sceneTheme.accentColor, 0.16);
      paint.setRotation(strip.rotation);
      layerChildren.push(paint);

      const highlight = this.add.rectangle(strip.x, strip.y, strip.width * 0.78, Math.max(3, strip.height - 4), accentColor.color, 0.16);
      highlight.setRotation(strip.rotation);
      layerChildren.push(highlight);
    }
  }

  private drawCombatPockets(
    graphics: Phaser.GameObjects.Graphics,
    route: RaidRouteDefinition,
    layerChildren: Phaser.GameObjects.GameObject[]
  ): void {
    for (const [index, pocket] of route.combatPockets.entries()) {
      graphics.fillStyle(route.sceneTheme.pocketColor, 0.06);
      graphics.fillCircle(pocket.position.x, pocket.position.y, pocket.radius);
      graphics.lineStyle(2, route.sceneTheme.pocketColor, 0.28);
      graphics.strokeCircle(pocket.position.x, pocket.position.y, pocket.radius);
      graphics.lineStyle(1, route.sceneTheme.accentColor, 0.2);
      graphics.strokeCircle(pocket.position.x, pocket.position.y, pocket.radius + 22);

      const angle = getPocketAngle(route.id, index);
      const matte = this.add.ellipse(
        pocket.position.x,
        pocket.position.y,
        pocket.radius * 1.76,
        pocket.radius * 1.12,
        route.sceneTheme.shadowColor,
        0.22
      );
      matte.setRotation(angle);
      layerChildren.push(matte);

      const lane = this.add.rectangle(
        pocket.position.x,
        pocket.position.y,
        pocket.radius * 1.38,
        pocket.radius * 0.42,
        route.sceneTheme.laneColor,
        0.14
      );
      lane.setRotation(angle);
      layerChildren.push(lane);

      const hardEdge = this.add.rectangle(
        pocket.position.x + Math.cos(angle) * (pocket.radius * 0.24),
        pocket.position.y + Math.sin(angle) * (pocket.radius * 0.24),
        pocket.radius * 0.94,
        8,
        route.sceneTheme.accentColor,
        0.14
      );
      hardEdge.setRotation(angle + 0.08);
      layerChildren.push(hardEdge);

      for (let detailIndex = 0; detailIndex < 4; detailIndex += 1) {
        const offsetAngle = angle + Math.PI * 0.55 + detailIndex * 0.82;
        const distance = pocket.radius * (0.44 + detailIndex * 0.1);
        const debris = this.add.rectangle(
          pocket.position.x + Math.cos(offsetAngle) * distance,
          pocket.position.y + Math.sin(offsetAngle) * distance * 0.68,
          16 + detailIndex * 4,
          6,
          route.sceneTheme.gridColor,
          0.16
        );
        debris.setRotation(offsetAngle);
        layerChildren.push(debris);
      }

      const label = this.add
        .text(pocket.position.x, pocket.position.y - pocket.radius - 14, pocket.label, {
          fontFamily: "monospace",
          fontSize: "12px",
          color: Phaser.Display.Color.IntegerToColor(route.sceneTheme.accentColor).rgba
        })
        .setOrigin(0.5, 1)
        .setAlpha(0.6);
      layerChildren.push(label);
    }
  }

  private addScenicProp(
    layerChildren: Phaser.GameObjects.GameObject[],
    prop: PropPlacement,
    route: RaidRouteDefinition
  ): void {
    const textureKey = getPropTextureKey(prop.kind);
    const scale = prop.scale ?? 1;
    const shadowConfig = getPropShadowConfig(prop.kind, scale);
    const shadow = this.add.ellipse(
      prop.position.x + shadowConfig.offsetX,
      prop.position.y + shadowConfig.offsetY,
      shadowConfig.width,
      shadowConfig.height,
      route.sceneTheme.shadowColor,
      prop.shadowAlpha ?? 0.34
    );
    shadow.setRotation(prop.rotation ?? 0);
    shadow.setDepth(prop.position.y * 0.001 + (prop.depthBias ?? -0.02));
    layerChildren.push(shadow);

    const sprite = this.add.sprite(prop.position.x, prop.position.y, textureKey);
    sprite.setRotation(prop.rotation ?? 0);
    sprite.setScale(scale);
    sprite.setTint(prop.tint ?? route.sceneTheme.propTint);
    sprite.setAlpha(prop.alpha ?? 1);
    sprite.setDepth(prop.position.y * 0.001 + (prop.depthBias ?? 0));
    layerChildren.push(sprite);
  }

  private drawTownWarStaticArt(
    layerChildren: Phaser.GameObjects.GameObject[],
    route: RaidRouteDefinition
  ): void {
    townWarController.ensureDemoSeeded();
    const snapshot = townWarController.getSnapshot();

    this.drawFirstTownEnvironmentalArt(layerChildren, route, snapshot.camps);
    this.townWarPlayerCampArtObjects = [];

    for (const camp of snapshot.camps) {
      const beforeCount = layerChildren.length;
      this.drawTownWarCampCompound(layerChildren, route, camp);
      if (isTownWarPlayerFaction(camp.id)) {
        this.townWarPlayerCampArtObjects = layerChildren.slice(beforeCount);
        for (const object of this.townWarPlayerCampArtObjects) {
          if ("setVisible" in object && typeof object.setVisible === "function") {
            object.setVisible(this.townWarPlayerCampArtVisible);
          }
        }
      }
    }
  }

  private drawFirstTownEnvironmentalArt(
    layerChildren: Phaser.GameObjects.GameObject[],
    route: RaidRouteDefinition,
    camps: TownWarCampState[]
  ): void {
    const campA = camps.find((camp) => camp.id === "camp-a") ?? null;
    const campB = camps.find((camp) => camp.id === "camp-b") ?? null;
    if (!campA || !campB) {
      return;
    }

    const midY = (campA.spawn.position.y + campB.spawn.position.y) / 2;
    const roadCenterX = (campA.spawn.position.x + campB.spawn.position.x) / 2;
    const roadWidth = Math.abs(campA.spawn.position.x - campB.spawn.position.x) + 320;
    const roadMatte = this.add.rectangle(roadCenterX, midY, roadWidth, 88, route.sceneTheme.shadowColor, 0.16);
    roadMatte.setRotation(-0.015);
    roadMatte.setDepth(midY * 0.001 - 0.12);
    layerChildren.push(roadMatte);

    for (let index = 0; index < 13; index += 1) {
      const progress = index / 12;
      const x = Phaser.Math.Linear(campB.spawn.position.x - 160, campA.spawn.position.x + 160, progress);
      const y = midY + Math.sin(progress * Math.PI * 2.1) * 18;
      this.addEnvironmentSheetSprite(layerChildren, "frontline-env-road-64", index % 4, x, y, {
        rotation: -0.02 + Math.sin(index) * 0.035,
        scale: 1.08,
        alpha: 0.84,
        depthBias: -0.09
      });
    }

    const foliageAnchors = [
      { x: campB.spawn.position.x - 230, y: midY - 230 },
      { x: campB.spawn.position.x + 180, y: midY + 245 },
      { x: roadCenterX - 320, y: midY - 320 },
      { x: roadCenterX + 240, y: midY + 310 },
      { x: campA.spawn.position.x - 210, y: midY - 260 },
      { x: campA.spawn.position.x + 220, y: midY + 240 }
    ];

    foliageAnchors.forEach((anchor, anchorIndex) => {
      for (let index = 0; index < 7; index += 1) {
        const angle = anchorIndex * 1.7 + index * 0.92;
        const distance = 22 + (index % 4) * 18;
        this.addEnvironmentSheetSprite(
          layerChildren,
          "frontline-env-foliage-32",
          (anchorIndex * 3 + index) % 16,
          anchor.x + Math.cos(angle) * distance,
          anchor.y + Math.sin(angle) * distance,
          {
            rotation: angle * 0.08,
            scale: 1.05 + (index % 3) * 0.1,
            alpha: 0.92,
            depthBias: -0.03
          }
        );
      }
    });

    for (let index = 0; index < 10; index += 1) {
      const progress = index / 9;
      const x = Phaser.Math.Linear(campB.spawn.position.x - 130, campA.spawn.position.x + 130, progress);
      const y = midY + Math.sin(progress * Math.PI * 2.1) * 18;
      this.addEnvironmentSheetSprite(layerChildren, "frontline-env-road-edge-64", index % 8, x, y - 56, {
        rotation: -0.02,
        scale: 0.98,
        alpha: 0.74,
        depthBias: -0.1
      });
      this.addEnvironmentSheetSprite(layerChildren, "frontline-env-road-edge-64", (index + 4) % 8, x, y + 58, {
        rotation: Math.PI + 0.02,
        scale: 0.98,
        alpha: 0.7,
        depthBias: -0.1
      });
    }

    this.addEnvironmentImage(layerChildren, "frontline-env-ruined-house-128", roadCenterX - 220, midY - 175, {
      rotation: -0.08,
      scale: 1.22,
      alpha: 0.9,
      depthBias: -0.04
    });
    this.addEnvironmentSheetSprite(layerChildren, "frontline-env-props-64", 3, roadCenterX + 190, midY + 145, {
      rotation: 0.2,
      scale: 1.05,
      alpha: 0.9,
      depthBias: -0.02
    });
    this.addEnvironmentSheetSprite(layerChildren, "frontline-env-trench-64", 1, roadCenterX - 40, midY - 118, {
      rotation: -0.04,
      scale: 1.28,
      alpha: 0.88,
      depthBias: -0.05
    });
    this.addEnvironmentSheetSprite(layerChildren, "frontline-env-trench-64", 2, roadCenterX + 42, midY - 115, {
      rotation: -0.04,
      scale: 1.28,
      alpha: 0.88,
      depthBias: -0.05
    });
    this.addEnvironmentSheetSprite(layerChildren, "frontline-env-trench-edge-64", 1, roadCenterX - 122, midY - 118, {
      rotation: -0.04,
      scale: 1.12,
      alpha: 0.82,
      depthBias: -0.055
    });
    this.addEnvironmentSheetSprite(layerChildren, "frontline-env-trench-edge-64", 5, roadCenterX + 124, midY - 112, {
      rotation: Math.PI - 0.04,
      scale: 1.12,
      alpha: 0.82,
      depthBias: -0.055
    });

    const scarPlacements = [
      { x: roadCenterX - 420, y: midY + 86, frame: 2, scale: 1.16, rotation: 0.18 },
      { x: roadCenterX - 305, y: midY - 74, frame: 7, scale: 0.96, rotation: -0.14 },
      { x: roadCenterX + 320, y: midY + 78, frame: 9, scale: 1.08, rotation: 0.08 },
      { x: roadCenterX + 425, y: midY - 96, frame: 13, scale: 1.24, rotation: -0.2 },
      { x: campB.spawn.position.x + 310, y: campB.spawn.position.y - 22, frame: 4, scale: 1.12, rotation: 0.1 },
      { x: campA.spawn.position.x - 315, y: campA.spawn.position.y + 26, frame: 11, scale: 1.08, rotation: -0.08 }
    ];
    for (const scar of scarPlacements) {
      this.addEnvironmentSheetSprite(layerChildren, "frontline-env-scars-64", scar.frame, scar.x, scar.y, {
        rotation: scar.rotation,
        scale: scar.scale,
        alpha: 0.68,
        depthBias: -0.12
      });
    }

    for (let index = 0; index < 8; index += 1) {
      const x = roadCenterX - 520 + index * 150;
      const y = midY - 365 + Math.sin(index * 1.3) * 22;
      this.addEnvironmentSheetSprite(layerChildren, "frontline-env-treeline-64", index % 16, x, y, {
        rotation: Math.sin(index) * 0.12,
        scale: 1.05 + (index % 3) * 0.08,
        alpha: 0.88,
        depthBias: -0.04
      });
      this.addEnvironmentSheetSprite(layerChildren, "frontline-env-concealment-64", (index * 2) % 16, x + 48, y + 54, {
        rotation: -0.12 + index * 0.03,
        scale: 0.88,
        alpha: 0.8,
        depthBias: -0.035
      });
    }

    const ruinedTownPlacements = [
      { key: "frontline-env-village-props-64", frame: 0, x: roadCenterX - 170, y: midY - 255, rotation: 0.1, scale: 1.05 },
      { key: "frontline-env-village-props-64", frame: 3, x: roadCenterX - 92, y: midY - 245, rotation: -0.08, scale: 0.96 },
      { key: "frontline-env-ruined-town-64", frame: 4, x: roadCenterX + 245, y: midY + 225, rotation: 0.24, scale: 1.08 },
      { key: "frontline-env-industrial-ruins-64", frame: 2, x: roadCenterX + 318, y: midY + 185, rotation: -0.16, scale: 0.98 },
      { key: "frontline-env-crater-field-64", frame: 5, x: roadCenterX + 82, y: midY + 270, rotation: 0.08, scale: 1.16 },
      { key: "frontline-env-mud-water-64", frame: 10, x: roadCenterX - 372, y: midY + 215, rotation: -0.12, scale: 1.06 },
      { key: "frontline-env-seasonal-foliage-64", frame: 6, x: campA.spawn.position.x + 272, y: campA.spawn.position.y - 170, rotation: 0.06, scale: 0.92 },
      { key: "frontline-env-woodland-terrain-64", frame: 12, x: campB.spawn.position.x - 286, y: campB.spawn.position.y + 184, rotation: -0.04, scale: 1.1 }
    ];
    for (const prop of ruinedTownPlacements) {
      this.addEnvironmentSheetSprite(layerChildren, prop.key, prop.frame, prop.x, prop.y, {
        rotation: prop.rotation,
        scale: prop.scale,
        alpha: 0.82,
        depthBias: -0.045
      });
    }

    for (let index = 0; index < 18; index += 1) {
      const side = index % 2 === 0 ? -1 : 1;
      const x = roadCenterX + side * (255 + (index % 5) * 64);
      const y = midY + (index < 9 ? -1 : 1) * (220 + ((index * 17) % 92));
      this.addEnvironmentSheetSprite(layerChildren, "frontline-env-woodland-foliage-32", (index * 3) % 32, x, y, {
        rotation: index * 0.07,
        scale: 1 + (index % 4) * 0.12,
        alpha: 0.86,
        depthBias: -0.03
      });
    }

    const ruralFieldPlacements = [
      { key: "frontline-env-rural-field-64", frame: 0, x: roadCenterX - 560, y: midY - 170, rotation: -0.06, scale: 1.18 },
      { key: "frontline-env-rural-field-64", frame: 2, x: roadCenterX - 496, y: midY - 168, rotation: -0.06, scale: 1.18 },
      { key: "frontline-env-rural-field-64", frame: 5, x: roadCenterX - 528, y: midY - 104, rotation: -0.06, scale: 1.18 },
      { key: "frontline-env-rural-field-64", frame: 6, x: roadCenterX + 520, y: midY + 178, rotation: 0.08, scale: 1.12 },
      { key: "frontline-env-rural-field-64", frame: 3, x: roadCenterX + 584, y: midY + 176, rotation: 0.08, scale: 1.12 },
      { key: "frontline-env-wet-mud-64", frame: 9, x: roadCenterX - 470, y: midY + 102, rotation: 0.12, scale: 1.08 },
      { key: "frontline-env-wet-mud-64", frame: 14, x: roadCenterX + 456, y: midY - 132, rotation: -0.08, scale: 1.1 },
      { key: "frontline-env-artillery-aftermath-64", frame: 4, x: roadCenterX - 132, y: midY + 336, rotation: 0.02, scale: 1.18 },
      { key: "frontline-env-artillery-aftermath-64", frame: 11, x: roadCenterX + 158, y: midY - 318, rotation: -0.16, scale: 1.14 },
      { key: "frontline-env-artillery-aftermath-64", frame: 15, x: roadCenterX + 388, y: midY + 308, rotation: 0.2, scale: 1.08 }
    ];
    for (const prop of ruralFieldPlacements) {
      this.addEnvironmentSheetSprite(layerChildren, prop.key, prop.frame, prop.x, prop.y, {
        rotation: prop.rotation,
        scale: prop.scale,
        alpha: 0.74,
        depthBias: -0.13
      });
    }

    for (let index = 0; index < 10; index += 1) {
      const x = roadCenterX - 590 + index * 132;
      const northY = midY - 430 + Math.sin(index * 0.8) * 16;
      const southY = midY + 410 + Math.cos(index * 0.7) * 18;
      this.addEnvironmentSheetSprite(layerChildren, "frontline-env-hedgerow-64", index % 8, x, northY, {
        rotation: -0.04 + index * 0.012,
        scale: 1.08,
        alpha: 0.84,
        depthBias: -0.032
      });
      this.addEnvironmentSheetSprite(layerChildren, "frontline-env-orchard-64", (index + 3) % 8, x + 52, southY, {
        rotation: 0.08 - index * 0.01,
        scale: 0.96,
        alpha: 0.82,
        depthBias: -0.03
      });
    }

    const woodlandProps = [
      { key: "frontline-env-woodland-trees-96", frame: 1, x: campB.spawn.position.x - 352, y: campB.spawn.position.y - 242, rotation: -0.08, scale: 0.98 },
      { key: "frontline-env-woodland-trees-96", frame: 5, x: campA.spawn.position.x + 342, y: campA.spawn.position.y + 244, rotation: 0.1, scale: 0.94 },
      { key: "frontline-env-woodland-logs-64", frame: 3, x: roadCenterX - 282, y: midY + 346, rotation: -0.18, scale: 1.08 },
      { key: "frontline-env-woodland-logs-64", frame: 6, x: roadCenterX + 304, y: midY - 356, rotation: 0.14, scale: 1.02 },
      { key: "frontline-env-woodland-treeline-128x96", frame: 0, x: roadCenterX - 618, y: midY + 306, rotation: -0.04, scale: 1 },
      { key: "frontline-env-woodland-treeline-128x96", frame: 2, x: roadCenterX + 640, y: midY - 286, rotation: 0.06, scale: 1 }
    ];
    for (const prop of woodlandProps) {
      this.addEnvironmentSheetSprite(layerChildren, prop.key, prop.frame, prop.x, prop.y, {
        rotation: prop.rotation,
        scale: prop.scale,
        alpha: 0.86,
        depthBias: -0.028
      });
    }

    this.addEnvironmentImage(layerChildren, "frontline-env-woodland-deadfall-128x96", roadCenterX + 500, midY + 48, {
      rotation: -0.14,
      scale: 0.9,
      alpha: 0.84,
      depthBias: -0.035
    });
    this.addEnvironmentImage(layerChildren, "frontline-env-woodland-bushline-128", roadCenterX - 622, midY + 72, {
      rotation: 0.08,
      scale: 0.84,
      alpha: 0.82,
      depthBias: -0.034
    });
    this.addEnvironmentImage(layerChildren, "frontline-env-woodland-bare-tree-96", roadCenterX + 632, midY + 92, {
      rotation: -0.06,
      scale: 0.9,
      alpha: 0.82,
      depthBias: -0.03
    });

    for (let index = 0; index < 8; index += 1) {
      this.addEnvironmentSheetSprite(
        layerChildren,
        "frontline-env-weather-64",
        index,
        roadCenterX - 448 + index * 128,
        midY - 52 + Math.sin(index * 1.1) * 42,
        {
          rotation: -0.1 + index * 0.025,
          scale: 1.12,
          alpha: 0.16,
          depthBias: 0.12
        }
      );
    }
  }

  private drawTownWarCampCompound(
    layerChildren: Phaser.GameObjects.GameObject[],
    route: RaidRouteDefinition,
    camp: TownWarCampState
  ): void {
    const center = camp.spawn.position;
    const facing = isTownWarPlayerFaction(camp.id) ? -1 : 1;
    const healthRatio = camp.health.max > 0 ? camp.health.current / camp.health.max : 0;
    const accentColor = getTownWarFactionAccent(camp.id);
    const campTint = getTownWarFactionColor(camp.id);

    const isPlayerCamp = isTownWarPlayerFaction(camp.id);
    const compoundWidth = isPlayerCamp ? 540 : 430;
    const compoundHeight = isPlayerCamp ? 372 : 300;
    const ground = this.add.ellipse(center.x, center.y + 8, compoundWidth, compoundHeight, route.sceneTheme.shadowColor, 0.26);
    ground.setDepth(center.y * 0.001 - 0.14);
    layerChildren.push(ground);

    const perimeter = this.add.ellipse(center.x, center.y, compoundWidth - 46, compoundHeight - 46, campTint, 0.06);
    perimeter.setStrokeStyle(3, accentColor, 0.24);
    perimeter.setDepth(center.y * 0.001 - 0.13);
    layerChildren.push(perimeter);

    if (isPlayerCamp) {
      const rearPad = this.add.ellipse(center.x + 128, center.y + 98, 260, 150, 0x0f172a, 0.22);
      rearPad.setRotation(-0.08);
      rearPad.setDepth(center.y * 0.001 - 0.125);
      layerChildren.push(rearPad);

      const forwardPad = this.add.ellipse(center.x - 178, center.y - 82, 244, 132, campTint, 0.07);
      forwardPad.setRotation(0.18);
      forwardPad.setStrokeStyle(2, accentColor, 0.16);
      forwardPad.setDepth(center.y * 0.001 - 0.124);
      layerChildren.push(forwardPad);
    }

    const damageRole: CampAssetRole = healthRatio <= 0.45 ? "command-damaged" : "command";
    const tentRole: CampAssetRole = healthRatio <= 0.3 ? "tent-damaged" : "tent";
    const placements: Array<{
      role: CampAssetRole;
      x: number;
      y: number;
      rotation?: number;
      scale?: number;
      alpha?: number;
    }> = [
      { role: damageRole, x: center.x, y: center.y - 18, scale: 1.22 },
      { role: tentRole, x: center.x - facing * 118, y: center.y - 76, rotation: -0.08 * facing, scale: 1.04 },
      { role: "supply", x: center.x - facing * 118, y: center.y + 56, rotation: 0.04 * facing, scale: 1.02 },
      { role: "large-supply", x: center.x - facing * 20, y: center.y + 112, rotation: 0.02 * facing, scale: 0.88 },
      { role: "truck", x: center.x + facing * 122, y: center.y + 76, rotation: facing > 0 ? 0.03 : Math.PI - 0.03, scale: 0.96 },
      { role: "watch", x: center.x + facing * 142, y: center.y - 92, rotation: 0.04 * facing, scale: 0.9 },
      { role: "radio", x: center.x + facing * 46, y: center.y - 122, scale: 0.92 },
      { role: "mortar", x: center.x + facing * 168, y: center.y + 2, rotation: -0.08 * facing, scale: 0.88 },
      { role: "medical", x: center.x - facing * 190, y: center.y + 10, rotation: 0.05 * facing, scale: 0.9 },
      { role: "generator", x: center.x + facing * 52, y: center.y + 146, rotation: -0.06 * facing, scale: 0.88 },
      { role: "camo-storage", x: center.x - facing * 34, y: center.y - 142, rotation: 0.02 * facing, scale: 0.75 },
      { role: "kitchen", x: center.x - facing * 190, y: center.y - 70, rotation: -0.03 * facing, scale: 0.94 },
      { role: "fuel", x: center.x + facing * 190, y: center.y + 132, rotation: 0.04 * facing, scale: 0.9 },
      { role: "ammo", x: center.x - facing * 178, y: center.y + 100, rotation: 0.08 * facing, scale: 0.94 },
      { role: "wreck", x: center.x + facing * 236, y: center.y - 34, rotation: 0.18 * facing, scale: 0.82, alpha: 0.82 },
      { role: "checkpoint", x: center.x - facing * 252, y: center.y, rotation: Math.PI / 2, scale: 1 },
      { role: "trench", x: center.x - facing * 64, y: center.y - 190, rotation: -0.08 * facing, scale: 1.12 },
      { role: "wire", x: center.x - facing * 40, y: center.y + 198, rotation: 0.06 * facing, scale: 1.08 },
      { role: "sandbag", x: center.x + facing * 80, y: center.y - 184, rotation: -0.04 * facing, scale: 1.06 },
      { role: "sandbag", x: center.x + facing * 84, y: center.y + 190, rotation: 0.05 * facing, scale: 1.06 },
      { role: "command-core", x: center.x + facing * 12, y: center.y - 46, rotation: -0.02 * facing, scale: 0.88, alpha: 0.94 },
      { role: "large-tent", x: center.x - facing * 206, y: center.y - 124, rotation: 0.08 * facing, scale: 0.92 },
      { role: "motor-pool", x: center.x + facing * 206, y: center.y + 102, rotation: facing > 0 ? -0.08 : Math.PI + 0.08, scale: 0.84 },
      { role: "supply-dump", x: center.x - facing * 216, y: center.y + 154, rotation: -0.06 * facing, scale: 0.82 },
      { role: "trench-gate", x: center.x + facing * 162, y: center.y - 202, rotation: -0.09 * facing, scale: 0.9 }
    ];

    if (isPlayerCamp) {
      placements.push(
        { role: "command-core", x: center.x + 28, y: center.y - 24, rotation: 0.02, scale: 1.02 },
        { role: "large-tent", x: center.x + 210, y: center.y - 126, rotation: 0.08, scale: 0.96 },
        { role: "large-tent", x: center.x + 240, y: center.y + 18, rotation: -0.06, scale: 0.92 },
        { role: "motor-pool", x: center.x + 222, y: center.y + 122, rotation: Math.PI - 0.09, scale: 0.92 },
        { role: "supply-dump", x: center.x + 94, y: center.y + 214, rotation: -0.04, scale: 0.96 },
        { role: "trench-gate", x: center.x - 240, y: center.y - 164, rotation: -0.16, scale: 1.04 },
        { role: "trench-gate", x: center.x - 232, y: center.y + 162, rotation: 0.14, scale: 1.02 },
        { role: "sandbag", x: center.x - 282, y: center.y - 28, rotation: Math.PI / 2 - 0.06, scale: 1.08 },
        { role: "wire", x: center.x - 292, y: center.y + 76, rotation: Math.PI / 2 + 0.08, scale: 1.04 },
        { role: "watch", x: center.x + 286, y: center.y - 58, rotation: -0.04, scale: 0.82 },
        { role: "ammo", x: center.x + 168, y: center.y + 212, rotation: 0.1, scale: 0.86 }
      );
    }

    for (const placement of placements) {
      this.addCampAssetSprite(layerChildren, route, camp, placement.role, placement.x, placement.y, {
        rotation: placement.rotation,
        scale: placement.scale,
        alpha: placement.alpha
      });
    }

    const campSheetPlacements: Array<{
      sheet: CampAssetSheet;
      frame: number;
      x: number;
      y: number;
      rotation?: number;
      scale?: number;
      alpha?: number;
      shadow?: boolean;
    }> = [
      { sheet: "modules-64", frame: 0, x: center.x - facing * 72, y: center.y - 18, rotation: 0.04 * facing, scale: 0.9 },
      { sheet: "modules-64", frame: 5, x: center.x + facing * 76, y: center.y + 38, rotation: -0.08 * facing, scale: 0.86 },
      { sheet: "services-64", frame: 1, x: center.x - facing * 148, y: center.y - 18, rotation: 0.12 * facing, scale: 0.82 },
      { sheet: "services-64", frame: 3, x: center.x + facing * 122, y: center.y + 132, rotation: -0.06 * facing, scale: 0.8 },
      { sheet: "interiors-64", frame: 2, x: center.x - facing * 34, y: center.y + 44, rotation: -0.04 * facing, scale: 0.74 },
      { sheet: "heavy-64", frame: 4, x: center.x + facing * 214, y: center.y - 98, rotation: 0.22 * facing, scale: 0.92 },
      { sheet: "perimeter-64", frame: 1, x: center.x - facing * 222, y: center.y - 122, rotation: -0.18 * facing, scale: 1.04 },
      { sheet: "perimeter-64", frame: 6, x: center.x - facing * 230, y: center.y + 128, rotation: 0.16 * facing, scale: 1.04 },
      { sheet: "supply-stacks-64", frame: 3, x: center.x - facing * 92, y: center.y + 128, rotation: 0.06 * facing, scale: 0.9 },
      { sheet: "supply-stacks-64", frame: 7, x: center.x - facing * 154, y: center.y + 142, rotation: -0.03 * facing, scale: 0.82 },
      { sheet: "trench-modules-64", frame: 2, x: center.x + facing * 8, y: center.y - 222, rotation: -0.08 * facing, scale: 1.08 },
      { sheet: "trench-modules-64", frame: 6, x: center.x - facing * 10, y: center.y + 228, rotation: Math.PI + 0.08 * facing, scale: 1.08 },
      { sheet: "damage-64", frame: 5, x: center.x + facing * 20, y: center.y + 4, rotation: -0.16, scale: 1.06, alpha: 0.56, shadow: false },
      { sheet: "damage-64", frame: healthRatio <= 0.45 ? 10 : 2, x: center.x + facing * 112, y: center.y - 28, rotation: 0.24, scale: 0.84, alpha: 0.46, shadow: false },
      { sheet: "fieldwork-stages-64", frame: 2, x: center.x + facing * 196, y: center.y + 64, rotation: 0.12 * facing, scale: 0.78 },
      { sheet: "logistics-markers-32", frame: 4, x: center.x - facing * 104, y: center.y + 6, rotation: 0.02, scale: 1.16, shadow: false },
      { sheet: "signal-panels-32", frame: 1, x: center.x + facing * 68, y: center.y - 146, rotation: -0.05 * facing, scale: 1.14, shadow: false },
      { sheet: "ground-markers-32", frame: 6, x: center.x - facing * 246, y: center.y + 54, rotation: 0.08 * facing, scale: 1.2, shadow: false },
      { sheet: "props-32", frame: 8, x: center.x + facing * 158, y: center.y - 42, rotation: -0.1 * facing, scale: 1.05, shadow: false },
      { sheet: "props-32", frame: 13, x: center.x - facing * 12, y: center.y + 154, rotation: 0.04 * facing, scale: 1.1, shadow: false },
      { sheet: "abandoned-64", frame: 0, x: center.x + facing * 252, y: center.y + 22, rotation: -0.16 * facing, scale: 0.86, alpha: 0.76 },
      { sheet: "abandoned-64", frame: 5, x: center.x - facing * 258, y: center.y - 38, rotation: 0.12 * facing, scale: 0.82, alpha: 0.72 },
      { sheet: "camo-command-64", frame: 2, x: center.x + facing * 28, y: center.y - 166, rotation: -0.03 * facing, scale: 0.88, alpha: 0.86 },
      { sheet: "camo-command-64", frame: 6, x: center.x - facing * 96, y: center.y - 154, rotation: 0.07 * facing, scale: 0.78, alpha: 0.82 },
      { sheet: "night-watch-64", frame: 1, x: center.x + facing * 224, y: center.y - 150, rotation: 0.1 * facing, scale: 0.82, alpha: 0.88 },
      { sheet: "night-watch-64", frame: 4, x: center.x - facing * 224, y: center.y + 204, rotation: -0.08 * facing, scale: 0.76, alpha: 0.74 },
      { sheet: "recovery-medical-64", frame: 2, x: center.x - facing * 238, y: center.y + 44, rotation: 0.04 * facing, scale: 0.82, alpha: 0.9 },
      { sheet: "recovery-medical-64", frame: 7, x: center.x - facing * 184, y: center.y + 164, rotation: -0.1 * facing, scale: 0.74, alpha: 0.84 }
    ];

    if (isPlayerCamp) {
      campSheetPlacements.push(
        { sheet: "camo-command-64", frame: 5, x: center.x - 22, y: center.y - 92, rotation: 0.04, scale: 1.1, alpha: 0.88 },
        { sheet: "camo-command-64", frame: 9, x: center.x + 86, y: center.y - 76, rotation: -0.08, scale: 0.94, alpha: 0.86 },
        { sheet: "night-watch-64", frame: 2, x: center.x + 292, y: center.y + 34, rotation: 0.12, scale: 0.86 },
        { sheet: "night-watch-64", frame: 7, x: center.x - 292, y: center.y - 92, rotation: -0.14, scale: 0.88 },
        { sheet: "recovery-medical-64", frame: 4, x: center.x + 188, y: center.y - 206, rotation: 0.07, scale: 0.92 },
        { sheet: "recovery-medical-64", frame: 10, x: center.x + 146, y: center.y - 156, rotation: -0.1, scale: 0.86 },
        { sheet: "abandoned-64", frame: 3, x: center.x - 124, y: center.y + 218, rotation: 0.18, scale: 0.92, alpha: 0.72 },
        { sheet: "abandoned-64", frame: 11, x: center.x + 272, y: center.y + 178, rotation: -0.16, scale: 0.82, alpha: 0.68 },
        { sheet: "ground-markers-32", frame: 12, x: center.x + 28, y: center.y + 92, rotation: 0.02, scale: 1.28, shadow: false },
        { sheet: "logistics-markers-32", frame: 9, x: center.x + 244, y: center.y + 96, rotation: -0.04, scale: 1.2, shadow: false },
        { sheet: "signal-panels-32", frame: 6, x: center.x + 18, y: center.y - 154, rotation: 0.05, scale: 1.12, shadow: false },
        { sheet: "props-32", frame: 21, x: center.x + 118, y: center.y + 186, rotation: -0.08, scale: 1.08, shadow: false },
        { sheet: "props-32", frame: 27, x: center.x - 252, y: center.y + 22, rotation: 0.16, scale: 1.04, shadow: false }
      );
    }

    for (const placement of campSheetPlacements) {
      this.addCampSheetSprite(layerChildren, route, camp, placement.sheet, placement.frame, placement.x, placement.y, {
        rotation: placement.rotation,
        scale: placement.scale,
        alpha: placement.alpha,
        shadow: placement.shadow
      });
    }

    const label = this.add
      .text(center.x, center.y - (isPlayerCamp ? 230 : 178), isPlayerCamp ? "RUSSIAN PLAYER CAMP" : "UKRAINIAN ENEMY CAMP", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: isPlayerCamp ? "#fde68a" : "#bfdbfe"
      })
      .setOrigin(0.5, 1)
      .setAlpha(0.74);
    label.setShadow(0, 1, "#020617", 5, false, true);
    label.setDepth(center.y * 0.001 + 0.22);
    layerChildren.push(label);
  }

  private addCampAssetSprite(
    layerChildren: Phaser.GameObjects.GameObject[],
    route: RaidRouteDefinition,
    camp: TownWarCampState,
    role: CampAssetRole,
    x: number,
    y: number,
    options: {
      rotation?: number;
      scale?: number;
      alpha?: number;
    } = {}
  ): void {
    const textureKey = getFrontlineCampAssetKey(camp.id, role);
    const scale = options.scale ?? 1;
    const shadow = this.add.ellipse(x + 8, y + 10, 84 * scale, 34 * scale, route.sceneTheme.shadowColor, 0.28);
    shadow.setRotation(options.rotation ?? 0);
    shadow.setDepth(y * 0.001 - 0.03);
    layerChildren.push(shadow);

    if (!this.textures.exists(textureKey)) {
      return;
    }

    const sprite = this.add.sprite(x, y, textureKey);
    sprite.setRotation(options.rotation ?? 0);
    sprite.setScale(scale);
    sprite.setAlpha(options.alpha ?? (camp.destroyed ? 0.54 : 1));
    sprite.setDepth(y * 0.001 + 0.02);
    layerChildren.push(sprite);
  }

  private addCampSheetSprite(
    layerChildren: Phaser.GameObjects.GameObject[],
    route: RaidRouteDefinition,
    camp: TownWarCampState,
    sheet: CampAssetSheet,
    frame: number,
    x: number,
    y: number,
    options: {
      rotation?: number;
      scale?: number;
      alpha?: number;
      shadow?: boolean;
    } = {}
  ): void {
    const textureKey = getFrontlineCampSheetKey(camp.id, sheet);
    if (!this.textures.exists(textureKey)) {
      return;
    }

    const scale = options.scale ?? 1;
    if (options.shadow !== false) {
      const shadow = this.add.ellipse(x + 6, y + 8, 46 * scale, 18 * scale, route.sceneTheme.shadowColor, 0.22);
      shadow.setRotation(options.rotation ?? 0);
      shadow.setDepth(y * 0.001 - 0.035);
      layerChildren.push(shadow);
    }

    const sprite = this.add.sprite(x, y, textureKey, frame);
    sprite.setRotation(options.rotation ?? 0);
    sprite.setScale(scale);
    sprite.setAlpha(options.alpha ?? (camp.destroyed ? 0.48 : 0.92));
    sprite.setDepth(y * 0.001 + 0.018);
    layerChildren.push(sprite);
  }

  private addEnvironmentSheetSprite(
    layerChildren: Phaser.GameObjects.GameObject[],
    textureKey: string,
    frame: number,
    x: number,
    y: number,
    options: {
      rotation?: number;
      scale?: number;
      alpha?: number;
      depthBias?: number;
    } = {}
  ): void {
    if (!this.textures.exists(textureKey)) {
      return;
    }

    const sprite = this.add.sprite(x, y, textureKey, frame);
    sprite.setRotation(options.rotation ?? 0);
    sprite.setScale(options.scale ?? 1);
    sprite.setAlpha(options.alpha ?? 1);
    sprite.setDepth(y * 0.001 + (options.depthBias ?? -0.02));
    layerChildren.push(sprite);
  }

  private addEnvironmentImage(
    layerChildren: Phaser.GameObjects.GameObject[],
    textureKey: string,
    x: number,
    y: number,
    options: {
      rotation?: number;
      scale?: number;
      alpha?: number;
      depthBias?: number;
    } = {}
  ): void {
    if (!this.textures.exists(textureKey)) {
      return;
    }

    const sprite = this.add.sprite(x, y, textureKey);
    sprite.setRotation(options.rotation ?? 0);
    sprite.setScale(options.scale ?? 1);
    sprite.setAlpha(options.alpha ?? 1);
    sprite.setDepth(y * 0.001 + (options.depthBias ?? -0.02));
    layerChildren.push(sprite);
  }

  private addGroundDecal(layerChildren: Phaser.GameObjects.GameObject[], decal: GroundDecalDefinition): Phaser.GameObjects.Sprite {
    const sprite = this.add.sprite(decal.position.x, decal.position.y, getGroundTextureKey(decal.kind));
    sprite.setRotation(decal.rotation ?? 0);
    sprite.setScale(decal.scaleX ?? decal.scale ?? 1, decal.scaleY ?? decal.scale ?? 1);
    sprite.setAlpha(decal.alpha ?? 0.38);
    sprite.setDepth(decal.position.y * 0.001 + (decal.depthOffset ?? -0.05));

    if (decal.tint) {
      sprite.setTint(decal.tint);
    }

    layerChildren.push(sprite);
    return sprite;
  }

  private addAmbientOverlay(layerChildren: Phaser.GameObjects.GameObject[], overlay: AmbientOverlayDefinition): void {
    const gameObject =
      overlay.kind === "ellipse"
        ? this.add.ellipse(
            overlay.position.x,
            overlay.position.y,
            overlay.width,
            overlay.height,
            overlay.color,
            overlay.alpha
          )
        : this.add.rectangle(
            overlay.position.x,
            overlay.position.y,
            overlay.width,
            overlay.height,
            overlay.color,
            overlay.alpha
          );

    gameObject.setRotation(overlay.rotation ?? 0);
    gameObject.setDepth(overlay.position.y * 0.001 + (overlay.depthBias ?? -0.03));

    if (overlay.blendMode !== undefined) {
      gameObject.setBlendMode(overlay.blendMode);
    }

    if (overlay.kind === "ellipse" && overlay.strokeColor !== undefined) {
      gameObject.setStrokeStyle(overlay.strokeWidth ?? 2, overlay.strokeColor, overlay.strokeAlpha ?? 0.2);
    }

    if (overlay.pulse) {
      gameObject.setScale(1 + (overlay.pulse.phase ?? 0) * 0.0002);
      this.tweens.add({
        targets: gameObject,
        scaleX: overlay.pulse.scale,
        scaleY: overlay.pulse.scale,
        alpha: Math.min(0.28, overlay.alpha + 0.04),
        duration: overlay.pulse.duration,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
        delay: overlay.pulse.phase ?? 0
      });
    }

    if (overlay.drift) {
      this.tweens.add({
        targets: gameObject,
        x: overlay.position.x + (overlay.drift.x ?? 0),
        y: overlay.position.y + (overlay.drift.y ?? 0),
        duration: overlay.drift.duration,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
        delay: overlay.drift.phase ?? 0
      });
    }

    layerChildren.push(gameObject);
  }

  private isPointNearCamera(position: { x: number; y: number }, margin = OVERLAY_CULL_MARGIN): boolean {
    const worldView = this.cameras.main.worldView;
    return Phaser.Geom.Rectangle.Overlaps(
      worldView,
      new Phaser.Geom.Rectangle(position.x - margin, position.y - margin, margin * 2, margin * 2)
    );
  }

  private getRenderableEnemies(enemies: EnemyState[], limit: number, includePatrol = true): EnemyState[] {
    return enemies
      .filter((enemy) => this.isPointNearCamera(enemy.position))
      .filter((enemy) => includePatrol || enemy.awareness !== "patrol" || enemy.alert || enemy.health < enemy.maxHealth)
      .sort((left, right) => {
        const leftPriority =
          (left.alert ? 3 : 0) +
          (left.awareness === "engaged" ? 3 : left.awareness === "investigating" ? 2 : 1) +
          (left.health < left.maxHealth ? 1 : 0);
        const rightPriority =
          (right.alert ? 3 : 0) +
          (right.awareness === "engaged" ? 3 : right.awareness === "investigating" ? 2 : 1) +
          (right.health < right.maxHealth ? 1 : 0);
        return rightPriority - leftPriority;
      })
      .slice(0, limit);
  }

  private getRenderableSupports(supports: FrontlineSupportState[]): FrontlineSupportState[] {
    return supports.filter((support) => this.isPointNearCamera(support.position, 240));
  }

  private getRenderableIncidents(incidents: FrontlineIncidentState[]): FrontlineIncidentState[] {
    return incidents.filter((incident) => this.isPointNearCamera(incident.position, 260));
  }

  private isSupportRepresentedByFriendlyCombatant(
    support: FrontlineSupportState,
    friendlyCombatants: ReadonlyArray<{ ownerKind: "squadmate" | "support" | "incident" | "camp-garrison"; ownerId: string | number }>
  ): boolean {
    return (
      (support.playerEscort && friendlyCombatants.some((combatant) => combatant.ownerKind === "squadmate")) ||
      (support.kind === "fireteam" &&
        friendlyCombatants.some((combatant) => combatant.ownerKind === "support" && combatant.ownerId === support.id))
    );
  }

  private isIncidentRepresentedByFriendlyCombatant(
    incident: FrontlineIncidentState,
    friendlyCombatants: ReadonlyArray<{ ownerKind: "squadmate" | "support" | "incident" | "camp-garrison"; ownerId: string | number }>
  ): boolean {
    return (
      incident.kind === "firefight" &&
      friendlyCombatants.some((combatant) => combatant.ownerKind === "incident" && combatant.ownerId === incident.id)
    );
  }

  private getRenderableTracers(tracers: FrontlineTracerState[]): FrontlineTracerState[] {
    return tracers.filter((tracer) => this.isPointNearCamera(tracer.position, 220));
  }

  private getRenderableImpacts(impacts: FrontlineImpactState[]): FrontlineImpactState[] {
    return impacts.filter((impact) => this.isPointNearCamera(impact.position, 180));
  }

  private getRenderableGrenades(grenades: GrenadeState[]): GrenadeState[] {
    return grenades.filter((grenade) => this.isPointNearCamera(grenade.position, 200) || this.isPointNearCamera(grenade.target, 220));
  }

  private drawTownWarCampArt(): void {
    const snapshot = townWarController.getSnapshot();
    const pulse = (Math.sin(this.time.now / 420) + 1) * 0.5;
    let campLabelCount = 0;

    this.drawTownWarFieldworks(snapshot, pulse);

    for (const camp of snapshot.camps) {
      if (!camp.destroyed && this.isPointNearCamera(camp.spawn.position, 430)) {
        campLabelCount = this.drawTownWarCampStatusRing(camp, snapshot.soldiers, snapshot.casualties, pulse, campLabelCount);
      }
    }
    this.hideUnusedObjectiveLabels(this.townWarCampLabels, campLabelCount);
  }

  private drawTownWarFieldworks(snapshot: ReturnType<typeof townWarController.getSnapshot>, pulse: number): void {
    const graphics = this.townWarCampGraphics;
    const preview = townWarController.getBuildPlacementPreview();
    let fieldworkLabelCount = 0;
    const getTrenchGroupId = (sourceId: string | null): string | null => {
      if (!sourceId) {
        return null;
      }
      return sourceId.split(":slot-")[0] ?? sourceId;
    };
    const trenchGroups = new Map<
      string,
      {
        x: number;
        y: number;
        count: number;
        occupied: number;
        occupiedIds: string[];
        faction: "camp-a" | "camp-b" | null;
        angle: number;
        protection: number;
        slots: (typeof snapshot.aiTactics.coverSlots)[number][];
      }
    >();
    for (const slot of snapshot.aiTactics.coverSlots) {
      if (slot.sourceKind !== "trench") {
        continue;
      }
      const groupId = getTrenchGroupId(slot.sourceId) ?? slot.id;
      const group =
        trenchGroups.get(groupId) ??
        {
          x: 0,
          y: 0,
          count: 0,
          occupied: 0,
          occupiedIds: [],
          faction: slot.faction,
          angle: Number.isFinite(slot.facingAngleRadians) ? slot.facingAngleRadians : slot.facing === "camp-a" ? Math.PI : 0,
          protection: slot.protection,
          slots: []
        };
      group.x += slot.position.x;
      group.y += slot.position.y;
      group.count += 1;
      group.protection = Math.max(group.protection, slot.protection);
      group.slots.push(slot);
      if (slot.occupiedBySoldierId !== null) {
        group.occupied += 1;
        group.occupiedIds.push(slot.occupiedBySoldierId);
      }
      trenchGroups.set(groupId, group);
    }
    const labeledTrenchGroups = new Set<string>();
    const completedImpactLabels = new Set<string>();
    const combatProofLabels = new Set<string>();
    const drawTrenchFootprint = (
      x: number,
      y: number,
      angle: number,
      color: number,
      accent: number,
      alpha: number,
      state: "ghost" | "rough" | "complete" | "occupied" | "damaged",
      occupiedCount = 0
    ): void => {
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);
      const nx = -dy;
      const ny = dx;
      const halfLength = 56;
      const isGhost = state === "ghost";
      const isRough = state === "rough";
      const isOccupied = state === "occupied";
      const trenchAlpha = isGhost ? alpha * 0.62 : alpha;
      const rimColor = isRough ? 0x6b4a24 : 0x5b3a1b;
      const darkMud = state === "damaged" ? 0x09090b : 0x111827;
      const wetMud = state === "damaged" ? 0x2b1d15 : 0x3f2a16;
      const lipWidth = isRough ? 14 : 19;
      const cutWidth = isRough ? 7 : 11;

      graphics.fillStyle(0x020617, trenchAlpha * 0.24);
      graphics.fillEllipse(x, y + 10, 150, 54);
      graphics.lineStyle(lipWidth + 10, 0x1f1308, trenchAlpha * 0.22);
      graphics.lineBetween(x - dx * (halfLength + 8), y - dy * (halfLength + 8), x + dx * (halfLength + 8), y + dy * (halfLength + 8));
      graphics.lineStyle(lipWidth, rimColor, trenchAlpha * (isGhost ? 0.52 : 0.92));
      graphics.lineBetween(x - dx * halfLength, y - dy * halfLength, x + dx * halfLength, y + dy * halfLength);
      graphics.lineStyle(lipWidth - 5, wetMud, trenchAlpha * 0.9);
      graphics.lineBetween(x - dx * 54, y - dy * 54, x + dx * 54, y + dy * 54);
      graphics.lineStyle(cutWidth, darkMud, Math.min(0.98, trenchAlpha + 0.14));
      graphics.lineBetween(x - dx * 51, y - dy * 51, x + dx * 51, y + dy * 51);
      graphics.lineStyle(3, color, isOccupied ? 0.94 : Math.max(0.3, trenchAlpha * 0.54));
      graphics.lineBetween(x - dx * 56 + nx * -10, y - dy * 56 + ny * -10, x + dx * 56 + nx * -10, y + dy * 56 + ny * -10);
      graphics.lineBetween(x - dx * 56 + nx * 10, y - dy * 56 + ny * 10, x + dx * 56 + nx * 10, y + dy * 56 + ny * 10);

      graphics.lineStyle(2, 0x8b5e34, trenchAlpha * 0.62);
      for (let offset = -45; offset <= 45; offset += 15) {
        const wobble = Math.sin(offset * 1.7) * 2;
        graphics.lineBetween(
          x + dx * offset + nx * (-17 + wobble),
          y + dy * offset + ny * (-17 + wobble),
          x + dx * (offset + 8) + nx * (-13 + wobble),
          y + dy * (offset + 8) + ny * (-13 + wobble)
        );
        graphics.lineBetween(
          x + dx * offset + nx * (17 - wobble),
          y + dy * offset + ny * (17 - wobble),
          x + dx * (offset + 8) + nx * (13 - wobble),
          y + dy * (offset + 8) + ny * (13 - wobble)
        );
      }

      graphics.lineStyle(2, accent, Math.max(0.26, trenchAlpha * 0.5 + pulse * 0.1));
      for (let offset = -36; offset <= 36; offset += 18) {
        const cx = x + dx * offset;
        const cy = y + dy * offset;
        graphics.lineBetween(cx - nx * 12, cy - ny * 12, cx + nx * 12, cy + ny * 12);
      }

      graphics.lineStyle(2, accent, Math.max(0.34, trenchAlpha * 0.56));
      graphics.lineBetween(x + dx * 66 - nx * 11, y + dy * 66 - ny * 11, x + dx * 66 + nx * 11, y + dy * 66 + ny * 11);

      graphics.fillStyle(accent, isGhost ? 0.28 : 0.7);
      graphics.fillTriangle(x + nx * 30, y + ny * 30, x + nx * 20 - dx * 7, y + ny * 20 - dy * 7, x + nx * 20 + dx * 7, y + ny * 20 + dy * 7);
      if (occupiedCount > 0) {
        graphics.fillStyle(0x0f172a, 0.78);
        graphics.fillRoundedRect(x - 16, y - 13, 32, 16, 5);
        graphics.lineStyle(2, accent, 0.84);
        graphics.strokeRoundedRect(x - 16, y - 13, 32, 16, 5);
      }
    };
    const drawDugoutFootprint = (
      x: number,
      y: number,
      angle: number,
      color: number,
      alpha: number,
      status: "ghost" | "building" | "active" | "contested" | "damaged" | "destroyed"
    ): void => {
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);
      const nx = -dy;
      const ny = dx;
      const fill = status === "contested" ? 0x7f1d1d : status === "damaged" || status === "destroyed" ? 0x292524 : 0x3f2a16;
      const rim = status === "contested" ? 0xfb7185 : status === "damaged" || status === "destroyed" ? 0xf97316 : color;
      graphics.fillStyle(0x020617, alpha * 0.28);
      graphics.fillEllipse(x, y + 14, 106, 52);
      graphics.fillStyle(fill, alpha * 0.82);
      graphics.fillRoundedRect(x - 36, y - 24, 72, 48, 7);
      graphics.lineStyle(4, 0x111827, alpha * 0.72);
      graphics.strokeRoundedRect(x - 38, y - 26, 76, 52, 7);
      graphics.lineStyle(2, rim, status === "ghost" ? alpha * 0.64 : alpha);
      graphics.strokeRoundedRect(x - 34, y - 22, 68, 44, 6);
      graphics.lineStyle(3, rim, alpha * 0.72);
      graphics.lineBetween(x + dx * 8 - nx * 24, y + dy * 8 - ny * 24, x + dx * 8 + nx * 24, y + dy * 8 + ny * 24);
      graphics.fillStyle(rim, alpha * 0.86);
      graphics.fillTriangle(x + dx * 46, y + dy * 46, x + dx * 28 + nx * 8, y + dy * 28 + ny * 8, x + dx * 28 - nx * 8, y + dy * 28 - ny * 8);
    };
    const getTrenchSlotUsers = (
      slot: (typeof snapshot.aiTactics.coverSlots)[number]
    ): {
      occupant: (typeof snapshot.soldiers)[number] | null;
      mover: (typeof snapshot.soldiers)[number] | null;
      reserver: (typeof snapshot.soldiers)[number] | null;
    } => {
      const occupant =
        slot.occupiedBySoldierId
          ? snapshot.soldiers.find(
              (soldier) =>
                soldier.id === slot.occupiedBySoldierId &&
                soldier.health.current > 0 &&
                soldier.faction === slot.faction &&
                soldier.coverIntent.coverSlotId === slot.id &&
                soldier.coverIntent.state === "occupying" &&
                Phaser.Math.Distance.Between(soldier.position.x, soldier.position.y, slot.position.x, slot.position.y) <= 48
            ) ?? null
          : null;
      const mover =
        snapshot.soldiers.find(
          (soldier) =>
            soldier.id !== occupant?.id &&
            soldier.health.current > 0 &&
            soldier.faction === slot.faction &&
            soldier.task.kind === "move" &&
            soldier.task.targetEntityId === slot.id
        ) ?? null;
      const reserver =
        snapshot.soldiers.find(
          (soldier) =>
            soldier.id !== occupant?.id &&
            soldier.id !== mover?.id &&
            soldier.health.current > 0 &&
            soldier.faction === slot.faction &&
            soldier.coverIntent.coverSlotId === slot.id
        ) ?? null;
      return { occupant, mover, reserver };
    };
    const getNearestEnemyDistanceToSlot = (slot: (typeof snapshot.aiTactics.coverSlots)[number]): number => {
      return snapshot.combatants.reduce((nearest, combatant) => {
        if (combatant.faction === slot.faction || combatant.health.current <= 0) {
          return nearest;
        }
        return Math.min(nearest, Phaser.Math.Distance.Between(slot.position.x, slot.position.y, combatant.position.x, combatant.position.y));
      }, Number.POSITIVE_INFINITY);
    };
    const getNearestEnemyToSlot = (slot: (typeof snapshot.aiTactics.coverSlots)[number]): (typeof snapshot.combatants)[number] | null => {
      return snapshot.combatants.reduce<(typeof snapshot.combatants)[number] | null>((best, combatant) => {
        if (combatant.faction === slot.faction || combatant.health.current <= 0) {
          return best;
        }
        if (!best) {
          return combatant;
        }
        return Phaser.Math.Distance.Between(slot.position.x, slot.position.y, combatant.position.x, combatant.position.y) <
          Phaser.Math.Distance.Between(slot.position.x, slot.position.y, best.position.x, best.position.y)
          ? combatant
          : best;
      }, null);
    };
    const drawTrenchSlotStateMarker = (
      slot: (typeof snapshot.aiTactics.coverSlots)[number],
      angle: number,
      state: "reserved" | "occupied" | "contested" | "abandoned",
      accent: number,
      user: (typeof snapshot.soldiers)[number] | null
    ): void => {
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);
      const nx = -dy;
      const ny = dx;
      const x = slot.position.x;
      const y = slot.position.y;
      const color = state === "occupied" ? accent : state === "reserved" ? 0x38bdf8 : state === "contested" ? 0xfb7185 : 0x94a3b8;
      const alpha = state === "abandoned" ? 0.34 : 0.74 + pulse * 0.16;

      graphics.lineStyle(state === "reserved" ? 2 : 3, color, alpha);
      graphics.strokeCircle(x + nx * 15, y + ny * 15, state === "abandoned" ? 7 : 9 + pulse * 1.2);
      if (state === "reserved") {
        graphics.lineStyle(2, color, 0.54);
        graphics.lineBetween(x - dx * 12 + nx * 15, y - dy * 12 + ny * 15, x + dx * 12 + nx * 15, y + dy * 12 + ny * 15);
        if (user) {
          graphics.lineStyle(2, color, 0.28 + pulse * 0.18);
          graphics.lineBetween(user.position.x, user.position.y, x, y);
          graphics.fillStyle(color, 0.72);
          graphics.fillTriangle(x - dx * 8, y - dy * 8, x - dx * 18 + nx * 5, y - dy * 18 + ny * 5, x - dx * 18 - nx * 5, y - dy * 18 - ny * 5);
        }
      }
      if (state === "contested") {
        graphics.lineStyle(2, color, 0.64 + pulse * 0.18);
        graphics.lineBetween(x - nx * 22 - dx * 8, y - ny * 22 - dy * 8, x - nx * 22 + dx * 8, y - ny * 22 + dy * 8);
        graphics.lineBetween(x - nx * 22 + dx * 8, y - ny * 22 - dy * 8, x - nx * 22 - dx * 8, y - ny * 22 + dy * 8);
      }
      if (state === "abandoned") {
        graphics.lineStyle(2, color, alpha);
        graphics.lineBetween(x + nx * 8 - dx * 8, y + ny * 8 - dy * 8, x + nx * 22 + dx * 8, y + ny * 22 + dy * 8);
      }
    };
    const getTrenchDirectionRead = (slot: (typeof snapshot.aiTactics.coverSlots)[number], angle: number): { text: string; color: string } => {
      const nearestEnemy = snapshot.combatants.reduce<(typeof snapshot.combatants)[number] | null>((best, combatant) => {
        if (combatant.faction === slot.faction) {
          return best;
        }
        if (!best) {
          return combatant;
        }
        return Phaser.Math.Distance.Between(slot.position.x, slot.position.y, combatant.position.x, combatant.position.y) <
          Phaser.Math.Distance.Between(slot.position.x, slot.position.y, best.position.x, best.position.y)
          ? combatant
          : best;
      }, null);

      if (!nearestEnemy) {
        return {
          text: `TRENCH HOLD\n-${Math.round(slot.protection * 72)}% PRESSURE`,
          color: getTownWarEnemyTextColor(slot.faction)
        };
      }

      const fullTurn = Math.PI * 2;
      const incomingAngle = Math.atan2(nearestEnemy.position.y - slot.position.y, nearestEnemy.position.x - slot.position.x);
      const rawDelta = Math.abs(((incomingAngle - angle) % fullTurn + fullTurn) % fullTurn);
      const delta = rawDelta > Math.PI ? fullTurn - rawDelta : rawDelta;
      const fit = Phaser.Math.Clamp(Math.abs(Math.sin(delta)), 0, 1);
      const pressureReduction = Math.round(Phaser.Math.Clamp(slot.protection * (0.22 + fit * 0.94), 0, 1) * 72);
      if (fit >= 0.72) {
        return { text: `FRONT TRENCH\n-${pressureReduction}% PRESSURE`, color: getTownWarEnemyTextColor(slot.faction) };
      }
      if (fit >= 0.38) {
        return { text: `ANGLED TRENCH\n-${pressureReduction}% PRESSURE`, color: "#fed7aa" };
      }
      return { text: "ENFILADED\nCOVER WEAK", color: "#fca5a5" };
    };
    const getTrenchSlotCallout = (
      slot: (typeof snapshot.aiTactics.coverSlots)[number],
      angle: number
    ): { text: string; color: string; state: "reserved" | "occupied" | "contested" | "abandoned"; user: (typeof snapshot.soldiers)[number] | null } => {
      const users = getTrenchSlotUsers(slot);
      const enemyDistance = getNearestEnemyDistanceToSlot(slot);
      const directionRead = getTrenchDirectionRead(slot, angle);
      const occupantPressure = users.occupant ? users.occupant.morale.pressure / Math.max(1, users.occupant.morale.maxPressure) : 0;
      if (users.occupant) {
        if (enemyDistance <= 150) {
          return { text: "CONTESTED\nCLOSE CONTACT", color: "#fca5a5", state: "contested", user: users.occupant };
        }
        if (directionRead.text.startsWith("ENFILADED")) {
          return { text: "LEAVING\nEXPOSED FLANK", color: "#fca5a5", state: "occupied", user: users.occupant };
        }
        if (occupantPressure >= 0.48) {
          return { text: "PINNED\nIN TRENCH", color: "#fde68a", state: "occupied", user: users.occupant };
        }
        return { text: "HOLDING\nFIRING SLIT", color: getTownWarEnemyTextColor(slot.faction), state: "occupied", user: users.occupant };
      }
      if (users.mover || users.reserver) {
        const user = users.mover ?? users.reserver;
        return {
          text: users.mover ? "TAKING\nTRENCH" : "RESERVED\nFIRING BAY",
          color: "#bae6fd",
          state: "reserved",
          user
        };
      }
      if (enemyDistance <= 150) {
        return { text: "CONTESTED\nNO HOLDER", color: "#fca5a5", state: "contested", user: null };
      }
      return { text: "EMPTY\nNO DEFENDER", color: "#cbd5e1", state: "abandoned", user: null };
    };
    const getTrenchCombatProof = (
      slot: (typeof snapshot.aiTactics.coverSlots)[number],
      angle: number
    ): { text: string; color: string; tone: "good" | "warn" | "bad"; occupant: (typeof snapshot.soldiers)[number] | null } | null => {
      const users = getTrenchSlotUsers(slot);
      const occupant = users.occupant;
      if (!occupant) {
        return null;
      }

      const directionRead = getTrenchDirectionRead(slot, angle);
      const nearestEnemy = getNearestEnemyToSlot(slot);
      const pressureRatio = occupant.morale.pressure / Math.max(1, occupant.morale.maxPressure);
      const pressureSaved = Math.round(slot.protection * (directionRead.text.startsWith("FRONT") ? 68 : directionRead.text.startsWith("ANGLED") ? 42 : 14));
      if (directionRead.text.startsWith("ENFILADED")) {
        return { text: "FLANKED\nCOVER WEAK", color: "#fca5a5", tone: "bad", occupant };
      }
      if (nearestEnemy && Phaser.Math.Distance.Between(slot.position.x, slot.position.y, nearestEnemy.position.x, nearestEnemy.position.y) <= 360) {
        return {
          text: directionRead.text.startsWith("FRONT")
            ? `PRESSURE REDUCED\nBY TRENCH -${pressureSaved}%`
            : `ANGLED COVER\n-${pressureSaved}% PRESSURE`,
          color: directionRead.text.startsWith("FRONT") ? "#bbf7d0" : "#fed7aa",
          tone: directionRead.text.startsWith("FRONT") ? "good" : "warn",
          occupant
        };
      }
      if (pressureRatio >= 0.18) {
        return {
          text: directionRead.text.startsWith("FRONT") ? `FRONT PROTECTED\n-${pressureSaved}% PRESSURE` : `PARTIAL COVER\n-${pressureSaved}% PRESSURE`,
          color: directionRead.text.startsWith("FRONT") ? "#bbf7d0" : "#fed7aa",
          tone: directionRead.text.startsWith("FRONT") ? "good" : "warn",
          occupant
        };
      }
      return null;
    };
    const drawTrenchCombatProof = (
      slot: (typeof snapshot.aiTactics.coverSlots)[number],
      angle: number,
      groupId: string,
      proof: NonNullable<ReturnType<typeof getTrenchCombatProof>>
    ): void => {
      const color = proof.tone === "good" ? 0x22c55e : proof.tone === "warn" ? 0xfacc15 : 0xfb7185;
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);
      const nearestEnemy = getNearestEnemyToSlot(slot);
      graphics.lineStyle(3, color, 0.5 + pulse * 0.22);
      graphics.strokeCircle(slot.position.x, slot.position.y, proof.tone === "bad" ? 34 + pulse * 6 : 28 + pulse * 4);
      graphics.lineStyle(2, color, 0.36 + pulse * 0.16);
      graphics.lineBetween(slot.position.x - dx * 34, slot.position.y - dy * 34, slot.position.x + dx * 34, slot.position.y + dy * 34);
      if (nearestEnemy) {
        graphics.lineStyle(2, color, proof.tone === "bad" ? 0.34 : 0.22);
        graphics.lineBetween(nearestEnemy.position.x, nearestEnemy.position.y, slot.position.x, slot.position.y);
      }
      if (combatProofLabels.has(groupId)) {
        return;
      }
      combatProofLabels.add(groupId);
      this.syncObjectiveLabel(this.townWarFieldworkLabels, fieldworkLabelCount, {
        x: slot.position.x,
        y: slot.position.y + 58,
        text: proof.text,
        color: proof.color,
        fontSize: "10px",
        scrollFixed: false,
        originX: 0.5,
        originY: 0
      });
      fieldworkLabelCount += 1;
    };
    const getAmmoSuppressionProof = (
      crate: (typeof snapshot.ammoCrates)[number]
    ): { text: string; color: string; suppressorCount: number } | null => {
      if (crate.maxAmmo <= 0 || crate.ammo <= 0) {
        return null;
      }
      const suppressors = snapshot.soldiers.filter(
        (soldier) =>
          soldier.faction === crate.faction &&
          soldier.health.current > 0 &&
          soldier.task.kind === "suppress" &&
          soldier.ammo.inMag + soldier.ammo.reserve > 0 &&
          Phaser.Math.Distance.Between(soldier.position.x, soldier.position.y, crate.position.x, crate.position.y) <= 360
      );
      if (suppressors.length <= 0) {
        return null;
      }
      const ammoRatio = crate.ammo / Math.max(1, crate.maxAmmo);
      return {
        text: ammoRatio >= 0.25 ? `AMMO KEPT\nSUPPRESSION ALIVE x${suppressors.length}` : `AMMO LOW\nSUPPRESSION FADING x${suppressors.length}`,
        color: ammoRatio >= 0.25 ? "#bbf7d0" : "#fde68a",
        suppressorCount: suppressors.length
      };
    };
    const drawBuildTravelRead = (
      order: (typeof snapshot.orders)[number],
      builder: (typeof snapshot.soldiers)[number] | null,
      color: number,
      progressRatio: number,
      status: string
    ): void => {
      const site = order.position;
      if (!builder) {
        graphics.lineStyle(2, 0xfb7185, 0.58 + pulse * 0.18);
        graphics.strokeCircle(site.x, site.y, 48 + pulse * 5);
        graphics.lineStyle(2, 0xfb7185, 0.44);
        graphics.lineBetween(site.x - 14, site.y - 14, site.x + 14, site.y + 14);
        graphics.lineBetween(site.x + 14, site.y - 14, site.x - 14, site.y + 14);
        return;
      }

      const distance = Phaser.Math.Distance.Between(builder.position.x, builder.position.y, site.x, site.y);
      const enRoute = distance > 14;
      const lineColor = order.build.stalled ? 0xfb7185 : order.build.coverFireSupport >= 0.45 ? 0x22c55e : color;
      graphics.lineStyle(enRoute ? 3 : 2, lineColor, enRoute ? 0.42 + pulse * 0.18 : 0.2);
      graphics.lineBetween(builder.position.x, builder.position.y, site.x, site.y);
      const steps = enRoute ? 4 : 2;
      for (let index = 1; index <= steps; index += 1) {
        const t = index / (steps + 1);
        const dotX = Phaser.Math.Linear(builder.position.x, site.x, t);
        const dotY = Phaser.Math.Linear(builder.position.y, site.y, t);
        graphics.fillStyle(lineColor, 0.46 + pulse * 0.2);
        graphics.fillCircle(dotX, dotY, enRoute ? 3.5 : 2.5);
      }
      graphics.lineStyle(2, lineColor, 0.56 + pulse * 0.16);
      graphics.strokeCircle(builder.position.x, builder.position.y, enRoute ? 13 + pulse * 2 : 9 + pulse * 1.4);
      graphics.fillStyle(lineColor, 0.72);
      graphics.fillCircle(builder.position.x, builder.position.y, 4 + pulse);
      graphics.lineStyle(2, lineColor, 0.72);
      graphics.strokeCircle(site.x, site.y, 26 + progressRatio * 18 + pulse * 3);
      if (status === "DIGGING" || status === "COVERED DIG") {
        graphics.lineStyle(2, lineColor, 0.68 + pulse * 0.18);
        graphics.lineBetween(site.x - 12, site.y - 34, site.x + 12, site.y - 18);
        graphics.lineBetween(site.x + 12, site.y - 34, site.x - 12, site.y - 18);
      }
    };
    const drawBuildCompletionPulse = (
      impact: (typeof snapshot.aiTactics.completedConstructionImpact)[number],
      slot: (typeof snapshot.aiTactics.coverSlots)[number],
      order: (typeof snapshot.orders)[number] | null
    ): void => {
      const age = snapshot.clock.seconds - impact.createdAtSeconds;
      if (age < 0 || age > 8 || !this.isPointNearCamera(slot.position, 260)) {
        return;
      }
      const t = Phaser.Math.Clamp(age / 8, 0, 1);
      const color = getTownWarFactionAccent(impact.faction);
      const alpha = (1 - t) * 0.74;
      graphics.lineStyle(3, color, alpha);
      graphics.strokeCircle(slot.position.x, slot.position.y, 32 + t * 42);
      graphics.lineStyle(2, 0xe5e7eb, alpha * 0.62);
      graphics.strokeCircle(slot.position.x, slot.position.y, 18 + t * 20);
      if (age <= 3.4 && !completedImpactLabels.has(impact.orderId)) {
        completedImpactLabels.add(impact.orderId);
        const label = order?.build.outcomeCause ? order.build.outcomeCause.split("-").join(" ").toUpperCase() : "BUILD COMPLETE";
        this.syncObjectiveLabel(this.townWarFieldworkLabels, fieldworkLabelCount, {
          x: slot.position.x,
          y: slot.position.y - 58,
          text: `COMPLETE\n${label}`,
          color: getTownWarFactionTextColor(impact.faction),
          fontSize: "10px",
          scrollFixed: false,
          originX: 0.5,
          originY: 1
        });
        fieldworkLabelCount += 1;
      }
    };

    if (preview.position && this.isPointNearCamera(preview.position, 260)) {
      const color = getTownWarFactionAccent(preview.faction);
      const x = preview.position.x;
      const y = preview.position.y;
      if (preview.kind === "trench") {
        drawTrenchFootprint(
          x,
          y,
          preview.facingAngleRadians,
          color,
          getTownWarFactionAccent(preview.faction),
          0.38 + pulse * 0.12,
          "ghost"
        );
        graphics.lineStyle(2, color, preview.valid ? 0.78 : 0.34);
        graphics.strokeCircle(x, y, 34 + pulse * 3);
        graphics.fillStyle(color, 0.76);
        graphics.fillCircle(x, y - 24, 4 + pulse * 1.5);
      } else if (preview.kind === "ammo-crate") {
        graphics.fillStyle(0x020617, 0.22);
        graphics.fillEllipse(x, y + 12, 82, 40);
        graphics.lineStyle(2, color, preview.valid ? 0.82 : 0.36);
        graphics.strokeRoundedRect(x - 28, y - 22, 56, 40, 6);
        graphics.fillStyle(0x92400e, 0.28 + pulse * 0.08);
        graphics.fillRoundedRect(x - 25, y - 19, 50, 34, 5);
        graphics.lineStyle(2, color, 0.52);
        graphics.lineBetween(x - 20, y - 5, x + 20, y - 5);
        graphics.fillStyle(color, 0.78);
        graphics.fillCircle(x, y - 28, 4 + pulse * 1.5);
      } else if (preview.kind === "dugout") {
        drawDugoutFootprint(x, y, preview.facingAngleRadians, color, 0.38 + pulse * 0.12, "ghost");
        graphics.lineStyle(2, color, preview.valid ? 0.78 : 0.34);
        graphics.strokeCircle(x, y, 42 + pulse * 3);
      }
    }

    for (const order of snapshot.orders) {
      if (order.status !== "assigned" || !this.isPointNearCamera(order.position, 240)) {
        continue;
      }

      const progressRatio =
        order.build.requiredProgress > 0 ? Phaser.Math.Clamp(order.build.progress / order.build.requiredProgress, 0, 1) : 0;
      const color = getTownWarFactionAccent(order.faction);
      const progressPercent = Math.round(progressRatio * 100);
      const builder = order.assignedSoldierId
        ? snapshot.soldiers.find((soldier) => soldier.id === order.assignedSoldierId) ?? null
        : null;
      const builderDistance = builder ? Phaser.Math.Distance.Between(builder.position.x, builder.position.y, order.position.x, order.position.y) : Number.POSITIVE_INFINITY;
      const buildStatus = !builder
        ? "NO BUILDER"
        : order.build.stalled
          ? "STALLED"
          : order.build.buildRate > 0
            ? order.build.coverFireSupport >= 0.45
              ? "COVERED DIG"
              : "DIGGING"
            : builderDistance > 14
              ? "BUILDER EN ROUTE"
              : "SETTING TOOLS";
      const buildStatusColor = order.build.stalled ? "#fca5a5" : order.build.buildRate > 0 ? "#bbf7d0" : "#fde68a";
      const supportRead =
        order.build.supportAmmoState === "dry"
          ? "AMMO SUPPORT DRY"
          : order.build.supportAmmoState === "low"
            ? "AMMO SUPPORT LOW"
            : order.build.coverFireSupport >= 0.45
              ? "SUPPRESSED COVER"
              : order.build.coverFireSupport > 0
                ? "LIGHT COVER FIRE"
                : "NO COVER FIRE";
      const failureRead = !builder
        ? "NO BUILDER"
        : order.build.stalled
          ? order.build.stallReason?.toUpperCase() ?? "STALLED"
          : order.build.supportAmmoState === "dry"
            ? "NO AMMO COVER"
            : order.build.exposure >= 0.7 && order.build.coverFireSupport < 0.25
              ? "EXPOSED WORK"
              : supportRead;
      drawBuildTravelRead(order, builder, color, progressRatio, buildStatus);
      if (order.kind === "trench") {
        const angle = Number.isFinite(order.facingAngleRadians) ? order.facingAngleRadians : order.faction === "camp-a" ? Math.PI : 0;
        const dx = Math.cos(angle);
        const dy = Math.sin(angle);
        drawTrenchFootprint(order.position.x, order.position.y, angle, color, 0xe5e7eb, 0.3 + progressRatio * 0.38, "rough");
        graphics.lineStyle(2, color, 0.42 + pulse * 0.18);
        graphics.fillStyle(color, 0.56);
        graphics.fillCircle(order.position.x - dx * 48 + dx * 96 * progressRatio, order.position.y - dy * 48 + dy * 96 * progressRatio, 4 + pulse * 1.5);
        graphics.lineStyle(3, color, 0.32);
        graphics.lineBetween(order.position.x - dx * 48, order.position.y - dy * 48 + 24, order.position.x - dx * 48 + dx * 96 * progressRatio, order.position.y - dy * 48 + dy * 96 * progressRatio + 24);
        graphics.fillStyle(0x0f172a, 0.78);
        graphics.fillRoundedRect(order.position.x - 56, order.position.y + 42, 112, 12, 4);
        graphics.fillStyle(order.build.stalled ? 0xef4444 : order.build.coverFireSupport >= 0.45 ? 0x22c55e : color, 0.82);
        graphics.fillRoundedRect(order.position.x - 53, order.position.y + 45, Math.max(6, 106 * progressRatio), 6, 3);
        graphics.lineStyle(2, order.build.stalled ? 0xfb7185 : 0xfacc15, 0.42 + progressRatio * 0.42);
        graphics.lineBetween(order.position.x - dx * 50, order.position.y - dy * 50 - 18, order.position.x - dx * 50 + dx * 100 * progressRatio, order.position.y - dy * 50 + dy * 100 * progressRatio - 18);
        if (progressRatio >= 0.25) {
          graphics.lineStyle(2, 0x111827, 0.7);
          graphics.lineBetween(order.position.x - dx * 35, order.position.y - dy * 35, order.position.x - dx * 35 + dx * 70 * progressRatio, order.position.y - dy * 35 + dy * 70 * progressRatio);
        }
        this.syncObjectiveLabel(this.townWarFieldworkLabels, fieldworkLabelCount, {
          x: order.position.x,
          y: order.position.y - 78,
          text: `${buildStatus}\n${progressPercent}% ${failureRead}\n${order.build.buildRate}/s`,
          color: buildStatusColor,
          fontSize: "10px",
          scrollFixed: false,
          originX: 0.5,
          originY: 1
        });
        fieldworkLabelCount += 1;
      } else if (order.kind === "dugout") {
        const angle = Number.isFinite(order.facingAngleRadians) ? order.facingAngleRadians : order.faction === "camp-a" ? Math.PI : 0;
        drawDugoutFootprint(order.position.x, order.position.y, angle, color, 0.32 + progressRatio * 0.42, "building");
        graphics.fillStyle(color, 0.62);
        graphics.fillRoundedRect(order.position.x - 26, order.position.y + 31, 52 * progressRatio, 5, 2);
        this.syncObjectiveLabel(this.townWarFieldworkLabels, fieldworkLabelCount, {
          x: order.position.x,
          y: order.position.y - 54,
          text: `${buildStatus}\n${progressPercent}% ${failureRead}\n${order.build.buildRate}/s`,
          color: buildStatusColor,
          fontSize: "10px",
          scrollFixed: false,
          originX: 0.5,
          originY: 1
        });
        fieldworkLabelCount += 1;
      } else if (order.kind === "ammo-crate") {
        graphics.fillStyle(0x020617, 0.28);
        graphics.fillEllipse(order.position.x, order.position.y + 10, 62, 32);
        graphics.lineStyle(2, color, 0.48 + pulse * 0.16);
        graphics.strokeRoundedRect(order.position.x - 22, order.position.y - 18, 44, 32, 5);
        graphics.fillStyle(0x92400e, 0.36);
        graphics.fillRoundedRect(order.position.x - 19, order.position.y - 15, 38, 26, 4);
        graphics.fillStyle(color, 0.6);
        graphics.fillRoundedRect(order.position.x - 20, order.position.y + 18, 40 * progressRatio, 4, 2);
        this.syncObjectiveLabel(this.townWarFieldworkLabels, fieldworkLabelCount, {
          x: order.position.x,
          y: order.position.y - 42,
          text: `${buildStatus}\n${progressPercent}% ${failureRead}\n${order.build.buildRate}/s`,
          color: buildStatusColor,
          fontSize: "10px",
          scrollFixed: false,
          originX: 0.5,
          originY: 1
        });
        fieldworkLabelCount += 1;
      }
    }

    for (const dugout of snapshot.dugouts) {
      if (!this.isPointNearCamera(dugout.position, 260)) {
        continue;
      }
      const color = getTownWarFactionAccent(dugout.faction);
      const status = dugout.status === "destroyed" ? "destroyed" : dugout.status === "contested" ? "contested" : dugout.status === "damaged" ? "damaged" : "active";
      drawDugoutFootprint(dugout.position.x, dugout.position.y, dugout.facingAngleRadians, color, 0.84, status);
      const healthRatio = dugout.maxHealth > 0 ? Phaser.Math.Clamp(dugout.health / dugout.maxHealth, 0, 1) : 0;
      graphics.fillStyle(0x0f172a, 0.78);
      graphics.fillRoundedRect(dugout.position.x - 32, dugout.position.y + 34, 64, 7, 3);
      graphics.fillStyle(status === "contested" || status === "damaged" ? 0xf97316 : 0x22c55e, 0.82);
      graphics.fillRoundedRect(dugout.position.x - 30, dugout.position.y + 36, 60 * healthRatio, 3, 2);
      graphics.lineStyle(2, status === "contested" ? 0xfb7185 : color, 0.48 + pulse * 0.18);
      graphics.strokeCircle(dugout.position.x, dugout.position.y, dugout.rallyRadius * 0.12 + pulse * 3);
      const read =
        dugout.status === "contested"
          ? "DUGOUT CONTESTED"
          : dugout.status === "damaged" || dugout.status === "destroyed"
            ? "POSITION COLLAPSING"
            : dugout.shelteringSoldierIds.length > 0
              ? "WOUNDED SHELTERING"
              : dugout.connectedTrenchSlotIds.length > 0
                ? "LINE SUPPLIED"
                : "RALLY ACTIVE";
      this.syncObjectiveLabel(this.townWarFieldworkLabels, fieldworkLabelCount, {
        x: dugout.position.x,
        y: dugout.position.y - 64,
        text: `${read}\nTRENCH LINKS ${dugout.connectedTrenchSlotIds.length} | SHELTER ${dugout.shelteringSoldierIds.length}`,
        color: dugout.status === "contested" || dugout.status === "damaged" || dugout.status === "destroyed" ? "#fca5a5" : "#bbf7d0",
        fontSize: "10px",
        scrollFixed: false,
        originX: 0.5,
        originY: 1
      });
      fieldworkLabelCount += 1;
    }

    for (const crate of snapshot.ammoCrates) {
      if (crate.destroyedAtSeconds !== null || !this.isPointNearCamera(crate.position, 240)) {
        continue;
      }

      const color = getTownWarFactionColor(crate.faction);
      const accent = getTownWarFactionAccent(crate.faction);
      const ammoRatio = crate.maxAmmo > 0 ? Phaser.Math.Clamp(crate.ammo / crate.maxAmmo, 0, 1) : 0;
      const x = crate.position.x;
      const y = crate.position.y;
      graphics.fillStyle(0x020617, 0.34);
      graphics.fillEllipse(x, y + 12, 72, 34);
      graphics.fillStyle(0x78350f, 0.82);
      graphics.fillRoundedRect(x - 24, y - 18, 48, 34, 5);
      graphics.lineStyle(3, color, 0.74);
      graphics.strokeRoundedRect(x - 24, y - 18, 48, 34, 5);
      graphics.lineStyle(2, accent, 0.62 + pulse * 0.18);
      graphics.lineBetween(x - 18, y - 5, x + 18, y - 5);
      graphics.fillStyle(accent, 0.78);
      graphics.fillRoundedRect(x - 22, y + 21, 44 * ammoRatio, 5, 2);
      const ammoProof = getAmmoSuppressionProof(crate);
      if (ammoProof) {
        graphics.lineStyle(2, ammoRatio >= 0.25 ? 0x22c55e : 0xfacc15, 0.52 + pulse * 0.18);
        graphics.strokeCircle(x, y, 35 + pulse * 5);
        this.syncObjectiveLabel(this.townWarFieldworkLabels, fieldworkLabelCount, {
          x,
          y: y + 42,
          text: ammoProof.text,
          color: ammoProof.color,
          fontSize: "10px",
          scrollFixed: false,
          originX: 0.5,
          originY: 0
        });
        fieldworkLabelCount += 1;
      }
    }

    for (const impact of snapshot.aiTactics.completedConstructionImpact) {
      const slot = snapshot.aiTactics.coverSlots.find((candidate) => candidate.id === impact.coverSlotId) ?? null;
      if (!slot) {
        continue;
      }
      const order = snapshot.orders.find((candidate) => candidate.id === impact.orderId) ?? null;
      drawBuildCompletionPulse(impact, slot, order);
    }

    for (const [groupId, group] of trenchGroups) {
      if (group.count <= 0) {
        continue;
      }
      const x = group.x / group.count;
      const y = group.y / group.count;
      if (!this.isPointNearCamera({ x, y }, 280)) {
        continue;
      }
      const color = getTownWarFactionColor(group.faction);
      const accent = getTownWarFactionAccent(group.faction);
      const groupCallouts = group.slots.map((slot) => getTrenchSlotCallout(slot, group.angle));
      const occupiedCount = groupCallouts.filter((callout) => callout.state === "occupied").length;
      const reservedCount = groupCallouts.filter((callout) => callout.state === "reserved").length;
      const contestedCount = groupCallouts.filter((callout) => callout.state === "contested").length;
      const proofSlot =
        group.slots
          .map((slot) => ({ slot, proof: getTrenchCombatProof(slot, group.angle) }))
          .find((entry) => entry.proof?.tone === "bad") ??
        group.slots
          .map((slot) => ({ slot, proof: getTrenchCombatProof(slot, group.angle) }))
          .find((entry) => entry.proof !== null);
      const groupState = contestedCount > 0 ? "damaged" : group.occupied > 0 ? "occupied" : "complete";
      drawTrenchFootprint(x, y, group.angle, color, accent, 0.86, groupState, group.occupied);
      if (proofSlot?.proof) {
        drawTrenchCombatProof(proofSlot.slot, group.angle, groupId, proofSlot.proof);
      }
      if (labeledTrenchGroups.has(groupId)) {
        continue;
      }
      const anchorSlot =
        group.slots.find((slot) => getTrenchSlotCallout(slot, group.angle).state === "contested") ??
        group.slots.find((slot) => slot.occupiedBySoldierId !== null) ??
        group.slots.find((slot) => getTrenchSlotCallout(slot, group.angle).state === "reserved") ??
        group.slots[0];
      if (!anchorSlot) {
        continue;
      }
      const callout = getTrenchSlotCallout(anchorSlot, group.angle);
      const directionRead = getTrenchDirectionRead(anchorSlot, group.angle);
      const groupStatus =
        occupiedCount > 0
          ? `OCCUPIED ${group.occupied}/${group.count}`
          : reservedCount > 0
            ? `RESERVED ${reservedCount}/${group.count}`
            : contestedCount > 0
              ? "CONTESTED EMPTY"
              : "EMPTY: NO NEARBY DEFENDER";
      labeledTrenchGroups.add(groupId);
      this.syncObjectiveLabel(this.townWarFieldworkLabels, fieldworkLabelCount, {
        x,
        y: y - 88,
        text: `${callout.text}\n${groupStatus}${occupiedCount > 0 ? `\n${directionRead.text}` : ""}`,
        color: callout.state === "abandoned" ? callout.color : directionRead.text.startsWith("ENFILADED") ? "#fca5a5" : callout.color,
        fontSize: "10px",
        scrollFixed: false,
        originX: 0.5,
        originY: 1
      });
      fieldworkLabelCount += 1;
    }

    for (const slot of snapshot.aiTactics.coverSlots) {
      if (slot.sourceKind !== "trench" || !this.isPointNearCamera(slot.position, 260)) {
        continue;
      }

      const accent = getTownWarFactionAccent(slot.faction);
      const occupied = slot.occupiedBySoldierId !== null;
      const x = slot.position.x;
      const y = slot.position.y;
      const angle = Number.isFinite(slot.facingAngleRadians) ? slot.facingAngleRadians : slot.facing === "camp-a" ? Math.PI : 0;
      const callout = getTrenchSlotCallout(slot, angle);
      drawTrenchSlotStateMarker(slot, angle, callout.state, accent, callout.user);
      if (occupied) {
        this.townWarCampGraphics.lineStyle(1.7, accent, 0.74);
        this.townWarCampGraphics.strokeCircle(x, y, 12);
      }
    }

    for (const story of snapshot.frontlineStories.slice(0, 5)) {
      if (!story.position || !this.isPointNearCamera(story.position, 360)) {
        continue;
      }
      const color =
        story.kind === "medic"
          ? "#bbf7d0"
          : story.kind === "resupply"
            ? "#bfdbfe"
            : story.kind === "cover"
              ? "#fde68a"
              : story.kind === "occupy"
                ? "#fef3c7"
                : "#e0f2fe";
      const actionRead =
        story.kind === "build"
          ? "finished the trench"
          : story.kind === "cover"
            ? "covered the dig"
            : story.kind === "resupply"
              ? "ran ammo"
              : story.kind === "medic"
                ? "stabilized wounded"
                : story.kind === "occupy"
                  ? "holding trench"
                  : "carries consequence";
      this.syncObjectiveLabel(this.townWarFieldworkLabels, fieldworkLabelCount, {
        x: story.position.x,
        y: story.position.y + (story.kind === "occupy" ? 82 : 104),
        text: `${story.soldierName}\n${actionRead}`,
        color,
        fontSize: "10px",
        scrollFixed: false,
        originX: 0.5,
        originY: 0
      });
      fieldworkLabelCount += 1;
    }

    this.hideUnusedObjectiveLabels(this.townWarFieldworkLabels, fieldworkLabelCount);
  }

  private drawTownWarCampStatusRing(
    camp: TownWarCampState,
    soldiers: readonly TownWarSoldierState[],
    casualties: ReturnType<typeof townWarController.getSnapshot>["casualties"],
    pulse: number,
    labelIndex: number
  ): number {
    const graphics = this.townWarCampGraphics;
    const { x, y } = camp.spawn.position;
    const healthRatio = camp.health.max > 0 ? Phaser.Math.Clamp(camp.health.current / camp.health.max, 0, 1) : 0;
    const ringColor = getTownWarFactionColor(camp.id);
    const accentColor = getTownWarFactionAccent(camp.id);
    const sustainment = camp.sustainment;
    const campSoldiers = soldiers.filter((soldier) => soldier.faction === camp.id && soldier.health.current > 0);
    const workCounts = campSoldiers.reduce(
      (counts, soldier) => {
        if (soldier.task.kind === "hold" && soldier.task.label?.toLowerCase().includes("rest")) {
          counts.rest += 1;
        } else if (counts[soldier.task.kind] !== undefined) {
          counts[soldier.task.kind] += 1;
        }
        return counts;
      },
      { build: 0, resupply: 0, heal: 0, suppress: 0, defend: 0, rest: 0 } as Record<string, number>
    );
    const activeCasualties = casualties.filter(
      (casualty) => casualty.faction === camp.id && (casualty.status === "wounded" || casualty.status === "downed")
    ).length;
    const readinessRatio = Phaser.Math.Clamp(sustainment.readiness, 0, 1);
    const ammoFlowRatio = Phaser.Math.Clamp(sustainment.ammoFlow, 0, 1);
    const needWarning =
      sustainment.warnings[0] ??
      (sustainment.fatigueAverage >= 0.58
        ? "Tired camp: slower work"
        : sustainment.hungerAverage >= 0.52
          ? "Hungry camp: brittle morale"
          : activeCasualties > 0
            ? "Medical load: recovery needed"
            : workCounts.resupply > 0
              ? "Ammo runner supplying line"
              : workCounts.build > 0
                ? "Builders shaping the line"
                : "Camp work supporting line");

    graphics.setDepth(y * 0.001 + 0.26);
    graphics.lineStyle(3, ringColor, 0.32 + pulse * 0.18);
    graphics.strokeEllipse(x, y + 8, 418, 288);
    graphics.lineStyle(2, accentColor, 0.16 + healthRatio * 0.24);
    graphics.strokeEllipse(x, y + 8, 382, 250);
    graphics.lineStyle(2, ringColor, 0.44);
    graphics.strokeCircle(x, y, 14 + pulse * 5);
    graphics.fillStyle(ringColor, 0.72);
    graphics.fillCircle(x, y, 6 + pulse * 2);
    graphics.fillStyle(0x020617, 0.72);
    graphics.fillRoundedRect(x - 58, y + 156, 116, 10, 5);
    graphics.fillStyle(ringColor, 0.82);
    graphics.fillRoundedRect(x - 56, y + 158, 112 * healthRatio, 6, 3);
    graphics.fillStyle(0x020617, 0.58);
    graphics.fillRoundedRect(x - 86, y + 170, 172, 16, 6);
    graphics.fillStyle(0x22c55e, 0.7);
    graphics.fillRoundedRect(x - 82, y + 174, 78 * readinessRatio, 4, 2);
    graphics.fillStyle(0xfacc15, 0.68);
    graphics.fillRoundedRect(x + 4, y + 174, 78 * ammoFlowRatio, 4, 2);

    this.syncObjectiveLabel(this.townWarCampLabels, labelIndex, {
      x,
      y: y - 188,
      text:
        `${isTownWarPlayerFaction(camp.id) ? "RUSSIAN PLAYER CAMP" : "UKRAINIAN ENEMY CAMP"} COLONY\n` +
        `READY ${Math.round(readinessRatio * 100)}%  AMMO ${Math.round(ammoFlowRatio * 100)}%\n` +
        `${needWarning.toUpperCase()}`,
      color: isTownWarPlayerFaction(camp.id) ? "#fde68a" : "#bfdbfe",
      fontSize: "10px",
      scrollFixed: false,
      originX: 0.5,
      originY: 1
    });
    labelIndex += 1;

    const activeWorkRead = `B${workCounts.build} R${workCounts.resupply} M${workCounts.heal} C${workCounts.suppress}`;
    this.syncObjectiveLabel(this.townWarCampLabels, labelIndex, {
      x,
      y: y + 193,
      text: `WORKERS ${activeWorkRead}  WOUNDED ${activeCasualties}`,
      color: isTownWarPlayerFaction(camp.id) ? "#bbf7d0" : "#bfdbfe",
      fontSize: "9px",
      scrollFixed: false,
      originX: 0.5,
      originY: 0
    });
    return labelIndex + 1;
  }

  private syncTownWarSoldierSprites(snapshot: ReturnType<typeof townWarController.getSnapshot>): void {
    const liveSoldierIds = new Set(snapshot.soldiers.map((soldier) => soldier.id));
    let selectedLabelCount = 0;
    let lookLabelCount = 0;
    let nearestLookSoldier:
      | {
          soldier: TownWarSoldierState;
          position: Vec2;
          distance: number;
        }
      | null = null;
    for (const [id, sprite] of this.townWarSoldierSprites) {
      if (liveSoldierIds.has(id)) {
        continue;
      }

      sprite.destroy();
      this.townWarSoldierSprites.delete(id);
    }

    for (const soldier of snapshot.soldiers) {
      let sprite = this.townWarSoldierSprites.get(soldier.id);
      if (!sprite) {
        sprite = this.add.sprite(soldier.position.x, soldier.position.y, getTownWarSoldierSpriteKey(soldier));
        this.townWarSoldierSprites.set(soldier.id, sprite);
      }

      const visible = this.isPointNearCamera(soldier.position, 150);
      sprite.setVisible(visible);
      if (!visible) {
        continue;
      }

      const healthRatio = soldier.health.current / Math.max(1, soldier.health.max);
      const baseScale = soldier.role === "suppressor" ? 1.02 : soldier.role === "builder" || soldier.role === "medic" ? 0.92 : 0.98;
      const occupantSlot =
        soldier.coverIntent.state === "occupying" && soldier.coverIntent.coverSlotId
          ? snapshot.aiTactics.coverSlots.find((slot) => slot.id === soldier.coverIntent.coverSlotId) ?? null
          : null;
      const facing = getTownWarSoldierFacing(soldier, snapshot.aiTactics.coverSlots, snapshot.combatants);
      const pose = getFriendlyCombatantRenderPose(
        {
          id: getTownWarSoldierRenderId(soldier.id),
          facing,
          pressureType: getTownWarSoldierPressureType(soldier),
          awareness: getTownWarSoldierAwareness(soldier)
        },
        this.time.now
      );
      const trenchOccupant = occupantSlot?.sourceKind === "trench" && occupantSlot.occupiedBySoldierId === soldier.id;
      const nearestEnemy = trenchOccupant ? getNearestTownWarEnemy(occupantSlot.position, soldier.faction, snapshot.combatants) : null;
      const enemyDistance = nearestEnemy && occupantSlot ? Phaser.Math.Distance.Between(occupantSlot.position.x, occupantSlot.position.y, nearestEnemy.position.x, nearestEnemy.position.y) : Number.POSITIVE_INFINITY;
      const firingFromTrench =
        trenchOccupant &&
        nearestEnemy !== null &&
        enemyDistance <= 470 &&
        soldier.health.current > 0 &&
        soldier.ammo.inMag + soldier.ammo.reserve > 0 &&
        (soldier.task.kind === "defend" ||
          soldier.task.kind === "suppress" ||
          soldier.task.kind === "attack" ||
          soldier.tacticalIntent.state === "hold-cover" ||
          soldier.tacticalIntent.state === "suppress-area" ||
          soldier.tacticalIntent.state === "reload-behind-cover");
      const trenchLipOffset = trenchOccupant ? 9 : 0;
      const position = trenchOccupant
        ? {
            x: occupantSlot.position.x + facing.x * trenchLipOffset,
            y: occupantSlot.position.y + facing.y * trenchLipOffset
          }
        : soldier.position;
      if (this.townWarLookWorld && isTownWarPlayerFaction(soldier.faction) && soldier.health.current > 0) {
        const lookDistance = Phaser.Math.Distance.Between(
          this.townWarLookWorld.x,
          this.townWarLookWorld.y,
          position.x,
          position.y
        );
        if (lookDistance <= 62 && (!nearestLookSoldier || lookDistance < nearestLookSoldier.distance)) {
          nearestLookSoldier = { soldier, position, distance: lookDistance };
        }
      }

      sprite.setPosition(position.x + pose.offsetX, position.y + pose.offsetY);
      sprite.setTexture(getTownWarSoldierSpriteKey(soldier));
      sprite.setRotation(Math.atan2(facing.y, facing.x) + pose.rotationOffset);
      sprite.setScale((trenchOccupant ? baseScale * 1.08 : baseScale) * pose.scaleX, (trenchOccupant ? baseScale * 1.08 : baseScale) * pose.scaleY);
      sprite.setTint(getTownWarSoldierTint(soldier));
      sprite.setAlpha((healthRatio <= 0 ? 0.34 : healthRatio < 0.45 ? 0.62 : trenchOccupant ? 1 : 0.94) * pose.alphaMultiplier);
      sprite.setDepth(position.y * 0.001 + (trenchOccupant ? 0.116 : 0.086));

      if (trenchOccupant) {
        const lateral = { x: -facing.y, y: facing.x };
        const accent = isTownWarPlayerFaction(soldier.faction) ? 0xfacc15 : 0x93c5fd;
        const fireSeed = Math.sin(this.time.now / (soldier.role === "suppressor" ? 76 : 118) + getTownWarSoldierRenderId(soldier.id) * 0.37);
        const weaponId = getTownWarSoldierWeaponId(soldier);
        this.frontlineSupportGraphics.lineStyle(3.2, 0x020617, 0.62);
        this.frontlineSupportGraphics.lineBetween(
          position.x - lateral.x * 13 - facing.x * 2,
          position.y - lateral.y * 13 - facing.y * 2,
          position.x + lateral.x * 13 - facing.x * 2,
          position.y + lateral.y * 13 - facing.y * 2
        );
        this.frontlineSupportGraphics.lineStyle(1.8, accent, 0.7);
        this.frontlineSupportGraphics.lineBetween(
          position.x - lateral.x * 11,
          position.y - lateral.y * 11,
          position.x + lateral.x * 11,
          position.y + lateral.y * 11
        );
        this.frontlineSupportGraphics.lineStyle(1.4, accent, 0.34);
        this.frontlineSupportGraphics.lineBetween(position.x - facing.x * 18, position.y - facing.y * 18, position.x + facing.x * 28, position.y + facing.y * 28);
        if (firingFromTrench && fireSeed > (soldier.role === "suppressor" ? -0.55 : -0.12)) {
          drawFrontlineTracerBurst(
            this.frontlineSupportGraphics,
            position,
            facing,
            accent,
            0.48 + Math.max(0, fireSeed) * 0.34,
            getFrontlineTracerDrawLength(weaponId, soldier.role === "suppressor" ? 18 : 8),
            weaponId,
            pose
          );
        }
      }

      if (this.isPointNearCamera(position, 96)) {
        drawFactionMarker(
          this.factionMarkerGraphics,
          position,
          facing,
          isTownWarPlayerFaction(soldier.faction) ? 0xef4444 : 0x60a5fa,
          soldier.coverIntent.state === "occupying" ? 0.94 : 0.68,
          soldier.coverIntent.state === "occupying" ? 1.04 : 0.86
        );
      }

      if (soldier.id === this.selectedTownWarSoldierId && isTownWarPlayerFaction(soldier.faction)) {
        const accent = getTownWarFactionAccent(soldier.faction);
        const selectedPulse = (Math.sin(this.time.now / 260) + 1) * 0.5;
        this.factionMarkerGraphics.lineStyle(2, 0x020617, 0.7);
        this.factionMarkerGraphics.strokeCircle(position.x, position.y - 2, 26 + selectedPulse * 4);
        this.factionMarkerGraphics.lineStyle(2, accent, 0.78);
        this.factionMarkerGraphics.strokeCircle(position.x, position.y - 2, 22 + selectedPulse * 4);
        this.factionMarkerGraphics.lineStyle(1, accent, 0.4);
        this.factionMarkerGraphics.strokeCircle(position.x, position.y - 2, 34 + selectedPulse * 6);
        this.syncObjectiveLabel(this.townWarSelectedSoldierLabels, selectedLabelCount, {
          x: position.x,
          y: position.y - 40,
          text: `${soldier.displayName.toUpperCase()}\n${(soldier.task.label ?? soldier.taskDecision.selectedWork ?? soldier.task.kind).toUpperCase()}`,
          color: "#fde68a",
          fontSize: "9px",
          scrollFixed: false,
          originX: 0.5,
          originY: 1
        });
        selectedLabelCount += 1;
      }
    }
    if (nearestLookSoldier && nearestLookSoldier.soldier.id !== this.selectedTownWarSoldierId) {
      const { soldier, position, distance } = nearestLookSoldier;
      const alphaPulse = Phaser.Math.Clamp(1 - distance / 62, 0.34, 0.92);
      this.factionMarkerGraphics.lineStyle(1, 0x020617, 0.5 * alphaPulse);
      this.factionMarkerGraphics.strokeCircle(position.x, position.y - 2, 20);
      this.factionMarkerGraphics.lineStyle(1, 0xfde68a, 0.42 * alphaPulse);
      this.factionMarkerGraphics.strokeCircle(position.x, position.y - 2, 18);
      this.syncObjectiveLabel(this.townWarLookSoldierLabels, lookLabelCount, {
        x: position.x,
        y: position.y - 34,
        text: `${soldier.displayName}\n${soldier.task.label ?? soldier.taskDecision.selectedWork ?? soldier.task.kind}`,
        color: "#fef3c7",
        fontSize: "8px",
        scrollFixed: false,
        originX: 0.5,
        originY: 1
      });
      lookLabelCount += 1;
    }
    this.hideUnusedObjectiveLabels(this.townWarSelectedSoldierLabels, selectedLabelCount);
    this.hideUnusedObjectiveLabels(this.townWarLookSoldierLabels, lookLabelCount);
  }

  private syncSprites(): void {
    const { player, enemies, friendlyCombatants, fallenSquadBodies, fallenEnemyBodies, bullets, grenades, frontlineTracers, frontlineImpacts, loot, intelSites, supplyCaches, extractZone, extractionReady, extractionContested, extractionHoldDuration, extractionHoldTimer, phase, activeSearch, activeIntelCapture, activeLootPickup, activeObstacleBreach, recentNoisePosition, recentNoisePulse, soundPressure, frontlineSupports, frontlineIncidents, activeFrontlineHoldZoneId, activeSquadBodyRecovery } =
      raidController.state;
    const playerInExtractZone =
      Phaser.Math.Distance.Between(player.position.x, player.position.y, extractZone.position.x, extractZone.position.y) <
      extractZone.radius - 12;
    const extractionHoldSlipping = extractionHoldTimer > 0 && !extractionContested && !playerInExtractZone;
    this.enemyIntentGraphics.clear();
    this.enemyStatusGraphics.clear();
    this.factionMarkerGraphics.clear();
    this.frontlineSupportGraphics.clear();
    this.frontlineIncidentGraphics.clear();
    this.frontlineImpactGraphics.clear();
    this.townWarCampGraphics.clear();
    this.grenadeGraphics.clear();
    this.objectiveGraphics.clear();
    this.roomStackGraphics.clear();
    this.edgeIndicatorGraphics.clear();
    this.activeSquadEscortLabelCount = 0;
    for (const sprite of this.squadMateEscortSprites.values()) {
      sprite.setVisible(false);
    }
    this.hideObjectiveLabels();
    this.hideUnusedObjectiveLabels(this.roomStackLabels, 0);
    this.hideUnusedObjectiveLabels(this.squadEscortLabels, 0);
    this.hideUnusedObjectiveLabels(this.townWarSelectedSoldierLabels, 0);
    this.hideUnusedObjectiveLabels(this.townWarLookSoldierLabels, 0);
    const renderedSupports = frontlineSupports.filter(
      (support) => !this.isSupportRepresentedByFriendlyCombatant(support, friendlyCombatants)
    );
    const renderedIncidents = frontlineIncidents.filter(
      (incident) => !this.isIncidentRepresentedByFriendlyCombatant(incident, friendlyCombatants)
    );
    const renderableSupports = this.getRenderableSupports(renderedSupports);
    const renderableIncidents = this.getRenderableIncidents(renderedIncidents);
    const renderableGrenades = this.getRenderableGrenades(grenades);
    const renderableTracers = this.getRenderableTracers(frontlineTracers);
    const renderableImpacts = this.getRenderableImpacts(frontlineImpacts);
    this.drawTownWarCampArt();
    const selectedMate = raidController.state.squadMates.find((mate) => mate.id === raidController.state.selectedSquadMateId) ?? null;
    const selectedDefendAnchor =
      selectedMate?.command.orderId === "defend" && selectedMate.command.anchor ? selectedMate.command.anchor : null;
    const selectedDefendHoldRadius =
      selectedMate?.command.orderId === "defend" ? selectedMate.command.holdRadius : 0;
    const selectedWatchTarget =
      selectedMate?.command.orderId === "brace-watch" || selectedMate?.command.orderId === "move-watch"
        ? selectedMate.command.watchTarget
        : null;
    const selectedWatchDirection =
      selectedMate?.command.orderId === "brace-watch" || selectedMate?.command.orderId === "move-watch"
        ? selectedMate.command.watchDirection
        : null;
    const selectedWatchArcDegrees =
      selectedMate?.command.orderId === "brace-watch" || selectedMate?.command.orderId === "move-watch"
        ? selectedMate.command.watchArcDegrees ?? 0
        : 0;
    const selectedTacticalAction = selectedMate?.tacticalAction ?? null;
    const selectedTacticalTarget = selectedTacticalAction?.targetPosition ?? null;
    const selectedCombatant =
      selectedMate !== null
        ? friendlyCombatants.find((combatant) => combatant.ownerKind === "squadmate" && combatant.squadMateId === selectedMate.id) ?? null
        : null;

    this.playerSprite.setPosition(player.position.x, player.position.y);
    this.playerSprite.setRotation(Math.atan2(player.facing.y, player.facing.x));
    this.playerBody.setTexture(getPlayerTextureKey(player.weaponId));
    this.playerBody.clearTint();
    this.playerSprite.setDepth(player.position.y * 0.001 + 0.1);
    this.playerSprite.setVisible(phase === "raid");
    if (phase === "raid") {
      drawFactionMarker(this.factionMarkerGraphics, player.position, player.facing, 0xef4444, 0.96, 1.2);
    }
    const playerAimProfile = getPlayerAimProfile(player.weaponId);
    this.playerAim.setPosition(playerAimProfile.x, 0);
    this.playerAim.setSize(playerAimProfile.width, playerAimProfile.height);
    this.playerAim.setFillStyle(playerAimProfile.color, playerAimProfile.alpha);

    this.extractionRing.setStrokeStyle(
      3,
      extractionContested ? 0xfb7185 : extractionHoldSlipping ? 0xf59e0b : extractionReady ? 0x4ade80 : 0x94a3b8,
      extractionContested ? 0.82 : extractionHoldSlipping ? 0.88 : extractionReady ? 0.75 : 0.22
    );
    this.extractionRing.setFillStyle(
      extractionContested ? 0x7f1d1d : extractionHoldSlipping ? 0x78350f : extractionReady ? 0x16a34a : 0x475569,
      extractionContested ? 0.18 : extractionHoldSlipping ? 0.16 : extractionReady ? 0.14 : 0.05
    );
    this.extractionRing.setPosition(extractZone.position.x, extractZone.position.y);
    this.extractionRing.setVisible(phase === "raid");
    this.extractionPulse.setPosition(extractZone.position.x, extractZone.position.y);
    this.extractionPulse.setVisible(phase === "raid" && extractionReady);

    if (extractionHoldTimer > 0) {
      const holdProgress = 1 - extractionHoldTimer / extractionHoldDuration;
      const pulseRadius = extractZone.radius + 14 + holdProgress * 18;
      this.extractionPulse.setRadius(pulseRadius);
      this.extractionPulse.setStrokeStyle(
        3,
        extractionContested ? 0xfb7185 : extractionHoldSlipping ? 0xfbbf24 : 0x4ade80,
        0.9
      );
      this.extractionPulse.setFillStyle(
        extractionContested ? 0xb91c1c : extractionHoldSlipping ? 0xf59e0b : 0x22c55e,
        extractionContested ? 0.18 + holdProgress * 0.1 : extractionHoldSlipping ? 0.16 + holdProgress * 0.08 : 0.18 + holdProgress * 0.12
      );
    } else {
      this.extractionPulse.setRadius(extractZone.radius + 16);
      this.extractionPulse.setStrokeStyle(2, extractionContested ? 0xfb7185 : 0x38bdf8, extractionContested ? 0.54 : 0.34);
      this.extractionPulse.setFillStyle(extractionContested ? 0xb91c1c : 0x38bdf8, extractionContested ? 0.12 : 0.08);
    }

    this.syncSpriteCollection(this.enemySprites, enemies, (enemy) =>
      this.add.sprite(enemy.position.x, enemy.position.y, getCombatantTextureKey(enemy.archetypeId, enemy.tapeId))
    );
    this.syncSpriteCollection(this.friendlyCombatantSprites, friendlyCombatants, (combatant) =>
      this.add.sprite(combatant.position.x, combatant.position.y, getFriendlyCombatantKey(combatant.archetypeId))
    );
    this.syncTownWarSoldierSprites(townWarController.getSnapshot());
    this.syncSpriteCollection(
      this.fallenSquadBodySprites,
      fallenSquadBodies.filter((body) => !body.recovered),
      (body) => this.add.sprite(body.position.x, body.position.y, getFriendlyCombatantKey(body.archetypeId))
    );
    this.syncSpriteCollection(this.fallenEnemyBodySprites, fallenEnemyBodies, (body) =>
      this.add.sprite(body.position.x, body.position.y, getCombatantTextureKey(body.archetypeId, body.tapeId))
    );
    this.syncSpriteCollection<BulletState>(this.bulletSprites, bullets, (bullet) => {
      const sprite = this.add.sprite(bullet.position.x, bullet.position.y, "bullet");
      sprite.setTint(bullet.faction === "friendly" ? 0xf8fafc : 0xfb7185);
      return sprite;
    });
    this.syncSpriteCollection<FrontlineTracerState>(this.frontlineTracerSprites, frontlineTracers, (tracer) => {
      const sprite = this.add.sprite(tracer.position.x, tracer.position.y, "frontline-tracer");
      sprite.setBlendMode(Phaser.BlendModes.ADD);
      sprite.setTint(tracer.color);
      return sprite;
    });
    this.syncSpriteCollection(this.lootSprites, loot, (drop) => {
      const sprite = this.add.sprite(drop.position.x, drop.position.y, "loot");
      sprite.setScale(drop.stashReward.medkits > 0 || drop.stashReward.ammoPacks > 0 ? 1.08 : 0.95);
      sprite.setTint(getLootTint(drop.category));
      this.tweens.add({
        targets: sprite,
        y: drop.position.y - 5,
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut"
      });
      return sprite;
    });
    this.syncSpriteCollection(this.intelSprites, intelSites, (site) => {
      const sprite = this.add.sprite(site.position.x, site.position.y, getPropTextureKey("uplink-terminal"));
      sprite.setScale(0.9);
      return sprite;
    });
    this.syncSpriteCollection(this.supplyCacheSprites, supplyCaches, (cache) => {
      const sprite = this.add.sprite(cache.position.x, cache.position.y, getSupplyCacheTexture(cache.kind));
      sprite.setScale(0.88);
      return sprite;
    });
    this.syncSpriteCollection(this.frontlineSupportSprites, renderedSupports, (support) => {
      const sprite = this.add.sprite(
        support.position.x,
        support.position.y,
        support.kind === "fireteam" ? getFriendlyCombatantKey(support.combatProfileId) : getFrontlineSupportTexture(support.kind)
      );
      sprite.setScale(support.kind === "convoy" ? 0.96 : support.kind === "recovery" ? 0.9 : 0.82);
      return sprite;
    });
    this.syncSpriteCollection(this.frontlineIncidentSprites, renderedIncidents, (incident) => {
      const sprite = this.add.sprite(
        incident.position.x,
        incident.position.y,
        incident.kind === "firefight" ? getCombatantTextureKey(incident.combatProfileId) : getFrontlineIncidentTexture(incident.kind)
      );
      sprite.setScale(
        incident.kind === "convoy" ? 0.78 : incident.kind === "casualty" || incident.kind === "civilian" || incident.kind === "bunker" ? 0.72 : 0.68
      );
      return sprite;
    });

    for (const enemy of enemies) {
      const sprite = this.enemySprites.get(enemy.id);
      if (!sprite) {
        continue;
      }
      const visible = this.isPointNearCamera(enemy.position, 120);
      sprite.setVisible(visible);
      if (!visible) {
        continue;
      }
      const enemyPose = getEnemyRenderPose(enemy, this.time.now);
      sprite.setPosition(enemy.position.x + enemyPose.offsetX, enemy.position.y + enemyPose.offsetY);
      sprite.setTexture(getCombatantTextureKey(enemy.archetypeId, enemy.tapeId));
      sprite.setTint(enemy.armorFlash > 0 ? 0x7dd3fc : enemy.fleshFlash > 0 ? 0xf8fafc : 0xffffff);
      const baseScale = enemy.archetypeId === "rusher" ? 1.08 : enemy.archetypeId === "rifleman" ? 1 : 0.94;
      sprite.setScale(baseScale * enemyPose.scaleX, baseScale * enemyPose.scaleY);
      sprite.setRotation(Math.atan2(enemy.facing.y, enemy.facing.x) + enemyPose.rotationOffset);
      sprite.setAlpha((enemy.alert ? 1 : 0.78) * enemyPose.alphaMultiplier);
      sprite.setDepth((enemy.position.y + enemyPose.offsetY) * 0.001 + 0.08);
      if (this.isPointNearCamera(enemy.position, 96)) {
        drawFactionMarker(this.factionMarkerGraphics, enemy.position, enemy.facing, 0x60a5fa, enemy.alert ? 0.94 : 0.72);
      }
    }

    for (const combatant of friendlyCombatants) {
      const sprite = this.friendlyCombatantSprites.get(combatant.id);
      if (!sprite) {
        continue;
      }
      const visible = this.isPointNearCamera(combatant.position, 120);
      sprite.setVisible(visible);
      if (!visible) {
        continue;
      }
      const combatantPose = getFriendlyCombatantRenderPose(combatant, this.time.now);
      const selectedCombatant =
        combatant.ownerKind === "squadmate" && raidController.state.selectedSquadMateId === combatant.squadMateId;
      sprite.setPosition(combatant.position.x + combatantPose.offsetX, combatant.position.y + combatantPose.offsetY);
      sprite.setTexture(getFriendlyCombatantKey(combatant.archetypeId));
      sprite.setTint(combatant.fleshFlash > 0 ? 0xf8fafc : selectedCombatant ? 0xfef08a : 0xffffff);
      const baseScale = combatant.archetypeId === "rusher" ? 1.08 : combatant.archetypeId === "rifleman" ? 1 : 0.94;
      sprite.setScale(baseScale * combatantPose.scaleX, baseScale * combatantPose.scaleY);
      sprite.setRotation(Math.atan2(combatant.facing.y, combatant.facing.x) + combatantPose.rotationOffset);
      sprite.setAlpha((combatant.alert ? 1 : 0.84) * combatantPose.alphaMultiplier);
      sprite.setDepth((combatant.position.y + combatantPose.offsetY) * 0.001 + 0.082);
      if (this.isPointNearCamera(combatant.position, 96)) {
        drawFactionMarker(this.factionMarkerGraphics, combatant.position, combatant.facing, 0xef4444, combatant.alert ? 0.92 : 0.74);
        if (selectedCombatant) {
          this.frontlineIncidentGraphics.lineStyle(1.8, 0xfef08a, 0.9);
          this.frontlineIncidentGraphics.strokeCircle(combatant.position.x, combatant.position.y, combatant.radius + 7);
        }
      }
    }

    if (selectedDefendAnchor && this.isPointNearCamera(selectedDefendAnchor, selectedDefendHoldRadius + 90)) {
      const pulse = (Math.sin(this.time.now / 180) + 1) * 0.5;
      const anchorRadius = 11 + pulse * 4;
      this.frontlineIncidentGraphics.lineStyle(1.8, 0xfef08a, 0.9);
      this.frontlineIncidentGraphics.strokeCircle(selectedDefendAnchor.x, selectedDefendAnchor.y, anchorRadius);
      this.frontlineIncidentGraphics.lineStyle(1.2, 0xfef08a, 0.28 + pulse * 0.18);
      this.frontlineIncidentGraphics.strokeCircle(selectedDefendAnchor.x, selectedDefendAnchor.y, selectedDefendHoldRadius);
      this.frontlineIncidentGraphics.lineStyle(1, 0xfef08a, 0.26);
      this.frontlineIncidentGraphics.lineBetween(
        selectedDefendAnchor.x - 10,
        selectedDefendAnchor.y,
        selectedDefendAnchor.x + 10,
        selectedDefendAnchor.y
      );
      this.frontlineIncidentGraphics.lineBetween(
        selectedDefendAnchor.x,
        selectedDefendAnchor.y - 10,
        selectedDefendAnchor.x,
        selectedDefendAnchor.y + 10
      );

      if (selectedCombatant && this.isPointNearCamera(selectedCombatant.position, 120)) {
        this.frontlineIncidentGraphics.lineStyle(1.1, 0xfef08a, 0.34 + pulse * 0.2);
        this.frontlineIncidentGraphics.lineBetween(
          selectedCombatant.position.x,
          selectedCombatant.position.y,
          selectedDefendAnchor.x,
          selectedDefendAnchor.y
        );
      }
    }

    if (
      selectedMate &&
      selectedWatchTarget &&
      selectedCombatant &&
      this.isPointNearCamera(selectedWatchTarget, 140)
    ) {
      const pulse = (Math.sin(this.time.now / 160 + 0.2) + 1) * 0.5;
      const watchColor = selectedMate.command.orderId === "brace-watch" ? 0xfacc15 : 0x38bdf8;
      const watchOrigin = selectedMate.command.orderId === "brace-watch" && selectedMate.command.anchor
        ? selectedMate.command.anchor
        : selectedCombatant.position;
      const targetRadius = 12 + pulse * (selectedMate.command.orderId === "brace-watch" ? 5 : 3);
      this.frontlineIncidentGraphics.lineStyle(2, watchColor, 0.88);
      this.frontlineIncidentGraphics.strokeCircle(selectedWatchTarget.x, selectedWatchTarget.y, targetRadius);
      this.frontlineIncidentGraphics.lineStyle(1.3, watchColor, 0.42);
      this.frontlineIncidentGraphics.lineBetween(watchOrigin.x, watchOrigin.y, selectedWatchTarget.x, selectedWatchTarget.y);
      if (selectedWatchDirection) {
        const wedgeLength = selectedMate.command.orderId === "brace-watch" ? 58 : 44;
        const halfArcRadians = (selectedWatchArcDegrees * Math.PI) / 360;
        const baseAngle = Math.atan2(selectedWatchDirection.y, selectedWatchDirection.x);
        const leftPoint = {
          x: watchOrigin.x + Math.cos(baseAngle - halfArcRadians) * wedgeLength,
          y: watchOrigin.y + Math.sin(baseAngle - halfArcRadians) * wedgeLength
        };
        const rightPoint = {
          x: watchOrigin.x + Math.cos(baseAngle + halfArcRadians) * wedgeLength,
          y: watchOrigin.y + Math.sin(baseAngle + halfArcRadians) * wedgeLength
        };
        this.frontlineIncidentGraphics.lineStyle(1.1, watchColor, 0.38);
        this.frontlineIncidentGraphics.lineBetween(watchOrigin.x, watchOrigin.y, leftPoint.x, leftPoint.y);
        this.frontlineIncidentGraphics.lineBetween(watchOrigin.x, watchOrigin.y, rightPoint.x, rightPoint.y);
      }
    }

    if (
      selectedTacticalAction &&
      selectedTacticalTarget &&
      this.isPointNearCamera(selectedTacticalTarget, 120)
    ) {
      const pulse = (Math.sin(this.time.now / 120 + 0.7) + 1) * 0.5;
      const actionColor =
        selectedTacticalAction.status === "failed"
          ? 0xfb7185
          : selectedTacticalAction.status === "completed"
            ? 0x4ade80
            : 0xf97316;
      const isSuppress = selectedTacticalAction.actionId === "suppress";
      const actionRadius = (isSuppress ? selectedTacticalAction.targetRadius ?? 26 : 12) + pulse * (isSuppress ? 4 : 6);
      this.frontlineIncidentGraphics.lineStyle(2.1, actionColor, 0.92);
      this.frontlineIncidentGraphics.strokeCircle(selectedTacticalTarget.x, selectedTacticalTarget.y, actionRadius);
      this.frontlineIncidentGraphics.lineStyle(1.4, actionColor, 0.28 + pulse * 0.2);
      this.frontlineIncidentGraphics.strokeCircle(
        selectedTacticalTarget.x,
        selectedTacticalTarget.y,
        (selectedTacticalAction.targetRadius ?? 28) + pulse * (isSuppress ? 8 : 10)
      );
      this.frontlineIncidentGraphics.lineStyle(1.1, actionColor, 0.44);
      if (isSuppress) {
        this.frontlineIncidentGraphics.strokeRect(selectedTacticalTarget.x - 10, selectedTacticalTarget.y - 10, 20, 20);
      } else {
        this.frontlineIncidentGraphics.lineBetween(
          selectedTacticalTarget.x - 12,
          selectedTacticalTarget.y - 12,
          selectedTacticalTarget.x + 12,
          selectedTacticalTarget.y + 12
        );
        this.frontlineIncidentGraphics.lineBetween(
          selectedTacticalTarget.x + 12,
          selectedTacticalTarget.y - 12,
          selectedTacticalTarget.x - 12,
          selectedTacticalTarget.y + 12
        );
      }

      if (selectedCombatant && this.isPointNearCamera(selectedCombatant.position, 140)) {
        this.frontlineIncidentGraphics.lineStyle(1.2, actionColor, 0.34 + pulse * 0.18);
        this.frontlineIncidentGraphics.lineBetween(
          selectedCombatant.position.x,
          selectedCombatant.position.y,
          selectedTacticalTarget.x,
          selectedTacticalTarget.y
        );
      }
    }

    for (const body of fallenSquadBodies.filter((entry) => !entry.recovered)) {
      const sprite = this.fallenSquadBodySprites.get(body.id);
      if (!sprite) {
        continue;
      }
      const visible = this.isPointNearCamera(body.position, 128);
      sprite.setVisible(visible);
      if (!visible) {
        continue;
      }
      const activeRecovery = activeSquadBodyRecovery?.squadMateId === body.squadMateId;
      sprite.setPosition(body.position.x, body.position.y);
      sprite.setTexture(getFriendlyCombatantKey(body.archetypeId));
      sprite.setTint(activeRecovery ? 0xfef08a : 0xfca5a5);
      sprite.setScale(0.96, 0.62);
      sprite.setRotation(Math.PI * 0.5);
      sprite.setAlpha(activeRecovery ? 0.92 : 0.68);
      sprite.setDepth(body.position.y * 0.001 + 0.024);
      this.frontlineIncidentGraphics.lineStyle(activeRecovery ? 2.4 : 1.4, activeRecovery ? 0xfef08a : 0xef4444, activeRecovery ? 0.92 : 0.65);
      this.frontlineIncidentGraphics.strokeCircle(body.position.x, body.position.y, activeRecovery ? 18 : 14);
    }

    for (const body of fallenEnemyBodies) {
      const sprite = this.fallenEnemyBodySprites.get(body.id);
      if (!sprite) {
        continue;
      }
      const visible = this.isPointNearCamera(body.position, 128);
      sprite.setVisible(visible);
      if (!visible) {
        continue;
      }
      sprite.setPosition(body.position.x, body.position.y);
      sprite.setTexture(getCombatantTextureKey(body.archetypeId, body.tapeId));
      sprite.setTint(0xcbd5e1);
      sprite.setScale(0.94, 0.58);
      sprite.setRotation(Math.atan2(body.facing.y, body.facing.x) + Math.PI * 0.5);
      sprite.setAlpha(0.56);
      sprite.setDepth(body.position.y * 0.001 + 0.022);
      this.frontlineIncidentGraphics.lineStyle(1.1, getEnemyTapeDefinition(body.tapeId).color, 0.42);
      this.frontlineIncidentGraphics.strokeCircle(body.position.x, body.position.y, 12);
    }

    if (phase === "raid") {
      this.drawEnemyIntent(this.getRenderableEnemies(enemies, ENEMY_INTENT_RENDER_LIMIT, false));
      this.drawEnemyStatus(this.getRenderableEnemies(enemies, ENEMY_STATUS_RENDER_LIMIT));
      this.drawRoomStackOverlay();
      this.drawObjectiveMarkers();
    }

    for (const bullet of bullets) {
      const sprite = this.bulletSprites.get(bullet.id);
      if (!sprite) {
        continue;
      }

      const visible = this.isPointNearCamera(bullet.position, 100);
      sprite.setVisible(visible);
      if (!visible) {
        continue;
      }

      sprite.setPosition(bullet.position.x, bullet.position.y);
      sprite.setDepth(bullet.position.y * 0.001 + 0.09);
    }

    for (const tracer of frontlineTracers) {
      const sprite = this.frontlineTracerSprites.get(tracer.id);
      if (!sprite) {
        continue;
      }

      const visible = renderableTracers.includes(tracer);
      sprite.setVisible(visible);
      if (!visible) {
        continue;
      }

      const lifeRatio = tracer.maxLife > 0 ? Math.max(0, tracer.life / tracer.maxLife) : 0;
      sprite.setPosition(tracer.position.x, tracer.position.y);
      sprite.setRotation(Math.atan2(tracer.velocity.y, tracer.velocity.x));
      sprite.setTint(tracer.color);
      sprite.setAlpha((tracer.faction === "friendly" ? 0.84 : 0.76) * lifeRatio);
      sprite.setScale(
        (tracer.weaponId === "pkm" ? 1.22 : tracer.weaponId === "short-mosin" ? 1.34 : tracer.weaponId === "worn-ak" ? 1.08 : tracer.weaponId === "smg" ? 0.88 : tracer.weaponId === "shotgun" ? 0.96 : tracer.weaponId === "amr" ? 1.28 : 1.1) +
          (tracer.faction === "friendly" ? lifeRatio * 0.18 : lifeRatio * 0.14),
        tracer.weaponId === "pkm" ? 0.96 : tracer.weaponId === "short-mosin" ? 0.72 : tracer.weaponId === "worn-ak" ? 0.92 : tracer.weaponId === "smg" ? 0.82 : tracer.weaponId === "shotgun" ? 1.02 : tracer.weaponId === "amr" ? 0.74 : 0.82
      );
      sprite.setBlendMode(
        tracer.weaponId === "amr" || tracer.weaponId === "pkm" || tracer.weaponId === "short-mosin" || tracer.weaponId === "worn-ak"
          ? Phaser.BlendModes.SCREEN
          : Phaser.BlendModes.ADD
      );
      sprite.setDepth(tracer.position.y * 0.001 + 0.091);
    }

    for (const impact of renderableImpacts) {
      drawFrontlineImpact(this.frontlineImpactGraphics, impact);
    }

    for (const grenade of renderableGrenades) {
      drawGrenade(this.grenadeGraphics, grenade, this.time.now);
    }

    for (const drop of loot) {
      const sprite = this.lootSprites.get(drop.id);
      if (!sprite) {
        continue;
      }

      const visible = this.isPointNearCamera(drop.position, 140);
      sprite.setVisible(visible);
      if (!visible) {
        continue;
      }

      sprite.setPosition(drop.position.x, drop.position.y);
      sprite.setTint(getLootTint(drop.category));
      sprite.setScale(activeLootPickup?.lootId === drop.id ? 1.16 : drop.stashReward.medkits > 0 || drop.stashReward.ammoPacks > 0 ? 1.08 : 0.95);
      sprite.setDepth(drop.position.y * 0.001 + 0.03);
    }

    for (const site of intelSites) {
      const sprite = this.intelSprites.get(site.id);
      if (!sprite) {
        continue;
      }
      const visible = this.isPointNearCamera(site.position, 140);
      sprite.setVisible(visible);
      if (!visible) {
        continue;
      }
      sprite.setPosition(site.position.x, site.position.y);
      sprite.setTexture(getPropTextureKey("uplink-terminal"));
      sprite.setTint(site.secured ? 0x34d399 : 0x7dd3fc);
      sprite.setScale(activeIntelCapture?.intelId === site.id ? 0.96 : site.secured ? 0.84 : 0.9);
      sprite.setAlpha(site.secured ? 0.52 : 1);
      sprite.setDepth(site.position.y * 0.001 + 0.02);
    }

    for (const cache of supplyCaches) {
      const sprite = this.supplyCacheSprites.get(cache.id);
      if (!sprite) {
        continue;
      }

      const visible = this.isPointNearCamera(cache.position, 150);
      sprite.setVisible(visible);
      if (!visible) {
        continue;
      }

      sprite.setPosition(cache.position.x, cache.position.y);
      sprite.setTexture(getSupplyCacheTexture(cache.kind));
      sprite.setTint(
        cache.resupplyCrate
          ? (cache.resupplyThreatTimer ?? 0) > 0.1
            ? 0xfb7185
            : 0x60a5fa
          : cache.frontlineDrop
          ? cache.kind === "medical"
            ? 0x86efac
            : cache.kind === "ammo"
              ? 0xfacc15
              : 0xbfdbfe
          : cache.opportunityId
          ? cache.kind === "medical"
            ? 0x6ee7b7
            : cache.kind === "ammo"
              ? 0xfbbf24
              : 0x93c5fd
          : cache.kind === "medical"
            ? 0x34d399
            : cache.kind === "ammo"
              ? 0xf97316
              : 0xf59e0b
      );
      sprite.setAlpha(cache.searched ? 0.28 : 1);
      sprite.setScale(
        cache.searched
          ? 0.78
          : cache.frontlineDrop
            ? 0.98
            : cache.opportunityId
              ? 0.94
              : cache.kind === "ammo"
                ? 0.82
                : 0.88
      );
      sprite.setDepth(cache.position.y * 0.001 + 0.02);
    }

    for (const support of renderedSupports) {
      const sprite = this.frontlineSupportSprites.get(support.id);
      if (!sprite) {
        continue;
      }
      const renderLiveEscortCombatants = support.playerEscort && support.kind === "fireteam" && friendlyCombatants.length > 0;
      const representedByFriendlyCombatant = this.isSupportRepresentedByFriendlyCombatant(support, friendlyCombatants);
      const visible = renderableSupports.includes(support);
      sprite.setVisible(visible && !representedByFriendlyCombatant);
      if (!visible) {
        continue;
      }
      if (representedByFriendlyCombatant) {
        continue;
      }
      const supportResupplyTarget =
        support.resupplyTimer > 0 && support.resupplyTargetId !== null
          ? renderableSupports.find((entry) => entry.id === support.resupplyTargetId) ?? null
          : null;

      const holdZoneActive = activeFrontlineHoldZoneId === support.id;
      const holdProgressRatio =
        holdZoneActive && support.sustainDuration > 0 ? Math.min(1, raidController.state.frontlineHoldZoneProgress / support.sustainDuration) : 0;
      const ringAlpha =
        support.status === "covering" ? 0.42 : support.status === "holding" ? 0.28 : support.status === "retreating" ? 0.16 : 0.18;
      const contactPulse = support.contactTimer > 0 ? 0.2 + Math.sin(this.time.now / 90 + support.id) * 0.08 : 0;
      const pushPulse = support.pushTimer > 0 ? 0.18 + Math.sin(this.time.now / 85 + support.id) * 0.08 : 0;
      if (!renderLiveEscortCombatants) {
        drawFrontlineFoothold(this.frontlineSupportGraphics, support, holdZoneActive, holdProgressRatio);
      }
      if (support.playerEscort && !renderLiveEscortCombatants) {
        this.frontlineSupportGraphics.lineStyle(2.2, 0xfb7185, 0.36 + contactPulse * 0.5);
        this.frontlineSupportGraphics.lineBetween(player.position.x, player.position.y, support.position.x, support.position.y);
        this.frontlineSupportGraphics.strokeCircle(support.position.x, support.position.y, support.radius + 16);
        this.frontlineSupportGraphics.fillStyle(0xfb7185, 0.08 + pushPulse * 0.3);
        this.frontlineSupportGraphics.fillCircle(support.position.x, support.position.y, support.radius + 18);
      }
      if (!renderLiveEscortCombatants) {
        this.frontlineSupportGraphics.lineStyle(
          holdZoneActive ? 2.2 : 1.2,
          holdZoneActive ? 0xe0f2fe : support.color,
          holdZoneActive ? 0.4 : support.sustainUsed ? 0.12 : 0.2
        );
        this.frontlineSupportGraphics.strokeCircle(support.position.x, support.position.y, support.holdRadius);
        this.frontlineSupportGraphics.fillStyle(
          holdZoneActive ? 0x7dd3fc : support.color,
          holdZoneActive ? 0.08 : support.sustainUsed ? 0.02 : 0.04
        );
        this.frontlineSupportGraphics.fillCircle(support.position.x, support.position.y, support.holdRadius);
      }
      const projectedTargetX = support.position.x + support.facing.x * (support.kind === "convoy" ? 30 : 24);
      const projectedTargetY = support.position.y + support.facing.y * (support.kind === "convoy" ? 30 : 24);
      if (!renderLiveEscortCombatants) {
        this.frontlineSupportGraphics.lineStyle(2, support.status === "retreating" ? 0xf59e0b : support.color, ringAlpha + 0.18);
        this.frontlineSupportGraphics.lineBetween(
          support.position.x,
          support.position.y,
          projectedTargetX,
          projectedTargetY
        );
        this.frontlineSupportGraphics.strokeCircle(
          support.position.x,
          support.position.y,
          support.radius + (support.status === "covering" ? 8 : 4)
        );
        if (support.contactTimer > 0) {
          this.frontlineSupportGraphics.lineStyle(2.6, 0xf8fafc, 0.34 + contactPulse);
          this.frontlineSupportGraphics.strokeCircle(support.position.x, support.position.y, support.radius + 13);
        }
        this.frontlineSupportGraphics.fillStyle(support.status === "retreating" ? 0xf59e0b : support.color, ringAlpha * 0.5);
        this.frontlineSupportGraphics.fillCircle(
          support.position.x,
          support.position.y,
          support.radius + (support.status === "holding" ? 2 : 0)
        );
        if (support.kind === "fireteam" && support.status !== "moving") {
          drawFrontlineEmplacement(
            this.frontlineSupportGraphics,
            support.position,
            support.facing,
            support.color,
            support.status === "covering" ? 0.34 : 0.24
          );
        }
        if (support.pushTimer > 0) {
          drawFrontlinePushMarker(this.frontlineSupportGraphics, support.position, support.facing, 0xfb7185, 0.34 + pushPulse);
        }
      }
      if (supportResupplyTarget) {
        drawFrontlineResupplyLink(
          this.frontlineSupportGraphics,
          support.position,
          supportResupplyTarget.position,
          0x7dd3fc,
          0.3 + Math.sin(this.time.now / 120 + support.id) * 0.08
        );
      }
      if (!renderLiveEscortCombatants) {
        drawFrontlineWeaponState(
          this.frontlineSupportGraphics,
          support.position,
          support.weaponId,
          support.ammoInMag,
          support.reloadTimer,
          support.dryFireTimer,
          support.resupplyTimer,
          support.pushTimer > 0 ? 0xfb7185 : support.color,
          ringAlpha + 0.24
        );
        drawFrontlineFormation(
          this.frontlineSupportGraphics,
          support.position,
          support.facing,
          support.strength,
          support.color,
          support.kind,
          ringAlpha + 0.28
        );
      }
      const supportAnchors = getFrontlineFormationAnchors(
        support.position,
        support.facing,
        support.strength,
        support.kind,
        support.playerEscort ? raidController.state.activeFrontlineSupportOrderId : null,
        support.playerEscort
      );
      if (!renderLiveEscortCombatants) {
        supportAnchors.forEach((anchor, index) => {
          const supportPose = getSupportRenderPose(support, this.time.now + index * 17);
          drawFrontlineOperatorGlyph(
            this.frontlineSupportGraphics,
            anchor,
            support.facing,
            support.color,
            ringAlpha + 0.36,
            support.kind === "recovery" ? "medical" : support.kind === "convoy" ? "support" : "line",
            supportPose
          );
          drawFactionMarker(this.factionMarkerGraphics, anchor, support.facing, 0xef4444, ringAlpha + 0.42, 0.8);

          if (support.playerEscort) {
            const plannedExtractLean =
              raidController.state.activeFrontlineSupportOrderId === null && getPlannedExtractPosture(raidController.state) !== null;
            const intentPoint = getEscortIntentPoint(
              anchor,
              support.facing,
              raidController.state.activeFrontlineSupportOrderId,
              index,
              plannedExtractLean
            );
            const intentAlpha = 0.16 + (support.pushTimer > 0 ? 0.24 : 0.08);
            this.frontlineSupportGraphics.lineStyle(1.2, 0xfda4af, intentAlpha);
            this.frontlineSupportGraphics.lineBetween(anchor.x, anchor.y, intentPoint.x, intentPoint.y);
            this.frontlineSupportGraphics.fillStyle(0xfda4af, intentAlpha + 0.08);
            this.frontlineSupportGraphics.fillCircle(intentPoint.x, intentPoint.y, support.pushTimer > 0 ? 2.8 : 2.2);
            const orderWorldCue = getFrontlineSupportOrderWorldCue(raidController.state);
            if (orderWorldCue?.position) {
              this.frontlineSupportGraphics.lineStyle(1.4, orderWorldCue.color, 0.14 + pushPulse * 0.36);
              this.frontlineSupportGraphics.lineBetween(intentPoint.x, intentPoint.y, orderWorldCue.position.x, orderWorldCue.position.y);
            }
          }
          const burstSeed = Math.sin(this.time.now / 170 + support.id * 1.7 + index * 0.9);
          if (
            support.reloadTimer <= 0 &&
            support.ammoInMag > 0 &&
            (support.status === "covering" || (support.kind === "fireteam" && support.status === "holding")) &&
            burstSeed > 0.12
          ) {
            drawFrontlineTracerBurst(
              this.frontlineSupportGraphics,
              anchor,
              support.facing,
              support.pushTimer > 0 ? 0xfb7185 : support.color,
              0.28 + Math.max(0, burstSeed) * 0.34 + (support.pushTimer > 0 ? 0.14 : 0),
              getFrontlineTracerDrawLength(
                support.weaponId,
                support.kind === "fireteam" ? index * 4 + (support.pushTimer > 0 ? 8 : 0) : index * 3
              ),
              support.weaponId,
              supportPose
            );
          }
        });
      }
      if (support.playerEscort && support.kind === "fireteam" && !renderLiveEscortCombatants) {
        this.syncSquadEscortSprites(support, supportAnchors, raidController.state.squadMates, ringAlpha + 0.72);
        this.syncSquadEscortLabels(support, supportAnchors, raidController.state.squadMates);
      }

      const supportPose = getSupportRenderPose(support, this.time.now);
      sprite.setPosition(support.position.x + supportPose.offsetX, support.position.y + supportPose.offsetY);
      sprite.setTexture(
        support.kind === "fireteam" ? getFriendlyCombatantKey(support.combatProfileId) : getFrontlineSupportTexture(support.kind)
      );
      sprite.setTint(
        support.dryFireTimer > 0
          ? 0xfb7185
          : support.resupplyTimer > 0
            ? 0x7dd3fc
            : support.status === "retreating"
          ? 0xf59e0b
          : support.pushTimer > 0
            ? 0xfb7185
            : support.contactTimer > 0
              ? 0xf8fafc
              : support.color
      );
      sprite.setRotation(Math.atan2(support.facing.y, support.facing.x) + supportPose.rotationOffset);
      sprite.setAlpha(
        (support.reloadTimer > 0
          ? 0.72
          : support.dryFireTimer > 0
            ? 0.64
            : support.resupplyTimer > 0
              ? 0.98
          : support.status === "covering"
            ? 0.96
            : support.status === "holding"
              ? 0.88
              : support.status === "retreating"
                ? 0.72
                : support.pushTimer > 0
                ? 0.92
                  : 0.8) * supportPose.alphaMultiplier
      );
      const supportBaseScale = support.kind === "convoy" ? 0.94 : support.kind === "recovery" ? 0.9 : 0.92;
      sprite.setScale(supportBaseScale * supportPose.scaleX, supportBaseScale * supportPose.scaleY);
      sprite.setDepth((support.position.y + supportPose.offsetY) * 0.001 + 0.045);
      if (support.playerEscort) {
        sprite.setVisible(false);
      }
    }

    this.hideUnusedObjectiveLabels(this.squadEscortLabels, this.activeSquadEscortLabelCount);
    const activeActionRead = getFrontlineIncidentActionRead(raidController.state);
    const plannedExtractStageCues = getPlannedExtractStageCues(raidController.state);
    const focusedExtractPosition = raidController.state.extractZone.position;

    plannedExtractStageCues.forEach((cue, index) => {
      drawPlannedExtractCueSetDressing(this.frontlineIncidentGraphics, cue, focusedExtractPosition, this.time.now, index);
    });

    for (const incident of renderedIncidents) {
      const sprite = this.frontlineIncidentSprites.get(incident.id);
      if (!sprite) {
        continue;
      }
      const representedByFriendlyCombatant = this.isIncidentRepresentedByFriendlyCombatant(incident, friendlyCombatants);
      const visible = renderableIncidents.includes(incident);
      sprite.setVisible(visible && !representedByFriendlyCombatant);
      if (!visible) {
        continue;
      }
      if (representedByFriendlyCombatant) {
        continue;
      }
      const incidentResupplyTarget =
        incident.resupplyTimer > 0 && incident.resupplyTargetId !== null
          ? renderableIncidents.find((entry) => entry.id === incident.resupplyTargetId) ?? null
          : null;
      const isFocusedIncident = raidController.state.focusedFrontlineIncidentId === incident.id && !incident.resolved;
      const isActiveIncidentAction = activeActionRead?.incidentId === incident.id;
      const activeActionProgress =
        isActiveIncidentAction && raidController.state.activeFrontlineIncidentAction
          ? Phaser.Math.Clamp(
              1 - raidController.state.activeFrontlineIncidentAction.timer / raidController.state.activeFrontlineIncidentAction.duration,
              0,
              1
            )
          : null;

      drawFrontlineTerritory(this.frontlineIncidentGraphics, incident, this.time.now);
      drawConvoyIncidentSetDressing(
        this.frontlineIncidentGraphics,
        incident,
        this.time.now,
        isFocusedIncident,
        activeActionProgress
      );
      drawCasualtyIncidentSetDressing(
        this.frontlineIncidentGraphics,
        incident,
        this.time.now,
        isFocusedIncident,
        activeActionProgress
      );
      drawCivilianIncidentSetDressing(
        this.frontlineIncidentGraphics,
        incident,
        this.time.now,
        isFocusedIncident,
        activeActionProgress
      );
      drawSurrenderIncidentSetDressing(
        this.frontlineIncidentGraphics,
        incident,
        this.time.now,
        isFocusedIncident,
        activeActionProgress
      );
      drawDroneSweepIncidentSetDressing(
        this.frontlineIncidentGraphics,
        incident,
        this.time.now,
        isFocusedIncident,
        activeActionProgress
      );
      drawMedicalHoldIncidentSetDressing(
        this.frontlineIncidentGraphics,
        incident,
        this.time.now,
        isFocusedIncident,
        activeActionProgress
      );
      drawBunkerIncidentSetDressing(
        this.frontlineIncidentGraphics,
        incident,
        this.time.now,
        isFocusedIncident,
        activeActionProgress
      );

      const lineAlpha =
        incident.status === "engaged"
          ? 0.34
          : incident.status === "collapsing"
            ? 0.24
            : incident.status === "routed"
              ? 0.18
              : incident.status === "extracting"
                ? 0.28
                : incident.status === "secured"
                  ? 0.2
                  : 0.18;
      const contactPulse = incident.contactTimer > 0 ? 0.22 + Math.sin(this.time.now / 90 + incident.id) * 0.08 : 0;
      const projectedTargetX = incident.position.x + incident.facing.x * (incident.kind === "convoy" ? 26 : 20);
      const projectedTargetY = incident.position.y + incident.facing.y * (incident.kind === "convoy" ? 26 : 20);
      this.frontlineIncidentGraphics.lineStyle(1.5, incident.color, lineAlpha + 0.14);
      this.frontlineIncidentGraphics.lineBetween(
        incident.position.x,
        incident.position.y,
        projectedTargetX,
        projectedTargetY
      );
      this.frontlineIncidentGraphics.strokeCircle(
        incident.position.x,
        incident.position.y,
        incident.radius + (incident.status === "engaged" ? 9 : 5)
      );
      if (incident.contactTimer > 0) {
        this.frontlineIncidentGraphics.lineStyle(2.4, 0xf8fafc, 0.32 + contactPulse);
        this.frontlineIncidentGraphics.strokeCircle(incident.position.x, incident.position.y, incident.radius + 13);
      }
      if (isFocusedIncident) {
        const focusPulse = Math.sin(this.time.now / 150) * 3 + 12;
        this.frontlineIncidentGraphics.lineStyle(3, 0xf8fafc, 0.82);
        this.frontlineIncidentGraphics.strokeCircle(incident.position.x, incident.position.y, incident.radius + focusPulse);
      }
      if (isActiveIncidentAction) {
        const actionColor =
          activeActionRead.tone === "loss" ? 0xf59e0b : activeActionRead.tone === "pressure" ? 0xfb7185 : 0x2dd4bf;
        const actionPulse = Math.sin(this.time.now / 120 + incident.id * 0.8) * 4 + 16;
        this.frontlineIncidentGraphics.lineStyle(3.2, actionColor, 0.88);
        this.frontlineIncidentGraphics.strokeCircle(incident.position.x, incident.position.y, incident.radius + actionPulse);
        this.frontlineIncidentGraphics.lineStyle(1.8, 0xf8fafc, 0.52);
        this.frontlineIncidentGraphics.strokeCircle(incident.position.x, incident.position.y, incident.radius + 8);
      }
      this.frontlineIncidentGraphics.fillStyle(incident.color, lineAlpha * 0.4);
      this.frontlineIncidentGraphics.fillCircle(
        incident.position.x,
        incident.position.y,
        incident.radius + (incident.status === "extracting" ? 2 : 0)
      );
      if (incidentResupplyTarget) {
        drawFrontlineResupplyLink(
          this.frontlineIncidentGraphics,
          incident.position,
          incidentResupplyTarget.position,
          0x93c5fd,
          0.28 + Math.sin(this.time.now / 120 + incident.id * 1.1) * 0.08
        );
      }
      drawFrontlineWeaponState(
        this.frontlineIncidentGraphics,
        incident.position,
        incident.weaponId,
        incident.ammoInMag,
        incident.reloadTimer,
        incident.dryFireTimer,
        incident.resupplyTimer,
        incident.status === "collapsing" ? 0xfb7185 : incident.color,
        lineAlpha + 0.2
      );
      drawFrontlineFormation(
        this.frontlineIncidentGraphics,
        incident.position,
        incident.facing,
        incident.strength,
        incident.status === "secured" ? 0x4ade80 : incident.status === "routed" ? 0xf59e0b : incident.status === "collapsing" ? 0xfb7185 : incident.color,
        incident.kind,
        lineAlpha + 0.24
      );
      const incidentAnchors = getFrontlineFormationAnchors(incident.position, incident.facing, incident.strength, incident.kind);
      incidentAnchors.forEach((anchor, index) => {
        const incidentPose = getIncidentRenderPose(incident, this.time.now + index * 23);
        drawFrontlineOperatorGlyph(
          this.frontlineIncidentGraphics,
          anchor,
          incident.facing,
          incident.status === "secured"
            ? 0x4ade80
            : incident.status === "routed"
              ? 0xf59e0b
              : incident.status === "collapsing"
                ? 0xfb7185
                : incident.color,
          lineAlpha + 0.28,
          incident.kind === "casualty" || incident.kind === "civilian" || incident.kind === "bunker"
            ? "medical"
            : incident.kind === "convoy"
              ? "support"
              : "line",
          incidentPose
        );
        drawFactionMarker(
          this.factionMarkerGraphics,
          anchor,
          incident.facing,
          incident.kind === "firefight" ? 0x60a5fa : incident.kind === "civilian" ? 0x2dd4bf : incident.kind === "bunker" ? 0x22c55e : 0xef4444,
          lineAlpha + 0.38,
          0.76
        );

        const burstSeed = Math.sin(this.time.now / 160 + incident.id * 1.9 + index * 0.82);
        if (
          incident.reloadTimer <= 0 &&
          incident.ammoInMag > 0 &&
          (incident.status === "engaged" || incident.status === "collapsing" || incident.kind === "firefight") &&
          burstSeed > 0.2
        ) {
          drawFrontlineTracerBurst(
            this.frontlineIncidentGraphics,
            anchor,
            incident.facing,
            incident.status === "secured"
              ? 0x4ade80
              : incident.status === "routed"
                ? 0xf59e0b
                : incident.status === "collapsing"
                ? 0xfb7185
                : incident.color,
            0.24 + Math.max(0, burstSeed) * 0.3,
            getFrontlineTracerDrawLength(
              incident.weaponId,
              incident.kind === "firefight" ? index * 3 : index * 2
            ),
            incident.weaponId,
            incidentPose
          );
        }
      });

      if (incident.kind === "firefight") {
        const muzzleLeft = rotateVector(incident.facing, Math.PI / 2);
        const muzzleRight = rotateVector(incident.facing, -Math.PI / 2);
        this.frontlineIncidentGraphics.lineStyle(1.1, 0xf8fafc, 0.3 + lineAlpha * 0.8);
        this.frontlineIncidentGraphics.lineBetween(
          incident.position.x + muzzleLeft.x * 18,
          incident.position.y + muzzleLeft.y * 18,
          incident.position.x - muzzleLeft.x * 18,
          incident.position.y - muzzleLeft.y * 18
        );
        this.frontlineIncidentGraphics.lineBetween(
          incident.position.x + muzzleRight.x * 14,
          incident.position.y + muzzleRight.y * 14,
          incident.position.x - muzzleRight.x * 14,
          incident.position.y - muzzleRight.y * 14
        );
      }

      const incidentPose = getIncidentRenderPose(incident, this.time.now);
      sprite.setPosition(incident.position.x + incidentPose.offsetX, incident.position.y + incidentPose.offsetY);
      sprite.setTexture(
        incident.kind === "firefight"
          ? getCombatantTextureKey(incident.combatProfileId)
          : getFrontlineIncidentTexture(incident.kind)
      );
      sprite.setTint(
        incident.dryFireTimer > 0
          ? 0xf97316
          : incident.resupplyTimer > 0
            ? 0x93c5fd
            : incident.status === "secured"
          ? 0x4ade80
          : incident.status === "routed"
            ? 0xf59e0b
            : incident.status === "collapsing"
              ? 0xfb7185
              : incident.contactTimer > 0
                ? 0xf8fafc
                : incident.color
      );
      sprite.setRotation(Math.atan2(incident.facing.y, incident.facing.x) + incidentPose.rotationOffset);
      sprite.setAlpha(
        (incident.reloadTimer > 0
          ? 0.58
          : incident.dryFireTimer > 0
            ? 0.52
            : incident.resupplyTimer > 0
              ? 0.9
          : incident.status === "engaged"
            ? 0.84
            : incident.status === "collapsing"
              ? 0.74
              : incident.status === "routed"
                ? 0.62
                : incident.status === "extracting"
                  ? 0.76
                  : incident.status === "secured"
                    ? 0.74
                    : 0.68) * incidentPose.alphaMultiplier
      );
      const incidentBaseScale = incident.kind === "convoy" ? 0.96 : incident.kind === "bunker" ? 0.92 : 0.9;
      sprite.setScale(incidentBaseScale * incidentPose.scaleX, incidentBaseScale * incidentPose.scaleY);
      sprite.setDepth((incident.position.y + incidentPose.offsetY) * 0.001 + 0.04);
    }

    if (phase === "raid" && activeSearch) {
      const cache = supplyCaches.find((entry) => entry.id === activeSearch.cacheId);

      if (cache && !cache.searched) {
        const progress = 1 - activeSearch.timer / activeSearch.duration;
        this.searchPulse.setVisible(true);
        this.searchPulse.setPosition(cache.position.x, cache.position.y);
        this.searchPulse.setRadius(28 + progress * 10);
        this.searchPulse.setStrokeStyle(3, 0xfde68a, 0.72 + progress * 0.2);
        this.searchPulse.setFillStyle(0xf59e0b, 0.08 + progress * 0.1);
      } else {
        this.searchPulse.setVisible(false);
      }
    } else {
      this.searchPulse.setVisible(false);
    }

    if (phase === "raid" && activeLootPickup) {
      const lootDrop = loot.find((entry) => entry.id === activeLootPickup.lootId);

      if (lootDrop) {
        const progress = 1 - activeLootPickup.timer / activeLootPickup.duration;
        this.searchPulse.setVisible(true);
        this.searchPulse.setPosition(lootDrop.position.x, lootDrop.position.y);
        this.searchPulse.setRadius(24 + progress * 12);
        this.searchPulse.setStrokeStyle(3, 0xf8fafc, 0.7 + progress * 0.18);
        this.searchPulse.setFillStyle(0xf59e0b, 0.09 + progress * 0.12);
      }
    }

    if (phase === "raid" && activeIntelCapture) {
      const intelSite = intelSites.find((site) => site.id === activeIntelCapture.intelId && !site.secured);

      if (intelSite) {
        const progress = 1 - activeIntelCapture.timer / activeIntelCapture.duration;
        this.intelPulse.setVisible(true);
        this.intelPulse.setPosition(intelSite.position.x, intelSite.position.y);
        this.intelPulse.setRadius(32 + progress * 14);
        this.intelPulse.setStrokeStyle(3, 0x7dd3fc, 0.76 + progress * 0.16);
        this.intelPulse.setFillStyle(0x38bdf8, 0.08 + progress * 0.14);
      } else {
        this.intelPulse.setVisible(false);
      }
    } else {
      this.intelPulse.setVisible(false);
    }

    if (phase === "raid" && activeObstacleBreach) {
      const obstacle = raidController.state.obstacles.find((entry) => entry.id === activeObstacleBreach.obstacleId);
      const breachDoorway = obstacle?.breach && !obstacle.breach.breached
        ? getClosestObstacleDoorway(obstacle, raidController.state.player.position)
        : null;

      if (obstacle?.breach && breachDoorway) {
        const breachRect = getObstacleDoorRect(obstacle, breachDoorway);
        const progress = 1 - activeObstacleBreach.timer / activeObstacleBreach.duration;
        this.breachPulse.setVisible(true);
        this.breachPulse.setPosition(breachRect.x + breachRect.width / 2, breachRect.y + breachRect.height / 2);
        this.breachPulse.setRadius(Math.max(breachRect.width, breachRect.height) * 0.55 + 20 + progress * 14);
        this.breachPulse.setStrokeStyle(3, 0x86efac, 0.78 + progress * 0.16);
        this.breachPulse.setFillStyle(0x22c55e, 0.08 + progress * 0.12);
      } else {
        this.breachPulse.setVisible(false);
      }
    } else {
      this.breachPulse.setVisible(false);
    }

    if (phase === "raid" && recentNoisePosition && recentNoisePulse > 0) {
      const progress = 1 - recentNoisePulse / 0.55;
      this.noisePulse.setVisible(true);
      this.noisePulse.setPosition(recentNoisePosition.x, recentNoisePosition.y);
      this.noisePulse.setRadius(28 + progress * (58 + soundPressure * 12));
      this.noisePulse.setStrokeStyle(3, 0xf87171, 0.72 - progress * 0.3);
      this.noisePulse.setFillStyle(0xf87171, 0.1 - progress * 0.05);
    } else {
      this.noisePulse.setVisible(false);
    }
  }

  private drawEnemyIntent(enemies: EnemyState[]): void {
    for (const enemy of enemies) {
      const tape = getEnemyTapeDefinition(enemy.tapeId);
      const facingAngle = Math.atan2(enemy.facing.y, enemy.facing.x);
      const coneLength = enemy.awareness === "engaged" ? 74 : enemy.awareness === "investigating" ? 56 : 34;
      const coneArc = enemy.awareness === "engaged" ? 0.82 : enemy.awareness === "investigating" ? 0.58 : 0.34;

      if (enemy.awareness === "engaged") {
        this.enemyIntentGraphics.fillStyle(0xfb7185, 0.1);
        this.enemyIntentGraphics.lineStyle(2, 0xfb7185, 0.52);
      } else if (enemy.awareness === "investigating") {
        this.enemyIntentGraphics.fillStyle(0xfacc15, 0.08);
        this.enemyIntentGraphics.lineStyle(2, 0xfacc15, 0.44);
      } else {
        this.enemyIntentGraphics.fillStyle(0x94a3b8, 0.04);
        this.enemyIntentGraphics.lineStyle(1, 0x94a3b8, 0.24);
      }

      this.enemyIntentGraphics.beginPath();
      this.enemyIntentGraphics.moveTo(enemy.position.x, enemy.position.y);
      this.enemyIntentGraphics.arc(enemy.position.x, enemy.position.y, coneLength, facingAngle - coneArc / 2, facingAngle + coneArc / 2);
      this.enemyIntentGraphics.closePath();
      this.enemyIntentGraphics.fillPath();
      this.enemyIntentGraphics.strokePath();

      if (enemy.awareness !== "patrol") {
        const ringColor = enemy.awareness === "engaged" ? 0xfb7185 : 0xfacc15;
        const ringAlpha = enemy.awareness === "engaged" ? 0.82 : 0.64;
        this.enemyIntentGraphics.lineStyle(2, ringColor, ringAlpha);
        this.enemyIntentGraphics.strokeCircle(enemy.position.x, enemy.position.y, enemy.radius + 8);
      }

      const pressureStroke = getPressureStroke(enemy.pressureType);
      if (pressureStroke) {
        this.enemyIntentGraphics.lineStyle(2, pressureStroke.color, pressureStroke.alpha);
        this.enemyIntentGraphics.strokeCircle(enemy.position.x, enemy.position.y, enemy.radius + 13);
      }

      if (enemy.panicTimer > 0) {
        this.enemyIntentGraphics.lineStyle(2, 0xfacc15, 0.74);
        this.enemyIntentGraphics.strokeCircle(enemy.position.x, enemy.position.y, enemy.radius + 18);
      }

      if (enemy.armorBrokenTimer > 0) {
        this.enemyIntentGraphics.lineStyle(2, 0xf97316, 0.8);
        this.enemyIntentGraphics.beginPath();
        this.enemyIntentGraphics.arc(
          enemy.position.x,
          enemy.position.y,
          enemy.radius + 10,
          facingAngle - 0.42,
          facingAngle + 0.42
        );
        this.enemyIntentGraphics.strokePath();
      }

      if (enemy.archetypeId === "rifleman") {
        const plateAlpha = enemy.armorFlash > 0 ? 0.92 : 0.42;
        this.enemyIntentGraphics.lineStyle(3, 0x7dd3fc, plateAlpha);
        this.enemyIntentGraphics.beginPath();
        this.enemyIntentGraphics.arc(
          enemy.position.x,
          enemy.position.y,
          enemy.radius + 5,
          facingAngle - 0.42,
          facingAngle + 0.42
        );
        this.enemyIntentGraphics.strokePath();
      }

      this.enemyIntentGraphics.fillStyle(tape.color, enemy.alert ? 0.92 : 0.68);
      this.enemyIntentGraphics.fillRoundedRect(enemy.position.x - 6, enemy.position.y + enemy.radius + 5, 12, 3, 2);
    }
  }

  private drawEnemyStatus(enemies: EnemyState[]): void {
    for (const enemy of enemies) {
      if (!enemy.alert && enemy.health >= enemy.maxHealth) {
        continue;
      }

      const width = enemy.archetypeId === "rusher" ? 34 : 38;
      const height = 5;
      const x = enemy.position.x - width / 2;
      const y = enemy.position.y - enemy.radius - 16;
      const tape = getEnemyTapeDefinition(enemy.tapeId);
      const healthRatio = Phaser.Math.Clamp(enemy.health / enemy.maxHealth, 0, 1);
      const barColor =
        enemy.awareness === "engaged"
          ? 0xfb7185
          : enemy.awareness === "investigating"
            ? 0xfacc15
            : 0x94a3b8;

      this.enemyStatusGraphics.fillStyle(0x020617, 0.82);
      this.enemyStatusGraphics.fillRoundedRect(x - 1, y - 1, width + 2, height + 2, 4);
      this.enemyStatusGraphics.fillStyle(barColor, 0.95);
      this.enemyStatusGraphics.fillRoundedRect(x, y, width * healthRatio, height, 3);
      this.enemyStatusGraphics.lineStyle(1, 0xe2e8f0, 0.18);
      this.enemyStatusGraphics.strokeRoundedRect(x - 0.5, y - 0.5, width + 1, height + 1, 4);

      if (enemy.archetypeId === "rifleman") {
        this.enemyStatusGraphics.fillStyle(0x7dd3fc, enemy.armorFlash > 0 ? 0.96 : 0.5);
        this.enemyStatusGraphics.fillRoundedRect(x, y - 10, width * 0.46, 3, 2);
      }

      const pressureStroke = getPressureStroke(enemy.pressureType);
      if (pressureStroke) {
        this.enemyStatusGraphics.fillStyle(pressureStroke.color, 0.94);
        this.enemyStatusGraphics.fillRoundedRect(x, y - 5, width * Phaser.Math.Clamp(enemy.pressureTimer, 0, 1), 3, 2);
      }

      if (enemy.panicTimer > 0) {
        this.enemyStatusGraphics.fillStyle(0xfacc15, 0.96);
        this.enemyStatusGraphics.fillRoundedRect(x, y - 10, width * Phaser.Math.Clamp(enemy.panicTimer, 0, 1), 3, 2);
      }

      if (enemy.armorBrokenTimer > 0) {
        this.enemyStatusGraphics.fillStyle(0xf97316, 0.96);
        this.enemyStatusGraphics.fillRoundedRect(x + width * 0.52, y - 10, width * 0.38, 3, 2);
      }

      this.enemyStatusGraphics.fillStyle(tape.color, 0.94);
      this.enemyStatusGraphics.fillRoundedRect(x, y - 15, width * 0.32, 3, 2);
    }
  }

  private drawRoomStackOverlay(): void {
    const { player, obstacles, supplyCaches } = raidController.state;
    const roomStackObstacles = obstacles.filter((obstacle) => obstacle.breach?.label?.startsWith("Open room hold "));

    if (roomStackObstacles.length === 0) {
      this.hideUnusedObjectiveLabels(this.roomStackLabels, 0);
      return;
    }

    const playerOccupiedRoom = roomStackObstacles.find((obstacle) => pointInsideObstacle(player.position, obstacle)) ?? null;
    const playerOccupiedRoomInfo = playerOccupiedRoom ? getRoomTraversalInfo(playerOccupiedRoom) : null;
    const nearestRoom =
      playerOccupiedRoomInfo
        ? { obstacle: playerOccupiedRoom, info: playerOccupiedRoomInfo, distance: 0 }
        :
      [...roomStackObstacles]
        .map((obstacle) => ({
          obstacle,
          info: getRoomTraversalInfo(obstacle),
          distance: Phaser.Math.Distance.Between(
            player.position.x,
            player.position.y,
            obstacle.x + obstacle.width / 2,
            obstacle.y + obstacle.height / 2
          )
        }))
        .sort((left, right) => left.distance - right.distance)[0] ??
      null;
    const activeChainIndex = nearestRoom?.info?.chainIndex ?? getRoomTraversalInfo(roomStackObstacles[0])?.chainIndex ?? 1;
    const activeChainObstacles = roomStackObstacles
      .filter((obstacle) => getRoomTraversalInfo(obstacle)?.chainIndex === activeChainIndex)
      .sort((left, right) => (getRoomTraversalInfo(left)?.depth ?? 0) - (getRoomTraversalInfo(right)?.depth ?? 0));

    if (activeChainObstacles.length === 0) {
      this.hideUnusedObjectiveLabels(this.roomStackLabels, 0);
      return;
    }

    const securedRoomLabels = new Set(
      supplyCaches.filter((cache) => cache.frontlineDrop && cache.frontlineDropSourceLabel).map((cache) => cache.frontlineDropSourceLabel as string)
    );
    const timeSeconds = this.time.now / 1000;
    let labelCount = 0;

    for (const obstacle of activeChainObstacles) {
      const traversalInfo = getRoomTraversalInfo(obstacle);
      const doorway = getClosestObstacleDoorway(obstacle, player.position);

      if (!traversalInfo || !doorway) {
        continue;
      }

      const doorwayRect = getObstacleDoorRect(obstacle, doorway);
      const doorwayCenter = {
        x: doorwayRect.x + doorwayRect.width / 2,
        y: doorwayRect.y + doorwayRect.height / 2
      };
      const settled = pointInsideObstacle(player.position, obstacle);
      const secured = securedRoomLabels.has(obstacle.breach?.label ?? "");
      const nextDepth = playerOccupiedRoom ? (getRoomTraversalInfo(playerOccupiedRoom)?.depth ?? 0) + 1 : 1;
      const isNextRoom = !settled && traversalInfo.depth === nextDepth;
      const color = settled ? 0xfbbf24 : secured ? 0x4ade80 : isNextRoom ? 0xfb7185 : 0x7dd3fc;
      const accent = settled ? 0xfef3c7 : secured ? 0xdcfce7 : isNextRoom ? 0xffedd5 : 0xe0f2fe;
      const pulse = 3 + Math.sin(timeSeconds * 4.1 + traversalInfo.depth) * 2;

      this.roomStackGraphics.fillStyle(color, settled ? 0.16 : secured ? 0.12 : isNextRoom ? 0.11 : 0.08);
      this.roomStackGraphics.fillRoundedRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height, 18);
      this.roomStackGraphics.lineStyle(settled ? 3 : 2, color, settled ? 0.9 : 0.68);
      this.roomStackGraphics.strokeRoundedRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height, 18);

      this.roomStackGraphics.lineStyle(2, accent, 0.6);
      this.roomStackGraphics.lineBetween(doorwayCenter.x, doorwayCenter.y, obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2);
      this.roomStackGraphics.fillStyle(accent, 0.88);
      this.roomStackGraphics.fillCircle(doorwayCenter.x, doorwayCenter.y, 7 + pulse * 0.2);

      if (settled) {
        this.roomStackGraphics.lineStyle(2.4, 0xf8fafc, 0.78);
        this.roomStackGraphics.strokeCircle(
          obstacle.x + obstacle.width / 2,
          obstacle.y + obstacle.height / 2,
          Math.min(obstacle.width, obstacle.height) * 0.2 + pulse
        );
      }

      const statusLabel = settled ? "YOU" : secured ? "SECURED" : isNextRoom ? "NEXT" : "STACK";
      this.syncObjectiveLabel(this.roomStackLabels, labelCount, {
        x: obstacle.x + obstacle.width / 2,
        y: obstacle.y + obstacle.height / 2,
        text: `${statusLabel} // ${getCondensedRoomTraversalLabel(obstacle, settled)}`,
        color: Phaser.Display.Color.IntegerToColor(color).rgba,
        fontSize: "11px",
        scrollFixed: false,
        originX: 0.5,
        originY: 0.5
      });
      this.roomStackLabels[labelCount].label.setDepth(9);
      this.roomStackLabels[labelCount].label.setShadow(0, 1, "#020617", 8, false, true);
      labelCount += 1;
    }

    this.hideUnusedObjectiveLabels(this.roomStackLabels, labelCount);
  }

  private drawObjectiveMarkers(): void {
    const markers = this.getObjectiveMarkers();
    let worldLabelCount = 0;

    for (const marker of markers) {
      this.objectiveGraphics.lineStyle(marker.warning ? 3 : 2, marker.color, marker.warning ? 0.92 : 0.78);
      this.objectiveGraphics.strokeCircle(marker.position.x, marker.position.y, marker.radius + marker.pulse);
      this.objectiveGraphics.lineStyle(marker.warning ? 2 : 1, marker.accent, marker.warning ? 0.52 : 0.34);
      this.objectiveGraphics.strokeCircle(marker.position.x, marker.position.y, marker.radius + 12 + marker.pulse * 1.4);
      this.objectiveGraphics.lineBetween(
        marker.position.x,
        marker.position.y - marker.radius - 18,
        marker.position.x,
        marker.position.y - marker.radius - 58
      );

      this.syncObjectiveLabel(this.worldObjectiveLabels, worldLabelCount, {
        x: marker.position.x,
        y: marker.position.y - marker.radius - 70,
        text: marker.label,
        color: Phaser.Display.Color.IntegerToColor(marker.color).rgba,
        fontSize: "12px",
        scrollFixed: false,
        originX: 0.5,
        originY: 1
      });
      worldLabelCount += 1;
    }

    this.hideUnusedObjectiveLabels(this.worldObjectiveLabels, worldLabelCount);
    this.drawEdgeIndicators(markers);
  }

  private drawEdgeIndicators(markers: ObjectiveMarker[]): void {
    const camera = this.cameras.main;
    const inset = 44;
    const centerX = camera.width / 2;
    const centerY = camera.height / 2;
    let edgeLabelCount = 0;

    for (const marker of markers.slice(0, 3)) {
      const screenPoint = {
        x: marker.position.x - camera.worldView.x,
        y: marker.position.y - camera.worldView.y
      };
      const isOnScreen =
        screenPoint.x >= inset &&
        screenPoint.x <= camera.width - inset &&
        screenPoint.y >= inset &&
        screenPoint.y <= camera.height - inset;

      if (isOnScreen) {
        continue;
      }

      const direction = new Phaser.Math.Vector2(screenPoint.x - centerX, screenPoint.y - centerY).normalize();
      const edgeX = Phaser.Math.Clamp(centerX + direction.x * (centerX - inset), inset, camera.width - inset);
      const edgeY = Phaser.Math.Clamp(centerY + direction.y * (centerY - inset), inset, camera.height - inset);
      const angle = direction.angle();
      const tip = new Phaser.Math.Vector2(edgeX, edgeY);
      const left = tip.clone().add(Phaser.Math.Rotate(new Phaser.Math.Vector2(-18, -8), angle));
      const right = tip.clone().add(Phaser.Math.Rotate(new Phaser.Math.Vector2(-18, 8), angle));

      this.edgeIndicatorGraphics.fillStyle(0x020617, 0.78);
      this.edgeIndicatorGraphics.fillCircle(edgeX, edgeY, 18);
      this.edgeIndicatorGraphics.lineStyle(marker.warning ? 3 : 2, marker.color, 0.92);
      this.edgeIndicatorGraphics.strokeCircle(edgeX, edgeY, 18);
      this.edgeIndicatorGraphics.fillStyle(marker.color, 0.88);
      this.edgeIndicatorGraphics.fillTriangle(tip.x, tip.y, left.x, left.y, right.x, right.y);

      this.syncObjectiveLabel(this.edgeObjectiveLabels, edgeLabelCount, {
        x: edgeX,
        y: edgeY + 26,
        text: marker.label,
        color: Phaser.Display.Color.IntegerToColor(marker.color).rgba,
        fontSize: "11px",
        scrollFixed: true,
        originX: 0.5,
        originY: 0
      });
      edgeLabelCount += 1;
    }

    this.hideUnusedObjectiveLabels(this.edgeObjectiveLabels, edgeLabelCount);
  }

  private getObjectiveMarkers(): ObjectiveMarker[] {
    const {
      activeIntelCapture,
      intelSites,
      activeSearch,
      activeLootPickup,
      activeObstacleBreach,
      supplyCaches,
      loot,
      extractZones,
      activeExtractId,
      extractionReady,
      extractionContested,
      extractZone,
      extractionHoldTimer,
      pendingReinforcements,
      frontlineIncidents,
      focusedFrontlineIncidentId,
      currentPocketPlan,
      player
    } = raidController.state;
    const markers: ObjectiveMarker[] = [];
    const timeSeconds = this.time.now / 1000;
    const orderWorldCue = getFrontlineSupportOrderWorldCue(raidController.state);
    const plannedExtractStageCues = getPlannedExtractStageCues(raidController.state);
    const activeActionRead = getFrontlineIncidentActionRead(raidController.state);
    const scarIncidents = getFrontlineScarIncidents(raidController.state);

    if (orderWorldCue?.position) {
      markers.push({
        label: orderWorldCue.label,
        position: orderWorldCue.position,
        color: orderWorldCue.color,
        accent: orderWorldCue.accent,
        radius: orderWorldCue.radius,
        priority: 0,
        pulse: Math.sin(timeSeconds * 6.4 + orderWorldCue.position.x * 0.001 + orderWorldCue.position.y * 0.001) * 4 + 8,
        warning: true
      });
    }

    plannedExtractStageCues.forEach((cue, index) => {
      markers.push({
        label: cue.label,
        position: cue.position,
        color: cue.color,
        accent: cue.accent,
        radius: cue.radius,
        priority: 1 + index,
        pulse: Math.sin(timeSeconds * (4.2 + index * 0.45) + cue.position.x * 0.001 + cue.position.y * 0.001) * 2 + 4
      });
    });

    for (const pocketPlan of currentPocketPlan) {
      const style = getPocketPlanMarkerStyle(pocketPlan.role);
      markers.push({
        label: `${style.labelPrefix} // ${pocketPlan.pocketLabel}`,
        position: pocketPlan.position,
        color: style.color,
        accent: style.accent,
        radius: style.radius,
        priority: style.priority,
        pulse: Math.sin(timeSeconds * 2.9 + pocketPlan.position.x * 0.001 + pocketPlan.position.y * 0.001) * 2 + 3,
        warning: style.warning
      });
    }

    if (activeIntelCapture) {
      const intelSite = intelSites.find((site) => site.id === activeIntelCapture.intelId && !site.secured);
      if (intelSite) {
        markers.push({
          label: intelSite.id === 1 ? "Alpha Hold" : "Bravo Hold",
          position: intelSite.position,
          color: 0x7dd3fc,
          accent: 0xe0f2fe,
          radius: 24,
          priority: 1,
          pulse: Math.sin(timeSeconds * 5.2) * 4 + 6
        });
      }
    } else {
      for (const intelSite of intelSites.filter((site) => !site.secured)) {
        markers.push({
          label: intelSite.id === 1 ? "Alpha Intel" : "Bravo Intel",
          position: intelSite.position,
          color: 0x38bdf8,
          accent: 0xe0f2fe,
          radius: 20,
          priority: intelSite.id,
          pulse: Math.sin(timeSeconds * 3.6 + intelSite.id) * 3 + 4
        });
      }
    }

    if (activeSearch) {
      const cache = supplyCaches.find((entry) => entry.id === activeSearch.cacheId && !entry.searched);
      if (cache) {
        markers.push({
          label: cache.label,
          position: cache.position,
          color: 0xf59e0b,
          accent: 0xfde68a,
          radius: 22,
          priority: 2,
          pulse: Math.sin(timeSeconds * 5.8) * 4 + 5
        });
      }
    } else {
      const opportunityCache = supplyCaches.find((cache) => !cache.searched && cache.opportunityId);
      if (opportunityCache) {
        markers.push({
          label: opportunityCache.label,
          position: opportunityCache.position,
          color: opportunityCache.kind === "medical" ? 0x4ade80 : opportunityCache.kind === "ammo" ? 0xfbbf24 : 0x93c5fd,
          accent: 0xf8fafc,
          radius: 20,
          priority: 3,
          pulse: Math.sin(timeSeconds * 3.4 + opportunityCache.id) * 3 + 4
        });
      }

      const nextCache = supplyCaches.find((cache) => !cache.searched);
      if (nextCache) {
        markers.push({
          label: nextCache.label,
          position: nextCache.position,
          color: 0xf59e0b,
          accent: 0xfde68a,
          radius: 18,
          priority: 5,
          pulse: Math.sin(timeSeconds * 2.8 + nextCache.id) * 2 + 2
        });
      }
    }

    if (activeLootPickup) {
      const activeLoot = loot.find((entry) => entry.id === activeLootPickup.lootId);
      if (activeLoot) {
        markers.push({
          label: activeLoot.label,
          position: activeLoot.position,
          color: 0xf8fafc,
          accent: 0xfde68a,
          radius: 18,
          priority: 2,
          pulse: Math.sin(timeSeconds * 6.2) * 4 + 5
        });
      }
    } else {
      const nextLoot = loot[0];
      if (nextLoot) {
        markers.push({
          label: nextLoot.label,
          position: nextLoot.position,
          color: 0xf59e0b,
          accent: 0xfde68a,
          radius: 14,
          priority: 6,
          pulse: Math.sin(timeSeconds * 3.1 + nextLoot.id) * 2 + 2
        });
      }
    }

    if (activeObstacleBreach) {
      const obstacle = raidController.state.obstacles.find((entry) => entry.id === activeObstacleBreach.obstacleId);
      const breachDoorway = obstacle?.breach && !obstacle.breach.breached
        ? getClosestObstacleDoorway(obstacle, raidController.state.player.position)
        : null;
      if (obstacle?.breach && breachDoorway) {
        const breachRect = getObstacleDoorRect(obstacle, breachDoorway);
        markers.push({
          label: "Cut Here",
          position: { x: breachRect.x + breachRect.width / 2, y: breachRect.y + breachRect.height / 2 },
          color: 0x4ade80,
          accent: 0xdcfce7,
          radius: 20,
          priority: 2,
          pulse: Math.sin(timeSeconds * 6 + obstacle.id) * 4 + 6
        });
      }
    } else {
      const nextBreach = raidController.state.obstacles.find(
        (obstacle) => obstacle.breach && !obstacle.breach.breached && (obstacle.doorways?.length ?? 0) > 0
      );
      const breachDoorway = nextBreach
        ? getClosestObstacleDoorway(nextBreach, raidController.state.player.position)
        : null;
      if (nextBreach?.breach && breachDoorway) {
        const breachRect = getObstacleDoorRect(nextBreach, breachDoorway);
        markers.push({
          label: "Next Cut",
          position: { x: breachRect.x + breachRect.width / 2, y: breachRect.y + breachRect.height / 2 },
          color: 0x86efac,
          accent: 0xf0fdf4,
          radius: 18,
          priority: 5,
          pulse: Math.sin(timeSeconds * 3.6 + nextBreach.id) * 3 + 4
        });
      }
    }

    const roomStackObstacles = raidController.state.obstacles.filter(
      (obstacle) => obstacle.breach?.label?.startsWith("Open room hold ")
    );
    const getRoomTraversalSortKey = (obstacle: (typeof roomStackObstacles)[number]): number => {
      const traversalInfo = getRoomTraversalInfo(obstacle);

      if (!traversalInfo) {
        return 999;
      }

      return traversalInfo.chainIndex * 10 + traversalInfo.depth;
    };
    const activeRoomStackChainIndex = (() => {
      const occupiedChain = roomStackObstacles.find((obstacle) => pointInsideObstacle(player.position, obstacle));
      const occupiedInfo = occupiedChain ? getRoomTraversalInfo(occupiedChain) : null;

      if (occupiedInfo) {
        return occupiedInfo.chainIndex;
      }

      const nearestRoom = [...roomStackObstacles]
        .map((obstacle) => ({
          obstacle,
          info: getRoomTraversalInfo(obstacle),
          distance: Phaser.Math.Distance.Between(
            player.position.x,
            player.position.y,
            obstacle.x + obstacle.width / 2,
            obstacle.y + obstacle.height / 2
          )
        }))
        .filter(
          (
            candidate
          ): candidate is {
            obstacle: (typeof roomStackObstacles)[number];
            info: NonNullable<ReturnType<typeof getRoomTraversalInfo>>;
            distance: number;
          } => candidate.info !== null
        )
        .sort((left, right) => left.distance - right.distance)[0];

      return nearestRoom?.info.chainIndex ?? null;
    })();
    const activeChainObstacles = roomStackObstacles
      .filter((obstacle) => {
        const traversalInfo = getRoomTraversalInfo(obstacle);
        return traversalInfo && traversalInfo.chainIndex === activeRoomStackChainIndex;
      })
      .sort((left, right) => getRoomTraversalSortKey(left) - getRoomTraversalSortKey(right))
      .slice(0, 3);
    const occupiedRoom = activeChainObstacles.find((obstacle) => pointInsideObstacle(player.position, obstacle));
    const occupiedRoomDepth = occupiedRoom ? getRoomTraversalInfo(occupiedRoom)?.depth ?? null : null;

    for (const obstacle of activeChainObstacles) {
      const traversalInfo = getRoomTraversalInfo(obstacle);
      const doorway =
        getClosestObstacleDoorway(obstacle, player.position) ??
        (obstacle.doorways && obstacle.doorways.length > 0 ? obstacle.doorways[0] : null);

      if (!traversalInfo || !doorway) {
        continue;
      }

      const doorwayRect = getObstacleDoorRect(obstacle, doorway);
      const center = {
        x: doorwayRect.x + doorwayRect.width / 2,
        y: doorwayRect.y + doorwayRect.height / 2
      };
      const isActiveDepth =
        occupiedRoomDepth !== null
          ? traversalInfo.depth === occupiedRoomDepth + 1 || traversalInfo.depth === occupiedRoomDepth
          : traversalInfo.depth === 1;

      markers.push({
        label: getCondensedRoomTraversalLabel(obstacle, isActiveDepth),
        position: center,
        color: isActiveDepth ? 0x7dd3fc : 0x38bdf8,
        accent: 0xe0f2fe,
        radius: isActiveDepth ? 18 : 14,
        priority: isActiveDepth ? 2 : 3,
        pulse: 4 + Math.sin(timeSeconds * 4.2 + obstacle.x * 0.001 + traversalInfo.depth) * 3
      });
    }

    if (activeActionRead) {
      const activeIncident = frontlineIncidents.find(
        (incident) => incident.id === activeActionRead.incidentId && !incident.resolved
      );
      if (activeIncident) {
        markers.push({
          label: `${activeActionRead.title}\n${activeActionRead.compact}`,
          position: activeIncident.position,
          color:
            activeActionRead.tone === "loss"
              ? 0xf59e0b
              : activeActionRead.tone === "pressure"
                ? 0xfb7185
                : 0x2dd4bf,
          accent: 0xf8fafc,
          radius: activeIncident.radius + 10,
          priority: 1,
          pulse: Math.sin(timeSeconds * 4.6 + activeIncident.id) * 4 + 6,
          warning: true
        });
      }
    }

    const liveOpportunity = frontlineIncidents.find(
      (incident) => !incident.resolved && incident.opportunityLabel && incident.id !== activeActionRead?.incidentId
    );
    if (liveOpportunity) {
      markers.push({
        label: `${liveOpportunity.label}\n${(liveOpportunity.opportunityLabel ?? "Work the lane").toUpperCase()}`,
        position: liveOpportunity.position,
        color:
          liveOpportunity.kind === "casualty"
            ? 0xc4b5fd
            : liveOpportunity.kind === "civilian"
              ? 0x2dd4bf
              : liveOpportunity.kind === "bunker"
                ? 0x22c55e
              : liveOpportunity.kind === "convoy"
                ? 0xfbbf24
                : 0xfb7185,
        accent: 0xf8fafc,
        radius: 18,
        priority: 4,
        pulse: Math.sin(timeSeconds * 3.8 + liveOpportunity.id) * 3 + 4
      });
    }

    const focusedIncident = frontlineIncidents.find(
      (incident) => incident.id === focusedFrontlineIncidentId && !incident.resolved
    );
    if (focusedIncident) {
      markers.push({
        label: `Focus // ${focusedIncident.label}`,
        position: focusedIncident.position,
        color: 0xf8fafc,
        accent:
          focusedIncident.kind === "casualty"
            ? 0xc4b5fd
            : focusedIncident.kind === "civilian"
              ? 0x2dd4bf
              : focusedIncident.kind === "bunker"
                ? 0x22c55e
              : focusedIncident.kind === "convoy"
                ? 0xfbbf24
                : 0xfb7185,
        radius: focusedIncident.radius + 12,
        priority: 2,
        pulse: Math.sin(timeSeconds * 4.4 + focusedIncident.id) * 4 + 7,
        warning: focusedIncident.kind === "firefight"
      });
    }

    const hostileComms = raidController.state.hostileComms;
    const hostileMarkerAnchor =
      focusedIncident?.position ??
      frontlineIncidents.find((incident) => !incident.resolved)?.position ??
      raidController.state.enemies[0]?.position ??
      null;
    if (
      hostileMarkerAnchor &&
      (hostileComms.tone === "warning" || hostileComms.tone === "critical" || hostileComms.tone === "extract")
    ) {
      const hostileTape = hostileComms.tapeId ? getEnemyTapeDefinition(hostileComms.tapeId) : null;
      markers.push({
        label: `Blue Shout // ${hostileComms.speaker}`,
        position: hostileMarkerAnchor,
        color:
          hostileComms.tone === "critical"
            ? 0xfb7185
            : hostileComms.tone === "warning"
              ? 0xf59e0b
              : hostileTape?.color ?? 0x60a5fa,
        accent: 0xf8fafc,
        radius: focusedIncident ? focusedIncident.radius + 18 : 22,
        priority: 2,
        pulse: Math.sin(timeSeconds * 5.2 + hostileMarkerAnchor.x * 0.01) * 4 + 6,
        warning: true
      });
    }

    const reservedScarIds = new Set<number>();
    if (activeActionRead?.incidentId !== undefined) {
      reservedScarIds.add(activeActionRead.incidentId);
    }
    if (liveOpportunity) {
      reservedScarIds.add(liveOpportunity.id);
    }
    if (focusedIncident) {
      reservedScarIds.add(focusedIncident.id);
    }

    const scarMarkers = [...scarIncidents]
      .filter((incident) => !reservedScarIds.has(incident.id))
      .sort((left, right) => {
        const priorityDelta = getFrontlineScarPriority(left) - getFrontlineScarPriority(right);
        if (priorityDelta !== 0) {
          return priorityDelta;
        }
        return (
          Phaser.Math.Distance.Between(left.position.x, left.position.y, player.position.x, player.position.y) -
          Phaser.Math.Distance.Between(right.position.x, right.position.y, player.position.x, player.position.y)
        );
      })
      .slice(0, 2);

    scarMarkers.forEach((incident) => {
      markers.push(createScarObjectiveMarker(incident, player.position, timeSeconds));
    });

    const hotFirefight = frontlineIncidents.find(
      (incident) => !incident.resolved && incident.kind === "firefight" && incident.status === "engaged"
    );
    if (hotFirefight) {
      markers.push({
        label: hotFirefight.label,
        position: hotFirefight.position,
        color: 0xfb7185,
        accent: 0xffedd5,
        radius: 16,
        priority: 6,
        pulse: Math.sin(timeSeconds * 5.1 + hotFirefight.id) * 3 + 4,
        warning: true
      });
    }

    for (const pending of pendingReinforcements) {
      markers.push(this.createReinforcementMarker(pending, timeSeconds));
    }

    if (extractionReady || extractionHoldTimer > 0) {
      for (const extract of extractZones) {
        const isFocused =
          activeExtractId === extract.id ||
          (extract.position.x === extractZone.position.x &&
            extract.position.y === extractZone.position.y &&
            extract.radius === extractZone.radius);
        const playerInThisExtract =
          Phaser.Math.Distance.Between(player.position.x, player.position.y, extract.position.x, extract.position.y) <
          extract.radius - 12;
        const label =
          isFocused && extractionContested
            ? `Clear ${extract.label}`
            : isFocused && extractionHoldTimer > 0
              ? playerInThisExtract
                ? `Hold ${extract.label}`
                : `Recover ${extract.label}`
              : extract.label;
        markers.push({
          label,
          position: extract.position,
          color:
            isFocused && extractionContested
              ? 0xfb7185
              : isFocused && extractionHoldTimer > 0 && !playerInThisExtract
                ? 0xf59e0b
                : extractionReady
                  ? 0x4ade80
                  : 0x94a3b8,
          accent:
            isFocused && extractionContested
              ? 0xffedd5
              : isFocused && extractionHoldTimer > 0 && !playerInThisExtract
                ? 0xfef3c7
                : 0xdcfce7,
          radius: extract.radius - 10,
          priority: isFocused ? (extractionHoldTimer > 0 ? 0 : 3) : 4,
          pulse: Math.sin(timeSeconds * 4.8 + extract.position.x * 0.001) * 6 + 6
        });
      }
    }

    return markers.sort((a, b) => a.priority - b.priority);
  }

  private createReinforcementMarker(
    pending: PendingReinforcementState,
    timeSeconds: number
  ): ObjectiveMarker {
    const urgency = 1 - pending.timer / pending.duration;
    const reinforcementPressure = getReinforcementPressureRead(raidController.state);
    const leadPending =
      raidController.state.pendingReinforcements.length > 0
        ? raidController.state.pendingReinforcements.reduce((best, entry) => (entry.timer < best.timer ? entry : best))
        : null;
    const label =
      reinforcementPressure && pending.id === leadPending?.id
        ? reinforcementPressure.markerLabel
        : pending.source === "extraction-wave"
          ? "Incoming Crash"
          : pending.label;
    return {
      label,
      position: pending.position,
      color: 0xfb7185,
      accent: 0xffedd5,
      radius: 18 + urgency * 6,
      priority: pending.source === "extraction-wave" ? 0 : 1,
      pulse: Math.sin(timeSeconds * 8 + pending.id) * 5 + 9,
      warning: true
    };
  }

  private syncObjectiveLabel(
    slots: ObjectiveLabelSlot[],
    index: number,
    config: {
      x: number;
      y: number;
      text: string;
      color: string;
      fontSize: string;
      scrollFixed: boolean;
      originX: number;
      originY: number;
    }
  ): void {
    let slot = slots[index];

    if (!slot) {
      const label = this.add.text(config.x, config.y, config.text, {
        fontFamily: "monospace",
        fontSize: config.fontSize,
        color: config.color,
        align: "center"
      });
      label.setShadow(0, 1, "#020617", 8, false, true);
      if (config.scrollFixed) {
        label.setScrollFactor(0);
      }

      slot = {
        label,
        active: true
      };
      slots.push(slot);
    }

    slot.active = true;
    slot.label.setVisible(true);
    slot.label.setPosition(config.x, config.y);
    slot.label.setText(config.text);
    slot.label.setColor(config.color);
    slot.label.setFontSize(config.fontSize);
    slot.label.setOrigin(config.originX, config.originY);
  }

  private hideUnusedObjectiveLabels(slots: ObjectiveLabelSlot[], usedCount: number): void {
    for (let index = usedCount; index < slots.length; index += 1) {
      slots[index].active = false;
      slots[index].label.setVisible(false);
    }
  }

  private hideObjectiveLabels(): void {
    this.hideUnusedObjectiveLabels(this.worldObjectiveLabels, 0);
    this.hideUnusedObjectiveLabels(this.townWarFieldworkLabels, 0);
    this.hideUnusedObjectiveLabels(this.townWarCampLabels, 0);
    this.hideUnusedObjectiveLabels(this.edgeObjectiveLabels, 0);
  }

  private activeSquadEscortLabelCount = 0;

  private syncSquadEscortLabels(
    support: FrontlineSupportState,
    anchors: { x: number; y: number }[],
    squadMates: SquadMateState[]
  ): void {
    const escortMates = squadMates.slice(0, Math.min(anchors.length, support.strength));

    escortMates.forEach((mate, index) => {
      const anchor = anchors[index];
      const laneReadout = getSquadLaneReadout(raidController.state, index);

      this.syncObjectiveLabel(this.squadEscortLabels, this.activeSquadEscortLabelCount, {
        x: anchor.x,
        y: anchor.y - (index === 1 ? 20 : 16),
        text: `${raidController.state.selectedSquadMateId === mate.id ? "> " : ""}${mate.name.toUpperCase()} ${getSquadMateWeaponLabel(mate).toUpperCase()}\n${laneReadout.shorthand}`,
        color: getSquadMateConditionColor(mate.condition),
        fontSize: "9px",
        scrollFixed: false,
        originX: 0.5,
        originY: 1
      });
      this.activeSquadEscortLabelCount += 1;
    });
  }

  private syncSquadEscortSprites(
    support: FrontlineSupportState,
    anchors: { x: number; y: number }[],
    squadMates: SquadMateState[],
    alpha: number
  ): void {
    const escortMates = squadMates.slice(0, Math.min(anchors.length, support.strength));
    const visibleIds = new Set<string>();

    escortMates.forEach((mate, index) => {
      const anchor = anchors[index];
      const escortPose = getSupportRenderPose(support, this.time.now + index * 29);
      const slotOffset = index - (escortMates.length - 1) / 2;
      const textureKey = getFriendlyCombatantKey(mate.combatProfileId);
      let sprite = this.squadMateEscortSprites.get(mate.id);

      if (!sprite) {
        sprite = this.add.sprite(anchor.x, anchor.y, textureKey);
        this.squadMateEscortSprites.set(mate.id, sprite);
      }

      visibleIds.add(mate.id);
      sprite.setVisible(true);
      sprite.setPosition(anchor.x + escortPose.offsetX + slotOffset * 2.5, anchor.y + escortPose.offsetY - Math.abs(slotOffset) * 1.5);
      sprite.setTexture(textureKey);
      sprite.setRotation(Math.atan2(support.facing.y, support.facing.x) + escortPose.rotationOffset);
      sprite.setTint(getSquadMateConditionTint(mate.condition));
      sprite.setAlpha(alpha * escortPose.alphaMultiplier);
      sprite.setScale(
        (mate.weaponId === "pkm" ? 0.96 : mate.weaponId === "shotgun" ? 0.92 : mate.weaponId === "smg" ? 0.86 : 0.9) * escortPose.scaleX,
        (mate.weaponId === "pkm" ? 0.96 : mate.weaponId === "shotgun" ? 0.92 : mate.weaponId === "smg" ? 0.86 : 0.9) * escortPose.scaleY
      );
      sprite.setDepth((anchor.y + escortPose.offsetY) * 0.001 + 0.047 + index * 0.0002);
    });

    for (const [id, sprite] of this.squadMateEscortSprites.entries()) {
      if (!visibleIds.has(id)) {
        sprite.setVisible(false);
      }
    }
  }

  private syncAimReticle(screenX: number, screenY: number): void {
    const { phase, player } = raidController.state;

    this.aimReticle.clear();

    if (phase !== "raid") {
      return;
    }

    const gap = 8 + player.currentSpread * 110;
    const lineLength = 8;
    const tint = player.currentSpread - WEAPONS[player.weaponId].spread > 0.12 ? 0xfb7185 : 0xe2e8f0;

    this.aimReticle.lineStyle(2, tint, 0.95);
    this.aimReticle.strokeCircle(screenX, screenY, 2);
    this.aimReticle.lineBetween(screenX - gap - lineLength, screenY, screenX - gap, screenY);
    this.aimReticle.lineBetween(screenX + gap, screenY, screenX + gap + lineLength, screenY);
    this.aimReticle.lineBetween(screenX, screenY - gap - lineLength, screenX, screenY - gap);
    this.aimReticle.lineBetween(screenX, screenY + gap, screenX, screenY + gap + lineLength);
  }

  private syncTelemetryPanel(): void {
    const { enemies, friendlyCombatants, frontlineSupports, frontlineIncidents, obstacles, player, extractZone, extractionReady, extractionContested } =
      raidController.state;
    const renderedSupports = frontlineSupports.filter(
      (support) => !this.isSupportRepresentedByFriendlyCombatant(support, friendlyCombatants)
    );
    const renderedIncidents = frontlineIncidents.filter(
      (incident) => !this.isIncidentRepresentedByFriendlyCombatant(incident, friendlyCombatants)
    );
    const trackedPositions = [
      player.position,
      ...enemies.map((enemy) => enemy.position),
      ...friendlyCombatants.map((combatant) => combatant.position),
      ...renderedSupports.map((support) => support.position),
      ...renderedIncidents.map((incident) => incident.position)
    ];

    let spanWidth = 0;
    let spanHeight = 0;
    if (trackedPositions.length > 0) {
      let minX = trackedPositions[0].x;
      let maxX = trackedPositions[0].x;
      let minY = trackedPositions[0].y;
      let maxY = trackedPositions[0].y;
      for (const position of trackedPositions) {
        minX = Math.min(minX, position.x);
        maxX = Math.max(maxX, position.x);
        minY = Math.min(minY, position.y);
        maxY = Math.max(maxY, position.y);
      }
      spanWidth = maxX - minX;
      spanHeight = maxY - minY;
    }

    const hotFirefights = renderedIncidents.filter((incident) => !incident.resolved && incident.kind === "firefight").length;
    const activeSupports = renderedSupports.filter((support) => support.status !== "retreating").length;
    const extractState = extractionContested
      ? "CONTESTED"
      : extractionReady
        ? "READY"
        : Phaser.Math.Distance.Between(player.position.x, player.position.y, extractZone.position.x, extractZone.position.y) <
            extractZone.radius
          ? "ON HOLD"
          : "HOT";
    const nearestDoorwayObstacle = obstacles
      .filter((obstacle) => (obstacle.doorways?.length ?? 0) > 0)
      .flatMap((obstacle) =>
        (obstacle.doorways ?? []).map((doorway) => ({
          obstacle,
          doorway,
          distance: (() => {
            const depth = doorway.depth ?? 40;
            const center =
              doorway.side === "top"
                ? { x: obstacle.x + doorway.offset, y: obstacle.y - 4 + (depth + 4) / 2 }
                : doorway.side === "bottom"
                  ? { x: obstacle.x + doorway.offset, y: obstacle.y + obstacle.height - depth + (depth + 4) / 2 }
                  : doorway.side === "left"
                    ? { x: obstacle.x - 4 + (depth + 4) / 2, y: obstacle.y + doorway.offset }
                    : { x: obstacle.x + obstacle.width - depth + (depth + 4) / 2, y: obstacle.y + doorway.offset };

            return Phaser.Math.Distance.Between(player.position.x, player.position.y, center.x, center.y);
          })()
        }))
      )
      .sort((left, right) => left.distance - right.distance)[0] ?? null;
    const doorwayState =
      nearestDoorwayObstacle
        ? `${nearestDoorwayObstacle.obstacle.breach?.label ?? nearestDoorwayObstacle.obstacle.label ?? "doorway"} ${nearestDoorwayObstacle.distance.toFixed(0)}px`
        : "no doorway";

    this.telemetryPanelBody.setText([
      `span ${spanWidth.toFixed(0)}x${spanHeight.toFixed(0)} | hostile ${enemies.length + renderedIncidents.length} | friendly ${friendlyCombatants.length + activeSupports + 1}`,
      `contact ${hotFirefights} | exfil ${extractState} | door ${doorwayState}`
    ]);
  }

  private syncNoiseDisciplinePanel(): void {
    const panel = buildSceneNoiseDisciplinePanel();

    this.noiseDisciplinePanelBg.setStrokeStyle(1, panel.borderColor, 0.9);
    this.noiseDisciplinePanelTitle.setText(panel.title);
    this.noiseDisciplinePanelTitle.setColor(panel.accent);
    this.noiseDisciplinePanelBody.setText(panel.lines);
    this.noiseDisciplinePanelBody.setColor(panel.bodyColor);
  }

  private syncPressurePosturePanel(): void {
    const panel = buildScenePressurePosturePanel();
    const visible = panel.visible && !isRaidTacticalDrawerOpen();

    this.pressurePosturePanelBg.setVisible(visible);
    this.pressurePosturePanelTitle.setVisible(visible);
    this.pressurePosturePanelBody.setVisible(visible);
    if (!visible) {
      return;
    }

    this.pressurePosturePanelBg.setStrokeStyle(1, panel.borderColor, 0.9);
    this.pressurePosturePanelTitle.setText(panel.title);
    this.pressurePosturePanelTitle.setColor(panel.accent);
    this.pressurePosturePanelBody.setText(panel.lines);
    this.pressurePosturePanelBody.setColor(panel.bodyColor);
  }

  private syncFrontlineOperationPanel(): void {
    const panel = buildSceneFrontlineOperationPanel();
    const visible = panel.visible && !isRaidTacticalDrawerOpen();

    this.frontlineOperationPanelBg.setVisible(visible);
    this.frontlineOperationPanelTitle.setVisible(visible);
    this.frontlineOperationPanelBody.setVisible(visible);
    if (!visible) {
      return;
    }
    this.frontlineOperationPanelBg.setStrokeStyle(1, panel.borderColor, 0.9);
    this.frontlineOperationPanelTitle.setText(panel.title);
    this.frontlineOperationPanelTitle.setColor(panel.accent);
    this.frontlineOperationPanelBody.setText(panel.lines);
    this.frontlineOperationPanelBody.setColor(panel.bodyColor);
  }

  private syncCombatPulsePanel(): void {
    const panel = buildSceneCombatPulsePanel();
    const visible = panel.visible && !isRaidTacticalDrawerOpen();

    this.combatPulsePanelBg.setVisible(visible);
    this.combatPulsePanelTitle.setVisible(visible);
    this.combatPulsePanelBody.setVisible(visible);
    if (!visible) {
      return;
    }
    this.combatPulsePanelBg.setStrokeStyle(1, panel.borderColor, 0.9);
    this.combatPulsePanelTitle.setText(panel.title);
    this.combatPulsePanelTitle.setColor(panel.accent);
    this.combatPulsePanelBody.setText(panel.lines);
    this.combatPulsePanelBody.setColor(panel.bodyColor);
  }

  private syncCombatAudioPanel(): void {
    const panel = buildSceneCombatAudioPanel(this.combatAudioEngine.getMode());
    const visible = panel.visible;

    this.combatAudioPanelBg.setVisible(visible);
    this.combatAudioPanelTitle.setVisible(visible);
    this.combatAudioPanelBody.setVisible(visible);
    if (!visible) {
      return;
    }
    this.combatAudioPanelBg.setStrokeStyle(1, panel.borderColor, 0.9);
    this.combatAudioPanelTitle.setText(panel.title);
    this.combatAudioPanelTitle.setColor(panel.accent);
    this.combatAudioPanelBody.setText(panel.lines);
    this.combatAudioPanelBody.setColor(panel.bodyColor);
  }

  private syncExtractPressurePanel(): void {
    const panel = buildSceneExtractPressurePanel();

    this.extractPressurePanelBg.setStrokeStyle(1, panel.borderColor, 0.9);
    this.extractPressurePanelTitle.setText(panel.title);
    this.extractPressurePanelTitle.setColor(panel.accent);
    this.extractPressurePanelBody.setText(panel.lines);
    this.extractPressurePanelBody.setColor(panel.bodyColor);
  }

  private syncSquadCommandPanel(): void {
    const panel = buildSceneSquadCommandPanel();
    const visible = !isRaidTacticalDrawerOpen();

    this.squadCommandPanelBg.setVisible(visible);
    this.squadCommandPanelTitle.setVisible(visible);
    this.squadCommandPanelBody.setVisible(visible);
    if (!visible) {
      return;
    }
    this.squadCommandPanelBg.setStrokeStyle(1, panel.borderColor, 0.9);
    this.squadCommandPanelTitle.setText(panel.title);
    this.squadCommandPanelTitle.setColor(panel.accent);
    this.squadCommandPanelBody.setText(panel.lines);
    this.squadCommandPanelBody.setColor(panel.bodyColor);
  }

  private syncSquadTrafficPanel(): void {
    const panel = buildSceneSquadTrafficPanel();
    const visible = panel.visible && !isRaidTacticalDrawerOpen();

    this.squadTrafficPanelBg.setVisible(visible);
    this.squadTrafficPanelTitle.setVisible(visible);
    this.squadTrafficPanelBody.setVisible(visible);
    if (!visible) {
      return;
    }
    this.squadTrafficPanelBg.setStrokeStyle(1, panel.borderColor, 0.9);
    this.squadTrafficPanelTitle.setText(panel.title);
    this.squadTrafficPanelTitle.setColor(panel.accent);
    this.squadTrafficPanelBody.setText(panel.lines);
    this.squadTrafficPanelBody.setColor(panel.bodyColor);
  }

  private syncHostileTrafficPanel(): void {
    const panel = buildSceneHostileTrafficPanel();
    const visible = panel.visible && !isRaidTacticalDrawerOpen();

    this.hostileTrafficPanelBg.setVisible(visible);
    this.hostileTrafficPanelTitle.setVisible(visible);
    this.hostileTrafficPanelBody.setVisible(visible);
    if (!visible) {
      return;
    }
    this.hostileTrafficPanelBg.setStrokeStyle(1, panel.borderColor, 0.9);
    this.hostileTrafficPanelTitle.setText(panel.title);
    this.hostileTrafficPanelTitle.setColor(panel.accent);
    this.hostileTrafficPanelBody.setText(panel.lines);
    this.hostileTrafficPanelBody.setColor(panel.bodyColor);
  }

  private syncFrontlineAftermathPanel(): void {
    const panel = buildSceneFrontlineAftermathPanel();
    const visible = panel.visible && !isRaidTacticalDrawerOpen();

    this.frontlineAftermathPanelBg.setVisible(visible);
    this.frontlineAftermathPanelTitle.setVisible(visible);
    this.frontlineAftermathPanelBody.setVisible(visible);
    if (!visible) {
      return;
    }
    this.frontlineAftermathPanelBg.setStrokeStyle(1, panel.borderColor, 0.9);
    this.frontlineAftermathPanelTitle.setText(panel.title);
    this.frontlineAftermathPanelTitle.setColor(panel.accent);
    this.frontlineAftermathPanelBody.setText(panel.lines);
    this.frontlineAftermathPanelBody.setColor(panel.bodyColor);
  }

  private syncSpriteCollection<T extends { id: number; position: { x: number; y: number } }>(
    spriteMap: SpriteMap,
    states: T[],
    factory: (state: T) => Phaser.GameObjects.Sprite
  ): void {
    const stateIds = new Set(states.map((state) => state.id));

    for (const state of states) {
      if (!spriteMap.has(state.id)) {
        spriteMap.set(state.id, factory(state));
      }
    }

    for (const [id, sprite] of spriteMap.entries()) {
      if (!stateIds.has(id) || raidController.state.phase !== "raid") {
        sprite.destroy();
        spriteMap.delete(id);
      }
    }
  }
}
