import type { DialogueStoryPack } from "../storyPackSchema";

export const storyPack = {
  id: "after-action-voices",
  title: "After Action Voices",
  summary:
    "Hot-extract discipline, memorial carryover, and quiet reset fragments that keep raid pressure and stash grief sounding like one campaign.",
  storyTypes: ["hot extract discipline", "memorial carryover", "quiet wake-table reset", "body debt discipline"],
  deliveryNotes: [
    "Keep hot-extract lines short enough to survive live gunfire.",
    "Let memorial carryover read like a scar flash, not a monologue.",
    "Quiet reset lines should only land when the pocket actually breathes."
  ],
  guardrails: [
    "Reuse current memory tags and event kinds before widening dialogue plumbing.",
    "Keep the squad grounded in the fictional Blue/Green/Yellow frame.",
    "Do not let grief chatter replace route, extract, or casualty readability."
  ],
  squadTemplates: [
    {
      id: "after-action-advance-left-behind-rook",
      kind: "advance",
      tone: "steady",
      channel: "Wall Echo",
      text: "{addressee}, same ground still owes us a body. Walk it like you know that.",
      weight: 2.7,
      focusTags: ["discipline", "body"],
      allowedSpeakers: ["Rook", "Yara"],
      requiredMemoryTag: "mate-left-behind"
    },
    {
      id: "after-action-advance-sector-held-yara",
      kind: "advance",
      tone: "steady",
      channel: "Wall Echo",
      text: "{addressee}, we kept this once. Keep it without buying another name.",
      weight: 2.3,
      focusTags: ["body", "discipline"],
      allowedSpeakers: ["Yara", "Rook"],
      requiredMemoryTag: "sector-held"
    },
    {
      id: "after-action-advance-family-informed-rook",
      kind: "advance",
      tone: "steady",
      channel: "Wall Echo",
      text: "{addressee}, family knows now. Walk this lane like the dead have witnesses.",
      weight: 2.85,
      focusTags: ["discipline", "body"],
      allowedSpeakers: ["Rook", "Yara"],
      requiredMemoryTag: "family-informed"
    },
    {
      id: "after-action-body-recovery-left-behind-yara",
      kind: "body-recovery",
      tone: "warning",
      channel: "Recovery Echo",
      text: "{addressee}, this pull settles the wall or it settles nothing.",
      weight: 3.05,
      focusTags: ["body", "discipline"],
      allowedSpeakers: ["Yara", "Rook"],
      requiredMemoryTag: "mate-left-behind"
    },
    {
      id: "after-action-body-recovery-recovered-makar",
      kind: "body-recovery",
      tone: "warning",
      channel: "Recovery Echo",
      text: "{addressee}, tags came home once already. Buy me the lane and we do it again.",
      weight: 2.6,
      focusTags: ["noise", "body"],
      allowedSpeakers: ["Makar"],
      requiredMemoryTag: "mate-recovered"
    },
    {
      id: "after-action-contact-wake-held-yara",
      kind: "contact",
      tone: "warning",
      channel: "Wake Echo",
      text: "{addressee}, wake is done. Keep this clean enough to deserve it.",
      weight: 3.1,
      focusTags: ["body", "discipline"],
      allowedSpeakers: ["Yara", "Rook"],
      requiredMemoryTag: "wake-held"
    },
    {
      id: "after-action-claim-loss-family-informed-rook",
      kind: "claim-loss",
      tone: "warning",
      channel: "Wall Echo",
      text: "{addressee}, home already heard the name. Either reclaim this dirt or leave before it eats another.",
      weight: 3.05,
      focusTags: ["discipline", "body"],
      allowedSpeakers: ["Rook"],
      requiredMemoryTag: "family-informed"
    },
    {
      id: "after-action-extract-open-barely-made-yara",
      kind: "extract-open",
      tone: "extract",
      channel: "Hot Extract",
      text: "{addressee}, beacon is kind. Take the kindness before it changes its mind.",
      weight: 2.7,
      focusTags: ["body", "discipline"],
      allowedSpeakers: ["Yara", "Rook"],
      requiredMemoryTag: "extract-barely-made"
    },
    {
      id: "after-action-extract-open-wake-held-rook",
      kind: "extract-open",
      tone: "extract",
      channel: "Hot Extract",
      text: "{addressee}, wake bought us this cleaner pull. Do not spend it on one more corpse.",
      weight: 3.15,
      focusTags: ["discipline", "body", "greed"],
      allowedSpeakers: ["Rook", "Yara"],
      requiredMemoryTag: "wake-held"
    },
    {
      id: "after-action-extract-hot-left-behind-rook",
      kind: "extract-hot",
      tone: "critical",
      channel: "Hot Extract",
      text: "{addressee}, if we get greedy here the wall gets another nail.",
      weight: 3.3,
      focusTags: ["discipline", "body", "greed"],
      allowedSpeakers: ["Rook", "Yara"],
      requiredMemoryTag: "mate-left-behind"
    },
    {
      id: "after-action-extract-hot-barely-made-makar",
      kind: "extract-hot",
      tone: "critical",
      channel: "Hot Extract",
      text: "{addressee}, no hero pull. We already spent our miracle on this route.",
      weight: 3.05,
      focusTags: ["noise", "discipline", "body"],
      allowedSpeakers: ["Makar", "Rook"],
      requiredMemoryTag: "extract-barely-made"
    },
    {
      id: "after-action-extract-hot-family-informed-yara",
      kind: "extract-hot",
      tone: "critical",
      channel: "Hot Extract",
      text: "{addressee}, call home already happened. Do not make me hear that phone again tonight.",
      weight: 3.35,
      focusTags: ["body", "discipline"],
      allowedSpeakers: ["Yara", "Rook"],
      requiredMemoryTag: "family-informed"
    },
    {
      id: "after-action-coffee-recovered-rook",
      kind: "coffee",
      tone: "steady",
      channel: "Quiet Reset",
      text: "{addressee}, drink while the wall is quiet. It never stays quiet for long.",
      weight: 2.15,
      focusTags: ["discipline", "body"],
      allowedSpeakers: ["Rook", "Yara"],
      requiredMemoryTag: "mate-recovered"
    },
    {
      id: "after-action-coffee-civilian-yara",
      kind: "coffee",
      tone: "steady",
      channel: "Quiet Reset",
      text: "{addressee}, warm hands. Nice when one memory on this route is not a body.",
      weight: 1.9,
      focusTags: ["body", "discipline"],
      allowedSpeakers: ["Yara"],
      requiredMemoryTag: "civilian-saved"
    },
    {
      id: "after-action-coffee-wake-held-rook",
      kind: "coffee",
      tone: "steady",
      channel: "Quiet Reset",
      text: "{addressee}, drink while the wake still holds. Quiet never lasts long around us.",
      weight: 2.25,
      focusTags: ["discipline", "body"],
      allowedSpeakers: ["Rook", "Yara"],
      requiredMemoryTag: "wake-held"
    }
  ],
  hostileTemplates: [
    {
      id: "after-action-hostile-extract-blue",
      kind: "extract",
      tone: "critical",
      channel: "Blue Net",
      text: "Ring is open. Break the wounded first and the rest will fold.",
      weight: 2.08,
      tapeId: "blue"
    },
    {
      id: "after-action-hostile-extract-green",
      kind: "extract",
      tone: "critical",
      channel: "Green Net",
      text: "They want a clean pull. Give them another wall instead.",
      weight: 2.22,
      tapeId: "green"
    }
  ]
} satisfies DialogueStoryPack;
