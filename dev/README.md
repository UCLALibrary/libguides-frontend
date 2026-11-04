# LibGuides Local Development & Homepage Preview

This directory contains the local development tools for testing UCLA Library LibGuides templates and global CSS during the Bootstrap 3 to Bootstrap 5 migration.

The preview uses captured Springshare HTML and Cheerio to render pages without requiring access to the LibGuides administration server.

## 1. Development Files

| File                                 | Purpose                                          |
| ------------------------------------ | ------------------------------------------------ |
| `server.mjs`                         | Runs the local development server                |
| `renderer.mjs`                       | Assembles LibGuides templates with captured HTML |
| `homepage.mjs`                       | Provides mock AJAX responses for Homepage tabs   |
| `build-preview.mjs`                  | Generates static HTML and JSON for GitHub Pages  |
| `fixtures/homepage.html`             | Captured Homepage HTML                           |
| `fixtures/communication.html`        | Captured Communication Guide HTML                |
| `fixtures/ajax/`                     | Captured Homepage tab content                    |
| `../src/html/global-custom-css.html` | Global CSS and related customization             |

## 2. Run Local Development

Install dependencies:

```bash
npm ci
```

Start the development server:

```bash
npm run dev
```

Open:

- Homepage: http://localhost:3000/
- Communication Guide: http://localhost:3000/communication

The server reads templates, fixtures, and global CSS on every page request.

**Changes appear after refreshing the browser.**

## 3. Homepage AJAX Fixtures

The Homepage uses Springshare JavaScript to load guide lists dynamically.

Because the local server cannot execute Springshare PHP, `homepage.mjs` provides mock responses using captured production HTML.

| Homepage tab | Action | Fixture                                    |
| ------------ | ------ | ------------------------------------------ |
| All Guides   | `170`  | `fixtures/ajax/homepage-all-guides.html`   |
| By Subject   | `172`  | `fixtures/ajax/homepage-by-subject.html`   |
| By Librarian | `174`  | `fixtures/ajax/homepage-by-librarian.html` |

Guide-count requests (`176`, `177`, `178`) currently return empty mock data.

### Test Homepage tabs

1. Start `npm run dev`.
2. Open the Homepage.
3. Click All Guides, By Subject, and By Librarian.
4. Verify the guide lists render and Bootstrap 3 accordions expand and collapse.

### Test changes to fixture content

Edit a file such as:

```text
dev/fixtures/ajax/homepage-by-subject.html
```

Change a subject heading, save, and refresh the Homepage.

The server reads the fixture again when the AJAX request runs. No restart is required.

Fixtures should contain **plain HTML**, not JSON-escaped strings. The server wraps the HTML in the Springshare-compatible JSON response.

## 4. Test Global CSS

Global customization is maintained in:

```text
src/html/global-custom-css.html
```

This file contains CSS styles, font definitions, and related global HTML customization.

### Make a CSS change

Find an existing CSS rule:

```css
#s-lg-hp-nav {
  background: #eff3f4;
}
```

Temporarily change it to:

```css
#s-lg-hp-nav {
  background: #ffd100;
}
```

Save and refresh:

http://localhost:3000/

The Homepage navigation background should turn yellow.

Revert the temporary change after testing.

**No server restart is required** because `server.mjs` reads the global customization file on every page request.

Use Chrome DevTools → Elements → Styles to inspect CSS rules and verify which styles are applied.

## 5. Test HTML Template Changes

The local renderer uses the editable LibGuides templates stored under `src/html/`.

To test a template change:

1. Edit the appropriate Homepage or Communication Guide template.
2. Save the file.
3. Refresh the local page.
4. Verify the updated HTML and layout.

Changes to `server.mjs`, `renderer.mjs`, or `homepage.mjs` require restarting the Node.js server.

## 6. Build Static Previews

Generate static files:

```bash
npm run build:preview
```

Expected output:

