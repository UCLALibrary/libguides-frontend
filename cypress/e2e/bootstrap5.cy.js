describe('LibGuides Bootstrap 5 assets', () => {
  const pages = [
    { name: 'Homepage', path: '/' },
    { name: 'Subject Landing', path: '/sb.php' },
    { name: 'Individual Subject', path: '/africa-guides/' },
    { name: 'Guide', path: '/communication/' },
    { name: 'Profile Landing', path: '/prf.php' },
    { name: 'Search', path: '/srch.php' },
    { name: 'A-Z Databases', path: '/az/databases' },
  ];

  pages.forEach(({ name, path }) => {
    it(`loads Bootstrap 5 assets on ${name}`, () => {
      cy.visit(path);

      // Verify the Bootstrap 5 stylesheet is included.
      cy.get('link[href*="lg-public-bs535.min.css"]').should('have.length', 1);

      // Verify the Bootstrap 5 JavaScript is included.
      cy.get('script[src*="lg-public-bs535.min.js"]').should('have.length', 1);

      // Verify the Springshare Look & Feel stylesheet.
      cy.get('link[href="https://guides.library.ucla.edu/lookfeel.css"]').should('have.length', 1);

      // Confirm Bootstrap 3 framework assets are not included.
      cy.get('link[href*="/lg-public.min.css"]').should('not.exist');
      cy.get('script[src*="/lg-public.min.js"]').should('not.exist');
    });
  });
});
