describe('LibGuides Homepage', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('renders All Guides', () => {
    cy.contains('ALL GUIDES').click();
    cy.get('#s-lg-index-list-guides').should('be.visible');
  });

  it('renders By Subject', () => {
    cy.contains('BY SUBJECT').click();
    cy.get('#s-lg-index-list-subjects').should('be.visible');

    cy.visualSnapshot('Homepage - By Subject');
  });

  it('renders By Librarian', () => {
    cy.contains('BY LIBRARIAN').click();
    cy.get('#s-lg-index-list-owners').should('be.visible');

    cy.visualSnapshot('Homepage - By Librarian');
  });
});