```text
dist/
├── index.html
├── communication/
│   └── index.html
└── ajax/
    ├── 170.json
    ├── 172.json
    └── 174.json
```

The build uses the same renderer and Homepage fixture data as local development.

### Preview the static build locally

```bash
npx serve dist
```

Open the URL displayed by the static server.

The static build does not update automatically. After changing templates, CSS, or fixtures, rerun:

```bash
npm run build:preview
```

Then refresh the browser.

**Current limitation:** Static Homepage tabs require a browser-side AJAX adapter because GitHub Pages cannot execute Springshare PHP endpoints. Until that adapter is implemented, the JSON files are generated but the tab interactions will not work in the static preview.

## 7. Run Tests

Start the development server, then run Cypress in a separate terminal:

```bash
npm test
```

Cypress uses Chrome for local testing.

Chromatic provides visual regression testing through the CI workflow.

## 8. Known Limitations

- Springshare authentication endpoints are not implemented locally.
- Some production JavaScript may generate 404 errors for unavailable PHP endpoints.
- Homepage fixtures contain captured data, not live guide listings.
- Sorting, searching, and additional AJAX interactions may require more fixtures.
- Live third-party scripts may make requests to production services.
- Static GitHub Pages previews require additional handling for dynamic AJAX requests.

The goal is to validate frontend templates, global styling, responsive layouts, and Bootstrap migration changes—not reproduce the entire Springshare backend.

# Adding a New LibGuides Page to Local & CI Previews

This guide explains how to add a new LibGuides page to the Bootstrap migration testing environment.

**Goal:** A developer can edit a LibGuides template, preview it locally, run Cypress/Chromatic tests, and publish a static preview to GitHub Pages.

## 1. Capture the Production Page

Open the page in production and save:

- **Page Source** — HTML returned by Springshare, including scripts, CSS, and metadata.
- **Rendered HTML** — DOM captured from Chrome DevTools → Elements, including dynamically loaded content.
- **AJAX responses** — Only if the page requires dynamic Springshare data.

Save the HTML fixture under:

```text
dev/fixtures/<page-name>.html
```

Use the existing Homepage and Communication Guide fixtures as examples.

Keep fixtures free of sensitive data, session cookies, and authentication tokens before committing them.

## 2. Add the Editable Template

Identify the LibGuides template used by the page.

Store the template under the appropriate directory in `src/html/`.

For example:

```text
src/html/guide/side-nav-layout/ucla-default-template.html
```

If multiple pages use the same template, reuse it rather than creating duplicates.

## 3. Register the Page

Open `dev/renderer.mjs`.

Add the new route to the `pages` object:

```javascript
'/new-guide': {
  template: 'src/html/guide/side-nav-layout/ucla-default-template.html',
  fixture: 'dev/fixtures/new-guide.html',
  type: 'guide',
},
```

The existing `server.mjs` and `build-preview.mjs` use this configuration to render registered pages.

If the new page type has different Springshare placeholders, extend `renderTemplate()` with the required mappings.

## 4. Test Locally

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000/new-guide
```

Verify that the template renders with the captured content, global CSS, fonts, and required JavaScript.

Edit the template or `src/html/global-custom-css.html`, save, and refresh to confirm changes appear.

No server restart is needed for template, fixture, or global CSS changes.

## 5. Handle Dynamic Content (Only If Needed)

Open Chrome DevTools → Network → Fetch/XHR.

If the page makes requests to Springshare PHP endpoints that fail locally:

1. Capture the successful production response.
2. Save the required content under `dev/fixtures/ajax/`.
3. Create or extend a page-specific module such as `dev/homepage.mjs`.
4. Add a mock route in `dev/server.mjs`.
5. Match the production response structure.

For JSON responses containing HTML, store the extracted `data.content` as clean HTML and let the mock module construct the JSON response.

Do not mock authentication or production services unless necessary for frontend testing.

If the page has no required dynamic AJAX content, skip this step.

## 6. Generate and Test Static Pages

Run:

```bash
npm run build:preview
npx serve dist
```

The build generates the new page automatically from the registered route.

Expected output:

```text
dist/
└── new-guide/
    └── index.html
