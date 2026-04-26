import * as Phaser from "phaser";
import {
  raidController,
  type FrontlineImpactState,
  type FrontlineTracerState,
  type GrenadeState
} from "./simulation";
import { WEAPONS, type WeaponId } from "./weapons";

export type CombatAudioMode = "armed" | "awaiting-gesture" | "unsupported";

type RaidState = typeof raidController.state;

export interface CombatAudioSignals {
  closeFriendlyTracers: FrontlineTracerState[];
  closeHostileTracers: FrontlineTracerState[];
  closeSuppressionImpacts: FrontlineImpactState[];
  closeBlastImpacts: FrontlineImpactState[];
  nearbyHostileGrenades: GrenadeState[];
  dominantWeaponId: WeaponId | null;
  snapBySeverity: "quiet" | "watch" | "hot";
  grenadeSeverity: "quiet" | "watch" | "urgent";
  orderCue: string;
}

export interface CombatAudioRead {
  visible: boolean;
  title: string;
  accent: string;
  borderColor: number;
  bodyColor: string;
  lines: string[];
  mode: CombatAudioMode;
  dominantWeaponId: WeaponId | null;
  snapBySeverity: CombatAudioSignals["snapBySeverity"];
  grenadeSeverity: CombatAudioSignals["grenadeSeverity"];
}

const AUDIO_NEAR_RADIUS = 760;
const SNAP_BY_RADIUS = 220;
const BLAST_RADIUS = 340;
const HOSTILE_GRENADE_RADIUS = 320;

function getDistance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
}

function getAudioCountsByWeapon(tracers: ReadonlyArray<FrontlineTracerState>): Map<WeaponId, number> {
  const counts = new Map<WeaponId, number>();
  for (const tracer of tracers) {
    counts.set(tracer.weaponId, (counts.get(tracer.weaponId) ?? 0) + 1);
  }
  return counts;
}

function getDominantWeaponId(tracers: ReadonlyArray<FrontlineTracerState>, fallbackWeaponId: WeaponId): WeaponId | null {
  const counts = getAudioCountsByWeapon(tracers);
  if (counts.size === 0) {
    return null;
  }

  let dominantWeaponId: WeaponId = fallbackWeaponId;
  let dominantCount = -1;
  for (const [weaponId, count] of counts.entries()) {
    if (count > dominantCount) {
      dominantWeaponId = weaponId;
      dominantCount = count;
    }
  }

  return dominantWeaponId;
}

function getOrderCue(state: RaidState): string {
  const selectedMate = state.squadMates.find((mate) => mate.id === state.selectedSquadMateId) ?? state.squadMates[0] ?? null;
  if (selectedMate?.tacticalAction) {
    return `${selectedMate.name} ${selectedMate.tacticalAction.actionId}`;
  }

  if (state.activeFrontlineSupportOrderId !== null) {
    return "support order live";
  }

  if (selectedMate) {
    return `${selectedMate.name} ${selectedMate.command.orderId}`;
  }

  return "boys net ready";
}

