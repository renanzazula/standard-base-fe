import {Language} from '@shared/constants/languages';
import {en, TranslationKeys} from './en';
import {es} from './es';

export const translations: Record<Language, TranslationKeys> = {
  en,
  es,
  fr: en,
  de: en,
  pt: en,
  it: en,
  ja: en,
  zh: en,
};

export type { TranslationKeys };
