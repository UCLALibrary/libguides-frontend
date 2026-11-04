const { defineConfig } = require('cypress');
const { installPlugin } = require('@chromatic-com/cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.cy.js',
    excludeSpecPattern: ['**/examples/**'],
    setupNodeEvents(on, config) {
      config.expose = {
        ...config.expose,
        chromatic: process.env.CHROMATIC_RUN === 'true',
      };
      installPlugin(on, config);
    },
  },

  video: false,
});
