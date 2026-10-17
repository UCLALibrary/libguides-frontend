
describe('LibGuides Homepage', () => {
  it('renders the homepage', () => {
    cy.visit('/');
    cy.get('#s-lib-public-header-title').should('be.visible');
    cy.get('#s-lib-public-main').should('exist');
  });
});
