# LibGuides Developer Guide — Bootstrap 5 previews

This guide covers editing, rendering, building, testing, and troubleshooting UCLA Library LibGuides frontend templates. For production deployment policy and project background, see the [root README](../README.md).

> **Important:** A working local or static preview does **not** publish templates to Springshare. Production changes require the approved LibApps/Bootstrap 5 Transition Tool process.

## 1. Architecture: which environment is rendering what?

| Environment             | Source of page structure                                 | Source of content                 | AJAX                                      | Typical URL                                                |
| ----------------------- | -------------------------------------------------------- | --------------------------------- | ----------------------------------------- | ---------------------------------------------------------- |
| Springshare production  | Active Springshare templates                             | Live Springshare                  | Live Springshare                          | `https://guides.library.ucla.edu/`                         |
| Springshare BS5 preview | Templates enabled in Springshare's BS5 preview           | Live Springshare                  | BS5-compatible Springshare responses      | `https://guides.library.ucla.edu/?bs5=1` (where supported) |
| Local development       | Repository HTML templates rendered by `dev/renderer.mjs` | Fetched Springshare HTML          | Local proxy in `dev/server.mjs`           | `http://localhost:3000/`                                   |
| Local static            | Generated files under `dist/`                            | Build-time HTML and captured JSON | Captured JSON **or** live Netlify proxies | `http://localhost:8080/`                                   |
| CI / GitHub Pages       | Generated static files from the CI checkout              | Content fetched at build time     | Captured JSON **or** live Netlify proxies | See deployment URL in the PR                               |

The repository's `src/html/global-custom-css.html` is the editable source for UCLA global custom styling. The renderer preserves necessary Springshare framework and page-specific dependencies; Springshare's `lookfeel.css` can be referenced through `https://guides.library.ucla.edu/lookfeel.css`. Do not duplicate global CSS blocks or assume the same framework asset filename on every page.

**Bootstrap 5 is more than CSS.** Springshare can return different HTML fragments when its AJAX request includes `bs5=1` (or a page-specific BS5 flag). Preserve the BS5 request parameter where the page's scripts require it. Static Search forwards supported parameters to the Search proxy; the proxy must allow `bs5`.

## 2. Quick start

From the repository root:

```bash
npm ci
npm run lint
npm run dev
```

Open `http://localhost:3000/`. HTML templates and `global-custom-css.html` are read on page requests; refresh the page to see edits. Restart `npm run dev` after changing server-side `.mjs` files or adapters. Use a hard reload with DevTools **Disable cache** if browser assets remain stale.

### Build and serve static previews

```bash
SEARCH_PROXY_URL="https://libguides-proxy.netlify.app/api/libguides/search/proxy" \
DATABASE_PROXY_URL="https://libguides-proxy.netlify.app/api/libguides/az/databases/proxy" \
npm run build:preview

npx serve dist -l 8080
```

Open `http://localhost:8080/`. **Rebuild after every source/template/CSS change**: serving `dist/` does not rebuild it. Do not edit generated `dist/` files. The exact build implementation file should be verified against `package.json` (`npm pkg get scripts.build:preview`); older documentation has used both `build-preview.mjs` and `build-static.mjs`.

To test an unmerged Search proxy change, replace only `SEARCH_PROXY_URL` with the Netlify deploy-preview endpoint, rebuild, and confirm the injected URL in `dist/search/index.html`. The same principle applies to the database proxy.

## 3. Route matrix: local development, static and CI

Base URLs:

- **Production:** `https://guides.library.ucla.edu`
- **Dev:** `http://localhost:3000`
- **Static:** `http://localhost:8080` (build with `PREVIEW_BASE_PATH=/`)
- **GitHub Pages:** `https://uclalibrary.github.io/libguides-frontend` for the published site; PR preview paths may be `/libguides-frontend/pr-<PR-number>/`. **Use the actual URL printed by CI.**

The table lists established page-type routes and examples. Static routes must exist as `dist/<route>/index.html` before being treated as generated. Production and local development can use PHP endpoints; GitHub Pages cannot execute PHP.

