import * as Phaser from "phaser";
import type { ScenicPropDefinition } from "../arena";
import type { EnemyArchetypeId, EnemyTapeId } from "../simulation";
import type { WeaponId } from "../weapons";

type Palette = Record<string, string>;
export type GroundTextureKind =
  | "tarp"
  | "grate"
  | "cables"
  | "oil"
  | "chevrons"
  | "dock-plates"
  | "relay-grid"
  | "freight-ruts"
  | "roof-panels"
  | "roof-hatches"
  | "service-bay"
  | "cargo-bay"
  | "ops-grid"
  | "triage-strips"
  | "signal-pad"
  | "med-bay"
  | "extract-lane";

function paintPattern(
  context: CanvasRenderingContext2D,
  pattern: string[],
  palette: Palette,
  scale: number,
  offsetX = 0,
  offsetY = 0
): void {
  for (let y = 0; y < pattern.length; y += 1) {
    const row = pattern[y];

    for (let x = 0; x < row.length; x += 1) {
      const color = palette[row[x]];

      if (!color) {
        continue;
      }

      context.fillStyle = color;
      context.fillRect(offsetX + x * scale, offsetY + y * scale, scale, scale);
    }
  }
}

function createCanvasTexture(
  scene: Phaser.Scene,
  key: string,
  width: number,
  height: number,
  draw: (context: CanvasRenderingContext2D) => void
): void {
  if (scene.textures.exists(key)) {
    return;
  }

  const texture = scene.textures.createCanvas(key, width, height);
  if (!texture) {
    throw new Error(`Failed to create texture: ${key}`);
  }
  const context = texture.context;
  context.clearRect(0, 0, width, height);
  context.imageSmoothingEnabled = false;
  draw(context);
  texture.refresh();
}

function paintSoftShadow(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  alpha = 0.28
): void {
  context.fillStyle = `rgba(2, 6, 23, ${alpha})`;
  context.beginPath();
  context.ellipse(x, y, width, height, 0, 0, Math.PI * 2);
  context.fill();
}

function paintFactionArmband(context: CanvasRenderingContext2D, color: string): void {
  const width = context.canvas.width;
  const height = context.canvas.height;
  const stripeHeight = Math.max(2, Math.floor(height * 0.09));
  const stripeY = Math.floor(height * 0.43);
  const stripeWidth = Math.max(2, Math.floor(width * 0.16));
  const leftArmBandX = Math.floor(width * 0.16);

  context.fillStyle = color;
  context.fillRect(leftArmBandX, stripeY, stripeWidth, stripeHeight);
  context.fillRect(
    leftArmBandX + Math.floor(stripeWidth * 0.25),
    stripeY + Math.floor(stripeHeight * 1.9),
    stripeWidth - Math.floor(stripeWidth * 0.4),
    stripeHeight
  );
}

function drawOperatorTexture(
  scene: Phaser.Scene,
  key: string,
  pattern: string[],
  palette: Palette,
  shadowWidth: number,
  shadowHeight: number,
  factionArmbandColor?: string
): void {
  createCanvasTexture(scene, key, 48, 48, (context) => {
    paintSoftShadow(context, 24, 38, shadowWidth, shadowHeight, 0.24);
    paintPattern(context, pattern, palette, 2);
    if (factionArmbandColor) {
      paintFactionArmband(context, factionArmbandColor);
    }
  });
}

function drawPlayerTextures(scene: Phaser.Scene): void {
  const basePalette = {
    h: "#202830",
    m: "#465564",
    v: "#7d8b96",
    f: "#aabccc",
    c: "#2f3e4d",
    t: "#0f172a",
    a: "#5d6c78",
    s: "#4b5563",
    g: "#8a9aa6",
    r: "#dbe7ef",
    k: "#43505c",
    y: "#7f8b56",
    b: "#2a3440",
    l: "#111827",
    d: "#0b1120",
    u: "#0f172a",
    x: "#b91c1c"
  } satisfies Palette;

    drawOperatorTexture(
      scene,
      "player-none",
    [
      "........................",
      ".........hhhhhh.........",
      ".......hhmmmmmmhh.......",
      "......hhmvvvvvmmhh......",
      "......hmvvffffvvmh......",
      "......hmvfffffffvmh.....",
      "......hhmffffffmhh......",
      ".......ccccttttccc......",
      "......ccccaattaccc......",
      ".....cccssasssasscc.....",
      ".....ccsaggrrggasxc.....",
      "....cccsagrrrrrgaxcc....",
      "....cccsaarrrrraascc....",
      "....ccccaakkkkaaccc.....",
      ".....cccaakyykaaccc.....",
      ".....cccaakyykaaccc.....",
      ".....cccakkbbkkaccc.....",
      "......ccakbbbbkacc......",
      "......llkbb..bbkll......",
      ".....lllbb....bblll.....",
      ".....dllb......blld.....",
      ".....ddlb......bldd.....",
      "......dd........dd......",
      "........................"
    ],
    {
      ...basePalette,
      c: "#334155",
      r: "#cbd5e1",
      u: "#0b1120"
    },
    12,
    6,
    "#ef4444"
  );

    drawOperatorTexture(
      scene,
      "player-knife",
    [
      "........................",
      ".........hhhhhh.........",
      ".......hhmmmmmmhh.......",
      "......hhmvvvvvmmhh......",
      "......hmvvffffvvmh......",
      "......hmvfffffffvmh.....",
      "......hhmffffffmhh......",
      ".......ccccttttcccu.....",
      "......ccccaattaccccu....",
      ".....cccssasssassccru...",
      ".....ccsaggrrggasxcru...",
      "....cccsagrrrrrgaxcru...",
      "....cccsaarrrrraascc....",
      "....ccccaakkkkaaccc.....",
      ".....cccaakyykaaccc.....",
      ".....cccaakyykaaccc.....",
      ".....cccakkbbkkaccc.....",
      "......ccakbbbbkacc......",
      "......llkbb..bbkll......",
      ".....lllbb....bblll.....",
      ".....dllb......blld.....",
      ".....ddlb......bldd.....",
      "......dd........dd......",
      "........................"
    ],
    {
      ...basePalette,
      c: "#334155",
      r: "#cbd5e1",
      u: "#dbe7ef"
    },
    12,
    6,
    "#ef4444"
  );

    drawOperatorTexture(
      scene,
      "player-pistol",
    [
      "........................",
      ".........hhhhhh.........",
      ".......hhmmmmmmhh.......",
      "......hhmvvvvvmmhh......",
      "......hmvvffffvvmh......",
      "......hmvfffffffvmh.....",
      "......hhmffffffmhh......",
      ".......ccccttttccc......",
      "......ccccaattaccc......",
      ".....cccssasssasscu.....",
      ".....ccsaggrrggasxu.....",
      "....cccsagrrrrrgaau.....",
      "....cccsaarrrrraak......",
      "....ccccaakkkkaacc......",
      ".....cccaakyykaaccc.....",
      ".....cccaakyykaaccc.....",
      ".....cccakkbbkkaccc.....",
      "......ccakbbbbkacc......",
      "......llkbb..bbkll......",
      ".....lllbb....bblll.....",
      ".....dllb......blld.....",
      ".....ddlb......bldd.....",
      "......dd........dd......",
      "........................"
    ],
    {
      ...basePalette,
      u: "#cbd5e1"
    },
    10,
    6,
    "#ef4444"
  );

    drawOperatorTexture(
      scene,
      "player-rifle",
    [
      "........................",
      ".........hhhhhh.........",
      ".......hhmmmmmmhh.......",
      "......hhmvvvvvmmhh......",
      "......hmvvffffvvmh......",
      "......hmvfffffffvmh.....",
      "......hhmffffffmhh......",
      ".......ccccttttcccuuu...",
      "......ccccaattaccccuu...",
      ".....cccssasssassccruu..",
      ".....ccsaggrrggasxcruu..",
      "....cccsagrrrrrgaxcruu..",
      "....cccsaarrrrraascruu..",
      "....ccccaakkkkaacccru...",
      ".....cccaakyykaacccru...",
      ".....cccaakyykaacccru...",
      ".....cccakkbbkkacccru...",
      "......ccakbbbbkacc.ru...",
      "......llkbb..bbkll......",
      ".....lllbb....bblll.....",
      ".....dllb......blld.....",
      ".....ddlb......bldd.....",
      "......dd........dd......",
      "........................"
    ],
    {
      ...basePalette,
      u: "#0b1120"
    },
    14,
    6,
    "#ef4444"
  );

    drawOperatorTexture(
      scene,
      "player-worn-ak",
    [
      "........................",
      ".........hhhhhh.........",
      ".......hhmmmmmmhh.......",
      "......hhmvvvvvmmhh......",
      "......hmvvffffvvmh......",
      "......hmvfffffffvmh.....",
      "......hhmffffffmhh......",
      ".......ccccttttcccuu....",
      "......ccccaattacccuuu...",
      ".....cccssasssasscruu...",
      ".....ccsaggrrggasxruu...",
      "....cccsagrrrrrgaxruu...",
      "....cccsaarrrrraasru....",
      "....ccccaakkkkaacru.....",
      ".....cccaakyykaacru.....",
      ".....cccaakyykaaccc.....",
      ".....cccakkbbkkaccc.....",
      "......ccakbbbbkacc......",
      "......llkbb..bbkll......",
      ".....lllbb....bblll.....",
      ".....dllb......blld.....",
      ".....ddlb......bldd.....",
      "......dd........dd......",
      "........................"
    ],
    {
      ...basePalette,
      u: "#b45309",
      r: "#fca5a5"
    },
    13,
    6,
    "#ef4444"
  );

    drawOperatorTexture(
      scene,
      "player-smg",
    [
      "........................",
      ".........hhhhhh.........",
      ".......hhmmmmmmhh.......",
      "......hhmvvvvvmmhh......",
      "......hmvvffffvvmh......",
      "......hmvfffffffvmh.....",
      "......hhmffffffmhh......",
      ".......ccccttttccc......",
      "......ccccaattacccuu....",
      ".....cccssasssasscuuu...",
      ".....ccsaggrrggasxuuu...",
      "....cccsagrrrrrgaaxuu...",
      "....cccsaarrrrraakuu....",
      "....ccccaakkkkaacuu.....",
      ".....cccaakyykaacuu.....",
      ".....cccaakyykaaccc.....",
      ".....cccakkbbkkaccc.....",
      "......ccakbbbbkacc......",
      "......llkbb..bbkll......",
      ".....lllbb....bblll.....",
      ".....dllb......blld.....",
      ".....ddlb......bldd.....",
      "......dd........dd......",
      "........................"
    ],
    {
      ...basePalette,
      u: "#38bdf8"
    },
    12,
    6,
    "#ef4444"
  );

    drawOperatorTexture(
      scene,
      "player-short-mosin",
    [
      "........................",
      ".........hhhhhh.........",
      ".......hhmmmmmmhh.......",
      "......hhmvvvvvmmhh......",
      "......hmvvffffvvmh......",
      "......hmvfffffffvmh.....",
      "......hhmffffffmhh......",
      ".......ccccttttcccuu....",
      "......ccccaattacccuuu...",
      ".....cccssasssasscruu...",
      ".....ccsaggrrggasxruu...",
      "....cccsagrrrrrgaxruu...",
      "....cccsaarrrrraasruu...",
      "....ccccaakkkkaaccru....",
      ".....cccaakyykaaccr.....",
      ".....cccaakyykaaccc.....",
      ".....cccakkbbkkaccc.....",
      "......ccakbbbbkacc......",
      "......llkbb..bbkll......",
      ".....lllbb....bblll.....",
      ".....dllb......blld.....",
      ".....ddlb......bldd.....",
      "......dd........dd......",
      "........................"
    ],
    {
      ...basePalette,
      u: "#d97706",
      r: "#fecaca"
    },
    12,
    6,
    "#ef4444"
  );

    drawOperatorTexture(
      scene,
      "player-shotgun",
    [
      "........................",
      ".........hhhhhh.........",
      ".......hhmmmmmmhh.......",
      "......hhmvvvvvmmhh......",
      "......hmvvffffvvmh......",
      "......hmvfffffffvmh.....",
      "......hhmffffffmhh......",
      ".......ccccttttccc......",
      "......ccccaattacccuu....",
      ".....cccssasssasscuuu...",
      ".....ccsaggrrggasxuuu...",
      "....cccsagrrrrrgaaxuu...",
      "....cccsaarrrrraakuuu...",
      "....ccccaakkkkaacuu.....",
      ".....cccaakyykaacuu.....",
      ".....cccaakyykaacuu.....",
      ".....cccakkbbkkaccc.....",
      "......ccakbbbbkacc......",
      "......llkbb..bbkll......",
      ".....lllbb....bblll.....",
      ".....dllb......blld.....",
      ".....ddlb......bldd.....",
      "......dd........dd......",
      "........................"
    ],
    {
      ...basePalette,
      u: "#fbbf24"
    },
    13,
    6,
    "#ef4444"
  );

    drawOperatorTexture(
      scene,
      "player-pkm",
    [
      "........................",
      ".........hhhhhh.........",
      ".......hhmmmmmmhh.......",
      "......hhmvvvvvmmhh......",
      "......hmvvffffvvmh......",
      "......hmvfffffffvmh.....",
      "......hhmffffffmhh......",
      ".......ccccttttcccuuuu..",
      "......ccccaattaccccuuu..",
      ".....cccssasssasscruuu..",
      ".....ccsaggrrggasxruuu..",
      "....cccsagrrrrrgaxruuu..",
      "....cccsaarrrrraasruuu..",
      "....ccccaakkkkaaccruuu..",
      ".....cccaakyykaaccr.....",
      ".....cccaakyykaaccc.....",
      ".....cccakkbbkkaccc.....",
      "......ccakbbbbkacc......",
      "......llkbb..bbkll......",
      ".....lllbb....bblll.....",
      ".....dllb......blld.....",
      ".....ddlb......bldd.....",
      "......dd........dd......",
      "........................"
    ],
    {
      ...basePalette,
      u: "#94a3b8",
      r: "#fcd34d"
    },
    16,
    6,
    "#ef4444"
  );

    drawOperatorTexture(
      scene,
      "player-amr",
    [
      "........................",
      ".........hhhhhh.........",
      ".......hhmmmmmmhh.......",
      "......hhmvvvvvmmhh......",
      "......hmvvffffvvmh......",
      "......hmvfffffffvmh.....",
      "......hhmffffffmhh......",
      ".......ccccttttcccuuuuu.",
      "......ccccaattaccccuuuu.",
      ".....cccssasssasscruuuu.",
      ".....ccsaggrrggasxruuuu.",
      "....cccsagrrrrrgaxruuuu.",
      "....cccsaarrrrraasruuuu.",
      "....ccccaakkkkaaccruuuu.",
      ".....cccaakyykaaccru....",
      ".....cccaakyykaaccc.....",
      ".....cccakkbbkkaccc.....",
      "......ccakbbbbkacc......",
      "......llkbb..bbkll......",
      ".....lllbb....bblll.....",
      ".....dllb......blld.....",
      ".....ddlb......bldd.....",
      "......dd........dd......",
      "........................"
    ],
    {
      ...basePalette,
      u: "#e5e7eb",
      r: "#bfdbfe"
    },
    18,
    6,
    "#ef4444"
  );

    drawOperatorTexture(
      scene,
      "player-rpg",
    [
      "........................",
      ".........hhhhhh.........",
      ".......hhmmmmmmhh.......",
      "......hhmvvvvvmmhh......",
      "......hmvvffffvvmh......",
      "......hmvfffffffvmh.....",
      "......hhmffffffmhh......",
      ".......ccccttttccuuuuu..",
      "......ccccaattacuuuuuu..",
      ".....cccssasssassruuuu..",
      ".....ccsaggrrggasxruuu..",
      "....cccsagrrrrrgaxruuu..",
      "....cccsaarrrrraasruuu..",
      "....ccccaakkkkaaccru....",
      ".....cccaakyykaaccr.....",
      ".....cccaakyykaaccc.....",
      ".....cccakkbbkkaccc.....",
      "......ccakbbbbkacc......",
      "......llkbb..bbkll......",
      ".....lllbb....bblll.....",
      ".....dllb......blld.....",
      ".....ddlb......bldd.....",
      "......dd........dd......",
      "........................"
    ],
    {
      ...basePalette,
      u: "#334155",
      r: "#facc15"
    },
    17,
    6,
    "#ef4444"
  );
}

