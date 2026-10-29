import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pages, renderTemplate } from './renderer.mjs';

const port = 3000;

createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  const page = pages[pathname];

  if (!page) {
    res.writeHead(404);
    return res.end('Page not found');
  }

  try {
    // Read files on every request so template changes appear on refresh.
    const [template, fixture] = await Promise.all([
      readFile(resolve(page.template), 'utf8'),
      readFile(resolve(page.fixture), 'utf8'),
    ]);

    const html = renderTemplate(template, fixture, page.type);

    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    });

    res.end(html);
  } catch (error) {
    console.error(error);
    res.writeHead(500);
    res.end('Local rendering failed. Check terminal.');
  }
}).listen(port, '0.0.0.0', () => {
  console.log(`Local preview: http://localhost:${port}`);
});
