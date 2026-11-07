# LibGuides Developer Guide

This document explains how to develop, build, and test UCLA Library LibGuides frontend templates. For the project overview and production deployment policy, see the [root README](../README.md).

## How previews work

The repository contains editable Springshare HTML templates and `src/html/global-custom-css.html`, the source of truth for UCLA's global custom styling.

- **Development server:** `dev/server.mjs` fetches current production HTML and AJAX responses through `dev/springshare.mjs`. `dev/renderer.mjs` uses Cheerio to insert content into repository templates. `dev/preview-links.mjs` rewrites supported links for localhost.
- **Static preview:** `dev/build-preview.mjs` discovers and validates public routes, renders static HTML into `dist/`, and captures supported AJAX responses as JSON. Browser-side adapters serve the captured data without PHP.
- **Production:** Springshare remains the live hosting and content-management system. Preview builds do not deploy template changes to production.

Static content is a **build-time snapshot**. The development server requests current production content on page loads; neither environment is a complete replacement for Springshare.

## Requirements and quick start

Use a supported Node.js version compatible with the repository's `package.json` and npm. Network access to `guides.library.ucla.edu` is required for live fetching and static builds.

```bash
npm ci
npm run lint
npm run dev
```

Open `http://localhost:3000/`. The server reads the HTML template and global CSS from the repository for each page request, so changes to those files appear after a refresh. Restart `npm run dev` when changing server-side JavaScript.

To generate and inspect static output:

```bash
npm run build:preview
npx serve dist -l 8080
```

Open `http://localhost:8080/`. Re-run `npm run build:preview` after changes; `dist/` is generated output, not the source of truth. Stop either server with Ctrl+C.

## Test URL matrix

This table is the **maintained checklist of representative URLs** for manual and automated testing. The local static URLs below assume the build uses `PREVIEW_BASE_PATH=/` and `npx serve dist -l 8080`. Production and GitHub Pages links are separate environments; a published GitHub Pages URL may represent the latest deployed build rather than your working branch.

