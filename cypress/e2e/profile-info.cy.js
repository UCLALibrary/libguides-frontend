const PROFILE_ID = '61f2b01e-7cdb-11ed-9922-0ad758b798c3';
const isChromatic = Cypress.expose('visualProvider') === 'chromatic';

describe('LibGuides Individual Profile', () => {
  beforeEach(() => {
    cy.visit(`/prf.php?id=${PROFILE_ID}`);
  });

  it('renders the individual profile page', () => {
    cy.get('body').should('be.visible');

    cy.get('#s-lg-profile-cols').should('exist');
    if (isChromatic) {
      cy.visualSnapshot('Individual Profile');
    }
  });

  it('displays the librarian name', () => {
    cy.contains('Abigail Connick').should('be.visible');
  });

  it('displays the profile image', () => {
    cy.get('img').filter(':visible').should('have.length.greaterThan', 0);
  });

  it('links back to Profile Landing', () => {
    cy.get('#s-lib-bc-index a')
      .should('contain.text', 'Profiles')
      .and('have.attr', 'href', '/prf.php');
  });

  it('returns to Profile Landing through breadcrumb', () => {
    cy.get('#s-lib-bc-index a').click();

    cy.location('pathname').should('eq', '/prf.php');

    cy.get('#s-lg-profile-content').should('exist');
  });

  it('renders in standards mode', () => {
    cy.document().its('compatMode').should('eq', 'CSS1Compat');
  });
});
