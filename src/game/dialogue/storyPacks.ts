/// <reference types="vite/client" />

import type {
  DialogueStoryPack,
  DialogueStoryMemoryTag,
  DialogueVoiceProfileDefinition,
  HostileDialogueTemplateDefinition,
  SquadDialogueTemplateDefinition
} from "./storyPackSchema";

type StoryPackModule = {
  storyPack: DialogueStoryPack;
};

const storyPackModules = import.meta.glob("./story-packs/*.ts", { eager: true }) as Record<string, StoryPackModule>;

export const DIALOGUE_STORY_PACKS: DialogueStoryPack[] = Object.entries(storyPackModules)
  .sort(([leftPath], [rightPath]) => leftPath.localeCompare(rightPath))
  .map(([, module]) => module.storyPack);

export const DIALOGUE_STORY_PACK_SUMMARIES = DIALOGUE_STORY_PACKS.map((pack) => ({
  id: pack.id,
  title: pack.title,
  summary: pack.summary,
  storyTypes: [...pack.storyTypes],
  deliveryNotes: [...pack.deliveryNotes],
  guardrails: [...pack.guardrails]
}));

export const SQUAD_DIALOGUE_VOICE_PROFILES: Record<string, DialogueVoiceProfileDefinition> = DIALOGUE_STORY_PACKS.reduce<
  Record<string, DialogueVoiceProfileDefinition>
>((profiles, pack) => {
  if (pack.voiceProfiles) {
    Object.assign(profiles, pack.voiceProfiles);
  }
  return profiles;
}, {});

const squadTemplateMap = DIALOGUE_STORY_PACKS.reduce<Map<string, SquadDialogueTemplateDefinition>>((templates, pack) => {
  for (const template of pack.squadTemplates ?? []) {
    templates.set(template.id, template);
  }
  return templates;
}, new Map<string, SquadDialogueTemplateDefinition>());

const hostileTemplateMap = DIALOGUE_STORY_PACKS.reduce<Map<string, HostileDialogueTemplateDefinition>>((templates, pack) => {
  for (const template of pack.hostileTemplates ?? []) {
    templates.set(template.id, template);
  }
  return templates;
}, new Map<string, HostileDialogueTemplateDefinition>());

export const SQUAD_DIALOGUE_TEMPLATES: SquadDialogueTemplateDefinition[] = [...squadTemplateMap.values()];
export const HOSTILE_DIALOGUE_TEMPLATES: HostileDialogueTemplateDefinition[] = [...hostileTemplateMap.values()];

export interface DialogueStoryPackAudit {
  ok: boolean;
  errors: string[];
  warnings: string[];
  totals: {
    packs: number;
    squadTemplates: number;
    hostileTemplates: number;
    activeBattlefieldLines: number;
    hostileNetLines: number;
    quietAftermathLines: number;
    locationScarCallbacks: number;
    relationshipArcCallbacks: number;
    officerResponsibilityLines: number;
    campOrMatchEndLines: number;
  };
  byFamily: Array<{
    id: string;
    title: string;
    squadTemplates: number;
    hostileTemplates: number;
    memoryCallbacks: number;
    beatCallbacks: number;
  }>;
}

const SUPPORTED_MEMORY_TAGS: Set<DialogueStoryMemoryTag> = new Set([
  "mate-recovered",
  "mate-left-behind",
  "family-informed",
  "wake-held",
  "civilian-saved",
  "surrender-taken",
  "sector-held",
  "sector-lost",
  "sector-reclaiming",
  "sector-fragile",
  "sector-breaking",
  "casualty-corridor-open",
  "convoy-hit",
  "extract-barely-made",
  "order-saved-line",
  "order-exposed-builder",
  "late-fallback",
  "ammo-shortage",
  "trench-held",
  "trench-failed",
  "camp-hit",
  "body-recovered",
  "body-left",
  "officer-intervened",
  "officer-helped",
  "officer-cost",
  "enemy-pressure",
  "supply-failure",
  "terrain-failure",
  "unclear",
  "arc-officer-distrust",
  "arc-officer-resentment",
  "arc-guilt",
  "arc-confidence",
  "arc-protective",
  "arc-rivalry",
  "arc-yara-cold",
  "arc-rook-strict",
  "arc-makar-reckless",
  "arc-trust-repair",
  "builder-hit-here",
  "trench-saved-line",
  "trench-overrun",
  "ammo-ran-dry",
  "camp-shelled",
  "body-left-here",
  "body-recovered-here",
  "fallback-collapsed",
  "last-stand",
  "quiet-after-loss",
  "beat-setup",
  "beat-rising-pressure",
  "beat-complication",
  "beat-cost",
  "beat-reversal",
  "beat-payoff",
  "beat-aftermath",
  "beat-echo"
]);

function getWordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function isLocationScarTag(tag: DialogueStoryMemoryTag | undefined): boolean {
  return Boolean(
    tag === "builder-hit-here" ||
      tag === "trench-saved-line" ||
      tag === "trench-overrun" ||
      tag === "ammo-ran-dry" ||
      tag === "camp-shelled" ||
      tag === "body-left-here" ||
      tag === "body-recovered-here" ||
      tag === "fallback-collapsed" ||
      tag === "last-stand" ||
      tag === "quiet-after-loss"
  );
}

function isRelationshipTag(tag: DialogueStoryMemoryTag | undefined): boolean {
  return Boolean(typeof tag === "string" && tag.startsWith("arc-"));
}

function isOfficerResponsibilityTag(tag: DialogueStoryMemoryTag | undefined): boolean {
  return Boolean(tag === "order-exposed-builder" || tag === "officer-cost" || tag === "officer-helped");
}

function isQuietAftermathTemplate(template: SquadDialogueTemplateDefinition): boolean {
  return template.channel === "Long Haul" || template.channel === "Scarred Town" || template.channel === "Cinematic Beat";
}

export function validateDialogueStoryPacks(packs: DialogueStoryPack[] = DIALOGUE_STORY_PACKS): DialogueStoryPackAudit {
  const errors: string[] = [];
  const warnings: string[] = [];
  const seenTemplateIds = new Map<string, string>();
  const byFamily: DialogueStoryPackAudit["byFamily"] = [];
  let squadTemplates = 0;
  let hostileTemplates = 0;
  let quietAftermathLines = 0;
  let locationScarCallbacks = 0;
  let relationshipArcCallbacks = 0;
  let officerResponsibilityLines = 0;
  let campOrMatchEndLines = 0;

  for (const pack of packs) {
    const squad = pack.squadTemplates ?? [];
    const hostile = pack.hostileTemplates ?? [];
    squadTemplates += squad.length;
    hostileTemplates += hostile.length;
    let memoryCallbacks = 0;
    let beatCallbacks = 0;

    for (const template of squad) {
      const previousPack = seenTemplateIds.get(template.id);
      if (previousPack) {
        errors.push(`Duplicate squad template id "${template.id}" in ${previousPack} and ${pack.id}.`);
      }
      seenTemplateIds.set(template.id, pack.id);

      if (!template.allowedSpeakers || template.allowedSpeakers.length === 0) {
        warnings.push(`Squad template "${template.id}" is missing allowedSpeakers.`);
      }

      if (template.requiredMemoryTag) {
        memoryCallbacks += 1;
        if (!SUPPORTED_MEMORY_TAGS.has(template.requiredMemoryTag)) {
          errors.push(`Squad template "${template.id}" uses unsupported memory tag "${template.requiredMemoryTag}".`);
        }
        if (template.requiredMemoryTag.startsWith("beat-")) {
          beatCallbacks += 1;
        }
        if (isLocationScarTag(template.requiredMemoryTag)) {
          locationScarCallbacks += 1;
        }
        if (isRelationshipTag(template.requiredMemoryTag)) {
          relationshipArcCallbacks += 1;
        }
        if (isOfficerResponsibilityTag(template.requiredMemoryTag)) {
          officerResponsibilityLines += 1;
        }
      }

      if (isQuietAftermathTemplate(template)) {
        quietAftermathLines += 1;
      }
      if (template.kind === "camp-destroyed" || template.kind === "line-collapsed") {
        campOrMatchEndLines += 1;
      }

      const wordCount = getWordCount(template.text);
      const limit = template.tone === "critical" ? 18 : isQuietAftermathTemplate(template) ? 30 : 14;
      if (wordCount > limit) {
        warnings.push(`Squad template "${template.id}" has ${wordCount} words; recommended limit is ${limit}.`);
      }
    }

    for (const template of hostile) {
      const previousPack = seenTemplateIds.get(template.id);
      if (previousPack) {
        errors.push(`Duplicate hostile template id "${template.id}" in ${previousPack} and ${pack.id}.`);
      }
      seenTemplateIds.set(template.id, pack.id);

      const wordCount = getWordCount(template.text);
      if (wordCount > 14) {
        warnings.push(`Hostile template "${template.id}" has ${wordCount} words; recommended limit is 14.`);
      }
    }

    byFamily.push({
      id: pack.id,
      title: pack.title,
      squadTemplates: squad.length,
      hostileTemplates: hostile.length,
      memoryCallbacks,
      beatCallbacks
    });
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    totals: {
      packs: packs.length,
      squadTemplates,
      hostileTemplates,
      activeBattlefieldLines: squadTemplates,
      hostileNetLines: hostileTemplates,
      quietAftermathLines,
      locationScarCallbacks,
      relationshipArcCallbacks,
      officerResponsibilityLines,
      campOrMatchEndLines
    },
    byFamily
  };
}
