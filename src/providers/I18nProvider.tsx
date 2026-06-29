import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LanguageCode } from '@/constants/chad';
import '@/locales';

const LANGUAGE_KEY = 'talenttchad_language';

interface I18nContextValue {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();
  const [language, setLanguageState] = useState<LanguageCode>('fr');

  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_KEY).then((stored) => {
      if (stored && ['fr', 'ar', 'sara'].includes(stored)) {
        const lang = stored as LanguageCode;
        setLanguageState(lang);
        i18n.changeLanguage(lang);
      }
    });
  }, [i18n]);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    i18n.changeLanguage(lang);
    AsyncStorage.setItem(LANGUAGE_KEY, lang);
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useAppLanguage() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useAppLanguage must be used within I18nProvider');
  return ctx;
}
