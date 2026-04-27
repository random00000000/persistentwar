import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { deflateSync } from "node:zlib";

const root = process.cwd();
const assetRoot = join(root, "assets", "frontline-officer");

function crc32(buffer) {
  let crc = 0xffffffff;
  for (let index = 0; index < buffer.length; index += 1) {
    crc ^= buffer[index];
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function hexToRgba(hex, alpha = 255) {
  const value = hex.replace("#", "");
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
    alpha
  ];
}

function createCanvas(width, height) {
  const pixels = new Uint8ClampedArray(width * height * 4);
  return {
    width,
    height,
    pixels,
    rect(x, y, w, h, color, alpha = 255) {
      const rgba = hexToRgba(color, alpha);
      for (let yy = Math.max(0, Math.floor(y)); yy < Math.min(height, Math.ceil(y + h)); yy += 1) {
        for (let xx = Math.max(0, Math.floor(x)); xx < Math.min(width, Math.ceil(x + w)); xx += 1) {
          const i = (yy * width + xx) * 4;
          pixels[i] = rgba[0];
          pixels[i + 1] = rgba[1];
          pixels[i + 2] = rgba[2];
          pixels[i + 3] = rgba[3];
        }
      }
    },
    ellipse(cx, cy, rx, ry, color, alpha = 255) {
      const rgba = hexToRgba(color, alpha);
      for (let yy = Math.max(0, Math.floor(cy - ry)); yy < Math.min(height, Math.ceil(cy + ry)); yy += 1) {
        for (let xx = Math.max(0, Math.floor(cx - rx)); xx < Math.min(width, Math.ceil(cx + rx)); xx += 1) {
          const nx = (xx + 0.5 - cx) / rx;
          const ny = (yy + 0.5 - cy) / ry;
          if (nx * nx + ny * ny <= 1) {
            const i = (yy * width + xx) * 4;
            pixels[i] = rgba[0];
            pixels[i + 1] = rgba[1];
            pixels[i + 2] = rgba[2];
            pixels[i + 3] = rgba[3];
          }
        }
      }
    },
    line(x0, y0, x1, y1, thickness, color, alpha = 255) {
      const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
      for (let step = 0; step <= steps; step += 1) {
        const t = step / steps;
        this.ellipse(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, thickness, thickness, color, alpha);
      }
    },
    patternRect(x, y, w, h, colors, cell = 4) {
      for (let yy = y; yy < y + h; yy += cell) {
        for (let xx = x; xx < x + w; xx += cell) {
          const pick = Math.abs(Math.floor(xx / cell) * 17 + Math.floor(yy / cell) * 31) % colors.length;
          this.rect(xx, yy, cell, cell, colors[pick]);
        }
      }
    }
  };
}

function writePng(path, canvas) {
  mkdirSync(dirname(path), { recursive: true });
  const raw = Buffer.alloc((canvas.width * 4 + 1) * canvas.height);
  for (let y = 0; y < canvas.height; y += 1) {
    const rowStart = y * (canvas.width * 4 + 1);
    raw[rowStart] = 0;
    for (let x = 0; x < canvas.width; x += 1) {
      const source = (y * canvas.width + x) * 4;
      const target = rowStart + 1 + x * 4;
      raw[target] = canvas.pixels[source];
      raw[target + 1] = canvas.pixels[source + 1];
      raw[target + 2] = canvas.pixels[source + 2];
      raw[target + 3] = canvas.pixels[source + 3];
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(canvas.width, 0);
  ihdr.writeUInt32BE(canvas.height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0))
  ]);
  writeFileSync(path, png);
}

function campCore(path, palette) {
  const c = createCanvas(160, 144);
  c.ellipse(80, 112, 70, 22, "#020617", 70);
  c.patternRect(30, 55, 100, 52, palette.roof, 5);
  c.rect(24, 92, 112, 28, palette.wall);
  c.rect(36, 100, 18, 20, palette.dark);
  c.rect(98, 99, 26, 14, palette.light);
  c.rect(44, 45, 72, 15, palette.dark);
  c.line(24, 92, 78, 44, 4, palette.trim);
  c.line(136, 92, 82, 44, 4, palette.trim);
  c.rect(128, 54, 9, 61, palette.mast);
  c.rect(136, 58, 17, 10, palette.accent);
  c.rect(14, 106, 34, 12, palette.sand);
  c.rect(111, 112, 36, 11, palette.sand);
  writePng(path, c);
}