function drawEnemyTextures(scene: Phaser.Scene): void {
  const tapeColors: Record<EnemyTapeId, string> = {
    blue: "#60a5fa",
    green: "#4ade80",
    yellow: "#facc15"
  };

  const enemyVariants: Array<{
    archetypeId: EnemyArchetypeId;
    pattern: string[];
    palette: Palette;
  }> = [
    {
      archetypeId: "rifleman",
      pattern: [
        "..................",
        "......nnnnnn......",
        ".....nnmmmmnn.....",
        ".....nmffffmn.....",
        ".....nmffffmn.....",
        "......nmmmmnn.....",
        ".....cccccccc.....",
        "....cccssssccc....",
        "....ccsppppscc....",
        "...cccspwwwpsccc...",
        "...cccspwwwpsccc...",
        "...cccspwwwpsccc...",
        "...cccspgggpsccc...",
        "....ccgg..ggcc....",
        "....cbgg..ggbc....",
        "....bb......bb....",
        "...bbb......bbb...",
        "...dd........dd..."
      ],
      palette: {
        n: "#312e81",
        m: "#475569",
        f: "#f8d2bc",
        c: "#8b1e2d",
        s: "#b91c1c",
        p: "#7dd3fc",
        w: "#e2e8f0",
        g: "#64748b",
        b: "#111827",
        d: "#0f172a"
      }
    },
    {
      archetypeId: "rusher",
      pattern: [
        "..................",
        ".......hhhh.......",
        "......hhoohh......",
        ".....hhffffhh.....",
        ".....hhffffhh.....",
        "......hhaahh......",
        ".....cccccccc.....",
        "....cccrrrrccc....",
        "...cccrrrrrrccc...",
        "...ccrrryyrrccc...",
        "...ccrrryyrrccc...",
        "...cccryyyyccc...",
        "....ccyyyyyycc....",
        "....cgyy..yygc....",
        "....bbgg..ggbb....",
        "...bbb......bbb...",
        "...bb........bb...",
        "...dd........dd..."
      ],
      palette: {
        h: "#7c2d12",
        o: "#ea580c",
        f: "#fed7aa",
        a: "#78350f",
        c: "#451a03",
        r: "#ea580c",
        y: "#fbbf24",
        g: "#b45309",
        b: "#1f2937",
        d: "#111827"
      }
    },
    {
      archetypeId: "skirmisher",
      pattern: [
        "..................",
        "......tttttt......",
        ".....ttoooott.....",
        ".....toffffot.....",
        ".....toffffot.....",
        "......toooot......",
        ".....ssssssss.....",
        "....sssyyysss.....",
        "...sssygggysss....",
        "...sssygwwgysss...",
        "...sssygwwgysss...",
        "...sssyggggysss...",
        "....ssggggggss....",
        "....bbgg..ggbb....",
        "...bbbgg..ggbbb...",
        "...bb........bb...",
        "...bd........db...",
        "....d........d...."
      ],
      palette: {
        t: "#713f12",
        o: "#facc15",
        f: "#fde68a",
        s: "#78716c",
        y: "#d6d3d1",
        g: "#57534e",
        w: "#f8fafc",
        b: "#1f2937",
        d: "#111827"
      }
    }
  ];

  for (const enemyVariant of enemyVariants) {
    for (const [tapeId, tapeColor] of Object.entries(tapeColors) as Array<[EnemyTapeId, string]>) {
      createCanvasTexture(scene, `enemy-${enemyVariant.archetypeId}-${tapeId}`, 36, 36, (context) => {
        paintSoftShadow(context, 18, 29, 9, 4, 0.22);
        paintPattern(context, enemyVariant.pattern, enemyVariant.palette, 2);
        paintFactionArmband(context, tapeColor);
      });
    }
  }
}

function drawFriendlyCombatantTextures(scene: Phaser.Scene): void {
  createCanvasTexture(scene, "friendly-rifleman", 36, 36, (context) => {
    paintSoftShadow(context, 18, 29, 9, 4, 0.22);
    paintPattern(
      context,
      [
        "..................",
        "......nnnnnn......",
        ".....nnmmmmnn.....",
        ".....nmffffmn.....",
        ".....nmffffmn.....",
        "......nmmmmnn.....",
        ".....cccccccc.....",
        "....cccssssccc....",
        "....ccsppppscc....",
        "...cccspwwwpsccc...",
        "...cccspwwwpsccc...",
        "...cccspwwwpsccc...",
        "...cccspgggpsxsc...",
        "....ccgg..ggxx....",
        "....cbgg..ggbc....",
        "....bb......bb....",
        "...bbb......bbb...",
        "...dd........dd..."
      ],
      {
        n: "#312e81",
        m: "#475569",
        f: "#f8d2bc",
        c: "#8b1e2d",
        s: "#b91c1c",
        p: "#7dd3fc",
        w: "#e2e8f0",
        g: "#64748b",
        b: "#111827",
        d: "#0f172a",
        x: "#ef4444"
      },
      2
    );
    paintFactionArmband(context, "#ef4444");
  });

  createCanvasTexture(scene, "friendly-rusher", 36, 36, (context) => {
    paintSoftShadow(context, 18, 29, 9, 4, 0.22);
    paintPattern(
      context,
      [
        "..................",
        ".......hhhh.......",
        "......hhoohh......",
        ".....hhffffhh.....",
        ".....hhffffhh.....",
        "......hhaahh......",
        ".....cccccccc.....",
        "....cccrrrrccc....",
        "...cccrrrrrrccc...",
        "...ccrrryyrrccc...",
        "...ccrrryyrrccc...",
        "...cccryyyyccc...",
        "....ccyyyyyyxx....",
        "....cgyy..yyxc....",
        "....bbgg..ggbb....",
        "...bbb......bbb...",
        "...bb........bb...",
        "...dd........dd..."
      ],
      {
        h: "#7c2d12",
        o: "#ea580c",
        f: "#fed7aa",
        a: "#78350f",
        c: "#451a03",
        r: "#ea580c",
        y: "#fbbf24",
        g: "#b45309",
        b: "#1f2937",
        d: "#111827",
        x: "#ef4444"
      },
      2
    );
    paintFactionArmband(context, "#ef4444");
  });

  createCanvasTexture(scene, "friendly-skirmisher", 36, 36, (context) => {
    paintSoftShadow(context, 18, 29, 9, 4, 0.22);
    paintPattern(
      context,
      [
        "..................",
        "......tttttt......",
        ".....ttoooott.....",
        ".....toffffot.....",
        ".....toffffot.....",
        "......toooot......",
        ".....ssssssss.....",
        "....sssyyysss.....",
        "...sssygggysss....",
        "...sssygwwgysss...",
        "...sssygwwgysss...",
        "...sssyggggysss...",
        "....ssgggggxxs....",
        "....bbgg..ggxb....",
        "...bbbgg..ggbbb...",
        "...bb........bb...",
        "...bd........db...",
        "....d........d...."
      ],
      {
        t: "#713f12",
        o: "#facc15",
        f: "#fde68a",
        s: "#78716c",
        y: "#d6d3d1",
        g: "#57534e",
        w: "#f8fafc",
        b: "#1f2937",
        d: "#111827",
        x: "#ef4444"
      },
      2
    );
    paintFactionArmband(context, "#ef4444");
  });
}

function drawPickupTextures(scene: Phaser.Scene): void {
  createCanvasTexture(scene, "loot", 24, 24, (context) => {
    paintSoftShadow(context, 12, 19, 6, 3, 0.22);
    paintPattern(
      context,
      [
        "............",
        "...aaaaaa...",
        "..abbbbbba..",
        "..abccccba..",
        ".aabcddcbaa.",
        ".aabcddcbaa.",
        "..abccccba..",
        "..abbbbbba..",
        "...aaaaaa...",
        "....eeee....",
        "...e....e...",
        "............"
      ],
      {
        a: "#78350f",
        b: "#f59e0b",
        c: "#fcd34d",
        d: "#fef3c7",
        e: "#1f2937"
      },
      2
    );
  });

}

