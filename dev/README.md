# Local LibGuides Development

A local development environment for previewing UCLA LibGuides HTML template changes without modifying the production Springshare site.

## Getting Started

**Requirements:** Docker Desktop or Node.js 22+

### Using Docker

```bash
docker compose up --build
```

### Without Docker

```bash
npm ci
node dev/server.mjs
```

## Local Preview URLs

| Page                | URL                                 | Editable Template                                           |
| ------------------- | ----------------------------------- | ----------------------------------------------------------- |
| Homepage            | http://localhost:3000/              | `src/html/home/three-column-guide-index-side.html`          |
| Communication Guide | http://localhost:3000/communication | `src/html/guide/side-nav-layout/ucla-default-template.html` |

## How It Works

The local Node.js server (`dev/server.mjs`) uses Cheerio to extract representative content from captured Springshare HTML fixtures and populate placeholders in the editable LibApps templates.

- Templates are loaded from `src/html/`.
- Captured HTML fixtures are stored in `dev/fixtures/`.
- Templates are reloaded on each request.
- Save an HTML template and refresh the browser to see changes.
- No production LibApps configuration is modified.

## Limitations

- This is a local approximation of Springshare's rendering, not a complete LibGuides environment.
- Only supported template placeholders are populated.
- Dynamic Springshare functionality, including search, chat, and widgets, is not reproduced.
- Executable scripts are removed to avoid live tracking and API calls.
- External stylesheets, fonts, and images may require internet access.
- Bootstrap 5 compatibility must be verified in Springshare's Transition Tool.

## Development Workflow

1. Start the local server.
2. Edit the appropriate HTML template under `src/html/`.
3. Save and refresh the local preview.
4. Verify the change.
5. Test approved changes in Springshare's Bootstrap 5 Transition Tool before release.