| Page / route                       | Production path                                    | Local dev path                              | Local static path                                                  | GitHub Pages path (append to deployed base)   | Verify                                             |
| ---------------------------------- | -------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------- | -------------------------------------------------- |
| Homepage                           | `/`                                                | `/`                                         | `/`                                                                | `/`                                           | All Guides, By Subject, By Librarian, count, links |
| Communication Guide                | `/communication`                                   | `/communication/`                           | `/communication/`                                                  | `/communication/`                             | Navigation, content, page CSS                      |
| Africa Guide                       | `/africa`                                          | `/africa/`                                  | `/africa/`                                                         | `/africa/`                                    | Guide tabs and content; confirm generated output   |
| Subject Landing                    | `/sb.php`                                          | `/sb.php`                                   | `/subjects/`                                                       | `/subjects/`                                  | Subject cards, links, search/sidebar               |
| Africa Subject Info                | `/africa-guides`                                   | `/africa-guides/`                           | `/africa-guides/`                                                  | `/africa-guides/`                             | Subject AJAX, experts, sidebar                     |
| Profile Landing                    | `/prf.php`                                         | `/prf.php`                                  | `/profiles/`                                                       | `/profiles/`                                  | By Name, By Subject, profile cards                 |
| Profile Detail (example)           | `/prf.php?id=61f2b01e-7cdb-11ed-9922-0ad758b798c3` | Same PHP path and query                     | `/profiles/61f2b01e-7cdb-11ed-9922-0ad758b798c3/` **if generated** | Same `/profiles/<uuid>/` path **if deployed** | Image, details, breadcrumb back to landing         |
| Search                             | `/srch.php`                                        | `/srch.php`                                 | `/search/`                                                         | `/search/`                                    | Live proxy, results, filters, sorting              |
| A–Z Databases                      | `/az/databases`                                    | `/az/databases/`                            | `/az/databases/`                                                   | `/az/databases/`                              | Live proxy, search, alphabet, type/vendor filters  |
| Nested Guide                       | Varies, e.g. `/parent/child`                       | Same route **if resolved by `getPage()`**   | Same route **if generated**                                        | Same route **if deployed**                    | Correct routing, assets, relative links            |
| Other discovered Guides / Subjects | Varies                                             | Supported only if route resolver accepts it | Only when present in `dist/`                                       | Only when deployed                            | Navigation and correct content                     |

**The full route inventory is generated, not a fixed list.** The repo discovers some routes from Springshare, and the exact set can change. To list **all routes actually generated in the current static build**, run:

```bash
find dist -type f -name index.html | sort
```

To get URL paths for a root-hosted local static build:

```bash
find dist -type f -name index.html | sort | sed 's#^dist##; s#index.html$##'
```

To check one route, for example:

```bash
test -f dist/africa/index.html && echo 'generated' || echo 'not generated'
test -f dist/az/databases/index.html && echo 'generated' || echo 'not generated'
```

For **every** generated route, use the path from this inventory with `http://localhost:8080` and with the **actual deployed CI preview base URL**. This is more reliable than maintaining an invented or stale list of hundreds of dynamically discovered paths. If a nested route is absent, investigate `dev/discover-routes.mjs`, route classification, `getPage()`, and static output mapping. A rewritten link does not prove a target page was generated.

### Test a GitHub Pages PR prefix

The CI build must set `PREVIEW_BASE_PATH` to its deployment prefix, and links, JSON requests, and script paths must use that prefix. Testing `dist/` at `/` alone does not verify a `/libguides-frontend/pr-N/` deployment. Check a deployed PR page's Network tab for requests accidentally going to `/ajax/...` or `/static-*.js` at the wrong root.

## 4. Main files and responsibilities

