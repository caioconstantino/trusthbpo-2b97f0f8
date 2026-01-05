import { IntlProvider as ReactIntlProvider } from "react-intl";
import { ReactNode, useState, useEffect } from "react";
import { messages, getDefaultLocale, Locale } from "@/i18n";

interface IntlProviderProps {
  children: ReactNode;
}

export const IntlProvider = ({ children }: IntlProviderProps) => {
  const [locale, setLocale] = useState<Locale>(getDefaultLocale());

  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem('app_locale') as Locale;
      if (stored && messages[stored]) {
        setLocale(stored);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <ReactIntlProvider
      messages={messages[locale]}
      locale={locale}
      defaultLocale="pt-BR"
      onError={(err) => {
        // Ignore missing translation warnings in development
        if (err.code === 'MISSING_TRANSLATION') {
          return;
        }
        console.error(err);
      }}
    >
      {children}
    </ReactIntlProvider>
  );
};