```

Open the static preview URL displayed by `serve`, followed by `/new-guide/`.

Verify that styling, fonts, navigation, images, and content render correctly.

**Important:** GitHub Pages cannot execute Springshare PHP. Pages requiring dynamic AJAX data need static fixture files and a browser-side adapter, following the Homepage implementation.

## 7. Add Cypress Tests

Create:

```text
cypress/e2e/new-guide.cy.js
```

Example:

```javascript
describe('New LibGuides Page', () => {
  it('renders the guide', () => {
    cy.visit('/new-guide');

    cy.get('#s-lg-guide-name').should('be.visible');
    cy.get('#s-lg-guide-main').should('exist');
  });
});
```

Use existing Homepage and Communication Guide tests as examples.

Add a Chromatic visual snapshot using the project's existing Cypress/Chromatic integration and snapshot conventions.

Run:

```bash
npm test
```

Verify the tests pass using Chrome.

## 8. Verify CI and GitHub Pages

Before opening a pull request:

```bash
npm run build:preview
npm test
```

## Test Routes

The following pages are available for testing locally and through GitHub Pages.

| Page                | Local Development                                                   | GitHub Pages                                                                     |
| ------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Homepage            | [localhost:3000/](http://localhost:3000/)                           | [Homepage](https://uclalibrary.github.io/libguides-frontend/)                    |
| Communication Guide | [localhost:3000/communication](http://localhost:3000/communication) | [Communication](https://uclalibrary.github.io/libguides-frontend/communication/) |
| Subject Landing     | [localhost:3000/sb.php](http://localhost:3000/sb.php)               | [Subjects](https://uclalibrary.github.io/libguides-frontend/subjects/)           |
| Africa Subject Info | [localhost:3000/africa-guides](http://localhost:3000/africa-guides) | [Africa Guides](https://uclalibrary.github.io/libguides-frontend/africa-guides/) |

Push the feature branch and open a PR.

Verify that:

- Cypress tests pass in GitHub Actions.
- Chromatic captures the new page and allows review of visual changes.
- The static build includes the new page.
- The GitHub Pages preview displays the new page correctly when deployed.

### Testing the Static Preview Locally

Before deploying to GitHub Pages, test the generated static site locally.

1. Build the static preview:

   ```bash
   npm run build:preview
   ```

2. Serve the generated `dist/` directory:

   ```bash
   npx serve dist
   ```

3. Open the URL displayed in the terminal (usually `http://localhost:3000` or `http://localhost:3001`).

   Test the following routes:

   - `/` — Homepage
   - `/communication/` — Communication Guide
   - `/subjects/` — Subject Landing
   - `/africa-guides/` — Africa Subject Info

**Note:** The static preview uses generated HTML and JavaScript adapters instead of the local Node development server's AJAX mocks.

After changing templates, fixtures, or global CSS, run `npm run build:preview` again to regenerate the static files.

For PR-numbered deployments, the expected URL format is:

```text
https://uclalibrary.github.io/libguides-frontend/pr-<PR-number>/new-guide/
```

This URL requires the PR preview deployment workflow to be configured.

## Definition of Done

- [ ] Production HTML and required AJAX fixtures captured.
- [ ] Correct editable template identified and registered.
- [ ] Page renders locally.
- [ ] Global CSS and template changes appear on refresh.
- [ ] Required dynamic interactions work locally.
- [ ] Static preview renders without a Node.js backend.
- [ ] Cypress test added and passing.
- [ ] Chromatic snapshot reviewed.
- [ ] CI passes and deployed preview verified.
- [ ] No unintended production requests or sensitive fixture data.

**Note:** Local and CI previews reproduce selected frontend behavior using captured production data. They do not replace final manual validation in Springshare's Bootstrap 5 preview environment.
