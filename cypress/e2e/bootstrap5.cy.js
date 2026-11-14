describe('LibGuides Bootstrap 5 assets', () => {
  const pages = [
    { name: 'Homepage', path: '/' },
    { name: 'Subject Landing', path: '/sb.php' },
    { name: 'Individual Subject', path: '/africa-guides/' },
    { name: 'Guide', path: '/communication/' },
    { name: 'Profile Landing', path: '/prf.php' },
    { name: 'Search', path: '/srch.php' },
    {
      name: 'A-Z Databases',
      path: '/az/databases',
      css: 'lg-public-bs5.min.css',
    },
  ];

  pages.forEach(({ name, path, css }) => {
    it(`loads Bootstrap 5 assets on ${name}`, () => {
      cy.visit(path);

      // A-Z Databases uses a different BS5 stylesheet.
      const cssFile = css || 'lg-public-bs535.min.css';

      cy.get(`link[href*="${cssFile}"]`).should('have.length', 1);

      // Check for the appropriate BS5 JavaScript asset.
      cy.get('script[src*="lg-public-bs5"]').should('exist');

      // Verify the Springshare Look & Feel stylesheet.
      cy.get('link[href="https://guides.library.ucla.edu/lookfeel.css"]').should('have.length', 1);

      // Confirm legacy Bootstrap 3 framework assets are absent.
      cy.get('link[href*="/lg-public.min.css"]').should('not.exist');

      cy.get('script[src*="/lg-public.min.js"]').should('not.exist');
    });
  });
});
