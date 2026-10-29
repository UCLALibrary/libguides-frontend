import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pages, renderTemplate } from './renderer.mjs';

const outputDir = resolve('dist');

for (const [route, page] of Object.entries(pages)) {
  const [template, fixture] = await Promise.all([
    readFile(resolve(page.template), 'utf8'),
    readFile(resolve(page.fixture), 'utf8'),
  ]);

  const html = renderTemplate(template, fixture, page.type);

  const relativePath = route === '/' ? 'index.html' : join(route.slice(1), 'index.html');

  const outputPath = join(outputDir, relativePath);

  await mkdir(resolve(outputPath, '..'), { recursive: true });
  await writeFile(outputPath, html, 'utf8');

  console.log(`Generated: ${outputPath}`);
}

console.log('Static preview build complete.');
