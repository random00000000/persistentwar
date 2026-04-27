import type { DialogueStoryPack } from "../storyPackSchema";

export const storyPack = {
  id: "officer-war-orders",
  title: "Officer War Orders",
  summary:
    "First Frontline Officer drama pack for build orders, exposed builders, trench completion, ammo collapse, line pressure, and camp damage.",
  storyTypes: [
    "officer build order",
    "builder exposure",
    "construction payoff",
    "ammo sustain",
    "line survival",
    "camp damage"
  ],
  deliveryNotes: [
    "Keep active town-war lines short and causal.",
    "Tie every line to a visible order, builder, supply, line, or camp state.",
    "Let characters judge the officer's battlefield choices without explaining systems."
  ],
  guardrails: [
    "Stay inside the fictional camp-versus-camp frame.",
    "Do not invent casualties, rescues, betrayals, or victories the town-war state did not track.",
    "Prefer officer consequence over generic military flavor."
  ],
  squadTemplates: [
    {
      id: "officer-order-trench-rook",
      kind: "build-order-issued",
      tone: "steady",
      channel: "Officer Net",
      text: "{addressee}, mark it and move. That order only matters if the builder lives.",
      weight: 2.4,
      focusTags: ["discipline", "body"],
      allowedSpeakers: ["Rook"]
    },
    {
      id: "officer-order-build-yara",
      kind: "build-order-issued",
      tone: "steady",
      channel: "Officer Net",
      text: "{addressee}, that is open ground. Keep eyes on the builder.",
      weight: 2.3,
      focusTags: ["body", "discipline"],
      allowedSpeakers: ["Yara"]
    },
    {
      id: "officer-order-build-makar",
      kind: "build-order-issued",
      tone: "steady",
      channel: "Officer Net",
      text: "{addressee}, fine. I will make noise while the shovel works.",
      weight: 2,
      focusTags: ["noise"],
      allowedSpeakers: ["Makar"]
    },
    {
      id: "officer-builder-moving-rook",
      kind: "builder-moving",
      tone: "warning",
      channel: "Builder Move",
      text: "{addressee}, builder is walking. Do not let the lane wake up first.",
      weight: 2.2,
      focusTags: ["discipline", "body"],
      allowedSpeakers: ["Rook"]
    },
    {
      id: "officer-builder-moving-yara",
      kind: "builder-moving",
      tone: "warning",
      channel: "Builder Move",
      text: "{addressee}, shovel is moving. Cover him like he has a name.",
      weight: 2.35,
      focusTags: ["body"],
      allowedSpeakers: ["Yara"]
    },
    {
      id: "officer-builder-exposed-yara",
      kind: "builder-exposed",
      tone: "critical",
      channel: "Builder Exposed",
      text: "{addressee}, builder is naked out there. Put fire on the road.",
      weight: 3.1,
      focusTags: ["body", "discipline"],
      allowedSpeakers: ["Yara"]
    },
    {
      id: "officer-builder-exposed-rook",
      kind: "builder-exposed",
      tone: "critical",
      channel: "Builder Exposed",
      text: "{addressee}, that order is exposed. Cover it or cancel it.",
      weight: 3,
      focusTags: ["discipline", "body"],
      allowedSpeakers: ["Rook"]
    },
    {
      id: "officer-builder-exposed-makar",
      kind: "builder-exposed",
      tone: "critical",
      channel: "Builder Exposed",
      text: "{addressee}, I can get loud. He still needs seconds.",
      weight: 2.65,
      focusTags: ["noise", "body"],
      allowedSpeakers: ["Makar"]
    },
    {
      id: "officer-construction-started-rook",
      kind: "construction-started",
      tone: "warning",
      channel: "Shovel Work",
      text: "{addressee}, shovel is in. Hold the shape until it becomes cover.",
      weight: 2.35,
      focusTags: ["discipline"],
      allowedSpeakers: ["Rook"]
    },
    {
      id: "officer-construction-stalled-yara",
      kind: "construction-stalled",
      tone: "critical",
      channel: "Shovel Work",
      text: "{addressee}, work stalled. That place is asking for blood.",
      weight: 2.9,
      focusTags: ["body", "discipline"],
      allowedSpeakers: ["Yara"]
    },
    {
      id: "officer-trench-complete-rook",
      kind: "trench-completed",
      tone: "steady",
      channel: "Build Complete",
      text: "{addressee}, trench is in. Now make it worth the dirt.",
      weight: 2.8,
      focusTags: ["discipline"],
      allowedSpeakers: ["Rook"]
    },
    {
      id: "officer-trench-complete-yara",
      kind: "trench-completed",
      tone: "steady",
      channel: "Build Complete",
      text: "{addressee}, cover exists now. Use it before someone pays twice.",
      weight: 2.7,
      focusTags: ["body", "discipline"],
      allowedSpeakers: ["Yara"]
    },
    {
      id: "officer-ammo-complete-makar",
      kind: "ammo-crate-completed",
      tone: "steady",
      channel: "Build Complete",
      text: "{addressee}, crate is live. Now the line can bark back.",
      weight: 2.75,
      focusTags: ["noise", "discipline"],
      allowedSpeakers: ["Makar"]
    },
    {
      id: "officer-ammo-complete-rook",
      kind: "ammo-crate-completed",
      tone: "steady",
      channel: "Build Complete",
      text: "{addressee}, ammo is forward. Do not let it become their prize.",
      weight: 2.55,
      focusTags: ["discipline", "greed"],
      allowedSpeakers: ["Rook"]
    },
    {
      id: "officer-ammo-low-rook",
      kind: "ammo-crate-low",
      tone: "warning",
      channel: "Ammo State",
      text: "{addressee}, crate is thinning. The line is about to feel it.",
      weight: 2.65,
      focusTags: ["discipline"],
      allowedSpeakers: ["Rook"]
    },
    {
      id: "officer-ammo-empty-yara",
      kind: "ammo-crate-empty",
      tone: "critical",
      channel: "Ammo State",
      text: "{addressee}, crate is dry. Anyone forward is borrowing time.",
      weight: 3.05,
      focusTags: ["body", "discipline"],
      allowedSpeakers: ["Yara"]
    },
    {
      id: "officer-line-held-rook",
      kind: "line-held",
      tone: "steady",
      channel: "Line Read",
      text: "{addressee}, line held. Remember what made it hold.",
      weight: 2.65,
      focusTags: ["discipline"],
      allowedSpeakers: ["Rook"]
    },
    {
      id: "officer-line-collapsed-yara",
      kind: "line-collapsed",
      tone: "critical",
      channel: "Line Read",
      text: "{addressee}, line folded. Count people before you count ground.",
      weight: 3.05,
      focusTags: ["body", "discipline"],
      allowedSpeakers: ["Yara"]
    },
    {
      id: "officer-camp-under-fire-makar",
      kind: "camp-under-fire",
      tone: "critical",
      channel: "Camp Alarm",
      text: "{addressee}, camp is catching rounds. Wake every gun.",
      weight: 2.9,
      focusTags: ["noise", "discipline"],
      allowedSpeakers: ["Makar"]
    },
    {
      id: "officer-camp-damaged-rook",
      kind: "camp-damaged",
      tone: "critical",
      channel: "Camp Alarm",
      text: "{addressee}, camp took the hit. Next order has to matter.",
      weight: 3,
      focusTags: ["discipline", "body"],
      allowedSpeakers: ["Rook"]
    },
    {
      id: "officer-camp-destroyed-yara",
      kind: "camp-destroyed",
      tone: "critical",
      channel: "Camp Collapse",
      text: "{addressee}, camp is gone. Nobody talks this one clean.",
      weight: 3.2,
      focusTags: ["body", "discipline"],
      allowedSpeakers: ["Yara"]
    }
  ],
  hostileTemplates: [
    {
      id: "officer-hostile-builder-exposed",
      kind: "builder-exposed",
      tone: "warning",
      channel: "Enemy Net",
      text: "Builder exposed. Punish the shovel.",
      weight: 2.8,
      tapeId: "blue"
    },
    {
      id: "officer-hostile-build-order",
      kind: "build-order-issued",
      tone: "steady",
      channel: "Enemy Net",
      text: "They are marking dirt. Watch the worker.",
      weight: 2.2,
      tapeId: "green"
    },
    {
      id: "officer-hostile-ammo-empty",
      kind: "ammo-crate-empty",
      tone: "critical",
      channel: "Enemy Net",
      text: "Their crate is dry. Press before they refill.",
      weight: 2.75,
      tapeId: "yellow"
    },
    {
      id: "officer-hostile-line-collapsed",
      kind: "line-collapsed",
      tone: "critical",
      channel: "Enemy Net",
      text: "Line broke. Walk through the gap.",
      weight: 2.9,
      tapeId: "green"
    },
    {
      id: "officer-hostile-camp-damaged",
      kind: "camp-damaged",
      tone: "critical",
      channel: "Enemy Net",
      text: "Camp is hurt. Keep hitting the heart.",
      weight: 3,
      tapeId: "blue"
    },
    {
      id: "officer-hostile-camp-destroyed",
      kind: "camp-destroyed",
      tone: "critical",
      channel: "Enemy Net",
      text: "Camp is dead. Sweep the rest.",
      weight: 3.2,
      tapeId: "yellow"
    }
  ]
} satisfies DialogueStoryPack;
