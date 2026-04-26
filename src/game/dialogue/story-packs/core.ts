import type { DialogueStoryPack } from "../storyPackSchema";

export const storyPack = {
  id: "core-frontline-stories",
  title: "Core Frontline Stories",
  summary: "Baseline RimWorld-style squad and hostile story fragments for contact, recovery, claims, civilians, bunker calm, and extract pressure.",
  storyTypes: [
    "contact pressure",
    "loot greed",
    "body recovery",
    "civilian escort",
    "sector claim",
    "extract panic",
    "hostile lane chatter"
  ],
  deliveryNotes: [
    "Keep lines short and battlefield-readable.",
    "Favor implication over explanation.",
    "Let memory callbacks appear as sharp echoes, not speeches."
  ],
  guardrails: [
    "Stay inside the fictional Blue/Green/Yellow frame.",
    "Avoid documentary imitation and real-world slogan mimicry.",
    "Prefer player-readable stakes over lore."
  ],
  voiceProfiles: {
    Rook: {
      focusBias: ["discipline", "body"],
      stressStyle: "sharper"
    },
    Makar: {
      focusBias: ["noise", "greed"],
      stressStyle: "louder"
    },
    Yara: {
      focusBias: ["body", "discipline"],
      stressStyle: "colder"
    }
  },
  squadTemplates: [
    {
      id: "advance-rook",
      kind: "advance",
      tone: "steady",
      channel: "Quiet Walk",
      text: "{addressee}, quiet feet. I do not like this calm.",
      weight: 1,
      focusTags: ["discipline"],
      allowedSpeakers: ["Rook"]
    },
    {
      id: "advance-memory-yara",
      kind: "advance",
      tone: "steady",
      channel: "Quiet Walk",
      text: "{addressee}, same road where we lost {memoryMate}. Walk softer.",
      weight: 2.6,
      focusTags: ["body", "discipline"],
      allowedSpeakers: ["Yara", "Rook"],
      requiredMemoryTag: "mate-left-behind"
    },
    {
      id: "advance-sector-held",
      kind: "advance",
      tone: "steady",
      channel: "Quiet Walk",
      text: "{addressee}, {memoryMate} held this once. Do not shame him.",
      weight: 2.1,
      focusTags: ["discipline"],
      allowedSpeakers: ["Rook"],
      requiredMemoryTag: "sector-held"
    },
    {
      id: "advance-sector-lost",
      kind: "advance",
      tone: "steady",
      channel: "Quiet Walk",
      text: "{addressee}, {memoryMate} slipped here once. Not twice.",
      weight: 2.2,
      focusTags: ["discipline", "body"],
      allowedSpeakers: ["Rook", "Yara"],
      requiredMemoryTag: "sector-lost"
    },
    {
      id: "contact-rook",
      kind: "contact",
      tone: "warning",
      channel: "Contact",
      text: "{addressee}, eyes up. {enemyTape} wants us dead.",
      weight: 1.4,
      focusTags: ["discipline"],
      allowedSpeakers: ["Rook"]
    },
    {
      id: "contact-makar",
      kind: "contact",
      tone: "warning",
      channel: "Contact",
      text: "{addressee}, there. I will make them look at me.",
      weight: 1.2,
      focusTags: ["noise"],
      allowedSpeakers: ["Makar"]
    },
    {
      id: "contact-yara",
      kind: "contact",
      tone: "warning",
      channel: "Contact",
      text: "{addressee}, contact. I need you breathing.",
      weight: 1.05,
      focusTags: ["body"],
      allowedSpeakers: ["Yara"]
    },
    {
      id: "contact-memory-rook",
      kind: "contact",
      tone: "warning",
      channel: "Memory",
      text: "{addressee}, this lane took {memoryMate}. Not you too.",
      weight: 2.8,
      focusTags: ["discipline", "body"],
      allowedSpeakers: ["Rook", "Yara"],
      requiredMemoryTag: "mate-left-behind"
    },
    {
      id: "mate-down-rook",
      kind: "mate-down",
      tone: "critical",
      channel: "Loss",
      text: "{addressee}, {focus} is down. Stay with me.",
      weight: 2.9,
      focusTags: ["discipline", "body"],
      allowedSpeakers: ["Rook"]
    },
    {
      id: "mate-down-rook-makar",
      kind: "mate-down",
      tone: "critical",
      channel: "Loss",
      text: "{addressee}, Makar is down. Move or he died for nothing.",
      weight: 3.4,
      focusTags: ["discipline", "body"],
      allowedSpeakers: ["Rook"],
      requiredSubjectName: "Makar"
    },
    {
      id: "mate-down-rook-yara",
      kind: "mate-down",
      tone: "critical",
      channel: "Loss",
      text: "{addressee}, Yara is down. Keep your head. We still get her.",
      weight: 3.5,
      focusTags: ["discipline", "body"],
      allowedSpeakers: ["Rook"],
      requiredSubjectName: "Yara"
    },
    {
      id: "mate-down-yara",
      kind: "mate-down",
      tone: "critical",
      channel: "Loss",
      text: "{addressee}, {focus} is hit. Do not you dare stop.",
      weight: 3,
      focusTags: ["body"],
      allowedSpeakers: ["Yara"]
    },
    {
      id: "mate-down-yara-rook",
      kind: "mate-down",
      tone: "critical",
      channel: "Loss",
      text: "{addressee}, Rook is down. You breathe and I will hate later.",
      weight: 3.55,
      focusTags: ["body", "discipline"],
      allowedSpeakers: ["Yara"],
      requiredSubjectName: "Rook"
    },
    {
      id: "mate-down-yara-makar",
      kind: "mate-down",
      tone: "critical",
      channel: "Loss",
      text: "{addressee}, Makar is down. I need you mean, not dead.",
      weight: 3.3,
      focusTags: ["body"],
      allowedSpeakers: ["Yara"],
      requiredSubjectName: "Makar"
    },
    {
      id: "mate-down-makar",
      kind: "mate-down",
      tone: "critical",
      channel: "Loss",
      text: "{addressee}, {focus} dropped. I am killing for him.",
      weight: 2.7,
      focusTags: ["noise", "body"],
      allowedSpeakers: ["Makar"]
    },
    {
      id: "mate-down-makar-rook",
      kind: "mate-down",
      tone: "critical",
      channel: "Loss",
      text: "{addressee}, Rook is down. I have the lane. Get him.",
      weight: 3.45,
      focusTags: ["noise", "body"],
      allowedSpeakers: ["Makar"],
      requiredSubjectName: "Rook"
    },
    {
      id: "mate-down-makar-yara",
      kind: "mate-down",
      tone: "critical",
      channel: "Loss",
      text: "{addressee}, Yara is down. Nobody dies before I pay that back.",
      weight: 3.35,
      focusTags: ["noise", "body"],
      allowedSpeakers: ["Makar"],
      requiredSubjectName: "Yara"
    },
    {
      id: "body-sighted-rook",
      kind: "body-sighted",
      tone: "warning",
      channel: "Memory",
      text: "{addressee}, there. {focus} is still waiting on us.",
      weight: 2.4,
      focusTags: ["discipline", "body"],
      allowedSpeakers: ["Rook"]
    },
    {
      id: "body-sighted-rook-makar",
      kind: "body-sighted",
      tone: "warning",
      channel: "Memory",
      text: "{addressee}, there is Makar. He waited long enough.",
      weight: 3.1,
      focusTags: ["discipline", "body"],
      allowedSpeakers: ["Rook"],
      requiredSubjectName: "Makar"
    },
    {
      id: "body-sighted-rook-yara",
      kind: "body-sighted",
      tone: "warning",
      channel: "Memory",
      text: "{addressee}, Yara is there. We do not walk past her.",
      weight: 3.15,
      focusTags: ["discipline", "body"],
      allowedSpeakers: ["Rook"],
      requiredSubjectName: "Yara"
    },
    {
      id: "body-sighted-yara",
      kind: "body-sighted",
      tone: "warning",
      channel: "Memory",
      text: "{addressee}, I found {focus}. We are not leaving him twice.",
      weight: 2.8,
      focusTags: ["body"],
      allowedSpeakers: ["Yara"]
    },
    {
      id: "body-sighted-yara-rook",
      kind: "body-sighted",
      tone: "warning",
      channel: "Memory",
      text: "{addressee}, I found Rook. Pick your rage later.",
      weight: 3.2,
      focusTags: ["body", "discipline"],
      allowedSpeakers: ["Yara"],
      requiredSubjectName: "Rook"
    },
    {
      id: "body-sighted-yara-makar",
      kind: "body-sighted",
      tone: "warning",
      channel: "Memory",
      text: "{addressee}, Makar is here. Loudmouth still made it this far.",
      weight: 3.05,
      focusTags: ["body"],
      allowedSpeakers: ["Yara"],
      requiredSubjectName: "Makar"
    },
    {
      id: "body-sighted-makar",
      kind: "body-sighted",
      tone: "warning",
      channel: "Memory",
      text: "{addressee}, I see {focus}. Buy me the lane.",
      weight: 2.35,
      focusTags: ["noise", "body"],
      allowedSpeakers: ["Makar"]
    },
    {
      id: "body-sighted-makar-rook",
      kind: "body-sighted",
      tone: "warning",
      channel: "Memory",
      text: "{addressee}, Rook is there. Buy me ten seconds.",
      weight: 3.1,
      focusTags: ["noise", "body"],
      allowedSpeakers: ["Makar"],
      requiredSubjectName: "Rook"
    },
    {
      id: "body-sighted-makar-yara",
      kind: "body-sighted",
      tone: "warning",
      channel: "Memory",
      text: "{addressee}, I found Yara. Keep them off me.",
      weight: 3.05,
      focusTags: ["noise", "body"],
      allowedSpeakers: ["Makar"],
      requiredSubjectName: "Yara"
    },
    {
      id: "loot-makar",
      kind: "loot",
      tone: "warning",
      channel: "Loot Fever",
      text: "{addressee}, that haul is talking dirty. Ignore it.",
      weight: 1.4,
      focusTags: ["greed"],
      allowedSpeakers: ["Makar"]
    },
    {
      id: "loot-yara",
      kind: "loot",
      tone: "warning",
      channel: "Loot Fever",
      text: "{addressee}, fast hands or we leave it. No scrap is worth you.",
      weight: 1.25,
      focusTags: ["body", "greed"],
      allowedSpeakers: ["Yara"]
    },
    {
      id: "loot-rook",
      kind: "loot",
      tone: "warning",
      channel: "Loot Fever",
      text: "{addressee}, earn it first. Then touch it.",
      weight: 1.15,
      focusTags: ["discipline", "greed"],
      allowedSpeakers: ["Rook"]
    },
    {
      id: "intel-rook",
      kind: "intel",
      tone: "warning",
      channel: "Intel Touch",
      text: "{addressee}, pull the file. I will hold the ugly part.",
      weight: 1.8,
      focusTags: ["discipline"],
      allowedSpeakers: ["Rook"]
    },
    {
      id: "intel-makar",
      kind: "intel",
      tone: "warning",
      channel: "Intel Touch",
      text: "{addressee}, pull it. I will keep them stupid.",
      weight: 1.45,
      focusTags: ["noise"],
      allowedSpeakers: ["Makar"]
    },
    {
      id: "coffee-yara",
      kind: "coffee",
      tone: "steady",
      channel: "Warm Hands",
      text: "{addressee}, drink. Your hands are shaking.",
      weight: 1.6,
      focusTags: ["body", "discipline"],
      allowedSpeakers: ["Yara"]
    },
    {
      id: "coffee-rook",
      kind: "coffee",
      tone: "steady",
      channel: "Warm Hands",
      text: "{addressee}, take the calm. We will need it.",
      weight: 1.35,
      focusTags: ["discipline"],
      allowedSpeakers: ["Rook"]
    },
    {
      id: "civilian-yara",
      kind: "civilian",
      tone: "warning",
      channel: "Civilians",
      text: "{addressee}, family in the lane. Gentle hands.",
      weight: 2.2,
      focusTags: ["body", "discipline"],
      allowedSpeakers: ["Yara"]
    },
    {
      id: "civilian-rook",
      kind: "civilian",
      tone: "warning",
      channel: "Civilians",
      text: "{addressee}, walk them out. Nobody scares that kid.",
      weight: 1.7,
      focusTags: ["discipline"],
      allowedSpeakers: ["Rook"]
    },
    {
      id: "body-recovery-rook",
      kind: "body-recovery",
      tone: "warning",
      channel: "Recovery",
      text: "{addressee}, bag him. He is not staying here.",
      weight: 2.4,
      focusTags: ["body", "discipline"],
      allowedSpeakers: ["Rook"]
    },
    {
      id: "body-recovery-makar",
      kind: "body-recovery",
      tone: "warning",
      channel: "Recovery",
      text: "{addressee}, pull him. I will scream at the world.",
      weight: 2.1,
      focusTags: ["body", "noise"],
      allowedSpeakers: ["Makar"]
    },
    {
      id: "body-recovery-yara",
      kind: "body-recovery",
      tone: "warning",
      channel: "Recovery",
      text: "{addressee}, lift with me. He goes home.",
      weight: 2.7,
      focusTags: ["body"],
      allowedSpeakers: ["Yara"]
    },
    {
      id: "surrender-rook",
      kind: "surrender",
      tone: "warning",
      channel: "Surrender",
      text: "{addressee}, muzzles up. Fear bites back.",
      weight: 2.2,
      focusTags: ["discipline"],
      allowedSpeakers: ["Rook"]
    },
    {
      id: "surrender-makar",
      kind: "surrender",
      tone: "warning",
      channel: "Surrender",
      text: "{addressee}, keep him honest. I do not trust shaking hands.",
      weight: 1.9,
      focusTags: ["noise"],
      allowedSpeakers: ["Makar"]
    },
    {
      id: "claim-breaking-rook",
      kind: "claim-breaking",
      tone: "warning",
      channel: "Flag Team",
      text: "{addressee}, plant it. I want this place saying our names.",
      weight: 2,
      focusTags: ["discipline"],
      allowedSpeakers: ["Rook"]
    },
    {
      id: "claim-held-rook",
      kind: "claim-held",
      tone: "warning",
      channel: "Claim Hold",
      text: "{addressee}, flag is up. Make them choke on it.",
      weight: 1.85,
      focusTags: ["discipline"],
      allowedSpeakers: ["Rook"]
    },
    {
      id: "claim-held-memory",
      kind: "claim-held",
      tone: "warning",
      channel: "Memory",
      text: "{addressee}, we held. Better than the day {memoryMate} died.",
      weight: 2.6,
      focusTags: ["discipline", "body"],
      allowedSpeakers: ["Rook", "Yara"],
      requiredMemoryTag: "mate-left-behind"
    },
    {
      id: "claim-loss-yara",
      kind: "claim-loss",
      tone: "warning",
      channel: "Body Recovery",
      text: "{addressee}, this ground remembers us. Bring our people home.",
      weight: 2.15,
      focusTags: ["body"],
      allowedSpeakers: ["Yara"]
    },
    {
      id: "claim-loss-rook",
      kind: "claim-loss",
      tone: "warning",
      channel: "Body Recovery",
      text: "{addressee}, dead strip. Grief is not cover.",
      weight: 2,
      focusTags: ["discipline", "body"],
      allowedSpeakers: ["Rook"]
    },
    {
      id: "extract-open-rook",
      kind: "extract-open",
      tone: "extract",
      channel: "Extract Live",
      text: "{addressee}, ring is open. Come home rich, not dead.",
      weight: 1.6,
      focusTags: ["discipline"],
      allowedSpeakers: ["Rook"]
    },
    {
      id: "extract-open-memory",
      kind: "extract-open",
      tone: "extract",
      channel: "Memory",
      text: "{addressee}, pull is live. Do not waste what {memoryMate} bought us.",
      weight: 2.4,
      focusTags: ["body", "discipline"],
      allowedSpeakers: ["Yara", "Rook"],
      requiredMemoryTag: "mate-left-behind"
    },
    {
      id: "extract-open-barely-made",
      kind: "extract-open",
      tone: "extract",
      channel: "Memory",
      text: "{addressee}, we nearly died here once. No drama. Just leave.",
      weight: 2.2,
      focusTags: ["discipline", "body"],
      allowedSpeakers: ["Rook", "Yara"],
      requiredMemoryTag: "extract-barely-made"
    },
    {
      id: "extract-hot-makar",
      kind: "extract-hot",
      tone: "critical",
      channel: "Hot Extract",
      text: "{addressee}, ring is burning. Stay on me.",
      weight: 2.2,
      focusTags: ["noise", "greed"],
      allowedSpeakers: ["Makar"]
    },
    {
      id: "extract-hot-yara",
      kind: "extract-hot",
      tone: "extract",
      channel: "Hot Extract",
      text: "{addressee}, it is folding. Nobody dies on the doorstep.",
      weight: 2,
      focusTags: ["body"],
      allowedSpeakers: ["Yara"]
    },
    {
      id: "extract-hot-memory-yara",
      kind: "extract-hot",
      tone: "critical",
      channel: "Memory",
      text: "{addressee}, not again. I still see {memoryMate}.",
      weight: 3.1,
      focusTags: ["body", "discipline"],
      allowedSpeakers: ["Yara", "Rook"],
      requiredMemoryTag: "mate-left-behind"
    }
  ],
  hostileTemplates: [
    {
      id: "hostile-advance-blue",
      kind: "advance",
      tone: "steady",
      channel: "Blue Net",
      text: "Left gun, hold. Let them walk into it.",
      weight: 1.3,
      tapeId: "blue"
    },
    {
      id: "hostile-advance-green",
      kind: "advance",
      tone: "steady",
      channel: "Green Net",
      text: "Second angle, wait. Let them believe it.",
      weight: 1.4,
      tapeId: "green"
    },
    {
      id: "hostile-advance-yellow",
      kind: "advance",
      tone: "steady",
      channel: "Volunteer Net",
      text: "Do not blink. Greed will bring them in.",
      weight: 1.45,
      tapeId: "yellow"
    },
    {
      id: "hostile-contact-blue",
      kind: "contact",
      tone: "warning",
      channel: "Blue Net",
      text: "Contact. Hold the lane. Do not panic.",
      weight: 1.7,
      tapeId: "blue"
    },
    {
      id: "hostile-contact-green",
      kind: "contact",
      tone: "warning",
      channel: "Green Net",
      text: "They are in. Back room, kill the second man.",
      weight: 1.8,
      tapeId: "green"
    },
    {
      id: "hostile-contact-yellow",
      kind: "contact",
      tone: "warning",
      channel: "Volunteer Net",
      text: "Eyes up. Make the first peek hurt.",
      weight: 1.85,
      tapeId: "yellow"
    },
    {
      id: "hostile-surrender-blue",
      kind: "surrender",
      tone: "critical",
      channel: "Blue Net",
      text: "Do not trust the hands. Hold.",
      weight: 1.9,
      tapeId: "blue"
    },
    {
      id: "hostile-surrender-green",
      kind: "surrender",
      tone: "critical",
      channel: "Green Net",
      text: "Nobody folds. Make them remember this room.",
      weight: 2,
      tapeId: "green"
    },
    {
      id: "hostile-surrender-yellow",
      kind: "surrender",
      tone: "critical",
      channel: "Volunteer Net",
      text: "No mercy. Make them drag bodies.",
      weight: 2.05,
      tapeId: "yellow"
    },
    {
      id: "hostile-civilian-blue",
      kind: "civilian",
      tone: "warning",
      channel: "Blue Net",
      text: "They are moving people. Cut the escort.",
      weight: 1.85,
      tapeId: "blue"
    },
    {
      id: "hostile-civilian-green",
      kind: "civilian",
      tone: "warning",
      channel: "Green Net",
      text: "Kill the screen and the family stops.",
      weight: 1.95,
      tapeId: "green"
    },
    {
      id: "hostile-civilian-yellow",
      kind: "civilian",
      tone: "warning",
      channel: "Volunteer Net",
      text: "Do not let them be heroes today.",
      weight: 1.9,
      tapeId: "yellow"
    },
    {
      id: "hostile-extract-blue",
      kind: "extract",
      tone: "critical",
      channel: "Blue Net",
      text: "Beacon is live. Collapse on it.",
      weight: 2.1,
      tapeId: "blue"
    },
    {
      id: "hostile-extract-green",
      kind: "extract",
      tone: "critical",
      channel: "Green Net",
      text: "Crash now. Do not let them leave smiling.",
      weight: 2.2,
      tapeId: "green"
    },
    {
      id: "hostile-extract-yellow",
      kind: "extract",
      tone: "critical",
      channel: "Volunteer Net",
      text: "Beacon live. Leave them someone to mourn.",
      weight: 2.15,
      tapeId: "yellow"
    }
  ]
} satisfies DialogueStoryPack;