| File                              | Responsibility                                                                                          |
| --------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `dev/server.mjs`                  | Local HTTP routing, HTML generation, live AJAX forwarding and A–Z adapter injection                     |
| `dev/renderer.mjs`                | `getPage()`, template selection, placeholder extraction, `renderTemplate()`, preview `<head>`           |
| `dev/springshare.mjs`             | Fetch production HTML and AJAX; retries and cache                                                       |
| `dev/discover-routes.mjs`         | Discover and classify Guide / Subject routes                                                            |
| `dev/preview-links.mjs`           | Rewrite supported links for dev/static; preserve query strings, anchors and document/fragment structure |
| `dev/local-databases.js`          | Route A–Z XHR/fetch through local server                                                                |
| `dev/static-homepage.js`          | Load captured Homepage JSON in static builds                                                            |
| `dev/static-subject.js`           | Load captured Subject Info JSON                                                                         |
| `dev/static-profile.js`           | Load captured Profile Landing JSON                                                                      |
| `dev/static-search.js`            | Route Search XHR through configured Netlify Search proxy                                                |
| `dev/static-databases.js`         | Route A–Z XHR/fetch through configured Netlify database proxy                                           |
| `src/html/global-custom-css.html` | Repository-managed UCLA custom styles                                                                   |
| `src/html/**`                     | Page-type templates (including A–Z, Search and Profile variants)                                        |
| `cypress/e2e/*.cy.js`             | Page behavior, Bootstrap assets, and visual snapshot calls                                              |

Check actual filenames in the current checkout before editing: files can move (for example, to a `legacy/` folder). **Do not point the renderer to a legacy Bootstrap 3 template merely to fix an ENOENT error.**

## 5. What changes when you edit a template or CSS?

1. **Template (`src/html/...`)**: The renderer must select that exact file for the route. The template's `{{placeholder}}` keys must match mappings in `dev/renderer.mjs`; Springshare does not automatically replace new repository placeholders.
2. **Global CSS (`src/html/global-custom-css.html`)**: The renderer must inject the repository block once, at the intended cascade position, while retaining page-specific dependencies. A successful CSS request does not guarantee the rule wins.
3. **Springshare Look & Feel**: A root-relative `/lookfeel.css` in fetched production HTML resolves to `localhost` in local dev unless rewritten. The preview can preserve the existing `<link>` and rewrite it to `https://guides.library.ucla.edu/lookfeel.css`. Do not inject it into pages that did not include it.
4. **BS5 AJAX**: A page can load BS5 CSS but still render BS3 HTML if an AJAX request has `bs5=0` or omits a required flag. Inspect the request **and response markup**.
5. **Static build**: The browser reads `dist/`, not `src/`; rebuild. Captured Homepage, Subject and Profile JSON is a build-time snapshot. Search and A–Z use live Netlify proxies and can change without rebuilding.
6. **CI**: GitHub Actions checks out a particular commit, on Linux, and runs Chrome headless. Local uncommitted files, stale branches, case-insensitive macOS paths, and browser differences can make local results differ.

## 6. Troubleshooting: change does not appear

Use this sequence **before adding CSS overrides or changing a working template**.

### A. Template changed, but local dev still shows old markup

1. Confirm you're editing the file selected by `getPage()` for the route; search `dev/renderer.mjs` for the route and template path.
2. Verify the file exists **at that exact path**: `ls -la src/html/...`.
3. Restart `npm run dev` if `.mjs` code changed; refresh or hard reload the page.
4. Inspect the response HTML (View Source) and Elements DOM. If `{{breadcrumbs_section}}` or other tokens appear literally, add/fix **renderer placeholder mappings**, not template markup. For A–Z, use the production BS5 DOM to identify section selectors, then choose `outer()` when the template lacks the wrapper and `inner()` when the template already supplies it.
5. If the production DOM lacks a placeholder's content, check the BS5 preview URL and whether the content is populated asynchronously; do not invent hardcoded content.

Useful browser check:

```js
console.log({
  unresolved: document.body.innerText.match(/\{\{[^{}]+\}\}/g),
  title: document.querySelector('#s-lib-public-header-title')?.textContent.trim(),
  main: !!document.querySelector('#s-lib-public-main, #s-lg-guide-main'),
  standardsMode: document.compatMode,
});
```

### B. CSS or fonts changed, but appearance is unchanged

1. DevTools **Network → CSS/Font**: confirm requested URL, HTTP status, and response content. An HTML 404 fallback is not a stylesheet.
2. Verify `lookfeel.css` points to Springshare when required, and compare its position against the custom CSS block.
3. DevTools **Elements → Computed**: expand the differing property to see the winning selector, specificity, `!important`, and source stylesheet.
4. Compare production BS5 and local at the **same viewport**, page state and filter. Check font-family spelling and whether the requested font weight actually loaded (`document.fonts`).
5. Inspect duplicate `<style>`/`<link>` elements and the renderer's `buildPreviewHead()`. Do not add a second global CSS block to force precedence.

