export interface Vec2 {
  x: number;
  y: number;
}

export interface ArenaObstacle {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
  doorways?: ReadonlyArray<ArenaDoorway>;
  breach?: ArenaObstacleBreach;
}

export interface ArenaDoorway {
  side: "top" | "right" | "bottom" | "left";
  offset: number;
  width: number;
  depth?: number;
}

export interface ArenaObstacleBreach {
  label: string;
  interactLabel: string;
  duration: number;
  holdRadius: number;
  widenedDoorwayWidth: number;
  noiseRadius: number;
  noiseScore: number;
  breached?: boolean;
}

export interface SupplyCacheSpawn {
  id: number;
  position: Vec2;
  kind: "locker" | "medical" | "ammo";
  label: string;
  searchDuration?: number;
  demandCategory?: "intel" | "medical" | "munitions" | "hardware";
  rewardCredits?: number;
  medkitReward?: number;
  ammoReward?: number;
  stashReward?: {
    medkits: number;
    ammoPacks: number;
  };
  opportunityId?: "black-crate" | "field-triage" | "ammo-spill";
  opportunitySummary?: string;
}

export interface CombatPocketDefinition {
  label: string;
  position: Vec2;
  radius: number;
}

export interface RaidInsertionDefinition {
  label: string;
  summary: string;
  position: Vec2;
  facing?: Vec2;
}

export interface RaidExtractDefinition {
  id: string;
  label: string;
  summary: string;
  position: Vec2;
  radius: number;
  holdDurationMultiplier?: number;
  pressureSpawns?: ReadonlyArray<Vec2>;
  pressureBriefing?: string;
}

export interface ScenicPropDefinition {
  kind:
    | "crate-stack"
    | "dish-array"
    | "forklift"
    | "floodlight"
    | "barrier"
    | "pallet-stack"
    | "sandbag-nest"
    | "cable-spool"
    | "generator"
    | "scrap-barricade"
    | "vent-bank"
    | "drum-stack"
    | "concrete-block"
    | "tool-locker"
    | "cargo-container"
    | "watchtower"
    | "field-tent"
    | "dock-bollards"
    | "antenna-array"
    | "field-stretcher"
    | "ammo-pallet"
    | "cargo-truck"
    | "hesco-wall"
    | "satcom-rig"
    | "razorwire-coil"
    | "camo-net"
    | "guard-shack"
    | "wrecked-car"
    | "checkpoint-gate"
    | "supply-rack"
    | "triage-canopy"
    | "uplink-terminal"
    | "medical-case"
    | "extract-beacon"
    | "relay-case"
    | "trauma-rack"
    | "beacon-array"
    | "gantry-crane"
    | "relay-dish"
    | "apc-hulk"
    | "reach-stacker"
    | "radar-van"
    | "ambulance-wreck";
  position: Vec2;
  rotation?: number;
  scale?: number;
}

export interface RouteSceneTheme {
  baseColor: number;
  gridColor: number;
  laneColor: number;
  laneAlpha: number;
  pocketColor: number;
  accentColor: number;
  shadowColor: number;
  propTint: number;
}

export type RaidRouteId = "crosswind-docks" | "broken-signal" | "sundered-run";
export type RouteScavType = "rifleman" | "rusher" | "skirmisher";

export interface NoiseResponseTierDefinition {
  threshold: number;
  label: string;
  briefing: string;
  reinforcements: ReadonlyArray<RouteScavType>;
}

export interface RaidRouteDefinition {
  id: RaidRouteId;
  name: string;
  briefing: string;
  heat: "Measured" | "Contested" | "Hot";
  extractLabel: string;
  insertionPoints: ReadonlyArray<RaidInsertionDefinition>;
  extractZone: { position: Vec2; radius: number };
  extractOptions: ReadonlyArray<RaidExtractDefinition>;
  intelPositions: Vec2[];
  supplyCaches: SupplyCacheSpawn[];
  enemySpawnPoints: Vec2[];
  scavLayout: ReadonlyArray<RouteScavType>;
  extractionPressureSpawns: Vec2[];
  noiseResponseSpawns: Vec2[];
  noiseResponseTiers: ReadonlyArray<NoiseResponseTierDefinition>;
  sceneTheme: RouteSceneTheme;
  scenicProps: ReadonlyArray<ScenicPropDefinition>;
  combatPockets: ReadonlyArray<CombatPocketDefinition>;
}

const WORLD_LAYOUT_SCALE = 3.1;
const POCKET_RADIUS_SCALE = 1.52;
const EXTRACTION_RADIUS_SCALE = 1.34;
const WORLD_BOUNDS_PADDING = 420;

const scaleCoord = (value: number): number => Math.round(value * WORLD_LAYOUT_SCALE);

const scaleVec2 = (position: Vec2): Vec2 => ({
  x: scaleCoord(position.x),
  y: scaleCoord(position.y)
});

const scaleDoorway = (doorway: ArenaDoorway): ArenaDoorway => ({
  ...doorway,
  offset: scaleCoord(doorway.offset),
  width: Math.max(doorway.width, scaleCoord(doorway.width), 88),
  depth: doorway.depth === undefined ? undefined : Math.max(doorway.depth, scaleCoord(doorway.depth), 52)
});

const scaleBreach = (breach: ArenaObstacleBreach): ArenaObstacleBreach => ({
  ...breach,
  holdRadius: Math.max(breach.holdRadius, scaleCoord(breach.holdRadius)),
  widenedDoorwayWidth: Math.max(breach.widenedDoorwayWidth, scaleCoord(breach.widenedDoorwayWidth)),
  noiseRadius: Math.max(breach.noiseRadius, scaleCoord(breach.noiseRadius))
});

const scaleObstacle = (obstacle: ArenaObstacle): ArenaObstacle => ({
  ...obstacle,
  x: scaleCoord(obstacle.x),
  y: scaleCoord(obstacle.y),
  width: Math.max(obstacle.width, scaleCoord(obstacle.width)),
  height: Math.max(obstacle.height, scaleCoord(obstacle.height)),
  doorways: obstacle.doorways?.map(scaleDoorway),
  breach: obstacle.breach ? scaleBreach(obstacle.breach) : undefined
});

const scaleSupplyCache = (cache: SupplyCacheSpawn): SupplyCacheSpawn => ({
  ...cache,
  position: scaleVec2(cache.position)
});

const scaleInsertion = (insertion: RaidInsertionDefinition): RaidInsertionDefinition => ({
  ...insertion,
  position: scaleVec2(insertion.position)
});

const scaleExtract = (extract: RaidExtractDefinition): RaidExtractDefinition => ({
  ...extract,
  position: scaleVec2(extract.position),
  radius: Math.max(extract.radius, Math.round(extract.radius * EXTRACTION_RADIUS_SCALE)),
  pressureSpawns: extract.pressureSpawns?.map(scaleVec2)
});

const scaleCombatPocket = (pocket: CombatPocketDefinition): CombatPocketDefinition => ({
  ...pocket,
  position: scaleVec2(pocket.position),
  radius: Math.max(pocket.radius, Math.round(pocket.radius * POCKET_RADIUS_SCALE))
});

