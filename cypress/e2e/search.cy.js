const isChromatic = Cypress.expose('visualProvider') === 'chromatic';

describe('LibGuides Search', () => {
  const query = 'news';

  beforeEach(() => {
    cy.viewport(1440, 900);
  });

  it('renders the Search page', () => {
    cy.visit('/srch.php');

    cy.get('#s-lib-public-header-title').should('be.visible');

    cy.get('#s-lg-srch-form').should('exist');

    cy.get('#s-lg-srch-local').should('exist');

    cy.get('#s-lg-srch-cols').should('exist');
    if (isChromatic) cy.visualSnapshot('LibGuides Search - News Results');
  });

  it('loads Research Guides search results', () => {
    cy.intercept('GET', '**/srch_process_cs.php*').as('search');

    cy.visit(`/srch.php?q=${query}`);

    cy.wait('@search', { timeout: 30000 });

    cy.get('#s-lg-srch-cols .s-srch-result', {
      timeout: 30000,
    }).should('have.length.greaterThan', 0);

    cy.get('#s-lg-srch-cols .s-srch-result-title a')
      .first()
      .should('have.attr', 'href')
      .and('not.be.empty');
  });

  it('supports searching for another query', () => {
    cy.visit('/srch.php?q=history');

    cy.get('#s-lg-srch-cols .s-srch-result', {
      timeout: 30000,
    }).should('have.length.greaterThan', 0);
  });
});