export function buildCombatAudioSignals(state: RaidState): CombatAudioSignals {
  if (state.phase !== "raid") {
    return {
      closeFriendlyTracers: [],
      closeHostileTracers: [],
      closeSuppressionImpacts: [],
      closeBlastImpacts: [],
      nearbyHostileGrenades: [],
      dominantWeaponId: null,
      snapBySeverity: "quiet",
      grenadeSeverity: "quiet",
      orderCue: "raid not live"
    };
  }

  const playerPosition = state.player.position;
  const closeFriendlyTracers = state.frontlineTracers.filter(
    (tracer) =>
      tracer.faction === "friendly" &&
      (getDistance(tracer.position, playerPosition) <= AUDIO_NEAR_RADIUS ||
        getDistance(tracer.origin, playerPosition) <= AUDIO_NEAR_RADIUS)
  );
  const closeHostileTracers = state.frontlineTracers.filter(
    (tracer) =>
      tracer.faction === "hostile" &&
      (getDistance(tracer.position, playerPosition) <= AUDIO_NEAR_RADIUS ||
        getDistance(tracer.origin, playerPosition) <= AUDIO_NEAR_RADIUS)
  );
  const closeSuppressionImpacts = state.frontlineImpacts.filter(
    (impact) =>
      impact.faction === "hostile" &&
      impact.kind === "suppression" &&
      getDistance(impact.position, playerPosition) <= SNAP_BY_RADIUS
  );
  const closeBlastImpacts = state.frontlineImpacts.filter(
    (impact) => impact.kind === "blast" && getDistance(impact.position, playerPosition) <= BLAST_RADIUS
  );
  const nearbyHostileGrenades = state.grenades.filter(
    (grenade) => grenade.faction === "hostile" && getDistance(grenade.position, playerPosition) <= HOSTILE_GRENADE_RADIUS
  );
  const dominantWeaponId = getDominantWeaponId(
    [...closeFriendlyTracers, ...closeHostileTracers],
    state.player.weaponId
  );
  const snapScore = closeHostileTracers.filter((tracer) => getDistance(tracer.position, playerPosition) <= 180).length + closeSuppressionImpacts.length;
  const snapBySeverity =
    snapScore >= 3 || state.soundPressure >= 1.2 ? "hot" : snapScore > 0 || state.soundPressure >= 0.78 ? "watch" : "quiet";
  const grenadeSeverity =
    nearbyHostileGrenades.some((grenade) => grenade.fuseTime - grenade.elapsed <= 0.24)
      ? "urgent"
      : nearbyHostileGrenades.length > 0
        ? "watch"
        : "quiet";

  return {
    closeFriendlyTracers,
    closeHostileTracers,
    closeSuppressionImpacts,
    closeBlastImpacts,
    nearbyHostileGrenades,
    dominantWeaponId,
    snapBySeverity,
    grenadeSeverity,
    orderCue: getOrderCue(state)
  };
}

export function buildCombatAudioRead(state: RaidState, mode: CombatAudioMode = "awaiting-gesture"): CombatAudioRead {
  if (state.phase !== "raid") {
    return {
      visible: false,
      title: "AUDIO READ STAGED",
      accent: "#bfdbfe",
      borderColor: 0x38bdf8,
      bodyColor: "#dbeafe",
      lines: [
        "Step into the raid to arm discharge, snap-by, and grenade reads.",
        "The panel only wakes when live combat pressure exists."
      ],
      mode,
      dominantWeaponId: null,
      snapBySeverity: "quiet",
      grenadeSeverity: "quiet"
    };
  }

  const signals = buildCombatAudioSignals(state);
  const totalNearTracers = signals.closeFriendlyTracers.length + signals.closeHostileTracers.length;
  const dominantWeaponLabel = signals.dominantWeaponId ? WEAPONS[signals.dominantWeaponId].name.toUpperCase() : "NO DOMINANT GUN";
  const snapByLabel =
    signals.snapBySeverity === "hot" ? "SNAP-BY HOT" : signals.snapBySeverity === "watch" ? "SNAP-BY WATCH" : "SNAP-BY QUIET";
  const grenadeLabel =
    signals.grenadeSeverity === "urgent"
      ? "GRENADE URGENT"
      : signals.grenadeSeverity === "watch"
        ? "GRENADE WATCH"
        : "GRENADE QUIET";
  const modeLine =
    mode === "armed"
      ? `SYNTH LIVE | ${signals.orderCue.toUpperCase()}`
      : mode === "unsupported"
        ? `BROWSER AUDIO UNAVAILABLE | ${signals.orderCue.toUpperCase()}`
        : `CLICK CANVAS / PRESS KEY TO ARM | ${signals.orderCue.toUpperCase()}`;

  let title = "COMBAT AUDIO LIVE";
  let accent = "#bfdbfe";
  let borderColor = 0x38bdf8;
  let bodyColor = "#dbeafe";

  if (signals.grenadeSeverity === "urgent" || signals.snapBySeverity === "hot" || signals.closeBlastImpacts.length > 0) {
    title = "COMBAT AUDIO HOT";
    accent = "#fecaca";
    borderColor = 0xfb7185;
    bodyColor = "#fee2e2";
  } else if (signals.snapBySeverity === "watch" || signals.grenadeSeverity === "watch" || totalNearTracers > 0) {
    title = "COMBAT AUDIO WATCH";
    accent = "#fde68a";
    borderColor = 0xf59e0b;
    bodyColor = "#fef3c7";
  }

  return {
    visible: totalNearTracers > 0 || signals.nearbyHostileGrenades.length > 0 || state.soundPressure >= 0.58 || signals.closeBlastImpacts.length > 0,
    title,
    accent,
    borderColor,
    bodyColor,
    lines: [
      `${dominantWeaponLabel} | ${signals.closeFriendlyTracers.length} friendly crack${signals.closeFriendlyTracers.length === 1 ? "" : "s"} | ${signals.closeHostileTracers.length} hostile crack${signals.closeHostileTracers.length === 1 ? "" : "s"}`,
      `${snapByLabel} | ${grenadeLabel} | ${signals.closeBlastImpacts.length} blast${signals.closeBlastImpacts.length === 1 ? "" : "s"}`,
      `${modeLine} | noise ${state.soundPressure.toFixed(2)}`
    ],
    mode,
    dominantWeaponId: signals.dominantWeaponId,
    snapBySeverity: signals.snapBySeverity,
    grenadeSeverity: signals.grenadeSeverity
  };
}

