import { ThemePack } from '../../theming/theme.types';

/**
 * Theme `rpg`: el mismo recorrido, jugado. Un mundo que se camina, vecinos que dan
 * una misión por patrón y un texto que pasa de lenguaje llano a la API real a
 * medida que se aprende. Es presentación pura: corre los mismos workers y
 * servicios que `default`, y no toca el dominio.
 *
 * `home` y `exampleLayout` son el mismo juego: con un id de ejemplo en la ruta, el
 * jugador aparece al lado del vecino de ese patrón.
 */
const game = () => import('./game/rpg-game.component').then((m) => m.RpgGameComponent);

export const RPG_THEME: ThemePack = {
  id: 'rpg',
  label: 'RPG',
  shell: () => import('./shell/rpg-shell.component').then((m) => m.RpgShellComponent),
  home: game,
  exampleLayout: game,
};
