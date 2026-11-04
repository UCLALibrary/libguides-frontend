const { defineConfig } = require('cypress');
const { installPlugin } = require('@chromatic-com/cypress');

module.exports = defineConfig({
  env: {
    // Only capture snapshots when explicitly requested.
    disableAutoSnapshot: true,
    delay: 500,
  },

  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.cy.js',
    excludeSpecPattern: ['**/examples/**'],

    setupNodeEvents(on, config) {
      config.expose = {
        ...config.expose,
        visualProvider: process.env.CYPRESS_VISUAL_PROVIDER || '',
      };
      // Enable Chromatic only when a project token is available.
      if (process.env.CHROMATIC_PROJECT_TOKEN) {
        installPlugin(on, config);
      } else {
        // Fallback tasks used by Chromatic support.
        on('task', {
          log(message) {
            console.log(message);
            return null;
          },
          prepareArchives() {
            return null;
          },
        });
      }

      return config;
    },
  },

  video: false,
});
