/// <reference types="vite/client" />

import type {
  DialogueStoryPack,
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
