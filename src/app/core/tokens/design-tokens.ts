/**
 * Contrato de tokens semánticos (ARQUITECTURA §6).
 *
 * Estos son los ÚNICOS nombres de color/tipografía que los primitivos
 * compartidos y los `ThreadVisualizer` pueden leer. Cada theme rellena estos
 * mismos nombres con SUS valores en `themes/<id>/styles/_tokens.scss`, bajo
 * `[data-theme='<id>']`. Nunca usar colores literales en código compartido:
 * siempre estos tokens. El skin por defecto (gris "skeleton") vive en
 * `theming/styles/_tokens-contract.scss`.
 */
export const DESIGN_TOKENS = {
  surface: '--surface',
  surfaceRaised: '--surface-raised',
  ink: '--ink',
  inkMuted: '--ink-muted',
  accent: '--accent',
  threadMain: '--thread-main',
  threadWorker: '--thread-worker',
  threadBlocked: '--thread-blocked',
  threadIdle: '--thread-idle',
  border: '--border',
  borderWidth: '--border-width',
  radius: '--radius',
  fontDisplay: '--font-display',
  fontBody: '--font-body',
  fontMono: '--font-mono',
} as const;

export type DesignTokenKey = keyof typeof DESIGN_TOKENS;
export type DesignTokenName = (typeof DESIGN_TOKENS)[DesignTokenKey];

/** `token('accent')` -> `'var(--accent)'`. Para estilos inline o bindings en TS. */
export function token(name: DesignTokenKey): string {
  return `var(${DESIGN_TOKENS[name]})`;
}