```js
console.table(
  [...document.querySelectorAll('link[rel="stylesheet"]')].map((el) => ({
    href: el.href,
    sheetPresent: !!el.sheet,
  }))
);
console.log(
  [...document.fonts].map((f) => ({ family: f.family, weight: f.weight, status: f.status }))
);
```

A font with `status: unloaded` may simply not be used on the current page. Use Network/Computed to establish whether it is actually required and failing.

### C. Bootstrap 5 content or subject counts are wrong

Check the page flags **where exposed**:

```js
console.log({
  is_bootstrap5: window.is_bootstrap5,
  is_bootstrap5_preview: window.is_bootstrap5_preview,
  homepage: window.springSpace?.homepage,
});
```

Flags can be absent on some page types. Inspect **Network → Fetch/XHR** and confirm the relevant `/index_process.php` request is forwarded with `bs5=1` and returns BS5 markup (`accordion-item`, `data-bs-toggle`, etc.), rather than BS3 markup (`panel-default`, `data-toggle`). The Homepage `guide_list_controls` may be empty in the fetched initial HTML because Springshare fills it dynamically; do not hardcode a `Showing 35 Subjects` heading into the template. Validate the rendered count after the AJAX response.

### D. Static preview shows an older template or broken AJAX

1. Re-run the build with the correct proxy variables and confirm it finishes successfully.
2. Verify the expected page file exists in `dist/` and inspect the **generated** HTML, not the source template.
3. Restart `npx serve dist -l 8080` if needed and hard reload.
4. For Homepage/Subject/Profile, check that the expected `dist/ajax/*.json` exists and the browser requests it from the correct base path.
5. For Search/A–Z, inspect the injected `data-search-proxy-url` or `data-database-proxy-url` and the browser's failed request **Response**. Never leave `https://your-proxy` in the build.

```bash
grep -n 'data-search-proxy-url' dist/search/index.html
grep -n 'data-database-proxy-url' dist/az/databases/index.html
find dist/ajax -type f | sort | head -30
```

If a Netlify proxy returns **400**, inspect its JSON error (for example, `Unsupported parameter: bs5`) and update the proxy's allowlist only for confirmed Springshare parameters. If it returns **403/CORS**, check the allowed origin; if **404**, check function routes/deployment; if **502**, inspect upstream fetch/timeout. Keep Search `bs5=1` where Springshare's BS5 Search script requests it.

### E. Cypress passes locally but fails in GitHub Actions

Run Chrome locally to match CI rather than Cypress's default Electron:

```bash
npm run dev
# in a second terminal
npx cypress run --browser chrome
# or target the affected specs
npx cypress run --browser chrome --spec "cypress/e2e/bootstrap5.cy.js,cypress/e2e/profile-info.cy.js,cypress/e2e/profile-landing.cy.js"
```

**First inspect the server error**, not just the Cypress assertion. A `cy.visit('/prf.php')` HTTP 502 can come from an `ENOENT` template path, which then cascades into failed Profile Landing and breadcrumb tests. Do not mask it with `failOnStatusCode: false`.

Confirm that the commit tested by CI contains the exact file and renderer reference:

```bash
git status -sb
git rev-parse HEAD
git fetch origin
git branch -vv
git ls-tree -r --name-only HEAD | grep 'profile-landing-template'
git ls-tree -r --name-only origin/BRANCH_NAME | grep 'profile-landing-template'
find src/html/profile -type f | sort
```

A real CI incident involved the Profile Landing template moving to `src/html/profile/landing-page/legacy/` on the remote branch while the renderer still referenced the previous location. **Update the renderer to the current BS5 template**, not the legacy BS3 file; check which commit the workflow checked out. GitHub Actions Linux paths are case-sensitive.

**Do not assume every page uses the same BS5 filename.** A–Z Databases was observed loading `lg-public-bs5.min.css`, while other page types used `lg-public-bs535.min.css`. Parameterize the Cypress asset test per page, or assert the actual page-specific asset. A DOM `<link>` assertion verifies inclusion, not successful download; use Network or an explicit request when that distinction matters. Check JavaScript filenames separately instead of guessing they match CSS filenames.

