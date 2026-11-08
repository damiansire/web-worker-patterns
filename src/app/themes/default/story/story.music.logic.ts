/**
 * La música de los niveles, como datos: qué suena en cada semicorchea según la
 * situación. Sin Web Audio: `story.audio.ts` la toca; esto se prueba solo.
 *
 * Dos hilos, dos voces. Main lleva la melodía (marimba, a la izquierda, donde
 * está en la escena) y el bajo; cuando un worker trabaja se suma su voz, un
 * arpegio que corre a la par (a la derecha). Al ganar, una campanita en cada
 * compás. El tempo lo marca main: si main se congela, la música también.
 */

/** Lo que pasa en el nivel, para la música. */
export type Mood = 'main' | 'worker' | 'won';
export type Voice = 'lead' | 'bass' | 'shaker' | 'worker' | 'bell';

export interface NoteEvent {
  voice: Voice;
  /** Nota MIDI (el shaker no tiene altura: 0). */
  midi: number;
  /** Duración en semicorcheas. */
  steps: number;
}

export const BPM = 108;
/** Duración de una semicorchea, en segundos. */
export const STEP_S = 60 / BPM / 4;
const STEPS_PER_BAR = 16;

/** Do – La menor – Fa – Sol, dos vueltas: la segunda, la melodía contesta más arriba. */
const CHORDS = [
  [48, 52, 55],
  [45, 48, 52],
  [41, 45, 48],
  [43, 47, 50],
] as const;

/** Melodía en corcheas (null = silencio), un compás por fila. */
const MELODY: readonly (number | null)[][] = [
  [72, 76, 79, 76, 74, 76, 72, null],
  [69, 72, 76, 72, 74, 72, 69, null],
  [65, 69, 72, 77, 76, 74, 72, null],
  [67, 71, 74, 79, 77, 74, 71, 74],
  [79, null, 76, 79, 84, null, 79, 76],
  [81, null, 76, 81, 79, 76, 72, null],
  [77, 76, 74, 72, 74, 76, 77, 79],
  [79, 77, 76, 74, 71, null, 67, null],
];

export const LOOP_STEPS = MELODY.length * STEPS_PER_BAR;

export function midiToHz(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

/** Lo que empieza a sonar en la semicorchea `step` (se repite cada `LOOP_STEPS`). */
export function notesAt(step: number, mood: Mood): NoteEvent[] {
  const s = ((step % LOOP_STEPS) + LOOP_STEPS) % LOOP_STEPS;
  const bar = Math.floor(s / STEPS_PER_BAR);
  const inBar = s % STEPS_PER_BAR;
  const chord = CHORDS[bar % CHORDS.length];
  const out: NoteEvent[] = [];

  if (inBar % 2 === 0) {
    const lead = MELODY[bar][inBar / 2];
    if (lead !== null) out.push({ voice: 'lead', midi: lead, steps: 2 });
  }
  // Bajo pizzicato en negras: fundamental en 1 y 3, quinta en 2 y 4.
  if (inBar % 4 === 0) {
    const beat = inBar / 4;
    out.push({ voice: 'bass', midi: beat % 2 === 0 ? chord[0] : chord[0] + 7, steps: 3 });
  }
  // El shaker va a contratiempo: el malabar de main.
  if (inBar % 4 === 2) out.push({ voice: 'shaker', midi: 0, steps: 1 });
  // El worker: arpegio en semicorcheas, una octava arriba del acorde.
  if (mood !== 'main') {
    const tones = [chord[0], chord[1], chord[2], chord[1]];
    out.push({ voice: 'worker', midi: tones[inBar % 4] + 12, steps: 1 });
  }
  if (mood === 'won' && inBar === 0) out.push({ voice: 'bell', midi: chord[0] + 36, steps: 8 });
  return out;
}

/**
 * Dónde sigue la música después de un tirón. Si main estuvo trabado y el
 * próximo tiempo ya pasó, no se tocan de golpe las notas atrasadas (sería un
 * amontonamiento): se salta a ahora, como un disco que vuelve a girar.
 */
export function resume(nextTime: number, now: number, lead = 0.05): number {
  return nextTime < now ? now + lead : nextTime;
}
