import { ThemePack } from '../../theming/theme.types';
import { DEFAULT_THEME } from '../default/default.theme';

/**
 * Theme `midnight`: la contracara nocturna del `default`. Es una variante de
 * PALETA — comparte la presentación del theme default (shell, viaje y layouts
 * están dibujados 100% con el contrato de tokens semánticos, sin un color
 * literal) y sólo cambia el bloque de tokens bajo `[data-theme='midnight']`
 * (`styles/_tokens.scss`). Por eso reusa los loaders del default en vez de
 * duplicar la presentación: la diferencia visual la aporta el contrato de tokens
 * (ARQUITECTURA §6), que es exactamente lo que el motor de theming existe para
 * habilitar. Sumar un theme con presentación propia sería darle sus propios
 * loaders acá; midnight elige, a propósito, reusar la del default.
 */
export const MIDNIGHT_THEME: ThemePack = {
  id: 'midnight',
  label: 'Midnight',
  shell: DEFAULT_THEME.shell,
  home: DEFAULT_THEME.home,
  exampleLayout: DEFAULT_THEME.exampleLayout,
};
