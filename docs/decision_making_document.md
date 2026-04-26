# Decision Making Document

This file stores active Frontline Officer decisions that should later be reviewed
by the human and translated into new directives.

The inherited extraction-shooter decision history is archived at
`docs/LEGACY_EXTRACTION_DECISIONS.md`. Treat it as historical source material,
not as the active decision queue for this fork.

## Current Decisions

- `Open`: Should the first playable town emphasize one compact infantry fight first, or include early vehicle/tank banking from the start?
  - `Reason`: The user wants protected stash banking for tanks and good guns, but the fastest Foxhole-like slice is likely a small town where two people or two officer decisions can end the match. Starting with infantry, trenches, ammo crates, and camps lowers implementation risk. Pulling vehicles in early may better sell the long-term operation-banking fantasy but could distract from proving soldier autonomy and build-order consequence.
  - `Decision owner`: Human directive needed.

- `Open`: How explicit should Ukraine-war-inspired context be in the first slice?
  - `Reason`: The fork should be grounded in modern drone/trench/logistics/media-war texture because that niche has a real audience, but factions, places, and events should remain fictionalized. The first slice needs enough specificity to feel contemporary without becoming a direct reenactment or political simulator.
  - `Decision owner`: Human directive needed.

- `Open`: Should officer death immediately wipe all tech progress, or first ship as a harsh placeholder penalty?
  - `Reason`: The user wants hardcore personal intervention where death costs tech tree progress. For the first town slice, a placeholder penalty may prove the risk loop quickly while avoiding a premature progression system. A full wipe is emotionally strong but needs careful save and UX support.
  - `Decision owner`: Human directive needed.

- `Open`: Should the first automation runs keep extraction UI terminology visible, or rename it aggressively into operation banking?
  - `Reason`: The extraction menu is still useful because players like grinding and storing protected assets, but the product should no longer read as a raid-first extraction shooter. A hard rename reduces drift; a gradual rename may preserve working systems while the simulation pivots.
  - `Decision owner`: Human directive needed.
