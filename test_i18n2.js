const i18n = require('i18next');
i18n.init({
  lng: 'pt',
  fallbackLng: 'en',
  resources: {
    pt: {
      translation: {
        onboarding: {
          step1Title: 'Qual é o seu idioma nativo?'
        }
      }
    }
  }
});
console.log('Before:', i18n.t('onboarding.step1Title'));
i18n.addResource('pt', 'translation', 'onboarding.step1Title', 'Novo Title Via Stream');
console.log('After:', i18n.t('onboarding.step1Title'));
