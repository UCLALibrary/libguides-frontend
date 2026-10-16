# UCLA Library LibGuides Frontend

Source of truth for UCLA Library's LibGuides frontend HTML templates, CSS, and related assets.

## Project Overview

This repository preserves the existing Bootstrap 3 frontend implementation and supports the migration to Bootstrap 5.

LibGuides is hosted by Springshare. Frontend templates and global settings are managed through the LibApps administration interface.

**Project goals:**

- Preserve existing Bootstrap 3 templates and styles.
- Develop and test HTML template changes locally.
- Migrate frontend customizations to Bootstrap 5.
- Maintain UCLA-owned frontend code in GitHub.
- Eventually build and host compiled Sass/CSS externally.
- Test changes using Springshare's Bootstrap 5 Transition Tool.

## Production

https://guides.library.ucla.edu

## Repository Structure

```text
libguides-frontend/
├── src/
│   ├── html/                  # Editable LibApps HTML templates
│   │   ├── home/
│   │   └── guide/
│   └── css/                   # UCLA custom CSS
│
├── dev/
│   ├── server.mjs             # Local Node.js template renderer
│   └── fixtures/              # Captured Springshare HTML
│       ├── homepage.html
│       └── communication.html
│
├── Dockerfile
├── compose.yaml
├── .dockerignore
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

## Local Development

The local development environment allows developers to edit HTML templates and preview changes without modifying production LibGuides.

### Requirements

- Docker Desktop

Alternatively, Node.js 22 can be used without Docker.

### Run with Docker

From the repository root:

```bash
docker compose up --build
```

Open the following URLs:

| Page                | Local URL                           |
| ------------------- | ----------------------------------- |
| Homepage            | http://localhost:3000/              |
| Communication Guide | http://localhost:3000/communication |

To stop the server:

```bash
docker compose down
```

### Run without Docker

Install dependencies:

```bash
npm ci
```

Start the local server:

```bash
node dev/server.mjs
```

### Editing Templates

The local renderer reads HTML templates directly from `src/html/`.

**Homepage:**

```text
src/html/home/three-column-guide-index-side.html
```

**Communication Guide (Side Navigation):**

```text
src/html/guide/side-nav-layout/ucla-default-template.html
```

To test a change:

1. Open the appropriate HTML template.
2. Make a change and save the file.
3. Refresh the corresponding localhost page.
4. Verify the change.

The server reads templates on each request, so rebuilding Docker is not required for normal HTML edits, provided the repository is bind-mounted in Docker Compose.

## How Local Rendering Works

Springshare assembles LibGuides pages using server-side templates and dynamically generated content.

Because that rendering engine is not available locally, this project uses a lightweight Node.js server and Cheerio to approximate the final page.

```text
Editable HTML template (src/html/)
                +
Captured HTML fixture (dev/fixtures/)
                |
                v
       dev/server.mjs
                |
                v
       Cheerio extracts content
                |
                v
    Springshare placeholders replaced
                |
                v
      localhost:3000
```

### `server.mjs`

The local Node.js server:

- Routes requests to the Homepage or Communication Guide.
- Reads the corresponding HTML template and fixture.
- Uses Cheerio to extract representative Springshare-generated content.
- Replaces supported template placeholders such as `{{title}}` and `{{public_header}}`.
- Returns the assembled HTML to the browser.
- Reads source files on every request so changes appear after refreshing.

### HTML Fixtures

The `dev/fixtures/` directory contains captured HTML from production LibGuides pages.

These files provide representative content for local rendering.

Fixtures should generally remain unchanged during template development. They are not the source of truth for UCLA's editable templates.

## Limitations

The local environment is **not a complete Springshare LibGuides instance**.

- Some Springshare placeholders may not yet be supported.
- Dynamic features such as guide search, analytics, chat, and widgets may not work locally.
- Captured content may become outdated.
- Local rendering may differ from Springshare's actual HTML output.
- Bootstrap 5 migration changes must still be tested in Springshare's Bootstrap 5 Transition Tool.

**Important:** Changes made locally do not affect production. However, changes to guide content in Springshare's Bootstrap 5 preview may affect production because content is shared.

## Deployment

LibGuides HTML templates and Look & Feel configuration cannot be deployed automatically through this repository.

Approved changes must be manually applied in Springshare's LibApps administration interface.

Future CSS development will use Sass, with compiled stylesheets hosted externally through an approved CDN-backed service such as Netlify or AWS.

## Development Workflow

1. Create a feature branch from `main`.
2. Make HTML or CSS changes locally.
3. Test using the local development environment.
4. Validate Bootstrap 5 changes in Springshare's Transition Tool.
5. Open a pull request for review.
6. Merge approved source changes.
7. Coordinate manual LibApps updates and production activation.

GitHub is the source of truth for UCLA-owned frontend code. Any emergency changes made directly in LibApps must be reflected back in this repository to avoid configuration drift.
