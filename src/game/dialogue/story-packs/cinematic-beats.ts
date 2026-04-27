import type { DialogueStoryPack, SquadDialogueTemplateDefinition } from "../storyPackSchema";

const setupLines: SquadDialogueTemplateDefinition[] = [
  ["beat-setup-trench-rook", "build-order-issued", "steady", "Cinematic Beat", "Order marked. Now the road decides.", "Rook"],
  ["beat-setup-trench-yara", "build-order-issued", "warning", "Cinematic Beat", "That dig starts a long minute.", "Yara"],
  ["beat-setup-builder-moving", "builder-moving", "steady", "Cinematic Beat", "Builder is moving. Keep eyes wide.", "Makar"],
  ["beat-setup-ammo-rook", "build-order-issued", "steady", "Cinematic Beat", "Ammo plan is live. Protect the carry.", "Rook"],
  ["beat-setup-low-risk", "builder-moving", "steady", "Cinematic Beat", "Quiet approach. Do not waste it.", "Yara"],
  ["beat-setup-focus", "build-order-issued", "steady", "Cinematic Beat", "This is the first domino.", "Rook"],
  ["beat-setup-ground", "builder-moving", "steady", "Cinematic Beat", "Ground looks calm. That can lie.", "Makar"],
  ["beat-setup-breath", "build-order-issued", "steady", "Cinematic Beat", "Line is holding its breath.", "Yara"]
].map(([id, kind, tone, channel, text, speaker]) => ({
  id,
  kind,
  tone,
  channel,
  text,
  weight: 4.55,
  focusTags: ["discipline"],
  allowedSpeakers: [speaker],
  requiredMemoryTag: "beat-setup"
})) as SquadDialogueTemplateDefinition[];

const complicationLines: SquadDialogueTemplateDefinition[] = [
  ["beat-complication-builder-open", "builder-exposed", "critical", "Cinematic Beat", "Builder is in the open. Decide fast.", "Rook"],
  ["beat-complication-yara", "builder-exposed", "critical", "Cinematic Beat", "This is where orders get expensive.", "Yara"],
  ["beat-complication-makar", "builder-exposed", "warning", "Cinematic Beat", "I hate this walk. Cover it.", "Makar"],
  ["beat-complication-stalled", "construction-stalled", "critical", "Cinematic Beat", "Work stalled. Pressure owns the clock.", "Rook"],
  ["beat-complication-under-fire", "camp-under-fire", "critical", "Cinematic Beat", "Camp is taking attention now.", "Yara"],
  ["beat-complication-road", "builder-exposed", "critical", "Cinematic Beat", "Road has teeth. Builder feels them.", "Makar"],
  ["beat-complication-clock", "construction-stalled", "warning", "Cinematic Beat", "Every second makes this worse.", "Rook"],
  ["beat-complication-line", "camp-damaged", "critical", "Cinematic Beat", "They found the camp rhythm.", "Yara"],
  ["beat-complication-suppression", "builder-exposed", "critical", "Cinematic Beat", "Suppress or call them back.", "Rook"],
  ["beat-complication-silence", "construction-stalled", "warning", "Cinematic Beat", "That pause is not safety.", "Yara"]
].map(([id, kind, tone, channel, text, speaker]) => ({
  id,
  kind,
  tone,
  channel,
  text,
  weight: 4.9,
  focusTags: ["discipline", "body"],
  allowedSpeakers: [speaker],
  requiredMemoryTag: "beat-complication"
})) as SquadDialogueTemplateDefinition[];

