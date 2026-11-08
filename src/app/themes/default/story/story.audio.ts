import type { SceneCue } from './scene/scene';
import { midiToHz, Mood, notesAt, NoteEvent, resume, STEP_S } from './story.music.logic';

/**
 * Música y efectos de un nivel, sintetizados con Web Audio: sin archivos.
 *
 * La música la programa main con un `setTimeout` que agenda un poquito por
 * delante. Si main se congela, nadie agenda y la música se corta de verdad;
 * al soltarse sigue desde ahora (`resume`). Es la misma lección que el reloj
 * y el pulso, pero con el oído.
 */
export interface LevelAudio {
  /** Cambia lo que suena según la situación. */
  mood(mood: Mood): void;
  /** Un efecto de sonido. */
  cue(cue: AudioCue): void;
  setMuted(muted: boolean): void;
  /**
   * Suelta el sonido retenido (`held`). Llamarlo dentro del clic de la persona;
   * resuelve cuando ya suena (los efectos de antes se pierden).
   */
  start(): Promise<void>;
  destroy(): void;
}

/** Los efectos: los de la escena, más los de la pantalla. */
export type AudioCue = SceneCue | { kind: 'choose' } | { kind: 'win' };

const LOOKAHEAD_S = 0.12;
const TICK_MS = 25;

/** La preferencia de sonido de la persona (`'off'` = silencio), recordada entre visitas. */
export const SOUND_KEY = 'wwp-story-sound';

/**
 * Si la persona ya tocó algo en esta página. Desde ese toque el navegador deja
 * sonar, aunque el audio se cree después (al entrar a un nivel desde el mapa).
 * Sin la API, se asume que no: mejor pedir el toque de más que quedar mudo.
 */
export function pageWasTouched(): boolean {
  return !!(navigator as { userActivation?: { hasBeenActive: boolean } }).userActivation
    ?.hasBeenActive;
}

/**
 * Un arpegio corto que sube, para el play del mapa: confirma con el oído que
 * el sonido quedó activado. Va dentro del clic; su contexto se cierra solo.
 */
export function playChime(): void {
  const Ctx = globalThis.AudioContext;
  if (!Ctx) return;
  const ctx = new Ctx();
  const t = ctx.currentTime + 0.02;
  [72, 79, 84, 88].forEach((m, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const at = t + i * 0.08;
    o.type = 'sine';
    o.frequency.value = midiToHz(m);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(0.22, at + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.9);
    o.connect(g).connect(ctx.destination);
    o.start(at);
    o.stop(at + 0.95);
  });
  setTimeout(() => void ctx.close(), 1600);
}

/**
 * Con `held`, nada suena hasta `start()` (la intro con el botón de jugar): si
 * se llegó con un clic el navegador ya dejaría sonar, pero la música tiene que
 * arrancar con el play, no debajo de la intro.
 */
