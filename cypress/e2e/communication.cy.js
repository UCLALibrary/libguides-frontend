const isChromatic = Cypress.expose('visualProvider') === 'chromatic';

describe('Communication Guide', () => {
  it('renders the side-navigation guide', () => {
    cy.visit('/communication');

    cy.get('#s-lg-guide-name').should('contain', 'Communication');
    cy.get('#s-lg-guide-main').should('exist');

    // Capture a visual snapshot only when Chromatic is enabled.
    if (isChromatic) {
      cy.visualSnapshot('Communication Guide');
    }
  });
});
