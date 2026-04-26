export type DialogueStoryEventKind =
  | "advance"
  | "contact"
  | "mate-down"
  | "body-sighted"
  | "loot"
  | "intel"
  | "coffee"
  | "civilian"
  | "body-recovery"
  | "surrender"
  | "claim-breaking"
  | "claim-held"
  | "claim-loss"
  | "extract-open"
  | "extract-hot";

export type HostileStoryEventKind = "advance" | "contact" | "surrender" | "civilian" | "extract";

export type DialogueStoryTone = "steady" | "warning" | "critical" | "extract";
export type DialogueStoryFocusTag = "discipline" | "noise" | "body" | "greed";
export type DialogueStoryEnemyTapeId = "blue" | "green" | "yellow";
export type DialogueStoryMemoryTag =
  | "mate-recovered"
  | "mate-left-behind"
  | "family-informed"
  | "wake-held"
  | "civilian-saved"
  | "surrender-taken"
  | "sector-held"
  | "sector-lost"
  | "sector-reclaiming"
  | "sector-fragile"
  | "sector-breaking"
  | "casualty-corridor-open"
  | "convoy-hit"
  | "extract-barely-made";

export interface DialogueVoiceProfileDefinition {
  focusBias: DialogueStoryFocusTag[];
  stressStyle: "quieter" | "sharper" | "louder" | "colder";
}

export interface SquadDialogueTemplateDefinition {
  id: string;
  kind: DialogueStoryEventKind;
  tone: DialogueStoryTone;
  channel: string;
  text: string;
  weight: number;
  focusTags: DialogueStoryFocusTag[];
  allowedSpeakers?: string[];
  enemyTapeId?: DialogueStoryEnemyTapeId;
  requiredMemoryTag?: DialogueStoryMemoryTag;
  requiredSubjectName?: string;
}

export interface HostileDialogueTemplateDefinition {
  id: string;
  kind: HostileStoryEventKind;
  tone: DialogueStoryTone;
  channel: string;
  text: string;
  weight: number;
  tapeId?: DialogueStoryEnemyTapeId;
}

export interface DialogueStoryPack {
  id: string;
  title: string;
  summary: string;
  storyTypes: string[];
  deliveryNotes: string[];
  guardrails: string[];
  voiceProfiles?: Record<string, DialogueVoiceProfileDefinition>;
  squadTemplates?: SquadDialogueTemplateDefinition[];
  hostileTemplates?: HostileDialogueTemplateDefinition[];
}
