# Story Pack Workflow

## Purpose

Make new emergent story families additive.

Future agents should be able to add dialogue content by creating a new story pack file, not by reopening resolver logic in `simulation.ts`.

## Where Story Content Lives

- Runtime loader: `src/game/dialogue/storyPacks.ts`
- Pack schema: `src/game/dialogue/storyPackSchema.ts`
- Pack files: `src/game/dialogue/story-packs/*.ts`
- Current baseline pack: `src/game/dialogue/story-packs/core.ts`

The loader eagerly imports every `.ts` file in `src/game/dialogue/story-packs`, so a new pack is loaded automatically with no registry edit.

## CLI Workflow

List existing packs:

```powershell
npm run game:cli -- story-pack list
```

Scaffold a new pack:

```powershell
npm run game:cli -- story-pack scaffold --id trench-echoes --title "Trench Echoes" --summary "Stories about returning to scarred trench lanes" --story-types "returning to bad ground,old losses,new push courage" --delivery-notes "Keep lines short.|Favor callbacks over exposition." --guardrails "Stay inside the fictional frontline frame.|Do not mimic real-world slogans."
```

That creates a new file under `src/game/dialogue/story-packs/`.

## What A Pack Should Contain

Each pack should define:

- `id`
- `title`
- `summary`
- `storyTypes`
- `deliveryNotes`
- `guardrails`
- optional `voiceProfiles`
- optional `squadTemplates`
- optional `hostileTemplates`

The metadata is for humans and future agents. It states what kind of stories the pack is meant to add, how those stories should feel, and what should be avoided.

## Authoring Rule

When adding a new story family:

1. Decide the story type first.
2. Put that story type in pack metadata.
3. Add only templates that serve that story type.
4. Keep lines short and state-driven.
5. Prefer memory callbacks and implication over explanation.

## Examples Of Good Pack Themes

- trench-return shame and courage
- greedy loot temptation after prior losses
- barely-held extract pride
- bunker reset gallows humor
- civilian escort tension
- sector revenge after a prior collapse

## Guardrails

- Do not put new authored story content back into `simulation.ts`.
- Do not add a pack with placeholder lines and leave it loaded.
- Do not use direct real-world propaganda, slogans, or ideology speeches.
- Keep the RimWorld method: short, event-driven, memory-aware fragments.
