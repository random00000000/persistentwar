import type { DialogueStoryPack } from "../storyPackSchema";

export const storyPack = {
  id: "scarred-town-echoes",
  title: "Scarred Town Echoes",
  summary:
    "Location-scar callbacks for remembered roads, trenches, ammo points, camp hits, and body-cost ground in the first-town war.",
  storyTypes: [
    "remembered road",
    "trench reputation",
    "ammo scar",
    "camp scar",
    "body ground",
    "hostile exploitation"
  ],
  deliveryNotes: [
    "Only fire from tracked location scar tags.",
    "Make the place feel remembered without inventing new casualties.",
    "Keep active scar callbacks short, tactical, and tied to current risk."
  ],
  guardrails: [
    "Do not name a dead soldier unless state supplies the subject.",
    "Do not imply the town is static; scars should show remembered pressure, not fixed scripting.",
    "Keep the fictional modern-war texture grounded and unsentimental."
  ],
  squadTemplates: [
    {
      id: "scar-builder-road-yara",
      kind: "builder-exposed",
      tone: "critical",
      channel: "Scarred Town",
      text: "{addressee}, this road already took a builder's nerve.",
      weight: 6.2,
      focusTags: ["body"],
      allowedSpeakers: ["Yara"],
      requiredMemoryTag: "builder-hit-here"
    },
    {
      id: "scar-builder-road-rook",
      kind: "builder-exposed",
      tone: "critical",
      channel: "Scarred Town",
      text: "{addressee}, same ground. Cover it before it writes us twice.",
      weight: 6,
      focusTags: ["discipline", "body"],
      allowedSpeakers: ["Rook"],
      requiredMemoryTag: "builder-hit-here"
    },
    {
      id: "scar-trench-held-rook",
      kind: "line-held",
      tone: "steady",
      channel: "Scarred Town",
      text: "{addressee}, this trench has held before. Keep feeding it.",
      weight: 5.8,
      focusTags: ["discipline"],
      allowedSpeakers: ["Rook"],
      requiredMemoryTag: "trench-saved-line"
    },
    {
      id: "scar-trench-complete-makar",
      kind: "trench-completed",
      tone: "steady",
      channel: "Scarred Town",
      text: "{addressee}, good dirt again. This lane remembers cover.",
      weight: 5.75,
      focusTags: ["noise", "discipline"],
      allowedSpeakers: ["Makar"],
      requiredMemoryTag: "trench-saved-line"
    },
    {
      id: "scar-trench-overrun-yara",
      kind: "line-collapsed",
      tone: "critical",
      channel: "Scarred Town",
      text: "{addressee}, this is where the line learned to fold.",
      weight: 6,
      focusTags: ["body"],
      allowedSpeakers: ["Yara"],
      requiredMemoryTag: "trench-overrun"
    },
    {
      id: "scar-ammo-dry-rook",
      kind: "ammo-crate-empty",
      tone: "critical",
      channel: "Scarred Town",
      text: "{addressee}, same dry point. Move rounds or move people.",
      weight: 6.05,
      focusTags: ["discipline"],
      allowedSpeakers: ["Rook"],
      requiredMemoryTag: "ammo-ran-dry"
    },
    {
      id: "scar-camp-shelled-rook",
      kind: "camp-damaged",
      tone: "critical",
      channel: "Scarred Town",
      text: "{addressee}, camp has a bruise here already.",
      weight: 5.9,
      focusTags: ["discipline"],
      allowedSpeakers: ["Rook"],
      requiredMemoryTag: "camp-shelled"
    },
    {
      id: "scar-last-stand-yara",
      kind: "camp-destroyed",
      tone: "critical",
      channel: "Scarred Town",
      text: "{addressee}, this becomes a name people lower their voices around.",
      weight: 6.1,
      focusTags: ["body"],
      allowedSpeakers: ["Yara"],
      requiredMemoryTag: "last-stand"
    },
    {
      id: "scar-body-ground-yara",
      kind: "bad-order-cost",
      tone: "critical",
      channel: "Scarred Town",
      text: "{addressee}, ground like this keeps the count.",
      weight: 5.95,
      focusTags: ["body"],
      allowedSpeakers: ["Yara"],
      requiredMemoryTag: "body-left-here"
    }
  ],
  hostileTemplates: [
    {
      id: "scar-hostile-builder-road",
      kind: "builder-exposed",
      tone: "warning",
      channel: "Enemy Net",
      text: "They use the same bad road. Mark it.",
      weight: 3.2,
      tapeId: "green"
    },
    {
      id: "scar-hostile-ammo-dry",
      kind: "ammo-crate-empty",
      tone: "critical",
      channel: "Enemy Net",
      text: "That point ran dry before. Push it.",
      weight: 3.1,
      tapeId: "yellow"
    }
  ]
} satisfies DialogueStoryPack;
