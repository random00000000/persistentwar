import type { DialogueStoryPack } from "../storyPackSchema";

export const storyPack = {
  id: "deadzone-breaths",
  title: "Deadzone Breaths",
  summary:
    "Quiet-search, bunker calm, civilian shelter, and snap-to-contact fragments that preserve the war's breathing room without muting tactical stakes.",
  storyTypes: ["quiet search", "bunker calm", "civilian shelter", "contact snap", "extract restraint"],
  deliveryNotes: [
    "Let the quiet lines feel like a held breath, not a joke routine.",
    "Use contact lines to show how fast calm can break into danger.",
    "Keep extract restraint lines sharp enough to matter after a rare soft pocket."
  ],
  guardrails: [
    "Preserve the fictional Blue/Green/Yellow frame and avoid documentary mimicry.",
    "Use existing event kinds and memory tags instead of widening dialogue plumbing.",
    "Do not let human-color lines replace route, extract, or pressure readability."
  ],
  squadTemplates: [
    {
      id: "deadzone-breaths-advance-rook",
      kind: "advance",
      tone: "steady",
      channel: "Quiet Search",
      text: "{addressee}, easy now. Quiet ground still kills loud men.",
      weight: 2.4,
      focusTags: ["discipline"],
      allowedSpeakers: ["Rook"]
    },
    {
      id: "deadzone-breaths-advance-yara-civilian",
      kind: "advance",
      tone: "steady",
      channel: "Quiet Search",
      text: "{addressee}, same soft street as that family pull. Keep it soft a little longer.",
      weight: 2.8,
      focusTags: ["body", "discipline"],
      allowedSpeakers: ["Yara", "Rook"],
      requiredMemoryTag: "civilian-saved"
    },
    {
      id: "deadzone-breaths-advance-rook-left-behind",
      kind: "advance",
      tone: "steady",
      channel: "Quiet Search",
      text: "{addressee}, dead ground goes quiet before it asks for another body.",
      weight: 2.95,
      focusTags: ["body", "discipline"],
      allowedSpeakers: ["Rook", "Yara"],
      requiredMemoryTag: "mate-left-behind"
    },
    {
      id: "deadzone-breaths-contact-makar",
      kind: "contact",
      tone: "warning",
      channel: "Contact Snap",
      text: "{addressee}, there it is. Calm is over. Make them choke on the first peek.",
      weight: 2.55,
      focusTags: ["noise", "discipline"],
      allowedSpeakers: ["Makar", "Rook"]
    },
    {
      id: "deadzone-breaths-contact-yara-wake",
      kind: "contact",
      tone: "warning",
      channel: "Contact Snap",
      text: "{addressee}, wake is done. Keep this lane from earning another chair.",
      weight: 3.05,
      focusTags: ["body", "discipline"],
      allowedSpeakers: ["Yara", "Rook"],
      requiredMemoryTag: "wake-held"
    },
    {
      id: "deadzone-breaths-coffee-rook",
      kind: "coffee",
      tone: "steady",
      channel: "Bunker Calm",
      text: "{addressee}, two warm swallows, then back to ugly work.",
      weight: 2.6,
      focusTags: ["discipline"],
      allowedSpeakers: ["Rook", "Makar"]
    },
    {
      id: "deadzone-breaths-coffee-yara-family",
      kind: "coffee",
      tone: "steady",
      channel: "Bunker Calm",
      text: "{addressee}, drink while the phones are quiet. That part never lasts.",
      weight: 2.95,
      focusTags: ["body", "discipline"],
      allowedSpeakers: ["Yara", "Rook"],
      requiredMemoryTag: "family-informed"
    },
    {
      id: "deadzone-breaths-coffee-makar-recovered",
      kind: "coffee",
      tone: "steady",
      channel: "Bunker Calm",
      text: "{addressee}, hot coffee and all our tags home. That is almost luxury.",
      weight: 2.7,
      focusTags: ["noise", "body"],
      allowedSpeakers: ["Makar", "Yara"],
      requiredMemoryTag: "mate-recovered"
    },
    {
      id: "deadzone-breaths-civilian-yara",
      kind: "civilian",
      tone: "warning",
      channel: "Shelter Lane",
      text: "{addressee}, gentle voice, hard screen. The family only sees what we let through.",
      weight: 2.85,
      focusTags: ["body", "discipline"],
      allowedSpeakers: ["Yara"]
    },
    {
      id: "deadzone-breaths-civilian-rook-recovered",
      kind: "civilian",
      tone: "warning",
      channel: "Shelter Lane",
      text: "{addressee}, walk them cleaner than the last body pull. Nobody new joins the wall today.",
      weight: 3.1,
      focusTags: ["body", "discipline"],
      allowedSpeakers: ["Rook", "Yara"],
      requiredMemoryTag: "mate-recovered"
    },
    {
      id: "deadzone-breaths-extract-open-rook",
      kind: "extract-open",
      tone: "extract",
      channel: "Soft Pull",
      text: "{addressee}, ring is kind for once. Take the kindness before the district remembers us.",
      weight: 2.35,
      focusTags: ["discipline", "greed"],
      allowedSpeakers: ["Rook", "Yara"]
    },
    {
      id: "deadzone-breaths-extract-open-civilian-yara",
      kind: "extract-open",
      tone: "extract",
      channel: "Soft Pull",
      text: "{addressee}, same hands that walked them out can leave clean now. Do not turn mercy into greed.",
      weight: 2.9,
      focusTags: ["body", "discipline", "greed"],
      allowedSpeakers: ["Yara", "Rook"],
      requiredMemoryTag: "civilian-saved"
    },
    {
      id: "deadzone-breaths-extract-hot-makar",
      kind: "extract-hot",
      tone: "critical",
      channel: "Doorstep Heat",
      text: "{addressee}, pocket is dead. Smoke, beacon, move. Romantic thoughts in stash.",
      weight: 2.75,
      focusTags: ["noise", "discipline", "greed"],
      allowedSpeakers: ["Makar", "Rook"]
    }
  ],
  hostileTemplates: [
    {
      id: "deadzone-breaths-hostile-advance-blue",
      kind: "advance",
      tone: "steady",
      channel: "Blue Net",
      text: "Quiet lane. Let them make the first mistake.",
      weight: 1.88,
      tapeId: "blue"
    },
    {
      id: "deadzone-breaths-hostile-contact-green",
      kind: "contact",
      tone: "warning",
      channel: "Green Net",
      text: "There. Soft walk is over. Break the front man first.",
      weight: 2.08,
      tapeId: "green"
    },
    {
      id: "deadzone-breaths-hostile-civilian-yellow",
      kind: "civilian",
      tone: "warning",
      channel: "Volunteer Net",
      text: "They are screening people again. Cut the hard men and the soft ones stop moving.",
      weight: 2.02,
      tapeId: "yellow"
    },
    {
      id: "deadzone-breaths-hostile-extract-blue",
      kind: "extract",
      tone: "critical",
      channel: "Blue Net",
      text: "Beacon is gentle now. Hit it before it turns clean.",
      weight: 2.14,
      tapeId: "blue"
    }
  ]
} satisfies DialogueStoryPack;
