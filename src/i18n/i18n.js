import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import esTranslation from './es.json';
import enTranslation from './en.json';

i18n
    .use(initReactI18next)
    .init({
        resources: {
            es: {
                translation: esTranslation,
            },
            en: {
                translation: enTranslation,
            },
        },
        lng: 'en',
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false,
        },
    });

export default i18n;
