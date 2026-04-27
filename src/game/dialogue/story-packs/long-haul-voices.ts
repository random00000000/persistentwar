import type { DialogueStoryPack } from "../storyPackSchema";

export const storyPack = {
  id: "long-haul-voices",
  title: "Long Haul Voices",
  summary:
    "Persistent arc callbacks for Rook, Makar, and Yara as trust, resentment, guilt, confidence, and relationship pressure change over repeated town-war orders.",
  storyTypes: [
    "Rook pressure arc",
    "Makar confidence arc",
    "Yara trauma arc",
    "trust repair",
    "relationship pressure"
  ],
  deliveryNotes: [
    "Use only with arc memory tags produced by town-war soldier drama state.",
    "Make the line feel like accumulated pressure, not exposition.",
    "Keep active lines short and tactical."
  ],
  guardrails: [
    "Do not imply a named death unless the simulation tracked it.",
    "Do not overrule the current battlefield event.",
    "Keep arc callbacks grounded in orders, cover, ammo, and survival."
  ],
  squadTemplates: [
    {
      id: "long-haul-rook-strict-builder",
      kind: "builder-exposed",
      tone: "critical",
      channel: "Long Haul",
      text: "{addressee}, I am done pretending exposed orders are discipline.",
      weight: 5.4,
      focusTags: ["discipline", "body"],
      allowedSpeakers: ["Rook"],
      requiredMemoryTag: "arc-rook-strict"
    },
    {
      id: "long-haul-rook-distrust-line",
      kind: "line-collapsed",
      tone: "critical",
      channel: "Long Haul",
      text: "{addressee}, this is what late correction sounds like.",
      weight: 5,
      focusTags: ["discipline"],
      allowedSpeakers: ["Rook"],
      requiredMemoryTag: "arc-officer-distrust"
    },
    {
      id: "long-haul-yara-cold-builder",
      kind: "builder-exposed",
      tone: "critical",
      channel: "Long Haul",
      text: "{addressee}, I know this road. It keeps asking for bodies.",
      weight: 5.6,
      focusTags: ["body"],
      allowedSpeakers: ["Yara"],
      requiredMemoryTag: "arc-yara-cold"
    },
    {
      id: "long-haul-yara-guilt-ammo",
      kind: "ammo-crate-empty",
      tone: "critical",
      channel: "Long Haul",
      text: "{addressee}, dry again. They will look at us, not the crate.",
      weight: 5.15,
      focusTags: ["body"],
      allowedSpeakers: ["Yara"],
      requiredMemoryTag: "arc-guilt"
    },
    {
      id: "long-haul-makar-reckless-build",
      kind: "trench-completed",
      tone: "steady",
      channel: "Long Haul",
      text: "{addressee}, that worked. Give me noise and I will buy another.",
      weight: 5.05,
      focusTags: ["noise"],
      allowedSpeakers: ["Makar"],
      requiredMemoryTag: "arc-makar-reckless"
    },
    {
      id: "long-haul-makar-confidence-line",
      kind: "line-held",
      tone: "steady",
      channel: "Long Haul",
      text: "{addressee}, see? Good dirt, loud guns, living line.",
      weight: 5.1,
      focusTags: ["noise", "discipline"],
      allowedSpeakers: ["Makar"],
      requiredMemoryTag: "arc-confidence"
    },
    {
      id: "long-haul-trust-repair-rook",
      kind: "line-held",
      tone: "steady",
      channel: "Long Haul",
      text: "{addressee}, that order repairs more than ground.",
      weight: 5.25,
      focusTags: ["discipline"],
      allowedSpeakers: ["Rook"],
      requiredMemoryTag: "arc-trust-repair"
    },
    {
      id: "long-haul-protective-yara",
      kind: "builder-exposed",
      tone: "critical",
      channel: "Long Haul",
      text: "{addressee}, keep that builder breathing. I mean it.",
      weight: 5.2,
      focusTags: ["body"],
      allowedSpeakers: ["Yara"],
      requiredMemoryTag: "arc-protective"
    },
    {
      id: "long-haul-rivalry-makar",
      kind: "bad-order-cost",
      tone: "critical",
      channel: "Long Haul",
      text: "{addressee}, somebody keeps paying for someone else's hurry.",
      weight: 4.95,
      focusTags: ["noise", "body"],
      allowedSpeakers: ["Makar"],
      requiredMemoryTag: "arc-rivalry"
    }
  ],
  hostileTemplates: []
} satisfies DialogueStoryPack;