function drawPropTextures(scene: Phaser.Scene): void {
  createCanvasTexture(scene, "prop-crate-stack", 48, 48, (context) => {
    paintSoftShadow(context, 24, 39, 12, 5, 0.24);
    paintPattern(
      context,
      [
        "................",
        "....aaaaaaaa....",
        "...abbbbbbbba...",
        "..abccccccccba..",
        "..abccddeeccba..",
        "..abccddeeccba..",
        "..abccccccccba..",
        "...abbbbbbbba...",
        "..aaabbbbbbaaa..",
        ".abbbccccccbbba.",
        ".abbbcddccbbbba.",
        ".abbbccccccbbba.",
        ".abbbccccccbbba.",
        ".abbbccccccbbba.",
        "..aaabbbbbbaaa..",
        "....eeeeeeee...."
      ],
      {
        a: "#4c2c1c",
        b: "#7c4a2e",
        c: "#9a6642",
        d: "#d6a87b",
        e: "#111827"
      },
      3
    );
  });

  createCanvasTexture(scene, "prop-dish-array", 48, 48, (context) => {
    paintSoftShadow(context, 24, 38, 12, 5, 0.2);
    paintPattern(
      context,
      [
        "................",
        "......aaaa......",
        "....aabbbbaa....",
        "...abccccccbba...",
        "..abccddddccba..",
        "..abcddeeddcba..",
        "..abcdeeeedcba..",
        "..abccddddccba..",
        "...abccccccbba...",
        "....aabbbbaa....",
        "......aeea......",
        "......aeea......",
        ".....aefgea.....",
        ".....fggggf.....",
        "....fgg..ggf....",
        "....hh....hh...."
      ],
      {
        a: "#334155",
        b: "#64748b",
        c: "#94a3b8",
        d: "#cbd5e1",
        e: "#e2e8f0",
        f: "#475569",
        g: "#1f2937",
        h: "#0f172a"
      },
      3
    );
  });

  createCanvasTexture(scene, "prop-forklift", 54, 48, (context) => {
    paintSoftShadow(context, 27, 40, 14, 5, 0.22);
    paintPattern(
      context,
      [
        "..................",
        "..................",
        "...aaaaaaaaaa.....",
        "..abbbbbbbbbba....",
        "..abccccccccba....",
        "..abccddeeccba....",
        ".aabccddddccbaa...",
        ".aabccccccccbaa...",
        ".aabccccccccbaa...",
        ".aabccccccccbaa...",
        "..abffccccffbaaaaa",
        "..abffccccffbaggga",
        "...ahh....hh.aggga",
        "..ahhh....hhha.gga",
        "..iii......iii....",
        "..iii......iii...."
      ],
      {
        a: "#78350f",
        b: "#d97706",
        c: "#f59e0b",
        d: "#fef3c7",
        e: "#fde68a",
        f: "#334155",
        g: "#94a3b8",
        h: "#111827",
        i: "#020617"
      },
      3
    );
  });

  createCanvasTexture(scene, "prop-floodlight", 42, 42, (context) => {
    paintSoftShadow(context, 21, 34, 10, 4, 0.22);
    paintPattern(
      context,
      [
        "......aaaa......",
        ".....abbbba.....",
        ".....abccba.....",
        "......adda......",
        "......adde......",
        ".......dde......",
        ".......dde......",
        ".......dde......",
        "......fddef.....",
        ".....ffddff.....",
        "....ff....ff....",
        "...gg......gg...",
        "...hh......hh...",
        "................"
      ],
      {
        a: "#334155",
        b: "#94a3b8",
        c: "#e2e8f0",
        d: "#475569",
        e: "#1e293b",
        f: "#0f172a",
        g: "#111827",
        h: "#020617"
      },
      3
    );
  });

  createCanvasTexture(scene, "prop-barrier", 60, 30, (context) => {
    paintSoftShadow(context, 30, 24, 17, 4, 0.18);
    paintPattern(
      context,
      [
        "....................",
        ".aaaaaaaaaaaaaaaaaa.",
        "abbbbbbbbbbbbbbbbba",
        "abccddccddccddcccca",
        "abbbbbbbbbbbbbbbbba",
        ".aeeeeeeeeeeeeeeea.",
        "..ff..........ff..",
        "..ff..........ff..",
        "..gg..........gg..",
        "...................."
      ],
      {
        a: "#334155",
        b: "#475569",
        c: "#f59e0b",
        d: "#fde68a",
        e: "#1f2937",
        f: "#64748b",
        g: "#0f172a"
      },
      3
    );
  });

  createCanvasTexture(scene, "prop-pallet-stack", 48, 36, (context) => {
    paintSoftShadow(context, 24, 30, 12, 4, 0.18);
    paintPattern(
      context,
      [
        "................",
        "..aaaaaaaaaaaa..",
        ".abbbbbbbbbbbba.",
        ".abccccccccccba.",
        "..addddddddddda.",
        ".abccccccccccba.",
        ".abbbbbbbbbbbba.",
        "..aeeeeeeeeeea..",
        "..af..af..af.a..",
        "..ag..ag..ag.a..",
        "................",
        "................"
      ],
      {
        a: "#5b3b24",
        b: "#8a5a3a",
        c: "#b9855c",
        d: "#d1a27b",
        e: "#3f2a1b",
        f: "#7c5a3b",
        g: "#2d1c12"
      },
      3
    );
  });

  createCanvasTexture(scene, "prop-sandbag-nest", 54, 42, (context) => {
    paintSoftShadow(context, 27, 34, 15, 5, 0.24);
    paintPattern(
      context,
      [
        "..................",
        ".....aaaaaaaa.....",
        "...aaabbbbbbaa....",
        "..abbbbccccbbbba..",
        ".abbbccddddccbbba.",
        ".abccdd....ddccba.",
        ".abccdd....ddccba.",
        ".abbbccddddccbbba.",
        "..abbbbccccbbbba..",
        "..abbbeeeeeebbba..",
        "..abbeeffffeebba..",
        "...ggg......ggg...",
        "...hh........hh...",
        ".................."
      ],
      {
        a: "#6b5b47",
        b: "#8b7355",
        c: "#aa8d68",
        d: "#d3b38b",
        e: "#5b4b3b",
        f: "#7a6650",
        g: "#1f2937",
        h: "#111827"
      },
      3
    );
  });

  createCanvasTexture(scene, "prop-cable-spool", 42, 42, (context) => {
    paintSoftShadow(context, 21, 34, 10, 4, 0.22);
    paintPattern(
      context,
      [
        "................",
        ".....aaaaaa.....",
        "....abbbbbba....",
        "...abccccccba...",
        "...abcddddcba...",
        "...abcddddcba...",
        "...abcddddcba...",
        "...abccccccba...",
        "...abceeeecba...",
        "...abceeeecba...",
        "....aff..ffa....",
        "....agg..gga....",
        "....hh....hh....",
        "................"
      ],
      {
        a: "#334155",
        b: "#64748b",
        c: "#9a3412",
        d: "#f97316",
        e: "#0f172a",
        f: "#475569",
        g: "#1e293b",
        h: "#020617"
      },
      3
    );
  });

  createCanvasTexture(scene, "prop-generator", 54, 42, (context) => {
    paintSoftShadow(context, 27, 34, 13, 5, 0.24);
    paintPattern(
      context,
      [
        "..................",
        "...aaaaaaaaaaaa...",
        "..abbbbbbbbbbbba..",
        "..abccccccccccba..",
        ".abccddeeeeddccba.",
        ".abccdefffeddccba.",
        ".abccdefffeddccba.",
        ".abccdgggggddccba.",
        ".abccdhhhhgddccba.",
        "..abccddddddccba..",
        "..abii......iiba..",
        "...ajj......jja...",
        "...kk........kk...",
        ".................."
      ],
      {
        a: "#334155",
        b: "#475569",
        c: "#64748b",
        d: "#94a3b8",
        e: "#eab308",
        f: "#fef3c7",
        g: "#1f2937",
        h: "#0f172a",
        i: "#b45309",
        j: "#111827",
        k: "#020617"
      },
      3
    );
  });

  createCanvasTexture(scene, "prop-scrap-barricade", 60, 36, (context) => {
    paintSoftShadow(context, 30, 28, 16, 4, 0.2);
    paintPattern(
      context,
      [
        "....................",
        "..aaa....bbbb.......",
        ".accca..bbddbb......",
        ".acccabbbddddbb.....",
        ".accccdddeeeddbb....",
        "..acccdddeeedddb....",
        "...afffgggggfffa....",
        "..ahhhgggggghhha....",
        "..aiii......iiia....",
        "...jj........jj.....",
        "....................",
        "...................."
      ],
      {
        a: "#475569",
        b: "#7c2d12",
        c: "#64748b",
        d: "#9a3412",
        e: "#f97316",
        f: "#334155",
        g: "#0f172a",
        h: "#1f2937",
        i: "#111827",
        j: "#020617"
      },
      3
    );
  });

  createCanvasTexture(scene, "prop-vent-bank", 48, 36, (context) => {
    paintSoftShadow(context, 24, 29, 12, 4, 0.18);
    paintPattern(
      context,
      [
        "................",
        "...aaaaaaaaaa...",
        "..abbbbbbbbbba..",
        "..abccccccccba..",
        ".abccddeeddccba.",
        ".abccddeeddccba.",
        ".abccddeeddccba.",
        "..abccccccccba..",
        "..abefggggfeba..",
        "...ahh....hha...",
        "...aii....iia...",
        "................"
      ],
      {
        a: "#334155",
        b: "#64748b",
        c: "#94a3b8",
        d: "#cbd5e1",
        e: "#1f2937",
        f: "#0f172a",
        g: "#475569",
        h: "#111827",
        i: "#020617"
      },
      3
    );
  });

  createCanvasTexture(scene, "prop-drum-stack", 42, 36, (context) => {
    paintSoftShadow(context, 21, 30, 11, 4, 0.2);
    paintPattern(
      context,
      [
        "................",
        "...aaa..bbb.....",
        "..accca.bdcb....",
        "..accca.bdcb....",
        "..aeea..bffb....",
        "...gg....hh.....",
        "...iii..jjj.....",
        "..iklli.jmnj....",
        "..iklli.jmnj....",
        "..iooii.jpqj....",
        "...rr....ss.....",
        "................"
      ],
      {
        a: "#7c2d12",
        b: "#334155",
        c: "#9a3412",
        d: "#475569",
        e: "#f97316",
        f: "#94a3b8",
        g: "#1f2937",
        h: "#0f172a",
        i: "#7c3aed",
        j: "#78350f",
        k: "#9333ea",
        l: "#c4b5fd",
        m: "#b45309",
        n: "#fcd34d",
        o: "#5b21b6",
        p: "#f59e0b",
        q: "#fde68a",
        r: "#111827",
        s: "#020617"
      },
      3
    );
  });

  createCanvasTexture(scene, "prop-concrete-block", 48, 30, (context) => {
    paintSoftShadow(context, 24, 24, 13, 4, 0.16);
    paintPattern(
      context,
      [
        "................",
        "..aaaaaaaaaaaa..",
        ".abbbbbbbbbbbba.",
        ".abccddddddccba.",
        ".abccddddddccba.",
        ".abccddddddccba.",
        ".abeeffffffeeba.",
        "..gg........gg..",
        "................",
        "................"
      ],
      {
        a: "#525b66",
        b: "#717b86",
        c: "#8d98a3",
        d: "#c8d1d8",
        e: "#434a54",
        f: "#606975",
        g: "#111827"
      },
      3
    );
  });

  createCanvasTexture(scene, "prop-tool-locker", 42, 42, (context) => {
    paintSoftShadow(context, 21, 34, 10, 4, 0.2);
    paintPattern(
      context,
      [
        "................",
        "....aaaaaaaa....",
        "...abbbbbbbba...",
        "...abccccccba...",
        "...abcddddcba...",
        "...abcddddcba...",
        "...abcddddcba...",
        "...abcdeedcba...",
        "...abcfggfcba...",
        "...abcfggfcba...",
        "...abch..hcba...",
        "...abch..hcba...",
        "...aii....iia...",
        "...ajj....jja...",
        "................",
        "................"
      ],
      {
        a: "#3f3f46",
        b: "#71717a",
        c: "#a1a1aa",
        d: "#d4d4d8",
        e: "#f59e0b",
        f: "#334155",
        g: "#94a3b8",
        h: "#52525b",
        i: "#111827",
        j: "#020617"
      },
      2.5
    );
  });

  createCanvasTexture(scene, "prop-cargo-container", 72, 42, (context) => {
    paintSoftShadow(context, 36, 34, 20, 5, 0.22);
    paintPattern(
      context,
      [
        "........................",
        "..aaaaaaaaaaaaaaaaaaaa..",
        ".abbbbbbbbbbbbbbbbbbbbba.",
        ".abccddccddccddccddcccba.",
        ".abceffceffceffceffcccba.",
        ".abceffceffceffceffcccba.",
        ".abccddccddccddccddcccba.",
        ".abceffceffceffceffcccba.",
        ".abceffceffceffceffcccba.",
        ".abccddccddccddccddcccba.",
        ".abbbbbbbbbbbbbbbbbbbbba.",
        "..agggghhhhhhhhhhhhgga..",
        "..aiii............iiia..",
        "...jj..............jj..."
      ],
      {
        a: "#334155",
        b: "#475569",
        c: "#64748b",
        d: "#94a3b8",
        e: "#1f2937",
        f: "#0f172a",
        g: "#7c2d12",
        h: "#9a3412",
        i: "#111827",
        j: "#020617"
      },
      3
    );
  });

  createCanvasTexture(scene, "prop-watchtower", 54, 54, (context) => {
    paintSoftShadow(context, 27, 43, 13, 6, 0.22);
    paintPattern(
      context,
      [
        "..................",
        ".....aaaaaaaa.....",
        "....abbbbbbbba....",
        "...abccccccccba...",
        "...abcdededcba...",
        "...abcdfffedcba...",
        "...abccddddccba...",
        "....abggggggba....",
        ".....ahhhhhha.....",
        ".....aiijjiia.....",
        ".....akijjika.....",
        ".....akijjika.....",
        ".....akijjika.....",
        ".....all..lla.....",
        "....amm....mma....",
        "....ann....nna....",
        "...aooo....oooa...",
        "...ppp......ppp..."
      ],
      {
        a: "#334155",
        b: "#475569",
        c: "#94a3b8",
        d: "#cbd5e1",
        e: "#e2e8f0",
        f: "#7dd3fc",
        g: "#1f2937",
        h: "#0f172a",
        i: "#64748b",
        j: "#facc15",
        k: "#475569",
        l: "#1e293b",
        m: "#111827",
        n: "#0f172a",
        o: "#020617",
        p: "#010409"
      },
      3
    );
  });

  createCanvasTexture(scene, "prop-field-tent", 60, 42, (context) => {
    paintSoftShadow(context, 30, 33, 18, 5, 0.2);
    paintPattern(
      context,
      [
        "....................",
        "......aaaaaaaa......",
        "....aabbbbbbbbaa....",
        "...abccccccccccba...",
        "..abccddddddddccba..",
        "..abccdeeeeeedccba..",
        "..abccdeffffedccba..",
        "..abccdeffffedccba..",
        "..abccdeeeeeedccba..",
        "..abccddddddddccba..",
        "...abggghhhhggba...",
        "....aiiijjjjiiia....",
        "....akk......kka....",
        "...all........lla..."
      ],
      {
        a: "#2f3e2f",
        b: "#465946",
        c: "#5f765c",
        d: "#84997f",
        e: "#9fb394",
        f: "#d9e4d4",
        g: "#78350f",
        h: "#92400e",
        i: "#334155",
        j: "#475569",
        k: "#111827",
        l: "#020617"
      },
      3
    );
  });

  createCanvasTexture(scene, "prop-dock-bollards", 48, 30, (context) => {
    paintSoftShadow(context, 24, 24, 14, 4, 0.18);
    paintPattern(
      context,
      [
        "................",
        "..aa..bb..cc....",
        "..de..fg..hi....",
        "..aa..bb..cc....",
        "..jjjjjjjjjj....",
        "..kkkkkkkkkk....",
        "..ll..mm..nn....",
        "..op..qr..st....",
        "..ll..mm..nn....",
        "................"
      ],
      {
        a: "#cbd5e1",
        b: "#dbeafe",
        c: "#e2e8f0",
        d: "#64748b",
        e: "#475569",
        f: "#64748b",
        g: "#475569",
        h: "#64748b",
        i: "#475569",
        j: "#8b5e34",
        k: "#6b4226",
        l: "#1f2937",
        m: "#334155",
        n: "#1e293b",
        o: "#0f172a",
        p: "#111827",
        q: "#1e293b",
        r: "#0f172a",
        s: "#111827",
        t: "#0f172a"
      },
      2,
      8,
      5
    );
  });

  createCanvasTexture(scene, "prop-antenna-array", 54, 54, (context) => {
    paintSoftShadow(context, 27, 43, 14, 6, 0.22);
    paintPattern(
      context,
      [
        "..................",
        "........aa........",
        "........aa........",
        "........aa........",
        ".....bbccddbb.....",
        ".....beffffeb.....",
        "...ggghhiijjggg...",
        "...gkllllllllkg...",
        "..gkmnnnnnnnnmkg..",
        "..gkooppqqppookg..",
        "..gkooppqqppookg..",
        "..gkmnnnnnnnnmkg..",
        "...gkllllllllkg...",
        "...gggrrssrrggg...",
        ".....ttuuuutt.....",
        "......vv..vv......",
        "......ww..ww......",
        ".................."
      ],
      {
        a: "#dbeafe",
        b: "#64748b",
        c: "#94a3b8",
        d: "#cbd5e1",
        e: "#475569",
        f: "#e2e8f0",
        g: "#1f2937",
        h: "#334155",
        i: "#7dd3fc",
        j: "#38bdf8",
        k: "#111827",
        l: "#243447",
        m: "#475569",
        n: "#64748b",
        o: "#0f172a",
        p: "#1d4ed8",
        q: "#93c5fd",
        r: "#f8fafc",
        s: "#cbd5e1",
        t: "#312e81",
        u: "#818cf8",
        v: "#111827",
        w: "#020617"
      },
      2,
      9,
      7
    );
  });

  createCanvasTexture(scene, "prop-field-stretcher", 54, 36, (context) => {
    paintSoftShadow(context, 27, 29, 14, 4, 0.18);
    paintPattern(
      context,
      [
        "..................",
        "...aaaaaaaaaaaa...",
        "..abbbbbcccccbba..",
        "..abdddeffffeddba.",
        "..abdddeffffeddba.",
        "..abgggghhhhgggba.",
        "..abiiiijjjjiiiba.",
        "..abkk..llll..kba.",
        "..amnn..oooo..nma.",
        "...pp........pp...",
        "....qq......qq....",
        ".................."
      ],
      {
        a: "#334155",
        b: "#475569",
        c: "#64748b",
        d: "#7f8f6d",
        e: "#a3b18a",
        f: "#d9e4d4",
        g: "#8b1e2d",
        h: "#fecaca",
        i: "#1f2937",
        j: "#94a3b8",
        k: "#111827",
        l: "#e5e7eb",
        m: "#0f172a",
        n: "#475569",
        o: "#64748b",
        p: "#1e293b",
        q: "#0f172a"
      },
      2,
      9,
      6
    );
  });

  createCanvasTexture(scene, "prop-uplink-terminal", 48, 48, (context) => {
    paintSoftShadow(context, 24, 38, 12, 5, 0.22);
    paintPattern(
      context,
      [
        "................",
        ".....aaaaaaaa...",
        "....abbbbbbbba..",
        "...abccdddddccba.",
        "...abccdeeedccba.",
        "...abccdeffedccba",
        "...abccdeffedccba",
        "...abccdeeedccba.",
        "...abccdddddccba.",
        "....abbbgggbba..",
        ".....ahhiiihha..",
        ".....ajjkkkjja..",
        "....all....lla..",
        "....amm....mma..",
        "...ann......nna.",
        "................"
      ],
      {
        a: "#0f172a",
        b: "#334155",
        c: "#475569",
        d: "#94a3b8",
        e: "#cbd5e1",
        f: "#7dd3fc",
        g: "#1d4ed8",
        h: "#1f2937",
        i: "#38bdf8",
        j: "#475569",
        k: "#f8fafc",
        l: "#334155",
        m: "#111827",
        n: "#020617"
      },
      2
    );
  });

  createCanvasTexture(scene, "prop-medical-case", 42, 36, (context) => {
    paintSoftShadow(context, 21, 30, 11, 4, 0.2);
    paintPattern(
      context,
      [
        "................",
        "...aaaaaaaaaa...",
        "..abbbbbbbbbba..",
        ".abccccccccccba.",
        ".abccddeeddccba.",
        ".abccddeeddccba.",
        ".abccddffddccba.",
        ".abccddeeddccba.",
        ".abccccccccccba.",
        "..abbbggggbbba..",
        "...ahh....hha...",
        "...aii....iia...",
        "................",
        "................"
      ],
      {
        a: "#7f1d1d",
        b: "#b91c1c",
        c: "#ef4444",
        d: "#fee2e2",
        e: "#ffffff",
        f: "#fca5a5",
        g: "#334155",
        h: "#111827",
        i: "#020617"
      },
      2.5
    );
  });

  createCanvasTexture(scene, "prop-relay-case", 48, 36, (context) => {
    paintSoftShadow(context, 24, 29, 12, 4, 0.2);
    paintPattern(
      context,
      [
        "................",
        "...aaaaaaaaaa...",
        "..abbbbbbbbbba..",
        ".abccddeeddccba.",
        ".abcfggghhgfccba",
        ".abcfiiijjifccba",
        ".abcfkkkllkfccba",
        ".abcfiiijjifccba",
        ".abcfmmnnmmfccba",
        ".abcfoo..oofccba",
        "..abpp....ppba..",
        "..aqq......qqa..",
        "................",
        "................"
      ],
      {
        a: "#111827",
        b: "#334155",
        c: "#475569",
        d: "#94a3b8",
        e: "#cbd5e1",
        f: "#1f2937",
        g: "#0f172a",
        h: "#38bdf8",
        i: "#365314",
        j: "#86efac",
        k: "#1d4ed8",
        l: "#dbeafe",
        m: "#7c2d12",
        n: "#f59e0b",
        o: "#020617",
        p: "#475569",
        q: "#0f172a"
      },
      3
    );
  });

  createCanvasTexture(scene, "prop-trauma-rack", 48, 42, (context) => {
    paintSoftShadow(context, 24, 34, 12, 5, 0.2);
    paintPattern(
      context,
      [
        "................",
        "...aaaaaaaaaa...",
        "..abbbbbbbbbba..",
        ".abccccccccccba.",
        ".abcdddeeedddcba",
        ".abcddfffffddcba",
        ".abcddfgggfddcba",
        ".abcddfffffddcba",
        ".abcddhhhihddcba",
        ".abcddhjjjhddcba",
        ".abcddhhhihddcba",
        ".abckllmmmmllkba",
        "..abnn....nnba..",
        "..aoo......ooa.."
      ],
      {
        a: "#111827",
        b: "#334155",
        c: "#dcfce7",
        d: "#bbf7d0",
        e: "#f8fafc",
        f: "#ffffff",
        g: "#ef4444",
        h: "#86efac",
        i: "#16a34a",
        j: "#dc2626",
        k: "#475569",
        l: "#64748b",
        m: "#94a3b8",
        n: "#1f2937",
        o: "#020617"
      },
      3
    );
  });

  createCanvasTexture(scene, "prop-extract-beacon", 48, 54, (context) => {
    paintSoftShadow(context, 24, 44, 12, 5, 0.22);
    paintPattern(
      context,
      [
        ".......aa.......",
        ".......aa.......",
        "......abba......",
        "......acca......",
        ".....adddda.....",
        ".....adeeda.....",
        "......affa......",
        "......agga......",
        "......ahha......",
        ".....aiijja.....",
        ".....akkkka.....",
        "....alllllba....",
        "....acddddca....",
        "....aceeeeca....",
        "....acfggfca....",
        ".....ah..ha.....",
        ".....ai..ia.....",
        ".....jj..jj....."
      ],
      {
        a: "#334155",
        b: "#64748b",
        c: "#94a3b8",
        d: "#f59e0b",
        e: "#fde68a",
        f: "#22c55e",
        g: "#dcfce7",
        h: "#111827",
        i: "#020617",
        j: "#030712",
        k: "#0f172a",
        l: "#1e293b"
      },
      2.5
    );
  });

  createCanvasTexture(scene, "prop-beacon-array", 54, 42, (context) => {
    paintSoftShadow(context, 27, 34, 15, 5, 0.2);
    paintPattern(
      context,
      [
        "..................",
        "..................",
        "..aa....bb....cc..",
        "..ad....be....cf..",
        "..ag....bh....ci..",
        "..ag....bh....ci..",
        "..ajklllbkmnnncjo..",
        "..apqrrrbqstttcpo..",
        "..auvwwxbvxyyzczo..",
        "..a1222b3444435o..",
        "..a1666b3777738o..",
        "..a1999baaaaaaao..",
        "...bb..bb....bb...",
        "...cc..cc....cc..."
      ],
      {
        a: "#111827",
        b: "#1f2937",
        c: "#334155",
        d: "#475569",
        e: "#64748b",
        f: "#94a3b8",
        g: "#f59e0b",
        h: "#fde68a",
        i: "#fef3c7",
        j: "#7c2d12",
        k: "#f97316",
        l: "#fecaca",
        m: "#facc15",
        n: "#fef08a",
        o: "#020617",
        p: "#374151",
        q: "#4b5563",
        r: "#6b7280",
        s: "#38bdf8",
        t: "#e0f2fe",
        u: "#0f172a",
        v: "#1d4ed8",
        w: "#93c5fd",
        x: "#7dd3fc",
        y: "#dbeafe",
        z: "#f8fafc",
        "1": "#334155",
        "2": "#475569",
        "3": "#64748b",
        "4": "#94a3b8",
        "5": "#e2e8f0",
        "6": "#1e293b",
        "7": "#475569",
        "8": "#cbd5e1",
        "9": "#0f172a"
      },
      3
    );
  });

  createCanvasTexture(scene, "prop-ammo-pallet", 48, 36, (context) => {
    paintSoftShadow(context, 24, 29, 14, 4, 0.2);
    paintPattern(
      context,
      [
        "................",
        "...aaaaaaaaaa...",
        "..abbbbbbbbbba..",
        ".abcccdddddccba.",
        ".abceeffffeecba.",
        ".abceeffffeecba.",
        ".abcccdddddccba.",
        ".abfffggggfffba.",
        ".abhhhiiiiihhba.",
        "..ajjj....jjja..",
        "..akkk....kkka..",
        "................"
      ],
      {
        a: "#4b5563",
        b: "#6b7280",
        c: "#65743f",
        d: "#7f8f4d",
        e: "#b7c981",
        f: "#4b3a2b",
        g: "#6f5338",
        h: "#2f3e4d",
        i: "#64748b",
        j: "#111827",
        k: "#020617"
      },
      3
    );
  });

  createCanvasTexture(scene, "prop-cargo-truck", 84, 48, (context) => {
    paintSoftShadow(context, 42, 38, 24, 6, 0.22);
    paintPattern(
      context,
      [
        "............................",
        "............................",
        "....aaaaaa..................",
        "...abbbbbba...cccccccccc....",
        "..abccddeeba.abfffffffffca..",
        "..abccddeeba.abfgggggggfca..",
        "..abccddeeba.abfghhhhggfca..",
        "..abciiiieba.abfghhhhggfca..",
        "...ajjjjjja..abfgggggggfca..",
        "....kkkkk....abfllllllllfca.",
        "...mnn..nnm..aoppppppppppoa.",
        "...mnn..nnm..aqrr......rrqa.",
        "...sss..sss...tt........tt..",
        "............................",
        "............................",
        "............................"
      ],
      {
        a: "#334155",
        b: "#475569",
        c: "#94a3b8",
        d: "#cbd5e1",
        e: "#0f172a",
        f: "#65743f",
        g: "#7f8f4d",
        h: "#cbd5b1",
        i: "#f59e0b",
        j: "#1f2937",
        k: "#0b1120",
        l: "#4b5563",
        m: "#111827",
        n: "#020617",
        o: "#475569",
        p: "#7c2d12",
        q: "#111827",
        r: "#020617",
        s: "#030712",
        t: "#010409"
      },
      3
    );
  });

  createCanvasTexture(scene, "prop-hesco-wall", 60, 36, (context) => {
    paintSoftShadow(context, 30, 28, 18, 4, 0.2);
    paintPattern(
      context,
      [
        "....................",
        "..aaaaaaaaaaaaaaaa..",
        ".abbbbbbbbbbbbbbbba.",
        ".abccccccccccccccba.",
        ".abcdedededededecba.",
        ".abcfgggggggggfcba.",
        ".abcfghhhhhhhgfcba.",
        ".abcfgggggggggfcba.",
        ".abciiiiiiiiiiiicba.",
        "..ajj........jjja..",
        "..akk........kkka..",
        "...................."
      ],
      {
        a: "#625746",
        b: "#85755e",
        c: "#a8967b",
        d: "#c8b899",
        e: "#e5d8b9",
        f: "#6b5d49",
        g: "#8d7f66",
        h: "#b8ab8f",
        i: "#4b5563",
        j: "#111827",
        k: "#020617"
      },
      3
    );
  });

  createCanvasTexture(scene, "prop-satcom-rig", 54, 54, (context) => {
    paintSoftShadow(context, 27, 43, 12, 6, 0.22);
    paintPattern(
      context,
      [
        ".........aa.........",
        ".........aa.........",
        "........abba........",
        "........acca........",
        ".......adddda.......",
        "......adeeeda.......",
        ".....adfffffda......",
        "......adeeeda.......",
        ".......adddda.......",
        ".........gg.........",
        ".........gg.........",
        "........ahha........",
        "........ihhi........",
        "......aajjjjaa......",
        ".....abkkkkkkba.....",
        ".....abcllllcb......",
        ".....abclmmmcb......",
        "......ann..nna......"
      ],
      {
        a: "#334155",
        b: "#64748b",
        c: "#94a3b8",
        d: "#cbd5e1",
        e: "#e2e8f0",
        f: "#7dd3fc",
        g: "#0f172a",
        h: "#475569",
        i: "#1e293b",
        j: "#475569",
        k: "#64748b",
        l: "#94a3b8",
        m: "#f59e0b",
        n: "#111827"
      },
      2.5
    );
  });

  createCanvasTexture(scene, "prop-razorwire-coil", 48, 30, (context) => {
    paintSoftShadow(context, 24, 23, 14, 4, 0.18);
    paintPattern(
      context,
      [
        "................",
        "...aa..bb..cc...",
        "..addeeffgghh...",
        ".adiijjkklmmhna.",
        ".adnoopqqrstonha",
        ".aunvvwwxxynzooa",
        ".abopqqrrstuvvba",
        "..acddeeffgghc..",
        "...ii..jj..kk...",
        "................"
      ],
      {
        a: "#475569",
        b: "#64748b",
        c: "#334155",
        d: "#94a3b8",
        e: "#cbd5e1",
        f: "#e2e8f0",
        g: "#cbd5e1",
        h: "#94a3b8",
        i: "#7c8a98",
        j: "#d9e2ea",
        k: "#6b7b8c",
        l: "#9fb0be",
        m: "#dce6ef",
        n: "#7b8898",
        o: "#425466",
        p: "#b6c5d1",
        q: "#e5edf4",
        r: "#aec0cf",
        s: "#6c7b8b",
        t: "#cad6e0",
        u: "#8ea0b0",
        v: "#5b6879",
        w: "#dbe7ef",
        x: "#9dafbc",
        y: "#6b7b88",
        z: "#42515f"
      },
      3
    );
  });

  createCanvasTexture(scene, "prop-camo-net", 60, 42, (context) => {
    paintSoftShadow(context, 30, 33, 18, 5, 0.18);
    paintPattern(
      context,
      [
        "....................",
        ".....aaaaaaaaaa.....",
        "...aabbbbbbbbbbba...",
        "..abccdddeeedddcba..",
        "..abdefgghhiiggfcba.",
        ".abdejkkllmmllkjeba.",
        ".abdenooppppoonjeba.",
        ".abdeqrrssttsrrqeba.",
        "..abduvvwwxxwwvdcba.",
        "..abyzz011110zzycba.",
        "...ab2223333322ba...",
        "....ab44....44ba....",
        "....ab55....55ba....",
        "...ab66......66ba..."
      ],
      {
        a: "#2f3e2f",
        b: "#465946",
        c: "#5c7357",
        d: "#7f8f5c",
        e: "#97a86d",
        f: "#c1cf96",
        g: "#4f3e2c",
        h: "#72563a",
        i: "#3f2f22",
        j: "#566744",
        k: "#88965f",
        l: "#b5c48b",
        m: "#6b5138",
        n: "#53663f",
        o: "#6c7c4f",
        p: "#a6b47b",
        q: "#4b5c3c",
        r: "#738553",
        s: "#98aa69",
        t: "#c0cf8d",
        u: "#6d573c",
        v: "#8a6d49",
        w: "#5b4630",
        x: "#41311f",
        y: "#334155",
        z: "#475569",
        "0": "#64748b",
        "1": "#94a3b8",
        "2": "#111827",
        "3": "#1f2937",
        "4": "#0f172a",
        "5": "#111827",
        "6": "#020617"
      },
      3
    );
  });

  createCanvasTexture(scene, "prop-guard-shack", 48, 42, (context) => {
    paintSoftShadow(context, 24, 34, 14, 5, 0.2);
    paintPattern(
      context,
      [
        "................",
        "....aaaaaaaa....",
        "..aabbbbbbbbaa..",
        ".abccccccccccba.",
        ".abccddeeddccba.",
        ".abccddeeddccba.",
        ".abccfffffddcba.",
        ".abccfgggfddcba.",
        ".abccfghgfddcba.",
        ".abccfgggfddcba.",
        ".abccfffffddcba.",
        ".abccddiiiddcba.",
        ".abccddiiiddcba.",
        "..abbbbbbbbbba.."
      ],
      {
        a: "#111827",
        b: "#334155",
        c: "#475569",
        d: "#64748b",
        e: "#cbd5e1",
        f: "#9ca3af",
        g: "#7dd3fc",
        h: "#e0f2fe",
        i: "#94a3b8"
      },
      3
    );
  });

  createCanvasTexture(scene, "prop-wrecked-car", 60, 36, (context) => {
    paintSoftShadow(context, 30, 28, 16, 5, 0.22);
    paintPattern(
      context,
      [
        "....................",
        "......aaaaaaaa......",
        "....aabbbbbbbbaa....",
        "...abccccccccccba...",
        "..abccddeeeeddccba..",
        "..abccdefggfedccba..",
        ".abccdeghiihgedccba.",
        ".abccdeghjjhgedccba.",
        ".abccdeghiihgedccba.",
        "..abccdefggfedccba..",
        "..abccddeeeeddccba..",
        "...abcckkkkkkccba...",
        "....aall....llaa....",
        ".....mm......mm....."
      ],
      {
        a: "#111827",
        b: "#1f2937",
        c: "#374151",
        d: "#4b5563",
        e: "#7c2d12",
        f: "#9a3412",
        g: "#b45309",
        h: "#0f172a",
        i: "#334155",
        j: "#94a3b8",
        k: "#6b7280",
        l: "#020617",
        m: "#0f172a"
      },
      3
    );
  });

  createCanvasTexture(scene, "prop-checkpoint-gate", 72, 48, (context) => {
    paintSoftShadow(context, 36, 38, 20, 5, 0.18);
    paintPattern(
      context,
      [
        "........................",
        "...aaa............aaa...",
        "...abc............cba...",
        "...ade............eda...",
        "...afg............gfa...",
        "...afg............gfa...",
        "...afg............gfa...",
        "...afg............gfa...",
        "...afg............gfa...",
        "..ahijjkkkkkkkkjjiha..",
        "..almnnoooooooonnmla..",
        "..apqqrrssssssrrqqpa..",
        "..attt........tttta..",
        "..auuu........uuuua..",
        "...vv..........vv...",
        "...ww..........ww..."
      ],
      {
        a: "#111827",
        b: "#334155",
        c: "#475569",
        d: "#64748b",
        e: "#94a3b8",
        f: "#1f2937",
        g: "#0f172a",
        h: "#7c2d12",
        i: "#f59e0b",
        j: "#fcd34d",
        k: "#fef3c7",
        l: "#374151",
        m: "#4b5563",
        n: "#6b7280",
        o: "#9ca3af",
        p: "#1e293b",
        q: "#475569",
        r: "#0f172a",
        s: "#e2e8f0",
        t: "#020617",
        u: "#111827",
        v: "#1f2937",
        w: "#020617"
      },
      3
    );
  });

  createCanvasTexture(scene, "prop-supply-rack", 54, 42, (context) => {
    paintSoftShadow(context, 27, 34, 14, 5, 0.18);
    paintPattern(
      context,
      [
        "..................",
        "...aaaaaaaaaaaa...",
        "..abbbbbbbbbbbba..",
        "..abccddeeddccba..",
        ".abccffgghhffccba.",
        ".abccfiijjkiffccba.",
        ".abccfllmmllffccba.",
        ".abccfllmmllffccba.",
        ".abccfnnooppffccba.",
        ".abccfnnooppffccba.",
        "..abccqqrrqqccba..",
        "..abbbssssssbbba..",
        "...attt....ttta...",
        "...auuu....uuua..."
      ],
      {
        a: "#111827",
        b: "#4b5563",
        c: "#6b7280",
        d: "#9ca3af",
        e: "#d1d5db",
        f: "#374151",
        g: "#7c2d12",
        h: "#9a3412",
        i: "#475569",
        j: "#94a3b8",
        k: "#e2e8f0",
        l: "#365314",
        m: "#84cc16",
        n: "#713f12",
        o: "#f59e0b",
        p: "#fef3c7",
        q: "#1f2937",
        r: "#020617",
        s: "#334155",
        t: "#0f172a",
        u: "#020617"
      },
      3
    );
  });

  createCanvasTexture(scene, "prop-triage-canopy", 60, 42, (context) => {
    paintSoftShadow(context, 30, 33, 17, 5, 0.18);
    paintPattern(
      context,
      [
        "....................",
        "....aaaaaaaaaaaa....",
        "..aabbbbbbbbbbbbaa..",
        ".abccccddddddddccba.",
        ".abceeffgghhgffeeba.",
        ".abcefiijjjjiifeeba.",
        ".abcefiikkkkiifeeba.",
        ".abcefiilllliifeeba.",
        ".abcefiimmmmiifeeba.",
        ".abcefnnooppnnfeeba.",
        "..abqqrrssssrrqqba..",
        "..abttuu....uuttba..",
        "...avvww....wwvva...",
        "...axx........xxa..."
      ],
      {
        a: "#111827",
        b: "#334155",
        c: "#dcfce7",
        d: "#f8fafc",
        e: "#bbf7d0",
        f: "#86efac",
        g: "#ef4444",
        h: "#fef2f2",
        i: "#65a30d",
        j: "#f8fafc",
        k: "#e2e8f0",
        l: "#cbd5e1",
        m: "#fef3c7",
        n: "#16a34a",
        o: "#dcfce7",
        p: "#f8fafc",
        q: "#475569",
        r: "#64748b",
        s: "#94a3b8",
        t: "#1f2937",
        u: "#0f172a",
        v: "#334155",
        w: "#111827",
        x: "#020617"
      },
      3
    );
  });

  createCanvasTexture(scene, "prop-gantry-crane", 84, 78, (context) => {
    paintSoftShadow(context, 42, 62, 22, 7, 0.18);
    paintPattern(
      context,
      [
        "............................",
        "........aaaabbbbcccc........",
        ".......addeeeeffffggg.......",
        ".......adhiijjjjkkklg.......",
        ".......adhiijjjjkkklg.......",
        ".......admmmnnnnoooolg......",
        ".......adppppppppppqlg......",
        ".......adrrrrrrrrrrslg......",
        "..ttttttadrrrrrrrrrrslg......",
        ".tuuuuuvadvvvvvvvvwwlg......",
        ".tuxxxuvadyyyyyyyyzzlg......",
        ".tuAABuvadddddddddddlg......",
        ".tuAABuvaccccccccccccg......",
        ".tuCCDuv.............g......",
        ".tuCCDuv....effff....g......",
        ".tuEEFuv...ghiiihg...g......",
        ".tuEEFuv...gjkkkjg...g......",
        ".tuGGHuv...glllllg...g......",
        ".tuGGHuv....mmmmm....g......",
        ".tuIIIuv.............g......",
        "..tJJJt..............g......",
        "...tKKt...........nnnnooo...",
        "...tLLt...........nppppqo...",
        "...tMMt...........nprrrrqo...",
        "...tNNt...........npssssqo...",
        "...tOOt...........npttttqo...",
        "...tPPt............nuuuuvo...",
        "...wwww.............xxxxx...."
      ],
      {
        a: "#111827",
        b: "#334155",
        c: "#64748b",
        d: "#1f2937",
        e: "#94a3b8",
        f: "#cbd5e1",
        g: "#0f172a",
        h: "#f59e0b",
        i: "#fbbf24",
        j: "#fde68a",
        k: "#fef3c7",
        l: "#475569",
        m: "#7c2d12",
        n: "#9a3412",
        o: "#ea580c",
        p: "#1e293b",
        q: "#0b1120",
        r: "#334155",
        s: "#94a3b8",
        t: "#475569",
        u: "#64748b",
        v: "#94a3b8",
        w: "#020617",
        x: "#1f2937",
        y: "#cbd5e1",
        z: "#e2e8f0",
        A: "#365314",
        B: "#84cc16",
        C: "#7c3aed",
        D: "#c4b5fd",
        E: "#1d4ed8",
        F: "#93c5fd",
        G: "#14532d",
        H: "#86efac",
        I: "#7f1d1d",
        J: "#fca5a5",
        K: "#78350f",
        L: "#fcd34d",
        M: "#312e81",
        N: "#818cf8",
        O: "#1e40af",
        P: "#38bdf8"
      },
      3
    );
  });

  createCanvasTexture(scene, "prop-relay-dish", 72, 72, (context) => {
    paintSoftShadow(context, 36, 58, 18, 7, 0.2);
    paintPattern(
      context,
      [
        "........................",
        "........aaaabbbb........",
        "......aaccccccccdd......",
        ".....aceeffffgghhc......",
        "....acefiiiiijjjghkc....",
        "...acelmmnnnnooopqgrc...",
        "...aclmssttttuuuovwrc...",
        "..aclxsyzzzzzAAAByCrc..",
        "..aclxszDDDDEEEEFyCrc..",
        "..aclxszDGGGHHHIFyCrc..",
        "..aclxszDJJJKKKLFyCrc..",
        "..aclxsyMMMMMNNNOyCrc..",
        "...aclpsqqqqqrrrovCrc..",
        "...aclsttttttuuuuvCrc..",
        "....acwwwwwxxxyyyCrc...",
        ".....aczzzzAABBCCcrc...",
        "......addddeeefffgc....",
        "........hhhiijjjkk.....",
        ".........llmmnnool.....",
        "........ppqqrrssst.....",
        "........puvvwwxxxt.....",
        "........pyyzzAAABt.....",
        ".........ccccdddde.....",
        "..........ffffgggg....."
      ],
      {
        a: "#0f172a",
        b: "#334155",
        c: "#64748b",
        d: "#94a3b8",
        e: "#cbd5e1",
        f: "#dbeafe",
        g: "#7dd3fc",
        h: "#1d4ed8",
        i: "#38bdf8",
        j: "#e0f2fe",
        k: "#020617",
        l: "#1f2937",
        m: "#475569",
        n: "#64748b",
        o: "#94a3b8",
        p: "#111827",
        q: "#1e293b",
        r: "#334155",
        s: "#475569",
        t: "#0b1120",
        u: "#7c3aed",
        v: "#818cf8",
        w: "#c4b5fd",
        x: "#fef3c7",
        y: "#facc15",
        z: "#ca8a04",
        A: "#16a34a",
        B: "#86efac",
        C: "#e2e8f0",
        D: "#7c2d12",
        E: "#ea580c",
        F: "#fed7aa",
        G: "#312e81",
        H: "#6366f1",
        I: "#dbeafe",
        J: "#365314",
        K: "#84cc16",
        L: "#dcfce7",
        M: "#713f12",
        N: "#f59e0b",
        O: "#fef3c7"
      },
      3
    );
  });

  createCanvasTexture(scene, "prop-apc-hulk", 84, 48, (context) => {
    paintSoftShadow(context, 42, 38, 24, 6, 0.22);
    paintPattern(
      context,
      [
        "............................",
        "....aaaabbbbbbbbbbbcccc.....",
        "...addeeeefffffggggghhic....",
        "..adjkkkklllllllmmmnnopqc...",
        "..adjkrrrsssssttttumnopqc...",
        ".adjkvwwxxxxyyyyzzAumnopqc..",
        ".adjkBCCCCCDDDDDEEFAumnopqc..",
        ".adjkBGHHHHHIIIIIJKAumnopqc..",
        ".adjkBLMMMNNNOOOPQKAumnopqc..",
        ".adjkBLRRRSTTUUUVQKAumnopqc..",
        ".adjkBWXYZ!!!@##$QKAumnopqc..",
        ".adjkB%&&&gghhiijj$QKAumnopqc..",
        "..adjkBkkkkkkkkkkkkAumnopqc..",
        "..adjllllllllllllllllmnopqc..",
        "...adrrrrrssssssssstuuuvc....",
        "....wwxx....yyzz....AABB....."
      ],
      {
        a: "#111827",
        b: "#334155",
        c: "#020617",
        d: "#1f2937",
        e: "#475569",
        f: "#64748b",
        g: "#94a3b8",
        h: "#cbd5e1",
        i: "#0b1120",
        j: "#17212f",
        k: "#374151",
        l: "#4b5563",
        m: "#6b7280",
        n: "#9ca3af",
        o: "#d1d5db",
        p: "#0f172a",
        q: "#1e293b",
        r: "#7c2d12",
        s: "#9a3412",
        t: "#f97316",
        u: "#fca5a5",
        v: "#475569",
        w: "#7f1d1d",
        x: "#fca5a5",
        y: "#365314",
        z: "#86efac",
        A: "#111827",
        B: "#0f172a",
        C: "#1d4ed8",
        D: "#93c5fd",
        E: "#dbeafe",
        F: "#fef3c7",
        G: "#312e81",
        H: "#6366f1",
        I: "#c4b5fd",
        J: "#f8fafc",
        K: "#020617",
        L: "#4b5563",
        M: "#334155",
        N: "#475569",
        O: "#64748b",
        P: "#94a3b8",
        Q: "#7c3aed",
        R: "#78350f",
        S: "#d97706",
        T: "#fde68a",
        U: "#ef4444",
        V: "#fecaca",
        W: "#14532d",
        X: "#4ade80",
        Y: "#1e3a8a",
        Z: "#60a5fa",
        "!": "#93c5fd",
        "@": "#e2e8f0",
        "#": "#64748b",
        $: "#94a3b8",
        "%": "#cbd5e1",
        "&": "#fbbf24"
      },
      3
    );
  });

  createCanvasTexture(scene, "prop-reach-stacker", 84, 54, (context) => {
    paintSoftShadow(context, 42, 42, 24, 7, 0.2);
    paintPattern(
      context,
      [
        "............................",
        ".....aaaabbbbbbbbcccc.......",
        "...aaddeeeeffffgggghhii.....",
        "..ajkkllllllllllmmmnnopq....",
        "..ajkrrsssssssstttuuuvpq....",
        ".ajkwxxxxxyyyyzzzzABCDvpq...",
        ".ajkEFFFFFGGGGHHHHIJKLvpq...",
        ".ajkEMNNNNOOOOPPPPQRSLvpq...",
        ".ajkEMTTTTUUUUVVVVQRSLvpq...",
        ".ajkEMWWXXYYZZ!!@@QRSLvpq...",
        ".ajkEM##$$%%^^&&**QRSLvpq...",
        "..ajkEqqqqqqqqqqqqqqrsvp....",
        "..ajttttttttttttttttuvpq....",
        "...awwww.....xxxx....yz.....",
        "...aAAAA....BBBB....CCCD....",
        ".....EEE......FFF......G...."
      ],
      {
        a: "#111827",
        b: "#1f2937",
        c: "#020617",
        d: "#334155",
        e: "#475569",
        f: "#64748b",
        g: "#94a3b8",
        h: "#cbd5e1",
        i: "#0f172a",
        j: "#17212f",
        k: "#78350f",
        l: "#d97706",
        m: "#f59e0b",
        n: "#fde68a",
        o: "#94a3b8",
        p: "#0b1120",
        q: "#374151",
        r: "#4b5563",
        s: "#6b7280",
        t: "#475569",
        u: "#64748b",
        v: "#1e293b",
        w: "#0f172a",
        x: "#93c5fd",
        y: "#1f2937",
        z: "#475569",
        A: "#fca5a5",
        B: "#365314",
        C: "#86efac",
        D: "#111827",
        E: "#64748b",
        F: "#0f172a",
        G: "#1e293b",
        H: "#334155",
        I: "#475569",
        J: "#94a3b8",
        K: "#e2e8f0",
        L: "#f8fafc",
        M: "#1d4ed8",
        N: "#60a5fa",
        O: "#93c5fd",
        P: "#dbeafe",
        Q: "#cbd5e1",
        R: "#1f2937",
        S: "#111827",
        T: "#7c2d12",
        U: "#9a3412",
        V: "#f97316",
        W: "#ef4444",
        X: "#fecaca",
        Y: "#365314",
        Z: "#bef264",
        "!": "#7f1d1d",
        "@": "#fca5a5",
        "#": "#1d4ed8",
        "$": "#7dd3fc",
        "%": "#e0f2fe",
        "^": "#334155",
        "&": "#94a3b8",
        "*": "#f8fafc"
      },
      3
    );
  });

  createCanvasTexture(scene, "prop-radar-van", 72, 54, (context) => {
    paintSoftShadow(context, 36, 42, 20, 7, 0.2);
    paintPattern(
      context,
      [
        "........................",
        "........aaaabbbb........",
        "......aaccccccccdd......",
        ".....aceeeffffggghc.....",
        "....aciiijjjjkkklmc.....",
        "....acinnnnoooopqrmc....",
        "...acsstttttttttuvwc....",
        "...acxxyyyyzzzzAABwc....",
        "...acxxyCCCDDDDDEBwc....",
        "...acxxyCFFFGGGHEBwc....",
        "...acxxyCIIJJKKLEBwc....",
        "...acxxyMMMMNNNOEBwc....",
        "...acppqqqqqqqqrrswc....",
        "....atttttttttttuvw.....",
        "....axx....yy....zz.....",
        ".....AA....BB....CC.....",
        "......DD....EE..FF......",
        "........GG......HH......"
      ],
      {
        a: "#0f172a",
        b: "#1e293b",
        c: "#334155",
        d: "#020617",
        e: "#64748b",
        f: "#94a3b8",
        g: "#cbd5e1",
        h: "#111827",
        i: "#e2e8f0",
        j: "#f8fafc",
        k: "#7dd3fc",
        l: "#38bdf8",
        m: "#1d4ed8",
        n: "#475569",
        o: "#64748b",
        p: "#94a3b8",
        q: "#cbd5e1",
        r: "#f8fafc",
        s: "#312e81",
        t: "#6366f1",
        u: "#818cf8",
        v: "#dbeafe",
        w: "#1f2937",
        x: "#475569",
        y: "#93c5fd",
        z: "#1e3a8a",
        A: "#facc15",
        B: "#fde68a",
        C: "#0b1120",
        D: "#334155",
        E: "#64748b",
        F: "#ef4444",
        G: "#7c3aed",
        H: "#c4b5fd",
        I: "#7c2d12",
        J: "#9a3412",
        K: "#f97316",
        L: "#fed7aa",
        M: "#365314",
        N: "#86efac",
        O: "#dcfce7"
      },
      3
    );
  });

  createCanvasTexture(scene, "prop-ambulance-wreck", 78, 48, (context) => {
    paintSoftShadow(context, 39, 39, 22, 6, 0.22);
    paintPattern(
      context,
      [
        "..........................",
        ".....aaaabbbbbbbbccc......",
        "...aaddeeeeffffggghhic....",
        "..ajkkkklllllllmmmnnopq...",
        "..ajkrrrsssssttttuuuvpq...",
        ".ajkwxxxyyyyzzzzAABBvpq...",
        ".ajkCDDDDEEEEFFFFGHHIvpq..",
        ".ajkCJKKKLLLLMMMNOPQIvpq..",
        ".ajkCJRRRSSTTUUUNOPQIvpq..",
        ".ajkCJVVVWXXYYZZNOPQIvpq..",
        ".ajkCJ11W22Y33ZZNOPQIvpq..",
        ".ajkCJ44W55Y66ZZNOPQIvpq..",
        "..ajkCqqqqqqqqqqqqrsvp....",
        "..ajttttttttttttttuvpq....",
        "...awww.....xxx....yz.....",
        "....AA......BB....CC......"
      ],
      {
        a: "#111827",
        b: "#334155",
        c: "#020617",
        d: "#1f2937",
        e: "#475569",
        f: "#64748b",
        g: "#94a3b8",
        h: "#cbd5e1",
        i: "#0f172a",
        j: "#17212f",
        k: "#f8fafc",
        l: "#e2e8f0",
        m: "#cbd5e1",
        n: "#fca5a5",
        o: "#ef4444",
        p: "#7f1d1d",
        q: "#4b5563",
        r: "#6b7280",
        s: "#9ca3af",
        t: "#475569",
        u: "#64748b",
        v: "#111827",
        w: "#7c2d12",
        x: "#1f2937",
        y: "#f97316",
        z: "#94a3b8",
        A: "#0f172a",
        B: "#ef4444",
        C: "#7f1d1d",
        D: "#ffffff",
        E: "#f8fafc",
        F: "#e11d48",
        G: "#94a3b8",
        H: "#1f2937",
        I: "#020617",
        J: "#dc2626",
        K: "#fecaca",
        L: "#ef4444",
        M: "#1e293b",
        N: "#475569",
        O: "#64748b",
        P: "#9ca3af",
        Q: "#e5e7eb",
        R: "#7c2d12",
        S: "#ea580c",
        T: "#fdba74",
        U: "#fef2f2",
        V: "#365314",
        W: "#16a34a",
        X: "#86efac",
        Y: "#14532d",
        Z: "#fca5a5",
        "1": "#111827",
        "2": "#dc2626",
        "3": "#fca5a5",
        "4": "#1e293b",
        "5": "#334155",
        "6": "#64748b"
      },
      3
    );
  });
}