export function createLevelAudio(muted: boolean, held = false): LevelAudio | null {
  const Ctx = globalThis.AudioContext;
  if (!Ctx) return null;
  const ctx = new Ctx();
  let isMuted = muted;
  let isHeld = held;
  if (held) void ctx.suspend();
  const master = ctx.createGain();
  master.gain.value = muted ? 0 : 0.7;
  master.connect(ctx.destination);
  const musicBus = ctx.createGain();
  musicBus.gain.value = 0.32;
  musicBus.connect(master);
  const sfxBus = ctx.createGain();
  sfxBus.gain.value = 0.8;
  sfxBus.connect(master);

  // El navegador no deja sonar hasta que la persona toca algo. Si se llegó con
  // un clic (desde el mapa) ya se puede; si no, arranca con el primer toque.
  const unlock = () => {
    if (ctx.state === 'suspended' && !isMuted && !isHeld) void ctx.resume();
  };
  addEventListener('pointerdown', unlock, true);
  addEventListener('keydown', unlock, true);

  const noise = (() => {
    const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  })();

  // ── Piezas ──
  /** Una envolvente rápida: ataque, caída exponencial. */
  const env = (at: number, peak: number, decay: number, attack = 0.005) => {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(peak, at + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay);
    return g;
  };
  const panTo = (node: AudioNode, pan: number, bus: AudioNode) => {
    const p = ctx.createStereoPanner();
    p.pan.value = pan;
    node.connect(p).connect(bus);
  };
  const tone = (
    type: OscillatorType,
    freq: number,
    at: number,
    peak: number,
    decay: number,
    bus: AudioNode,
    pan = 0,
    glideTo?: number,
  ) => {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, at);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, at + decay);
    const g = env(at, peak, decay);
    o.connect(g);
    panTo(g, pan, bus);
    o.start(at);
    o.stop(at + decay + 0.05);
    return o;
  };
  const hiss = (
    at: number,
    peak: number,
    decay: number,
    filter: BiquadFilterType,
    freq: number,
  ) => {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const f = ctx.createBiquadFilter();
    f.type = filter;
    f.frequency.value = freq;
    const g = env(at, peak, decay, 0.002);
    src.connect(f).connect(g).connect(sfxBus);
    src.start(at, Math.random() * 0.5);
    src.stop(at + decay + 0.05);
  };

  // ── Voces de la música ──
  const play = (n: NoteEvent, at: number) => {
    const dur = n.steps * STEP_S;
    switch (n.voice) {
      case 'lead': {
        // Marimba: fundamental redonda y un armónico de golpe que se apaga rápido.
        const f = midiToHz(n.midi);
        tone('sine', f, at, 0.5, dur * 1.6, musicBus, -0.35);
        tone('sine', f * 4, at, 0.12, 0.08, musicBus, -0.35);
        break;
      }
      case 'bass':
        tone('triangle', midiToHz(n.midi), at, 0.55, dur * 0.9, musicBus, -0.1);
        break;
      case 'shaker': {
        const src = ctx.createBufferSource();
        src.buffer = noise;
        const f = ctx.createBiquadFilter();
        f.type = 'highpass';
        f.frequency.value = 6500;
        const g = env(at, 0.18, 0.05, 0.002);
        src.connect(f).connect(g);
        panTo(g, -0.2, musicBus);
        src.start(at, Math.random() * 0.5);
        src.stop(at + 0.1);
        break;
      }
      case 'worker': {
        // El worker: un arpegio cuadrado y suave, a la derecha (donde está).
        const o = ctx.createOscillator();
        o.type = 'square';
        o.frequency.value = midiToHz(n.midi);
        const f = ctx.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.value = 1700;
        const g = env(at, 0.16, dur * 1.4);
        o.connect(f).connect(g);
        panTo(g, 0.45, musicBus);
        o.start(at);
        o.stop(at + dur * 1.4 + 0.05);
        break;
      }
      case 'bell': {
        const f = midiToHz(n.midi);
        tone('sine', f, at, 0.22, 1.4, musicBus, 0.1);
        tone('sine', f * 2.76, at, 0.06, 0.5, musicBus, 0.1);
        break;
      }
    }
  };

  // ── El reloj de la música: lo lleva main ──
  let currentMood: Mood = 'main';
  let step = 0;
  let nextTime = ctx.currentTime + 0.1;
  let timer = 0;
  const schedule = () => {
    if (ctx.state === 'running') {
      nextTime = resume(nextTime, ctx.currentTime);
      while (nextTime < ctx.currentTime + LOOKAHEAD_S) {
        for (const n of notesAt(step, currentMood)) play(n, nextTime);
        step++;
        nextTime += STEP_S;
      }
    }
    timer = window.setTimeout(schedule, TICK_MS);
  };
  schedule();

  // ── Efectos ──
  const sfx = (c: AudioCue) => {
    const t = ctx.currentTime + 0.005;
    switch (c.kind) {
      case 'hit': {
        // Golpe: un bombo que baja y un poco de polvo.
        const f = Math.min(c.force, 1);
        tone('sine', 150, t, 0.25 + f * 0.6, 0.18 + f * 0.2, sfxBus, 0, 45);
        hiss(t, 0.05 + f * 0.25, 0.12 + f * 0.15, 'lowpass', 900);
        break;
      }
      case 'poke':
        if (c.who === 'worker') {
          // Bip-bop de máquina.
          tone('square', 988, t, 0.12, 0.07, sfxBus, 0.4);
          tone('square', 740, t + 0.08, 0.12, 0.09, sfxBus, 0.4);
        } else if (c.angry) {
          tone('sawtooth', 160, t, 0.18, 0.22, sfxBus, -0.3, 110);
        } else {
          // Boing de gelatina.
          const o = tone('sine', 260, t, 0.45, 0.32, sfxBus, -0.3);
          o.frequency.exponentialRampToValueAtTime(620, t + 0.07);
          o.frequency.exponentialRampToValueAtTime(380, t + 0.3);
        }
        break;
      case 'twinkle':
        tone('sine', 1760, t, 0.12, 0.25, sfxBus, 0.2);
        tone('sine', 2637, t + 0.05, 0.08, 0.25, sfxBus, 0.2);
        break;
      case 'lamp':
        tone('sine', 1320, t, 0.22, 0.9, sfxBus);
        tone('sine', 3560, t, 0.06, 0.3, sfxBus);
        break;
      case 'lift':
        tone('sine', 380, t, 0.25, 0.42, sfxBus, -0.3, 900);
        break;
      case 'spill':
        // Las pelotas del malabar rebotan por el piso.
        for (let i = 0; i < 5; i++) tone('sine', 520 - i * 40, t + i * 0.11, 0.2, 0.06, sfxBus);
        break;
      case 'fall':
        // Silbido de caída de dibujo animado.
        tone('sine', 1500, t, 0.18, 0.42, sfxBus, -0.2, 320);
        break;
      case 'thaw':
        // Hielo que se quiebra y un "brrr".
        hiss(t, 0.35, 0.25, 'highpass', 3000);
        for (let i = 0; i < 6; i++) tone('square', 120, t + 0.05 + i * 0.045, 0.06, 0.035, sfxBus);
        break;
      case 'door':
        tone('sawtooth', 170, t, 0.07, 0.35, sfxBus, 0.6, 240);
        break;
      case 'catch':
        tone('triangle', 784, t, 0.25, 0.12, sfxBus, 0.3);
        tone('triangle', 988, t + 0.07, 0.25, 0.18, sfxBus, 0.3);
        break;
      case 'deliver':
        [84, 88, 91, 96].forEach((m, i) =>
          tone('sine', midiToHz(m), t + i * 0.07, 0.2, 0.35, sfxBus, 0.2),
        );
        break;
      case 'fumble':
        [55, 54, 53].forEach((m, i) =>
          tone('sawtooth', midiToHz(m), t + i * 0.22, 0.1, 0.2, sfxBus, 0.3),
        );
        break;
      case 'cheer':
        hiss(t, 0.15, 0.4, 'highpass', 5000);
        break;
      case 'choose':
        tone('sine', 520, t, 0.2, 0.09, sfxBus, 0, 900);
        break;
      case 'win':
        // Fanfarria: arpegio que sube y un acorde que queda.
        [72, 76, 79, 84].forEach((m, i) =>
          tone('square', midiToHz(m), t + i * 0.09, 0.08, 0.16, sfxBus),
        );
        for (const m of [72, 76, 79, 84])
          tone('triangle', midiToHz(m), t + 0.36, 0.14, 1.1, sfxBus);
        break;
    }
  };

  return {
    mood(mood) {
      currentMood = mood;
    },
    cue(c) {
      if (!isMuted && ctx.state === 'running') sfx(c);
    },
    setMuted(m) {
      isMuted = m;
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setTargetAtTime(m ? 0 : 0.7, now, 0.05);
      if (!m && !isHeld) void ctx.resume();
    },
    async start() {
      isHeld = false;
      if (!isMuted && ctx.state === 'suspended') await ctx.resume();
    },
    destroy() {
      clearTimeout(timer);
      removeEventListener('pointerdown', unlock, true);
      removeEventListener('keydown', unlock, true);
      void ctx.close();
    },
  };
}
