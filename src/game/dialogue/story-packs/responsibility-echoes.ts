import type { DialogueStoryPack } from "../storyPackSchema";

export const storyPack = {
  id: "responsibility-echoes",
  title: "Responsibility Echoes",
  summary:
    "Memory callback pack for officer-caused saves, exposed builders, supply failures, camp hits, and repeated risk in the town war.",
  storyTypes: [
    "good order memory",
    "bad order memory",
    "ambiguous responsibility",
    "witness callback",
    "after-action echo"
  ],
  deliveryNotes: [
    "Only fire these when a WarDramaMemory already exists.",
    "Make the line sound like a remembered cause, not a scripted cutscene.",
    "Keep repeated-risk callbacks short enough for active combat."
  ],
  guardrails: [
    "Do not invent names, deaths, rescues, or betrayals outside tracked memory.",
    "Blame the officer only when the memory responsibility says officer-cost.",
    "Keep the war fictional and tactical."
  ],
  squadTemplates: [
    {
      id: "responsibility-good-order-line-held-rook",
      kind: "line-held",
      tone: "steady",
      channel: "Responsibility Echo",
      text: "{addressee}, that is the kind of order that kept us alive before.",
      weight: 3.4,
      focusTags: ["discipline"],
      allowedSpeakers: ["Rook"],
      requiredMemoryTag: "order-saved-line"
    },
    {
      id: "responsibility-good-order-trench-rook",
      kind: "trench-completed",
      tone: "steady",
      channel: "Responsibility Echo",
      text: "{addressee}, last good dirt saved rifles. This one can too.",
      weight: 3.25,
      focusTags: ["discipline"],
      allowedSpeakers: ["Rook"],
      requiredMemoryTag: "trench-held"
    },
    {
      id: "responsibility-good-order-ammo-makar",
      kind: "ammo-crate-completed",
      tone: "steady",
      channel: "Responsibility Echo",
      text: "{addressee}, forward ammo mattered last time. I like this.",
      weight: 3.1,
      focusTags: ["noise"],
      allowedSpeakers: ["Makar"],
      requiredMemoryTag: "officer-helped"
    },
    {
      id: "responsibility-bad-order-builder-yara",
      kind: "builder-exposed",
      tone: "critical",
      channel: "Responsibility Echo",
      text: "{addressee}, we remember this shape. Open ground eats builders.",
      weight: 4.1,
      focusTags: ["body"],
      allowedSpeakers: ["Yara"],
      requiredMemoryTag: "order-exposed-builder"
    },
    {
      id: "responsibility-bad-order-rook",
      kind: "builder-exposed",
      tone: "critical",
      channel: "Responsibility Echo",
      text: "{addressee}, same risk again. Cover first, shovel second.",
      weight: 3.95,
      focusTags: ["discipline"],
      allowedSpeakers: ["Rook"],
      requiredMemoryTag: "officer-cost"
    },
    {
      id: "responsibility-bad-order-makar",
      kind: "bad-order-cost",
      tone: "critical",
      channel: "Responsibility Echo",
      text: "{addressee}, that cost was not weather. That was a call.",
      weight: 3.9,
      focusTags: ["noise", "body"],
      allowedSpeakers: ["Makar"],
      requiredMemoryTag: "officer-cost"
    },
    {
      id: "responsibility-ammo-shortage-yara",
      kind: "ammo-crate-empty",
      tone: "critical",
      channel: "Responsibility Echo",
      text: "{addressee}, dry crate again. The line knows that sound.",
      weight: 3.85,
      focusTags: ["body"],
      allowedSpeakers: ["Yara"],
      requiredMemoryTag: "ammo-shortage"
    },
    {
      id: "responsibility-supply-failure-rook",
      kind: "bad-order-cost",
      tone: "critical",
      channel: "Responsibility Echo",
      text: "{addressee}, supply failed once. Do not let it write the pattern.",
      weight: 3.55,
      focusTags: ["discipline"],
      allowedSpeakers: ["Rook"],
      requiredMemoryTag: "supply-failure"
    },
    {
      id: "responsibility-camp-hit-rook",
      kind: "camp-damaged",
      tone: "critical",
      channel: "Responsibility Echo",
      text: "{addressee}, camp has taken this lesson before. Answer faster.",
      weight: 3.65,
      focusTags: ["discipline"],
      allowedSpeakers: ["Rook"],
      requiredMemoryTag: "camp-hit"
    },
    {
      id: "responsibility-line-failed-yara",
      kind: "line-collapsed",
      tone: "critical",
      channel: "Responsibility Echo",
      text: "{addressee}, line is folding like the last bad ground.",
      weight: 3.7,
      focusTags: ["body"],
      allowedSpeakers: ["Yara"],
      requiredMemoryTag: "trench-failed"
    }
  ],
  hostileTemplates: [
    {
      id: "responsibility-hostile-camp-hit",
      kind: "camp-damaged",
      tone: "critical",
      channel: "Enemy Net",
      text: "They remember that hit. Hit it again.",
      weight: 2.9,
      tapeId: "green"
    }
  ]
} satisfies DialogueStoryPack;