function campTent(path, palette) {
  const c = createCanvas(112, 96);
  c.ellipse(56, 78, 43, 13, "#020617", 70);
  c.patternRect(21, 32, 70, 34, palette.fabric, 4);
  c.line(18, 64, 56, 24, 4, palette.trim);
  c.line(94, 64, 56, 24, 4, palette.trim);
  c.rect(21, 64, 70, 14, palette.dark);
  c.rect(50, 55, 12, 24, palette.door);
  c.rect(69, 45, 18, 8, palette.accent);
  writePng(path, c);
}

function supplyDump(path, palette) {
  const c = createCanvas(128, 112);
  c.ellipse(64, 91, 52, 15, "#020617", 68);
  c.rect(22, 53, 34, 28, palette.crate);
  c.rect(57, 45, 43, 36, palette.crate2);
  c.rect(40, 28, 59, 20, palette.tarp);
  c.rect(28, 84, 80, 12, palette.dark);
  c.rect(26, 58, 26, 5, palette.light);
  c.rect(62, 52, 30, 5, palette.light);
  c.rect(76, 29, 18, 8, palette.accent);
  writePng(path, c);
}

function truck(path, palette) {
  const c = createCanvas(144, 96);
  c.ellipse(73, 76, 56, 13, "#020617", 70);
  c.rect(26, 36, 70, 33, palette.body);
  c.rect(92, 42, 27, 25, palette.cab);
  c.rect(99, 45, 15, 9, palette.window);
  c.rect(33, 41, 49, 9, palette.cover);
  c.rect(45, 69, 16, 10, "#111827");
  c.rect(96, 68, 15, 10, "#111827");
  c.rect(112, 54, 14, 6, palette.accent);
  writePng(path, c);
}

function foliageSheet(path) {
  const c = createCanvas(256, 128);
  const greens = ["#172916", "#254322", "#315d2c", "#4a7c3f"];
  for (let i = 0; i < 8; i += 1) {
    const ox = (i % 4) * 64;
    const oy = Math.floor(i / 4) * 64;
    c.ellipse(ox + 32, oy + 48, 23, 8, "#020617", 54);
    for (let n = 0; n < 9; n += 1) {
      const x = ox + 16 + ((n * 13 + i * 7) % 34);
      const y = oy + 16 + ((n * 11 + i * 5) % 27);
      c.ellipse(x, y, 9 + (n % 3) * 3, 7 + (n % 2) * 3, greens[(n + i) % greens.length], 235);
    }
    c.line(ox + 30, oy + 25, ox + 33, oy + 53, 2, "#3b2a1f", 255);
  }
  writePng(path, c);
}

function environmentSheet(path) {
  const c = createCanvas(256, 128);
  const origins = [
    [0, 0],
    [64, 0],
    [128, 0],
    [192, 0],
    [0, 64],
    [64, 64],
    [128, 64],
    [192, 64]
  ];
  origins.forEach(([ox, oy], i) => {
    c.ellipse(ox + 32, oy + 49, 26, 9, "#020617", 56);
    if (i === 0) {
      c.patternRect(ox + 9, oy + 18, 45, 26, ["#5a3a25", "#6f4a30", "#8a6242"], 5);
      c.rect(ox + 18, oy + 14, 30, 7, "#2b2119");
    } else if (i === 1) {
      c.line(ox + 15, oy + 36, ox + 51, oy + 30, 4, "#4b5563");
      c.line(ox + 17, oy + 44, ox + 51, oy + 38, 4, "#64748b");
      c.rect(ox + 13, oy + 26, 43, 7, "#1f2937");
    } else if (i === 2) {
      c.ellipse(ox + 32, oy + 31, 24, 16, "#4b2e23", 230);
      c.ellipse(ox + 32, oy + 31, 16, 9, "#2a1b13", 230);
      c.rect(ox + 11, oy + 43, 42, 5, "#70543a");
    } else if (i === 3) {
      c.line(ox + 8, oy + 38, ox + 56, oy + 28, 3, "#475569");
      c.line(ox + 14, oy + 47, ox + 51, oy + 17, 3, "#64748b");
      c.ellipse(ox + 21, oy + 30, 8, 8, "#94a3b8", 200);
    } else if (i === 4) {
      c.rect(ox + 15, oy + 24, 34, 25, "#3a2419");
      c.rect(ox + 20, oy + 20, 25, 7, "#1f2937");
      c.rect(ox + 24, oy + 28, 16, 8, "#6b422b");
    } else if (i === 5) {
      c.line(ox + 8, oy + 29, ox + 55, oy + 37, 3, "#0f172a");
      c.line(ox + 10, oy + 39, ox + 55, oy + 31, 3, "#334155");
      c.rect(ox + 21, oy + 24, 25, 21, "#475569");
    } else if (i === 6) {
      c.ellipse(ox + 22, oy + 34, 10, 13, "#6b7280", 240);
      c.ellipse(ox + 38, oy + 31, 13, 16, "#4b5563", 240);
      c.rect(ox + 17, oy + 42, 32, 6, "#1f2937");
    } else {
      c.patternRect(ox + 10, oy + 25, 44, 18, ["#493421", "#60462e", "#7a5d3c"], 4);
      c.rect(ox + 10, oy + 43, 44, 5, "#2c1d13");
    }
  });
  writePng(path, c);
}

