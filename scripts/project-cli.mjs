import { spawn } from "node:child_process";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import viewportModule from "../automation-artifacts/playwright-viewport.cjs";

const host = "127.0.0.1";
const port = 5847;
const existingServerProbeMs = 4000;
const defaultUrl = `http://${host}:${port}/`;
const { DESKTOP_VIEWPORT } = viewportModule;
const controlSurfaceMinUptimeSeconds = 2.5;
const controlSurfaceStableSamples = 3;
const controlSurfacePollMs = 250;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const storyPackDirectory = path.resolve(repoRoot, "src/game/dialogue/story-packs");

function parseArgs(argv) {
  const positionals = [];
  const options = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      positionals.push(token);
      continue;
    }

    const key = token.slice(2);
    const next = argv[index + 1];

    if (!next || next.startsWith("--")) {
      options[key] = true;
      continue;
    }

    options[key] = next;
    index += 1;
  }

  return { positionals, options };
}

function parseNumber(value, fallback = 0) {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Expected a number, received "${value}".`);
  }

  return parsed;
}

function parseIncidentFocusValue(value) {
  if (value === undefined || value === null || value === "clear") {
    return null;
  }

  return parseNumber(value);
}

async function resolveIncidentFocusValue(page, value) {
  if (value === undefined || value === null || value === "clear") {
    return null;
  }

  if (typeof value === "string" && /^index:\d+$/i.test(value)) {
    const snapshot = await callAgent(page, "getSnapshot");
    const index = parseNumber(value.slice(6), 0);
    const match = snapshot.frontline?.incidents?.find((incident) => incident.index === index);

    if (!match) {
      throw new Error(`No frontline incident exists at index ${index}.`);
    }

    return match.id;
  }

  return parseIncidentFocusValue(value);
}

function parseVector(value) {
  if (typeof value !== "string") {
    throw new Error("Expected comma-separated coordinates, e.g. \"420,280\".");
  }

  const parts = value.split(",").map((entry) => entry.trim());

  if (parts.length !== 2) {
    throw new Error(`Expected coordinates as "<x>,<y>", received "${value}".`);
  }

  const x = Number(parts[0]);
  const y = Number(parts[1]);

  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    throw new Error(`Expected coordinates as "<x>,<y>", received "${value}".`);
  }

  return { x, y };
}

function parseMoveVector(value) {
  if (value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error(
      "raid-action --move expects one of up|down|left|right|upleft|upright|downleft|downright or a vector like \"200,80\"."
    );
  }

  const move = value.toLowerCase().trim();
  if (move === "up") {
    return { x: 0, y: -1 };
  }
  if (move === "down") {
    return { x: 0, y: 1 };
  }
  if (move === "left") {
    return { x: -1, y: 0 };
  }
  if (move === "right") {
    return { x: 1, y: 0 };
  }
  if (move === "upleft") {
    return { x: -1, y: -1 };
  }
  if (move === "upright") {
    return { x: 1, y: -1 };
  }
  if (move === "downleft") {
    return { x: -1, y: 1 };
  }
  if (move === "downright") {
    return { x: 1, y: 1 };
  }

  return parseVector(value);
}

function parseBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }

  if (value === "true" || value === "1") {
    return true;
  }

  if (value === "false" || value === "0") {
    return false;
  }

  throw new Error(`Expected true/false, received "${value}".`);
}

function getTownWarSoldiers(war) {
  if (Array.isArray(war?.townWar?.soldiers)) {
    return war.townWar.soldiers;
  }
  if (Array.isArray(war?.soldiers)) {
    return war.soldiers;
  }
  return [];
}

function formatWarSkillName(skill) {
  return String(skill ?? "")
    .split("-")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function getTopWarSkills(skills, count = 2) {
  if (!skills || typeof skills !== "object") {
    return [];
  }

  return Object.entries(skills)
    .filter(([, value]) => Number.isFinite(value))
    .sort((left, right) => right[1] - left[1])
    .slice(0, count)
    .map(([skill, value]) => ({ skill, label: formatWarSkillName(skill), value }));
}

function summarizeWarSoldierIdentity(soldier) {
  const topSkills = getTopWarSkills(soldier?.skills, 2);
  const bestSkillsText =
    soldier?.identitySummary?.bestSkills ??
    topSkills.map((entry) => `${entry.label} ${entry.value}`).join(", ") ??
    "unknown";
  const primaryTrait = Array.isArray(soldier?.traits) && soldier.traits.length > 0 ? soldier.traits[0] : null;
  const trust = soldier?.identitySummary?.trust ?? "unknown";
  const currentNeed = soldier?.currentNeed ?? soldier?.identitySummary?.currentNeed ?? "unknown";
  const usefulSkill =
    soldier?.identitySummary?.usefulSkill ??
    (topSkills[0] ? `${topSkills[0].label} ${topSkills[0].value}` : "unknown");
  const risk = soldier?.identitySummary?.risk ?? "unknown";

  return {
    id: soldier?.id ?? null,
    name: soldier?.displayName ?? soldier?.id ?? null,
    faction: soldier?.faction ?? null,
    role: soldier?.role ?? null,
    archetype: soldier?.archetype ?? null,
    bestSkills: bestSkillsText,
    usefulSkill,
    risk,
    trait: primaryTrait,
    currentNeed,
    trust,
    readable:
      `${soldier?.displayName ?? soldier?.id ?? "soldier"} | Best skills: ${bestSkillsText || "unknown"} | ` +
      `Trait: ${primaryTrait ?? "none"} | Current need: ${currentNeed} | Trust: ${trust} | Risk: ${risk}`
  };
}

function summarizeWarTaskDecision(soldier) {
  const decision = soldier?.taskDecision ?? null;
  const topCandidates = Array.isArray(decision?.candidates) ? decision.candidates.slice(0, 4) : [];
  return {
    soldierId: soldier?.id ?? null,
    name: soldier?.displayName ?? soldier?.id ?? null,
    faction: soldier?.faction ?? null,
    role: soldier?.role ?? null,
    selectedWork: decision?.selectedWork ?? null,
    selectedScore: decision?.selectedScore ?? null,
    selectedReason: decision?.selectedReason ?? null,
    blockedReason: decision?.blockedReason ?? null,
    currentTask: soldier?.task?.kind ?? null,
    priorities: {
      Build: soldier?.workPriorities?.Build ?? null,
      Rescue: soldier?.workPriorities?.Rescue ?? null,
      Resupply: soldier?.workPriorities?.Resupply ?? null,
      Defend: soldier?.workPriorities?.Defend ?? null,
      Suppress: soldier?.workPriorities?.Suppress ?? null,
      Rest: soldier?.workPriorities?.Rest ?? null
    },
    topCandidates: topCandidates.map((candidate) => ({
      work: candidate?.work ?? null,
      taskKind: candidate?.taskKind ?? null,
      score: candidate?.score ?? null,
      blockedReason: candidate?.blockedReason ?? null,
      reason: candidate?.reason ?? null,
      scoreParts: candidate?.scoreParts ?? null
    })),
    readable: `${soldier?.displayName ?? soldier?.id ?? "soldier"} | selected ${decision?.selectedWork ?? "none"} (${decision?.selectedScore ?? 0}) | ` +
      `Build ${soldier?.workPriorities?.Build ?? "?"} Rescue ${soldier?.workPriorities?.Rescue ?? "?"} Resupply ${soldier?.workPriorities?.Resupply ?? "?"} ` +
      `Defend ${soldier?.workPriorities?.Defend ?? "?"} Suppress ${soldier?.workPriorities?.Suppress ?? "?"} Rest ${soldier?.workPriorities?.Rest ?? "?"}`
  };
}

function buildWarPriorityWarnings(rows) {
  const campARows = rows.filter((row) => row?.faction === "camp-a");
  const highBuilders = campARows.filter((row) => (row?.priorities?.Build ?? 0) >= 4).length;
  const highSuppressors = campARows.filter((row) => (row?.priorities?.Suppress ?? 0) >= 4).length;
  const highMedics = campARows.filter((row) => (row?.priorities?.Rescue ?? 0) >= 4).length;
  const highResupply = campARows.filter((row) => (row?.priorities?.Resupply ?? 0) >= 4).length;
  const tiredIgnored = campARows.some((row) => row?.selectedWork !== "Rest" && row?.blockedReason === "rest priority overrides noncritical work");
  const warnings = [];
  if (highBuilders > 0 && highSuppressors === 0) {
    warnings.push("All builders, no cover");
  }
  if (highMedics === 0) {
    warnings.push("No medic assigned");
  }
  if (highResupply > 0 && highSuppressors === 0) {
    warnings.push("Ammo hauling uncovered");
  }
  if (campARows.some((row) => row?.selectedWork === "Build" && row?.blockedReason === "low nerve resists exposed work")) {
    warnings.push("Best builder exposed");
  }
  if (tiredIgnored) {
    warnings.push("Rest ignored: fatigue rising");
  }
  return warnings;
}

function buildTownWarBrief(war) {
  if (!war || typeof war !== "object") {
    return null;
  }

  const activeSector = war.town?.activeSector;
  const sector =
    activeSector && typeof activeSector === "object"
      ? {
          routeName: activeSector.routeName ?? null,
          zoneLabel: activeSector.zoneLabel ?? null,
          control: activeSector.control ?? null,
          pressure: activeSector.pressure ?? null,
          fortification: activeSector.fortification ?? null
        }
      : null;

  const camps = Array.isArray(war.camps)
    ? war.camps.map((camp) => ({
        id: camp.id ?? null,
        label: camp.label ?? null,
        spawn: camp.spawn ?? null,
        spawnedSoldiers: camp.spawnedSoldiers ?? null,
        health: camp.health ?? null,
        maxHealth: camp.maxHealth ?? null,
        supply: camp.supply ?? null,
        readiness: Number.isFinite(camp?.sustainment?.readiness) ? camp.sustainment.readiness : camp?.control?.readiness ?? null,
        sustainment: camp.sustainment ?? null,
        destroyed: camp.destroyed ?? null
      }))
    : [];

  const officer =
    war.officer && typeof war.officer === "object"
      ? {
          faction: war.officer.faction ?? null,
          position: war.officer.position ?? null,
          focusedLane: war.officer.focusedLane ?? null,
          lastCommandRead: war.officer.lastCommandRead ?? null
        }
      : null;

  const orders = Array.isArray(war.townWar?.orders) ? war.townWar.orders : [];
  const soldiers = getTownWarSoldiers(war);
  const ammoCrates = Array.isArray(war.townWar?.ammoCrates) ? war.townWar.ammoCrates : [];
  const casualties = Array.isArray(war.casualties) ? war.casualties : Array.isArray(war.townWar?.casualties) ? war.townWar.casualties : [];
  const chatter = Array.isArray(war.townWar?.chatter) ? war.townWar.chatter : [];
  const dialogue = war.dialogue ?? war.townWar?.dialogue ?? null;
  const aiThreats = war.aiThreats ?? war.townWar?.aiThreats ?? null;
  const aiTactics = war.aiTactics ?? war.townWar?.aiTactics ?? null;
  const dramaMemories = Array.isArray(war.dramaMemories) ? war.dramaMemories : Array.isArray(war.townWar?.dramaMemories) ? war.townWar.dramaMemories : [];
  const dramaBeat = war.dramaBeat ?? war.townWar?.dramaBeat ?? null;
  const debriefEchoes = Array.isArray(war.debriefEchoes) ? war.debriefEchoes : Array.isArray(war.townWar?.debriefEchoes) ? war.townWar.debriefEchoes : [];
  const flankPressures = Array.isArray(war.flankPressures) ? war.flankPressures : Array.isArray(war.townWar?.flankPressures) ? war.townWar.flankPressures : [];
  const skillDebrief = war.skillDebrief ?? war.townWar?.skillDebrief ?? null;
  const storyPackAudit = war.storyPackAudit ?? war.townWar?.storyPackAudit ?? null;
  const locationScars = Array.isArray(war.locationScars)
    ? war.locationScars
    : Array.isArray(war.townWar?.locationScars)
      ? war.townWar.locationScars
      : [];
  const focusedLocationScar = war.focusedLocationScar ?? war.townWar?.focusedLocationScar ?? null;
  const byCamp = {};
  const spawnedFromByCamp = {};
  let spawnOriginMismatches = 0;

  for (const soldier of soldiers) {
    const campId = soldier?.faction ?? "unknown";
    const spawnedFrom = soldier?.spawnedFromCampId ?? "unknown";
    const taskKind = soldier?.task?.kind ?? "unknown";
    const role = soldier?.role ?? "unknown";
    const pressure = Number.isFinite(soldier?.morale?.pressure) ? soldier.morale.pressure : null;

    if (!byCamp[campId]) {
      byCamp[campId] = { count: 0, maxPressure: 0, tasks: {}, roles: {} };
    }

    byCamp[campId].count += 1;
    byCamp[campId].tasks[taskKind] = (byCamp[campId].tasks[taskKind] ?? 0) + 1;
    byCamp[campId].roles[role] = (byCamp[campId].roles[role] ?? 0) + 1;
    if (pressure !== null) {
      byCamp[campId].maxPressure = Math.max(byCamp[campId].maxPressure, pressure);
    }

    spawnedFromByCamp[spawnedFrom] = (spawnedFromByCamp[spawnedFrom] ?? 0) + 1;
    if (spawnedFrom !== "unknown" && campId !== "unknown" && spawnedFrom !== campId) {
      spawnOriginMismatches += 1;
    }
  }

  const orderByKind = {};
  let ordersCompleted = 0;

  for (const order of orders) {
    const kind = order?.kind ?? "unknown";
    const status = order?.status ?? "unknown";
    orderByKind[kind] = (orderByKind[kind] ?? 0) + 1;
    if (status === "completed") {
      ordersCompleted += 1;
    }
  }

  const crateByCamp = {};
  const crateByRisk = {};
  let crateAmmoRemaining = 0;
  let cratesDestroyed = 0;

  for (const crate of ammoCrates) {
    const campId = crate?.faction ?? "unknown";
    const riskTier = crate?.riskTier ?? "unknown";
    crateByRisk[riskTier] = (crateByRisk[riskTier] ?? 0) + 1;
    if (!crateByCamp[campId]) {
      crateByCamp[campId] = { count: 0, ammoRemaining: 0, destroyed: 0 };
    }

    crateByCamp[campId].count += 1;
    const ammo = Number.isFinite(crate?.ammo) ? crate.ammo : 0;
    crateAmmoRemaining += ammo;
    crateByCamp[campId].ammoRemaining += ammo;

    if (crate?.destroyedAtSeconds !== null && crate?.destroyedAtSeconds !== undefined) {
      cratesDestroyed += 1;
      crateByCamp[campId].destroyed += 1;
    }
  }

  return {
    sector,
    officer,
    camps,
    chatter: chatter.slice(-12).map((entry) => ({
      stamp: Number.isFinite(entry?.atSeconds) ? `${entry.atSeconds.toFixed(1)}s` : null,
      faction: entry?.faction ?? null,
      channel: entry?.channel ?? null,
      text: entry?.text ?? null,
      tags: Array.isArray(entry?.tags) ? entry.tags : []
    })),
    orders: {
      total: orders.length,
      completed: ordersCompleted,
      byKind: orderByKind
    },
    soldiers: {
      total: soldiers.length,
      byCamp,
      spawnedFromByCamp,
      spawnOriginMismatches,
      targetIntents: soldiers.slice(0, 12).map((soldier) => ({
        id: soldier?.id ?? null,
        faction: soldier?.faction ?? null,
        role: soldier?.role ?? null,
        task: soldier?.task?.kind ?? null,
        targetKind: soldier?.targetIntent?.targetKind ?? null,
        targetId: soldier?.targetIntent?.targetId ?? null,
        targetScore: Number.isFinite(soldier?.targetIntent?.targetScore) ? soldier.targetIntent.targetScore : null,
        reason: soldier?.targetIntent?.reason ?? null
      })),
      tacticalIntents: soldiers.slice(0, 12).map((soldier) => ({
        id: soldier?.id ?? null,
        faction: soldier?.faction ?? null,
        role: soldier?.role ?? null,
        state: soldier?.tacticalIntent?.state ?? null,
        reason: soldier?.tacticalIntent?.reason ?? null,
        coverSlotId: soldier?.tacticalIntent?.coverSlotId ?? null,
        coverState: soldier?.coverIntent?.state ?? null,
        pressureRatio: Number.isFinite(soldier?.tacticalIntent?.pressureRatio) ? soldier.tacticalIntent.pressureRatio : null
      })),
      memory: soldiers.slice(0, 8).map((soldier) => ({
        id: soldier?.id ?? null,
        faction: soldier?.faction ?? null,
        role: soldier?.role ?? null,
        dramaMemoryTags: Array.isArray(soldier?.dramaMemoryTags) ? soldier.dramaMemoryTags : [],
        witnessedEventCount: Number.isFinite(soldier?.witnessedEventCount) ? soldier.witnessedEventCount : 0,
        trustInOfficer: Number.isFinite(soldier?.dramaArc?.trustInOfficer) ? soldier.dramaArc.trustInOfficer : null,
        relationshipPressure: soldier?.dramaArc?.relationshipPressure ?? null,
        dramaArc: soldier?.dramaArc ?? null
      })),
      identity: soldiers.slice(0, 12).map((soldier) => summarizeWarSoldierIdentity(soldier))
    },
    ammoCrates: {
      total: ammoCrates.length,
      destroyed: cratesDestroyed,
      ammoRemaining: crateAmmoRemaining,
      byRisk: crateByRisk,
      byCamp: crateByCamp
    },
    sustainment: {
      camps: camps.map((camp) => ({
        id: camp.id,
        label: camp.label,
        readiness: camp.readiness,
        fatigueAverage: Number.isFinite(camp?.sustainment?.fatigueAverage) ? camp.sustainment.fatigueAverage : null,
        hungerAverage: Number.isFinite(camp?.sustainment?.hungerAverage) ? camp.sustainment.hungerAverage : null,
        moraleAverage: Number.isFinite(camp?.sustainment?.moraleAverage) ? camp.sustainment.moraleAverage : null,
        ammoFlow: Number.isFinite(camp?.sustainment?.ammoFlow) ? camp.sustainment.ammoFlow : null,
        cookEffect: Number.isFinite(camp?.sustainment?.cookEffect) ? camp.sustainment.cookEffect : null,
        restCycle: Number.isFinite(camp?.sustainment?.restCycle) ? camp.sustainment.restCycle : null,
        bottleneckReason: camp?.sustainment?.bottleneckReason ?? null,
        warnings: Array.isArray(camp?.sustainment?.warnings) ? camp.sustainment.warnings : [],
        workPriorities: camp?.sustainment?.workPriorities ?? null
      })),
      warnings: camps.flatMap((camp) => (Array.isArray(camp?.sustainment?.warnings) ? camp.sustainment.warnings.map((warning) => `${camp.id}: ${warning}`) : []))
    },
    casualties: {
      total: casualties.length,
      active: casualties.filter((casualty) => casualty?.status === "wounded" || casualty?.status === "downed").length,
      stabilized: casualties.filter((casualty) => casualty?.status === "stabilized").length,
      lost: casualties.filter((casualty) => casualty?.status === "lost").length,
      recent: casualties.slice(0, 8).map((casualty) => ({
        id: casualty?.id ?? null,
        soldierId: casualty?.soldierId ?? null,
        severity: casualty?.severity ?? null,
        status: casualty?.status ?? null,
        assignedMedicId: casualty?.assignedMedicId ?? null,
        rescueScore: Number.isFinite(casualty?.rescueScore) ? casualty.rescueScore : null,
        pathRisk: Number.isFinite(casualty?.pathRisk) ? casualty.pathRisk : null,
        coveredPath: Number.isFinite(casualty?.coveredPath) ? casualty.coveredPath : null,
        outcomeCause: casualty?.outcomeCause ?? null,
        causeChain: Array.isArray(casualty?.causeChain) ? casualty.causeChain : []
      }))
    },
    dialogue: {
      lastDramaEvent: dialogue?.lastDramaEvent ?? null,
      activeOfficerWarTags: Array.isArray(dialogue?.activeOfficerWarTags) ? dialogue.activeOfficerWarTags : [],
      activeScarTags: Array.isArray(dialogue?.activeScarTags) ? dialogue.activeScarTags : [],
      recentDramaEvents: Array.isArray(dialogue?.recentDramaEvents)
        ? dialogue.recentDramaEvents.slice(0, 8).map((event) => ({
            stamp: Number.isFinite(event?.atSeconds) ? `${event.atSeconds.toFixed(1)}s` : null,
            kind: event?.kind ?? null,
            faction: event?.faction ?? null,
            summary: event?.summary ?? null,
            speaker: event?.speaker ?? null,
            text: event?.text ?? null,
            tags: Array.isArray(event?.tags) ? event.tags : []
          }))
        : []
    },
    aiThreats: aiThreats
      ? {
          playerThreatShare: Number.isFinite(aiThreats?.playerThreatShare) ? aiThreats.playerThreatShare : null,
          playerThreatScore: Number.isFinite(aiThreats?.playerThreatScore) ? aiThreats.playerThreatScore : null,
          playerThreatReason: aiThreats?.playerThreatReason ?? null,
          frontlineFocus: aiThreats?.frontlineFocus ?? null,
          contacts: Array.isArray(aiThreats?.contacts)
            ? aiThreats.contacts.slice(0, 8).map((contact) => ({
                faction: contact?.faction ?? null,
                sourceId: contact?.sourceId ?? null,
                sourceKind: contact?.sourceKind ?? null,
                score: Number.isFinite(contact?.score) ? contact.score : null,
                reason: contact?.reason ?? null
              }))
            : []
        }
      : null,
    aiTactics: aiTactics
      ? {
          coverSlots: Array.isArray(aiTactics?.coverSlots)
            ? aiTactics.coverSlots.slice(0, 12).map((slot) => ({
                id: slot?.id ?? null,
                faction: slot?.faction ?? null,
                label: slot?.label ?? null,
                sourceKind: slot?.sourceKind ?? null,
                protection: Number.isFinite(slot?.protection) ? slot.protection : null,
                occupiedBySoldierId: slot?.occupiedBySoldierId ?? null
              }))
            : [],
          suppressionFields: Array.isArray(aiTactics?.suppressionFields) ? aiTactics.suppressionFields : [],
          tacticalPairs: Array.isArray(aiTactics?.tacticalPairs) ? aiTactics.tacticalPairs : [],
          completedConstructionImpact: Array.isArray(aiTactics?.completedConstructionImpact) ? aiTactics.completedConstructionImpact : []
        }
      : null,
    dramaMemories: dramaMemories.slice(0, 8).map((memory) => ({
      id: memory?.id ?? null,
      eventKind: memory?.eventKind ?? null,
      tag: memory?.tag ?? null,
      cause: memory?.cause ?? null,
      responsibility: memory?.responsibility ?? null,
      subjectId: memory?.subjectId ?? null,
      subjectName: memory?.subjectName ?? null,
      locationName: memory?.locationName ?? null,
      orderId: memory?.orderId ?? null,
      witnessIds: Array.isArray(memory?.witnessIds) ? memory.witnessIds : [],
      emotionalWeight: Number.isFinite(memory?.emotionalWeight) ? memory.emotionalWeight : null,
      lastReferencedAt: Number.isFinite(memory?.lastReferencedAt) ? memory.lastReferencedAt : null,
      summary: memory?.summary ?? null
    })),
    locationScars: locationScars.slice(0, 12).map((scar) => ({
      id: scar?.id ?? null,
      label: scar?.label ?? null,
      kind: scar?.kind ?? null,
      position: scar?.position ?? null,
      tags: Array.isArray(scar?.tags) ? scar.tags : [],
      subjectNames: Array.isArray(scar?.subjectNames) ? scar.subjectNames : [],
      orderId: scar?.orderId ?? null,
      controlSide: scar?.controlSide ?? null,
      emotionalWeight: Number.isFinite(scar?.emotionalWeight) ? scar.emotionalWeight : null,
      timesReferenced: Number.isFinite(scar?.timesReferenced) ? scar.timesReferenced : 0,
      lastChangedAt: Number.isFinite(scar?.lastChangedAt) ? scar.lastChangedAt : null
    })),
    focusedLocationScar: focusedLocationScar
      ? {
          id: focusedLocationScar.id ?? null,
          label: focusedLocationScar.label ?? null,
          kind: focusedLocationScar.kind ?? null,
          position: focusedLocationScar.position ?? null,
          tags: Array.isArray(focusedLocationScar.tags) ? focusedLocationScar.tags : [],
          subjectNames: Array.isArray(focusedLocationScar.subjectNames) ? focusedLocationScar.subjectNames : [],
          orderId: focusedLocationScar.orderId ?? null,
          controlSide: focusedLocationScar.controlSide ?? null,
          emotionalWeight: Number.isFinite(focusedLocationScar.emotionalWeight) ? focusedLocationScar.emotionalWeight : null,
          timesReferenced: Number.isFinite(focusedLocationScar.timesReferenced) ? focusedLocationScar.timesReferenced : 0,
          lastChangedAt: Number.isFinite(focusedLocationScar.lastChangedAt) ? focusedLocationScar.lastChangedAt : null
        }
      : null,
    dramaBeat: dramaBeat
      ? {
          current: dramaBeat.current ?? null,
          chain: Array.isArray(dramaBeat.chain)
            ? dramaBeat.chain.slice(0, 8).map((entry) => ({
                beat: entry?.beat ?? null,
                eventKind: entry?.eventKind ?? null,
                orderId: entry?.orderId ?? null,
                locationLabel: entry?.locationLabel ?? null,
                summary: entry?.summary ?? null,
                tags: Array.isArray(entry?.tags) ? entry.tags : []
              }))
            : [],
          lastPayoff: dramaBeat.lastPayoff ?? null
        }
      : null,
    debriefEchoes: debriefEchoes.slice(0, 8).map((echo) => ({
      beat: echo?.beat ?? null,
      eventKind: echo?.eventKind ?? null,
      category: echo?.category ?? null,
      text: echo?.text ?? null,
      sourceSummary: echo?.sourceSummary ?? null,
      tags: Array.isArray(echo?.tags) ? echo.tags : []
    })),
    skillEmergence: {
      flanks: flankPressures.slice(0, 8).map((flank) => ({
        id: flank?.id ?? null,
        lane: flank?.lane ?? null,
        pressure: flank?.pressure ?? null,
        status: flank?.status ?? null,
        scoutId: flank?.scoutId ?? null,
        scoutScore: Number.isFinite(flank?.scoutScore) ? flank.scoutScore : null,
        outcome: flank?.outcome ?? null,
        causeChain: Array.isArray(flank?.causeChain) ? flank.causeChain : [],
        readable: flank?.readable ?? null
      })),
      debrief: skillDebrief
        ? {
            lastOutcome: skillDebrief.lastOutcome ?? null,
            outcomes: Array.isArray(skillDebrief.outcomes) ? skillDebrief.outcomes.slice(0, 6) : [],
            recommendedNextPlan: skillDebrief.recommendedNextPlan ?? null,
            causeChain: Array.isArray(skillDebrief.causeChain) ? skillDebrief.causeChain : [],
            summary: skillDebrief.summary ?? null
          }
        : null
    },
    storyPackAudit: storyPackAudit
      ? {
          ok: storyPackAudit.ok === true,
          errorCount: Array.isArray(storyPackAudit.errors) ? storyPackAudit.errors.length : 0,
          warningCount: Array.isArray(storyPackAudit.warnings) ? storyPackAudit.warnings.length : 0,
          totals: storyPackAudit.totals ?? null,
          byFamily: Array.isArray(storyPackAudit.byFamily) ? storyPackAudit.byFamily : []
        }
      : null
  };
}

async function applyRaidAction(page, options) {
  if (options.move) {
    const move = parseMoveVector(options.move);
    if (!move) {
      throw new Error(
        "raid-action requires --move to be one of up|down|left|right|upleft|upright|downleft|downright or a vector like \"200,80\"."
      );
    }
    const seconds = parseNumber(options.duration, 0.35);
    await callAgent(page, "setMoveInput", move);
    await page.waitForTimeout(seconds * 1000);
    await callAgent(page, "setMoveInput", { x: 0, y: 0 });
  }

  if (options.aim) {
    const target = parseVector(options.aim);
    await callAgent(page, "setAimTarget", target);
  }

  if (options.focus) {
    const holdSeconds = parseNumber(options.focus);
    await callAgent(page, "setFocusHeld", true);
    await page.waitForTimeout(holdSeconds * 1000);
    await callAgent(page, "setFocusHeld", false);
  }

  if (options.fire) {
    const holdSeconds = parseNumber(options.fire);
    await callAgent(page, "setTriggerHeld", true);
    await page.waitForTimeout(holdSeconds * 1000);
    await callAgent(page, "setTriggerHeld", false);
  }

  if (options.reload) {
    await callAgent(page, "queueRaidAction", "reload");
  }

  if (options.interact) {
    await callAgent(page, "queueRaidAction", "interact");
  }

  if (options.heal) {
    await callAgent(page, "queueRaidAction", "heal");
  }

  if (options["support-order"]) {
    await callAgent(page, "queueSupportOrder", options["support-order"]);
  }

  if (options["focus-incident"]) {
    await callAgent(page, "setFocusedIncident", await resolveIncidentFocusValue(page, options["focus-incident"]));
  }
}

const RAID_CAPTURE_SHOWCASES = new Set([
  "breach",
  "breach-push",
  "boys-command",
  "grenade-pocket",
  "extract-clean",
  "extract-collapse",
  "extract-pressure",
  "room-clear",
  "room-clear-chain",
  "frontline-supply",
  "field-coffee",
  "burner-coffee",
  "expanded-frontline",
  "hostile-lane-chatter",
  "noise-discipline",
  "drone-sweep",
  "intel-alarm",
  "war-beat-focus",
  "body-recovery",
  "persistent-body-return",
  "dish-house-breach",
  "caravan-trap",
  "white-van-ambush",
  "armored-drop",
  "armored-evac",
  "trench-assault",
  "bunker-foothold",
  "cellar-counterhold",
  "shed-hide",
  "civilian-window",
  "hunter-search",
  "blue-carried-fire",
  "blue-carried-extract-success",
  "blue-body-extract",
  "wounded-soldier",
  "surrender-window",
  "territory-claims",
  "territory-retake",
  "relay-counterpush",
  "ambulance-counterhold",
  "mortar-bracket",
  "retake-peel",
  "pinned-pressure",
  "boys-frag-runtime",
  "suppression-runtime",
  "covering-crossing",
  "combat-audio",
  "combat-presentation"
]);

function showcaseRequiresRaid(showcaseId) {
  return typeof showcaseId === "string" && RAID_CAPTURE_SHOWCASES.has(showcaseId);
}

async function stagePreCaptureState(page, options) {
  if (options.showcase) {
    const waitMs = parseNumber(options.wait, 0.5) * 1000;
    let snapshot = await callAgent(page, "stageShowcase", options.showcase);
    await page.waitForTimeout(waitMs);

    if (showcaseRequiresRaid(options.showcase)) {
      snapshot = await callAgent(page, "getSnapshot");
      if (snapshot.phase !== "raid") {
        snapshot = await forceRaidStart(page, 700);
      }
      if (snapshot.phase !== "raid") {
        snapshot = await callAgent(page, "stageShowcase", options.showcase);
        await page.waitForTimeout(waitMs);
        snapshot = await callAgent(page, "getSnapshot");
      }
      if (snapshot.phase !== "raid") {
        throw new Error(
          `capture showcase "${options.showcase}" did not settle into raid. phase=${snapshot.phase}`
        );
      }
    }
  }

  if (options["focus-extract"]) {
    await callAgent(page, "setFocusedExtract", options["focus-extract"]);
    await page.waitForTimeout(200);
  }

  if (options["focus-incident"]) {
    await callAgent(page, "setFocusedIncident", await resolveIncidentFocusValue(page, options["focus-incident"]));
    await page.waitForTimeout(200);
  }

  if (options["start-raid"]) {
    await callAgent(page, "startRaid");
    await page.waitForTimeout(parseNumber(options.wait, 0.5) * 1000);
  }
}

async function ensureRaidPhase(page, waitMs = 600) {
  const snapshot = await callAgent(page, "getSnapshot");
  if (snapshot.phase === "raid") {
    return snapshot;
  }

  if (snapshot.stash?.canStartRaid) {
    await callAgent(page, "startRaid");
    await page.waitForTimeout(waitMs);
    return callAgent(page, "getSnapshot");
  }

  return snapshot;
}

async function forceRaidStart(page, waitMs = 650) {
  await callAgent(page, "setMoveInput", { x: 0, y: 0 });
  await callAgent(page, "setTriggerHeld", false);
  await callAgent(page, "setFocusHeld", false);

  let snapshot = await callAgent(page, "getSnapshot");
  if (snapshot.phase === "raid") {
    return snapshot;
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await callAgent(page, "startRaid");
    await page.waitForTimeout(waitMs);
    snapshot = await callAgent(page, "getSnapshot");
    if (snapshot.phase === "raid") {
      return snapshot;
    }

    const startButton = page.locator("[data-start-raid]");
    if (await startButton.count()) {
      await startButton.first().click({ force: true });
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.waitForTimeout(waitMs + 120);
      snapshot = await callAgent(page, "getSnapshot");
      if (snapshot.phase === "raid") {
        return snapshot;
      }
    }

    await page.waitForTimeout(220);
  }

  return snapshot;
}

function getTraversalVector(from, to) {
  const deltaX = to.x - from.x;
  const deltaY = to.y - from.y;
  const magnitude = Math.hypot(deltaX, deltaY);

  if (magnitude <= 0.001) {
    return { x: 0, y: 0 };
  }

  return {
    x: deltaX / magnitude,
    y: deltaY / magnitude
  };
}

async function walkPlayerToward(page, start, target, options = {}) {
  const settleMs = options.settleMs ?? 120;
  const speedPixelsPerSecond = options.speedPixelsPerSecond ?? 152;
  const distance = Math.hypot(target.x - start.x, target.y - start.y);
  const travelMs = Math.max(240, Math.round((distance / speedPixelsPerSecond) * 1000));

  await callAgent(page, "setMoveInput", getTraversalVector(start, target));
  await page.waitForTimeout(travelMs);
  await callAgent(page, "setMoveInput", { x: 0, y: 0 });
  if (settleMs > 0) {
    await page.waitForTimeout(settleMs);
  }
  return callAgent(page, "getSnapshot");
}

async function walkTraversalTarget(page, currentPosition, target, options = {}) {
  let nextPosition = currentPosition;

  if (target?.doorwayCenter) {
    await callAgent(page, "setAimTarget", target.doorwayCenter);
    const doorwaySnapshot = await walkPlayerToward(page, nextPosition, target.doorwayCenter, {
      speedPixelsPerSecond: options.doorwaySpeedPixelsPerSecond ?? 162,
      settleMs: options.doorwaySettleMs ?? 140
    });
    nextPosition = doorwaySnapshot.raid?.position ?? nextPosition;
  }

  const roomTarget = target?.settlePoint ?? target?.center ?? null;

  if (roomTarget) {
    await callAgent(page, "setAimTarget", roomTarget);
    const roomSnapshot = await walkPlayerToward(page, nextPosition, roomTarget, {
      speedPixelsPerSecond: options.roomSpeedPixelsPerSecond ?? 150,
      settleMs: options.roomSettleMs ?? 160
    });
    nextPosition = roomSnapshot.raid?.position ?? nextPosition;
  }

  return nextPosition;
}

function getActiveRoomTraversalTargets(snapshot, minimumDepth = 1) {
  const targets = Array.isArray(snapshot.raid?.doorway?.roomTraversalTargets)
    ? snapshot.raid.doorway.roomTraversalTargets.filter(
        (target) => typeof target?.depth === "number" && target.depth >= minimumDepth
      )
    : [];

  if (targets.length === 0) {
    return [];
  }

  const playerPosition = snapshot.raid?.position ?? null;
  const playerChainIndex =
    playerPosition &&
    targets
      .filter((target) => typeof target?.chainIndex === "number" && target.center)
      .sort(
        (left, right) =>
          Math.hypot(left.center.x - playerPosition.x, left.center.y - playerPosition.y) -
          Math.hypot(right.center.x - playerPosition.x, right.center.y - playerPosition.y)
      )[0]?.chainIndex;

  const activeChainTargets =
    typeof playerChainIndex === "number"
      ? targets.filter((target) => target.chainIndex === playerChainIndex)
      : targets;

  return [...activeChainTargets].sort((left, right) => left.depth - right.depth);
}

async function runMacro(page, macroId, options) {
  let forcedFinalSnapshot = null;
  if (macroId === "breach-drill") {
    await callAgent(page, "stageShowcase", "breach");
    await page.waitForTimeout(500);
    await ensureRaidPhase(page, 700);
    await callAgent(page, "setFocusedIncident", 0);
    await callAgent(page, "queueSupportOrder", "breach-push");
    await page.waitForTimeout(350);
    await callAgent(page, "setAimTarget", { x: 1110, y: 430 });
    await callAgent(page, "setFocusHeld", true);
    await page.waitForTimeout(250);
    await callAgent(page, "setTriggerHeld", true);
    await page.waitForTimeout(650);
    await callAgent(page, "setTriggerHeld", false);
    await callAgent(page, "setFocusHeld", false);
    await callAgent(page, "setMoveInput", { x: 1, y: -0.28 });
    await page.waitForTimeout(650);
    await callAgent(page, "setMoveInput", { x: 0, y: 0 });
  } else if (macroId === "extract-drill") {
    await callAgent(page, "startRaid");
    await page.waitForTimeout(600);
    await callAgent(page, "queueSupportOrder", "secure-exfil");
    await callAgent(page, "setMoveInput", { x: 1, y: 0.18 });
    await page.waitForTimeout(1400);
    await callAgent(page, "setMoveInput", { x: 0, y: 0 });
    await callAgent(page, "setAimTarget", { x: 1320, y: 660 });
    await callAgent(page, "setTriggerHeld", true);
    await page.waitForTimeout(450);
    await callAgent(page, "setTriggerHeld", false);
    await page.waitForTimeout(250);
  } else if (macroId === "frontline-pressure") {
    await callAgent(page, "stageShowcase", "expanded-frontline");
    await page.waitForTimeout(600);
    await callAgent(page, "startRaid");
    await page.waitForTimeout(600);
    await callAgent(page, "setFocusedIncident", 0);
    await callAgent(page, "queueSupportOrder", "shift-fire");
    await page.waitForTimeout(300);
    await callAgent(page, "setFocusedIncident", 1);
    await callAgent(page, "queueSupportOrder", "draw-heat");
    await page.waitForTimeout(450);
  } else if (macroId === "expanded-frontline") {
    await callAgent(page, "stageShowcase", "expanded-frontline");
    await page.waitForTimeout(750);
    await ensureRaidPhase(page, 650);
    await callAgent(page, "setFocusedIncident", 4);
    await callAgent(page, "queueSupportOrder", "shift-fire");
    await page.waitForTimeout(350);
    await callAgent(page, "setAimTarget", { x: 1500, y: 560 });
    await callAgent(page, "setMoveInput", { x: 0.82, y: -0.14 });
    await page.waitForTimeout(900);
    await callAgent(page, "setMoveInput", { x: 0, y: 0 });
    await page.waitForTimeout(300);
  } else if (macroId === "doorway-regression") {
    await callAgent(page, "stageShowcase", "breach");
    await page.waitForTimeout(500);
    await ensureRaidPhase(page, 650);
    await callAgent(page, "setFocusedIncident", 0);
    await callAgent(page, "queueSupportOrder", "breach-push");
    await page.waitForTimeout(300);
    await callAgent(page, "setAimTarget", { x: 1110, y: 430 });
    await callAgent(page, "setFocusHeld", true);
    await page.waitForTimeout(220);
    await callAgent(page, "setTriggerHeld", true);
    await page.waitForTimeout(420);
    await callAgent(page, "setTriggerHeld", false);
    await callAgent(page, "setFocusHeld", false);
    await callAgent(page, "setMoveInput", { x: 1, y: -0.18 });
    await page.waitForTimeout(900);
    await callAgent(page, "setMoveInput", { x: 1, y: -0.08 });
    await page.waitForTimeout(850);
    await callAgent(page, "setMoveInput", { x: 0, y: 0 });
    await page.waitForTimeout(350);
  } else if (macroId === "room-clear-drill") {
    await callAgent(page, "configureNextRaid", { routeId: "sundered-run" });
    let stagedSnapshot = await callAgent(page, "stageShowcase", "room-clear");
    await page.waitForTimeout(280);
    if (stagedSnapshot.phase !== "raid") {
      stagedSnapshot = await forceRaidStart(page, 650);
    }
    if (stagedSnapshot.phase !== "raid") {
      throw new Error(
        `room-clear-drill could not enter raid after staging. phase=${stagedSnapshot.phase}, canStartRaid=${stagedSnapshot.stash?.canStartRaid ?? "n/a"}`
      );
    }
    await callAgent(page, "queueSupportOrder", "breach-push");
    await page.waitForTimeout(260);
  } else if (macroId === "room-clear-chain") {
    await callAgent(page, "configureNextRaid", { routeId: "sundered-run" });
    let stagedSnapshot = await callAgent(page, "stageShowcase", "room-clear-chain");
    await page.waitForTimeout(320);
    if (stagedSnapshot.phase !== "raid") {
      stagedSnapshot = await forceRaidStart(page, 650);
    }
    if (stagedSnapshot.phase !== "raid") {
      throw new Error(
        `room-clear-chain could not enter raid after staging. phase=${stagedSnapshot.phase}, canStartRaid=${stagedSnapshot.stash?.canStartRaid ?? "n/a"}`
      );
    }
    await callAgent(page, "queueSupportOrder", "breach-push");
    await page.waitForTimeout(260);
  } else if (macroId === "blue-carried-fire") {
    const stagedSnapshot = await callAgent(page, "stageShowcase", "blue-carried-fire");
    await page.waitForTimeout(250);
    if (stagedSnapshot.phase !== "raid") {
      throw new Error(`blue-carried-fire showcase did not enter raid. phase=${stagedSnapshot.phase}`);
    }

    const primaryHostile = stagedSnapshot.battlefield?.samples?.hostiles?.[0]?.position ?? null;
    if (!primaryHostile) {
      throw new Error("blue-carried-fire showcase did not expose a hostile sample to aim at.");
    }

    await callAgent(page, "setAimTarget", primaryHostile);
    await page.waitForTimeout(120);
    await callAgent(page, "setTriggerHeld", true);
    await page.waitForTimeout(650);
    await callAgent(page, "setTriggerHeld", false);
    await page.waitForTimeout(200);
  } else if (macroId === "blue-carried-extract-success") {
    const stagedSnapshot = await callAgent(page, "stageShowcase", "blue-carried-extract-success");
    await page.waitForTimeout(250);
    if (stagedSnapshot.phase !== "raid") {
      throw new Error(`blue-carried-extract-success showcase did not enter raid. phase=${stagedSnapshot.phase}`);
    }

    await page.waitForTimeout(2400);
  } else if (macroId === "blue-body-extract") {
    const stagedSnapshot = await callAgent(page, "stageShowcase", "blue-body-extract");
    await page.waitForTimeout(250);
    if (stagedSnapshot.phase !== "raid") {
      throw new Error(`blue-body-extract showcase did not enter raid. phase=${stagedSnapshot.phase}`);
    }

    await page.waitForTimeout(650);
  } else if (macroId === "extract-clean") {
    const stagedSnapshot = await callAgent(page, "stageShowcase", "extract-clean");
    await page.waitForTimeout(320);
    if (stagedSnapshot.phase !== "raid") {
      throw new Error(`extract-clean showcase did not enter raid. phase=${stagedSnapshot.phase}`);
    }
    forcedFinalSnapshot = stagedSnapshot;
    await page.waitForTimeout(220);
  } else if (macroId === "extract-collapse") {
    const stagedSnapshot = await callAgent(page, "stageShowcase", "extract-collapse");
    await page.waitForTimeout(320);
    if (stagedSnapshot.phase !== "raid") {
      throw new Error(`extract-collapse showcase did not enter raid. phase=${stagedSnapshot.phase}`);
    }
    forcedFinalSnapshot = stagedSnapshot;
    await page.waitForTimeout(220);
  } else if (macroId === "combat-presentation") {
    const stagedSnapshot = await callAgent(page, "stageShowcase", "combat-presentation");
    await page.waitForTimeout(320);
    if (stagedSnapshot.phase !== "raid") {
      throw new Error(`combat-presentation showcase did not enter raid. phase=${stagedSnapshot.phase}`);
    }
    await page.waitForTimeout(220);
  } else if (macroId === "combat-audio") {
    const stagedSnapshot = await callAgent(page, "stageShowcase", "combat-audio");
    await page.waitForTimeout(320);
    if (stagedSnapshot.phase !== "raid") {
      throw new Error(`combat-audio showcase did not enter raid. phase=${stagedSnapshot.phase}`);
    }
    await page.waitForTimeout(220);
  } else if (macroId === "boys-frag-runtime") {
    const stagedSnapshot = await callAgent(page, "stageShowcase", "boys-frag-runtime");
    await page.waitForTimeout(320);
    if (stagedSnapshot.phase !== "raid") {
      throw new Error(`boys-frag-runtime showcase did not enter raid. phase=${stagedSnapshot.phase}`);
    }
    await page.waitForTimeout(220);
  } else if (macroId === "suppression-runtime") {
    const stagedSnapshot = await callAgent(page, "stageShowcase", "suppression-runtime");
    await page.waitForTimeout(320);
    if (stagedSnapshot.phase !== "raid") {
      throw new Error(`suppression-runtime showcase did not enter raid. phase=${stagedSnapshot.phase}`);
    }
    await page.waitForTimeout(220);
  } else if (macroId === "covering-crossing") {
    const stagedSnapshot = await callAgent(page, "stageShowcase", "covering-crossing");
    await page.waitForTimeout(320);
    if (stagedSnapshot.phase !== "raid") {
      throw new Error(`covering-crossing showcase did not enter raid. phase=${stagedSnapshot.phase}`);
    }
    forcedFinalSnapshot = stagedSnapshot;
    await page.waitForTimeout(220);
  } else if (macroId === "pinned-pressure") {
    const stagedSnapshot = await callAgent(page, "stageShowcase", "pinned-pressure");
    await page.waitForTimeout(320);
    if (stagedSnapshot.phase !== "raid") {
      throw new Error(`pinned-pressure showcase did not enter raid. phase=${stagedSnapshot.phase}`);
    }
    await page.waitForTimeout(220);
  } else if (macroId === "fireteam-audit") {
    const stagedSnapshot = await callAgent(page, "stageShowcase", "pinned-pressure");
    await page.waitForTimeout(320);
    if (stagedSnapshot.phase !== "raid") {
      throw new Error(`fireteam-audit showcase did not enter raid. phase=${stagedSnapshot.phase}`);
    }
    await page.waitForTimeout(220);
  } else if (macroId === "body-recovery") {
    const stagedSnapshot = await callAgent(page, "stageShowcase", "body-recovery");
    await page.waitForTimeout(320);
    if (stagedSnapshot.phase !== "raid") {
      throw new Error(`body-recovery showcase did not enter raid. phase=${stagedSnapshot.phase}`);
    }
    await page.waitForTimeout(220);
  } else if (macroId === "intel-alarm") {
    const stagedSnapshot = await callAgent(page, "stageShowcase", "intel-alarm");
    await page.waitForTimeout(320);
    if (stagedSnapshot.phase !== "raid") {
      throw new Error(`intel-alarm showcase did not enter raid. phase=${stagedSnapshot.phase}`);
    }
    forcedFinalSnapshot = stagedSnapshot;
    await page.waitForTimeout(220);
  } else if (macroId === "drone-sweep") {
    const stagedSnapshot = await callAgent(page, "stageShowcase", "drone-sweep");
    await page.waitForTimeout(320);
    if (stagedSnapshot.phase !== "raid") {
      throw new Error(`drone-sweep showcase did not enter raid. phase=${stagedSnapshot.phase}`);
    }
    forcedFinalSnapshot = stagedSnapshot;
    await page.waitForTimeout(220);
  } else if (macroId === "hostile-lane-chatter") {
    const stagedSnapshot = await callAgent(page, "stageShowcase", "hostile-lane-chatter");
    await page.waitForTimeout(320);
    if (stagedSnapshot.phase !== "raid") {
      throw new Error(`hostile-lane-chatter showcase did not enter raid. phase=${stagedSnapshot.phase}`);
    }
    forcedFinalSnapshot = stagedSnapshot;
    await page.waitForTimeout(220);
  } else if (macroId === "caravan-trap") {
    const stagedSnapshot = await callAgent(page, "stageShowcase", "caravan-trap");
    await page.waitForTimeout(320);
    if (stagedSnapshot.phase !== "raid") {
      throw new Error(`caravan-trap showcase did not enter raid. phase=${stagedSnapshot.phase}`);
    }
    forcedFinalSnapshot = stagedSnapshot;
    await page.waitForTimeout(220);
  } else if (macroId === "persistent-body-return") {
    const stagedSnapshot = await callAgent(page, "stageShowcase", "persistent-body-return");
    await page.waitForTimeout(320);
    if (stagedSnapshot.phase !== "raid") {
      throw new Error(`persistent-body-return showcase did not enter raid. phase=${stagedSnapshot.phase}`);
    }
    forcedFinalSnapshot = stagedSnapshot;
    await page.waitForTimeout(220);
  } else if (macroId === "dish-house-breach") {
    const stagedSnapshot = await callAgent(page, "stageShowcase", "dish-house-breach");
    await page.waitForTimeout(320);
    if (stagedSnapshot.phase !== "raid") {
      throw new Error(`dish-house-breach showcase did not enter raid. phase=${stagedSnapshot.phase}`);
    }
    forcedFinalSnapshot = stagedSnapshot;
    await page.waitForTimeout(220);
  } else if (macroId === "dialogue-aftermath") {
    const stagedSnapshot = await callAgent(page, "stageShowcase", "dialogue-aftermath");
    await page.waitForTimeout(220);
    if (stagedSnapshot.phase !== "raid") {
      throw new Error(`dialogue-aftermath showcase did not enter raid. phase=${stagedSnapshot.phase}`);
    }
    forcedFinalSnapshot = stagedSnapshot;
  } else if (macroId === "field-coffee") {
    const stagedSnapshot = await callAgent(page, "stageShowcase", "field-coffee");
    await page.waitForTimeout(220);
    if (stagedSnapshot.phase !== "raid") {
      throw new Error(`field-coffee showcase did not enter raid. phase=${stagedSnapshot.phase}`);
    }
    forcedFinalSnapshot = stagedSnapshot;
  } else if (macroId === "burner-coffee") {
    const stagedSnapshot = await callAgent(page, "stageShowcase", "burner-coffee");
    await page.waitForTimeout(220);
    if (stagedSnapshot.phase !== "raid") {
      throw new Error(`burner-coffee showcase did not enter raid. phase=${stagedSnapshot.phase}`);
    }
    forcedFinalSnapshot = stagedSnapshot;
  } else if (macroId === "surrender-window") {
    const stagedSnapshot = await callAgent(page, "stageShowcase", "surrender-window");
    if (stagedSnapshot.phase !== "raid") {
      throw new Error(`surrender-window showcase did not enter raid. phase=${stagedSnapshot.phase}`);
    }
    forcedFinalSnapshot = stagedSnapshot;
  } else if (macroId === "armored-evac") {
    const stagedSnapshot = await callAgent(page, "stageShowcase", "armored-evac");
    await page.waitForTimeout(320);
    if (stagedSnapshot.phase !== "raid") {
      throw new Error(`armored-evac showcase did not enter raid. phase=${stagedSnapshot.phase}`);
    }
    await page.waitForTimeout(220);
  } else if (macroId === "territory-claims") {
    const stagedSnapshot = await callAgent(page, "stageShowcase", "territory-claims");
    await page.waitForTimeout(320);
    if (stagedSnapshot.phase !== "raid") {
      throw new Error(`territory-claims showcase did not enter raid. phase=${stagedSnapshot.phase}`);
    }
    await page.waitForTimeout(220);
  } else if (macroId === "hardcore-start") {
    await callAgent(page, "stageShowcase", "hardcore-start");
    await page.waitForTimeout(220);
  } else if (macroId === "first-session-hook") {
    await page.waitForTimeout(220);
  } else if (macroId === "route-identity-pass") {
    await page.waitForTimeout(220);
  } else if (macroId === "must-clear-structure-pass") {
    await page.waitForTimeout(220);
  } else if (macroId === "stash-consequence-pass") {
    await callAgent(page, "stageShowcase", "chair-handoff");
    await page.waitForTimeout(220);
  } else if (macroId === "weapon-doctrine") {
    await callAgent(page, "stageShowcase", "weapon-doctrine");
    await page.waitForTimeout(220);
  } else if (macroId === "field-capture") {
    await callAgent(page, "stageShowcase", "field-capture");
    await page.waitForTimeout(220);
  } else if (macroId === "field-pivot") {
    await callAgent(page, "stageShowcase", "field-pivot");
    await page.waitForTimeout(220);
  } else if (macroId === "broker-cashout") {
    await callAgent(page, "stageShowcase", "broker-cashout");
    await page.waitForTimeout(220);
  } else if (macroId === "chair-handoff") {
    await callAgent(page, "stageShowcase", "chair-handoff");
    await page.waitForTimeout(220);
  } else if (macroId === "handgun-recovery") {
    await callAgent(page, "stageShowcase", "handgun-recovery");
    await page.waitForTimeout(220);
  } else if (macroId === "knife-extreme") {
    const stagedSnapshot = await callAgent(page, "stageShowcase", "knife-extreme");
    await page.waitForTimeout(260);
    if (stagedSnapshot.phase !== "raid") {
      throw new Error(`knife-extreme showcase did not enter raid. phase=${stagedSnapshot.phase}`);
    }

    const playerPosition = stagedSnapshot.raid?.player?.position ?? null;
    const knifeTarget =
      stagedSnapshot.raid?.enemies?.find(
        (enemy) =>
          enemy.casualtyState !== "downed" &&
          enemy.casualtyState !== "dead" &&
          enemy.supportStrongpointLabel === "Dish Houses" &&
          enemy.supportLaneLabel === "Inside short hall" &&
          typeof enemy.position?.x === "number" &&
          typeof enemy.position?.y === "number"
      ) ??
      stagedSnapshot.raid?.enemies
        ?.filter(
          (enemy) =>
            enemy.casualtyState !== "downed" &&
            enemy.casualtyState !== "dead" &&
            typeof enemy.position?.x === "number" &&
            typeof enemy.position?.y === "number"
        )
        .sort((left, right) => {
          if (!playerPosition) {
            return 0;
          }
          const leftDistance = Math.hypot(left.position.x - playerPosition.x, left.position.y - playerPosition.y);
          const rightDistance = Math.hypot(right.position.x - playerPosition.x, right.position.y - playerPosition.y);
          return leftDistance - rightDistance;
        })?.[0] ??
      null;
    if (!knifeTarget) {
      throw new Error("knife-extreme showcase did not expose a live hostile target.");
    }

    await callAgent(page, "setAimTarget", knifeTarget.position);
    await page.waitForTimeout(120);
    await callAgent(page, "setAimTarget", knifeTarget.position);
    await page.waitForTimeout(120);
    await callAgent(page, "setTriggerHeld", true);
    await page.waitForTimeout(620);
    await callAgent(page, "setTriggerHeld", false);
    await page.waitForTimeout(220);
  } else if (macroId === "final-stronghold") {
    const stagedSnapshot = await callAgent(page, "stageShowcase", "final-stronghold");
    await page.waitForTimeout(220);
    forcedFinalSnapshot = stagedSnapshot;
  } else if (macroId === "recovery-corridor-payoff") {
    const stagedSnapshot = await callAgent(page, "stageShowcase", "recovery-corridor-payoff");
    await page.waitForTimeout(220);
    forcedFinalSnapshot = stagedSnapshot;
  } else if (macroId === "endgame-amr") {
    await callAgent(page, "stageShowcase", "endgame-amr");
    await page.waitForTimeout(220);
  } else if (macroId === "amr-counter-lane") {
    const stagedSnapshot = await callAgent(page, "stageShowcase", "amr-counter-lane");
    await page.waitForTimeout(320);
    if (stagedSnapshot.phase !== "raid") {
      throw new Error(`amr-counter-lane showcase did not enter raid. phase=${stagedSnapshot.phase}`);
    }
    await page.waitForTimeout(220);
  } else if (macroId === "final-stronghold-launch") {
    const stagedSnapshot = await callAgent(page, "stageShowcase", "final-stronghold-launch");
    await page.waitForTimeout(220);
    forcedFinalSnapshot = stagedSnapshot;
  } else if (macroId === "final-stronghold-setback") {
    const stagedSnapshot = await callAgent(page, "stageShowcase", "final-stronghold-setback");
    await page.waitForTimeout(220);
    forcedFinalSnapshot = stagedSnapshot;
  } else if (macroId === "true-escape") {
    const stagedSnapshot = await callAgent(page, "stageShowcase", "true-escape");
    await page.waitForTimeout(220);
    forcedFinalSnapshot = stagedSnapshot;
  } else if (macroId === "trench-assault") {
    const stagedSnapshot = await callAgent(page, "stageShowcase", "trench-assault");
    await page.waitForTimeout(320);
    if (stagedSnapshot.phase !== "raid") {
      throw new Error(`trench-assault showcase did not enter raid. phase=${stagedSnapshot.phase}`);
    }
    await page.waitForTimeout(220);
  } else if (macroId === "bunker-foothold") {
    const stagedSnapshot = await callAgent(page, "stageShowcase", "bunker-foothold");
    await page.waitForTimeout(320);
    if (stagedSnapshot.phase !== "raid") {
      throw new Error(`bunker-foothold showcase did not enter raid. phase=${stagedSnapshot.phase}`);
    }
    await page.waitForTimeout(220);
  } else if (macroId === "cellar-counterhold") {
    const stagedSnapshot = await callAgent(page, "stageShowcase", "cellar-counterhold");
    await page.waitForTimeout(320);
    if (stagedSnapshot.phase !== "raid") {
      throw new Error(`cellar-counterhold showcase did not enter raid. phase=${stagedSnapshot.phase}`);
    }
    forcedFinalSnapshot = stagedSnapshot;
    await page.waitForTimeout(220);
  } else if (macroId === "territory-retake") {
    const stagedSnapshot = await callAgent(page, "stageShowcase", "territory-retake");
    await page.waitForTimeout(320);
    if (stagedSnapshot.phase !== "raid") {
      throw new Error(`territory-retake showcase did not enter raid. phase=${stagedSnapshot.phase}`);
    }
    await page.waitForTimeout(220);
  } else if (macroId === "relay-counterpush") {
    const stagedSnapshot = await callAgent(page, "stageShowcase", "relay-counterpush");
    await page.waitForTimeout(320);
    if (stagedSnapshot.phase !== "raid") {
      throw new Error(`relay-counterpush showcase did not enter raid. phase=${stagedSnapshot.phase}`);
    }
    forcedFinalSnapshot = stagedSnapshot;
    await page.waitForTimeout(220);
  } else if (macroId === "ambulance-counterhold") {
    const stagedSnapshot = await callAgent(page, "stageShowcase", "ambulance-counterhold");
    await page.waitForTimeout(320);
    if (stagedSnapshot.phase !== "raid") {
      throw new Error(`ambulance-counterhold showcase did not enter raid. phase=${stagedSnapshot.phase}`);
    }
    forcedFinalSnapshot = stagedSnapshot;
    await page.waitForTimeout(220);
  } else if (macroId === "mortar-bracket") {
    const stagedSnapshot = await callAgent(page, "stageShowcase", "mortar-bracket");
    await page.waitForTimeout(320);
    if (stagedSnapshot.phase !== "raid") {
      throw new Error(`mortar-bracket showcase did not enter raid. phase=${stagedSnapshot.phase}`);
    }
    forcedFinalSnapshot = stagedSnapshot;
    await page.waitForTimeout(220);
  } else if (macroId === "retake-peel") {
    const stagedSnapshot = await callAgent(page, "stageShowcase", "retake-peel");
    await page.waitForTimeout(320);
    if (stagedSnapshot.phase !== "raid") {
      throw new Error(`retake-peel showcase did not enter raid. phase=${stagedSnapshot.phase}`);
    }
    await page.waitForTimeout(220);
  } else if (macroId === "civilian-window") {
    const stagedSnapshot = await callAgent(page, "stageShowcase", "civilian-window");
    await page.waitForTimeout(320);
    if (stagedSnapshot.phase !== "raid") {
      throw new Error(`civilian-window showcase did not enter raid. phase=${stagedSnapshot.phase}`);
    }
    forcedFinalSnapshot = stagedSnapshot;
    await page.waitForTimeout(220);
  } else if (macroId === "hunter-search") {
    const stagedSnapshot = await callAgent(page, "stageShowcase", "hunter-search");
    await page.waitForTimeout(320);
    if (stagedSnapshot.phase !== "raid") {
      throw new Error(`hunter-search showcase did not enter raid. phase=${stagedSnapshot.phase}`);
    }
    forcedFinalSnapshot = stagedSnapshot;
    await page.waitForTimeout(220);
  } else if (macroId === "wounded-soldier") {
    const stagedSnapshot = await callAgent(page, "stageShowcase", "wounded-soldier");
    await page.waitForTimeout(320);
    if (stagedSnapshot.phase !== "raid") {
      throw new Error(`wounded-soldier showcase did not enter raid. phase=${stagedSnapshot.phase}`);
    }
    forcedFinalSnapshot = stagedSnapshot;
    await page.waitForTimeout(220);
  } else if (macroId === "white-van-ambush") {
    const stagedSnapshot = await callAgent(page, "stageShowcase", "white-van-ambush");
    await page.waitForTimeout(320);
    if (stagedSnapshot.phase !== "raid") {
      throw new Error(`white-van-ambush showcase did not enter raid. phase=${stagedSnapshot.phase}`);
    }
    forcedFinalSnapshot = stagedSnapshot;
    await page.waitForTimeout(220);
  } else if (macroId === "armored-drop") {
    const stagedSnapshot = await callAgent(page, "stageShowcase", "armored-drop");
    await page.waitForTimeout(320);
    if (stagedSnapshot.phase !== "raid") {
      throw new Error(`armored-drop showcase did not enter raid. phase=${stagedSnapshot.phase}`);
    }
    forcedFinalSnapshot = stagedSnapshot;
    await page.waitForTimeout(220);
  } else if (macroId === "shed-hide") {
    const stagedSnapshot = await callAgent(page, "stageShowcase", "shed-hide");
    await page.waitForTimeout(320);
    if (stagedSnapshot.phase !== "raid") {
      throw new Error(`shed-hide showcase did not enter raid. phase=${stagedSnapshot.phase}`);
    }
    forcedFinalSnapshot = stagedSnapshot;
    await page.waitForTimeout(220);
  } else {
    throw new Error(
      `Unknown macro "${macroId}". Supported macros: breach-drill, extract-drill, frontline-pressure, expanded-frontline, doorway-regression, room-clear-drill, room-clear-chain, blue-carried-fire, blue-carried-extract-success, blue-body-extract, extract-clean, extract-collapse, combat-presentation, combat-audio, boys-frag-runtime, suppression-runtime, covering-crossing, pinned-pressure, fireteam-audit, body-recovery, intel-alarm, drone-sweep, hostile-lane-chatter, dish-house-breach, caravan-trap, persistent-body-return, dialogue-aftermath, field-coffee, burner-coffee, surrender-window, armored-evac, territory-claims, hardcore-start, first-session-hook, route-identity-pass, must-clear-structure-pass, stash-consequence-pass, weapon-doctrine, field-capture, field-pivot, broker-cashout, chair-handoff, handgun-recovery, final-stronghold, recovery-corridor-payoff, endgame-amr, amr-counter-lane, final-stronghold-launch, final-stronghold-setback, true-escape, trench-assault, bunker-foothold, cellar-counterhold, shed-hide, territory-retake, relay-counterpush, ambulance-counterhold, mortar-bracket, retake-peel, civilian-window, hunter-search, wounded-soldier, white-van-ambush, armored-drop.`
    );
  }

  const finalSnapshot = forcedFinalSnapshot ?? (await callAgent(page, "getSnapshot"));

  if (options.path) {
    await page.screenshot({ path: options.path, fullPage: true });
  }

  return {
    macro: macroId,
    screenshotPath: typeof options.path === "string" ? options.path : null,
    snapshot: finalSnapshot
  };
}

const REGRESSION_VERIFY_IDS = [
  "main-menu-to-stash",
  "stash-to-raid",
  "equip-major-weapons",
  "equip-low-tier-guns",
  "wave-target-discipline",
  "same-room-reinforcement-guard",
  "no-immortal-runtime",
  "legacy-crossfire-disabled",
  "legacy-runtime-clean-states"
];

const REGRESSION_GATE_VERIFY_IDS = [
  "main-menu-to-stash",
  "stash-to-raid",
  "equip-major-weapons",
  "equip-low-tier-guns",
  "wave-target-discipline",
  "same-room-reinforcement-guard",
  "doorway-regression",
  "no-immortal-runtime",
  "legacy-crossfire-disabled",
  "legacy-runtime-clean-states"
];

function isRegressionVerificationId(verificationId) {
  return REGRESSION_VERIFY_IDS.includes(verificationId);
}

function buildVerificationResult(verificationId, description, checks) {
  return {
    macro: verificationId,
    description,
    passed: checks.every((check) => check.passed),
    checks
  };
}

function pointDistance(left, right) {
  if (!left || !right) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.hypot((left.x ?? 0) - (right.x ?? 0), (left.y ?? 0) - (right.y ?? 0));
}

async function resetVerificationRuntime(page) {
  await page.reload({ waitUntil: "domcontentloaded" });
  await waitForControlSurface(page);
  await page.waitForTimeout(150);
}

async function captureVerificationScreenshot(page, options) {
  if (typeof options.path === "string") {
    await page.screenshot({ path: options.path, fullPage: true });
    return options.path;
  }

  return null;
}

async function stageStateSnapshot(page, stateId, waitMs = 150) {
  const snapshot = await callAgent(page, "stageState", stateId);
  if (waitMs > 0) {
    await page.waitForTimeout(waitMs);
    return callAgent(page, "getSnapshot");
  }
  return snapshot;
}

async function configureAndDeploySnapshot(
  page,
  { weaponId, routeId = "broken-signal", tacticalServiceId = "signal-jammer" }
) {
  await stageStateSnapshot(page, "stash");
  const stashSnapshot = await callAgent(page, "configureNextRaid", {
    routeId,
    weaponId,
    tacticalServiceId
  });
  await page.waitForTimeout(120);
  const configuredSnapshot = await callAgent(page, "getSnapshot");
  await ensureRaidPhase(page, 350);
  await page.waitForTimeout(150);
  const raidSnapshot = await callAgent(page, "getSnapshot");
  return {
    stashSnapshot: configuredSnapshot ?? stashSnapshot,
    raidSnapshot
  };
}

function describeWeaponVerifyResult(stashSnapshot, raidSnapshot, weaponId) {
  return [
    `stashPhase=${stashSnapshot?.phase ?? "n/a"}`,
    `stashWeapon=${stashSnapshot?.stash?.selectedWeapon ?? "n/a"}`,
    `raidPhase=${raidSnapshot?.phase ?? "n/a"}`,
    `raidWeapon=${raidSnapshot?.raid?.player?.weaponId ?? "n/a"}`,
    `expected=${weaponId}`
  ].join(" | ");
}

function buildWaveGuardRead(snapshot, minimumSafeDistance) {
  const playerPosition = snapshot?.raid?.player?.position ?? snapshot?.raid?.position ?? null;
  const playerObstacleId =
    typeof snapshot?.raid?.player?.containingObstacleId === "number" ? snapshot.raid.player.containingObstacleId : null;
  const pending = Array.isArray(snapshot?.raid?.pendingReinforcements) ? snapshot.raid.pendingReinforcements : [];
  const minSpawnDistance =
    pending.length > 0
      ? pending.reduce((best, entry) => Math.min(best, pointDistance(entry.position, playerPosition)), Number.POSITIVE_INFINITY)
      : Number.POSITIVE_INFINITY;
  const sameObstacleCount =
    playerObstacleId !== null ? pending.filter((entry) => entry?.containingObstacleId === playerObstacleId).length : 0;

  return {
    minSpawnDistance,
    playerObstacleId,
    sameObstacleCount,
    safe:
      pending.length > 0 &&
      sameObstacleCount === 0 &&
      Number.isFinite(minSpawnDistance) &&
      minSpawnDistance >= minimumSafeDistance
  };
}

async function runRegressionVerification(page, verificationId, options) {
  let description = "";
  let checks = [];
  let snapshot = null;

  if (verificationId === "main-menu-to-stash") {
    description = "Validate that the visible front-door enter button closes the menu and exposes the stash.";
    await resetVerificationRuntime(page);
    await stageStateSnapshot(page, "front-door");
    await page.click("[data-main-menu-enter]");
    await page.waitForTimeout(220);
    snapshot = await callAgent(page, "getSnapshot");
    checks = [
      {
        label: "phase remains stash-side",
        passed: snapshot?.phase === "stash",
        details: `phase=${snapshot?.phase ?? "n/a"}`
      },
      {
        label: "front door closes after Enter Stash",
        passed: snapshot?.ui?.overlays?.frontDoorOpen === false,
        details: `frontDoorOpen=${snapshot?.ui?.overlays?.frontDoorOpen ?? "n/a"}`
      },
      {
        label: "stash overlay becomes the live shell",
        passed: snapshot?.ui?.overlays?.stashOpen === true,
        details: `stashOpen=${snapshot?.ui?.overlays?.stashOpen ?? "n/a"}`
      }
    ];
  } else if (verificationId === "stash-to-raid") {
    description = "Validate that the staged stash package can still promote cleanly into a live raid.";
    await resetVerificationRuntime(page);
    const stashSnapshot = await stageStateSnapshot(page, "stash");
    await ensureRaidPhase(page, 350);
    await page.waitForTimeout(150);
    snapshot = await callAgent(page, "getSnapshot");
    checks = [
      {
        label: "stash state was reachable before deployment",
        passed: stashSnapshot?.phase === "stash" && stashSnapshot?.ui?.overlays?.stashOpen === true,
        details: `phase=${stashSnapshot?.phase ?? "n/a"} | stashOpen=${stashSnapshot?.ui?.overlays?.stashOpen ?? "n/a"}`
      },
      {
        label: "raid phase starts from the staged package",
        passed: snapshot?.phase === "raid",
        details: `phase=${snapshot?.phase ?? "n/a"}`
      },
      {
        label: "deployed weapon matches the staged stash selection",
        passed:
          typeof snapshot?.stash?.selectedWeapon === "string" &&
          snapshot?.raid?.player?.weaponId === snapshot.stash.selectedWeapon,
        details: `stashWeapon=${snapshot?.stash?.selectedWeapon ?? "n/a"} | raidWeapon=${snapshot?.raid?.player?.weaponId ?? "n/a"}`
      }
    ];
  } else if (verificationId === "equip-major-weapons") {
    description = "Validate that the primary product weapon classes stage in stash and enter raid on the live weapon path.";
    const weaponIds = ["rifle", "smg", "shotgun", "pkm", "amr", "pistol"];
    for (const weaponId of weaponIds) {
      await resetVerificationRuntime(page);
      const { stashSnapshot, raidSnapshot } = await configureAndDeploySnapshot(page, { weaponId });
      checks.push({
        label: `${weaponId} stages from stash into raid`,
        passed:
          stashSnapshot?.phase === "stash" &&
          stashSnapshot?.stash?.selectedWeapon === weaponId &&
          raidSnapshot?.phase === "raid" &&
          raidSnapshot?.raid?.player?.weaponId === weaponId,
        details: describeWeaponVerifyResult(stashSnapshot, raidSnapshot, weaponId)
      });
      snapshot = raidSnapshot;
    }
  } else if (verificationId === "equip-low-tier-guns") {
    description = "Validate that the low-tier starter guns still move through the real stash and raid path.";
    const weaponIds = ["worn-ak", "short-mosin"];
    for (const weaponId of weaponIds) {
      await resetVerificationRuntime(page);
      const { stashSnapshot, raidSnapshot } = await configureAndDeploySnapshot(page, { weaponId });
      checks.push({
        label: `${weaponId} stages from stash into raid`,
        passed:
          stashSnapshot?.phase === "stash" &&
          stashSnapshot?.stash?.selectedWeapon === weaponId &&
          raidSnapshot?.phase === "raid" &&
          raidSnapshot?.raid?.player?.weaponId === weaponId,
        details: describeWeaponVerifyResult(stashSnapshot, raidSnapshot, weaponId)
      });
      snapshot = raidSnapshot;
    }
  } else if (verificationId === "wave-target-discipline") {
    description = "Validate that staged intel and extract waves target the trigger site instead of drifting to unrelated ground.";
    await resetVerificationRuntime(page);
    const intelSnapshot = await stageStateSnapshot(page, "intel-crash-pending", 180);
    const intelPending = intelSnapshot?.raid?.pendingReinforcements ?? [];
    const intelSummary = intelSnapshot?.raid?.pendingReinforcementSummary ?? null;
    const intelTargetSpread =
      intelPending.length > 0
        ? intelPending.reduce(
            (best, entry) => Math.max(best, pointDistance(entry.targetPosition, intelSummary?.nextTargetPosition ?? null)),
            0
          )
        : Number.POSITIVE_INFINITY;
    checks.push({
      label: "intel crash targets the terminal block",
      passed:
        intelSnapshot?.raid?.activeIntelCapture?.waveTriggered === true &&
        intelSummary?.nextSource === "intel-wave" &&
        pointDistance(intelSummary?.nextTargetPosition, intelSnapshot?.raid?.position) <= 120,
      details: `source=${intelSummary?.nextSource ?? "n/a"} | targetDistance=${pointDistance(intelSummary?.nextTargetPosition, intelSnapshot?.raid?.position).toFixed(1)}`
    });
    checks.push({
      label: "intel crash wave shares one coherent target",
      passed: intelPending.length > 0 && intelTargetSpread <= 6,
      details: `waves=${intelPending.length} | targetSpread=${Number.isFinite(intelTargetSpread) ? intelTargetSpread.toFixed(1) : "n/a"}`
    });

    await resetVerificationRuntime(page);
    const extractSnapshot = await stageStateSnapshot(page, "extract-hold-active", 180);
    const extractPending = (extractSnapshot?.raid?.pendingReinforcements ?? []).filter(
      (entry) => entry.source === "extraction-wave"
    );
    const extractSummary = extractSnapshot?.raid?.pendingReinforcementSummary ?? null;
    const extractTargetSpread =
      extractPending.length > 0
        ? extractPending.reduce(
            (best, entry) => Math.max(best, pointDistance(entry.targetPosition, extractSummary?.nextTargetPosition ?? null)),
            0
          )
        : Number.POSITIVE_INFINITY;
    checks.push({
      label: "extract crash targets the live peel point",
      passed:
        extractSnapshot?.raid?.extraction?.active === true &&
        extractSummary?.nextSource === "extraction-wave" &&
        pointDistance(extractSummary?.nextTargetPosition, extractSnapshot?.raid?.position) <= 320,
      details: `source=${extractSummary?.nextSource ?? "n/a"} | targetDistance=${pointDistance(extractSummary?.nextTargetPosition, extractSnapshot?.raid?.position).toFixed(1)}`
    });
    checks.push({
      label: "extract crash wave shares one coherent target",
      passed: extractPending.length >= 8 && extractTargetSpread <= 6,
      details: `waves=${extractPending.length} | targetSpread=${Number.isFinite(extractTargetSpread) ? extractTargetSpread.toFixed(1) : "n/a"}`
    });
    snapshot = extractSnapshot;
  } else if (verificationId === "same-room-reinforcement-guard") {
    description = "Validate that staged reinforcement waves spawn well outside the player room instead of popping inside the same pocket.";
    await resetVerificationRuntime(page);
    const intelSnapshot = await stageStateSnapshot(page, "intel-crash-pending", 180);
    const intelGuard = buildWaveGuardRead(intelSnapshot, 180);
    checks.push({
      label: "intel crash spawns stay far outside the player pocket",
      passed: intelGuard.safe,
      details: `minSpawnDistance=${Number.isFinite(intelGuard.minSpawnDistance) ? intelGuard.minSpawnDistance.toFixed(1) : "n/a"} | playerObstacleId=${intelGuard.playerObstacleId ?? "n/a"} | sameObstacleCount=${intelGuard.sameObstacleCount}`
    });

    await resetVerificationRuntime(page);
    const extractSnapshot = await stageStateSnapshot(page, "extract-hold-active", 180);
    const extractGuard = buildWaveGuardRead(extractSnapshot, 180);
    checks.push({
      label: "extract crash spawns stay outside the hold room",
      passed: extractGuard.safe,
      details: `minSpawnDistance=${Number.isFinite(extractGuard.minSpawnDistance) ? extractGuard.minSpawnDistance.toFixed(1) : "n/a"} | playerObstacleId=${extractGuard.playerObstacleId ?? "n/a"} | sameObstacleCount=${extractGuard.sameObstacleCount}`
    });
    snapshot = extractSnapshot;
  } else if (verificationId === "no-immortal-runtime") {
    description = "Validate that normal raids no longer keep legacy immortal support or incident pseudo-units alive.";
    await resetVerificationRuntime(page);
    snapshot = await stageStateSnapshot(page, "raid", 200);
    checks = [
      {
        label: "legacy frontline incidents are disabled in regression truth",
        passed: snapshot?.regression?.legacyToggles?.frontlineIncidentsEnabled === false,
        details: `frontlineIncidentsEnabled=${snapshot?.regression?.legacyToggles?.frontlineIncidentsEnabled ?? "n/a"}`
      },
      {
        label: "normal raid has no live incident pseudo-units",
        passed:
          Array.isArray(snapshot?.frontline?.incidents) &&
          snapshot.frontline.incidents.length === 0 &&
          snapshot?.frontline?.metrics?.actorTotals?.incidentSpots === 0,
        details: `incidents=${snapshot?.frontline?.incidents?.length ?? "n/a"} | incidentSpots=${snapshot?.frontline?.metrics?.actorTotals?.incidentSpots ?? "n/a"}`
      },
      {
        label: "normal raid has no live support pseudo-units",
        passed: snapshot?.frontline?.metrics?.actorTotals?.supports === 0,
        details: `supports=${snapshot?.frontline?.metrics?.actorTotals?.supports ?? "n/a"}`
      }
    ];
  } else if (verificationId === "legacy-crossfire-disabled") {
    description = "Validate that the old ambient crossfire path is gone from the normal runtime.";
    await resetVerificationRuntime(page);
    snapshot = await stageStateSnapshot(page, "raid", 200);
    checks = [
      {
        label: "legacy crossfire toggle is off",
        passed: snapshot?.regression?.legacyToggles?.frontlineIncidentsEnabled === false,
        details: `frontlineIncidentsEnabled=${snapshot?.regression?.legacyToggles?.frontlineIncidentsEnabled ?? "n/a"}`
      },
      {
        label: "no incident labels survive in the frontline surface",
        passed: Array.isArray(snapshot?.frontline?.incidents) && snapshot.frontline.incidents.length === 0,
        details: `incidents=${snapshot?.frontline?.incidents?.length ?? "n/a"}`
      }
    ];
  } else if (verificationId === "legacy-runtime-clean-states") {
    description = "Validate that normal menu, stash, briefing, and raid transitions purge legacy frontline runtime instead of carrying showcase state forward.";
    for (const stateId of ["front-door", "stash", "briefing", "raid"]) {
      await resetVerificationRuntime(page);
      snapshot = await stageStateSnapshot(page, stateId, 180);
      checks.push({
        label: `${stateId} keeps legacy frontline runtime cleared`,
        passed:
          snapshot?.regression?.legacyToggles?.frontlineIncidentsEnabled === false &&
          snapshot?.regression?.legacyToggles?.playerSideSupportsEnabled === false &&
          snapshot?.regression?.legacyRuntime?.active === false &&
          snapshot?.regression?.legacyRuntime?.supportCount === 0 &&
          snapshot?.regression?.legacyRuntime?.incidentCount === 0,
        details:
          `phase=${snapshot?.phase ?? "n/a"} | ` +
          `legacyActive=${snapshot?.regression?.legacyRuntime?.active ?? "n/a"} | ` +
          `supports=${snapshot?.regression?.legacyRuntime?.supportCount ?? "n/a"} | ` +
          `incidents=${snapshot?.regression?.legacyRuntime?.incidentCount ?? "n/a"}`
      });
    }
  } else {
    throw new Error(`Unknown regression verify id "${verificationId}".`);
  }

  const screenshotPath = await captureVerificationScreenshot(page, options);
  return {
    ...buildVerificationResult(verificationId, description, checks),
    screenshotPath,
    snapshot
  };
}

async function runAnyVerification(page, verificationId, options = {}) {
  if (isRegressionVerificationId(verificationId)) {
    return runRegressionVerification(page, verificationId, options);
  }

  if (verificationId === "war-roster-skills") {
    await callAgent(page, "stageState", "town-war");
    const snapshot = await callAgent(page, "getSnapshot");
    const war = snapshot?.war ?? null;
    const soldiers = getTownWarSoldiers(war);
    const builders = soldiers.filter((soldier) => soldier?.role === "builder");
    const firstBuilder = builders[0] ?? null;
    const secondBuilder = builders[1] ?? null;
    const rosterBrief = buildTownWarBrief(war);
    const rosterIdentity = rosterBrief?.soldiers?.identity ?? [];
    const trenchOrder = await callAgent(page, "orderTownWarTrench", { campId: "camp-a", x: 1250, y: 720 });
    const snapshotSoldiers = Array.isArray(war?.soldiers) ? war.soldiers : [];
    const checks = [
      {
        label: "soldiers expose identity stats in the CLI snapshot",
        passed:
          soldiers.length > 0 &&
          soldiers.every(
            (soldier) =>
              typeof soldier?.displayName === "string" &&
              typeof soldier?.archetype === "string" &&
              soldier?.skills &&
              Number.isFinite(soldier.skills.construction) &&
              Number.isFinite(soldier.skills.nerve) &&
              Array.isArray(soldier?.traits) &&
              soldier?.needs &&
              Number.isFinite(soldier.needs.fatigue) &&
              soldier?.workPriorities &&
              Number.isFinite(soldier.workPriorities.Build) &&
              typeof soldier?.currentNeed === "string" &&
              soldier?.experience &&
              Number.isFinite(soldier.experience.operations)
          ),
        details: `soldiers=${soldiers.length}`
      },
      {
        label: "top-level war.soldiers exposes roster fields for automation",
        passed:
          snapshotSoldiers.length > 0 &&
          snapshotSoldiers.some(
            (soldier) =>
              soldier?.skills &&
              Number.isFinite(soldier.skills.construction) &&
              Array.isArray(soldier?.traits) &&
              soldier?.needs &&
              soldier?.workPriorities
          ),
        details: `snapshotSoldiers=${snapshotSoldiers.length}`
      },
      {
        label: "spawned builders differ in construction or nerve",
        passed:
          firstBuilder !== null &&
          secondBuilder !== null &&
          (firstBuilder.skills?.construction !== secondBuilder.skills?.construction ||
            firstBuilder.skills?.nerve !== secondBuilder.skills?.nerve),
        details:
          `builderA=${firstBuilder?.id ?? "none"} construction=${firstBuilder?.skills?.construction ?? "none"} nerve=${
            firstBuilder?.skills?.nerve ?? "none"
          } | builderB=${secondBuilder?.id ?? "none"} construction=${secondBuilder?.skills?.construction ?? "none"} nerve=${
            secondBuilder?.skills?.nerve ?? "none"
          }`
      },
      {
        label: "roster brief explains useful skill and risk",
        passed:
          Array.isArray(rosterIdentity) &&
          rosterIdentity.some(
            (entry) =>
              typeof entry?.usefulSkill === "string" &&
              entry.usefulSkill.length > 0 &&
              typeof entry?.risk === "string" &&
              entry.risk.length > 0
          ),
        details: rosterIdentity[0]?.readable ?? "none"
      },
      {
        label: "existing trench order command path still works after identity state",
        passed: trenchOrder?.ok === true && typeof (trenchOrder?.assignedSoldierId ?? trenchOrder?.order?.assignedSoldierId) === "string",
        details: `ok=${trenchOrder?.ok ?? false} assigned=${trenchOrder?.assignedSoldierId ?? trenchOrder?.order?.assignedSoldierId ?? "none"}`
      }
    ];
    const screenshotPath = await captureVerificationScreenshot(page, options);
    return {
      ...buildVerificationResult(
        verificationId,
        "Stage the town-war roster and prove named soldiers expose skills, traits, needs, priorities, risk, and useful skill reads.",
        checks
      ),
      screenshotPath,
      roster: rosterIdentity,
      snapshot: war,
      trenchOrder,
      brief: rosterBrief
    };
  }

  if (verificationId === "war-priority-skill-choice") {
    await callAgent(page, "stageState", "town-war");
    await callAgent(page, "setTownWarPriority", { soldierId: "town-war-soldier-2", work: "Build", priority: 5 });
    await callAgent(page, "setTownWarPriority", { soldierId: "town-war-soldier-2", work: "Defend", priority: 1 });
    const trenchOrder = await callAgent(page, "orderTownWarTrench", { campId: "camp-a", x: 1250, y: 720 });
    const buildWar = trenchOrder?.war ?? null;
    const buildSoldiers = getTownWarSoldiers(buildWar);
    const highBuildSoldier = buildSoldiers.find((soldier) => soldier?.id === "town-war-soldier-2") ?? null;

    await callAgent(page, "stageState", "town-war");
    await callAgent(page, "setTownWarPriority", { soldierId: "town-war-soldier-2", work: "Suppress", priority: 5 });
    await callAgent(page, "setTownWarPriority", { soldierId: "town-war-soldier-2", work: "Defend", priority: 1 });
    const focusResult = await callAgent(page, "focusTownWarLane", { campId: "camp-a", lane: "mid" });
    const focusWar = focusResult?.war ?? null;
    const suppressSoldier =
      getTownWarSoldiers(focusWar).find((soldier) => soldier?.id === "town-war-soldier-2" && soldier?.task?.kind === "suppress") ?? null;

    await callAgent(page, "stageState", "town-war");
    await callAgent(page, "setTownWarPriority", { soldierId: "town-war-soldier-2", work: "Resupply", priority: 5 });
    await callAgent(page, "setTownWarPriority", { soldierId: "town-war-soldier-2", work: "Defend", priority: 1 });
    await callAgent(page, "setTownWarPriority", { soldierId: "town-war-soldier-2", work: "Build", priority: 0 });
    await callAgent(page, "setTownWarPriority", { soldierId: "town-war-soldier-2", work: "Suppress", priority: 0 });
    const resupplyFocus = await callAgent(page, "focusTownWarLane", { campId: "camp-a", lane: "mid" });
    const resupplySoldier =
      getTownWarSoldiers(resupplyFocus?.war).find((soldier) => soldier?.id === "town-war-soldier-2" && soldier?.task?.kind === "resupply") ??
      null;

    await callAgent(page, "stageState", "town-war");
    await callAgent(page, "presetTownWarPriority", { soldierId: "town-war-soldier-2", preset: "rest-cycle" });
    await callAgent(page, "setTownWarSoldierNeeds", { soldierId: "town-war-soldier-2", fatigue: 0.9, morale: 0.35 });
    const restFocus = await callAgent(page, "focusTownWarLane", { campId: "camp-a", lane: "mid" });
    const tiredSoldier = getTownWarSoldiers(restFocus?.war).find((soldier) => soldier?.id === "town-war-soldier-2") ?? null;

    await callAgent(page, "stageState", "town-war");
    const baselineCandidates = await callAgent(page, "getTownWarTaskCandidates", { soldierId: "town-war-soldier-2" });
    await callAgent(page, "setTownWarPriority", { soldierId: "town-war-soldier-2", work: "Build", priority: 5 });
    const changedCandidates = await callAgent(page, "getTownWarTaskCandidates", { soldierId: "town-war-soldier-2" });
    const baselineTop = baselineCandidates?.result?.candidates?.[0]?.work ?? null;
    const changedTop = changedCandidates?.result?.candidates?.[0]?.work ?? null;

    const checks = [
      {
        label: "high-Build soldier prefers construction when a build order exists",
        passed:
          trenchOrder?.ok === true &&
          (trenchOrder?.order?.assignedSoldierId === "town-war-soldier-2" || highBuildSoldier?.taskDecision?.selectedWork === "Build"),
        details:
          `assigned=${trenchOrder?.order?.assignedSoldierId ?? "none"} | ` +
          `selected=${highBuildSoldier?.taskDecision?.selectedWork ?? "none"} | score=${highBuildSoldier?.taskDecision?.selectedScore ?? "n/a"}`
      },
      {
        label: "high-Suppress soldier covers the lane instead of default defense",
        passed: suppressSoldier !== null && suppressSoldier?.taskDecision?.selectedWork === "Suppress",
        details: `task=${suppressSoldier?.task?.kind ?? "none"} | selected=${suppressSoldier?.taskDecision?.selectedWork ?? "none"}`
      },
      {
        label: "high-Resupply soldier runs ammo when resupply is prioritized",
        passed: resupplySoldier !== null && resupplySoldier?.taskDecision?.selectedWork === "Resupply",
        details: `task=${resupplySoldier?.task?.kind ?? "none"} | selected=${resupplySoldier?.taskDecision?.selectedWork ?? "none"}`
      },
      {
        label: "tired high-Rest soldier avoids noncritical lane work",
        passed: tiredSoldier?.task?.kind === "hold" && tiredSoldier?.taskDecision?.selectedWork === "Rest",
        details:
          `task=${tiredSoldier?.task?.kind ?? "none"} | selected=${tiredSoldier?.taskDecision?.selectedWork ?? "none"} | ` +
          `need=${tiredSoldier?.currentNeed ?? "unknown"} | blocked=${tiredSoldier?.taskDecision?.blockedReason ?? "none"}`
      },
      {
        label: "changing priority changes the top task candidate",
        passed: baselineTop !== null && changedTop === "Build" && baselineTop !== changedTop,
        details: `baselineTop=${baselineTop ?? "none"} | changedTop=${changedTop ?? "none"}`
      }
    ];
    const screenshotPath = await captureVerificationScreenshot(page, options);
    return {
      ...buildVerificationResult(
        verificationId,
        "Stage the town-war priority matrix and prove priorities, skills, fatigue, and task candidates change soldier assignment.",
        checks
      ),
      screenshotPath,
      trenchOrder,
      focusResult,
      resupplyFocus,
      restFocus,
      baselineCandidates,
      changedCandidates,
      brief: buildTownWarBrief(changedCandidates?.war ?? null)
    };
  }

  if (verificationId === "war-build-skill-under-fire") {
    await callAgent(page, "stageState", "town-war");
    const nervousOrder = await callAgent(page, "orderTownWarBuildTest", {
      builderId: "town-war-soldier-1",
      x: 7200,
      y: 3110
    });
    await callAgent(page, "advanceTownWar", { seconds: 30, tickSeconds: 0.25 });
    const nervousReport = await callAgent(page, "getTownWarBuildReport", { orderId: nervousOrder?.order?.orderId });

    await callAgent(page, "stageState", "town-war");
    const steadyOrder = await callAgent(page, "orderTownWarBuildTest", {
      builderId: "town-war-soldier-4",
      x: 4300,
      y: 3110
    });
    await callAgent(page, "advanceTownWar", { seconds: 30, tickSeconds: 0.25 });
    const steadyReport = await callAgent(page, "getTownWarBuildReport", { orderId: steadyOrder?.order?.orderId });

    await callAgent(page, "stageState", "town-war");
    const coveredOrder = await callAgent(page, "orderTownWarBuildTest", {
      builderId: "town-war-soldier-1",
      coveredById: "town-war-soldier-3",
      x: 7200,
      y: 3110
    });
    await callAgent(page, "advanceTownWar", { seconds: 30, tickSeconds: 0.25 });
    const coveredReport = await callAgent(page, "getTownWarBuildReport", { orderId: coveredOrder?.order?.orderId });

    await callAgent(page, "stageState", "town-war");
    await callAgent(page, "setTownWarSoldierAmmo", { soldierId: "town-war-soldier-3", inMag: 0, reserve: 0 });
    const dryOrder = await callAgent(page, "orderTownWarBuildTest", {
      builderId: "town-war-soldier-1",
      coveredById: "town-war-soldier-3",
      x: 7200,
      y: 3110
    });
    await callAgent(page, "advanceTownWar", { seconds: 30, tickSeconds: 0.25 });
    const dryReport = await callAgent(page, "getTownWarBuildReport", { orderId: dryOrder?.order?.orderId });

    await callAgent(page, "stageState", "town-war");
    const completeOrder = await callAgent(page, "orderTownWarBuildTest", {
      builderId: "town-war-soldier-1",
      coveredById: "town-war-soldier-3",
      x: 7480,
      y: 3110
    });
    await callAgent(page, "advanceTownWar", { seconds: 55, tickSeconds: 0.25 });
    const completeReport = await callAgent(page, "getTownWarBuildReport", { orderId: completeOrder?.order?.orderId });

    const nervousBuild = nervousReport?.report?.order?.build ?? null;
    const steadyBuild = steadyReport?.report?.order?.build ?? null;
    const coveredBuild = coveredReport?.report?.order?.build ?? null;
    const dryBuild = dryReport?.report?.order?.build ?? null;
    const completeBuild = completeReport?.report?.order?.build ?? null;

    const checks = [
      {
        label: "different Construction and Nerve produce different exposed build progress",
        passed:
          nervousBuild !== null &&
          steadyBuild !== null &&
          Math.abs((nervousBuild?.progress ?? 0) - (steadyBuild?.progress ?? 0)) >= 5,
        details:
          `nervous=${nervousBuild?.progress ?? "n/a"} stall=${nervousBuild?.stallReason ?? "none"} | ` +
          `steady=${steadyBuild?.progress ?? "n/a"} stall=${steadyBuild?.stallReason ?? "none"}`
      },
      {
        label: "friendly suppression reduces exposed-build stall pressure",
        passed:
          coveredBuild !== null &&
          nervousBuild !== null &&
          (coveredBuild?.coverFireSupport ?? 0) > (nervousBuild?.coverFireSupport ?? 0) &&
          (coveredBuild?.progress ?? 0) > (nervousBuild?.progress ?? 0),
        details:
          `coveredProgress=${coveredBuild?.progress ?? "n/a"} support=${coveredBuild?.coverFireSupport ?? "n/a"} | ` +
          `uncoveredProgress=${nervousBuild?.progress ?? "n/a"} support=${nervousBuild?.coverFireSupport ?? "n/a"}`
      },
      {
        label: "low ammo removes suppression protection",
        passed:
          dryBuild !== null &&
          coveredBuild !== null &&
          dryBuild?.supportAmmoState === "dry" &&
          (dryBuild?.progress ?? 0) < (coveredBuild?.progress ?? 0),
        details:
          `dryProgress=${dryBuild?.progress ?? "n/a"} ammo=${dryBuild?.supportAmmoState ?? "n/a"} | ` +
          `coveredProgress=${coveredBuild?.progress ?? "n/a"} ammo=${coveredBuild?.supportAmmoState ?? "n/a"}`
      },
      {
        label: "build report exposes cause chain and completion explanation",
        passed:
          completeReport?.report?.order?.status === "completed" &&
          typeof completeBuild?.outcomeCause === "string" &&
          Array.isArray(completeBuild?.causeChain) &&
          completeBuild.causeChain.length > 0,
        details:
          `status=${completeReport?.report?.order?.status ?? "none"} | cause=${completeBuild?.outcomeCause ?? "none"} | ` +
          `chain=${(completeBuild?.causeChain ?? []).join(">") || "none"}`
      }
    ];
    const screenshotPath = await captureVerificationScreenshot(page, options);
    return {
      ...buildVerificationResult(
        verificationId,
        "Stage exposed trench builds and prove Construction, Nerve, suppression, Logistics/ammo, and fatigue drive build progress and debrief causes.",
        checks
      ),
      screenshotPath,
      nervousReport,
      steadyReport,
      coveredReport,
      dryReport,
      completeReport,
      snapshot: completeReport?.war ?? null,
      brief: buildTownWarBrief(completeReport?.war ?? null)
    };
  }

  if (verificationId === "war-medical-rescue-emergence") {
    await callAgent(page, "stageState", "town-war");
    const rescueStage = await callAgent(page, "stageTownWarCasualty", {
      soldierId: "town-war-soldier-1",
      x: 6200,
      y: 3110,
      severity: "critical"
    });
    const rescueOrder = await callAgent(page, "orderTownWarMedicRescue", {
      medicId: "town-war-soldier-7",
      targetSoldierId: "town-war-soldier-1",
      coveredById: "town-war-soldier-3"
    });
    await callAgent(page, "advanceTownWar", { seconds: 45, tickSeconds: 0.25 });
    const rescueReport = await callAgent(page, "getTownWarRescueReport");
    const rescuedCasualty = rescueReport?.war?.townWar?.casualties?.find((casualty) => casualty?.soldierId === "town-war-soldier-1") ?? null;
    const rescueMedic = getTownWarSoldiers(rescueReport?.war).find((soldier) => soldier?.id === "town-war-soldier-7") ?? null;

    await callAgent(page, "stageState", "town-war");
    await callAgent(page, "stageTownWarCasualty", {
      soldierId: "town-war-soldier-2",
      x: 7200,
      y: 3110,
      severity: "critical"
    });
    const lowNerveOrder = await callAgent(page, "orderTownWarMedicRescue", {
      medicId: "town-war-soldier-1",
      targetSoldierId: "town-war-soldier-2"
    });

    await callAgent(page, "stageState", "town-war");
    await callAgent(page, "stageTownWarCasualty", {
      soldierId: "town-war-soldier-2",
      x: 6200,
      y: 3110,
      severity: "critical"
    });
    const uncoveredOrder = await callAgent(page, "orderTownWarMedicRescue", {
      medicId: "town-war-soldier-7",
      targetSoldierId: "town-war-soldier-2"
    });

    await callAgent(page, "stageState", "town-war");
    await callAgent(page, "stageTownWarCasualty", {
      soldierId: "town-war-soldier-2",
      x: 6200,
      y: 3110,
      severity: "critical"
    });
    const coveredOrder = await callAgent(page, "orderTownWarMedicRescue", {
      medicId: "town-war-soldier-7",
      targetSoldierId: "town-war-soldier-2",
      coveredById: "town-war-soldier-3"
    });

    await callAgent(page, "stageState", "town-war");
    await callAgent(page, "stageTownWarCasualty", {
      soldierId: "town-war-soldier-1",
      x: 7200,
      y: 3110,
      severity: "critical"
    });
    await callAgent(page, "advanceTownWar", { seconds: 50, tickSeconds: 0.25 });
    const failedReport = await callAgent(page, "getTownWarRescueReport");
    const failedCasualty = failedReport?.war?.townWar?.casualties?.find((casualty) => casualty?.soldierId === "town-war-soldier-1") ?? null;
    const failedDrama = failedReport?.war?.dialogue?.lastDramaEvent ?? null;

    const checks = [
      {
        label: "high-Medical high-Rescue medic attempts and completes recovery",
        passed: rescueOrder?.ok === true && rescuedCasualty?.status === "stabilized" && (rescueMedic?.experience?.rescuesCompleted ?? 0) > 0,
        details:
          `order=${rescueOrder?.ok ?? false} | status=${rescuedCasualty?.status ?? "none"} | ` +
          `rescues=${rescueMedic?.experience?.rescuesCompleted ?? "n/a"}`
      },
      {
        label: "low Nerve or high exposure can delay a rescue",
        passed: lowNerveOrder?.ok === false && typeof lowNerveOrder?.result?.casualty?.outcomeCause === "string",
        details: `ok=${lowNerveOrder?.ok ?? false} | reason=${lowNerveOrder?.result?.casualty?.outcomeCause ?? lowNerveOrder?.reason ?? "none"}`
      },
      {
        label: "suppression or covered path can flip the medic decision",
        passed:
          uncoveredOrder?.ok === false &&
          coveredOrder?.ok === true &&
          (coveredOrder?.result?.casualty?.coveredPath ?? 0) > (uncoveredOrder?.result?.casualty?.coveredPath ?? 0),
        details:
          `uncoveredOk=${uncoveredOrder?.ok ?? false} cover=${uncoveredOrder?.result?.casualty?.coveredPath ?? "n/a"} | ` +
          `coveredOk=${coveredOrder?.ok ?? false} cover=${coveredOrder?.result?.casualty?.coveredPath ?? "n/a"}`
      },
      {
        label: "successful rescue creates memory and trust pressure",
        passed:
          Array.isArray(rescueReport?.war?.dramaMemories) &&
          rescueReport.war.dramaMemories.some((memory) => memory?.tag === "wounded-stabilized") &&
          (rescueMedic?.dramaArc?.protectiveOfSoldierIds ?? []).includes("town-war-soldier-1"),
        details:
          `memoryTags=${(rescueReport?.war?.dramaMemories ?? []).map((memory) => memory?.tag).join(",") || "none"} | ` +
          `protective=${(rescueMedic?.dramaArc?.protectiveOfSoldierIds ?? []).join(",") || "none"}`
      },
      {
        label: "failed rescue creates readable debrief truth",
        passed:
          failedCasualty?.status === "lost" &&
          failedDrama?.kind === "wounded-lost" &&
          Array.isArray(failedReport?.war?.debriefEchoes) &&
          failedReport.war.debriefEchoes.some((echo) => echo?.eventKind === "wounded-lost"),
        details:
          `status=${failedCasualty?.status ?? "none"} | drama=${failedDrama?.kind ?? "none"} | ` +
          `cause=${failedCasualty?.outcomeCause ?? "none"}`
      }
    ];
    const screenshotPath = await captureVerificationScreenshot(page, options);
    return {
      ...buildVerificationResult(
        verificationId,
        "Stage casualty rescue scenarios and prove Medical, Nerve, Social, cover, suppression, memory, and debrief truth drive recovery.",
        checks
      ),
      screenshotPath,
      rescueStage,
      rescueOrder,
      rescueReport,
      lowNerveOrder,
      uncoveredOrder,
      coveredOrder,
      failedReport,
      brief: buildTownWarBrief(rescueReport?.war ?? null)
    };
  }

  if (verificationId === "war-logistics-camp-readiness") {
    await callAgent(page, "stageState", "town-war");
    const baseline = await callAgent(page, "getTownWarSustainmentReport");
    const baselineCamp = baseline?.report?.camps?.find((camp) => camp.campId === "camp-a") ?? null;

    const ammoPressure = await callAgent(page, "stageTownWarAmmoPressure", { campId: "camp-a" });
    const pressuredCamp = ammoPressure?.report?.camps?.find((camp) => camp.campId === "camp-a") ?? null;
    const pressuredOrder = await callAgent(page, "orderTownWarBuildTest", {
      builderId: "town-war-soldier-1",
      coveredById: "town-war-soldier-3",
      x: 7200,
      y: 3110
    });
    await callAgent(page, "advanceTownWar", { seconds: 24, tickSeconds: 0.25 });
    const pressuredReport = await callAgent(page, "getTownWarBuildReport", { orderId: pressuredOrder?.order?.orderId ?? "" });

    await callAgent(page, "stageState", "town-war");
    const tiredStage = await callAgent(page, "stageTownWarFatigue", { campId: "camp-a", level: 0.82 });
    const tiredBefore = tiredStage?.report?.camps?.find((camp) => camp.campId === "camp-a") ?? null;
    await callAgent(page, "setTownWarCampWork", { campId: "camp-a", work: "Cook", priority: 0 });
    await callAgent(page, "setTownWarCampWork", { campId: "camp-a", work: "Rest", priority: 0 });
    await callAgent(page, "advanceTownWar", { seconds: 30, tickSeconds: 0.5 });
    const neglected = await callAgent(page, "getTownWarSustainmentReport");
    const neglectedCamp = neglected?.report?.camps?.find((camp) => camp.campId === "camp-a") ?? null;

    await callAgent(page, "stageState", "town-war");
    await callAgent(page, "stageTownWarFatigue", { campId: "camp-a", level: 0.82 });
    await callAgent(page, "setTownWarCampWork", { campId: "camp-a", work: "Cook", priority: 5 });
    await callAgent(page, "setTownWarCampWork", { campId: "camp-a", work: "Rest", priority: 5 });
    await callAgent(page, "advanceTownWar", { seconds: 30, tickSeconds: 0.5 });
    const recovered = await callAgent(page, "getTownWarSustainmentReport");
    const recoveredCamp = recovered?.report?.camps?.find((camp) => camp.campId === "camp-a") ?? null;

    const restedSoldiers = getTownWarSoldiers(recovered?.war ?? null).filter((soldier) => soldier?.faction === "camp-a");
    const tiredSoldiers = getTownWarSoldiers(neglected?.war ?? null).filter((soldier) => soldier?.faction === "camp-a");
    const recoveredFatigue =
      restedSoldiers.reduce((total, soldier) => total + (Number.isFinite(soldier?.needs?.fatigue) ? soldier.needs.fatigue : 0), 0) /
      Math.max(1, restedSoldiers.length);
    const neglectedFatigue =
      tiredSoldiers.reduce((total, soldier) => total + (Number.isFinite(soldier?.needs?.fatigue) ? soldier.needs.fatigue : 0), 0) /
      Math.max(1, tiredSoldiers.length);

    const healthyOrder = await callAgent(page, "orderTownWarBuildTest", {
      builderId: "town-war-soldier-1",
      coveredById: "town-war-soldier-3",
      x: 7200,
      y: 3110
    });
    await callAgent(page, "advanceTownWar", { seconds: 24, tickSeconds: 0.25 });
    const healthyReport = await callAgent(page, "getTownWarBuildReport", { orderId: healthyOrder?.order?.orderId ?? "" });
    const finalWar = healthyReport?.war ?? recovered?.war ?? null;

    const checks = [
      {
        label: "sustainment snapshot exposes readiness/fatigue/hunger/ammo flow",
        passed:
          baselineCamp &&
          Number.isFinite(baselineCamp.readiness) &&
          Number.isFinite(baselineCamp.fatigueAverage) &&
          Number.isFinite(baselineCamp.hungerAverage) &&
          Number.isFinite(baselineCamp.ammoFlow),
        details: `readiness=${baselineCamp?.readiness ?? "?"} fatigue=${baselineCamp?.fatigueAverage ?? "?"} hunger=${baselineCamp?.hungerAverage ?? "?"} ammoFlow=${baselineCamp?.ammoFlow ?? "?"}`
      },
      {
        label: "low Logistics/ammo pressure degrades support",
        passed:
          pressuredCamp &&
          baselineCamp &&
          pressuredCamp.ammoFlow < baselineCamp.ammoFlow &&
          (pressuredReport?.report?.order?.build?.supportAmmoState === "low" || pressuredReport?.report?.order?.build?.supportAmmoState === "dry"),
        details: `baselineFlow=${baselineCamp?.ammoFlow ?? "?"} pressuredFlow=${pressuredCamp?.ammoFlow ?? "?"} support=${pressuredReport?.report?.order?.build?.supportAmmoState ?? "?"}`
      },
      {
        label: "cook/rest priorities improve recovery and readiness",
        passed:
          recoveredCamp &&
          neglectedCamp &&
          recoveredCamp.readiness > neglectedCamp.readiness &&
          recoveredFatigue < neglectedFatigue,
        details: `neglected readiness=${neglectedCamp?.readiness ?? "?"} fatigue=${neglectedFatigue.toFixed(2)} | recovered readiness=${recoveredCamp?.readiness ?? "?"} fatigue=${recoveredFatigue.toFixed(2)}`
      },
      {
        label: "rest cycle creates labor opportunity cost",
        passed: recoveredCamp?.restCycle > neglectedCamp?.restCycle && recoveredCamp?.warnings?.includes("Rest cycle active"),
        details: `rest neglected=${neglectedCamp?.restCycle ?? "?"} recovered=${recoveredCamp?.restCycle ?? "?"} warnings=${(recoveredCamp?.warnings ?? []).join(",")}`
      },
      {
        label: "sustainment affects build/hold behavior",
        passed:
          pressuredReport?.report?.order?.build?.supportAmmoState === "dry" &&
          recoveredCamp?.readiness > pressuredCamp?.readiness,
        details:
          `healthySupport=${healthyReport?.report?.order?.build?.supportAmmoState ?? "?"} ` +
          `pressuredSupport=${pressuredReport?.report?.order?.build?.supportAmmoState ?? "?"} ` +
          `healthyReadiness=${recoveredCamp?.readiness ?? "?"} pressuredReadiness=${pressuredCamp?.readiness ?? "?"}`
      },
      {
        label: "debrief can distinguish bad sustainment",
        passed:
          Array.isArray(pressuredReport?.report?.order?.build?.causeChain) &&
          (pressuredReport.report.order.build.causeChain.includes("ammo-support-low") ||
            pressuredReport.report.order.build.causeChain.includes("ammo-support-dry") ||
            pressuredReport.report.order.build.causeChain.includes("bad-sustainment")),
        details: `cause=${(pressuredReport?.report?.order?.build?.causeChain ?? []).join(">")}`
      }
    ];
    const screenshotPath = await captureVerificationScreenshot(page, options);
    return {
      ...buildVerificationResult(
        "war-logistics-camp-readiness",
        "Verifies Logistics, Cooking, Endurance, Rest, fatigue, ammo flow, and readiness as one sustainment loop.",
        checks
      ),
      screenshotPath,
      baseline,
      ammoPressure,
      pressuredReport,
      neglected,
      recovered,
      healthyReport,
      snapshot: finalWar,
      brief: buildTownWarBrief(finalWar)
    };
  }

  if (verificationId === "war-skill-emergence-loop") {
    await callAgent(page, "stageState", "town-war");
    const demo = await callAgent(page, "runTownWarSkillEmergenceDemo");
    const debrief = await callAgent(page, "getTownWarSkillDebrief");
    const war = debrief?.war ?? demo?.war ?? null;
    const brief = buildTownWarBrief(war);
    const outcomes = Array.isArray(debrief?.debrief?.outcomes) ? debrief.debrief.outcomes : [];
    const heldOutcome = outcomes.find((outcome) => typeof outcome?.outcome === "string" && outcome.outcome.startsWith("held-")) ?? null;
    const failedOutcome = outcomes.find((outcome) => typeof outcome?.outcome === "string" && outcome.outcome.startsWith("failed-")) ?? null;
    const memoryTags = Array.isArray(war?.soldiers)
      ? war.soldiers.flatMap((soldier) => (Array.isArray(soldier?.dramaMemoryTags) ? soldier.dramaMemoryTags : []))
      : [];
    const checks = [
      {
        label: "Demo resolves one hold outcome",
        passed: Boolean(heldOutcome),
        details: `held=${heldOutcome?.outcome ?? "none"}`
      },
      {
        label: "Demo resolves one failure outcome",
        passed: Boolean(failedOutcome),
        details: `failed=${failedOutcome?.outcome ?? "none"}`
      },
      {
        label: "Debrief explains real cause chain",
        passed:
          typeof debrief?.debrief?.summary === "string" &&
          debrief.debrief.summary.length > 20 &&
          Array.isArray(debrief?.debrief?.causeChain) &&
          debrief.debrief.causeChain.length >= 2,
        details: debrief?.debrief?.summary ?? "none"
      },
      {
        label: "Memory and scars were changed by flank outcomes",
        passed:
          memoryTags.includes("skill-emergence") &&
          Array.isArray(war?.locationScars) &&
          war.locationScars.some((scar) => Array.isArray(scar?.tags) && scar.tags.includes("flank")),
        details: `memoryTags=${memoryTags.slice(0, 8).join(",")} scars=${war?.locationScars?.length ?? 0}`
      },
      {
        label: "CLI brief exposes better next plan",
        passed: typeof brief?.skillEmergence?.debrief?.recommendedNextPlan === "string" && brief.skillEmergence.debrief.recommendedNextPlan.length > 20,
        details: brief?.skillEmergence?.debrief?.recommendedNextPlan ?? "none"
      }
    ];
    const screenshotPath = await captureVerificationScreenshot(page, options);
    return {
      ...buildVerificationResult(
        "war-skill-emergence-loop",
        "Verifies Perception, Scout priority, Nerve, Shooting, sustainment, memories, scars, and debrief recommendations as one flank-emergence loop.",
        checks
      ),
      screenshotPath,
      demo,
      debrief,
      snapshot: war,
      brief
    };
  }

  if (verificationId === "war-drama-responsibility") {
    await callAgent(page, "stageState", "town-war");
    const firstOrder = await callAgent(page, "orderTownWarTrench", { campId: "camp-a", x: 1250, y: 720 });
    const firstWar = firstOrder?.war ?? null;
    const secondOrder = await callAgent(page, "orderTownWarTrench", { campId: "camp-a", x: 1230, y: 740 });
    const secondWar = secondOrder?.war ?? null;
    const memories = Array.isArray(secondWar?.dramaMemories) ? secondWar.dramaMemories : [];
    const soldiers = Array.isArray(secondWar?.townWar?.soldiers) ? secondWar.townWar.soldiers : [];
    const lastDramaEvent = secondWar?.dialogue?.lastDramaEvent ?? null;
    const witnessCount = memories.reduce((total, memory) => total + (Array.isArray(memory?.witnessIds) ? memory.witnessIds.length : 0), 0);
    const soldierWitnessCount = soldiers.reduce(
      (total, soldier) => total + (Number.isFinite(soldier?.witnessedEventCount) ? soldier.witnessedEventCount : 0),
      0
    );
    const referencedMemoryTag = lastDramaEvent?.referencedMemoryTag ?? null;
    const checks = [
      {
        label: "first risky order creates responsibility memory",
        passed: Array.isArray(firstWar?.dramaMemories) && firstWar.dramaMemories.some((memory) => memory?.tag === "order-exposed-builder"),
        details: `memoryTags=${(firstWar?.dramaMemories ?? []).map((memory) => memory?.tag).join(",") || "none"}`
      },
      {
        label: "memory records witnesses",
        passed: witnessCount > 0 && soldierWitnessCount > 0,
        details: `memoryWitnesses=${witnessCount} | soldierWitnessCount=${soldierWitnessCount}`
      },
      {
        label: "later risky order references earlier responsibility",
        passed: referencedMemoryTag === "order-exposed-builder" || referencedMemoryTag === "officer-cost",
        details: `lastDrama=${lastDramaEvent?.kind ?? "none"} | referencedMemoryTag=${referencedMemoryTag ?? "none"} | text=${lastDramaEvent?.text ?? "none"}`
      }
    ];
    const screenshotPath = await captureVerificationScreenshot(page, options);
    return {
      ...buildVerificationResult(
        verificationId,
        "Stage two risky trench orders and prove the second line can reference earlier officer responsibility memory.",
        checks
      ),
      screenshotPath,
      firstOrder,
      secondOrder,
      snapshot: secondWar,
      brief: buildTownWarBrief(secondWar)
    };
  }

  if (verificationId === "war-drama-relationships") {
    await callAgent(page, "stageState", "town-war");
    const firstOrder = await callAgent(page, "orderTownWarTrench", { campId: "camp-a", x: 1250, y: 720 });
    const firstLine = firstOrder?.war?.dialogue?.lastDramaEvent ?? null;
    await callAgent(page, "orderTownWarTrench", { campId: "camp-a", x: 1230, y: 740 });
    const thirdOrder = await callAgent(page, "orderTownWarTrench", { campId: "camp-a", x: 1210, y: 760 });
    const thirdWar = thirdOrder?.war ?? null;
    const thirdLine = thirdWar?.dialogue?.lastDramaEvent ?? null;
    const soldiers = Array.isArray(thirdWar?.townWar?.soldiers) ? thirdWar.townWar.soldiers : [];
    const arcedSoldier = soldiers.find((soldier) => Number.isFinite(soldier?.dramaArc?.resentment) && soldier.dramaArc.resentment > 0) ?? null;
    const arcTags = Array.isArray(arcedSoldier?.dramaMemoryTags) ? arcedSoldier.dramaMemoryTags : [];
    const checks = [
      {
        label: "soldier arc pressure changes after repeated officer-cost memories",
        passed:
          Number.isFinite(arcedSoldier?.dramaArc?.trustInOfficer) &&
          arcedSoldier.dramaArc.trustInOfficer < 0.55 &&
          Number.isFinite(arcedSoldier?.dramaArc?.resentment) &&
          arcedSoldier.dramaArc.resentment > 0,
        details:
          `trust=${arcedSoldier?.dramaArc?.trustInOfficer ?? "none"} | ` +
          `resentment=${arcedSoldier?.dramaArc?.resentment ?? "none"} | tags=${arcTags.join(",") || "none"}`
      },
      {
        label: "arc state is exposed in the CLI brief",
        passed: thirdWar?.soldiers?.some((soldier) => soldier?.dramaArc && Number.isFinite(soldier?.trustInOfficer)) === true,
        details: `snapshotSoldiers=${thirdWar?.soldiers?.length ?? 0}`
      },
      {
        label: "similar later event gets a long-haul arc callback",
        passed:
          thirdLine?.channel === "Long Haul" &&
          typeof thirdLine?.text === "string" &&
          thirdLine.text !== firstLine?.text,
        details: `first="${firstLine?.text ?? "none"}" | later="${thirdLine?.text ?? "none"}" | channel=${thirdLine?.channel ?? "none"}`
      }
    ];
    const screenshotPath = await captureVerificationScreenshot(page, options);
    return {
      ...buildVerificationResult(
        verificationId,
        "Stage repeated risky trench orders and prove soldier arc pressure changes later dialogue selection.",
        checks
      ),
      screenshotPath,
      firstOrder,
      thirdOrder,
      snapshot: thirdWar,
      brief: buildTownWarBrief(thirdWar)
    };
  }

  if (verificationId === "war-drama-location-scars") {
    await callAgent(page, "stageState", "town-war");
    const firstOrder = await callAgent(page, "orderTownWarTrench", { campId: "camp-a", x: 1250, y: 720 });
    const firstWar = firstOrder?.war ?? null;
    const firstLine = firstWar?.dialogue?.lastDramaEvent ?? null;
    const secondOrder = await callAgent(page, "orderTownWarTrench", { campId: "camp-a", x: 1250, y: 720 });
    const secondWar = secondOrder?.war ?? null;
    const secondLine = secondWar?.dialogue?.lastDramaEvent ?? null;
    const scars = Array.isArray(secondWar?.locationScars) ? secondWar.locationScars : [];
    const focusedScar = secondWar?.focusedLocationScar ?? null;
    const activeScarTags = Array.isArray(secondWar?.dialogue?.activeScarTags) ? secondWar.dialogue.activeScarTags : [];
    const scarTags = scars.flatMap((scar) => (Array.isArray(scar?.tags) ? scar.tags : []));
    const checks = [
      {
        label: "first risky lane order creates a location scar",
        passed: scarTags.includes("builder-hit-here"),
        details: `scarTags=${scarTags.join(",") || "none"}`
      },
      {
        label: "repeat order focuses the same scarred location",
        passed:
          Array.isArray(focusedScar?.tags) &&
          focusedScar.tags.includes("builder-hit-here") &&
          activeScarTags.includes("builder-hit-here"),
        details:
          `focused=${focusedScar?.label ?? "none"} | ` +
          `focusedTags=${Array.isArray(focusedScar?.tags) ? focusedScar.tags.join(",") : "none"} | ` +
          `activeScarTags=${activeScarTags.join(",") || "none"}`
      },
      {
        label: "later dialogue changes because the lane is scarred",
        passed:
          secondLine?.channel === "Scarred Town" &&
          secondLine?.referencedMemoryTag === "builder-hit-here" &&
          typeof secondLine?.text === "string" &&
          secondLine.text !== firstLine?.text,
        details:
          `first="${firstLine?.text ?? "none"}" | ` +
          `later="${secondLine?.text ?? "none"}" | ` +
          `channel=${secondLine?.channel ?? "none"} | referenced=${secondLine?.referencedMemoryTag ?? "none"}`
      }
    ];
    const screenshotPath = await captureVerificationScreenshot(page, options);
    return {
      ...buildVerificationResult(
        verificationId,
        "Stage two trench orders at the same lane and prove the second line can echo that location's history.",
        checks
      ),
      screenshotPath,
      firstOrder,
      secondOrder,
      snapshot: secondWar,
      brief: buildTownWarBrief(secondWar)
    };
  }

  if (verificationId === "war-drama-beat-chain") {
    await callAgent(page, "stageState", "town-war");
    const orderResult = await callAgent(page, "orderTownWarTrench", { campId: "camp-a", x: 7590, y: 3159 });
    const advanceResult = await callAgent(page, "advanceTownWar", { seconds: 12, tickSeconds: 0.25 });
    const war = advanceResult?.war ?? orderResult?.war ?? null;
    const beatChain = Array.isArray(war?.dramaBeat?.chain) ? war.dramaBeat.chain : [];
    const beatKinds = beatChain.map((entry) => entry?.beat).filter(Boolean);
    const debriefEchoes = Array.isArray(war?.debriefEchoes) ? war.debriefEchoes : [];
    const currentBeat = war?.dramaBeat?.current ?? null;
    const lastPayoff = war?.dramaBeat?.lastPayoff ?? null;
    const checks = [
      {
        label: "trench order produces a setup beat",
        passed: beatKinds.includes("setup"),
        details: `beats=${beatKinds.join(",") || "none"}`
      },
      {
        label: "under-fire trench order produces pressure or complication",
        passed: beatKinds.includes("complication") || beatKinds.includes("rising-pressure"),
        details: `beats=${beatKinds.join(",") || "none"}`
      },
      {
        label: "completed trench produces payoff or cost",
        passed: beatKinds.includes("payoff") || beatKinds.includes("cost"),
        details: `current=${currentBeat?.beat ?? "none"} | lastPayoff=${lastPayoff?.beat ?? "none"}`
      },
      {
        label: "debrief echoes summarize tracked events",
        passed:
          debriefEchoes.length > 0 &&
          debriefEchoes.every((echo) => typeof echo?.sourceSummary === "string" && echo.sourceSummary.length > 0),
        details: `echoes=${debriefEchoes.length} | latest=${debriefEchoes[0]?.text ?? "none"}`
      },
      {
        label: "CLI brief exposes beat state",
        passed: buildTownWarBrief(war)?.dramaBeat?.chain?.length > 0 && buildTownWarBrief(war)?.debriefEchoes?.length > 0,
        details: `briefBeat=${buildTownWarBrief(war)?.dramaBeat?.current?.beat ?? "none"}`
      }
    ];
    const screenshotPath = await captureVerificationScreenshot(page, options);
    return {
      ...buildVerificationResult(
        verificationId,
        "Stage a risky trench order and prove the system records setup, pressure, payoff/cost, and debrief echoes from real events.",
        checks
      ),
      screenshotPath,
      orderResult,
      advanceResult,
      snapshot: war,
      brief: buildTownWarBrief(war)
    };
  }

  if (verificationId === "frontline-ai-player-decenter") {
    await callAgent(page, "stageState", "town-war");
    await callAgent(page, "deployTownWarOfficer", { campId: "camp-a" });
    await callAgent(page, "focusTownWarLane", { campId: "camp-a", lane: "mid" });
    await callAgent(page, "focusTownWarLane", { campId: "camp-b", lane: "mid" });
    const advanceResult = await callAgent(page, "advanceTownWar", { seconds: 28, tickSeconds: 0.25 });
    const war = advanceResult?.war ?? null;
    const soldiers = Array.isArray(war?.townWar?.soldiers) ? war.townWar.soldiers : [];
    const aiThreats = war?.aiThreats ?? war?.townWar?.aiThreats ?? null;
    const targetIntents = soldiers.map((soldier) => soldier?.targetIntent).filter(Boolean);
    const nonPlayerTargets = targetIntents.filter((intent) => intent?.targetKind && intent.targetKind !== "player" && intent.targetKind !== "none");
    const reasonedTargets = targetIntents.filter((intent) => typeof intent?.reason === "string" && intent.reason.length > 0);
    const byCamp = soldiers.reduce((summary, soldier) => {
      const faction = soldier?.faction ?? "unknown";
      summary[faction] = (summary[faction] ?? 0) + 1;
      return summary;
    }, {});
    const pressure = aiThreats?.frontlineFocus?.pressure ?? {};
    const checks = [
      {
        label: "both camps field active NPC soldiers",
        passed: (byCamp["camp-a"] ?? 0) >= 3 && (byCamp["camp-b"] ?? 0) >= 3,
        details: `camp-a=${byCamp["camp-a"] ?? 0} | camp-b=${byCamp["camp-b"] ?? 0}`
      },
      {
        label: "frontline focus is the shared attention anchor",
        passed:
          aiThreats?.frontlineFocus?.lane === "mid" &&
          typeof aiThreats?.frontlineFocus?.label === "string" &&
          aiThreats.frontlineFocus.label.includes("road crossing"),
        details: `focus=${aiThreats?.frontlineFocus?.label ?? "none"} | lane=${aiThreats?.frontlineFocus?.lane ?? "none"}`
      },
      {
        label: "idle officer does not consume hostile attention",
        passed: Number.isFinite(aiThreats?.playerThreatShare) && aiThreats.playerThreatShare <= 0.28,
        details: `playerThreatShare=${aiThreats?.playerThreatShare ?? "n/a"} | reason=${aiThreats?.playerThreatReason ?? "none"}`
      },
      {
        label: "combatants choose NPC or objective threats instead of player lock-on",
        passed: nonPlayerTargets.length >= 4 && targetIntents.every((intent) => intent?.targetKind !== "player"),
        details:
          `targets=${targetIntents.map((intent) => `${intent?.targetKind ?? "none"}:${intent?.targetId ?? "none"}`).join(",") || "none"}`
      },
      {
        label: "target choices carry readable reasons",
        passed: reasonedTargets.length >= 5,
        details: `reasons=${reasonedTargets.map((intent) => intent?.reason).slice(0, 5).join(" | ") || "none"}`
      },
      {
        label: "both sides exert frontline pressure",
        passed:
          Number.isFinite(pressure?.["camp-a"]) &&
          Number.isFinite(pressure?.["camp-b"]) &&
          pressure["camp-a"] > 0 &&
          pressure["camp-b"] > 0,
        details: `camp-a=${pressure?.["camp-a"] ?? "n/a"} | camp-b=${pressure?.["camp-b"] ?? "n/a"}`
      }
    ];
    const screenshotPath = await captureVerificationScreenshot(page, options);
    return {
      ...buildVerificationResult(
        verificationId,
        "Advance the first-town NPC war and prove frontline threat scoring de-centers the idle officer while both teams target battlefield threats.",
        checks
      ),
      screenshotPath,
      advanceResult,
      snapshot: war,
      brief: buildTownWarBrief(war)
    };
  }

  if (verificationId === "frontline-ai-cover-suppression") {
    await callAgent(page, "stageState", "town-war");
    await callAgent(page, "deployTownWarOfficer", { campId: "camp-a" });
    const trenchOrder = await callAgent(page, "orderTownWarTrench", { campId: "camp-a", x: 5910, y: 3140 });
    await callAgent(page, "focusTownWarLane", { campId: "camp-a", lane: "mid" });
    await callAgent(page, "focusTownWarLane", { campId: "camp-b", lane: "mid" });
    const advanceResult = await callAgent(page, "advanceTownWar", { seconds: 38, tickSeconds: 0.25 });
    const war = advanceResult?.war ?? trenchOrder?.war ?? null;
    const soldiers = Array.isArray(war?.townWar?.soldiers) ? war.townWar.soldiers : [];
    const aiTactics = war?.aiTactics ?? war?.townWar?.aiTactics ?? null;
    const coverSlots = Array.isArray(aiTactics?.coverSlots) ? aiTactics.coverSlots : [];
    const suppressionFields = Array.isArray(aiTactics?.suppressionFields) ? aiTactics.suppressionFields : [];
    const tacticalPairs = Array.isArray(aiTactics?.tacticalPairs) ? aiTactics.tacticalPairs : [];
    const constructionImpact = Array.isArray(aiTactics?.completedConstructionImpact) ? aiTactics.completedConstructionImpact : [];
    const tacticalIntents = soldiers.map((soldier) => soldier?.tacticalIntent).filter(Boolean);
    const coverIntents = soldiers.map((soldier) => soldier?.coverIntent).filter(Boolean);
    const pressureStates = new Set(tacticalIntents.map((intent) => intent?.state).filter(Boolean));
    const occupiedCover = coverSlots.filter((slot) => typeof slot?.occupiedBySoldierId === "string" && slot.occupiedBySoldierId.length > 0);
    const checks = [
      {
        label: "cover slots exist around the contested frontline",
        passed: coverSlots.length >= 4,
        details: `coverSlots=${coverSlots.map((slot) => `${slot?.label ?? "cover"}:${slot?.sourceKind ?? "kind"}`).join(",") || "none"}`
      },
      {
        label: "completed trench creates a new cover payoff",
        passed:
          constructionImpact.some((impact) => impact?.kind === "trench" && typeof impact?.coverSlotId === "string") &&
          coverSlots.some((slot) => slot?.sourceKind === "trench"),
        details:
          `impact=${constructionImpact.map((impact) => `${impact?.kind ?? "kind"}:${impact?.coverSlotId ?? "none"}`).join(",") || "none"}`
      },
      {
        label: "suppression fields report pressure and pinned soldiers",
        passed:
          suppressionFields.length >= 2 &&
          suppressionFields.some((field) => Number.isFinite(field?.pressure) && field.pressure > 0) &&
          suppressionFields.some((field) => Array.isArray(field?.pinnedSoldierIds) && field.pinnedSoldierIds.length > 0),
        details:
          `fields=${suppressionFields.map((field) => `${field?.faction ?? "faction"}:${field?.pressure ?? "n/a"}:${Array.isArray(field?.pinnedSoldierIds) ? field.pinnedSoldierIds.length : 0}`).join(" | ") || "none"}`
      },
      {
        label: "soldiers expose cover-aware tactical states",
        passed:
          pressureStates.has("seek-cover") ||
          pressureStates.has("hold-cover") ||
          pressureStates.has("reload-behind-cover") ||
          pressureStates.has("cover-builder") ||
          pressureStates.has("suppress-area"),
        details:
          `states=${[...pressureStates].join(",") || "none"} | reasons=${tacticalIntents.map((intent) => intent?.reason).slice(0, 6).join(" | ") || "none"}`
      },
      {
        label: "cover intent is attached to combatants",
        passed: coverIntents.filter((intent) => typeof intent?.coverSlotId === "string").length >= 4,
        details:
          `coverIntents=${coverIntents.map((intent) => `${intent?.state ?? "none"}:${intent?.coverSlotId ?? "none"}`).join(",") || "none"}`
      },
      {
        label: "small-unit pair behavior is inspectable",
        passed: tacticalPairs.length > 0,
        details: `pairs=${tacticalPairs.map((pair) => `${pair?.state ?? "state"}:${pair?.suppressorId ?? "none"}->${pair?.moverId ?? "none"}`).join(",") || "none"}`
      },
      {
        label: "cover slots can be occupied after pressure",
        passed: occupiedCover.length > 0,
        details: `occupied=${occupiedCover.map((slot) => `${slot?.label ?? "cover"}:${slot?.occupiedBySoldierId ?? "none"}`).join(",") || "none"}`
      }
    ];
    const screenshotPath = await captureVerificationScreenshot(page, options);
    return {
      ...buildVerificationResult(
        verificationId,
        "Advance a town-war trench fight and prove cover slots, suppression fields, tactical intents, and small-unit cover pairs are inspectable.",
        checks
      ),
      screenshotPath,
      trenchOrder,
      advanceResult,
      snapshot: war,
      brief: buildTownWarBrief(war)
    };
  }

  if (verificationId === "emergent-war-drama") {
    await callAgent(page, "stageState", "town-war");
    const firstOrder = await callAgent(page, "orderTownWarTrench", { campId: "camp-a", x: 1250, y: 720 });
    const secondOrder = await callAgent(page, "orderTownWarTrench", { campId: "camp-a", x: 1250, y: 720 });
    await callAgent(page, "orderTownWarTrench", { campId: "camp-a", x: 1230, y: 740 });
    await callAgent(page, "orderTownWarTrench", { campId: "camp-a", x: 1210, y: 760 });
    const payoffOrder = await callAgent(page, "orderTownWarTrench", { campId: "camp-a", x: 7590, y: 3159 });
    const advanceResult = await callAgent(page, "advanceTownWar", { seconds: 12, tickSeconds: 0.25 });
    const war = advanceResult?.war ?? payoffOrder?.war ?? secondOrder?.war ?? firstOrder?.war ?? null;
    const memories = Array.isArray(war?.dramaMemories) ? war.dramaMemories : [];
    const scars = Array.isArray(war?.locationScars) ? war.locationScars : [];
    const soldiers = Array.isArray(war?.townWar?.soldiers) ? war.townWar.soldiers : [];
    const beatChain = Array.isArray(war?.dramaBeat?.chain) ? war.dramaBeat.chain : [];
    const beatKinds = beatChain.map((entry) => entry?.beat).filter(Boolean);
    const debriefEchoes = Array.isArray(war?.debriefEchoes) ? war.debriefEchoes : [];
    const storyPackAudit = war?.storyPackAudit ?? null;
    const secondLine = secondOrder?.war?.dialogue?.lastDramaEvent ?? null;
    const arcedSoldier = soldiers.find(
      (soldier) =>
        Number.isFinite(soldier?.dramaArc?.resentment) &&
        soldier.dramaArc.resentment > 0 &&
        Number.isFinite(soldier?.dramaArc?.trustInOfficer) &&
        soldier.dramaArc.trustInOfficer < 0.55
    );
    const checks = [
      {
        label: "officer-war event packets appear",
        passed: Array.isArray(war?.dialogue?.recentDramaEvents) && war.dialogue.recentDramaEvents.length > 0,
        details: `events=${war?.dialogue?.recentDramaEvents?.map((event) => event?.kind).join(",") || "none"}`
      },
      {
        label: "cause/witness memory is created",
        passed: memories.some((memory) => Array.isArray(memory?.witnessIds) && memory.witnessIds.length > 0),
        details: `memories=${memories.map((memory) => `${memory?.tag}:${memory?.witnessIds?.length ?? 0}`).join(",") || "none"}`
      },
      {
        label: "location scar state persists",
        passed: scars.some((scar) => Array.isArray(scar?.tags) && scar.tags.includes("builder-hit-here")),
        details: `scars=${scars.map((scar) => `${scar?.label}:${Array.isArray(scar?.tags) ? scar.tags.join("/") : "none"}`).join(" || ") || "none"}`
      },
      {
        label: "character arc pressure changes",
        passed: Boolean(arcedSoldier),
        details:
          `trust=${arcedSoldier?.dramaArc?.trustInOfficer ?? "none"} | ` +
          `resentment=${arcedSoldier?.dramaArc?.resentment ?? "none"} | ` +
          `relationship=${arcedSoldier?.dramaArc?.relationshipPressure?.summary ?? "none"}`
      },
      {
        label: "later dialogue references tracked truth",
        passed: secondLine?.referencedMemoryTag === "builder-hit-here" || secondLine?.referencedMemoryTag === "order-exposed-builder",
        details: `channel=${secondLine?.channel ?? "none"} | referenced=${secondLine?.referencedMemoryTag ?? "none"} | text=${secondLine?.text ?? "none"}`
      },
      {
        label: "beat chain appears",
        passed: beatKinds.includes("setup") && (beatKinds.includes("complication") || beatKinds.includes("rising-pressure")) && (beatKinds.includes("payoff") || beatKinds.includes("cost")),
        details: `beats=${beatKinds.join(",") || "none"}`
      },
      {
        label: "debrief echo references tracked state",
        passed:
          debriefEchoes.length > 0 &&
          debriefEchoes.some((echo) => typeof echo?.sourceSummary === "string" && typeof echo?.text === "string" && echo.text.includes(echo.sourceSummary)),
        details: `latest=${debriefEchoes[0]?.text ?? "none"}`
      },
      {
        label: "story packs validate cleanly",
        passed: storyPackAudit?.ok === true && Array.isArray(storyPackAudit?.errors) && storyPackAudit.errors.length === 0,
        details:
          `errors=${Array.isArray(storyPackAudit?.errors) ? storyPackAudit.errors.length : "n/a"} | ` +
          `warnings=${Array.isArray(storyPackAudit?.warnings) ? storyPackAudit.warnings.length : "n/a"} | ` +
          `packs=${storyPackAudit?.totals?.packs ?? "n/a"} | squad=${storyPackAudit?.totals?.squadTemplates ?? "n/a"} | hostile=${storyPackAudit?.totals?.hostileTemplates ?? "n/a"}`
      }
    ];
    const screenshotPath = await captureVerificationScreenshot(page, options);
    return {
      ...buildVerificationResult(
        verificationId,
        "Stage the first-town officer drama loop and prove events, memory, scars, arcs, beats, debriefs, and story-pack validation in one gate.",
        checks
      ),
      screenshotPath,
      firstOrder,
      secondOrder,
      payoffOrder,
      advanceResult,
      snapshot: war,
      brief: buildTownWarBrief(war)
    };
  }

  const macroResult = await runMacro(page, verificationId, options);
  return {
    ...evaluateMacroVerification(verificationId, macroResult.snapshot),
    screenshotPath: macroResult.screenshotPath,
    snapshot: macroResult.snapshot
  };
}

async function runRegressionGate(page, options) {
  const verifyResults = [];

  for (const verificationId of REGRESSION_GATE_VERIFY_IDS) {
    const verificationResult = await runAnyVerification(page, verificationId, {});

    verifyResults.push({
      id: verificationId,
      passed: verificationResult.passed,
      checkCount: verificationResult.checks.length,
      failedChecks: verificationResult.checks.filter((check) => !check.passed)
    });
  }

  await resetVerificationRuntime(page);
  const frontDoorSnapshot = await stageStateSnapshot(page, "front-door", 180);
  const stashSnapshot = await stageStateSnapshot(page, "stash", 180);
  const intelSnapshot = await stageStateSnapshot(page, "intel-crash-pending", 180);
  const raidSnapshot = await stageStateSnapshot(page, "raid", 180);
  const extractSnapshot = await stageStateSnapshot(page, "extract-hold-active", 180);

  const snapshotChecks = [
    {
      label: "front door exposes overlay truth",
      passed:
        frontDoorSnapshot?.ui?.overlays?.frontDoorOpen === true &&
        typeof frontDoorSnapshot?.ui?.frontDoorPanel === "string",
      details:
        `frontDoorOpen=${frontDoorSnapshot?.ui?.overlays?.frontDoorOpen ?? "n/a"} | ` +
        `frontDoorPanel=${frontDoorSnapshot?.ui?.frontDoorPanel ?? "n/a"}`
    },
    {
      label: "stash exposes stash overlay truth",
      passed:
        stashSnapshot?.ui?.overlays?.stashOpen === true &&
        stashSnapshot?.ui?.overlays?.frontDoorOpen === false,
      details:
        `stashOpen=${stashSnapshot?.ui?.overlays?.stashOpen ?? "n/a"} | ` +
        `frontDoorOpen=${stashSnapshot?.ui?.overlays?.frontDoorOpen ?? "n/a"}`
    },
    {
      label: "intel snapshot exposes pending reinforcement summary",
      passed:
        intelSnapshot?.phase === "raid" &&
        typeof intelSnapshot?.raid?.pendingReinforcementSummary === "object" &&
        intelSnapshot?.raid?.pendingReinforcementSummary !== null &&
        intelSnapshot?.raid?.pendingReinforcementSummary?.nextSource === "intel-wave",
      details:
        `phase=${intelSnapshot?.phase ?? "n/a"} | ` +
        `pendingSummary=${intelSnapshot?.raid?.pendingReinforcementSummary ? "present" : "missing"} | ` +
        `source=${intelSnapshot?.raid?.pendingReinforcementSummary?.nextSource ?? "n/a"}`
    },
    {
      label: "extract snapshot exposes compact extraction truth",
      passed:
        extractSnapshot?.raid?.extraction?.active === true &&
        typeof extractSnapshot?.raid?.extraction?.holdTimer === "number" &&
        typeof extractSnapshot?.raid?.extraction?.holdDuration === "number",
      details:
        `active=${extractSnapshot?.raid?.extraction?.active ?? "n/a"} | ` +
        `holdTimer=${extractSnapshot?.raid?.extraction?.holdTimer ?? "n/a"} | ` +
        `holdDuration=${extractSnapshot?.raid?.extraction?.holdDuration ?? "n/a"}`
    },
    {
      label: "legacy runtime stays surfaced as disabled and cleared",
      passed:
        raidSnapshot?.regression?.legacyToggles?.frontlineIncidentsEnabled === false &&
        raidSnapshot?.regression?.legacyToggles?.playerSideSupportsEnabled === false &&
        raidSnapshot?.regression?.legacyRuntime?.active === false,
      details:
        `frontlineIncidentsEnabled=${raidSnapshot?.regression?.legacyToggles?.frontlineIncidentsEnabled ?? "n/a"} | ` +
        `playerSideSupportsEnabled=${raidSnapshot?.regression?.legacyToggles?.playerSideSupportsEnabled ?? "n/a"} | ` +
        `legacyActive=${raidSnapshot?.regression?.legacyRuntime?.active ?? "n/a"}`
    }
  ];

  const screenshotPath = await captureVerificationScreenshot(page, options);
  const allVerifyPassed = verifyResults.every((result) => result.passed);
  const allSnapshotPassed = snapshotChecks.every((check) => check.passed);

  return {
    macro: "regression-gate",
    description:
      "Run the core regression gate for menu/stash/raid continuity, equip flow, intel and extract pressure, wave discipline, doorway chase, and legacy-path suppression.",
    passed: allVerifyPassed && allSnapshotPassed,
    verifyIds: REGRESSION_GATE_VERIFY_IDS,
    verifyResults,
    snapshotChecks,
    screenshotPath,
    snapshots: {
      frontDoor: frontDoorSnapshot,
      stash: stashSnapshot,
      intel: intelSnapshot,
      raid: raidSnapshot,
      extract: extractSnapshot
    }
  };
}

function getMacroVerificationConfig(macroId) {
  if (macroId === "doorway-regression") {
    return {
      description: "Validate that the staged breach push finishes close to a live doorway without dropping out of raid.",
      checks: [
        {
          label: "raid phase remains live",
          test: (snapshot) => snapshot.phase === "raid",
          details: (snapshot) => `phase=${snapshot.phase}`
        },
        {
          label: "player finishes near a doorway",
          test: (snapshot) =>
            typeof snapshot.raid?.doorway?.nearestDoorwayDistance === "number" &&
            snapshot.raid.doorway.nearestDoorwayDistance <= 120,
          details: (snapshot) => `nearestDoorwayDistance=${snapshot.raid?.doorway?.nearestDoorwayDistance ?? "n/a"}`
        },
        {
          label: "breach lane is still represented",
          test: (snapshot) =>
            typeof snapshot.raid?.doorway?.liveBreachCount === "number" && snapshot.raid.doorway.liveBreachCount >= 1,
          details: (snapshot) => `liveBreachCount=${snapshot.raid?.doorway?.liveBreachCount ?? "n/a"}`
        },
        {
          label: "fireteams do not stall at the doorway mouth",
          test: (snapshot) =>
            typeof snapshot.raid?.doorway?.stalledFireteams === "number" && snapshot.raid.doorway.stalledFireteams <= 1,
          details: (snapshot) =>
            `stalledFireteams=${snapshot.raid?.doorway?.stalledFireteams ?? "n/a"}, maxFireteamStallSeconds=${snapshot.raid?.doorway?.maxFireteamStallSeconds ?? "n/a"}`
        },
        {
          label: "breach push pathing stays valid even without a support-order tag",
          test: (snapshot) =>
            typeof snapshot.raid?.doorway?.nearestDoorwayDistance === "number" &&
            snapshot.raid.doorway.nearestDoorwayDistance <= 120 &&
            typeof snapshot.raid?.doorway?.stalledFireteams === "number" &&
            snapshot.raid.doorway.stalledFireteams <= 1,
          details: (snapshot) =>
            `activeSupportOrderId=${snapshot.frontline?.activeSupportOrderId ?? "n/a"}, nearestDoorwayDistance=${snapshot.raid?.doorway?.nearestDoorwayDistance ?? "n/a"}, stalledFireteams=${snapshot.raid?.doorway?.stalledFireteams ?? "n/a"}`
        }
      ]
    };
  }

  if (macroId === "room-clear-drill") {
    return {
      description: "Validate that the staged room-clear slice reaches a three-room foothold with layered interior resistance.",
      checks: [
        {
          label: "raid phase remains live",
          test: (snapshot) => snapshot.phase === "raid",
          details: (snapshot) => `phase=${snapshot.phase}`
        },
        {
          label: "full three-room stack is represented",
          test: (snapshot) =>
            typeof snapshot.raid?.doorway?.roomStackDepth === "number" && snapshot.raid.doorway.roomStackDepth >= 3,
          details: (snapshot) => `roomStackDepth=${snapshot.raid?.doorway?.roomStackDepth ?? "n/a"}`
        },
        {
          label: "captured room payoff is visible",
          test: (snapshot) =>
            typeof snapshot.raid?.doorway?.capturedRoomCount === "number" && snapshot.raid.doorway.capturedRoomCount >= 1,
          details: (snapshot) => `capturedRoomCount=${snapshot.raid?.doorway?.capturedRoomCount ?? "n/a"}`
        },
        {
          label: "follow-through room remains live",
          test: (snapshot) =>
            typeof snapshot.raid?.doorway?.followThroughRoomCount === "number" &&
            snapshot.raid.doorway.followThroughRoomCount >= 1,
          details: (snapshot) => `followThroughRoomCount=${snapshot.raid?.doorway?.followThroughRoomCount ?? "n/a"}`
        },
        {
          label: "deep stash room remains live",
          test: (snapshot) =>
            typeof snapshot.raid?.doorway?.deepRoomCount === "number" && snapshot.raid.doorway.deepRoomCount >= 1,
          details: (snapshot) => `deepRoomCount=${snapshot.raid?.doorway?.deepRoomCount ?? "n/a"}`
        },
        {
          label: "interior resistance remains present",
          test: (snapshot) =>
            typeof snapshot.raid?.doorway?.contestedRoomCount === "number" &&
            snapshot.raid.doorway.contestedRoomCount >= 1,
          details: (snapshot) => `contestedRoomCount=${snapshot.raid?.doorway?.contestedRoomCount ?? "n/a"}`
        },
        {
          label: "room-clear stack still fields layered defenders",
          test: (snapshot) =>
            typeof snapshot.raid?.doorway?.roomDefenderCount === "number" && snapshot.raid.doorway.roomDefenderCount >= 4,
          details: (snapshot) =>
            `roomDefenderCount=${snapshot.raid?.doorway?.roomDefenderCount ?? "n/a"}, deepRoomDefenderCount=${snapshot.raid?.doorway?.deepRoomDefenderCount ?? "n/a"}, reserveRoomDefenderCount=${snapshot.raid?.doorway?.reserveRoomDefenderCount ?? "n/a"}`
        },
        {
          label: "reserve defenders layer the stack",
          test: (snapshot) =>
            typeof snapshot.raid?.doorway?.reserveRoomDefenderCount === "number" &&
            snapshot.raid.doorway.reserveRoomDefenderCount >= 1,
          details: (snapshot) =>
            `reserveRoomDefenderCount=${snapshot.raid?.doorway?.reserveRoomDefenderCount ?? "n/a"}, capturedRoomLabels=${Array.isArray(snapshot.raid?.doorway?.capturedRoomLabels) ? snapshot.raid.doorway.capturedRoomLabels.join(" | ") : "n/a"}`
        },
        {
          label: "deep-rifle loss now softens the second room instead of solving the chain outright",
          test: (snapshot) =>
            typeof snapshot.raid?.doorway?.deepRifleAliveCount === "number" &&
            snapshot.raid.doorway.deepRifleAliveCount === 0 &&
            typeof snapshot.raid?.doorway?.secondRoomThreatLabel === "string" &&
            snapshot.raid.doorway.secondRoomThreatLabel.toLowerCase().includes("softened") &&
            typeof snapshot.raid?.doorway?.roleKillPayoffLabel === "string" &&
            snapshot.raid.doorway.roleKillPayoffLabel.toLowerCase().includes("deep rifle down"),
          details: (snapshot) =>
            `deepRifleAliveCount=${snapshot.raid?.doorway?.deepRifleAliveCount ?? "n/a"}, secondRoomThreatLabel=${snapshot.raid?.doorway?.secondRoomThreatLabel ?? "n/a"}, roleKillPayoffLabel=${snapshot.raid?.doorway?.roleKillPayoffLabel ?? "n/a"}`
        },
        {
          label: "woken defenders compress deeper instead of spilling the whole structure outward",
          test: (snapshot) =>
            typeof snapshot.raid?.doorway?.compressedRoomDefenderCount === "number" &&
            snapshot.raid.doorway.compressedRoomDefenderCount >= 2 &&
            typeof snapshot.raid?.doorway?.compressionStateLabel === "string" &&
            snapshot.raid.doorway.compressionStateLabel.toLowerCase().includes("compress"),
          details: (snapshot) =>
            `compressedRoomDefenderCount=${snapshot.raid?.doorway?.compressedRoomDefenderCount ?? "n/a"}, compressionStateLabel=${snapshot.raid?.doorway?.compressionStateLabel ?? "n/a"}`
        },
        {
          label: "pressure posture explains the compressed room-clear problem in player-facing language",
          test: (snapshot) =>
            snapshot.map?.pressurePosture?.actionLabel === "Cross, own room one, turn room two" &&
            snapshot.map?.pressurePosture?.windowLabel === "Building compressed | room two live" &&
            snapshot.map?.pressurePosture?.threatLabel === "First room won | room two still live",
          details: (snapshot) =>
            `action=${snapshot.map?.pressurePosture?.actionLabel ?? "n/a"}, window=${snapshot.map?.pressurePosture?.windowLabel ?? "n/a"}, threat=${snapshot.map?.pressurePosture?.threatLabel ?? "n/a"}`
        },
        {
          label: "operation flow treats the room clear as a compressed two-room problem",
          test: (snapshot) =>
            ["commitment", "gain"].includes(snapshot.raid?.operationPhase) &&
            typeof snapshot.raid?.operationRead?.detail === "string" &&
            snapshot.raid.operationRead.detail.toLowerCase().includes("compress") &&
            snapshot.raid.operationRead.detail.toLowerCase().includes("room two"),
          details: (snapshot) =>
            `phase=${snapshot.raid?.operationPhase ?? "n/a"}, detail=${snapshot.raid?.operationRead?.detail ?? "n/a"}`
        },
        {
          label: "live comms speak in room-clear language instead of generic contact chatter",
          test: (snapshot) =>
            Array.isArray(snapshot.dialogue?.recentSquadEvents) &&
            snapshot.dialogue.recentSquadEvents.some(
              (event) => event?.id === "debug-room-clear-contact" && Array.isArray(event.memoryTags) && event.memoryTags.includes("sector-held")
            ) &&
            Array.isArray(snapshot.dialogue?.recentHostileEvents) &&
            snapshot.dialogue.recentHostileEvents.some(
              (event) =>
                event?.id === "debug-room-clear-hostile-compress" &&
                Array.isArray(event.memoryTags) &&
                event.memoryTags.includes("sector-held")
            ),
          details: (snapshot) =>
            `recentSquad=${Array.isArray(snapshot.dialogue?.recentSquadEvents) ? snapshot.dialogue.recentSquadEvents.map((event) => `${event.id}:${Array.isArray(event.memoryTags) ? event.memoryTags.join("+") : "no-tags"}`).join(" || ") : "n/a"} || recentHostile=${Array.isArray(snapshot.dialogue?.recentHostileEvents) ? snapshot.dialogue.recentHostileEvents.map((event) => `${event.id}:${Array.isArray(event.memoryTags) ? event.memoryTags.join("+") : "no-tags"}`).join(" || ") : "n/a"}`
        },
        {
          label: "foothold fireteams are established inside",
          test: (snapshot) =>
            typeof snapshot.raid?.doorway?.activeRoomHoldFireteams === "number" &&
            snapshot.raid.doorway.activeRoomHoldFireteams >= 2,
          details: (snapshot) =>
            `activeRoomHoldFireteams=${snapshot.raid?.doorway?.activeRoomHoldFireteams ?? "n/a"}, activeFootholdLabels=${Array.isArray(snapshot.raid?.doorway?.activeFootholdLabels) ? snapshot.raid.doorway.activeFootholdLabels.join(" | ") : "n/a"}`
        },
        {
          label: "player remains inside the chained rooms",
          test: (snapshot) =>
            snapshot.raid?.doorway?.playerInsideRoomStack === true &&
            typeof snapshot.raid?.doorway?.playerRoomDepth === "number" &&
            snapshot.raid.doorway.playerRoomDepth >= 1,
          details: (snapshot) =>
            `playerInsideRoomStack=${snapshot.raid?.doorway?.playerInsideRoomStack ?? "n/a"}, playerRoomDepth=${snapshot.raid?.doorway?.playerRoomDepth ?? "n/a"}`
        },
        {
          label: "room walk commits through the deeper transition",
          test: (snapshot) =>
            typeof snapshot.raid?.doorway?.playerRoomDepth === "number" &&
            snapshot.raid.doorway.playerRoomDepth >= 2 &&
            snapshot.raid?.doorway?.followThroughRoomCount >= 1,
          details: (snapshot) =>
            `playerRoomDepth=${snapshot.raid?.doorway?.playerRoomDepth ?? "n/a"}, followThroughRoomCount=${snapshot.raid?.doorway?.followThroughRoomCount ?? "n/a"}`
        },
        {
          label: "interior caches are exposed across the chain",
          test: (snapshot) =>
            typeof snapshot.raid?.doorway?.frontlineDropCount === "number" &&
            snapshot.raid.doorway.frontlineDropCount >= 3,
          details: (snapshot) =>
            `frontlineDropCount=${snapshot.raid?.doorway?.frontlineDropCount ?? "n/a"}, followThroughCacheCount=${snapshot.raid?.doorway?.followThroughCacheCount ?? "n/a"}, deepStashCacheCount=${snapshot.raid?.doorway?.deepStashCacheCount ?? "n/a"}`
        },
        {
          label: "back room is still contested",
          test: (snapshot) =>
            typeof snapshot.raid?.doorway?.contestedRoomCount === "number" && snapshot.raid.doorway.contestedRoomCount >= 1,
          details: (snapshot) => `contestedRoomCount=${snapshot.raid?.doorway?.contestedRoomCount ?? "n/a"}`
        },
        {
          label: "player keeps chained room momentum",
          test: (snapshot) =>
            typeof snapshot.raid?.frontlineMomentum?.label === "string" &&
            snapshot.raid.frontlineMomentum.label.trim().length > 0,
          details: (snapshot) => `frontlineMomentum=${snapshot.raid?.frontlineMomentum?.label ?? "n/a"}`
        },
        {
          label: "player finishes near the interior doorway lane",
          test: (snapshot) =>
            typeof snapshot.raid?.doorway?.nearestDoorwayDistance === "number" &&
            snapshot.raid.doorway.nearestDoorwayDistance <= 140,
          details: (snapshot) => `nearestDoorwayDistance=${snapshot.raid?.doorway?.nearestDoorwayDistance ?? "n/a"}`
        },
        {
          label: "interior push stays smooth",
          test: (snapshot) =>
            typeof snapshot.raid?.doorway?.stalledFireteams === "number" && snapshot.raid.doorway.stalledFireteams <= 1,
          details: (snapshot) =>
            `stalledFireteams=${snapshot.raid?.doorway?.stalledFireteams ?? "n/a"}, maxFireteamStallSeconds=${snapshot.raid?.doorway?.maxFireteamStallSeconds ?? "n/a"}`
        }
      ]
    };
  }

  if (macroId === "room-clear-chain") {
    return {
      description: "Validate that the player can walk the authored room-clear chain into the deeper interior without dropping out of the stack.",
      checks: [
        {
          label: "raid phase remains live",
          test: (snapshot) => snapshot.phase === "raid",
          details: (snapshot) => `phase=${snapshot.phase}`
        },
        {
          label: "player finishes inside the room chain",
          test: (snapshot) => snapshot.raid?.doorway?.playerInsideRoomStack === true,
          details: (snapshot) => `playerInsideRoomStack=${snapshot.raid?.doorway?.playerInsideRoomStack ?? "n/a"}`
        },
        {
          label: "player reaches at least the second room",
          test: (snapshot) =>
            typeof snapshot.raid?.doorway?.playerRoomDepth === "number" && snapshot.raid.doorway.playerRoomDepth >= 2,
          details: (snapshot) => `playerRoomDepth=${snapshot.raid?.doorway?.playerRoomDepth ?? "n/a"}`
        },
        {
          label: "the full room stack stays active during the walk",
          test: (snapshot) =>
            typeof snapshot.raid?.doorway?.roomStackDepth === "number" && snapshot.raid.doorway.roomStackDepth >= 3,
          details: (snapshot) => `roomStackDepth=${snapshot.raid?.doorway?.roomStackDepth ?? "n/a"}`
        },
        {
          label: "chained interior defenders stay layered",
          test: (snapshot) =>
            typeof snapshot.raid?.doorway?.roomDefenderCount === "number" &&
            snapshot.raid.doorway.roomDefenderCount >= 4 &&
            typeof snapshot.raid?.doorway?.deepRoomDefenderCount === "number" &&
            snapshot.raid.doorway.deepRoomDefenderCount >= 2,
          details: (snapshot) =>
            `roomDefenderCount=${snapshot.raid?.doorway?.roomDefenderCount ?? "n/a"}, deepRoomDefenderCount=${snapshot.raid?.doorway?.deepRoomDefenderCount ?? "n/a"}`
        },
        {
          label: "back rooms remain contested during the walk",
          test: (snapshot) =>
            typeof snapshot.raid?.doorway?.contestedRoomCount === "number" &&
            snapshot.raid.doorway.contestedRoomCount >= 2,
          details: (snapshot) => `contestedRoomCount=${snapshot.raid?.doorway?.contestedRoomCount ?? "n/a"}`
        },
        {
          label: "fireteams do not stall during the push",
          test: (snapshot) =>
            typeof snapshot.raid?.doorway?.stalledFireteams === "number" && snapshot.raid.doorway.stalledFireteams <= 1,
          details: (snapshot) =>
            `stalledFireteams=${snapshot.raid?.doorway?.stalledFireteams ?? "n/a"}, maxFireteamStallSeconds=${snapshot.raid?.doorway?.maxFireteamStallSeconds ?? "n/a"}`
        }
      ]
    };
  }

  if (macroId === "expanded-frontline") {
    return {
      description: "Validate that the expanded-frontline showcase stages a wider living battle with materially larger visible formations.",
      checks: [
        {
          label: "raid phase remains live",
          test: (snapshot) => snapshot.phase === "raid",
          details: (snapshot) => `phase=${snapshot.phase}`
        },
        {
          label: "friendly frontline strength is materially larger",
          test: (snapshot) =>
            typeof snapshot.frontline?.russianCombatants?.combatStrength === "number" &&
            snapshot.frontline.russianCombatants.combatStrength >= 34,
          details: (snapshot) => `russianCombatStrength=${snapshot.frontline?.russianCombatants?.combatStrength ?? "n/a"}`
        },
        {
          label: "hostile frontline strength is materially larger",
          test: (snapshot) =>
            typeof snapshot.frontline?.ukrainianCombatants?.combatStrength === "number" &&
            snapshot.frontline.ukrainianCombatants.combatStrength >= 44,
          details: (snapshot) => `ukrainianCombatStrength=${snapshot.frontline?.ukrainianCombatants?.combatStrength ?? "n/a"}`
        },
        {
          label: "multiple firefight pockets stay active",
          test: (snapshot) =>
            Array.isArray(snapshot.frontline?.incidents) &&
            snapshot.frontline.incidents.filter((incident) => incident.kind === "firefight" && !incident.resolved).length >= 4,
          details: (snapshot) =>
            `activeFirefights=${Array.isArray(snapshot.frontline?.incidents) ? snapshot.frontline.incidents.filter((incident) => incident.kind === "firefight" && !incident.resolved).length : "n/a"}`
        },
        {
          label: "support teams remain layered across the route",
          test: (snapshot) =>
            typeof snapshot.frontline?.metrics?.actorTotals?.supports === "number" &&
            snapshot.frontline.metrics.actorTotals.supports >= 12,
          details: (snapshot) =>
            `supportActors=${snapshot.frontline?.metrics?.actorTotals?.supports ?? "n/a"}`
        }
      ]
    };
  }

  if (macroId === "blue-carried-fire") {
    return {
      description: "Validate that Blue can still fire while downed and being carried into a live extraction hold.",
      checks: [
        {
          label: "raid phase remains live",
          test: (snapshot) => snapshot.phase === "raid",
          details: (snapshot) => `phase=${snapshot.phase}`
        },
        {
          label: "Blue stays in a carried-fire action mode",
          test: (snapshot) =>
            snapshot.raid?.playerActionMode === "carried-fire" &&
            snapshot.raid?.rescueFireMode === "carried" &&
            snapshot.raid?.rescueFireEnabled === true,
          details: (snapshot) =>
            `playerActionMode=${snapshot.raid?.playerActionMode ?? "n/a"}, rescueFireMode=${snapshot.raid?.rescueFireMode ?? "n/a"}, rescueFireEnabled=${snapshot.raid?.rescueFireEnabled ?? "n/a"}`
        },
        {
          label: "carried casualty exfil stays active",
          test: (snapshot) =>
            snapshot.raid?.casualtyExtractActive === true &&
            typeof snapshot.raid?.extractionHoldTimer === "number" &&
            snapshot.raid.extractionHoldTimer > 0,
          details: (snapshot) =>
            `casualtyExtractActive=${snapshot.raid?.casualtyExtractActive ?? "n/a"}, extractionHoldTimer=${snapshot.raid?.extractionHoldTimer ?? "n/a"}`
        },
        {
          label: "firing while carried spends ammo",
          test: (snapshot) =>
            typeof snapshot.raid?.ammoInMag === "number" && snapshot.raid.ammoInMag < 18,
          details: (snapshot) =>
            `ammoInMag=${snapshot.raid?.ammoInMag ?? "n/a"}`
        },
        {
          label: "Blue is still downed during the fire window",
          test: (snapshot) =>
            snapshot.raid?.casualtyState === "downed" &&
            snapshot.raid?.commandRestrictionMode === "downed" &&
            typeof snapshot.raid?.bleedoutTimer === "number" &&
            snapshot.raid.bleedoutTimer > 0,
          details: (snapshot) =>
            `casualtyState=${snapshot.raid?.casualtyState ?? "n/a"}, commandRestrictionMode=${snapshot.raid?.commandRestrictionMode ?? "n/a"}, bleedoutTimer=${snapshot.raid?.bleedoutTimer ?? "n/a"}`
        }
      ]
    };
  }

  if (macroId === "blue-carried-extract-success") {
    return {
      description: "Validate that the boys can finish Blue's casualty exfil and push the run back to stash.",
      checks: [
        {
          label: "raid resolves back to stash",
          test: (snapshot) => snapshot.phase === "stash",
          details: (snapshot) => `phase=${snapshot.phase}`
        },
        {
          label: "the raid ends as a success",
          test: (snapshot) => snapshot.lastRaidSummary?.result === "success",
          details: (snapshot) => `lastRaidResult=${snapshot.lastRaidSummary?.result ?? "n/a"}`
        },
        {
          label: "the result explicitly records a downed extract",
          test: (snapshot) =>
            typeof snapshot.lastRaidSummary?.reason === "string" &&
            snapshot.lastRaidSummary.reason.toLowerCase().includes("downed"),
          details: (snapshot) => `lastRaidReason=${snapshot.lastRaidSummary?.reason ?? "n/a"}`
        },
        {
          label: "Blue was pulled out through a real extract",
          test: (snapshot) =>
            typeof snapshot.lastRaidSummary?.extractedAtLabel === "string" &&
            snapshot.lastRaidSummary.extractedAtLabel.length > 0,
          details: (snapshot) => `extractedAtLabel=${snapshot.lastRaidSummary?.extractedAtLabel ?? "n/a"}`
        }
      ]
    };
  }

  if (macroId === "blue-body-extract") {
    return {
      description: "Validate that the boys can keep a dead-body extraction attempt alive after Blue is gone.",
      checks: [
        {
          label: "raid phase remains live",
          test: (snapshot) => snapshot.phase === "raid",
          details: (snapshot) => `phase=${snapshot.phase}`
        },
        {
          label: "Blue is dead and the boys still own casualty exfil",
          test: (snapshot) =>
            snapshot.raid?.casualtyState === "dead" &&
            snapshot.raid?.casualtyExtractActive === true &&
            snapshot.raid?.casualtyExtractMode === "body-carry",
          details: (snapshot) =>
            `casualtyState=${snapshot.raid?.casualtyState ?? "n/a"}, casualtyExtractActive=${snapshot.raid?.casualtyExtractActive ?? "n/a"}, casualtyExtractMode=${snapshot.raid?.casualtyExtractMode ?? "n/a"}`
        },
        {
          label: "dead Blue cannot still fire",
          test: (snapshot) =>
            snapshot.raid?.rescueFireEnabled === false &&
            snapshot.raid?.rescueFireMode === "none",
          details: (snapshot) =>
            `rescueFireEnabled=${snapshot.raid?.rescueFireEnabled ?? "n/a"}, rescueFireMode=${snapshot.raid?.rescueFireMode ?? "n/a"}`
        },
        {
          label: "the extraction hold remains live under squad ownership",
          test: (snapshot) =>
            typeof snapshot.raid?.extractionHoldTimer === "number" &&
            snapshot.raid.extractionHoldTimer > 0 &&
            typeof snapshot.raid?.casualtyExtractOwner === "string" &&
            snapshot.raid.casualtyExtractOwner.length > 0,
          details: (snapshot) =>
            `extractionHoldTimer=${snapshot.raid?.extractionHoldTimer ?? "n/a"}, casualtyExtractOwner=${snapshot.raid?.casualtyExtractOwner ?? "n/a"}`
        }
      ]
    };
  }

  if (macroId === "combat-presentation") {
    return {
      description: "Validate that the combat-presentation slice stages a readable mixed-material effects stack with suppression, blast shock, and hostile grenade danger.",
      checks: [
        {
          label: "raid phase remains live",
          test: (snapshot) => snapshot.phase === "raid",
          details: (snapshot) => `phase=${snapshot.phase}`
        },
        {
          label: "presentation read resolves to an active combat picture",
          test: (snapshot) =>
            typeof snapshot.combat?.presentationRead?.title === "string" &&
            snapshot.combat.presentationRead.title.length > 0 &&
            snapshot.combat.presentationRead.title !== "Stand by",
          details: (snapshot) => `presentationTitle=${snapshot.combat?.presentationRead?.title ?? "n/a"}`
        },
        {
          label: "friendly lane pressure dominates the stack",
          test: (snapshot) =>
            typeof snapshot.combat?.presentationRead?.dominantFriendlyWeaponId === "string" &&
            snapshot.combat.presentationRead.dominantFriendlyWeaponId.length > 0 &&
            typeof snapshot.combat?.presentationRead?.friendlyTracerCount === "number" &&
            snapshot.combat.presentationRead.friendlyTracerCount >= 3 &&
            typeof snapshot.combat?.presentationRead?.hostileTracerCount === "number" &&
            snapshot.combat.presentationRead.hostileTracerCount >= 1,
          details: (snapshot) =>
            `dominantFriendlyWeaponId=${snapshot.combat?.presentationRead?.dominantFriendlyWeaponId ?? "n/a"}, friendlyTracerCount=${snapshot.combat?.presentationRead?.friendlyTracerCount ?? "n/a"}, hostileTracerCount=${snapshot.combat?.presentationRead?.hostileTracerCount ?? "n/a"}`
        },
        {
          label: "blast and suppression are both represented",
          test: (snapshot) =>
            typeof snapshot.combat?.presentationRead?.suppressionCount === "number" &&
            snapshot.combat.presentationRead.suppressionCount >= 1 &&
            typeof snapshot.combat?.presentationRead?.blastCount === "number" &&
            snapshot.combat.presentationRead.blastCount >= 1,
          details: (snapshot) =>
            `suppressionCount=${snapshot.combat?.presentationRead?.suppressionCount ?? "n/a"}, blastCount=${snapshot.combat?.presentationRead?.blastCount ?? "n/a"}`
        },
        {
          label: "material reads split concrete from dust",
          test: (snapshot) =>
            typeof snapshot.combat?.presentationRead?.concreteImpactCount === "number" &&
            snapshot.combat.presentationRead.concreteImpactCount >= 1 &&
            typeof snapshot.combat?.presentationRead?.dustImpactCount === "number" &&
            snapshot.combat.presentationRead.dustImpactCount >= 1,
          details: (snapshot) =>
            `concreteImpactCount=${snapshot.combat?.presentationRead?.concreteImpactCount ?? "n/a"}, dustImpactCount=${snapshot.combat?.presentationRead?.dustImpactCount ?? "n/a"}`
        },
        {
          label: "hostile frag pressure stays live",
          test: (snapshot) =>
            typeof snapshot.combat?.presentationRead?.hostileGrenadeCount === "number" &&
            snapshot.combat.presentationRead.hostileGrenadeCount >= 1,
          details: (snapshot) =>
            `hostileGrenadeCount=${snapshot.combat?.presentationRead?.hostileGrenadeCount ?? "n/a"}`
        }
      ]
    };
  }

  if (macroId === "combat-audio") {
    return {
      description: "Validate that the authored combat-audio slice stages a hot readable sound picture with snap-by pressure and an urgent grenade cue.",
      checks: [
        {
          label: "raid phase remains live",
          test: (snapshot) => snapshot.phase === "raid",
          details: (snapshot) => `phase=${snapshot.phase}`
        },
        {
          label: "combat audio read escalates to a hot state",
          test: (snapshot) =>
            typeof snapshot.combat?.audioRead?.title === "string" &&
            snapshot.combat.audioRead.title.includes("HOT"),
          details: (snapshot) => `audioTitle=${snapshot.combat?.audioRead?.title ?? "n/a"}`
        },
        {
          label: "snap-by severity reads hot",
          test: (snapshot) => snapshot.combat?.audioRead?.snapBySeverity === "hot",
          details: (snapshot) => `snapBySeverity=${snapshot.combat?.audioRead?.snapBySeverity ?? "n/a"}`
        },
        {
          label: "grenade severity reads urgent",
          test: (snapshot) => snapshot.combat?.audioRead?.grenadeSeverity === "urgent",
          details: (snapshot) => `grenadeSeverity=${snapshot.combat?.audioRead?.grenadeSeverity ?? "n/a"}`
        },
        {
          label: "the sound picture carries a live blast read",
          test: (snapshot) =>
            Array.isArray(snapshot.combat?.audioRead?.lines) &&
            snapshot.combat.audioRead.lines.some((line) => line.includes("blast")),
          details: (snapshot) =>
            `audioLines=${Array.isArray(snapshot.combat?.audioRead?.lines) ? snapshot.combat.audioRead.lines.join(" || ") : "n/a"}`
        },
        {
          label: "combat pressure stays high enough to justify the panel",
          test: (snapshot) =>
            typeof snapshot.frontline?.metrics?.noise?.pressure === "number" &&
            snapshot.frontline.metrics.noise.pressure >= 1.3 &&
            typeof snapshot.combat?.activeImpactCount === "number" &&
            snapshot.combat.activeImpactCount >= 2 &&
            typeof snapshot.combat?.activeGrenadeCount === "number" &&
            snapshot.combat.activeGrenadeCount >= 1,
          details: (snapshot) =>
            `noisePressure=${snapshot.frontline?.metrics?.noise?.pressure ?? "n/a"}, activeImpactCount=${snapshot.combat?.activeImpactCount ?? "n/a"}, activeGrenadeCount=${snapshot.combat?.activeGrenadeCount ?? "n/a"}`
        }
      ]
    };
  }

  if (macroId === "boys-frag-runtime") {
    return {
      description: "Validate that the delegated-frag showcase keeps one selected boy committed to a live grenade task in the shared trench pocket.",
      checks: [
        {
          label: "raid phase remains live",
          test: (snapshot) => snapshot.phase === "raid",
          details: (snapshot) => `phase=${snapshot.phase}`
        },
        {
          label: "selected boy stays on a grenade task",
          test: (snapshot) =>
            typeof snapshot.combat?.selectedBoyAction === "string" &&
            snapshot.combat.selectedBoyAction.startsWith("grenade:"),
          details: (snapshot) => `selectedBoyAction=${snapshot.combat?.selectedBoyAction ?? "n/a"}`
        },
        {
          label: "delegated tactical actions stay live",
          test: (snapshot) =>
            typeof snapshot.combat?.activeTacticalActionCount === "number" &&
            snapshot.combat.activeTacticalActionCount >= 1,
          details: (snapshot) => `activeTacticalActionCount=${snapshot.combat?.activeTacticalActionCount ?? "n/a"}`
        },
        {
          label: "shared grenade pressure remains readable",
          test: (snapshot) =>
            typeof snapshot.combat?.activeGrenadeCount === "number" &&
            snapshot.combat.activeGrenadeCount >= 2,
          details: (snapshot) => `activeGrenadeCount=${snapshot.combat?.activeGrenadeCount ?? "n/a"}`
        },
        {
          label: "the lane still carries an active support order",
          test: (snapshot) =>
            typeof snapshot.frontline?.activeSupportOrderId === "string" &&
            snapshot.frontline.activeSupportOrderId.length > 0,
          details: (snapshot) => `activeSupportOrderId=${snapshot.frontline?.activeSupportOrderId ?? "n/a"}`
        }
      ]
    };
  }

  if (macroId === "suppression-runtime") {
    return {
      description: "Validate that the suppression-runtime showcase pins a nearby lane through one selected boy's live suppress task.",
      checks: [
        {
          label: "raid phase remains live",
          test: (snapshot) => snapshot.phase === "raid",
          details: (snapshot) => `phase=${snapshot.phase}`
        },
        {
          label: "live tactical suppression work stays active",
          test: (snapshot) =>
            typeof snapshot.combat?.activeTacticalActionCount === "number" &&
            snapshot.combat.activeTacticalActionCount >= 1,
          details: (snapshot) =>
            `activeTacticalActionCount=${snapshot.combat?.activeTacticalActionCount ?? "n/a"}, selectedBoyAction=${snapshot.combat?.selectedBoyAction ?? "n/a"}`
        },
        {
          label: "hostiles are visibly pressured by suppression",
          test: (snapshot) =>
            typeof snapshot.combat?.nearbySuppressedEnemies === "number" &&
            snapshot.combat.nearbySuppressedEnemies >= 1,
          details: (snapshot) =>
            `nearbySuppressedEnemies=${snapshot.combat?.nearbySuppressedEnemies ?? "n/a"}`
        },
        {
          label: "the lane still carries readable suppress traffic",
          test: (snapshot) =>
            typeof snapshot.combat?.activeTracerCount === "number" &&
            snapshot.combat.activeTracerCount >= 2 &&
            typeof snapshot.combat?.activeImpactCount === "number" &&
            snapshot.combat.activeImpactCount >= 2,
          details: (snapshot) =>
            `activeTracerCount=${snapshot.combat?.activeTracerCount ?? "n/a"}, activeImpactCount=${snapshot.combat?.activeImpactCount ?? "n/a"}`
        },
        {
          label: "boys command layer stays live while the suppress task runs",
          test: (snapshot) =>
            typeof snapshot.frontline?.activeSupportOrderId === "string" &&
            snapshot.frontline.activeSupportOrderId.length > 0,
          details: (snapshot) => `activeSupportOrderId=${snapshot.frontline?.activeSupportOrderId ?? "n/a"}`
        }
      ]
    };
  }

  if (macroId === "covering-crossing") {
    return {
      description: "Validate that the covering-crossing showcase turns Broken Signal into a real brace-lane plus moving-cover crossing problem.",
      checks: [
        {
          label: "raid phase remains live",
          test: (snapshot) => snapshot.phase === "raid",
          details: (snapshot) => `phase=${snapshot.phase}`
        },
        {
          label: "the focused war beat is the antenna ditch crossing",
          test: (snapshot) => {
            const focusedIncidentId = snapshot.frontline?.focusedIncidentId;
            const focusedIncident = (snapshot.frontline?.incidents ?? []).find((incident) => incident.id === focusedIncidentId);
            return focusedIncident?.kind === "firefight" && focusedIncident?.label === "Antenna ditch crossing" && focusedIncident?.presentationVariant === "covering-crossing";
          },
          details: (snapshot) => {
            const focusedIncidentId = snapshot.frontline?.focusedIncidentId;
            const focusedIncident = (snapshot.frontline?.incidents ?? []).find((incident) => incident.id === focusedIncidentId);
            return `focused=${focusedIncident?.label ?? "n/a"}, kind=${focusedIncident?.kind ?? "n/a"}, variant=${focusedIncident?.presentationVariant ?? "n/a"}`;
          }
        },
        {
          label: "pressure posture explicitly calls the covered cross",
          test: (snapshot) =>
            snapshot.map?.pressurePosture?.actionLabel === "Cross under moving cover" &&
            snapshot.map?.pressurePosture?.windowLabel === "Covering-cross window live",
          details: (snapshot) =>
            `action=${snapshot.map?.pressurePosture?.actionLabel ?? "n/a"}, window=${snapshot.map?.pressurePosture?.windowLabel ?? "n/a"}`
        },
        {
          label: "the selected boy is on moving cover while another boy braces the lane",
          test: (snapshot) =>
            snapshot.combat?.selectedBoyAction === "order:move-watch" &&
            Array.isArray(snapshot.raid?.squadMates) &&
            snapshot.raid.squadMates.some((mate) => mate.command?.orderId === "move-watch") &&
            snapshot.raid.squadMates.some((mate) => mate.command?.orderId === "brace-watch"),
          details: (snapshot) =>
            `selectedBoyAction=${snapshot.combat?.selectedBoyAction ?? "n/a"}, commands=${Array.isArray(snapshot.raid?.squadMates) ? snapshot.raid.squadMates.map((mate) => `${mate.name}:${mate.command?.orderId ?? "none"}`).join(" || ") : "n/a"}`
        },
        {
          label: "suppressed enemies still make the cross necessary",
          test: (snapshot) =>
            typeof snapshot.combat?.nearbySuppressedEnemies === "number" &&
            snapshot.combat.nearbySuppressedEnemies >= 1,
          details: (snapshot) => `nearbySuppressedEnemies=${snapshot.combat?.nearbySuppressedEnemies ?? "n/a"}`
        },
        {
          label: "the squad doctrine reads as a covered crossing package",
          test: (snapshot) =>
            snapshot.combat?.squadDoctrine?.title === "Covered crossing package" &&
            Array.isArray(snapshot.combat?.squadDoctrine?.mates) &&
            snapshot.combat.squadDoctrine.mates.some((mate) => mate.roleLabel === "Lane brace") &&
            snapshot.combat.squadDoctrine.mates.some((mate) => mate.roleLabel === "Moving cover"),
          details: (snapshot) =>
            `title=${snapshot.combat?.squadDoctrine?.title ?? "n/a"}, roles=${Array.isArray(snapshot.combat?.squadDoctrine?.mates) ? snapshot.combat.squadDoctrine.mates.map((mate) => `${mate.name}:${mate.roleLabel}`).join(" || ") : "n/a"}`
        },
        {
          label: "operation flow treats the ditch as the live commitment problem",
          test: (snapshot) =>
            ["gain", "commitment", "exfil"].includes(snapshot.raid?.operationRead?.phase) &&
            typeof snapshot.raid?.operationRead?.detail === "string" &&
            snapshot.raid.operationRead.detail.toLowerCase().includes("moving cover"),
          details: (snapshot) =>
            `phase=${snapshot.raid?.operationRead?.phase ?? "n/a"}, detail=${snapshot.raid?.operationRead?.detail ?? "n/a"}`
        }
      ]
    };
  }

  if (macroId === "pinned-pressure") {
    return {
      description: "Validate that the pinned-pressure showcase produces a real crossing window instead of a flat hold-versus-hold lane.",
      checks: [
        {
          label: "raid phase remains live",
          test: (snapshot) => snapshot.phase === "raid",
          details: (snapshot) => `phase=${snapshot.phase}`
        },
        {
          label: "pressure posture resolves to pinned",
          test: (snapshot) => snapshot.map?.pressurePosture?.posture === "pinned",
          details: (snapshot) =>
            `pressurePosture=${snapshot.map?.pressurePosture?.posture ?? "n/a"}, title=${snapshot.map?.pressurePosture?.title ?? "n/a"}`
        },
        {
          label: "pressure posture explicitly sells the PKM pin instead of generic suppression",
          test: (snapshot) =>
            typeof snapshot.map?.pressurePosture?.detail === "string" &&
            typeof snapshot.map?.pressurePosture?.windowLabel === "string" &&
            `${snapshot.map.pressurePosture.detail} ${snapshot.map.pressurePosture.windowLabel}`.toLowerCase().includes("pkm"),
          details: (snapshot) =>
            `detail=${snapshot.map?.pressurePosture?.detail ?? "n/a"}, window=${snapshot.map?.pressurePosture?.windowLabel ?? "n/a"}, threat=${snapshot.map?.pressurePosture?.threatLabel ?? "n/a"}`
        },
        {
          label: "pressure window is timed and actionable",
          test: (snapshot) =>
            typeof snapshot.map?.pressurePosture?.windowSeconds === "number" &&
            snapshot.map.pressurePosture.windowSeconds > 0 &&
            snapshot.map.pressurePosture.actionLabel === "Cross now",
          details: (snapshot) =>
            `windowSeconds=${snapshot.map?.pressurePosture?.windowSeconds ?? "n/a"}, action=${snapshot.map?.pressurePosture?.actionLabel ?? "n/a"}`
        },
        {
          label: "multiple defenders are actually pinned nearby",
          test: (snapshot) =>
            typeof snapshot.combat?.nearbySuppressedEnemies === "number" &&
            snapshot.combat.nearbySuppressedEnemies >= 2,
          details: (snapshot) => `nearbySuppressedEnemies=${snapshot.combat?.nearbySuppressedEnemies ?? "n/a"}`
        },
        {
          label: "cover-me support order is live on the lane",
          test: (snapshot) => snapshot.frontline?.activeSupportOrderId === "shift-fire",
          details: (snapshot) => `activeSupportOrderId=${snapshot.frontline?.activeSupportOrderId ?? "n/a"}`
        },
        {
          label: "the lane is under reinforcement pressure if you delay",
          test: (snapshot) =>
            typeof snapshot.raid?.reinforcementPressure?.title === "string" &&
            snapshot.raid.reinforcementPressure.title.length > 0,
          details: (snapshot) =>
            `reinforcementTitle=${snapshot.raid?.reinforcementPressure?.title ?? "n/a"}, status=${snapshot.raid?.reinforcementPressure?.status ?? "n/a"}`
        }
      ]
    };
  }

  if (macroId === "fireteam-audit") {
    return {
      description: "Validate that generic hostile squads still read as PKM-led fireteams occupying lane-owning strongpoints instead of rifle blobs.",
      checks: [
        {
          label: "raid phase remains live",
          test: (snapshot) => snapshot.phase === "raid",
          details: (snapshot) => `phase=${snapshot.phase}`
        },
        {
          label: "every live multi-man squad carries a real PKM support gunner",
          test: (snapshot) =>
            Array.isArray(snapshot.raid?.enemySquads) &&
            snapshot.raid.enemySquads
              .filter((squad) => typeof squad?.aliveCount === "number" && squad.aliveCount >= 2)
              .every(
                (squad) =>
                  Array.isArray(squad.members) &&
                  squad.members.some(
                    (member) =>
                      member.casualtyState !== "downed" &&
                      member.casualtyState !== "dead" &&
                      member.squadRole === "support-gunner" &&
                      member.weaponId === "pkm"
                  )
              ),
          details: (snapshot) =>
            `enemySquads=${Array.isArray(snapshot.raid?.enemySquads) ? snapshot.raid.enemySquads.map((squad) => `${squad.id}:${Array.isArray(squad.members) ? squad.members.map((member) => `${member.squadRole}:${member.weaponId}`).join("/") : "n/a"}`).join(" || ") : "n/a"}`
        },
        {
          label: "support gunners are holding strongpoints instead of roaming as generic patrol rifles",
          test: (snapshot) =>
            Array.isArray(snapshot.raid?.enemySquads) &&
            snapshot.raid.enemySquads.filter(
              (squad) =>
                Array.isArray(squad.members) &&
                squad.members.some(
                  (member) =>
                    member.casualtyState !== "downed" &&
                    member.casualtyState !== "dead" &&
                    member.squadRole === "support-gunner" &&
                    member.weaponId === "pkm" &&
                    (member.openingPosture === "hold" || member.openingPosture === "reserve")
                )
            ).length >= 2,
          details: (snapshot) =>
            `supports=${Array.isArray(snapshot.raid?.enemySquads) ? snapshot.raid.enemySquads.map((squad) => `${squad.id}:${Array.isArray(squad.members) ? squad.members.filter((member) => member.squadRole === "support-gunner").map((member) => `${member.weaponId}/${member.openingPosture}`).join(",") : "n/a"}`).join(" || ") : "n/a"}`
        },
        {
          label: "most live PKM squads are tied to a building or key-area strongpoint",
          test: (snapshot) =>
            Array.isArray(snapshot.raid?.enemySquads) &&
            (() => {
              const liveSquads = snapshot.raid.enemySquads.filter(
                (squad) => typeof squad?.aliveCount === "number" && squad.aliveCount >= 2
              );
              const strongpointCount = liveSquads.filter(
                (squad) =>
                  typeof squad.supportStrongpointLabel === "string" &&
                  squad.supportStrongpointLabel.length > 0 &&
                  /house|dish|shed|cellar|bunker|office|vault|room|relay|gate|slot|lift|mouth|yard|ridge|verge|lip|crossfire|channel|antenna|spillway|duel|dugout|hold/i.test(
                    squad.supportStrongpointLabel
                  )
              ).length;
              return strongpointCount >= Math.max(3, Math.floor(liveSquads.length * 0.5));
            })(),
          details: (snapshot) =>
            `strongpoints=${Array.isArray(snapshot.raid?.enemySquads) ? snapshot.raid.enemySquads.map((squad) => `${squad.id}:${squad.supportStrongpointLabel ?? "none"}`).join(" || ") : "n/a"}`
        },
        {
          label: "guarded buildings are being claimed by full four-role squads before leftover lane bodies",
          test: (snapshot) =>
            Array.isArray(snapshot.raid?.enemySquads) &&
            snapshot.raid.enemySquads.filter(
              (squad) =>
                squad.size >= 4 &&
                typeof squad.supportStrongpointLabel === "string" &&
                /house|dish|shed|cellar|bunker|office|vault|room|relay|dugout|lift|ladder|gate|antenna/i.test(squad.supportStrongpointLabel) &&
                Array.isArray(squad.roleLabels) &&
                ["Support gunner", "Anchor rifle", "Probe rifle", "Deep rifle"].every((label) =>
                  squad.roleLabels.includes(label)
                )
            ).length >= 2,
          details: (snapshot) =>
            `buildingSquads=${Array.isArray(snapshot.raid?.enemySquads) ? snapshot.raid.enemySquads.map((squad) => `${squad.id}:${squad.size}:${squad.supportStrongpointLabel ?? "none"}:${Array.isArray(squad.roleLabels) ? squad.roleLabels.join("/") : "n/a"}`).join(" || ") : "n/a"}`
        },
        {
          label: "generic raids now stage several distinct occupied structures instead of one main breach pocket",
          test: (snapshot) =>
            Array.isArray(snapshot.raid?.enemySquads) &&
            new Set(
              snapshot.raid.enemySquads
                .filter(
                  (squad) =>
                    squad.size >= 3 &&
                    typeof squad.supportStrongpointLabel === "string" &&
                    squad.supportStrongpointLabel.length > 0
                )
                .map((squad) => squad.supportStrongpointLabel)
            ).size >= 4,
          details: (snapshot) =>
            `occupiedStructures=${Array.isArray(snapshot.raid?.enemySquads) ? snapshot.raid.enemySquads.filter((squad) => typeof squad.supportStrongpointLabel === "string" && squad.supportStrongpointLabel.length > 0).map((squad) => `${squad.id}:${squad.supportStrongpointLabel}`).join(" || ") : "n/a"}`
        },
        {
          label: "occupied structures vary in room-clear depth instead of all reading like one doorway solve",
          test: (snapshot) =>
            Array.isArray(snapshot.raid?.enemySquads) &&
            new Set(
              snapshot.raid.enemySquads
                .filter(
                  (squad) =>
                    squad.size >= 3 &&
                    typeof squad.roomClearDepthLabel === "string" &&
                    squad.roomClearDepthLabel.length > 0
                )
                .map((squad) => squad.roomClearDepthLabel)
            ).size >= 2,
          details: (snapshot) =>
            `roomDepths=${Array.isArray(snapshot.raid?.enemySquads) ? snapshot.raid.enemySquads.map((squad) => `${squad.id}:${squad.supportStrongpointLabel ?? "none"}:${squad.roomClearDepthLabel ?? "none"}`).join(" || ") : "n/a"}`
        },
        {
          label: "occupied structures are not mostly weak token contacts",
          test: (snapshot) =>
            Array.isArray(snapshot.raid?.enemySquads) &&
            (() => {
              const occupiedSquads = snapshot.raid.enemySquads.filter(
                (squad) =>
                  typeof squad.supportStrongpointLabel === "string" &&
                  squad.supportStrongpointLabel.length > 0
              );
              const weakOccupiedCount = occupiedSquads.filter((squad) => typeof squad.size === "number" && squad.size < 3).length;
              return occupiedSquads.length >= 3 && weakOccupiedCount <= 1;
            })(),
          details: (snapshot) =>
            `occupiedStrength=${Array.isArray(snapshot.raid?.enemySquads) ? snapshot.raid.enemySquads.filter((squad) => typeof squad.supportStrongpointLabel === "string" && squad.supportStrongpointLabel.length > 0).map((squad) => `${squad.id}:${squad.supportStrongpointLabel}:${squad.size}`).join(" || ") : "n/a"}`
        },
        {
          label: "at least one authored or building-owned strongpoint now exposes a real PKM-owned lane",
          test: (snapshot) =>
            Array.isArray(snapshot.raid?.enemySquads) &&
            snapshot.raid.enemySquads.some(
              (squad) =>
                (squad.supportStrongpointTier === "must-own" ||
                  squad.supportStrongpointTier === "guarded" ||
                  (typeof squad.supportStrongpointLabel === "string" &&
                    /house|dish|shed|cellar|bunker|office|vault|room|relay|lift|gate/i.test(squad.supportStrongpointLabel))) &&
                typeof squad.supportStrongpointLabel === "string" &&
                squad.supportStrongpointLabel.length > 0 &&
                Array.isArray(squad.members) &&
                squad.members.some(
                  (member) =>
                    member.casualtyState !== "downed" &&
                    member.casualtyState !== "dead" &&
                    member.squadRole === "support-gunner" &&
                    member.weaponId === "pkm" &&
                    member.doctrineState === "cover-sector"
                )
            ),
          details: (snapshot) =>
            `mustOwnSquads=${Array.isArray(snapshot.raid?.enemySquads) ? snapshot.raid.enemySquads.map((squad) => `${squad.id}:${squad.supportStrongpointTier ?? "none"}:${squad.supportStrongpointLabel ?? "none"}:${squad.supportLaneLabel ?? "none"}`).join(" || ") : "n/a"}`
        },
        {
          label: "pressure posture still names the PKM lane as the live threat",
          test: (snapshot) =>
            typeof snapshot.map?.pressurePosture?.detail === "string" &&
            `${snapshot.map.pressurePosture.detail} ${snapshot.map.pressurePosture.windowLabel ?? ""}`.toLowerCase().includes("pkm") &&
            `${snapshot.map.pressurePosture.detail} ${snapshot.map.pressurePosture.windowLabel ?? ""}`.toLowerCase().includes("lane"),
          details: (snapshot) =>
            `detail=${snapshot.map?.pressurePosture?.detail ?? "n/a"}, window=${snapshot.map?.pressurePosture?.windowLabel ?? "n/a"}, threat=${snapshot.map?.pressurePosture?.threatLabel ?? "n/a"}`
        },
        {
          label: "pressure posture exposes a shared ownership label for the active structure or lane holder",
          test: (snapshot) =>
            typeof snapshot.map?.pressurePosture?.ownershipLabel === "string" &&
            snapshot.map.pressurePosture.ownershipLabel.length > 0 &&
            /pkm owns|compressed deeper|still live|cracked/i.test(snapshot.map.pressurePosture.ownershipLabel),
          details: (snapshot) =>
            `ownership=${snapshot.map?.pressurePosture?.ownershipLabel ?? "n/a"}, status=${snapshot.map?.pressurePosture?.status ?? "n/a"}`
        },
        {
          label: "operation flow carries the same hostile ownership read instead of only generic pressure tone",
          test: (snapshot) =>
            typeof snapshot.map?.raidOperation?.ownershipLabel === "string" &&
            snapshot.map.raidOperation.ownershipLabel.length > 0 &&
            /pkm owns|compressed deeper|still live|cracked/i.test(snapshot.map.raidOperation.ownershipLabel),
          details: (snapshot) =>
            `ownership=${snapshot.map?.raidOperation?.ownershipLabel ?? "n/a"}, status=${snapshot.map?.raidOperation?.status ?? "n/a"}, compact=${snapshot.map?.raidOperation?.compact ?? "n/a"}`
        },
        {
          label: "hostile squads expose explicit sector-cover doctrine instead of only passive anchors",
          test: (snapshot) =>
            Array.isArray(snapshot.raid?.enemySquads) &&
            snapshot.raid.enemySquads.filter(
              (squad) =>
                Array.isArray(squad.doctrineLabels) &&
                squad.doctrineLabels.some((label) => /cover sector|hold threshold|collapse inside|probe flank/i.test(label)) &&
                typeof squad.sectorCoverageLabel === "string" &&
                squad.sectorCoverageLabel.length > 0
            ).length >= 3,
          details: (snapshot) =>
            `doctrine=${Array.isArray(snapshot.raid?.enemySquads) ? snapshot.raid.enemySquads.map((squad) => `${squad.id}:${Array.isArray(squad.doctrineLabels) ? squad.doctrineLabels.join("/") : "none"}:${squad.sectorCoverageLabel ?? "none"}`).join(" || ") : "n/a"}`
        }
      ]
    };
  }

  if (macroId === "extract-clean") {
    return {
      description: "Validate that the extract-clean showcase stages a disciplined peel where the chosen pull is still cleaner than the hotter alternatives.",
      checks: [
        {
          label: "raid phase remains live",
          test: (snapshot) => snapshot.phase === "raid",
          details: (snapshot) => `phase=${snapshot.phase}`
        },
        {
          label: "operation flow stays on a clean commitment lane",
          test: (snapshot) =>
            snapshot.raid?.operationPhase === "commitment" &&
            snapshot.raid?.extractCleanliness === "clean" &&
            snapshot.raid?.operationExitIntent === "profit",
          details: (snapshot) =>
            `phase=${snapshot.raid?.operationPhase ?? "n/a"}, cleanliness=${snapshot.raid?.extractCleanliness ?? "n/a"}, exitIntent=${snapshot.raid?.operationExitIntent ?? "n/a"}`
        },
        {
          label: "planned extract posture already leans screen teams onto the pull",
          test: (snapshot) =>
            typeof snapshot.raid?.plannedExtractPosture?.stagedFireteams === "number" &&
            snapshot.raid.plannedExtractPosture.stagedFireteams >= 1,
          details: (snapshot) =>
            `plannedExtractPosture=${snapshot.raid?.plannedExtractPosture ? JSON.stringify(snapshot.raid.plannedExtractPosture) : "n/a"}`
        },
        {
          label: "the extract briefing still reads as a disciplined bank instead of a panic exit",
          test: (snapshot) =>
            typeof snapshot.message === "string" &&
            snapshot.message.toLowerCase().includes("clean extract staged") &&
            snapshot.raid?.extractProductRead?.headline === "Disciplined clean peel" &&
            typeof snapshot.raid?.extractProductRead?.callToAction === "string" &&
            snapshot.raid.extractProductRead.callToAction.toLowerCase().includes("bank"),
          details: (snapshot) =>
            `message=${snapshot.message ?? "n/a"}, extractProduct=${snapshot.raid?.extractProductRead ? `${snapshot.raid.extractProductRead.headline} // ${snapshot.raid.extractProductRead.callToAction}` : "n/a"}`
        },
        {
          label: "squad comms sell the calm peel",
          test: (snapshot) =>
            snapshot.dialogue?.squadComms?.channel === "Clean Peel" &&
            typeof snapshot.dialogue?.squadComms?.line === "string" &&
            snapshot.dialogue.squadComms.line.toLowerCase().includes("still clean"),
          details: (snapshot) =>
            `squadComms=${snapshot.dialogue?.squadComms?.channel ?? "n/a"} // ${snapshot.dialogue?.squadComms?.line ?? "n/a"}`
        }
      ]
    };
  }

  if (macroId === "extract-collapse") {
    return {
      description: "Validate that the extract-collapse showcase stages a hotter convoy peel where the haul is real but the route is already bending toward collapse pressure.",
      checks: [
        {
          label: "raid phase remains live",
          test: (snapshot) => snapshot.phase === "raid",
          details: (snapshot) => `phase=${snapshot.phase}`
        },
        {
          label: "operation flow treats the route as a heated pull",
          test: (snapshot) =>
            (snapshot.raid?.operationPhase === "exfil" || snapshot.raid?.operationPhase === "collapse") &&
            (snapshot.raid?.extractCleanliness === "hot" || snapshot.raid?.extractCleanliness === "slipping"),
          details: (snapshot) =>
            `phase=${snapshot.raid?.operationPhase ?? "n/a"}, cleanliness=${snapshot.raid?.extractCleanliness ?? "n/a"}, exitIntent=${snapshot.raid?.operationExitIntent ?? "n/a"}`
        },
        {
          label: "the route still carries bankable haul through the hotter peel",
          test: (snapshot) =>
            typeof snapshot.raid?.carriedValue === "number" &&
            snapshot.raid.carriedValue > 0 &&
            typeof snapshot.raid?.focusedExtractLabel === "string" &&
            snapshot.raid.focusedExtractLabel.length > 0,
          details: (snapshot) =>
            `carriedValue=${snapshot.raid?.carriedValue ?? "n/a"}, focusedExtractLabel=${snapshot.raid?.focusedExtractLabel ?? "n/a"}`
        },
        {
          label: "planned extract posture hard-commits at least one fireteam",
          test: (snapshot) =>
            typeof snapshot.raid?.plannedExtractPosture?.hardCommittedFireteams === "number" &&
            snapshot.raid.plannedExtractPosture.hardCommittedFireteams >= 1,
          details: (snapshot) =>
            `plannedExtractPosture=${snapshot.raid?.plannedExtractPosture ? JSON.stringify(snapshot.raid.plannedExtractPosture) : "n/a"}`
        },
        {
          label: "the staged chatter reads like a hotter convoy peel",
          test: (snapshot) =>
            typeof snapshot.message === "string" &&
            snapshot.message.toLowerCase().includes("civilian-car peel") &&
            snapshot.dialogue?.squadComms?.channel === "Extract Split" &&
            snapshot.raid?.extractProductRead?.headline === "Collapse-taxed extract",
          details: (snapshot) =>
            `message=${snapshot.message ?? "n/a"}, squadComms=${snapshot.dialogue?.squadComms?.channel ?? "n/a"} // ${snapshot.dialogue?.squadComms?.line ?? "n/a"}, extractProduct=${snapshot.raid?.extractProductRead ? `${snapshot.raid.extractProductRead.headline} // ${snapshot.raid.extractProductRead.callToAction}` : "n/a"}`
        }
      ]
    };
  }

  if (macroId === "body-recovery") {
    return {
      description: "Validate that the body-recovery showcase reads as a recovery-first operation instead of a normal profit raid.",
      checks: [
        {
          label: "raid phase remains live",
          test: (snapshot) => snapshot.phase === "raid",
          details: (snapshot) => `phase=${snapshot.phase}`
        },
        {
          label: "operation flow classifies the raid as recovery-driven",
          test: (snapshot) => snapshot.raid?.operationExitIntent === "recovery",
          details: (snapshot) =>
            `operationExitIntent=${snapshot.raid?.operationExitIntent ?? "n/a"}, operationPhase=${snapshot.raid?.operationPhase ?? "n/a"}`
        },
        {
          label: "pressure posture stays on the recovery corridor",
          test: (snapshot) => snapshot.map?.pressurePosture?.posture === "recovering",
          details: (snapshot) =>
            `pressurePosture=${snapshot.map?.pressurePosture?.posture ?? "n/a"}, status=${snapshot.map?.pressurePosture?.status ?? "n/a"}`
        },
        {
          label: "the squad doctrine flips into a recovery corridor package",
          test: (snapshot) =>
            snapshot.combat?.squadDoctrine?.title === "Recovery corridor package" &&
            Array.isArray(snapshot.combat?.squadDoctrine?.mates) &&
            snapshot.combat.squadDoctrine.mates.some((mate) => mate.roleLabel === "Corridor lid") &&
            snapshot.combat.squadDoctrine.mates.some((mate) => mate.roleLabel === "Drag runner"),
          details: (snapshot) =>
            `title=${snapshot.combat?.squadDoctrine?.title ?? "n/a"}, roles=${Array.isArray(snapshot.combat?.squadDoctrine?.mates) ? snapshot.combat.squadDoctrine.mates.map((mate) => `${mate.name}:${mate.roleLabel}`).join(" || ") : "n/a"}`
        },
        {
          label: "focused war beat stays on a casualty recovery problem",
          test: (snapshot) => {
            const focusedIncidentId = snapshot.frontline?.focusedIncidentId;
            const focusedIncident = (snapshot.frontline?.incidents ?? []).find(
              (incident) => incident.id === focusedIncidentId
            );
            return focusedIncident?.kind === "casualty" && focusedIncident?.actionVerb === "recover";
          },
          details: (snapshot) =>
            (() => {
              const focusedIncidentId = snapshot.frontline?.focusedIncidentId;
              const focusedIncident = (snapshot.frontline?.incidents ?? []).find(
                (incident) => incident.id === focusedIncidentId
              );
              return `focused=${focusedIncident?.label ?? "n/a"}, kind=${focusedIncident?.kind ?? "n/a"}, verb=${focusedIncident?.actionVerb ?? "n/a"}`;
            })()
        },
        {
          label: "debrief preview copy keeps the recovery peel explicit",
          test: (snapshot) =>
            snapshot.raid?.extractProductRead?.headline === "Recovery-driven pull" &&
            typeof snapshot.raid?.extractProductRead?.callToAction === "string" &&
            snapshot.raid.extractProductRead.callToAction.toLowerCase().includes("corridor"),
          details: (snapshot) => `debriefPreview=${snapshot.raid?.debriefPreview ?? "n/a"}`
        }
      ]
    };
  }

  if (macroId === "intel-alarm") {
    return {
      description: "Validate that starting an intel uplink triggers a real intel crash immediately and forces a short held terminal defense before the packet is banked.",
      checks: [
        {
          label: "raid phase remains live",
          test: (snapshot) => snapshot.phase === "raid",
          details: (snapshot) => `phase=${snapshot.phase}`
        },
        {
          label: "the intel channel is live and the packet is not banked yet",
          test: (snapshot) =>
            snapshot.raid?.activeIntelCapture &&
            typeof snapshot.raid.activeIntelCapture.timer === "number" &&
            snapshot.raid.activeIntelCapture.timer >= 10 &&
            typeof snapshot.raid.activeIntelCapture.duration === "number" &&
            snapshot.raid.activeIntelCapture.duration >= 15 &&
            typeof snapshot.raid?.carriedManifest?.intel === "number" &&
            snapshot.raid.carriedManifest.intel === 0 &&
            typeof snapshot.raid?.intelRemaining === "number" &&
            snapshot.raid.intelRemaining >= 1,
          details: (snapshot) =>
            `activeIntel=${snapshot.raid?.activeIntelCapture ? `${snapshot.raid.activeIntelCapture.timer}s / ${snapshot.raid.activeIntelCapture.duration}s` : "n/a"}, intelRemaining=${snapshot.raid?.intelRemaining ?? "n/a"}, carriedIntel=${snapshot.raid?.carriedManifest?.intel ?? "n/a"}`
        },
        {
          label: "an intel crash is pending instead of a generic sweep",
          test: (snapshot) =>
            Array.isArray(snapshot.raid?.pendingReinforcements) &&
            snapshot.raid.pendingReinforcements.filter((pending) => pending.source === "intel-wave").length >= 8,
          details: (snapshot) =>
            `pending=${Array.isArray(snapshot.raid?.pendingReinforcements) ? snapshot.raid.pendingReinforcements.map((pending) => `${pending.source}:${pending.label}:${pending.timer}`).join(" || ") : "n/a"}`
        },
        {
          label: "the intel crash is aimed back at the held site near the player",
          test: (snapshot) => {
            if (!Array.isArray(snapshot.raid?.pendingReinforcements) || !snapshot.raid?.position) {
              return false;
            }
            const intelWaves = snapshot.raid.pendingReinforcements.filter((pending) => pending.source === "intel-wave");
            if (intelWaves.length === 0) {
              return false;
            }
            return intelWaves.every((pending) => {
              const dx = pending.targetPosition.x - snapshot.raid.position.x;
              const dy = pending.targetPosition.y - snapshot.raid.position.y;
              return Math.hypot(dx, dy) <= 140;
            });
          },
          details: (snapshot) =>
            `player=${snapshot.raid?.position ? `${snapshot.raid.position.x},${snapshot.raid.position.y}` : "n/a"}, targets=${Array.isArray(snapshot.raid?.pendingReinforcements) ? snapshot.raid.pendingReinforcements.filter((pending) => pending.source === "intel-wave").map((pending) => `${pending.targetPosition.x},${pending.targetPosition.y}`).join(" || ") : "n/a"}`
        },
        {
          label: "player-facing pressure reads sell the intel crash directly",
          test: (snapshot) =>
            `${snapshot.raid?.reinforcementPressure?.title ?? ""} ${snapshot.raid?.reinforcementPressure?.status ?? ""} ${snapshot.raid?.reinforcementPressure?.detail ?? ""} ${snapshot.dialogue?.squadComms?.channel ?? ""} ${snapshot.raid?.objective ?? ""}`.toLowerCase().includes("intel"),
          details: (snapshot) =>
            `title=${snapshot.raid?.reinforcementPressure?.title ?? "n/a"}, status=${snapshot.raid?.reinforcementPressure?.status ?? "n/a"}, objective=${snapshot.raid?.objective ?? "n/a"}, channel=${snapshot.dialogue?.squadComms?.channel ?? "n/a"}`
        }
      ]
    };
  }

  if (macroId === "drone-sweep") {
    return {
      description: "Validate that the drone-sweep showcase stages Broken Signal as a live spotter-eye infiltration cut instead of a screenshot-only relay beat.",
      checks: [
        {
          label: "raid phase remains live",
          test: (snapshot) => snapshot.phase === "raid",
          details: (snapshot) => `phase=${snapshot.phase}`
        },
        {
          label: "the settlement still reads as a contested Relay Hamlet cut",
          test: (snapshot) =>
            snapshot.map?.settlement?.label === "Relay Hamlet" &&
            snapshot.map?.settlement?.control === "contested",
          details: (snapshot) =>
            `settlement=${snapshot.map?.settlement?.label ?? "n/a"}, control=${snapshot.map?.settlement?.control ?? "n/a"}, volatility=${snapshot.map?.settlement?.volatility ?? "n/a"}`
        },
        {
          label: "the focused war beat is still the drone sweep pocket",
          test: (snapshot) => {
            const focusedIncidentId = snapshot.frontline?.focusedIncidentId;
            const focusedIncident = (snapshot.frontline?.incidents ?? []).find((incident) => incident.id === focusedIncidentId);
            return (
              focusedIncident?.kind === "firefight" &&
              focusedIncident?.label === "Relay cut sweep" &&
              typeof snapshot.message === "string" &&
              snapshot.message.toLowerCase().includes("spotter eye")
            );
          },
          details: (snapshot) => {
            const focusedIncidentId = snapshot.frontline?.focusedIncidentId;
            const focusedIncident = (snapshot.frontline?.incidents ?? []).find((incident) => incident.id === focusedIncidentId);
            return `focused=${focusedIncident?.label ?? "n/a"}, kind=${focusedIncident?.kind ?? "n/a"}, message=${snapshot.message ?? "n/a"}`;
          }
        },
        {
          label: "pressure posture tells the player to stay low until the board is bagged",
          test: (snapshot) =>
            snapshot.map?.pressurePosture?.posture === "holding" &&
            snapshot.map?.pressurePosture?.actionLabel === "Stay low until the board is bagged" &&
            snapshot.map?.pressurePosture?.windowLabel === "Drone sweep live",
          details: (snapshot) =>
            `posture=${snapshot.map?.pressurePosture?.posture ?? "n/a"}, action=${snapshot.map?.pressurePosture?.actionLabel ?? "n/a"}, window=${snapshot.map?.pressurePosture?.windowLabel ?? "n/a"}`
        },
        {
          label: "operation flow treats the sweep as the live infiltration cut",
          test: (snapshot) =>
            snapshot.raid?.operationPhase === "commitment" &&
            snapshot.raid?.operationExitIntent === "profit" &&
            typeof snapshot.raid?.debriefPreview === "string" &&
            snapshot.raid.debriefPreview.includes("spotter-eye") &&
            snapshot.raid.debriefPreview.includes("route board"),
          details: (snapshot) =>
            `phase=${snapshot.raid?.operationPhase ?? "n/a"}, exitIntent=${snapshot.raid?.operationExitIntent ?? "n/a"}, detail=${snapshot.raid?.debriefPreview ?? "n/a"}`
        },
        {
          label: "the squad doctrine flips into the drone slip package",
          test: (snapshot) =>
            snapshot.combat?.squadDoctrine?.title === "Drone slip package" &&
            Array.isArray(snapshot.combat?.squadDoctrine?.mates) &&
            snapshot.combat.squadDoctrine.mates.some((mate) => mate.roleLabel === "Hedge lid") &&
            snapshot.combat.squadDoctrine.mates.some((mate) => mate.roleLabel === "Board runner"),
          details: (snapshot) =>
            `title=${snapshot.combat?.squadDoctrine?.title ?? "n/a"}, roles=${Array.isArray(snapshot.combat?.squadDoctrine?.mates) ? snapshot.combat.squadDoctrine.mates.map((mate) => `${mate.name}:${mate.roleLabel}`).join(" || ") : "n/a"}`
        }
      ]
    };
  }

  if (macroId === "hostile-lane-chatter") {
    return {
      description: "Validate that hostile-lane-chatter promotes tape-specific dock pressure into the shared raid grammar instead of leaving it as screenshot-only flavor.",
      checks: [
        {
          label: "raid phase remains live",
          test: (snapshot) => snapshot.phase === "raid",
          details: (snapshot) => `phase=${snapshot.phase}`
        },
        {
          label: "the focused war beat is still the shouting tape lane",
          test: (snapshot) => {
            const focusedIncidentId = snapshot.frontline?.focusedIncidentId;
            const focusedIncident = (snapshot.frontline?.incidents ?? []).find((incident) => incident.id === focusedIncidentId);
            return (
              focusedIncident?.kind === "firefight" &&
              typeof snapshot.message === "string" &&
              snapshot.message.toLowerCase().includes("blue/green/yellow")
            );
          },
          details: (snapshot) => {
            const focusedIncidentId = snapshot.frontline?.focusedIncidentId;
            const focusedIncident = (snapshot.frontline?.incidents ?? []).find((incident) => incident.id === focusedIncidentId);
            return `focused=${focusedIncident?.label ?? "n/a"}, kind=${focusedIncident?.kind ?? "n/a"}, message=${snapshot.message ?? "n/a"}`;
          }
        },
        {
          label: "pressure posture tells the player to cut the loudest tape first",
          test: (snapshot) =>
            snapshot.map?.pressurePosture?.posture === "holding" &&
            snapshot.map?.pressurePosture?.actionLabel === "Cut the loudest tape first" &&
            snapshot.map?.pressurePosture?.windowLabel === "Tape lane arguing",
          details: (snapshot) =>
            `posture=${snapshot.map?.pressurePosture?.posture ?? "n/a"}, action=${snapshot.map?.pressurePosture?.actionLabel ?? "n/a"}, window=${snapshot.map?.pressurePosture?.windowLabel ?? "n/a"}`
        },
        {
          label: "operation flow treats the shouting lane as the live dock commitment",
          test: (snapshot) =>
            snapshot.raid?.operationPhase === "commitment" &&
            snapshot.raid?.operationExitIntent === "profit" &&
            typeof snapshot.raid?.debriefPreview === "string" &&
            snapshot.raid.debriefPreview.toLowerCase().includes("loudest tape"),
          details: (snapshot) =>
            `phase=${snapshot.raid?.operationPhase ?? "n/a"}, exitIntent=${snapshot.raid?.operationExitIntent ?? "n/a"}, detail=${snapshot.raid?.debriefPreview ?? "n/a"}`
        },
        {
          label: "the squad doctrine flips into the tape-cut package",
          test: (snapshot) =>
            snapshot.combat?.squadDoctrine?.title === "Tape-cut package" &&
            Array.isArray(snapshot.combat?.squadDoctrine?.mates) &&
            snapshot.combat.squadDoctrine.mates.some((mate) => mate.roleLabel === "Gantry lid") &&
            snapshot.combat.squadDoctrine.mates.some((mate) => mate.roleLabel === "Call cutter"),
          details: (snapshot) =>
            `title=${snapshot.combat?.squadDoctrine?.title ?? "n/a"}, roles=${Array.isArray(snapshot.combat?.squadDoctrine?.mates) ? snapshot.combat.squadDoctrine.mates.map((mate) => `${mate.name}:${mate.roleLabel}`).join(" || ") : "n/a"}`
        }
      ]
    };
  }

  if (macroId === "caravan-trap") {
    return {
      description: "Validate that caravan-trap reads like a live burning-road salvage problem instead of a scenery-only convoy disaster.",
      checks: [
        {
          label: "raid phase remains live",
          test: (snapshot) => snapshot.phase === "raid",
          details: (snapshot) => `phase=${snapshot.phase}`
        },
        {
          label: "the focused war beat is still the burning caravan trap",
          test: (snapshot) => {
            const focusedIncidentId = snapshot.frontline?.focusedIncidentId;
            const focusedIncident = (snapshot.frontline?.incidents ?? []).find((incident) => incident.id === focusedIncidentId);
            return (
              focusedIncident?.kind === "convoy" &&
              typeof snapshot.message === "string" &&
              snapshot.message.toLowerCase().includes("kill zone")
            );
          },
          details: (snapshot) => {
            const focusedIncidentId = snapshot.frontline?.focusedIncidentId;
            const focusedIncident = (snapshot.frontline?.incidents ?? []).find((incident) => incident.id === focusedIncidentId);
            return `focused=${focusedIncident?.label ?? "n/a"}, kind=${focusedIncident?.kind ?? "n/a"}, message=${snapshot.message ?? "n/a"}`;
          }
        },
        {
          label: "pressure posture keeps the player on the berm and stripping fast",
          test: (snapshot) =>
            snapshot.map?.pressurePosture?.posture === "reinforcing" &&
            snapshot.map?.pressurePosture?.actionLabel === "Strip the kill zone fast" &&
            snapshot.map?.pressurePosture?.windowLabel === "Ammo cookoff live",
          details: (snapshot) =>
            `posture=${snapshot.map?.pressurePosture?.posture ?? "n/a"}, action=${snapshot.map?.pressurePosture?.actionLabel ?? "n/a"}, window=${snapshot.map?.pressurePosture?.windowLabel ?? "n/a"}`
        },
        {
          label: "operation flow treats the wreck lane as the live salvage commitment",
          test: (snapshot) =>
            snapshot.raid?.operationPhase === "commitment" &&
            snapshot.raid?.operationExitIntent === "profit" &&
            typeof snapshot.raid?.debriefPreview === "string" &&
            snapshot.raid.debriefPreview.toLowerCase().includes("kill zone"),
          details: (snapshot) =>
            `phase=${snapshot.raid?.operationPhase ?? "n/a"}, exitIntent=${snapshot.raid?.operationExitIntent ?? "n/a"}, detail=${snapshot.raid?.debriefPreview ?? "n/a"}`
        },
        {
          label: "the squad doctrine flips into the kill-zone strip package",
          test: (snapshot) =>
            snapshot.combat?.squadDoctrine?.title === "Kill zone strip package" &&
            Array.isArray(snapshot.combat?.squadDoctrine?.mates) &&
            snapshot.combat.squadDoctrine.mates.some((mate) => mate.roleLabel === "Berm lid") &&
            snapshot.combat.squadDoctrine.mates.some((mate) => mate.roleLabel === "Crate runner"),
          details: (snapshot) =>
            `title=${snapshot.combat?.squadDoctrine?.title ?? "n/a"}, roles=${Array.isArray(snapshot.combat?.squadDoctrine?.mates) ? snapshot.combat.squadDoctrine.mates.map((mate) => `${mate.name}:${mate.roleLabel}`).join(" || ") : "n/a"}`
        }
      ]
    };
  }

  if (macroId === "persistent-body-return") {
    return {
      description: "Validate that the persistent-body-return showcase turns remembered route debt into a deterministic route-echo proof slice.",
      checks: [
        {
          label: "raid phase remains live",
          test: (snapshot) => snapshot.phase === "raid",
          details: (snapshot) => `phase=${snapshot.phase}`
        },
        {
          label: "the route is framed as Yara's return debt",
          test: (snapshot) =>
            snapshot.frontline?.focusedIncidentId !== null &&
            typeof snapshot.message === "string" &&
            snapshot.message.toLowerCase().includes("yara") &&
            snapshot.message.toLowerCase().includes("remembered debt"),
          details: (snapshot) =>
            `focusedIncidentId=${snapshot.frontline?.focusedIncidentId ?? "n/a"}, message=${snapshot.message ?? "n/a"}`
        },
        {
          label: "an unrecovered Yara body is still live in the lane",
          test: (snapshot) =>
            Array.isArray(snapshot.raid?.fallenSquadBodies) &&
            snapshot.raid.fallenSquadBodies.some((body) => body.name === "Yara"),
          details: (snapshot) =>
            `fallenSquadBodies=${Array.isArray(snapshot.raid?.fallenSquadBodies) ? snapshot.raid.fallenSquadBodies.map((body) => body.name).join(" | ") : "n/a"}`
        },
        {
          label: "squad comms switch into route-echo language",
          test: (snapshot) =>
            snapshot.dialogue?.squadComms?.channel === "Route Echo" &&
            typeof snapshot.dialogue?.squadComms?.line === "string" &&
            snapshot.dialogue.squadComms.line.toLowerCase().includes("yara"),
          details: (snapshot) =>
            `channel=${snapshot.dialogue?.squadComms?.channel ?? "n/a"}, line=${snapshot.dialogue?.squadComms?.line ?? "n/a"}`
        },
        {
          label: "active squad dialogue carries left-behind memory tags",
          test: (snapshot) =>
            Array.isArray(snapshot.dialogue?.recentSquadEvents) &&
            snapshot.dialogue.recentSquadEvents.some(
              (event) => Array.isArray(event.memoryTags) && event.memoryTags.includes("mate-left-behind")
            ),
          details: (snapshot) =>
            `recentSquadMemoryTags=${Array.isArray(snapshot.dialogue?.recentSquadEvents) ? snapshot.dialogue.recentSquadEvents.map((event) => (Array.isArray(event.memoryTags) ? event.memoryTags.join("+") : "n/a")).join(" | ") : "n/a"}`
        },
        {
          label: "raid and roster memories both remember Yara being left behind",
          test: (snapshot) =>
            Array.isArray(snapshot.dialogue?.raidMemories) &&
            snapshot.dialogue.raidMemories.some(
              (mate) =>
                Array.isArray(mate.memories) &&
                mate.memories.some((memory) => memory.tag === "mate-left-behind" && memory.subjectName === "Yara")
            ) &&
            Array.isArray(snapshot.dialogue?.rosterMemories) &&
            snapshot.dialogue.rosterMemories.some(
              (mate) =>
                mate.name === "Yara" &&
                Array.isArray(mate.memories) &&
                mate.memories.some((memory) => memory.tag === "mate-left-behind")
            ),
          details: (snapshot) =>
            `raidMemories=${Array.isArray(snapshot.dialogue?.raidMemories) ? snapshot.dialogue.raidMemories.map((mate) => `${mate.name}:${mate.memories.map((memory) => `${memory.tag}:${memory.subjectName}`).join("/")}`).join(" | ") : "n/a"}, rosterMemories=${Array.isArray(snapshot.dialogue?.rosterMemories) ? snapshot.dialogue.rosterMemories.map((mate) => `${mate.name}:${mate.memories.map((memory) => memory.tag).join("/")}`).join(" | ") : "n/a"}`
        }
      ]
    };
  }

  if (macroId === "dialogue-aftermath") {
    return {
      description: "Validate that memorial actions now feed live raid dialogue memory instead of staying trapped on stash-side wall copy.",
      checks: [
        {
          label: "raid phase remains live",
          test: (snapshot) => snapshot.phase === "raid",
          details: (snapshot) => `phase=${snapshot.phase}`
        },
        {
          label: "raid memories carry both family-informed and wake-held aftermath",
          test: (snapshot) => {
            const memoryTags = new Set(
              (snapshot.dialogue?.raidMemories ?? []).flatMap((mate) => (mate.memories ?? []).map((memory) => memory.tag))
            );
            return memoryTags.has("family-informed") && memoryTags.has("wake-held");
          },
          details: (snapshot) =>
            `raidMemoryTags=${(snapshot.dialogue?.raidMemories ?? [])
              .flatMap((mate) => (mate.memories ?? []).map((memory) => `${mate.name}:${memory.tag}`))
              .join(" || ")}`
        },
        {
          label: "the staged squad event carries memorial aftermath tags",
          test: (snapshot) =>
            Array.isArray(snapshot.dialogue?.currentSquadEvent?.memoryTags) &&
            snapshot.dialogue.currentSquadEvent.memoryTags.includes("family-informed") &&
            snapshot.dialogue.currentSquadEvent.memoryTags.includes("wake-held"),
          details: (snapshot) =>
            `currentTags=${Array.isArray(snapshot.dialogue?.currentSquadEvent?.memoryTags) ? snapshot.dialogue.currentSquadEvent.memoryTags.join(" || ") : "n/a"}`
        },
        {
          label: "live squad comms speak in aftermath language",
          test: (snapshot) =>
            typeof snapshot.dialogue?.squadComms?.line === "string" &&
            snapshot.dialogue.squadComms.line.toLowerCase().includes("call home") &&
            snapshot.dialogue.squadComms.line.toLowerCase().includes("phone"),
          details: (snapshot) => `squadComms=${snapshot.dialogue?.squadComms?.line ?? "n/a"}`
        },
        {
          label: "the showcase message sells memorial carryover, not isolated wall flavor",
          test: (snapshot) =>
            typeof snapshot.message === "string" &&
            snapshot.message.toLowerCase().includes("live squad memories") &&
            snapshot.message.toLowerCase().includes("held the wake"),
          details: (snapshot) => `message=${snapshot.message ?? "n/a"}`
        }
      ]
    };
  }

  if (macroId === "field-coffee") {
    return {
      description: "Validate that the field-coffee showcase stages a quiet thermos reset with stable dialogue and a real warm-hands shove window.",
      checks: [
        {
          label: "raid phase remains live",
          test: (snapshot) => snapshot.phase === "raid",
          details: (snapshot) => `phase=${snapshot.phase}`
        },
        {
          label: "coffee-pocket read stays on the field thermos window",
          test: (snapshot) =>
            snapshot.raid?.coffeePocketRead?.title === "Warm reset live" &&
            snapshot.raid?.coffeePocketRead?.status === "Hold now",
          details: (snapshot) =>
            `title=${snapshot.raid?.coffeePocketRead?.title ?? "n/a"}, status=${snapshot.raid?.coffeePocketRead?.status ?? "n/a"}`
        },
        {
          label: "the player momentum read stays on Warm hands",
          test: (snapshot) =>
            snapshot.raid?.frontlineMomentum?.label === "Warm hands" &&
            typeof snapshot.raid?.frontlineMomentum?.summary === "string" &&
            snapshot.raid.frontlineMomentum.summary.toLowerCase().includes("thermos pocket"),
          details: (snapshot) =>
            `momentum=${snapshot.raid?.frontlineMomentum?.label ?? "n/a"}, summary=${snapshot.raid?.frontlineMomentum?.summary ?? "n/a"}`
        },
        {
          label: "the staged squad event is a coffee beat carrying recovered-body memory",
          test: (snapshot) =>
            snapshot.dialogue?.currentSquadEvent?.kind === "coffee" &&
            Array.isArray(snapshot.dialogue?.currentSquadEvent?.memoryTags) &&
            snapshot.dialogue.currentSquadEvent.memoryTags.includes("mate-recovered"),
          details: (snapshot) =>
            `kind=${snapshot.dialogue?.currentSquadEvent?.kind ?? "n/a"}, tags=${Array.isArray(snapshot.dialogue?.currentSquadEvent?.memoryTags) ? snapshot.dialogue.currentSquadEvent.memoryTags.join(" || ") : "n/a"}`
        },
        {
          label: "live comms sell the quiet-body-return contrast",
          test: (snapshot) =>
            typeof snapshot.dialogue?.squadComms?.line === "string" &&
            snapshot.dialogue.squadComms.line.toLowerCase().includes("hot coffee") &&
            snapshot.dialogue.squadComms.line.toLowerCase().includes("tags home"),
          details: (snapshot) => `squadComms=${snapshot.dialogue?.squadComms?.line ?? "n/a"}`
        },
        {
          label: "the showcase message frames the thermos reset explicitly",
          test: (snapshot) =>
            typeof snapshot.message === "string" &&
            snapshot.message.toLowerCase().includes("found thermos pocket") &&
            snapshot.message.toLowerCase().includes("warm-hands reset"),
          details: (snapshot) => `message=${snapshot.message ?? "n/a"}`
        }
      ]
    };
  }

  if (macroId === "burner-coffee") {
    return {
      description: "Validate that the burner-coffee showcase stages a trench brew pocket with stable quiet-life dialogue and one longer shove window.",
      checks: [
        {
          label: "raid phase remains live",
          test: (snapshot) => snapshot.phase === "raid",
          details: (snapshot) => `phase=${snapshot.phase}`
        },
        {
          label: "coffee-pocket read stays on the burner hold window",
          test: (snapshot) =>
            snapshot.raid?.coffeePocketRead?.title === "Burner pocket live" &&
            snapshot.raid?.coffeePocketRead?.status === "Hold now",
          details: (snapshot) =>
            `title=${snapshot.raid?.coffeePocketRead?.title ?? "n/a"}, status=${snapshot.raid?.coffeePocketRead?.status ?? "n/a"}`
        },
        {
          label: "the player momentum read stays on Burner rush",
          test: (snapshot) =>
            snapshot.raid?.frontlineMomentum?.label === "Burner rush" &&
            typeof snapshot.raid?.frontlineMomentum?.summary === "string" &&
            snapshot.raid.frontlineMomentum.summary.toLowerCase().includes("hot trench coffee"),
          details: (snapshot) =>
            `momentum=${snapshot.raid?.frontlineMomentum?.label ?? "n/a"}, summary=${snapshot.raid?.frontlineMomentum?.summary ?? "n/a"}`
        },
        {
          label: "the staged squad event is a coffee beat carrying family-call memory",
          test: (snapshot) =>
            snapshot.dialogue?.currentSquadEvent?.kind === "coffee" &&
            Array.isArray(snapshot.dialogue?.currentSquadEvent?.memoryTags) &&
            snapshot.dialogue.currentSquadEvent.memoryTags.includes("family-informed"),
          details: (snapshot) =>
            `kind=${snapshot.dialogue?.currentSquadEvent?.kind ?? "n/a"}, tags=${Array.isArray(snapshot.dialogue?.currentSquadEvent?.memoryTags) ? snapshot.dialogue.currentSquadEvent.memoryTags.join(" || ") : "n/a"}`
        },
        {
          label: "live comms sell the burner pocket as brief calm before more grief",
          test: (snapshot) =>
            typeof snapshot.dialogue?.squadComms?.line === "string" &&
            snapshot.dialogue.squadComms.line.toLowerCase().includes("phones are quiet") &&
            snapshot.dialogue.squadComms.line.toLowerCase().includes("never lasts"),
          details: (snapshot) => `squadComms=${snapshot.dialogue?.squadComms?.line ?? "n/a"}`
        },
        {
          label: "the showcase message frames the trench brew pocket explicitly",
          test: (snapshot) =>
            typeof snapshot.message === "string" &&
            snapshot.message.toLowerCase().includes("trench brew pocket") &&
            snapshot.message.toLowerCase().includes("longer shove window"),
          details: (snapshot) => `message=${snapshot.message ?? "n/a"}`
        }
      ]
    };
  }

  if (macroId === "surrender-window") {
    return {
      description: "Validate that the surrender-window showcase stages a routed pocket that can be secured as a readable reclaim instead of slipping back into a generic firefight.",
      checks: [
        {
          label: "raid phase remains live",
          test: (snapshot) => snapshot.phase === "raid",
          details: (snapshot) => `phase=${snapshot.phase}`
        },
        {
          label: "pressure posture stays on a surrendering lane",
          test: (snapshot) =>
            snapshot.map?.pressurePosture?.posture === "surrendering" &&
            snapshot.map?.pressurePosture?.actionLabel === "Close the surrender pocket",
          details: (snapshot) =>
            `posture=${snapshot.map?.pressurePosture?.posture ?? "n/a"}, action=${snapshot.map?.pressurePosture?.actionLabel ?? "n/a"}`
        },
        {
          label: "the settlement read points at a live surrender scar",
          test: (snapshot) =>
            snapshot.map?.settlement?.label === "Customs Quay" &&
            Array.isArray(snapshot.map?.settlement?.memoryTags) &&
            snapshot.map.settlement.memoryTags.includes("surrender-pocket") &&
            typeof snapshot.map?.settlement?.tacticalPlan === "string" &&
            snapshot.map.settlement.tacticalPlan.toLowerCase().includes("finish the planted scar"),
          details: (snapshot) =>
            `settlement=${snapshot.map?.settlement?.label ?? "n/a"}, memoryTags=${Array.isArray(snapshot.map?.settlement?.memoryTags) ? snapshot.map.settlement.memoryTags.join(",") : "n/a"}, tacticalPlan=${snapshot.map?.settlement?.tacticalPlan ?? "n/a"}`
        },
        {
          label: "the focused incident is a routed secure-intel pocket",
          test: (snapshot) => {
            const focusedIncidentId = snapshot.frontline?.focusedIncidentId;
            const focusedIncident = (snapshot.frontline?.incidents ?? []).find(
              (incident) => incident.id === focusedIncidentId
            );
            return (
              focusedIncident?.kind === "firefight" &&
              focusedIncident?.status === "routed" &&
              focusedIncident?.actionVerb === "secure" &&
              typeof focusedIncident?.opportunityLabel === "string" &&
              focusedIncident.opportunityLabel.toLowerCase().includes("route intel") &&
              focusedIncident?.markerState === "raising" &&
              focusedIncident?.territoryState === "reclaimed"
            );
          },
          details: (snapshot) =>
            (() => {
              const focusedIncidentId = snapshot.frontline?.focusedIncidentId;
              const focusedIncident = (snapshot.frontline?.incidents ?? []).find(
                (incident) => incident.id === focusedIncidentId
              );
              return `focused=${focusedIncident?.label ?? "n/a"}, kind=${focusedIncident?.kind ?? "n/a"}, status=${focusedIncident?.status ?? "n/a"}, verb=${focusedIncident?.actionVerb ?? "n/a"}, opportunity=${focusedIncident?.opportunityLabel ?? "n/a"}, marker=${focusedIncident?.markerState ?? "n/a"}, territory=${focusedIncident?.territoryState ?? "n/a"}`;
            })()
        },
        {
          label: "the wider lane still carries convoy and casualty pressure behind the surrender",
          test: (snapshot) =>
            Array.isArray(snapshot.frontline?.incidents) &&
            snapshot.frontline.incidents.some(
              (incident) => incident.kind === "convoy" && incident.status === "extracting"
            ) &&
            snapshot.frontline.incidents.some(
              (incident) => incident.kind === "casualty" && incident.actionVerb === "recover"
            ),
          details: (snapshot) =>
            `incidents=${Array.isArray(snapshot.frontline?.incidents) ? snapshot.frontline.incidents.map((incident) => `${incident.label}:${incident.kind}/${incident.status}/${incident.actionVerb}`).join(" || ") : "n/a"}`
        },
        {
          label: "the raid copy still teaches secure-then-leave discipline",
          test: (snapshot) =>
            typeof snapshot.message === "string" &&
            snapshot.message.toLowerCase().includes("route intel") &&
            typeof snapshot.raid?.debriefPreview === "string" &&
            snapshot.raid.debriefPreview.toLowerCase().includes("claim is left half-finished"),
          details: (snapshot) =>
            `message=${snapshot.message ?? "n/a"}, debriefPreview=${snapshot.raid?.debriefPreview ?? "n/a"}`
        }
      ]
    };
  }

  if (macroId === "territory-claims") {
    return {
      description: "Validate that the territory-claims showcase keeps one live flag team, one planted hold, and one dead strip readable in the same return-state slice.",
      checks: [
        {
          label: "raid phase remains live",
          test: (snapshot) => snapshot.phase === "raid",
          details: (snapshot) => `phase=${snapshot.phase}`
        },
        {
          label: "settlement state stays in a breaking reclaim read",
          test: (snapshot) =>
            snapshot.map?.settlement?.volatility === "breaking" &&
            typeof snapshot.map?.settlement?.shiftReason === "string" &&
            snapshot.map.settlement.shiftReason.length > 0,
          details: (snapshot) =>
            `volatility=${snapshot.map?.settlement?.volatility ?? "n/a"}, shiftReason=${snapshot.map?.settlement?.shiftReason ?? "n/a"}`
        },
        {
          label: "scar markers cover planted, breaking, and recovered states together",
          test: (snapshot) => {
            const incidents = snapshot.frontline?.incidents ?? [];
            const hasPlanted = incidents.some((incident) => incident.markerState === "planted");
            const hasBreaking = incidents.some(
              (incident) => incident.markerState === "raising" || incident.territoryState === "breaking"
            );
            const hasRecovered = incidents.some(
              (incident) => incident.markerState === "bagged" || incident.territoryState === "lost"
            );
            return hasPlanted && hasBreaking && hasRecovered;
          },
          details: (snapshot) => {
            const incidents = snapshot.frontline?.incidents ?? [];
            const markerSummary = incidents
              .filter(
                (incident) =>
                  incident.markerState !== "none" ||
                  incident.territoryState === "breaking" ||
                  incident.territoryState === "reclaimed" ||
                  incident.territoryState === "lost"
              )
              .map((incident) => `${incident.label}:${incident.markerState}/${incident.territoryState}`)
              .join(" || ");
            return `markers=${markerSummary || "n/a"}`;
          }
        },
        {
          label: "the live flag team stays on a planting war beat",
          test: (snapshot) => {
            const focusedIncidentId = snapshot.frontline?.focusedIncidentId;
            const focusedIncident = (snapshot.frontline?.incidents ?? []).find(
              (incident) => incident.id === focusedIncidentId
            );
            return (
              focusedIncident?.actionVerb === "plant" &&
              focusedIncident?.resolved === false &&
              typeof focusedIncident?.opportunityLabel === "string" &&
              focusedIncident.opportunityLabel.length > 0
            );
          },
          details: (snapshot) =>
            (() => {
              const focusedIncidentId = snapshot.frontline?.focusedIncidentId;
              const focusedIncident = (snapshot.frontline?.incidents ?? []).find(
                (incident) => incident.id === focusedIncidentId
              );
              return `focused=${focusedIncident?.label ?? "n/a"}, verb=${focusedIncident?.actionVerb ?? "n/a"}, opportunity=${focusedIncident?.opportunityLabel ?? "n/a"}, resolved=${focusedIncident?.resolved ?? "n/a"}`;
            })()
        },
        {
          label: "the return-state memory tags reflect the mixed scar outcome",
          test: (snapshot) => {
            const tags = snapshot.map?.settlement?.memoryTags ?? [];
            return tags.includes("flag-planted") && tags.includes("body-recovered") && tags.includes("claim-breaking");
          },
          details: (snapshot) =>
            `memoryTags=${Array.isArray(snapshot.map?.settlement?.memoryTags) ? snapshot.map.settlement.memoryTags.join(",") : "n/a"}`
        }
      ]
    };
  }

  if (macroId === "hardcore-start") {
    return {
      description: "Validate that the hardcore-start showcase really stages a poor conscript baseline instead of a normal ready-to-deploy stash.",
      checks: [
        {
          label: "stash phase is active",
          test: (snapshot) => snapshot.phase === "stash",
          details: (snapshot) => `phase=${snapshot.phase}`
        },
        {
          label: "no primary is staged",
          test: (snapshot) => snapshot.stash?.selectedWeapon === "none",
          details: (snapshot) => `selectedWeapon=${snapshot.stash?.selectedWeapon ?? "n/a"}`
        },
        {
          label: "the wall cannot currently fund deployment",
          test: (snapshot) =>
            snapshot.stash?.canStartRaid === false &&
            typeof snapshot.stash?.credits === "number" &&
            typeof snapshot.stash?.deploymentCost === "number" &&
            snapshot.stash.credits < snapshot.stash.deploymentCost,
          details: (snapshot) =>
            `canStartRaid=${snapshot.stash?.canStartRaid ?? "n/a"}, credits=${snapshot.stash?.credits ?? "n/a"}, deploymentCost=${snapshot.stash?.deploymentCost ?? "n/a"}`
        },
        {
          label: "medical and ammo prep is exhausted",
          test: (snapshot) =>
            snapshot.stash?.supplies?.medkits === 0 &&
            snapshot.stash?.supplies?.ammoPacks === 0 &&
            snapshot.stash?.prepLoadout?.medkits === 0 &&
            snapshot.stash?.prepLoadout?.ammoPacks === 0,
          details: (snapshot) =>
            `supplies=${snapshot.stash?.supplies?.medkits ?? "n/a"}/${snapshot.stash?.supplies?.ammoPacks ?? "n/a"}, prep=${snapshot.stash?.prepLoadout?.medkits ?? "n/a"}/${snapshot.stash?.prepLoadout?.ammoPacks ?? "n/a"}`
        },
        {
          label: "the message still reads like survival-first hardship",
          test: (snapshot) =>
            typeof snapshot.message === "string" &&
            snapshot.message.toLowerCase().includes("conscript survival"),
          details: (snapshot) => `message=${snapshot.message ?? "n/a"}`
        }
      ]
    };
  }

  if (macroId === "first-session-hook") {
    return {
      description: "Validate that the default product opener now points the player at one clean first run with a readable route, loadout, and tactical teaching path.",
      checks: [
        {
          label: "stash phase is active on a fresh board",
          test: (snapshot) => snapshot.phase === "stash" && Array.isArray(snapshot.stash?.replacementSeats),
          details: (snapshot) => `phase=${snapshot.phase}, replacements=${snapshot.stash?.replacementSeats?.length ?? "n/a"}`
        },
        {
          label: "the first-session read is active and aligned to Broken Signal",
          test: (snapshot) =>
            snapshot.stash?.firstSession?.active === true &&
            snapshot.stash.firstSession.routeId === "broken-signal" &&
            snapshot.route?.id === "broken-signal",
          details: (snapshot) =>
            `active=${snapshot.stash?.firstSession?.active ?? "n/a"}, recommendedRoute=${snapshot.stash?.firstSession?.routeId ?? "n/a"}, activeRoute=${snapshot.route?.id ?? "n/a"}`
        },
        {
          label: "the default loadout matches the scripted opener",
          test: (snapshot) =>
            snapshot.stash?.selectedWeapon === "rifle" &&
            snapshot.stash?.selectedTacticalService === "signal-jammer" &&
            snapshot.stash?.firstSession?.recommendedWeaponId === "rifle" &&
            snapshot.stash?.firstSession?.recommendedTacticalServiceId === "signal-jammer" &&
            snapshot.stash?.firstSession?.selectionAligned === true,
          details: (snapshot) =>
            `weapon=${snapshot.stash?.selectedWeapon ?? "n/a"}, support=${snapshot.stash?.selectedTacticalService ?? "n/a"}, aligned=${snapshot.stash?.firstSession?.selectionAligned ?? "n/a"}`
        },
        {
          label: "the opener teaches ingress, PKM lane, building clear, and extract in one read",
          test: (snapshot) => {
            const beats = snapshot.stash?.firstSession?.teachingBeats ?? [];
            return (
              beats.some((beat) => typeof beat === "string" && beat.toLowerCase().includes("quiet ingress")) &&
              beats.some((beat) => typeof beat === "string" && beat.toLowerCase().includes("pkm")) &&
              beats.some((beat) => typeof beat === "string" && beat.toLowerCase().includes("occupied building")) &&
              beats.some((beat) => typeof beat === "string" && beat.toLowerCase().includes("room-clear")) &&
              beats.some((beat) => typeof beat === "string" && beat.toLowerCase().includes("extract"))
            );
          },
          details: (snapshot) =>
            `beats=${Array.isArray(snapshot.stash?.firstSession?.teachingBeats) ? snapshot.stash.firstSession.teachingBeats.join(" || ") : "n/a"}`
        },
        {
          label: "the route already contains a real must-own structure for the first clear",
          test: (snapshot) =>
            typeof snapshot.route?.buildingOccupation?.mustOwnCount === "number" &&
            snapshot.route.buildingOccupation.mustOwnCount >= 1 &&
            typeof snapshot.stash?.firstSession?.targetBuildingLabel === "string" &&
            snapshot.stash.firstSession.targetBuildingLabel.length > 0,
          details: (snapshot) =>
            `mustOwn=${snapshot.route?.buildingOccupation?.mustOwnCount ?? "n/a"}, targetBuilding=${snapshot.stash?.firstSession?.targetBuildingLabel ?? "n/a"}`
        },
        {
          label: "the opening already carries one memorable sentence and a reason for the next raid",
          test: (snapshot) =>
            typeof snapshot.stash?.firstSession?.memorableLine === "string" &&
            snapshot.stash.firstSession.memorableLine.toLowerCase().includes("clear") &&
            typeof snapshot.stash?.firstSession?.nextRunReason === "string" &&
            snapshot.stash.firstSession.nextRunReason.length > 0,
          details: (snapshot) =>
            `memorable=${snapshot.stash?.firstSession?.memorableLine ?? "n/a"}, nextRunReason=${snapshot.stash?.firstSession?.nextRunReason ?? "n/a"}`
        }
      ]
    };
  }

  if (macroId === "route-identity-pass") {
    return {
      description: "Validate that the three core routes now read like distinct operations instead of one map family with different labels.",
      checks: [
        {
          label: "the snapshot publishes route identities for all three core routes",
          test: (snapshot) =>
            Array.isArray(snapshot.options?.routeIdentities) &&
            snapshot.options.routeIdentities.length >= 3 &&
            ["broken-signal", "sundered-run", "crosswind-docks"].every((routeId) =>
              snapshot.options.routeIdentities.some((entry) => entry.routeId === routeId)
            ),
          details: (snapshot) =>
            `routeIdentities=${Array.isArray(snapshot.options?.routeIdentities) ? snapshot.options.routeIdentities.map((entry) => `${entry.routeId}:${entry.identityLabel}`).join(" || ") : "n/a"}`
        },
        {
          label: "Broken Signal reads as a relay-house room-clear operation",
          test: (snapshot) =>
            Array.isArray(snapshot.options?.routeIdentities) &&
            snapshot.options.routeIdentities.some(
              (entry) =>
                entry.routeId === "broken-signal" &&
                /relay|room clear/i.test(entry.identityLabel) &&
                typeof entry.landmarkSummary === "string" &&
                /dish|uplink|cellar/i.test(entry.landmarkSummary)
            ),
          details: (snapshot) =>
            `${Array.isArray(snapshot.options?.routeIdentities) ? snapshot.options.routeIdentities.filter((entry) => entry.routeId === "broken-signal").map((entry) => `${entry.identityLabel} :: ${entry.landmarkSummary}`).join(" || ") : "n/a"}`
        },
        {
          label: "Sundered Run reads as a trench-and-bunker grind",
          test: (snapshot) =>
            Array.isArray(snapshot.options?.routeIdentities) &&
            snapshot.options.routeIdentities.some(
              (entry) =>
                entry.routeId === "sundered-run" &&
                /trench|bunker/i.test(entry.identityLabel) &&
                typeof entry.landmarkSummary === "string" &&
                /med lane|underpass|mortar/i.test(entry.landmarkSummary.toLowerCase())
            ),
          details: (snapshot) =>
            `${Array.isArray(snapshot.options?.routeIdentities) ? snapshot.options.routeIdentities.filter((entry) => entry.routeId === "sundered-run").map((entry) => `${entry.identityLabel} :: ${entry.landmarkSummary}`).join(" || ") : "n/a"}`
        },
        {
          label: "Crosswind Docks reads as a crossing-and-peel route",
          test: (snapshot) =>
            Array.isArray(snapshot.options?.routeIdentities) &&
            snapshot.options.routeIdentities.some(
              (entry) =>
                entry.routeId === "crosswind-docks" &&
                /dock|peel|crossing/i.test(entry.identityLabel) &&
                typeof entry.landmarkSummary === "string" &&
                /crane|dock|lift/i.test(entry.landmarkSummary.toLowerCase())
            ),
          details: (snapshot) =>
            `${Array.isArray(snapshot.options?.routeIdentities) ? snapshot.options.routeIdentities.filter((entry) => entry.routeId === "crosswind-docks").map((entry) => `${entry.identityLabel} :: ${entry.landmarkSummary}`).join(" || ") : "n/a"}`
        },
        {
          label: "the active route exposes the same route-identity read in the main snapshot",
          test: (snapshot) =>
            snapshot.route?.id === "broken-signal" &&
            typeof snapshot.route?.routeIdentity?.identityLabel === "string" &&
            /relay|room clear/i.test(snapshot.route.routeIdentity.identityLabel) &&
            typeof snapshot.route?.routeIdentity?.doctrineCall === "string" &&
            snapshot.route.routeIdentity.doctrineCall.length > 0,
          details: (snapshot) =>
            `activeRoute=${snapshot.route?.id ?? "n/a"}, identity=${snapshot.route?.routeIdentity?.identityLabel ?? "n/a"}, doctrine=${snapshot.route?.routeIdentity?.doctrineCall ?? "n/a"}`
        }
      ]
    };
  }

  if (macroId === "must-clear-structure-pass") {
    return {
      description: "Validate that the three product routes now expose explicit must-clear structures with tactical reads instead of relying on generic route flavor.",
      checks: [
        {
          label: "the route identity catalog exposes three must-clear structures for each core route",
          test: (snapshot) =>
            Array.isArray(snapshot.options?.routeIdentities) &&
            ["broken-signal", "sundered-run", "crosswind-docks"].every((routeId) => {
              const entry = snapshot.options.routeIdentities.find((candidate) => candidate.routeId === routeId);
              return Array.isArray(entry?.mustClearStructures) && entry.mustClearStructures.length >= 3;
            }),
          details: (snapshot) =>
            `mustClearCounts=${Array.isArray(snapshot.options?.routeIdentities) ? snapshot.options.routeIdentities.map((entry) => `${entry.routeId}:${Array.isArray(entry.mustClearStructures) ? entry.mustClearStructures.length : 0}`).join(" || ") : "n/a"}`
        },
        {
          label: "Broken Signal names threshold, PKM lane, and cellar problems directly",
          test: (snapshot) => {
            const entry = Array.isArray(snapshot.options?.routeIdentities)
              ? snapshot.options.routeIdentities.find((candidate) => candidate.routeId === "broken-signal")
              : null;
            const structures = Array.isArray(entry?.mustClearStructures) ? entry.mustClearStructures : [];
            return (
              structures.some((candidate) => /dish houses/i.test(candidate.label) && /threshold/i.test(candidate.tacticalRead)) &&
              structures.some((candidate) => /uplink yard/i.test(candidate.label) && /pkm/i.test(candidate.tacticalRead.toLowerCase())) &&
              structures.some((candidate) => /relay cellar/i.test(candidate.label) && /cellar/i.test(candidate.tacticalRead.toLowerCase()))
            );
          },
          details: (snapshot) =>
            `${Array.isArray(snapshot.options?.routeIdentities) ? snapshot.options.routeIdentities.filter((entry) => entry.routeId === "broken-signal").map((entry) => `${entry.mustClearSummary}`).join(" || ") : "n/a"}`
        },
        {
          label: "Sundered Run now carries authored clinic, trench, and underpass structures",
          test: (snapshot) => {
            const entry = Array.isArray(snapshot.options?.routeIdentities)
              ? snapshot.options.routeIdentities.find((candidate) => candidate.routeId === "sundered-run")
              : null;
            const structures = Array.isArray(entry?.mustClearStructures) ? entry.mustClearStructures : [];
            return (
              structures.some((candidate) => /clinic row/i.test(candidate.label) && /back-room/i.test(candidate.tacticalRead.toLowerCase())) &&
              structures.some((candidate) => /med lane trench/i.test(candidate.label) && /trench-entry denial/i.test(candidate.tacticalRead.toLowerCase())) &&
              structures.some((candidate) => /underpass strongpoint/i.test(candidate.label) && /bunker mouth/i.test(candidate.tacticalRead.toLowerCase()))
            );
          },
          details: (snapshot) =>
            `${Array.isArray(snapshot.options?.routeIdentities) ? snapshot.options.routeIdentities.filter((entry) => entry.routeId === "sundered-run").map((entry) => `${entry.mustClearSummary} :: mustOwn=${entry.mustOwnCount}`).join(" || ") : "n/a"}`
        },
        {
          label: "the active route snapshot publishes the same must-clear structure read",
          test: (snapshot) =>
            snapshot.route?.id === "broken-signal" &&
            typeof snapshot.route?.routeIdentity?.mustClearSummary === "string" &&
            Array.isArray(snapshot.route?.routeIdentity?.mustClearStructures) &&
            snapshot.route.routeIdentity.mustClearStructures.length >= 3 &&
            snapshot.route.routeIdentity.mustClearStructures.some(
              (entry) => /relay cellar/i.test(entry.label) && typeof entry.solveCall === "string" && entry.solveCall.length > 0
            ),
          details: (snapshot) =>
            `activeRoute=${snapshot.route?.id ?? "n/a"}, mustClear=${snapshot.route?.routeIdentity?.mustClearSummary ?? "n/a"}`
        }
      ]
    };
  }

  if (macroId === "stash-consequence-pass") {
    return {
      description: "Validate that the stash now answers what came home, what was lost, what changed, and what the next route or doctrine call should be.",
      checks: [
        {
          label: "the showcase lands in stash with a consolidated consequence read",
          test: (snapshot) =>
            snapshot.phase === "stash" &&
            typeof snapshot.stash?.consequenceRead?.title === "string" &&
            snapshot.stash.consequenceRead.title.length > 0,
          details: (snapshot) =>
            `phase=${snapshot.phase}, title=${snapshot.stash?.consequenceRead?.title ?? "n/a"}`
        },
        {
          label: "the stash consequence read answers brought home, lost, changed, and next call directly",
          test: (snapshot) =>
            typeof snapshot.stash?.consequenceRead?.broughtHome === "string" &&
            snapshot.stash.consequenceRead.broughtHome.length > 0 &&
            typeof snapshot.stash?.consequenceRead?.lost === "string" &&
            snapshot.stash.consequenceRead.lost.length > 0 &&
            typeof snapshot.stash?.consequenceRead?.changed === "string" &&
            snapshot.stash.consequenceRead.changed.length > 0 &&
            typeof snapshot.stash?.consequenceRead?.nextCall === "string" &&
            snapshot.stash.consequenceRead.nextCall.length > 0,
          details: (snapshot) =>
            `home=${snapshot.stash?.consequenceRead?.broughtHome ?? "n/a"} || lost=${snapshot.stash?.consequenceRead?.lost ?? "n/a"} || changed=${snapshot.stash?.consequenceRead?.changed ?? "n/a"} || next=${snapshot.stash?.consequenceRead?.nextCall ?? "n/a"}`
        },
        {
          label: "the staged handoff debt is visible in the lost and changed reads",
          test: (snapshot) =>
            /missing|family|chair|wall/i.test(snapshot.stash?.consequenceRead?.lost ?? "") &&
            /chair|family|wake|wall/i.test(snapshot.stash?.consequenceRead?.changed ?? ""),
          details: (snapshot) =>
            `lost=${snapshot.stash?.consequenceRead?.lost ?? "n/a"} || changed=${snapshot.stash?.consequenceRead?.changed ?? "n/a"}`
        },
        {
          label: "the consequence read still points at a real route and doctrine for the next run",
          test: (snapshot) =>
            typeof snapshot.stash?.consequenceRead?.recommendedRouteId === "string" &&
            snapshot.stash.consequenceRead.recommendedRouteId.length > 0 &&
            typeof snapshot.stash?.consequenceRead?.doctrineCall === "string" &&
            snapshot.stash.consequenceRead.doctrineCall.length > 0,
          details: (snapshot) =>
            `route=${snapshot.stash?.consequenceRead?.recommendedRouteId ?? "n/a"} || doctrine=${snapshot.stash?.consequenceRead?.doctrineCall ?? "n/a"}`
        },
        {
          label: "the same consequence read is exported under lastRaidSummary for debrief consumers",
          test: (snapshot) =>
            typeof snapshot.lastRaidSummary?.consequenceRead?.title === "string" &&
            snapshot.lastRaidSummary.consequenceRead.title === snapshot.stash?.consequenceRead?.title,
          details: (snapshot) =>
            `stash=${snapshot.stash?.consequenceRead?.title ?? "n/a"} || lastRaid=${snapshot.lastRaidSummary?.consequenceRead?.title ?? "n/a"}`
        }
      ]
    };
  }

  if (macroId === "weapon-doctrine") {
    return {
      description: "Validate that the weapon-doctrine showcase stages the PKM as a real route-owned support plan with a matching squad package.",
      checks: [
        {
          label: "stash phase is active",
          test: (snapshot) => snapshot.phase === "stash",
          details: (snapshot) => `phase=${snapshot.phase}`
        },
        {
          label: "the PKM is the staged primary",
          test: (snapshot) =>
            snapshot.stash?.selectedWeapon === "pkm" &&
            snapshot.combat?.startingHardship?.primaryWeaponId === "pkm",
          details: (snapshot) =>
            `selectedWeapon=${snapshot.stash?.selectedWeapon ?? "n/a"}, hardshipPrimary=${snapshot.combat?.startingHardship?.primaryWeaponId ?? "n/a"}`
        },
        {
          label: "Broken Signal is the active route with the dish-house block live",
          test: (snapshot) =>
            snapshot.route?.id === "broken-signal" &&
            snapshot.map?.settlement?.label === "Relay Hamlet" &&
            snapshot.map?.activeSubzone?.label === "Dish Houses",
          details: (snapshot) =>
            `route=${snapshot.route?.id ?? "n/a"}, settlement=${snapshot.map?.settlement?.label ?? "n/a"}, subzone=${snapshot.map?.activeSubzone?.label ?? "n/a"}`
        },
        {
          label: "weapon doctrine reads as a route-owned PKM plan",
          test: (snapshot) =>
            snapshot.combat?.weaponDoctrine?.fitLabel === "Route-owned" &&
            typeof snapshot.combat?.weaponDoctrine?.title === "string" &&
            snapshot.combat.weaponDoctrine.title.includes("PKM Support Gun") &&
            typeof snapshot.combat?.weaponDoctrine?.primarySpace === "string" &&
            snapshot.combat.weaponDoctrine.primarySpace.toLowerCase().includes("crossing") &&
            typeof snapshot.combat?.weaponDoctrine?.failureSpace === "string" &&
            snapshot.combat.weaponDoctrine.failureSpace.toLowerCase().includes("reload"),
          details: (snapshot) =>
            `title=${snapshot.combat?.weaponDoctrine?.title ?? "n/a"}, primarySpace=${snapshot.combat?.weaponDoctrine?.primarySpace ?? "n/a"}, failureSpace=${snapshot.combat?.weaponDoctrine?.failureSpace ?? "n/a"}`
        },
        {
          label: "the squad package is built around belt-led crossing support",
          test: (snapshot) =>
            snapshot.combat?.squadDoctrine?.title === "Belt-led crossing package" &&
            Array.isArray(snapshot.combat?.squadDoctrine?.tags) &&
            snapshot.combat.squadDoctrine.tags.some((tag) => tag.includes("PKM Support Gun")) &&
            snapshot.combat.squadDoctrine.tags.some((tag) => tag.includes("Angle hold")) &&
            snapshot.combat.squadDoctrine.tags.some((tag) => tag.includes("Collapse runner")),
          details: (snapshot) =>
            `squadDoctrineTitle=${snapshot.combat?.squadDoctrine?.title ?? "n/a"}, tags=${Array.isArray(snapshot.combat?.squadDoctrine?.tags) ? snapshot.combat.squadDoctrine.tags.join(" || ") : "n/a"}`
        },
        {
          label: "the showcase copy still sells lane-denial doctrine",
          test: (snapshot) =>
            typeof snapshot.message === "string" &&
            snapshot.message.toLowerCase().includes("pkm-led support plan") &&
            snapshot.message.toLowerCase().includes("lane denial"),
          details: (snapshot) => `message=${snapshot.message ?? "n/a"}`
        }
      ]
    };
  }

  if (macroId === "dish-house-breach") {
    return {
      description: "Validate that the dish-house-breach showcase turns Broken Signal into a real SMG-led room flood with a shotgun corner break and one outside yard lid.",
      checks: [
        {
          label: "raid phase is active",
          test: (snapshot) => snapshot.phase === "raid",
          details: (snapshot) => `phase=${snapshot.phase}`
        },
        {
          label: "Broken Signal stages the relay block room-fight",
          test: (snapshot) =>
            snapshot.route?.id === "broken-signal" &&
            snapshot.map?.settlement?.label === "Relay Hamlet" &&
            snapshot.map?.activeSubzone?.label === "Dish Houses",
          details: (snapshot) =>
            `route=${snapshot.route?.id ?? "n/a"}, settlement=${snapshot.map?.settlement?.label ?? "n/a"}, subzone=${snapshot.map?.activeSubzone?.label ?? "n/a"}`
        },
        {
          label: "the player is carrying the SMG as the room-flood tool",
          test: (snapshot) =>
            snapshot.raid?.player?.weaponId === "smg" &&
            snapshot.combat?.weaponDoctrine?.fitLabel === "Route-owned" &&
            typeof snapshot.combat?.weaponDoctrine?.primarySpace === "string" &&
            snapshot.combat.weaponDoctrine.primarySpace.toLowerCase().includes("tight relay rooms"),
          details: (snapshot) =>
            `playerWeapon=${snapshot.raid?.player?.weaponId ?? "n/a"}, fitLabel=${snapshot.combat?.weaponDoctrine?.fitLabel ?? "n/a"}, primarySpace=${snapshot.combat?.weaponDoctrine?.primarySpace ?? "n/a"}`
        },
        {
          label: "the squad doctrine reads as a dedicated room flood package",
          test: (snapshot) =>
            snapshot.combat?.squadDoctrine?.title === "Room flood package" &&
            Array.isArray(snapshot.combat?.squadDoctrine?.tags) &&
            snapshot.combat.squadDoctrine.tags.some((tag) => tag.includes("Flood // Dish house breach")) &&
            snapshot.combat.squadDoctrine.tags.some((tag) => tag.includes("Sub-zone // Dish Houses")),
          details: (snapshot) =>
            `title=${snapshot.combat?.squadDoctrine?.title ?? "n/a"}, tags=${Array.isArray(snapshot.combat?.squadDoctrine?.tags) ? snapshot.combat.squadDoctrine.tags.join(" || ") : "n/a"}`
        },
        {
          label: "the room-fight roles clearly split inside flood versus outside lid",
          test: (snapshot) =>
            Array.isArray(snapshot.raid?.squadMates) &&
            snapshot.raid.squadMates.some((mate) => mate.doctrine?.roleLabel === "Room flood") &&
            snapshot.raid.squadMates.some((mate) => mate.doctrine?.roleLabel === "Door breaker") &&
            snapshot.raid.squadMates.some((mate) => mate.doctrine?.roleLabel === "Yard lid"),
          details: (snapshot) =>
            `roles=${Array.isArray(snapshot.raid?.squadMates) ? snapshot.raid.squadMates.map((mate) => `${mate.name}:${mate.doctrine?.roleLabel ?? "n/a"}`).join(" | ") : "n/a"}`
        },
        {
          label: "hostiles expose a readable four-role squad instead of only independent bodies",
          test: (snapshot) =>
            Array.isArray(snapshot.raid?.enemySquads) &&
            snapshot.raid.enemySquads.some(
              (squad) =>
                Array.isArray(squad.roles) &&
                ["support-gunner", "anchor-rifle", "probe-rifle", "deep-rifle"].every((role) => squad.roles.includes(role)) &&
                Array.isArray(squad.members) &&
                squad.members.some((member) => member.squadRole === "support-gunner" && member.weaponId === "pkm")
            ) &&
            Array.isArray(snapshot.raid?.enemies) &&
            snapshot.raid.enemies.some((enemy) => typeof enemy.squadRole === "string" && typeof enemy.squadId === "string"),
          details: (snapshot) =>
            `enemySquads=${Array.isArray(snapshot.raid?.enemySquads) ? snapshot.raid.enemySquads.map((squad) => `${squad.id}:${Array.isArray(squad.roleLabels) ? squad.roleLabels.join("/") : "n/a"}`).join(" | ") : "n/a"} || enemies=${Array.isArray(snapshot.raid?.enemies) ? snapshot.raid.enemies.slice(0, 6).map((enemy) => `${enemy.id}:${enemy.squadRole ?? "n/a"}@${enemy.squadId ?? "none"}`).join(" | ") : "n/a"}`
        },
        {
          label: "support-gunner loss softens the crossing on the focused block",
          test: (snapshot) =>
            Array.isArray(snapshot.raid?.enemySquads) &&
            snapshot.raid.enemySquads.some(
              (squad) =>
                squad.supportGunnerAlive === false &&
                typeof squad.crossingDangerLabel === "string" &&
                squad.crossingDangerLabel.toLowerCase().includes("softened")
            ),
          details: (snapshot) =>
            `enemySquads=${Array.isArray(snapshot.raid?.enemySquads) ? snapshot.raid.enemySquads.map((squad) => `${squad.id}:support=${squad.supportGunnerAlive ?? "n/a"}:${squad.crossingDangerLabel ?? "n/a"}`).join(" | ") : "n/a"}`
        },
        {
          label: "building-hold roles stay anchored as hold or reserve defenders",
          test: (snapshot) =>
            Array.isArray(snapshot.raid?.enemies) &&
            snapshot.raid.enemies.some(
              (enemy) =>
                enemy.squadRole === "support-gunner" &&
                (enemy.openingPosture === "hold" || enemy.openingPosture === "reserve")
            ) &&
            snapshot.raid.enemies.some(
              (enemy) =>
                enemy.squadRole === "deep-rifle" &&
                (enemy.openingPosture === "hold" || enemy.openingPosture === "reserve")
            ),
          details: (snapshot) =>
            `anchoredRoles=${Array.isArray(snapshot.raid?.enemies) ? snapshot.raid.enemies.filter((enemy) => enemy.squadRole === "support-gunner" || enemy.squadRole === "deep-rifle").slice(0, 8).map((enemy) => `${enemy.id}:${enemy.squadRole}/${enemy.openingPosture}`).join(" | ") : "n/a"}`
        },
        {
          label: "the block explicitly punishes shallow entry instead of reading like a free first doorway",
          test: (snapshot) =>
            typeof snapshot.dialogue?.squadComms?.line === "string" &&
            snapshot.dialogue.squadComms.line.toLowerCase().includes("flood it now") &&
            typeof snapshot.dialogue?.hostileComms?.line === "string" &&
            snapshot.dialogue.hostileComms.line.toLowerCase().includes("hold the inside door") &&
            typeof snapshot.message === "string" &&
            snapshot.message.toLowerCase().includes("punishes hesitation"),
          details: (snapshot) =>
            `squad=${snapshot.dialogue?.squadComms?.line ?? "n/a"} || hostile=${snapshot.dialogue?.hostileComms?.line ?? "n/a"} || message=${snapshot.message ?? "n/a"}`
        },
        {
          label: "the pressure read and staged message both sell the role-kill room-flood payoff",
          test: (snapshot) =>
            typeof snapshot.raid?.pressurePosture?.detail === "string" &&
            snapshot.raid.pressurePosture.detail.toLowerCase().includes("crossing") &&
            typeof snapshot.raid?.pressurePosture?.actionLabel === "string" &&
            snapshot.raid.pressurePosture.actionLabel.toLowerCase().includes("cross") &&
            typeof snapshot.message === "string" &&
            snapshot.message.toLowerCase().includes("smg-led room flood doctrine") &&
            snapshot.message.toLowerCase().includes("softer crossing"),
          details: (snapshot) =>
            `pressureDetail=${snapshot.raid?.pressurePosture?.detail ?? "n/a"}, actionLabel=${snapshot.raid?.pressurePosture?.actionLabel ?? "n/a"}, message=${snapshot.message ?? "n/a"}`
        }
      ]
    };
  }

  if (macroId === "field-capture") {
    return {
      description: "Validate that the field-capture showcase keeps a recovered off-body PKM visible as a real keep-or-sell stash decision.",
      checks: [
        {
          label: "stash phase is active",
          test: (snapshot) => snapshot.phase === "stash",
          details: (snapshot) => `phase=${snapshot.phase}`
        },
        {
          label: "a recovered field weapon is surfaced on the stash wall",
          test: (snapshot) => snapshot.stash?.recoveredHaulSummary?.fieldWeapon?.weaponId === "pkm",
          details: (snapshot) =>
            `fieldWeapon=${snapshot.stash?.recoveredHaulSummary?.fieldWeapon?.weaponId ?? "n/a"}, source=${snapshot.stash?.recoveredHaulSummary?.fieldWeapon?.sourceLabel ?? "n/a"}`
        },
        {
          label: "the recovered gun still carries raid ammo and salvage value",
          test: (snapshot) =>
            typeof snapshot.stash?.recoveredHaulSummary?.fieldWeapon?.ammoInMag === "number" &&
            snapshot.stash.recoveredHaulSummary.fieldWeapon.ammoInMag > 0 &&
            typeof snapshot.stash?.recoveredHaulSummary?.fieldWeapon?.reserveAmmo === "number" &&
            snapshot.stash.recoveredHaulSummary.fieldWeapon.reserveAmmo > 0 &&
            typeof snapshot.stash?.recoveredHaulSummary?.fieldWeapon?.salvageValue === "number" &&
            snapshot.stash.recoveredHaulSummary.fieldWeapon.salvageValue >= 100,
          details: (snapshot) =>
            `ammo=${snapshot.stash?.recoveredHaulSummary?.fieldWeapon?.ammoInMag ?? "n/a"}/${snapshot.stash?.recoveredHaulSummary?.fieldWeapon?.reserveAmmo ?? "n/a"}, salvage=${snapshot.stash?.recoveredHaulSummary?.fieldWeapon?.salvageValue ?? "n/a"}`
        },
        {
          label: "the current planned loadout remains separate from the captured weapon",
          test: (snapshot) => snapshot.stash?.selectedWeapon === "rifle",
          details: (snapshot) => `selectedWeapon=${snapshot.stash?.selectedWeapon ?? "n/a"}`
        },
        {
          label: "the stash exposes a route-aware keep or sell recommendation",
          test: (snapshot) =>
            typeof snapshot.stash?.recoveredHaulSummary?.fieldWeaponDecision?.recommendation === "string" &&
            typeof snapshot.stash?.recoveredHaulSummary?.fieldWeaponDecision?.title === "string" &&
            typeof snapshot.stash?.recoveredHaulSummary?.fieldWeaponDecision?.bestRouteName === "string" &&
            typeof snapshot.stash?.recoveredHaulSummary?.fieldWeaponDecision?.sellValueLabel === "string",
          details: (snapshot) =>
            `recommendation=${snapshot.stash?.recoveredHaulSummary?.fieldWeaponDecision?.recommendation ?? "n/a"}, title=${snapshot.stash?.recoveredHaulSummary?.fieldWeaponDecision?.title ?? "n/a"}, bestRoute=${snapshot.stash?.recoveredHaulSummary?.fieldWeaponDecision?.bestRouteName ?? "n/a"}`
        },
        {
          label: "the showcase message sells the doctrine choice",
          test: (snapshot) =>
            typeof snapshot.message === "string" &&
            snapshot.message.toLowerCase().includes("keep-or-sell doctrine choice"),
          details: (snapshot) => `message=${snapshot.message ?? "n/a"}`
        }
      ]
    };
  }

  if (macroId === "field-pivot") {
    return {
      description: "Validate that the field-pivot showcase proves a recovered off-body PKM can be staged directly into the next run instead of only being kept or sold.",
      checks: [
        {
          label: "stash phase is active",
          test: (snapshot) => snapshot.phase === "stash",
          details: (snapshot) => `phase=${snapshot.phase}`
        },
        {
          label: "the recovered field weapon is still visible on the wall",
          test: (snapshot) => snapshot.stash?.recoveredHaulSummary?.fieldWeapon?.weaponId === "pkm",
          details: (snapshot) =>
            `fieldWeapon=${snapshot.stash?.recoveredHaulSummary?.fieldWeapon?.weaponId ?? "n/a"}`
        },
        {
          label: "the recovered PKM is now the staged raid weapon",
          test: (snapshot) =>
            snapshot.stash?.selectedWeapon === "pkm" &&
            snapshot.stash?.recoveredHaulSummary?.fieldWeaponDecision?.stagedNow === true &&
            snapshot.stash?.recoveredHaulSummary?.fieldWeaponDecision?.stagedWeaponName === "PKM Support Gun",
          details: (snapshot) =>
            `selectedWeapon=${snapshot.stash?.selectedWeapon ?? "n/a"}, stagedNow=${snapshot.stash?.recoveredHaulSummary?.fieldWeaponDecision?.stagedNow ?? "n/a"}, stagedWeapon=${snapshot.stash?.recoveredHaulSummary?.fieldWeaponDecision?.stagedWeaponName ?? "n/a"}`
        },
        {
          label: "the stash keeps the pivot recommendation instead of falling back to sell language",
          test: (snapshot) =>
            snapshot.stash?.recoveredHaulSummary?.fieldWeaponDecision?.recommendation === "pivot-now" &&
            typeof snapshot.stash?.recoveredHaulSummary?.fieldWeaponDecision?.title === "string" &&
            snapshot.stash.recoveredHaulSummary.fieldWeaponDecision.title.toLowerCase().includes("staged from the wall"),
          details: (snapshot) =>
            `recommendation=${snapshot.stash?.recoveredHaulSummary?.fieldWeaponDecision?.recommendation ?? "n/a"}, title=${snapshot.stash?.recoveredHaulSummary?.fieldWeaponDecision?.title ?? "n/a"}`
        },
        {
          label: "the showcase message sells the recover-keep-pivot loop",
          test: (snapshot) =>
            typeof snapshot.message === "string" &&
            snapshot.message.toLowerCase().includes("recover-keep-pivot loop"),
          details: (snapshot) => `message=${snapshot.message ?? "n/a"}`
        }
      ]
    };
  }

  if (macroId === "broker-cashout") {
    return {
      description: "Validate that the broker-cashout showcase proves a recovered PKM can be converted into live stash funding instead of sitting as decorative haul.",
      checks: [
        {
          label: "stash phase is active",
          test: (snapshot) => snapshot.phase === "stash",
          details: (snapshot) => `phase=${snapshot.phase}`
        },
        {
          label: "the recovered field weapon has actually been sold off the wall",
          test: (snapshot) => snapshot.stash?.recoveredHaulSummary?.fieldWeapon === null,
          details: (snapshot) => `fieldWeapon=${snapshot.stash?.recoveredHaulSummary?.fieldWeapon?.weaponId ?? "none"}`
        },
        {
          label: "realized broker credits and sold item count are both recorded",
          test: (snapshot) =>
            typeof snapshot.stash?.recoveredHaulSummary?.realizedBrokerCredits === "number" &&
            snapshot.stash.recoveredHaulSummary.realizedBrokerCredits >= 100 &&
            typeof snapshot.stash?.recoveredHaulSummary?.realizedBrokerItems === "number" &&
            snapshot.stash.recoveredHaulSummary.realizedBrokerItems >= 1,
          details: (snapshot) =>
            `credits=${snapshot.stash?.recoveredHaulSummary?.realizedBrokerCredits ?? "n/a"}, soldItems=${snapshot.stash?.recoveredHaulSummary?.realizedBrokerItems ?? "n/a"}`
        },
        {
          label: "the operational wall flips broker weight into funded cash",
          test: (snapshot) => {
            const brokerCard = snapshot.stash?.operationalWall?.cards?.find((card) => card.label === "Broker Weight");
            return (
              !!brokerCard &&
              typeof brokerCard.status === "string" &&
              brokerCard.status.includes("sold") &&
              brokerCard.status.includes("+") &&
              typeof brokerCard.detail === "string" &&
              brokerCard.detail.toLowerCase().includes("converted")
            );
          },
          details: (snapshot) => {
            const brokerCard = snapshot.stash?.operationalWall?.cards?.find((card) => card.label === "Broker Weight");
            return `brokerCard=${brokerCard ? `${brokerCard.status} // ${brokerCard.detail}` : "n/a"}`;
          }
        },
        {
          label: "the staged message still frames the cash-out as a real deploy-money decision",
          test: (snapshot) =>
            typeof snapshot.message === "string" &&
            snapshot.message.toLowerCase().includes("captured pkm has already been brokered") &&
            snapshot.message.toLowerCase().includes("convert-to-credits decision"),
          details: (snapshot) => `message=${snapshot.message ?? "n/a"}`
        }
      ]
    };
  }

  if (macroId === "endgame-amr") {
    return {
      description: "Validate that the endgame-amr showcase stages the Bastion AMR as a real late-war doctrine pick with a distinct route plan and squad package.",
      checks: [
        {
          label: "stash phase is active",
          test: (snapshot) => snapshot.phase === "stash",
          details: (snapshot) => `phase=${snapshot.phase}`
        },
        {
          label: "the Bastion AMR is the staged primary",
          test: (snapshot) =>
            snapshot.stash?.selectedWeapon === "amr" &&
            snapshot.combat?.startingHardship?.primaryWeaponId === "amr",
          details: (snapshot) =>
            `selectedWeapon=${snapshot.stash?.selectedWeapon ?? "n/a"}, hardshipPrimary=${snapshot.combat?.startingHardship?.primaryWeaponId ?? "n/a"}`
        },
        {
          label: "the route is the long-lane Broken Signal slice",
          test: (snapshot) =>
            snapshot.route?.id === "broken-signal" &&
            snapshot.map?.activeSubzone?.label === "Dish Houses" &&
            typeof snapshot.stash?.deploymentCost === "number" &&
            snapshot.stash.deploymentCost >= 300,
          details: (snapshot) =>
            `route=${snapshot.route?.id ?? "n/a"}, subzone=${snapshot.map?.activeSubzone?.label ?? "n/a"}, deploymentCost=${snapshot.stash?.deploymentCost ?? "n/a"}`
        },
        {
          label: "weapon doctrine reads as a route-owned AMR plan",
          test: (snapshot) =>
            snapshot.combat?.weaponDoctrine?.fitLabel === "Route-owned" &&
            typeof snapshot.combat?.weaponDoctrine?.title === "string" &&
            snapshot.combat.weaponDoctrine.title.includes("Bastion AMR") &&
            typeof snapshot.combat?.weaponDoctrine?.primarySpace === "string" &&
            snapshot.combat.weaponDoctrine.primarySpace.toLowerCase().includes("plated") &&
            typeof snapshot.combat?.weaponDoctrine?.failureSpace === "string" &&
            snapshot.combat.weaponDoctrine.failureSpace.toLowerCase().includes("reload"),
          details: (snapshot) =>
            `title=${snapshot.combat?.weaponDoctrine?.title ?? "n/a"}, primarySpace=${snapshot.combat?.weaponDoctrine?.primarySpace ?? "n/a"}, failureSpace=${snapshot.combat?.weaponDoctrine?.failureSpace ?? "n/a"}`
        },
        {
          label: "the squad package is built around converting one anchor kill into a crossing",
          test: (snapshot) =>
            snapshot.combat?.squadDoctrine?.title === "Anchor-break package" &&
            Array.isArray(snapshot.combat?.squadDoctrine?.tags) &&
            snapshot.combat.squadDoctrine.tags.some((tag) => tag.includes("PKM Support Gun")) &&
            snapshot.combat.squadDoctrine.tags.some((tag) => tag.includes("Collapse runner")) &&
            snapshot.combat.squadDoctrine.tags.some((tag) => tag.includes("Follow-up angle")),
          details: (snapshot) =>
            `squadDoctrineTitle=${snapshot.combat?.squadDoctrine?.title ?? "n/a"}, tags=${Array.isArray(snapshot.combat?.squadDoctrine?.tags) ? snapshot.combat.squadDoctrine.tags.join(" || ") : "n/a"}`
        },
        {
          label: "the showcase copy sells plate-break doctrine instead of generic power",
          test: (snapshot) =>
            typeof snapshot.message === "string" &&
            snapshot.message.toLowerCase().includes("plate-break") &&
            snapshot.message.toLowerCase().includes("long-lane control"),
          details: (snapshot) => `message=${snapshot.message ?? "n/a"}`
        }
      ]
    };
  }

  if (macroId === "amr-counter-lane") {
    return {
      description: "Validate that the amr-counter-lane showcase proves the Bastion AMR as a live plate-break raid answer, not only a stash doctrine board.",
      checks: [
        {
          label: "raid phase is active on Broken Signal",
          test: (snapshot) => snapshot.phase === "raid" && snapshot.route?.id === "broken-signal",
          details: (snapshot) => `phase=${snapshot.phase}, route=${snapshot.route?.id ?? "n/a"}`
        },
        {
          label: "the focused incident is the live relay counter-lane plate-break",
          test: (snapshot) => {
            const focusedIncident = snapshot.frontline?.incidents?.find(
              (incident) => incident.id === snapshot.frontline?.focusedIncidentId
            );
            return (
              snapshot.route?.id === "broken-signal" &&
              focusedIncident?.label === "Relay counter lane" &&
              focusedIncident?.presentationVariant === "amr-counter-lane"
            );
          },
          details: (snapshot) => {
            const focusedIncident = snapshot.frontline?.incidents?.find(
              (incident) => incident.id === snapshot.frontline?.focusedIncidentId
            );
            return `subzone=${snapshot.map?.activeSubzone?.label ?? "n/a"}, focused=${focusedIncident?.label ?? "n/a"}, variant=${focusedIncident?.presentationVariant ?? "n/a"}`;
          }
        },
        {
          label: "pressure posture calls for the plate-break explicitly",
          test: (snapshot) =>
            snapshot.map?.pressurePosture?.actionLabel === "Break the plated anchor first" &&
            snapshot.map?.pressurePosture?.windowLabel === "Plate-break window live",
          details: (snapshot) =>
            `action=${snapshot.map?.pressurePosture?.actionLabel ?? "n/a"}, window=${snapshot.map?.pressurePosture?.windowLabel ?? "n/a"}`
        },
        {
          label: "operation flow treats the AMR shot as the live commitment problem",
          test: (snapshot) =>
            snapshot.raid?.operationPhase === "commitment" &&
            typeof snapshot.raid?.operationRead?.detail === "string" &&
            snapshot.raid.operationRead.detail.toLowerCase().includes("plated anchor") &&
            snapshot.raid.operationRead.detail.toLowerCase().includes("repeek"),
          details: (snapshot) =>
            `operationPhase=${snapshot.raid?.operationPhase ?? "n/a"}, detail=${snapshot.raid?.operationRead?.detail ?? "n/a"}`
        },
        {
          label: "weapon and squad doctrine stay on the live anchor-break plan",
          test: (snapshot) =>
            snapshot.combat?.weaponDoctrine?.fitLabel === "Route-owned" &&
            snapshot.combat?.squadDoctrine?.title === "Anchor-break package" &&
            typeof snapshot.combat?.weaponDoctrine?.routeCall === "string" &&
            snapshot.combat.weaponDoctrine.routeCall.toLowerCase().includes("plate break"),
          details: (snapshot) =>
            `fit=${snapshot.combat?.weaponDoctrine?.fitLabel ?? "n/a"}, squad=${snapshot.combat?.squadDoctrine?.title ?? "n/a"}, routeCall=${snapshot.combat?.weaponDoctrine?.routeCall ?? "n/a"}`
        },
        {
          label: "the showcase copy sells the raid-side plate-break conversion",
          test: (snapshot) =>
            typeof snapshot.message === "string" &&
            snapshot.message.toLowerCase().includes("plated repeek") &&
            snapshot.message.toLowerCase().includes("dish houses"),
          details: (snapshot) => `message=${snapshot.message ?? "n/a"}`
        }
      ]
    };
  }

  if (macroId === "handgun-recovery") {
    return {
      description: "Validate that the handgun-recovery showcase stages the sidearm as a survival-only insert with the squad carrying the real lane-control burden.",
      checks: [
        {
          label: "stash phase is active",
          test: (snapshot) => snapshot.phase === "stash",
          details: (snapshot) => `phase=${snapshot.phase}`
        },
        {
          label: "the sidearm is the staged weapon and reads as a deployable sidearm",
          test: (snapshot) =>
            snapshot.stash?.selectedWeapon === "pistol" &&
            snapshot.combat?.startingHardship?.primaryWeaponId === "pistol" &&
            Array.isArray(snapshot.stash?.items) &&
            snapshot.stash.items.some(
              (item) => item.id === "bench-weapon" && item.category === "deployable-sidearm" && item.label.includes("Civic-9")
            ),
          details: (snapshot) =>
            `selectedWeapon=${snapshot.stash?.selectedWeapon ?? "n/a"}, hardshipPrimary=${snapshot.combat?.startingHardship?.primaryWeaponId ?? "n/a"}, benchWeapon=${Array.isArray(snapshot.stash?.items) ? snapshot.stash.items.find((item) => item.id === "bench-weapon")?.category ?? "n/a" : "n/a"}`
        },
        {
          label: "Sundered Run stages the hot recovery route",
          test: (snapshot) =>
            snapshot.route?.id === "sundered-run" &&
            snapshot.map?.settlement?.label === "Ambulance Mile" &&
            snapshot.map?.activeSubzone?.label === "Clinic Row",
          details: (snapshot) =>
            `route=${snapshot.route?.id ?? "n/a"}, settlement=${snapshot.map?.settlement?.label ?? "n/a"}, subzone=${snapshot.map?.activeSubzone?.label ?? "n/a"}`
        },
        {
          label: "weapon doctrine treats the pistol as the wrong tool for survival-only work",
          test: (snapshot) =>
            snapshot.combat?.weaponDoctrine?.fitLabel === "Wrong tool" &&
            typeof snapshot.combat?.weaponDoctrine?.title === "string" &&
            snapshot.combat.weaponDoctrine.title.includes("Civic-9 Sidearm") &&
            typeof snapshot.combat?.weaponDoctrine?.failureSpace === "string" &&
            snapshot.combat.weaponDoctrine.failureSpace.toLowerCase().includes("open crossing"),
          details: (snapshot) =>
            `title=${snapshot.combat?.weaponDoctrine?.title ?? "n/a"}, fitLabel=${snapshot.combat?.weaponDoctrine?.fitLabel ?? "n/a"}, failureSpace=${snapshot.combat?.weaponDoctrine?.failureSpace ?? "n/a"}`
        },
        {
          label: "the squad package carries the first lane for the operator",
          test: (snapshot) =>
            snapshot.combat?.squadDoctrine?.title === "Emergency recovery package" &&
            Array.isArray(snapshot.combat?.squadDoctrine?.tags) &&
            snapshot.combat.squadDoctrine.tags.some((tag) => tag.includes("PKM Support Gun")) &&
            snapshot.combat.squadDoctrine.tags.some((tag) => tag.includes("Room flood")) &&
            typeof snapshot.combat?.startingHardship?.readout?.[3]?.value === "string" &&
            snapshot.combat.startingHardship.readout[3].value.includes("heavier kit"),
          details: (snapshot) =>
            `squadDoctrineTitle=${snapshot.combat?.squadDoctrine?.title ?? "n/a"}, boysEdge=${snapshot.combat?.startingHardship?.readout?.[3]?.value ?? "n/a"}, tags=${Array.isArray(snapshot.combat?.squadDoctrine?.tags) ? snapshot.combat.squadDoctrine.tags.join(" || ") : "n/a"}`
        },
        {
          label: "the showcase copy still frames the sidearm as emergency survival doctrine",
          test: (snapshot) =>
            typeof snapshot.message === "string" &&
            snapshot.message.toLowerCase().includes("sidearm-only insert") &&
            snapshot.message.toLowerCase().includes("emergency survival tool"),
          details: (snapshot) => `message=${snapshot.message ?? "n/a"}`
        }
      ]
    };
  }

  if (macroId === "knife-extreme") {
    return {
      description: "Validate that the knife works as a high-risk raid tool: lethal from a close rear slip, but still framed as a desperate extreme-case solve instead of a free room-clear winner.",
      checks: [
        {
          label: "raid phase is active on Broken Signal",
          test: (snapshot) => snapshot.phase === "raid" && snapshot.route?.id === "broken-signal",
          details: (snapshot) => `phase=${snapshot.phase}, route=${snapshot.route?.id ?? "n/a"}`
        },
        {
          label: "the player is carrying the knife and the subzone is still a live room problem",
          test: (snapshot) =>
            snapshot.raid?.player?.weaponId === "knife" &&
            snapshot.map?.settlement?.label === "Relay Hamlet" &&
            snapshot.map?.activeSubzone?.label === "Dish Houses",
          details: (snapshot) =>
            `weapon=${snapshot.raid?.player?.weaponId ?? "n/a"}, settlement=${snapshot.map?.settlement?.label ?? "n/a"}, subzone=${snapshot.map?.activeSubzone?.label ?? "n/a"}`
        },
        {
          label: "the knife is framed as the wrong tool except for an isolated slip",
          test: (snapshot) =>
            snapshot.combat?.weaponDoctrine?.fitLabel === "Wrong tool" &&
            typeof snapshot.combat?.weaponDoctrine?.primarySpace === "string" &&
            snapshot.combat.weaponDoctrine.primarySpace.toLowerCase().includes("isolated"),
          details: (snapshot) =>
            `fit=${snapshot.combat?.weaponDoctrine?.fitLabel ?? "n/a"}, primarySpace=${snapshot.combat?.weaponDoctrine?.primarySpace ?? "n/a"}`
        },
        {
          label: "the knife strike actually drops the staged hostile",
          test: (snapshot) =>
            Array.isArray(snapshot.raid?.downedHostilesNearby) &&
            snapshot.raid.downedHostilesNearby.length >= 1,
          details: (snapshot) =>
            `downed=${Array.isArray(snapshot.raid?.downedHostilesNearby) ? snapshot.raid.downedHostilesNearby.map((enemy) => `${enemy.id}:${enemy.archetypeId}`).join(" | ") : "n/a"}, fallenBodies=${Array.isArray(snapshot.raid?.fallenEnemyBodies) ? snapshot.raid.fallenEnemyBodies.map((body) => body.label).join(" | ") : "n/a"}`
        },
        {
          label: "player-facing copy sells the execution as extreme and temporary",
          test: (snapshot) =>
            typeof snapshot.message === "string" &&
            snapshot.message.toLowerCase().includes("knife") &&
            (snapshot.message.toLowerCase().includes("kill landed") ||
              snapshot.message.toLowerCase().includes("execute landed")) &&
            snapshot.message.toLowerCase().includes("move before"),
          details: (snapshot) => `message=${snapshot.message ?? "n/a"}`
        }
      ]
    };
  }

  if (macroId === "chair-handoff") {
    return {
      description: "Validate that the chair-handoff showcase proves one seat can turn cleanly while another stays blocked by unresolved memorial debt.",
      checks: [
        {
          label: "stash phase is active",
          test: (snapshot) => snapshot.phase === "stash",
          details: (snapshot) => `phase=${snapshot.phase}`
        },
        {
          label: "operator tab is open on the stash side",
          test: (snapshot) => snapshot.ui?.topTab === "operator",
          details: (snapshot) => `topTab=${snapshot.ui?.topTab ?? "n/a"}`
        },
        {
          label: "squad readiness exposes one missing seat and a pending replacement",
          test: (snapshot) =>
            typeof snapshot.stash?.squadReadiness?.missing === "number" &&
            snapshot.stash.squadReadiness.missing >= 1 &&
            typeof snapshot.stash?.squadReadiness?.replacementPending === "number" &&
            snapshot.stash.squadReadiness.replacementPending >= 1,
          details: (snapshot) =>
            `missing=${snapshot.stash?.squadReadiness?.missing ?? "n/a"}, replacementPending=${snapshot.stash?.squadReadiness?.replacementPending ?? "n/a"}`
        },
        {
          label: "the handoff board shows a grief-blocked chair",
          test: (snapshot) =>
            Array.isArray(snapshot.stash?.replacementSeats) &&
            snapshot.stash.replacementSeats.some(
              (seat) => seat.tone === "danger" && typeof seat.blocker === "string" && seat.blocker.toLowerCase().includes("call")
            ),
          details: (snapshot) =>
            `replacementSeats=${Array.isArray(snapshot.stash?.replacementSeats) ? snapshot.stash.replacementSeats.map((seat) => `${seat.chairLabel}:${seat.status}`).join(" | ") : "n/a"}`
        },
        {
          label: "the handoff board also shows a seat that can turn now",
          test: (snapshot) =>
            Array.isArray(snapshot.stash?.replacementSeats) &&
            snapshot.stash.replacementSeats.some(
              (seat) => typeof seat.status === "string" && seat.status.toLowerCase().includes("seat can turn")
            ),
          details: (snapshot) =>
            `replacementSeats=${Array.isArray(snapshot.stash?.replacementSeats) ? snapshot.stash.replacementSeats.map((seat) => `${seat.chairLabel}:${seat.incomingLabel}`).join(" | ") : "n/a"}`
        },
        {
          label: "the memorial wall still carries unresolved missing-body debt",
          test: (snapshot) =>
            Array.isArray(snapshot.stash?.memorialDebt) &&
            snapshot.stash.memorialDebt.some(
              (entry) => entry.bodyStatus === "left-behind" && typeof entry.status === "string" && entry.status.toLowerCase().includes("call")
            ),
          details: (snapshot) =>
            `memorialDebt=${Array.isArray(snapshot.stash?.memorialDebt) ? snapshot.stash.memorialDebt.map((entry) => `${entry.title}:${entry.status}`).join(" | ") : "n/a"}`
        },
        {
          label: "the staged message explains both the ready chair and the blocked chair",
          test: (snapshot) =>
            typeof snapshot.message === "string" &&
            snapshot.message.toLowerCase().includes("lev") &&
            snapshot.message.toLowerCase().includes("family call"),
          details: (snapshot) => `message=${snapshot.message ?? "n/a"}`
        }
      ]
    };
  }

  if (macroId === "final-stronghold") {
    return {
      description: "Validate that the final-stronghold reveal stages a real campaign target with readable prep tracks, outputs, and launch guidance instead of rumor-only copy.",
      checks: [
        {
          label: "stash phase is active for campaign planning",
          test: (snapshot) => snapshot.phase === "stash",
          details: (snapshot) => `phase=${snapshot.phase}`
        },
        {
          label: "campaign finale stays in the prep reveal instead of locked or launched",
          test: (snapshot) =>
            snapshot.campaign?.finale?.state === "preparing" &&
            snapshot.campaign?.finale?.stateLabel === "Preparation underway" &&
            snapshot.campaign?.finale?.strongholdLabel === "Black Orchard Redoubt" &&
            snapshot.campaign?.finale?.enemyLabel === "Hinge-9 Brigade",
          details: (snapshot) =>
            `state=${snapshot.campaign?.finale?.state ?? "n/a"}, stateLabel=${snapshot.campaign?.finale?.stateLabel ?? "n/a"}, stronghold=${snapshot.campaign?.finale?.strongholdLabel ?? "n/a"}, enemy=${snapshot.campaign?.finale?.enemyLabel ?? "n/a"}`
        },
        {
          label: "prep outputs already read like a reusable campaign plan",
          test: (snapshot) =>
            Array.isArray(snapshot.campaign?.finale?.prepOutputs) &&
            snapshot.campaign.finale.prepOutputs.length === 4 &&
            snapshot.campaign.finale.prepOutputs.some((output) => output.id === "safer-lane" && output.ready) &&
            snapshot.campaign.finale.prepOutputs.some((output) => output.id === "weaker-flank" && output.ready) &&
            snapshot.campaign.finale.prepOutputs.some((output) => output.id === "recovery-path" && output.ready) &&
            snapshot.campaign.finale.prepOutputs.some((output) => output.id === "route-intel" && output.ready),
          details: (snapshot) =>
            `prepOutputs=${Array.isArray(snapshot.campaign?.finale?.prepOutputs) ? snapshot.campaign.finale.prepOutputs.map((output) => `${output.id}:${output.ready ? "ready" : "dark"}:${output.effectLabel}`).join(" || ") : "n/a"}`
        },
        {
          label: "prep summary and launch instruction both stay concrete",
          test: (snapshot) =>
            typeof snapshot.campaign?.finale?.prepSummary === "string" &&
            snapshot.campaign.finale.prepSummary.toLowerCase().includes("marked pull lane") &&
            typeof snapshot.campaign?.finale?.launchInstruction === "string" &&
            snapshot.campaign.finale.launchInstruction.toLowerCase().includes("trying to open"),
          details: (snapshot) =>
            `prepSummary=${snapshot.campaign?.finale?.prepSummary ?? "n/a"}, launchInstruction=${snapshot.campaign?.finale?.launchInstruction ?? "n/a"}`
        },
        {
          label: "the first assault beats are visible before launch",
          test: (snapshot) =>
            Array.isArray(snapshot.campaign?.finale?.assaultPlan) &&
            snapshot.campaign.finale.assaultPlan.length >= 2 &&
            snapshot.campaign.finale.assaultPlan[0]?.label === "Entry Belt" &&
            snapshot.campaign.finale.assaultPlan[1]?.label === "Relay Mouth",
          details: (snapshot) =>
            `assaultPlan=${Array.isArray(snapshot.campaign?.finale?.assaultPlan) ? snapshot.campaign.finale.assaultPlan.map((beat) => beat.label).join(" || ") : "n/a"}`
        }
      ]
    };
  }

  if (macroId === "recovery-corridor-payoff") {
    return {
      description: "Validate that one clean memorial return now pays off into the finale's recovery-path output instead of waiting on another queued body run.",
      checks: [
        {
          label: "stash phase is active for the payoff board",
          test: (snapshot) => snapshot.phase === "stash",
          details: (snapshot) => `phase=${snapshot.phase}`
        },
        {
          label: "the campaign is still in prep-state planning",
          test: (snapshot) =>
            snapshot.campaign?.finale?.state === "preparing" &&
            snapshot.campaign?.finale?.stateLabel === "Preparation underway" &&
            snapshot.campaign?.finale?.strongholdLabel === "Black Orchard Redoubt",
          details: (snapshot) =>
            `state=${snapshot.campaign?.finale?.state ?? "n/a"}, stateLabel=${snapshot.campaign?.finale?.stateLabel ?? "n/a"}, stronghold=${snapshot.campaign?.finale?.strongholdLabel ?? "n/a"}`
        },
        {
          label: "recovery-path is live and reads as a body-return payoff",
          test: (snapshot) => {
            const recoveryPath = snapshot.campaign?.finale?.prepOutputs?.find((output) => output.id === "recovery-path");
            return (
              recoveryPath?.ready === true &&
              recoveryPath?.effectLabel === "Casualty corridor steadied" &&
              typeof recoveryPath?.sourceLabel === "string" &&
              recoveryPath.sourceLabel.toLowerCase().includes("bodies recovered")
            );
          },
          details: (snapshot) => {
            const recoveryPath = snapshot.campaign?.finale?.prepOutputs?.find((output) => output.id === "recovery-path");
            return `recoveryPath=${recoveryPath?.ready ?? "n/a"}:${recoveryPath?.effectLabel ?? "n/a"}:${recoveryPath?.sourceLabel ?? "n/a"}`;
          }
        },
        {
          label: "chair debt is actually cleared on the stash side",
          test: (snapshot) =>
            snapshot.stash?.squadReadiness?.blockedChair === null &&
            typeof snapshot.stash?.squadReadiness?.missing === "number" &&
            snapshot.stash.squadReadiness.missing === 0,
          details: (snapshot) =>
            `blockedChair=${snapshot.stash?.squadReadiness?.blockedChair ?? "n/a"}, missing=${snapshot.stash?.squadReadiness?.missing ?? "n/a"}`
        },
        {
          label: "the staged raid history still carries a recovered-body proof",
          test: (snapshot) =>
            typeof snapshot.lastRaidSummary?.routeName === "string" &&
            snapshot.lastRaidSummary.routeName === "Crosswind Docks" &&
            snapshot.lastRaidSummary?.squadStatusLabel === "Body returned" &&
            typeof snapshot.lastRaidSummary?.reason === "string" &&
            snapshot.lastRaidSummary.reason.toLowerCase().includes("finale verification"),
          details: (snapshot) =>
            `routeName=${snapshot.lastRaidSummary?.routeName ?? "n/a"}, squadStatusLabel=${snapshot.lastRaidSummary?.squadStatusLabel ?? "n/a"}, reason=${snapshot.lastRaidSummary?.reason ?? "n/a"}`
        }
      ]
    };
  }

  if (macroId === "final-stronghold-launch") {
    return {
      description: "Validate that the final-stronghold-launch showcase turns the finale into a committed assault plan with readable breach, corridor, and escape beats.",
      checks: [
        {
          label: "stash phase is active for launch planning",
          test: (snapshot) => snapshot.phase === "stash",
          details: (snapshot) => `phase=${snapshot.phase}`
        },
        {
          label: "campaign finale state resolves to launched",
          test: (snapshot) =>
            snapshot.campaign?.finale?.state === "launched" &&
            snapshot.campaign?.finale?.stateLabel === "Final assault launched",
          details: (snapshot) =>
            `state=${snapshot.campaign?.finale?.state ?? "n/a"}, stateLabel=${snapshot.campaign?.finale?.stateLabel ?? "n/a"}`
        },
        {
          label: "launch plan exposes the committed assault beats",
          test: (snapshot) =>
            Array.isArray(snapshot.campaign?.finale?.assaultPlan) &&
            snapshot.campaign.finale.assaultPlan.length >= 4 &&
            snapshot.campaign.finale.assaultPlan.some((beat) => beat.label === "Entry Belt") &&
            snapshot.campaign.finale.assaultPlan.some((beat) => beat.label === "Casualty Strip") &&
            snapshot.campaign.finale.assaultPlan.some((beat) => beat.label === "Escape Cut"),
          details: (snapshot) =>
            `assaultPlan=${Array.isArray(snapshot.campaign?.finale?.assaultPlan) ? snapshot.campaign.finale.assaultPlan.map((beat) => `${beat.label}:${beat.title}`).join(" || ") : "n/a"}`
        },
        {
          label: "assault titles read like a live breach instead of prep theory",
          test: (snapshot) => {
            const titles = Array.isArray(snapshot.campaign?.finale?.assaultPlan)
              ? snapshot.campaign.finale.assaultPlan.map((beat) => beat.title)
              : [];
            return (
              titles.includes("First relay belt entered") &&
              titles.includes("Drag lane under load") &&
              titles.includes("Finish the wall or die on the peel")
            );
          },
          details: (snapshot) =>
            `titles=${Array.isArray(snapshot.campaign?.finale?.assaultPlan) ? snapshot.campaign.finale.assaultPlan.map((beat) => beat.title).join(" || ") : "n/a"}`
        },
        {
          label: "multiple prep outputs are still visibly powering the launch",
          test: (snapshot) =>
            Array.isArray(snapshot.campaign?.finale?.prepOutputs) &&
            snapshot.campaign.finale.prepOutputs.filter((output) => output.ready).length >= 2,
          details: (snapshot) =>
            `readyPrepOutputs=${Array.isArray(snapshot.campaign?.finale?.prepOutputs) ? snapshot.campaign.finale.prepOutputs.filter((output) => output.ready).map((output) => output.effectLabel).join(" || ") : "n/a"}`
        },
        {
          label: "launch copy keeps the breach live",
          test: (snapshot) =>
            typeof snapshot.campaign?.finale?.launchInstruction === "string" &&
            snapshot.campaign.finale.launchInstruction.toLowerCase().includes("hold the line") &&
            typeof snapshot.campaign?.finale?.followThrough === "string" &&
            snapshot.campaign.finale.followThrough.toLowerCase().includes("live shove"),
          details: (snapshot) =>
            `launchInstruction=${snapshot.campaign?.finale?.launchInstruction ?? "n/a"}, followThrough=${snapshot.campaign?.finale?.followThrough ?? "n/a"}`
        }
      ]
    };
  }

  if (macroId === "final-stronghold-setback") {
    return {
      description: "Validate that the final-stronghold-setback showcase turns a failed finale launch into a recoverable campaign state with spent prep and retry guidance.",
      checks: [
        {
          label: "stash phase is active for the retry state",
          test: (snapshot) => snapshot.phase === "stash",
          details: (snapshot) => `phase=${snapshot.phase}`
        },
        {
          label: "the campaign reads as a setback instead of a clean ready state",
          test: (snapshot) =>
            snapshot.campaign?.finale?.state === "preparing" &&
            snapshot.campaign?.finale?.stateLabel === "Launch setback" &&
            snapshot.campaign?.finale?.statusLabel === "First breach failed short" &&
            typeof snapshot.campaign?.finale?.readiness === "number" &&
            snapshot.campaign.finale.readiness <= 72,
          details: (snapshot) =>
            `state=${snapshot.campaign?.finale?.state ?? "n/a"}, stateLabel=${snapshot.campaign?.finale?.stateLabel ?? "n/a"}, statusLabel=${snapshot.campaign?.finale?.statusLabel ?? "n/a"}, readiness=${snapshot.campaign?.finale?.readiness ?? "n/a"}`
        },
        {
          label: "spent prep outputs are no longer marked ready",
          test: (snapshot) => {
            const outputs = snapshot.campaign?.finale?.prepOutputs ?? [];
            const saferLane = outputs.find((output) => output.id === "safer-lane");
            const recoveryPath = outputs.find((output) => output.id === "recovery-path");
            const routeIntel = outputs.find((output) => output.id === "route-intel");
            return (
              saferLane?.ready === false &&
              recoveryPath?.ready === false &&
              routeIntel?.ready === true &&
              typeof saferLane?.sourceLabel === "string" &&
              saferLane.sourceLabel.includes("Setback tax")
            );
          },
          details: (snapshot) => {
            const outputs = snapshot.campaign?.finale?.prepOutputs ?? [];
            const saferLane = outputs.find((output) => output.id === "safer-lane");
            const recoveryPath = outputs.find((output) => output.id === "recovery-path");
            const routeIntel = outputs.find((output) => output.id === "route-intel");
            return `saferLane=${saferLane?.ready ?? "n/a"}:${saferLane?.sourceLabel ?? "n/a"}, recoveryPath=${recoveryPath?.ready ?? "n/a"}:${recoveryPath?.sourceLabel ?? "n/a"}, routeIntel=${routeIntel?.ready ?? "n/a"}`;
          }
        },
        {
          label: "retry-critical prep tracks are damaged",
          test: (snapshot) => {
            const tracks = snapshot.campaign?.finale?.prepTracks ?? [];
            const prepOrders = tracks.find((track) => track.label === "Preparation orders");
            const squadDepth = tracks.find((track) => track.label === "Squad depth");
            return prepOrders?.ready === false && squadDepth?.ready === false;
          },
          details: (snapshot) => {
            const tracks = snapshot.campaign?.finale?.prepTracks ?? [];
            const prepOrders = tracks.find((track) => track.label === "Preparation orders");
            const squadDepth = tracks.find((track) => track.label === "Squad depth");
            return `prepOrders=${prepOrders?.ready ?? "n/a"}:${prepOrders?.status ?? "n/a"}, squadDepth=${squadDepth?.ready ?? "n/a"}:${squadDepth?.status ?? "n/a"}`;
          }
        },
        {
          label: "the retry instruction tells the player how to rebuild the launch",
          test: (snapshot) =>
            typeof snapshot.campaign?.finale?.retryInstruction === "string" &&
            snapshot.campaign.finale.retryInstruction.toLowerCase().includes("reopen one safer lane or recovery prep output") &&
            snapshot.campaign.finale.retryInstruction.toLowerCase().includes("squad depth"),
          details: (snapshot) => `retryInstruction=${snapshot.campaign?.finale?.retryInstruction ?? "n/a"}`
        }
      ]
    };
  }

  if (macroId === "true-escape") {
    return {
      description: "Validate that the true-escape showcase lands the campaign in a real closure state instead of another normal stash cycle.",
      checks: [
        {
          label: "stash phase is active for aftermath",
          test: (snapshot) => snapshot.phase === "stash",
          details: (snapshot) => `phase=${snapshot.phase}`
        },
        {
          label: "the campaign finale resolves to won",
          test: (snapshot) =>
            snapshot.campaign?.finale?.state === "won" &&
            snapshot.campaign?.finale?.stateLabel === "War sector escaped",
          details: (snapshot) =>
            `state=${snapshot.campaign?.finale?.state ?? "n/a"}, stateLabel=${snapshot.campaign?.finale?.stateLabel ?? "n/a"}`
        },
        {
          label: "closure summary and next chapter framing are present",
          test: (snapshot) =>
            typeof snapshot.campaign?.finale?.closure?.summary === "string" &&
            snapshot.campaign.finale.closure.summary.toLowerCase().includes("real way out") &&
            typeof snapshot.campaign?.finale?.closure?.nextChapter === "string" &&
            snapshot.campaign.finale.closure.nextChapter.toLowerCase().includes("new chapter"),
          details: (snapshot) =>
            `summary=${snapshot.campaign?.finale?.closure?.summary ?? "n/a"}, nextChapter=${snapshot.campaign?.finale?.closure?.nextChapter ?? "n/a"}`
        },
        {
          label: "the closure panel exposes multiple campaign-ending beats",
          test: (snapshot) =>
            Array.isArray(snapshot.campaign?.finale?.closure?.beats) &&
            snapshot.campaign.finale.closure.beats.length >= 3 &&
            snapshot.campaign.finale.closure.beats.some((beat) => beat.label === "Stronghold") &&
            snapshot.campaign.finale.closure.beats.some((beat) => beat.label === "Squad") &&
            snapshot.campaign.finale.closure.beats.some((beat) => beat.label === "Stash"),
          details: (snapshot) =>
            `beats=${Array.isArray(snapshot.campaign?.finale?.closure?.beats) ? snapshot.campaign.finale.closure.beats.map((beat) => `${beat.label}:${beat.value}`).join(" || ") : "n/a"}`
        },
        {
          label: "normal deployment is locked after the win state",
          test: (snapshot) => snapshot.stash?.canStartRaid === false,
          details: (snapshot) => `canStartRaid=${snapshot.stash?.canStartRaid ?? "n/a"}`
        },
        {
          label: "the staged message still frames this as a real win state",
          test: (snapshot) =>
            typeof snapshot.message === "string" &&
            snapshot.message.toLowerCase().includes("real win state"),
          details: (snapshot) => `message=${snapshot.message ?? "n/a"}`
        }
      ]
    };
  }

  if (macroId === "trench-assault") {
    return {
      description: "Validate that the trench-assault showcase stages a real lower-pier shove with belt-fed cover, a queued frag, and a live shift-fire order.",
      checks: [
        {
          label: "raid phase remains live",
          test: (snapshot) => snapshot.phase === "raid",
          details: (snapshot) => `phase=${snapshot.phase}`
        },
        {
          label: "the lane keeps a live cover-me order",
          test: (snapshot) => snapshot.frontline?.activeSupportOrderId === "shift-fire",
          details: (snapshot) => `activeSupportOrderId=${snapshot.frontline?.activeSupportOrderId ?? "n/a"}`
        },
        {
          label: "the boys still own both suppress and grenade work",
          test: (snapshot) =>
            typeof snapshot.combat?.activeTacticalActionCount === "number" &&
            snapshot.combat.activeTacticalActionCount >= 2 &&
            typeof snapshot.combat?.selectedBoyAction === "string" &&
            snapshot.combat.selectedBoyAction.startsWith("grenade:"),
          details: (snapshot) =>
            `activeTacticalActionCount=${snapshot.combat?.activeTacticalActionCount ?? "n/a"}, selectedBoyAction=${snapshot.combat?.selectedBoyAction ?? "n/a"}`
        },
        {
          label: "friendly suppression is present on the shove",
          test: (snapshot) =>
            typeof snapshot.combat?.nearbyFriendlySuppressors === "number" &&
            snapshot.combat.nearbyFriendlySuppressors >= 1 &&
            typeof snapshot.combat?.activeGrenadeCount === "number" &&
            snapshot.combat.activeGrenadeCount >= 1,
          details: (snapshot) =>
            `nearbyFriendlySuppressors=${snapshot.combat?.nearbyFriendlySuppressors ?? "n/a"}, activeGrenadeCount=${snapshot.combat?.activeGrenadeCount ?? "n/a"}`
        },
        {
          label: "the trench pocket is explicitly staged",
          test: (snapshot) =>
            typeof snapshot.message === "string" &&
            snapshot.message.includes("pier trench") &&
            typeof snapshot.map?.pressurePosture?.status === "string" &&
            snapshot.map.pressurePosture.status.startsWith("Pier trench lip |"),
          details: (snapshot) =>
            `message=${snapshot.message ?? "n/a"}, pressureStatus=${snapshot.map?.pressurePosture?.status ?? "n/a"}`
        },
        {
          label: "the squad doctrine still reads as a mixed trench package",
          test: (snapshot) =>
            snapshot.combat?.squadDoctrine?.title === "Trench shove package" &&
            Array.isArray(snapshot.combat?.squadDoctrine?.tags) &&
            snapshot.combat.squadDoctrine.tags.some((tag) => tag.includes("PKM Support Gun")) &&
            snapshot.combat.squadDoctrine.tags.some((tag) => tag.includes("Morrow Shotgun")) &&
            snapshot.combat.squadDoctrine.tags.some((tag) => tag.includes("Kite SMG")) &&
            Array.isArray(snapshot.combat?.squadDoctrine?.mates) &&
            snapshot.combat.squadDoctrine.mates.some((mate) => mate.roleLabel === "Lip lid") &&
            snapshot.combat.squadDoctrine.mates.some((mate) => mate.roleLabel === "Bend breaker") &&
            snapshot.combat.squadDoctrine.mates.some((mate) => mate.roleLabel === "Rear cut"),
          details: (snapshot) =>
            `title=${snapshot.combat?.squadDoctrine?.title ?? "n/a"}, squadDoctrineTags=${Array.isArray(snapshot.combat?.squadDoctrine?.tags) ? snapshot.combat.squadDoctrine.tags.join(" || ") : "n/a"}, roles=${Array.isArray(snapshot.combat?.squadDoctrine?.mates) ? snapshot.combat.squadDoctrine.mates.map((mate) => `${mate.name}:${mate.roleLabel}`).join(" || ") : "n/a"}`
        }
      ]
    };
  }

  if (macroId === "bunker-foothold") {
    return {
      description: "Validate that the bunker-foothold showcase stages a held bunker-chain return state with a live settle action, boys holding the mouth, and runtime dialogue that treats the den as remembered ground.",
      checks: [
        {
          label: "raid phase remains live",
          test: (snapshot) => snapshot.phase === "raid",
          details: (snapshot) => `phase=${snapshot.phase}`
        },
        {
          label: "bunker foothold stays focused and unresolved",
          test: (snapshot) => {
            const focusedIncidentId = snapshot.frontline?.focusedIncidentId;
            const bunkerIncident =
              snapshot.frontline?.incidents?.find((incident) => incident.kind === "bunker" && !incident.resolved) ?? null;
            return focusedIncidentId !== null && bunkerIncident !== null && bunkerIncident.id === focusedIncidentId;
          },
          details: (snapshot) => {
            const bunkerIncident =
              snapshot.frontline?.incidents?.find((incident) => incident.kind === "bunker" && !incident.resolved) ?? null;
            return `focusedIncidentId=${snapshot.frontline?.focusedIncidentId ?? "n/a"}, bunkerId=${bunkerIncident?.id ?? "n/a"}, bunkerStatus=${bunkerIncident?.status ?? "n/a"}`;
          }
        },
        {
          label: "the bunker remains a live settle action",
          test: (snapshot) => {
            const bunkerIncident =
              snapshot.frontline?.incidents?.find((incident) => incident.kind === "bunker" && !incident.resolved) ?? null;
            return bunkerIncident?.actionVerb === "settle" && bunkerIncident?.status === "engaged";
          },
          details: (snapshot) => {
            const bunkerIncident =
              snapshot.frontline?.incidents?.find((incident) => incident.kind === "bunker" && !incident.resolved) ?? null;
            return `actionVerb=${bunkerIncident?.actionVerb ?? "n/a"}, bunkerStatus=${bunkerIncident?.status ?? "n/a"}`;
          }
        },
        {
          label: "boys net is holding the concrete mouth",
          test: (snapshot) => snapshot.frontline?.activeSupportOrderId === "hold-position",
          details: (snapshot) =>
            `activeSupportOrderId=${snapshot.frontline?.activeSupportOrderId ?? "n/a"}, supportTimer=${snapshot.frontline?.supportOrderTimer ?? "n/a"}`
        },
        {
          label: "the bunker pocket exposes a readable four-role hostile fireteam",
          test: (snapshot) =>
            Array.isArray(snapshot.raid?.enemySquads) &&
            snapshot.raid.enemySquads.some((squad) => {
              const members = Array.isArray(squad?.members) ? squad.members : [];
              const roles = members.map((member) => member.squadRole);
              return (
                roles.includes("support-gunner") &&
                roles.includes("anchor-rifle") &&
                roles.includes("probe-rifle") &&
                roles.includes("deep-rifle") &&
                members.some((member) => member.squadRole === "support-gunner" && member.weaponId === "pkm")
              );
            }),
          details: (snapshot) =>
            `enemySquads=${Array.isArray(snapshot.raid?.enemySquads) ? snapshot.raid.enemySquads.map((squad) => `${squad.id}:${Array.isArray(squad.members) ? squad.members.map((member) => member.squadRole).join("/") : "n/a"}`).join(" || ") : "n/a"}`
        },
        {
          label: "pressure posture uses support-gun bunker language instead of generic bunker flavor",
          test: (snapshot) =>
            snapshot.map?.pressurePosture?.actionLabel === "Kill the lip gun first" &&
            snapshot.map?.pressurePosture?.windowLabel === "Support gun owns freight lip" &&
            snapshot.map?.pressurePosture?.threatLabel === "Back room still live",
          details: (snapshot) =>
            `action=${snapshot.map?.pressurePosture?.actionLabel ?? "n/a"}, window=${snapshot.map?.pressurePosture?.windowLabel ?? "n/a"}, threat=${snapshot.map?.pressurePosture?.threatLabel ?? "n/a"}`
        },
        {
          label: "noise pressure drops into a calmer reset lane",
          test: (snapshot) =>
            typeof snapshot.frontline?.metrics?.noise?.pressure === "number" &&
            snapshot.frontline.metrics.noise.pressure <= 0.4 &&
            snapshot.frontline.metrics.noise.responseLevel <= 1,
          details: (snapshot) =>
            `noisePressure=${snapshot.frontline?.metrics?.noise?.pressure ?? "n/a"}, responseLevel=${snapshot.frontline?.metrics?.noise?.responseLevel ?? "n/a"}`
        },
        {
          label: "the operator is still hurt enough to justify the foothold",
          test: (snapshot) =>
            typeof snapshot.frontline?.russianCombatants?.playerHealthPercent === "number" &&
            snapshot.frontline.russianCombatants.playerHealthPercent <= 70,
          details: (snapshot) =>
            `playerHealthPercent=${snapshot.frontline?.russianCombatants?.playerHealthPercent ?? "n/a"}`
        },
        {
          label: "the bunker-chain settlement now reads as a held return pocket instead of a fresh scramble",
          test: (snapshot) =>
            snapshot.map?.settlement?.control === "held" &&
            snapshot.map?.settlement?.volatility === "stable" &&
            Array.isArray(snapshot.map?.settlement?.memoryTags) &&
            snapshot.map.settlement.memoryTags.includes("flag-planted"),
          details: (snapshot) =>
            `control=${snapshot.map?.settlement?.control ?? "n/a"}, volatility=${snapshot.map?.settlement?.volatility ?? "n/a"}, memoryTags=${Array.isArray(snapshot.map?.settlement?.memoryTags) ? snapshot.map.settlement.memoryTags.join(" || ") : "n/a"}`
        },
        {
          label: "dialogue now carries the held-pocket memory through the bunker slice",
          test: (snapshot) =>
            Array.isArray(snapshot.dialogue?.recentSquadEvents) &&
            snapshot.dialogue.recentSquadEvents.some(
              (event) => Array.isArray(event?.memoryTags) && event.memoryTags.includes("sector-held")
            ) &&
            typeof snapshot.dialogue?.squadComms?.line === "string" &&
            snapshot.dialogue.squadComms.line.trim().length > 0 &&
            typeof snapshot.dialogue?.hostileComms?.line === "string" &&
            snapshot.dialogue.hostileComms.line.trim().length > 0,
          details: (snapshot) =>
            `squadMemoryTags=${Array.isArray(snapshot.dialogue?.recentSquadEvents) ? snapshot.dialogue.recentSquadEvents.map((event) => Array.isArray(event?.memoryTags) ? event.memoryTags.join("/") : "n/a").join(" || ") : "n/a"}, squadLine=${snapshot.dialogue?.squadComms?.line ?? "n/a"}, hostileLine=${snapshot.dialogue?.hostileComms?.line ?? "n/a"}`
        },
        {
          label: "operation flow treats the bunker as a fireteam-held pocket, not a generic calm room",
          test: (snapshot) =>
            typeof snapshot.raid?.operationRead?.detail === "string" &&
            (snapshot.raid.operationRead.detail.toLowerCase().includes("lip gun") ||
              snapshot.raid.operationRead.detail.toLowerCase().includes("support gun still owns the freight lip")) &&
            snapshot.raid.operationRead.detail.toLowerCase().includes("back room"),
          details: (snapshot) => `detail=${snapshot.raid?.operationRead?.detail ?? "n/a"}`
        }
      ]
    };
  }

  if (macroId === "cellar-counterhold") {
    return {
      description: "Validate that the cellar-counterhold showcase turns the relay cellar into a reclaim-window bunker-chain return with reserve pressure still leaning on the mouth.",
      checks: [
        {
          label: "raid phase remains live",
          test: (snapshot) => snapshot.phase === "raid",
          details: (snapshot) => `phase=${snapshot.phase}`
        },
        {
          label: "Broken Signal and the relay cellar are the active route problem",
          test: (snapshot) =>
            snapshot.route?.id === "broken-signal" &&
            snapshot.map?.activeSubzone?.label === "Relay Cellar" &&
            snapshot.map?.settlement?.label === "Relay Hamlet",
          details: (snapshot) =>
            `route=${snapshot.route?.id ?? "n/a"}, subzone=${snapshot.map?.activeSubzone?.label ?? "n/a"}, settlement=${snapshot.map?.settlement?.label ?? "n/a"}`
        },
        {
          label: "the settlement is formalized as a reclaim-window return state",
          test: (snapshot) =>
            snapshot.map?.settlement?.control === "contested" &&
            snapshot.map?.settlement?.volatility === "reclaiming" &&
            typeof snapshot.map?.settlement?.lastMeaningfulShiftCycle === "number" &&
            snapshot.map.settlement.lastMeaningfulShiftCycle > 0 &&
            Array.isArray(snapshot.map?.settlement?.activeSituationIds) &&
            snapshot.map.settlement.activeSituationIds.includes("volatility-reclaiming"),
          details: (snapshot) =>
            `control=${snapshot.map?.settlement?.control ?? "n/a"}, volatility=${snapshot.map?.settlement?.volatility ?? "n/a"}, cycle=${snapshot.map?.settlement?.lastMeaningfulShiftCycle ?? "n/a"}, situations=${Array.isArray(snapshot.map?.settlement?.activeSituationIds) ? snapshot.map.settlement.activeSituationIds.join(" || ") : "n/a"}`
        },
        {
          label: "the focused bunker is the authored cellar hold",
          test: (snapshot) => {
            const bunkerIncident =
              snapshot.frontline?.incidents?.find(
                (incident) => incident.kind === "bunker" && !incident.resolved && incident.label === "Relay cellar hold"
              ) ?? null;
            return snapshot.frontline?.focusedIncidentId === bunkerIncident?.id;
          },
          details: (snapshot) => {
            const bunkerIncident =
              snapshot.frontline?.incidents?.find(
                (incident) => incident.kind === "bunker" && !incident.resolved && incident.label === "Relay cellar hold"
              ) ?? null;
            return `focusedIncidentId=${snapshot.frontline?.focusedIncidentId ?? "n/a"}, bunkerId=${bunkerIncident?.id ?? "n/a"}, bunkerStatus=${bunkerIncident?.status ?? "n/a"}`;
          }
        },
        {
          label: "pressure posture explicitly calls for the cellar mouth hold",
          test: (snapshot) =>
            snapshot.raid?.pressurePosture?.actionLabel === "Hold the mouth, turn the back room" &&
            typeof snapshot.raid?.pressurePosture?.detail === "string" &&
            snapshot.raid.pressurePosture.detail.toLowerCase().includes("relay cellar"),
          details: (snapshot) =>
            `actionLabel=${snapshot.raid?.pressurePosture?.actionLabel ?? "n/a"}, detail=${snapshot.raid?.pressurePosture?.detail ?? "n/a"}`
        },
        {
          label: "the cellar pocket exposes the same four-role hostile fireteam model",
          test: (snapshot) =>
            Array.isArray(snapshot.raid?.enemySquads) &&
            snapshot.raid.enemySquads.some((squad) => {
              const members = Array.isArray(squad?.members) ? squad.members : [];
              const roles = members.map((member) => member.squadRole);
              return (
                roles.includes("support-gunner") &&
                roles.includes("anchor-rifle") &&
                roles.includes("probe-rifle") &&
                roles.includes("deep-rifle") &&
                members.some((member) => member.squadRole === "support-gunner" && member.weaponId === "pkm")
              );
            }),
          details: (snapshot) =>
            `enemySquads=${Array.isArray(snapshot.raid?.enemySquads) ? snapshot.raid.enemySquads.map((squad) => `${squad.id}:${Array.isArray(squad.members) ? squad.members.map((member) => member.squadRole).join("/") : "n/a"}`).join(" || ") : "n/a"}`
        },
        {
          label: "the cellar read now carries compression and back-room language",
          test: (snapshot) =>
            snapshot.raid?.pressurePosture?.windowLabel === "Cellar compressed | back room live" &&
            snapshot.raid?.pressurePosture?.threatLabel === "Back room still live",
          details: (snapshot) =>
            `window=${snapshot.raid?.pressurePosture?.windowLabel ?? "n/a"}, threat=${snapshot.raid?.pressurePosture?.threatLabel ?? "n/a"}`
        },
        {
          label: "squad doctrine reads as a cellar hold package",
          test: (snapshot) =>
            snapshot.combat?.squadDoctrine?.title === "Cellar hold package" &&
            Array.isArray(snapshot.combat?.squadDoctrine?.tags) &&
            snapshot.combat.squadDoctrine.tags.some((tag) => tag.includes("Relay cellar hold")) &&
            snapshot.combat.squadDoctrine.tags.some((tag) => tag.includes("Relay Cellar")),
          details: (snapshot) =>
            `title=${snapshot.combat?.squadDoctrine?.title ?? "n/a"}, tags=${Array.isArray(snapshot.combat?.squadDoctrine?.tags) ? snapshot.combat.squadDoctrine.tags.join(" || ") : "n/a"}`
        },
        {
          label: "operation flow treats the cellar as the committed foothold",
          test: (snapshot) =>
            snapshot.raid?.operationRead?.phase === "commitment" &&
            typeof snapshot.raid?.operationRead?.detail === "string" &&
            snapshot.raid.operationRead.detail.toLowerCase().includes("cellar") &&
            snapshot.raid.operationRead.detail.toLowerCase().includes("back room"),
          details: (snapshot) =>
            `phase=${snapshot.raid?.operationRead?.phase ?? "n/a"}, detail=${snapshot.raid?.operationRead?.detail ?? "n/a"}`
        },
        {
          label: "dialogue now carries the reclaim-window memory through the cellar slice",
          test: (snapshot) =>
            Array.isArray(snapshot.dialogue?.recentSquadEvents) &&
            snapshot.dialogue.recentSquadEvents.some(
              (event) =>
                Array.isArray(event?.memoryTags) &&
                event.memoryTags.includes("sector-reclaiming") &&
                event.memoryTags.includes("surrender-taken")
            ) &&
            typeof snapshot.dialogue?.squadComms?.line === "string" &&
            snapshot.dialogue.squadComms.line.trim().length > 0 &&
            typeof snapshot.dialogue?.hostileComms?.line === "string" &&
            snapshot.dialogue.hostileComms.line.trim().length > 0,
          details: (snapshot) =>
            `recentMemoryTags=${Array.isArray(snapshot.dialogue?.recentSquadEvents) ? snapshot.dialogue.recentSquadEvents.map((event) => Array.isArray(event?.memoryTags) ? event.memoryTags.join("/") : "n/a").join(" || ") : "n/a"}, squadLine=${snapshot.dialogue?.squadComms?.line ?? "n/a"}, hostileLine=${snapshot.dialogue?.hostileComms?.line ?? "n/a"}`
        }
      ]
    };
  }

  if (macroId === "territory-retake") {
    return {
      description: "Validate that the territory-retake showcase returns to Customs Quay as mostly lost ground with one fragile foothold still trying to hold.",
      checks: [
        {
          label: "raid phase remains live",
          test: (snapshot) => snapshot.phase === "raid",
          details: (snapshot) => `phase=${snapshot.phase}`
        },
        {
          label: "the settlement reads as a reclaiming lost district",
          test: (snapshot) =>
            snapshot.map?.settlement?.label === "Customs Quay" &&
            snapshot.map?.settlement?.control === "lost" &&
            snapshot.map?.settlement?.volatility === "breaking",
          details: (snapshot) =>
            `settlement=${snapshot.map?.settlement?.label ?? "n/a"}, control=${snapshot.map?.settlement?.control ?? "n/a"}, volatility=${snapshot.map?.settlement?.volatility ?? "n/a"}`
        },
        {
          label: "the settlement state is formalized with a live shift cycle and return-state situation ids",
          test: (snapshot) =>
            typeof snapshot.map?.settlement?.lastMeaningfulShiftCycle === "number" &&
            snapshot.map.settlement.lastMeaningfulShiftCycle > 0 &&
            Array.isArray(snapshot.map?.settlement?.activeSituationIds) &&
            snapshot.map.settlement.activeSituationIds.includes("control-lost") &&
            snapshot.map.settlement.activeSituationIds.includes("volatility-breaking"),
          details: (snapshot) =>
            `cycle=${snapshot.map?.settlement?.lastMeaningfulShiftCycle ?? "n/a"}, situations=${Array.isArray(snapshot.map?.settlement?.activeSituationIds) ? snapshot.map.settlement.activeSituationIds.join(" || ") : "n/a"}`
        },
        {
          label: "dialogue now acknowledges the breaking settlement return",
          test: (snapshot) =>
            Array.isArray(snapshot.dialogue?.recentSquadEvents) &&
            snapshot.dialogue.recentSquadEvents.some(
              (event) =>
                Array.isArray(event?.memoryTags) &&
                event.memoryTags.includes("sector-breaking") &&
                event.memoryTags.includes("casualty-corridor-open")
            ) &&
            typeof snapshot.dialogue?.squadComms?.line === "string" &&
            typeof snapshot.dialogue?.hostileComms?.line === "string" &&
            (snapshot.dialogue.squadComms.line.includes("district") ||
              snapshot.dialogue.squadComms.line.includes("catwalk lip")) &&
            (snapshot.dialogue.hostileComms.line.includes("settle") ||
              snapshot.dialogue.hostileComms.line.includes("catwalk lip")),
          details: (snapshot) =>
            `recentMemoryTags=${Array.isArray(snapshot.dialogue?.recentSquadEvents) ? snapshot.dialogue.recentSquadEvents.map((event) => Array.isArray(event?.memoryTags) ? event.memoryTags.join(" & ") : "").filter(Boolean).join(" || ") : "n/a"} || squad=${snapshot.dialogue?.squadComms?.line ?? "n/a"} || hostile=${snapshot.dialogue?.hostileComms?.line ?? "n/a"}`
        },
        {
          label: "the active subzone is the quay block being retaken",
          test: (snapshot) => snapshot.map?.activeSubzone?.label === "Customs Block",
          details: (snapshot) => `activeSubzone=${snapshot.map?.activeSubzone?.label ?? "n/a"}`
        },
        {
          label: "frontline markers show both a planted foothold and a live raising claim",
          test: (snapshot) => {
            const incidents = snapshot.frontline?.incidents ?? [];
            const hasReclaimingRaise = incidents.some(
              (incident) => incident.markerState === "raising" && incident.territoryState === "reclaimed"
            );
            const hasBaggedLoss = incidents.some(
              (incident) => incident.markerState === "bagged" && incident.territoryState === "lost"
            );
            return hasReclaimingRaise && hasBaggedLoss;
          },
          details: (snapshot) =>
            `markers=${Array.isArray(snapshot.frontline?.incidents) ? snapshot.frontline.incidents.map((incident) => `${incident.label}:${incident.markerState}/${incident.territoryState}`).join(" || ") : "n/a"}`
        },
        {
          label: "the focused fight is still a live plant decision",
          test: (snapshot) => {
            const focusedIncidentId = snapshot.frontline?.focusedIncidentId;
            const focusedIncident = (snapshot.frontline?.incidents ?? []).find(
              (incident) => incident.id === focusedIncidentId
            );
            return focusedIncident?.actionVerb === "plant" && focusedIncident?.resolved === false;
          },
          details: (snapshot) =>
            (() => {
              const focusedIncidentId = snapshot.frontline?.focusedIncidentId;
              const focusedIncident = (snapshot.frontline?.incidents ?? []).find(
                (incident) => incident.id === focusedIncidentId
              );
              return `focused=${focusedIncident?.label ?? "n/a"}, verb=${focusedIncident?.actionVerb ?? "n/a"}, resolved=${focusedIncident?.resolved ?? "n/a"}`;
            })()
        },
        {
          label: "pressure posture warns about the reserve lane",
          test: (snapshot) =>
            snapshot.map?.pressurePosture?.posture === "reinforcing" &&
            snapshot.map?.pressurePosture?.actionLabel === "Brace for the reserve lane",
          details: (snapshot) =>
            `pressurePosture=${snapshot.map?.pressurePosture?.posture ?? "n/a"}, action=${snapshot.map?.pressurePosture?.actionLabel ?? "n/a"}`
        },
        {
          label: "the squad doctrine treats the block as a retake hold instead of a generic route package",
          test: (snapshot) =>
            snapshot.combat?.squadDoctrine?.title === "Retake hold package" &&
            Array.isArray(snapshot.combat?.squadDoctrine?.mates) &&
            snapshot.combat.squadDoctrine.mates.some((mate) => mate.roleLabel === "Claim lid") &&
            snapshot.combat.squadDoctrine.mates.some((mate) => mate.roleLabel === "Flag runner"),
          details: (snapshot) =>
            `title=${snapshot.combat?.squadDoctrine?.title ?? "n/a"}, roles=${Array.isArray(snapshot.combat?.squadDoctrine?.mates) ? snapshot.combat.squadDoctrine.mates.map((mate) => `${mate.name}:${mate.roleLabel}`).join(" || ") : "n/a"}`
        }
      ]
    };
  }

  if (macroId === "relay-counterpush") {
    return {
      description: "Validate that the relay-counterpush showcase turns Relay Hamlet into a reclaiming compound fight where a routed dish-house pocket must be locked before the reserve lane retakes it.",
      checks: [
        {
          label: "raid phase remains live",
          test: (snapshot) => snapshot.phase === "raid",
          details: (snapshot) => `phase=${snapshot.phase}`
        },
        {
          label: "the settlement reads as a reclaiming relay compound",
          test: (snapshot) =>
            snapshot.map?.settlement?.label === "Relay Hamlet" &&
            snapshot.map?.settlement?.control === "contested" &&
            snapshot.map?.settlement?.volatility === "reclaiming",
          details: (snapshot) =>
            `settlement=${snapshot.map?.settlement?.label ?? "n/a"}, control=${snapshot.map?.settlement?.control ?? "n/a"}, volatility=${snapshot.map?.settlement?.volatility ?? "n/a"}`
        },
        {
          label: "the settlement state is formalized with a live shift cycle and reclaim-window situation ids",
          test: (snapshot) =>
            typeof snapshot.map?.settlement?.lastMeaningfulShiftCycle === "number" &&
            snapshot.map.settlement.lastMeaningfulShiftCycle > 0 &&
            Array.isArray(snapshot.map?.settlement?.activeSituationIds) &&
            snapshot.map.settlement.activeSituationIds.includes("volatility-reclaiming") &&
            snapshot.map.settlement.activeSituationIds.includes("reclaim-window"),
          details: (snapshot) =>
            `cycle=${snapshot.map?.settlement?.lastMeaningfulShiftCycle ?? "n/a"}, situations=${Array.isArray(snapshot.map?.settlement?.activeSituationIds) ? snapshot.map.settlement.activeSituationIds.join(" || ") : "n/a"}`
        },
        {
          label: "dialogue now carries the reclaim-window memory tags",
          test: (snapshot) =>
            Array.isArray(snapshot.dialogue?.currentSquadEvent?.memoryTags) &&
            snapshot.dialogue.currentSquadEvent.memoryTags.includes("sector-reclaiming") &&
            snapshot.dialogue.currentSquadEvent.memoryTags.includes("surrender-taken"),
          details: (snapshot) =>
            `memoryTags=${Array.isArray(snapshot.dialogue?.currentSquadEvent?.memoryTags) ? snapshot.dialogue.currentSquadEvent.memoryTags.join(" || ") : "n/a"}`
        },
        {
          label: "the active subzone is the dish-house reclaim pocket",
          test: (snapshot) => snapshot.map?.activeSubzone?.label === "Dish Houses",
          details: (snapshot) => `activeSubzone=${snapshot.map?.activeSubzone?.label ?? "n/a"}`
        },
        {
          label: "the focused pocket is routed reclaimed ground",
          test: (snapshot) => {
            const focusedIncidentId = snapshot.frontline?.focusedIncidentId;
            const focusedIncident = (snapshot.frontline?.incidents ?? []).find(
              (incident) => incident.id === focusedIncidentId
            );
            return focusedIncident?.territoryState === "reclaimed" && focusedIncident?.status === "routed";
          },
          details: (snapshot) =>
            (() => {
              const focusedIncidentId = snapshot.frontline?.focusedIncidentId;
              const focusedIncident = (snapshot.frontline?.incidents ?? []).find(
                (incident) => incident.id === focusedIncidentId
              );
              return `focused=${focusedIncident?.label ?? "n/a"}, territoryState=${focusedIncident?.territoryState ?? "n/a"}, status=${focusedIncident?.status ?? "n/a"}`;
            })()
        },
        {
          label: "the reserve lane is already feeding the counterpush",
          test: (snapshot) =>
            snapshot.map?.pressurePosture?.posture === "surrendering" &&
            typeof snapshot.map?.pressurePosture?.threatLabel === "string" &&
            snapshot.map.pressurePosture.threatLabel.includes("Reserve in"),
          details: (snapshot) =>
            `pressurePosture=${snapshot.map?.pressurePosture?.posture ?? "n/a"}, threat=${snapshot.map?.pressurePosture?.threatLabel ?? "n/a"}`
        },
        {
          label: "operation flow carries reclaiming settlement pressure",
          test: (snapshot) =>
            ["gain", "commitment"].includes(snapshot.raid?.operationRead?.phase) &&
            (snapshot.raid?.operationRead?.settlementPressurePenalty ?? 0) >= 10 &&
            snapshot.raid?.operationRead?.settlementLabel === "Relay Hamlet",
          details: (snapshot) =>
            `phase=${snapshot.raid?.operationRead?.phase ?? "n/a"}, penalty=${snapshot.raid?.operationRead?.settlementPressurePenalty ?? "n/a"}, settlement=${snapshot.raid?.operationRead?.settlementLabel ?? "n/a"}`
        },
        {
          label: "the squad doctrine stays on a retake hold package",
          test: (snapshot) =>
            snapshot.combat?.squadDoctrine?.title === "Retake hold package" &&
            Array.isArray(snapshot.combat?.squadDoctrine?.mates) &&
            snapshot.combat.squadDoctrine.mates.some((mate) => mate.roleLabel === "Claim lid") &&
            snapshot.combat.squadDoctrine.mates.some((mate) => mate.roleLabel === "Flag runner"),
          details: (snapshot) =>
            `title=${snapshot.combat?.squadDoctrine?.title ?? "n/a"}, roles=${Array.isArray(snapshot.combat?.squadDoctrine?.mates) ? snapshot.combat.squadDoctrine.mates.map((mate) => `${mate.name}:${mate.roleLabel}`).join(" || ") : "n/a"}`
        }
      ]
    };
  }

  if (macroId === "ambulance-counterhold") {
    return {
      description: "Validate that the ambulance-counterhold showcase turns Ambulance Mile into a fragile trench-line return where the med lane lip, clinic cut, and underpass foothold all support the same counterhold.",
      checks: [
        {
          label: "raid phase remains live",
          test: (snapshot) => snapshot.phase === "raid",
          details: (snapshot) => `phase=${snapshot.phase}`
        },
        {
          label: "the settlement reads as a fragile Ambulance Mile trench line",
          test: (snapshot) =>
            snapshot.map?.settlement?.label === "Ambulance Mile" &&
            snapshot.map?.settlement?.control === "contested" &&
            snapshot.map?.settlement?.volatility === "fragile",
          details: (snapshot) =>
            `settlement=${snapshot.map?.settlement?.label ?? "n/a"}, control=${snapshot.map?.settlement?.control ?? "n/a"}, volatility=${snapshot.map?.settlement?.volatility ?? "n/a"}`
        },
        {
          label: "the active subzone is the med lane trench",
          test: (snapshot) => snapshot.map?.activeSubzone?.label === "Med Lane Trench",
          details: (snapshot) => `activeSubzone=${snapshot.map?.activeSubzone?.label ?? "n/a"}`
        },
        {
          label: "pressure posture warns about the trench reserve lane",
          test: (snapshot) =>
            snapshot.map?.pressurePosture?.posture === "reinforcing" &&
            snapshot.map?.pressurePosture?.actionLabel === "Brace the trench reserve lane",
          details: (snapshot) =>
            `pressurePosture=${snapshot.map?.pressurePosture?.posture ?? "n/a"}, action=${snapshot.map?.pressurePosture?.actionLabel ?? "n/a"}`
        },
        {
          label: "operation flow carries Ambulance Mile settlement pressure",
          test: (snapshot) =>
            ["gain", "commitment"].includes(snapshot.raid?.operationRead?.phase) &&
            (snapshot.raid?.operationRead?.settlementPressurePenalty ?? 0) >= 6 &&
            snapshot.raid?.operationRead?.settlementLabel === "Ambulance Mile",
          details: (snapshot) =>
            `phase=${snapshot.raid?.operationRead?.phase ?? "n/a"}, penalty=${snapshot.raid?.operationRead?.settlementPressurePenalty ?? "n/a"}, settlement=${snapshot.raid?.operationRead?.settlementLabel ?? "n/a"}`
        },
        {
          label: "the underpass foothold stays settled behind the trench lip",
          test: (snapshot) =>
            (snapshot.frontline?.incidents ?? []).some(
              (incident) =>
                incident.kind === "bunker" &&
                incident.label === "Underpass strongpoint" &&
                incident.resolved === true &&
                incident.actionVerb === "settle"
            ),
          details: (snapshot) =>
            `bunkers=${(snapshot.frontline?.incidents ?? [])
              .filter((incident) => incident.kind === "bunker")
              .map((incident) => `${incident.label}:${incident.resolved ? "resolved" : "live"}:${incident.actionVerb ?? "n/a"}`)
              .join(" || ")}`
        },
        {
          label: "dialogue now carries fragile-return settlement memory on the trench slice",
          test: (snapshot) =>
            Array.isArray(snapshot.dialogue?.currentSquadEvent?.memoryTags) &&
            snapshot.dialogue.currentSquadEvent.memoryTags.includes("sector-fragile") &&
            snapshot.dialogue.currentSquadEvent.memoryTags.includes("casualty-corridor-open") &&
            typeof snapshot.dialogue?.squadComms?.line === "string" &&
            snapshot.dialogue.squadComms.line.toLowerCase().includes("barely ours") &&
            typeof snapshot.dialogue?.hostileComms?.line === "string" &&
            snapshot.dialogue.hostileComms.line.toLowerCase().includes("med lane is still soft"),
          details: (snapshot) =>
            `memoryTags=${Array.isArray(snapshot.dialogue?.currentSquadEvent?.memoryTags) ? snapshot.dialogue.currentSquadEvent.memoryTags.join(" || ") : "n/a"} || squad=${snapshot.dialogue?.squadComms?.line ?? "n/a"} || hostile=${snapshot.dialogue?.hostileComms?.line ?? "n/a"}`
        },
        {
          label: "the squad doctrine still reads as a trench shove package",
          test: (snapshot) =>
            snapshot.combat?.squadDoctrine?.title === "Trench shove package" &&
            Array.isArray(snapshot.combat?.squadDoctrine?.mates) &&
            snapshot.combat.squadDoctrine.mates.some((mate) => mate.roleLabel === "Lip lid") &&
            snapshot.combat.squadDoctrine.mates.some((mate) => mate.roleLabel === "Bend breaker") &&
            snapshot.combat.squadDoctrine.mates.some((mate) => mate.roleLabel === "Rear cut"),
          details: (snapshot) =>
            `title=${snapshot.combat?.squadDoctrine?.title ?? "n/a"}, roles=${Array.isArray(snapshot.combat?.squadDoctrine?.mates) ? snapshot.combat.squadDoctrine.mates.map((mate) => `${mate.name}:${mate.roleLabel}`).join(" || ") : "n/a"}`
        }
      ]
    };
  }

  if (macroId === "mortar-bracket") {
    return {
      description: "Validate that the mortar-bracket showcase turns Ambulance Mile into a breaking return-state shell-walk problem where the clinic tube, med lane lip, and underpass peel all support the same break-now decision.",
      checks: [
        {
          label: "raid phase remains live",
          test: (snapshot) => snapshot.phase === "raid",
          details: (snapshot) => `phase=${snapshot.phase}`
        },
        {
          label: "the settlement now reads as a breaking Ambulance Mile return",
          test: (snapshot) =>
            snapshot.map?.settlement?.label === "Ambulance Mile" &&
            snapshot.map?.settlement?.control === "contested" &&
            snapshot.map?.settlement?.volatility === "breaking" &&
            typeof snapshot.map?.settlement?.lastMeaningfulShiftCycle === "number" &&
            snapshot.map.settlement.lastMeaningfulShiftCycle > 0 &&
            Array.isArray(snapshot.map?.settlement?.activeSituationIds) &&
            snapshot.map.settlement.activeSituationIds.includes("volatility-breaking"),
          details: (snapshot) =>
            `settlement=${snapshot.map?.settlement?.label ?? "n/a"}, control=${snapshot.map?.settlement?.control ?? "n/a"}, volatility=${snapshot.map?.settlement?.volatility ?? "n/a"}, cycle=${snapshot.map?.settlement?.lastMeaningfulShiftCycle ?? "n/a"}, situations=${Array.isArray(snapshot.map?.settlement?.activeSituationIds) ? snapshot.map.settlement.activeSituationIds.join(" || ") : "n/a"}`
        },
        {
          label: "the focused war beat is still the clinic bracket crew",
          test: (snapshot) => {
            const focusedIncidentId = snapshot.frontline?.focusedIncidentId;
            const focusedIncident = (snapshot.frontline?.incidents ?? []).find((incident) => incident.id === focusedIncidentId);
            return (
              focusedIncident?.kind === "firefight" &&
              focusedIncident?.label === "Clinic bracket crew" &&
              focusedIncident?.actionVerb === "secure" &&
              typeof focusedIncident?.opportunityLabel === "string" &&
              focusedIncident.opportunityLabel.includes("Break the tube")
            );
          },
          details: (snapshot) => {
            const focusedIncidentId = snapshot.frontline?.focusedIncidentId;
            const focusedIncident = (snapshot.frontline?.incidents ?? []).find((incident) => incident.id === focusedIncidentId);
            return `focused=${focusedIncident?.label ?? "n/a"}, kind=${focusedIncident?.kind ?? "n/a"}, verb=${focusedIncident?.actionVerb ?? "n/a"}, opportunity=${focusedIncident?.opportunityLabel ?? "n/a"}`;
          }
        },
        {
          label: "pressure posture explicitly calls the tube break",
          test: (snapshot) =>
            snapshot.map?.pressurePosture?.posture === "reinforcing" &&
            snapshot.map?.pressurePosture?.actionLabel === "Break the tube before next bracket" &&
            snapshot.map?.pressurePosture?.windowLabel === "Bracket walk live",
          details: (snapshot) =>
            `posture=${snapshot.map?.pressurePosture?.posture ?? "n/a"}, action=${snapshot.map?.pressurePosture?.actionLabel ?? "n/a"}, window=${snapshot.map?.pressurePosture?.windowLabel ?? "n/a"}`
        },
        {
          label: "operation flow treats the bracket as the live strip problem",
          test: (snapshot) =>
            snapshot.raid?.operationPhase === "commitment" &&
            snapshot.raid?.operationExitIntent === "profit" &&
            typeof snapshot.raid?.debriefPreview === "string" &&
            snapshot.raid.debriefPreview.includes("tube") &&
            snapshot.raid.debriefPreview.includes("bracket"),
          details: (snapshot) =>
            `phase=${snapshot.raid?.operationPhase ?? "n/a"}, exitIntent=${snapshot.raid?.operationExitIntent ?? "n/a"}, detail=${snapshot.raid?.debriefPreview ?? "n/a"}`
        },
        {
          label: "battlefield markers and dialogue both sell that the settlement is getting worse",
          test: (snapshot) => {
            const incidents = snapshot.frontline?.incidents ?? [];
            const breakingLip = incidents.some(
              (incident) => incident.markerState === "raising" && incident.territoryState === "breaking"
            );
            return (
              breakingLip &&
              Array.isArray(snapshot.dialogue?.currentSquadEvent?.memoryTags) &&
              snapshot.dialogue.currentSquadEvent.memoryTags.includes("sector-breaking") &&
              snapshot.dialogue.currentSquadEvent.memoryTags.includes("casualty-corridor-open") &&
              typeof snapshot.dialogue?.squadComms?.line === "string" &&
              snapshot.dialogue.squadComms.line.toLowerCase().includes("tube is walking short") &&
              typeof snapshot.dialogue?.hostileComms?.line === "string" &&
              snapshot.dialogue.hostileComms.line.toLowerCase().includes("walk the bracket tighter")
            );
          },
          details: (snapshot) =>
            `markers=${Array.isArray(snapshot.frontline?.incidents) ? snapshot.frontline.incidents.map((incident) => `${incident.label}:${incident.markerState}/${incident.territoryState}`).join(" || ") : "n/a"} || memoryTags=${Array.isArray(snapshot.dialogue?.currentSquadEvent?.memoryTags) ? snapshot.dialogue.currentSquadEvent.memoryTags.join(" || ") : "n/a"} || squad=${snapshot.dialogue?.squadComms?.line ?? "n/a"} || hostile=${snapshot.dialogue?.hostileComms?.line ?? "n/a"}`
        },
        {
          label: "the squad doctrine flips into the mortar break package",
          test: (snapshot) =>
            snapshot.combat?.squadDoctrine?.title === "Mortar break package" &&
            Array.isArray(snapshot.combat?.squadDoctrine?.mates) &&
            snapshot.combat.squadDoctrine.mates.some((mate) => mate.roleLabel === "Tube lid") &&
            snapshot.combat.squadDoctrine.mates.some((mate) => mate.roleLabel === "Glass break") &&
            snapshot.combat.squadDoctrine.mates.some((mate) => mate.roleLabel === "Underpass runner"),
          details: (snapshot) =>
            `title=${snapshot.combat?.squadDoctrine?.title ?? "n/a"}, roles=${Array.isArray(snapshot.combat?.squadDoctrine?.mates) ? snapshot.combat.squadDoctrine.mates.map((mate) => `${mate.name}:${mate.roleLabel}`).join(" || ") : "n/a"}`
        }
      ]
    };
  }

  if (macroId === "retake-peel") {
    return {
      description: "Validate that the retake-peel showcase turns the Customs Quay return state into a hotter extract decision instead of a generic profit exit.",
      checks: [
        {
          label: "raid phase remains live",
          test: (snapshot) => snapshot.phase === "raid",
          details: (snapshot) => `phase=${snapshot.phase}`
        },
        {
          label: "the settlement is still mostly lost and breaking",
          test: (snapshot) =>
            snapshot.map?.settlement?.label === "Customs Quay" &&
            snapshot.map?.settlement?.control === "lost" &&
            snapshot.map?.settlement?.volatility === "breaking",
          details: (snapshot) =>
            `settlement=${snapshot.map?.settlement?.label ?? "n/a"}, control=${snapshot.map?.settlement?.control ?? "n/a"}, volatility=${snapshot.map?.settlement?.volatility ?? "n/a"}`
        },
        {
          label: "operation flow is extract-committed under settlement pressure",
          test: (snapshot) =>
            ["commitment", "exfil", "collapse"].includes(snapshot.raid?.operationRead?.phase) &&
            (snapshot.raid?.operationRead?.settlementPressurePenalty ?? 0) > 0,
          details: (snapshot) =>
            `phase=${snapshot.raid?.operationRead?.phase ?? "n/a"}, penalty=${snapshot.raid?.operationRead?.settlementPressurePenalty ?? "n/a"}`
        },
        {
          label: "operation detail explicitly carries the settlement extract warning",
          test: (snapshot) =>
            typeof snapshot.raid?.operationRead?.detail === "string" &&
            (snapshot.raid.operationRead.detail.includes("wider settlement") ||
              snapshot.raid.operationRead.detail.includes("Late extracts get uglier")) &&
            (snapshot.raid.operationRead.detail.includes("peel") ||
              snapshot.raid.operationRead.detail.includes("Leave under pressure now")),
          details: (snapshot) => `detail=${snapshot.raid?.operationRead?.detail ?? "n/a"}`
        },
        {
          label: "the extract is already warming or hotter",
          test: (snapshot) => ["warming", "hot", "slipping"].includes(snapshot.raid?.extractCleanliness),
          details: (snapshot) => `extractCleanliness=${snapshot.raid?.extractCleanliness ?? "n/a"}`
        },
        {
          label: "the squad doctrine flips into a peel-screen package",
          test: (snapshot) =>
            ["Settlement peel package", "Peel-screen package"].includes(snapshot.combat?.squadDoctrine?.title) &&
            Array.isArray(snapshot.combat?.squadDoctrine?.mates) &&
            snapshot.combat.squadDoctrine.mates.some((mate) => mate.roleLabel === "Peel lid") &&
            snapshot.combat.squadDoctrine.mates.some((mate) => mate.roleLabel === "Beacon runner"),
          details: (snapshot) =>
            `title=${snapshot.combat?.squadDoctrine?.title ?? "n/a"}, roles=${Array.isArray(snapshot.combat?.squadDoctrine?.mates) ? snapshot.combat.squadDoctrine.mates.map((mate) => `${mate.name}:${mate.roleLabel}`).join(" || ") : "n/a"}`
        }
      ]
    };
  }

  if (macroId === "armored-evac") {
    return {
      description: "Validate that the armored-evac showcase stages a real medevac-versus-recovery strip where the wagon, casualty lane, and recovery doctrine all point at the same peel problem.",
      checks: [
        {
          label: "raid phase remains live",
          test: (snapshot) => snapshot.phase === "raid",
          details: (snapshot) => `phase=${snapshot.phase}`
        },
        {
          label: "the focused war beat is still the casualty strip",
          test: (snapshot) => {
            const focusedIncidentId = snapshot.frontline?.focusedIncidentId;
            const focusedIncident = (snapshot.frontline?.incidents ?? []).find((incident) => incident.id === focusedIncidentId);
            return focusedIncident?.kind === "casualty" && focusedIncident?.resolved === false;
          },
          details: (snapshot) => {
            const focusedIncidentId = snapshot.frontline?.focusedIncidentId;
            const focusedIncident = (snapshot.frontline?.incidents ?? []).find((incident) => incident.id === focusedIncidentId);
            return `focused=${focusedIncident?.label ?? "n/a"}, kind=${focusedIncident?.kind ?? "n/a"}, resolved=${focusedIncident?.resolved ?? "n/a"}`;
          }
        },
        {
          label: "a live evac wagon is still extracting beside the casualty lane",
          test: (snapshot) =>
            Array.isArray(snapshot.frontline?.incidents) &&
            snapshot.frontline.incidents.some(
              (incident) =>
                incident.kind === "convoy" &&
                incident.status === "extracting" &&
                typeof incident.label === "string" &&
                incident.label.toLowerCase().includes("evac wagon")
            ),
          details: (snapshot) =>
            `incidents=${Array.isArray(snapshot.frontline?.incidents) ? snapshot.frontline.incidents.map((incident) => `${incident.label}:${incident.kind}/${incident.status}`).join(" || ") : "n/a"}`
        },
        {
          label: "settlement memory keeps the casualty corridor and convoy hit live together",
          test: (snapshot) =>
            Array.isArray(snapshot.map?.settlement?.memoryTags) &&
            snapshot.map.settlement.memoryTags.includes("casualty-corridor-open") &&
            snapshot.map.settlement.memoryTags.includes("convoy-hit"),
          details: (snapshot) =>
            `memoryTags=${Array.isArray(snapshot.map?.settlement?.memoryTags) ? snapshot.map.settlement.memoryTags.join(" || ") : "n/a"}`
        },
        {
          label: "operation flow explicitly reads the wagon fight as recovery-driven",
          test: (snapshot) =>
            snapshot.raid?.operationRead?.exitIntent === "recovery" &&
            typeof snapshot.raid?.operationRead?.detail === "string" &&
            (snapshot.raid.operationRead.detail.includes("evac wagon") ||
              snapshot.raid.operationRead.detail.includes("load mouth") ||
              snapshot.raid.operationRead.detail.includes("wagon shoulder")),
          details: (snapshot) =>
            `exitIntent=${snapshot.raid?.operationRead?.exitIntent ?? "n/a"}, detail=${snapshot.raid?.operationRead?.detail ?? "n/a"}`
        },
        {
          label: "pressure posture tells the player to break the wagon lane",
          test: (snapshot) =>
            snapshot.map?.pressurePosture?.posture === "recovering" &&
            snapshot.map?.pressurePosture?.actionLabel === "Break the wagon lane" &&
            snapshot.map?.pressurePosture?.threatLabel === "Wagon load still exposed",
          details: (snapshot) =>
            `posture=${snapshot.map?.pressurePosture?.posture ?? "n/a"}, action=${snapshot.map?.pressurePosture?.actionLabel ?? "n/a"}, threat=${snapshot.map?.pressurePosture?.threatLabel ?? "n/a"}`
        },
        {
          label: "the squad doctrine stays in the recovery corridor package",
          test: (snapshot) =>
            snapshot.combat?.squadDoctrine?.title === "Recovery corridor package" &&
            Array.isArray(snapshot.combat?.squadDoctrine?.mates) &&
            snapshot.combat.squadDoctrine.mates.some((mate) => mate.roleLabel === "Corridor lid") &&
            snapshot.combat.squadDoctrine.mates.some((mate) => mate.roleLabel === "Drag runner"),
          details: (snapshot) =>
            `title=${snapshot.combat?.squadDoctrine?.title ?? "n/a"}, roles=${Array.isArray(snapshot.combat?.squadDoctrine?.mates) ? snapshot.combat.squadDoctrine.mates.map((mate) => `${mate.name}:${mate.roleLabel}`).join(" || ") : "n/a"}`
        }
      ]
    };
  }

  if (macroId === "white-van-ambush") {
    return {
      description: "Validate that the white-van-ambush showcase stages Relay Hamlet as a live comms-strip logistics cut instead of a generic reclaim.",
      checks: [
        {
          label: "raid phase remains live",
          test: (snapshot) => snapshot.phase === "raid",
          details: (snapshot) => `phase=${snapshot.phase}`
        },
        {
          label: "the settlement reads as a fragile Relay Hamlet return",
          test: (snapshot) =>
            snapshot.map?.settlement?.label === "Relay Hamlet" &&
            snapshot.map?.settlement?.control === "contested" &&
            snapshot.map?.settlement?.volatility === "fragile",
          details: (snapshot) =>
            `settlement=${snapshot.map?.settlement?.label ?? "n/a"}, control=${snapshot.map?.settlement?.control ?? "n/a"}, volatility=${snapshot.map?.settlement?.volatility ?? "n/a"}`
        },
        {
          label: "the active subzone stays on the relay cellar strip",
          test: (snapshot) => snapshot.map?.activeSubzone?.label === "Relay Cellar",
          details: (snapshot) => `activeSubzone=${snapshot.map?.activeSubzone?.label ?? "n/a"}`
        },
        {
          label: "the focused war beat is still the white van strip",
          test: (snapshot) => {
            const focusedIncidentId = snapshot.frontline?.focusedIncidentId;
            const focusedIncident = (snapshot.frontline?.incidents ?? []).find((incident) => incident.id === focusedIncidentId);
            return focusedIncident?.kind === "convoy" && focusedIncident?.actionVerb === "strip" && focusedIncident?.label === "Relay white van hit";
          },
          details: (snapshot) => {
            const focusedIncidentId = snapshot.frontline?.focusedIncidentId;
            const focusedIncident = (snapshot.frontline?.incidents ?? []).find((incident) => incident.id === focusedIncidentId);
            return `focused=${focusedIncident?.label ?? "n/a"}, kind=${focusedIncident?.kind ?? "n/a"}, verb=${focusedIncident?.actionVerb ?? "n/a"}`;
          }
        },
        {
          label: "settlement memory records the logistics lane as a convoy hit",
          test: (snapshot) =>
            Array.isArray(snapshot.map?.settlement?.memoryTags) &&
            snapshot.map.settlement.memoryTags.includes("convoy-hit"),
          details: (snapshot) =>
            `memoryTags=${Array.isArray(snapshot.map?.settlement?.memoryTags) ? snapshot.map.settlement.memoryTags.join(" || ") : "n/a"}`
        },
        {
          label: "pressure posture warns the player to strip the mast kit before reserve",
          test: (snapshot) =>
            snapshot.map?.pressurePosture?.posture === "reinforcing" &&
            snapshot.map?.pressurePosture?.actionLabel === "Strip the mast kit before reserve",
          details: (snapshot) =>
            `posture=${snapshot.map?.pressurePosture?.posture ?? "n/a"}, action=${snapshot.map?.pressurePosture?.actionLabel ?? "n/a"}, threat=${snapshot.map?.pressurePosture?.threatLabel ?? "n/a"}`
        },
        {
          label: "operation flow treats the van hit as the live commitment problem",
          test: (snapshot) =>
            snapshot.raid?.operationPhase === "commitment" &&
            snapshot.raid?.operationExitIntent === "profit" &&
            typeof snapshot.raid?.debriefPreview === "string" &&
            snapshot.raid.debriefPreview.includes("mast kit") &&
            snapshot.raid.debriefPreview.includes("comms-strip"),
          details: (snapshot) =>
            `phase=${snapshot.raid?.operationPhase ?? "n/a"}, exitIntent=${snapshot.raid?.operationExitIntent ?? "n/a"}, detail=${snapshot.raid?.debriefPreview ?? "n/a"}`
        },
        {
          label: "the squad doctrine flips into the comms strip package",
          test: (snapshot) =>
            snapshot.combat?.squadDoctrine?.title === "Comms strip package" &&
            Array.isArray(snapshot.combat?.squadDoctrine?.mates) &&
            snapshot.combat.squadDoctrine.mates.some((mate) => mate.roleLabel === "Verge screen") &&
            snapshot.combat.squadDoctrine.mates.some((mate) => mate.roleLabel === "Van mouth lid") &&
            snapshot.combat.squadDoctrine.mates.some((mate) => mate.roleLabel === "Mast runner"),
          details: (snapshot) =>
            `title=${snapshot.combat?.squadDoctrine?.title ?? "n/a"}, roles=${Array.isArray(snapshot.combat?.squadDoctrine?.mates) ? snapshot.combat.squadDoctrine.mates.map((mate) => `${mate.name}:${mate.roleLabel}`).join(" || ") : "n/a"}`
        }
      ]
    };
  }

  if (macroId === "armored-drop") {
    return {
      description: "Validate that the armored-drop showcase stages Relay Hamlet as a live troop-drop crash instead of a screenshot-only convoy beat.",
      checks: [
        {
          label: "raid phase remains live",
          test: (snapshot) => snapshot.phase === "raid",
          details: (snapshot) => `phase=${snapshot.phase}`
        },
        {
          label: "the focused war beat is still the armored troop drop",
          test: (snapshot) => {
            const focusedIncidentId = snapshot.frontline?.focusedIncidentId;
            const focusedIncident = (snapshot.frontline?.incidents ?? []).find((incident) => incident.id === focusedIncidentId);
            return focusedIncident?.kind === "convoy" && focusedIncident?.label === "Relay troop drop" && focusedIncident?.actionVerb === "strip";
          },
          details: (snapshot) => {
            const focusedIncidentId = snapshot.frontline?.focusedIncidentId;
            const focusedIncident = (snapshot.frontline?.incidents ?? []).find((incident) => incident.id === focusedIncidentId);
            return `focused=${focusedIncident?.label ?? "n/a"}, kind=${focusedIncident?.kind ?? "n/a"}, verb=${focusedIncident?.actionVerb ?? "n/a"}`;
          }
        },
        {
          label: "settlement memory records the troop drop lane as a convoy hit",
          test: (snapshot) =>
            Array.isArray(snapshot.map?.settlement?.memoryTags) &&
            snapshot.map.settlement.memoryTags.includes("convoy-hit"),
          details: (snapshot) =>
            `memoryTags=${Array.isArray(snapshot.map?.settlement?.memoryTags) ? snapshot.map.settlement.memoryTags.join(" || ") : "n/a"}`
        },
        {
          label: "pressure posture warns the player to crash the ramp before dismount",
          test: (snapshot) =>
            snapshot.map?.pressurePosture?.posture === "reinforcing" &&
            snapshot.map?.pressurePosture?.actionLabel === "Crash the ramp before dismount" &&
            snapshot.map?.pressurePosture?.windowLabel === "Ramp kill lane live",
          details: (snapshot) =>
            `posture=${snapshot.map?.pressurePosture?.posture ?? "n/a"}, action=${snapshot.map?.pressurePosture?.actionLabel ?? "n/a"}, window=${snapshot.map?.pressurePosture?.windowLabel ?? "n/a"}`
        },
        {
          label: "operation flow treats the drop as the live reinforcement break",
          test: (snapshot) =>
            snapshot.raid?.operationPhase === "commitment" &&
            snapshot.raid?.operationExitIntent === "profit" &&
            typeof snapshot.raid?.debriefPreview === "string" &&
            snapshot.raid.debriefPreview.includes("reinforcement break") &&
            snapshot.raid.debriefPreview.includes("ramp"),
          details: (snapshot) =>
            `phase=${snapshot.raid?.operationPhase ?? "n/a"}, exitIntent=${snapshot.raid?.operationExitIntent ?? "n/a"}, detail=${snapshot.raid?.debriefPreview ?? "n/a"}`
        },
        {
          label: "the squad doctrine flips into the ramp crash package",
          test: (snapshot) =>
            snapshot.combat?.squadDoctrine?.title === "Ramp crash package" &&
            Array.isArray(snapshot.combat?.squadDoctrine?.mates) &&
            snapshot.combat.squadDoctrine.mates.some((mate) => mate.roleLabel === "Ramp lid") &&
            snapshot.combat.squadDoctrine.mates.some((mate) => mate.roleLabel === "Spill runner"),
          details: (snapshot) =>
            `title=${snapshot.combat?.squadDoctrine?.title ?? "n/a"}, roles=${Array.isArray(snapshot.combat?.squadDoctrine?.mates) ? snapshot.combat.squadDoctrine.mates.map((mate) => `${mate.name}:${mate.roleLabel}`).join(" || ") : "n/a"}`
        }
      ]
    };
  }

  if (macroId === "shed-hide") {
    return {
      description: "Validate that the shed-hide showcase stages Relay Hamlet as a live hide-pocket infiltration beat instead of a generic fragile reclaim.",
      checks: [
        {
          label: "raid phase remains live",
          test: (snapshot) => snapshot.phase === "raid",
          details: (snapshot) => `phase=${snapshot.phase}`
        },
        {
          label: "the settlement still reads as a fragile Relay Hamlet sweep",
          test: (snapshot) =>
            snapshot.map?.settlement?.label === "Relay Hamlet" &&
            snapshot.map?.settlement?.control === "contested" &&
            snapshot.map?.settlement?.volatility === "fragile",
          details: (snapshot) =>
            `settlement=${snapshot.map?.settlement?.label ?? "n/a"}, control=${snapshot.map?.settlement?.control ?? "n/a"}, volatility=${snapshot.map?.settlement?.volatility ?? "n/a"}`
        },
        {
          label: "the focused war beat is still the tin shed hide",
          test: (snapshot) => {
            const focusedIncidentId = snapshot.frontline?.focusedIncidentId;
            const focusedIncident = (snapshot.frontline?.incidents ?? []).find((incident) => incident.id === focusedIncidentId);
            return focusedIncident?.kind === "bunker" && focusedIncident?.label === "Tin shed hide" && focusedIncident?.actionVerb === "settle";
          },
          details: (snapshot) => {
            const focusedIncidentId = snapshot.frontline?.focusedIncidentId;
            const focusedIncident = (snapshot.frontline?.incidents ?? []).find((incident) => incident.id === focusedIncidentId);
            return `focused=${focusedIncident?.label ?? "n/a"}, kind=${focusedIncident?.kind ?? "n/a"}, verb=${focusedIncident?.actionVerb ?? "n/a"}`;
          }
        },
        {
          label: "operation flow treats the hide as the live commitment problem",
          test: (snapshot) =>
            snapshot.raid?.operationPhase === "commitment" &&
            snapshot.raid?.operationExitIntent === "profit" &&
            typeof snapshot.raid?.debriefPreview === "string" &&
            (snapshot.raid.debriefPreview.includes("only quiet hide") ||
              snapshot.raid.debriefPreview.includes("boys silent") ||
              snapshot.raid.debriefPreview.includes("slip back")),
          details: (snapshot) =>
            `phase=${snapshot.raid?.operationPhase ?? "n/a"}, exitIntent=${snapshot.raid?.operationExitIntent ?? "n/a"}, detail=${snapshot.raid?.debriefPreview ?? "n/a"}`
        },
        {
          label: "pressure posture explicitly calls the hide window",
          test: (snapshot) =>
            snapshot.map?.pressurePosture?.posture === "holding" &&
            snapshot.map?.pressurePosture?.actionLabel === "Stay dark in the shed" &&
            snapshot.map?.pressurePosture?.windowLabel === "Hide window live",
          details: (snapshot) =>
            `posture=${snapshot.map?.pressurePosture?.posture ?? "n/a"}, action=${snapshot.map?.pressurePosture?.actionLabel ?? "n/a"}, window=${snapshot.map?.pressurePosture?.windowLabel ?? "n/a"}`
        },
        {
          label: "noise pressure sells the opening as a quiet ingress window",
          test: (snapshot) =>
            snapshot.map?.noisePressure?.title === "QUIET INGRESS" &&
            typeof snapshot.map?.noisePressure?.status === "string" &&
            snapshot.map.noisePressure.status.includes("cold-entry window"),
          details: (snapshot) =>
            `title=${snapshot.map?.noisePressure?.title ?? "n/a"}, status=${snapshot.map?.noisePressure?.status ?? "n/a"}`
        },
        {
          label: "the squad doctrine flips into the hide pocket package",
          test: (snapshot) =>
            snapshot.combat?.squadDoctrine?.title === "Hide pocket package" &&
            Array.isArray(snapshot.combat?.squadDoctrine?.mates) &&
            snapshot.combat.squadDoctrine.mates.some((mate) => mate.roleLabel === "Slit watch") &&
            snapshot.combat.squadDoctrine.mates.some((mate) => mate.roleLabel === "Slip runner"),
          details: (snapshot) =>
            `title=${snapshot.combat?.squadDoctrine?.title ?? "n/a"}, roles=${Array.isArray(snapshot.combat?.squadDoctrine?.mates) ? snapshot.combat.squadDoctrine.mates.map((mate) => `${mate.name}:${mate.roleLabel}`).join(" || ") : "n/a"}`
        }
      ]
    };
  }

  if (macroId === "civilian-window") {
    return {
      description: "Validate that the civilian-window showcase stages Broken Signal as a real under-fire family escort instead of a soft civilian objective bubble.",
      checks: [
        {
          label: "raid phase remains live",
          test: (snapshot) => snapshot.phase === "raid",
          details: (snapshot) => `phase=${snapshot.phase}`
        },
        {
          label: "the settlement stays on the contested relay block",
          test: (snapshot) =>
            snapshot.map?.settlement?.label === "Relay Hamlet" &&
            snapshot.map?.settlement?.control === "contested",
          details: (snapshot) =>
            `settlement=${snapshot.map?.settlement?.label ?? "n/a"}, control=${snapshot.map?.settlement?.control ?? "n/a"}, volatility=${snapshot.map?.settlement?.volatility ?? "n/a"}`
        },
        {
          label: "the focused war beat is still the civilian evacuation",
          test: (snapshot) => {
            const focusedIncidentId = snapshot.frontline?.focusedIncidentId;
            const focusedIncident = (snapshot.frontline?.incidents ?? []).find((incident) => incident.id === focusedIncidentId);
            return focusedIncident?.kind === "civilian" && focusedIncident?.actionVerb === "evacuate";
          },
          details: (snapshot) => {
            const focusedIncidentId = snapshot.frontline?.focusedIncidentId;
            const focusedIncident = (snapshot.frontline?.incidents ?? []).find((incident) => incident.id === focusedIncidentId);
            return `focused=${focusedIncident?.label ?? "n/a"}, kind=${focusedIncident?.kind ?? "n/a"}, verb=${focusedIncident?.actionVerb ?? "n/a"}, status=${focusedIncident?.status ?? "n/a"}`;
          }
        },
        {
          label: "pressure posture reads as a live escort lane",
          test: (snapshot) =>
            snapshot.map?.pressurePosture?.posture === "recovering" &&
            snapshot.map?.pressurePosture?.actionLabel === "Walk the family to the van" &&
            snapshot.map?.pressurePosture?.windowLabel === "Escort lane live",
          details: (snapshot) =>
            `posture=${snapshot.map?.pressurePosture?.posture ?? "n/a"}, action=${snapshot.map?.pressurePosture?.actionLabel ?? "n/a"}, window=${snapshot.map?.pressurePosture?.windowLabel ?? "n/a"}`
        },
        {
          label: "operation flow treats the block as an escort contract, not profit greed",
          test: (snapshot) =>
            snapshot.raid?.operationPhase === "commitment" &&
            snapshot.raid?.operationExitIntent === "contract" &&
            typeof snapshot.raid?.debriefPreview === "string" &&
            snapshot.raid.debriefPreview.includes("family") &&
            snapshot.raid.debriefPreview.includes("van"),
          details: (snapshot) =>
            `phase=${snapshot.raid?.operationPhase ?? "n/a"}, exitIntent=${snapshot.raid?.operationExitIntent ?? "n/a"}, detail=${snapshot.raid?.debriefPreview ?? "n/a"}`
        },
        {
          label: "the squad doctrine flips into the civilian escort package",
          test: (snapshot) =>
            snapshot.combat?.squadDoctrine?.title === "Civilian escort package" &&
            Array.isArray(snapshot.combat?.squadDoctrine?.mates) &&
            snapshot.combat.squadDoctrine.mates.some((mate) => mate.roleLabel === "Curb lid") &&
            snapshot.combat.squadDoctrine.mates.some((mate) => mate.roleLabel === "Van escort"),
          details: (snapshot) =>
            `title=${snapshot.combat?.squadDoctrine?.title ?? "n/a"}, roles=${Array.isArray(snapshot.combat?.squadDoctrine?.mates) ? snapshot.combat.squadDoctrine.mates.map((mate) => `${mate.name}:${mate.roleLabel}`).join(" || ") : "n/a"}`
        }
      ]
    };
  }

  if (macroId === "hunter-search") {
    return {
      description: "Validate that the hunter-search showcase turns the old-hunter beat into a real protected guide lane instead of a screenshot-only civilian story.",
      checks: [
        {
          label: "raid phase remains live",
          test: (snapshot) => snapshot.phase === "raid",
          details: (snapshot) => `phase=${snapshot.phase}`
        },
        {
          label: "the settlement stays on the contested relay block",
          test: (snapshot) =>
            snapshot.map?.settlement?.label === "Relay Hamlet" &&
            snapshot.map?.settlement?.control === "contested",
          details: (snapshot) =>
            `settlement=${snapshot.map?.settlement?.label ?? "n/a"}, control=${snapshot.map?.settlement?.control ?? "n/a"}, volatility=${snapshot.map?.settlement?.volatility ?? "n/a"}`
        },
        {
          label: "the focused war beat is still the hunter guide lane",
          test: (snapshot) => {
            const focusedIncidentId = snapshot.frontline?.focusedIncidentId;
            const focusedIncident = (snapshot.frontline?.incidents ?? []).find((incident) => incident.id === focusedIncidentId);
            return (
              focusedIncident?.kind === "civilian" &&
              focusedIncident?.label === "Old hunter search" &&
              typeof focusedIncident?.opportunityLabel === "string" &&
              focusedIncident.opportunityLabel.includes("son's route note") &&
              focusedIncident?.actionVerb === "evacuate"
            );
          },
          details: (snapshot) => {
            const focusedIncidentId = snapshot.frontline?.focusedIncidentId;
            const focusedIncident = (snapshot.frontline?.incidents ?? []).find((incident) => incident.id === focusedIncidentId);
            return `focused=${focusedIncident?.label ?? "n/a"}, kind=${focusedIncident?.kind ?? "n/a"}, opportunity=${focusedIncident?.opportunityLabel ?? "n/a"}, verb=${focusedIncident?.actionVerb ?? "n/a"}`;
          }
        },
        {
          label: "pressure posture reads as a live hunter guide lane",
          test: (snapshot) =>
            snapshot.map?.pressurePosture?.posture === "recovering" &&
            snapshot.map?.pressurePosture?.actionLabel === "Guide the hunter off the reeds" &&
            snapshot.map?.pressurePosture?.windowLabel === "Search lane live",
          details: (snapshot) =>
            `posture=${snapshot.map?.pressurePosture?.posture ?? "n/a"}, action=${snapshot.map?.pressurePosture?.actionLabel ?? "n/a"}, window=${snapshot.map?.pressurePosture?.windowLabel ?? "n/a"}`
        },
        {
          label: "operation flow treats the search as the live commitment problem",
          test: (snapshot) =>
            snapshot.raid?.operationPhase === "commitment" &&
            snapshot.raid?.operationExitIntent === "contract" &&
            typeof snapshot.raid?.debriefPreview === "string" &&
            snapshot.raid.debriefPreview.includes("hunter") &&
            snapshot.raid.debriefPreview.includes("route note"),
          details: (snapshot) =>
            `phase=${snapshot.raid?.operationPhase ?? "n/a"}, exitIntent=${snapshot.raid?.operationExitIntent ?? "n/a"}, detail=${snapshot.raid?.debriefPreview ?? "n/a"}`
        },
        {
          label: "the squad doctrine flips into the hunter screen package",
          test: (snapshot) =>
            snapshot.combat?.squadDoctrine?.title === "Hunter screen package" &&
            Array.isArray(snapshot.combat?.squadDoctrine?.mates) &&
            snapshot.combat.squadDoctrine.mates.some((mate) => mate.roleLabel === "Reed screen") &&
            snapshot.combat.squadDoctrine.mates.some((mate) => mate.roleLabel === "Guide hand"),
          details: (snapshot) =>
            `title=${snapshot.combat?.squadDoctrine?.title ?? "n/a"}, roles=${Array.isArray(snapshot.combat?.squadDoctrine?.mates) ? snapshot.combat.squadDoctrine.mates.map((mate) => `${mate.name}:${mate.roleLabel}`).join(" || ") : "n/a"}`
        }
      ]
    };
  }

  if (macroId === "wounded-soldier") {
    return {
      description: "Validate that the wounded-soldier showcase treats a stabilized squadmate as a live medical-hold problem instead of generic room-clear aftermath.",
      checks: [
        {
          label: "raid stays live with the wounded beat focused",
          test: (snapshot) =>
            snapshot.phase === "raid" &&
            typeof snapshot.frontline?.focusedIncidentId === "number" &&
            Array.isArray(snapshot.frontline?.incidents) &&
            snapshot.frontline.incidents.some(
              (incident) =>
                incident.id === snapshot.frontline.focusedIncidentId &&
                incident.presentationVariant === "wounded-soldier"
            ),
          details: (snapshot) =>
            `phase=${snapshot.phase}, focusedIncidentId=${snapshot.frontline?.focusedIncidentId ?? "n/a"}, variants=${Array.isArray(snapshot.frontline?.incidents) ? snapshot.frontline.incidents.filter((incident) => incident.id === snapshot.frontline.focusedIncidentId).map((incident) => incident.presentationVariant).join(" | ") : "n/a"}`
        },
        {
          label: "pressure posture treats the split as a wounded shoulder hold",
          test: (snapshot) =>
            snapshot.map?.pressurePosture?.posture === "recovering" &&
            snapshot.map?.pressurePosture?.actionLabel === "Keep Yara on the line" &&
            snapshot.map?.pressurePosture?.windowLabel === "Wounded shoulder live",
          details: (snapshot) =>
            `posture=${snapshot.map?.pressurePosture?.posture ?? "n/a"}, action=${snapshot.map?.pressurePosture?.actionLabel ?? "n/a"}, window=${snapshot.map?.pressurePosture?.windowLabel ?? "n/a"}`
        },
        {
          label: "operation flow treats the wound-hold as the live survival problem",
          test: (snapshot) =>
            snapshot.raid?.operationExitIntent === "survival" &&
            typeof snapshot.raid?.debriefPreview === "string" &&
            snapshot.raid.debriefPreview.includes("Yara") &&
            snapshot.raid.debriefPreview.includes("shoulder"),
          details: (snapshot) =>
            `exitIntent=${snapshot.raid?.operationExitIntent ?? "n/a"}, detail=${snapshot.raid?.debriefPreview ?? "n/a"}`
        },
        {
          label: "the squad doctrine flips into the medical hold package",
          test: (snapshot) =>
            snapshot.combat?.squadDoctrine?.title === "Medical hold package" &&
            typeof snapshot.combat?.squadDoctrine?.summary === "string" &&
            snapshot.combat.squadDoctrine.summary.includes("Yara") &&
            snapshot.combat.squadDoctrine.summary.includes("wounded"),
          details: (snapshot) =>
            `title=${snapshot.combat?.squadDoctrine?.title ?? "n/a"}, summary=${snapshot.combat?.squadDoctrine?.summary ?? "n/a"}`
        },
        {
          label: "Yara stays stabilized but visibly wounded in squad state",
          test: (snapshot) =>
            Array.isArray(snapshot.raid?.squadMates) &&
            snapshot.raid.squadMates.some(
              (mate) =>
                mate.name === "Yara" &&
                mate.casualtyState === "wounded" &&
                mate.woundSeverity === "severe" &&
                mate.stabilized === true
            ),
          details: (snapshot) =>
            `mates=${Array.isArray(snapshot.raid?.squadMates) ? snapshot.raid.squadMates.map((mate) => `${mate.name}:${mate.casualtyState}/${mate.woundSeverity}/${mate.stabilized}`).join(" || ") : "n/a"}`
        }
      ]
    };
  }

  return null;
}

function evaluateMacroVerification(macroId, snapshot) {
  const config = getMacroVerificationConfig(macroId);
  if (!config) {
    throw new Error(
        `verify requires --id to be one of main-menu-to-stash, stash-to-raid, equip-major-weapons, equip-low-tier-guns, wave-target-discipline, same-room-reinforcement-guard, no-immortal-runtime, legacy-crossfire-disabled, legacy-runtime-clean-states, doorway-regression, room-clear-drill, room-clear-chain, expanded-frontline, blue-carried-fire, blue-carried-extract-success, blue-body-extract, extract-clean, extract-collapse, body-recovery, intel-alarm, drone-sweep, hostile-lane-chatter, caravan-trap, persistent-body-return, dialogue-aftermath, field-coffee, burner-coffee, surrender-window, armored-evac, combat-presentation, combat-audio, boys-frag-runtime, suppression-runtime, pinned-pressure, fireteam-audit, territory-claims, hardcore-start, first-session-hook, route-identity-pass, must-clear-structure-pass, stash-consequence-pass, weapon-doctrine, field-capture, field-pivot, broker-cashout, chair-handoff, handgun-recovery, final-stronghold, recovery-corridor-payoff, endgame-amr, amr-counter-lane, final-stronghold-launch, final-stronghold-setback, true-escape, trench-assault, bunker-foothold, cellar-counterhold, shed-hide, territory-retake, relay-counterpush, ambulance-counterhold, mortar-bracket, retake-peel, civilian-window, hunter-search, wounded-soldier, white-van-ambush, or armored-drop. Received "${macroId}".`
    );
  }

  const checks = config.checks.map((check) => {
    const passed = Boolean(check.test(snapshot));
    return {
      label: check.label,
      passed,
      details: check.details(snapshot)
    };
  });

  return {
    macro: macroId,
    description: config.description,
    passed: checks.every((check) => check.passed),
    checks
  };
}

function getServerCommand() {
  if (process.platform === "win32") {
    return {
      command: process.env.ComSpec || "cmd.exe",
      args: ["/d", "/s", "/c", `npm run dev -- --host ${host} --port ${port} --strictPort`]
    };
  }

  return {
    command: "npm",
    args: ["run", "dev", "--", "--host", host, "--port", `${port}`, "--strictPort"]
  };
}

async function waitForServer(serverUrl, timeoutMs) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(serverUrl);
      if (response.ok) {
        return;
      }
    } catch {
      // Server is still starting.
    }

    await delay(250);
  }

  throw new Error(`Timed out waiting for ${serverUrl}`);
}

async function waitForAgentApi(page, timeoutMs = 15000) {
  await page.waitForFunction(() => Boolean(window.__topdownExtractionAgentApi), undefined, {
    timeout: timeoutMs
  });
}

function getSnapshotUptimeSeconds(snapshot) {
  const uptimeSeconds = snapshot?.frontline?.metrics?.uptimeSeconds;
  if (typeof uptimeSeconds === "number") {
    return uptimeSeconds;
  }

  if (typeof uptimeSeconds === "string") {
    const parsed = Number(uptimeSeconds);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

async function readAgentSnapshot(page) {
  return page.evaluate(() => window.__topdownExtractionAgentApi?.getSnapshot?.() ?? null);
}

async function waitForControlSurface(page, options = {}) {
  const timeoutMs = options.timeoutMs ?? 18000;
  const minimumUptimeSeconds = options.minimumUptimeSeconds ?? controlSurfaceMinUptimeSeconds;
  const requiredStableSamples = options.requiredStableSamples ?? controlSurfaceStableSamples;
  const start = Date.now();
  let lastUptimeSeconds = null;
  let stableSamples = 0;
  let lastSnapshot = null;

  await waitForAgentApi(page, timeoutMs);

  while (Date.now() - start < timeoutMs) {
    try {
      const snapshot = await readAgentSnapshot(page);
      const uptimeSeconds = getSnapshotUptimeSeconds(snapshot);
      const hasRoutes = Array.isArray(snapshot?.options?.routes) && snapshot.options.routes.length > 0;

      if (snapshot && uptimeSeconds !== null && uptimeSeconds >= minimumUptimeSeconds && hasRoutes) {
        if (lastUptimeSeconds !== null && uptimeSeconds >= lastUptimeSeconds) {
          stableSamples += 1;
        } else {
          stableSamples = 1;
        }

        lastSnapshot = snapshot;
        lastUptimeSeconds = uptimeSeconds;

        if (stableSamples >= requiredStableSamples) {
          return lastSnapshot;
        }
      } else {
        stableSamples = 0;
        lastUptimeSeconds = uptimeSeconds;
      }
    } catch {
      stableSamples = 0;
      lastUptimeSeconds = null;
    }

    await page.waitForTimeout(controlSurfacePollMs);
  }

  throw new Error(
    `Timed out waiting for a stable control surface after ${timeoutMs}ms.`
  );
}

function slugifyStoryPackId(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeTemplateString(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/`/g, "\\`");
}

function toQuotedList(values) {
  if (!Array.isArray(values) || values.length === 0) {
    return '["replace-me"]';
  }

  return `[${values.map((value) => `"${escapeTemplateString(String(value))}"`).join(", ")}]`;
}

function buildStoryPackScaffold({ id, title, summary, storyTypes, deliveryNotes, guardrails }) {
  return `import type { DialogueStoryPack } from "../storyPackSchema";

export const storyPack = {
  id: "${escapeTemplateString(id)}",
  title: "${escapeTemplateString(title)}",
  summary: "${escapeTemplateString(summary)}",
  storyTypes: ${toQuotedList(storyTypes)},
  deliveryNotes: ${toQuotedList(deliveryNotes)},
  guardrails: ${toQuotedList(guardrails)},
  squadTemplates: [
    {
      id: "${escapeTemplateString(id)}-squad-example",
      kind: "contact",
      tone: "warning",
      channel: "Story Seed",
      text: "Replace this with a short squad line for {focusLower}.",
      weight: 1.4,
      focusTags: ["discipline"],
      allowedSpeakers: ["Rook"]
    }
  ],
  hostileTemplates: [
    {
      id: "${escapeTemplateString(id)}-hostile-example",
      kind: "contact",
      tone: "warning",
      channel: "Story Seed",
      text: "Replace this with a hostile answer on {focusLower}.",
      weight: 1.2,
      tapeId: "blue"
    }
  ]
} satisfies DialogueStoryPack;
`;
}

async function listStoryPacks() {
  await mkdir(storyPackDirectory, { recursive: true });
  const entries = await readdir(storyPackDirectory, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".ts"))
    .map((entry) => ({
      id: entry.name.replace(/\.ts$/i, ""),
      path: path.relative(repoRoot, path.join(storyPackDirectory, entry.name)).replace(/\\/g, "/")
    }))
    .sort((left, right) => left.id.localeCompare(right.id));
}

async function scaffoldStoryPack(options) {
  const id = slugifyStoryPackId(options.id ?? options.name ?? options.title);
  if (!id) {
    throw new Error("story-pack scaffold requires --id or --title.");
  }

  const title = typeof options.title === "string" && options.title.trim() ? options.title.trim() : id;
  const summary =
    typeof options.summary === "string" && options.summary.trim()
      ? options.summary.trim()
      : "Describe the exact battlefield story family this pack should add.";
  const storyTypes =
    typeof options["story-types"] === "string"
      ? options["story-types"].split(",").map((value) => value.trim()).filter(Boolean)
      : ["replace-me"];
  const deliveryNotes =
    typeof options["delivery-notes"] === "string"
      ? options["delivery-notes"].split("|").map((value) => value.trim()).filter(Boolean)
      : ["Keep lines short.", "Prefer implication over explanation."];
  const guardrails =
    typeof options.guardrails === "string"
      ? options.guardrails.split("|").map((value) => value.trim()).filter(Boolean)
      : ["Stay inside the fictional frontline frame."];
  const filePath = path.join(storyPackDirectory, `${id}.ts`);

  await mkdir(storyPackDirectory, { recursive: true });
  await writeFile(
    filePath,
    buildStoryPackScaffold({
      id,
      title,
      summary,
      storyTypes,
      deliveryNotes,
      guardrails
    }),
    { flag: "wx" }
  );

  return {
    ok: true,
    id,
    title,
    path: path.relative(repoRoot, filePath).replace(/\\/g, "/"),
    summary,
    storyTypes,
    deliveryNotes,
    guardrails
  };
}

function printHelp() {
  console.log(`Frontline Officer Project CLI

Usage:
  npm run game:cli -- <command> [options]

Commands:
  snapshot
  status
  cutover
  war-quickstart [--side <camp-a|camp-b>]
  war-one-minute [--side <camp-a|camp-b>] [--seconds <n>] [--tick-seconds <n>] [--order <trench|ammo-crate>] [--no-reinforce]
  war-deploy-officer --id <camp-a|camp-b>
  war-damage-camp --id <camp-a|camp-b> --amount <n>
  war-reinforce --id <camp-a|camp-b> [--role <builder|rifleman|suppressor|medic|defender>] [--count <n>] [--damage-before <n>] [--advance-seconds <n>]
  war-loot-ammo-crate --faction <camp-a|camp-b> (--id <crate-id> | --seed <camp-a|camp-b>) [--x <n> --y <n>] [--advance-seconds <n>]
  war-roster [--camp <camp-a|camp-b>]
  war-soldier --id <soldier-id>
  war-priority list [--camp <camp-a|camp-b>]
  war-priority set --soldier <id> --work <Build|Rescue|Resupply|Defend|Suppress|Rest> --priority <0-5>
  war-priority preset --soldier <id> --preset <builder|medic|quartermaster|suppressor|rifleman|scout|rest-cycle>
  war-task-candidates --soldier <id>
  war-build-test --builder <id> [--covered-by <id>] [--x <n> --y <n>] [--advance-seconds <n>]
  war-build-report --order <order-id>
  war-stage-casualty --soldier <id> [--x <n> --y <n>] [--severity <light|serious|critical>]
  war-medic-order --medic <id> --target <id> [--covered-by <id>] [--advance-seconds <n>]
  war-rescue-report
  war-sustainment
  war-set-camp-work --camp <camp-a|camp-b> --work <Cook|Resupply|Rest> --priority <0-5>
  war-stage-ammo-pressure --camp <camp-a|camp-b>
  war-stage-fatigue --camp <camp-a|camp-b> --level <0-1>
  war-stage-flank --lane <north|mid|south> --pressure <low|medium|high> [--camp <camp-a|camp-b>]
  war-operation prepare [--ammo <n> --build <n> --food <n> --med <n>]
  war-operation start
  war-operation end
  war-operation report
  war-skill-emergence-demo
  war-skill-debrief
  war-order-trench --id <camp-a|camp-b> [--x <n> --y <n>] [--advance-seconds <n>]
  war-order-dugout --id <camp-a|camp-b> [--x <n> --y <n>] [--facing <radians>] [--advance-seconds <n>]
  war-order-ammo-crate --id <camp-a|camp-b> [--x <n> --y <n>] [--advance-seconds <n>]
  war-dugout-report
  war-damage-dugout --id <dugout-id> --amount <n>
  war-focus-lane --id <camp-a|camp-b> --lane <north|mid|south> [--advance-seconds <n>]
  war-advance --seconds <n> [--tick-seconds <n>]
  verify --id war-roster-skills
  verify --id war-priority-skill-choice
  verify --id war-build-skill-under-fire
  verify --id war-medical-rescue-emergence
  verify --id war-logistics-camp-readiness
  verify --id war-skill-emergence-loop
  verify --id war-drama-responsibility
  verify --id war-drama-relationships
  verify --id war-drama-location-scars
  verify --id war-drama-beat-chain
  verify --id emergent-war-drama
  list
  telemetry
  regression-gate [--path <png>]
verify --id <main-menu-to-stash|stash-to-raid|equip-major-weapons|equip-low-tier-guns|wave-target-discipline|same-room-reinforcement-guard|no-immortal-runtime|legacy-crossfire-disabled|legacy-runtime-clean-states|doorway-regression|room-clear-drill|room-clear-chain|expanded-frontline|blue-carried-fire|blue-carried-extract-success|blue-body-extract|extract-clean|extract-collapse|body-recovery|intel-alarm|drone-sweep|hostile-lane-chatter|caravan-trap|persistent-body-return|dialogue-aftermath|field-coffee|burner-coffee|surrender-window|armored-evac|combat-presentation|combat-audio|boys-frag-runtime|suppression-runtime|covering-crossing|pinned-pressure|fireteam-audit|territory-claims|hardcore-start|first-session-hook|route-identity-pass|must-clear-structure-pass|stash-consequence-pass|weapon-doctrine|field-capture|field-pivot|broker-cashout|chair-handoff|handgun-recovery|knife-extreme|final-stronghold|recovery-corridor-payoff|endgame-amr|amr-counter-lane|final-stronghold-launch|final-stronghold-setback|true-escape|trench-assault|bunker-foothold|cellar-counterhold|shed-hide|territory-retake|relay-counterpush|ambulance-counterhold|mortar-bracket|retake-peel|civilian-window|hunter-search|wounded-soldier|white-van-ambush|armored-drop> [--path <png>]
  configure --route <id> --weapon <id> --service <id> --contract <id> --medkits <n> --ammo-packs <n> --top-tab <id> --command-tab <id>
  stage-state --id <front-door|stash|briefing|town-war|raid|extract-ready|extract-hold-active|intel-live|intel-crash-pending|body-alarm-pending|room-clear-pocket>
  start-raid
  raid-action [--start-raid] [--move up|down|left|right|upleft|upright|downleft|downright|<x,y>] [--duration <ms>] [--aim <x,y>] [--fire <ms>] [--focus <ms>] [--reload] [--interact] [--heal] [--support-order <id>] [--focus-incident <incidentId|index:N|clear>]
      macro --id <breach-drill|extract-drill|frontline-pressure|expanded-frontline|doorway-regression|room-clear-drill|room-clear-chain|blue-carried-fire|blue-carried-extract-success|blue-body-extract|extract-clean|extract-collapse|body-recovery|intel-alarm|drone-sweep|hostile-lane-chatter|caravan-trap|persistent-body-return|dialogue-aftermath|field-coffee|burner-coffee|surrender-window|armored-evac|combat-presentation|combat-audio|boys-frag-runtime|suppression-runtime|covering-crossing|pinned-pressure|fireteam-audit|territory-claims|hardcore-start|first-session-hook|route-identity-pass|must-clear-structure-pass|stash-consequence-pass|weapon-doctrine|field-capture|field-pivot|broker-cashout|chair-handoff|handgun-recovery|knife-extreme|final-stronghold|recovery-corridor-payoff|endgame-amr|amr-counter-lane|final-stronghold-launch|final-stronghold-setback|true-escape|trench-assault|bunker-foothold|cellar-counterhold|shed-hide|territory-retake|relay-counterpush|ambulance-counterhold|mortar-bracket|retake-peel|civilian-window|hunter-search|wounded-soldier|white-van-ambush|armored-drop> [--path <png>]
  move --x <n> --y <n> [--seconds <n>]
  aim --x <n> --y <n>
  trigger --held <true|false> [--seconds <n>]
  focus --held <true|false> [--seconds <n>]
  action --type <interact|reload|grenade|heal|stabilize|finish>
  support-order --id <shift-fire|draw-heat|secure-exfil|hold-position|breach-push>
  select-boy --index <0|1|2>
  squad-order --id <follow|defend|attack|brace-watch|move-watch> [--x <n> --y <n>]
  squad-action --id <grenade|suppress> --x <n> --y <n>
  focus-incident --id <incidentId|index:N|clear>
  story-pack list
  story-pack scaffold --id <slug> [--title <title>] [--summary <text>] [--story-types <a,b>] [--delivery-notes <a|b>] [--guardrails <a|b>]
showcase --id <briefing|carried-storage|squad-roster|debrief|memorial-wall|dialogue-aftermath|next-push-gear|frontline-aftermath|breach|breach-push|boys-command|grenade-pocket|boys-frag-runtime|suppression-runtime|covering-crossing|pinned-pressure|combat-audio|combat-presentation|hardcore-start|weapon-doctrine|field-capture|field-pivot|broker-cashout|chair-handoff|handgun-recovery|knife-extreme|final-stronghold|recovery-corridor-payoff|final-stronghold-launch|final-stronghold-setback|true-escape|endgame-amr|amr-counter-lane|extract-clean|extract-collapse|extract-pressure|room-clear|room-clear-chain|frontline-supply|field-coffee|burner-coffee|expanded-frontline|hostile-lane-chatter|noise-discipline|drone-sweep|intel-alarm|war-beat-focus|body-recovery|persistent-body-return|caravan-trap|white-van-ambush|armored-drop|armored-evac|trench-assault|bunker-foothold|cellar-counterhold|shed-hide|civilian-window|hunter-search|blue-carried-fire|blue-carried-extract-success|blue-body-extract|wounded-soldier|surrender-window|territory-claims|territory-retake|relay-counterpush|ambulance-counterhold|mortar-bracket|retake-peel>
  click --selector "<css selector>"
  wait --seconds <n>
  screenshot --path <relative-or-absolute-path>
    capture --path <relative-or-absolute-path> [--showcase <id>] [--focus-extract <extract-id>] [--focus-incident <incidentId|index:N|clear>] [--selector <css>] [--start-raid] [--wait <seconds>]

Options:
  --url <url>       Reuse an existing dev server instead of launching one.
  --timeout <ms>    Server startup timeout when auto-launching. Default: 15000.

The CLI talks to window.__topdownExtractionAgentApi in the running game, so it can inspect state,
configure raids, stage critical runtime states, start runs, hold movement/fire input, queue interactions, direct individual-boy orders including brace-watch and move-watch, queue reusable tactical actions, and trigger showcase states including briefing, next-push-gear, memorial-wall, dialogue-aftermath, boys-command, grenade-pocket, boys-frag-runtime, suppression-runtime, covering-crossing, pinned-pressure, fireteam-audit, combat-audio, combat-presentation, hardcore-start, first-session-hook, route-identity-pass, must-clear-structure-pass, stash-consequence-pass, weapon-doctrine, field-capture, broker-cashout, chair-handoff, handgun-recovery, knife-extreme, final-stronghold, final-stronghold-launch, final-stronghold-setback, true-escape, endgame-amr, amr-counter-lane, hostile-lane-chatter, noise-discipline, drone-sweep, intel-alarm, war-beat-focus, body-recovery, persistent-body-return, caravan-trap, white-van-ambush, armored-drop, armored-evac, trench-assault, bunker-foothold, cellar-counterhold, shed-hide, civilian-window, hunter-search, wounded-soldier, blue-carried-fire, blue-carried-extract-success, blue-body-extract, surrender-window, field-coffee, burner-coffee, extract-clean, extract-collapse, extract-pressure, territory-claims, territory-retake, relay-counterpush, ambulance-counterhold, mortar-bracket, retake-peel, and room-clear-chain.

The story-pack commands are offline content helpers. They scaffold files in src/game/dialogue/story-packs so future agents can add new story families without editing the dialogue resolver.`);
}

async function withRuntime(options, runCommand) {
  const url = typeof options.url === "string" ? options.url : defaultUrl;
  const timeoutMs = parseNumber(options.timeout, 15000);
  let server = null;
  let serverOutput = "";
  let reuseExistingServer = false;

  try {
    await waitForServer(url, existingServerProbeMs);
    reuseExistingServer = true;
  } catch {
    reuseExistingServer = false;
  }

  if (!options.url && !reuseExistingServer) {
    const serverCommand = getServerCommand();
    server = spawn(serverCommand.command, serverCommand.args, {
      stdio: ["ignore", "pipe", "pipe"],
      shell: false
    });

    const appendOutput = (chunk) => {
      serverOutput += chunk.toString();
      if (serverOutput.length > 8000) {
        serverOutput = serverOutput.slice(-8000);
      }
    };

    server.stdout.on("data", appendOutput);
    server.stderr.on("data", appendOutput);
  }

  const cleanup = () => {
    if (server && !server.killed) {
      server.kill();
    }
  };

  process.on("exit", cleanup);

  try {
    await waitForServer(url, timeoutMs);

    const browser = await chromium.launch({
      headless: true,
      args: [
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding"
      ]
    });

    try {
      const page = await browser.newPage({ viewport: DESKTOP_VIEWPORT });
      await page.goto(url, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(800);

      try {
        await waitForAgentApi(page);
      } catch (error) {
        await page.reload({ waitUntil: "domcontentloaded" });
        await page.waitForTimeout(800);
        await waitForAgentApi(page);
      }

      await waitForControlSurface(page, { timeoutMs });

      return await runCommand(page);
    } finally {
      await browser.close();
    }
  } catch (error) {
    const message = error instanceof Error ? error.stack || error.message : String(error);
    if (serverOutput) {
      throw new Error(`${message}\n\nDev server output:\n${serverOutput}`);
    }
    throw error;
  } finally {
    cleanup();
  }
}

async function callAgent(page, method, payload) {
  const invoke = () =>
    page.evaluate(
      ({ agentMethod, agentPayload }) => window.__topdownExtractionAgentApi[agentMethod](agentPayload),
      { agentMethod: method, agentPayload: payload }
    );

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await page.waitForFunction(
        (agentMethod) => Boolean(window.__topdownExtractionAgentApi && window.__topdownExtractionAgentApi[agentMethod]),
        method,
        { timeout: 8000 }
      );
      return await invoke();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const recoverableError =
        message.includes("Execution context was destroyed") ||
        message.includes("Cannot find context with specified id") ||
        message.includes("Target page, context or browser has been closed") ||
        message.includes("Timeout");

      if (!recoverableError || attempt === 2) {
        throw error;
      }

      await page.waitForLoadState("domcontentloaded").catch(() => {});
      await page.waitForTimeout(300);
      await waitForControlSurface(page, { timeoutMs: 18000 });
    }
  }

  throw new Error(`Unable to call agent method "${method}" after repeated control-surface recovery attempts.`);
}

async function run() {
  const { positionals, options } = parseArgs(process.argv.slice(2));
  const command = positionals[0];
  const subcommand = positionals[1];

  if (!command || command === "help" || options.help) {
    printHelp();
    return;
  }

  if (command === "story-pack") {
    let result = null;

    if (subcommand === "list") {
      result = {
        storyPacks: await listStoryPacks()
      };
    } else if (subcommand === "scaffold") {
      result = await scaffoldStoryPack(options);
    } else {
      throw new Error('story-pack requires a subcommand: "list" or "scaffold".');
    }

    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const result = await withRuntime(options, async (page) => {
  if (command === "status" || command === "snapshot") {
      return callAgent(page, "getSnapshot");
    }

    if (command === "cutover") {
      const snapshot = await callAgent(page, "getSnapshot");
      return snapshot.war ?? null;
    }

    if (command === "war-quickstart") {
      await callAgent(page, "stageState", "town-war");
      if (typeof options.side === "string") {
        const campId = options.side;
        if (campId !== "camp-a" && campId !== "camp-b") {
          throw new Error("war-quickstart --side must be camp-a or camp-b.");
        }
        await callAgent(page, "deployTownWarOfficer", { campId });
      }
      const snapshot = await callAgent(page, "getSnapshot");
      const war = snapshot.war ?? null;
      const campSummary =
        war && Array.isArray(war.camps)
          ? war.camps.map((camp) => `${camp.label ?? camp.id ?? "camp"} ${camp.health ?? "?"}/${camp.maxHealth ?? "?"}`).join(" | ")
          : "no camps";

      return {
        ok: true,
        summary: `Town ${war?.town?.id ?? "unknown"} (route ${war?.town?.routeId ?? "unknown"}) | ${campSummary}`,
        recommendedNextCommand: "npm run game:cli -- cutover",
        war,
        brief: buildTownWarBrief(war)
      };
    }

    if (command === "war-one-minute") {
      const seconds = parseNumber(options.seconds, 60);
      const tickSeconds = options["tick-seconds"] === undefined ? 0.25 : parseNumber(options["tick-seconds"], 0.25);

      const campId = typeof options.side === "string" ? options.side : "camp-a";
      if (campId !== "camp-a" && campId !== "camp-b") {
        throw new Error("war-one-minute --side must be camp-a or camp-b.");
      }

      const orderKind = typeof options.order === "string" ? options.order.trim().toLowerCase() : "trench";
      if (orderKind !== "trench" && orderKind !== "ammo-crate") {
        throw new Error('war-one-minute --order must be "trench" or "ammo-crate".');
      }

      await callAgent(page, "stageState", "town-war");
      await callAgent(page, "deployTownWarOfficer", { campId });
      const reinforcementEvents = [];
      if (!options["no-reinforce"]) {
        const opposingCampId = campId === "camp-a" ? "camp-b" : "camp-a";
        const reinforcements = [
          { campId: "camp-a", role: "rifleman", count: 3 },
          { campId: "camp-b", role: "rifleman", count: 3 },
          { campId, role: "builder", count: 1 },
          { campId: opposingCampId, role: "builder", count: 1 }
        ];

        for (const reinforcement of reinforcements) {
          reinforcementEvents.push(await callAgent(page, "reinforceTownWar", reinforcement));
        }

        await callAgent(page, "focusTownWarLane", { campId: "camp-a", lane: "mid" });
        await callAgent(page, "focusTownWarLane", { campId: "camp-b", lane: "mid" });
      }

      const seededSnapshot = await callAgent(page, "getSnapshot");
      const seededWar = seededSnapshot?.war ?? null;
      const campASpawn = seededWar?.townWar?.camps?.find((camp) => camp.id === "camp-a")?.spawn?.position ?? null;
      const campBSpawn = seededWar?.townWar?.camps?.find((camp) => camp.id === "camp-b")?.spawn?.position ?? null;
      const midX = campASpawn && campBSpawn ? (campASpawn.x + campBSpawn.x) / 2 : null;
      const midY = campASpawn && campBSpawn ? (campASpawn.y + campBSpawn.y) / 2 : null;
      const trenchX = midX !== null ? midX + (campId === "camp-a" ? 500 : -500) : undefined;
      const trenchY = midY !== null ? midY + (campId === "camp-a" ? -80 : 80) : undefined;

      const order =
        orderKind === "ammo-crate"
          ? await callAgent(page, "orderTownWarAmmoCrate", { campId, x: trenchX, y: trenchY })
          : await callAgent(page, "orderTownWarTrench", { campId, x: trenchX, y: trenchY });
      const afterOrderWar = order?.war ?? null;
      const startBrief = buildTownWarBrief(seededWar);
      const afterOrderBrief = buildTownWarBrief(afterOrderWar);

      const reaction = await callAgent(page, "advanceTownWar", { seconds, tickSeconds });
      const war = reaction?.war ?? null;
      const brief = buildTownWarBrief(war);

      const startSoldiers = afterOrderBrief?.soldiers?.total ?? startBrief?.soldiers?.total ?? null;
      const endSoldiers = brief?.soldiers?.total ?? null;
      const casualties =
        startSoldiers !== null && endSoldiers !== null && Number.isFinite(startSoldiers) && Number.isFinite(endSoldiers)
          ? Math.max(0, startSoldiers - endSoldiers)
          : null;

      const orderSummary = brief?.orders ? `${brief.orders.completed}/${brief.orders.total}` : "unknown";
      const spawnMismatches = brief?.soldiers?.spawnOriginMismatches ?? null;
      const pressureAStart = afterOrderBrief?.soldiers?.byCamp?.["camp-a"]?.maxPressure ?? startBrief?.soldiers?.byCamp?.["camp-a"]?.maxPressure ?? null;
      const pressureAEnd = brief?.soldiers?.byCamp?.["camp-a"]?.maxPressure ?? null;
      const pressureBStart = afterOrderBrief?.soldiers?.byCamp?.["camp-b"]?.maxPressure ?? startBrief?.soldiers?.byCamp?.["camp-b"]?.maxPressure ?? null;
      const pressureBEnd = brief?.soldiers?.byCamp?.["camp-b"]?.maxPressure ?? null;

      const startCampHealth = Object.fromEntries((startBrief?.camps ?? []).map((camp) => [camp.id, camp.health]));
      const endCampHealth = Object.fromEntries((brief?.camps ?? []).map((camp) => [camp.id, camp.health]));
      const campDeltaSummary = ["camp-a", "camp-b"]
        .map((campKey) => `${campKey} ${(startCampHealth[campKey] ?? "?")}->${(endCampHealth[campKey] ?? "?")}`)
        .join(" | ");
      const campSummary =
        Array.isArray(war?.camps) && war.camps.length > 0
          ? war.camps.map((camp) => `${camp.label ?? camp.id} ${camp.health ?? "?"}/${camp.maxHealth ?? "?"}`).join(" | ")
          : "no camps";

      return {
        ok: true,
        summary: `One-minute slice (${seconds}s @ ${tickSeconds}s) | order ${orderKind} | casualties ${casualties ?? "?"} | pressure A ${pressureAStart ?? "?"}->${pressureAEnd ?? "?"} B ${pressureBStart ?? "?"}->${pressureBEnd ?? "?"} | spawn mismatches ${spawnMismatches ?? "?"} | orders ${orderSummary} | ${campDeltaSummary} | ${campSummary}`,
        reinforcementEvents,
        order,
        reaction,
        war,
        brief,
        startBrief,
        afterOrderBrief
      };
    }

    if (command === "war-deploy-officer") {
      if (typeof options.id !== "string") {
        throw new Error("war-deploy-officer requires --id camp-a|camp-b.");
      }

      const campId = options.id;
      if (campId !== "camp-a" && campId !== "camp-b") {
        throw new Error("war-deploy-officer --id must be camp-a or camp-b.");
      }

      if (!options["no-stage"]) {
        await callAgent(page, "stageState", "town-war");
      }
      const result = await callAgent(page, "deployTownWarOfficer", { campId });
      return { ...result, brief: buildTownWarBrief(result?.war ?? null) };
    }

    if (command === "war-damage-camp") {
      if (typeof options.id !== "string") {
        throw new Error("war-damage-camp requires --id camp-a|camp-b.");
      }

      const campId = options.id;
      if (campId !== "camp-a" && campId !== "camp-b") {
        throw new Error("war-damage-camp --id must be camp-a or camp-b.");
      }

      const amount = parseNumber(options.amount, 250);
      if (!options["no-stage"]) {
        await callAgent(page, "stageState", "town-war");
      }
      const snapshot = await callAgent(page, "damageTownWarCamp", { campId, amount });
      const war = snapshot.war ?? null;
      const camp = Array.isArray(war?.camps) ? war.camps.find((entry) => entry?.id === campId) : null;
      const health = camp ? `${camp.health ?? "?"}/${camp.maxHealth ?? "?"}` : "?/?";

      return {
        ok: true,
        summary: `Town war camp damaged: ${campId} -${amount} | health ${health}`,
        campId,
        amount,
        war,
        brief: buildTownWarBrief(war)
      };
    }

    if (command === "war-reinforce") {
      if (typeof options.id !== "string") {
        throw new Error("war-reinforce requires --id camp-a|camp-b.");
      }

      const campId = options.id;
      if (campId !== "camp-a" && campId !== "camp-b") {
        throw new Error("war-reinforce --id must be camp-a or camp-b.");
      }

      const role = typeof options.role === "string" ? options.role : "rifleman";
      if (role !== "builder" && role !== "rifleman" && role !== "suppressor" && role !== "medic" && role !== "defender") {
        throw new Error("war-reinforce --role must be builder, rifleman, suppressor, medic, or defender.");
      }

      const count = parseNumber(options.count, 1);
      const damageBefore = options["damage-before"] === undefined ? 0 : parseNumber(options["damage-before"], 0);
      const advanceSeconds = options["advance-seconds"] === undefined ? 0 : parseNumber(options["advance-seconds"], 0);
      const tickSeconds = options["tick-seconds"] === undefined ? 0.25 : parseNumber(options["tick-seconds"], 0.25);

      if (!options["no-stage"]) {
        await callAgent(page, "stageState", "town-war");
      }
      if (damageBefore > 0) {
        await callAgent(page, "damageTownWarCamp", { campId, amount: damageBefore });
      }
      const result = await callAgent(page, "reinforceTownWar", { campId, role, count });
      const reaction = advanceSeconds > 0 ? await callAgent(page, "advanceTownWar", { seconds: advanceSeconds, tickSeconds }) : null;
      const war = reaction?.war ?? result?.war ?? null;

      return { ...result, reaction, war, brief: buildTownWarBrief(war) };
    }

    if (command === "war-loot-ammo-crate") {
      if (typeof options.faction !== "string") {
        throw new Error("war-loot-ammo-crate requires --faction camp-a|camp-b.");
      }

      const looterFaction = options.faction;
      if (looterFaction !== "camp-a" && looterFaction !== "camp-b") {
        throw new Error("war-loot-ammo-crate --faction must be camp-a or camp-b.");
      }

      await callAgent(page, "stageState", "town-war");

      if (typeof options.seed === "string") {
        const campId = options.seed;
        if (campId !== "camp-a" && campId !== "camp-b") {
          throw new Error("war-loot-ammo-crate --seed must be camp-a or camp-b.");
        }

        const hasX = options.x !== undefined;
        const hasY = options.y !== undefined;
        if (hasX !== hasY) {
          throw new Error("war-loot-ammo-crate requires both --x and --y when providing coordinates.");
        }

        const x = hasX ? parseNumber(options.x) : undefined;
        const y = hasY ? parseNumber(options.y) : undefined;

        const advanceSeconds = options["advance-seconds"] === undefined ? 8 : parseNumber(options["advance-seconds"], 8);
        const tickSeconds = options["tick-seconds"] === undefined ? 0.25 : parseNumber(options["tick-seconds"], 0.25);

        const seedOrder = await callAgent(page, "orderTownWarAmmoCrate", { campId, x, y });
        const reaction = advanceSeconds > 0 ? await callAgent(page, "advanceTownWar", { seconds: advanceSeconds, tickSeconds }) : null;
        const seededWar = reaction?.war ?? seedOrder?.war ?? null;
        const crateId = seededWar?.townWar?.ammoCrates?.[0]?.id ?? null;

        if (!crateId) {
          return {
            ok: false,
            summary: "Town war ammo crate loot failed: seed did not create an ammo crate.",
            seedOrder,
            reaction,
            crate: null,
            war: seededWar,
            brief: buildTownWarBrief(seededWar)
          };
        }

        const result = await callAgent(page, "lootTownWarAmmoCrate", { crateId, looterFaction });
        return { ...result, seedOrder, reaction, brief: buildTownWarBrief(result?.war ?? null) };
      }

      if (typeof options.id !== "string") {
        throw new Error("war-loot-ammo-crate requires --id <crate-id> unless using --seed <camp-a|camp-b>.");
      }

      const crateId = options.id;
      const result = await callAgent(page, "lootTownWarAmmoCrate", { crateId, looterFaction });
      return { ...result, brief: buildTownWarBrief(result?.war ?? null) };
    }

    if (command === "war-roster") {
      const campId = typeof options.camp === "string" ? options.camp : null;
      if (campId !== null && campId !== "camp-a" && campId !== "camp-b") {
        throw new Error("war-roster --camp must be camp-a or camp-b.");
      }

      await callAgent(page, "stageState", "town-war");
      const snapshot = await callAgent(page, "getSnapshot");
      const war = snapshot?.war ?? null;
      const soldiers = getTownWarSoldiers(war);
      const filtered = campId ? soldiers.filter((soldier) => soldier?.faction === campId) : soldiers;
      const roster = filtered.map((soldier) => summarizeWarSoldierIdentity(soldier));

      return {
        ok: true,
        summary: `Town war roster: ${roster.length}/${soldiers.length} soldiers${campId ? ` for ${campId}` : ""}.`,
        campId,
        roster,
        war,
        brief: buildTownWarBrief(war)
      };
    }

    if (command === "war-soldier") {
      if (typeof options.id !== "string") {
        throw new Error("war-soldier requires --id <soldier-id>.");
      }

      await callAgent(page, "stageState", "town-war");
      const snapshot = await callAgent(page, "getSnapshot");
      const war = snapshot?.war ?? null;
      const soldiers = getTownWarSoldiers(war);
      const soldier = soldiers.find((entry) => entry?.id === options.id || entry?.displayName === options.id) ?? null;

      return {
        ok: soldier !== null,
        summary: soldier
          ? `${soldier.displayName ?? soldier.id}: ${summarizeWarSoldierIdentity(soldier).readable}`
          : `No town-war soldier found for ${options.id}.`,
        soldier,
        readable: soldier ? summarizeWarSoldierIdentity(soldier) : null,
        war,
        brief: buildTownWarBrief(war)
      };
    }

    if (command === "war-priority") {
      if (subcommand === "list") {
        const campId = typeof options.camp === "string" ? options.camp : null;
        if (campId !== null && campId !== "camp-a" && campId !== "camp-b") {
          throw new Error("war-priority list --camp must be camp-a or camp-b.");
        }

        await callAgent(page, "stageState", "town-war");
        const result = await callAgent(page, "listTownWarPriorities", campId ? { campId } : {});
        const soldiers = Array.isArray(result?.soldiers) ? result.soldiers : Array.isArray(result?.war?.townWar?.soldiers) ? result.war.townWar.soldiers : [];
        const rows = soldiers.map((soldier) => summarizeWarTaskDecision(soldier));
        return {
          ok: true,
          summary: `Town war priority matrix: ${rows.length} soldiers${campId ? ` in ${campId}` : ""}.`,
          rows,
          warnings: buildWarPriorityWarnings(rows),
          brief: buildTownWarBrief(result?.war ?? null)
        };
      }

      if (subcommand === "set") {
        if (typeof options.soldier !== "string") {
          throw new Error("war-priority set requires --soldier <id>.");
        }
        if (typeof options.work !== "string") {
          throw new Error("war-priority set requires --work <Build|Rescue|Resupply|Defend|Suppress|Rest>.");
        }
        const priority = parseNumber(options.priority, Number.NaN);
        await callAgent(page, "stageState", "town-war");
        const result = await callAgent(page, "setTownWarPriority", {
          soldierId: options.soldier,
          work: options.work,
          priority
        });
        return {
          ...result,
          readable: result?.result?.soldier ? summarizeWarTaskDecision(result.result.soldier) : null,
          brief: buildTownWarBrief(result?.war ?? null)
        };
      }

      if (subcommand === "preset") {
        if (typeof options.soldier !== "string") {
          throw new Error("war-priority preset requires --soldier <id>.");
        }
        if (typeof options.preset !== "string") {
          throw new Error("war-priority preset requires --preset <builder|medic|quartermaster|suppressor|rifleman|scout|rest-cycle>.");
        }
        await callAgent(page, "stageState", "town-war");
        const result = await callAgent(page, "presetTownWarPriority", {
          soldierId: options.soldier,
          preset: options.preset
        });
        return {
          ...result,
          readable: result?.result?.soldier ? summarizeWarTaskDecision(result.result.soldier) : null,
          brief: buildTownWarBrief(result?.war ?? null)
        };
      }

      throw new Error('war-priority requires a subcommand: "list", "set", or "preset".');
    }

    if (command === "war-task-candidates") {
      if (typeof options.soldier !== "string") {
        throw new Error("war-task-candidates requires --soldier <id>.");
      }
      await callAgent(page, "stageState", "town-war");
      const result = await callAgent(page, "getTownWarTaskCandidates", { soldierId: options.soldier });
      return {
        ...result,
        readable: result?.result?.soldier ? summarizeWarTaskDecision(result.result.soldier) : null,
        candidates: result?.result?.candidates ?? [],
        brief: buildTownWarBrief(result?.war ?? null)
      };
    }

    if (command === "war-build-test") {
      if (typeof options.builder !== "string") {
        throw new Error("war-build-test requires --builder <soldier-id>.");
      }
      const x = options.x === undefined ? undefined : parseNumber(options.x);
      const y = options.y === undefined ? undefined : parseNumber(options.y);
      const advanceSeconds = options["advance-seconds"] === undefined ? 0 : parseNumber(options["advance-seconds"], 0);
      const tickSeconds = options["tick-seconds"] === undefined ? 0.25 : parseNumber(options["tick-seconds"], 0.25);

      await callAgent(page, "stageState", "town-war");
      const result = await callAgent(page, "orderTownWarBuildTest", {
        builderId: options.builder,
        coveredById: typeof options["covered-by"] === "string" ? options["covered-by"] : undefined,
        x,
        y
      });
      const reaction = advanceSeconds > 0 ? await callAgent(page, "advanceTownWar", { seconds: advanceSeconds, tickSeconds }) : null;
      const report =
        result?.order?.orderId && advanceSeconds > 0 ? await callAgent(page, "getTownWarBuildReport", { orderId: result.order.orderId }) : null;
      const war = report?.war ?? reaction?.war ?? result?.war ?? null;
      return { ...result, reaction, report, war, summary: report?.summary ?? reaction?.summary ?? result.summary, brief: buildTownWarBrief(war) };
    }

    if (command === "war-build-report") {
      if (typeof options.order !== "string") {
        throw new Error("war-build-report requires --order <order-id>.");
      }
      const result = await callAgent(page, "getTownWarBuildReport", { orderId: options.order });
      return { ...result, brief: buildTownWarBrief(result?.war ?? null) };
    }

    if (command === "war-stage-casualty") {
      if (typeof options.soldier !== "string") {
        throw new Error("war-stage-casualty requires --soldier <soldier-id>.");
      }
      const x = options.x === undefined ? undefined : parseNumber(options.x);
      const y = options.y === undefined ? undefined : parseNumber(options.y);
      const severity = typeof options.severity === "string" ? options.severity : "serious";
      await callAgent(page, "stageState", "town-war");
      const result = await callAgent(page, "stageTownWarCasualty", {
        soldierId: options.soldier,
        x,
        y,
        severity
      });
      return { ...result, brief: buildTownWarBrief(result?.war ?? null) };
    }

    if (command === "war-medic-order") {
      if (typeof options.medic !== "string") {
        throw new Error("war-medic-order requires --medic <soldier-id>.");
      }
      if (typeof options.target !== "string") {
        throw new Error("war-medic-order requires --target <soldier-id>.");
      }
      const advanceSeconds = options["advance-seconds"] === undefined ? 0 : parseNumber(options["advance-seconds"], 0);
      const tickSeconds = options["tick-seconds"] === undefined ? 0.25 : parseNumber(options["tick-seconds"], 0.25);
      const result = await callAgent(page, "orderTownWarMedicRescue", {
        medicId: options.medic,
        targetSoldierId: options.target,
        coveredById: typeof options["covered-by"] === "string" ? options["covered-by"] : undefined
      });
      let advance = null;
      let report = null;
      if (advanceSeconds > 0) {
        advance = await callAgent(page, "advanceTownWar", { seconds: advanceSeconds, tickSeconds });
        report = await callAgent(page, "getTownWarRescueReport");
      }
      return { ...result, advance, report, brief: buildTownWarBrief((report ?? result)?.war ?? null) };
    }

    if (command === "war-rescue-report") {
      const result = await callAgent(page, "getTownWarRescueReport");
      return { ...result, brief: buildTownWarBrief(result?.war ?? null) };
    }

    if (command === "war-sustainment") {
      await callAgent(page, "stageState", "town-war");
      const result = await callAgent(page, "getTownWarSustainmentReport");
      return { ...result, brief: buildTownWarBrief(result?.war ?? null) };
    }

    if (command === "war-set-camp-work") {
      const campId = typeof options.camp === "string" ? options.camp : null;
      if (campId !== "camp-a" && campId !== "camp-b") {
        throw new Error("war-set-camp-work requires --camp camp-a|camp-b.");
      }
      if (typeof options.work !== "string") {
        throw new Error("war-set-camp-work requires --work Cook|Resupply|Rest.");
      }
      const priority = parseNumber(options.priority, Number.NaN);
      await callAgent(page, "stageState", "town-war");
      const result = await callAgent(page, "setTownWarCampWork", {
        campId,
        work: options.work,
        priority
      });
      return { ...result, brief: buildTownWarBrief(result?.war ?? null) };
    }

    if (command === "war-stage-ammo-pressure") {
      const campId = typeof options.camp === "string" ? options.camp : null;
      if (campId !== "camp-a" && campId !== "camp-b") {
        throw new Error("war-stage-ammo-pressure requires --camp camp-a|camp-b.");
      }
      await callAgent(page, "stageState", "town-war");
      const result = await callAgent(page, "stageTownWarAmmoPressure", { campId });
      return { ...result, brief: buildTownWarBrief(result?.war ?? null) };
    }

    if (command === "war-stage-fatigue") {
      const campId = typeof options.camp === "string" ? options.camp : null;
      if (campId !== "camp-a" && campId !== "camp-b") {
        throw new Error("war-stage-fatigue requires --camp camp-a|camp-b.");
      }
      const level = parseNumber(options.level, Number.NaN);
      await callAgent(page, "stageState", "town-war");
      const result = await callAgent(page, "stageTownWarFatigue", { campId, level });
      return { ...result, brief: buildTownWarBrief(result?.war ?? null) };
    }

    if (command === "war-stage-flank") {
      const campId = typeof options.camp === "string" ? options.camp : "camp-a";
      const lane = typeof options.lane === "string" ? options.lane : null;
      const pressure = typeof options.pressure === "string" ? options.pressure : null;
      if (campId !== "camp-a" && campId !== "camp-b") {
        throw new Error("war-stage-flank requires --camp camp-a|camp-b when provided.");
      }
      if (lane !== "north" && lane !== "mid" && lane !== "south") {
        throw new Error("war-stage-flank requires --lane north|mid|south.");
      }
      if (pressure !== "low" && pressure !== "medium" && pressure !== "high") {
        throw new Error("war-stage-flank requires --pressure low|medium|high.");
      }
      await callAgent(page, "stageState", "town-war");
      const result = await callAgent(page, "stageTownWarFlank", { campId, lane, pressure });
      return { ...result, brief: buildTownWarBrief(result?.war ?? null) };
    }

    if (command === "war-operation") {
      if (subcommand === "prepare") {
        const payload = {
          ammo: options.ammo === undefined ? undefined : parseNumber(options.ammo, 220),
          build: options.build === undefined ? undefined : parseNumber(options.build, 220),
          food: options.food === undefined ? undefined : parseNumber(options.food, 180),
          med: options.med === undefined ? undefined : parseNumber(options.med, 90)
        };
        const result = await callAgent(page, "prepareTownWarOperation", payload);
        return { ...result, brief: buildTownWarBrief(result?.war ?? null) };
      }
      if (subcommand === "start") {
        const result = await callAgent(page, "startNextTownWarOperation");
        return { ...result, brief: buildTownWarBrief(result?.war ?? null) };
      }
      if (subcommand === "end") {
        const result = await callAgent(page, "endTownWarOperation");
        return { ...result, brief: buildTownWarBrief(result?.war ?? null) };
      }
      if (subcommand === "report") {
        const result = await callAgent(page, "getTownWarOperationReport");
        return { ...result, brief: buildTownWarBrief(result?.war ?? null) };
      }
      throw new Error('war-operation requires a subcommand: "prepare", "start", "end", or "report".');
    }

    if (command === "war-skill-emergence-demo") {
      await callAgent(page, "stageState", "town-war");
      const result = await callAgent(page, "runTownWarSkillEmergenceDemo");
      return { ...result, brief: buildTownWarBrief(result?.war ?? null) };
    }

    if (command === "war-skill-debrief") {
      await callAgent(page, "stageState", "town-war");
      const demo = await callAgent(page, "runTownWarSkillEmergenceDemo");
      const result = await callAgent(page, "getTownWarSkillDebrief");
      return { ...result, demo: demo?.result ?? null, brief: buildTownWarBrief(result?.war ?? null) };
    }

    if (command === "war-order-trench") {
      if (typeof options.id !== "string") {
        throw new Error("war-order-trench requires --id camp-a|camp-b.");
      }

      const campId = options.id;
      if (campId !== "camp-a" && campId !== "camp-b") {
        throw new Error("war-order-trench --id must be camp-a or camp-b.");
      }

      const hasX = options.x !== undefined;
      const hasY = options.y !== undefined;
      if (hasX !== hasY) {
        throw new Error("war-order-trench requires both --x and --y when providing coordinates.");
      }

      const x = hasX ? parseNumber(options.x) : undefined;
      const y = hasY ? parseNumber(options.y) : undefined;

      const advanceSeconds = options["advance-seconds"] === undefined ? 0 : parseNumber(options["advance-seconds"], 0);
      const tickSeconds = options["tick-seconds"] === undefined ? 0.25 : parseNumber(options["tick-seconds"], 0.25);

      await callAgent(page, "stageState", "town-war");
      const result = await callAgent(page, "orderTownWarTrench", { campId, x, y });

      const reaction = advanceSeconds > 0 ? await callAgent(page, "advanceTownWar", { seconds: advanceSeconds, tickSeconds }) : null;
      const war = reaction?.war ?? result?.war ?? null;

      return { ...result, reaction, war, summary: reaction?.summary ?? result.summary, brief: buildTownWarBrief(war) };
    }

    if (command === "war-order-ammo" || command === "war-order-ammo-crate") {
      if (typeof options.id !== "string") {
        throw new Error("war-order-ammo-crate requires --id camp-a|camp-b.");
      }

      const campId = options.id;
      if (campId !== "camp-a" && campId !== "camp-b") {
        throw new Error("war-order-ammo-crate --id must be camp-a or camp-b.");
      }

      const hasX = options.x !== undefined;
      const hasY = options.y !== undefined;
      if (hasX !== hasY) {
        throw new Error("war-order-ammo-crate requires both --x and --y when providing coordinates.");
      }

      const x = hasX ? parseNumber(options.x) : undefined;
      const y = hasY ? parseNumber(options.y) : undefined;

      const advanceSeconds = options["advance-seconds"] === undefined ? 0 : parseNumber(options["advance-seconds"], 0);
      const tickSeconds = options["tick-seconds"] === undefined ? 0.25 : parseNumber(options["tick-seconds"], 0.25);

      await callAgent(page, "stageState", "town-war");
      const result = await callAgent(page, "orderTownWarAmmoCrate", { campId, x, y });

      const reaction = advanceSeconds > 0 ? await callAgent(page, "advanceTownWar", { seconds: advanceSeconds, tickSeconds }) : null;
      const war = reaction?.war ?? result?.war ?? null;

      return { ...result, reaction, war, summary: reaction?.summary ?? result.summary, brief: buildTownWarBrief(war) };
    }

    if (command === "war-order-dugout") {
      if (typeof options.id !== "string") {
        throw new Error("war-order-dugout requires --id camp-a|camp-b.");
      }

      const campId = options.id;
      if (campId !== "camp-a" && campId !== "camp-b") {
        throw new Error("war-order-dugout --id must be camp-a or camp-b.");
      }

      const hasX = options.x !== undefined;
      const hasY = options.y !== undefined;
      if (hasX !== hasY) {
        throw new Error("war-order-dugout requires both --x and --y when providing coordinates.");
      }

      const x = hasX ? parseNumber(options.x) : undefined;
      const y = hasY ? parseNumber(options.y) : undefined;
      const facingAngleRadians = options.facing === undefined ? undefined : parseNumber(options.facing);

      const advanceSeconds = options["advance-seconds"] === undefined ? 0 : parseNumber(options["advance-seconds"], 0);
      const tickSeconds = options["tick-seconds"] === undefined ? 0.25 : parseNumber(options["tick-seconds"], 0.25);

      await callAgent(page, "stageState", "town-war");
      const result = await callAgent(page, "orderTownWarDugout", { campId, x, y, facingAngleRadians });

      const reaction = advanceSeconds > 0 ? await callAgent(page, "advanceTownWar", { seconds: advanceSeconds, tickSeconds }) : null;
      const war = reaction?.war ?? result?.war ?? null;

      return { ...result, reaction, war, summary: reaction?.summary ?? result.summary, brief: buildTownWarBrief(war) };
    }

    if (command === "war-dugout-report") {
      await callAgent(page, "stageState", "town-war");
      return callAgent(page, "getTownWarDugoutReport");
    }

    if (command === "war-damage-dugout") {
      if (typeof options.id !== "string") {
        throw new Error("war-damage-dugout requires --id <dugout-id>.");
      }
      const amount = options.amount === undefined ? 20 : parseNumber(options.amount, 20);
      await callAgent(page, "stageState", "town-war");
      return callAgent(page, "damageTownWarDugout", { dugoutId: options.id, amount });
    }

    if (command === "war-focus-lane") {
      if (typeof options.id !== "string") {
        throw new Error("war-focus-lane requires --id camp-a|camp-b.");
      }

      const campId = options.id;
      if (campId !== "camp-a" && campId !== "camp-b") {
        throw new Error("war-focus-lane --id must be camp-a or camp-b.");
      }

      if (typeof options.lane !== "string") {
        throw new Error("war-focus-lane requires --lane north|mid|south.");
      }

      const lane = options.lane.toLowerCase().trim();
      if (lane !== "north" && lane !== "mid" && lane !== "south") {
        throw new Error("war-focus-lane --lane must be north, mid, or south.");
      }

      const advanceSeconds = options["advance-seconds"] === undefined ? 0 : parseNumber(options["advance-seconds"], 0);
      const tickSeconds = options["tick-seconds"] === undefined ? 0.25 : parseNumber(options["tick-seconds"], 0.25);

      await callAgent(page, "stageState", "town-war");
      const result = await callAgent(page, "focusTownWarLane", { campId, lane });

      const reaction = advanceSeconds > 0 ? await callAgent(page, "advanceTownWar", { seconds: advanceSeconds, tickSeconds }) : null;
      const war = reaction?.war ?? result?.war ?? null;

      return { ...result, reaction, war, summary: reaction?.summary ?? result.summary, brief: buildTownWarBrief(war) };
    }

    if (command === "war-advance") {
      const seconds = parseNumber(options.seconds, 10);
      const tickSeconds = parseNumber(options["tick-seconds"], 0.25);

      await callAgent(page, "stageState", "town-war");
      const result = await callAgent(page, "advanceTownWar", { seconds, tickSeconds });
      return { ...result, brief: buildTownWarBrief(result?.war) };
    }

    if (command === "list") {
      return callAgent(page, "getOptions");
    }
    if (command === "telemetry" || command === "metrics") {
      const snapshot = await callAgent(page, "getSnapshot");
      const battlefield = snapshot.battlefield ?? null;
      return {
        timestamp: new Date().toISOString(),
        phase: snapshot.phase,
        metrics: snapshot.frontline?.metrics ?? null,
        combat: snapshot.frontline?.metrics?.combat ?? snapshot.raid?.doorway ?? null,
        battlefieldSpan: battlefield?.span ?? snapshot.frontline?.metrics?.combat?.battlefieldSpan ?? null,
        playerJitter: battlefield?.playerJitter ?? snapshot.frontline?.metrics?.combat?.playerJitter ?? null,
        heatmap: battlefield?.heatmap ?? null,
        ukrainianCombatants: snapshot.frontline?.ukrainianCombatants ?? null,
        russianCombatants: snapshot.frontline?.russianCombatants ?? null,
        combatBalance: {
          hostileStrength: battlefield?.hostileCombatStrength ?? snapshot.frontline?.ukrainianCombatants?.combatStrength ?? null,
          friendlyStrength: battlefield?.friendlyCombatStrength ?? snapshot.frontline?.russianCombatants?.combatStrength ?? null
        },
        battlefieldSummary: battlefield
          ? {
              friendlyCount: battlefield.friendlyCount,
              hostileCount: battlefield.hostileCount,
              summary: `${battlefield.friendlyCount} friendly / ${battlefield.hostileCount} hostile`,
              playerPosition: battlefield.playerPosition,
              span: battlefield.span,
              heatmapSummary:
                battlefield.heatmap?.topHotspots?.length > 0
                  ? `${battlefield.heatmap.topHotspots[0].dominantSource} @ ${battlefield.heatmap.topHotspots[0].center.x},${battlefield.heatmap.topHotspots[0].center.y}`
                  : null
            }
          : null,
        actorPositions: {
          player: battlefield?.playerPosition ?? snapshot.raid?.position ?? null,
          russian: battlefield?.samples?.friendlies ?? snapshot.frontline?.russianCombatants?.samplePositions ?? [],
          ukrainian: battlefield?.samples?.hostiles ?? snapshot.frontline?.ukrainianCombatants?.samplePositions ?? []
        },
        battlefieldDistances: {
          nearestEnemyDistance: snapshot.frontline?.metrics?.combat?.nearestEnemyDistance ?? null,
          nearestSupportDistance: snapshot.frontline?.metrics?.combat?.nearestSupportDistance ?? null,
          nearestDoorwayDistance: snapshot.raid?.doorway?.nearestDoorwayDistance ?? null,
          nearestDoorwayLabel: snapshot.raid?.doorway?.nearestDoorwayLabel ?? null
        },
        doorwaySummary: snapshot.raid?.doorway
          ? {
              label: snapshot.raid.doorway.nearestDoorwayLabel ?? "no doorway",
              distance: snapshot.raid.doorway.nearestDoorwayDistance ?? null,
              stalledFireteams: snapshot.raid.doorway.stalledFireteams ?? null,
              roomHoldCount: snapshot.raid.doorway.roomHoldCount ?? null,
              summary:
                snapshot.raid.doorway.nearestDoorwayDistance != null
                  ? `${snapshot.raid.doorway.nearestDoorwayLabel ?? "no doorway"} @ ${snapshot.raid.doorway.nearestDoorwayDistance.toFixed(0)}px`
                  : `${snapshot.raid.doorway.nearestDoorwayLabel ?? "no doorway"}`
            }
          : null,
        incidents: snapshot.frontline?.incidents?.map((incident) => ({
          id: incident.id,
          label: incident.label,
          kind: incident.kind,
          status: incident.status,
          territoryState: incident.territoryState
        })) ?? []
      };
    }

    if (command === "regression-gate") {
      return runRegressionGate(page, options);
    }

    if (command === "verify") {
      if (typeof options.id !== "string") {
        throw new Error("verify requires --id.");
      }
      return runAnyVerification(page, options.id, options);
    }

    if (command === "configure") {
      return callAgent(page, "configureNextRaid", {
        routeId: options.route,
        weaponId: options.weapon,
        tacticalServiceId: options.service,
        contractId: options.contract,
        medkits: options["medkits"] === undefined ? undefined : parseNumber(options["medkits"]),
        ammoPacks: options["ammo-packs"] === undefined ? undefined : parseNumber(options["ammo-packs"]),
        topTab: options["top-tab"],
        commandTab: options["command-tab"]
      });
    }

    if (command === "stage-state") {
      if (typeof options.id !== "string") {
        throw new Error("stage-state requires --id.");
      }
      return callAgent(page, "stageState", options.id);
    }

    if (command === "start-raid") {
      return callAgent(page, "startRaid");
    }

    if (command === "move") {
      const x = parseNumber(options.x);
      const y = parseNumber(options.y);
      const seconds = parseNumber(options.seconds, 0.35);
      await callAgent(page, "setMoveInput", { x, y });
      await page.waitForTimeout(seconds * 1000);
      return callAgent(page, "setMoveInput", { x: 0, y: 0 });
    }

    if (command === "raid-action") {
      if (options["start-raid"]) {
        await callAgent(page, "startRaid");
      }
      await applyRaidAction(page, options);

      return callAgent(page, "getSnapshot");
    }

    if (command === "macro") {
      if (typeof options.id !== "string") {
        throw new Error("macro requires --id.");
      }
      return runMacro(page, options.id, options);
    }

    if (command === "aim") {
      return callAgent(page, "setAimTarget", {
        x: parseNumber(options.x),
        y: parseNumber(options.y)
      });
    }

    if (command === "trigger") {
      const held = parseBoolean(options.held);
      const seconds = options.seconds === undefined ? null : parseNumber(options.seconds);
      await callAgent(page, "setTriggerHeld", held);
      if (seconds !== null) {
        await page.waitForTimeout(seconds * 1000);
        return callAgent(page, "setTriggerHeld", false);
      }
      return callAgent(page, "getSnapshot");
    }

    if (command === "focus") {
      const held = parseBoolean(options.held);
      const seconds = options.seconds === undefined ? null : parseNumber(options.seconds);
      await callAgent(page, "setFocusHeld", held);
      if (seconds !== null) {
        await page.waitForTimeout(seconds * 1000);
        return callAgent(page, "setFocusHeld", false);
      }
      return callAgent(page, "getSnapshot");
    }

    if (command === "action") {
      const type = options.type;
      if (type !== "interact" && type !== "reload" && type !== "heal" && type !== "stabilize" && type !== "finish") {
        throw new Error('Action type must be one of "interact", "reload", "heal", "stabilize", or "finish".');
      }
      return callAgent(page, "queueRaidAction", type);
    }

    if (command === "support-order") {
      if (typeof options.id !== "string") {
        throw new Error("support-order requires --id.");
      }
      return callAgent(page, "queueSupportOrder", options.id);
    }

    if (command === "select-boy") {
      if (options.index === undefined) {
        throw new Error("select-boy requires --index.");
      }
      return callAgent(page, "selectSquadMate", parseNumber(options.index));
    }

    if (command === "squad-order") {
      if (typeof options.id !== "string") {
        throw new Error("squad-order requires --id.");
      }
      if (!["follow", "defend", "attack", "brace-watch", "move-watch"].includes(options.id)) {
        throw new Error("squad-order --id must be follow, defend, attack, brace-watch, or move-watch.");
      }
      if ((options.id === "defend" || options.id === "brace-watch" || options.id === "move-watch") && (options.x === undefined || options.y === undefined)) {
        throw new Error(`squad-order --id ${options.id} requires --x and --y.`);
      }

      const target =
        options.x !== undefined || options.y !== undefined
          ? {
              x: parseNumber(options.x),
              y: parseNumber(options.y)
            }
          : null;
      return callAgent(page, "queueSquadCommand", {
        orderId: options.id,
        target
      });
    }

    if (command === "squad-action") {
      if (typeof options.id !== "string") {
        throw new Error("squad-action requires --id.");
      }
      if (options.id !== "grenade" && options.id !== "suppress") {
        throw new Error("squad-action --id must be grenade or suppress.");
      }

      if (options.x === undefined || options.y === undefined) {
        throw new Error("squad-action requires --x and --y.");
      }

      return callAgent(page, "queueSquadTacticalAction", {
        actionId: options.id,
        target: {
          x: parseNumber(options.x),
          y: parseNumber(options.y)
        },
        source: "cli"
      });
    }

    if (command === "focus-incident") {
      if (options.id === undefined) {
        throw new Error("focus-incident requires --id.");
      }
      return callAgent(page, "setFocusedIncident", await resolveIncidentFocusValue(page, options.id));
    }

    if (command === "focus-extract") {
      if (options.id === undefined) {
        throw new Error("focus-extract requires --id.");
      }
      return callAgent(page, "setFocusedExtract", options.id === "clear" ? null : options.id);
    }

    if (command === "showcase") {
      if (typeof options.id !== "string") {
        throw new Error("showcase requires --id.");
      }
      return callAgent(page, "stageShowcase", options.id);
    }

    if (command === "click") {
      if (typeof options.selector !== "string") {
        throw new Error("click requires --selector.");
      }
      await page.click(options.selector);
      await page.waitForTimeout(200);
      return callAgent(page, "getSnapshot");
    }

    if (command === "wait") {
      await page.waitForTimeout(parseNumber(options.seconds, 0.5) * 1000);
      return callAgent(page, "getSnapshot");
    }

    if (command === "screenshot" || command === "capture") {
      if (typeof options.path !== "string") {
        throw new Error("screenshot/capture requires --path.");
      }
      await stagePreCaptureState(page, options);
      if (typeof options.selector === "string") {
        await page.locator(options.selector).first().screenshot({ path: options.path });
      } else {
        await page.screenshot({ path: options.path, fullPage: true });
      }
      return {
        ok: true,
        screenshotPath: options.path,
        snapshot: await callAgent(page, "getSnapshot")
      };
    }

    throw new Error(`Unknown command "${command}". Run "npm run game:cli -- help" for usage.`);
  });

  console.log(JSON.stringify(result, null, 2));
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

