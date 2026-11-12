import { ScriptedScene } from './story.levels';

/**
 * Las estrellas de cada nivel con guion: lo que hace que valga la pena volver a
 * jugarlo. Son tres y cada una pide algo distinto, de menos a más:
 *
 *  - `solved`: superar el nivel (recorrer el camino que aplica el patrón);
 *  - `explored`: ver qué pasa en todos los caminos, incluido el que duele (la
 *    lección está en la diferencia entre uno y otro);
 *  - `challenge`: el reto del nivel, que se cumple jugando: tocar a main
 *    mientras el worker trabaja prueba con las manos que main sigue vivo.
 *
 * Lógica pura (se testea sin TestBed). Qué caminos tiene cada nivel lo define su
 * guion (`story.scripts.ts`); acá se repiten para que el mapa pueda contar
 * estrellas sin cargar los guiones, y un test vigila que no se desfasen.
 */
export type StarId = 'solved' | 'explored' | 'challenge';

export const STAR_IDS: readonly StarId[] = ['solved', 'explored', 'challenge'];

export interface LevelGoals {
  /** Todos los caminos del nivel, por id. */
  paths: readonly string[];
  /** El reto, dicho como una orden corta. */
  challenge: string;
}

export const GOALS: Record<ScriptedScene, LevelGoals> = {
  prologue: {
    paths: ['main', 'worker'],
    challenge: 'Tocá a main mientras el worker calcula',
  },
  counter: {
    paths: ['main', 'worker'],
    challenge: 'Un toque a main por cada tic del worker',
  },
  queue: {
    paths: ['block'],
    challenge: 'Meté 5 clics o más en la fila',
  },
  fan: {
    paths: ['main', 'worker'],
    challenge: 'Arrastrá a main mientras el worker trabaja',
  },
};

/** Cuántos toques pide el reto de "Tic, tac": uno por tic. */
export const TICK_TOUCHES = 5;
/** Cuántos clics en fila pide el reto de "La fila de main". */
export const QUEUE_CLICKS = 5;

/** Lo que se sabe de un nivel para contarle las estrellas. */
export interface StarFacts {
  solved: boolean;
  walked: (pathId: string) => boolean;
  challenge: boolean;
}

export interface Star {
  id: StarId;
  earned: boolean;
  /** Ganada: qué se logró. Sin ganar: qué hay que hacer para ganarla. */
  text: string;
}

export function starsOf(goals: LevelGoals, facts: StarFacts): Star[] {
  const explored = goals.paths.every((id) => facts.walked(id));
  const one = goals.paths.length === 1;
  return [
    {
      id: 'solved',
      earned: facts.solved,
      text: facts.solved ? 'Nivel superado' : 'Superá el nivel',
    },
    {
      id: 'explored',
      earned: explored,
      text: explored
        ? one
          ? 'Viste qué pasa'
          : 'Probaste todos los caminos'
        : 'Probá también el otro camino',
    },
    {
      id: 'challenge',
      earned: facts.challenge,
      text: facts.challenge ? `Reto cumplido: ${lowerFirst(goals.challenge)}` : goals.challenge,
    },
  ];
}

export function countStars(stars: readonly Star[]): number {
  return stars.filter((s) => s.earned).length;
}

/** La primera estrella que falta: la pista que se muestra al terminar el nivel. */
export function nextStar(stars: readonly Star[]): Star | null {
  return stars.find((s) => !s.earned) ?? null;
}

const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);
