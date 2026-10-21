describe('Communication Guide', () => {
  it('renders the side-navigation guide', () => {
    cy.visit('/communication');
    cy.get('#s-lg-guide-name').should('contain', 'Communication');
    cy.get('#s-lg-guide-main').should('exist');
  });
});
