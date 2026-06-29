const i18n = require('i18next');
const en = require('./translations/en.json');
const pt = require('./translations/pt.json');

i18n.init({
  lng: 'en',
  fallbackLng: 'en',
  resources: {
    en: { translation: en },
    pt: { translation: pt }
  }
});
console.log('Language before:', i18n.language);
console.log('Before t:', i18n.t('onboarding.step1Title'));
i18n.changeLanguage('pt').then(() => {
  console.log('Language after:', i18n.language);
  console.log('After t:', i18n.t('onboarding.step1Title'));
})