const costLines: SquadDialogueTemplateDefinition[] = [
  ["beat-cost-bad-order", "bad-order-cost", "critical", "Cinematic Beat", "Put that in the order log.", "Yara"],
  ["beat-cost-line-fold", "line-collapsed", "critical", "Cinematic Beat", "Line folded. Now everyone pays.", "Rook"],
  ["beat-cost-camp-lost", "camp-destroyed", "critical", "Cinematic Beat", "That was the camp dying.", "Yara"],
  ["beat-cost-count", "bad-order-cost", "critical", "Cinematic Beat", "The count belongs to this order.", "Rook"],
  ["beat-cost-ground", "line-collapsed", "critical", "Cinematic Beat", "Ground is gone. Pull the rest.", "Makar"],
  ["beat-cost-no-cover", "bad-order-cost", "critical", "Cinematic Beat", "No cover, no miracle.", "Yara"],
  ["beat-cost-after", "camp-destroyed", "critical", "Cinematic Beat", "Nothing after this sounds clean.", "Rook"],
  ["beat-cost-break", "line-collapsed", "critical", "Cinematic Beat", "That break will echo.", "Yara"],
  ["beat-cost-choice", "bad-order-cost", "critical", "Cinematic Beat", "Officer, that choice landed.", "Rook"],
  ["beat-cost-quiet", "line-collapsed", "critical", "Cinematic Beat", "Hear that? That is a line ending.", "Makar"]
].map(([id, kind, tone, channel, text, speaker]) => ({
  id,
  kind,
  tone,
  channel,
  text,
  weight: 5.05,
  focusTags: ["body"],
  allowedSpeakers: [speaker],
  requiredMemoryTag: "beat-cost"
})) as SquadDialogueTemplateDefinition[];

const payoffLines: SquadDialogueTemplateDefinition[] = [
  ["beat-payoff-trench", "trench-completed", "steady", "Cinematic Beat", "Trench is in. Let it earn.", "Rook"],
  ["beat-payoff-held", "line-held", "steady", "Cinematic Beat", "That order just bought breathing room.", "Yara"],
  ["beat-payoff-ammo", "ammo-crate-completed", "steady", "Cinematic Beat", "Ammo is down. Line has lungs.", "Makar"],
  ["beat-payoff-dirt", "trench-completed", "steady", "Cinematic Beat", "Good dirt. Bad minute survived.", "Rook"],
  ["beat-payoff-window", "line-held", "steady", "Cinematic Beat", "Hold confirmed. Use the window.", "Rook"],
  ["beat-payoff-builder", "trench-completed", "steady", "Cinematic Beat", "Builder made it. Remember that.", "Yara"],
  ["beat-payoff-crate", "ammo-crate-completed", "steady", "Cinematic Beat", "Crate is live. Feed the front.", "Rook"],
  ["beat-payoff-under-fire", "line-held", "steady", "Cinematic Beat", "Pressure came. Line stayed.", "Makar"],
  ["beat-payoff-clean", "trench-completed", "steady", "Cinematic Beat", "That was not luck. That was placement.", "Rook"],
  ["beat-payoff-breath", "line-held", "steady", "Cinematic Beat", "Everyone gets one breath. Spend it.", "Yara"]
].map(([id, kind, tone, channel, text, speaker]) => ({
  id,
  kind,
  tone,
  channel,
  text,
  weight: 4.65,
  focusTags: ["discipline"],
  allowedSpeakers: [speaker],
  requiredMemoryTag: "beat-payoff"
})) as SquadDialogueTemplateDefinition[];

const aftermathLines: SquadDialogueTemplateDefinition[] = [
  ["beat-aftermath-camp", "camp-damaged", "warning", "Cinematic Beat", "Camp is hurt. Do not dramatize it.", "Rook"],
  ["beat-aftermath-low", "camp-damaged", "warning", "Cinematic Beat", "After the hit, count what still works.", "Yara"],
  ["beat-aftermath-fallback", "fallback-ordered", "warning", "Cinematic Beat", "Fallback is not failure yet.", "Rook"],
  ["beat-aftermath-low-ammo", "ammo-crate-low", "warning", "Cinematic Beat", "Ammo is thin. Talk shorter.", "Makar"],
  ["beat-aftermath-complete", "trench-completed", "steady", "Cinematic Beat", "Now let the line cool.", "Yara"],
  ["beat-aftermath-hold", "line-held", "steady", "Cinematic Beat", "Hold the quiet. It matters.", "Rook"],
  ["beat-aftermath-crate", "ammo-crate-completed", "steady", "Cinematic Beat", "Supply down. Voices down.", "Yara"],
  ["beat-aftermath-read", "camp-damaged", "warning", "Cinematic Beat", "Read the damage before ordering again.", "Rook"]
].map(([id, kind, tone, channel, text, speaker]) => ({
  id,
  kind,
  tone,
  channel,
  text,
  weight: 4.35,
  focusTags: ["discipline"],
  allowedSpeakers: [speaker],
  requiredMemoryTag: "beat-aftermath"
})) as SquadDialogueTemplateDefinition[];

