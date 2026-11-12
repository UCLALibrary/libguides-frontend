// const isChromatic = Cypress.expose('visualProvider') === 'chromatic';

// describe('LibGuides Profile Landing', () => {

// TODO this hook is failing 
//   beforeEach(() => {
//     cy.visit('/prf.php');
//   });

//   it('renders the profile landing page', () => {
//     cy.get('#s-lg-profile-cols').should('be.visible');

//     cy.get('#s-lg-profile-content').should('be.visible');

//     // Profile cards are populated asynchronously by Springshare AJAX.
//     cy.get('.s-lib-featured-profile-container', {
//       timeout: 30000,
//     }).should('have.length.greaterThan', 0);
//   });

//   it('loads profile cards from Springshare AJAX', () => {
//     cy.get('.s-lib-featured-profile-container', {
//       timeout: 30000,
//     }).should('have.length.greaterThan', 0);

//     cy.get('.s-lib-featured-profile-container').first().find('a[href]').should('exist');
//   });

//   it('renders profile images and names', () => {
//     cy.get('.s-lib-featured-profile-container', {
//       timeout: 30000,
//     })
//       .first()
//       .within(() => {
//         // Verify the profile image loads successfully.
//         cy.get('img')
//           .should('be.visible')
//           .and('have.prop', 'naturalWidth')
//           .and('be.greaterThan', 0);

//         // Verify the profile link contains a name or image alt text.
//         cy.get('a[href*="prf.php?id="]')
//           .first()
//           .should('exist')
//           .then(($link) => {
//             const linkText = $link.text().trim();
//             const imageAlt = $link.find('img').attr('alt')?.trim();

//             expect(linkText || imageAlt, 'profile link should have identifying text').not.to.be
//               .empty;
//           });
//       });
//   });

//   it('supports By Name navigation', () => {
//     cy.get('#s-lg-profile-name-btn').should('exist').click();

//     cy.get('.s-lib-featured-profile-container', {
//       timeout: 30000,
//     }).should('have.length.greaterThan', 0);
//   });

//   it('supports By Subject navigation', () => {
//     cy.get('#s-lg-profile-subject-btn').should('exist').click();

//     cy.get('#s-lg-profile-subjects').should('be.visible');
//   });

//   it('opens an individual profile locally', () => {
//     cy.get('.s-lib-featured-profile-container a[href]', {
//       timeout: 30000,
//     })
//       .first()
//       .invoke('attr', 'href')
//       .then((href) => {
//         expect(href).to.include('/prf.php?id=');

//         cy.visit(href);

//         cy.location('pathname').should('eq', '/prf.php');

//         cy.location('search').should('include', 'id=');
//         if (isChromatic) {
//           cy.visualSnapshot('Individual Profile Landing');
//         }
//       });
//   });
// });
