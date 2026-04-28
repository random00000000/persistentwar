import * as Phaser from "phaser";
import { FRONTLINE_SUPPORT_ORDERS } from "./simulation";

export interface RaidControlEntry {
  keyLabel: string;
  action: string;
  detail: string;
}

export interface RaidControlGroup {
  title: string;
  kicker: string;
  entries: RaidControlEntry[];
}

export interface BriefingControlStrip {
  keyLabel: string;
  action: string;
}

export const RAID_MOVEMENT_KEY_CODES = {
  up: Phaser.Input.Keyboard.KeyCodes.W,
  down: Phaser.Input.Keyboard.KeyCodes.S,
  left: Phaser.Input.Keyboard.KeyCodes.A,
  right: Phaser.Input.Keyboard.KeyCodes.D
} as const;

export const RAID_ACTION_KEY_CODES = {
  brace: Phaser.Input.Keyboard.KeyCodes.SHIFT,
  reload: Phaser.Input.Keyboard.KeyCodes.R,
  grenade: Phaser.Input.Keyboard.KeyCodes.G,
  interact: Phaser.Input.Keyboard.KeyCodes.E,
  heal: Phaser.Input.Keyboard.KeyCodes.F,
  swapWeapon: Phaser.Input.Keyboard.KeyCodes.Q
} as const;

export const RAID_SUPPORT_ORDER_KEY_CODES = {
  shiftFire: Phaser.Input.Keyboard.KeyCodes.Z,
  holdPosition: Phaser.Input.Keyboard.KeyCodes.B,
  dropAmmoCrate: Phaser.Input.Keyboard.KeyCodes.N,
} as const;

export const RAID_SQUAD_SELECTION_KEY_CODES = {
  first: Phaser.Input.Keyboard.KeyCodes.EIGHT,
  second: Phaser.Input.Keyboard.KeyCodes.NINE,
  third: Phaser.Input.Keyboard.KeyCodes.ZERO
} as const;

export const RAID_SQUAD_COMMAND_KEY_CODES = {
  follow: Phaser.Input.Keyboard.KeyCodes.C,
  defend: Phaser.Input.Keyboard.KeyCodes.X,
  attack: Phaser.Input.Keyboard.KeyCodes.V
} as const;

export const BRIEFING_NAV_KEY_LABELS = {
  close: "Esc",
  deploy: "Enter",
  next: "Right Arrow / Space",
  previous: "Left Arrow"
} as const;

export const HUD_UTILITY_KEY_LABELS = {
  tacticalDrawer: "Tab"
} as const;

export const STASH_UTILITY_KEY_LABELS = {
  rotate: "R",
  paperdollFocus: "Enter / Space"
} as const;

