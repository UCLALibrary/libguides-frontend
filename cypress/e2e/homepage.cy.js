const isChromatic = Cypress.expose('visualProvider') === 'chromatic';

describe('LibGuides Homepage', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  // Run All Guides only during functional testing.
  if (!isChromatic) {
    it('renders All Guides', () => {
      cy.contains('ALL GUIDES').click();
      cy.get('#s-lg-index-list-guides').should('be.visible');
    });
  }

  it('renders By Subject', () => {
    cy.contains('BY SUBJECT').click();
    cy.get('#s-lg-index-list-subjects').should('be.visible');

    if (isChromatic) {
      cy.visualSnapshot('Homepage - By Subject');
    }
  });

  it('renders By Librarian', () => {
    cy.contains('BY LIBRARIAN').click();
    cy.get('#s-lg-index-list-owners').should('be.visible');

    if (isChromatic) {
      cy.visualSnapshot('Homepage - By Librarian');
    }
  });
});