interface ShotVoiceConfig {
  frequency: number;
  tailFrequency: number;
  duration: number;
  gain: number;
  type: OscillatorType;
  crackFrequency: number;
}

function getShotVoiceConfig(weaponId: WeaponId): ShotVoiceConfig {
  if (weaponId === "pistol") {
    return { frequency: 360, tailFrequency: 170, duration: 0.055, gain: 0.038, type: "square", crackFrequency: 2400 };
  }

  if (weaponId === "smg") {
    return { frequency: 220, tailFrequency: 104, duration: 0.045, gain: 0.028, type: "square", crackFrequency: 2100 };
  }

  if (weaponId === "shotgun") {
    return { frequency: 132, tailFrequency: 58, duration: 0.11, gain: 0.055, type: "triangle", crackFrequency: 1550 };
  }

  if (weaponId === "pkm") {
    return { frequency: 84, tailFrequency: 40, duration: 0.09, gain: 0.048, type: "square", crackFrequency: 1500 };
  }

  if (weaponId === "amr") {
    return { frequency: 70, tailFrequency: 28, duration: 0.16, gain: 0.065, type: "sawtooth", crackFrequency: 1300 };
  }

  return { frequency: 186, tailFrequency: 82, duration: 0.075, gain: 0.042, type: "sawtooth", crackFrequency: 1900 };
}

export class CombatAudioEngine {
  private scene: Phaser.Scene;
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private armed = false;
  private supported = false;
  private knownTracerIds = new Set<number>();
  private knownImpactIds = new Set<number>();
  private warnedGrenades = new Set<number>();
  private shotCooldowns = new Map<string, number>();
  private lastTensionPulseAt = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.supported =
      typeof window !== "undefined" &&
      ("AudioContext" in window || "webkitAudioContext" in (window as Window & { webkitAudioContext?: unknown }));

    if (!this.supported) {
      return;
    }

