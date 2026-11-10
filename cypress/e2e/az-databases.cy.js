const isChromatic = Cypress.expose('visualProvider') === 'chromatic';

describe('LibGuides A-Z Databases', () => {
  beforeEach(() => {
    cy.viewport(1440, 900);
  });

  it('renders the A-Z Databases page with Audio filter', () => {
    // Track only requests that include the Audio database type.
    cy.intercept('GET', '**/process/az/render-list*', (req) => {
      if (req.query.type_id === '3846') {
        req.alias = 'audioDatabases';
      }
    });

    // The URL initializes the Audio filter.
    cy.visit('/az/databases?t=3846');

    // Wait for the filtered request, not the initial request.
    cy.wait('@audioDatabases', { timeout: 30000 }).then(({ request, response }) => {
      expect(request.query.type_id).to.eq('3846');
      expect(response.statusCode).to.eq(200);
      expect(response.body.errText).to.eq('OK');
      expect(response.body.data.html).to.be.a('string');
      expect(response.body.data.count).to.eq(20);
    });

    // Verify the actual filtered page has rendered.
    cy.get('#s-lg-az-result-count', {
      timeout: 30000,
    }).should('contain.text', '20 Databases');

    cy.get('#s-lg-az-content', {
      timeout: 30000,
    }).should('contain.text', 'Alexander Street Press');

    cy.get('#s-lib-public-header-title').should('be.visible');

    cy.get('#s-lg-az-search-bar').should('exist');

    cy.get('.s-lg-az-search').should('be.visible');

    // Capture only after the Audio filter has rendered.
    if (isChromatic) {
      cy.visualSnapshot('LibGuides A-Z Databases - Audio');
    }
  });
});
