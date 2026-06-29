import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import fr from './fr.json';
import ar from './ar.json';
import sara from './sara.json';

const resources = {
  fr: { translation: fr },
  ar: { translation: ar },
  sara: { translation: sara },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'fr',
  fallbackLng: 'fr',
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v4',
});

export default i18n;
