/**
 * El ícono de cada nivel del mapa: un dibujo chico (caja de ±20 alrededor de
 * 0,0) que dice de qué trata el caso, no en qué estado está. El estado (en
 * obra, bloqueado, superado) lo dibuja la baldosa donde se pinta el ícono.
 *
 * Cada parte es un trazo (`line`, se dibuja con contorno) o una mancha
 * (`fill`), con un giro opcional alrededor del centro.
 */
export interface IconPart {
  kind: 'line' | 'fill';
  d: string;
  rot?: number;
}

/** Un círculo como path, para mezclarlo con el resto de las partes. */
const dot = (x: number, y: number, r: number) =>
  `M${x - r} ${y}A${r} ${r} 0 1 0 ${x + r} ${y}A${r} ${r} 0 1 0 ${x - r} ${y}Z`;

const line = (d: string, rot?: number): IconPart => ({ kind: 'line', d, rot });
const fill = (d: string, rot?: number): IconPart => ({ kind: 'fill', d, rot });

const BLADE = 'M0 -3C-7 -9 -7 -19 1 -19C9 -19 9 -9 3 -3Z';

export const LEVEL_ICONS: Record<string, readonly IconPart[]> = {
  // Conocé a main: su corona.
  'conoce-a-main': [fill('M-17 9L-19 -11L-8 -2L0 -16L8 -2L19 -11L17 9Z'), line('M-17 15H17')],
  // Main y su malabar: tres pelotas en el aire sobre dos manos.
  prologo: [
    fill(dot(-12, 2, 5.5)),
    fill(dot(0, -12, 5.5)),
    fill(dot(12, 2, 5.5)),
    line('M-19 15Q-12 10 -6 15M6 15Q12 10 19 15'),
  ],
  // Tic, tac: un reloj.
  '01-setinterval-counter': [line(dot(0, 0, 18)), line('M0 -10V0L7 6')],
  // La fila de main: tareas en fila que avanzan.
  '02-main-thread': [
    line('M-20 -14h11v11h-11zM-5.5 -14h11v11h-11zM9 -14h11v11h-11z'),
    line('M-16 10H14M9 5L14 10L9 15'),
  ],
  // Lo que no se congela: el ventilador que sigue girando.
  '16-compositor-vs-main': [fill(BLADE), fill(BLADE, 120), fill(BLADE, 240), fill(dot(0, 0, 4))],
  // Mandar un mensaje: un sobre.
  '03-basic-communication': [line('M-19 -12H19V12H-19ZM-19 -12L0 3L19 -12')],
  // Un worker compartido: uno solo atendiendo a dos pestañas.
  '08-shared-worker': [
    fill(dot(0, -11, 7)),
    line('M-4 -5L-11 5M4 -5L11 5'),
    line('M-19 6h13v11h-13zM6 6h13v11h-13z'),
  ],
  // Pasarle lo pesado: una pesa.
  '04-offloading-computation': [fill(dot(0, 6, 13)), line('M-8 -4C-11 -19 11 -19 8 -4')],
  // Pasar sin copiar: la caja se va entera, no queda copia.
  '07-transferable-objects': [line('M-20 -8h14v16h-14z'), line('M-1 0H18M12 -6L18 0L12 6')],
  // Un equipo de workers: tres cabezas.
  '10-worker-pool': [
    fill(dot(-12, -5, 5)),
    fill(dot(12, -5, 5)),
    fill(dot(0, -9, 6)),
    line('M-21 14Q-12 2 -4 12M4 12Q12 2 21 14M-9 14Q0 -2 9 14'),
  ],
  // Pintar desde otro hilo: un pincel.
  '14-offscreen-canvas': [
    line('M16 -17L1 -1'),
    fill('M-1 -3L4 2C3 9 -4 15 -18 17C-14 11 -13 5 -9 1C-6 -2 -4 -3 -1 -3Z'),
  ],
  // Lo que cuesta copiar: una hoja y su copia.
  '15-clone-cost': [line('M-6 -11V-17H14V6H7'), line('M-14 -11H6V17H-14ZM-9 -3H1M-9 4H1M-9 11H-3')],
  // Cuando algo falla: el triángulo de aviso.
  '05-error-handling': [line('M0 -17L18 14H-18Z'), line('M0 -6V3'), fill(dot(0, 9, 2.4))],
  // Despedir a un worker: el botón de apagar.
  '06-lifecycle-termination': [line('M-9 -11A14 14 0 1 0 9 -11'), line('M0 -18V-2')],
  // No sobran manos: el medidor llega al tope.
  '09-worker-limits': [line('M-17 9A17 17 0 0 1 17 9'), line('M0 9L11 -5'), fill(dot(0, 9, 3.5))],
  // No inundar al worker: un embudo que deja pasar de a poco.
  '11-backpressure-scheduling': [line('M-18 -14H18L4 2V13L-4 18V2Z')],
  // Memoria compartida: un chip.
  '12-shared-array-buffer': [
    line('M-11 -11H11V11H-11Z'),
    line('M-5 -11V-17M5 -11V-17M-5 11V17M5 11V17M-11 -5H-17M-11 5H-17M11 -5H17M11 5H17'),
    fill('M-5 -5H5V5H-5Z'),
  ],
  // Plan B: un paraguas por si llueve.
  '13-graceful-degradation': [
    line('M-18 0A18 18 0 0 1 18 0Q12 -4 6 0Q0 -4 -6 0Q-12 -4 -18 0Z'),
    line('M0 0V13A4 4 0 0 1 -8 13'),
  ],
};

export function levelIcon(id: string): readonly IconPart[] {
  return LEVEL_ICONS[id] ?? [line(dot(0, 0, 14))];
}
