import { resolve, join } from 'node:path';
import { pages, renderTemplate } from './renderer.mjs';
import { homepageFixtures, getHomepageResponse } from './homepage.mjs';
import { readFile, mkdir, writeFile, copyFile } from 'node:fs/promises';

const outputDir = resolve('dist');
const globalHTML = await readFile(resolve('src/html/global-custom-css.html'), 'utf8');

// Generate static pages.
for (const [route, page] of Object.entries(pages)) {
  const [template, fixture] = await Promise.all([
    readFile(resolve(page.template), 'utf8'),
    readFile(resolve(page.fixture), 'utf8'),
  ]);

  let html = renderTemplate(template, fixture, page.type, globalHTML);

  if (page.type === 'home') {
    html = html.replace(
      /<head[^>]*>/i,
      (match) => `${match}\n<script src="./static-homepage.js"></script>`
    );
  }

  const relativePath = route === '/' ? 'index.html' : join(route.slice(1), 'index.html');

  const outputPath = join(outputDir, relativePath);

  await mkdir(resolve(outputPath, '..'), { recursive: true });
  await writeFile(outputPath, html, 'utf8');

  console.log(`Generated: ${outputPath}`);
}

// Generate Homepage AJAX responses once.
const ajaxDir = join(outputDir, 'ajax');
await mkdir(ajaxDir, { recursive: true });

for (const action of [...Object.keys(homepageFixtures), '176', '177', '178']) {
  const response = await getHomepageResponse(action);

  await writeFile(join(ajaxDir, `${action}.json`), JSON.stringify(response), 'utf8');
}

await copyFile(resolve('dev/static-homepage.js'), join(outputDir, 'static-homepage.js'));

console.log('Static preview build complete.');
