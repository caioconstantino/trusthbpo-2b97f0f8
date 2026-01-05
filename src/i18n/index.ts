import { ptBR } from './messages/pt-BR';
import { enUS } from './messages/en-US';

export type Locale = 'pt-BR' | 'en-US';

export const messages: Record<Locale, Record<string, string>> = {
  'pt-BR': ptBR,
  'en-US': enUS,
};

export const localeNames: Record<Locale, string> = {
  'pt-BR': 'Português (Brasil)',
  'en-US': 'English (US)',
};

export const getDefaultLocale = (): Locale => {
  const stored = localStorage.getItem('app_locale') as Locale;
  if (stored && messages[stored]) {
    return stored;
  }
  
  const browserLang = navigator.language;
  if (browserLang.startsWith('pt')) {
    return 'pt-BR';
  }
  return 'en-US';
};

export const setLocale = (locale: Locale) => {
  localStorage.setItem('app_locale', locale);
  window.location.reload();
};
