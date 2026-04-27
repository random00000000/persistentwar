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
  | "extract-hot"
  | "build-order-issued"
  | "builder-moving"
  | "builder-exposed"
  | "construction-started"
  | "construction-stalled"
  | "trench-completed"
  | "ammo-crate-completed"
  | "ammo-crate-low"
  | "ammo-crate-empty"
  | "line-held"
  | "line-collapsed"
  | "camp-under-fire"
  | "camp-damaged"
  | "camp-destroyed"
  | "fallback-ordered"
  | "bad-order-cost";

export type HostileStoryEventKind =
  | "advance"
  | "contact"
  | "surrender"
  | "civilian"
  | "extract"
  | "build-order-issued"
  | "builder-moving"
  | "builder-exposed"
  | "construction-started"
  | "construction-stalled"
  | "trench-completed"
  | "ammo-crate-completed"
  | "ammo-crate-low"
  | "ammo-crate-empty"
  | "line-held"
  | "line-collapsed"
  | "camp-under-fire"
  | "camp-damaged"
  | "camp-destroyed"
  | "fallback-ordered"
  | "bad-order-cost";

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
  | "extract-barely-made"
  | "order-saved-line"
  | "order-exposed-builder"
  | "late-fallback"
  | "ammo-shortage"
  | "trench-held"
  | "trench-failed"
  | "camp-hit"
  | "body-recovered"
  | "body-left"
  | "officer-intervened"
  | "officer-helped"
  | "officer-cost"
  | "enemy-pressure"
  | "supply-failure"
  | "terrain-failure"
  | "unclear"
  | "arc-officer-distrust"
  | "arc-officer-resentment"
  | "arc-guilt"
  | "arc-confidence"
  | "arc-protective"
  | "arc-rivalry"
  | "arc-yara-cold"
  | "arc-rook-strict"
  | "arc-makar-reckless"
  | "arc-trust-repair"
  | "builder-hit-here"
  | "trench-saved-line"
  | "trench-overrun"
  | "ammo-ran-dry"
  | "camp-shelled"
  | "body-left-here"
  | "body-recovered-here"
  | "fallback-collapsed"
  | "last-stand"
  | "quiet-after-loss"
  | "beat-setup"
  | "beat-rising-pressure"
  | "beat-complication"
  | "beat-cost"
  | "beat-reversal"
  | "beat-payoff"
  | "beat-aftermath"
  | "beat-echo";

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
