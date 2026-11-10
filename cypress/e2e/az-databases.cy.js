const isChromatic = Cypress.expose('visualProvider') === 'chromatic';

describe('LibGuides A-Z Databases', () => {
  const initialDatabasesEndpoint =
    '**/process/az/render-list?search=&subject_id=&type_id=&vendor_id=&access_mode_id=&page=&site_id=705&content_id=0&is_widget=0&bootstrap5=true&page_size=0&preview=&sublist_id=0&alpha=';

  beforeEach(() => {
    cy.viewport(1440, 900);
  });

  function visitDatabases() {
    cy.intercept('GET', initialDatabasesEndpoint).as('initialDatabases');
    cy.visit('/az/databases?t=3846');

    cy.wait('@initialDatabases', { timeout: 30000 }).then(({ response }) => {
      expect(response.statusCode).to.eq(200);
      expect(response.body.errText).to.eq('OK');
      expect(response.body.data.html).to.be.a('string');
      expect(response.body.data.html.length).to.be.greaterThan(0);
    });
  }

  it('renders the A-Z Databases page', () => {
    visitDatabases();

    cy.get('#s-lib-public-header-title').should('be.visible');

    cy.get('#s-lg-az-search-bar').should('exist');

    cy.get('.s-lg-az-search').should('be.visible');
    if (isChromatic) {
      cy.visualSnapshot('LibGuides A-Z Databases');
    }
  });
  /*
  it('loads filtered database results after a keyword search', () => {
    visitDatabases();

    cy.intercept({
      method: 'GET',
      pathname: '/process/az/render-list',
      query: { search: 'library' },
    }).as('filteredDatabases');

    cy.get('.s-lg-az-search').clear();
    cy.get('.s-lg-az-search').type('library{enter}');

    cy.wait('@filteredDatabases', { timeout: 30000 }).then(({ response }) => {
      expect(response.statusCode).to.eq(200);
      expect(response.body.errText).to.eq('OK');
      expect(response.body.data.html).to.be.a('string');
    });

    cy.get('#s-lg-az-content').should('be.visible');
  });*/

  /*it('loads database results', () => {
    visitDatabases();

    cy.get('#s-lg-az-content', {
      timeout: 30000,
    })
      .should('be.visible')
      .and(($content) => {
        expect($content.text().trim()).not.to.eq('Loading...');
        expect($content.find('a').length).to.be.greaterThan(0);
      });
  });

  it('supports keyword search', () => {
    visitDatabases();

    cy.get('.s-lg-az-search').clear();

    cy.get('.s-lg-az-search').type('library{enter}');

    cy.wait('@databases', { timeout: 30000 }).then(({ request, response }) => {
      const url = new URL(request.url);

      expect(url.searchParams.get('search')).to.eq('library');
      expect(response.statusCode).to.eq(200);
      expect(response.body.errText).to.eq('OK');
    });

    cy.get('#s-lg-az-content').should('be.visible');
  });

  it('supports alphabetical navigation', () => {
    visitDatabases();

    cy.get('#s-lg-az-index button', {
      timeout: 30000,
    })
      .contains(/^N$/)
      .click();

    cy.wait('@databases', { timeout: 30000 }).then(({ request, response }) => {
      const url = new URL(request.url);

      expect(url.searchParams.get('alpha')).to.eq('n');
      expect(response.statusCode).to.eq(200);
    });
  });*/
});
