const isChromatic = Cypress.expose('visualProvider') === 'chromatic';

describe('LibGuides A-Z Databases', () => {
  beforeEach(() => {
    cy.viewport(1440, 900);
  });

  it('renders the A-Z Databases page with Audio filter', () => {
    // Force the Audio database type in the AJAX request.
    // This keeps the visual snapshot small and consistent.
    cy.intercept('GET', '**/process/az/render-list*', (req) => {
      const url = new URL(req.url);

      url.searchParams.set('type_id', '3846');

      req.url = url.toString();
      req.alias = 'audioDatabases';
    });

    // Load the A-Z Databases page.
    cy.visit('/az/databases?t=3846');

    // Wait for the Audio-filtered response.
    cy.wait('@audioDatabases', { timeout: 30000 }).then(({ response }) => {
      expect(response.statusCode).to.eq(200);
      expect(response.body.errText).to.eq('OK');
      expect(response.body.data.html).to.be.a('string');
      expect(response.body.data.html.length).to.be.greaterThan(0);
    });

    // Verify page structure.
    cy.get('#s-lib-public-header-title').should('be.visible');

    cy.get('#s-lg-az-search-bar').should('exist');

    cy.get('.s-lg-az-search').should('be.visible');

    // Wait for database results to render.
    cy.get('#s-lg-az-content', {
      timeout: 30000,
    }).should(($content) => {
      expect($content.text().trim()).not.to.eq('Loading...');

      expect($content.find('a').length).to.be.greaterThan(0);
    });

    // Capture the filtered page for Chromatic.
    if (isChromatic) {
      cy.visualSnapshot('LibGuides A-Z Databases - Audio');
    }
  });
});