function drawGroundTextures(scene: Phaser.Scene): void {
  createCanvasTexture(scene, "ground-tarp", 88, 64, (context) => {
    paintPattern(
      context,
      [
        "............................................",
        ".....aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.....",
        "...aabbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbaa...",
        "..abccccccccccccccccccccccccccccccccccccba..",
        "..abccddddddddddddddddddddddddddddddddccba..",
        ".abccdddeeeeeeeeeeeeeeeeeeeeeeeeeeeedddccba.",
        ".abccdddefffefffefffefffefffefffeeffddccba.",
        ".abccdddeeeeeeeeeeeeeeeeeeeeeeeeeeeedddccba.",
        ".abccddddddddddddddddddddddddddddddddccba..",
        "..abccccccccccccccccccccccccccccccccccccba..",
        "..abccddddddddddddddddddddddddddddddddccba..",
        ".abccdddeeeeeeeeeeeeeeeeeeeeeeeeeeeedddccba.",
        ".abccdddefffefffefffefffefffefffeeffddccba.",
        ".abccdddeeeeeeeeeeeeeeeeeeeeeeeeeeeedddccba.",
        "..abccddddddddddddddddddddddddddddddddccba..",
        "..abccccccccccccccccccccccccccccccccccccba..",
        "...aabbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbaa...",
        ".....aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.....",
        "............................................",
        "............................................"
      ],
      {
        a: "#111827",
        b: "#1f2937",
        c: "#334155",
        d: "#475569",
        e: "#64748b",
        f: "#94a3b8"
      },
      2
    );
  });

  createCanvasTexture(scene, "ground-grate", 72, 72, (context) => {
    paintSoftShadow(context, 36, 40, 24, 12, 0.16);
    paintPattern(
      context,
      [
        "....................................",
        "....aaaaaaaaaaaaaaaaaaaaaaaaaaaa....",
        "...abbbbbbbbbbbbbbbbbbbbbbbbbbbba...",
        "..abccccccccccccccccccccccccccccba..",
        "..abcdededededededededededededecba..",
        "..abcedededededededededededededcba..",
        "..abcdededededededededededededecba..",
        "..abcedededededededededededededcba..",
        "..abcdededededededededededededecba..",
        "..abcedededededededededededededcba..",
        "..abccccccccccccccccccccccccccccba..",
        "...abbbbbbbbbbbbbbbbbbbbbbbbbbbba...",
        "....aaaaaaaaaaaaaaaaaaaaaaaaaaaa....",
        "...................................."
      ],
      {
        a: "#0f172a",
        b: "#1e293b",
        c: "#334155",
        d: "#64748b",
        e: "#94a3b8"
      },
      2
    );
  });

  createCanvasTexture(scene, "ground-cables", 80, 64, (context) => {
    paintPattern(
      context,
      [
        "........................................",
        "........................................",
        ".....aaa........................bbbb....",
        "....accca......................bdddb....",
        "...acdddda....................bdddddb...",
        "...acddddaeeeeeeeeeeeeeeeeeeeebdddddb...",
        "....acccaefffffffffffffffffffebdddcb....",
        "......aaaeffggggggggggggggfffeebbb......",
        ".........effgghhhhhhhhhggfffe...........",
        ".........effgghiiiiiiihggfffe...........",
        ".........effgghhhhhhhhhggfffe...........",
        ".........effgggggggggggggfffe...........",
        ".........eeffffffffffffffffffee.........",
        "...........eeeeeeeeeeeeeeeeee...........",
        "........................................",
        "........................................"
      ],
      {
        a: "#334155",
        b: "#1e293b",
        c: "#475569",
        d: "#64748b",
        e: "#0f172a",
        f: "#111827",
        g: "#7c2d12",
        h: "#c2410c",
        i: "#fb923c"
      },
      2
    );
  });

  createCanvasTexture(scene, "ground-oil", 72, 56, (context) => {
    paintPattern(
      context,
      [
        "....................................",
        "...........aaaaaaaaaaa..............",
        ".......aaaabbbbbbbbbbbbbaa..........",
        ".....aabbbbbccccccccccbbbbaa........",
        "....abbccccccdddddddccccccbba.......",
        "...abbccdddddeeeedeeeddddccbba......",
        "...abccddddeeeeeeeeeeeedddccba......",
        "..abccddddeeeefffffeeeedddccba......",
        "..abccddddeeeefffffeeeedddccba......",
        "...abccddddeeeeeeeeeeeedddccba......",
        "...abbccdddddeeeedeeeddddccbba......",
        "....abbccccccdddddddccccccbba.......",
        ".....aabbbbbccccccccccbbbbaa........",
        ".......aaaabbbbbbbbbbbbbaa..........",
        "...........aaaaaaaaaaa..............",
        "...................................."
      ],
      {
        a: "#020617",
        b: "#0f172a",
        c: "#111827",
        d: "#1e293b",
        e: "#334155",
        f: "#475569"
      },
      2
    );
  });

  createCanvasTexture(scene, "ground-chevrons", 88, 36, (context) => {
    paintPattern(
      context,
      [
        "............................................",
        "..aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa..",
        ".abbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbba.",
        ".abccccddccccddccccddccccddccccddccccddccba.",
        ".abccdddccccddccccddccccddccccddccccdddccba.",
        ".abccccddccccddccccddccccddccccddccccddccba.",
        ".abccdddccccddccccddccccddccccddccccdddccba.",
        ".abccccddccccddccccddccccddccccddccccddccba.",
        ".abbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbba.",
        "..aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa..",
        "............................................",
        "............................................"
      ],
      {
        a: "#1f2937",
        b: "#334155",
        c: "#f59e0b",
        d: "#fef08a"
      },
      2
    );
  });

  createCanvasTexture(scene, "ground-dock-plates", 96, 64, (context) => {
    paintPattern(
      context,
      [
        "................................................",
        "..aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa..",
        ".abbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbba.",
        ".abccccccddeeffddccddeeffddccddeeffddccccccdcba.",
        ".abcgggggghhiijjhhiijjhhiijjhhiijjhgggggggcgcba.",
        ".abckkllkkmmiinnmmiinnmmiinnmmiinnkkllkkkcgcba.",
        ".abckkllkkmmiinnmmiinnmmiinnmmiinnkkllkkkcgcba.",
        ".abcgggggghhiijjhhiijjhhiijjhhiijjhgggggggcgcba.",
        ".abccccccddeeffddccddeeffddccddeeffddccccccdcba.",
        ".abpppppppppppppppppppppppppppppppppppppppppcba.",
        ".abqqqqrrqqqqrrqqqqrrqqqqrrqqqqrrqqqqrrqqqqqcba.",
        ".abqqqqrrqqqqrrqqqqrrqqqqrrqqqqrrqqqqrrqqqqqcba.",
        ".abpppppppppppppppppppppppppppppppppppppppppcba.",
        ".abccccccddeeffddccddeeffddccddeeffddccccccdcba.",
        ".abcgggggghhiijjhhiijjhhiijjhhiijjhgggggggcgcba.",
        ".abckkllkkmmiinnmmiinnmmiinnmmiinnkkllkkkcgcba.",
        ".abckkllkkmmiinnmmiinnmmiinnmmiinnkkllkkkcgcba.",
        ".abcgggggghhiijjhhiijjhhiijjhhiijjhgggggggcgcba.",
        ".abccccccddeeffddccddeeffddccddeeffddccccccdcba.",
        ".abbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbba.",
        "..aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa..",
        "................................................"
      ],
      {
        a: "#0f172a",
        b: "#1e293b",
        c: "#334155",
        d: "#475569",
        e: "#64748b",
        f: "#94a3b8",
        g: "#7c2d12",
        h: "#9a3412",
        i: "#f59e0b",
        j: "#fde68a",
        k: "#111827",
        l: "#1f2937",
        m: "#374151",
        n: "#020617",
        p: "#223140",
        q: "#36506a",
        r: "#7dd3fc"
      },
      2
    );
  });

  createCanvasTexture(scene, "ground-relay-grid", 88, 72, (context) => {
    paintPattern(
      context,
      [
        "............................................",
        "....aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa....",
        "...abbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbba...",
        "..abccccccccccccccccccccccccccccccccccccba..",
        "..abcdededededededededededededededededecba..",
        "..abcedfffgghhggfffgghhggfffgghhggfffdcba..",
        "..abcdifjjjkkllkkjjjkkllkkjjjkkllkkjfdcba..",
        "..abcedfffgghhggfffgghhggfffgghhggfffdcba..",
        "..abcdededededemnnmedededemnnmededededecba..",
        "..abcedfffgghhomppomhgfffgghomppomhgffdcba..",
        "..abcdifjjjkkloqqqqolkkjjjkloqqqqolkjfdcba..",
        "..abcedfffgghhomppomhgfffgghomppomhgffdcba..",
        "..abcdededededemnnmedededemnnmededededecba..",
        "..abcedfffgghhggfffgghhggfffgghhggfffdcba..",
        "..abcdifjjjkkllkkjjjkkllkkjjjkkllkkjfdcba..",
        "..abcedfffgghhggfffgghhggfffgghhggfffdcba..",
        "..abcdededededededededededededededededecba..",
        "..abccccccccccccccccccccccccccccccccccccba..",
        "...abbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbba...",
        "....aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa....",
        "............................................"
      ],
      {
        a: "#0f172a",
        b: "#1e293b",
        c: "#334155",
        d: "#475569",
        e: "#64748b",
        f: "#94a3b8",
        g: "#cbd5e1",
        h: "#e2e8f0",
        i: "#111827",
        j: "#1f2937",
        k: "#0ea5e9",
        l: "#e0f2fe",
        m: "#1d4ed8",
        n: "#7dd3fc",
        o: "#312e81",
        p: "#818cf8",
        q: "#dbeafe"
      },
      2
    );
  });

  createCanvasTexture(scene, "ground-freight-ruts", 96, 64, (context) => {
    paintPattern(
      context,
      [
        "................................................",
        ".....aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa......",
        "...aaabbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbaa....",
        "..abbbbccccccccccccccccccccccccccccccccccbbbba..",
        "..abccddddeeeeefgggggghhhhhhgggggfeeeedddccba..",
        ".abccdddeeeefffigiiiiijjkkkkjiiiigfffeeedddccba.",
        ".abccdddeeeefffigiiiiijjkkkkjiiiigfffeeedddccba.",
        ".abccddddeeeeefgggggghhhhhhgggggfeeeedddcccccba.",
        ".abccdddlllmmmnnnnoooopppppoooonnnmmmlllcccddba.",
        ".abccdddlllmmmnnnnoooopppppoooonnnmmmlllcccddba.",
        ".abccddddeeeeefgggggghhhhhhgggggfeeeedddcccccba.",
        ".abccdddeeeefffigiiiiijjkkkkjiiiigfffeeedddccba.",
        ".abccdddeeeefffigiiiiijjkkkkjiiiigfffeeedddccba.",
        "..abccddddeeeeefgggggghhhhhhgggggfeeeedddccba..",
        "..abbbbccccccccccccccccccccccccccccccccccbbbba..",
        "...aaabbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbaa....",
        ".....aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa......",
        "................................................"
      ],
      {
        a: "#24150f",
        b: "#3a2419",
        c: "#513224",
        d: "#6b422b",
        e: "#8b5e3c",
        f: "#a67c52",
        g: "#4b2e23",
        h: "#2c1b13",
        i: "#1f120d",
        j: "#0f0a08",
        k: "#334155",
        l: "#7c2d12",
        m: "#9a3412",
        n: "#b45309",
        o: "#d97706",
        p: "#fde68a"
      },
      2
    );
  });

  createCanvasTexture(scene, "ground-roof-panels", 96, 72, (context) => {
    paintPattern(
      context,
      [
        "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        "abbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbba",
        "abccccccccccccccccccccccccccccccccccccccccccccba",
        "abccddeeffggffeeddeeffggffeeddeeffggffeedddccba",
        "abccddeeffggffeeddeeffggffeeddeeffggffeedddccba",
        "abccddeeffggffeeddeeffggffeeddeeffggffeedddccba",
        "abccccccccccccccccccccccccccccccccccccccccccccba",
        "abchhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhcba",
        "abchijjjjkkjijjjjkkjijjjjkkjijjjjkkjijjjjkkjhcba",
        "abchijjjjkkjijjjjkkjijjjjkkjijjjjkkjijjjjkkjhcba",
        "abchhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhcba",
        "abccccccccccccccccccccccccccccccccccccccccccccba",
        "abcllllllllllllllllllllllllllllllllllllllllllcba",
        "abcmnnnnooonmnnnnooonmnnnnooonmnnnnooonmnnnomcba",
        "abcmnnnnooonmnnnnooonmnnnnooonmnnnnooonmnnnomcba",
        "abcllllllllllllllllllllllllllllllllllllllllllcba",
        "abccccccccccccccccccccccccccccccccccccccccccccba",
        "abccddeeffggffeeddeeffggffeeddeeffggffeedddccba",
        "abccddeeffggffeeddeeffggffeeddeeffggffeedddccba",
        "abccddeeffggffeeddeeffggffeeddeeffggffeedddccba",
        "abccccccccccccccccccccccccccccccccccccccccccccba",
        "abbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbba",
        "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        "................................................"
      ],
      {
        a: "#0f172a",
        b: "#1e293b",
        c: "#334155",
        d: "#475569",
        e: "#64748b",
        f: "#94a3b8",
        g: "#cbd5e1",
        h: "#243244",
        i: "#526275",
        j: "#6b7c8f",
        k: "#111827",
        l: "#1f2d3d",
        m: "#42556a",
        n: "#5b7086",
        o: "#0b1120"
      },
      2
    );
  });

  createCanvasTexture(scene, "ground-roof-hatches", 72, 72, (context) => {
    paintPattern(
      context,
      [
        "....................................",
        "....aaaaaaaaaaaaaaaaaaaaaaaaaaaa....",
        "...abbbbbbbbbbbbbbbbbbbbbbbbbbbba...",
        "..abccccccccccccccccccccccccccccba..",
        "..abcdddeeeeffffggggffffeeedddccba..",
        "..abcdddehhhffffggggffffhheedddcba..",
        "..abcdddehhhffffggggffffhheedddcba..",
        "..abcdddeeeeffffggggffffeeedddccba..",
        "..abcdddeeeeffffggggffffeeedddccba..",
        "..abcdddehhhffffggggffffhheedddcba..",
        "..abcdddehhhffffggggffffhheedddcba..",
        "..abcdddeeeeffffggggffffeeedddccba..",
        "..abciiiiiiijjjjjjjjjjiiiiiiiiccba..",
        "..abcikkkkkklmmmmlkkkkkkllllkkicba..",
        "..abcikkkkkklmmmmlkkkkkkllllkkicba..",
        "..abciiiiiiijjjjjjjjjjiiiiiiiiccba..",
        "..abccccccccccccccccccccccccccccba..",
        "...abbbbbbbbbbbbbbbbbbbbbbbbbbbba...",
        "....aaaaaaaaaaaaaaaaaaaaaaaaaaaa....",
        "...................................."
      ],
      {
        a: "#0f172a",
        b: "#334155",
        c: "#64748b",
        d: "#94a3b8",
        e: "#1f2937",
        f: "#475569",
        g: "#cbd5e1",
        h: "#7dd3fc",
        i: "#1e293b",
        j: "#0f172a",
        k: "#475569",
        l: "#93c5fd",
        m: "#e2e8f0"
      },
      2
    );
  });

  createCanvasTexture(scene, "ground-service-bay", 96, 72, (context) => {
    paintPattern(
      context,
      [
        "................................................",
        "...aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa...",
        "..abbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbca..",
        "..abddddddddddddddddddddddddddddddddddddddddca..",
        "..abdefghhiiijjjiiihhiiijjjiiihhggfedddddddca..",
        "..abdefghhiiijjjiiihhiiijjjiiihhggfedddddddca..",
        "..abdefkkkkkkkkkkkkkkkkkkkkkkkkkfedddddddca..",
        "..abdefklllllllllllllllllllllllkfedddddddca..",
        "..abdefkllmmmmnnmmmmnnmmmmnnmllkfedddddddca..",
        "..abdefkllmmmmnnmmmmnnmmmmnnmllkfedddddddca..",
        "..abdefklllllllllllllllllllllllkfedddddddca..",
        "..abdefkkkkkkkkkkkkkkkkkkkkkkkkkfedddddddca..",
        "..abdefghhiiijjjiiihhiiijjjiiihhggfedddddddca..",
        "..abdefghhiiijjjiiihhiiijjjiiihhggfedddddddca..",
        "..abddddddddddddddddddddddddddddddddddddddddca..",
        "..abcopppppppppppppppppppppppppppppppppppqca..",
        "..abcprrrrrrrrrssssssssssssrrrrrrrrrrrrrpqca..",
        "..abcprrrrrrrrrssssssssssssrrrrrrrrrrrrrpqca..",
        "..abcopppppppppppppppppppppppppppppppppppqca..",
        "..abddddddddddddddddddddddddddddddddddddddddca..",
        "..abbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbca..",
        "...aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa...",
        "................................................",
        "................................................"
      ],
      {
        a: "#0b1120",
        b: "#172132",
        c: "#273449",
        d: "#334155",
        e: "#475569",
        f: "#64748b",
        g: "#94a3b8",
        h: "#cbd5e1",
        i: "#1e293b",
        j: "#0f172a",
        k: "#111827",
        l: "#1f2937",
        m: "#f59e0b",
        n: "#fcd34d",
        o: "#3b82f6",
        p: "#1d4ed8",
        q: "#93c5fd",
        r: "#5b6574",
        s: "#e2e8f0"
      },
      2
    );
  });

  createCanvasTexture(scene, "ground-cargo-bay", 96, 72, (context) => {
    paintPattern(
      context,
      [
        "................................................",
        "....aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa....",
        "...abbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbba...",
        "..abccccccccccccccccccccccccccccccccccccccccba..",
        "..abcdededededededededededededededededededecba..",
        ".abcfgggghhiijjgggghhiijjgggghhiijjgggghhiifcba.",
        ".abcfgkkkllmmnnkkkllmmnnkkkllmmnnkkkllmmnnfcba.",
        ".abcfgooopppqqqooppqqqooppqqqooppqqqooppqqfcba.",
        ".abcfgooopppqqqooppqqqooppqqqooppqqqooppqqfcba.",
        ".abcfgkkkllmmnnkkkllmmnnkkkllmmnnkkkllmmnnfcba.",
        ".abcfgggghhiijjgggghhiijjgggghhiijjgggghhiifcba.",
        "..abcdededededederrrredededederrrredededecba..",
        "..abcsssssssssssttttttsssssssttttttsssssscba..",
        "..abcssuuuussssstvvvvtssssuuuussssstvvvvscba..",
        "..abcssuuuussssstvvvvtssssuuuussssstvvvvscba..",
        "..abcsssssssssssttttttsssssssttttttsssssscba..",
        "..abcdededededededededededededededededededecba..",
        "..abccccccccccccccccccccccccccccccccccccccccba..",
        "...abbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbba...",
        "....aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa....",
        "................................................"
      ],
      {
        a: "#0f172a",
        b: "#1e293b",
        c: "#334155",
        d: "#475569",
        e: "#64748b",
        f: "#94a3b8",
        g: "#312e1f",
        h: "#5b4634",
        i: "#8b6a4f",
        j: "#d6b085",
        k: "#7c2d12",
        l: "#b45309",
        m: "#f59e0b",
        n: "#fde68a",
        o: "#1f2937",
        p: "#475569",
        q: "#93c5fd",
        r: "#0b1120",
        s: "#223140",
        t: "#36506a",
        u: "#6b7280",
        v: "#cbd5e1"
      },
      2
    );
  });

  createCanvasTexture(scene, "ground-ops-grid", 96, 72, (context) => {
    paintPattern(
      context,
      [
        "................................................",
        "....aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa....",
        "...abbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbba...",
        "..abccccccccccccccccccccccccccccccccccccccccba..",
        "..abcdededededededededededededededededededecba..",
        ".abcfggghhiiijjjkkkiiijjjkkkiiijjjhhgggfffccba.",
        ".abcfgglmmmnnnooopppnnnooopppnnnommmggfffccba.",
        ".abcfgglqqqrrrssstttrrrssstttrrrqqqlggfffccba.",
        ".abcfgglqqqrrrssstttrrrssstttrrrqqqlggfffccba.",
        ".abcfgglmmmnnnooopppnnnooopppnnnommmggfffccba.",
        ".abcfggghhiiijjjkkkiiijjjkkkiiijjjhhgggfffccba.",
        "..abcduuuuuuvvvvvwwwwvvvvvuuuuuuvvvvvvuddcba..",
        "..abcduxxxxyyyyyzzzzzyyyyxxxxxyyyyyzzuddcba..",
        "..abcduxxxxyyyyyzzzzzyyyyxxxxxyyyyyzzuddcba..",
        "..abcduuuuuuvvvvvwwwwvvvvvuuuuuuvvvvvvuddcba..",
        "..abcdededededededededededededededededededecba..",
        "..abccccccccccccccccccccccccccccccccccccccccba..",
        "...abbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbba...",
        "....aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa....",
        "................................................"
      ],
      {
        a: "#0b1120",
        b: "#172132",
        c: "#233245",
        d: "#334155",
        e: "#526275",
        f: "#64748b",
        g: "#1e293b",
        h: "#38bdf8",
        i: "#7dd3fc",
        j: "#e0f2fe",
        k: "#dbeafe",
        l: "#312e81",
        m: "#4f46e5",
        n: "#818cf8",
        o: "#a5b4fc",
        p: "#e0e7ff",
        q: "#1f2937",
        r: "#475569",
        s: "#cbd5e1",
        t: "#ffffff",
        u: "#111827",
        v: "#1d4ed8",
        w: "#93c5fd",
        x: "#020617",
        y: "#334155",
        z: "#7dd3fc"
      },
      2
    );
  });

  createCanvasTexture(scene, "ground-triage-strips", 96, 72, (context) => {
    paintPattern(
      context,
      [
        "................................................",
        "....aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa....",
        "...abbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbba...",
        "..abccccccccccccccccccccccccccccccccccccccccba..",
        "..abcdededededededededededededededededededecba..",
        ".abcfggghhhhiiijjjjiiihhhhgggghhhhiiijjjffcba.",
        ".abcfggklllmmmnnnnmmmllllkgggklllmmmnnnffcba.",
        ".abcfggkoppqqqrrssrrqqqppkgggkoppqqqrrsffcba.",
        ".abcfggkoppqqqrrssrrqqqppkgggkoppqqqrrsffcba.",
        ".abcfggklllmmmnnnnmmmllllkgggklllmmmnnnffcba.",
        ".abcfggghhhhiiijjjjiiihhhhgggghhhhiiijjjffcba.",
        "..abcdtttttuuuuuuvvvvuuuuutttttuuuuuuvvdcba..",
        "..abcdtwwwwxxxxxyyyyyxxxxwwwwxxxxxyyydcba..",
        "..abcdtwwwwxxxxxyyyyyxxxxwwwwxxxxxyyydcba..",
        "..abcdtttttuuuuuuvvvvuuuuutttttuuuuuuvvdcba..",
        "..abcdededededededededededededededededededecba..",
        "..abccccccccccccccccccccccccccccccccccccccccba..",
        "...abbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbba...",
        "....aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa....",
        "................................................"
      ],
      {
        a: "#111827",
        b: "#1f2937",
        c: "#334155",
        d: "#475569",
        e: "#64748b",
        f: "#94a3b8",
        g: "#1f2937",
        h: "#86efac",
        i: "#dcfce7",
        j: "#f8fafc",
        k: "#7f1d1d",
        l: "#ef4444",
        m: "#fecaca",
        n: "#ffffff",
        o: "#365314",
        p: "#65a30d",
        q: "#bef264",
        r: "#ecfccb",
        s: "#fef2f2",
        t: "#0f172a",
        u: "#475569",
        v: "#e2e8f0",
        w: "#7c2d12",
        x: "#c2410c",
        y: "#fdba74"
      },
      2
    );
  });

  createCanvasTexture(scene, "ground-signal-pad", 88, 72, (context) => {
    paintPattern(
      context,
      [
        "............................................",
        ".....aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.....",
        "...aabbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbaa...",
        "..abccccccccccccccccccccccccccccccccccccba..",
        "..abcdededededededededededededededededecba..",
        ".abcfggggggghhiijjjjiiihhgggggggggggggfcba.",
        ".abcfgkkkkkkllmmnnnnmmllkkkkkkgggggggfcba.",
        ".abcfgkoppqqrrssttttssrrqqppokgggggggfcba.",
        ".abcfgkoppqqrrssttttssrrqqppokgggggggfcba.",
        ".abcfgkkkkkkllmmnnnnmmllkkkkkkgggggggfcba.",
        ".abcfggggggghhiijjjjiiihhgggggggggggggfcba.",
        "..abcdedededededuuvvuudedededededededecba..",
        "..abccccccccccccwwxxwwccccccccccccccccccba..",
        "...abbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbba...",
        ".....aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.....",
        "............................................"
      ],
      {
        a: "#0f172a",
        b: "#1e293b",
        c: "#334155",
        d: "#475569",
        e: "#64748b",
        f: "#1f2937",
        g: "#243447",
        h: "#38bdf8",
        i: "#7dd3fc",
        j: "#e0f2fe",
        k: "#312e81",
        l: "#6366f1",
        m: "#818cf8",
        n: "#dbeafe",
        o: "#7c2d12",
        p: "#9a3412",
        q: "#f59e0b",
        r: "#fde68a",
        s: "#fef3c7",
        t: "#ffffff",
        u: "#1d4ed8",
        v: "#93c5fd",
        w: "#111827",
        x: "#020617"
      },
      2
    );
  });

  createCanvasTexture(scene, "ground-med-bay", 88, 64, (context) => {
    paintPattern(
      context,
      [
        "............................................",
        "......aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa......",
        "....aabbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbaa....",
        "...abccccccccccccccccccccccccccccccccccba...",
        "..abccdddeeeeeeeeeeeeeeeeeeeeeeeeedddccba..",
        "..abccdddeffffffggggggggffffffeedddccba..",
        ".abccdddeffhhhhiijjjjjjiihhhhffedddccba.",
        ".abccdddeffhkkkllmmmmmmllkkkhffedddccba.",
        ".abccdddeffhkkkllmmmmmmllkkkhffedddccba.",
        ".abccdddeffhhhhiijjjjjjiihhhhffedddccba.",
        "..abccdddeffffffggggggggffffffeedddccba..",
        "..abccdddeeeeeeeeeennnneeeeeeeedddccba..",
        "...abcccccccccccccooppoccccccccccccba...",
        "....aabbbbbbbbbbbbbbbbbbbbbbbbbbbbaa....",
        "......aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa......",
        "............................................"
      ],
      {
        a: "#111827",
        b: "#334155",
        c: "#dcfce7",
        d: "#bbf7d0",
        e: "#f8fafc",
        f: "#e2e8f0",
        g: "#86efac",
        h: "#16a34a",
        i: "#fef2f2",
        j: "#ef4444",
        k: "#7f1d1d",
        l: "#fca5a5",
        m: "#ffffff",
        n: "#65a30d",
        o: "#1f2937",
        p: "#020617"
      },
      2
    );
  });

  createCanvasTexture(scene, "ground-extract-lane", 112, 80, (context) => {
    paintPattern(
      context,
      [
        "........................................................",
        ".......aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.......",
        ".....aabbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbaa.....",
        "...aabccccccccccccccccccccccccccccccccccccccccccccbaa...",
        "..abccddddddddddddddddddddddddddddddddddddddddddddccba..",
        "..abccddeeffggeeffggeeffggeeffggeeffggeeffggeeffddccba..",
        ".abccddhhiiijjhhiiijjhhiiijjhhiiijjhhiiijjhhiiijjddccba.",
        ".abccddkkllmmnkkllmmnkkllmmnkkllmmnkkllmmnkkllmmnddccba.",
        ".abccddopppppqopppppqopppppqopppppqopppppqopppppqddccba.",
        ".abccddrrssstrrssstrrssstrrssstrrssstrrssstrrssstddccba.",
        ".abccddopppppqopppppqopppppqopppppqopppppqopppppqddccba.",
        ".abccddkkllmmnkkllmmnkkllmmnkkllmmnkkllmmnkkllmmnddccba.",
        ".abccddhhiiijjhhiiijjhhiiijjhhiiijjhhiiijjhhiiijjddccba.",
        "..abccddeeffggeeffggeeffggeeffggeeffggeeffggeeffddccba..",
        "..abccddddddddddddddddddddddddddddddddddddddddddddccba..",
        "...aabccccccccccccccccccccccccccccccccccccccccccccbaa...",
        ".....aabbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbaa.....",
        ".......aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.......",
        "........................................................"
      ],
      {
        a: "#111827",
        b: "#1f2937",
        c: "#334155",
        d: "#475569",
        e: "#7c2d12",
        f: "#b45309",
        g: "#fde68a",
        h: "#1d4ed8",
        i: "#38bdf8",
        j: "#e0f2fe",
        k: "#365314",
        l: "#65a30d",
        m: "#bef264",
        n: "#ecfccb",
        o: "#7f1d1d",
        p: "#ef4444",
        q: "#fecaca",
        r: "#0f172a",
        s: "#94a3b8",
        t: "#e2e8f0"
      },
      2
    );
  });
}

export function ensureRaidTextures(scene: Phaser.Scene): void {
  drawPlayerTextures(scene);
  drawEnemyTextures(scene);
  drawFriendlyCombatantTextures(scene);
  drawPickupTextures(scene);
  drawPropTextures(scene);
  drawGroundTextures(scene);
}

export function getPlayerTextureKey(weaponId: WeaponId): string {
  return `player-${weaponId}`;
}

export function getFriendlyCombatantTextureKey(archetypeId: EnemyArchetypeId): string {
  return `friendly-${archetypeId}`;
}

export function getEnemyCombatantTextureKey(archetypeId: EnemyArchetypeId, tapeId: EnemyTapeId): string {
  return `enemy-${archetypeId}-${tapeId}`;
}

export function getPropTextureKey(kind: ScenicPropDefinition["kind"]): string {
  return `prop-${kind}`;
}

export function getGroundTextureKey(kind: GroundTextureKind): string {
  return `ground-${kind}`;
}