| Page / test case             | Production                                                                                    | Local dev (live data)                                                              | Local static (`dist/`)                               | GitHub Pages (deployed static)                                           | What to verify                                                    |
| ---------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| Homepage                     | [Production](https://guides.library.ucla.edu/)                                                | [Local dev](http://localhost:3000/)                                                | [Local static](http://localhost:8080/)               | [Pages](https://uclalibrary.github.io/libguides-frontend/)               | All Guides, By Subject, By Librarian, counts, links               |
| Communication Guide          | [Production](https://guides.library.ucla.edu/communication)                                   | [Local dev](http://localhost:3000/communication)                                   | [Local static](http://localhost:8080/communication/) | [Pages](https://uclalibrary.github.io/libguides-frontend/communication/) | Guide navigation, content, page-specific CSS                      |
| Africa Guide                 | [Production](https://guides.library.ucla.edu/africa)                                          | [Local dev](http://localhost:3000/africa)                                          | [Local static](http://localhost:8080/africa/)        | [Pages](https://uclalibrary.github.io/libguides-frontend/africa/)        | Active tab, colored boxes, guide content                          |
| Subject Landing              | [Production](https://guides.library.ucla.edu/sb.php)                                          | [Local dev](http://localhost:3000/sb.php)                                          | [Local static](http://localhost:8080/subjects/)      | [Pages](https://uclalibrary.github.io/libguides-frontend/subjects/)      | Subject listing, links, search/sidebar                            |
| Africa Subject Info          | [Production](https://guides.library.ucla.edu/africa-guides)                                   | [Local dev](http://localhost:3000/africa-guides)                                   | [Local static](http://localhost:8080/africa-guides/) | [Pages](https://uclalibrary.github.io/libguides-frontend/africa-guides/) | Guides AJAX, Experts, sidebar                                     |
| Profile Landing              | [Production](https://guides.library.ucla.edu/prf.php)                                         | [Local dev](http://localhost:3000/prf.php)                                         | [Local static](http://localhost:8080/profiles/)      | [Pages](https://uclalibrary.github.io/libguides-frontend/profiles/)      | By Name, By Subject, profile cards, sidebar, AJAX                 |
| Individual Profile (example) | [Production](https://guides.library.ucla.edu/prf.php?id=61f2b01e-7cdb-11ed-9922-0ad758b798c3) | [Local dev](http://localhost:3000/prf.php?id=61f2b01e-7cdb-11ed-9922-0ad758b798c3) | **Not generated yet**                                | **Not generated yet**                                                    | Detail template and query-string handling; static support pending |

**Route rules:** Production and local development use `/sb.php` and `/prf.php`; GitHub Pages uses `/subjects/` and `/profiles/` because static hosting cannot execute PHP. Profile detail links with `?id=UUID` must remain on production until dedicated static detail pages exist. A working static landing page does not imply static detail-page support.

### Pull request previews

If the CI workflow publishes PR-numbered previews, use the deployed URL shown in that PR's workflow or deployment output. A possible path format is:

```text
https://uclalibrary.github.io/libguides-frontend/pr-<PR-number>/profiles/
```

**Confirm the actual URL in CI; do not assume that path is deployed.** PR previews must be built with the matching `PREVIEW_BASE_PATH` and checked for working links and JSON requests. If the site is hosted under a repository or PR prefix, serving `dist/` at the root locally is not a complete base-path test.

### Maintain this matrix

When adding or changing a supported page, update its production, local dev, local static, and GitHub Pages URLs here. Add a representative row for each new page _type_ or interaction; there is no need to list every discovered Guide route. Mark unsupported environments explicitly rather than inventing a link. Check both navigation and network requests in the deployed preview.

## Key development files

| File                                               | Responsibility                                                             |
| -------------------------------------------------- | -------------------------------------------------------------------------- |
| `dev/server.mjs`                                   | Local HTTP server, page routing, and live AJAX forwarding                  |
| `dev/renderer.mjs`                                 | Template selection, placeholders, and assembled HTML                       |
| `dev/springshare.mjs`                              | Production HTML/AJAX fetching, retries, and caching                        |
| `dev/discover-routes.mjs`                          | Discover, classify, and identify public Guide and Subject routes           |
| `dev/preview-links.mjs`                            | Rewrite supported URLs; preserve full-document DOCTYPE and fragment markup |
| `dev/build-preview.mjs`                            | Generate static pages, route mappings, and AJAX snapshots                  |
| `dev/static-homepage.js`                           | Homepage AJAX adapter for static hosting                                   |
| `dev/static-subject.js`                            | Subject Info AJAX adapter for static hosting                               |
| `dev/static-profile.js`                            | Profile Landing AJAX adapter for static hosting                            |
| `src/html/global-custom-css.html`                  | Editable UCLA global custom CSS and related markup                         |
| `src/html/home/`, `guide/`, `subject/`, `profile/` | Editable page-type templates                                               |

The old `dev/fixtures/` HTML snapshots and mock `dev/homepage.mjs` / `dev/subject.mjs` modules are no longer part of the normal preview flow. Do not reintroduce fixture-based instructions when documenting new pages.

## Working with templates and CSS

Edit a template under `src/html/` or `src/html/global-custom-css.html`, save, and refresh the local development page. The renderer uses repository global CSS in place of the matching production global blocks while preserving production page-specific styles and dependencies. Do not remove page-specific styles or introduce duplicate global styles when changing `buildPreviewHead()`.

Complete documents must retain `<!DOCTYPE html>` and render in standards mode (`document.compatMode === 'CSS1Compat'`). AJAX fragments must remain fragments. The preview link rewriter handles these differently to prevent the Quirks Mode layout regression previously seen on Profile Landing.

For a visual regression, compare the same page at the same viewport size in production and local development. Inspect DevTools Network for missing CSS, fonts, images, and JSON, and check browser Console errors before adding CSS overrides.

## Static AJAX behavior

| Page                            | Springshare endpoint                                                   | Static data / adapter                                                         |
| ------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Homepage                        | `/index_process.php`, actions `170`, `172`, `174`, `176`, `177`, `178` | `dist/ajax/<action>.json`; `static-homepage.js`                               |
| Subject Info                    | `/sb_process.php`, action `540`                                        | `dist/ajax/subject-<subjectId>.json`; `static-subject.js`                     |
| Profile Landing: listing        | `/prf_process.php`, action `530`                                       | `dist/ajax/profile-530-<subjectId>.json` (including `0`); `static-profile.js` |
| Profile Landing: subject Guides | `/prf_process.php`, action `531`                                       | `dist/ajax/profile-531-<subjectId>.json`; `static-profile.js`                 |

The build currently discovers Subject Info IDs and reads Profile Landing dropdown IDs for profile filters. Verify coverage when the production subject list changes. AJAX adapters must load before Springshare scripts initialize, and their JSON URLs must work under the configured preview base path.

## Adding a new page or route

1. Confirm the production URL, page type, and editable template. Reuse existing Guide, Subject, or Profile templates when appropriate.
2. Check whether `discover-routes.mjs` and `getPage()` already support the route. Add an explicit route or classification only when needed.
3. Test the local development URL with live Springshare content. Check placeholder mappings in `renderTemplate()` if content is missing.
4. If the page uses a new AJAX action, extend static response generation and the appropriate browser adapter; do not assume GitHub Pages can serve PHP.
5. Run lint and build, inspect `dist/`, and test the static URL. Add a representative entry to the test URL matrix above.
6. Add or update Cypress tests as appropriate, then verify CI and the deployed preview.

Some redirects, nested Guide routes, and special subject URL mappings need additional handling. A route discovered in production is not automatically proof that it is supported by the static build.

## Testing and CI

```bash
npm run lint
npm run build:preview
```

Use the test command configured in `package.json` for Cypress; verify the development server and expected base URL are available before running it. Review GitHub Actions results and deployed previews, not just a successful build log. For PRs, confirm that the preview is deployed even when an intermittent Cypress run fails; the workflow intentionally keeps preview deployment independent of Cypress success.

**Manual smoke test:** Check the URL matrix, navigation, tabs/filters, cards, image spacing, sidebars, profile subject switching, and `CSS1Compat`. In static mode, inspect Fetch/XHR to confirm that supported AJAX requests use generated JSON rather than live PHP. Check for unexpected production links, broken assets, or console errors.

## Known limitations

- Static GitHub Pages uses build-time content; changes in Springshare require a new build.
- Individual Profile Detail pages with `?id=UUID` are not yet generated in static mode.
- Some nested Guide paths, redirects, and special subject mappings are not fully supported.
- Springshare authentication, administration, and some third-party widgets are outside the scope of the preview.
- Live third-party resources can still be requested by the browser; the static preview is not necessarily fully offline.
- Bootstrap 5 migration work still requires validation in Springshare's Transition Tool.

Changes committed or merged to this repository do **not** automatically update the Springshare production templates. Coordinate approved production updates through LibApps and keep this repository synchronized with any direct production changes.