const scaleScenicProp = (prop: ScenicPropDefinition): ScenicPropDefinition => ({
  ...prop,
  position: scaleVec2(prop.position)
});

const scaleRoute = (route: RaidRouteDefinition): RaidRouteDefinition => ({
  ...route,
  insertionPoints: route.insertionPoints.map(scaleInsertion),
  extractZone: {
    position: scaleVec2(route.extractZone.position),
    radius: Math.max(route.extractZone.radius, Math.round(route.extractZone.radius * EXTRACTION_RADIUS_SCALE))
  },
  extractOptions: route.extractOptions.map(scaleExtract),
  intelPositions: route.intelPositions.map(scaleVec2),
  supplyCaches: route.supplyCaches.map(scaleSupplyCache),
  enemySpawnPoints: route.enemySpawnPoints.map(scaleVec2),
  extractionPressureSpawns: route.extractionPressureSpawns.map(scaleVec2),
  noiseResponseSpawns: route.noiseResponseSpawns.map(scaleVec2),
  scenicProps: route.scenicProps.map(scaleScenicProp),
  combatPockets: route.combatPockets.map(scaleCombatPocket)
});

interface ArenaWorldBoundary {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

const computeArenaExtents = (
  obstacles: readonly ArenaObstacle[],
  routes: readonly RaidRouteDefinition[]
): ArenaWorldBoundary => {
  const bounds: ArenaWorldBoundary = {
    minX: 0,
    minY: 0,
    maxX: WORLD_MIN_WIDTH,
    maxY: WORLD_MIN_HEIGHT
  };

  const includePoint = (point: Vec2, radius = 0): void => {
    bounds.minX = Math.min(bounds.minX, point.x - radius);
    bounds.minY = Math.min(bounds.minY, point.y - radius);
    bounds.maxX = Math.max(bounds.maxX, point.x + radius);
    bounds.maxY = Math.max(bounds.maxY, point.y + radius);
  };

  for (const obstacle of obstacles) {
    includePoint(
      { x: obstacle.x + obstacle.width / 2, y: obstacle.y + obstacle.height / 2 },
      Math.max(obstacle.width, obstacle.height) / 2 + WORLD_BOUNDS_PADDING * 0.8
    );
  }

  for (const route of routes) {
    includePoint(route.extractZone.position, route.extractZone.radius);
    includePoint(route.extractZone.position, WORLD_BOUNDS_PADDING * 0.5);
    route.insertionPoints.forEach((entry) => includePoint(entry.position, WORLD_BOUNDS_PADDING * 0.2));
    route.intelPositions.forEach((position) => includePoint(position, WORLD_BOUNDS_PADDING * 0.2));
    route.supplyCaches.forEach((cache) => includePoint(cache.position, WORLD_BOUNDS_PADDING * 0.2));
    route.enemySpawnPoints.forEach((point) => includePoint(point, 48));
    route.extractionPressureSpawns.forEach((point) => includePoint(point, 48));
    route.noiseResponseSpawns.forEach((point) => includePoint(point, 48));
    route.combatPockets.forEach((pocket) => includePoint(pocket.position, pocket.radius));
    route.scenicProps.forEach((prop) => includePoint(prop.position, 64));
  }

  return {
    minX: Math.min(0, bounds.minX - WORLD_BOUNDS_PADDING),
    minY: Math.min(0, bounds.minY - WORLD_BOUNDS_PADDING),
    maxX: bounds.maxX + WORLD_BOUNDS_PADDING,
    maxY: bounds.maxY + WORLD_BOUNDS_PADDING
  };
};

const BASE_ARENA_OBSTACLES: ArenaObstacle[] = [
  {
    id: 1,
    x: 520,
    y: 170,
    width: 360,
    height: 220,
    label: "Storage Yard",
    doorways: [
      { side: "left", offset: 150, width: 102, depth: 56 },
      { side: "bottom", offset: 240, width: 110, depth: 54 }
    ]
  },
  {
    id: 2,
    x: 1030,
    y: 170,
    width: 240,
    height: 170,
    label: "Relay Shed",
    doorways: [
      { side: "bottom", offset: 84, width: 96, depth: 52 },
      { side: "right", offset: 92, width: 86, depth: 50 }
    ]
  },
  {
    id: 3,
    x: 1590,
    y: 180,
    width: 280,
    height: 190,
    label: "Dry Dock",
    doorways: [
      { side: "bottom", offset: 206, width: 118, depth: 52 },
      { side: "left", offset: 118, width: 88, depth: 48 }
    ]
  },
  {
    id: 4,
    x: 780,
    y: 540,
    width: 240,
    height: 150,
    label: "Cut Lane",
    doorways: [
      { side: "left", offset: 92, width: 88, depth: 50 },
      { side: "right", offset: 64, width: 82, depth: 48 }
    ]
  },
  {
    id: 5,
    x: 420,
    y: 620,
    width: 170,
    height: 240,
    label: "Cargo Wall",
    doorways: [
      { side: "top", offset: 92, width: 86, depth: 52 },
      { side: "bottom", offset: 116, width: 92, depth: 52 }
    ]
  },
  {
    id: 6,
    x: 1360,
    y: 640,
    width: 320,
    height: 190,
    label: "Freight Court",
    doorways: [
      { side: "left", offset: 104, width: 104, depth: 54 },
      { side: "bottom", offset: 226, width: 108, depth: 54 }
    ]
  },
  {
    id: 7,
    x: 930,
    y: 1010,
    width: 360,
    height: 230,
    label: "Data Annex",
    doorways: [
      { side: "top", offset: 108, width: 108, depth: 56 },
      { side: "right", offset: 144, width: 100, depth: 54 }
    ]
  },
  {
    id: 8,
    x: 1770,
    y: 480,
    width: 170,
    height: 260,
    label: "Crane Lane",
    doorways: [
      { side: "bottom", offset: 88, width: 94, depth: 54 },
      { side: "left", offset: 118, width: 78, depth: 48 }
    ]
  },
  {
    id: 9,
    x: 1990,
    y: 900,
    width: 190,
    height: 190,
    label: "Fuel Cages",
    doorways: [
      { side: "left", offset: 112, width: 92, depth: 50 },
      { side: "top", offset: 104, width: 78, depth: 46 }
    ]
  },
  {
    id: 10,
    x: 1660,
    y: 1170,
    width: 300,
    height: 160,
    label: "Flood Channel",
    doorways: [
      { side: "top", offset: 214, width: 104, depth: 48 },
      { side: "left", offset: 84, width: 86, depth: 46 }
    ]
  }
];

const BASE_RAID_ROUTES: ReadonlyArray<RaidRouteDefinition> = [
  {
    id: "crosswind-docks",
    name: "Crosswind Docks",
    briefing:
      "Long eastbound dock offensive stretched across a wider nine-pocket frontline. Clear separated mid pockets, secure both intel pulls, then decide whether the outer-dock extract or the longer breakwater lane is worth the carry risk.",
    heat: "Measured",
    extractLabel: "East Dock Uplink",
    insertionPoints: [
      {
        label: "West Drain",
        summary: "Low drainage lane with hard cover into the first dock pocket.",
        position: { x: 210, y: 1120 },
        facing: { x: 0.98, y: -0.08 }
      },
      {
        label: "Cold Pier",
        summary: "Northern pier entry with a longer read on the opening lane.",
        position: { x: 250, y: 420 },
        facing: { x: 1, y: 0.12 }
      },
      {
        label: "Cargo Breach",
        summary: "Mid-left breach with the fastest line toward the broker locker.",
        position: { x: 300, y: 760 },
        facing: { x: 1, y: 0 }
      },
      {
        label: "South Service Cut",
        summary: "Lower dockside cut that gives the squad a longer flank before the freight court.",
        position: { x: 260, y: 1420 },
        facing: { x: 0.96, y: -0.18 }
      }
    ],
    extractZone: { position: { x: 2180, y: 760 }, radius: 100 },
    extractOptions: [
      {
        id: "east-dock-uplink",
        label: "East Dock Uplink",
        summary: "The default dock ring. It is easier to read on the map, but the crash wave lands directly into the hold lane.",
        position: { x: 2180, y: 760 },
        radius: 100,
        holdDurationMultiplier: 1,
        pressureSpawns: [
          { x: 1760, y: 270 },
          { x: 1940, y: 340 },
          { x: 2130, y: 420 },
          { x: 1880, y: 1220 }
        ],
        pressureBriefing: "Dock rifles and a southern crash team fold straight into the uplink ring once you light the beacon."
      },
      {
        id: "north-crane-lift",
        label: "North Crane Lift",
        summary: "A tighter northern lift under harsher sightlines. It is a shorter hold if you can win the top pocket first.",
        position: { x: 2090, y: 250 },
        radius: 90,
        holdDurationMultiplier: 0.88,
        pressureSpawns: [
          { x: 1560, y: 180 },
          { x: 1810, y: 110 },
          { x: 2130, y: 430 },
          { x: 1840, y: 620 }
        ],
        pressureBriefing: "Crane-side rifles crash from the top catwalk and the mid dock cross instead of flooding the whole east hold."
      },
      {
        id: "outer-breakwater-winch",
        label: "Outer Breakwater Winch",
        summary: "A long outer-dock walk that cashes in map control. It takes more travel, but the hold happens on the edge of the district instead of inside the old dock box.",
        position: { x: 2920, y: 660 },
        radius: 112,
        holdDurationMultiplier: 1.14,
        pressureSpawns: [
          { x: 2440, y: 320 },
          { x: 2620, y: 460 },
          { x: 2860, y: 980 },
          { x: 2520, y: 1380 }
        ],
        pressureBriefing: "Outer-dock rifles and a south jetty crash team have farther travel before contact, so the lane reads bigger before the hold finally hardens."
      },
      {
        id: "far-breakwater-ferry",
        label: "Far Breakwater Ferry",
        summary: "The longest dockside withdrawal. It pushes the squad onto the outer edge of the harbor so extraction feels like a real retreat instead of a short corner hold.",
        position: { x: 3140, y: 980 },
        radius: 118,
        holdDurationMultiplier: 1.18,
        pressureSpawns: [
          { x: 2560, y: 260 },
          { x: 2740, y: 540 },
          { x: 2960, y: 1180 },
          { x: 3240, y: 860 }
        ],
        pressureBriefing: "The far ferry lane stretches the last hold all the way out to the outer waterline, so the squad has to survive a longer exposed pull before it can break free."
      }
    ],
    intelPositions: [
      { x: 760, y: 330 },
      { x: 1450, y: 1170 },
      { x: 2510, y: 980 }
    ],
    supplyCaches: [
      {
        id: 1,
        position: { x: 500, y: 940 },
        kind: "medical",
        label: "Trauma Case"
      },
      {
        id: 2,
        position: { x: 1180, y: 760 },
        kind: "locker",
        label: "Broker Locker"
      },
      {
        id: 3,
        position: { x: 2050, y: 760 },
        kind: "ammo",
        label: "Ammo Crate"
      },
      {
        id: 4,
        position: { x: 2720, y: 620 },
        kind: "locker",
        label: "Breakwater Locker"
      }
    ],
    enemySpawnPoints: [
      { x: 470, y: 1180 },
      { x: 620, y: 250 },
      { x: 860, y: 430 },
      { x: 1010, y: 560 },
      { x: 1110, y: 620 },
      { x: 1660, y: 390 },
      { x: 1330, y: 930 },
      { x: 1600, y: 1220 },
      { x: 1770, y: 1050 },
      { x: 1840, y: 990 },
      { x: 1980, y: 670 },
      { x: 1510, y: 310 },
      { x: 2320, y: 520 },
      { x: 2460, y: 1120 },
      { x: 2680, y: 430 },
      { x: 2890, y: 760 },
      { x: 2570, y: 1360 }
    ],
    scavLayout: [
      "rusher",
      "skirmisher",
      "rifleman",
      "skirmisher",
      "skirmisher",
      "rifleman",
      "rusher",
      "rifleman",
      "skirmisher",
      "rusher",
      "skirmisher",
      "rifleman",
      "rifleman",
      "skirmisher",
      "rusher",
      "rifleman",
      "skirmisher",
      "rifleman"
    ],
    extractionPressureSpawns: [
      { x: 1760, y: 270 },
      { x: 1940, y: 340 },
      { x: 2130, y: 420 },
      { x: 1880, y: 1220 }
    ],
    noiseResponseSpawns: [
      { x: 1560, y: 190 },
      { x: 1840, y: 250 },
      { x: 2100, y: 430 },
      { x: 1620, y: 1120 },
      { x: 2380, y: 340 },
      { x: 2760, y: 610 }
    ],
    noiseResponseTiers: [
      {
        threshold: 2.2,
        label: "Dock Sweep",
        briefing: "Sustained fire pulls a balanced dock sweep that will pinch the mid lane.",
        reinforcements: ["skirmisher", "rifleman"]
      },
      {
        threshold: 4.1,
        label: "Harbor Clamp",
        briefing: "If the route keeps going loud, a heavier clamp crashes the dockside cross to box in extraction.",
        reinforcements: ["rusher", "rifleman", "skirmisher"]
      }
    ],
    sceneTheme: {
      baseColor: 0x0a1621,
      gridColor: 0x173244,
      laneColor: 0x21506a,
      laneAlpha: 0.22,
      pocketColor: 0x38bdf8,
      accentColor: 0xf59e0b,
      shadowColor: 0x061018,
      propTint: 0x8ea6b9
    },
    scenicProps: [
      { kind: "crate-stack", position: { x: 320, y: 300 }, scale: 1.08 },
      { kind: "sandbag-nest", position: { x: 690, y: 420 }, rotation: -0.12, scale: 1.08 },
      { kind: "ammo-pallet", position: { x: 560, y: 470 }, rotation: 0.08, scale: 0.94 },
      { kind: "cargo-container", position: { x: 640, y: 760 }, rotation: -0.04, scale: 1.08 },
      { kind: "dock-bollards", position: { x: 420, y: 760 }, rotation: 0, scale: 0.92 },
      { kind: "cable-spool", position: { x: 760, y: 520 }, rotation: 0.2, scale: 0.94 },
      { kind: "guard-shack", position: { x: 860, y: 300 }, rotation: -0.04, scale: 0.94 },
      { kind: "pallet-stack", position: { x: 480, y: 1040 }, rotation: -0.08 },
      { kind: "cable-spool", position: { x: 980, y: 560 }, rotation: 0.32, scale: 0.98 },
      { kind: "hesco-wall", position: { x: 1050, y: 620 }, rotation: 0.1, scale: 0.92 },
      { kind: "forklift", position: { x: 910, y: 700 }, rotation: 0.36 },
      { kind: "reach-stacker", position: { x: 1110, y: 640 }, rotation: 0.12, scale: 0.98 },
      { kind: "generator", position: { x: 1110, y: 820 }, rotation: -0.08, scale: 0.98 },
      { kind: "wrecked-car", position: { x: 1240, y: 920 }, rotation: 0.18, scale: 0.9 },
      { kind: "crate-stack", position: { x: 1210, y: 280 }, scale: 0.98 },
      { kind: "cargo-truck", position: { x: 980, y: 980 }, rotation: 0.06, scale: 0.98 },
      { kind: "barrier", position: { x: 1460, y: 720 }, rotation: 0.1, scale: 1.12 },
      { kind: "scrap-barricade", position: { x: 1350, y: 910 }, rotation: -0.24, scale: 1.02 },
      { kind: "razorwire-coil", position: { x: 1540, y: 820 }, rotation: 0.14, scale: 0.98 },
      { kind: "floodlight", position: { x: 1760, y: 520 }, rotation: 0.54 },
      { kind: "cargo-container", position: { x: 1860, y: 660 }, rotation: 1.56, scale: 1.02 },
      { kind: "reach-stacker", position: { x: 1950, y: 560 }, rotation: 1.56, scale: 0.96 },
      { kind: "cargo-truck", position: { x: 1710, y: 820 }, rotation: 1.56, scale: 1.02 },
      { kind: "gantry-crane", position: { x: 1840, y: 320 }, rotation: 0.02, scale: 1.08 },
      { kind: "checkpoint-gate", position: { x: 1890, y: 770 }, rotation: 1.56, scale: 0.96 },
      { kind: "watchtower", position: { x: 1680, y: 410 }, rotation: -0.1, scale: 0.92 },
      { kind: "sandbag-nest", position: { x: 1750, y: 430 }, rotation: 0.18, scale: 1.02 },
      { kind: "cargo-container", position: { x: 1810, y: 1040 }, rotation: 0.06, scale: 0.98 },
      { kind: "barrier", position: { x: 1880, y: 1100 }, rotation: -0.16, scale: 1.06 },
      { kind: "dock-bollards", position: { x: 2140, y: 560 }, rotation: 0, scale: 0.9 },
      { kind: "crate-stack", position: { x: 2050, y: 920 }, scale: 1.12 },
      { kind: "sandbag-nest", position: { x: 1970, y: 760 }, rotation: 0.18, scale: 1.1 },
      { kind: "supply-rack", position: { x: 2000, y: 670 }, rotation: 0.06, scale: 0.94 },
      { kind: "ammo-pallet", position: { x: 2080, y: 820 }, rotation: -0.06, scale: 0.92 },
      { kind: "barrier", position: { x: 2160, y: 660 }, rotation: 1.2, scale: 1.05 },
      { kind: "gantry-crane", position: { x: 2210, y: 980 }, rotation: 1.56, scale: 1.02 },
      { kind: "pallet-stack", position: { x: 1730, y: 1280 }, rotation: 0.06, scale: 1.02 },
      { kind: "cable-spool", position: { x: 1870, y: 1190 }, rotation: -0.18, scale: 0.9 },
      { kind: "cargo-container", position: { x: 540, y: 1090 }, rotation: 1.56, scale: 0.98 },
      { kind: "floodlight", position: { x: 430, y: 1180 }, rotation: -0.34, scale: 0.96 },
      { kind: "gantry-crane", position: { x: 2460, y: 420 }, rotation: -0.02, scale: 1.12 },
      { kind: "cargo-container", position: { x: 2520, y: 660 }, rotation: 1.56, scale: 1.02 },
      { kind: "cargo-container", position: { x: 2720, y: 760 }, rotation: 0.02, scale: 1.08 },
      { kind: "reach-stacker", position: { x: 2660, y: 560 }, rotation: 0.1, scale: 0.98 },
      { kind: "watchtower", position: { x: 2860, y: 530 }, rotation: 0.12, scale: 0.96 },
      { kind: "sandbag-nest", position: { x: 2890, y: 660 }, rotation: 0.08, scale: 1.08 },
      { kind: "dock-bollards", position: { x: 3010, y: 690 }, rotation: 0.04, scale: 0.96 },
      { kind: "cargo-truck", position: { x: 2580, y: 1180 }, rotation: 1.54, scale: 1.02 },
      { kind: "scrap-barricade", position: { x: 2450, y: 1280 }, rotation: -0.22, scale: 1.08 },
      { kind: "ammo-pallet", position: { x: 2760, y: 660 }, rotation: -0.04, scale: 0.92 }
    ],
    combatPockets: [
      { label: "West Drain Screen", position: { x: 520, y: 1080 }, radius: 132 },
      { label: "Yard Breach", position: { x: 760, y: 360 }, radius: 134 },
      { label: "Spool Barricade", position: { x: 1010, y: 560 }, radius: 122 },
      { label: "Annex Cross", position: { x: 1290, y: 790 }, radius: 154 },
      { label: "Crane Overwatch", position: { x: 1730, y: 430 }, radius: 124 },
      { label: "South Freight Slip", position: { x: 1810, y: 1040 }, radius: 138 },
      { label: "Dock Hold", position: { x: 2070, y: 760 }, radius: 148 },
      { label: "Breakwater Yard", position: { x: 2450, y: 520 }, radius: 142 },
      { label: "South Jetty Push", position: { x: 2530, y: 1180 }, radius: 140 },
      { label: "Outer Winch", position: { x: 2880, y: 700 }, radius: 164 }
    ]
  },
  {
    id: "broken-signal",
    name: "Broken Signal",
    briefing:
      "Northern relay extraction widened into a thirteen-pocket kill district. Rifle pressure lands early, the mid relay keeps trading, and lingering lets the uplink collapse from more than one side.",
    heat: "Contested",
    extractLabel: "North Relay Lift",
    insertionPoints: [
      {
        label: "South Gully",
        summary: "Lower gully entry with cover into the annex and relay lanes.",
        position: { x: 300, y: 1210 },
        facing: { x: 0.92, y: -0.18 }
      },
      {
        label: "West Antenna Cut",
        summary: "Fast antenna cut that opens pressure on the first relay pocket.",
        position: { x: 230, y: 680 },
        facing: { x: 1, y: -0.02 }
      },
      {
        label: "South Relay Fence",
        summary: "Lower fence insertion with a slower rotate into Alpha Intel.",
        position: { x: 520, y: 1340 },
        facing: { x: 0.84, y: -0.28 }
      },
      {
        label: "East Service Verge",
        summary: "Far east access lane that skips the relay mouth and pressures the outer service pockets first.",
        position: { x: 860, y: 980 },
        facing: { x: 0.96, y: -0.06 }
      },
      {
        label: "North Relay Spur",
        summary: "A farther north-side splice that lands the squad beyond the relay bowl and into the outer antenna blocks.",
        position: { x: 1760, y: 120 },
        facing: { x: -0.02, y: 1 }
      }
    ],
    extractZone: { position: { x: 2140, y: 250 }, radius: 96 },
    extractOptions: [
      {
        id: "north-relay-lift",
        label: "North Relay Lift",
        summary: "The known relay lift. It is the cleaner plan, but rifles usually already own the sightlines around it.",
        position: { x: 2140, y: 250 },
        radius: 96,
        holdDurationMultiplier: 1,
        pressureSpawns: [
          { x: 1700, y: 150 },
          { x: 1910, y: 180 },
          { x: 2140, y: 470 },
          { x: 1710, y: 650 }
        ],
        pressureBriefing: "Relay rifles and a lower collapse team stack the north kill box the moment the lift comes online."
      },
      {
        id: "flood-channel-ladder",
        label: "Flood Channel Ladder",
        summary: "A lower fallback ladder by the flood channel. It asks for a longer rotation, but it can dodge the north kill box entirely.",
        position: { x: 1820, y: 1260 },
        radius: 92,
        holdDurationMultiplier: 1.08,
        pressureSpawns: [
          { x: 1180, y: 1320 },
          { x: 1480, y: 1410 },
          { x: 2060, y: 1110 },
          { x: 1960, y: 860 }
        ],
        pressureBriefing: "The fallback ladder pulls bodies out of the lower channel and relay-backline instead of the north rifle nests."
      },
      {
        id: "east-service-culvert",
        label: "East Service Culvert",
        summary: "The longest exfil on the route. It pulls you through the new service district and pays off if you can stay alive long enough to own the far pockets.",
        position: { x: 2890, y: 980 },
        radius: 104,
        holdDurationMultiplier: 1.16,
        pressureSpawns: [
          { x: 2360, y: 420 },
          { x: 2540, y: 720 },
          { x: 2810, y: 1340 },
          { x: 2480, y: 1560 }
        ],
        pressureBriefing: "The east culvert crashes late and wide, selling the service district as a second battlefield instead of a backdrop."
      },
      {
        id: "outer-yard-lift",
        label: "Outer Yard Lift",
        summary: "The far-east lift rides the back edge of the district and makes the route feel like a multi-block push instead of a relay stop.",
        position: { x: 3140, y: 1320 },
        radius: 100,
        holdDurationMultiplier: 1.22,
        pressureSpawns: [
          { x: 2700, y: 900 },
          { x: 2910, y: 1120 },
          { x: 3040, y: 1540 },
          { x: 2760, y: 1660 }
        ],
        pressureBriefing: "The outer yard lift drags the fight into the far service blocks, where the route can still collapse after the relay is already quiet."
      },
      {
        id: "far-relay-spur",
        label: "Far Relay Spur",
        summary: "The deepest north-east lift. It makes the route feel like a larger district by pulling extraction beyond the original service pocket and into the far antenna edge.",
        position: { x: 3330, y: 380 },
        radius: 108,
        holdDurationMultiplier: 1.26,
        pressureSpawns: [
          { x: 2860, y: 220 },
          { x: 3040, y: 460 },
          { x: 3200, y: 720 },
          { x: 2960, y: 980 }
        ],
        pressureBriefing: "The far relay spur stretches the final hold into the outer antenna belt, so the district keeps breathing long after the central relay is burned out."
      }
    ],
    intelPositions: [
      { x: 640, y: 1060 },
      { x: 1610, y: 860 },
      { x: 2480, y: 520 }
    ],
    supplyCaches: [
      {
        id: 1,
        position: { x: 620, y: 470 },
        kind: "medical",
        label: "Aid Satchel"
      },
      {
        id: 2,
        position: { x: 1280, y: 470 },
        kind: "locker",
        label: "Signal Locker"
      },
      {
        id: 3,
        position: { x: 2010, y: 1140 },
        kind: "ammo",
        label: "Relay Ammo Cage"
      },
      {
        id: 4,
        position: { x: 2590, y: 1010 },
        kind: "locker",
        label: "Service Cache"
      }
    ],
    enemySpawnPoints: [
      { x: 500, y: 220 },
      { x: 650, y: 260 },
      { x: 860, y: 180 },
      { x: 1180, y: 320 },
      { x: 1210, y: 390 },
      { x: 1500, y: 540 },
      { x: 1810, y: 660 },
      { x: 1740, y: 1140 },
      { x: 1770, y: 770 },
      { x: 2060, y: 640 },
      { x: 1660, y: 1180 },
      { x: 920, y: 1220 },
      { x: 2280, y: 360 },
      { x: 2440, y: 840 },
      { x: 2620, y: 1340 },
      { x: 2860, y: 1010 },
      { x: 2520, y: 1580 },
      { x: 3040, y: 1320 },
      { x: 3140, y: 420 },
      { x: 3260, y: 300 },
      { x: 3360, y: 700 }
    ],
    scavLayout: [
      "rifleman",
      "rifleman",
      "skirmisher",
      "rifleman",
      "skirmisher",
      "rusher",
      "skirmisher",
      "rifleman",
      "rusher",
      "skirmisher",
      "rifleman",
      "skirmisher",
      "rifleman",
      "skirmisher",
      "rusher",
      "rifleman",
      "skirmisher",
      "rifleman",
      "skirmisher"
    ],
    extractionPressureSpawns: [
      { x: 1700, y: 150 },
      { x: 1910, y: 180 },
      { x: 2140, y: 470 },
      { x: 1710, y: 650 }
    ],
    noiseResponseSpawns: [
      { x: 1390, y: 130 },
      { x: 1730, y: 210 },
      { x: 2050, y: 420 },
      { x: 1360, y: 1160 },
      { x: 2340, y: 480 },
      { x: 2700, y: 1120 },
      { x: 3140, y: 420 },
      { x: 3280, y: 760 }
    ],
    noiseResponseTiers: [
      {
        threshold: 1.7,
        label: "Relay Search",
        briefing: "Broken Signal reacts early. Long-lane rifle support starts sweeping the relay once the route hears you twice.",
        reinforcements: ["rifleman", "skirmisher"]
      },
      {
        threshold: 3.3,
        label: "Relay Lockdown",
        briefing: "A second loud spike hardens the north route with extra rifles and a collapse rusher.",
        reinforcements: ["rifleman", "rifleman", "rusher"]
      }
    ],
    sceneTheme: {
      baseColor: 0x0d1420,
      gridColor: 0x233245,
      laneColor: 0x5b7c99,
      laneAlpha: 0.16,
      pocketColor: 0x7dd3fc,
      accentColor: 0xfacc15,
      shadowColor: 0x050b12,
      propTint: 0xa8b6c4
    },
    scenicProps: [
      { kind: "dish-array", position: { x: 380, y: 210 }, scale: 1.1 },
      { kind: "watchtower", position: { x: 560, y: 320 }, rotation: -0.06, scale: 1.02 },
      { kind: "satcom-rig", position: { x: 690, y: 240 }, rotation: 0.04, scale: 0.96 },
      { kind: "antenna-array", position: { x: 820, y: 230 }, rotation: 0.06, scale: 0.94 },
      { kind: "relay-dish", position: { x: 980, y: 220 }, rotation: 0.08, scale: 1.06 },
      { kind: "barrier", position: { x: 730, y: 360 }, rotation: 0.2, scale: 1.12 },
      { kind: "camo-net", position: { x: 760, y: 280 }, rotation: 0.04, scale: 0.96 },
      { kind: "guard-shack", position: { x: 930, y: 300 }, rotation: 0.06, scale: 0.92 },
      { kind: "sandbag-nest", position: { x: 1190, y: 340 }, rotation: -0.08, scale: 0.94 },
      { kind: "guard-shack", position: { x: 1260, y: 300 }, rotation: 0.1, scale: 0.9 },
      { kind: "sandbag-nest", position: { x: 860, y: 470 }, rotation: 0.16, scale: 1.04 },
      { kind: "crate-stack", position: { x: 1180, y: 250 }, scale: 0.94 },
      { kind: "generator", position: { x: 1310, y: 520 }, rotation: -0.16, scale: 0.98 },
      { kind: "radar-van", position: { x: 1460, y: 690 }, rotation: 0.08, scale: 0.94 },
      { kind: "wrecked-car", position: { x: 1530, y: 610 }, rotation: -0.22, scale: 0.92 },
      { kind: "floodlight", position: { x: 1430, y: 640 }, rotation: 1.4 },
      { kind: "dish-array", position: { x: 1740, y: 820 }, scale: 0.98 },
      { kind: "satcom-rig", position: { x: 1670, y: 940 }, rotation: -0.1, scale: 0.92 },
      { kind: "cable-spool", position: { x: 1570, y: 690 }, rotation: 0.22, scale: 0.92 },
      { kind: "pallet-stack", position: { x: 2040, y: 1160 }, rotation: 0.12 },
      { kind: "barrier", position: { x: 2120, y: 390 }, rotation: 1.1, scale: 1.2 },
      { kind: "watchtower", position: { x: 1930, y: 250 }, rotation: 0.08, scale: 0.98 },
      { kind: "radar-van", position: { x: 1950, y: 470 }, rotation: 0.94, scale: 0.9 },
      { kind: "antenna-array", position: { x: 1810, y: 360 }, rotation: -0.08, scale: 0.9 },
      { kind: "hesco-wall", position: { x: 2050, y: 220 }, rotation: 0.1, scale: 1.06 },
      { kind: "relay-dish", position: { x: 2140, y: 170 }, rotation: 0.14, scale: 0.98 },
      { kind: "checkpoint-gate", position: { x: 1980, y: 360 }, rotation: 1.06, scale: 0.9 },
      { kind: "scrap-barricade", position: { x: 2010, y: 290 }, rotation: -0.26, scale: 1.04 },
      { kind: "razorwire-coil", position: { x: 1840, y: 220 }, rotation: -0.08, scale: 0.96 },
      { kind: "hesco-wall", position: { x: 1780, y: 650 }, rotation: 0.08, scale: 0.98 },
      { kind: "cable-spool", position: { x: 1840, y: 720 }, rotation: 0.28, scale: 0.9 },
      { kind: "supply-rack", position: { x: 1710, y: 720 }, rotation: 0.12, scale: 0.9 },
      { kind: "crate-stack", position: { x: 980, y: 1280 }, scale: 1.06 },
      { kind: "floodlight", position: { x: 1870, y: 280 }, rotation: -0.24 },
      { kind: "sandbag-nest", position: { x: 2110, y: 210 }, rotation: 0.4, scale: 1.08 },
      { kind: "relay-dish", position: { x: 590, y: 250 }, rotation: -0.14, scale: 0.94 },
      { kind: "barrier", position: { x: 1760, y: 1180 }, rotation: 0.18, scale: 1.04 },
      { kind: "dish-array", position: { x: 2420, y: 480 }, scale: 1.06 },
      { kind: "relay-dish", position: { x: 2550, y: 420 }, rotation: 0.12, scale: 1.02 },
      { kind: "watchtower", position: { x: 2760, y: 760 }, rotation: -0.08, scale: 0.96 },
      { kind: "radar-van", position: { x: 2480, y: 940 }, rotation: 0.14, scale: 0.92 },
      { kind: "hesco-wall", position: { x: 2680, y: 980 }, rotation: 0.08, scale: 1.08 },
      { kind: "checkpoint-gate", position: { x: 2890, y: 1030 }, rotation: 1.52, scale: 0.92 },
      { kind: "sandbag-nest", position: { x: 2860, y: 960 }, rotation: 0.16, scale: 1.06 },
      { kind: "barrier", position: { x: 2570, y: 1340 }, rotation: 0.2, scale: 1.1 },
      { kind: "supply-rack", position: { x: 2500, y: 1080 }, rotation: 0.08, scale: 0.92 },
      { kind: "cable-spool", position: { x: 2730, y: 1460 }, rotation: -0.16, scale: 0.92 },
      { kind: "satcom-rig", position: { x: 3330, y: 360 }, rotation: 0.08, scale: 1 },
      { kind: "watchtower", position: { x: 3360, y: 720 }, rotation: -0.12, scale: 0.96 }
    ],
    combatPockets: [
      { label: "Antenna Cut", position: { x: 610, y: 270 }, radius: 116 },
      { label: "Relay Mouth", position: { x: 820, y: 430 }, radius: 122 },
      { label: "Dish Ridge", position: { x: 1220, y: 320 }, radius: 118 },
      { label: "Signal Lane", position: { x: 1440, y: 560 }, radius: 150 },
      { label: "Relay Backline", position: { x: 1810, y: 700 }, radius: 128 },
      { label: "Flood Ladder", position: { x: 1760, y: 1160 }, radius: 134 },
      { label: "North Lift", position: { x: 2120, y: 270 }, radius: 126 },
      { label: "East Dishes", position: { x: 2430, y: 500 }, radius: 138 },
      { label: "Service Culvert", position: { x: 2580, y: 1060 }, radius: 146 },
      { label: "East Spillway", position: { x: 2870, y: 980 }, radius: 158 },
      { label: "Relay Spur", position: { x: 3330, y: 380 }, radius: 182 },
      { label: "Outer Antenna", position: { x: 3360, y: 720 }, radius: 176 }
    ]
  },
  {
    id: "sundered-run",
    name: "Sundered Run",
    briefing:
      "Southbound collapse route now spans a broader seven-pocket freight line. Faster room fights, layered trench pressure, and a late low extract keep aggressive clears valuable but punish overstay hard.",
    heat: "Hot",
    extractLabel: "South Freight Gate",
    insertionPoints: [
      {
        label: "Burned Culvert",
        summary: "Upper-left culvert breach with a direct line into Freight Cut.",
        position: { x: 240, y: 260 },
        facing: { x: 0.98, y: 0.12 }
      },
      {
        label: "Field Triage Gap",
        summary: "Western camp gap that shortens the route to the recovery case.",
        position: { x: 280, y: 930 },
        facing: { x: 0.94, y: -0.04 }
      },
      {
        label: "North Freight Fence",
        summary: "High-west fence entry with a cleaner scout line to first intel.",
        position: { x: 420, y: 520 },
        facing: { x: 0.94, y: 0.04 }
      }
    ],
    extractZone: { position: { x: 2140, y: 1260 }, radius: 104 },
    extractOptions: [
      {
        id: "south-freight-gate",
        label: "South Freight Gate",
        summary: "The freight gate remains the stable plan. It is longer to reach, but the lane is easier to read once you own the south crash pocket.",
        position: { x: 2140, y: 1260 },
        radius: 104,
        holdDurationMultiplier: 1,
        pressureSpawns: [
          { x: 1710, y: 1410 },
          { x: 1910, y: 1380 },
          { x: 2130, y: 1010 },
          { x: 1750, y: 880 }
        ],
        pressureBriefing: "The stable gate pulls a broad southern flood that is readable, but it gives the crash wave time to fully form."
      },
      {
        id: "east-service-slot",
        label: "East Service Slot",
        summary: "A hotter east-side service slot closer to the ammo lane. It cuts the route short if you accept a riskier, faster hold.",
        position: { x: 2120, y: 720 },
        radius: 92,
        holdDurationMultiplier: 0.9,
        pressureSpawns: [
          { x: 1540, y: 520 },
          { x: 1810, y: 600 },
          { x: 2130, y: 930 },
          { x: 1830, y: 1120 }
        ],
        pressureBriefing: "The service slot cuts time off the hold, but the ammo-lane crash wave arrives faster from the east interior."
      },
      {
        id: "outer-rail-spur",
        label: "Outer Rail Spur",
        summary: "The farthest south-east exfil. It takes the longest walk but finally makes the route feel like a full district push instead of one freight yard.",
        position: { x: 2960, y: 1540 },
        radius: 112,
        holdDurationMultiplier: 1.18,
        pressureSpawns: [
          { x: 2380, y: 920 },
          { x: 2540, y: 1240 },
          { x: 2860, y: 1320 },
          { x: 2680, y: 1760 }
        ],
        pressureBriefing: "The rail spur drags the final flood through the outer berm and train yard, so the late raid keeps breathing after the old crash pocket."
      }
    ],
    intelPositions: [
      { x: 860, y: 300 },
      { x: 1420, y: 860 },
      { x: 2540, y: 1460 }
    ],
    supplyCaches: [
      {
        id: 1,
        position: { x: 470, y: 960 },
        kind: "medical",
        label: "Recovery Case"
      },
      {
        id: 2,
        position: { x: 1640, y: 840 },
        kind: "locker",
        label: "Freight Locker"
      },
      {
        id: 3,
        position: { x: 2090, y: 690 },
        kind: "ammo",
        label: "Gate Ammo Rack"
      },
      {
        id: 4,
        position: { x: 2700, y: 1340 },
        kind: "locker",
        label: "Rail Spur Locker"
      }
    ],
    enemySpawnPoints: [
      { x: 520, y: 900 },
      { x: 700, y: 260 },
      { x: 960, y: 520 },
      { x: 1120, y: 650 },
      { x: 1180, y: 860 },
      { x: 1460, y: 1220 },
      { x: 1780, y: 980 },
      { x: 1990, y: 720 },
      { x: 1760, y: 1300 },
      { x: 1960, y: 1060 },
      { x: 2100, y: 760 },
      { x: 1540, y: 700 },
      { x: 2320, y: 860 },
      { x: 2480, y: 1280 },
      { x: 2660, y: 1540 },
      { x: 2890, y: 1440 },
      { x: 2740, y: 1760 }
    ],
    scavLayout: [
      "rusher",
      "skirmisher",
      "rusher",
      "skirmisher",
      "skirmisher",
      "rifleman",
      "skirmisher",
      "rusher",
      "rifleman",
      "skirmisher",
      "rusher",
      "rusher",
      "rifleman",
      "skirmisher",
      "rusher",
      "rifleman",
      "skirmisher",
      "rusher"
    ],
    extractionPressureSpawns: [
      { x: 1710, y: 1410 },
      { x: 1910, y: 1380 },
      { x: 2130, y: 1010 },
      { x: 1750, y: 880 }
    ],
    noiseResponseSpawns: [
      { x: 1430, y: 1420 },
      { x: 1760, y: 1380 },
      { x: 2080, y: 930 },
      { x: 1450, y: 560 },
      { x: 2400, y: 1260 },
      { x: 2800, y: 1580 }
    ],
    noiseResponseTiers: [
      {
        threshold: 2.5,
        label: "Freight Rush",
        briefing: "The south route tolerates one loud break, then fast movers start collapsing rooms behind you.",
        reinforcements: ["rusher", "skirmisher"]
      },
      {
        threshold: 4.4,
        label: "Gate Flood",
        briefing: "Keep the freight gate hot for too long and the route floods with another close-range crash wave.",
        reinforcements: ["rusher", "rusher", "rifleman"]
      }
    ],
    sceneTheme: {
      baseColor: 0x16110e,
      gridColor: 0x3d2a21,
      laneColor: 0x8b5e3c,
      laneAlpha: 0.2,
      pocketColor: 0xf97316,
      accentColor: 0xfacc15,
      shadowColor: 0x090605,
      propTint: 0xa18974
    },
    scenicProps: [
      { kind: "barrier", position: { x: 320, y: 870 }, rotation: -0.24, scale: 1.12 },
      { kind: "field-tent", position: { x: 540, y: 890 }, rotation: -0.08, scale: 1.06 },
      { kind: "field-stretcher", position: { x: 600, y: 980 }, rotation: 0.02, scale: 0.9 },
      { kind: "ambulance-wreck", position: { x: 520, y: 1030 }, rotation: 0.14, scale: 0.94 },
      { kind: "guard-shack", position: { x: 720, y: 840 }, rotation: 0.04, scale: 0.94 },
      { kind: "hesco-wall", position: { x: 700, y: 930 }, rotation: 0.12, scale: 0.98 },
      { kind: "ammo-pallet", position: { x: 650, y: 830 }, rotation: 0.1, scale: 0.9 },
      { kind: "forklift", position: { x: 820, y: 420 }, rotation: 0.42, scale: 0.98 },
      { kind: "sandbag-nest", position: { x: 930, y: 500 }, rotation: 0.18, scale: 1.04 },
      { kind: "barrier", position: { x: 1110, y: 660 }, rotation: 0.16, scale: 1.02 },
      { kind: "sandbag-nest", position: { x: 1190, y: 700 }, rotation: -0.1, scale: 0.94 },
      { kind: "crate-stack", position: { x: 1160, y: 940 }, scale: 1.08 },
      { kind: "generator", position: { x: 1350, y: 980 }, rotation: -0.08, scale: 0.96 },
      { kind: "field-tent", position: { x: 1680, y: 1010 }, rotation: 0.12, scale: 1.02 },
      { kind: "triage-canopy", position: { x: 1510, y: 980 }, rotation: 0.08, scale: 0.94 },
      { kind: "apc-hulk", position: { x: 1530, y: 1180 }, rotation: -0.18, scale: 1.04 },
      { kind: "field-stretcher", position: { x: 1580, y: 1060 }, rotation: 0.08, scale: 0.92 },
      { kind: "ambulance-wreck", position: { x: 1710, y: 1120 }, rotation: -0.22, scale: 0.98 },
      { kind: "wrecked-car", position: { x: 1600, y: 1180 }, rotation: -0.28, scale: 0.96 },
      { kind: "cargo-truck", position: { x: 1770, y: 910 }, rotation: 1.52, scale: 0.98 },
      { kind: "camo-net", position: { x: 1540, y: 1110 }, rotation: -0.12, scale: 1.02 },
      { kind: "checkpoint-gate", position: { x: 1960, y: 1180 }, rotation: 1.22, scale: 0.92 },
      { kind: "pallet-stack", position: { x: 1480, y: 1260 }, rotation: -0.06, scale: 1.1 },
      { kind: "cable-spool", position: { x: 1560, y: 860 }, rotation: 0.3, scale: 0.92 },
      { kind: "supply-rack", position: { x: 2030, y: 760 }, rotation: 0.08, scale: 0.9 },
      { kind: "floodlight", position: { x: 1760, y: 1120 }, rotation: -1.08 },
      { kind: "cargo-truck", position: { x: 1770, y: 980 }, rotation: 0.08, scale: 0.92 },
      { kind: "scrap-barricade", position: { x: 1840, y: 1010 }, rotation: -0.18, scale: 0.96 },
      { kind: "barrier", position: { x: 1960, y: 830 }, rotation: 1.18, scale: 1.08 },
      { kind: "apc-hulk", position: { x: 1990, y: 1110 }, rotation: 0.16, scale: 0.98 },
      { kind: "scrap-barricade", position: { x: 1880, y: 950 }, rotation: -0.32, scale: 1.08 },
      { kind: "razorwire-coil", position: { x: 1940, y: 1070 }, rotation: 0.18, scale: 1 },
      { kind: "crate-stack", position: { x: 2100, y: 640 }, scale: 0.94 },
      { kind: "pallet-stack", position: { x: 640, y: 1090 }, rotation: 0.08, scale: 1.04 },
      { kind: "floodlight", position: { x: 1010, y: 230 }, rotation: 0.24 },
      { kind: "sandbag-nest", position: { x: 2070, y: 1170 }, rotation: 0.1, scale: 1.12 },
      { kind: "field-tent", position: { x: 520, y: 900 }, rotation: -0.04, scale: 0.94 },
      { kind: "barrier", position: { x: 2010, y: 760 }, rotation: 0.12, scale: 1.02 },
      { kind: "cargo-truck", position: { x: 2420, y: 980 }, rotation: 1.56, scale: 1.02 },
      { kind: "apc-hulk", position: { x: 2590, y: 1380 }, rotation: -0.14, scale: 1.04 },
      { kind: "checkpoint-gate", position: { x: 2790, y: 1480 }, rotation: 1.46, scale: 0.94 },
      { kind: "sandbag-nest", position: { x: 2920, y: 1540 }, rotation: 0.1, scale: 1.08 },
      { kind: "razorwire-coil", position: { x: 2740, y: 1400 }, rotation: 0.16, scale: 1.02 },
      { kind: "field-tent", position: { x: 2500, y: 1500 }, rotation: 0.06, scale: 1 },
      { kind: "barrier", position: { x: 2470, y: 1200 }, rotation: 0.22, scale: 1.08 },
      { kind: "ammo-pallet", position: { x: 2710, y: 1290 }, rotation: 0.08, scale: 0.92 },
      { kind: "crate-stack", position: { x: 2860, y: 1670 }, scale: 1.02 }
    ],
    combatPockets: [
      { label: "Freight Cut", position: { x: 860, y: 420 }, radius: 120 },
      { label: "Triage Camp", position: { x: 540, y: 920 }, radius: 128 },
      { label: "Berm Teeth", position: { x: 1120, y: 660 }, radius: 132 },
      { label: "Gate Funnel", position: { x: 1490, y: 930 }, radius: 156 },
      { label: "Crash Lane", position: { x: 1770, y: 980 }, radius: 136 },
      { label: "Service Slot", position: { x: 2020, y: 730 }, radius: 122 },
      { label: "South Crash", position: { x: 2080, y: 1180 }, radius: 150 },
      { label: "Outer Berm", position: { x: 2440, y: 1040 }, radius: 140 },
      { label: "Rail Yard", position: { x: 2620, y: 1420 }, radius: 150 },
      { label: "Spur Gate", position: { x: 2930, y: 1540 }, radius: 164 },
      { label: "Breakwater Reach", position: { x: 3180, y: 960 }, radius: 176 }
    ]
  }
];

const WORLD_MIN_WIDTH = scaleCoord(2400);
const WORLD_MIN_HEIGHT = scaleCoord(1520);
const WORLD_BOUNDS = computeArenaExtents(
  BASE_ARENA_OBSTACLES.map(scaleObstacle),
  BASE_RAID_ROUTES.map(scaleRoute)
);

export const WORLD_WIDTH = Math.max(WORLD_BOUNDS.maxX - WORLD_BOUNDS.minX, WORLD_MIN_WIDTH);
export const WORLD_HEIGHT = Math.max(WORLD_BOUNDS.maxY - WORLD_BOUNDS.minY, WORLD_MIN_HEIGHT);
export const PLAYER_SPAWN: Vec2 = scaleVec2({ x: 240, y: 760 });
export const RAID_TIME_SECONDS = 230;
export const ARENA_OBSTACLES: ArenaObstacle[] = BASE_ARENA_OBSTACLES.map(scaleObstacle);
export const RAID_ROUTES: ReadonlyArray<RaidRouteDefinition> = BASE_RAID_ROUTES.map(scaleRoute);