The PR preview should remain deployed even when Cypress fails intermittently; the team's workflow intentionally deploys the preview before Cypress so failures do not block preview availability. Review both the Cypress log and the deployed page.

### F. Skip link or footer is missing

Inspect whether the repository template contains `{{skip_link}}` / `{{public_footer}}` / `{{system_footer}}` and whether the renderer supplies them for that page type. Some page types use an explicit `#s-lib-footer-public` instead of a separate system footer; **do not add duplicate footers**. Verify the skip-link target exists and is focusable, and test it with the keyboard:

```js
console.log({
  skipLink: document.querySelector('#s-lg-public-skiplink')?.outerHTML,
  main: !!document.querySelector('#s-lib-public-main, #s-lg-guide-main'),
  footerCount: document.querySelectorAll('#s-lib-footer-public').length,
});
```

## 7. Static AJAX and proxy reference

| Page            | Springshare endpoint / actions                                        | Static behavior                                                         |
| --------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Homepage        | `/index_process.php` actions `170`, `172`, `174`, `176`, `177`, `178` | Captured `dist/ajax/<action>.json`, `static-homepage.js`; BS5 responses |
| Subject Info    | `/sb_process.php` action `540`                                        | Captured subject-specific JSON, `static-subject.js`                     |
| Profile Landing | `/prf_process.php` actions `530`, `531`                               | Captured `profile-<action>-<subjectId>.json`, `static-profile.js`       |
| Search          | `/srch_process_cs.php` (supported actions depend on proxy allowlist)  | Live Netlify Search proxy, `static-search.js`; forwards `bs5=1`         |
| A–Z Databases   | `/process/az/render-list`                                             | Live Netlify database proxy, `static-databases.js`                      |

Static Homepage, Subject and Profile content is captured at build time; Search and A–Z results require a reachable proxy at runtime. Verify all adapter scripts run before Springshare initiates their AJAX calls. A static HTML build is not a fully offline mirror.

## 8. Testing checklist and release workflow

Before opening or merging a PR:

1. `npm run lint`; run the repository's other configured checks.
2. Run local dev; compare each supported page with Springshare's **BS5 preview**, not the active BS3 production page.
3. Verify templates contain no unresolved `{{...}}`, pages use standards mode, and CSS/fonts load without duplication.
4. Run Cypress in Chrome; test page interactions as well as page-specific BS5 assets. Preserve intentional Chromatic snapshot opt-in behavior.
5. Rebuild `dist/` with actual Search and A–Z proxy URLs; serve on port 8080 and exercise all generated routes.
6. Inspect static Homepage tabs, Subject and Profile AJAX, Search query/filter/sort, A–Z search/type/alphabet, internal links, and nested routes.
7. Verify skip links, footer variants, responsive layout, images, fonts and accessibility-relevant focus behavior.
8. Confirm GitHub Actions checks out the intended commit, publishes the PR preview, and uses the correct `PREVIEW_BASE_PATH` and proxy URLs. Check the deployed site, not only the build log.
9. Coordinate Springshare Transition Tool validation and approved production template activation separately. Merging frontend code does not deploy to LibApps.

## 9. Scope and known limitations

- Static HTML and captured JSON reflect a particular build; Springshare content changes require a rebuild to update them.
- Search and A–Z require live Netlify proxies, which may be independently deployed or temporarily tested via Netlify deploy previews.
- A Profile Detail, nested Guide, or other discovered route is supported in static mode **only when its output file exists** and links resolve correctly. Do not label entire route categories unsupported or supported without checking the build.
- Springshare authentication/admin functions and some third-party widgets are not fully represented in previews.
- External stylesheets, fonts, scripts, and proxy endpoints make the preview dependent on network access.
- BS5 migration must still be validated and activated through Springshare's administrative workflow; changes in this repository do not automatically update production.

## 10. When adding a new template, page type, or route

Confirm the production BS5 page structure; add or select the correct repository template; map its placeholders in `dev/renderer.mjs`; ensure `getPage()` and route discovery resolve it; handle any AJAX endpoint in local and static modes; verify link rewriting and base paths; generate static output; add representative Cypress coverage; and update this guide's route matrix. Prefer extracting Springshare markup over introducing hardcoded markup into templates to compensate for missing data.
