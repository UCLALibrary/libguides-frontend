# UCLA Library LibGuides Frontend

This repository is the source of truth for UCLA Library's LibGuides frontend HTML templates, custom CSS, and related assets.

LibGuides is hosted by Springshare. This repository allows UCLA Library developers to maintain frontend customizations in GitHub, preview changes before applying them to production, and support the migration from Bootstrap 3 to Bootstrap 5.

## Project Goals

- Preserve UCLA Library's existing Bootstrap 3 templates and styles.
- Develop and test frontend changes without modifying production.
- Support the migration to Bootstrap 5.
- Maintain version-controlled UCLA-owned frontend code.
- Provide local and GitHub Pages previews for development and review.
- Support future externally hosted compiled Sass/CSS assets.

## Production and Previews

**Production:** https://guides.library.ucla.edu

The repository supports two preview environments:

| Environment       | Purpose                                                              |
| ----------------- | -------------------------------------------------------------------- |
| Local Development | Preview template and CSS changes using live Springshare content.     |
| GitHub Pages      | Review generated static previews of frontend changes through GitHub. |

GitHub Pages previews are generated from repository templates and build-time snapshots of Springshare content. They do not modify production.

### Reviewing Changes

Library staff and other reviewers can use the GitHub Pages preview associated with a pull request to review frontend changes without installing development tools.

Reviewers should compare the preview with production and provide feedback on layout, styling, content presentation, and navigation.

Some Springshare features may not be fully supported in static previews.

## Getting Started

### Requirements

- Node.js and npm
- Internet access to fetch Springshare content

### Install Dependencies

```bash
npm ci
```

### Start Local Development

```bash
npm run dev
```

Open http://localhost:3000.

The development server reads repository templates and CSS and fetches current content from Springshare.

Changes to local templates and CSS are reflected when the page is refreshed.

### Generate a Static Preview

```bash
npm run build:preview
```

Preview the generated site locally:

```bash
npx serve dist
```

The static build generates HTML pages and AJAX response snapshots for supported Springshare pages.

### Run Lint

```bash
npm run lint
```

For detailed setup and technical information, see [Developer Documentation](dev/README.md).

## Repository Structure

```text
libguides-frontend/
├── src/
│   └── html/             # Editable LibGuides HTML templates and global CSS
│       ├── home/
│       ├── guide/
│       ├── subject/
│       ├── profile/
│       └── global-custom-css.html
├── dev/                  # Local rendering and static preview tools
│   ├── server.mjs
│   ├── renderer.mjs
│   ├── springshare.mjs
│   ├── discover-routes.mjs
│   ├── build-preview.mjs
│   └── README.md
├── .github/workflows/     # CI and preview workflows
├── package.json
└── README.md
```

The repository's `src/html/global-custom-css.html` is the source of truth for editable global custom CSS.

## Development Workflow

1. Create a feature branch from `main`.
2. Make HTML or CSS changes in the repository.
3. Test changes using the local development server.
4. Generate and validate the static preview.
5. Open a pull request for review.
6. Review frontend changes through the GitHub Pages preview.
7. Validate Bootstrap 5 changes using Springshare's Bootstrap 5 Transition Tool when applicable.
8. Merge approved changes and coordinate production updates.

## Production Deployment

LibGuides frontend templates and Look & Feel settings are managed through Springshare's LibApps administration interface.

**Merging changes into GitHub does not automatically update the production LibGuides website.**

Approved frontend changes must be coordinated and applied through the appropriate Springshare administration workflow.

Any emergency changes made directly in LibApps should also be reflected in this repository to prevent configuration drift.

## Current Limitations

The preview environment is not a complete Springshare LibGuides instance.

- Some Springshare-specific functionality may not be available locally or in static previews.
- GitHub Pages previews use build-time content snapshots rather than live PHP endpoints.
- Certain nested Guide routes and special URL mappings may require additional support.
- Individual Profile Detail pages are not yet fully supported in static previews.
- Bootstrap 5 changes must still be validated in Springshare.

## Documentation

For local development, route discovery, template rendering, AJAX adapters, static builds, and troubleshooting, see:

**[Developer Documentation](dev/README.md)**
