/**
 * Contenido educativo neutral de un ejemplo (ARQUITECTURA §3.3). Vive en i18n
 * (Transloco, ES/EN/PT) y cada theme lo renderiza a su manera. No conoce themes.
 */
export interface ExampleTakeaways {
  title: string;
  items: string[];
  tip?: string;
}

export interface ExampleContent {
  title: string;
  /** Qué enseña el ejemplo (intro). */
  summary: string;
  /** Qué mirar en la demo. */
  whatToWatch?: string;
  /** Nota / aclaración. */
  note?: string;
  takeaways?: ExampleTakeaways;
}
