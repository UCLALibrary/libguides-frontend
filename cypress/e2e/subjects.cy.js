const isChromatic = Cypress.expose('visualProvider') === 'chromatic';

describe('LibGuides Subjects', () => {
  it('renders the Subject Landing page', () => {
    cy.visit('/sb.php');

    // Verify the page title and subject navigation.
    cy.get('#s-lib-public-header-title').should('be.visible').and('contain', 'Subjects');

    cy.get('#s-lg-sb-search-bar').should('be.visible');
    cy.get('#s-lg-sb-cols').should('be.visible');

    // Verify the subject listing is populated.
    cy.get('#s-lg-sb-cols #col1').should('be.visible').and('not.be.empty');

    // Verify the sidebar Search section.
    cy.get('#col2 .s-lib-public-side-header').contains('Search').should('be.visible');

    if (isChromatic) cy.visualSnapshot('Subject Landing');
  });

  it('renders the Africa Subject Info page', () => {
    cy.visit('/africa-guides');

    // Verify the page title.
    cy.get('#s-lib-public-header-title').should('be.visible').and('contain', 'Africa');

    // Verify the subject navigation.
    cy.get('#s-lg-sb-search-bar').should('be.visible');

    // Verify guides loaded from the subject fixture.
    cy.get('#s-lg-sb-content-guides').should('be.visible').and('contain', 'African Studies');

    // Verify sidebar Search.
    cy.get('#col2 .s-lib-public-side-header').contains('Search').should('be.visible');

    // Verify the Experts section.
    cy.get('#s-lg-sb-experts-div').should('be.visible');

    if (isChromatic) cy.visualSnapshot('Africa Subject Info');
  });
});
