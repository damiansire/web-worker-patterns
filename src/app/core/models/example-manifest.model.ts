import { Type } from '@angular/core';
import { LanguageCode } from '../services/language.service';

export type CategoryId = 'understanding' | 'fundamentals' | 'optimization' | 'management' | 'advanced';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface ExampleMetaTranslations {
  title: string;
  description: string;
  tags: string[];
}

export interface ExampleManifest {
  id: string;
  number: string;
  route: string;
  category: CategoryId;
  difficulty: DifficultyLevel;
  loadComponent: () => Promise<{ [key: string]: Type<any> }>;
  translations: Record<LanguageCode, ExampleMetaTranslations>;
}