export const RAID_CONTROL_GROUPS: RaidControlGroup[] = [
  {
    title: "Move And Aim",
    kicker: "Operator Hands",
    entries: [
      {
        keyLabel: "WASD",
        action: "Move",
        detail: "Walk the lane and hold clean spacing."
      },
      {
        keyLabel: "Mouse",
        action: "Aim",
        detail: "Track the next angle before the pocket snaps loud."
      },
      {
        keyLabel: "Left Click",
        action: "Fire",
        detail: "Commit shots only when the line is worth heating up."
      },
      {
        keyLabel: "Right Click / Shift",
        action: "Brace",
        detail: "Steady aim for cleaner peeks and bursts."
      }
    ]
  },
  {
    title: "Fight And Survive",
    kicker: "Hands-On Verbs",
    entries: [
      {
        keyLabel: "R",
        action: "Reload",
        detail: "Top off before the next shove or extract hold."
      },
      {
        keyLabel: "Q",
        action: "Swap Long Gun",
        detail: "Swap between the sling weapon and the long gun staged on your back."
      },
      {
        keyLabel: "G",
        action: "Throw Frag",
        detail: "Flush cover or break trench pressure."
      },
      {
        keyLabel: "Alt + G",
        action: "Boy Frag At Cursor",
        detail: "Send the selected boy to throw a frag through the shared grenade runtime."
      },
      {
        keyLabel: "Alt + RMB",
        action: "Boy Brace Lane",
        detail: "Plant the selected boy and have him watch a sector with a modest braced edge."
      },
      {
        keyLabel: "Ctrl + RMB",
        action: "Boy Covering Move",
        detail: "Keep the selected boy moving while he puts controlled covering fire onto the chosen lane."
      },
      {
        keyLabel: "Alt + LMB / Alt + V",
        action: "Boy Quick Suppress",
        detail: "Stop the selected boy in place and hose the lane toward the cursor with a shorter suppress window."
      },
      {
        keyLabel: "Ctrl + LMB",
        action: "Boy Commit Suppress",
        detail: "Make the selected boy dump a longer, sloppier last-resort suppress lane without aiming much."
      },
      {
        keyLabel: "E",
        action: "Interact",
        detail: "Search, loot, recover, breach, return grenades, or start exfil."
      },
      {
        keyLabel: "F",
        action: "Use Medkit",
        detail: "Patch up before damage turns into a failed extract."
      }
    ]
  },
  {
    title: "Command The Boys",
    kicker: "Boys Net",
    entries: [
      {
        keyLabel: FRONTLINE_SUPPORT_ORDERS["shift-fire"].hotkey,
        action: FRONTLINE_SUPPORT_ORDERS["shift-fire"].title,
        detail: FRONTLINE_SUPPORT_ORDERS["shift-fire"].effectSummary
      },
      {
        keyLabel: FRONTLINE_SUPPORT_ORDERS["hold-position"].hotkey,
        action: FRONTLINE_SUPPORT_ORDERS["hold-position"].title,
        detail: FRONTLINE_SUPPORT_ORDERS["hold-position"].effectSummary
      },
      {
        keyLabel: FRONTLINE_SUPPORT_ORDERS["drop-ammo-crate"].hotkey,
        action: FRONTLINE_SUPPORT_ORDERS["drop-ammo-crate"].title,
        detail: FRONTLINE_SUPPORT_ORDERS["drop-ammo-crate"].effectSummary
      }
    ]
  },
  {
    title: "Direct Boy Orders",
    kicker: "One Boy",
    entries: [
      {
        keyLabel: "8 / 9 / 0",
        action: "Select Live Boy",
        detail: "Pick which live boy gets the next direct order."
      },
      {
        keyLabel: "C",
        action: "Follow",
        detail: "Pull the selected boy back onto your shoulder."
      },
      {
        keyLabel: "X",
        action: "Defend At Cursor",
        detail: "Send the selected boy to hold the cursor pocket."
      },
      {
        keyLabel: "V",
        action: "Attack",
        detail: "Push the selected boy aggressively into the next finish."
      },
      {
        keyLabel: "Alt + RMB",
        action: "Brace Lane",
        detail: "Plant the selected boy and pre-aim one sector for faster, cleaner lane punishment."
      },
      {
        keyLabel: "Ctrl + RMB",
        action: "Covering Move",
        detail: "Keep the selected boy moving while he lays controlled suppression onto one chosen lane."
      },
      {
        keyLabel: "Alt + LMB / Alt + V",
        action: "Quick Suppress",
        detail: "Queue a planted directional suppress on the selected boy without replacing his base order."
      },
      {
        keyLabel: "Ctrl + LMB",
        action: "Commit Suppress",
        detail: "Queue a louder, longer suppress action that trades precision for lane denial."
      },
      {
        keyLabel: "Alt + G",
        action: "Frag Cursor",
        detail: "Queue a reusable tactical action on the selected boy without replacing his base order."
      }
    ]
  },
  {
    title: "Read And Prep",
    kicker: "Utility",
    entries: [
      {
        keyLabel: HUD_UTILITY_KEY_LABELS.tacticalDrawer,
        action: "Toggle Tac Map",
        detail: "Open the route map, noise read, and squad traffic drawer."
      },
      {
        keyLabel: `${BRIEFING_NAV_KEY_LABELS.previous} / ${BRIEFING_NAV_KEY_LABELS.next}`,
        action: "Read Briefing",
        detail: "Step backward or forward through the mission beats."
      },
      {
        keyLabel: `${BRIEFING_NAV_KEY_LABELS.deploy} / ${BRIEFING_NAV_KEY_LABELS.close}`,
        action: "Deploy Or Cancel",
        detail: "Launch the raid or back out to stash prep."
      },
      {
        keyLabel: `${STASH_UTILITY_KEY_LABELS.rotate} / ${STASH_UTILITY_KEY_LABELS.paperdollFocus}`,
        action: "Stash Shortcuts",
        detail: "Rotate a selected rack item or activate a focused paperdoll slot."
      }
    ]
  }
];

export const BRIEFING_CONTROL_STRIPS: RaidControlGroup[] = [
  {
    title: "Move / Fight",
    kicker: "Core",
    entries: [
      { keyLabel: "WASD", action: "Move", detail: "" },
      { keyLabel: "Mouse", action: "Aim", detail: "" },
      { keyLabel: "LMB / RMB", action: "Fire / Brace", detail: "" },
      { keyLabel: "R / G / E / F", action: "Reload / Frag / Use / Heal", detail: "" }
    ]
  },
  {
    title: "Boys",
    kicker: "Orders",
    entries: [
      { keyLabel: "Z / B", action: "Cover / Hold", detail: "" },
      { keyLabel: "8 / 9 / 0", action: "Select Boy", detail: "" },
      { keyLabel: "C / X / V", action: "Follow / Defend / Attack", detail: "" },
      { keyLabel: "Alt + RMB / Ctrl + RMB", action: "Brace / Covering Move", detail: "" },
      { keyLabel: "Alt + LMB / Alt + V", action: "Quick Suppress", detail: "" },
      { keyLabel: "Ctrl + LMB", action: "Commit Suppress", detail: "" },
      { keyLabel: "Alt + G", action: "Frag Cursor", detail: "" },
      { keyLabel: "Cursor", action: "Direct Tactical Target", detail: "" }
    ]
  },
  {
    title: "Utility",
    kicker: "Briefing",
    entries: [
      { keyLabel: "Tab", action: "Tac Map", detail: "" },
      { keyLabel: "Arrows / Space", action: "Read Beats", detail: "" },
      { keyLabel: "Enter / Esc", action: "Deploy / Back", detail: "" },
      { keyLabel: "Stash: R / Enter", action: "Rotate / Slot", detail: "" }
    ]
  }
];
