const i18next = require('i18next');
i18next.init({
  lng: 'en',
  resources: { en: { translation: { } } }
});
i18next.addResource('en', 'translation', 'onboarding.step1Title', 'Test');
console.log(i18next.t('onboarding.step1Title'));
