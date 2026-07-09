import {usePreferences} from '@core/contexts/PreferencesContext';
import {TranslationKeys, translations} from '@shared/locales';
import {useCallback} from 'react';

type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

type TranslationKey = NestedKeyOf<TranslationKeys>;

export function useTranslation() {
  const { language } = usePreferences();

  // Stable identity per language so `t` is safe to use in dependency arrays.
  // An unstable `t` inside a useCallback/useEffect chain re-fires the effect
  // on every render (state update → render → new t → effect → state update…).
  const t = useCallback((key: TranslationKey): string => {
    const keys = key.split('.');
    let value: any = translations[language];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key} for language: ${language}`);
        return key;
      }
    }

    return typeof value === 'string' ? value : key;
  }, [language]);

  return { t, language };
}