const ukrainian = {
  roof: ["#314d2f", "#3f6539", "#547a45"],
  fabric: ["#2c4a2e", "#40643a", "#5d7b47"],
  wall: "#34423e",
  dark: "#17201d",
  light: "#98b0a2",
  trim: "#91a778",
  accent: "#facc15",
  mast: "#cbd5e1",
  sand: "#8b7a55",
  door: "#111827",
  crate: "#6b5f3a",
  crate2: "#4c5d35",
  tarp: "#1d4ed8",
  body: "#40583a",
  cab: "#31412f",
  window: "#93c5fd",
  cover: "#2f4730"
};

const russian = {
  roof: ["#3d4636", "#505d43", "#687052"],
  fabric: ["#404936", "#5b6349", "#72775a"],
  wall: "#3d4540",
  dark: "#20251f",
  light: "#b7b0a1",
  trim: "#8a7f66",
  accent: "#d1d5db",
  mast: "#cbd5e1",
  sand: "#7a6b4d",
  door: "#111827",
  crate: "#6b533b",
  crate2: "#556045",
  tarp: "#5a1f1f",
  body: "#4e573f",
  cab: "#3f4737",
  window: "#a7b0a2",
  cover: "#343d30"
};

campCore(join(assetRoot, "ukrainian-camp", "ukrainian_command_core_160x144.png"), ukrainian);
campTent(join(assetRoot, "ukrainian-camp", "ukrainian_barracks_tent_112x96.png"), ukrainian);
supplyDump(join(assetRoot, "ukrainian-camp", "ukrainian_supply_dump_128x112.png"), ukrainian);
truck(join(assetRoot, "ukrainian-camp", "ukrainian_logistics_truck_144x96.png"), ukrainian);

campCore(join(assetRoot, "russian-camp", "russian_command_core_160x144.png"), russian);
campTent(join(assetRoot, "russian-camp", "russian_barracks_tent_112x96.png"), russian);
supplyDump(join(assetRoot, "russian-camp", "russian_supply_dump_128x112.png"), russian);
truck(join(assetRoot, "russian-camp", "russian_motor_pool_truck_144x96.png"), russian);

foliageSheet(join(assetRoot, "environment", "frontline_foliage_sheet_256x128.png"));
environmentSheet(join(assetRoot, "environment", "frontline_environment_props_256x128.png"));

writeFileSync(
  join(assetRoot, "ukrainian-camp", "manifest.json"),
  `${JSON.stringify(
    {
      pack: "frontline-officer-ukrainian-camp",
      factionUse: "Fictional enemy-side camp with Ukrainian-side visual read; no real unit marks or slogans.",
      files: [
        "ukrainian_command_core_160x144.png",
        "ukrainian_barracks_tent_112x96.png",
        "ukrainian_supply_dump_128x112.png",
        "ukrainian_logistics_truck_144x96.png"
      ]
    },
    null,
    2
  )}\n`
);

writeFileSync(
  join(assetRoot, "environment", "manifest.json"),
  `${JSON.stringify(
    {
      pack: "frontline-officer-environment",
      role: "Top-down foliage and battlefield environmental scatter for the first-town war slice.",
      spriteSheets: [
        { file: "frontline_foliage_sheet_256x128.png", frameSize: [64, 64], frames: 8 },
        { file: "frontline_environment_props_256x128.png", frameSize: [64, 64], frames: 8 }
      ]
    },
    null,
    2
  )}\n`
);

console.log("Generated Frontline Officer global art assets.");
