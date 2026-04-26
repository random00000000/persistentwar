import type { DialogueStoryPack } from "../storyPackSchema";

export const storyPack = {
  id: "route-echoes",
  title: "Route Echoes",
  summary:
    "Remembered-route, hard-extract, and quiet-reset story fragments that deepen campaign carryover without widening the dialogue system.",
  storyTypes: [
    "remembered route",
    "scar return",
    "hot extract discipline",
    "civilian carryover",
    "quiet reset"
  ],
  deliveryNotes: [
    "Keep the squad terse when the lane is hot.",
    "Let memory lines hit like a scar flash, not a speech.",
    "Use quieter reset lines only after the route earns a breath."
  ],
  guardrails: [
    "Reuse current memory tags and event kinds before inventing new dialogue plumbing.",
    "Keep the dialogue inside the fictional Blue/Green/Yellow war frame.",
    "Do not let memory chatter replace tactical readability."
  ],
  squadTemplates: [
    {
      id: "route-echoes-advance-left-behind-yara",
      kind: "advance",
      tone: "steady",
      channel: "Route Echo",
      text: "{addressee}, this road already ate {memoryMate}. Count every angle.",
      weight: 2.95,
      focusTags: ["body", "discipline"],
      allowedSpeakers: ["Yara", "Rook"],
      requiredMemoryTag: "mate-left-behind"
    },
    {
      id: "route-echoes-advance-sector-lost-rook",
      kind: "advance",
      tone: "steady",
      channel: "Route Echo",
      text: "{addressee}, dead ground ahead. Win it cleaner this time.",
      weight: 2.7,
      focusTags: ["discipline", "body"],
      allowedSpeakers: ["Rook"],
      requiredMemoryTag: "sector-lost"
    },
    {
      id: "route-echoes-contact-sector-held-rook",
      kind: "contact",
      tone: "warning",
      channel: "Return Fire",
      text: "{addressee}, same hold we kept. Do not gift it back.",
      weight: 2.55,
      focusTags: ["discipline"],
      allowedSpeakers: ["Rook"],
      requiredMemoryTag: "sector-held"
    },
    {
      id: "route-echoes-advance-sector-breaking-yara",
      kind: "advance",
      tone: "steady",
      channel: "Route Echo",
      text: "{addressee}, this settlement is already cracking. Do not walk like it is ours.",
      weight: 2.9,
      focusTags: ["discipline", "body"],
      allowedSpeakers: ["Yara", "Rook"],
      requiredMemoryTag: "sector-breaking"
    },
    {
      id: "route-echoes-contact-sector-reclaiming-rook",
      kind: "contact",
      tone: "warning",
      channel: "Claim Memory",
      text: "{addressee}, same reclaim window. Lock it before the lane remembers Blue.",
      weight: 2.75,
      focusTags: ["discipline"],
      allowedSpeakers: ["Rook", "Makar"],
      requiredMemoryTag: "sector-reclaiming"
    },
    {
      id: "route-echoes-contact-sector-fragile-yara",
      kind: "contact",
      tone: "warning",
      channel: "Claim Memory",
      text: "{addressee}, this hold is thin. Keep the lip breathing before the whole strip remembers them.",
      weight: 2.7,
      focusTags: ["discipline", "body"],
      allowedSpeakers: ["Yara", "Rook"],
      requiredMemoryTag: "sector-fragile"
    },
    {
      id: "route-echoes-contact-left-behind-makar",
      kind: "contact",
      tone: "warning",
      channel: "Return Fire",
      text: "{addressee}, bad lane again. Burn them before it costs another one.",
      weight: 2.8,
      focusTags: ["noise", "body"],
      allowedSpeakers: ["Makar"],
      requiredMemoryTag: "mate-left-behind"
    },
    {
      id: "route-echoes-contact-casualty-corridor-yara",
      kind: "contact",
      tone: "warning",
      channel: "Recovery Echo",
      text: "{addressee}, casualty lane is still open. Win the angle before you count bodies.",
      weight: 2.5,
      focusTags: ["body", "discipline"],
      allowedSpeakers: ["Yara"],
      requiredMemoryTag: "casualty-corridor-open"
    },
    {
      id: "route-echoes-body-sighted-recovered-yara",
      kind: "body-sighted",
      tone: "warning",
      channel: "Recovery Echo",
      text: "{addressee}, not ours this time. Keep it that way.",
      weight: 2.65,
      focusTags: ["body", "discipline"],
      allowedSpeakers: ["Yara"],
      requiredMemoryTag: "mate-recovered"
    },
    {
      id: "route-echoes-body-recovery-recovered-rook",
      kind: "body-recovery",
      tone: "warning",
      channel: "Recovery Echo",
      text: "{addressee}, last pull came home. This one does too.",
      weight: 2.8,
      focusTags: ["body", "discipline"],
      allowedSpeakers: ["Rook", "Yara"],
      requiredMemoryTag: "mate-recovered"
    },
    {
      id: "route-echoes-claim-held-surrender-rook",
      kind: "claim-held",
      tone: "warning",
      channel: "Claim Memory",
      text: "{addressee}, they folded here once. Lean harder.",
      weight: 2.35,
      focusTags: ["discipline"],
      allowedSpeakers: ["Rook", "Makar"],
      requiredMemoryTag: "surrender-taken"
    },
    {
      id: "route-echoes-claim-loss-left-behind-yara",
      kind: "claim-loss",
      tone: "warning",
      channel: "Claim Memory",
      text: "{addressee}, we already paid for this dirt. Take it back or leave clean.",
      weight: 2.95,
      focusTags: ["body", "discipline"],
      allowedSpeakers: ["Yara", "Rook"],
      requiredMemoryTag: "mate-left-behind"
    },
    {
      id: "route-echoes-extract-open-barely-made-rook",
      kind: "extract-open",
      tone: "extract",
      channel: "Extract Echo",
      text: "{addressee}, beacon is live. Last time was luck. This time be disciplined.",
      weight: 2.85,
      focusTags: ["discipline", "body"],
      allowedSpeakers: ["Rook"],
      requiredMemoryTag: "extract-barely-made"
    },
    {
      id: "route-echoes-extract-open-civilian-yara",
      kind: "extract-open",
      tone: "extract",
      channel: "Extract Echo",
      text: "{addressee}, ring is open. Same hands that walked that family out.",
      weight: 2.25,
      focusTags: ["body", "discipline"],
      allowedSpeakers: ["Yara"],
      requiredMemoryTag: "civilian-saved"
    },
    {
      id: "route-echoes-extract-hot-barely-made-yara",
      kind: "extract-hot",
      tone: "critical",
      channel: "Extract Echo",
      text: "{addressee}, this is how barely-made starts. Cut the greed and move.",
      weight: 3.25,
      focusTags: ["body", "discipline"],
      allowedSpeakers: ["Yara", "Rook"],
      requiredMemoryTag: "extract-barely-made"
    },
    {
      id: "route-echoes-extract-hot-sector-breaking-rook",
      kind: "extract-hot",
      tone: "critical",
      channel: "Extract Echo",
      text: "{addressee}, breaking ground behind us. Peel now or this place eats the ring too.",
      weight: 3.1,
      focusTags: ["discipline", "greed"],
      allowedSpeakers: ["Rook", "Yara"],
      requiredMemoryTag: "sector-breaking"
    },
    {
      id: "route-echoes-extract-hot-sector-fragile-makar",
      kind: "extract-hot",
      tone: "critical",
      channel: "Extract Echo",
      text: "{addressee}, fragile hold behind us. Peel before the lip folds and the ring turns ugly.",
      weight: 2.95,
      focusTags: ["discipline", "greed"],
      allowedSpeakers: ["Makar", "Rook"],
      requiredMemoryTag: "sector-fragile"
    },
    {
      id: "route-echoes-extract-hot-makar",
      kind: "extract-hot",
      tone: "critical",
      channel: "Extract Echo",
      text: "{addressee}, no trophy lane. Smoke, bodies, beacon. That is enough.",
      weight: 2.45,
      focusTags: ["noise", "greed", "body"],
      allowedSpeakers: ["Makar"]
    },
    {
      id: "route-echoes-extract-open-convoy-hit-makar",
      kind: "extract-open",
      tone: "extract",
      channel: "Extract Echo",
      text: "{addressee}, convoy lane still remembers the hit. Move before their reserve does.",
      weight: 2.3,
      focusTags: ["noise", "discipline"],
      allowedSpeakers: ["Makar", "Rook"],
      requiredMemoryTag: "convoy-hit"
    },
    {
      id: "route-echoes-coffee-recovered-yara",
      kind: "coffee",
      tone: "steady",
      channel: "Quiet Reset",
      text: "{addressee}, drink while it is warm. We brought one back last time.",
      weight: 2.15,
      focusTags: ["body"],
      allowedSpeakers: ["Yara"],
      requiredMemoryTag: "mate-recovered"
    },
    {
      id: "route-echoes-coffee-civilian-rook",
      kind: "coffee",
      tone: "steady",
      channel: "Quiet Reset",
      text: "{addressee}, warm hands. Nice to save somebody and stay breathing.",
      weight: 1.95,
      focusTags: ["discipline", "body"],
      allowedSpeakers: ["Rook"],
      requiredMemoryTag: "civilian-saved"
    }
  ],
  hostileTemplates: [
    {
      id: "route-echoes-hostile-contact-blue",
      kind: "contact",
      tone: "warning",
      channel: "Blue Net",
      text: "Same lane as before. Break the first man and the rest hesitate.",
      weight: 1.92,
      tapeId: "blue"
    },
    {
      id: "route-echoes-hostile-contact-green",
      kind: "contact",
      tone: "warning",
      channel: "Green Net",
      text: "They came back for the scar. Make them regret memory.",
      weight: 2.02,
      tapeId: "green"
    },
    {
      id: "route-echoes-hostile-advance-yellow",
      kind: "advance",
      tone: "steady",
      channel: "Volunteer Net",
      text: "Quiet now. Let the old ground bait them in.",
      weight: 1.72,
      tapeId: "yellow"
    },
    {
      id: "route-echoes-hostile-extract-blue",
      kind: "extract",
      tone: "critical",
      channel: "Blue Net",
      text: "Beacon again. Crash it before they settle.",
      weight: 2.28,
      tapeId: "blue"
    },
    {
      id: "route-echoes-hostile-extract-green",
      kind: "extract",
      tone: "critical",
      channel: "Green Net",
      text: "Cut the ring. They only remember this place if they bleed.",
      weight: 2.34,
      tapeId: "green"
    }
  ]
} satisfies DialogueStoryPack;