const echoLines: SquadDialogueTemplateDefinition[] = [
  ["beat-echo-road", "builder-exposed", "warning", "Cinematic Beat", "Same place. Different minute. Same danger.", "Yara"],
  ["beat-echo-trench", "trench-completed", "steady", "Cinematic Beat", "The ground remembers our work.", "Rook"],
  ["beat-echo-held", "line-held", "steady", "Cinematic Beat", "Old cover is speaking again.", "Makar"],
  ["beat-echo-builder", "builder-exposed", "critical", "Cinematic Beat", "We have seen this walk before.", "Rook"],
  ["beat-echo-payoff", "line-held", "steady", "Cinematic Beat", "That earlier dirt still matters.", "Yara"],
  ["beat-echo-hard", "builder-exposed", "critical", "Cinematic Beat", "Do not repeat the old mistake.", "Yara"],
  ["beat-echo-map", "trench-completed", "steady", "Cinematic Beat", "Map has a memory now.", "Rook"],
  ["beat-echo-breath", "line-held", "steady", "Cinematic Beat", "This is the echo paying rent.", "Makar"]
].map(([id, kind, tone, channel, text, speaker]) => ({
  id,
  kind,
  tone,
  channel,
  text,
  weight: 4.5,
  focusTags: ["discipline"],
  allowedSpeakers: [speaker],
  requiredMemoryTag: "beat-echo"
})) as SquadDialogueTemplateDefinition[];

export const storyPack = {
  id: "cinematic-beats",
  title: "Cinematic Beats",
  summary: "Beat-aware battlefield lines for setup, complication, cost, payoff, aftermath, reversal, and echo without scripting outcomes.",
  storyTypes: ["setup tension", "complication call", "cost line", "payoff line", "aftermath breath", "echo callback"],
  deliveryNotes: [
    "Use only when the beat director exposes a matching beat tag.",
    "Keep active beat lines short enough for combat.",
    "Never imply a cost or payoff that the triggering event did not create."
  ],
  guardrails: [
    "Do not override specific character memory when relationship or scar lines are more truthful.",
    "Treat pacing as recognition, not authorial control.",
    "Keep the war fictional and grounded."
  ],
  squadTemplates: [...setupLines, ...complicationLines, ...costLines, ...payoffLines, ...aftermathLines, ...echoLines],
  hostileTemplates: [
    {
      id: "beat-hostile-complication",
      kind: "builder-exposed",
      tone: "warning",
      channel: "Enemy Net",
      text: "Their builder is in the open. Hold fire discipline.",
      weight: 3.3,
      tapeId: "green"
    },
    {
      id: "beat-hostile-reversal",
      kind: "ammo-crate-empty",
      tone: "critical",
      channel: "Enemy Net",
      text: "Their line is dry. Push the sound.",
      weight: 3.2,
      tapeId: "yellow"
    },
    {
      id: "beat-hostile-setup-watch",
      kind: "build-order-issued",
      tone: "warning",
      channel: "Enemy Net",
      text: "They marked work. Watch the carrier.",
      weight: 3.05,
      tapeId: "green"
    },
    {
      id: "beat-hostile-payoff-deny",
      kind: "line-held",
      tone: "warning",
      channel: "Enemy Net",
      text: "Their dirt held. Find the edge.",
      weight: 3.15,
      tapeId: "blue"
    },
    {
      id: "beat-hostile-cost-confirm",
      kind: "line-collapsed",
      tone: "critical",
      channel: "Enemy Net",
      text: "Their line broke. Keep it broken.",
      weight: 3.25,
      tapeId: "yellow"
    }
  ]
} satisfies DialogueStoryPack;