    this.scene.input.on(Phaser.Input.Events.POINTER_DOWN, this.arm, this);
    this.scene.input.keyboard?.on(Phaser.Input.Keyboard.Events.ANY_KEY_DOWN, this.arm, this);
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    this.scene.events.once(Phaser.Scenes.Events.DESTROY, this.destroy, this);
  }

  public getMode(): CombatAudioMode {
    if (!this.supported) {
      return "unsupported";
    }

    return this.armed ? "armed" : "awaiting-gesture";
  }

  public update(state: RaidState): void {
    if (!this.supported || !this.context || !this.masterGain || this.context.state !== "running" || state.phase !== "raid") {
      return;
    }

    const activeTracerIds = new Set(state.frontlineTracers.map((tracer) => tracer.id));
    const activeImpactIds = new Set(state.frontlineImpacts.map((impact) => impact.id));
    const activeGrenadeIds = new Set(state.grenades.map((grenade) => grenade.id));
    this.knownTracerIds.forEach((id) => {
      if (!activeTracerIds.has(id)) {
        this.knownTracerIds.delete(id);
      }
    });
    this.knownImpactIds.forEach((id) => {
      if (!activeImpactIds.has(id)) {
        this.knownImpactIds.delete(id);
      }
    });
    this.warnedGrenades.forEach((id) => {
      if (!activeGrenadeIds.has(id)) {
        this.warnedGrenades.delete(id);
      }
    });

    for (const tracer of state.frontlineTracers) {
      if (this.knownTracerIds.has(tracer.id)) {
        continue;
      }
      this.knownTracerIds.add(tracer.id);
      const distance = Math.min(
        getDistance(tracer.position, state.player.position),
        getDistance(tracer.origin, state.player.position)
      );
      if (distance > AUDIO_NEAR_RADIUS) {
        continue;
      }
      this.playShot(tracer.weaponId, tracer.faction, distance, tracer.position.x - state.player.position.x);
    }

    for (const impact of state.frontlineImpacts) {
      if (this.knownImpactIds.has(impact.id)) {
        continue;
      }
      this.knownImpactIds.add(impact.id);
      const distance = getDistance(impact.position, state.player.position);
      if (distance > BLAST_RADIUS) {
        continue;
      }
      if (impact.kind === "blast") {
        this.playBlast(distance, impact.position.x - state.player.position.x);
      } else if (impact.kind === "suppression" && impact.faction === "hostile") {
        this.playSnapBy(distance, impact.position.x - state.player.position.x);
      }
    }

    for (const grenade of state.grenades) {
      if (grenade.faction !== "hostile") {
        continue;
      }
      const distance = getDistance(grenade.position, state.player.position);
      if (distance > HOSTILE_GRENADE_RADIUS) {
        continue;
      }
      const remaining = grenade.fuseTime - grenade.elapsed;
      if (remaining <= 0.24 && !this.warnedGrenades.has(grenade.id)) {
        this.warnedGrenades.add(grenade.id);
        this.playGrenadeWarning(distance, grenade.position.x - state.player.position.x, remaining <= 0.12);
      }
    }

    if (state.soundPressure >= 1.45 && this.context.currentTime - this.lastTensionPulseAt >= 0.78) {
      this.lastTensionPulseAt = this.context.currentTime;
      this.playTensionPulse(state.soundPressure);
    }
  }

  public async arm(): Promise<void> {
    if (!this.supported) {
      return;
    }

    if (!this.context) {
      const AudioContextCtor =
        window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextCtor) {
        this.supported = false;
        return;
      }
      this.context = new AudioContextCtor();
      this.masterGain = this.context.createGain();
      this.masterGain.gain.value = 0.16;
      this.masterGain.connect(this.context.destination);
      this.noiseBuffer = this.createNoiseBuffer(0.24);
    }

    if (this.context.state !== "running") {
      await this.context.resume();
    }

    this.armed = this.context.state === "running";
  }

  public destroy(): void {
    this.scene.input.off(Phaser.Input.Events.POINTER_DOWN, this.arm, this);
    this.scene.input.keyboard?.off(Phaser.Input.Keyboard.Events.ANY_KEY_DOWN, this.arm, this);
    void this.context?.close();
    this.context = null;
    this.masterGain = null;
    this.noiseBuffer = null;
    this.armed = false;
  }

  private createNoiseBuffer(durationSeconds: number): AudioBuffer | null {
    if (!this.context) {
      return null;
    }

    const frameCount = Math.max(1, Math.floor(this.context.sampleRate * durationSeconds));
    const buffer = this.context.createBuffer(1, frameCount, this.context.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let index = 0; index < frameCount; index += 1) {
      channel[index] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  private createStereoNode(offsetX: number): AudioNode {
    if (!this.context || !this.masterGain) {
      throw new Error("Combat audio graph is not ready.");
    }

    if (typeof this.context.createStereoPanner === "function") {
      const panner = this.context.createStereoPanner();
      panner.pan.value = Phaser.Math.Clamp(offsetX / 420, -1, 1);
      panner.connect(this.masterGain);
      return panner;
    }

    return this.masterGain;
  }

  private playShot(
    weaponId: WeaponId,
    faction: "friendly" | "hostile",
    distance: number,
    offsetX: number
  ): void {
    if (!this.context || !this.masterGain) {
      return;
    }

    const config = getShotVoiceConfig(weaponId);
    const now = this.context.currentTime;
    const cooldownKey = `${faction}:${weaponId}`;
    const minInterval = weaponId === "smg" ? 0.028 : weaponId === "pkm" ? 0.04 : weaponId === "shotgun" ? 0.12 : 0.055;
    if ((this.shotCooldowns.get(cooldownKey) ?? 0) > now) {
      return;
    }
    this.shotCooldowns.set(cooldownKey, now + minInterval);

    const gainAmount = config.gain * Phaser.Math.Clamp(1 - distance / 980, 0.15, 1) * (faction === "hostile" ? 0.92 : 1);
    const carrier = this.context.createOscillator();
    carrier.type = config.type;
    carrier.frequency.setValueAtTime(config.frequency * (faction === "hostile" ? 0.94 : 1.04), now);
    carrier.frequency.exponentialRampToValueAtTime(config.tailFrequency, now + config.duration);

    const filter = this.context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(config.crackFrequency * 1.2, now);
    filter.frequency.exponentialRampToValueAtTime(config.crackFrequency, now + config.duration);

    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainAmount, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + config.duration);

    const output = this.createStereoNode(offsetX);
    carrier.connect(filter);
    filter.connect(gain);
    gain.connect(output);
    carrier.start(now);
    carrier.stop(now + config.duration + 0.01);

    if (!this.noiseBuffer) {
      return;
    }

    const crack = this.context.createBufferSource();
    crack.buffer = this.noiseBuffer;
    const crackFilter = this.context.createBiquadFilter();
    crackFilter.type = "bandpass";
    crackFilter.frequency.setValueAtTime(config.crackFrequency, now);
    crackFilter.Q.value = 0.8;
    const crackGain = this.context.createGain();
    crackGain.gain.setValueAtTime(gainAmount * 0.42, now);
    crackGain.gain.exponentialRampToValueAtTime(0.0001, now + Math.min(0.06, config.duration));
    crack.connect(crackFilter);
    crackFilter.connect(crackGain);
    crackGain.connect(output);
    crack.start(now);
    crack.stop(now + Math.min(0.08, config.duration));
  }

  private playSnapBy(distance: number, offsetX: number): void {
    if (!this.context || !this.masterGain || !this.noiseBuffer) {
      return;
    }

    const now = this.context.currentTime;
    const noise = this.context.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = this.context.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(2800, now);
    filter.Q.value = 1.2;
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0.018 * Phaser.Math.Clamp(1 - distance / 280, 0.18, 1), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    const output = this.createStereoNode(offsetX);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(output);
    noise.start(now);
    noise.stop(now + 0.09);
  }

  private playBlast(distance: number, offsetX: number): void {
    if (!this.context || !this.masterGain || !this.noiseBuffer) {
      return;
    }

    const now = this.context.currentTime;
    const osc = this.context.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(74, now);
    osc.frequency.exponentialRampToValueAtTime(34, now + 0.18);
    const oscGain = this.context.createGain();
    oscGain.gain.setValueAtTime(0.03 * Phaser.Math.Clamp(1 - distance / 420, 0.2, 1), now);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
    const output = this.createStereoNode(offsetX);
    osc.connect(oscGain);
    oscGain.connect(output);
    osc.start(now);
    osc.stop(now + 0.22);

    const noise = this.context.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = this.context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(520, now);
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0.04 * Phaser.Math.Clamp(1 - distance / 420, 0.15, 1), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(output);
    noise.start(now);
    noise.stop(now + 0.24);
  }

  private playGrenadeWarning(distance: number, offsetX: number, critical: boolean): void {
    if (!this.context || !this.masterGain) {
      return;
    }

    const now = this.context.currentTime;
    const osc = this.context.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(critical ? 1180 : 920, now);
    osc.frequency.exponentialRampToValueAtTime(critical ? 760 : 640, now + 0.08);
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0.016 * Phaser.Math.Clamp(1 - distance / HOSTILE_GRENADE_RADIUS, 0.22, 1), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
    const output = this.createStereoNode(offsetX);
    osc.connect(gain);
    gain.connect(output);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  private playTensionPulse(soundPressure: number): void {
    if (!this.context || !this.masterGain) {
      return;
    }

    const now = this.context.currentTime;
    const osc = this.context.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(96, now);
    osc.frequency.exponentialRampToValueAtTime(58, now + 0.22);
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0.009 + Math.min(0.012, soundPressure * 0.003), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.25);
  }
}
