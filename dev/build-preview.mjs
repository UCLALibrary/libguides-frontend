import { readFile, mkdir, writeFile, copyFile } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { pages, renderTemplate } from './renderer.mjs';
import { homepageFixtures, getHomepageResponse } from './homepage.mjs';

const outputDir = resolve('dist');

const globalHTML = await readFile(resolve('src/html/global-custom-css.html'), 'utf8');

// Explicitly registered pages are built for GitHub Pages.
// Dynamic subject URLs need their own fixture and route
// registration before they can be generated separately.
for (const [route, page] of Object.entries(pages)) {
  const [template, fixture] = await Promise.all([
    readFile(resolve(page.template), 'utf8'),
    readFile(resolve(page.fixture), 'utf8'),
  ]);

  let html = renderTemplate(template, fixture, page.type, globalHTML);

  // Homepage-only static AJAX adapter.
  if (page.type === 'home') {
    html = html.replace(
      /<head[^>]*>/i,
      (match) => `${match}\n<script src="./static-homepage.js"></script>`
    );
  }

  // GitHub Pages uses directory-based HTML routes.
  // The subject landing page is published at /subjects/
  // instead of /sb.php to avoid static .php MIME issues.
  const previewRoute = route === '/sb.php' ? '/subjects' : route;

  const relativePath =
    previewRoute === '/' ? 'index.html' : join(previewRoute.slice(1), 'index.html');

  const outputPath = join(outputDir, relativePath);

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, html, 'utf8');

  console.log(`Generated: ${outputPath}`);
}

// Generate Homepage AJAX responses for static previews.
const ajaxDir = join(outputDir, 'ajax');

await mkdir(ajaxDir, { recursive: true });

const actions = [...Object.keys(homepageFixtures), '176', '177', '178'];

for (const action of actions) {
  const response = await getHomepageResponse(action);

  await writeFile(join(ajaxDir, `${action}.json`), JSON.stringify(response), 'utf8');

  console.log(`Generated AJAX response: ${action}`);
}

// Copy the Homepage static AJAX adapter.
await copyFile(resolve('dev/static-homepage.js'), join(outputDir, 'static-homepage.js'));

console.log('Static preview build complete.');
